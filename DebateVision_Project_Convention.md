# DebateVision Project Convention v1.0

所有 AI、Codex、GPT、協作者開始前，請先讀：

```text
AI_START_HERE.md
```

本專案採用三層架構：

- `data/`：內容資料。使用者與 GPT 主要修改這裡。
- `assets/`：圖片、圖示、字體、UI 素材。AI 繪圖與視覺資產放這裡。
- `website/`：網站程式。Codex 主要修改這裡。

原則：內容、素材、網站彼此獨立，不互相污染。

## 開發前必讀

每次只必讀 `AI_START_HERE.md`。它會依任務類型指向需要的詳細規格。

不要在局部 UI、單張圖片或單一卡牌修改時預讀所有規格；只有新玩法、跨模組功能或重構才需要同時讀玩法與架構文件。

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
- 新增圖片：小圖示放 `assets/icons/{deck_id}/`；大圖放適合的 `assets/` 子資料夾。
- 新增玩法：新增 `data/modes/*.json`，並同步更新 `data/content/玩法文案.csv`。
- 改網站互動：改 `website/js/`。
- 改畫面：改 `website/styles/`。
- 不手動改 `data/generated/`，它由腳本產生。
- 新增功能或重構後執行 `node scripts/check-architecture.mjs`；若超過預算，拆模組，不直接提高上限。

## 新增玩法固定流程

新增玩法時至少要完成：

1. `data/modes/*.json`：玩法規則。
2. `data/content/玩法文案.csv`：玩法描述、教練提示、回合流程、必要時玩法背景。
3. `網站更新.command` 或 `node scripts/build-lexicons.mjs`：更新 `data/generated/`。

如果玩法使用新卡牌分類，例如只抽某種稀有度，也要在 JSON 裡明確設定，避免新卡污染舊玩法。

## 發布規則

根目錄的 `index.html` 是 GitHub Pages 入口，會導到 `website/`。

公開 commit 不使用個人真名與私人 email。建議：

```text
Name: DebateVision Builder
Email: GitHub noreply email
```
