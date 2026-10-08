import { useEffect, useMemo, useRef, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { forceX, forceY } from 'd3-force';
import { linkColor, linkLabel } from '../linkTypes.js';

const NODE_COLOR = '#a78bfa';
const UNTAGGED_COLOR = '#71717a';
const PULSE_MS = 2000;
const LABEL_ZOOM = 0.9;
const DIM_ALPHA = 0.15;
export const REJECT_FADE_MS = 1500;

const idOf = (end) => (typeof end === 'object' ? end.id : end);

function shortLabel(text, max = 40) {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

function linkTooltip(l) {
  return `<div style="max-width:260px;font:12px Inter,system-ui,sans-serif;line-height:1.4">
    <b style="color:${linkColor(l.type)}">${escapeHtml(linkLabel(l.type))}</b>
    <span style="opacity:.6"> · strength ${l.strength}/5</span><br/>${escapeHtml(l.reason)}</div>`;
}

// focusIds: notes to keep bright (the open thread); everything else dims.
// Hovering a node temporarily focuses it and its direct neighbours instead.
// Dropping one node onto another calls onConnect(a, b); `pending` is that
// request's state ({ a, b, status: 'thinking' | 'rejected', at }).
export default function GraphView({ data, selectedId, focusIds, newNodeId, pending, onSelect, onConnect }) {
  const wrapRef = useRef(null);
  const fgRef = useRef(null);
  const fittedRef = useRef(false);
  const dragRef = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [hoverId, setHoverId] = useState(null);
  const [dropTargetId, setDropTargetId] = useState(null);

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

  const neighbours = useMemo(() => {
    const map = new Map();
    for (const l of data.links) {
      const s = idOf(l.source);
      const t = idOf(l.target);
      if (!map.has(s)) map.set(s, new Set());
      if (!map.has(t)) map.set(t, new Set());
      map.get(s).add(t);
      map.get(t).add(s);
    }
    return map;
  }, [data.links]);

  const activeFocus = useMemo(() => {
    if (hoverId != null) return new Set([hoverId, ...(neighbours.get(hoverId) ?? [])]);
    return focusIds;
  }, [hoverId, neighbours, focusIds]);

  const isLit = (id) => !activeFocus || activeFocus.has(id);
  const radius = (node) => 4 + Math.min(neighbours.get(node.id)?.size ?? 0, 6) * 1.2;

  const drawNode = (node, ctx, scale) => {
    const r = radius(node);
    const lit = isLit(node.id);
    const active = node.id === hoverId || node.id === selectedId;
    ctx.save();
    ctx.globalAlpha = lit ? 1 : DIM_ALPHA;

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

    // Drop target while dragging: a ring saying "release to connect".
    if (node.id === dropTargetId) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, r + 6 / scale, 0, 2 * Math.PI);
      ctx.strokeStyle = '#ddd6fe';
      ctx.lineWidth = 2 / scale;
      ctx.stroke();
    }

    const color = node.summary ? NODE_COLOR : UNTAGGED_COLOR;
    ctx.shadowColor = color;
    ctx.shadowBlur = active ? 24 : lit ? 12 : 0;
    ctx.beginPath();
    ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
    ctx.fillStyle = active ? '#ddd6fe' : color;
    ctx.fill();
    ctx.shadowBlur = 0;

    if (active || (lit && (scale >= LABEL_ZOOM || activeFocus))) {
      const fontSize = 12 / scale;
      ctx.font = `${fontSize}px Inter, system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = active ? '#f4f4f5' : 'rgba(220, 221, 222, 0.8)';
      ctx.fillText(shortLabel(node.label), node.x, node.y + r + 3 / scale);
    }
    ctx.restore();
  };

  const paintHitArea = (node, color, ctx) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius(node) + 3, 0, 2 * Math.PI);
    ctx.fill();
  };

  const linkLit = (l) => isLit(idOf(l.source)) && isLit(idOf(l.target));

  // The nearest other node within ~20 screen pixels of the dragged one.
  const dropTargetFor = (dragged) => {
    const zoom = fgRef.current?.zoom() ?? 1;
    let best = null;
    let bestDist = Infinity;
    for (const n of data.nodes) {
      if (n.id === dragged.id) continue;
      const d = Math.hypot(n.x - dragged.x, n.y - dragged.y);
      if (d < radius(n) + 20 / zoom && d < bestDist) {
        best = n;
        bestDist = d;
      }
    }
    return best;
  };

  const handleDrag = (node) => {
    // Remember where the drag started so the node can spring back.
    if (dragRef.current?.id !== node.id) dragRef.current = { id: node.id, x: node.x, y: node.y };
    setDropTargetId(dropTargetFor(node)?.id ?? null);
  };

  const handleDragEnd = (node) => {
    const start = dragRef.current;
    const target = dropTargetFor(node);
    dragRef.current = null;
    setDropTargetId(null);
    // Spring back: unpin the node and return it to where the drag began.
    node.fx = undefined;
    node.fy = undefined;
    if (start?.id === node.id) {
      node.x = start.x;
      node.y = start.y;
    }
    fgRef.current?.d3ReheatSimulation();
    if (target) onConnect(node.id, target.id);
  };

  // Dashed line between the pair Gemma is judging; it fades out on a rejection.
  const drawPending = (ctx, scale) => {
    if (!pending) return;
    const a = data.nodes.find((n) => n.id === pending.a);
    const b = data.nodes.find((n) => n.id === pending.b);
    if (!a || !b) return;
    const alpha = pending.status === 'rejected' ? Math.max(0, 1 - (performance.now() - pending.at) / REJECT_FADE_MS) : 0.9;
    if (alpha <= 0) return;
    ctx.save();
    ctx.setLineDash([4 / scale, 4 / scale]);
    ctx.lineDashOffset = -(performance.now() / 40) / scale; // marching ants while thinking
    ctx.strokeStyle = pending.status === 'rejected' ? `rgba(248, 113, 113, ${alpha})` : `rgba(221, 214, 254, ${alpha})`;
    ctx.lineWidth = 1.5 / scale;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.restore();
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
          nodeLabel={(n) => escapeHtml(n.text)}
          linkColor={(l) => (linkLit(l) ? linkColor(l.type) : 'rgba(82, 82, 91, 0.15)')}
          linkWidth={(l) => (l.strength ?? 3) / 2}
          linkLabel={linkTooltip}
          linkHoverPrecision={6}
          autoPauseRedraw={false}
          cooldownTicks={120}
          onNodeHover={(n) => setHoverId(n?.id ?? null)}
          onNodeClick={(n) => onSelect(n.id)}
          onBackgroundClick={() => onSelect(null)}
          onNodeDrag={handleDrag}
          onNodeDragEnd={handleDragEnd}
          onRenderFramePost={drawPending}
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
          <p className="text-sm text-muted">No notes yet. Write your first one below, or run <code>npm run seed</code>.</p>
        </div>
      )}
    </div>
  );
}
