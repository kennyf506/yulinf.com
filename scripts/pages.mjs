/* ============================================================
   手寫頁面：首頁、履歷、404
   ------------------------------------------------------------
   內文在 src/pages/<name>.<lang>.html，頁面專屬 CSS 在
   src/pages/<name>.css；這裡只放各語言的 meta 與結構化資料。
   ============================================================ */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { page, SITE, ROOT } from './layout.mjs';

const SRC = path.join(ROOT, 'src/pages');
const read = f => readFileSync(path.join(SRC, f), 'utf8');

/* 結構化資料：讓搜尋引擎認得「方譽霖」這個人，並在搜尋結果顯示知識面板資訊 */
const PERSON = {
  '@type': 'Person',
  '@id': `${SITE}/#person`,
  name: '方譽霖',
  alternateName: ['YuLin Fang', 'Fang YuLin', '方譽霖 YuLin Fang'],
  givenName: '譽霖',
  familyName: '方',
  gender: 'Male',
  nationality: 'TW',
  url: `${SITE}/`,
  image: `${SITE}/og-image-v2.jpg`,
  email: 'mailto:kennyf5056@gmail.com',
  jobTitle: '負責人兼執行總監',
  description: '光房子創意股份有限公司負責人兼執行總監，專長跨國直播工程、影像製作與活動技術統籌。',
  worksFor: {
    '@type': 'Organization',
    '@id': 'https://lighthousecc.tw/#organization',
    name: '光房子創意股份有限公司',
    alternateName: 'Lighthouse Creative Co., Ltd.',
    url: 'https://lighthousecc.tw/',
  },
  alumniOf: [
    { '@type': 'CollegeOrUniversity', name: '國立臺灣大學', sameAs: 'https://www.ntu.edu.tw/' },
    { '@type': 'CollegeOrUniversity', name: '國立臺灣科技大學', sameAs: 'https://www.ntust.edu.tw/' },
    { '@type': 'HighSchool', name: '臺北市立大安高級工業職業學校' },
  ],
  knowsAbout: ['直播工程', '影像製作', '音響工程', '電力工程', '網路通訊', '活動技術統籌', '跨國連線直播'],
  knowsLanguage: [
    { '@type': 'Language', name: '華語', alternateName: 'zh-Hant' },
    { '@type': 'Language', name: '英語', alternateName: 'en' },
  ],
  sameAs: [
    'https://www.instagram.com/yu_lin_fang/',
    'https://www.facebook.com/kennyf506',
    'https://www.linkedin.com/in/%E8%AD%BD%E9%9C%96-%E6%96%B9-0b9924213',
    'https://lighthousecc.tw/about',
  ],
};

const PROFILE_HEAD = `<meta property="profile:first_name" content="譽霖">
<meta property="profile:last_name" content="方">`;

const META = {
  home: {
    zh: {
      title: '方譽霖 YuLin Fang｜直播工程・影像製作',
      description: '方譽霖（YuLin Fang），光房子創意負責人，做直播工程跟影像製作。這裡有我的經歷、近況和公司介紹。',
    },
    en: {
      title: 'YuLin Fang 方譽霖 | Live Streaming Engineering & Video Production',
      description: "YuLin Fang runs Lighthouse Creative and works on live streaming and video production. Here you'll find more about me, what I'm up to lately, and a link to the studio.",
    },
  },
  cv: {
    zh: {
      title: '關於我｜方譽霖 YuLin Fang',
      description: '關於方譽霖（YuLin Fang）：工作經歷、講師、社團與社群、體育經歷、技能、證照和學歷。',
    },
    en: {
      title: 'About | YuLin Fang 方譽霖',
      description: "About YuLin Fang: work, teaching, organizations and communities, athletics, skills, certifications and education.",
    },
  },
};

function webPage(type, url, lang, name, extra) {
  return {
    '@type': type,
    '@id': `${url}#webpage`,
    url,
    name,
    inLanguage: lang === 'zh' ? 'zh-Hant' : 'en',
    isPartOf: { '@type': 'WebSite', url: `${SITE}/`, name: '方譽霖 YuLin Fang' },
    ...extra,
  };
}

export function renderHome(lang) {
  const m = META.home[lang];
  const url = lang === 'zh' ? `${SITE}/` : `${SITE}/en`;
  return page({
    lang,
    path: '/',
    section: 'home',
    ogType: 'profile',
    extraHead: PROFILE_HEAD,
    ...m,
    jsonld: {
      '@context': 'https://schema.org',
      '@graph': [PERSON, webPage('ProfilePage', url, lang, m.title, { mainEntity: { '@id': PERSON['@id'] } })],
    },
    style: read('home.css'),
    body: read(`home.${lang}.html`),
  });
}

export function renderCv(lang) {
  const m = META.cv[lang];
  const url = lang === 'zh' ? `${SITE}/about` : `${SITE}/en/about`;
  return page({
    lang,
    path: '/about',
    section: 'cv',
    ogType: 'profile',
    extraHead: PROFILE_HEAD,
    ...m,
    /* 這是「方譽霖」這個人的個人資料頁，Person 主體定義在首頁 */
    jsonld: {
      '@context': 'https://schema.org',
      ...webPage('ProfilePage', url, lang, m.title, { mainEntity: { '@id': PERSON['@id'] } }),
    },
    style: read('cv.css'),
    body: read(`cv.${lang}.html`),
    backToTop: true,
  });
}

/* 找不到網址時不知道對方要哪種語言，所以兩種都寫在同一頁 */
export function render404() {
  return page({
    lang: 'zh',
    path: '/404',
    section: null,
    alternate: false,
    noindex: true,
    title: '找不到這一頁｜方譽霖 YuLin Fang',
    description: '這個網址沒有內容。',
    style: `
.page { max-width: 640px; margin: 0 auto; padding: clamp(28px, 7vw, 72px) 22px; }
.lost h1 { font-size: clamp(2rem, 6vw, 2.9rem); margin: 0 0 .5em; }
.lost p { color: var(--text-muted); margin: 0 0 1.2em; }
.lost + .lost { margin-top: clamp(32px, 7vw, 48px); padding-top: clamp(24px, 5vw, 34px); border-top: 1px solid var(--rule); }
.lost .actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 1.6em; }
`,
    body: `    <main>
      <div class="lost">
        <h1 class="display">找不到這一頁</h1>
        <p>可能是網址打錯，或這頁已經不在了。從下面挑一個回去吧。</p>
        <div class="actions">
          <a class="btn" href="/">回首頁</a>
          <a class="btn btn--ghost" href="/about">關於我</a>
          <a class="btn btn--ghost" href="/now">近況</a>
        </div>
      </div>
      <div class="lost" lang="en">
        <h1 class="display">This page doesn't exist</h1>
        <p>The link might be wrong, or the page is gone. Try one of these:</p>
        <div class="actions">
          <a class="btn" href="/en">Home</a>
          <a class="btn btn--ghost" href="/en/about">About</a>
          <a class="btn btn--ghost" href="/en/now">Now</a>
        </div>
      </div>
    </main>

    <footer class="site-footer">
      <p>&copy; <span class="year">2026</span> YuLin Fang. All rights reserved.</p>
    </footer>`,
  });
}
