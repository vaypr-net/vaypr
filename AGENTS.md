# VAYPR project instructions

## Website and source of truth
- Production website: https://vaypr.net
- Production API: https://api.vaypr.net
- GitHub repository: https://github.com/vaypr-net/vaypr
- Frontend: frontend/ (React + Vite). Backend: backend/ (NestJS).
- Production runs in Docker on the Hostinger VPS. MongoDB is on Atlas; email uses Brevo.
- The normal local project folder is /Users/fahadmacmini/Documents/ChatGPT/VAYPR. Worktrees may use a different path; resolve commands relative to the current checkout.

## User's publishing preference
- The owner wants requested website changes implemented and published to the LIVE website by default. Routine requested edits, additions, and removals include authorization to commit, push, create and merge a PR, and deploy after validation.
- Do not stop at a proposal, local preview, staging deployment, PR creation, or a successful build. Wait for production deployment, inspect the relevant live page, and report the result with the live link and a screenshot.
- If the user asks only for advice, a draft, review, or preview, honor that narrower scope.
- A request to remove a UI component does not authorize deleting customer records. Irreversible data deletion, credential/access changes, and real financial actions require the applicable separate confirmation. Platform approval rules still apply.

## Implementation and publishing
1. Check git status and fetch origin before starting. Preserve unrelated edits. Start each change from current origin/main on a descriptive branch; do not edit or push directly on main.
2. Implement the requested change. Run relevant tests and frontend/backend builds before deployment. The CI workflow also checks frontend tests and Hesabe regression tests.
3. Push the branch and open a PR with a short description and validation results. Use scripts/github.sh for authenticated GitHub CLI commands when available. Attach every created PR to the Codex chat with the pull-request attachment tool when available.
4. Verify mergeability and required checks; squash-merge the PR when the requested change is ready. A push to main triggers .github/workflows/deploy-production.yml.
5. Find the production workflow run for the merged commit and wait for completion. On failure, inspect the actual failed step and repair it; do not claim the change is live.
6. Verify the affected live browser flow and production response. Allow a few minutes for builds/restarts and intentionally reload the page. Capture a screenshot after the requested result is visible.
7. Report what changed, validation, live link, and any material limitation. Keep the local main branch synchronized when clean. Do not claim uninterrupted deployment or real payment settlement from sandbox evidence.

## Checks
- Frontend: cd frontend && npm install && npm test && npm run build
- Backend: cd backend && npm install && npm run build
- Hesabe changes/regression: cd backend && npm test -- --runInBand --runTestsByPath src/billing/hesabe.spec.ts
- Run additional relevant backend tests for the feature changed. Some legacy tests may need separate fixtures; report unrelated failures accurately.
- For instructions/docs-only changes, review the diff; the production workflow remains the build and regression gate.

## Deployment and recovery
- Canonical server checkout: /home/deploy/vaypr. Running containers: vayper-backend and vayper-frontend.
- Deployment uses existing GitHub Actions VPS_* secrets. Do not copy production .env or private keys into this repository or chat.
- The workflow preserves the currently running images as vayper-backend:previous and vayper-frontend:previous before replacing containers. Verify these tags exist before any rollback. Image rollback does not undo database migrations.
- Full runbook and connection checks: docs/LIVE_WORKFLOW.md.

## Secrets and payment state
- Never commit .env files, tokens, database credentials, or private keys. Use .env.example-style placeholders. Never print credential contents.
- Project-local GitHub tools/config in .codex/bin/ and .codex/github/ are local only and must stay ignored. Prefer the OS keychain for GitHub credentials.
- Hesabe is currently SANDBOX on the LIVE domain, explicitly labeled as test payments. Keep merchant secrets server-side and verify authoritative transaction enquiry before granting entitlement.
- Existing Stripe subscription management remains for legacy subscribers. Do not switch to real Hesabe payments, alter money movement, or cancel existing subscriptions without a specific request and the required confirmations.
