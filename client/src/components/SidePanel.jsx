import { useEffect, useRef, useState } from 'react';
import TermChips from './TermChips.jsx';
import FaithReport from './FaithReport.jsx';
import { SABOTAGED } from '../demo.js';
import { streamStory } from '../api.js';
import { linkColor, linkLabel } from '../linkTypes.js';

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

function Section({ title, children }) {
  return (
    <section className="flex flex-col gap-2 border-t border-edge pt-3">
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted">{title}</h3>
      {children}
    </section>
  );
}

function Story({ thread }) {
  const [text, setText] = useState('');
  const [status, setStatus] = useState('idle'); // idle | streaming | done | error
  const [error, setError] = useState('');
  const [useDemo, setUseDemo] = useState(false);
  const abortRef = useRef(null);
  const boxRef = useRef(null);
  const noteIds = thread.map((n) => n.id);
  const threadKey = noteIds.join(',');
  const demoAvailable = thread.some(SABOTAGED.matches);

  // A different thread means a different story; stop any in-flight one.
  useEffect(() => {
    setText('');
    setStatus('idle');
    setError('');
    setUseDemo(false);
    return () => abortRef.current?.abort();
  }, [threadKey]);

  const tell = async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setText('');
    setError('');
    setStatus('streaming');
    boxRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    try {
      await streamStory(noteIds, (chunk) => setText((t) => t + chunk), controller.signal);
      setStatus('done');
    } catch (err) {
      if (err.name === 'AbortError') return;
      setError(err.message);
      setStatus('error');
    }
  };

  const checkedText = useDemo ? SABOTAGED.text : status === 'done' ? text : '';

  return (
    <div ref={boxRef} className="flex scroll-mt-4 flex-col gap-2">
      {demoAvailable && (
        <label className="flex items-center gap-2 text-xs text-muted">
          <input type="checkbox" checked={useDemo} onChange={(e) => setUseDemo(e.target.checked)} className="accent-violet-500" />
          Use sabotaged story (demo)
        </label>
      )}

      {useDemo ? (
        <>
          <p className="text-[11px] text-amber-300">Hand-written demo story with facts removed on purpose.</p>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-200">{SABOTAGED.text}</p>
        </>
      ) : thread.length < 2 ? (
        <p className="text-xs text-muted">This note isn't linked to anything yet, so there's no story to tell.</p>
      ) : (
        <>
          <button
            onClick={tell}
            disabled={status === 'streaming'}
            className="self-start rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-500 disabled:opacity-60"
          >
            {status === 'streaming' ? 'Gemma is writing…' : status === 'done' ? 'Tell it again' : 'Tell the story'}
          </button>
          {text && (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-200">
              {text}
              {status === 'streaming' && <span className="ml-0.5 inline-block h-3.5 w-1.5 animate-pulse bg-accent align-middle" />}
            </p>
          )}
          {error && <p className="text-xs text-red-400">{error}</p>}
        </>
      )}

      {checkedText && (
        <div className="mt-2 flex flex-col gap-2 border-t border-edge pt-3">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted">Faithfulness report</h3>
          <FaithReport noteIds={noteIds} text={checkedText} />
        </div>
      )}
    </div>
  );
}

export default function SidePanel({ node, links, nodesById, thread, threadError, onSelect, onClose }) {
  if (!node) return null;

  return (
    <aside className="absolute right-0 top-0 z-10 flex h-full w-96 max-w-full flex-col gap-3 overflow-y-auto border-l border-edge bg-panel/95 p-5 backdrop-blur">
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-sm font-semibold">Note #{node.id}</h2>
        <button onClick={onClose} className="text-muted hover:text-ink" aria-label="Close">✕</button>
      </div>
      <p className="text-xs text-muted">{formatDate(node.createdAt)}</p>
      {node.summary ? (
        <p className="text-sm font-medium text-violet-200">{node.summary}</p>
      ) : (
        <p className="text-xs text-amber-300">Not tagged yet.</p>
      )}
      <TermChips terms={node.terms} />
      <p className="whitespace-pre-wrap text-sm leading-relaxed">{node.text}</p>

      <Section title={`Links (${links.length})`}>
        {links.length === 0 && <p className="text-xs text-muted">No strong connections found.</p>}
        {links.map((l) => {
          const other = nodesById.get(l.otherId);
          return (
            <button
              key={l.otherId}
              onClick={() => onSelect(l.otherId)}
              className="flex flex-col gap-1 rounded-lg border border-edge bg-canvas/60 p-2.5 text-left hover:border-accent/60"
            >
              <span className="flex items-center gap-2 text-[11px]">
                <span className="h-2 w-2 rounded-full" style={{ background: linkColor(l.type) }} />
                <span style={{ color: linkColor(l.type) }}>{linkLabel(l.type)}</span>
                <span className="text-muted">· {l.strength}/5</span>
              </span>
              <span className="text-xs text-ink">{other?.label ?? `Note #${l.otherId}`}</span>
              <span className="text-xs text-muted">{l.reason}</span>
            </button>
          );
        })}
      </Section>

      <Section title="Thread">
        {threadError && <p className="text-xs text-red-400">{threadError}</p>}
        {!thread && !threadError && <p className="text-xs text-muted">Loading…</p>}
        {thread && (
          <ol className="flex flex-col gap-1.5">
            {thread.map((n, i) => (
              <li key={n.id}>
                <button
                  onClick={() => onSelect(n.id)}
                  className={`flex w-full gap-2 rounded-md px-2 py-1 text-left text-xs hover:bg-canvas ${n.id === node.id ? 'bg-accent/15 text-violet-200' : 'text-ink'}`}
                >
                  <span className="w-4 shrink-0 text-muted">{i + 1}.</span>
                  <span className="flex-1">{n.summary || n.text}</span>
                  <span className="shrink-0 text-muted">{formatDate(n.created_at)}</span>
                </button>
              </li>
            ))}
          </ol>
        )}
      </Section>

      {thread && (
        <Section title="Story">
          <Story thread={thread} />
        </Section>
      )}
    </aside>
  );
}
