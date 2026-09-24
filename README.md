# yulinf.com

方譽霖個人網站，部署在 Cloudflare Workers（靜態資源）。

## 結構

- `public/` — 實際部署的檔案
  - `index.html` — 首頁（中英雙語切換、深淺色模式）
  - `now/index.html` — 近況頁 `/now`
- `originals/` — 原始大圖備份，不部署
- `archive/v1/` — 舊版網站存檔，不部署

## 開發與部署

```sh
npm install      # 第一次
npm run dev      # 本機預覽 http://localhost:8787
npm run deploy    # 手動部署
```

推送到 `main` 會由 Cloudflare Workers Builds 自動部署。

網域：`yulinf.com`、`www.yulinf.com`（custom_domain，DNS 由 wrangler 自動建立）。
