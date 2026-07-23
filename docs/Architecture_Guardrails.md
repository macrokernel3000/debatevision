# Architecture Guardrails

這份文件用來防止 DebateVision 在持續新增功能、卡牌或由不同 AI 維護時，又把所有程式堆回 `app.js` 與 `main.css`。

核心原則不是「檔案越多越好」，而是每個檔案只有一個清楚責任，並且能獨立檢查。

## 修改內容應該放哪裡

| 要新增或修改的東西 | 正確位置 | 不應放的位置 |
| --- | --- | --- |
| 卡牌名稱、分類、描述、圖片欄位 | `data/cards/*.csv` | `website/js/app.js` |
| 玩法規則與使用牌組 | `data/modes/*.json` | 在事件監聽裡硬編玩法 |
| 玩法與介面文案 | `data/content/*.csv` | HTML 或 JavaScript 字串 |
| 卡牌圖片與背景 | `assets/` | generated data 或 JavaScript |
| 單一玩法抽卡規則 | `website/js/modes/` | `drawResult()` 或大型 if/else |
| 共用資料、狀態、文字服務 | `website/js/core/` | 手機事件或畫面模組 |
| 歷史、圖片、計時器等跨畫面邏輯 | `website/js/services/` | 元件 DOM 或 `app.js` |
| 可獨立使用的介面元件 | `website/js/components/`、`website/styles/components/` | `app.js`、`main.css` 尾端 |
| 手機 HTML 生成 | `website/js/mobile-render.js` | `app.js` |
| 手機操作事件 | `website/js/mobile-app.js` | `app.js` |
| 手機專屬樣式 | `website/styles/mobile.css` | `main.css` |
| 桌機／手機顯示邊界 | `website/styles/viewport-boundaries.css` | 其他任何 CSS |

## 現在的模組責任

```text
website/js/
├── app.js                    # 啟動、共用協調、模式 context 與事件接線；不得放回大型畫面
├── core/
│   ├── state.js              # 分域 state factory；玩法狀態由 app 建立成小型分域物件
│   ├── decks.js              # 卡池選取、抽樣、重置與 card key
│   ├── card-hooks.js         # 跨玩法卡片提問模板
│   └── ui-text.js            # generated 文案、預設文案、文字模板替換
├── services/
│   ├── history-service.js    # 最近紀錄儲存、上限與取回
│   ├── history-replay.js     # 紀錄卡片還原、冒險分組與舊資料相容
│   ├── image-service.js      # 圖片選擇、URL、fallback 與 image layout
│   ├── survival-result-service.js # 異境鎖定、資源交換、分組與單隊重抽規則
│   └── timer-service.js      # 計時器狀態與持久化
├── components/
│   ├── cards.js              # 共用卡片與詞庫 token HTML
│   ├── deck-controls.js      # 桌機版本切換、卡組摘要、鎖定與數量控制
│   ├── history.js            # 最近十場畫面
│   ├── image-editor.js       # edit=1 圖片位置編輯
│   ├── mobile-dashboard.js   # 手機各玩法設定 view model 與畫面協調
│   ├── mobile-mode-images.js # 手機活動縮圖、Banner、skeleton 與 fallback
│   ├── mobile-modals.js      # 手機卡池編輯與卡牌美術預覽
│   ├── mode-shell.js         # 活動選單、玩法 banner、場景背景與顯示切換
│   ├── card-dictionary.js    # 卡片字典選擇與結果
│   ├── reel-view.js          # 抽卡機畫面
│   ├── results.js            # 共用結果畫面
│   ├── survival-result-controller.js # 異境結果正式狀態與操作協調
│   ├── survival-battle-view.js # 冒險版分組結果與單隊操作
│   ├── secret-place.js       # 推理解密互動 controller
│   └── class-timer.js        # 計時器 DOM、事件與顯示更新
├── modes/                    # 各玩法抽卡 controller
├── mobile-render.js          # 手機 HTML
└── mobile-app.js             # 手機事件

website/styles/
├── tokens.css                # 共用顏色、間距、圓角與陰影
├── main.css                  # 桌機、平板與真正共用的舊樣式
├── mobile.css                # 手機專屬樣式
├── viewport-boundaries.css   # 桌機／手機顯示隔離，必須最後載入
└── components/
    ├── class-timer.css       # 計時器所有寬度的樣式
    ├── mobile-modals.css     # 手機卡池編輯與卡牌美術預覽彈窗
    ├── mobile-mode-images.css # 手機活動圖載入狀態
    └── mobile-survival-results.css # 手機鎖定與重抽操作
```

## 新增功能的固定流程

本節只適用於新功能、跨模組修改與重構。單一文字、局部樣式或單一玩法微調，依 `AI_START_HERE.md` 的快速維修路徑處理。

1. 先判斷它是內容、素材、玩法、共用元件、桌機或手機功能。
2. 優先新增小而完整的模組，不在 `app.js` 或 `main.css` 尾端追加一大段。
3. 新狀態用 `core/state.js` 建立分域物件；不要增加 `app.js` 頂層 `let`，也不要建立包辦全部玩法的巨大 state。
4. 若跨模組，只由 `app.js` 協調；不要讓手機模組反向接管桌機 DOM。
5. 在 `website/index.html` 明確載入新模組，依賴檔必須排在使用者之前。
6. 執行：

   ```bash
   node scripts/check-architecture.mjs
   ```

   只有變更 CSV / JSON / generated 資料時才額外執行 `node scripts/build-lexicons.mjs`；只檢查實際改動的 JavaScript 檔案，不固定重查未修改的 `app.js`。

7. 依 `docs/Responsive_QA_Checklist.md` 檢查受影響裝置與實際操作。只有共用介面、邊界 CSS、新玩法或發布前回歸，才檢查手機、平板與桌機全部尺寸。

## 自動防線

`scripts/check-architecture.mjs` 會檢查：

- 大型入口檔案是否超過目前行數預算。
- `core`、`services`、`components`、`modes` 是否又出現過大的單檔。
- `app.js` 頂層可變狀態是否增加。
- CSS 與 JavaScript 的必要載入順序。
- 桌機／手機 DOM marker 與邊界樣式是否仍存在。
- 是否有人把 `data-ui-surface` 的控制規則散落回其他 CSS。
- `scripts/check-game-modes.mjs` 是否能通過所有玩法 controller 與主要版本的抽卡契約。
- `scripts/check-survival-results.mjs` 是否能保證鎖定保留、避免跨組重複與只替換指定隊伍。
- 已搬出的控制列、手機 dashboard、活動 menu、modal 與推理解密函式是否被重新寫回 `app.js`。

手機圖片路徑必須以目前頁面為基準交給 `image-service.js` 解析，不能使用會越過 GitHub Pages 專案子目錄的 `/assets/...`。首頁只載入 480px 縮圖，僅預載最常使用的異境求生 1080px Banner；其他 Banner 進入活動後才載入。

`網站更新.command` 會在更新 generated data 後自動執行架構檢查。檢查失敗時，不應直接提高上限；先判斷新增內容應抽到哪個模組。

目前自動上限：

- `app.js` 最多 1800 行。
- `app.js` 頂層 `let` 最多 4 個；這 4 個只允許保存目前活動與牌組導航。
- `core`、`services` 與 `components` 單檔最多 400–500 行。

若新需求讓某個檔案接近上限，應依責任新增小模組，不能提高預算，也不能建立另一個包辦所有玩法的「新版 app」。

## 還可以逐步改善的部分

- `app.js` 仍保留四個導航狀態、玩法 context、抽卡生命週期與事件接線；這些是入口層合理責任。
- `main.css` 與 `mobile.css` 已接近預算，新增大型視覺功能時應放進 `styles/components/` 或 `styles/modes/`。
- 若日後新增第七種以上玩法，先新增 `modes/` controller 與對應元件，不要擴大 `drawResult()`。

每次只搬一類功能、不改行為，並在每一次搬移後完成瀏覽器驗證。
