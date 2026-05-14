# Passage pipeline — inventory & v131 build checklist

Reference: **`Architect_044.html`** (simple reader/editor split) vs **`architect_v130.html`** (~19.6k lines, PDF + gutter + repair stack). Working file: **`architect_v131.html`** (~20.7k lines; v130 unchanged).

**Last updated:** 2026-04-29 — **Phase 3.2** (margin repair, 2026-04-26) + new appendix **§ Strict PDF, C1 scope & limits — design log** (PDF bounds, repair-kit resources, don’t-discard rich text).

---

## Current product priority (agreed direction)

- **Primary learning goal (passage):** students practice **aligning questions with line numbers**; the existing margin + `data-src-line` + line-range behaviour is **good enough for now**.
- **Not the near-term focus:** a full **“one printed line → one stored row everywhere”** model. That remains **optional / later** unless a new explicit requirement appears.
- **Near-term focus instead:** a **generally cleaner, less cluttered** product; the app should work **reliably in both components**; it should work as a **tool to structure practice and trainer-style questions** on any suitable text, **including pre–past-paper level** work — not only WJEC import perfection.
- **Implication for the checklist:** Phase 1–2 items may still be improved **in passing**; **Phase 3 (PDF and import pipeline)** is the **deliberate next deep planning / execution** track below. **Phase 4 (C1 vs C2 parity)** stays the next **cross-cutting** product gate after or alongside Phase 3, depending on resourcing (see *Next steps* at the end).

---

## Design goals (from 044)

- [x] **Reader** (`#source-inline`, `#source-inline-select`): exam-style line layout; **WJEC-style margin** shows **5 / 10 / 15 / …** on rows whose **booklet line `n`** is a multiple of 5 (`examShowAllBookletLines: false` in `buildNumberedSourceLayoutHtml` for Lab paths). Every row still has `data-src-line` for quotes.
- [x] **Editor** (`#ai-input`, C2 pooled editor): **no** embedded gutter flex in the numbered passage editor — **`formatSourceHtmlForEditor`** uses `<p>` per line / sanitize; structured v2 uses `structuredPassageToEditorHtml` (hanging indent), not exam gutter rows inside contenteditable.
- [~] **HTML stored passage**: reader path **`formatSourceHtml`** prefers structured JSON → `formatStructuredPassageHtml`, else `gutterLayoutHtmlFromCleanPlain` / loose plain. Sanitize-only for rich HTML where applicable — **still verify** edge cases (Phase 1).
- [~] **Numbered plain**: goal remains one printed line → one `N …` line; **PDF import** may merge rows — **display** can split long rows via `splitLongRowsForBookletLineGutter` so Lab gutters are usable (approximate vs strict booklet).

### Editor vs Lab — why screenshots differ (plan vs gap)

This is **mostly (B) part of the plan**, with **(A) a recurring expectation/technical gap** layered on top.

| Topic | **Part of the plan (044 / checklist)** | **What you see in screenshots** |
|--------|----------------------------------------|--------------------------------|
| **Teacher Editing Suite** (`#ai-input`) | **No** exam gutter column inside contenteditable. Numbering is **one `1.` / `2.` / … per stored paragraph (or per v2 row)** via `structuredPassageToEditorHtml` — **sequential 1…24 is intentional** for editing. | One **long** block can show **only one** `1.` at the **start** of the first paragraph (hanging indent); wrapped lines do **not** get new margin figures — that is normal for a single `<p>`. Sections **3–6** or **19–24** are **separate paragraphs**, each with its own prefix. |
| **Student Lab / Quote Select** | **WJEC-style reader**: left column shows **5, 10, 15…** only where **booklet line `n`** is a multiple of 5 (`examShowAllBookletLines: false`); every row still has `data-src-line` for quotes. | Should **not** mirror the editor’s `1. 2. 3.` prefixes; margin ticks are **sparse** by design. |

**Why it felt like (A) — many attempts, goal still “missing”**

1. **Two different “lines”:** The **printed insert** has **booklet lines** (one horizontal line of type). The app often stores **paragraph rows** or **merged PDF blobs**. One **paragraph** = one editor number but **many** wrapped **visual** lines — so “every 5 **lines**” on paper is **not** the same as “every 5 **paragraphs**.”
2. **Editor vs reader were tuned separately:** Iteration added structured v2, PDF heuristics, split-long-rows for **Lab**, import alerts, etc. The **Editing Suite** was not designed to show the same **5/10/15** ladder as the insert; the checklist always separated **reader** behaviour from **editor** markup.
3. **PDF text layer:** If extraction merges **printed** lines, **no** amount of margin CSS will create true per-printed-line ticks until the **stored text** has one row per booklet line (or a dedicated “physical line” model).

**How the plan can accommodate investigation**

- **Phase 2–3** already imply: one **numbered-plain** truth, **repair** passes, **PDF** extraction quality — that **is** the right place to chase “one printed line → one row.”
- **Optional product decisions** (not yet in checklist): e.g. a **read-only** mini Lab inside Teacher Settings so the margin **matches** Quote Select; or **editor** mode that inserts a hard break every *N* characters / per PDF line — each has trade-offs (editability vs fidelity).

**Bottom line:** Continuing **the checklist plan** (Phase 1 cleanup → 4 parity → 5 cleanup) is correct **(B)**. Treat “editor looks like 1…24 paragraphs, Lab should show 5/10/15 on booklet multiples” as **aligned with the plan**, and treat “margin tick on every fifth **wrapped** screen line inside one paragraph” as **out of scope** unless we add an explicit **new** goal and UI.

---

## Phase 0 — Before you edit

- [ ] Tag or branch current **`architect_v130.html`** (e.g. `architect-v130-baseline`) so you can diff anytime — *optional repo hygiene; not done in-file.*
- [x] **Option 2:** Copy **`architect_v130.html` → `architect_v131.html`** (done); edit **v131** only; v130 unchanged.
- [ ] Keep **`Architect_044.html`** in the same folder for side-by-side diff — *verify locally.*
- [~] **Spine:** v131 is the active fork; line count still **~20k+** (slim-down is Phase 5 optional).

---

## Phase 1 — Policy only (no PDF yet)

- [x] Restore **044-style** split in **`formatSourceHtmlForEditor`** (numbered plain → `<p>` per line; HTML → sanitize / strip gutter to plain; prose → `<p>` chunks). **`formatSourceHtml`** (student Lab / Quote Select) uses **`gutterLayoutHtmlFromCleanPlain`**, structured passages, **`formatStructuredPassageHtml`**, etc.
- [ ] **Slim `normalizeSourceText`**: prefer string strip of gutter HTML; only use **`serializeNumberedSourceLayoutFromElement`** when the live `#ai-input` matches (avoid double paths where possible).
- [~] **Single** `gutterLayoutHtmlFromCleanPlain` behaviour: one **`buildNumberedSourceLayoutHtml`** spine; **`fullExamBookletGutter`** opts consolidated for Lab — *still multiple entry points (plain vs structured vs editor HTML); tests still manual.*
- [ ] **CSS**: keep gutter rules in **global `<style>`** (v130) **or** stop embedding `<style>` in `formatSourceHtml` strings (044 mixed both); pick **one** approach.

**Acceptance:** paste **bold** in `#ai-input`, save, reload — formatting survives; student view shows passage correctly. *— manual check.*

**Done in v131 (Phase 1 partial):** `formatSourceHtmlForEditor` 044-style; title **Answer Architect (v131)**; header stamp (e.g. full-gutter / build hint) for confirming file load.

---

## Phase 2 — Numbered plain (no PDF import)

- [~] **`parseNumberedPlainSourceLines`** + consecutive-`N` rule remains the strict parser; **one** documented parser — *044 merge not done; still single codepath in v131.*
- [~] **`repairExamMarginDigitArtifacts`**: one main pass; large regex block retained — *duplicate merge / comment-only test strings still TODO per original plan.*
- [~] **`tryPhysicalPdfLineNumberedEntries`**: used for long WJEC-like plain; also related heuristics in **`gutterLayoutHtmlFromCleanPlain`** — *not dropped; PDF-related paths coexist.*

**Acceptance:** hand-paste **numbered plain** Lucy insert — no digits inside sentences; margin shows **5, 10, 15…** on booklet multiples (not 1…N in the margin). *— aligned with current v131 Lab opts.*

---

## Phase 3 — PDF import (optional / isolated) — *plan in detail*

**Purpose:** make **PDF → passage** dependable enough for real use: predictable extraction, sane line breaks, margin repair, clear teacher feedback, and no nasty surprises in Lab / Quote Select. This is **not** “prove physics-grade booklet parity”; it is **“import is trustworthy and teachable.”**

### 3.0 — Already in place (baseline)

- [x] PDF stack colocated in app: **`ensurePdfJsLoaded`**, **`extractNumberedPlainFromPdfBuffer`**, **`importC1ResourcePdfFromFile`**, **`_pdfExtractBodyLinesOnePage`**, anchor **`trimC1InsertBodyLines`**, **`reExtractResourceFromPages`**, repair lines.
- [x] **Lazy-load** PDF.js — on demand, not on first paint.
- [x] Tesseract path optional for **OCR margin** when enabled.

### 3.1 — Extraction & line model (core)

| Item | Detail |
|------|--------|
| **Text layer** | Keep **pdf.js** text extraction as the default; document when **strict line / EOL** heuristics vs **y-cluster** (vertical grouping) are chosen — goal is *stable line count* without megablobs where avoidable. |
| **Guards** | Revisit **`_pdfExtractBodyLinesOnePage`** and related guards (e.g. few “mega-lines”) so one bad page does not dominate the insert. |
| **Alignment with trim** | **`trimC1InsertBodyLines`**, **`reExtractResourceFromPages`**: one clear story: “this is the insert body only” vs headings/pages — reduce double-trim or conflicting anchors. |
| **Structured / plain** | After extract, same pipeline as hand paste: **repair** then **canonical storage** (`syncLessonSourceCanonical` / `sourceLineBasis: pdfImport` where applicable) so **`countStoredPassageLineRows`** and student views stay consistent. |

**Acceptance (3.1):** for **two** reference PDFs (one WJEC-like insert, one “messy” scan with odd breaks): (a) import completes without throw; (b) body text is **not** obviously truncated mid-sentence at trim boundaries; (c) import alert line count is **plausible** vs a quick human scan. *— manual*

### 3.2 — Repair & margin pipeline

| Item | Detail |
|------|--------|
| **`repairExamMarginDigitArtifacts`** | Single “main” pass; list known failure modes (digits **inside** sentences, double spaces, margin bleed). Add **small, targeted** test strings in comments or a dev-only log — not a full test harness unless you want it. |
| **Post-import** | Ensure repair always runs on **content** intended for the reader, not only a subset of code paths. **Done (v131):** `admin.extractPageTextWithLayout` applies repair on every return (C2 past paper + all re-extract paths that use layout). Skipped PDF pages in `extractPastPaperText` use a simple text join — that path now runs **clean + repair** before appending. |
| **OCR** | If margin OCR is on, define **one** user-visible description: e.g. “OCR only helps read margin line numbers; body text is still from the PDF text layer” (adjust if the code does more). *Avoid silent overlap of two different strategies without UI copy.* |

**Acceptance (3.2):** no stray line-number **digits** mid-sentence in **Lab** after import on the reference PDFs; **Quote Select** quote mapping still plausible for a few spot-check quotes. *— manual*

**Code status:** layout and past-paper skim/fallback paths updated (2026-04-26); run the acceptance row on **2017 / 2024** (or your reference set) when convenient.

### 3.3 — Admin UI & teacher clarity

| Item | Detail |
|------|--------|
| **Controls** | Page range, **Strict PDF lines** (or equivalent), **OCR margin**, **Booklet line 1** (and any C1-specific options): each gets a **short tooltip** (what it does, when to turn on). |
| **Copy** | “Skip until insert / focus page” style hints if the flow is confusing in practice — *one* paragraph in UI or in-app help, not a manual page. |
| **Failure** | If extract yields empty or very short body: **actionable** message (retry with OCR, different page range, paste plain text instead) — *exact wording TBD in implementation.* |

**Acceptance (3.3):** a new teacher (you play this role) can import **without** reading the HTML source: options are **guessable**; worst cases **explain themselves**. *— self-review*

### 3.4 — Cross-component touchpoints (light)

| Item | Detail |
|------|--------|
| **C2** | **Phase 3 repair:** C2 Lobby PDF text goes through `extractPageTextWithLayout` (now margin-repaired) or the simple-join branch in `extractPastPaperText` (also repaired). **Full** C1/C2 product parity remains **Phase 4**. |
| **Regression** | Re-run the **Phase 3 row** in *Regression tests* (below) after each meaningful PDF change. |

### 3.5 — What Phase 3 explicitly does *not* try to solve

- **Perfect** one-printed-line ↔ one-DOM-line parity (deferred; see *Current product priority*).
- **Full** C1/C2 feature parity (Phase 4).
- **Slim** monolith / dead-code removal (Phase 5), except tiny edits **required** to ship PDF work safely.

### 3.6 — Suggested implementation order (concrete)

1. **Inventory audit** (half session): grep confirms — list every entry point that calls `extractNumberedPlainFromPdfBuffer` / `importC1ResourcePdfFromFile` / `ensurePdfJsLoaded` and the order: load → extract → trim → repair → save → `refreshSourceDisplay` / `countStoredPassageLineRows`. *Doc in this file or a one-page comment in code.*
2. **3.1** extraction guards + trim story — *reduce catastrophic mega-lines* first (big user-visible win).
3. **3.2** repair pass consistency — *reduce “digit in sentence”* surprises.
4. **3.3** tooltips + bad-result messaging — *reduce support burden*.
5. **Freeze** for release: re-run **manual** acceptance on **two** PDFs; update *Regression tests* if new checks appear.

#### Phase 3 pipeline map (C1 PDF import) — current v131 order

**Entry point (UI):** `admin.handleC1PdfImportInput(inputEl)`

- Reads **page range** (`#c1-pdf-page-from`, `#c1-pdf-page-to`) and **toggles**:
  - `#c1-pdf-ocr-margin` → `useMarginOcr`
  - `#c1-pdf-strict-lines` → `strictPhysicalLines` (defaults **on** unless explicitly unchecked)
- Calls `app.importC1ResourcePdfFromFile(file, opts)`
- On success, computes stored row count via `countStoredPassageSegments` → `countStoredPassagePrintedLines` → `countStoredPassageLineRows` (fallback: `\n` count) and shows an alert explaining *stored rows vs booklet lines vs on-screen reflow*.

**Core import (C1):** `app.importC1ResourcePdfFromFile(file, opts)`

- `app._readFileAsArrayBuffer(file)`
- `app.extractNumberedPlainFromPdfBuffer(arrayBuffer, pageFrom, pageTo, { useMarginOcr, strictPhysicalLines })`
- `repairExamMarginDigitArtifacts(plain)` (full-string pass)
- Convert to structured (preferred when possible):
  - `plainNumberedLinesToStructuredV2(repaired, ...)`
  - `normalizeStructuredPassageV2MergeOrphanRows` → `normalizeStructuredPassageV2Sequential`
  - `serializeStructuredPassageV2(v2)` → `stored`
  - `resetBookletLineFirstAfterNumberedPdfExtract()` (when structured)
- Persist + refresh:
  - `syncLessonSourceCanonical(stored, { sourceLineBasis:"pdfImport", pdfInsertWidthCh:<median> })`
  - `applyExamPassageInsertWidthCh()` (sets `--exam-passage-max-width`)
  - `setAiInputValue(stored)` (keeps the teacher editor in sync)
  - best-effort: `structuredPassageToEditorHtml(...)` when editor DOM is missing `.source-with-line-numbers`
  - `save()` then `ui.refreshSourceDisplay()`

**Extraction spine:** `app.extractNumberedPlainFromPdfBuffer(arrayBuffer, pageFrom, pageTo, importOpts)`

- `ensurePdfJsLoaded()` → `_pdfTryGetDocumentFromBuffer()`
- For each page: `_pdfExtractBodyLinesOnePage(page, mult5Regex, importOpts)` returns `{lines, insertMetrics}` (or a lines array)
- Filters boilerplate + margin ladder runs; may run `_pdfRepairSoftLineBreaksInBodyLines` when `strictPhysicalLines` is **off**
- Always runs per-line `repairExamMarginDigitArtifacts` before numbering
- `trimC1InsertBodyLines(allLines, 1, { skipInsertReflow:true })` (important: avoid re-splitting by char count here)
- Returns numbered plain string `"1 ...\n2 ...\n3 ..."`

**Original checklist checkboxes (rolled up):**

- [x] PDF stack + lazy load + OCR option *(see 3.0)*
- [~] **One** OCR / strategy story — *3.2 + 3.3*  
- [~] Admin tooltips / skip-until-insert copy — *3.3*

**End-to-end acceptance (Phase 3):** import a **WJEC-style** (or your standard) C1 resource PDF; row / line count **reasonable**; **`repairExamMarginDigitArtifacts`** applied; import alert uses **`countStoredPassageLineRows`** where designed; **Lab and Quote Select** look usable for **line-range practice** without a crisis pass in the first five minutes. *— manual on your real PDFs.*

---

## Phase 4 — C1 vs C2 parity

- [ ] **`getActiveSourceEditorEl`**: same **formatSourceHtmlForEditor** / **setAiInputValue** / save path for C1 and C2 where applicable.
- [~] **`refreshSourceDisplay`** used for Lab + Quote Select; C1 structured + plain paths updated — *full parity pass still open.*

**Acceptance:** switch Component 1 / 2; passage editor and student view behave the same way for the same `sourceText` shape.

---

## Phase 5 — Cleanup

- [ ] Remove dead **`if (false)`** branches, duplicate repair regexes, and commented-out glue fixers once behaviour is stable.
- [ ] Optional: extract **`passage-pipeline.js`** (or second `<script>` file) so **`architect_v131.html`** drops below ~15k lines over time.

---

## v131 additions (not in original phases)

- Structured passage **v2** JSON (`parseStructuredPassageSource`, `plainNumberedLinesToStructuredV2`, editor round-trip).
- **`expandStructuredPassageLineEntries`**, **`htmlFragmentToPlainForLineSplitting`**, **`splitLongRowsForBookletLineGutter`** (merged PDF rows → more Lab rows for display).
- **`countStoredPassageLineRows`** for import alert; **`syncLessonSourceCanonical`** + **`sourceLineBasis: pdfImport`**.
- Strict hasEOL vs y-cluster guard in **`_pdfExtractBodyLinesOnePage`** (avoid few mega-lines as “physical” lines).

---

## Regression tests (manual, 5 minutes)

| # | Action | Expected |
|---|--------|----------|
| 1 | Long **HTML** passage with `<b>` in `#ai-input` | Bold survives save/reload; reader sanitizes, does not destroy structure. |
| 2 | **Numbered plain** `1 …` / `2 …` each line | No `1 1` double prefix; margin shows **5 / 10 / 15 …** on booklet multiples only. |
| 3 | **PDF import** | Plain + layout OK; no stray margin digits mid-sentence after repair; alert row count sane. |
| 4 | **Quote Select** highlight | Maps to `data-src-line` / plain offsets consistently. |

---

## File reference (search in `architect_v131.html`)

| Topic | Search / area |
|-------|----------------|
| Global gutter CSS | `.source-with-line-numbers`, `architect-passage-line-mode` |
| `buildNumberedSourceLayoutHtml`, margin ticks | `examShowAllBookletLines`, `bookletLineIsMultipleOf` |
| PDF + repair + gutter | `extractNumberedPlainFromPdfBuffer`, `repairExamMarginDigitArtifacts`, `formatSourceHtml`, `formatSourceHtmlForEditor` |
| C1 PDF import UI | `handleC1PdfImportInput`, `importC1ResourcePdfFromFile`, `#c1-pdf-import-input` |
| 044 reference | `formatSourceHtml` / `formatSourceHtmlForEditor` (line numbers drift — use search) |

---

## Next steps (recommended order) — *aligned with 2026-04 priority*

1. **Phase 3 (this release track):** follow **§3.6 Suggested implementation order** — audit → extraction/trim (3.1) → repair (3.2) → UI copy/tooltips (3.3) → re-run manual regression on two PDFs.  
2. **Phase 4:** C1/C2 editor, `getActiveSourceEditorEl`, `refreshSourceDisplay` — *same `sourceText` story in both components*; schedule as soon as PDF path is “good enough” or in parallel on a second thread if you have one.  
3. **Phase 1 / 2 in passing:** only when touching the same code — no hard gate.  
4. **Phase 5** when the product is stable: dead `if (false)` / duplicate regex; optional script split.  
5. Keep **`Architect_044.html`** next to v131 for diff when tuning reader vs editor.  
6. **Optional:** tag **`architect_v130.html`** / working branch (Phase 0) for safer diffs — still a good idea before large PDF refactors.

---

## Strict PDF, C1 scope & limits — design log *(append here when decisions evolve)*

**Why this section exists:** Chat sessions and IDE context are not permanent. This file is the durable place for **constraints, trade-offs, and “what not to delete”** so future passes (human or tool-assisted) don’t discard working plumbing by mistake.

### Rich text & non-invasive processing — keep until proven redundant

- **Do not strip** structured v2 per-line HTML / minimal sanitise paths **prematurely**, even if Component 1 later becomes **PDF-first**.
- PDF extraction often still needs **line-level fixes** (joins, OCR glitches). Rich fragments per segment support **surgical** edits without flattening the whole passage.
- Treat rich-text preservation as **compatible** with exam workflow, not opposed to it.

### Exclusive PDF for C1 vs versatility

- **Narrowing C1** to “exam insert from PDF only” **reduces product branching** (fewer plain→numbered fallbacks, clearer mental model).
- It does **not** remove **fundamental** uncertainty: PDFs do not encode “WJEC booklet line *n*” as a semantic field — the app **infers** lines from text layer + geometry + heuristics (**Strict PDF** = prefer PDF-native line breaks when trustworthy).
- **Versatility** (typed prose, paste, non-PDF) was partly for teachers without PDFs; dropping it from C1 is a **scope** decision, not a guarantee of **pixel-perfect paper parity**.

### Absolute limitations of Strict PDF (bounds, not bugs)

These remain even with PDF-only C1 and perfect engineering intent:

| Limit | Plain meaning |
|--------|----------------|
| Text layer ≠ physical print | Lines are inferred from positioned text, not from “exam layout truth.” |
| Merged / split lines | Extractors merge visual lines or split one logical line. |
| Reading order | May not match left-column visual order on complex pages. |
| Booklet semantics | WJEC ticks / **Booklet line 1** are **app rules** + teacher calibration, not PDF metadata. |
| Scans / OCR | Separate error surface from vector PDF text. |

**Implication:** “Mirror image of the paper” is an **aspiration**; the realistic goal is **usable alignment** (ticks, quotes, line ranges) within stated tolerance, plus **clear repair tools** when inference fails.

### Resources to isolate for PDF-limit scenarios *(repair kit, not “legacy non-PDF”)*

Keep these **first-class** for when Strict PDF hits limits — even if C1 only accepts PDF upload:

| Resource | Role |
|----------|------|
| **Insert width (ch) + CSS `--exam-passage-max-width`** | Align simulated column to the sheet; set `ch` explicitly (caret-based snap removed — unreliable in contenteditable). Pair with **Reflow (natural wrap)** when PDF rows are wrong length-wise. |
| **Booklet line 1 + optional WJEC body anchors** | Align **display numbering** to the printed insert when segments ≠ printed lines 1:1. |
| **Reflow body (natural wrap vs full pack)** | Repack stored text to insert width when PDF blobs or merges are wrong **length-wise**. |
| **¶ / Shift+Enter vs Enter / Backspace** | Structural edits without re-import. |
| **PDF debug / import diagnostics** | Distinguish **import** failure from **layout** failure. |
| **Width-only flush/resync guardrails** *(v131)* | `skipAutomaticReflow` / `skipRepair` on insert-width paths so width tweaks don’t rewrite prose boundaries via unrelated repair/reflow. |
| **DOM-order flush for gutters** *(v131)* | Don’t sort `.source-line-row` by `data-src-line` when serialising — preserves merge order for `data-arch-stor-idx`. |

### Component roles (ticks vs no ticks)

- **Component 1:** exam-style insert — **WJEC-style margin ticks**, `data-src-line`, booklet alignment; PDF import is the primary production path for past papers.
- **Component 2:** passages **without** the same insert/tick metaphor — simpler blocks; parity with C1 is **Phase 4**, not identical chrome.

Focusing engineering **per component** avoids one editor trying to satisfy incompatible goals.

### Success criteria (suggested — tune explicitly)

Define **measurable** “good enough” rather than undefined mirror fidelity, e.g.:

- After teacher sets **Booklet line 1** + **Insert width**, coarse ticks (**5 / 10 / 15**) land on the intended **printed** lines within **±1 visual row** on a reference PDF set; or
- Quote line ranges map consistently between Lab and teacher expectations on **N** fixture imports.

Record chosen thresholds here when agreed.

---

**Last appended:** 2026-04-29 — Strict PDF limits, repair-kit resources, C1/C2 tick scope, rationale for keeping rich-text paths cautious.
