# Architecture

## Overview
The application is a modern web-based intranet system (client-server architecture) replacing a legacy Microsoft Access database setup.

## Frontend Architecture
- **Framework**: React Single Page Application (SPA) built with Vite.
- **Routing**: Client-side routing with `react-router-dom`.
- **State Management**: React hooks (useState, useEffect, context).
- **Styling**: Tailwind CSS with Glassmorphism UI/UX design and Framer Motion for animations.
- **Media/Hardware**: Integrates Web Speech API and webcam for rapid, multi-modal data entry workflows.

## Backend Architecture
- **Framework**: FastAPI (REST API).
- **Database**: SQLite (`seva.db`).
- **ORM**: SQLAlchemy for database operations.
- **Data Validation**: Pydantic schemas.
- **Authentication**: JWT-based auth with Passlib (BCrypt) for Admin/Staff/Viewer roles.
- **Layering**:
  - `api/`: Route definitions and controllers.
  - `core/`: Config, security, and dependencies.
  - `models/`: SQLAlchemy database models.
  - `schemas/`: Pydantic request/response schemas.
  - `database.py`: Database connection and session management.
