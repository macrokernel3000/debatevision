# 卡牌圖示素材

這裡只放依牌組 ID 分類的卡牌圖示；完整卡圖可放在 `assets/cards/`，活動背景放在 `assets/backgrounds/`。

卡牌 CSV 的「卡牌圖示」可以直接填 Emoji 或 icon id；「圖片」可留空、填同牌組資料夾內的檔名，或填網站可用的相對路徑。例如：

```csv
items,物品卡,□,鐵錘,可以敲擊。,🔨,🔨,item_hammer,A,工具
```

建置器會依 `牌組ID` 尋找 `assets/icons/items/item_hammer.{png,webp,jpg,jpeg,svg}`。若 CSV 使用完整路徑，應寫成 `../assets/...`，不要使用會越過 GitHub Pages 專案目錄的 `/assets/...`。

修改後執行：

```bash
node scripts/check-data-contracts.mjs
node scripts/build-lexicons.mjs
node scripts/check-assets.mjs
```
