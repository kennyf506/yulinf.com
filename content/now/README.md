# 近況原稿

這個資料夾是 `/now` 的唯一資料來源。每季一個檔案，檔名就是季度：`2026-Q3.md`、`2026-Q4.md`……

`public/now/` 底下所有 HTML 都是由 `scripts/build-now.mjs` 從這裡產生的，**不要手改**（那個資料夾已經被 git ignore）。

## 每季怎麼更新

```sh
npm run now:new                 # 依今天日期建立這一季的骨架（也可以 npm run now:new 2027-Q1）
# 編輯剛建立的 content/now/2027-Q1.md
npm run dev                     # 本機預覽 http://localhost:8787/now
git add -A && git commit -m "近況 2027 Q1" && git push
```

push 之後 Cloudflare 會自己跑建置，約 30 秒上線。新的一季會自動變成 `/now`，上一季自動退到 `/now/2026-q4` 存檔，`/now/archive` 與 `sitemap.xml` 也會一起更新。

## 檔案格式

```markdown
---
quarter: 2026-Q4          # 必填，格式固定 YYYY-Qn
date: 2026-10-01          # 必填，這一版的日期，會顯示在頁面上
place_zh: 臺北            # 選填，預設 臺北
place_en: Taipei          # 選填，預設 Taipei
---

## zh

### 目前在忙什麼
中文內容寫在這裡。**粗體**、清單、[連結](https://example.com) 都可以用。

- 條列一
- 條列二

### 生活
想開幾個段落都行，標題自己取。

## en

### What I'm working on
English content here.

### Life
Same structure as the Chinese half.
```

規則只有三條：

1. `## zh` 和 `## en` 兩塊都要有，各自底下至少要有一個 `### 段落標題`
2. `### ` 就是頁面上的段落標題，數量和名稱完全自由，兩種語言也不必一一對應
3. 段落內文用一般 Markdown

以「（待補）」或「(To be written)」開頭的段落會自動套上比較淡的佔位樣式，內容填上去就恢復正常。
