import { callJson } from './llm.js';
import { linkMessages, pairMessages, tagMessages } from './prompts.js';
import { LinkResult, PairResult, TagResult } from './schemas.js';
import { createNote, getLinkBetween, getNote, getNoteTerms, saveLink, saveTags, shortlist } from './db.js';

const MAX_CANDIDATES = 8;
const MIN_STRENGTH = 4;

const normalise = (s) => s.trim().replace(/\s+/g, ' ').toLowerCase();

// Asks Gemma for a summary, entities and patterns, then stores them.
// Throws if Gemma fails; nothing is saved in that case.
async function tagNote(note) {
  const tags = await callJson(TagResult, tagMessages(note.text), { label: 'tag' });

  const seen = new Set();
  const terms = [];
  for (const [kind, names] of [['pattern', tags.patterns], ['entity', tags.entities]]) {
    for (const raw of names) {
      const name = normalise(raw);
      if (!name || seen.has(name)) continue;
      seen.add(name);
      terms.push({ name, kind });
    }
  }

  const summary = tags.summary.trim();
  saveTags(note.id, summary, terms);
  return { summary, terms: getNoteTerms(note.id) };
}

// Keeps only links the model can't have invented: a candidate's id, a strong
// enough strength, and one entry per candidate (the strongest wins).
function filterLinks(proposed, candidateIds) {
  const best = new Map();
  for (const l of proposed) {
    if (!candidateIds.has(l.note_id) || l.strength < MIN_STRENGTH) continue;
    const prev = best.get(l.note_id);
    if (!prev || l.strength > prev.strength) best.set(l.note_id, l);
  }
  return [...best.values()];
}

// One batched Gemma call judges the note against all shortlisted candidates.
// Returns { links, judged } where judged is everything the model proposed.
async function linkNote(note) {
  const candidates = shortlist(note.id, MAX_CANDIDATES);
  if (candidates.length === 0) return { links: [], judged: [], candidates };

  const { links: judged } = await callJson(LinkResult, linkMessages(note, candidates), { label: 'link' });
  const kept = filterLinks(judged, new Set(candidates.map((c) => c.id)));

  const links = [];
  for (const l of kept) {
    const link = {
      src: note.id,
      dst: l.note_id,
      type: l.type,
      strength: l.strength,
      reason: l.reason.trim(),
      origin: 'auto',
    };
    if (saveLink(link)) links.push(link);
  }
  return { links, judged, candidates };
}

// The full note pipeline: save → tag → shortlist → link → filter.
// The note is always kept; Gemma failures come back as tagError / linkError.
export async function addNote(text) {
  const note = createNote(text);
  const result = { note, terms: [], links: [] };

  try {
    const { summary, terms } = await tagNote(note);
    result.note = { ...note, summary };
    result.terms = terms;
  } catch (err) {
    console.error(`[pipeline] tagging note ${note.id} failed: ${err.message}`);
    result.tagError = 'Gemma could not tag this note. Is Ollama running?';
    return result;
  }

  try {
    const { links, judged, candidates } = await linkNote(result.note);
    result.links = links;
    result.judged = judged;
    result.candidates = candidates.length;
  } catch (err) {
    console.error(`[pipeline] linking note ${note.id} failed: ${err.message}`);
    result.linkError = 'Gemma could not link this note.';
  }
  return result;
}

// Drag-to-connect: Gemma judges one pair the user dropped together. Saved
// with origin 'manual' only if it passes the same strength threshold.
export async function connectNotes(aId, bId) {
  const [older, newer] = [getNote(aId), getNote(bId)].sort((x, y) => x.created_at.localeCompare(y.created_at) || x.id - y.id);

  const existing = getLinkBetween(older.id, newer.id);
  if (existing) return { linked: true, existing: true, link: existing };

  const judged = await callJson(PairResult, pairMessages(older, newer), { label: 'connect' });
  const link = {
    src: newer.id,
    dst: older.id,
    type: judged.type,
    strength: judged.strength,
    reason: judged.reason.trim(),
    origin: 'manual',
  };
  // For a rejection, show what separates the notes, not the (weak) similarity.
  if (link.strength < MIN_STRENGTH) return { linked: false, strength: link.strength, reason: judged.difference.trim() };
  saveLink(link);
  return { linked: true, existing: false, link };
}
