# Code Health Audit

Last checked: 2026-07-21

這份文件記錄 DebateVision 目前程式碼健康狀態與拆檔方向。它不是玩法規格，而是給之後維護網站程式的人看的整理筆記。

## 目前狀態

主要檔案大小：

- `website/js/app.js`：1774 行。只保留啟動、四個導航狀態、玩法 context、抽卡生命週期與事件接線；硬上限仍為 1800 行。
- `website/js/core/state.js`：建立分域 state；架構檢查禁止增加 `app.js` 頂層可變狀態。
- `website/js/core/ui-text.js`：generated 文案、預設文案與文字模板替換。
- `website/js/services/history-service.js`：最近紀錄儲存、十場上限與回放資料。
- `website/js/services/history-replay.js`：還原卡片提問、冒險分組與舊紀錄相容。
- `website/js/services/image-service.js`：圖片選擇、URL、fallback 與 image layout。
- `website/js/services/survival-result-service.js`：異境求生鎖定、資源交換、分組與指定隊伍重抽規則。
- `website/js/services/timer-service.js`：課堂計時器狀態與持久化。
- `website/js/components/class-timer.js`：課堂計時器 DOM、事件與顯示。
- `website/js/components/deck-controls.js`：桌機玩法版本、牌組摘要、鎖定與數量控制。
- `website/js/components/mode-shell.js`：活動選單、玩法 banner、背景圖與玩法畫面顯示切換。
- `website/js/components/mobile-dashboard.js`：手機各玩法設定的 view model 與 dashboard。
- `website/js/components/mobile-mode-images.js`：手機活動縮圖、Banner、skeleton、淡入與 fallback。
- `website/js/components/mobile-modals.js`：手機卡池編輯與卡牌美術預覽。
- `website/js/components/survival-result-controller.js`、`survival-battle-view.js`：正式結果狀態與冒險隊伍操作。
- `website/js/components/history.js`、`results.js`、`reel-view.js`：歷史、結果與抽卡機畫面。
- `website/js/components/card-dictionary.js`、`secret-place.js`：卡片字典與推理解密互動。
- `website/js/mobile-render.js`：手機版畫面生成入口，負責手機活動設定、卡組格、版本切換區與結果頁操作按鈕的 HTML。
- `website/js/mobile-app.js`：手機版操作流程入口，負責手機模式切換、卡組選擇、手機 modal、結果頁、底部導覽與紀錄展開。
- `website/styles/main.css`：約 3000 行。保留桌機、平板、共用元件與非手機專屬樣式。
- `website/styles/tokens.css`：共用顏色、間距、圓角與陰影。
- `website/styles/mobile.css`：手機版專屬樣式，負責手機首頁、手機活動卡、手機設定區、手機結果頁、手機底部導覽與手機 modal。
- `website/styles/components/class-timer.css`：計時器在桌機、平板與手機的完整樣式。
- `website/styles/viewport-boundaries.css`：桌機與手機 DOM 的顯示隔離，固定最後載入。
- `scripts/build-lexicons.mjs`：約 480 行。負責把 CSV / JSON 轉成網站可讀的 generated 檔，目前大小仍可接受。

目前網站仍是可維護狀態，但如果繼續新增玩法，應該先拆出比較清楚的模組。

## 這次已清理

- 移除已不使用的銷售密令舊渲染函式。
- 移除目前沒有任何玩法使用的 `roleEnvironment` 抽卡分支。
- 移除前端已不顯示的教練提示渲染殘留。
- 移除已沒有對應畫面的教練提示 CSS。
- 拆出第一批玩法抽卡控制器到 `website/js/modes/`。
- 拆出手機版渲染入口到 `website/js/mobile-render.js`。
- 拆出手機版事件入口到 `website/js/mobile-app.js`。
- 拆出手機版視覺規則到 `website/styles/mobile.css`。
- 拆出介面文字服務到 `website/js/core/ui-text.js`。
- 拆出課堂計時器到 `website/js/components/class-timer.js` 與對應 component CSS。
- 拆出歷史、圖片與計時器純邏輯到 `website/js/services/`。
- 建立 `website/js/core/state.js`，先搬純 UI 暫態與計時器 state；不一次搬動玩法狀態。
- 抽出 `website/styles/tokens.css`，保持原有視覺數值。
- 新增 `scripts/check-architecture.mjs`，用行數預算、載入順序與 viewport marker 防止入口檔再次膨脹。
- 抽離圖片編輯器、歷史、結果、卡片 hooks、卡片字典、抽卡機、推理解密、手機 modal 與手機 dashboard。
- 抽離桌機牌組控制列與活動 shell，`app.js` 從約 3120 行降到約 1680 行。
- 頂層 `let` 從 34 個降到 4 個，只保留目前活動與牌組導航。
- 架構守門已收緊為 `app.js` 1800 行、頂層 `let` 4 個，並禁止已抽離的大型函式回流。
- 新增歷史回放檢查，確保舊冒險紀錄仍能推回隊伍分組並恢復異境提問。
- 新增手機活動 WebP 縮圖與 Banner，首頁不再預先下載所有活動大圖與隱藏卡池圖。
- 新增異境求生結果鎖定、資源交換與單隊重新編組，狀態不依賴 DOM class。
- 新增 `scripts/check-survival-results.mjs`，守住鎖定、避免重複與單隊替換契約。

保留：

- `data/content/玩法文案.csv` 裡的教練提示與回合流程資料。這些仍屬於內容資料，未來可能重新用於老師手冊或備課模式。
- `data/content/介面文字.csv` 裡的舊文字列。若未來確定完全不用，再由內容整理時一起刪除。

## 優先拆檔方向

### 第一階段：拆 `app.js`

已先完成第一步：每個主要活動的「抽卡規則」已拆到 `website/js/modes/`。

目前已有：

```text
website/js/modes/
├── item-environment.js   # 異境求生
├── importance-duel.js    # 誰更重要
├── sales-command.js      # 銷售密令
├── metaphor-compass.js   # 隱喻羅盤
├── secret-place.js       # 推理解密
└── reality-summon.js     # 現實召喚
```

`website/js/app.js` 目前仍負責狀態、控制列與共用渲染，但 `drawResult()` 已改成先找對應玩法控制器。

手機版已經視為獨立操作模組。修改手機版時：

- 手機畫面 HTML 先看 `website/js/mobile-render.js`。
- 手機操作流程先看 `website/js/mobile-app.js`。
- 手機視覺先看 `website/styles/mobile.css`。
- 只有共用資料、抽卡核心、共用卡片 markup、桌機也會使用的狀態，才回到 `website/js/app.js`。
- 只有桌機/平板/共用元件樣式，才回到 `website/styles/main.css`。

小修採快速維修模式：先精準搜尋、最小修改、最小檢查；只有資料結構、CSV / JSON 或 generated 輸出受影響時才跑完整詞庫更新。

目前已形成下列結構：

```text
website/js/core/
├── state.js          # 分域 state factory
├── decks.js          # 卡池、勾選、抽選工具
├── card-hooks.js     # 卡片提問模板
└── ui-text.js        # generated 文案、預設文案與文字模板替換

website/js/components/
├── cards.js
├── deck-controls.js
├── mode-shell.js
├── mobile-dashboard.js
├── mobile-modals.js
├── history.js
├── results.js
├── reel-view.js
├── card-dictionary.js
├── secret-place.js
├── image-editor.js
└── class-timer.js

website/js/modes/
├── survival.js       # 異境求生
├── sales.js          # 銷售密令
├── metaphor.js       # 隱喻羅盤
├── secret-place.js   # 推理解密
├── summon.js         # 現實召喚
├── importance.js     # 誰更重要
└── dictionary.js     # 卡片字典
```

`website/js/app.js` 現在負責：

- 讀取 generated data。
- 初始化狀態。
- 綁定事件。
- 建立玩法 context、呼叫目前玩法 controller。
- 協調抽卡開始／完成與桌機、手機共同結果。

這是合理入口層責任；不要為了追求零行數而把它們搬成新的巨大協調檔。

### 第二階段：拆 `drawResult()`

`drawResult()` 已經先完成第一輪瘦身。它現在只負責呼叫對應玩法控制器；各玩法抽卡規則放在 `website/js/modes/`。

目前使用的概念是：

```js
const modeControllers = {
  itemEnvironment: survivalController,
  salesPitch: salesController,
  metaphorCompass: metaphorController,
  secretPlace: secretPlaceController,
  summonMission: summonController,
  importanceDuel: importanceController,
  cardDictionary: dictionaryController
};
```

每個 controller 自己處理：

- 控制列怎麼顯示。
- 抽卡前要檢查哪些卡池。
- 抽出後怎麼渲染。
- 最近十場要記錄哪些卡。

### 第三階段：拆 CSS

建議先改成：

```text
website/styles/
├── main.css              # 桌機、平板與共用樣式
├── mobile.css            # 手機版專屬樣式，已先拆出
├── base.css              # 變數、字體、全域
├── layout.css            # app-shell、header、section
├── components/
│   ├── activity-menu.css
│   ├── cards.css
│   ├── controls.css
│   ├── reel.css
│   ├── pools.css
│   └── timer.css
└── modes/
    ├── survival.css
    ├── sales.css
    ├── metaphor.css
    ├── secret-place.css
    ├── summon.css
    └── dictionary.css
```

CSS 拆檔時要特別小心手機版，不要只在桌機寬度檢查。

## 後續觀察

目前比較像冗餘或可整理的地方：

- 版本按鈕、卡池按鈕與鎖定卡片已由 `deck-controls.js` 和 `deck-option-cards.js` 共用。
- 卡牌 hooks 已集中到 `core/card-hooks.js`。
- 活動卡、手機選單、大黑卡都使用同一批玩法名稱與短句，資料已經往 CSV 集中，之後應繼續維持。
- 圖片 layout 編輯器已獨立到 `components/image-editor.js`。

## 每次重構後必做檢查

至少執行：

```bash
node scripts/check-architecture.mjs
node --check website/js/app.js
node --check scripts/build-lexicons.mjs
node scripts/build-lexicons.mjs
```

如果拆成 ES modules，還要啟動本機網站並檢查：

- 桌機版：活動切換、抽卡、重置、最近十場。
- 手機版：活動列表、橫向活動卡、抽卡控制、計時器遮擋。
- `?edit=1`：圖片調整器仍能開啟與匯出。

## 重構原則

- 先搬移，不改行為。
- 一次只拆一類功能。
- 每拆完一段都先跑語法檢查。
- 不手改 `data/generated/`，除非剛執行完更新腳本。
- 任何畫面改動都要同時想桌機、平板、手機。
