/* ============================================================
   /now 頁面的 HTML 樣板
   ------------------------------------------------------------
   三種頁面，中英文各一份（英文網址前面多一段 /en）：
     renderNow()          最新一季，網址 /now
     renderArchiveEntry() 單季存檔，網址 /now/2026-q3
     renderArchiveIndex() 歷史索引，網址 /now/archive
   <head> 與導覽列來自 layout.mjs，內容由 build.mjs 從
   content/now/*.md 讀進來。
   ============================================================ */
import { page, localePath, SITE } from './layout.mjs';

/* --- 近況頁專屬版面。外觀沿用改版前的窄欄設計，其餘 token
       與元件都來自 /assets/site.css --- */
const PAGE_STYLE = `
.page {
  max-width: 640px;
  margin: 0 auto;
  padding-block: clamp(28px, 7vw, 72px);
  padding-inline: 22px;
}
body { line-height: 1.85; }

h1 {
  font-size: clamp(2rem, 6vw, 2.9rem);
  margin: 0 0 .1em;
}
h1 .latin {
  display: block;
  font-family: var(--font);
  font-size: .3em;
  font-weight: 500;
  letter-spacing: .18em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-top: .9em;
}
.lede { color: var(--text-muted); margin: 1.6em 0 0; font-size: 1.02em; }

/* 徽章列：左邊是更新日期，右邊是版本與歷史入口 */
.meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px 16px;
  flex-wrap: wrap;
  margin-top: 1.9em;
}
.updated {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 999px;
  background: var(--mark);
  color: var(--text-muted);
  font-size: .82em;
  font-variant-numeric: tabular-nums;
}
.version {
  font-size: .82em;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}
.version a { white-space: nowrap; }

/* 存檔頁頂端的提示條 */
.notice {
  margin-bottom: clamp(26px, 6vw, 40px);
  padding: 12px 16px;
  border: 1px solid var(--border);
  border-left: 3px solid var(--accent);
  border-radius: var(--radius);
  background: var(--surface);
  color: var(--text-muted);
  font-size: .88em;
  line-height: 1.7;
}
.notice a { white-space: nowrap; }

section {
  margin-top: clamp(38px, 8vw, 58px);
  padding-top: clamp(30px, 6vw, 44px);
  border-top: 1px solid var(--rule);
}
section h2 {
  font-size: 1.02rem;
  font-weight: 620;
  letter-spacing: .02em;
  margin: 0 0 .9em;
}
section p { margin: 0 0 1.1em; }
section p:last-child { margin-bottom: 0; }
section ul, section ol { margin: 0 0 1.1em; padding-left: 1.25em; }
section li { margin-bottom: .5em; }
section li:last-child { margin-bottom: 0; }

/* 尚未填寫的佔位內容：原稿裡以（待補） / (To be written) 開頭的段落 */
.todo {
  color: var(--text-muted);
  border-left: 2px solid var(--border);
  padding-left: 1em;
  font-size: .95em;
}

/* 歷史索引 */
.archive-list { list-style: none; margin: 0; padding: 0; }
.archive-list li {
  padding: clamp(16px, 3vw, 22px) 0;
  border-bottom: 1px solid var(--rule);
}
.archive-list li:last-child { border-bottom: 0; }
.archive-list .q {
  font-family: var(--font-display);
  font-size: 1.12rem;
  font-weight: 700;
  color: var(--heading);
  text-decoration: none;
}
.archive-list .q:hover { color: var(--accent); }
.archive-list .when {
  margin-left: .7em;
  font-size: .8em;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.archive-list .excerpt {
  margin: .4em 0 0;
  font-size: .92em;
  color: var(--text-muted);
  line-height: 1.7;
}
.archive-list .badge {
  display: inline-block;
  margin-left: .6em;
  padding: 1px 9px;
  border-radius: 999px;
  background: var(--mark);
  color: var(--accent);
  font-size: .68rem;
  font-weight: 600;
  letter-spacing: .04em;
  vertical-align: 2px;
}

a { text-decoration: none; }
a:hover { text-decoration: underline; }
`;

function footer(lang) {
  const year = '<span class="year">2026</span>';
  const archive = localePath(lang, '/now/archive');
  const home = localePath(lang, '/');
  return lang === 'en'
    ? `    <footer class="site-footer">
      <p>The <a href="https://nownownow.com/about" target="_blank" rel="noopener">/now page</a>
         is an idea from Derek Sivers. You can also browse
         <a href="https://nownownow.com/TW" target="_blank" rel="noopener">other /now pages from Taiwan</a>.</p>
      <p>&copy; ${year} YuLin Fang · <a href="${archive}">Past updates</a> · <a href="${home}">Home</a></p>
    </footer>`
    : `    <footer class="site-footer">
      <p><a href="https://nownownow.com/about" target="_blank" rel="noopener">/now 頁面</a>
         是 Derek Sivers 想出來的，也可以去看看
         <a href="https://nownownow.com/TW" target="_blank" rel="noopener">臺灣其他人的 /now 頁</a>。</p>
      <p>&copy; ${year} YuLin Fang ・ <a href="${archive}">歷史近況</a> ・ <a href="${home}">回首頁</a></p>
    </footer>`;
}

/* 「2026 Q2・4–6 月」：季度寫出涵蓋的月份，跟更新日期擺在一起才不會誤會 */
function quarterLabel(entry, lang) {
  return lang === 'zh'
    ? `${entry.label}・${entry.monthsZh}`
    : `${entry.label} · ${entry.monthsEn}`;
}

/* --- 一季內容，單一語言 --- */
function quarterBody(entry, lang, { isLatest }) {
  const zh = lang === 'zh';
  const place = zh ? entry.place_zh : entry.place_en;
  const archive = localePath(lang, '/now/archive');
  const version = zh
    ? `${quarterLabel(entry, lang)}${isLatest ? '（最新）' : ''} ・ <a href="${archive}">歷史版本 →</a>`
    : `${quarterLabel(entry, lang)}${isLatest ? ' (latest)' : ''} · <a href="${archive}">Past updates →</a>`;

  const notice = isLatest ? '' : zh
    ? `    <div class="notice">
      這是 <strong>${quarterLabel(entry, lang)}</strong> 的近況，寫於 ${entry.dateZh}。
      <a href="${localePath(lang, '/now')}">看最新近況 →</a>
    </div>

`
    : `    <div class="notice">
      This is the <strong>${quarterLabel(entry, lang)}</strong> update, written on ${entry.dateEn}.
      <a href="${localePath(lang, '/now')}">See what I'm doing now →</a>
    </div>

`;

  return notice + `    <header>
      <h1 class="display">${zh ? '近況<span class="latin">Now</span>' : 'Now<span class="latin" lang="zh-Hant">近況</span>'}</h1>
      <p class="lede">${zh
        ? '這頁寫我最近在忙什麼。如果我們剛好碰到面，大概就會聊到這些。'
        : "What I've been up to lately. If we ran into each other, this is probably what we'd end up talking about."}</p>
      <div class="meta">
        <p class="updated">${zh ? '最後更新：' : 'Last updated: '}<time datetime="${entry.date}">${zh ? entry.dateZh : entry.dateEn}</time>${zh ? '・' : ' · '}${place}</p>
        <p class="version">${version}</p>
      </div>
    </header>

${entry.sections[lang].map(s => `    <section>
      <h2>${s.title}</h2>
${s.html}
    </section>`).join('\n\n')}

${footer(lang)}`;
}

function quarterJsonld(entry, lang, { canonical }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${canonical}#webpage`,
    url: canonical,
    name: lang === 'zh'
      ? `近況 Now｜${entry.label}｜方譽霖 YuLin Fang`
      : `Now | ${entry.label} | YuLin Fang`,
    inLanguage: lang === 'zh' ? 'zh-Hant' : 'en',
    description: lang === 'zh'
      ? `方譽霖 ${entry.label} 的近況。`
      : `What YuLin Fang was up to in ${entry.label}.`,
    datePublished: entry.date,
    dateModified: entry.date,
    isPartOf: { '@type': 'WebSite', url: `${SITE}/`, name: '方譽霖 YuLin Fang' },
    about: { '@id': `${SITE}/#person` },
  };
}

const common = { section: 'now', ogType: 'article', style: PAGE_STYLE, backToTop: true };

export function renderNow(entry, lang) {
  const canonical = SITE + localePath(lang, '/now');
  return page({
    ...common,
    lang,
    path: '/now',
    title: lang === 'zh' ? '近況 Now｜方譽霖 YuLin Fang' : 'Now | YuLin Fang 方譽霖',
    description: lang === 'zh'
      ? `方譽霖（YuLin Fang）最近在忙的事，工作、學東西跟生活都有。每季更新，現在是 ${entry.label}。`
      : `What YuLin Fang is up to lately: work, learning and life. Updated every quarter, currently ${entry.label}.`,
    jsonld: quarterJsonld(entry, lang, { canonical }),
    body: quarterBody(entry, lang, { isLatest: true }),
  });
}

export function renderArchiveEntry(entry, lang, { isLatest }) {
  const zhPath = `/now/${entry.slug}`;
  const selfUrl = SITE + localePath(lang, zhPath);
  return page({
    ...common,
    lang,
    path: zhPath,
    /* 最新一季同時活在 /now，canonical 指過去避免重複內容；
       換季之後這頁就變成唯一來源，canonical 改指自己。 */
    canonical: isLatest ? SITE + localePath(lang, '/now') : selfUrl,
    title: lang === 'zh'
      ? `近況 Now ${entry.label}｜方譽霖 YuLin Fang`
      : `Now ${entry.label} | YuLin Fang 方譽霖`,
    description: lang === 'zh'
      ? `方譽霖（YuLin Fang）在 ${entry.label}（${entry.monthsZh}）的近況存檔。`
      : `YuLin Fang's /now update for ${entry.label} (${entry.monthsEn}), archived.`,
    jsonld: quarterJsonld(entry, lang, { canonical: selfUrl }),
    body: quarterBody(entry, lang, { isLatest: false }),
  });
}

export function renderArchiveIndex(entries, lang) {
  const zh = lang === 'zh';
  const canonical = SITE + localePath(lang, '/now/archive');
  const list = entries.map((e, i) => `        <li>
          <a class="q" href="${localePath(lang, '/now/' + e.slug)}">${quarterLabel(e, lang)}</a><span class="when">${zh ? e.dateZh : e.dateEn}</span>${i === 0 ? `<span class="badge">${zh ? '最新' : 'LATEST'}</span>` : ''}
          <p class="excerpt">${zh ? e.excerptZh : e.excerptEn}</p>
        </li>`).join('\n');
  const title = zh ? '歷史近況 Archive｜方譽霖 YuLin Fang' : 'Archive | YuLin Fang 方譽霖';

  return page({
    ...common,
    lang,
    path: '/now/archive',
    title,
    description: zh
      ? '方譽霖（YuLin Fang）以前寫過的近況，每季一篇。'
      : "YuLin Fang's past /now updates, one per quarter.",
    ogType: 'website',
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      '@id': `${canonical}#webpage`,
      url: canonical,
      name: title,
      inLanguage: zh ? 'zh-Hant' : 'en',
      isPartOf: { '@type': 'WebSite', url: `${SITE}/`, name: '方譽霖 YuLin Fang' },
      about: { '@id': `${SITE}/#person` },
      hasPart: entries.map(e => ({
        '@type': 'WebPage',
        url: SITE + localePath(lang, '/now/' + e.slug),
        name: `${zh ? '近況' : ''} Now ${e.label}`.trim(),
        datePublished: e.date,
      })),
    },
    body: `    <header>
      <h1 class="display">${zh ? '歷史近況<span class="latin">Archive</span>' : 'Archive<span class="latin" lang="zh-Hant">歷史近況</span>'}</h1>
      <p class="lede">${zh
        ? '以前每一季寫的近況都放在這裡，新的在上面。'
        : 'Every quarterly update is kept here, newest first.'}</p>
    </header>

    <section>
      <h2>${zh ? '全部紀錄' : 'All updates'}</h2>
      <ul class="archive-list">
${list}
      </ul>
    </section>

${footer(lang)}`,
  });
}
