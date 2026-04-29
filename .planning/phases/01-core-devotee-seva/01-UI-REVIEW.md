# Phase 1 — UI Review

**Audited:** 2026-04-29
**Baseline:** Abstract 6-pillar standards & Project Brand Guidelines
**Screenshots:** Captured (Playwright/Browser Subagent)

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 4/4 | Consistent use of Kannada/English with appropriate spiritual/functional tone. |
| 2. Visuals | 2/4 | **BLOCKER**: Jarring aesthetic mismatch between components in dark mode. |
| 3. Color | 2/4 | **WARNING**: Clashing warm (brown) and cool (navy) dark mode backgrounds. |
| 4. Typography | 4/4 | Excellent use of Outfit/Inter font pairing for headers and body. |
| 5. Spacing | 4/4 | Consistent use of 8pt grid system and glassmorphism padding. |
| 6. Experience Design | 4/4 | Seamless transition and state handling; voice UI integrated well. |

**Overall: 20/24**

---

## Top 3 Priority Fixes

1. **Dark Mode Cohesion** — Visual mismatch between EeDinaCard (Warm Brown) and CalendarWidget (Cool Navy) — Replace `dark:bg-slate-900` in CalendarWidget with `glass-card` class to align with the global design system.
2. **Component Synchronization** — Ensure all widgets use the same background token in dark mode — Audit all components for hardcoded `slate` or `gray` classes that bypass the `--glass-card-bg` variable.
3. **Receipt Aesthetics** — Ensure the persistent settings branding is correctly sized on all viewport widths — (Based on manual observation during screenshotting).

---

## Detailed Findings

### Pillar 1: Copywriting (4/4)
- Strings in `EeDinaCard.tsx` and `CalendarWidget.tsx` are well-localized.
- Transliteration logic works correctly for dynamic organization names.

### Pillar 2: Visuals (2/4)
- `EeDinaCard.tsx` uses the `glass-card` class correctly, giving it a premium warm dark brown feel.
- `CalendarWidget.tsx` (Line 45) uses a hardcoded `dark:bg-slate-900`, which breaks the visual focal point and cohesion of the home page.

### Pillar 3: Color (2/4)
- **Violation**: `--bg-dark` is `#2c1810` (Warm Brown), but some components use `slate-900` (Cool Navy).
- The "Ee Dina" card background (`#2c1810`) and "Calendar" background (`#0f172a`) do not combine aesthetically.

### Pillar 4: Typography (4/4)
- Headers use `Outfit` as intended.
- Body text uses `Inter` for readability.
- Font sizes are consistent across components.

### Pillar 5: Spacing (4/4)
- `gap-2` in `EeDinaCard.tsx` provides adequate breathing room between columns.
- `p-6` in `CalendarWidget.tsx` maintains a premium feel.

### Pillar 6: Experience Design (4/4)
- Theme toggle is responsive and updates all variables.
- Persistent settings from Phase 1 are correctly reflected in the UI.

---

## Files Audited
- `frontend/src/components/EeDinaCard.tsx`
- `frontend/src/components/CalendarWidget.tsx`
- `frontend/src/index.css`
- `frontend/src/App.tsx`
- `frontend/src/pages/SettingsPage.tsx`
