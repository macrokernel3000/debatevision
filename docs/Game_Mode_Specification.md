# Game Mode Specification

玩法 JSON 放在：

```text
data/modes/
```

每一個 JSON 是一種玩法。

## 基本欄位

```json
{
  "id": "item-survival",
  "order": 1,
  "title": "異境求生",
  "icon": "◆",
  "tone": "danger",
  "track": "異境 × 物品",
  "primaryDeck": "items",
  "secondaryDeck": "worlds",
  "primaryLabel": "物品卡",
  "secondaryLabel": "異境卡",
  "drawLabel": "抽出求生組合",
  "cardMode": "itemEnvironment",
  "description": "先抽異境，再抽物品。",
  "prompts": [],
  "flow": []
}
```

## 重要欄位

- `id`：玩法 ID，英文小寫與連字號。
- `order`：玩法顯示順序。
- `title`：玩法名稱。
- `primaryDeck`：主要抽選牌組。
- `secondaryDeck`：第二抽選牌組，可空字串。
- `cardMode`：網站渲染與抽選邏輯。
- `fixedCount`：固定抽卡數，例如 `2`。
- `image / backgroundImage`：玩法選擇區的大背景圖，可留空。建議使用橫向圖，放在 `assets/backgrounds/modes/`。
- `prompts`：教練提示。
- `flow`：回合流程。
- `cardHooks`：抽出卡牌下方的任務句。通常由 `data/content/玩法文案.csv` 的 `卡牌任務` 產生，不建議手動寫在 JSON。

## 玩法生命週期

每個玩法都應該清楚設計四個階段：

- `setup`：開始前設定，例如選卡池、抽取數量、秘密編號。
- `active`：活動進行中，學生正在說明、提問或說服。
- `result`：公布答案、抽出卡牌、完成比較或投票。
- `restart`：再來一場，不需要重新整理網頁。

目前生命週期文字先放在：

```text
website/js/mode-lifecycle.js
```

未來若需要讓老師自行改這些狀態文字，可以再移到 CSV。

## 目前支援的 cardMode

- `itemEnvironment`：環境 + 主要卡。可用 `variantDecks` 讓老師切換主要卡，例如道具或職業。
- `roleDefense`：純職業辯護，不自動抽異境。舊玩法可用，但目前前台沒有獨立啟用。
- `roleEnvironment`：環境 + 職業。舊模式仍可用，但目前前台沒有獨立啟用。
- `importanceDuel`：兩張卡牌對決。預設會自動讀取所有可用牌組，新增牌組後不需要再手動修改玩法設定；目前會排除 `needs` 這種由概念卡衍生出的虛擬需求池。
- `salesPitch`：銷售密令。供需版使用商品與需求，故事版使用商品與概念，目標版會自動列出適合當客戶或對象的卡池。
- `secretPlace`：秘密詞條推理。推理解密使用這個模式，可從可用詞庫中選擇候選卡。
- `metaphorCompass`：抽 2 張概念卡與 1 張關係卡，組成「A 關係 C」的隱喻命題。
- `summonMission`：先固定抽 1 張第二牌組作為任務，再抽 1 到 6 張主要牌組作為可辯護角色或方案。
- `cardDictionary`：獨立的自由組合玩法。前台列出所有卡池，老師勾選多個卡池後，從每個卡池各抽一張。

如果新增玩法只是在更換牌組，可以只新增 JSON。若需要全新抽選或呈現方式，才需要改 `website/js/app.js`。

## 卡池自動化原則

除非玩法有明確特殊限制，前台應該自動讀取目前存在的卡池，而不是在 JSON 或 JS 裡手寫完整清單。

目前自動卡池規則：

- `importanceDuel` 會自動列出所有真實卡池，排除 `needs` 這種由概念卡衍生出的虛擬池。
- `secretPlace` 會自動列出所有真實卡池，讓老師用任意詞庫玩推理解密。
- `cardDictionary` 會自動列出所有真實卡池，方便老師自由挑選。
- `salesPitch` 的供需版仍明確使用 `needs`，故事版仍明確使用 `concepts`，目標版則自動列出適合當目標對象的卡池。
- `needs` 是從概念卡中篩選出來的虛擬需求池，不應在一般全卡池玩法中重複出現。

新增 `data/cards/*.csv` 牌組後，只要更新生成檔，以上玩法就應該自動看見新卡池。刪除牌組後，也不應留下已不存在的選項。

## 抽選池規則

網站上的「本局抽選池」不是單純預覽，而是這一局實際可能抽到的卡牌。老師可以在開始前勾選或取消卡牌，已經抽過的卡牌會自動取消勾選，避免同一局重複抽到。

`itemEnvironment` 與 `roleEnvironment` 會把 `secondaryDeck` 當作獨立異境區，每次只抽 1 張；`primaryDeck` 則是本局主要抽選池。若設定 `variantDecks`，前台會顯示切換按鈕，讓老師改抽不同主牌組。

`itemEnvironment` 在前台支援「鎖定異境」。勾選後會沿用目前的 `secondaryDeck` 卡，只重抽主要卡；若尚未有目前異境，第一次仍會先抽出異境。

`importanceDuel` 不需要異境區，會直接從選定牌組抽出兩張進行比較。目前 `誰更重要` 的預設主要牌組是 `celebrities`，也就是名人卡；它會自動列出目前所有可用牌組，方便老師切換成物品卡、概念卡、異境卡、場地卡、職業卡、生物卡或未來新增的牌組。`needs` 是從概念卡衍生出的需求池，不在這個玩法中獨立顯示。

`secretPlace` 會自動讀取目前所有真實卡池作為候選詞庫。例如推理解密可以同一套玩法切換名人卡、場地卡、異境卡、物品卡、職業卡、生物卡，或未來新增的牌組。

`metaphorCompass` 預設使用 `concepts` 作為 `primaryDeck`，使用 `relations` 作為 `secondaryDeck`。前台會固定抽 2 張概念卡與 1 張關係卡，並用專用版型顯示成一句命題。

`metaphorCompass` 可設定 `metaphorDecks`，讓前綴與後綴分別從不同牌組抽取。目前隱喻羅盤設定為 `["concepts", "needs"]`，其中 `needs` 是從概念卡篩選 `稀有度 = 需求` 的虛擬需求池，所以老師可以選擇「概念卡 → 概念卡」、「概念卡 → 需求分類」、「需求分類 → 概念卡」或「需求分類 → 需求分類」。

`metaphorCompass` 支援三個前台鎖定狀態：前綴、介係、後綴。鎖定後會沿用上一輪對應位置的卡牌，只重抽未鎖定的位置。第一輪尚未抽出命題前，鎖定按鈕會保持不可用。

## 新增玩法時必須同步文案 CSV

新增或改玩法 JSON 後，必須同步更新：

```text
data/content/玩法文案.csv
```

至少要加入：

- `玩法描述`
- `教練提示`
- `回合流程`

如果有玩法大圖，也可以加：

- `玩法背景`

JSON 是規則，CSV 是老師容易修改的前台文字。兩者缺一不可。
