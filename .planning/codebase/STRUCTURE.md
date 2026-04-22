# Project Structure

## Root Level
- `frontend/`: React SPA source code.
- `backend/`: FastAPI backend source code.
- `README.md`: Project documentation and run instructions.
- `*.py / *.sh`: Root level Python scripts (e.g., `patch_inventory.py`, `organize_photos.py`) and shell scripts (`start.sh`, `master_start.sh`).

## Backend (`/backend`)
- `app/`: Main FastAPI application module.
  - `api/`: API routers.
  - `core/`: Core settings and security.
  - `models/`: Database models.
  - `schemas/`: Pydantic schemas.
  - `main.py`: FastAPI application entry point.
  - `database.py`: DB connection setup.
- `migrate*.py` & `sync*.py`: Various migration scripts for legacy data (Access DB to SQLite).
- `test_*.py`: Backend test scripts.
- `seva.db`: SQLite database file.

## Frontend (`/frontend`)
- `src/`: React source code.
- `public/`: Static assets.
- `package.json`: NPM dependencies and scripts.
- `vite.config.ts`: Vite configuration.
- `tailwind.config.js` & `postcss.config.js`: Tailwind styling configuration.
- `eslint.config.js`: ESLint configuration.
