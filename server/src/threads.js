import { db } from './db.js';

export function getThread(noteId) {
  // BFS over links up to depth 3, max 8 notes.
  const visited = new Set();
  const threadNotes = [];
  const queue = [{ id: noteId, depth: 0 }];
  
  const getNote = db.prepare('SELECT * FROM notes WHERE id = ?');
  const getLinks = db.prepare('SELECT src, dst FROM links WHERE src = ? OR dst = ?');

  while (queue.length > 0 && threadNotes.length < 8) {
    const current = queue.shift();
    if (visited.has(current.id)) continue;
    visited.add(current.id);
    
    const note = getNote.get(current.id);
    if (note) threadNotes.push(note);
    
    if (current.depth < 3) {
      const edges = getLinks.all(current.id, current.id);
      for (const e of edges) {
        const neighborId = e.src === current.id ? e.dst : e.src;
        if (!visited.has(neighborId)) {
          queue.push({ id: neighborId, depth: current.depth + 1 });
        }
      }
    }
  }
  
  // Sort by created_at ascending
  threadNotes.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  return threadNotes;
}
