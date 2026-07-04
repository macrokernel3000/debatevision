# Website Text CSV Guide

網站上的玩法文字可以在這裡修改：

```text
data/content/玩法文案.csv
```

改完後雙擊：

```text
網站更新.command
```

網站會重新產生：

```text
data/generated/modes.js
```

## 欄位說明

```text
玩法ID,欄位,序號,標題,內容
```

- `玩法ID`：對應玩法，例如 `item-survival`、`role-survival`。
- `欄位`：可以填 `玩法描述`、`教練提示`、`回合流程`。
- `欄位`：也可以填 `玩法背景`，用來換上方玩法首頁大圖。
- `序號`：顯示順序。
- `標題`：教練提示的小標題。玩法描述與流程可以留空。
- `內容`：實際顯示文字。

## 可以改哪些文字

### 玩法描述

畫面上的玩法說明，例如：

```text
先抽異境，再抽物品。學生要說明這個物品在該環境中如何救命、突破困境或製造優勢。
```

### 教練提示

每一列是一個提示區塊：

```text
item-survival,教練提示,1,環境限制,這個異境最麻煩的生存條件是什麼？
```

### 回合流程

每一列是一個流程步驟：

```text
item-survival,回合流程,1,,抽 1 個異境
```

## 不建議新手改的地方

玩法抽什麼牌組、卡牌邏輯、固定抽幾張，目前仍放在：

```text
data/modes/*.json
```

這些比較像網站規則，不是普通文字。

## 玩法首頁背景圖

像「我在哪裡」上方的大圖，請放在：

```text
assets/backgrounds/modes/
```

再到對應的 `data/modes/*.json` 裡設定：
然後在 `data/content/玩法文案.csv` 新增或修改：

```text
where-am-i,玩法背景,1,,../assets/backgrounds/modes/where-am-i.png
```

其他玩法也可以加同樣欄位；如果 `內容` 留空，就會顯示原本內建背景。

也可以到對應的 `data/modes/*.json` 裡設定：

```json
"image": "../assets/backgrounds/modes/where-am-i.png"
```

新手建議優先改 CSV。這種圖片是玩法首頁背景，不是卡牌圖示。
