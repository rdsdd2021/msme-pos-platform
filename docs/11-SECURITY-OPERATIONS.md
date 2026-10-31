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

## 9. Production readiness checklist

- [ ] HTTPS and firewall reviewed
- [ ] PostgreSQL not publicly exposed
- [ ] Secrets rotated and protected
- [ ] Tenant isolation tests passed
- [ ] Backup and restore tested
- [ ] Monitoring and alerts active
- [ ] Database migrations tested
- [ ] Error handling and logs reviewed
- [ ] Device revocation tested
- [ ] Offline retry tested
- [ ] Printer compatibility recorded
- [ ] Privacy and terms reviewed
- [ ] CA-reviewed GST/accounting configuration
- [ ] Pilot support and escalation process documented
