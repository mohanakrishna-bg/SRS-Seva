#!/bin/bash
# Seva Application Startup Script
# Usage: ./start.sh

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

echo "🚀 Starting Seva Application..."
echo "   Project: $PROJECT_DIR"
echo ""

echo "🧹 Cleaning up existing processes on ports 8001 and 5173..."
lsof -ti:8001 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true
echo "   Done."
echo ""

# --- Backend ---
echo "📦 Starting Backend (FastAPI on port 8001)..."
cd "$BACKEND_DIR"
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"

# Wait for backend to be ready
echo "   Waiting for backend..."
for i in $(seq 1 20); do
    if curl -s http://localhost:8001/api/health > /dev/null 2>&1; then
        echo "   ✅ Backend ready!"
        break
    fi
    sleep 0.5
done

# --- Frontend ---
echo ""
echo "🎨 Starting Frontend (Vite on port 5173)..."
cd "$FRONTEND_DIR"
npm run dev -- --host 0.0.0.0 --force &
FRONTEND_PID=$!
echo "   Frontend PID: $FRONTEND_PID"

# Wait a moment for Vite
sleep 3

echo ""
echo "═══════════════════════════════════════════"
echo "  ✅ Seva Application Running"
echo ""
echo "  🌐 Frontend: http://localhost:5173"
echo "  🔌 Backend:  http://localhost:8001"
echo "  ❤️  Health:   http://localhost:8001/api/health"
echo ""
echo "  Press Ctrl+C to stop both servers"
echo "═══════════════════════════════════════════"
echo ""

# Trap Ctrl+C to kill both
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    echo "   Done."
    exit 0
}

trap cleanup INT TERM

# Wait for either process to exit
wait
