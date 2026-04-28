# Phase 3: Inventory System — Specification

## 1. Goal
Refactor the inventory management module (Fixed Assets and Consumables) to adopt the Phase 2 Glassmorphism Design System. Ensure distinct workflows for each category and implement robust image linking (Google Photos/Local).

## 2. Requirements

| ID | Requirement | Success Criteria |
|----|-------------|------------------|
| INV-01 | Distinct Workflows | Separate UI screens for Fixed Assets and Consumables with category-specific fields. |
| INV-02 | Asset Management | Staff can Add/Edit/Delete items with weight (precious metals) and location tracking. |
| INV-03 | Visual Evidence | Support for Google Photos URL linking and local upload previews in the item card. |

## 3. Visual Specifications (Glassmorphic Inventory)

### A. Dashboard Header
- Unified header style matching `AccountingPage`.
- Title: **ಸ್ಥಿರ ಆಸ್ತಿಗಳು (Assets)** or **ಬಳಕೆ ಸಾಮಗ್ರಿಗಳು (Consumables)**.
- Subtitle: Count and total valuation of items in the current view.

### B. Inventory Cards
- Style: `bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4`.
- Image: 1:1 Aspect ratio, object-cover, rounded-xl.
- Metadata: Use Gold (`#D4AF37`) for item titles and Saffron (`#FF9933`) for values/counts.

### C. Search & Filter Bar
- Sticky bar with glassmorphic background.
- Multi-filter for Category, Material (Gold/Silver/Wood), and Status.

### D. Item Modal
- Large glassmorphic modal with side-by-side view (Image on left, Form on right).
- Integrated Google Photos URL input with live preview.

## 4. Technical Strategy
- Reuse `inventoryApi` from `api.ts`.
- Share a common `InventoryList` and `InventoryCard` component if possible, or keep `AssetsPage` and `ConsumablesPage` distinct for workflow flexibility.
- Implement `tabular-nums` for weights and prices.

## 5. Ambiguity & Risks
- **Image Syncing**: Ensuring Google Photos URLs render correctly in the browser (handling cross-origin or proxying if needed).
- **Valuation Logic**: Ensuring bullion rates are refreshed when materials change.
