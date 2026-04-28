# Requirements

## v1 Requirements

### Devotee & Seva Management
- [ ] **DEV-01**: Staff can register and update devotee details (Name, Gotra, Nakshatra, Contact Info).
- [ ] **SEV-01**: Staff can book sevas for devotees, including scheduling dates.
- [ ] **SEV-02**: System automatically marks or tracks the fulfilment of scheduled sevas.
- [ ] **REP-01**: Staff can generate interactive drill-down reports for Devotee and Seva records.

### Financial Tracking & Donations
- [ ] **FIN-01**: Staff can generate receipts for seva bookings and donations.
- [ ] **FIN-02**: System tracks cash, cheque, and direct UPI payments manually entered by staff.
- [ ] **FIN-03**: System provides basic ledger tracking for daily receipts and expenditures.
- [ ] **REP-02**: Staff can generate interactive drill-down financial reports (receipts vs expenditures).

### Inventory Management
- [ ] **INV-01**: UI and workflow explicitly split into two distinct sections: Fixed Assets and Consumables.
- [ ] **INV-02**: Staff can record, update, and manage fixed assets and consumables separately.
- [ ] **INV-03**: Staff can link inventory items to external Google Photos albums.
- [ ] **REP-03**: Staff can generate interactive drill-down reports separately for both fixed assets and consumables.

### Public Portals
- [ ] **PUB-01**: Devotees can access an internet-facing portal to view available sevas and make bookings/donations online via direct UPI/transfer (pending admin reconciliation).

### Core System & UI
- [ ] **SYS-01**: Frontend supports toggleable English and Kannada interfaces.
- [ ] **SYS-02**: Voice dictation available for rapid data entry.

## v2 Requirements
- [ ] **HR-01**: Personnel Management Module.
- [ ] **PUB-02**: Dedicated mobile application for devotees.

## Out of Scope
- [Complex Third-Party Payment Gateways] — Focusing on direct UPI and manual reconciliation for simplicity and cost.
- [Enterprise Cloud Hosting] — App is strictly on-premise with lightweight tunnels for necessary internet access to reduce administration complexity.
- [Backend Localization] — Backend data will be maintained predominantly in English.

## Traceability

| Requirement | Phase |
|-------------|-------|
| DEV-01 | Phase 1 |
| SEV-01 | Phase 1 |
| SEV-02 | Phase 1 |
| FIN-01 | Phase 2 |
| FIN-02 | Phase 2 |
| FIN-03 | Phase 2 |
| INV-01 | Phase 3 |
| INV-02 | Phase 3 |
| INV-03 | Phase 3 |
| REP-01 | Phase 4 |
| REP-02 | Phase 4 |
| REP-03 | Phase 4 |
| PUB-01 | Phase 5 |
| SYS-01 | Phase 5 |
| SYS-02 | Phase 5 |
