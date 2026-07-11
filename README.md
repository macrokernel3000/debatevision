# DebateVision 辯語視界

Every Thought Begins with a Question. 思想始於思考。

DebateVision 是一個思辨教育活動網站。它用牌組、情境、角色、問題與抽卡機制，快速產生課堂討論、口語表達與辯論暖身活動。

## AI 與協作者請先讀

請先讀：

```text
AI_START_HERE.md
```

它是本專案的第一入口，說明新增卡牌、玩法、文案、圖片時應該遵守的固定流程。

## 使用方式

更新並開啟網站：

```text
網站更新.command
```

更新完成後按 Enter，系統會自動開啟：

```text
http://127.0.0.1:5178/website/
```

根目錄 `index.html` 會自動導向 `website/`。

老師手冊頁：

```text
website/pages/teacher-manual.html
```

本機預覽時可開啟：

```text
http://127.0.0.1:5178/website/pages/teacher-manual.html
```

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

CSV 只負責內容。每一個 CSV 是獨立牌組，例如 `物品卡.csv`、`異境卡.csv`、`職業卡.csv`、`名人卡.csv`、`需求卡.csv`。圖片欄位可以留空；`icon` 欄位建議只填 icon id，例如：

```csv
items,物品卡,□,鐵錘,可以敲擊。,item_hammer,,普通,工具
```

網站會自動對應：

```text
assets/icons/items/item_hammer.svg
```

## 修改網站文字

玩法描述、教練提示、回合流程可以直接改：

```text
data/content/玩法文案.csv
```

通用介面文字可以直接改：

```text
data/content/介面文字.csv
```

改完後雙擊：

```text
網站更新.command
```

詳細說明見：

```text
docs/Website_Text_CSV_Guide.md
```

## 微調卡牌圖片

需要調整卡牌圖片的上下、左右、縮放或旋轉時，在網址後加：

```text
?edit=1
```

例如：

```text
http://127.0.0.1:5178/website/?edit=1
```

調整後按「匯出 JSON」，貼回對應檔案：

```text
data/image-layouts/items.json
```

詳細說明見：

```text
docs/Image_Layout_Editor_Guide.md
```

## 新增玩法

新增一個 JSON：

```text
data/modes/新玩法.json
```

並且同步新增同一個 `玩法ID` 的文案：

```text
data/content/玩法文案.csv
```

如果只是更換抽哪些牌組，不需要改網站程式。若需要全新的抽選或卡牌呈現方式，才改 `website/js/app.js`。

## 更新資料

改完 CSV、JSON、圖片或網站文字後，執行：

```text
網站更新.command
```

它會更新：

```text
data/generated/decks.js
data/generated/modes.js
data/generated/image-layouts.js
data/generated/ui-texts.js
```

`data/generated/` 是自動產物，不手動修改。

## 上傳 GitHub

改完詞彙後，最容易忘記的是 `data/generated/`。線上版是靜態網站，所以除了 CSV 和圖片，也要上傳：

```text
data/generated/decks.js
data/generated/modes.js
data/generated/image-layouts.js
data/generated/ui-texts.js
```

上傳前可以雙擊：

```text
網站更新.command
```

更多說明見：

```text
docs/GitHub_Upload_Guide.md
```

## Google 搜尋收錄

正式網址：

```text
https://macrokernel3000.github.io/debatevision/website/
```

本專案已放入基本 SEO 資訊、`sitemap.xml` 與 `robots.txt`。但要讓 Google 更快知道這個網站，仍需要到 Google Search Console 驗證網站、提交 sitemap，並用網址檢查要求建立索引。

操作清單見：

```text
docs/Google_Search_Checklist.md
```

## 規格文件

開始擴充前先讀：

- `docs/DebateVision_v1_5_Roadmap.md`
- `docs/Teacher_Manual.md`
- `docs/Project_Convention.md`
- `docs/Icon_Style_Guide.md`
- `docs/Card_Data_Specification.md`
- `docs/Game_Mode_Specification.md`
- `docs/Image_Layout_Editor_Guide.md`
- `docs/Google_Search_Checklist.md`
