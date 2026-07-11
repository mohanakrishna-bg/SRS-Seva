#!/bin/bash
# ═══════════════════════════════════════════════════════════
# Seva Cloudflare Tunnel Opener
# ═══════════════════════════════════════════════════════════
#
# This script opens a Cloudflare tunnel to access the Vite frontend
# (and proxied FastAPI backend) remotely.
#
# Usage:
#   ./start-tunnel.sh
#

set -e

PORT=5173
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
BIN_DIR="$PROJECT_DIR/bin"
CLOUDFLARED_BIN="cloudflared"

echo ""
echo "═══════════════════════════════════════════"
echo "  ☁️  Seva Cloudflare Tunnel Service"
echo "═══════════════════════════════════════════"

# Check if cloudflared is available globally
if command -v cloudflared &> /dev/null; then
    echo "✅ cloudflared is installed globally."
    CLOUDFLARED_BIN="cloudflared"
else
    # Check if cloudflared is in our local bin directory
    if [ -x "$BIN_DIR/cloudflared" ]; then
        echo "✅ Using local cloudflared binary at $BIN_DIR/cloudflared"
        CLOUDFLARED_BIN="$BIN_DIR/cloudflared"
    else
        echo "⚠️  cloudflared not found."
        echo "📥 Downloading cloudflared..."
        mkdir -p "$BIN_DIR"
        
        # Download the x86_64 linux binary
        if command -v curl &> /dev/null; then
            curl -L -o "$BIN_DIR/cloudflared" https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
        elif command -v wget &> /dev/null; then
            wget -O "$BIN_DIR/cloudflared" https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
        else
            echo "❌ Error: Neither curl nor wget was found. Please install one of them or install cloudflared manually."
            exit 1
        fi
        
        chmod +x "$BIN_DIR/cloudflared"
        echo "✅ Downloaded and set execute permissions."
        CLOUDFLARED_BIN="$BIN_DIR/cloudflared"
    fi
fi

# Expose the frontend port (Vite)
echo ""
echo "🔗 Starting Cloudflare tunnel pointing to http://localhost:$PORT..."
echo "   Wait for the temporary .trycloudflare.com link to appear below!"
echo "═══════════════════════════════════════════"
echo ""

exec "$CLOUDFLARED_BIN" tunnel --url "http://localhost:$PORT"
