# Permanent subscriber deletion

Permanent deletion is a separate super-admin action. Archive remains the reversible choice.

## Restrictions and confirmation

- The account must already be archived. Super-admin accounts and self-deletion are prohibited.
- Current paid access must finish or be ended separately. A scheduled future end is not sufficient.
- Any legacy Stripe subscription reference blocks deletion: reconcile it separately; this feature never calls Stripe or Hesabe to cancel a subscription or move money.
- Open Hesabe checkouts, pending payment ledger entries, and pending/processing refunds block deletion.
- The administrator reviews server-calculated record counts, then types the subscriber email, `DELETE`, a reason, and acknowledges both irreversibility and retention.
- The signed preview expires after ten minutes and is bound to the administrator, account, version, and record counts. Changes require a new review. Preview tokens cannot authenticate API requests.

## What is removed

The User record (including saved credentials and OAuth/2FA/reset secrets), profile, saved sessions, clients, invoices, quotes, receipts, recurring invoice schedules, expenses, local senders/email/domain settings, notifications, and support tickets owned by the original subscriber ID. Deleted records cannot be restored through VAYPR.

This removes database workspace records, not previously downloaded or shared copies, backups, externally hosted upload objects, DNS records, or data held by email/payment providers. Export required documents before confirming deletion. This is an account-removal feature, not a claim that every external copy has been erased.

## What is retained

- VAYPR payment transactions and the isolated Hesabe sandbox transaction ledger.
- Hesabe order records, original payment/provider references, dates, amounts, currency, status and original subscriber IDs.
- The subscriber name/email snapshots in financial records, referral/commission records, historical administrative activity, and a separate deletion audit containing the identity, administrator, reason, time, prior management history and removed/retained counts.
- The payment records retain their original environment. Sandbox entries remain test payments and do not become revenue.

Deletion changes only lifecycle metadata on retained financial records. It never refunds, cancels provider billing, changes amounts, anonymizes accounting identity, or transfers history to a newly registered account with the same email. Existing transaction update/delete endpoints reject retained records marked with `subscriberDeletedAt`.

`Deletion History` provides read-only access after the User record is gone. It shows the latest 100 deleted accounts and up to 100 entries from each ledger per account. Provider tokens and redirect payloads are excluded from the response. The underlying records are not truncated. No automatic retention expiry is configured by this feature.

## Atomicity and access

All database removals, financial retention markers and the deletion audit commit in one MongoDB transaction. A failure aborts all of them. MongoDB Atlas replica-set transactions are required; there is no nontransactional fallback.

Authenticated API calls check the current User record and current super-admin role. An old JWT stops authenticating after deletion. The obsolete unguarded `DELETE /user/:id` route is removed; user lookup/update routes also require the current account and appropriate ownership/role.

Hesabe checkout reservation writes the account and creates the order in one transaction, preventing checkout reservation from racing account deletion. A verified late success on an old terminal order is retained as a payment needing manual reconciliation; it never recreates or activates a deleted account. Refund decisions remain separate.

## Validation

Run the standard builds, frontend tests, subscriber/controller/authentication tests and Hesabe regressions in AGENTS.md. Additional destructive integration checks use only an ephemeral local MongoDB replica set:

```sh
npm install --prefix /private/tmp/vaypr-deletion-integration --no-audit --no-fund mongodb-memory-server@10
cd backend
npm run build
VAYPR_MONGODB_MEMORY_SERVER=/private/tmp/vaypr-deletion-integration/node_modules/mongodb-memory-server node test/subscriber-deletion.integration.cjs
```

This downloads an official MongoDB binary if needed, starts a local replica set and removes it afterward. It does not load a production URI or `.env`. It verifies collection ownership (including legacy string IDs), financial-field preservation, rollback, stale previews, explicit confirmation, role checks, old-token rejection, HTTP validation and checkout reservation.

Live QA must stop before `Delete Permanently` unless the owner explicitly confirms the particular account for permanent deletion at that time.
