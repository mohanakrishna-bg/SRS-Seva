# Unified Entity Management Collection Seam and Soft Deletes

Devotee, Seva, and User admin list views each independently implemented ~400 lines of identical state machines for debounced search, pagination bounds, locked detail modal constraints, inline editing transitions, and tabular print orchestration.

We decided to establish a unified `EntityCollection` domain seam:
1. **Headless Hook (`useEntityCollection<T, TFilter>`)**: Encapsulates pagination invariants (local storage preference sync, page bounds clamping), debounced query filtering, detail modal lifecycle (view -> inline edit -> delete), and tabular print orchestration behind a concise interface.
2. **Domain Nomenclature Alignment**: Renamed `CustomersPage` to `DevoteesPage` and `CustomerForm` to `DevoteeForm` to comply with `GLOSSARY.md` domain language, retaining route redirection from `/customers` to `/devotees` for backwards compatibility.
3. **Modal Constraints & Soft Deletes**: Centrally enforces the UI Consistency Pattern (`max-w-2xl`, `max-h-[85vh]` locked modals, inline editing, and soft-delete immediate hiding) across all entity collection views.
