import { useEffect } from 'react';
import TermChips from './TermChips.jsx';
import { linkColor, linkLabel } from '../linkTypes.js';

const HIDE_MS = 9000;

export default function Toast({ toast, nodesById, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(onClose, HIDE_MS);
    return () => clearTimeout(id);
  }, [toast, onClose]);

  if (!toast) return null;
  const { summary, terms, links, tagError, linkError } = toast;
  const warn = tagError || linkError;

  return (
    <div className="absolute left-1/2 top-4 z-20 w-[min(32rem,calc(100%-2rem))] -translate-x-1/2">
      <div className={`flex flex-col gap-2 rounded-xl border bg-panel/95 p-4 shadow-xl backdrop-blur ${warn ? 'border-amber-500/50' : 'border-accent/40'}`}>
        <div className="flex items-start justify-between gap-3">
          {tagError ? (
            <p className="text-sm text-amber-300">Note saved, but tagging failed. {tagError}</p>
          ) : (
            <p className="text-sm">{summary}</p>
          )}
          <button onClick={onClose} className="text-muted hover:text-ink" aria-label="Dismiss">✕</button>
        </div>
        <TermChips terms={terms} />

        {!tagError && (
          <div className="flex flex-col gap-1.5 border-t border-edge pt-2">
            {linkError ? (
              <p className="text-xs text-amber-300">{linkError}</p>
            ) : (
              <p className="text-xs font-medium text-muted">
                {links.length === 0 ? 'No strong connections to older notes.' : `Linked to ${links.length} note${links.length > 1 ? 's' : ''}`}
              </p>
            )}
            {links.map((l) => (
              <div key={l.dst} className="text-xs">
                <span style={{ color: linkColor(l.type) }}>{linkLabel(l.type)}</span>
                <span className="text-ink"> → {nodesById.get(l.dst)?.label ?? `Note #${l.dst}`}</span>
                <p className="text-muted">{l.reason}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
