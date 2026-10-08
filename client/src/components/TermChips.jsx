// Patterns (abstract mechanisms) are teal; entities (named things) are outlined.
export default function TermChips({ terms }) {
  if (!terms?.length) return null;
  const sorted = [...terms].sort((a, b) => (a.kind === b.kind ? 0 : a.kind === 'pattern' ? -1 : 1));
  return (
    <div className="flex flex-wrap gap-1.5">
      {sorted.map((t) => (
        <span
          key={`${t.kind}:${t.name}`}
          className={
            t.kind === 'pattern'
              ? 'rounded-full border border-accent/50 bg-accent/15 px-2 py-0.5 text-[11px] text-accent-ink'
              : 'rounded-full border border-line bg-bg px-2 py-0.5 text-[11px] text-muted'
          }
        >
          {t.name}
        </span>
      ))}
    </div>
  );
}
