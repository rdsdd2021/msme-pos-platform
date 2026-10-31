# 06 — Offline-First and Synchronisation Design

## 1. Goal

A cashier can complete a sale, save it durably on the device and print a receipt without internet. When connectivity returns, the device synchronises without losing or duplicating transactions.

## 2. MVP device model

Android and Windows/web offline billing are both P0 release requirements. Web offline support is not satisfied by merely caching static pages: the cart, product cache, tax settings, local invoice, payment record, stock movement and outbox must be committed to IndexedDB atomically before success is shown. The PWA must reopen into a usable POS shell without network.

Each Android and Windows/web device works independently and synchronises directly with the central server. Android uses SQLite. Windows/web uses a PWA shell, IndexedDB and a service worker. There is no local master device in MVP. Devices may have temporarily divergent stock views while disconnected. Browser storage can be evicted or cleared, so the web app must request persistent storage where supported, warn about unsynced data and provide clear device-health status.

Web offline capability must be explicitly implemented using IndexedDB and a service worker if it is included in the first web release. A normal browser cache is not a complete offline architecture.

## 3. Local-first sale transaction

Within one SQLite transaction:
1. Allocate a local transaction UUID.
2. Validate cached product and tax configuration.
3. Calculate totals with decimal-safe library.
4. Insert local invoice header and lines.
5. Insert local payment records.
6. Insert local stock movement records.
7. Insert outbox operation.
8. Commit.
9. Update UI to show saved locally.
10. Attempt printing independently.

If the transaction fails before commit, no success state is shown.

## 4. Outbox model

Fields:
- operation_id UUID
- device_id UUID
- sequence integer
- operation_type
- schema_version
- payload JSON
- created_at
- retry_count
- next_attempt_at
- status (pending, sending, accepted, rejected, needs_review)
- last_error_code
- server_entity_id nullable

Outbox entries are retained until server acknowledgement and a defined retention policy permits archival.

## 5. Sync protocol

1. Authenticate device and user.
2. Push a bounded batch of pending operations.
3. Server validates device, tenant, branch, permission, schema and payload.
4. Server inserts operation under unique `(tenant_id, device_id, operation_id)`.
5. If already present, return the stored prior result.
6. If new, process business transaction atomically.
7. Persist acknowledgement/result.
8. Client marks accepted operations complete.
9. Client pulls remote changes after its last cursor.
10. Client applies deltas transactionally and advances cursor only after successful apply.

Use exponential backoff with jitter for transient failures. Do not retry permanent validation/permission errors endlessly.

## 6. Conflict rules

- Sales: immutable event, idempotent ingestion.
- Payments: append-only, reconcile external settlement separately.
- Stock: append-only movements; balances are projections.
- Product updates: server revision/version; conflicting edits require explicit resolution.
- Customer contact updates: field-aware merge or server review.
- Settings and permissions: server-authoritative.
- Posted journal entries: immutable; corrections by reversal.

Never apply last-write-wins to money, stock or posted accounting.

## 7. Offline invoice numbering

Do not let each offline device invent invoice numbers.

Preferred design:
- Server reserves a non-overlapping invoice number range for a device/branch/series/financial year.
- Device uses its reserved range while offline.
- Unused numbers are tracked.
- Server validates uniqueness on sync.
- Cancellation/unused-number treatment is defined with CA review and applicable GST rules.
- If no valid range remains, device must clearly block official invoice posting or use a legally reviewed temporary document workflow.

## 8. Stock behaviour offline

- Device displays last-known stock and timestamp.
- Local sales update local stock projection.
- Negative stock behaviour is tenant-configurable.
- If multiple devices sell the same last unit offline, server reconciliation can reveal negative central stock.
- Flag discrepancies for manager review; do not silently rewrite invoices.
- For strict stock control, business can require online validation for high-risk/limited stock products.

## 9. Sync observability

UI must display:
- Online/offline indicator.
- Last successful sync time.
- Pending operation count.
- Failed operation count.
- Current device and branch.
- Sync error explanation.
- Manual retry action.
- Data freshness warning.

Admin report should show device last seen, app version and sync health.

## 10. Data security

- Encrypt device credentials.
- Protect local database and sensitive data at rest where practical.
- Do not store auth refresh tokens in plain preferences.
- Revoke lost devices.
- Limit cached data to assigned tenant/branch and user needs.
- Avoid logging customer/payment sensitive information.
- Clear tenant cache on logout/device reassignment according to secure wipe policy.

## 11. Failure test matrix

Test:
- Internet lost before local commit.
- Internet lost after local commit but before push.
- Server commits but response is lost.
- Same batch sent repeatedly.
- App killed during push.
- App killed while applying pull.
- Device clock wrong.
- Product updated on another device.
- Device revoked while offline.
- Invoice number range exhausted.
- Two devices sell last unit offline.
- Partial batch rejection.
- Old client schema version.
- Printer unavailable after sale commit.

## 12. Important product boundary

Offline means a device can continue using previously synchronised reference data and its own local transaction history. It does not mean every device instantly knows about another offline device's sales. The UI must communicate this limitation honestly.
