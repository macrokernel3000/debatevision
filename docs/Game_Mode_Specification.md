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

## 目前支援的 cardMode

- `itemEnvironment`：環境 + 物品。
- `roleEnvironment`：環境 + 職業。
- `importanceDuel`：兩張物品對決。
- `salesPitch`：抽 1 張物品，練需求、客群、銷售故事。
- `secretPlace`：秘密場地推理。

如果新增玩法只是在更換牌組，可以只新增 JSON。若需要全新抽選或呈現方式，才需要改 `website/js/app.js`。

## 抽選池規則

網站上的「本局抽選池」不是單純預覽，而是這一局實際可能抽到的卡牌。老師可以在開始前勾選或取消卡牌，已經抽過的卡牌會自動取消勾選，避免同一局重複抽到。

`itemEnvironment` 與 `roleEnvironment` 會把 `secondaryDeck` 當作獨立異境區，每次只抽 1 張；`primaryDeck` 則是本局主要抽選池，例如物品卡或職業卡。

`importanceDuel` 不需要異境區，會直接從主要牌組抽出兩張進行比較。

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
