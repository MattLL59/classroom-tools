# Answer Architect — Quick Guide (for teachers)

A short companion to **`Answer_Architect_Instruction_Manual.md`**. Use the manual for Git, versioning, and technical detail; use this page to **onboard colleagues** and align activities with assessment objectives.

---

## Quick start (five steps)

1. **Get the repo** onto your computer from GitHub (clone with GitHub Desktop or download ZIP — ZIP is simpler but easier to forget to update).
2. Open **`index.html`** → **Answer Architect**, or open **`architect_v131.html`** directly.
3. **Check the build date** shown in the app matches what you expect (it reflects the `architect-build` meta tag in the file).
4. If the date is **behind** the team’s latest, use **Fetch / Pull** on branch **`main`** in GitHub Desktop, then reopen the HTML file.
5. Teach or author as usual; keep **standalone** test exports on a spare tab when checking student view.

---

## What Answer Architect is for

- Exam-style **reading and writing** scaffolding tied to your passage and questions.
- **Mark-scheme-aware** authoring where you have set that up.
- **Standalone lessons** students can run without the full teacher UI.

It is **not** a full VLE; it is a focused revision and lesson builder.

---

## Worksheet direction (agreed direction, May 2026)

- **Inside Answer Architect:** keep a **basic** worksheet generator (what you already use: rubrics, jumbled match, and similar patterns that reuse lesson data).
- **Separate linked app (future):** richer games and layouts (crosswords, anagrams, dice, heavy print design).
- **Link between them:** “Open in worksheet app” (or copy/paste a small lesson bundle) so starters and plenaries stay tied to **the same text, questions, and AO focus**.

You get relevance from **shared lesson context**, not from cramming every game into one giant file.

---

## AO map — planning starters and plenaries

Use this when choosing **basic** (in-app) vs **specialist** (linked) activities.

| AO | Skill emphasis | Basic in Architect (examples) | Specialist app (examples) |
|----|----------------|------------------------------|----------------------------|
| **AO1** | Reading — explicit / implicit meaning, synthesis | Retrieval table from your excerpt; keyword glossary from passage | Timed retrieval games; flashcard decks |
| **AO2** | Language and structure | “What / how / why” table from **your** lines; technique hunt on the insert | Printable technique “treasure hunt” packs |
| **AO3** | Critical evaluation | Judgement stems tied to your question focus | Extended card sorts across multiple texts |
| **AO4** | Comparing perspectives | Viewpoint sort using **your** paired extracts (when lesson supports it) | Large comparative wall layouts |
| **AO5** | Writing — form, audience, creativity | Short constrained writes with your success criteria | Image prompts, dice challenges, sprint timers |
| **AO6** | SPaG, vocabulary, sentences | Correct-the-passage using **your** paragraph; synonym lists from insert | Big SPaG worksheet layouts; crossword grids |

---

## Files you need to know

| File | Purpose |
|------|---------|
| `architect_v131.html` | Answer Architect application |
| `index.html` | Teacher dashboard linking to Architect and other tools |
| `Answer_Architect_Instruction_Manual.md` | Full instructions, Git, architecture, recovery notes |
| `ANSWER_ARCHITECT_GUIDE.md` | This short guide |

---

## If something looks wrong

1. Confirm you pulled **`main`** recently.  
2. Compare the in-app **build** line with a colleague or the file on GitHub.  
3. If standalone scope or line windows misbehave, note **browser**, **export steps**, and ask for help with the **Instruction Manual** section 10 in hand.

---

## Next documentation step (when coding starts)

Define a **lesson context payload** (field names + version number) that Answer Architect exports and the future worksheet app imports. Record that schema in the Instruction Manual section 8 once implemented.
