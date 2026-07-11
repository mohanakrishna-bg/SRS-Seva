#!/bin/bash
# ═══════════════════════════════════════════════════════════
# Seva Application Startup Script
# ═══════════════════════════════════════════════════════════
#
# Usage:
#   ./start.sh              Start with PostgreSQL (production)
#   ./start.sh --dev        Start with SQLite (local dev, zero-config)
#   ./start.sh --help       Show usage
#
# Prerequisites:
#   --dev:  Python 3.10+, Node.js 18+
#   prod:   Docker & Docker Compose (for PostgreSQL)

set -e

# Support Homebrew paths on macOS
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

# ─── Parse arguments ───
USE_SQLITE=false
SHOW_HELP=false

for arg in "$@"; do
    case $arg in
        --dev)    USE_SQLITE=true ;;
        --help)   SHOW_HELP=true ;;
        *)        echo "Unknown argument: $arg"; SHOW_HELP=true ;;
    esac
done

if $SHOW_HELP; then
    echo ""
    echo "  Seva Application Startup"
    echo "  ────────────────────────"
    echo ""
    echo "  Usage:"
    echo "    ./start.sh              Start with PostgreSQL (production mode)"
    echo "    ./start.sh --dev        Start with SQLite (local dev, zero-config)"
    echo "    ./start.sh --help       Show this help"
    echo ""
    echo "  In production mode, PostgreSQL is started via Docker Compose."
    echo "  In dev mode, SQLite is used directly — no Docker needed."
    echo ""
    exit 0
fi

echo ""
echo "═══════════════════════════════════════════"
echo "  🚀 Seva Application Startup"
echo "═══════════════════════════════════════════"
echo "   Project: $PROJECT_DIR"

# ─── Cleanup existing processes ───
echo ""
echo "🧹 Cleaning up existing processes on ports 8001 and 5173..."
lsof -ti:8001 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true
echo "   Done."

# ─── Database setup ───
if $USE_SQLITE; then
    echo ""
    echo "📦 Mode: LOCAL DEV (SQLite)"
    echo "   Database: $BACKEND_DIR/seva.db"
    echo "   No Docker or PostgreSQL required."
    export DATABASE_URL=""
else
    echo ""
    echo "🐘 Mode: PRODUCTION (PostgreSQL)"

    # Check Docker
    if ! command -v docker &> /dev/null; then
        echo "   ❌ Docker not found. Install Docker or use --dev for SQLite mode."
        exit 1
    fi

    # Start PostgreSQL via Docker Compose
    echo "   Starting PostgreSQL container..."
    cd "$PROJECT_DIR"
    docker compose up -d postgres 2>/dev/null || docker-compose up -d postgres 2>/dev/null
    
    # Wait for PostgreSQL to be healthy
    echo "   Waiting for PostgreSQL..."
    for i in $(seq 1 30); do
        if docker compose exec -T postgres pg_isready -U seva_app -d seva > /dev/null 2>&1; then
            echo "   ✅ PostgreSQL ready!"
            break
        fi
        if [ $i -eq 30 ]; then
            echo "   ❌ PostgreSQL failed to start within 30 seconds."
            echo "   Check: docker compose logs postgres"
            exit 1
        fi
        sleep 1
    done

    export DATABASE_URL="postgresql://seva_app:${DB_PASSWORD:-seva_dev_password}@localhost:5432/seva"
    echo "   DATABASE_URL set."

    # Run Alembic migrations
    echo "   Running database migrations..."
    cd "$BACKEND_DIR"
    if command -v alembic &> /dev/null; then
        alembic upgrade head 2>/dev/null || echo "   ⚠️  Alembic migration skipped (may need initial setup)"
    fi
fi

# ─── Backend ───
echo ""
echo "🔌 Starting Backend (FastAPI on port 8001)..."
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

# ─── Frontend ───
echo ""
echo "🎨 Starting Frontend (Vite on port 5173)..."
cd "$FRONTEND_DIR"
npm run dev -- --host 0.0.0.0 --force &
FRONTEND_PID=$!
echo "   Frontend PID: $FRONTEND_PID"

sleep 3

# ─── Summary ───
echo ""
echo "═══════════════════════════════════════════"
echo "  ✅ Seva Application Running"
echo ""
echo "  🌐 Frontend: http://localhost:5173"
echo "  🔌 Backend:  http://localhost:8001"
echo "  ❤️  Health:   http://localhost:8001/api/health"
if $USE_SQLITE; then
    echo "  💾 Database: SQLite (local dev)"
else
    echo "  🐘 Database: PostgreSQL (Docker)"
fi
echo ""
echo "  Press Ctrl+C to stop all servers"
echo "═══════════════════════════════════════════"
echo ""

# ─── Trap Ctrl+C ───
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    if ! $USE_SQLITE; then
        echo "   PostgreSQL container left running (use 'docker compose down' to stop)"
    fi
    echo "   Done."
    exit 0
}

trap cleanup INT TERM

wait
