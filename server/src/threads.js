import { getNeighbours, getNote } from './db.js';

const MAX_DEPTH = 3;
const MAX_NOTES = 8;

// A thread is computed, never stored: walk links in both directions
// (breadth-first, so the closest notes win) and sort by date.
export function getThread(noteId) {
  const start = getNote(noteId);
  if (!start) return null;

  const seen = new Set([start.id]);
  let frontier = [start.id];
  for (let depth = 0; depth < MAX_DEPTH && frontier.length && seen.size < MAX_NOTES; depth++) {
    const next = [];
    for (const id of frontier) {
      for (const n of getNeighbours(id)) {
        if (seen.size >= MAX_NOTES) break;
        if (!seen.has(n)) {
          seen.add(n);
          next.push(n);
        }
      }
    }
    frontier = next;
  }

  return [...seen]
    .map(getNote)
    .sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id - b.id);
}
