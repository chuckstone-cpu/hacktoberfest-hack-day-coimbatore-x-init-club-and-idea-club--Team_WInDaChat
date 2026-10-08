import { Router } from 'express';
import { db } from '../db.js';
import { v4 as uuidv4 } from 'uuid';

export const notionRouter = Router();

// GET all pages in a workspace
notionRouter.get('/workspaces/:id/pages', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('SELECT * FROM pages WHERE workspace_id = ? ORDER BY created_at ASC');
    const pages = stmt.all(id);
    res.json(pages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single page details
notionRouter.get('/pages/:id', (req, res) => {
  try {
    const { id } = req.params;
    const page = db.prepare('SELECT * FROM pages WHERE id = ?').get(id);
    if (!page) return res.status(404).json({ error: 'Page not found' });
    res.json(page);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create a page
notionRouter.post('/pages', (req, res) => {
  try {
    const { workspace_id, parent_page_id, title, icon } = req.body;
    const id = uuidv4();
    const stmt = db.prepare('INSERT INTO pages (id, workspace_id, parent_page_id, title, icon) VALUES (?, ?, ?, ?, ?)');
    stmt.run(id, workspace_id || 'default', parent_page_id || null, title || 'Untitled', icon || '📄');
    const newPage = db.prepare('SELECT * FROM pages WHERE id = ?').get(id);
    res.json(newPage);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH rename/move page
notionRouter.patch('/pages/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = [];
    const values = [];
    
    if (req.body.title !== undefined) {
      updates.push('title = ?');
      values.push(req.body.title);
    }
    if (req.body.icon !== undefined) {
      updates.push('icon = ?');
      values.push(req.body.icon);
    }
    if (req.body.parent_page_id !== undefined) {
      updates.push('parent_page_id = ?');
      values.push(req.body.parent_page_id);
    }
    
    if (updates.length > 0) {
      updates.push("updated_at = datetime('now', 'localtime')");
      const stmt = db.prepare(`UPDATE pages SET ${updates.join(', ')} WHERE id = ?`);
      stmt.run(...values, id);
    }
    
    const updatedPage = db.prepare('SELECT * FROM pages WHERE id = ?').get(id);
    res.json(updatedPage);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE a page
notionRouter.delete('/pages/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM pages WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- BLOCKS ---

// GET blocks for a page
notionRouter.get('/pages/:id/blocks', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('SELECT * FROM blocks WHERE page_id = ? ORDER BY position ASC');
    const blocks = stmt.all(id);
    // Parse content json
    blocks.forEach(b => {
      try { b.content = JSON.parse(b.content); } catch (e) { b.content = {}; }
    });
    res.json(blocks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create a block
notionRouter.post('/blocks', (req, res) => {
  try {
    const { page_id, parent_block_id, type, content, position } = req.body;
    const id = uuidv4();
    const stmt = db.prepare('INSERT INTO blocks (id, page_id, parent_block_id, type, content, position) VALUES (?, ?, ?, ?, ?, ?)');
    stmt.run(id, page_id, parent_block_id || null, type || 'paragraph', JSON.stringify(content || {}), position || 0);
    const newBlock = db.prepare('SELECT * FROM blocks WHERE id = ?').get(id);
    newBlock.content = JSON.parse(newBlock.content);
    res.json(newBlock);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH update a block
notionRouter.patch('/blocks/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { type, content, position } = req.body;
    const updates = [];
    const values = [];
    
    if (type !== undefined) { updates.push('type = ?'); values.push(type); }
    if (content !== undefined) { updates.push('content = ?'); values.push(JSON.stringify(content)); }
    if (position !== undefined) { updates.push('position = ?'); values.push(position); }
    
    if (updates.length > 0) {
      updates.push("updated_at = datetime('now', 'localtime')");
      const stmt = db.prepare(`UPDATE blocks SET ${updates.join(', ')} WHERE id = ?`);
      stmt.run(...values, id);
    }
    const updatedBlock = db.prepare('SELECT * FROM blocks WHERE id = ?').get(id);
    updatedBlock.content = JSON.parse(updatedBlock.content);
    res.json(updatedBlock);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE a block
notionRouter.delete('/blocks/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM blocks WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
