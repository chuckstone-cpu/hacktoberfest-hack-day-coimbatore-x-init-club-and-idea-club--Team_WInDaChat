"""Graphviz rendering helpers for the knowledge map."""

import html
import json
import math
import re


def _quote(value: str) -> str:
    return '"' + value.replace("\\", "\\\\").replace('"', '\\"').replace("\n", " ") + '"'


def _node_label(note) -> str:
    text = re.sub(r"\s+", " ", note["summary"]).strip()
    return f"#{note['id']}\\n{text[:72]}" + ("…" if len(text) > 72 else "")


def knowledge_map_dot(notes, links) -> str:
    """Build a DOT graph containing every note and its saved typed links."""
    lines = [
        "digraph knowledge_map {",
        "  graph [rankdir=LR, bgcolor=transparent, pad=0.25, nodesep=0.55, ranksep=1.0];",
        "  node [shape=box, style=\"rounded,filled\", fillcolor=\"#e8f0fe\", color=\"#4f46e5\", fontname=\"Arial\", fontsize=11, margin=0.18];",
        "  edge [color=\"#64748b\", fontname=\"Arial\", fontsize=10, arrowsize=0.75];",
    ]
    for note in notes:
        lines.append(f"  note_{note['id']} [label={_quote(_node_label(note))}];")
    for link in links:
        label = f"{link['relation']} · {link['strength']}/5"
        lines.append(f"  note_{link['source_id']} -> note_{link['target_id']} [label={_quote(label)}];")
    lines.append("}")
    return "\n".join(lines)


def knowledge_map_html(notes, links) -> str:
    """Render a compact, self-contained SVG map for the Streamlit canvas."""
    width, height = 1040, 520
    count = len(notes)
    positions = {}
    if count == 1:
        positions[notes[0]["id"]] = (width / 2, height / 2)
    else:
        radius_x, radius_y = min(360, 85 + count * 24), min(170, 65 + count * 13)
        for index, note in enumerate(notes):
            angle = (2 * math.pi * index / count) - math.pi / 2
            positions[note["id"]] = (width / 2 + radius_x * math.cos(angle), height / 2 + radius_y * math.sin(angle))

    edge_parts = []
    for link in links:
        start = positions.get(link["source_id"])
        end = positions.get(link["target_id"])
        if not start or not end:
            continue
        mid_x, mid_y = (start[0] + end[0]) / 2, (start[1] + end[1]) / 2
        relation = html.escape(link["relation"].replace("_", " "))
        edge_parts.append(
            f"<path d='M {start[0]:.0f} {start[1]:.0f} L {end[0]:.0f} {end[1]:.0f}' class='edge' marker-end='url(#arrow)'/>"
            f"<g transform='translate({mid_x:.0f},{mid_y:.0f})'><rect x='-47' y='-13' width='94' height='26' rx='13' class='edge-label-bg'/><text class='edge-label' text-anchor='middle' y='4'>{relation} · {link['strength']}/5</text></g>"
        )

    node_parts = []
    for note in notes:
        x, y = positions[note["id"]]
        label = html.escape(re.sub(r"\s+", " ", note["summary"]).strip())
        label = label[:58] + ("…" if len(label) > 58 else "")
        node_parts.append(
            f"<g class='node' transform='translate({x:.0f},{y:.0f})'><rect x='-112' y='-39' width='224' height='78' rx='15'/><text class='node-kicker' x='-91' y='-13'>NOTE {note['id']}</text><text class='node-label' x='-91' y='11'>{label}</text><title>{label}</title></g>"
        )

    return f"""
    <html><head><style>
      * {{ box-sizing:border-box }} body {{ margin:0; background:#fafaf9; font-family:Inter,Arial,sans-serif; }}
      .canvas {{ width:100%; height:100%; border:1px solid #e6e6e2; border-radius:16px; overflow:hidden; background:radial-gradient(circle at 50% 45%,#f0f5f1 0,#fafaf9 48%,#fff 100%); }}
      .edge {{ stroke:#a7b7aa; stroke-width:1.65; fill:none; }} .edge-label-bg {{ fill:#fff; stroke:#dbe3dc; }}
      .edge-label {{ font-size:10px; font-weight:600; fill:#4f6353; }}
      .node rect {{ fill:#fff; stroke:#d6e0d7; stroke-width:1.25; filter:drop-shadow(0 5px 8px rgba(20,30,22,.06)); }} .node:hover rect {{ stroke:#23955b; stroke-width:1.8; }}
      .node-kicker {{ font-size:9px; font-weight:700; letter-spacing:1.1px; fill:#23955b; }} .node-label {{ font-size:12px; font-weight:600; fill:#202420; }}
    </style></head><body><div class='canvas'><svg viewBox='0 0 {width} {height}' width='100%' height='100%' role='img' aria-label='Knowledge map'>
      <defs><marker id='arrow' viewBox='0 0 10 10' refX='8' refY='5' markerWidth='5' markerHeight='5' orient='auto-start-reverse'><path d='M 0 0 L 10 5 L 0 10 z' fill='#a7b7aa'/></marker></defs>
      {''.join(edge_parts)}{''.join(node_parts)}
    </svg></div></body></html>
    """


def interactive_graph_html(notes, links) -> str:
    """Return a self-contained, pan-and-zoom force graph for the app visualizer."""
    data = {
        "nodes": [{"id": note["id"], "summary": note["summary"], "content": note["content"]} for note in notes],
        "links": [{"source": link["source_id"], "target": link["target_id"], "relation": link["relation"], "strength": link["strength"], "reason": link["reason"]} for link in links],
    }
    payload = json.dumps(data, ensure_ascii=False).replace("</", "<\\/")
    return """<div id="nectore-graph-root">
  <style>
    #nectore-graph-root{height:640px;background:#090d18;border:1px solid #1d2940;border-radius:18px;overflow:hidden;color:#e8edf9;font-family:Inter,ui-sans-serif,system-ui,sans-serif;display:grid;grid-template-columns:1fr 292px}
    #nectore-graph-root *{box-sizing:border-box} #graph-stage{position:relative;min-width:0;background:radial-gradient(circle at 50% 43%,#18264a 0%,#0c1324 32%,#090d18 73%);overflow:hidden}
    #graph-stage:before{content:"";position:absolute;inset:0;background-image:radial-gradient(#37517a66 1px,transparent 1px);background-size:25px 25px;mask-image:radial-gradient(ellipse at center,black 5%,transparent 75%)}
    #graph-svg{height:100%;width:100%;position:relative;z-index:1;touch-action:none}.g-edge{stroke:#7796bd;stroke-opacity:.3;stroke-width:1.25}.g-edge.selected{stroke:#b5a7ff;stroke-opacity:.88;stroke-width:1.8}.g-node circle{fill:#87aaff;stroke:#c8d7ff;stroke-width:1.5;filter:drop-shadow(0 0 11px #7899ff66)}.g-node.hub circle{fill:#a58cff;stroke:#dbcfff}.g-node.dim{opacity:.13}.g-node.selected circle{stroke:#fff;stroke-width:2.7;filter:drop-shadow(0 0 17px #c0b2ff)}.g-node text{fill:#dbe7ff;font-size:11px;font-weight:600;paint-order:stroke;stroke:#0b1120;stroke-width:4px;stroke-linejoin:round;pointer-events:none}.g-node{cursor:pointer}
    #graph-top{position:absolute;left:18px;right:18px;top:16px;z-index:3;display:flex;gap:8px;align-items:center}.g-search{background:#10182ccc;border:1px solid #314664;border-radius:8px;color:#eef3ff;padding:9px 11px;font-size:12px;outline:none;width:220px;backdrop-filter:blur(12px)}.g-search:focus{border-color:#9d8cff}.g-stat{margin-left:auto;background:#10182ccc;border:1px solid #314664;border-radius:8px;padding:8px 10px;color:#9fb0cc;font:500 11px ui-monospace,monospace;backdrop-filter:blur(12px)}
    #graph-controls{position:absolute;right:16px;bottom:16px;display:flex;gap:6px;z-index:3}.g-button{width:32px;height:32px;border-radius:8px;border:1px solid #314664;background:#10182ce8;color:#e8edf9;font-size:17px;cursor:pointer}.g-button:hover{background:#253653}
    #graph-panel{border-left:1px solid #1d2940;background:linear-gradient(180deg,#0e1424,#0a0e19);padding:22px 19px;display:flex;flex-direction:column}.eyebrow{font:600 10px ui-monospace,monospace;letter-spacing:.12em;color:#8fa3c6;text-transform:uppercase}.panel-title{font-size:19px;letter-spacing:-.025em;line-height:1.22;font-weight:650;margin:9px 0 10px}.panel-copy{font-size:12px;line-height:1.55;color:#a7b4cc}.meta{border-top:1px solid #202c43;margin-top:22px;padding-top:17px}.meta-row{display:flex;justify-content:space-between;padding:7px 0;font-size:11px;color:#9aacbf}.meta-row b{color:#e3eafe;font-weight:600}.relation{margin-top:10px;padding:10px;border-radius:8px;background:#121d33;border:1px solid #21334f;font-size:11px;line-height:1.45;color:#b9c8e1}.relation strong{display:block;color:#b4a6ff;font-size:10px;text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px}.hint{margin-top:auto;color:#72839e;font-size:11px;line-height:1.55}.legend{display:flex;gap:10px;margin-top:14px;font-size:10px;color:#8fa3c6}.legend i{height:8px;width:8px;border-radius:50%;display:inline-block;background:#87aaff;margin-right:4px}.legend i.hub{background:#a58cff}
    @media(max-width:760px){#nectore-graph-root{grid-template-columns:1fr;height:700px}#graph-panel{border-left:0;border-top:1px solid #1d2940;min-height:210px}.hint{display:none}.g-search{width:155px}}
  </style>
  <div id="graph-stage"><div id="graph-top"><input id="graph-search" class="g-search" aria-label="Filter visualizer notes" placeholder="Filter nodes…"/><div id="graph-stat" class="g-stat"></div></div><svg id="graph-svg" viewBox="0 0 900 640" role="img" aria-label="Interactive knowledge graph"></svg><div id="graph-controls"><button class="g-button" id="zoom-out" aria-label="Zoom out">−</button><button class="g-button" id="zoom-reset" aria-label="Reset visualizer">⌾</button><button class="g-button" id="zoom-in" aria-label="Zoom in">+</button></div></div>
  <aside id="graph-panel" aria-live="polite"><div class="eyebrow">Node inspector</div><div id="panel-content"></div><div class="hint">Drag to pan · scroll to zoom · select a node to inspect its connected ideas.</div></aside>
</div><script>
const DATA = """ + payload + """;
const svg=document.getElementById('graph-svg'), panel=document.getElementById('panel-content'), search=document.getElementById('graph-search'), stat=document.getElementById('graph-stat');
const NS='http://www.w3.org/2000/svg', W=900,H=640; const degree={}; DATA.links.forEach(l=>{degree[l.source]=(degree[l.source]||0)+1;degree[l.target]=(degree[l.target]||0)+1});
const nodes=DATA.nodes.map((n,i)=>({ ...n, x:W/2+Math.cos(i*2.399)*150, y:H/2+Math.sin(i*2.399)*150, vx:0, vy:0, degree:degree[n.id]||0 })); const byId=new Map(nodes.map(n=>[n.id,n]));
const edges=DATA.links.map(l=>({...l,source:byId.get(l.source),target:byId.get(l.target)})).filter(l=>l.source&&l.target); let selected=null,query='',scale=1,tx=0,ty=0,drag=null;
const viewport=document.createElementNS(NS,'g'), edgeLayer=document.createElementNS(NS,'g'),nodeLayer=document.createElementNS(NS,'g'); viewport.append(edgeLayer,nodeLayer);svg.append(viewport);
const edgeEls=edges.map(e=>{const el=document.createElementNS(NS,'line');el.setAttribute('class','g-edge');edgeLayer.append(el);return [e,el]}); const nodeEls=nodes.map(n=>{const group=document.createElementNS(NS,'g');group.setAttribute('class','g-node'+(n.degree>1?' hub':''));const circle=document.createElementNS(NS,'circle');circle.setAttribute('r',String(10+Math.min(n.degree,5)*2));const label=document.createElementNS(NS,'text');label.setAttribute('x','15');label.setAttribute('y','4');label.textContent=n.summary.length>30?n.summary.slice(0,30)+'…':n.summary;group.append(circle,label);group.addEventListener('click',ev=>{ev.stopPropagation();select(n)});nodeLayer.append(group);return [n,group]});
function safe(v){return String(v).replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]))} function connected(n){return edges.filter(e=>e.source===n||e.target===n)}
function select(n){selected=n;const relevant=connected(n);panel.innerHTML='<div class="panel-title">'+safe(n.summary)+'</div><div class="panel-copy">'+safe(n.content.slice(0,260))+(n.content.length>260?'…':'')+'</div><div class="meta"><div class="meta-row"><span>Connected notes</span><b>'+relevant.length+'</b></div><div class="meta-row"><span>Node strength</span><b>'+Math.max(1,n.degree)+'/5</b></div></div>'+relevant.slice(0,3).map(e=>'<div class="relation"><strong>'+safe(e.relation.replace('_',' '))+' · '+e.strength+'/5</strong>'+safe(e.reason)+'</div>').join('');render()}
function resetPanel(){panel.innerHTML='<div class="panel-title">Explore the graph</div><div class="panel-copy">Select a node to read the note and see why it is connected. The larger violet nodes are hubs with multiple relationships.</div><div class="legend"><span><i></i>note</span><span><i class="hub"></i>hub</span></div>'} resetPanel();
function render(){viewport.setAttribute('transform','translate('+tx+' '+ty+') scale('+scale+')');edgeEls.forEach(([e,el])=>{el.setAttribute('x1',e.source.x);el.setAttribute('y1',e.source.y);el.setAttribute('x2',e.target.x);el.setAttribute('y2',e.target.y);el.classList.toggle('selected',selected&&(e.source===selected||e.target===selected));});nodeEls.forEach(([n,el])=>{el.setAttribute('transform','translate('+n.x+' '+n.y+')');const match=!query||n.summary.toLowerCase().includes(query)||n.content.toLowerCase().includes(query);el.classList.toggle('dim',!match);el.classList.toggle('selected',n===selected)})}
let ticks=0;function simulate(){for(const n of nodes){let ax=(W/2-n.x)*.0016,ay=(H/2-n.y)*.0016;for(const other of nodes){if(n===other)continue;const dx=n.x-other.x,dy=n.y-other.y,d2=Math.max(120,dx*dx+dy*dy);ax+=dx/d2*115;ay+=dy/d2*115}n.vx=(n.vx+ax)*.84;n.vy=(n.vy+ay)*.84;n.x=Math.max(38,Math.min(W-38,n.x+n.vx));n.y=Math.max(54,Math.min(H-42,n.y+n.vy))}for(const e of edges){const dx=e.target.x-e.source.x,dy=e.target.y-e.source.y,d=Math.max(1,Math.hypot(dx,dy)),force=(d-145)*.003;e.source.vx+=dx/d*force;e.source.vy+=dy/d*force;e.target.vx-=dx/d*force;e.target.vy-=dy/d*force}render();if(++ticks<260)requestAnimationFrame(simulate)}simulate();stat.textContent=nodes.length+' NODES · '+edges.length+' LINKS';
search.addEventListener('input',()=>{query=search.value.trim().toLowerCase();render()});svg.addEventListener('wheel',e=>{e.preventDefault();scale=Math.max(.45,Math.min(2.8,scale*(e.deltaY<0?1.12:.89)));render()},{passive:false});svg.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,tx,ty};svg.setPointerCapture(e.pointerId)});svg.addEventListener('pointermove',e=>{if(!drag)return;tx=drag.tx+e.clientX-drag.x;ty=drag.ty+e.clientY-drag.y;render()});svg.addEventListener('pointerup',()=>{drag=null});svg.addEventListener('click',e=>{if(e.target===svg){selected=null;resetPanel();render()}});document.getElementById('zoom-in').onclick=()=>{scale=Math.min(2.8,scale*1.18);render()};document.getElementById('zoom-out').onclick=()=>{scale=Math.max(.45,scale*.84);render()};document.getElementById('zoom-reset').onclick=()=>{scale=1;tx=0;ty=0;render()};
</script>"""
