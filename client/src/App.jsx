import { useCallback, useEffect, useMemo, useState } from 'react';
import StatusPill from './components/StatusPill.jsx';
import GraphView from './components/GraphView.jsx';
import Legend from './components/Legend.jsx';
import NoteInput from './components/NoteInput.jsx';
import SidePanel from './components/SidePanel.jsx';
import Toast from './components/Toast.jsx';
import { createNote, getGraph, getThread } from './api.js';

const idOf = (end) => (typeof end === 'object' ? end.id : end);

function toNode(note, terms) {
  return {
    id: note.id,
    label: note.summary || note.text,
    summary: note.summary,
    text: note.text,
    createdAt: note.created_at,
    terms,
  };
}

export default function App() {
  const [graph, setGraph] = useState({ nodes: [], links: [] });
  const [loadError, setLoadError] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [thread, setThread] = useState(null);
  const [threadError, setThreadError] = useState('');
  const [newNodeId, setNewNodeId] = useState(null);
  const [toast, setToast] = useState(null);
  const closeToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    getGraph().then(setGraph).catch((err) => setLoadError(err.message));
  }, []);

  const nodesById = useMemo(() => new Map(graph.nodes.map((n) => [n.id, n])), [graph.nodes]);
  const selected = selectedId != null ? nodesById.get(selectedId) : null;

  const selectedLinks = useMemo(() => {
    if (selectedId == null) return [];
    return graph.links
      .filter((l) => idOf(l.source) === selectedId || idOf(l.target) === selectedId)
      .map((l) => ({
        ...l,
        otherId: idOf(l.source) === selectedId ? idOf(l.target) : idOf(l.source),
      }))
      .sort((a, b) => b.strength - a.strength);
  }, [graph.links, selectedId]);

  // Load the thread whenever the selection (or the set of links) changes.
  const linkCount = graph.links.length;
  useEffect(() => {
    setThread(null);
    setThreadError('');
    if (selectedId == null) return;
    let alive = true;
    getThread(selectedId)
      .then((t) => alive && setThread(t))
      .catch((err) => alive && setThreadError(err.message));
    return () => { alive = false; };
  }, [selectedId, linkCount]);

  const focusIds = useMemo(() => (thread ? new Set(thread.map((n) => n.id)) : null), [thread]);

  const saveNote = async (text) => {
    const { note, terms, links, tagError, linkError } = await createNote(text);
    const node = { ...toNode(note, terms), addedAt: performance.now() };
    // Append instead of replacing so existing nodes keep their positions.
    setGraph((g) => ({
      nodes: [...g.nodes, node],
      links: [...g.links, ...links.map((l) => ({ ...l, source: l.src, target: l.dst }))],
    }));
    setNewNodeId(note.id);
    setToast({ summary: note.summary, terms, links, tagError, linkError });
  };

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-edge px-5 py-3">
        <h1 className="text-lg font-semibold tracking-tight">
          <span className="text-accent">●</span> Connectore
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted">
            {graph.nodes.length} notes · {graph.links.length} links
          </span>
          <StatusPill />
        </div>
      </header>

      <main className="relative flex-1 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,#8b5cf61a,transparent_60%)]" />
        <GraphView
          data={graph}
          selectedId={selectedId}
          focusIds={focusIds}
          newNodeId={newNodeId}
          onSelect={setSelectedId}
        />
        <Legend />
        <SidePanel
          node={selected}
          links={selectedLinks}
          nodesById={nodesById}
          thread={thread}
          threadError={threadError}
          onSelect={setSelectedId}
          onClose={() => setSelectedId(null)}
        />
        <Toast toast={toast} nodesById={nodesById} onClose={closeToast} />
        {loadError && (
          <p className="absolute left-5 top-4 text-xs text-red-400">Couldn't load notes: {loadError}</p>
        )}
      </main>

      <NoteInput onSave={saveNote} />
    </div>
  );
}
