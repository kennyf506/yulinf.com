/* ============================================================
   yulinf.com 共用行為：語言切換、深淺色、回到頂部、年份
   ------------------------------------------------------------
   語言與配色都存在 localStorage，三頁共用同一組 key，
   所以在任何一頁做的選擇，跨頁瀏覽時都會延續。

   切換語言有兩種機制，混用：
   1. 整塊 DOM —— [data-lang="zh"] / [data-lang="en"] 兩份內容，
      以 hidden 切換。長篇內容用這個，兩種語言都留在 DOM 裡。
   2. 單一字串 —— 元素同時帶 data-zh / data-en 屬性，直接換文字。
      導覽列、卡片標題這類短字串用這個，不必整段複製。
      同樣支援 data-zh-aria / data-en-aria（換 aria-label）與
      data-zh-href / data-en-href（換連結，例如中英文 vCard）。
   ============================================================ */
(function () {
  var root = document.documentElement;

  var LABELS = {
    zh: { theme_dark: '深色模式', theme_light: '淺色模式', lang: 'EN', top: '回到頂部' },
    en: { theme_dark: 'Dark Mode', theme_light: 'Light Mode', lang: '中文', top: 'Back to Top' }
  };

  var zhBlocks = document.querySelectorAll('[data-lang="zh"]');
  var enBlocks = document.querySelectorAll('[data-lang="en"]');
  var i18nNodes = document.querySelectorAll('[data-zh], [data-zh-aria], [data-zh-href]');
  var langBtn = document.getElementById('lang-toggle');
  var themeBtn = document.getElementById('theme-toggle');
  var topBtn = document.getElementById('back-to-top');

  var current = 'zh';

  /* --- 配色 --- */
  function isDark() {
    var attr = root.getAttribute('data-theme');
    if (attr) return attr === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  function syncLabels() {
    var L = LABELS[current];
    if (themeBtn) {
      themeBtn.textContent = isDark() ? L.theme_light : L.theme_dark;
      themeBtn.setAttribute('aria-pressed', String(isDark()));
    }
    if (langBtn) {
      langBtn.textContent = L.lang;
      langBtn.lang = current === 'en' ? 'zh-Hant' : 'en';
      langBtn.setAttribute('aria-label', current === 'en' ? '切換為中文' : 'Switch to English');
    }
    if (topBtn) topBtn.textContent = L.top;
  }

  function applyTheme(theme, persist) {
    if (theme) root.setAttribute('data-theme', theme);
    syncLabels();
    if (persist) { try { localStorage.setItem('theme', theme); } catch (e) {} }
  }

  /* --- 語言 --- */
  function applyLang(lang, persist) {
    var isEn = lang === 'en';
    current = isEn ? 'en' : 'zh';

    Array.prototype.forEach.call(zhBlocks, function (el) { el.hidden = isEn; });
    Array.prototype.forEach.call(enBlocks, function (el) { el.hidden = !isEn; });

    Array.prototype.forEach.call(i18nNodes, function (el) {
      var text = el.getAttribute(isEn ? 'data-en' : 'data-zh');
      if (text !== null) el.textContent = text;

      var aria = el.getAttribute(isEn ? 'data-en-aria' : 'data-zh-aria');
      if (aria !== null) el.setAttribute('aria-label', aria);

      var href = el.getAttribute(isEn ? 'data-en-href' : 'data-zh-href');
      if (href !== null) el.setAttribute('href', href);
    });

    root.lang = isEn ? 'en' : 'zh-Hant';
    syncLabels();
    if (persist) { try { localStorage.setItem('lang', lang); } catch (e) {} }
  }

  /* --- 還原上次的選擇 --- */
  var savedTheme = null, savedLang = null;
  try {
    savedTheme = localStorage.getItem('theme');
    savedLang = localStorage.getItem('lang');
  } catch (e) {}

  if (savedTheme === 'dark' || savedTheme === 'light') root.setAttribute('data-theme', savedTheme);
  applyLang(savedLang === 'en' ? 'en' : 'zh', false);
  applyTheme(null, false);

  /* 沒手動選過配色時，跟隨系統即時變化 */
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
    if (!root.hasAttribute('data-theme')) syncLabels();
  });

  if (langBtn) {
    langBtn.addEventListener('click', function () {
      applyLang(current === 'en' ? 'zh' : 'en', true);
    });
  }
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      applyTheme(isDark() ? 'light' : 'dark', true);
    });
  }

  /* --- 回到頂部 --- */
  if (topBtn) {
    window.addEventListener('scroll', function () {
      topBtn.classList.toggle('is-visible', window.scrollY > 300);
    }, { passive: true });
    topBtn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* --- 年份自動更新 --- */
  var y = String(new Date().getFullYear());
  Array.prototype.forEach.call(document.querySelectorAll('.year'), function (el) {
    el.textContent = y;
  });
})();
