import { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Plus, FileText, Trash2 } from 'lucide-react';

export default function NotionSidebar({ activePageId, onSelectPage }) {
  const [pages, setPages] = useState([]);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      const res = await fetch('/api/workspaces/default/pages');
      const data = await res.json();
      setPages(data);
    } catch (e) {
      console.error("Failed to fetch pages", e);
    }
  };

  const createPage = async (parentId = null) => {
    try {
      const res = await fetch('/api/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parent_page_id: parentId, title: 'Untitled' })
      });
      const newPage = await res.json();
      if (parentId) {
        setExpanded(prev => ({ ...prev, [parentId]: true }));
      }
      setPages(prev => [...prev, newPage]);
      onSelectPage(newPage.id);
    } catch (e) {
      console.error(e);
    }
  };

  const deletePage = async (id, e) => {
    e.stopPropagation();
    try {
      await fetch(`/api/pages/${id}`, { method: 'DELETE' });
      setPages(prev => prev.filter(p => p.id !== id));
      if (activePageId === id) onSelectPage(null);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleExpand = (id, e) => {
    e.stopPropagation();
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Build tree
  const buildTree = (parentId) => {
    return pages
      .filter(p => p.parent_page_id === parentId)
      .map(page => (
        <div key={page.id} className="flex flex-col">
          <div 
            onClick={() => onSelectPage(page.id)}
            className={`group relative flex items-center gap-4 py-3 px-4 cursor-pointer overflow-hidden transition-all duration-300 ${activePageId === page.id ? 'bg-black/5 dark:bg-white/5' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
          >
            {/* Animated left border on hover */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 transition-all duration-300 origin-top ${activePageId === page.id ? 'scale-y-100 dark:bg-[#ccff00] bg-[#ff3333]' : 'scale-y-0 group-hover:scale-y-100 dark:bg-[#ccff00] bg-[#ff3333]'}`}></div>

            <button 
              onClick={(e) => toggleExpand(page.id, e)}
              className="p-1 hover:bg-black/10 dark:hover:bg-white/20 rounded-full transition-transform duration-300 hover:scale-125"
            >
              {expanded[page.id] ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
            </button>
            <span className="text-xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">{page.icon}</span>
            <span className={`flex-1 text-xs font-bold uppercase tracking-widest truncate transition-transform duration-300 group-hover:translate-x-2 ${activePageId === page.id ? 'dark:text-white text-black' : 'text-gray-500 dark:text-gray-400'}`}>{page.title || 'UNTITLED'}</span>
            
            <div className="opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 flex items-center transition-all duration-300">
              <button onClick={(e) => deletePage(page.id, e)} className="p-2 hover:bg-red-500 hover:text-white rounded-full text-red-500 transition-all duration-300 hover:scale-110">
                <Trash2 size={12} />
              </button>
              <button onClick={(e) => { e.stopPropagation(); createPage(page.id); }} className="p-2 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black rounded-full text-gray-500 dark:text-gray-400 transition-all duration-300 hover:scale-110 ml-1">
                <Plus size={14} />
              </button>
            </div>
          </div>
          {expanded[page.id] && (
            <div className="ml-8 border-l border-black/10 dark:border-white/10 pl-2 my-1 overflow-hidden animate-slideDown">
              {buildTree(page.id)}
            </div>
          )}
        </div>
      ));
  };

  return (
    <div className="w-80 bg-[#d9d9d6] dark:bg-[#111111] border-r border-black/10 dark:border-white/5 flex flex-col h-full transition-colors z-10 relative group/sidebar">
      <div className="p-8 pb-4 flex items-center justify-between">
        <div className="font-black text-sm flex items-center gap-4 dark:text-white text-gray-900 tracking-widest uppercase">
          <div className="w-8 h-8 bg-black dark:bg-[#ccff00] text-white dark:text-black rounded-full flex items-center justify-center text-xs font-black shadow-lg transition-transform duration-500 hover:rotate-90">M</div>
          MY WORKSPACE
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto pt-4">
        <div className="text-[10px] font-black text-gray-500 dark:text-gray-600 uppercase mb-4 px-8 tracking-[0.3em]">Directory</div>
        {buildTree(null)}
        
        <div className="px-4 mt-6">
          <button 
            onClick={() => createPage(null)}
            className="group relative overflow-hidden flex items-center justify-center gap-3 w-full px-4 py-4 rounded-full border border-black/20 dark:border-white/20 transition-all duration-300 hover:border-transparent dark:hover:border-[#ccff00] hover:border-[#ff3333]"
          >
            <span className="absolute inset-0 w-full h-full transform translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] dark:bg-[#ccff00] bg-[#ff3333]"></span>
            <Plus size={16} className="relative z-10 text-black dark:text-white group-hover:text-white dark:group-hover:text-black transition-colors" />
            <span className="relative z-10 text-xs font-bold uppercase tracking-widest text-black dark:text-white group-hover:text-white dark:group-hover:text-black transition-colors">New Page</span>
          </button>
        </div>
      </div>
    </div>
  );
}
