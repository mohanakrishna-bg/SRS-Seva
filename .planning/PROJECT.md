# SRS Seva

## What This Is
An end-to-end web application for the management of a temple/religious institution. Developed incrementally, it digitizes core operations including devotee management, seva (service) registration and fulfilment, financial tracking (receipts, expenditures, donations), inventory (fixed assets and consumables), and personnel management. It is hosted on-premises with lightweight, secure internet access for selected services, serving a small user base (~15-20 concurrent users). 

## Target Audience
- **Temple Admins and Operators**: Accessing primarily via desktop/laptop to manage back-office operations.
- **Devotees and Public**: Accessing internet-facing services primarily via mobile devices.
- **Key Constraint**: Users are assumed to be non-tech-savvy. The frontend must be highly intuitive, frictionless, aesthetically pleasing, and support both English and Kannada.

## Requirements

### Validated
- ✓ Devotee & Customer Entity Management — existing
- ✓ Staff Authentication & Authorization (Admin/Staff/Viewer roles) — existing
- ✓ Basic Inventory Management — existing
- ✓ PDF Receipts Generation (jsPDF) — existing
- ✓ Voice Dictation and Text-to-Speech (Web Speech API) — existing
- ✓ Webcam Integration for Document/ID scanning — existing
- ✓ Glassmorphism UI with Tailwind CSS — existing

### Active
- [ ] Devotee & Seva Management Module (Priority 1)
- [ ] Financial Tracking (Receipts, Expenditures, Donations) (Priority 2)
- [ ] Direct UPI Integration & Bank Transfer Reconciliation (Priority 2)
- [ ] Expanded Inventory Management (Assets & Consumables linked to Google Photos) (Priority 3)
- [ ] Internet-Facing Services & Portals (Priority 4)
- [ ] Personnel Management Module (Priority 5)
- [ ] Bilingual Frontend UI (English and Kannada)

### Out of Scope
- [Complex Third-Party Payment Gateways] — Prioritizing direct UPI and manual reconciliation for simplicity and cost.
- [Enterprise Cloud Hosting] — The system will remain on-premises, using lightweight solutions (like Cloudflare Tunnels or similar) for necessary internet access to reduce administration complexity.
- [Backend Localization] — Backend data will be maintained predominantly in English.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Incremental Rollout Strategy | Ensures core temple operations are stabilized before adding financials, public internet access, and HR. | — Pending |
| On-Premises Hosting with Tunnels | Reduces recurring cloud costs and keeps local data secure while allowing necessary internet access with minimal admin overhead. | — Pending |
| Direct UPI & Manual Reconciliation | Avoids complex payment gateway integrations, suitable for current transaction volume. | — Pending |
| Google Photos for Inventory Images | An optimal mobile-friendly workflow is already in place; no need to reinvent unless significant flaws are found. | — Pending |
| English & Kannada Frontend | Meets the needs of the local demographic without over-complicating the backend data model. | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-22 after initialization*
