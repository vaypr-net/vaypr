#!/usr/bin/env bash
set -euo pipefail
repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
if [[ -x "$repo_root/.codex/bin/gh" ]]; then
  export GH_CONFIG_DIR="$repo_root/.codex/github"
  exec "$repo_root/.codex/bin/gh" "$@"
fi
# Worktrees share authentication with the primary checkout, without copying tokens.
common_git="$(git -C "$repo_root" rev-parse --path-format=absolute --git-common-dir)"
primary_root="$(cd "$common_git/.." && pwd)"
if [[ -x "$primary_root/.codex/bin/gh" ]]; then
  export GH_CONFIG_DIR="$primary_root/.codex/github"
  exec "$primary_root/.codex/bin/gh" "$@"
fi
if command -v gh >/dev/null 2>&1; then
  exec gh "$@"
fi
printf '%s\n' 'GitHub CLI is not configured. See docs/LIVE_WORKFLOW.md.' >&2
exit 127
