#!/bin/bash
# Master Start Script for Seva Application
# This script ensures both backend and frontend are freshly started.

PROJECT_ROOT=$(cd "$(dirname "$0")" && pwd)
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

echo "=== Seva Application - Full System Restart ==="

# 1. Kill everything on the relevant ports
echo "Step 1: Terminating existing processes on 5173, 8000, 8001..."
lsof -ti :5173,8000,8001 | xargs kill -9 2>/dev/null || true
sleep 2

# 2. Start Backend
echo "Step 2: Starting Backend (Uvicorn)..."
cd "$BACKEND_DIR"
# Clean up old logs
rm -f uvicorn.log
python3 -m uvicorn app.main:app --host 127.0.0.1 --port 8001 --workers 1 > uvicorn.log 2>&1 &
BACKEND_PID=$!
echo "Backend started with PID: $BACKEND_PID"

# 3. Start Frontend
echo "Step 3: Starting Frontend (Vite)..."
cd "$FRONTEND_DIR"
# Vite sometimes gets stuck with old cache, but we'll try a regular dev start first
npm run dev > /dev/null 2>&1 &
FRONTEND_PID=$!
echo "Frontend started with PID: $FRONTEND_PID"

# 4. Wait for frontend to be ready
echo "Step 4: Waiting for servers to initialize..."
sleep 5

# 5. Launch Browser
URL="http://localhost:5173"
echo "Step 5: Launching $URL..."

if [[ "$OSTYPE" == "darwin"* ]]; then
    open "$URL"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    xdg-open "$URL"
else
    echo "Please open $URL manually in your browser."
fi

echo "=== System Start Sequence Complete ==="
echo "Backend logging to: $BACKEND_DIR/uvicorn.log"
