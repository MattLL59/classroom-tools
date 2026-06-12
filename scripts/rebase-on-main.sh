#!/usr/bin/env bash
# Rebase current branch onto latest origin/main (preferred over merge commits).
set -euo pipefail
branch="$(git branch --show-current)"
echo "Fetching origin/main…"
git fetch origin main
echo "Rebasing ${branch} onto origin/main…"
git rebase origin/main
echo "Done. Push with: git push -u origin ${branch} --force-with-lease"
