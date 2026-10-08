import { DatabaseSync } from 'node:sqlite';
import { config } from './config.js';
import path from 'path';

const dbPath = path.resolve(process.cwd(), '..', config.dbPath); // root level db
export const db = new DatabaseSync(dbPath);

// Initialization
db.exec(`
  CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL,
    summary TEXT,
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS terms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    kind TEXT CHECK(kind IN ('entity','pattern')) NOT NULL
  );

  CREATE TABLE IF NOT EXISTS note_terms (
    note_id INTEGER,
    term_id INTEGER,
    PRIMARY KEY(note_id, term_id),
    FOREIGN KEY(note_id) REFERENCES notes(id) ON DELETE CASCADE,
    FOREIGN KEY(term_id) REFERENCES terms(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    src INTEGER NOT NULL,
    dst INTEGER NOT NULL,
    type TEXT NOT NULL,
    strength INTEGER NOT NULL,
    reason TEXT NOT NULL,
    origin TEXT CHECK(origin IN ('auto','manual')) NOT NULL,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    UNIQUE(src, dst),
    FOREIGN KEY(src) REFERENCES notes(id) ON DELETE CASCADE,
    FOREIGN KEY(dst) REFERENCES notes(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS workspaces (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS pages (
      id TEXT PRIMARY KEY,
      workspace_id TEXT,
      parent_page_id TEXT,
      title TEXT,
      icon TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY(workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
      FOREIGN KEY(parent_page_id) REFERENCES pages(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS blocks (
      id TEXT PRIMARY KEY,
      page_id TEXT,
      parent_block_id TEXT,
      type TEXT NOT NULL,
      content TEXT,
      position REAL NOT NULL,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY(page_id) REFERENCES pages(id) ON DELETE CASCADE,
      FOREIGN KEY(parent_block_id) REFERENCES blocks(id) ON DELETE CASCADE
  );
`);

// Insert default workspace if it doesn't exist
const wsExists = db.prepare('SELECT id FROM workspaces LIMIT 1').get();
if (!wsExists) {
  db.prepare("INSERT INTO workspaces (id, name) VALUES ('default', 'My Workspace')").run();
}
