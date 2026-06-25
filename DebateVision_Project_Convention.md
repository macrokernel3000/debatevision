# DebateVision Project Convention v1.0

本專案採用三層架構：

- `data/`：內容資料。使用者與 GPT 主要修改這裡。
- `assets/`：圖片、圖示、字體、UI 素材。AI 繪圖與視覺資產放這裡。
- `website/`：網站程式。Codex 主要修改這裡。

原則：內容、素材、網站彼此獨立，不互相污染。

## 開發前必讀

每次擴充 DebateVision 時，請先讀：

- `docs/Project_Convention.md`
- `docs/Icon_Style_Guide.md`
- `docs/Card_Data_Specification.md`
- `docs/Game_Mode_Specification.md`

## 目前標準結構

```text
DebateVision/
├── README.md
├── DebateVision_Project_Convention.md
├── index.html
├── data/
│   ├── cards/
│   ├── modes/
│   └── generated/
├── assets/
│   ├── icons/
│   ├── backgrounds/
│   ├── ui/
│   └── fonts/
├── website/
│   ├── index.html
│   ├── js/
│   ├── styles/
│   └── pages/
├── scripts/
└── docs/
```

## 核心規則

- 新增卡牌內容：改 `data/cards/*.csv`。
- 新增圖片：放 `assets/icons/{deck_id}/` 或其他 `assets/` 子資料夾。
- 新增玩法：新增 `data/modes/*.json`。
- 改網站互動：改 `website/js/`。
- 改畫面：改 `website/styles/`。
- 不手動改 `data/generated/`，它由腳本產生。

## 發布規則

根目錄的 `index.html` 是 GitHub Pages 入口，會導到 `website/`。

公開 commit 不使用個人真名與私人 email。建議：

```text
Name: DebateVision Builder
Email: GitHub noreply email
```
