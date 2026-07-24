# AI Project Map

這是給 AI 快速定位檔案的專案地圖。一般工作先讀根目錄 `AI_START_HERE.md`；只有需要知道載入關係、資料契約或檢查範圍時才讀本文件。

## 唯一真實來源

| 內容 | 唯一應修改位置 | 產生或消費位置 |
| --- | --- | --- |
| 卡牌內容與 Emoji | `data/cards/*.csv` | `data/generated/decks.js` |
| 玩法結構與牌組關係 | `data/modes/*.json` | `data/generated/modes.js` |
| 玩法、介面、手機文字 | `data/content/*.csv` | `data/generated/modes.js`、`ui-texts.js` |
| 圖片版位 | `data/image-layouts/*.json` | `data/generated/image-layouts.js` |
| 圖片與圖示 | `assets/` | `image-service.js` 與卡片元件 |

`data/generated/` 永遠不是編輯入口。來源資料改完後執行 `node scripts/build-lexicons.mjs`。

## 程式載入方向

```text
generated data
  -> mode controllers / core
  -> services
  -> render components
  -> app.js orchestration
  -> mobile-app.js event bridge
```

瀏覽器的實際順序以 `website/index.html` 為準，`scripts/check-architecture.mjs` 會檢查必要依賴順序。

## 按任務定位

| 任務 | 第一個檔案 | 常見相鄰檔案 | 對應檢查 |
| --- | --- | --- | --- |
| 修改一個牌組 | 該 `data/cards/*.csv` | `Card_Data_Specification.md` | `check-data-contracts`、`build-lexicons` |
| 修改玩法抽卡 | `website/js/modes/{mode}.js` | 對應 JSON、結果 component | `check-game-modes` |
| 修改桌面玩法畫面 | 對應 component | `styles/components/` 或 `styles/modes/` | 語法＋目標桌面畫面 |
| 修改手機玩法畫面 | `mobile-render.js` | `mobile-dashboard.js`、`mobile-app.js`、`mobile.css` | 390px＋相鄰邊界 |
| 修改歷史 | `history-service.js` | `history-replay.js`、`history.js` | `check-history-replay` |
| 修改異境冒險分組 | `survival-result-service.js` | controller、battle view | `check-survival-results` |
| 修改圖片 | `image-service.js` 或來源資料 | image editor、對應 CSS | 目標畫面缺圖檢查 |
| 新增玩法 | `data/modes/*.json` | mode controller、component、內容 CSV | 完整架構與三尺寸回歸 |

## 六個玩法 controller

| `cardMode` | 檔案 | 主要狀態／畫面 |
| --- | --- | --- |
| `itemEnvironment` | `modes/item-environment.js` | survival state、survival result |
| `summonMission` | `modes/reality-summon.js` | summon selection |
| `importanceDuel` | `modes/importance-duel.js` | importance selection |
| `salesPitch` | `modes/sales-command.js` | sales state、deck controls |
| `metaphorCompass` | `modes/metaphor-compass.js` | metaphor state、deck controls |
| `secretPlace` | `modes/secret-place.js` | secret-place controller/view |

`cardDictionary` 是工具型玩法，沒有抽卡 controller。

## 檢查層級

- 卡牌或內容資料：`node scripts/check-data-contracts.mjs`，再建置 generated data。
- 單一玩法邏輯：`node scripts/check-game-modes.mjs`。
- 歷史或冒險狀態：跑各自的專用檢查。
- 新功能、拆檔、共用結構：只需執行 `node scripts/check-architecture.mjs`；它會包含上述主要 smoke checks。
- UI：程式檢查不能取代瀏覽器，依受影響裝置實測。

## 不應優先閱讀

- `docs/archive/legacy/`：只供追溯，不是現行資料。
- `data/generated/`：大型自動產生檔，只在除錯生成結果時搜尋特定 key。
- `mobile-audit/`、`outputs/`、`tmp/`：產出或暫存，不是網站執行來源。
- `docs/Teacher_Manual.md`：教師使用說明，不是程式架構規格。

根目錄 `.rgignore` 已預設排除上述大型或非執行來源；真的需要搜尋時使用 `rg --no-ignore` 指定範圍，不要移除忽略規則。
