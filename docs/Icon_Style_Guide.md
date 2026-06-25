# Icon Style Guide

DebateVision 的卡牌圖片採用「教育桌遊 icon」風格。

## 核心風格

- Flat vector，扁平向量。
- 粗黑描邊，線條圓角。
- 單一物件置中，不放文字。
- 透明背景。
- 不使用寫實材質、複雜陰影、光暈或多風格混搭。

## 尺寸與格式

- 原始尺寸建議：1024 x 1024。
- 物件約佔畫面 70%。
- 四周保留約 15% 安全留白。
- 優先 SVG，其次 PNG / WebP。

## 資料夾

```text
assets/icons/items/
assets/icons/worlds/
assets/icons/roles/
assets/icons/creatures/
assets/icons/locations/
```

## 命名

使用英文小寫與底線：

- `item_hammer.svg`
- `item_flashlight.svg`
- `world_zombie_city.svg`
- `location_library.svg`
- `role_doctor.svg`
- `creature_wolf.svg`

## CSV 連結方式

CSV 的 `卡牌圖示` / `icon` 欄位只填 icon id，不填完整路徑。

```csv
items,物品卡,□,鐵錘,可以敲擊。,item_hammer,,普通,工具
```

網站會自動尋找：

```text
assets/icons/items/item_hammer.svg
```

若未來從 SVG 改成 PNG，卡牌內容不需要改，只要重跑建置或調整讀取規則。
