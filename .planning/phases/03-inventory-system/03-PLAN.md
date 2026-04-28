---
wave: 1
depends_on: [phase-2-financials-accounting]
files_modified:
  - backend/app/api/image_sync.py
  - frontend/src/pages/AssetsPage.tsx
  - frontend/src/pages/ConsumablesPage.tsx
  - frontend/src/components/inventory/InventoryLayout.tsx
  - frontend/src/components/inventory/InventoryCard.tsx
  - frontend/src/components/inventory/InventoryModal.tsx
autonomous: true
---

# Phase 3: Inventory System

## 1. Goal
Refactor the inventory module into a unified, glassmorphic system. Implement self-contained image syncing from a "watch folder" (simulating Google Photos) and add a manual revaluation trigger for precious metals.

## 2. Requirements
- **INV-01**: Distinct Workflows (Assets vs Consumables) via a common component.
- **INV-02**: Asset Management with location tracking and weight-based valuation.
- **INV-03**: Google Photos Sync (Self-contained inbox processing) with HEIC support.

---

## 3. Tasks

<task>
<id>1</id>
<title>Fix Image Sync for Linux & Environment Stability</title>
<read_first>
- backend/app/api/image_sync.py
</read_first>
<action>
1. Update `backend/app/api/image_sync.py`:
   - Replace the `sips` based `convert_heic_to_jpg` with a check for `pillow_heif` (if available) or `heif-convert` via subprocess.
   - If no HEIC converter is found, gracefully log the error and skip the file rather than crashing.
2. Ensure `BASE_DIR` and `UPLOAD_DIR` are correctly resolved for the Linux environment.
</action>
<acceptance_criteria>
- `image_sync.py` no longer references `sips` (macOS only).
- The sync engine handles common image formats (JPG/PNG) correctly on Linux.
</acceptance_criteria>
</task>

<task>
<id>2</id>
<title>Create Unified Inventory Components</title>
<read_first>
- frontend/src/pages/AssetsPage.tsx
- frontend/src/pages/ConsumablesPage.tsx
</read_first>
<action>
1. Create `frontend/src/components/inventory/InventoryLayout.tsx`:
   - This component will take `itemType` ("asset" | "consumable") as a prop.
   - Implement the Glassmorphism header, search, and filter bar.
   - Implement the "Manual Revalue" button in the summary area (hits `/api/inventory/revalue`).
2. Create `frontend/src/components/inventory/InventoryCard.tsx`:
   - Glassmorphic card design (`bg-white/5 backdrop-blur-md`).
   - Displays image, title (Gold), category, and value (Saffron).
3. Create `frontend/src/components/inventory/InventoryModal.tsx`:
   - Common Add/Edit modal for both types.
</action>
<acceptance_criteria>
- New components exist in `frontend/src/components/inventory/`.
- `InventoryLayout` handles data fetching and filtering for the specific `itemType`.
- "Revalue" button is visible and functional.
</acceptance_criteria>
</task>

<task>
<id>3</id>
<title>Refactor Assets and Consumables Pages</title>
<read_first>
- frontend/src/pages/AssetsPage.tsx
- frontend/src/pages/ConsumablesPage.tsx
</read_first>
<action>
1. Replace the ~80KB of duplicate code in `AssetsPage.tsx` and `ConsumablesPage.tsx` with a simple wrapper:
   ```tsx
   export default function AssetsPage() {
     return <InventoryLayout itemType="asset" title="ಸ್ಥಿರ ಆಸ್ತಿಗಳು" />;
   }
   ```
2. Ensure all specialized logic (like weight for assets vs quantity for consumables) is handled via conditional rendering inside `InventoryLayout`.
</action>
<acceptance_criteria>
- `AssetsPage.tsx` and `ConsumablesPage.tsx` are significantly smaller (< 2KB each).
- Navigation and functionality remain intact.
</acceptance_criteria>
</task>

<task>
<id>4</id>
<title>Implement Sync Dashboard & Inbox UI</title>
<read_first>
- frontend/src/api.ts
</read_first>
<action>
1. Add a "Sync Dashboard" tab or sub-page in the Inventory module.
2. Implement:
   - **Inbox List**: Shows files currently in the `sync_inbox` folder (hits `/api/inventory/sync/inbox`).
   - **Run Sync Button**: Triggers the sync process (hits `/api/inventory/sync/run`).
   - **Config View**: Simple read-only view of the watch folder path.
</action>
<acceptance_criteria>
- Users can see pending images in the inbox.
- Users can trigger a sync and see the log output in the UI.
</acceptance_criteria>
</task>
