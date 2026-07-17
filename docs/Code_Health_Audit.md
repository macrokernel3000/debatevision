# Code Health Audit

Last checked: 2026-07-17

這份文件記錄 DebateVision 目前程式碼健康狀態與拆檔方向。它不是玩法規格，而是給之後維護網站程式的人看的整理筆記。

## 目前狀態

主要檔案大小：

- `website/js/app.js`：約 2800 行。已經可以運作，但狀態管理、抽卡規則、畫面渲染、圖片編輯器、計時器都集中在同一個檔案。
- `website/styles/main.css`：約 2600 行。基本樣式、元件樣式、玩法專屬樣式與手機版調整都集中在同一個檔案。
- `scripts/build-lexicons.mjs`：約 480 行。負責把 CSV / JSON 轉成網站可讀的 generated 檔，目前大小仍可接受。

目前網站仍是可維護狀態，但如果繼續新增玩法，應該先拆出比較清楚的模組。

## 這次已清理

- 移除已不使用的銷售密令舊渲染函式。
- 移除目前沒有任何玩法使用的 `roleEnvironment` 抽卡分支。
- 移除前端已不顯示的教練提示渲染殘留。
- 移除已沒有對應畫面的教練提示 CSS。
- 拆出第一批玩法抽卡控制器到 `website/js/modes/`。

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

下一步再把 `app.js` 拆成下列區塊：

```text
website/js/core/
├── state.js          # 全域狀態與模式切換
├── decks.js          # 卡池、勾選、抽選工具
├── history.js        # 最近十場紀錄
├── text.js           # uiText、玩法狀態文字
└── timer.js          # 浮動計時器

website/js/components/
├── cards.js          # cardMarkup、tokenIconMarkup
├── reel.js           # 抽卡機與大黑卡
├── pools.js          # 抽選池、篩選按鈕
├── activity-menu.js  # 手機活動列表與活動卡
└── image-editor.js   # ?edit=1 圖片位置編輯器

website/js/modes/
├── survival.js       # 異境求生
├── sales.js          # 銷售密令
├── metaphor.js       # 隱喻羅盤
├── secret-place.js   # 推理解密
├── summon.js         # 現實召喚
├── importance.js     # 誰更重要
└── dictionary.js     # 卡片字典
```

`website/js/app.js` 最後應該只負責：

- 讀取 generated data。
- 初始化狀態。
- 綁定事件。
- 呼叫目前玩法的 controller。

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
├── main.css              # 只 import 其他檔案
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

## 冗餘觀察

目前比較像冗餘或可整理的地方：

- 多個玩法都有類似的「版本按鈕」、「卡池按鈕」、「鎖定卡片」邏輯，可以抽成共用元件。
- 卡牌 hooks 目前散在多個函式中，例如異境、銷售、現實召喚都各自做模板替換。未來可以集中成 `buildHooks()` 的設定表。
- 活動卡、手機選單、大黑卡都使用同一批玩法名稱與短句，資料已經往 CSV 集中，之後應繼續維持。
- 圖片 layout 編輯器已經功能完整，但和主流程放在同一個檔案，適合獨立出去。

## 每次重構後必做檢查

至少執行：

```bash
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
