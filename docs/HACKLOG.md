# Hack log

What was built, step by step (see `docs/BUILD_GUIDE.md` section 7). Everything here was run and checked on the dev laptop (Windows 11, Node 24, Ollama 0.40.1, `gemma4:e4b`).

## Step 0: Pre-flight
- Ollama JSON-schema smoke test: valid JSON on every warm call, ~48–50 tok/s. The very first call while the model loaded returned no message, which is why every JSON call retries once.

## Step 1–2: Docs and skeleton app
- Node + Express API and React + Vite + Tailwind client as npm workspaces; `/api/health` drives the status pill.
- `better-sqlite3` installed and loaded fine on Node 24 / Windows, so no fallback was needed.
- On Windows, `node --watch` restarted the API whenever Vite rewrote its cache; fixed with `--watch-path=./src`.

## Step 3: Notes CRUD
- SQLite schema from the guide; notes shown as nodes in `react-force-graph-2d` (pulled forward from Step 6 at the team's request).

## Step 4: Gemma tagging
- `callJson` sends the Zod schema as Ollama `format`, validates the reply and retries once. Tagging takes ~1.2–1.7 s per note when warm.
- The first call after Ollama loads the model took ~32 s, so the API now warms the model on startup.
- Gemma first tagged unrelated notes with the vague pattern "cause and effect"; the prompt now forbids vague patterns.

## Step 5: Linking pipeline + seed
- Shortlist: older notes sharing any entity or pattern, max 8. One batched Gemma call judges all candidates; only strength ≥ 4 links to shortlisted ids are saved.
- `npm run seed` result on our machine (10 seed notes): 9 links saved.
  - Feedback-loop cluster: control systems, blood sugar, TCP, RBI and supply/demand are linked as `same_idea` (RBI ↔ control systems 5/5).
  - Deadlock ↔ two-phase locking (`continuation`, 4/5); gradient descent ↔ control systems (`same_idea`, 4/5, oscillation).
  - Photosynthesis: 0 links (Gemma scored it 1/5 against blood sugar; filtered out). Library rule: 0 links.
  - Weak links were filtered: RBI ↔ TCP scored 2/5, supply/demand ↔ RBI 3/5.
- Adding a note takes 2 Gemma calls, ~3–6 s total when warm. Results can vary between runs; re-seeding may change strengths slightly.

## Step 6: Graph
- Links coloured by type with a legend; hover a link for its type, strength and reason; hover a node to light up its neighbours.
- Side panel lists a note's links with reasons and lets you jump between notes.

## Step 7: Threads + story
- Threads are computed by BFS over links (depth ≤ 3, ≤ 8 notes), sorted by date. Clicking a node lights up its thread.
- The story streams as plain text: first words after ~0.5 s, a 3-note story in ~4 s, a 6-note story under 10 s.

## Step 8: Verifier and faithfulness report
- `verify/cues.js` (no AI): extracts numbers with units/currency, dates, negations, conditions, bounds and obligations, and reports source cues that are missing or changed in the story. The condition words follow the team's Python prototype on `main` (`src/verification/extractor.py`). "by" from the guide's bound list is left out because it matches almost every sentence.
- `verify/quiz.js`: Gemma extracts up to 8 must-keep facts with exact source quotes (facts whose quote isn't in the notes are dropped), then answers a question per fact using only the story. Evidence quotes not found in the story are discarded.
- Per-fact status: "Possible mismatch" if the story doesn't state the fact or loses a number from it; "Needs review" if answered but a cue (e.g. "at most") is missing; otherwise "Appears preserved". Dropped numbers count as a mismatch, which is stricter than the guide's first draft ("numbers differ").
- Results on our machine:
  - Sabotaged library story: 3 possible mismatch ("unless someone else has reserved the book", "₹2 per day", "14-day"), 1 needs review ("at most twice"); cue check flags "at most", "unless", "₹2", "14-day". ~7.7 s.
  - Real 6-note feedback story: 7 facts, all "Appears preserved", 0 cue issues. ~17.6 s.
- If the quiz fails, the API still returns the cue check with a `quizError`.

## Step 9: Drag to connect
- Dropping one node onto another (within ~20 screen px) calls `POST /api/connect`. One Gemma call judges just that pair with the same link rules; it is saved with `origin='manual'` only if strength ≥ 4. Pairs that are already linked return the existing link without a model call.
- While Gemma thinks, a dashed line joins the two nodes; on a rejection it fades out red. The dragged node springs back to where the drag started.
- Problem found: when rejecting a pair, Gemma's single `reason` often argued *for* a similarity ("both describe feedback…"). Fix: the pair schema now asks for both `reason` (strongest link) and `difference` (what separates them); rejections show `difference`.
- Results on our machine (seeded notes, ~1.5 s per judgement): photosynthesis ↔ TCP → no strong connection (2/5, "energy conversion in chloroplasts" vs "network flow control"); gradient descent ↔ blood sugar → linked, same idea 4/5; deadlock ↔ RBI → 1/5.
- User-suggested pairs sometimes score higher than the same pair did during automatic linking (RBI ↔ TCP: 2/5 automatic, 4/5 when dragged), so manual links are marked `origin='manual'` in the database.

## Step 10: Polish and submission
- README rewritten from what was actually built and measured; team contributions, demo video and Devpost links are left for the team to fill in.
- Internal-only helpers made module-private; no debug code left in the client.
- Fresh-clone test (`git clone` → `npm install` → `npm run seed` → `npm run dev`) caught a real problem: `better-sqlite3` 13 ships prebuilt binaries but also a `binding.gyp`, so npm ran `node-gyp rebuild` on a fresh install and failed without Visual Studio C++ tools. Switched to Node's built-in `node:sqlite` (Node ≥ 22.13), which removes the native dependency; the npm scripts pass `--disable-warning=ExperimentalWarning` to hide its one-time warning.

## UI revamp (branch ui-revamp)
- Paper & Ink light theme from CSS-variable tokens; colours that missed WCAG contrast (amber text, ochre/coral lines) were darkened.
- One scrollable page: sticky nav with scroll-tracked active link, Hero, Notes (search + tag filters, masonry cards), Graph (only captures the wheel after a click, so the page scrolls past it) and Add (inline result, "See it in the graph").
- Deterministic tag colours from a 10-entry palette checked for contrast; graph nodes take their most-shared pattern's colour.
- React Bits' CircularCarousel only renders images, so the team chose React Bits' text Carousel for the hero instead (installed with the shadcn CLI; react-icons removed as unused).
- Skipped for time: the optional polish pass (paper grain, hover lift, count-up, Lighthouse audit).
