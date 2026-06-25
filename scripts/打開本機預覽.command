#!/bin/zsh
cd "$(dirname "$0")/.."

URL="http://127.0.0.1:5178/website/"

if curl -fsS "$URL" >/dev/null 2>&1; then
  open "$URL"
  echo "本機預覽已開啟：$URL"
  read -k 1 "?按任意鍵關閉"
  exit 0
fi

open "$URL"
echo "正在啟動 DebateVision 本機預覽：$URL"
echo "關閉這個視窗會停止本機預覽。"
python3 -m http.server 5178
