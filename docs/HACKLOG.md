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
