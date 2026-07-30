#!/bin/bash
# Start API and POS dev servers for Tauri launcher
# Run from project root

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

# Start API in background
cd "$PROJECT_ROOT" && pnpm --filter pos-api dev &
API_PID=$!

# Wait for API to be ready before starting frontend
echo "Waiting for API on port 3000..."
for i in $(seq 1 60); do
  if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "API is ready!"
    break
  fi
  sleep 1
done

# Start POS React dev server
cd "$PROJECT_ROOT" && pnpm --filter pos-react dev &
POS_PID=$!

# Cleanup on exit
cleanup() {
  kill $API_PID $POS_PID 2>/dev/null
  wait $API_PID $POS_PID 2>/dev/null
}
trap cleanup EXIT INT TERM

# Wait for both
wait
