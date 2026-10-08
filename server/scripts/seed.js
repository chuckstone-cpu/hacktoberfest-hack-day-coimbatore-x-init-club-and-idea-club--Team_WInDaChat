// Resets the database and adds the demo notes one by one through the real
// pipeline (tag → shortlist → link), printing what Gemma decided.
import { readFileSync } from 'node:fs';
import { config } from '../src/config.js';
import { getOllamaVersion, warmUp } from '../src/llm.js';
import { resetAll } from '../src/db.js';
import { addNote } from '../src/pipeline.js';

const notes = JSON.parse(readFileSync(new URL('../data/seed_notes.json', import.meta.url), 'utf8'));

if (!(await getOllamaVersion())) {
  console.error(`Ollama isn't reachable at ${config.ollamaHost}. Start it with \`ollama serve\` and try again.`);
  process.exit(1);
}

console.log(`Seeding ${notes.length} notes into ${config.dbPath} with ${config.model}\n`);
resetAll();
await warmUp();

const titles = new Map();
let totalLinks = 0;
let failures = 0;

for (const { subject, text } of notes) {
  const { note, terms, links, judged = [], tagError, linkError } = await addNote(text);
  titles.set(note.id, subject);
  const patterns = terms.filter((t) => t.kind === 'pattern').map((t) => t.name);

  console.log(`#${note.id} ${subject}`);
  if (tagError || linkError) {
    failures++;
    console.log(`   ! ${tagError ?? linkError}`);
  }
  if (patterns.length) console.log(`   patterns: ${patterns.join(', ')}`);
  for (const j of judged) {
    const kept = links.some((l) => l.dst === j.note_id);
    console.log(`   ${kept ? '✓' : '·'} ${j.type} ${j.strength}/5 → #${j.note_id} ${titles.get(j.note_id) ?? '?'}: ${j.reason}`);
  }
  if (!judged.length && !tagError) console.log('   (no candidates)');
  totalLinks += links.length;
}

console.log(`\nDone: ${notes.length} notes, ${totalLinks} links saved (✓ kept, · filtered out).`);
if (failures) console.log(`${failures} note(s) had Gemma errors; see above.`);
