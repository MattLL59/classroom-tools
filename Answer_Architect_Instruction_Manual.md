# Answer Architect — Instruction Manual

This manual is the **authoritative project reference** for Answer Architect in the *Classroom Tools* repository. It merges the earlier roadmap with decisions made after the May 2026 recovery session so that worksheet planning and Git workflow stay aligned.

**Primary app file:** `architect_v131.html`  
**Dashboard entry:** open `index.html` in a browser and choose **Answer Architect** (links to `architect_v131.html`).

---

## 1. What Answer Architect does

Answer Architect helps English teachers build **structured exam-style lessons**: passages, questions, mark-scheme alignment, quote selection, and student-facing flows (including **standalone** exported lessons). It is a single-page HTML application (all logic in one file for simple hosting and offline use).

---

## 2. How to open and preview

1. **Clone or download** the GitHub repository to your computer (see section 9).
2. Open **`index.html`** or open **`architect_v131.html`** directly in a modern browser (Chrome, Edge, or Firefox work well).
3. The browser always loads the file from **your disk**, not from GitHub’s website. If the date in the corner looks old, your folder is out of date until you **pull** the latest `main` (section 9).

---

## 3. Checking which build you are running

Inside `architect_v131.html`, a meta tag records the build stamp, for example:

```html
<meta name="architect-build" content="2026-05-13T20:00:00">
```

Use that value to confirm you are on the same revision as colleagues or as the repository’s `main` branch. If your stamp is older, update your local copy from GitHub before testing or reporting bugs.

---

## 4. Teacher workflow vs student (standalone) lessons

- **Teacher / authoring:** you edit the lesson in the full app, save to browser storage or export as configured in the app.
- **Standalone student lesson:** an exported package runs with embedded `appData` and often `isStandalone`. Student choices (for example **passage display scope**) must persist correctly after reload; the app restores scope from saved student state or from embedded lesson meta, then refreshes the passage pane.

This manual does not duplicate every UI label; it records **behaviour the team relies on** so regressions are spotted early.

---

## 5. Passage display scope (focused / whole)

Students and previews can show either a **focused** window (for example around the question’s line range) or the **whole** passage, where the lesson allows it.

**Design intent (post–May 2026):**

- **Standalone:** prefer the student’s saved choice in `userState`; if none, fall back to `appData.meta.passageDisplayScope` from export, and keep UI radios in sync without duplicate event listeners.
- **Teacher mode:** apply scope from lesson meta where appropriate.

If scope and line slicing disagree, see section 6.

---

## 6. Structured passages, line slicing, and Component 2

Some lessons store the passage as **structured JSON** (with a `lines` array) while the on-screen “raw” display string may be plain text. The app must **slice lines for the exam-style window** from the same canonical source used for formatting, so margins and line numbers line up.

**Rule of thumb:** when display `raw` is not v2 JSON but `appData.sourceText` is structured v2, slicing uses the canonical `appData.sourceText` — **except** for true **dual C2** passages, where a pooled source might not match the active level’s passage (dual C2 skips that shortcut).

Teachers rarely edit this logic; it is documented so developers and advanced authors know **why** a passage window can differ from a naive line count.

---

## 7. Worksheets today and near-term ideas

**Already in the ecosystem:**

- Rubric-style support.
- **Jumbled / match-the-word** style activities where the app’s existing structures fit.

**Planned extensions (skills scaffolding):**

- Vocabulary building, synonyms, crosswords, anagrams, creative and persuasive scaffolding, interactive revision — mapped to **AO1–AO6** as starters and plenaries.

Not every activity belongs inside the main monolith; see section 8.

---

## 8. Product architecture — worksheets (May 2026 decision)

### 8.1 Two-tier model

| Layer | Role |
|--------|------|
| **Answer Architect (built-in, basic)** | Quick sheets tied to *this* lesson: same passage, questions, mark scheme, line range, AO focus. Low-risk UI, small code surface. |
| **Linked specialist app** | Heavier generators: crosswords, anagrams, dice prompts, rich print layouts, image-led prompts, timers. Faster iteration without destabilising core exam flows. |

### 8.2 Keeping worksheets relevant to the lesson

Relevance comes from a **shared lesson context**, not from merging every feature into one file. Plan to pass a small, versioned **payload** that both apps understand, for example:

- Lesson or export id, format version.
- Level / question ids (or a focused block).
- Passage excerpt or line window (or hash + line range for verification).
- AO focus tags and optional teacher note / success criteria.
- Optional keywords or techniques already chosen in Architect.

**Transport options:** deep link (short lessons only), **Copy lesson bundle** to clipboard, or a tiny **JSON** file saved next to the HTML export. Long passages should avoid huge URLs.

### 8.3 Index and navigation

The repository’s **`index.html`** is the teacher dashboard. New worksheet tools should appear there with clear labels, for example **Answer Architect** (core) and **Worksheet Lab** (specialist), once the second app exists.

### 8.4 Modularity and other Classroom Tools apps

Answer Architect can stay the **lesson hub** while other tools in the same repo stay **separate files**. Interop is optional and incremental: a **small, versioned hand-off** (JSON file, clipboard, or short link) so another app can open with **AO focus, excerpt, or prompt text** without merging everything into one program. See **`PASSAGE_V131_CHECKLIST.md`** (§ *Modularity & Classroom Tools interop*) for principles — avoid implicit coupling (for example reading another app’s `localStorage` keys) until a schema exists.

---

## 9. Git and GitHub — minimal routine for non-developers

**Concepts:**

- **Repository:** the project folder tracked by Git (on GitHub and on your PC).
- **`main`:** the default integration branch; what most people should run day to day after it is updated.
- **Feature branch:** a separate line of work (for example `cursor/…-f806`) used for fixes and docs until they are merged into `main`.
- **Commit / push:** save a snapshot locally, then upload it to GitHub.
- **Pull / sync:** download others’ commits so your folder matches GitHub.

**Practical rule:** before opening `architect_v131.html` for a serious test, **pull `main`** in GitHub Desktop (or `git pull origin main`) so your file dates and `architect-build` stamp match the team.

---

## 10. Troubleshooting

| Symptom | Likely cause | What to do |
|---------|----------------|------------|
| Old `architect-build` date vs colleagues | Local copy not updated | Pull latest `main`; reopen the file. |
| Passage scope resets oddly in standalone | Hydration order or missing meta | Report with export + browser; devs check `applyPassageScopeAfterUserStateHydrate` and `getPassageDisplayScope` / `setPassageDisplayScope`. |
| Line window looks “off” for structured text | Canonical vs display mismatch | Confirm structured v2 in `sourceText`; check dual C2 exception. |

---

## 11. Recovery log — May 2026 (post-crash)

The following were re-established in the repository so session **v131** behaviour matches the intended design:

- **`architect-build`** stamp bumped for cache busting and visible versioning.
- **`getDomRowsForExamLineSlicing`:** canonical structured `appData.sourceText` when display raw is not v2 JSON; skip for true dual C2.
- **`applyPassageScopeAfterUserStateHydrate`:** restore passage scope after `userState` load (standalone vs teacher paths).
- **`getPassageDisplayScope` / `setPassageDisplayScope`:** standalone uses `userState` and persists via `app.save()` where appropriate; delegated `change` listener for `.tsa-passage-scope-radio` to avoid duplicate handlers.
- **Answer passage excerpt** (`answerPassageExcerpt`) and related UI/admin wiring, line-window helpers, and mark-scheme integration as brought forward from the crashed session’s diff (see repository history on `main`).

If you still have an **older copy on one PC only**, prefer the repository’s `main` after merge unless you are explicitly diffing that file with Git.

---

## 12. Document maintenance

- **Instruction manual (this file):** procedures, architecture, recovery, Git.
- **Guide (`ANSWER_ARCHITECT_GUIDE.md`):** short onboarding for colleagues and AO-aligned activity ideas.

When the worksheet specialist app is created, add its file name, entry URL pattern, and payload schema version to sections 8 and 3.
