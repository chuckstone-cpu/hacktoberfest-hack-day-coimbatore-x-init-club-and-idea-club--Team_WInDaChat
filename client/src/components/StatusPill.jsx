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

  let dot = 'bg-muted';
  let tone = 'border-line bg-surface text-muted';
  let label = 'Checking…';
  const down = 'border-bad/40 bg-bad/10 text-bad-ink';
  if (apiDown) {
    dot = 'bg-bad';
    tone = down;
    label = 'API offline';
  } else if (health) {
    const up = health.ollama === 'up';
    dot = up ? 'bg-accent' : 'bg-bad';
    tone = up ? 'border-accent/30 bg-accent/10 text-accent-ink' : down;
    label = up
      ? `${health.model} · Ollama ${health.ollamaVersion}`
      : `${health.model} · Ollama down`;
  }

  return (
    <div className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${tone}`} role="status">
      <span className={`h-2 w-2 rounded-full ${dot}`} />
      <span>{label}</span>
    </div>
  );
}
