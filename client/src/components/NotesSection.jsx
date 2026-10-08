import { useMemo, useState } from 'react';
import TagChip, { TagList } from './TagChip.jsx';
import useReveal from '../hooks/useReveal.js';

const TAGS_COLLAPSED = 14;

const formatDate = (iso) => new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

function NoteCard({ note, linkCount, onOpen }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(note.id)}
      className="mb-4 flex w-full break-inside-avoid flex-col gap-3 rounded-2xl border border-line bg-surface p-5 text-left shadow-card"
    >
      <h3 className="font-display text-lg font-semibold leading-snug text-ink">{note.summary || 'Untagged note'}</h3>
      <p className="line-clamp-4 text-sm leading-relaxed text-muted">{note.text}</p>
      <TagList terms={note.terms} />
      <div className="flex items-center justify-between text-xs text-muted">
        <span>{formatDate(note.createdAt)}</span>
        <span className="rounded-full border border-line bg-bg px-2 py-0.5 font-medium text-ink">
          {linkCount} {linkCount === 1 ? 'link' : 'links'}
        </span>
      </div>
    </button>
  );
}

export default function NotesSection({ notes, linkCounts, onOpen }) {
  const [query, setQuery] = useState('');
  const [tag, setTag] = useState(null); // "kind:name"
  const [showAllTags, setShowAllTags] = useState(false);
  const revealRef = useReveal();

  // Every tag with how many notes use it, most-used first.
  const tags = useMemo(() => {
    const counts = new Map();
    for (const n of notes) {
      for (const t of n.terms ?? []) {
        const key = `${t.kind}:${t.name}`;
        counts.set(key, { ...t, key, count: (counts.get(key)?.count ?? 0) + 1 });
      }
    }
    return [...counts.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [notes]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...notes]
      .filter((n) => !q || n.text.toLowerCase().includes(q) || n.summary?.toLowerCase().includes(q))
      .filter((n) => !tag || n.terms?.some((t) => `${t.kind}:${t.name}` === tag))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id);
  }, [notes, query, tag]);

  const visibleTags = showAllTags ? tags : tags.slice(0, TAGS_COLLAPSED);
  // Keep the active filter visible even when the list is collapsed.
  const activeTag = tags.find((t) => t.key === tag);
  if (activeTag && !visibleTags.includes(activeTag)) visibleTags.push(activeTag);

  return (
    <section id="notes" className="border-t border-line py-20">
      <div ref={revealRef} className="reveal mx-auto flex max-w-6xl flex-col gap-6 px-4 sm:px-6">
        <div className="flex flex-col gap-2">
          <h2 className="font-display text-4xl font-semibold tracking-tight text-ink">All notes</h2>
          <p className="text-muted">Every note Gemma has read, newest first. Click one to see its links, thread and story.</p>
        </div>

        {notes.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line bg-surface p-8 text-center text-muted">
            No notes yet. Add your first one below.
          </p>
        ) : (
          <>
            <div className="flex flex-col gap-3">
              <label className="relative block max-w-md">
                <span className="sr-only">Search notes</span>
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search notes…"
                  className="w-full rounded-full border border-line bg-surface px-4 py-2.5 text-sm text-ink outline-none placeholder:text-muted focus:border-accent"
                />
              </label>
              <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by tag">
                {visibleTags.map((t) => (
                  <TagChip
                    key={t.key}
                    name={t.name}
                    kind={t.kind}
                    count={t.count}
                    active={tag === t.key}
                    onClick={() => setTag((cur) => (cur === t.key ? null : t.key))}
                  />
                ))}
                {tags.length > TAGS_COLLAPSED && (
                  <button
                    type="button"
                    onClick={() => setShowAllTags((v) => !v)}
                    className="text-xs font-medium text-accent-ink underline-offset-2 hover:underline"
                  >
                    {showAllTags ? 'Fewer tags' : `All ${tags.length} tags`}
                  </button>
                )}
              </div>
            </div>

            {shown.length === 0 ? (
              <p className="text-sm text-muted">No notes match{tag ? ' this tag' : ''}{query ? ` “${query}”` : ''}.</p>
            ) : (
              <div className="columns-1 gap-4 md:columns-2 lg:columns-3">
                {shown.map((n) => (
                  <NoteCard key={n.id} note={n} linkCount={linkCounts.get(n.id) ?? 0} onOpen={onOpen} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
