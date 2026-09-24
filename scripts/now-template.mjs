/* ============================================================
   /now 頁面的 HTML 樣板
   ------------------------------------------------------------
   三種頁面共用同一份 <head>、導覽列與版面樣式：
     renderNow()          最新一季，網址 /now
     renderArchiveEntry() 單季存檔，網址 /now/2026-q3
     renderArchiveIndex() 歷史索引，網址 /now/archive
   內容由 scripts/build-now.mjs 從 content/now/*.md 讀進來。
   ============================================================ */

const SITE = 'https://yulinf.com';

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

    @media (prefers-reduced-motion: reduce) {
      * { transition: none !important; scroll-behavior: auto !important; }
    }`;

function head({ title, description, canonical, jsonld }) {
  return `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <title>${title}</title>
  <meta name="description" content="${description}">
  <meta name="author" content="方譽霖 YuLin Fang">
  <link rel="canonical" href="${canonical}">
  <meta name="robots" content="index, follow">

  <meta property="og:type" content="article">
  <meta property="og:site_name" content="方譽霖 YuLin Fang">
  <meta property="og:url" content="${canonical}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${SITE}/og-image.jpg">
  <meta property="og:locale" content="zh_TW">
  <meta property="og:locale:alternate" content="en_US">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${SITE}/og-image.jpg">

  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <meta name="theme-color" content="#f4f5f7" media="(prefers-color-scheme: light)">
  <meta name="theme-color" content="#121316" media="(prefers-color-scheme: dark)">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400..700&family=Noto+Serif+TC:wght@600..700&display=swap">
  <link rel="stylesheet" href="/assets/site.css">

  <script type="application/ld+json">
${JSON.stringify(jsonld, null, 2).split('\n').map(l => '  ' + l).join('\n')}
  </script>

  <style>${PAGE_STYLE}
  </style>
</head>
<body>
  <div class="page">

    <nav class="site-nav">
      <a class="brand" href="/" data-zh="方譽霖" data-en="YuLin Fang">方譽霖</a>
      <ul class="links">
        <li><a href="/" data-zh="首頁" data-en="Home">首頁</a></li>
        <li><a href="/cv" data-zh="履歷" data-en="CV">履歷</a></li>
        <li><a href="/now" aria-current="page" data-zh="近況" data-en="Now">近況</a></li>
      </ul>
      <div class="nav-tools">
        <button id="lang-toggle" type="button" lang="en">EN</button>
        <button id="theme-toggle" type="button" aria-pressed="false">深色模式</button>
      </div>
    </nav>
`;
}

const TAIL = `
  </div>

  <button id="back-to-top" type="button">回到頂部</button>

  <script src="/assets/site.js"></script>
</body>
</html>
`;

function footer(lang) {
  const year = '<span class="year">2026</span>';
  return lang === 'en'
    ? `      <footer class="site-footer">
        <p>This is a <a href="https://nownownow.com/about" target="_blank" rel="noopener">/now page</a>,
           an idea from Derek Sivers. You can also browse
           <a href="https://nownownow.com/TW" target="_blank" rel="noopener">other /now pages from Taiwan</a>.</p>
        <p>&copy; ${year} YuLin Fang · <a href="/now/archive">Past updates</a> · <a href="/">Home</a></p>
      </footer>`
    : `      <footer class="site-footer">
        <p>這是一個 <a href="https://nownownow.com/about" target="_blank" rel="noopener">/now 頁面</a>，
           概念來自 Derek Sivers。你也可以看看
           <a href="https://nownownow.com/TW" target="_blank" rel="noopener">臺灣其他人的 /now 頁</a>。</p>
        <p>&copy; ${year} YuLin Fang ・ <a href="/now/archive">歷史近況</a> ・ <a href="/">回首頁</a></p>
      </footer>`;
}

/* --- 一份季度內容的兩份 DOM --- */
function quarterBody(entry, { isLatest, selfUrl }) {
  function block(lang) {
    const zh = lang === 'zh';
    const attrs = zh ? 'data-lang="zh"' : 'data-lang="en" lang="en" hidden';
    const place = zh ? entry.place_zh : entry.place_en;
    const version = zh
      ? `${entry.label}${isLatest ? '（最新）' : ''} ・ <a href="/now/archive">歷史版本 →</a>`
      : `${entry.label}${isLatest ? ' (latest)' : ''} · <a href="/now/archive">Past updates →</a>`;

    return `    <div ${attrs}>
      <header>
        <h1 class="display">${zh ? '近況<span class="latin">Now</span>' : 'Now<span class="latin">近況</span>'}</h1>
        <p class="lede">${zh
          ? '這一頁寫的是我現在正在專注的事——不是履歷，也不是流水帳，而是如果我們剛好碰面，我會跟你聊的東西。'
          : "This page is about what I'm focused on right now — not a CV and not a diary, but the things I'd tell you about if we happened to meet today."}</p>
        <div class="meta">
          <p class="updated">${zh ? '最後更新：' : 'Last updated: '}<time datetime="${entry.date}">${zh ? entry.dateZh : entry.dateEn}</time>${zh ? '・' : ' · '}${place}</p>
          <p class="version">${version}</p>
        </div>
      </header>

${entry.sections[lang].map(s => `      <section>
        <h2>${s.title}</h2>
${s.html}
      </section>`).join('\n\n')}

${footer(lang)}
    </div>`;
  }

  const notice = isLatest ? '' : `    <div class="notice" data-lang="zh">
      這是 <strong>${entry.label}</strong> 的存檔，內容停在 ${entry.dateZh}。
      <a href="/now">看最新近況 →</a>
    </div>
    <div class="notice" data-lang="en" lang="en" hidden>
      This is the archived <strong>${entry.label}</strong> update, frozen on ${entry.dateEn}.
      <a href="/now">See what I'm doing now →</a>
    </div>

`;

  return notice + block('zh') + '\n\n' + block('en');
}

function quarterJsonld(entry, { canonical }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${canonical}#webpage`,
    url: canonical,
    name: `近況 Now｜${entry.label}｜方譽霖 YuLin Fang`,
    inLanguage: 'zh-Hant',
    description: `方譽霖在 ${entry.label} 正在專注的事。`,
    datePublished: entry.date,
    dateModified: entry.date,
    isPartOf: { '@type': 'WebSite', url: `${SITE}/`, name: '方譽霖 YuLin Fang' },
    about: { '@id': `${SITE}/#person` },
  };
}

export function renderNow(entry) {
  const canonical = `${SITE}/now`;
  return head({
    title: '近況 Now｜方譽霖 YuLin Fang',
    description: `方譽霖（YuLin Fang）目前正在專注的事：工作、學習與生活的近況紀錄。這是一個 /now 頁面，每季更新，目前是 ${entry.label}。`,
    canonical,
    jsonld: quarterJsonld(entry, { canonical }),
  }) + quarterBody(entry, { isLatest: true }) + TAIL;
}

export function renderArchiveEntry(entry, { isLatest }) {
  const selfUrl = `${SITE}/now/${entry.slug}`;
  /* 最新一季同時活在 /now，canonical 指過去避免重複內容；
     換季之後這頁就變成唯一來源，canonical 改指自己。 */
  const canonical = isLatest ? `${SITE}/now` : selfUrl;
  return head({
    title: `近況 Now ${entry.label}｜方譽霖 YuLin Fang`,
    description: `方譽霖（YuLin Fang）在 ${entry.label} 的近況存檔。`,
    canonical,
    jsonld: quarterJsonld(entry, { canonical: selfUrl }),
  }) + quarterBody(entry, { isLatest: false }) + TAIL;
}

export function renderArchiveIndex(entries) {
  const canonical = `${SITE}/now/archive`;
  const list = (lang) => entries.map((e, i) => `        <li>
          <a class="q" href="/now/${e.slug}">${e.label}</a><span class="when">${lang === 'zh' ? e.dateZh : e.dateEn}</span>${i === 0 ? `<span class="badge">${lang === 'zh' ? '最新' : 'LATEST'}</span>` : ''}
          <p class="excerpt">${lang === 'zh' ? e.excerptZh : e.excerptEn}</p>
        </li>`).join('\n');

  const block = (lang) => {
    const zh = lang === 'zh';
    return `    <div ${zh ? 'data-lang="zh"' : 'data-lang="en" lang="en" hidden'}>
      <header>
        <h1 class="display">${zh ? '歷史近況<span class="latin">Archive</span>' : 'Archive<span class="latin">歷史近況</span>'}</h1>
        <p class="lede">${zh
          ? '每一季的近況都留著。下面是歷年的紀錄，最新的在最上面。'
          : 'Every quarterly update is kept here, newest first.'}</p>
      </header>

      <section>
        <h2>${zh ? '全部紀錄' : 'All updates'}</h2>
        <ul class="archive-list">
${list(lang)}
        </ul>
      </section>

${footer(lang)}
    </div>`;
  };

  return head({
    title: '歷史近況 Archive｜方譽霖 YuLin Fang',
    description: '方譽霖（YuLin Fang）歷年 /now 近況頁的存檔索引，每季一份。',
    canonical,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      '@id': `${canonical}#webpage`,
      url: canonical,
      name: '歷史近況 Archive｜方譽霖 YuLin Fang',
      inLanguage: 'zh-Hant',
      isPartOf: { '@type': 'WebSite', url: `${SITE}/`, name: '方譽霖 YuLin Fang' },
      about: { '@id': `${SITE}/#person` },
      hasPart: entries.map(e => ({
        '@type': 'WebPage',
        url: `${SITE}/now/${e.slug}`,
        name: `近況 Now ${e.label}`,
        datePublished: e.date,
      })),
    },
  }) + block('zh') + '\n\n' + block('en') + TAIL;
}

export { SITE };
