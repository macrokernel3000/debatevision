# Project Convention

DebateVision 是一個可長期維護的思辨教育活動平台。核心不是單一網頁，而是一套能持續增加詞庫、素材與玩法的系統。

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
- `assets/backgrounds/`：場景、橫幅、UI 背景。
- `assets/ui/`：Logo、按鈕、框線、徽章。
- `assets/fonts/`：字型。

### 3. Website：`website/`

放使用者實際操作的網站。

- `website/index.html`：主頁。
- `website/js/`：互動程式。
- `website/styles/`：樣式。
- `website/pages/`：未來多頁面。

## 擴充規則

- 新增牌組：新增一個 CSV 到 `data/cards/`。
- 新增玩法：新增一個 JSON 到 `data/modes/`。
- 新增圖示：放到 `assets/icons/{deck_id}/`，CSV 只填 icon id。
- 更新網站資料：執行 `scripts/更新詞庫.command`。

## 命名規則

- 使用者會看的檔名可用中文，例如 `物品卡.csv`。
- 程式 ID 使用英文，例如 `items`、`roles`、`worlds`。
- 圖片檔名使用英文小寫與底線，例如 `item_hammer.svg`。
- 不在 commit 或檔案名稱中使用私人姓名、電話、地址、私人 email。
