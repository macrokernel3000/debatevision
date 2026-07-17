# Card Data Specification

CSV 只負責內容，不負責網站邏輯。

## 放置位置

所有牌組放在：

```text
data/cards/
```

每一個 CSV 是一個牌組，例如：

- `異境卡.csv`
- `場地卡.csv`
- `物品卡.csv`
- `職業卡.csv`
- `生物卡.csv`
- `名人卡.csv`
- `概念卡.csv`
- `關係卡.csv`

## 欄位

支援中文欄位與英文欄位。建議使用中文欄位：

```csv
牌組ID,牌組名稱,牌組圖示,卡牌名稱,說明,卡牌圖示,抽選池圖示,圖片,稀有度,標籤
```

對應英文欄位：

```csv
deck_id,deck_label,deck_icon,name,description,icon,token_icon,image,rarity,tags
```

## 欄位說明

- `牌組ID / deck_id`：程式用 ID，例如 `items`、`celebrities`。
- `牌組名稱 / deck_label`：畫面顯示名稱，例如 `物品卡`。
- `牌組圖示 / deck_icon`：沒有單張圖示時的預設符號。
- `卡牌名稱 / name`：卡牌名稱。
- `說明 / description`：卡牌文字。
- `卡牌圖示 / icon`：抽出卡牌上的主要圖示。建議填圖片 id，例如 `item_hammer` 或 `item_捕鼠夾`。可以不填副檔名；若已經填成 `item_捕鼠夾.png`，網站也會自動辨識。若找不到同名圖片，會當成文字或符號顯示。
- `抽選池圖示 / token_icon`：底下抽選池的小符號。可以直接填文字、符號或 emoji，例如 `✚`、`♡`、`文`、`🧠`。留空時會優先使用卡牌圖片；沒有圖片時使用網站內建符號或牌組圖示。
- `圖片 / image`：特殊圖片路徑。一般物品卡可留空；異境卡、場地卡建議可放 16:9 橫向場景圖。
- `稀有度 / rarity`：依各 CSV 既有分類使用。多數舊牌組可用 `A`、`B`、`C`；物品卡可用 `N` 標示道具卡；召喚卡使用 `異族`、`超能`、`特職`；概念卡目前使用 `概念`、`需求` 來區分抽象概念與需求動機。留空時網站會當作 `C`。
- `標籤 / tags`：用 `|` 分隔。

## 既有牌組格式優先

上面的欄位說明是通用建議。修改既有 CSV 時，必須以該檔案目前實際用法為準，保留使用者已經建立的分類方式、emoji 位置與欄位語意，不要自動改回通用格式。

例如 `召喚卡.csv` 目前使用：

- `卡牌圖示`：emoji。
- `抽選池圖示`：同一張卡的簡單 emoji。
- `稀有度`：分類簡稱，例如 `異族`、`超能`、`特職`。
- `標籤`：第一個標籤是完整分類，例如 `異族類`、`超能類`、`特職類`。

新增或改召喚卡時，要照這個 CSV 的現況追加，不能把 `稀有度` 改回 `A/B/C`，也不能清空使用者已補好的 emoji。

## 圖片規則

CSV 的 `卡牌圖示 / icon` 不寫副檔名，也不寫完整路徑。網站會依照牌組自動尋找圖片：

```text
assets/icons/{deck_id}/{icon}.svg
assets/icons/{deck_id}/{icon}.png
assets/icons/{deck_id}/{icon}.webp
assets/icons/{deck_id}/{icon}.jpg
assets/icons/{deck_id}/{icon}.jpeg
```

例如 `deck_id` 是 `items`，`icon` 是 `item_捕鼠夾`，網站會優先尋找：

```text
assets/icons/items/item_捕鼠夾.png
```

所以之後你新增圖片時，只要讓 CSV 的 `卡牌圖示` 跟圖片檔名一致即可，不需要改網站程式。

如果是異境卡或場地卡的橫向大圖，可以放在 `assets/backgrounds/worlds/` 或 `assets/backgrounds/locations/`，再於 CSV 的 `圖片 / image` 欄填相對網站的路徑，例如：

```csv
worlds,異境卡,◎,殭屍末日,城市秩序崩潰,,../assets/backgrounds/worlds/zombie-apocalypse.png,A,危機|城市|生存
```

## 新增牌組

新增一個 CSV 到 `data/cards/`，使用相同欄位。只要 `deck_id` 是新的，網站會自動把它當作新類別讀入。

新增牌組不需要改網站程式。只有玩法想指定這個牌組時，才需要修改或新增 `data/modes/*.json`。

例如名人卡使用：

```text
deck_id = celebrities
deck_label = 名人卡
```

需求內容不再獨立維護 `需求卡.csv`。需要「需求卡」邏輯的玩法，會從 `概念卡.csv` 中篩選 `稀有度 = 需求` 的卡片作為需求池。

例如概念卡使用：

```text
deck_id = concepts
deck_label = 概念卡
```

概念卡放抽象詞與需求動機，例如正義、自律、選擇、知識、勇氣、歸屬、安全。原本概念卡的 `稀有度` 標為 `概念`，從需求卡併入的內容標為 `需求`。它主要給「隱喻羅盤」使用，但也可以被誰更重要或推理解密拿來當詞庫。

例如關係卡使用：

```text
deck_id = relations
deck_label = 關係卡
```

關係卡放中間連接詞，例如就是、幫助、勝於、來自、定義。它不是場景，也不是物品，主要用來把兩張概念卡組成一句命題。
