#!/bin/zsh
cd "$(dirname "$0")"
/usr/bin/env node ./scripts/build-lexicons.mjs
echo ""
echo "詞庫已更新。你可以關閉這個視窗，重新整理網頁。"
read -k 1 "?按任意鍵關閉"
