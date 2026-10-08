import { useEffect } from 'react';
import { linkColor, linkLabel } from '../linkTypes.js';

const HIDE_MS = 9000;

// The result of a drag-to-connect, shown at the top of the viewport.
export default function Toast({ toast, nodesById, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(onClose, HIDE_MS);
    return () => clearTimeout(id);
  }, [toast, onClose]);

  if (!toast?.connect) return null;
  const c = toast.connect;
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
        <p className="text-sm text-ink">
          {c.existing ? 'Already linked: ' : 'Gemma linked these notes: '}
          <span className="font-medium" style={{ color: linkColor(c.link.type) }}>{linkLabel(c.link.type)}</span>
          <span className="text-muted"> · {c.link.strength}/5</span>
        </p>
        <p className="text-xs text-muted">{c.link.reason}</p>
      </>
    );
  } else {
    border = 'border-bad/40';
    body = (
      <>
        <p className="text-sm text-ink">
          Gemma: no strong connection <span className="text-muted">· {c.strength}/5</span>
        </p>
        <p className="text-xs text-muted">{c.reason}</p>
      </>
    );
  }

  return (
    <div className="fixed left-1/2 top-20 z-50 w-[min(32rem,calc(100%-2rem))] -translate-x-1/2" role="status">
      <div className={`flex flex-col gap-1.5 rounded-2xl border bg-surface p-4 shadow-card ${border}`}>
        <div className="flex items-start justify-between gap-3">
          <p className="text-[11px] text-muted">{name(c.a)} ↔ {name(c.b)}</p>
          <button type="button" onClick={onClose} className="text-muted hover:text-ink" aria-label="Dismiss">✕</button>
        </div>
        {body}
      </div>
    </div>
  );
}
