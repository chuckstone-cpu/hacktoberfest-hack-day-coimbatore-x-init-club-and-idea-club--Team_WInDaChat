import { LINK_TYPES } from '../linkTypes.js';

export default function Legend() {
  return (
    <div className="pointer-events-none absolute bottom-4 left-4 z-10 flex flex-col gap-1.5 rounded-lg border border-edge bg-panel/80 px-3 py-2.5 backdrop-blur">
      {Object.entries(LINK_TYPES).map(([type, { color, label }]) => (
        <div key={type} className="flex items-center gap-2 text-[11px] text-muted">
          <span className="h-0.5 w-5 rounded" style={{ background: color }} />
          {label}
        </div>
      ))}
    </div>
  );
}
