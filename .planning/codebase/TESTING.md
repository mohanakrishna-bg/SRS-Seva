# Testing

## Backend
- Testing is primarily composed of individual Python test scripts in the `backend/` directory (e.g., `test_db.py`, `test_fastapi.py`, `test_inv.py`, `test_items.py`, etc.).
- Tests appear to be simple script-based tests rather than using a full test framework like `pytest` (though `pytest` could be used to run them).
- DB tests run against the SQLite database to verify data integrity and migrations.

## Frontend
- Currently, no dedicated testing framework (like Vitest or Jest) is configured in `package.json`.
- Testing is largely manual/E2E through the browser interface.
