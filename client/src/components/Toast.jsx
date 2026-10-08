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
  if (toast.connect) return <ConnectToast c={toast.connect} nodesById={nodesById} onClose={onClose} />;
  const { summary, terms, links, tagError, linkError } = toast;
  const warn = tagError || linkError;

  return (
    <div className="absolute left-1/2 top-4 z-20 w-[min(32rem,calc(100%-2rem))] -translate-x-1/2">
      <div className={`flex flex-col gap-2 rounded-2xl border bg-surface p-4 shadow-card ${warn ? 'border-warn/50' : 'border-accent/40'}`}>
        <div className="flex items-start justify-between gap-3">
          {tagError ? (
            <p className="text-sm text-warn-ink">Note saved, but tagging failed. {tagError}</p>
          ) : (
            <p className="text-sm">{summary}</p>
          )}
          <button onClick={onClose} className="text-muted hover:text-ink" aria-label="Dismiss">✕</button>
        </div>
        <TermChips terms={terms} />

        {!tagError && (
          <div className="flex flex-col gap-1.5 border-t border-line pt-2">
            {linkError ? (
              <p className="text-xs text-warn-ink">{linkError}</p>
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

function ConnectToast({ c, nodesById, onClose }) {
  const name = (id) => {
    const label = nodesById.get(id)?.label ?? `Note #${id}`;
    return label.length > 40 ? `${label.slice(0, 39)}…` : label;
  };
  let border = 'border-accent/40';
  let body;
  if (c.error) {
    border = 'border-warn/50';
    body = <p className="text-sm text-warn-ink">{c.error}</p>;
  } else if (c.linked) {
    body = (
      <>
        <p className="text-sm">
          {c.existing ? 'Already linked: ' : 'Gemma linked these notes: '}
          <span style={{ color: linkColor(c.link.type) }}>{linkLabel(c.link.type)}</span>
          <span className="text-muted"> · {c.link.strength}/5</span>
        </p>
        <p className="text-xs text-muted">{c.link.reason}</p>
      </>
    );
  } else {
    border = 'border-bad/40';
    body = (
      <>
        <p className="text-sm">
          Gemma: no strong connection <span className="text-muted">· {c.strength}/5</span>
        </p>
        <p className="text-xs text-muted">{c.reason}</p>
      </>
    );
  }
  return (
    <div className="absolute left-1/2 top-4 z-20 w-[min(32rem,calc(100%-2rem))] -translate-x-1/2">
      <div className={`flex flex-col gap-1.5 rounded-2xl border bg-surface p-4 shadow-card ${border}`}>
        <div className="flex items-start justify-between gap-3">
          <p className="text-[11px] text-muted">{name(c.a)} ↔ {name(c.b)}</p>
          <button onClick={onClose} className="text-muted hover:text-ink" aria-label="Dismiss">✕</button>
        </div>
        {body}
      </div>
    </div>
  );
}
