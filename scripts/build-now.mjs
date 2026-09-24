/* ============================================================
   從 content/now/*.md 產生 /now、各季存檔、歷史索引與 sitemap
   ------------------------------------------------------------
      node scripts/build-now.mjs      （或 npm run build）

   原稿格式見 content/now/README.md。
   public/now/ 底下的檔案全部由這支程式寫出，不要手改。
   ============================================================ */
import { readdir, readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import { marked } from 'marked';
import { renderNow, renderArchiveEntry, renderArchiveIndex, SITE } from './now-template.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = path.join(ROOT, 'content/now');
const OUT = path.join(ROOT, 'public/now');

/* 靜態頁面（手寫、不由本程式產生），列在 sitemap 裡 */
const STATIC_PAGES = [
  { loc: `${SITE}/`, changefreq: 'monthly', priority: '1.0' },
  { loc: `${SITE}/cv`, changefreq: 'monthly', priority: '0.9' },
];

/* --- 日期格式 --- */
function fmtZh(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return `${y} 年 ${m} 月 ${d} 日`;
}
function fmtEn(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'];
  return `${d} ${months[m - 1]} ${y}`;
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
      langs[lang].push({ title: section.title, html: html.split('\n').map(l => '        ' + l).join('\n') });
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
    for (const lang of ['zh', 'en']) {
      if (!sections[lang].length) {
        throw new Error(`${file}：找不到「## ${lang}」底下的任何「### 段落標題」`);
      }
    }

    entries.push({
      quarter,
      slug: quarter.toLowerCase(),               // 2026-q4
      label: quarter.replace('-', ' '),          // 2026 Q4
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

function sitemap(entries) {
  const today = new Date().toISOString().slice(0, 10);
  const urls = [
    ...STATIC_PAGES.map(p => ({ ...p, lastmod: today })),
    { loc: `${SITE}/now`, lastmod: entries[0].date, changefreq: 'monthly', priority: '0.8' },
    { loc: `${SITE}/now/archive`, lastmod: entries[0].date, changefreq: 'monthly', priority: '0.5' },
    ...entries.map(e => ({
      loc: `${SITE}/now/${e.slug}`, lastmod: e.date, changefreq: 'yearly', priority: '0.4',
    })),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;
}

async function write(rel, html) {
  const file = path.join(OUT, rel);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, html, 'utf8');
  console.log('  ✓ /now' + (rel === 'index.html' ? '' : '/' + path.dirname(rel)));
}

async function main() {
  const entries = await loadEntries();
  console.log(`讀到 ${entries.length} 季原稿，最新：${entries[0].label}`);

  /* 整個重建，季度檔改名或刪除時不會留下孤兒頁 */
  await rm(OUT, { recursive: true, force: true });

  await write('index.html', renderNow(entries[0]));
  for (const [i, e] of entries.entries()) {
    await write(`${e.slug}/index.html`, renderArchiveEntry(e, { isLatest: i === 0 }));
  }
  await write('archive/index.html', renderArchiveIndex(entries));

  await writeFile(path.join(ROOT, 'public/sitemap.xml'), sitemap(entries), 'utf8');
  console.log('  ✓ sitemap.xml');
}

main().catch(err => {
  console.error('\n建置失敗：' + err.message + '\n');
  process.exit(1);
});
