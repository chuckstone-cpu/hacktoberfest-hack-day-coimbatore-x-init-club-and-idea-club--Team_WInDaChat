import { useEffect, useState } from 'react';
import { getHealth } from '../api.js';

const POLL_MS = 5000;

export default function StatusPill() {
  const [health, setHealth] = useState(null);
  const [apiDown, setApiDown] = useState(false);

  useEffect(() => {
    let alive = true;
    const check = async () => {
      try {
        const h = await getHealth();
        if (alive) { setHealth(h); setApiDown(false); }
      } catch {
        if (alive) setApiDown(true);
      }
    };
    check();
    const id = setInterval(check, POLL_MS);
    return () => { alive = false; clearInterval(id); };
  }, []);

  let dot = 'bg-zinc-500';
  let label = 'Checking…';
  if (apiDown) {
    dot = 'bg-red-500';
    label = 'API offline';
  } else if (health) {
    const up = health.ollama === 'up';
    dot = up ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]';
    label = up
      ? `${health.model} · Ollama ${health.ollamaVersion}`
      : `${health.model} · Ollama down`;
  }

  return (
    <div className="flex items-center gap-2 rounded-full border border-edge bg-panel px-3 py-1 text-xs text-muted">
      <span className={`h-2 w-2 rounded-full ${dot}`} />
      <span>{label}</span>
    </div>
  );
}
