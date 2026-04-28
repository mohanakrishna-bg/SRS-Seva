# Architecture Research: Temple Management

## Component Boundaries
- **Frontend SPA**: Handles all UI, state, voice dictation, and localization. Communicates purely via REST APIs.
- **Backend API**: Handles business logic, database transactions, and PDF generation.
- **Database**: Stores all relational data (devotees, sevas, transactions).
- **Inventory Media**: Outbound to Google Photos (mobile app) rather than storing heavy blobs in the database.

## Data Flow
User (Mobile/Desktop) -> Frontend SPA -> API -> SQLite Database.

## Build Order Implications
1. Core Devotee & Seva logic must be solidified first, as financials depend on them.
2. Financials and receipting follow.
3. Internet exposure is configured last to ensure internal stability before public access.
