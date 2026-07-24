# AI START HERE

這是 DebateVision / 辯語視界給 AI 與協作者的唯一必讀入口。

## 工作原則

1. 先讀這一份，不要預設把所有 `docs/` 都讀完。
2. 先用 `rg` 定位實際檔案與既有做法，再只讀任務相關規格。
3. 小修走快速路徑；新功能、跨裝置或重構才走完整路徑。
4. 只驗證本次可能受影響的範圍，不為了「保險」每次重跑所有玩法。
5. 不做任務外的重構、格式化、檔名變更或全專案整理。

需要快速理解資料流、玩法對應或檢查入口時，只讀 `docs/AI_Project_Map.md`，不要掃描整個專案。

## 先判斷任務類型

| 任務 | 優先查看 | 需讀規格 | 最小驗證 |
| --- | --- | --- | --- |
| 單一文字、按鈕、間距、桌機或手機局部樣式 | 對應 HTML / CSS / component | 通常不需再讀 docs | 目標畫面＋另一個裝置邊界 |
| 單一玩法互動 | `website/js/modes/` 與對應 component | `docs/Game_Mode_Specification.md` | 目標玩法語法＋實際操作 |
| 卡牌 CSV | 該張 CSV 的現有欄位與相鄰列 | `docs/Card_Data_Specification.md` | `build-lexicons`＋對應卡池 |
| 圖片、圖示、Banner | CSV 圖片欄、`assets/`、`image-service.js` | 只讀對應圖片指南 | 目標畫面無缺圖 |
| 新玩法、新共用功能 | `data/modes/`、`modes/`、components | 玩法規格＋架構守則 | 架構檢查＋相關玩法＋受影響裝置 |
| 拆檔、跨裝置共用樣式、核心狀態 | 現有模組邊界 | `docs/Architecture_Guardrails.md` | 完整架構檢查＋手機／平板／桌機回歸 |
| 不確定檔案位置或依賴 | `docs/AI_Project_Map.md` | 不需額外讀完整 docs | 依地圖選擇對應檢查 |

## 快速維修路徑（預設）

適用於單一玩法、單一裝置或局部 UI 修改。

1. 用 `rg` 搜文字、class、`data-*` 或玩法 ID。
2. 最多先讀 3 個直接相關檔案；遇到依賴再往外讀。
3. 在現有責任邊界內做最小修改。
4. JavaScript 只跑該檔語法或對應 smoke check。
5. UI 只開目標玩法與目標尺寸；若樣式可能跨裝置，再加一個邊界尺寸。

不需因為一個局部 CSS 小修而重建詞庫、閱讀 Roadmap，或把每個玩法都抽一次。

## 完整開發路徑

只在以下情況使用：

- 新增玩法或共用元件。
- 修改共用抽卡、狀態、歷史、圖片服務。
- 拆檔或改變模組載入順序。
- 修改 `main.css`、`viewport-boundaries.css` 或共用 DOM 結構，可能同時影響手機與桌機。
- 使用者明確要求完整回歸、發布檢查或架構盤點。

此時才需要：

```text
docs/Project_Convention.md
docs/Architecture_Guardrails.md
docs/Responsive_QA_Checklist.md
```

並執行：

```bash
node scripts/check-architecture.mjs
```

架構檢查已包含主要玩法、歷史回放與異境求生狀態檢查，不要在同一輪重複呼叫裡面已有的檢查。

## 修改應放哪裡

- 卡牌、分類、描述：`data/cards/*.csv`
- 玩法規則與牌組：`data/modes/*.json`
- 玩法與介面文案：`data/content/*.csv`
- 圖片與圖示：`assets/`（檔名盤點用 `find` 或 `rg --no-ignore --files assets`）
- 單一玩法抽卡規則：`website/js/modes/`
- 跨畫面邏輯：`website/js/services/`
- 元件與元件樣式：`website/js/components/`、`website/styles/components/`
- 桌機單一玩法樣式：優先 `website/styles/modes/`
- 手機畫面：`mobile-render.js`、`mobile-app.js` 與手機 component
- 桌機／手機顯示邊界：只放 `viewport-boundaries.css`

`app.js`只協調，`main.css` 只保留真正共用或尚未拆分的舊樣式。新的單一玩法視覺不要繼續追加到 `main.css`。

## 資料與圖片底線

- 修改既有 CSV 前，必須先讀實際檔案，保留現有 emoji、分類與欄位語意。
- 不手改 `data/generated/`；修改 CSV / JSON 後才執行 `build-lexicons`。
- CSV / JSON 修改後先執行 `node scripts/check-data-contracts.mjs`，避免錯欄、重複名稱或玩法索引不一致進入 generated data。
- 圖片或圖片路徑修改後執行 `node scripts/check-assets.mjs`；它會檢查桌機來源圖與手機衍生圖。系統垃圾檔交由 `.gitignore` 排除，不阻擋更新。
- 手機圖片路徑交給 `image-service.js` 解析，不寫會越過 GitHub Pages 子目錄的 `/assets/...`。
- 首頁用手機縮圖，不預載全部大 Banner。

## 架構底線

- 不增加 `app.js` 頂層可變狀態。
- 新功能不寫回 `app.js` 或 `main.css` 尾端；放進對應 mode / service / component。
- 架構檢查失敗時先拆分，不為通過檢查直接提高上限。
- 保留已有行為與使用者其他修改，不回滾任務外差異。

## 完成回報

只回報：

1. 實際改了什麼。
2. 跑了哪些與本次有關的檢查。
3. 是否還有未解決風險。

不需在最終回覆重述整套開發步驟。
