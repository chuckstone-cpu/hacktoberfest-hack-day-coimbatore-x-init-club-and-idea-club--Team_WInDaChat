import Database from 'better-sqlite3';
import { config } from './config.js';

export const db = new Database(config.dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

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
};

export function createNote(text) {
  const { lastInsertRowid } = stmts.insertNote.run(text, '', new Date().toISOString());
  return stmts.getNote.get(lastInsertRowid);
}

export function listNotes() {
  const termsByNote = new Map();
  for (const { note_id, name, kind } of stmts.allNoteTerms.all()) {
    if (!termsByNote.has(note_id)) termsByNote.set(note_id, []);
    termsByNote.get(note_id).push({ name, kind });
  }
  return stmts.allNotes.all().map((n) => ({ ...n, terms: termsByNote.get(n.id) ?? [] }));
}

export function getGraph() {
  const nodes = stmts.allNotes.all().map((n) => ({
    id: n.id,
    label: n.summary || n.text,
    summary: n.summary,
    text: n.text,
    createdAt: n.created_at,
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
