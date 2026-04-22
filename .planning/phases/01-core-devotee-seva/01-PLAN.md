---
wave: 1
depends_on: []
files_modified:
  - backend/app/models.py
  - backend/app/schemas.py
  - backend/app/routes/devotees.py
  - backend/app/routes/sevas.py
  - backend/main.py
  - frontend/src/components/ui/AutocompleteBar.tsx
  - frontend/src/pages/BookingDashboard.tsx
  - frontend/src/pages/FulfilmentList.tsx
autonomous: true
---

# Phase 1: Core Devotee & Seva

## 1. Goal
Establish the foundation for devotee records and booking sevas.

## 2. Requirements
- DEV-01: Staff can register and update devotee details.
- SEV-01: Staff can book sevas for devotees, including scheduling dates.
- SEV-02: System automatically marks or tracks the fulfilment of scheduled sevas.

## 3. Tasks

<task>
<id>1</id>
<title>Database schema for Devotees and Sevas</title>
<read_first>
- backend/app/models.py
- backend/app/schemas.py
</read_first>
<action>
1. Add `Devotee` model to `backend/app/models.py` with fields: id, name, phone, gotra, nakshatra, language_pref, created_at.
2. Add `Seva` model to `backend/app/models.py` with fields: id, title, default_price.
3. Add `SevaBooking` model with fields: id, devotee_id (FK), seva_id (FK), scheduled_date, is_fulfilled (boolean, default False), created_at.
4. Create corresponding Pydantic schemas in `backend/app/schemas.py` for all 3 models (Create, Read, Update schemas).
</action>
<acceptance_criteria>
- `backend/app/models.py` contains `Devotee`, `Seva`, and `SevaBooking` classes
- `backend/app/schemas.py` contains corresponding Pydantic schemas
</acceptance_criteria>
</task>

<task>
<id>2</id>
<title>Backend REST API for Devotees and Sevas</title>
<read_first>
- backend/main.py
</read_first>
<action>
1. Create `backend/app/routes/devotees.py` with CRUD endpoints (`/devotees`, `/devotees/search?q=`). The search endpoint should match against phone, name, or gotra.
2. Create `backend/app/routes/sevas.py` with endpoints for listing sevas (`/sevas`), creating bookings (`/sevas/book`), and updating fulfilment (`/sevas/fulfil/{booking_id}`).
3. Register routers in `backend/main.py`.
</action>
<acceptance_criteria>
- `backend/app/routes/devotees.py` exists and exposes `/devotees/search`
- `backend/app/routes/sevas.py` exists and exposes `/sevas/book`
- `backend/main.py` includes `devotees_router` and `sevas_router`
</acceptance_criteria>
</task>

<task>
<id>3</id>
<title>[BLOCKING] Schema Push / Database Migration</title>
<read_first>
- backend/app/models.py
</read_first>
<action>
Ensure the database schema is updated to reflect the new `Devotee`, `Seva`, and `SevaBooking` models. Run alembic migrations (if Alembic is configured) OR ensure `Base.metadata.create_all(bind=engine)` runs on startup to create the tables in the SQLite database.
</action>
<acceptance_criteria>
- The SQLite database contains `devotee`, `seva`, and `sevabooking` tables.
</acceptance_criteria>
</task>

<task>
<id>4</id>
<title>Frontend UI: Universal Auto-Complete Bar & Booking Dashboard</title>
<read_first>
- frontend/src/components/ui/AutocompleteBar.tsx
- frontend/src/pages/BookingDashboard.tsx
- .planning/phases/01-core-devotee-seva/01-UI-SPEC.md
</read_first>
<action>
1. Create `frontend/src/components/ui/AutocompleteBar.tsx` that calls `/devotees/search` and displays dropdown matches. Apply glassmorphism classes (`bg-white/10 backdrop-blur-md rounded-xl`). Include an inline mic icon for voice dictation that pulses when active.
2. Create `frontend/src/pages/BookingDashboard.tsx`. Include the AutocompleteBar at the top. Once a devotee is selected (or created via a new form), show a unified form to select a Seva and pick a scheduled date. Submit to `/sevas/book`.
3. Add a simple EN/KN language toggle switch to the global header.
</action>
<acceptance_criteria>
- `frontend/src/components/ui/AutocompleteBar.tsx` contains `bg-white/10` and `backdrop-blur-md`
- `frontend/src/pages/BookingDashboard.tsx` contains a form submitting to `/sevas/book`
</acceptance_criteria>
</task>

<task>
<id>5</id>
<title>Frontend UI: Seva Fulfilment Tracking</title>
<read_first>
- frontend/src/pages/FulfilmentList.tsx
- .planning/phases/01-core-devotee-seva/01-UI-SPEC.md
</read_first>
<action>
1. Create `frontend/src/pages/FulfilmentList.tsx` to fetch bookings from `/sevas` filtered by `scheduled_date` (defaulting to today).
2. Display bookings as a daily batch list using glassmorphic card styles (`bg-white/10 backdrop-blur-md border-white/20`).
3. Add a checkbox/toggle for each booking. When toggled, send a request to `/sevas/fulfil/{booking_id}` to mark `is_fulfilled = true`.
</action>
<acceptance_criteria>
- `frontend/src/pages/FulfilmentList.tsx` exists and calls `/sevas/fulfil/`
- Component uses glassmorphic card styles
</acceptance_criteria>
</task>
