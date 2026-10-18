# Matha Operational Role Taxonomy and Permission Matrix

Generic staff roles (`clerk`, `accountant`, `storekeeper`) in the intranet application fail to reflect sacred temple operational realities, lacking necessary privacy protections for devotees and strict financial controls for counter cash.

We decided to establish a dedicated five-persona Matha domain role taxonomy and permission matrix:

1. **Archaka (Priest)**:
   - **Ritual Scope**: Read-only access to the daily `SankalpaList` and write access to mark `SevaFulfillment` (confirming ritual conduct and prasada preparation).
   - **Devotee Privacy Boundary**: Allowed to view only ritual prayer attributes (Devotee Name, Gotra, Nakshatra, Rashi). Devotee contact particulars (phone, WhatsApp, email, home address) are masked on all priest-facing operational views and dispatches.
   - **Zero Financial Access**: No access to accounting ledgers, financial vouchers, or administrative settings.

2. **CounterCashier**:
   - **Operational Scope**: High-speed write access to `seva` bookings (`SevaRegistration`, `SevaBookingCart`, receipt printing) and `devotee` directory management (phone search and profile creation).
   - **Cash Management**: Financial write access is restricted strictly to counter receipt vouchers and daily counter drawer reconciliation.
   - **Cancellation Restriction**: Counter cashiers cannot void or cancel issued receipt vouchers. Any `ReceiptCancellation` requires Office Admin supervisor credentials and mandatory audit reason capture.

3. **Office Admin**:
   - **Administrative Scope**: Full administrative control across all operational modules, master settings, Seva catalog quotas and pricing, and user administration.
   - **Supervisory Controls**: Sole operational authority to approve `ReceiptCancellation` events, adjust fiscal date locks, and review transactional audit trails.

4. **Trustee (Management Committee)**:
   - **Executive Oversight**: Read-only governance visibility across all modules (`seva`, `devotees`, `accounting`, `inventory`, `reports`, `audit`). Zero write permissions to eliminate risk of operational ledger modification.

5. **Auditor (Chartered Accountant)**:
   - **Compliance Scope**: Read-only statutory access across accounting ledgers, vouchers, donations, and immutable audit logs, with unrestricted export capabilities for trust audit filings.

6. **Enforcement Contract**:
   - Policies are defined through module-level permissions (`none`, `read`, `write`, `full`) augmented with explicit capability flags (`can_cancel_receipts`, `can_export_financial_reports`, `can_view_devotee_pii`).
