import { useEffect, useRef, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { forceX, forceY } from 'd3-force';

export const LINK_COLORS = {
  same_idea: '#a78bfa',
  causes: '#fb923c',
  consequence_of: '#fbbf24',
  continuation: '#60a5fa',
  contradicts: '#f87171',
};

const NODE_COLOR = '#a78bfa';
const PULSE_MS = 2000;
const LABEL_ZOOM = 1.4;

function shortLabel(text, max = 40) {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

export default function GraphView({ data, selectedId, newNodeId, onSelect }) {
  const wrapRef = useRef(null);
  const fgRef = useRef(null);
  const fittedRef = useRef(false);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [hoverId, setHoverId] = useState(null);

  useEffect(() => {
    const el = wrapRef.current;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Spread nodes out so labels don't collide, with a gentle pull to the
  // centre so unlinked notes don't drift off-screen.
  const ready = size.width > 0;
  useEffect(() => {
    const fg = fgRef.current;
    if (!fg) return;
    fg.d3Force('charge').strength(-180);
    fg.d3Force('x', forceX(0).strength(0.06));
    fg.d3Force('y', forceY(0).strength(0.06));
    fg.d3Force('link').distance(90);
  }, [ready]);

  // Re-fit the view once the layout settles after nodes are added.
  useEffect(() => {
    fittedRef.current = false;
  }, [data.nodes.length]);

  // Count links per node so busier notes draw bigger.
  const degree = new Map();
  for (const l of data.links) {
    const s = l.source.id ?? l.source;
    const t = l.target.id ?? l.target;
    degree.set(s, (degree.get(s) ?? 0) + 1);
    degree.set(t, (degree.get(t) ?? 0) + 1);
  }

  const drawNode = (node, ctx, scale) => {
    const r = 4 + Math.min(degree.get(node.id) ?? 0, 6) * 1.2;
    const active = node.id === hoverId || node.id === selectedId;

    // New-node pulse: an expanding, fading ring for PULSE_MS.
    if (node.id === newNodeId && node.addedAt) {
      const t = (performance.now() - node.addedAt) / PULSE_MS;
      if (t < 1) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, r + 14 * t, 0, 2 * Math.PI);
        ctx.strokeStyle = `rgba(167, 139, 250, ${1 - t})`;
        ctx.lineWidth = 2 / scale;
        ctx.stroke();
      }
    }

    ctx.save();
    ctx.shadowColor = NODE_COLOR;
    ctx.shadowBlur = active ? 24 : 12;
    ctx.beginPath();
    ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
    ctx.fillStyle = active ? '#ddd6fe' : NODE_COLOR;
    ctx.fill();
    ctx.restore();

    if (scale >= LABEL_ZOOM || active) {
      const fontSize = 12 / scale;
      ctx.font = `${fontSize}px Inter, system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = active ? '#f4f4f5' : 'rgba(220, 221, 222, 0.75)';
      ctx.fillText(shortLabel(node.label), node.x, node.y + r + 3 / scale);
    }
  };

  const paintHitArea = (node, color, ctx) => {
    const r = 4 + Math.min(degree.get(node.id) ?? 0, 6) * 1.2;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(node.x, node.y, r + 3, 0, 2 * Math.PI);
    ctx.fill();
  };

  return (
    <div ref={wrapRef} className="absolute inset-0">
      {ready && (
        <ForceGraph2D
          ref={fgRef}
          width={size.width}
          height={size.height}
          graphData={data}
          backgroundColor="rgba(0,0,0,0)"
          nodeCanvasObject={drawNode}
          nodePointerAreaPaint={paintHitArea}
          nodeLabel={(n) => n.text}
          linkColor={(l) => LINK_COLORS[l.type] ?? '#52525b'}
          linkWidth={(l) => (l.strength ?? 3) / 2}
          linkLabel={(l) => `${l.type}: ${l.reason}`}
          autoPauseRedraw={false}
          cooldownTicks={120}
          onNodeHover={(n) => setHoverId(n?.id ?? null)}
          onNodeClick={(n) => onSelect(n)}
          onBackgroundClick={() => onSelect(null)}
          onEngineStop={() => {
            if (!fittedRef.current && data.nodes.length) {
              fgRef.current?.zoomToFit(400, 80);
              fittedRef.current = true;
            }
          }}
        />
      )}
      {data.nodes.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <p className="text-sm text-muted">No notes yet. Write your first one below.</p>
        </div>
      )}
    </div>
  );
}
