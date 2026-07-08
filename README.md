# Classroom Tools

Static HTML apps for classroom use (GitHub Pages).

## Answer Architect v131

- **App:** [`architect_v131.html`](architect_v131.html)
- **Rollback baseline:** [`architect_v130.html`](architect_v130.html) (read-only reference)
- **Older HTML builds:** [`archive/architect-versions/`](archive/architect-versions/) (not maintained)
- **Version:** [`architect-version.json`](architect-version.json) (canonical build stamp)
- **Workflow (branches, merges, build bumps):** [`ARCHITECT_V131_WORKFLOW.md`](ARCHITECT_V131_WORKFLOW.md)

```bash
# Bump deploy stamp (updates version.json + HTML meta tags)
node scripts/bump-architect-build.mjs <deploy-slug>

# Rebase feature branch onto latest main
./scripts/rebase-on-main.sh
```
