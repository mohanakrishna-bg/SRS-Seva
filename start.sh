#!/bin/bash
# ═══════════════════════════════════════════════════════════
# Seva Application Startup Script
# ═══════════════════════════════════════════════════════════
#
# Usage:
#   ./start.sh                    Start both Backend & Frontend (SQLite zero-config)
#   ./start.sh --dev              Explicit SQLite mode
#   ./start.sh --prod             Start with PostgreSQL via Docker
#   ./start.sh --backend-only     Start only FastAPI backend (port 8001)
#   ./start.sh --frontend-only    Start only Vite frontend (port 5173)
#   ./start.sh --build            Build frontend before starting
#   ./start.sh --help             Show usage
#
# Prerequisites:
#   Default / --dev: Python 3.9+, Node.js 18+
#   --prod:          Docker & Docker Compose (for PostgreSQL)

set -e

# Support Homebrew and standard binary paths on macOS
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

# Export PYTHONPATH so app modules resolve cleanly
export PYTHONPATH="$BACKEND_DIR:$PYTHONPATH"

# ─── Parse arguments ───
USE_SQLITE=true
USE_POSTGRES=false
START_BACKEND=true
START_FRONTEND=true
BUILD_FIRST=false
SHOW_HELP=false

for arg in "$@"; do
    case $arg in
        --dev|--sqlite)
            USE_SQLITE=true
            USE_POSTGRES=false
            ;;
        --prod|--postgres)
            USE_SQLITE=false
            USE_POSTGRES=true
            ;;
        --backend-only|-b)
            START_FRONTEND=false
            ;;
        --frontend-only|-f)
            START_BACKEND=false
            ;;
        --build)
            BUILD_FIRST=true
            ;;
        --help|-h)
            SHOW_HELP=true
            ;;
        *)
            echo "Unknown argument: $arg"
            SHOW_HELP=true
            ;;
    esac
done

if $SHOW_HELP; then
    echo ""
    echo "  Seva Application Startup"
    echo "  ────────────────────────"
    echo ""
    echo "  Usage:"
    echo "    ./start.sh                  Start application (default: SQLite zero-config)"
    echo "    ./start.sh --dev            Explicit SQLite local development mode"
    echo "    ./start.sh --prod           Start with PostgreSQL (Docker Compose)"
    echo "    ./start.sh --backend-only   Start only the FastAPI backend (port 8001)"
    echo "    ./start.sh --frontend-only  Start only the Vite frontend (port 5173)"
    echo "    ./start.sh --build          Build production bundle before launching"
    echo "    ./start.sh --help           Show this help"
    echo ""
    echo "  In default/dev mode, SQLite is used directly — no Docker needed."
    echo "  In prod mode, PostgreSQL is started via Docker Compose."
    echo ""
    exit 0
fi

echo ""
echo "═══════════════════════════════════════════"
echo "  🚀 Seva Application Startup"
echo "═══════════════════════════════════════════"
echo "   Project: $PROJECT_DIR"

# ─── Environment & Runtime Checks ───
# Activate virtual environment if present
if [ -d "$PROJECT_DIR/.venv" ]; then
    echo "   🐍 Activating virtualenv: $PROJECT_DIR/.venv"
    source "$PROJECT_DIR/.venv/bin/activate"
elif [ -d "$PROJECT_DIR/venv" ]; then
    echo "   🐍 Activating virtualenv: $PROJECT_DIR/venv"
    source "$PROJECT_DIR/venv/bin/activate"
elif [ -d "$BACKEND_DIR/.venv" ]; then
    echo "   🐍 Activating virtualenv: $BACKEND_DIR/.venv"
    source "$BACKEND_DIR/.venv/bin/activate"
elif [ -d "$BACKEND_DIR/venv" ]; then
    echo "   🐍 Activating virtualenv: $BACKEND_DIR/venv"
    source "$BACKEND_DIR/venv/bin/activate"
fi

if ! command -v python3 &> /dev/null; then
    echo "   ❌ Python 3 not found. Please install Python 3.9+."
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "   ❌ Node.js not found. Please install Node.js 18+."
    exit 1
fi

# ─── Cleanup existing processes ───
echo ""
echo "🧹 Cleaning up existing processes on ports 8001 and 5173..."
lsof -ti:8001 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true
sleep 1
echo "   Done."

# ─── Database Setup ───
if $USE_POSTGRES; then
    echo ""
    echo "🐘 Mode: PRODUCTION (PostgreSQL)"

    # Check Docker
    if ! command -v docker &> /dev/null; then
        echo "   ❌ Docker not found. Install Docker or run without --prod for SQLite mode."
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

    # Run Alembic migrations if alembic is installed
    cd "$BACKEND_DIR"
    if command -v alembic &> /dev/null; then
        echo "   Running database migrations..."
        alembic upgrade head 2>/dev/null || echo "   ⚠️  Alembic migration skipped"
    fi
else
    echo ""
    echo "📦 Mode: LOCAL DEV (SQLite)"
    echo "   Database: $BACKEND_DIR/seva.db"
    echo "   Auto-applying latest schema migrations on startup..."
    export DATABASE_URL=""
fi

# ─── Optional Frontend Build ───
if $BUILD_FIRST; then
    echo ""
    echo "🔨 Building frontend production bundle..."
    (cd "$FRONTEND_DIR" && npm run build)
fi

# Ensure frontend dependencies exist
if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
    echo ""
    echo "📦 Installing frontend dependencies (node_modules missing)..."
    (cd "$FRONTEND_DIR" && npm install)
fi

# ─── Backend ───
BACKEND_PID=""
if $START_BACKEND; then
    echo ""
    echo "🔌 Starting Backend (FastAPI on port 8001)..."
    cd "$BACKEND_DIR"
    python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload &
    BACKEND_PID=$!
    echo "   Backend PID: $BACKEND_PID"

    # Wait for backend to be ready
    echo "   Waiting for backend..."
    for i in $(seq 1 30); do
        if curl -s http://localhost:8001/api/health > /dev/null 2>&1; then
            echo "   ✅ Backend ready!"
            break
        fi
        if ! kill -0 $BACKEND_PID 2>/dev/null; then
            echo "   ❌ Backend process terminated unexpectedly. Check logs above."
            exit 1
        fi
        sleep 0.5
    done
fi

# ─── Frontend ───
FRONTEND_PID=""
if $START_FRONTEND; then
    echo ""
    echo "🎨 Starting Frontend (Vite on port 5173)..."
    cd "$FRONTEND_DIR"
    npm run dev -- --host 0.0.0.0 &
    FRONTEND_PID=$!
    echo "   Frontend PID: $FRONTEND_PID"

    # Wait a moment for Vite to bind
    for i in $(seq 1 15); do
        if lsof -ti:5173 > /dev/null 2>&1; then
            echo "   ✅ Frontend ready!"
            break
        fi
        sleep 0.5
    done
fi

# ─── Summary ───
echo ""
echo "═══════════════════════════════════════════"
echo "  ✅ Seva Application Running"
echo ""
if $START_FRONTEND; then
    echo "  🌐 Web App:   http://localhost:5173"
fi
if $START_BACKEND; then
    echo "  🔌 API:       http://localhost:8001"
    echo "  📚 API Docs:  http://localhost:8001/docs"
    echo "  ❤️  Health:    http://localhost:8001/api/health"
fi
if $USE_POSTGRES; then
    echo "  🐘 Database:  PostgreSQL (Docker)"
else
    echo "  💾 Database:  SQLite ($BACKEND_DIR/seva.db)"
fi
echo ""
echo "  Press Ctrl+C to stop all servers"
echo "═══════════════════════════════════════════"
echo ""

# ─── Trap Ctrl+C ───
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    if [ -n "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    if [ -n "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    lsof -ti:8001 | xargs kill -9 2>/dev/null || true
    lsof -ti:5173 | xargs kill -9 2>/dev/null || true
    if $USE_POSTGRES; then
        echo "   PostgreSQL container left running (use 'docker compose down' to stop)"
    fi
    echo "   Done."
    exit 0
}

trap cleanup INT TERM

wait
