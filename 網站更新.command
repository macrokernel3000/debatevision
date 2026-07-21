#!/bin/zsh
cd "$(dirname "$0")"

URL="http://127.0.0.1:5178/website/"

echo "正在更新辯語思界網站資料..."
CODEX_PYTHON="/Users/herry/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3"
if [ -x "$CODEX_PYTHON" ] && [ -f "./scripts/optimize-images.py" ]; then
  echo "正在最佳化大圖..."
  "$CODEX_PYTHON" ./scripts/optimize-images.py
fi

/usr/bin/env node ./scripts/build-lexicons.mjs

echo "正在檢查程式架構與所有玩法..."
if ! /usr/bin/env node ./scripts/check-architecture.mjs; then
  echo ""
  echo "架構檢查失敗，網站資料已產生，但程式需要先依提示拆分。"
  echo "按 Enter 結束。"
  read
  exit 1
fi

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
