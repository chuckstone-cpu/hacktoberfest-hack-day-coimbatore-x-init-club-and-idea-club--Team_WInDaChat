import { useEffect, useRef, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

const RELATION_COLORS = {
  same_idea: '#a855f7', // purple
  causes: '#f97316', // orange
  consequence_of: '#f59e0b', // amber
  continuation: '#3b82f6', // blue
  contradicts: '#ef4444', // red
};

export default function GraphView({ data, onNodeClick }) {
  const fgRef = useRef();

  useEffect(() => {
    if (fgRef.current && data.nodes.length > 0) {
      fgRef.current.d3Force('charge').strength(-400);
      fgRef.current.zoomToFit(400);
    }
  }, [data]);

  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden bg-[#f4f4f4] dark:bg-[#0a0a0a] transition-colors duration-500">
      <ForceGraph2D
        ref={fgRef}
        graphData={data}
        nodeRelSize={8}
        linkColor={link => RELATION_COLORS[link.type] || '#4b5563'}
        linkWidth={link => link.strength ? link.strength / 1.2 : 1}
        linkDirectionalArrowLength={4}
        linkDirectionalArrowRelPos={1}
        linkLabel={link => `<div style="background: #0a0a0a; padding: 12px; border-radius: 8px; font-family: sans-serif; max-width: 300px; font-size: 14px; border: 1px solid #333; color: white; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
          <strong style="color: ${RELATION_COLORS[link.type] || '#ccc'}; letter-spacing: 0.1em; text-transform: uppercase;">${link.type}</strong> <span style="opacity: 0.5;">•</span> <span>Strength: ${link.strength}/5</span><br/>
          <div style="margin-top: 8px; color: #ddd; line-height: 1.4;">${link.reason || 'No reasoning provided.'}</div>
        </div>`}
        nodeCanvasObject={(node, ctx, globalScale) => {
          const label = node.summary || node.id;
          const fontSize = 14/globalScale;
          ctx.font = `900 ${fontSize}px Inter, sans-serif`;
          const textWidth = ctx.measureText(label).width;
          const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 1.5); // some padding

          ctx.fillStyle = 'rgba(10, 10, 10, 0.9)';
          ctx.beginPath();
          // Draw a pill shape
          const r = bckgDimensions[1] / 2;
          const x = node.x - bckgDimensions[0] / 2;
          const y = node.y - bckgDimensions[1] / 2;
          ctx.roundRect ? ctx.roundRect(x, y, bckgDimensions[0], bckgDimensions[1], r) : ctx.rect(x, y, bckgDimensions[0], bckgDimensions[1]);
          ctx.fill();

          // Border
          ctx.lineWidth = 1.5 / globalScale;
          ctx.strokeStyle = '#ccff00';
          ctx.stroke();

          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#ffffff';
          ctx.fillText(label, node.x, node.y);

          node.__bckgDimensions = bckgDimensions; // to re-use in nodePointerAreaPaint
        }}
        nodePointerAreaPaint={(node, color, ctx) => {
          ctx.fillStyle = color;
          const bckgDimensions = node.__bckgDimensions;
          bckgDimensions && ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, bckgDimensions[0], bckgDimensions[1]);
        }}
        onNodeClick={onNodeClick}
      />
    </div>
  );
}
