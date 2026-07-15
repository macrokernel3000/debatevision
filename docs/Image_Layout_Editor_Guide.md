# 圖片微調器使用說明

DebateVision 目前採用「半後台」模式：網站可以即時調整圖片位置，但最後仍由你把設定存回專案檔案。

## 開啟方式

正常使用：

```text
http://127.0.0.1:5178/website/
```

圖片編輯模式：

```text
http://127.0.0.1:5178/website/?edit=1
```

## 使用流程

1. 進入 `?edit=1`。
2. 點選想調整的圖片。
3. 可調整的圖片包含：
   - 上方活動大圖
   - 抽卡機中的異境圖
   - 下方卡牌圖片
4. 使用縮放、左右、上下、旋轉、蒙版控制。
5. 按「匯出 JSON」。
6. 將匯出的內容貼到提示中的檔案，例如：

```text
data/image-layouts/items.json
```

常見檔案：

```text
data/image-layouts/modes.json   # 上方活動大圖
data/image-layouts/worlds.json  # 異境卡與抽卡機異境圖
data/image-layouts/items.json   # 物品卡圖片
```

7. 雙擊「網站更新.command」。

## 設定格式

```json
{
  "item_小風扇": {
    "scale": 1.2,
    "x": 8,
    "y": -10,
    "rotate": 0,
    "overlay": 0.28
  }
}
```

沒有設定的圖片會使用預設值：

```json
{ "scale": 1, "x": 0, "y": 0, "rotate": 0, "overlay": 0.28 }
```

`overlay` 是蒙版強度，範圍從 `0` 到 `0.8`。數字越大，圖片越暗；數字越小，投影時越能保留原圖細節。

## 設計原則

CSV 只放內容與圖片 ID。

圖片檔放在 `assets/`。

圖片位置、大小、旋轉與蒙版強度放在 `data/image-layouts/`。

這樣內容、素材、呈現設定會分開，未來比較容易維護。
