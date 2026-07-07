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

## 圖片欄位規則

卡牌 CSV 裡：

- `卡牌圖示`：抽出卡牌的大圖示。填 icon id，例如 `world_icon_zombie`。
- `抽選池圖示`：底下勾選池的小符號。可以填文字、符號或 emoji，例如 `✚`、`♡`、`文`。
- `圖片`：大圖，通常顯示在卡牌、抽卡機、場景展示。填 image id 或檔名，例如 `worlds_Zombie.png`。

不要把大圖塞進 `卡牌圖示` 欄。

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
