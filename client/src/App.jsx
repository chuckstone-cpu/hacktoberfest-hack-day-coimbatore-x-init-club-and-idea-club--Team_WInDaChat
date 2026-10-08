import { useCallback, useEffect, useMemo, useState } from 'react';
import { REJECT_FADE_MS } from './components/GraphView.jsx';
import Nav from './components/Nav.jsx';
import Hero from './components/Hero.jsx';
import NotesSection from './components/NotesSection.jsx';
import GraphSection from './components/GraphSection.jsx';
import AddSection from './components/AddSection.jsx';
import SidePanel from './components/SidePanel.jsx';
import Toast from './components/Toast.jsx';
import { connectPair, createNote, getGraph, getThread } from './api.js';

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
  const [pending, setPending] = useState(null);
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

  const linkCounts = useMemo(() => {
    const counts = new Map();
    for (const l of graph.links) {
      for (const id of [idOf(l.source), idOf(l.target)]) counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    return counts;
  }, [graph.links]);

  const saveNote = async (text) => {
    const { note, terms, links, tagError, linkError } = await createNote(text);
    const node = { ...toNode(note, terms), addedAt: performance.now() };
    // Append instead of replacing so existing nodes keep their positions.
    setGraph((g) => ({
      nodes: [...g.nodes, node],
      links: [...g.links, ...links.map((l) => ({ ...l, source: l.src, target: l.dst }))],
    }));
    setNewNodeId(note.id);
    return { noteId: note.id, summary: note.summary, terms, links, tagError, linkError };
  };

  const showInGraph = (id) => {
    document.getElementById('graph')?.scrollIntoView({ block: 'start' });
    setSelectedId(id);
  };

  // Drag-to-connect: Gemma judges the dropped pair; a new link joins the graph.
  const connect = async (a, b) => {
    if (pending?.status === 'thinking') return;
    setPending({ a, b, status: 'thinking' });
    try {
      const r = await connectPair(a, b);
      if (r.linked && !r.existing) {
        const l = r.link;
        setGraph((g) => ({ nodes: g.nodes, links: [...g.links, { ...l, source: l.src, target: l.dst }] }));
      }
      if (r.linked) {
        setPending(null);
      } else {
        setPending({ a, b, status: 'rejected', at: performance.now() });
        setTimeout(() => setPending((p) => (p?.a === a && p?.b === b ? null : p)), REJECT_FADE_MS);
      }
      setToast({ connect: { a, b, ...r } });
    } catch (err) {
      setPending(null);
      setToast({ connect: { a, b, error: err.message } });
    }
  };

  return (
    <>
      <Nav noteCount={graph.nodes.length} linkCount={graph.links.length} />
      <main>
        {loadError && (
          <p className="mx-auto max-w-6xl px-4 pt-4 text-sm text-bad-ink sm:px-6" role="alert">
            Couldn't load notes: {loadError}
          </p>
        )}
        <Hero />
        <NotesSection notes={graph.nodes} linkCounts={linkCounts} onOpen={setSelectedId} />
        <GraphSection
          data={graph}
          selectedId={selectedId}
          focusIds={focusIds}
          newNodeId={newNodeId}
          pending={pending}
          onSelect={setSelectedId}
          onConnect={connect}
        />
        <AddSection onSave={saveNote} nodesById={nodesById} onShowInGraph={showInGraph} />
      </main>
      <footer className="border-t border-line py-8 text-center text-xs text-muted">
        Connectore · Team WInDaChat · runs locally on Gemma 4 via Ollama
      </footer>

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
    </>
  );
}
