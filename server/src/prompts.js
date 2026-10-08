// All model prompts live here so they're easy to tune in one place.

// Reusing a shared vocabulary keeps patterns consistent across notes
// ("feedback loop", not "feedback" one time and "feedback cycle" the next).
export const PREFERRED_PATTERNS = [
  'feedback loop',
  'trade-off',
  'bottleneck',
  'equilibrium',
  'exponential growth',
  'threshold',
  'oscillation',
  'resource contention',
  'optimization',
  'regulation',
  'conservation',
];

export function tagMessages(text) {
  return [
    {
      role: 'system',
      content: `You tag short study notes for a personal knowledge graph. Reply with JSON only, matching this shape:
{"summary": string, "entities": string[], "patterns": string[]}

Rules:
- summary: one sentence, at most 25 words, stating the note's main point.
- entities: up to 8 named things or key technical concepts in the note (organisations, laws, protocols, systems, terms). Use short canonical names, e.g. "RBI" for "Reserve Bank of India", "TCP" for "Transmission Control Protocol". No generic words like "system" or "process".
- patterns: 1 to 4 abstract mechanisms the note is an example of, in lowercase. These must be domain-independent so notes from different subjects can match. Reuse one of these when it fits: ${PREFERRED_PATTERNS.join(', ')}. Only invent a new one if none fit. Never use vague patterns like "cause and effect", "process" or "change"; if nothing specific fits, return a single pattern describing the note's core mechanism.`,
    },
    { role: 'user', content: `Note:\n${text}` },
  ];
}

const LINK_RULES = `Relation types (how the NEW note relates to the OLDER note):
- same_idea: both describe the same underlying mechanism, even in different subjects.
- causes: what the new note describes causes what the older note describes.
- consequence_of: what the new note describes is a result of what the older note describes.
- continuation: the new note extends or follows on from the older note's topic.
- contradicts: the new note conflicts with a claim in the older note.

Strength:
- 5: the same specific mechanism or a direct causal chain, clearly stated in both notes.
- 4: a clear, specific relationship you can justify with one concrete detail from each note.
- 3: plausibly related, but the connection needs assumptions.
- 1-2: only the same broad topic ("both are about networks", "both involve money"). Weak links like these MUST get 1 or 2.

The reason must be at most 25 words and cite a specific fact from BOTH notes (e.g. "TCP halves its window on loss, like the controller feeding back error to correct output").`;

const clip = (s, n) => (s.length > n ? `${s.slice(0, n)}…` : s);

export function linkMessages(note, candidates) {
  const list = candidates
    .map((c) => `[id ${c.id}] ${c.summary ? `Summary: ${c.summary}\n` : ''}Text: ${clip(c.text, 400)}`)
    .join('\n\n');
  return [
    {
      role: 'system',
      content: `You judge whether a new study note is genuinely connected to older notes. Reply with JSON only:
{"links": [{"note_id": number, "type": string, "strength": number, "reason": string}]}

Return one entry for each older note, using its id exactly as given. Be strict: most pairs of notes are NOT strongly connected, and low strengths are the correct answer for them.

${LINK_RULES}`,
    },
    { role: 'user', content: `NEW note:\n${note.text}\n\nOLDER notes:\n${list}` },
  ];
}


export function storyMessages(notes) {
  const list = notes
    .map((n, i) => `Note ${i + 1} (${n.created_at.slice(0, 10)}):\n${n.text}`)
    .join('\n\n');
  return [
    {
      role: 'system',
      content: `You turn a thread of linked study notes into a short story that helps a student see how they connect.

Rules:
- At most 200 words, plain prose, no headings, no bullet points, no markdown.
- Go through the notes in the order given.
- Name the shared mechanism that ties them together and show how it appears in each note.
- Use ONLY facts stated in the notes. Do not add numbers, names, examples, causes or claims that are not in them. Keep conditions and exceptions (like "unless", "at most", "not") exactly as stated.`,
    },
    { role: 'user', content: `Notes:\n\n${list}` },
  ];
}

export function factMessages(sources) {
  return [
    {
      role: 'system',
      content: `You extract the must-keep facts from study notes, so a summary of them can be checked. Reply with JSON only:
{"facts": [{"fact": string, "source_span": string, "category": string, "question": string}]}

Rules:
- At most 8 facts. Pick facts with numbers, dates, conditions ("unless", "only if"), exceptions, limits ("at most", "within"), negations and obligations FIRST, then the most important other claims.
- source_span: an EXACT quote copied character for character from the notes, as short as possible while containing the fact.
- category: one of number, date, negation, condition, exception, obligation, name, other.
- question: a short question whose correct answer is this fact, e.g. "How many times can a book be renewed?".`,
    },
    { role: 'user', content: `Notes:\n\n${sources}` },
  ];
}

export function answerMessages(text, questions) {
  const list = questions.map((q, i) => `${i}. ${q}`).join('\n');
  return [
    {
      role: 'system',
      content: `You answer questions using ONLY the given text, never outside knowledge. Reply with JSON only:
{"answers": [{"index": number, "answer": string, "evidence_quote": string | null}]}

Rules:
- One answer per question, with the question's index.
- If the text does not state the answer, the answer must be exactly "not stated" and evidence_quote must be null.
- Keep numbers, limits and conditions exactly as the text gives them; do not fill in details the text leaves vague.
- evidence_quote: an EXACT quote from the text that supports the answer, or null.`,
    },
    { role: 'user', content: `Text:\n${text}\n\nQuestions:\n${list}` },
  ];
}

// For drag-to-connect: the user proposes a pair, Gemma judges just that pair
// with the same rules and strictness as automatic linking.
export function pairMessages(older, newer) {
  return [
    {
      role: 'system',
      content: `You judge whether two study notes are genuinely connected. Reply with JSON only:
{"type": string, "strength": number, "reason": string, "difference": string}

The user suggested this pair, but do not lower your standards for that. A vague similarity ("both involve regulation", "both are processes") is NOT a connection.
- reason: the strongest specific link you can find, citing a fact from each note (at most 25 words).
- difference: what each note is actually about and the most important way they differ (at most 25 words).
- strength: judge honestly using the scale below. Most user-suggested pairs are NOT strongly connected.
- In reason and difference, refer to the notes by their topics (e.g. "TCP", "photosynthesis"), never as "the new note" or "the older note".

${LINK_RULES}`,
    },
    { role: 'user', content: `NEW note:
${newer.text}

OLDER note:
${older.text}` },
  ];
}
