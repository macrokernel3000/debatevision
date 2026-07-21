# AI START HERE

這是 DebateVision / 辯語視界 專案給所有 AI 與協作者的第一份入口文件。

每次開始修改前，請先讀這份，再依任務閱讀對應規格。

## 專案一句話

DebateVision 是一個思辨教育活動網站。核心是用 CSV 詞庫、玩法 JSON、圖片素材與靜態網站，讓老師能持續新增活動，而不必每次重寫程式。

## 必讀順序

1. `AI_START_HERE.md`
2. `DebateVision_Project_Convention.md`
3. `docs/Project_Convention.md`
4. 依任務讀下列文件：
   - 新增或修改卡牌：`docs/Card_Data_Specification.md`
   - 新增或修改玩法：`docs/Game_Mode_Specification.md`
   - 修改玩法文案：`docs/Website_Text_CSV_Guide.md`
   - 新增或替換圖示：`docs/Icon_Style_Guide.md`
   - 微調圖片位置：`docs/Image_Layout_Editor_Guide.md`
   - 產品整理與下一階段：`docs/DebateVision_v1_5_Roadmap.md`
   - 檢查程式拆檔與冗餘：`docs/Code_Health_Audit.md`
   - 新增功能與防止程式再次膨脹：`docs/Architecture_Guardrails.md`
   - 檢查手機、平板、桌機版：`docs/Responsive_QA_Checklist.md`
   - 老師上課使用：`docs/Teacher_Manual.md`
   - 檢查 Google 搜尋收錄：`docs/Google_Search_Checklist.md`

## 三層原則

- `data/`：內容與規則。卡牌、玩法、文案都在這裡。
- `assets/`：素材。小圖示、大圖、背景、UI 素材都在這裡。
- `website/`：網站程式。只有互動邏輯或畫面需要改時才動這裡。

不要把內容、素材、網站程式混在一起。

## 新增玩法的固定流程

新增玩法時，必須同步完成：

1. 在 `data/modes/` 新增或修改玩法 JSON。
2. 在 `data/content/玩法文案.csv` 新增同一個 `玩法ID` 的玩法描述、教練提示、回合流程，必要時加玩法背景。
3. 如果新增了通用介面文字，修改 `data/content/介面文字.csv`。
4. 如果使用新牌組或新分類，確認 `data/cards/*.csv` 欄位完整。
5. 如果需要新小圖示，放到 `assets/icons/{deck_id}/`，CSV 的 `卡牌圖示` 只填 icon id。
6. 如果需要大圖，放到適合的素材資料夾，CSV 的 `圖片` 欄只填 image id 或檔名。
7. 執行 `網站更新.command` 或 `node scripts/build-lexicons.mjs`。
8. 檢查 `data/generated/` 已更新。

`data/modes/*.json` 是玩法規則；`data/content/玩法文案.csv` 是老師常改的前台文字。兩者都要同步。

## 程式維護提醒

`website/js/app.js` 與 `website/styles/main.css` 已經累積大量玩法邏輯與樣式。新增大型玩法或重構前，請先讀：

```text
docs/Code_Health_Audit.md
```

原則是先搬移、不改行為，並且每次拆完都要檢查桌機與手機版。

新增功能前必須先讀 `docs/Architecture_Guardrails.md`，完成後執行：

```text
node scripts/check-architecture.mjs
```

這項檢查有行數預算、模組大小、載入順序與桌機／手機邊界保護。檢查失敗時，應把功能放進正確模組，不要直接提高預算，也不要把新程式繼續接在 `app.js` 或 `main.css` 尾端。

目前 `app.js` 的硬上限是 1800 行、頂層 `let` 上限是 4 個。活動 shell、桌機牌組控制、手機 dashboard／modal、歷史、圖片、結果、字典與推理解密都已有專屬模組；任何 AI 都不得把同類函式複製回 `app.js`。若既有元件不適合新功能，新增一個責任清楚的小模組，而不是提高上限。

`check-architecture.mjs` 也會自動執行 `scripts/check-game-modes.mjs`，驗證所有玩法 controller 與主要版本仍能抽出正確卡數。若只想單獨檢查玩法，可以執行：

```text
node scripts/check-game-modes.mjs
```

架構檢查也會執行 `scripts/check-history-replay.mjs`，驗證舊冒險紀錄、新分組 metadata 與異境提問能正確回放。

異境求生的鎖定、資源交換與單隊重新編組由 `services/survival-result-service.js` 和 `components/survival-result-controller.js` 負責；不得把規則改寫進 DOM class 或手機事件。`scripts/check-survival-results.mjs` 會驗證鎖定保留、避免重複與只替換指定隊伍，並由架構檢查自動執行。

新增可變狀態時，使用 `website/js/core/state.js` 建立分域 state；不要增加 `app.js` 頂層 `let`。歷史、圖片、計時器等跨畫面邏輯放在 `website/js/services/`，元件只處理畫面與事件。

小修採快速維修模式：如果只是刪一句文字、改一個按鈕名稱、微調手機樣式，先用 `rg` 精準搜尋文字或 class，改最小範圍，跑對應的最小檢查即可。不要每次都重跑完整資料流程或重新盤點全專案；只有動到 CSV / JSON / generated 資料時才需要跑詞庫更新。

手機版已經是獨立操作流程，不只是桌面版縮小。修改手機流程、手機卡組選擇、手機結果頁、手機底部導覽、手機卡池 modal 時，優先改：

```text
website/js/mobile-render.js
website/js/mobile-app.js
website/styles/mobile.css
```

`mobile-render.js` 管手機畫面的 HTML 生成，`mobile-app.js` 管手機操作事件，`mobile.css` 管手機視覺。不要再把新的手機互動直接塞回 `website/js/app.js` 或把手機視覺規則塞回 `website/styles/main.css`，除非該功能確實同時屬於桌機與手機共用核心。

手機活動首頁與 Banner 圖片由 `components/mobile-mode-images.js` 管載入狀態，路徑由 `services/image-service.js` 產生，樣式放在 `styles/components/mobile-mode-images.css`。首頁只用 `assets/backgrounds/modes/mobile/*-thumb.webp`，活動 Banner 用 `*-banner.webp`；禁止把 `/assets/...` 寫成網站根路徑，也不要在首頁預載全部大 Banner。

## 手機版檢查提醒

每次修改畫面、活動選單、抽選池、卡牌顯示、計時器或新增玩法後，請依照：

```text
docs/Responsive_QA_Checklist.md
```

至少檢查手機直式、平板直式、桌機三種寬度。

## 圖片欄位規則

卡牌 CSV 裡：

- `卡牌圖示`：抽出卡牌的大圖示。填 icon id，例如 `world_icon_zombie`。
- `抽選池圖示`：底下勾選池的小符號。可以填文字、符號或 emoji，例如 `✚`、`♡`、`文`。
- `圖片`：大圖，通常顯示在卡牌、抽卡機、場景展示。填 image id 或檔名，例如 `worlds_Zombie.png`。

不要把大圖塞進 `卡牌圖示` 欄。

## 既有 CSV 優先規則

修改既有牌組時，必須先打開該 CSV，看目前實際欄位用法，再照原本格式追加或微調，不要用通用規格把使用者已整理好的欄位洗掉。

目前 `data/cards/召喚卡.csv` 的穩定格式是：

- `卡牌圖示` 與 `抽選池圖示` 都填簡單 emoji。
- `稀有度` 欄用來放大分類簡稱：`異族`、`超能`、`特職`。
- `標籤` 欄第一個標籤放完整分類：`異族類`、`超能類`、`特職類`，後面再接能力或用途標籤。
- 新增召喚卡時，沿用既有分類、emoji 與文字風格。

## 自動產物規則

不要手改：

```text
data/generated/
```

這些檔案由更新腳本產生。改完 CSV、JSON、圖片設定後要重新產生。

## 前台文字規則

不要讓內部分類名稱直接跑到學生畫面。

例如：

- CSV 稀有度可以是 `N`。
- 前台應顯示「物品卡」或「道具卡」，不要顯示「N 卡」作為玩法名稱。

## GitHub / 發布提醒

上傳靜態網站時，通常要一起上傳：

- `data/cards/`
- `data/content/`
- `data/modes/`
- `assets/`
- `website/`
- `data/generated/`

`data/generated/` 雖然是自動產物，但 GitHub Pages 線上版需要它。

## Google 搜尋收錄提醒

正式網址目前是：

```text
https://macrokernel3000.github.io/debatevision/website/
```

若要讓 Google 搜尋更容易找到，請同步維護：

- `website/index.html` 的 title、description、canonical、結構化資料
- `sitemap.xml`
- `robots.txt`
- `docs/Google_Search_Checklist.md`

Google 收錄需要 Search Console 驗證與提交 sitemap；不是只把網站上傳 GitHub 就一定會立刻出現在搜尋結果。
