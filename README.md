# yulinf.com

方譽霖個人網站，部署在 Cloudflare Workers（靜態資源）。

## 結構

- `src/pages/` — 首頁與履歷的原稿，**要改首頁或履歷就改這裡**
  - `home.zh.html` / `home.en.html` — 首頁內文（導覽列以下）
  - `cv.zh.html` / `cv.en.html` — 履歷內文
  - `home.css` / `cv.css` — 各頁專屬樣式
- `content/now/` — 近況原稿，每季一個 Markdown，說明見該資料夾的 README
- `scripts/` — 建置程式
  - `layout.mjs` — 全站共用的 `<head>`、導覽列（只有這一份）
  - `pages.mjs` — 首頁、履歷、404 的標題、描述與結構化資料
  - `now-template.mjs` — 近況頁樣板
  - `build.mjs` — 產生全站 HTML、`sitemap.xml`、`_headers`
- `public/` — 實際部署的檔案。圖片、vCard、`assets/` 是手動維護的；
  HTML、`sitemap.xml`、`_headers` 都是建置產物（已 git ignore，不要手改）
- `originals/` — 原始大圖備份，不部署
- `archive/v1/` — 舊版網站存檔，不部署

## 網址

中英文是兩個獨立網址，互相以 hreflang 標註：

| 中文 | 英文 |
| --- | --- |
| `/` | `/en` |
| `/cv` | `/en/cv` |
| `/now` | `/en/now` |
| `/now/archive` | `/en/now/archive` |
| `/now/2026-q2` | `/en/now/2026-q2` |

## 開發與部署

```sh
npm install      # 第一次
npm run build    # 產生 HTML（dev / deploy 也會自動先跑）
npm run dev      # 本機預覽 http://localhost:8787，改 src/、content/ 會自動重建
npm run deploy   # 手動部署
```

推送到 `main` 會由 Cloudflare Workers Builds 自動建置並部署。

網域：`yulinf.com`、`www.yulinf.com`（custom_domain，DNS 由 wrangler 自動建立）。

## 安全標頭與快取

`build.mjs` 會產生 `public/_headers`：

- 全站加上 HSTS、CSP、`X-Content-Type-Options` 等標頭
- `<head>` 裡有一段內聯腳本（提早套用深色模式），CSP 以 hash 放行；
  改了 `layout.mjs` 的 `THEME_BOOT` 會自動重算
- `/assets/*` 快取一年，因為 HTML 引用時帶了內容雜湊（`site.css?v=…`）
- 根目錄圖片快取一週；如果換了同檔名的圖片，最多一週後訪客才會看到新圖，
  急的話改個檔名
