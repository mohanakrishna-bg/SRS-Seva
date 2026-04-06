#!/bin/bash
# Permanent Fix for Seva Backend Stability
# This script ensures the backend runs on port 8001 and is proxied properly.

BASEDIR=$(dirname "$0")
cd "$BASEDIR"

# Kill existing processes
echo "Killing existing backend processes on port 8001..."
lsof -ti :8001 | xargs kill -9 2>/dev/null || true

# Start backend
echo "Starting backend on port 8001..."
# Using --workers 4 for basic load balancing/stability if needed, 
# although SQLite needs caution with concurrent writes.
# For SQLite, 1 worker is often safer but 4 is fine if WAL mode is enabled.
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --workers 1 > uvicorn.log 2>&1 &

echo "Backend started. PID: $!"
echo "Check uvicorn.log for details."
