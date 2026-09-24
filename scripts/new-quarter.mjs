/* ============================================================
   產生下一季的近況原稿骨架
      node scripts/new-quarter.mjs          當前季度
      node scripts/new-quarter.mjs 2027-Q1  指定季度
   已經存在的檔案不會被覆蓋。
   ============================================================ */
import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = path.join(ROOT, 'content/now');

const arg = process.argv[2];
const now = new Date();
const quarter = arg || `${now.getFullYear()}-Q${Math.floor(now.getMonth() / 3) + 1}`;

if (!/^\d{4}-Q[1-4]$/.test(quarter)) {
  console.error(`季度格式要像 2027-Q1，讀到「${quarter}」`);
  process.exit(1);
}

const file = path.join(CONTENT, `${quarter}.md`);
if (existsSync(file)) {
  console.error(`${path.relative(ROOT, file)} 已經存在，沒有覆蓋。直接編輯它就好。`);
  process.exit(1);
}

const today = new Date().toISOString().slice(0, 10);
const skeleton = `---
quarter: ${quarter}
date: ${today}
place_zh: 臺北
place_en: Taipei
---

## zh

### 目前在忙什麼
（待補）

### 正在學的事
（待補）

### 最近在讀、在看、在聽
（待補）

### 生活
（待補）

### 現在想找什麼
（待補）

## en

### What I'm working on
(To be written)

### What I'm learning
(To be written)

### Reading, watching, listening
(To be written)

### Life
(To be written)

### What I'm looking for
(To be written)
`;

await mkdir(CONTENT, { recursive: true });
await writeFile(file, skeleton, 'utf8');
console.log(`已建立 ${path.relative(ROOT, file)}

接下來：
  1. 編輯這個檔案，段落標題可以自由增刪改名
  2. npm run dev    本機預覽
  3. git add -A && git commit -m "近況 ${quarter.replace('-', ' ')}" && git push`);
