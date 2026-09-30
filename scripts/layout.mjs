/* ============================================================
   全站共用的頁面外殼：<head>、導覽列、頁尾腳本
   ------------------------------------------------------------
   首頁、履歷、/now、404 全部經過這裡，導覽列與 meta 只有這一份。

   中英文是兩個獨立網址：中文在 /about，英文在 /en/about。
   每頁都用 hreflang 互相指向，搜尋引擎可以分別收錄兩種語言。
   ============================================================ */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const SITE = 'https://yulinf.com';
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/* --- 在第一次繪製之前就套上使用者選過的配色，避免深色模式閃白。
       CSP 以 hash 放行這段，所以內容一改，_headers 會跟著重算 --- */
export const THEME_BOOT =
  `try{var t=localStorage.getItem('theme');if(t==='dark'||t==='light')document.documentElement.setAttribute('data-theme',t)}catch(e){}`;
export const THEME_BOOT_HASH = 'sha256-' + createHash('sha256').update(THEME_BOOT).digest('base64');

/* --- CSS/JS 帶上內容雜湊，檔案一改網址就變，才能放心設長快取 --- */
function versioned(rel) {
  const buf = readFileSync(path.join(ROOT, 'public', rel));
  return `/${rel}?v=${createHash('sha256').update(buf).digest('hex').slice(0, 10)}`;
}
const CSS_URL = versioned('assets/site.css');
const JS_URL = versioned('assets/site.js');

/* 中文路徑 → 各語言網址。'/' → '/'、'/en'；'/about' → '/about'、'/en/about' */
export function localePath(lang, zhPath) {
  if (lang === 'zh') return zhPath;
  return zhPath === '/' ? '/en' : '/en' + zhPath;
}

const T = {
  zh: {
    htmlLang: 'zh-Hant', ogLocale: 'zh_TW', ogAlt: 'en_US',
    brand: '方譽霖', home: '首頁', cv: '關於我', now: '近況',
    switchTo: 'EN', switchLang: 'en', switchLabel: 'Switch to English',
    theme: '深色模式', top: '回到頂部',
  },
  en: {
    htmlLang: 'en', ogLocale: 'en_US', ogAlt: 'zh_TW',
    brand: 'YuLin Fang', home: 'Home', cv: 'About', now: 'Now',
    switchTo: '中文', switchLang: 'zh-Hant', switchLabel: '切換為中文',
    theme: 'Dark Mode', top: 'Back to Top',
  },
};

const esc = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

function nav(lang, { path: zhPath, section, alternate }) {
  const t = T[lang];
  const other = lang === 'zh' ? 'en' : 'zh';
  const item = (key, href) =>
    `<li><a href="${localePath(lang, href)}"${section === key ? ' aria-current="page"' : ''}>${t[key]}</a></li>`;
  /* 沒有對應語言頁的頁面（404）就把切換鈕導回另一語言的首頁 */
  const switchHref = alternate === false ? localePath(other, '/') : localePath(other, zhPath);
  return `    <nav class="site-nav">
      <a class="brand" href="${localePath(lang, '/')}">${t.brand}</a>
      <ul class="links">
        ${item('home', '/')}
        ${item('cv', '/about')}
        ${item('now', '/now')}
      </ul>
      <div class="nav-tools">
        <a id="lang-toggle" href="${switchHref}" hreflang="${t.switchLang}" lang="${t.switchLang}" aria-label="${t.switchLabel}">${t.switchTo}</a>
        <button id="theme-toggle" type="button" aria-pressed="false">${t.theme}</button>
      </div>
    </nav>`;
}

/**
 * 組出一整頁 HTML。
 * @param {object} o
 * @param {'zh'|'en'} o.lang
 * @param {string} o.path        中文版路徑，例如 '/about'；英文版會自動加上 /en
 * @param {string} o.section     導覽列要標示的項目：home / cv / now
 * @param {string} o.title
 * @param {string} o.description
 * @param {string} o.ogType
 * @param {object} [o.jsonld]
 * @param {string} [o.canonical] 預設是這頁自己的網址
 * @param {string} [o.extraHead] 額外塞進 <head> 的標籤
 * @param {string} [o.style]     頁面專屬 CSS
 * @param {string} o.body
 * @param {boolean} [o.backToTop]
 * @param {boolean} [o.noindex]
 * @param {boolean} [o.alternate] false 表示這頁沒有另一語言版本（404）
 */
export function page(o) {
  const t = T[o.lang];
  const self = SITE + localePath(o.lang, o.path);
  const canonical = o.canonical ?? self;
  const hreflang = o.alternate === false ? '' : `
  <link rel="alternate" hreflang="zh-Hant" href="${SITE + localePath('zh', o.path)}">
  <link rel="alternate" hreflang="en" href="${SITE + localePath('en', o.path)}">
  <link rel="alternate" hreflang="x-default" href="${SITE + localePath('zh', o.path)}">`;
  const jsonld = o.jsonld ? `

  <script type="application/ld+json">
${JSON.stringify(o.jsonld, null, 2).split('\n').map(l => '  ' + l).join('\n')}
  </script>` : '';
  const style = o.style ? `

  <style>
${o.style.trimEnd().split('\n').map(l => l ? '    ' + l : l).join('\n')}
  </style>` : '';
  const year = String(new Date().getFullYear());
  const body = o.body.replace(/<span class="year">\d{4}<\/span>/g, `<span class="year">${year}</span>`);

  return `<!DOCTYPE html>
<html lang="${t.htmlLang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script>${THEME_BOOT}</script>

  <title>${esc(o.title)}</title>
  <meta name="description" content="${esc(o.description)}">
  <meta name="author" content="方譽霖 YuLin Fang">
  <meta name="robots" content="${o.noindex ? 'noindex' : 'index, follow, max-image-preview:large'}">${o.noindex ? '' : `
  <link rel="canonical" href="${canonical}">`}${hreflang}

  <!-- Open Graph / Facebook / LINE -->
  <meta property="og:type" content="${o.ogType || 'website'}">
  <meta property="og:site_name" content="${o.lang === 'en' ? 'YuLin Fang 方譽霖' : '方譽霖 YuLin Fang'}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:title" content="${esc(o.title)}">
  <meta property="og:description" content="${esc(o.description)}">
  <meta property="og:image" content="${SITE}/og-image-v2.jpg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${o.lang === 'en' ? 'Portrait of YuLin Fang' : '方譽霖 YuLin Fang 個人照'}">
  <meta property="og:locale" content="${t.ogLocale}">
  <meta property="og:locale:alternate" content="${t.ogAlt}">${o.extraHead ? '\n  ' + o.extraHead.trim().split('\n').join('\n  ') : ''}

  <!-- Twitter / X -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(o.title)}">
  <meta name="twitter:description" content="${esc(o.description)}">
  <meta name="twitter:image" content="${SITE}/og-image-v2.jpg">

  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <meta name="theme-color" content="#f4f5f7" media="(prefers-color-scheme: light)">
  <meta name="theme-color" content="#121316" media="(prefers-color-scheme: dark)">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400..700&family=Noto+Serif+TC:wght@600..700&display=swap">
  <link rel="stylesheet" href="${CSS_URL}">${jsonld}${style}
</head>
<body>
  <div class="page">

${nav(o.lang, o)}

${body.trimEnd()}

  </div>
${o.backToTop ? `
  <button id="back-to-top" type="button">${t.top}</button>
` : ''}
  <script src="${JS_URL}"></script>
</body>
</html>
`;
}
