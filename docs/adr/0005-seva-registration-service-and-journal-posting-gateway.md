# Seva Registration Service and Journal Posting Gateway Seam

Previously, `backend/app/modules/seva/router.py` directly executed inline imports of `check_date_locked` and `auto_post_journal` inside its HTTP request handler, leaking accounting domain constraints and voucher schemas into booking operations.

We decided to establish an explicit transaction seam:
1. **Journal Posting Gateway Seam (`JournalPostingGateway`)**:
   - Defines abstract contract for fiscal date lock verification and journal voucher posting.
   - `AccountingJournalAdapter`: Live production adapter delegating to accounting services.
   - `NoopJournalAdapter`: Test isolation adapter allowing Seva booking tests to execute without seeding accounting ledgers or fiscal date close tables.
2. **Domain Service (`SevaRegistrationService`)**:
   - Encapsulates registration persistence, date formatting, fiscal lock checks, and journal voucher delegation in an atomic database transaction.
3. **Thin Controller**:
   - The route handler in `router.py` delegates to `SevaRegistrationService`, injected via FastAPI dependencies.
