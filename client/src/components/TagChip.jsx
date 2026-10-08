import { sortTerms, tagColor } from '../tags.js';

// Pattern tags (abstract mechanisms) are filled pills with a ◆; entity tags
// (named things) are outlined, so the two kinds read differently at a glance.
export default function TagChip({ name, kind, active = false, onClick, count }) {
  const c = tagColor(name);
  const filled = kind === 'pattern';
  const style = filled
    ? { background: c.tint, color: c.ink, borderColor: active ? c.ink : c.tint }
    : { background: active ? c.tint : 'transparent', color: c.ink, borderColor: c.solid };
  const body = (
    <>
      {filled && <span aria-hidden="true" className="text-[9px]">◆</span>}
      {name}
      {count != null && <span className="opacity-70">{count}</span>}
    </>
  );
  const cls = `inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium leading-5 ${active ? 'ring-2 ring-offset-1 ring-offset-surface' : ''}`;

  if (!onClick) return <span className={cls} style={style}>{body}</span>;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={`${active ? 'Clear' : 'Filter by'} ${kind} tag ${name}`}
      className={`${cls} cursor-pointer transition-transform hover:-translate-y-px`}
      style={{ ...style, '--tw-ring-color': c.solid }}
    >
      {body}
    </button>
  );
}

export function TagList({ terms, limit }) {
  if (!terms?.length) return null;
  const sorted = sortTerms(terms);
  const shown = limit ? sorted.slice(0, limit) : sorted;
  return (
    <div className="flex flex-wrap gap-1.5">
      {shown.map((t) => <TagChip key={`${t.kind}:${t.name}`} name={t.name} kind={t.kind} />)}
      {limit && sorted.length > limit && <span className="self-center text-xs text-muted">+{sorted.length - limit}</span>}
    </div>
  );
}
