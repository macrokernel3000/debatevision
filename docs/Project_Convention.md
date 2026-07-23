# Project Convention

DebateVision 是一個可長期維護的思辨教育活動平台。核心不是單一網頁，而是一套能持續增加詞庫、素材與玩法的系統。

## 第一入口

所有 AI 與協作者開始前，請先讀專案根目錄：

```text
AI_START_HERE.md
```

它是最高層的工作流程摘要。本文件則是專案結構與規則的詳細版。

## 三層架構

### 1. Content：`data/`

放所有可被抽選、組合、生成玩法的內容。

- `data/cards/`：牌組 CSV。
- `data/modes/`：玩法 JSON。
- `data/generated/`：自動生成檔，不手動修改。

`data/` 只放目前有效資料。舊資料或備份請放到 `docs/archive/legacy/`。

### 2. Assets：`assets/`

放所有視覺素材。

- `assets/icons/`：卡牌圖示。
- `assets/backgrounds/modes/`：玩法首頁背景。
- `assets/backgrounds/worlds/`：異境或場景大圖。
- `assets/backgrounds/`：其他橫幅、UI 背景。
- `assets/ui/`：Logo、按鈕、框線、徽章。
- `assets/fonts/`：字型。

### 3. Website：`website/`

放使用者實際操作的網站。

- `website/index.html`：主頁。
- `website/js/`：互動程式。
- `website/styles/`：樣式。
- `website/pages/`：未來多頁面。

新增大型玩法或拆分程式前，請先讀 `docs/Code_Health_Audit.md` 與 `docs/Architecture_Guardrails.md`。目前 `website/js/app.js` 與 `website/styles/main.css` 是主要需要逐步拆分的檔案。

手機版已經有獨立操作模組：

- `website/js/mobile-render.js`：手機版畫面 HTML 生成。
- `website/js/mobile-app.js`：手機版事件與操作流程。
- `website/styles/mobile.css`：手機版專屬版面與視覺。

未來若只影響手機版，優先修改這三個檔案；不要把手機專屬流程繼續寫進 `app.js`，也不要把手機專屬樣式繼續塞回 `main.css`。只有桌機與手機共用的資料讀取、狀態、卡牌元件與抽卡核心，才放在共用檔案。

小修採快速維修模式：文字、單一按鈕、單一手機樣式的修改，先精準搜尋、最小範圍修改、跑最小檢查。不要為了小修重新整理整個專案或重跑完整資料流程。動到 CSV / JSON / generated 資料時，才執行 `網站更新.command` 或 `node scripts/build-lexicons.mjs`。

新增功能或完成重構後，必須執行 `node scripts/check-architecture.mjs`。這會檢查大型入口檔的行數預算、模組大小、載入順序與桌機／手機顯示邊界；不要以提高預算代替拆分。

局部畫面修改先檢查目標裝置與一個相鄰邊界。只有新玩法、跨裝置共用介面、顯示邊界變更或發布前回歸，才依 `docs/Responsive_QA_Checklist.md` 完整檢查手機、平板與桌機版。

## 擴充規則

- 新增牌組：新增一個 CSV 到 `data/cards/`。
- 新增玩法：新增一個 JSON 到 `data/modes/`，並同步新增 `data/content/玩法設定.csv` 與 `data/content/玩法文案.csv` 的同一個 `玩法ID`。
- `card-dictionary` 是工具型玩法，永遠排在所有活動最後；新增玩法不要排到卡片字典後面。
- 新增圖示：小圖示放到 `assets/icons/{deck_id}/`，CSV 的 `卡牌圖示` 只填 icon id。
- 新增大圖：放到適合的 `assets/` 子資料夾，CSV 的 `圖片` 欄填 image id 或檔名。
- 更新網站資料：執行最外層的 `網站更新.command`。

## 新增玩法檢查清單

- `data/modes/*.json` 有新增玩法規則。
- `data/content/玩法設定.csv` 有同一個 `玩法ID` 的玩法名稱、選項短句與色系。
- `data/content/玩法文案.csv` 有同一個 `玩法ID` 的玩法描述。
- `data/content/玩法文案.csv` 有教練提示。
- `data/content/玩法文案.csv` 有回合流程。
- 如果有新背景，`玩法文案.csv` 有 `玩法背景`，或 JSON 有 `image`。
- 執行更新腳本後，`data/generated/modes.js` 已包含新玩法。

## 命名規則

- 使用者會看的檔名可用中文，例如 `物品卡.csv`。
- 程式 ID 使用英文，例如 `items`、`roles`、`worlds`。
- 圖片檔名使用英文小寫與底線，例如 `item_hammer.svg`。
- 不在 commit 或檔案名稱中使用私人姓名、電話、地址、私人 email。
