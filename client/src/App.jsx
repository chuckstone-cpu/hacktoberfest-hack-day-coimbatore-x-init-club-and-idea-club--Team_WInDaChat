import { useEffect, useState } from 'react';
import StatusPill from './components/StatusPill.jsx';
import GraphView from './components/GraphView.jsx';
import NoteInput from './components/NoteInput.jsx';
import SidePanel from './components/SidePanel.jsx';
import { createNote, getGraph } from './api.js';

function toNode(note) {
  return {
    id: note.id,
    label: note.summary || note.text,
    summary: note.summary,
    text: note.text,
    createdAt: note.created_at,
  };
}

export default function App() {
  const [graph, setGraph] = useState({ nodes: [], links: [] });
  const [loadError, setLoadError] = useState('');
  const [selected, setSelected] = useState(null);
  const [newNodeId, setNewNodeId] = useState(null);

  useEffect(() => {
    getGraph().then(setGraph).catch((err) => setLoadError(err.message));
  }, []);

  const saveNote = async (text) => {
    const { note, links } = await createNote(text);
    const node = { ...toNode(note), addedAt: performance.now() };
    // Append instead of replacing so existing nodes keep their positions.
    setGraph((g) => ({
      nodes: [...g.nodes, node],
      links: [...g.links, ...links.map((l) => ({ ...l, source: l.src, target: l.dst }))],
    }));
    setNewNodeId(note.id);
  };

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-edge px-5 py-3">
        <h1 className="text-lg font-semibold tracking-tight">
          <span className="text-accent">●</span> Connectore
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted">{graph.nodes.length} notes</span>
          <StatusPill />
        </div>
      </header>

      <main className="relative flex-1 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,#8b5cf61a,transparent_60%)]" />
        <GraphView
          data={graph}
          selectedId={selected?.id}
          newNodeId={newNodeId}
          onSelect={setSelected}
        />
        <SidePanel node={selected} onClose={() => setSelected(null)} />
        {loadError && (
          <p className="absolute left-5 top-4 text-xs text-red-400">Couldn't load notes: {loadError}</p>
        )}
      </main>

      <NoteInput onSave={saveNote} />
    </div>
  );
}
