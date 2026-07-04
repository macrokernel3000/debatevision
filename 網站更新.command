#!/bin/zsh
cd "$(dirname "$0")"

URL="http://127.0.0.1:5178/website/"

echo "正在更新辯語思界網站資料..."
/usr/bin/env node ./scripts/build-lexicons.mjs

echo ""
echo "網站資料已更新。"
echo "按 Enter 開啟網站。"
read

if curl -fsS "$URL" >/dev/null 2>&1; then
  open "$URL"
  exit 0
fi

open "$URL"
echo ""
echo "正在啟動本機網站預覽。"
echo "關閉這個視窗會停止本機預覽。"
python3 -m http.server 5178
