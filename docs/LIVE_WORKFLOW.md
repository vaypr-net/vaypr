# VAYPR live publishing

Website: https://vaypr.net  
API: https://api.vaypr.net  
Source: https://github.com/vaypr-net/vaypr

The owner's default request is to implement and publish website changes to production, then verify the visible result. A local edit alone does not update the website. The path is:

Codex project → feature branch → validated pull request → merge into main → GitHub Actions → Hostinger Docker deployment → live browser verification.

## One-time local connection

The Codex VAYPR project is /Users/fahadmacmini/Documents/ChatGPT/VAYPR, with origin set to https://github.com/vaypr-net/vaypr.git. The project-local official GitHub CLI is .codex/bin/gh. Its local configuration is .codex/github/; both are ignored and not part of the source repository. OS keychain storage is preferred; never paste a token into chat or commit credentials.

Use the wrapper from the repository root:

```bash
scripts/github.sh auth status
scripts/github.sh repo view vaypr-net/vaypr
```

Git's local HTTPS credential helper invokes that wrapper. This connection is machine-local. New clones or other machines need their own GitHub authentication. A browser login alone does not authenticate terminal Git.

## Routine change

```bash
git fetch origin
git switch -c codex/describe-change origin/main
# Implement and run the relevant checks in AGENTS.md.
git add <explicit-files>
git commit -m "Describe the resulting behavior"
git push -u origin HEAD
scripts/github.sh pr create --base main --title "Describe the change" --body-file /path/to/reviewed-description.txt
# Review the PR and its checks, attach it to the chat, then merge.
scripts/github.sh pr merge <number> --squash
scripts/github.sh run list --workflow deploy-production.yml --branch main --limit 5
scripts/github.sh run watch <run-id> --exit-status
```

Verify that the workflow run belongs to the merged commit. Inspect the actual public page after a successful deployment, including the changed interaction. If the user only requested a review or preview, do not merge/deploy.

## Existing production deployment

.github/workflows/deploy-production.yml builds frontend/backend, runs frontend and Hesabe regression tests, connects using the existing VPS_HOST, VPS_PORT, VPS_USER, and VPS_SSH_KEY secrets, and deploys /home/deploy/vaypr. No new website API key or AI chatbot is needed for this workflow.

The workflow validates Compose without exporting resolved secrets, saves the running image IDs under the :previous tags, builds new images, waits for healthy containers, and checks public HTTPS routes. Browser verification remains necessary for the requested visible behavior. Deployments take a few minutes and may restart containers.

## Recovery

Inspect the failed workflow step before acting. The normal remedy is a fix or revert through a new PR. For an urgent container rollback, an authorized operator can use the existing VPS console to check the previous image tags and deploy an override:

```yaml
# Temporary rollback override on the VPS, outside the repository.
services:
  backend:
    image: vayper-backend:previous
  frontend:
    image: vayper-frontend:previous
```

Run Docker Compose with the existing compose file plus that override and --no-build. Confirm health and the live page. Then reconcile GitHub source with the recovery; a later main deployment uses the repository again. Image rollback does not reverse database changes or restore an older .env.

## Current payment configuration

Hesabe sandbox runs on the live domain. No real-money settlement has been enabled. New fixed-term purchases use manual renewal; sandbox ledger entries are isolated from normal revenue. Preserve these distinctions in UI and verification.
