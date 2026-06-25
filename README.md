# DebateVision 辯語視界

Every Thought Begins with a Question. 思想始於思考。

這是一個可直接打開的辯論活動網原型，入口是 `index.html`。

如果你有啟動本機預覽，也可以開 `http://127.0.0.1:5178/`。

## 已有玩法

- 異境求生：抽環境與物品，學生說明物品如何在該環境中發揮作用。
- 存席辯護：抽環境與職業，學生說服大家自己最應該留下。
- 誰更重要：抽兩個物品，不給場景，直接比較誰更重要。
- 我在哪裡：秘密抽出環境，學生透過提問推理，最後由老師公布答案。

## 檔案分類

- `index.html`：頁面骨架。
- `styles/main.css`：畫面與手機、平板、電腦版面。
- `js/app.js`：抽卡、選場景、渲染卡牌。
- `js/modes.js`：活動玩法設定。
- `js/icons.js`：沒有圖片時使用的符號。
- `data/decks/*.csv`：你可以自己編輯或新增的分包詞庫。
- `data/lexicons.csv`：舊版單檔詞庫，沒有分包詞庫時才會使用。
- `scripts/build-lexicons.mjs`：把 CSV 轉成網站讀得懂的資料。
- `更新詞庫.command`：雙擊後自動更新詞庫。

## 新增或修改詞庫

請優先改 `data/decks/` 裡的 CSV。每一包一個類別，例如：

- `items.csv`：物品卡。
- `roles.csv`：職業卡。
- `worlds.csv`：異境卡。
- `locations.csv`：場地卡。
- `creatures.csv`：生物卡。

欄位說明：

- `deck_id`：類別代號，例如 `items`、`animals`、`jobs`。
- 目前核心類別包含 `items`、`roles`、`worlds`、`locations`、`creatures`。
- `deck_label`：類別顯示名稱，例如 `物品類`。
- `deck_icon`：類別預設符號。
- `name`：卡牌名稱。
- `description`：卡牌介紹。
- `icon`：單張卡的替代符號，可留空。
- `image`：單張卡圖路徑，可留空。
- `rarity`：稀有度，例如 `普通`、`稀有`、`傳說`。
- `tags`：標籤，用 `|` 分隔，例如 `求生|照明|工具`。

改完 CSV 後，雙擊 `更新詞庫.command`，再重新整理網頁。

新增類別時，只要在 `data/decks/` 放入新的 CSV，並使用相同欄位即可。網站會自動把它加入詞庫選單；只有新增全新玩法規則時，才需要改 `js/modes.js`。

## 卡牌圖片

可以把 TCG 風格圖片放到 `assets/cards/`，再在 CSV 的 `image` 欄位填入相對路徑，例如：

```csv
items,物品類,□,手槍,精準有效，只可惜你只有 7 發子彈。,⌖,./assets/cards/handgun.png,稀有,武器|有限資源
```

如果沒有圖片，網站會先用符號與卡面底圖顯示。之後可以用一個專門目標批次產生卡圖，再把圖片路徑填回 CSV。
