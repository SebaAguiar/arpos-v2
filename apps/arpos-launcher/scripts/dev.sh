#!/bin/bash
# Start API and POS dev servers for Tauri launcher
# Run from project root

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

# Start API in background
cd "$PROJECT_ROOT" && pnpm --filter api dev &
API_PID=$!

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
