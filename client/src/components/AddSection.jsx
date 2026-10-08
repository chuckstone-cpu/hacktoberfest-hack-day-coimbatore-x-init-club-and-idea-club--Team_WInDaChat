import { useState } from 'react';
import NoteResult from './NoteResult.jsx';
import useReveal from '../hooks/useReveal.js';

const MAX_LEN = 2000;

export default function AddSection({ onSave, nodesById, onShowInGraph }) {
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null); // { noteId, summary, terms, links, tagError, linkError }
  const revealRef = useReveal();

  const save = async () => {
    if (saving) return;
    if (!text.trim()) {
      setError('Write something before saving.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      setResult(await onSave(text));
      setText('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section id="add" className="border-t border-line py-20">
      <div ref={revealRef} className="reveal mx-auto flex max-w-3xl flex-col gap-6 px-4 sm:px-6">
        <div className="flex flex-col gap-2">
          <h2 className="font-display text-4xl font-semibold tracking-tight text-ink">Add a note</h2>
          <p className="text-muted">
            Lecture notes, a textbook idea, a news snippet. Gemma tags it and links it to anything related you've written
            before.
          </p>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); save(); }}
          className="flex flex-col gap-3 rounded-3xl border border-line bg-surface p-5 shadow-card"
        >
          <label htmlFor="note-text" className="sr-only">Note text</label>
          <textarea
            id="note-text"
            value={text}
            onChange={(e) => { setText(e.target.value); setError(''); }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); save(); }
            }}
            maxLength={MAX_LEN}
            rows={6}
            readOnly={saving}
            placeholder="e.g. A thermostat turns the AC off when the room reaches the set temperature and back on when it warms up."
            className={`w-full resize-y rounded-2xl border border-line bg-bg p-4 text-base leading-relaxed text-ink outline-none placeholder:text-muted focus:border-accent ${saving ? 'opacity-60' : ''}`}
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs tabular-nums text-muted" aria-live="polite">
              {saving ? (
                <span className="animate-pulse font-medium text-accent-ink">Gemma is reading your note…</span>
              ) : (
                `${text.length}/${MAX_LEN} · Ctrl/⌘ + Enter to save`
              )}
            </span>
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-surface transition-colors hover:bg-accent-ink disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save note'}
            </button>
          </div>
          {error && <p className="text-sm text-bad-ink" role="alert">{error}</p>}
        </form>

        {result && (
          <div className="flex flex-col gap-4 rounded-3xl border border-accent/30 bg-surface p-5 shadow-card" aria-live="polite">
            <NoteResult result={result} nodesById={nodesById} />
            <button
              type="button"
              onClick={() => onShowInGraph(result.noteId)}
              className="self-start rounded-full border border-accent/60 px-4 py-2 text-sm font-semibold text-accent-ink transition-colors hover:bg-accent/10"
            >
              See it in the graph
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
