# SRS Seva - Modern Intranet Application

## Overview
This repository contains the source code for the "SRS Seva" intranet modernization project. The application was built to migrate away from a legacy Microsoft Access database (`.accdb`) to a modern, lightweight web application.

### Tech Stack
- **Backend:** Python, FastAPI, SQLite, SQLAlchemy, Pydantic, Passlib (BCrypt+JWT)
- **Frontend:** React, TypeScript, Vite, Tailwind CSS (v4), Framer Motion, Axios
- **Multi-Modal Capabilities:**
  - **Voice:** Web Speech API for voice dictation with Text-to-Speech (TTS) readback confirmation.
  - **Camera:** `react-webcam` integration for document/ID scanning.
  - **Audio/Visual Feedback:** Integrated chime and shutter sound effects for transactions.

## Architecture & Requirements History

During the planning phase, the following core requirements were gathered:
1. **Entities & CRUD Operations:** 
   - **Customers/Devotees:** Includes `Name`, `Sgotra`, `SNakshatra`, `Address` (with Google Maps location), `City`, `ID`, `Phone`, `WhatsApp Phone`, and `Email ID`.
   - **Sevas/Items:** Offerings such as `ItemCode`, `Description`, `Basic Fee`, and `Prasada Addon Limit`.
   - **Invoices/Receipts:** Tracks `Date`, `VoucherNo`, `TotalAmount`, and `Payment_Mode` (UPI, Cash, Cheque).
2. **User Roles:** Admin, Staff, and Viewer, secured by JWT-based authentication.
3. **Data Migration:** A Python script (`backend/migrate.py`) was developed using `pandas` and `mdbtools` to convert `RMutt_Tables-2025-26.accdb` into the new `seva.db` SQLite database, scrubbing symbols from column names and flagging anomalies (e.g., missing names) to a `migration_anomalies.csv` file.

### How to Run

1. **Start the Backend:**
   ```bash
   cd backend
   pip install -r requirements.txt
   uvicorn app.main:app --port 8001 --reload
   ```
   *Access API documentation at `http://localhost:8001/docs`*

2. **Start the Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   *Access the web app at `http://localhost:5173` or `5174`*

## Context
This repository and its foundational architecture were generated as part of a modernization initiative, preserving all previous Access data while elevating the UI/UX with Glassmorphism and rapid, multi-modal data entry workflows.
