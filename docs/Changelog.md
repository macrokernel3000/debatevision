# Changelog

## v1.0 Foundation

- 採用 Content / Assets / Website 三層架構。
- 牌組 CSV 移到 `data/cards/`。
- 玩法設定移到 `data/modes/`。
- 自動生成檔移到 `data/generated/`。
- 網站程式移到 `website/`。
- 根目錄 `index.html` 保留作為 GitHub Pages 入口。
- CSV 的 icon 欄位改成可填 icon id，網站自動對應 `assets/icons/{deck_id}/{icon}.svg`。
- 舊版單檔詞庫移到 `docs/archive/legacy/`。
