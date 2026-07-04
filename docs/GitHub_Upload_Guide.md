# GitHub Upload Guide

這份專案可以用 GitHub Desktop 或 Git 指令上傳。原則很簡單：

改完 CSV 或 JSON 後，先雙擊：

```text
網站更新.command
```

它會重新產生網站真正讀取的資料：

```text
data/generated/decks.js
data/generated/modes.js
```

## 改詞彙後需要上傳

如果只是新增或修改卡牌，通常要上傳：

```text
data/cards/*.csv
data/content/玩法文案.csv
data/generated/decks.js
data/generated/modes.js
assets/icons/
assets/backgrounds/
```

圖片如果有新增，也要一起上傳，不然線上版會找不到圖。

## 改玩法後需要上傳

如果新增或修改玩法，通常要上傳：

```text
data/modes/*.json
data/content/玩法文案.csv
data/generated/modes.js
data/generated/decks.js
```

## 改畫面或程式後需要上傳

如果 Codex 改了網站畫面，通常要上傳：

```text
website/
index.html
scripts/
docs/
README.md
網站更新.command
```

## 不需要上傳

`.gitignore` 會自動忽略這些：

```text
.DS_Store
*.zip
*.log
node_modules/
tmp/
scratch/
local/
```

## 最重要的一句話

只要你改過詞彙，請記得：CSV 要上傳，`data/generated/` 也要上傳。
