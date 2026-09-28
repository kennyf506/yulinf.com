/* ============================================================
   產生全站 HTML、sitemap 與 _headers
   ------------------------------------------------------------
      node scripts/build.mjs      （或 npm run build）

   輸入：src/pages/（首頁、履歷）、content/now/*.md（近況）
   輸出：public/ 底下的 HTML、sitemap.xml、_headers，
         全部 git ignore，不要手改，改原稿再重跑。

   近況原稿格式見 content/now/README.md。
   ============================================================ */
import { readdir, readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { existsSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import matter from 'gray-matter';
import { marked } from 'marked';
import { SITE, ROOT, THEME_BOOT_HASH, localePath } from './layout.mjs';
import { renderNow, renderArchiveEntry, renderArchiveIndex } from './now-template.mjs';
import { renderHome, renderCv, render404 } from './pages.mjs';

const CONTENT = path.join(ROOT, 'content/now');
const PUBLIC = path.join(ROOT, 'public');
const LANGS = ['zh', 'en'];

/* --- 日期格式 --- */
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June',
                   'July', 'August', 'September', 'October', 'November', 'December'];
function fmtZh(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return `${y} 年 ${m} 月 ${d} 日`;
}
function fmtEn(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS_EN[m - 1]} ${y}`;
}
/* Q2 → 4–6 月 / Apr–Jun */
function quarterMonths(quarter) {
  const first = (Number(quarter.slice(-1)) - 1) * 3;
  return {
    zh: `${first + 1}–${first + 3} 月`,
    en: `${MONTHS_EN[first].slice(0, 3)}–${MONTHS_EN[first + 2].slice(0, 3)}`,
  };
}

/* --- 把 Markdown 正文切成 ## zh / ## en 兩份，各自再切 ### 段落 --- */
function splitSections(body) {
  const langs = { zh: [], en: [] };
  let lang = null;
  let section = null;
  const flush = () => {
    if (lang && section) {
      const md = section.lines.join('\n').trim();
      let html = marked.parse(md).trim();
      /* 佔位段落套上比較淡的樣式，填完內容自動變回正常 */
      html = html.replace(/^<p>(（待補）|\(To be written\))/i, '<p class="todo">$1');
      langs[lang].push({ title: section.title, html: html.split('\n').map(l => '      ' + l).join('\n') });
    }
    section = null;
  };

  for (const line of body.split('\n')) {
    const h2 = /^##\s+(\S+)\s*$/.exec(line);
    if (h2 && (h2[1] === 'zh' || h2[1] === 'en')) { flush(); lang = h2[1]; continue; }
    const h3 = /^###\s+(.+?)\s*$/.exec(line);
    if (h3) { flush(); section = { title: h3[1], lines: [] }; continue; }
    if (section) section.lines.push(line);
  }
  flush();
  return langs;
}

/* 取第一段純文字當歷史索引的摘要 */
function excerpt(sections, limit) {
  const first = sections[0];
  if (!first) return '';
  const text = first.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return text.length > limit ? text.slice(0, limit).trimEnd() + '…' : text;
}

async function loadEntries() {
  if (!existsSync(CONTENT)) throw new Error(`找不到 ${CONTENT}`);
  /* 只認 2026-Q4.md 這種檔名，README.md 之類的說明檔會被忽略 */
  const files = (await readdir(CONTENT)).filter(f => /^\d{4}-Q[1-4]\.md$/.test(f));
  if (!files.length) throw new Error(`${CONTENT} 裡沒有任何 YYYY-Qn.md 原稿`);

  const entries = [];
  for (const file of files) {
    const raw = await readFile(path.join(CONTENT, file), 'utf8');
    const { data, content } = matter(raw);
    const quarter = String(data.quarter || path.basename(file, '.md'));
    /* YAML 會把沒加引號的 2026-09-24 直接解析成 Date，統一轉回 ISO 字串 */
    const date = data.date instanceof Date
      ? data.date.toISOString().slice(0, 10)
      : String(data.date ?? '');

    if (!/^\d{4}-Q[1-4]$/.test(quarter)) {
      throw new Error(`${file}：quarter 必須是 2026-Q4 這種格式，讀到「${quarter}」`);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new Error(`${file}：date 必須是 YYYY-MM-DD，讀到「${data.date}」`);
    }

    const sections = splitSections(content);
    for (const lang of LANGS) {
      if (!sections[lang].length) {
        throw new Error(`${file}：找不到「## ${lang}」底下的任何「### 段落標題」`);
      }
    }

    const months = quarterMonths(quarter);
    entries.push({
      quarter,
      slug: quarter.toLowerCase(),               // 2026-q4
      label: quarter.replace('-', ' '),          // 2026 Q4
      monthsZh: months.zh,                       // 10–12 月
      monthsEn: months.en,                       // Oct–Dec
      date,
      dateZh: fmtZh(date),
      dateEn: fmtEn(date),
      place_zh: data.place_zh || '臺北',
      place_en: data.place_en || 'Taipei',
      sections,
      excerptZh: excerpt(sections.zh, 90),
      excerptEn: excerpt(sections.en, 150),
    });
  }

  entries.sort((a, b) => b.quarter.localeCompare(a.quarter));   // 最新在前
  return entries;
}

/* 手寫頁面的 lastmod 取原稿最後一次 commit 的日期，不是建置當天。
   建置環境沒有 git 紀錄時就不寫 lastmod；淺層 clone 則會拿到
   最新一個 commit 的日期，略晚於實際，但不會錯得離譜。 */
function gitDate(...files) {
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%cs', '--', ...files],
      { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(out) ? out : null;
  } catch {
    return null;
  }
}

function sitemap(entries) {
  const pages = [
    { path: '/', lastmod: gitDate('src/pages/home.zh.html', 'src/pages/home.en.html'), changefreq: 'monthly', priority: '1.0' },
    { path: '/cv', lastmod: gitDate('src/pages/cv.zh.html', 'src/pages/cv.en.html'), changefreq: 'monthly', priority: '0.9' },
    { path: '/now', lastmod: entries[0].date, changefreq: 'monthly', priority: '0.8' },
    { path: '/now/archive', lastmod: entries[0].date, changefreq: 'monthly', priority: '0.5' },
    ...entries.map(e => ({ path: `/now/${e.slug}`, lastmod: e.date, changefreq: 'yearly', priority: '0.4' })),
  ];
  /* 每個網址都列出兩種語言版本，讓搜尋引擎把它們認成同一頁的翻譯 */
  const urls = pages.flatMap(p => LANGS.map(lang => `  <url>
    <loc>${SITE}${localePath(lang, p.path)}</loc>${p.lastmod ? `
    <lastmod>${p.lastmod}</lastmod>` : ''}
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
    <xhtml:link rel="alternate" hreflang="zh-Hant" href="${SITE}${localePath('zh', p.path)}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${SITE}${localePath('en', p.path)}"/>
  </url>`));
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>
`;
}

/* --- Cloudflare 的 _headers：安全標頭與快取 --- */
function headers() {
  const csp = [
    "default-src 'self'",
    `script-src 'self' '${THEME_BOOT_HASH}'`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src https://fonts.gstatic.com",
    "img-src 'self' data:",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    'upgrade-insecure-requests',
  ].join('; ');

  /* 根目錄的圖片很少換，快取一週；CSS/JS 的網址帶內容雜湊，可以快取一年 */
  const images = readdirSync(PUBLIC).filter(f => /\.(jpe?g|png|webp|svg|avif)$/i.test(f)).sort();

  return `# 由 scripts/build.mjs 產生，不要手改
/*
  Strict-Transport-Security: max-age=31536000
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-Frame-Options: DENY
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()
  Content-Security-Policy: ${csp}

/assets/*
  Cache-Control: public, max-age=31536000, immutable

${images.map(f => `/${f}\n  Cache-Control: public, max-age=604800`).join('\n\n')}
`;
}

async function write(rel, content) {
  const file = path.join(PUBLIC, rel);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, content, 'utf8');
  console.log('  ✓ ' + rel);
}

async function main() {
  const entries = await loadEntries();
  console.log(`讀到 ${entries.length} 季近況原稿，最新：${entries[0].label}`);

  /* 整個重建，季度檔改名或刪除時不會留下孤兒頁 */
  await rm(path.join(PUBLIC, 'now'), { recursive: true, force: true });
  await rm(path.join(PUBLIC, 'en'), { recursive: true, force: true });

  for (const lang of LANGS) {
    const dir = lang === 'zh' ? '' : 'en/';
    await write(`${dir}index.html`, renderHome(lang));
    await write(`${dir}cv/index.html`, renderCv(lang));
    await write(`${dir}now/index.html`, renderNow(entries[0], lang));
    for (const [i, e] of entries.entries()) {
      await write(`${dir}now/${e.slug}/index.html`, renderArchiveEntry(e, lang, { isLatest: i === 0 }));
    }
    await write(`${dir}now/archive/index.html`, renderArchiveIndex(entries, lang));
  }
  await write('404.html', render404());
  await write('sitemap.xml', sitemap(entries));
  await write('_headers', headers());
}

main().catch(err => {
  console.error('\n建置失敗：' + err.message + '\n');
  process.exit(1);
});
