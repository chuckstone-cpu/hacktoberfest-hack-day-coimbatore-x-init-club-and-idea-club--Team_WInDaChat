export default function SidePanel({ node, onClose }) {
  if (!node) return null;
  return (
    <aside className="absolute right-0 top-0 z-10 flex h-full w-80 flex-col gap-3 border-l border-edge bg-panel/95 p-5 backdrop-blur">
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-sm font-semibold">Note #{node.id}</h2>
        <button onClick={onClose} className="text-muted hover:text-ink" aria-label="Close">✕</button>
      </div>
      <p className="text-xs text-muted">{new Date(node.createdAt).toLocaleString()}</p>
      <p className="whitespace-pre-wrap text-sm leading-relaxed">{node.text}</p>
    </aside>
  );
}
