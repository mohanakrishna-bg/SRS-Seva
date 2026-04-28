# Concerns & Tech Debt

## Architecture & Codebase
- **Migration Scripts**: The `backend/` root is cluttered with many legacy migration scripts (`migrate_v2.py` through `v7`, `cleanup_legacy_photos.py`, etc.) which might no longer be needed now that migration is complete.
- **Test Scripts**: Test files in the `backend/` directory are loose scripts rather than organized in a `tests/` folder.
- **Frontend Testing**: There is no automated testing setup for the frontend.
- **Database Scaling**: SQLite (`seva.db`) is currently used. While efficient for intranet use, it may become a bottleneck if concurrent writes increase significantly, requiring migration to PostgreSQL.
- **Root Scripts**: Miscellaneous python scripts at the repository root (`patch_inventory.py`, `organize_photos.py`) should be organized into a `scripts/` or `tools/` directory.
