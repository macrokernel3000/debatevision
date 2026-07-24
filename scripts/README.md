# Scripts

AI 與協作者只需依任務使用對應腳本，不要把所有腳本都執行一次。

## 日常入口

| 指令 | 用途 | 何時使用 |
| --- | --- | --- |
| `node scripts/check-data-contracts.mjs` | 驗證卡牌、內容、玩法欄位與引用 | 修改 CSV / JSON 後、建置前 |
| `node scripts/build-lexicons.mjs` | 從來源資料產生 `data/generated/` | 資料契約通過後 |
| `node scripts/build-lexicons.mjs --check` | 不寫檔，比對所有 CSV / JSON 是否已掛入 generated | 懷疑改完資料未生效時 |
| `node scripts/check-assets.mjs` | 驗證來源圖片與手機衍生圖 | 修改圖片或圖片路徑後 |
| `node scripts/check-architecture.mjs` | 完整架構、資料、圖片與主要行為守門 | 新功能、拆檔、共用結構修改 |
| `python3 scripts/optimize-images.py` | 只轉換有更新的活動背景 | 新增或修改大圖後 |

一般使用者直接執行根目錄 `網站更新.command`；它會依安全順序完成資料檢查、圖片最佳化、建置與架構檢查。
建置器會依 generated 內容自動更新 `website/index.html` 的短雜湊版本，避免瀏覽器繼續使用修改前的 CSV 快取。

## 精準行為檢查

- `check-game-modes.mjs`：玩法 controller 與主要版本抽卡契約。
- `check-history-replay.mjs`：新舊歷史紀錄回放相容。
- `check-survival-results.mjs`：異境鎖定、分組、不重複與單隊重抽。

這三項已包含在 `check-architecture.mjs`。除非只修改對應功能，否則不需先後重複執行。

## 一次性資料遷移

- `add-sales-n-cards.mjs`：曾用來加入銷售 N 卡；不是日常更新步驟。
- `normalize-card-icons.mjs`：曾用來批次建立舊式 SVG icon；目前 Emoji 牌組不應執行。

一次性腳本不得加入 `網站更新.command`，執行前必須先閱讀目標 CSV，確認不會覆寫現有 Emoji、分類或使用者新增內容。

舊的 Python 建置轉接與未實作匯出入口已移除，避免與正式 Node 建置器混淆。
