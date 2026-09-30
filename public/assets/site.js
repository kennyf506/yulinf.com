/* ============================================================
   yulinf.com 共用行為：深淺色、回到頂部、年份
   ------------------------------------------------------------
   中英文是兩個獨立網址（/about 與 /en/about），語言切換鈕就是一般連結，
   這裡不處理語言。

   配色存在 localStorage，全站共用。使用者選過的配色由 <head>
   裡的一小段內聯腳本在第一次繪製前先套上（見 scripts/layout.mjs），
   這支檔案只負責按鈕文字與切換。
   ============================================================ */
(function () {
  var root = document.documentElement;
  var isEn = /^en\b/.test(root.lang);

  var LABELS = isEn
    ? { theme_dark: 'Dark Mode', theme_light: 'Light Mode' }
    : { theme_dark: '深色模式', theme_light: '淺色模式' };

  var themeBtn = document.getElementById('theme-toggle');
  var topBtn = document.getElementById('back-to-top');

  /* --- 配色 --- */
  function isDark() {
    var attr = root.getAttribute('data-theme');
    if (attr) return attr === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  function syncLabels() {
    if (!themeBtn) return;
    themeBtn.textContent = isDark() ? LABELS.theme_light : LABELS.theme_dark;
    themeBtn.setAttribute('aria-pressed', String(isDark()));
  }

  syncLabels();

  /* 沒手動選過配色時，跟隨系統即時變化 */
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
    if (!root.hasAttribute('data-theme')) syncLabels();
  });

  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var theme = isDark() ? 'light' : 'dark';
      root.setAttribute('data-theme', theme);
      syncLabels();
      try { localStorage.setItem('theme', theme); } catch (e) {}
    });
  }

  /* --- 回到頂部 --- */
  if (topBtn) {
    window.addEventListener('scroll', function () {
      topBtn.classList.toggle('is-visible', window.scrollY > 300);
    }, { passive: true });
    topBtn.addEventListener('click', function () {
      var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: still ? 'auto' : 'smooth' });
    });
  }

  /* --- 年份自動更新（建置時已經寫入當年，這裡處理跨年後尚未重建的情況） --- */
  var y = String(new Date().getFullYear());
  Array.prototype.forEach.call(document.querySelectorAll('.year'), function (el) {
    el.textContent = y;
  });
})();
