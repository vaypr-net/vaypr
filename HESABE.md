# Hesabe sandbox integration

New checkout can use Hesabe hosted payment selection with `PAYMENT_PROVIDER=hesabe`.
This release uses the Hesabe sandbox on staging or, with explicit deployment opt-in,
on the live Vaypr site. Live-domain use requires `HESABE_SANDBOX_ON_LIVE_SITE=true`,
matching live callback URLs and the actual database `vaypr`. Staging uses
`vaypr_staging`. Neither deployment makes real payment charges.

## Scope

- KWD hosted checkout, including methods enabled by Hesabe for the test merchant.
- Monthly access or yearly access with the advertised 15% annual discount.
- Integer fils calculation from the active plan record, never a client-supplied amount.
- Backend-only AES-256-CBC request encryption and transaction enquiry.
- GET/form-POST return, failure return, JSON webhook, authenticated verification.
- Atomic paid order, account access and transaction entry; repeated verification is idempotent.
- Sandbox orders and transactions use dedicated collections. They never enter revenue
  or affiliate commission accounting. No customer PII is sent to the shared test merchant.
- Sandbox account access expires at the end of the paid term. Limit checks enforce
  the end date and a periodic task downgrades expired accounts to the Free plan.

This is fixed-term access with manual renewal. Automatic recurring charges,
Hesabe refunds, referral commissions and migration of active Stripe subscriptions
are not enabled. The pricing confirmation and account screen disclose this.
Existing active Stripe subscriptions cannot start a new Hesabe checkout, and their
existing webhook, history and cancellation flows remain available.

## Configuration

Use `.env.staging.example` for the required variables and obtain the four public
sandbox credential values from the official Sandbox Environment documentation.
Do not commit credentials. `FRONTEND_URL` and `HESABE_CALLBACK_BASE_URL` must be the
matching URLs for the selected deployment. `.env.hesabe-live.example` documents
the live-site sandbox opt-in; preserve all existing live backend credentials.

Return URLs and webhook URL are sent with every checkout. No provider dashboard
webhook configuration is required for this request-level integration.

## Validation

Run backend build and `jest --runInBand --runTestsByPath src/billing/hesabe.spec.ts`.
Run frontend build and `vitest run`. Verify successful and cancelled sandbox payments
using the official test cards, then refresh/replay verification and confirm exactly
one sandbox transaction. Verify the amount, currency, ownership, unknown webhook,
and failed/pending enquiry cases before any production cutover.

Paid access is granted only after enquiry returns `SUCCESSFUL` and the saved token,
reference and integer amount match. If enquiry includes currency, it must also match.
The documented enquiry response omits currency; in that case the currency binding
comes from the persisted KWD request and the exact checkout token/reference.

Hesabe's public guides contain inconsistent legacy snippets (HTTP URLs, spelling,
PHP padding). This integration uses HTTPS and the current sandbox `/checkout`,
`/payment`, and `/api/transaction/{token}` endpoints. The decryptor accepts padding
from both official kits, while the encryptor follows the JavaScript kit.

## Sources

- https://developer.hesabe.com/docs/guides/sandbox-environment/
- https://developer.hesabe.com/docs/guides/hesabe-indirect-integration/
- https://developer.hesabe.com/docs/guides/encryption-library/
- https://developer.hesabe.com/docs/guides/webhook-integration/
- https://developer.hesabe.com/docs/guides/transaction-enquiry/
- https://developer.hesabe.com/docs/guides/subscription-method/

## Deployment and rollback

Deploy from a feature branch/worktree using the appropriate compose file. Preserve
the prior staging image IDs before replacing containers. Roll back by restoring
those image tags and the prior backend environment. Live-site sandbox deployment
changes new checkout to Hesabe sandbox while keeping test ledgers separate from
revenue and preserving existing Stripe subscription lifecycle handling.

An embedded database fallback credential was removed from the existing app module.
It remains in repository history and should be rotated separately before production
cutover; all deployments must supply `MONGODB_URI` explicitly.
