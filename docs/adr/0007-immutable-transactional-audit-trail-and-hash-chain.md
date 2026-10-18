# Immutable Transactional Audit Trail and Cryptographic Hash-Chain

Financial transactions, Seva booking cancellations, and Devotee records require immutable accountability for fraud prevention, statutory auditor scrutiny, and trustee oversight.

We decided to establish a unified, tamper-evident transactional audit trail:

1. **Unified Schema (`audit_logs`)**:
   - Stores polymorphic entity mutations (`entity_type`, `entity_id`, `actor_id`, `actor_username`, `actor_role`, `client_ip`, `action`, `changes`, `reason`, `prev_hash`, `hash`, `timestamp`).
   - Captures field-level before/after changes as JSON (`{field: {"old": ..., "new": ...}}`) without duplicating tables into shadow schemas.

2. **Cryptographic Tamper-Evidence**:
   - Implements a SHA-256 hash-chain where each audit record calculates its hash using its contents combined with the preceding record's hash (`hash = SHA256(prev_hash + timestamp + actor + entity + changes)`).
   - Any backdated row alteration, insertion, or deletion breaks the hash chain, enabling immediate detection during trustee and statutory auditor verification.

3. **Database-Level Immutability**:
   - Database triggers (`BEFORE UPDATE OR DELETE ON audit_logs`) raise an exception rejecting modifications, ensuring records cannot be altered or removed even via direct SQL access.

4. **Mandatory Justification on Sensitive Actions**:
   - Critical operations (`SOFT_DELETE`, `RECEIPT_CANCELLATION`, `PASSWORD_RESET`, `VOUCHER_ADJUSTMENT`) enforce an explicit non-empty `reason` payload, rejecting transactions if omitted.

5. **Query Indexes**:
   - Optimized for instant auditor drill-downs with compound indexes on `(entity_type, entity_id)` for entity lifecycles, `(timestamp DESC)` for chronological feeds, and `(actor_username, timestamp DESC)` for staff activity audits.
