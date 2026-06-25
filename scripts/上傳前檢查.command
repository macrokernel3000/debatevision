#!/bin/zsh
cd "$(dirname "$0")/.."

echo "正在更新 DebateVision 詞庫..."
node scripts/build-lexicons.mjs

echo ""
echo "已完成。上傳 GitHub 前請確認這些類型的檔案："
echo ""
echo "1. 詞彙：data/cards/"
echo "2. 玩法：data/modes/"
echo "3. 自動產生資料：data/generated/decks.js、data/generated/modes.js"
echo "4. 圖片：assets/icons/、assets/backgrounds/"
echo "5. 網站程式：website/、index.html"
echo ""
echo "如果你用 GitHub Desktop，看到 .DS_Store 或 zip 不用管，.gitignore 會忽略。"
echo ""
read -k 1 "?按任意鍵關閉"

