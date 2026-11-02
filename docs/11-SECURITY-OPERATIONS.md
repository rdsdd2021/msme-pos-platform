# 11 — Security, Deployment and Operations

## 1. Home server deployment stance

The Ubuntu home server is suitable for development, staging and a controlled pilot if properly secured. It should not be assumed to provide commercial-grade uptime.

Before production:
- Evaluate power, UPS, cooling and hardware health.
- Confirm ISP terms, upload bandwidth, static/reliable connectivity and uptime.
- Ensure router/firewall and DNS are robust.
- Create off-site encrypted backups.
- Test restore to a separate machine.
- Establish monitoring and incident response.
- Plan a migration path to cloud/dedicated hosting.

## 2. Docker Compose services

Initial:
- reverse proxy (Traefik)
- backend API
- PostgreSQL
- worker process when needed
- backup job
- lightweight monitoring

Web frontend may be deployed separately or in the same compose stack. Do not expose database port publicly.

## 3. Network security

- HTTPS only for public app/API.
- PostgreSQL accessible only on private Docker network.
- SSH key authentication; disable password login where operationally safe.
- Firewall allow only required inbound ports.
- Keep OS, Docker and dependencies patched.
- Do not expose database admin tools publicly.
- Use VPN or secure access gateway for administration.
- Apply rate limits and request size limits.

## 4. Secrets

- Store secrets in environment files with restrictive permissions or a secrets manager.
- Never commit `.env`.
- Provide `.env.example` with placeholders only.
- Rotate credentials if exposed.
- Separate development, staging and production credentials.
- Never include database credentials or privileged keys in Flutter/web bundles.

## 5. Backups

- Automated daily PostgreSQL backup at minimum.
- More frequent WAL/PITR strategy when customer volume justifies it.
- Encrypt backups before off-site transfer.
- Keep multiple retention windows.
- Back up object storage and configuration.
- Perform monthly restore drill initially.
- Document RPO and RTO.

Initial pilot targets to review:
- RPO: no more than 24 hours for daily backup alone; improve with WAL archiving.
- RTO: restore service within a documented, tested window.
Do not advertise these targets until proven.

## 6. Observability

- Health/readiness endpoints.
- Structured JSON logs.
- Request ID propagation.
- Error tracking.
- Disk, memory, CPU and database health alerts.
- Backup success/failure alert.
- SSL certificate expiry alert.
- Device sync health and last-seen monitoring.
- Printer errors visible to user/support.

## 7. Privacy and compliance

- Collect only necessary personal information.
- Provide privacy notice and retention/deletion process.
- Restrict access to customer phone/address/payment details.
- Review applicable Indian data protection requirements with counsel.
- Review GST invoicing, record retention, e-invoice/e-way bill eligibility and current API rules with a CA/authorised provider.
- Do not state that GSTR preparation equals filing.
- Maintain audit trails for privileged and financial actions.

## 8. Incident response

For data integrity incident:
1. Stop affected posting path if needed.
2. Preserve logs and database state.
3. Identify affected tenants and transaction IDs.
4. Prevent duplicate retries.
5. Reconcile invoices, payments, stock and journals.
6. Correct via documented reversal/adjustment.
7. Notify affected customer as legally/contractually required.
8. Record root cause and regression test.

## 10. Access Control & RBAC Enforcement

### 10.1 Tenancy & Branch Boundary Guarantees
1. **Never Trust Client Identifiers**: `tenant_id` and `branch_id` sent in request bodies, URL params, or custom headers are never trusted as proof of authorization.
2. **Membership Resolution**: The `TenantGuard` maps the authenticated `userId` against `tenant_memberships` for the requested tenant. If no active membership exists, the request is terminated with `403 Forbidden: Tenant membership required`.
3. **Cross-Tenant IDOR Prevention**: A user authenticated with Tenant A attempting to access resources belonging to Tenant B (e.g. `GET /tenants/B/branches` or `GET /catalog/products?tenantId=B`) is blocked immediately with `403 Forbidden`.
4. **Branch Scope Enforcement**:
   - `branch_id IS NULL` in `tenant_memberships`: User holds tenant-wide authority (Store Owner, global Accountant) and may operate across all branches.
   - `branch_id IS NOT NULL`: User is strictly confined to that physical branch. If the caller provides or attempts to target a different branch (`route.params.branchId != user.branchId`), `TenantGuard` rejects the call with `403 Forbidden: Cross-branch access denied`.
5. **Session & Token Storage Security**:
   - Web application: Uses `HttpOnly`, `SameSite=Strict`, `Secure` cookies for refresh tokens (`pos_refresh_token`). Refresh tokens are never stored in browser `localStorage` or `sessionStorage` to eliminate XSS-based session hijacking.
   - Mobile application: Uses OS-level secure keystore/keychain via `flutter_secure_storage`.
   - Refresh tokens are hashed using SHA-256 before storage in PostgreSQL and support atomic rotation and immediate server-side revocation.

### 10.2 Immutable Audit Logging
High-risk financial and administrative operations generate permanent records in `audit_logs`:
- Manual stock adjustments (`stock.adjustment.manual`): Requires mandatory reason string.
- Khata debt repayments (`khata.payment.record`).
- Shift closures (`shift.close.self` and `shift.close.override`).
- Tenant membership lifecycle (`tenant.member.add`, `tenant.member.update`, `tenant.member.revoke`).
Each audit log records `actor_user_id`, `tenant_id`, `branch_id`, `action`, `resource_type`, `resource_id`, `reason`, `details`, and timestamp `created_at`.

---

## 11. Automated Security Test Scenarios

The suite `apps/backend/src/tenants/guards/rbac-security.spec.ts` verifies 18 automated security and authorization scenarios:

| Test ID | Scenario | Expected Outcome | Verified |
|---|---|---|:---:|
| SEC-01 | Unauthenticated user (no JWT) | `401 Unauthorized` | ✅ |
| SEC-02 | Invalid or nonexistent tenant membership | `403 Forbidden` (`Tenant membership required`) | ✅ |
| SEC-03 | Cashier attempts to create product | `403 Forbidden` (Missing `catalog:create`) | ✅ |
| SEC-04 | Cashier attempts manual stock adjustment | `403 Forbidden` (Missing `stock:adjustment:manual`) | ✅ |
| SEC-05 | Cashier attempts to register device | `403 Forbidden` (Missing `device:manage`) | ✅ |
| SEC-06 | Cashier attempts to access business-wide financial reports | `403 Forbidden` (Missing `reports:financial:read`) | ✅ |
| SEC-07 | Branch Manager attempts to access a different branch | `403 Forbidden` (`Cross-branch access denied`) | ✅ |
| SEC-08 | Inventory Staff attempts to create sales/invoices | `403 Forbidden` (Missing `billing:pos:create`) | ✅ |
| SEC-09 | Accountant attempts to modify product prices/details | `403 Forbidden` (Missing `catalog:update`) | ✅ |
| SEC-10 | Accountant accesses permitted financial & daily reports | `200 OK` (Permitted) | ✅ |
| SEC-11 | Owner accesses all business operations across branches | `200 OK` (Permitted) | ✅ |
| SEC-12 | Revoked tenant membership attempts operations | `403 Forbidden` (`Membership is suspended or revoked`) | ✅ |
| SEC-13 | Revoked refresh token attempts session renewal | `401 Unauthorized` (`Invalid refresh token`) | ✅ |
| SEC-14 | Cross-tenant IDOR attempt (User A accesses Tenant B) | `403 Forbidden` (`Tenant membership required`) | ✅ |
| SEC-15 | Cashier processes sale within assigned branch | `200 OK` (Permitted) | ✅ |
| SEC-16 | Inventory Staff records stock movement in assigned branch | `200 OK` (Permitted) | ✅ |
| SEC-17 | Branch-scoped user attempts tenant-wide operation | `403 Forbidden` (`Requires tenant-wide authority`) | ✅ |
| SEC-18 | Multi-role user receives combined union of permissions | `200 OK` (Permitted) | ✅ |
