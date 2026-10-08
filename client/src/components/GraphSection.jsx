import { useState } from 'react';
import GraphView from './GraphView.jsx';
import Legend from './Legend.jsx';
import useReveal from '../hooks/useReveal.js';

// The graph sits in a tall card. Until the user clicks into it, a transparent
// shield passes wheel and touch scrolling through to the page, so scrolling
// never gets trapped by the graph's zoom; leaving the card re-arms the shield.
export default function GraphSection(props) {
  const [active, setActive] = useState(false);
  const revealRef = useReveal();

  return (
    <section id="graph" className="border-t border-line py-20">
      <div ref={revealRef} className="reveal mx-auto flex max-w-6xl flex-col gap-6 px-4 sm:px-6">
        <div className="flex flex-col gap-2">
          <h2 className="font-display text-4xl font-semibold tracking-tight text-ink">The graph</h2>
          <p className="text-muted">
            Each dot is a note; each line is a link Gemma found, coloured by type. Hover a line to read why. Drag one note
            onto another to ask Gemma if they're connected.
          </p>
        </div>

        <div
          className="relative h-[80vh] min-h-[28rem] overflow-hidden rounded-3xl border border-line bg-surface shadow-card"
          onMouseLeave={() => setActive(false)}
        >
          <GraphView {...props} />
          <Legend />
          {!active && (
            <button
              type="button"
              onClick={() => setActive(true)}
              className="absolute inset-0 z-10 flex cursor-pointer items-start justify-end bg-transparent p-4"
              aria-label="Click to interact with the graph"
            >
              <span className="rounded-full border border-line bg-surface/95 px-3 py-1.5 text-xs font-medium text-muted shadow-card">
                Click to interact
              </span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
