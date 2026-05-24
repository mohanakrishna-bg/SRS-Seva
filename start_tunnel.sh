#!/bin/bash
# Seva Cloudflare Tunnel Startup Script
# Exposes the application for UAT with zero config.

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

echo "☁️  Setting up Cloudflare Tunnel for UAT..."

# 1. Download/Detect cloudflared
if command -v cloudflared &> /dev/null; then
    CLOUDFLARED="cloudflared"
    echo "   ✅ Found global cloudflared installation."
else
    mkdir -p bin
    if [ ! -f "bin/cloudflared" ]; then
        echo "   📥 Downloading cloudflared binary locally..."
        ARCH=$(uname -m)
        if [ "$ARCH" = "x86_64" ]; then
            URL="https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64"
        elif [ "$ARCH" = "aarch64" ] || [ "$ARCH" = "arm64" ]; then
            URL="https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64"
        else
            URL="https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-386"
        fi
        curl -L "$URL" -o bin/cloudflared
        chmod +x bin/cloudflared
        echo "   ✅ Downloaded successfully."
    else
        echo "   ✅ Found local cloudflared binary."
    fi
    CLOUDFLARED="./bin/cloudflared"
fi

# 2. Check if application is already running on port 5173
APP_RUNNING=false
if lsof -i :5173 >/dev/null 2>&1; then
    echo "   ℹ️  Application is already running on port 5173."
    APP_RUNNING=true
else
    echo "   🚀 Starting local application servers..."
    ./start.sh &
    APP_PID=$!
    # Wait for the app to be active on 5173
    echo "   Waiting for Vite server to start on 5173..."
    for i in $(seq 1 30); do
        if curl -s http://localhost:5173 > /dev/null 2>&1; then
            APP_RUNNING=true
            break
        fi
        sleep 1
    done
fi

if [ "$APP_RUNNING" = false ]; then
    echo "   ❌ Failed to start or locate Vite frontend on port 5173."
    exit 1
fi

# 3. Start Cloudflare Tunnel
echo "   ⚡ Launching Cloudflare Tunnel..."
rm -f cloudflared.log
$CLOUDFLARED tunnel --url http://localhost:5173 > cloudflared.log 2>&1 &
TUNNEL_PID=$!

# Wait for tunnel URL to be generated
echo "   Waiting for public UAT URL..."
TUNNEL_URL=""
for i in $(seq 1 30); do
    if grep -o "https://.*\.trycloudflare\.com" cloudflared.log > /dev/null 2>&1; then
        TUNNEL_URL=$(grep -o "https://.*\.trycloudflare\.com" cloudflared.log | head -n 1)
        break
    fi
    sleep 1
done

if [ -z "$TUNNEL_URL" ]; then
    echo "   ❌ Failed to obtain tunnel URL. Check cloudflared.log."
    kill $TUNNEL_PID 2>/dev/null || true
    exit 1
fi

echo ""
echo "══════════════════════════════════════════════════════════════"
echo "  🚀 UAT DEPLOYMENT LIVE!"
echo ""
echo "  Public URL: $TUNNEL_URL"
echo ""
echo "  Press Ctrl+C to close the tunnel and stop servers"
echo "══════════════════════════════════════════════════════════════"
echo ""

cleanup() {
    echo ""
    echo "🛑 Shutting down tunnel and local servers..."
    kill $TUNNEL_PID 2>/dev/null || true
    if [ ! -z "$APP_PID" ]; then
        kill $APP_PID 2>/dev/null || true
    fi
    echo "   Done."
    exit 0
}

trap cleanup INT TERM

# Wait for the tunnel process
wait $TUNNEL_PID
