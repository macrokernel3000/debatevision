# DebateVision 辯語視界

Every Thought Begins with a Question. 思想始於思考。

DebateVision 是一個思辨教育活動網站。它用牌組、情境、角色、問題與抽卡機制，快速產生課堂討論、口語表達與辯論暖身活動。

## 使用方式

本機預覽：

```bash
cd /Users/herry/Documents/debatecodex/activity-site
python3 -m http.server 5178
```

打開：

```text
http://127.0.0.1:5178/
```

根目錄 `index.html` 會自動導向 `website/`。

## 專案結構

```text
DebateVision/
├── README.md
├── DebateVision_Project_Convention.md
├── index.html
├── data/
│   ├── cards/
│   ├── modes/
│   └── generated/
├── assets/
│   ├── icons/
│   ├── backgrounds/
│   ├── ui/
│   └── fonts/
├── website/
│   ├── index.html
│   ├── js/
│   ├── styles/
│   └── pages/
├── scripts/
└── docs/
```

## 三層原則

- `data/`：內容資料。平常新增卡牌、牌組、玩法時改這裡。
- `assets/`：素材。AI 產生的圖示、背景、UI 元件放這裡。
- `website/`：網站。Codex 寫互動與畫面時改這裡。

## 新增或修改卡牌

修改：

```text
data/cards/*.csv
```

CSV 只負責內容。圖片欄位可以留空；`icon` 欄位建議只填 icon id，例如：

```csv
items,物品卡,□,鐵錘,可以敲擊。,item_hammer,,普通,工具
```

網站會自動對應：

```text
assets/icons/items/item_hammer.svg
```

## 新增玩法

新增一個 JSON：

```text
data/modes/新玩法.json
```

如果只是更換抽哪些牌組，不需要改網站程式。若需要全新的抽選或卡牌呈現方式，才改 `website/js/app.js`。

## 更新資料

改完 CSV 或 JSON 後，執行：

```text
scripts/更新詞庫.command
```

它會更新：

```text
data/generated/decks.js
data/generated/modes.js
```

`data/generated/` 是自動產物，不手動修改。

## 上傳 GitHub

改完詞彙後，最容易忘記的是 `data/generated/`。線上版是靜態網站，所以除了 CSV 和圖片，也要上傳：

```text
data/generated/decks.js
data/generated/modes.js
```

上傳前可以雙擊：

```text
scripts/上傳前檢查.command
```

更多說明見：

```text
docs/GitHub_Upload_Guide.md
```

## 規格文件

開始擴充前先讀：

- `docs/Project_Convention.md`
- `docs/Icon_Style_Guide.md`
- `docs/Card_Data_Specification.md`
- `docs/Game_Mode_Specification.md`
