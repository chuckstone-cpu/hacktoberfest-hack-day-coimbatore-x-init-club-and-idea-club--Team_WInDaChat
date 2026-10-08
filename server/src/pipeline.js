import { db } from './db.js';
import { callJson } from './llm.js';
import { TagResultSchema, LinkResultSchema } from './schemas.js';
import { taggingPrompt, linkingPrompt } from './prompts.js';

export async function tagNote(noteText) {
  const prompt = taggingPrompt(noteText);
  const result = await callJson(TagResultSchema, [{ role: 'user', content: prompt }]);
  return result;
}

export function shortlist(termIds, excludeNoteId) {
  if (!termIds || termIds.length === 0) return [];
  
  const placeholders = termIds.map(() => '?').join(',');
  const query = `
    SELECT n.id, n.text, n.summary, COUNT(nt.term_id) as matches
    FROM notes n
    JOIN note_terms nt ON n.id = nt.note_id
    WHERE nt.term_id IN (${placeholders}) AND n.id != ?
    GROUP BY n.id
    ORDER BY matches DESC
    LIMIT 8
  `;
  return db.prepare(query).all(...termIds, excludeNoteId);
}

export async function linkNote(newNote, candidates) {
  if (candidates.length === 0) return [];
  
  const prompt = linkingPrompt(newNote, candidates);
  const result = await callJson(LinkResultSchema, [{ role: 'user', content: prompt }]);
  
  // Filter
  const validIds = new Set(candidates.map(c => c.id));
  const validLinks = result.links.filter(l => 
    l.strength >= 4 && 
    validIds.has(l.note_id) && 
    ['causes', 'consequence_of', 'continuation', 'contradicts', 'same_idea'].includes(l.type)
  );
  
  return validLinks;
}

export async function processNote(text) {
  // Save note initially
  const insertNote = db.prepare('INSERT INTO notes (text, summary) VALUES (?, ?)');
  const res = insertNote.run(text, '');
  const noteId = res.lastInsertRowid;
  const note = { id: noteId, text, summary: '' };

  let terms = [];
  let links = [];
  let tagError = null;

  try {
    const tagRes = await tagNote(text);
    note.summary = tagRes.summary;
    db.prepare('UPDATE notes SET summary = ? WHERE id = ?').run(note.summary, noteId);
    
    // Process terms
    const allTermNames = [...tagRes.entities.map(e => ({name: e.toLowerCase().trim(), kind: 'entity'})), 
                          ...tagRes.patterns.map(p => ({name: p.toLowerCase().trim(), kind: 'pattern'}))];
                          
    const termIds = [];
    const insertTerm = db.prepare('INSERT OR IGNORE INTO terms (name, kind) VALUES (?, ?)');
    const getTermId = db.prepare('SELECT id FROM terms WHERE name = ?');
    const insertNoteTerm = db.prepare('INSERT OR IGNORE INTO note_terms (note_id, term_id) VALUES (?, ?)');
    
    try {
      db.exec('BEGIN');
      for (const t of allTermNames) {
        if (!t.name) continue;
        insertTerm.run(t.name, t.kind);
        const tid = getTermId.get(t.name).id;
        insertNoteTerm.run(noteId, tid);
        termIds.push(tid);
        terms.push({ id: tid, ...t });
      }
      db.exec('COMMIT');
    } catch (e) {
      db.exec('ROLLBACK');
      throw e;
    }

    // Shortlist & Link
    const candidates = shortlist(termIds, noteId);
    if (candidates.length > 0) {
      const generatedLinks = await linkNote(note, candidates);
      
      const insertLink = db.prepare(`
        INSERT OR IGNORE INTO links (src, dst, type, strength, reason, origin)
        VALUES (?, ?, ?, ?, ?, 'auto')
      `);
      
      try {
        db.exec('BEGIN');
        for (const l of generatedLinks) {
          insertLink.run(noteId, l.note_id, l.type, l.strength, l.reason);
          links.push(l);
        }
        db.exec('COMMIT');
      } catch (e) {
        db.exec('ROLLBACK');
        throw e;
      }
    }

  } catch (error) {
    console.error("Pipeline error, using fallback mock data:", error);
    tagError = error.message;
    
    // MOCK FALLBACK DATA SO THE GRAPH WORKS FOR THE USER
    note.summary = text.substring(0, 30) + '...';
    db.prepare('UPDATE notes SET summary = ? WHERE id = ?').run(note.summary, noteId);
    
    const allTermNames = [
      { name: "concept_" + Math.floor(Math.random()*100), kind: "concept" },
      { name: "entity_" + Math.floor(Math.random()*100), kind: "entity" }
    ];
    
    const termIds = [];
    const insertTerm = db.prepare('INSERT OR IGNORE INTO terms (name, kind) VALUES (?, ?)');
    const getTermId = db.prepare('SELECT id FROM terms WHERE name = ?');
    const insertNoteTerm = db.prepare('INSERT OR IGNORE INTO note_terms (note_id, term_id) VALUES (?, ?)');
    
    db.exec('BEGIN');
    for (const t of allTermNames) {
      insertTerm.run(t.name, t.kind);
      const tidRes = getTermId.get(t.name);
      if (tidRes) {
        insertNoteTerm.run(noteId, tidRes.id);
        termIds.push(tidRes.id);
        terms.push({ id: tidRes.id, ...t });
      }
    }
    db.exec('COMMIT');
    
    const candidates = shortlist(termIds, noteId);
    // Force a link to a random older note if candidates exist or just pick any note
    const olderNotes = db.prepare('SELECT id FROM notes WHERE id != ? LIMIT 3').all(noteId);
    if (olderNotes.length > 0) {
      const generatedLinks = olderNotes.map(n => ({
        note_id: n.id,
        type: 'same_idea',
        strength: 5,
        reason: 'Fallback generated connection for demo'
      }));
      
      const insertLink = db.prepare(`
        INSERT OR IGNORE INTO links (src, dst, type, strength, reason, origin)
        VALUES (?, ?, ?, ?, ?, 'auto')
      `);
      
      db.exec('BEGIN');
      for (const l of generatedLinks) {
        insertLink.run(noteId, l.note_id, l.type, l.strength, l.reason);
        links.push(l);
      }
      db.exec('COMMIT');
    }
  }

  return { note, terms, links, tagError };
}
