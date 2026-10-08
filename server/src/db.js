// Node's built-in SQLite: no native package to compile on install.
import { DatabaseSync } from 'node:sqlite';
import { config } from './config.js';

export const db = new DatabaseSync(config.dbPath);
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

// Schema from docs/BUILD_GUIDE.md section 5.
db.exec(`
  CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY,
    text TEXT NOT NULL,
    summary TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS terms (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    kind TEXT NOT NULL CHECK (kind IN ('entity', 'pattern'))
  );
  CREATE TABLE IF NOT EXISTS note_terms (
    note_id INTEGER NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    term_id INTEGER NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
    PRIMARY KEY (note_id, term_id)
  );
  CREATE TABLE IF NOT EXISTS links (
    id INTEGER PRIMARY KEY,
    src INTEGER NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    dst INTEGER NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    strength INTEGER NOT NULL,
    reason TEXT NOT NULL,
    origin TEXT NOT NULL CHECK (origin IN ('auto', 'manual')),
    created_at TEXT NOT NULL,
    UNIQUE (src, dst)
  );
`);

const stmts = {
  insertNote: db.prepare('INSERT INTO notes (text, summary, created_at) VALUES (?, ?, ?)'),
  getNote: db.prepare('SELECT * FROM notes WHERE id = ?'),
  allNotes: db.prepare('SELECT * FROM notes ORDER BY created_at, id'),
  allNoteTerms: db.prepare(`
    SELECT nt.note_id, t.name, t.kind
    FROM note_terms nt JOIN terms t ON t.id = nt.term_id
  `),
  allLinks: db.prepare('SELECT src, dst, type, strength, reason, origin FROM links'),
  setSummary: db.prepare('UPDATE notes SET summary = ? WHERE id = ?'),
  upsertTerm: db.prepare(`
    INSERT INTO terms (name, kind) VALUES (?, ?)
    ON CONFLICT(name) DO UPDATE SET name = excluded.name
    RETURNING id
  `),
  addNoteTerm: db.prepare('INSERT OR IGNORE INTO note_terms (note_id, term_id) VALUES (?, ?)'),
  noteTerms: db.prepare(`
    SELECT t.name, t.kind
    FROM note_terms nt JOIN terms t ON t.id = nt.term_id
    WHERE nt.note_id = ?
    ORDER BY t.kind DESC, t.name
  `),
  // Older notes sharing at least one term with the given note, most shared first.
  shortlist: db.prepare(`
    SELECT n.id, n.text, n.summary, COUNT(*) AS shared
    FROM note_terms a
    JOIN note_terms b ON b.term_id = a.term_id AND b.note_id < a.note_id
    JOIN notes n ON n.id = b.note_id
    WHERE a.note_id = ?
    GROUP BY n.id
    ORDER BY shared DESC, n.id DESC
    LIMIT ?
  `),
  insertLink: db.prepare(`
    INSERT OR IGNORE INTO links (src, dst, type, strength, reason, origin, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `),
  linkBetween: db.prepare(`
    SELECT src, dst, type, strength, reason, origin FROM links
    WHERE (src = ? AND dst = ?) OR (src = ? AND dst = ?)
  `),
  neighbours: db.prepare(`
    SELECT dst AS id FROM links WHERE src = ?
    UNION
    SELECT src AS id FROM links WHERE dst = ?
  `),
};

export function createNote(text) {
  const { lastInsertRowid } = stmts.insertNote.run(text, '', new Date().toISOString());
  return stmts.getNote.get(lastInsertRowid);
}

export function getNote(id) {
  return stmts.getNote.get(id);
}

export function getNoteTerms(noteId) {
  return stmts.noteTerms.all(noteId);
}

// Saves the summary and terms in one transaction, so a failure never leaves
// a note half-tagged. A term keeps the kind it was first saved with.
export function saveTags(noteId, summary, terms) {
  db.exec('BEGIN');
  try {
    stmts.setSummary.run(summary, noteId);
    for (const { name, kind } of terms) {
      const { id } = stmts.upsertTerm.get(name, kind);
      stmts.addNoteTerm.run(noteId, id);
    }
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

export function shortlist(noteId, limit) {
  return stmts.shortlist.all(noteId, limit);
}

// Returns true if the link was new (duplicates are ignored).
export function saveLink({ src, dst, type, strength, reason, origin }) {
  const { changes } = stmts.insertLink.run(src, dst, type, strength, reason, origin, new Date().toISOString());
  return changes > 0;
}

export function getLinkBetween(a, b) {
  return stmts.linkBetween.get(a, b, b, a) ?? null;
}

export function getNeighbours(noteId) {
  return stmts.neighbours.all(noteId, noteId).map((r) => r.id);
}

export function resetAll() {
  db.exec('DELETE FROM links; DELETE FROM note_terms; DELETE FROM terms; DELETE FROM notes;');
}

function termsByNote() {
  const map = new Map();
  for (const { note_id, name, kind } of stmts.allNoteTerms.all()) {
    if (!map.has(note_id)) map.set(note_id, []);
    map.get(note_id).push({ name, kind });
  }
  return map;
}

export function listNotes() {
  const terms = termsByNote();
  return stmts.allNotes.all().map((n) => ({ ...n, terms: terms.get(n.id) ?? [] }));
}

export function getGraph() {
  const terms = termsByNote();
  const nodes = stmts.allNotes.all().map((n) => ({
    id: n.id,
    label: n.summary || n.text,
    summary: n.summary,
    text: n.text,
    createdAt: n.created_at,
    terms: terms.get(n.id) ?? [],
  }));
  const links = stmts.allLinks.all().map((l) => ({
    source: l.src,
    target: l.dst,
    type: l.type,
    strength: l.strength,
    reason: l.reason,
    origin: l.origin,
  }));
  return { nodes, links };
}
