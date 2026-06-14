# Answer Architect v131 — branch & merge workflow

Goal: **stop minor merge conflicts on every pull** by separating concerns, using one build-stamp source, and rebasing instead of stacking merge commits.

---

## 1. Single owner per hotspot

`architect_v131.html` is one ~35k-line file. Parallel branches touching the same region will always conflict.

| Area | Owner branch | Do **not** edit from other branches |
|------|----------------|-------------------------------------|
| **Teacher Settings shell** (Data modal, Esc/✕, tabs, z-index, hydrate defer) | `cursor/c1-lines-from-selection-f806` (until #143 merges) → then **`cursor/v131-admin-shell-f806`** off updated `main` | Passage slicing, worksheet, C2-only |
| **C1 passage / line wrap / anchor** | `cursor/fix-v131-passage-slicing-f806` | Admin modal chrome |
| **C1 UX / question split** | `cursor/c1-ux-question-split-f806` | Admin modal |
| **C2 layout / wrap** | `cursor/c2-phase-4a-layout-f806` | Admin modal |
| **Worksheet / quote bank** | `cursor/worksheet-from-quote-bank-f806` | Admin modal |
| **Docs / manuals only** | `cursor/docs-answer-architect-manuals-f806` | `architect_v131.html` logic |

**Rule:** If your task is “Data menu broken”, work only on the **admin-shell** owner branch. Do not open a second PR with overlapping modal fixes.

---

## 2. Build stamps — one source of truth

**Authoritative file:** `architect-version.json`  
**Generated into HTML:** `<meta name="architect-build">` and `<meta name="architect-deploy">` via script.

### Bump (every functional deploy)

```bash
node scripts/bump-architect-build.mjs <short-deploy-slug>
# example:
node scripts/bump-architect-build.mjs admin-esc-emergency-close
```

### Sync only (after hand-editing version.json)

```bash
node scripts/sync-architect-build.mjs
```

**Do not** manually edit build meta tags in `architect_v131.html`. That duplicate edit is the #1 cause of trivial merge conflicts.

Optional fields in `architect-version.json`:

| Field | Purpose |
|-------|---------|
| `build` | ISO-ish stamp shown in UI (`2026-06-02T18:00:00`) |
| `gitCommit` | Short deploy slug (same as `architect-deploy` meta) |
| `rev` | Feature rev label (optional; synced to `architect-rev` meta) |
| `cacheBust`, `pagesUrl`, `recoveryUrl` | Auto-derived by sync script |

---

## 3. Git rhythm (rebase, not merge)

After **any** related PR lands on `main`:

```bash
git fetch origin main
./scripts/rebase-on-main.sh
# resolve conflicts once, then:
git push -u origin <your-branch> --force-with-lease
```

**Prefer rebase over `git merge origin/main`** on long-lived fix branches. Merge commits replay the same admin-modal hunks and produce another conflict layer.

### Conflict triage

| Files | Type | Resolution |
|-------|------|------------|
| `architect-version.json` | Trivial | Keep **higher** `build` timestamp; re-run `node scripts/sync-architect-build.mjs` |
| Meta tags in HTML | Trivial | Run sync script; do not hand-merge |
| `bindAdminModalChromeOnce`, `closeTeacherSettings`, modal CSS | Same intent | Keep **admin-shell owner** branch version |
| Unrelated passage/worksheet hunks | Real | Merge both intents carefully |

---

## 4. PR checklist (admin-shell changes)

1. Work on the **owner branch** only.
2. `node scripts/bump-architect-build.mjs <slug>` before commit.
3. Rebase onto `origin/main` immediately before opening/updating PR.
4. Test canonical URL from `architect-version.json` → `pagesUrl`.
5. **One PR per bugfix line** — merge to `main`, then rebase owner branch; avoid #140 → #141 → #142 stacking the same fix.

---

## 5. Current state (2026-06-02)

| PR | Branch | Status |
|----|--------|--------|
| [#143](https://github.com/MattLL59/classroom-tools/pull/143) | `cursor/c1-lines-from-selection-f806` | Admin Esc/✕ emergency close — **merge this, then retire parallel admin fixes** |

**After #143 merges:**

1. `git checkout main && git pull origin main`
2. `git checkout -b cursor/v131-admin-shell-f806`
3. All future Data-modal work happens there (or directly on `main` if changes are tiny).
4. Delete or freeze stale `cursor/c1-lines-from-selection-f806` admin commits; use `fix-v131-passage-slicing-f806` only for passage work.

---

## 6. Delete branch after merge?

**Yes — safe and recommended** once the PR is merged to `main`.

| Question | Answer |
|----------|--------|
| Does deleting the branch delete the code? | **No.** Merged code lives on `main` forever. |
| Does deleting the branch break GitHub Pages? | **No.** Pages deploys from `main` (this repo), not feature branches. |
| Should you delete `main`? | **Never.** |
| What if GitHub shows "Delete branch"? | Click it for the **merged feature branch** only. |

**Why delete:** avoids opening PRs from stale branches, rebasing the wrong branch, or editing code that is not what users get on Pages.

**When to keep a branch:** only if you are still actively committing on it for a follow-up PR. After merge, either delete it or run `./scripts/rebase-on-main.sh` on a fresh owner branch (see §3).

### Correct rhythm for you

1. One **owner branch** per hotspot (e.g. `cursor/v131-admin-shell-f806` for Data modal).
2. Open PR → review → **merge to `main`**.
3. **Delete the merged feature branch** on GitHub (button on the PR).
4. Locally: `git checkout main && git pull origin main`.
5. Next fix: `git checkout -b cursor/v131-admin-shell-f806` (same name is fine) from updated `main`.
6. Bump build, commit, push, **new PR**.

Deleting branches did **not** cause the dead buttons. That comes from loading the wrong file, cached HTML, or the lesson-load gate blocking JS.

---

## 7. Longer-term (reduces pain further)

- Extract `architect-admin-shell.js` (modal chrome, Esc, tabs) from the monolith when a deploy split is acceptable.
- Worksheet **3b** as separate HTML (per `PASSAGE_V131_CHECKLIST.md`) — keeps worksheet diffs out of v131.
