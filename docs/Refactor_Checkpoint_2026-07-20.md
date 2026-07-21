# DebateVision 拆檔結案紀錄（2026-07-20）

狀態：本階段模組化與完整回歸已完成。後續新增功能或卡牌時，應沿用現有模組邊界與架構檢查，不要把功能重新堆回 `app.js`。

## 完成結果

- `website/js/app.js` 由約 2800 行降至 1702 行。
- 頂層 `let` 由 34 個降至 4 個，只保留活動／牌組導航協調狀態：
  - `activeMode`
  - `activeLibrary`
  - `activeSecondaryLibrary`
  - `activePreview`
- 架構守門上限已收緊為：
  - `app.js` 最多 1800 行。
  - `app.js` 頂層狀態最多 4 個。
  - 已抽離的桌機牌組控制、手機儀表板、活動選單、手機 modal、推理解密與歷史回放，不得重新塞回 `app.js`。

## 現行模組邊界

- 狀態：`website/js/core/state.js` 與各玩法 domain state。
- 牌組與文字：`website/js/core/decks.js`、`card-hooks.js`、`ui-text.js`。
- 六玩法抽卡：`website/js/modes/`。
- 卡片與結果畫面：`website/js/components/cards.js`、`results.js`。
- 桌機牌組控制：`website/js/components/deck-controls.js`。
- 手機儀表板與 modal：`website/js/components/mobile-dashboard.js`、`mobile-modals.js`。
- 活動選單與桌手機殼層：`website/js/components/mode-shell.js`。
- 圖片路徑、fallback、版位與編輯器：`website/js/services/image-service.js`、`website/js/components/image-editor.js`。
- 歷史保存、畫面與舊紀錄相容回放：`history-service.js`、`history-replay.js`、`components/history.js`。
- 計時器：`timer-service.js`、`components/class-timer.js`。
- 卡片字典、抽卡機、推理解密與冒險分組：各自位於 `website/js/components/`。
- 手機協調：`website/js/mobile-app.js`、`mobile-render.js`。
- 共用視覺變數：`website/styles/tokens.css`。

## 自動檢查

- 全部 JavaScript／MJS 語法檢查通過。
- `scripts/build-lexicons.mjs` 重新產生資料成功。
- `scripts/check-architecture.mjs` 通過：
  - `app.js` 1703/1800（檢查器含尾端換行計數）。
  - 頂層狀態 4/4。
  - 所有 component、service、mode 均在各自預算內。
- `scripts/check-game-modes.mjs` 通過六玩法與全部變體。
- `scripts/check-history-replay.mjs` 通過：
  - 舊冒險紀錄可推回分組。
  - 新紀錄保存分組設定。
  - 回放卡片能重新套用異境提問。

## 實機回歸

- 桌機 1440：
  - 異境求生、現實召喚、誰更重要、銷售密令三版、隱喻羅盤三版、推理解密皆可操作與抽卡。
  - 卡片字典可選牌、儲存、移除與清空。
  - 歷史區只顯示約五場高度並可捲動；舊冒險紀錄能還原分組與異境名稱。
  - 計時器可開啟、開始、暫停與重置。
  - `?edit=1` 圖片編輯器可載入並選取活動圖片。
- 手機 390×844：
  - 異境求生挑戰版預設各類一張，分組與再次挑戰正常。
  - 隱喻羅盤切版與抽卡正常。
  - 卡片編輯 modal、美術預覽與卡片字典正常。
- 平板 768×1024：
  - 使用桌機版面，桌手機區塊不重疊，沒有水平溢出，抽卡正常。
- 最終頁面缺圖數為 0，瀏覽器無 error／warning。

## 後續新增規則

1. 新玩法放進 `website/js/modes/`，不要直接把完整抽卡流程寫進 `app.js`。
2. 新畫面元件放進 `website/js/components/`；資料保存、圖片或計時等能力放進 `website/js/services/`。
3. 手機與桌機可共用資料與 controller，但畫面排版分別維護，避免互相覆蓋。
4. 新卡牌仍從 CSV／產生資料流程加入，不在畫面程式內硬編卡片。
5. 每次修改至少執行 `node scripts/check-architecture.mjs`；涉及玩法或歷史時，再執行對應 smoke check。
6. 若真的需要提高任何行數預算，必須先在 `docs/Code_Health_Audit.md` 說明原因，不能只為了讓檢查通過而調高。
