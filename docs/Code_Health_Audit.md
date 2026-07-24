# Code Health Audit

Last checked: 2026-07-24

這是目前架構健康快照，不是玩法規格。檔案定位先讀 `AI_START_HERE.md` 與 `docs/AI_Project_Map.md`。

## 結論

- 來源資料、generated data、網站程式與圖片素材已有清楚單向資料流。
- 桌機與手機 DOM 由 `viewport-boundaries.css` 隔離；兩端可以各自修改，只有共用資料或共用元件才需同步調整。
- `app.js` 已回到協調層，玩法規則、元件事件、服務與畫面已分離。
- CSV、玩法引用、圖片路徑、主要玩法、歷史回放與異境分組都有自動守門。
- `main.css` 與 `mobile.css` 仍偏大，但已有新功能不得回流的邊界；應在實際修改相關區塊時逐步抽離，不做無行為需求的大搬家。

## 目前核心尺寸

| 檔案 | 約略行數 | 上限 | 責任 |
| --- | ---: | ---: | --- |
| `website/js/app.js` | 1624 | 1800 | 啟動、玩法 context、抽卡生命週期與跨元件接線 |
| `website/styles/main.css` | 2730 | 3020 | 桌機、平板與尚未拆分的共用樣式 |
| `website/styles/mobile.css` | 1898 | 2000 | 手機版專屬樣式 |
| `website/js/mobile-render.js` | 373 | 400 | 手機 HTML 生成 |
| `website/js/mobile-app.js` | 277 | 350 | 手機操作事件 |
| `scripts/build-lexicons.mjs` | 481 | 550 | 來源資料轉 generated data |

實際上限與完整檔案清單以 `scripts/check-architecture.mjs` 為準，不在文件重複維護第二份數字。

## 已建立的責任邊界

```text
data/cards + data/content + data/modes + data/image-layouts
  -> scripts/build-lexicons.mjs
  -> data/generated
  -> core / mode controllers / services
  -> components
  -> app.js orchestration
  -> mobile-app.js event bridge
```

- `website/js/core/`：卡池、文字、卡片 hooks、分域 state factory。
- `website/js/modes/`：六個抽卡玩法 controller；卡片字典是工具型玩法。
- `website/js/services/`：歷史、圖片、計時器、異境結果等跨畫面純邏輯。
- `website/js/components/`：可獨立渲染或綁定事件的畫面元件。
- `website/styles/components/`：已抽離元件樣式；推理解密桌機棋盤在 `secret-place.css`。
- `website/styles/viewport-boundaries.css`：唯一可控制桌機／手機 surface 顯示的檔案。

## 自動防線

| 指令 | 保護範圍 |
| --- | --- |
| `node scripts/check-data-contracts.mjs` | 卡牌十欄、必要欄位、重複 key、玩法與內容交叉引用 |
| `node scripts/check-assets.mjs` | 明確圖片路徑與手機衍生圖 |
| `node scripts/check-game-modes.mjs` | controller 與主要版本抽卡契約 |
| `node scripts/check-history-replay.mjs` | 新舊歷史紀錄相容 |
| `node scripts/check-survival-results.mjs` | 異境鎖定、分組、不重複、單隊重抽 |
| `node scripts/check-architecture.mjs` | 上述檢查、行數預算、載入順序、surface 邊界與禁止責任回流 |

資料更新的安全順序固定為：資料契約 → 產生 generated data → 架構檢查。根目錄 `網站更新.command` 已依此執行，資料錯誤不會先覆寫上一份可用輸出。

## 搜尋與非執行區

`.rgignore` 預設排除：

- `data/generated/`：自動產物。
- `docs/archive/`：歷史留存。
- `assets/`：二進位素材。
- `tmp/`、`outputs/`、`mobile-audit/`：製作或檢查輸出。

需要盤點檔名時使用 `find` 或 `rg --no-ignore --files` 指定目錄，不要移除忽略規則。`assets/cards/召喚卡_original_checkerboard/` 與 `tmp/imagegen/` 是可回溯的製作來源，不屬網站執行依賴。

## 維護風險與下一步

1. `mobile.css` 接近預算；下一次新增大型手機元件時，同步建立對應 component CSS。
2. `main.css` 應在修改到相關功能時逐區拆出，優先卡片字典、活動選單或單一玩法，不做一次性全檔重排。
3. `app.js` 的四個頂層導航狀態已達上限；新增狀態必須進分域 state 或所屬 service。
4. `add-sales-n-cards.mjs` 與 `normalize-card-icons.mjs` 是一次性遷移，尤其後者會建立舊式 SVG，不得放入日常更新流程。
5. 自動檢查不能取代瀏覽器。共用結構、響應式樣式或載入順序修改後，仍要依 `Responsive_QA_Checklist.md` 實測。

## 重構完成條件

- 不增加入口檔責任與頂層可變狀態。
- 新功能可從專案地圖直接定位，不需全庫搜尋。
- 資料錯誤在 generated data 被覆寫前停止。
- 桌機與手機修改不互相控制 surface 顯示。
- 自動檢查通過，且受影響畫面完成實際瀏覽器驗證。
