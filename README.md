# yulinf.com

方譽霖個人網站，部署在 Cloudflare Workers（靜態資源）。

## 結構

- `public/` — 實際部署的檔案
  - `index.html` — 首頁（中英雙語切換、深淺色模式）
  - `now/index.html` — 近況頁 `/now`
- `originals/` — 原始大圖備份，不部署
- `archive/v1/` — 舊版網站存檔，不部署

## 部署

```sh
wrangler deploy
```

網域：`yulinf.com`、`www.yulinf.com`（custom_domain，DNS 由 wrangler 自動建立）。
