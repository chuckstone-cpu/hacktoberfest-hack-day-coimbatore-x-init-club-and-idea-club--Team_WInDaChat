import { useState, useEffect } from 'react';
import GraphView from './components/GraphView';
import NoteInput from './components/NoteInput';
import SidePanel from './components/SidePanel';
import LabPage from './components/LabPage';
import NotionWorkspace from './components/NotionWorkspace';

function App() {
  const [view, setView] = useState('workspace');
  const [theme, setTheme] = useState('light'); // 'light' or 'dark'
  const [showLab, setShowLab] = useState(false);
  const [health, setHealth] = useState({ up: false });
  const [notes, setNotes] = useState([]);
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [selectedNote, setSelectedNote] = useState(null);

  useEffect(() => {
    fetch('/api/health')
      .then(r => r.json())
      .then(data => setHealth(data))
      .catch(() => setHealth({ up: false }));
      
    fetchGraph();
  }, []);

  const fetchGraph = () => {
    fetch('/api/graph')
      .then(r => r.json())
      .then(data => setGraphData(data));
  };

  const handleNoteAdded = (newNoteData) => {
    // Add to graph
    setGraphData(prev => ({
      nodes: [...prev.nodes, { id: newNoteData.note.id, label: newNoteData.note.summary, summary: newNoteData.note.summary }],
      links: [...prev.links, ...(newNoteData.links || []).map(l => ({ source: newNoteData.note.id, target: l.note_id, ...l }))]
    }));
  };

  return (
    <div className={`flex flex-col h-screen overflow-hidden font-sans transition-colors duration-500 ${theme === 'dark' ? 'dark bg-[#0a0a0a] text-[#f2f2f2]' : 'bg-[#e3e3e0] text-[#111111]'}`}>
      <header className={`px-8 py-5 flex justify-between items-center border-b-2 z-20 relative transition-colors duration-300 ${theme === 'dark' ? 'border-white/10 bg-[#0a0a0a]' : 'border-black/10 bg-[#e3e3e0]'}`}>
        <div className="flex items-center gap-12">
          {/* Logo with glitch hover effect */}
          <h1 className="text-3xl font-black tracking-tighter uppercase relative group cursor-pointer hover-glitch">
            <span className={`relative z-10 transition-colors duration-300 ${theme === 'dark' ? 'group-hover:text-[#ccff00]' : 'group-hover:text-[#ff3333]'}`}>CONNECTORE</span>
            {/* Geometric accent next to logo */}
            <div className={`absolute -right-6 top-1/2 -translate-y-1/2 w-4 h-4 border-2 rotate-45 ${theme === 'dark' ? 'border-[#ccff00]' : 'border-[#ff3333]'} group-hover:bg-current transition-colors`}></div>
          </h1>
          
          <div className="flex gap-4">
            {['workspace', 'graph'].map((mode) => (
              <button 
                key={mode}
                onClick={() => setView(mode)} 
                className={`relative overflow-hidden px-8 py-3 text-xs font-black uppercase tracking-[0.2em] rounded-none transition-all duration-300 group ${view === mode ? (theme === 'dark' ? 'bg-[#ccff00] text-black border-[#ccff00]' : 'bg-[#ff3333] text-white border-[#ff3333]') : (theme === 'dark' ? 'bg-transparent text-white border-white/20 hover:border-[#ccff00]' : 'bg-transparent text-black border-black/20 hover:border-[#ff3333]')} border-2`}
              >
                <span className={`relative z-10 transition-opacity duration-300 ${view === mode ? 'mix-blend-normal' : (theme === 'dark' ? 'group-hover:opacity-0' : 'group-hover:opacity-0')}`}>{mode}</span>
                
                {/* Astra 6 infinite marquee hover effect */}
                <div className="absolute inset-0 flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none overflow-hidden">
                   <div className="flex whitespace-nowrap animate-marquee">
                      <span className={`mx-2 ${theme === 'dark' ? 'text-[#ccff00]' : 'text-[#ff3333]'}`}>• {mode} • {mode} • {mode} • {mode}</span>
                      <span className={`mx-2 ${theme === 'dark' ? 'text-[#ccff00]' : 'text-[#ff3333]'}`}>• {mode} • {mode} • {mode} • {mode}</span>
                   </div>
                </div>
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex items-center gap-8">
          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={`relative overflow-hidden w-12 h-12 flex items-center justify-center rounded-none transition-all duration-300 group border-2 ${theme === 'dark' ? 'border-white/20 text-white hover:border-[#ccff00]' : 'border-black/20 text-black hover:border-[#ff3333]'}`}
          >
            <div className={`absolute inset-0 bg-current transform scale-y-0 origin-bottom group-hover:scale-y-100 transition-transform duration-300 ${theme === 'dark' ? 'text-[#ccff00]' : 'text-[#ff3333]'}`}></div>
            <span className={`relative z-10 font-black text-lg transition-colors group-hover:text-black dark:group-hover:text-black`}>{theme === 'dark' ? '☼' : '☾'}</span>
          </button>

          <button onClick={() => setShowLab(true)} className="group relative text-xs font-bold uppercase tracking-widest overflow-hidden py-1">
            <span className={`transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] inline-block group-hover:-translate-y-full ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>KV LAB</span>
            <span className={`absolute top-0 left-0 transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] translate-y-full inline-block group-hover:translate-y-0 ${theme === 'dark' ? 'text-[#ccff00]' : 'text-[#ff3333]'}`}>KV LAB</span>
          </button>
          
          <div className="flex items-center gap-2 group cursor-default">
            <div className={`w-2 h-2 rounded-full ${health.up ? (theme === 'dark' ? 'bg-[#ccff00] shadow-[0_0_10px_rgba(204,255,0,0.8)]' : 'bg-[#ff3333] shadow-[0_0_10px_rgba(255,51,51,0.8)]') : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]'} transition-all duration-500 group-hover:scale-150`}></div>
            <span className={`text-xs font-bold uppercase tracking-wider text-gray-500 transition-colors duration-300 ${theme === 'dark' ? 'group-hover:text-white' : 'group-hover:text-black'}`}>
              {health.model || 'GEMMA4'}
            </span>
          </div>
        </div>
      </header>
      
      <main className="flex-1 relative flex overflow-hidden">
        {view === 'workspace' ? (
          <NotionWorkspace />
        ) : (
          <>
            <div className="flex-1 relative">
              <GraphView data={graphData} onNodeClick={(node) => setSelectedNote(node.id)} />
              <NoteInput onAdd={handleNoteAdded} />
            </div>
            {selectedNote && (
              <SidePanel noteId={selectedNote} onClose={() => setSelectedNote(null)} />
            )}
          </>
        )}
        {showLab && <LabPage onClose={() => setShowLab(false)} />}
      </main>
    </div>
  );
}

export default App;
