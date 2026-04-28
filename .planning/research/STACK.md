# Stack Research: Temple Management

## Standard Stack Recommendation
- **Frontend**: React (with Vite) and Tailwind CSS.
- **Backend**: Python (FastAPI) or Node.js (Express). FastAPI is excellent for rapid development and API generation.
- **Database**: SQLite (for low concurrency/on-premise) or PostgreSQL (for higher reliability and concurrent writes).
- **Access**: Reverse tunnels (like Cloudflare Tunnels) for secure on-premise exposure without firewall complexities.

## Rationale
The current stack (React/Vite + FastAPI + SQLite) aligns perfectly with the standard for this domain given the low concurrent user load (15-20 users) and on-premise constraint. It minimizes DevOps overhead while providing a modern user experience.
