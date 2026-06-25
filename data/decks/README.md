# DebateVision 獨立牌組 CSV

每個 CSV 都使用同一組欄位：

`deck_id, deck_label, deck_icon, name, description, icon, image, rarity, tags`

檔案對應：

- `worlds.csv`：異境卡，原本 `environments` 改名而來，適合「異境求生」。
- `locations.csv`：場地卡，依你提供的 30 張場地建立，適合「我在哪裡？」、「情境表演」、「角色任務」。
- `items.csv`：物品卡，原本 `items` 改名。
- `roles.csv`：職業卡，原本 `jobs` 改名。
- `creatures.csv`：生物卡，原本 `animals` 改名。

建議後續程式結構：

- 不再只讀 `data/lexicons.csv`。
- 改成讀 `data/decks/*.csv`。
- 每個玩法只指定需要抽哪些 deck，例如：
  - 異境求生：`worlds + items + roles + creatures`
  - 我在哪裡：`locations + roles + items`
