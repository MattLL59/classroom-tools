# Classroom Tools

Static HTML apps for classroom use (GitHub Pages).

## Answer Architect v131

**Copyright © 2026 J.M.Lupton-Levy (James Matthew Lupton-Levy). All rights reserved.**

This repository is public so that the tools can be hosted, but it is not open source. No licence is granted to copy, modify, host, distribute or sell Answer Architect, in whole or in part, except by written permission from the author. Viewing or forking this repository on GitHub does not grant any further rights.

Institutions using Answer Architect do so under a separate written licence from the author.

For permission or licensing enquiries, contact the author: matt.answerarchitect@gmail.com

### Files

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

### Third-party libraries

Answer Architect loads these libraries at run time. Each keeps its own copyright and licence:

- PDF.js – Mozilla Foundation, Apache License 2.0
- Mammoth – Michael Williamson, BSD 2-Clause Licence
- Tesseract.js – Apache License 2.0

### Exam board material

Lessons that users build with Answer Architect may contain exam board papers, mark schemes or extracts. That material belongs to its owners and remains subject to the exam board's own terms of use.
