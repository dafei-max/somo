#!/usr/bin/env bash
# 验证多轮对话 workflow 是否正常接入
# 用法: bash test-workflow.sh

SESSION="test-$(date +%s)"
BASE="http://localhost:3001"

echo "=========================================="
echo " Somo × Workflow 多轮对话验证"
echo " sessionId: $SESSION"
echo "=========================================="

send() {
  local turn=$1
  local text=$2
  local history=$3
  echo ""
  echo "── 第 $turn 轮 ────────────────────────────"
  echo "用户: $text"
  local resp
  resp=$(curl -s -X POST "$BASE/api/chat" \
    -H "Content-Type: application/json" \
    -d "{\"sessionId\":\"$SESSION\",\"text\":\"$text\",\"history\":$history}" \
    --max-time 30)
  echo "返回:"
  echo "$resp" | python3 -m json.tool 2>/dev/null || echo "$resp"
}

# 第一轮：冷启动（空历史）
send 1 "最近睡不好，脑子里总是转个不停" "[]"

# 第二轮：带上历史（这里简化，实际 App 会自动携带）
send 2 "就是很多事情没做完，放不下" "[]"

# 第三轮：测试一下正向情绪
send 3 "今天终于把那个项目交掉了，整个人轻松了好多" "[]"

echo ""
echo "=========================================="
echo " 验证完成"
echo "=========================================="
