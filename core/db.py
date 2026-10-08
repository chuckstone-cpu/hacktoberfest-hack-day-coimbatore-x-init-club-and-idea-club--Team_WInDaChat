"""SQLite persistence for notes, extracted concepts, and links."""

import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path

from .config import DB_PATH


SCHEMA = """
CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    summary TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS concepts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    note_id INTEGER NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    kind TEXT NOT NULL,
    value TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_id INTEGER NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    target_id INTEGER NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    relation TEXT NOT NULL,
    strength INTEGER NOT NULL,
    reason TEXT NOT NULL DEFAULT '',
    UNIQUE(source_id, target_id)
);
"""


@contextmanager
def connection():
    Path(DB_PATH).parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db():
    with connection() as conn:
        conn.executescript(SCHEMA)


def add_note(content: str, summary: str, concepts: list[tuple[str, str]]) -> int:
    with connection() as conn:
        now = datetime.now(timezone.utc).isoformat()
        cur = conn.execute(
            "INSERT INTO notes(content, summary, created_at) VALUES (?, ?, ?)",
            (content, summary, now),
        )
        note_id = cur.lastrowid
        conn.executemany(
            "INSERT INTO concepts(note_id, kind, value) VALUES (?, ?, ?)",
            [(note_id, kind, value) for kind, value in concepts],
        )
        return int(note_id)


def shortlist(note_id: int, concepts: list[tuple[str, str]], limit: int = 8):
    values = [value.lower() for _, value in concepts if value.strip()]
    if not values:
        return []
    placeholders = ",".join("?" for _ in values)
    query = f"""
        SELECT DISTINCT n.id, n.content, n.summary, n.created_at
        FROM notes n JOIN concepts c ON c.note_id = n.id
        WHERE n.id != ? AND lower(c.value) IN ({placeholders})
        ORDER BY n.created_at DESC LIMIT ?
    """
    with connection() as conn:
        return conn.execute(query, [note_id, *values, limit]).fetchall()


def add_links(source_id: int, links: list[dict]):
    with connection() as conn:
        conn.executemany(
            """INSERT OR REPLACE INTO links
               (source_id, target_id, relation, strength, reason)
               VALUES (?, ?, ?, ?, ?)""",
            [
                (source_id, item["note_id"], item["type"], item["strength"], item["reason"])
                for item in links
            ],
        )


def all_notes():
    with connection() as conn:
        return conn.execute("SELECT * FROM notes ORDER BY created_at DESC").fetchall()


def all_links():
    with connection() as conn:
        return conn.execute(
            """SELECT l.*, s.summary AS source_summary, t.summary AS target_summary
               FROM links l JOIN notes s ON s.id=l.source_id JOIN notes t ON t.id=l.target_id
               ORDER BY l.id DESC"""
        ).fetchall()


def get_note(note_id: int):
    with connection() as conn:
        return conn.execute("SELECT * FROM notes WHERE id = ?", (note_id,)).fetchone()


def threads():
    """Return connected components of the saved link graph, newest first."""
    notes = {row["id"]: row for row in all_notes()}
    adjacency = {note_id: set() for note_id in notes}
    for link in all_links():
        adjacency[link["source_id"]].add(link["target_id"])
        adjacency[link["target_id"]].add(link["source_id"])

    components, visited = [], set()
    for note_id in notes:
        if note_id in visited or not adjacency[note_id]:
            continue
        stack, component = [note_id], []
        visited.add(note_id)
        while stack:
            current = stack.pop()
            component.append(notes[current])
            for neighbor in adjacency[current]:
                if neighbor not in visited:
                    visited.add(neighbor)
                    stack.append(neighbor)
        components.append(sorted(component, key=lambda row: row["created_at"]))
    return components
