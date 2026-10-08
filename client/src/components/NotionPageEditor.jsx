import { useState, useEffect } from 'react';
import Block from './Block';

export default function NotionPageEditor({ pageId }) {
  const [page, setPage] = useState(null);
  const [blocks, setBlocks] = useState([]);

  useEffect(() => {
    fetchPage();
    fetchBlocks();
  }, [pageId]);

  const fetchPage = async () => {
    try {
      const res = await fetch(`/api/pages/${pageId}`);
      const data = await res.json();
      setPage(data);
    } catch (e) { console.error(e); }
  };

  const fetchBlocks = async () => {
    try {
      const res = await fetch(`/api/pages/${pageId}/blocks`);
      const data = await res.json();
      if (data.length === 0) {
        // Create an initial empty block
        addBlock(null, 0);
      } else {
        setBlocks(data);
      }
    } catch (e) { console.error(e); }
  };

  const updateTitle = async (newTitle) => {
    setPage(prev => ({ ...prev, title: newTitle }));
    await fetch(`/api/pages/${pageId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle })
    });
  };

  const addBlock = async (afterBlockId, position) => {
    // If no blocks, position is 1000. Else, space it out.
    let newPos = 1000;
    if (afterBlockId) {
      const idx = blocks.findIndex(b => b.id === afterBlockId);
      if (idx !== -1) {
        const currPos = blocks[idx].position;
        const nextPos = blocks[idx + 1] ? blocks[idx + 1].position : currPos + 1000;
        newPos = (currPos + nextPos) / 2;
      }
    } else if (position !== undefined) {
      newPos = position;
    }

    try {
      const res = await fetch('/api/blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page_id: pageId, position: newPos, type: 'paragraph', content: { text: '' } })
      });
      const newBlock = await res.json();
      setBlocks(prev => {
        const arr = [...prev, newBlock].sort((a, b) => a.position - b.position);
        return arr;
      });
    } catch (e) { console.error(e); }
  };

  const updateBlock = async (id, updatedData) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, ...updatedData } : b));
    try {
      await fetch(`/api/blocks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
    } catch (e) { console.error(e); }
  };

  const deleteBlock = async (id) => {
    if (blocks.length <= 1) return; // Prevent deleting the very last block completely
    setBlocks(prev => prev.filter(b => b.id !== id));
    try {
      await fetch(`/api/blocks/${id}`, { method: 'DELETE' });
    } catch (e) { console.error(e); }
  };

  const handleReorder = async (draggedId, targetId) => {
    const draggedIdx = blocks.findIndex(b => b.id === draggedId);
    const targetIdx = blocks.findIndex(b => b.id === targetId);
    if(draggedIdx === -1 || targetIdx === -1 || draggedIdx === targetIdx) return;

    let newPos;
    if(draggedIdx < targetIdx) {
      // moving down, insert after target
      const nextPos = blocks[targetIdx + 1] ? blocks[targetIdx + 1].position : blocks[targetIdx].position + 1000;
      newPos = (blocks[targetIdx].position + nextPos) / 2;
    } else {
      // moving up, insert before target
      const prevPos = blocks[targetIdx - 1] ? blocks[targetIdx - 1].position : blocks[targetIdx].position - 1000;
      newPos = (prevPos + blocks[targetIdx].position) / 2;
    }

    setBlocks(prev => {
      const arr = prev.map(b => b.id === draggedId ? { ...b, position: newPos } : b);
      return arr.sort((a,b) => a.position - b.position);
    });

    try {
      await fetch(`/api/blocks/${draggedId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ position: newPos })
      });
    } catch(e) { console.error(e); }
  };

  if (!page) return <div className="p-8 text-gray-500 text-sm">Loading page...</div>;

  return (
    <div className="flex-1 overflow-y-auto transition-colors relative z-10 bg-[#e3e3e0] dark:bg-[#0a0a0a]">
      <div className="max-w-4xl mx-auto px-16 py-24">
        <div className="text-6xl mb-8 relative group inline-block cursor-pointer transition-transform duration-500 hover:-translate-y-2 hover:scale-110">
          <span className="drop-shadow-2xl">{page.icon}</span>
          <div className="absolute inset-0 bg-[#ff3333] dark:bg-[#ccff00] opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] font-bold uppercase tracking-widest text-white dark:text-black rounded-full transition-opacity duration-300 scale-75 group-hover:scale-100">
            Edit
          </div>
        </div>
        
        <input
          type="text"
          value={page.title || ''}
          onChange={(e) => updateTitle(e.target.value)}
          placeholder="UNTITLED"
          className="w-full text-4xl md:text-5xl font-black bg-transparent outline-none dark:text-[#f2f2f2] text-black placeholder-gray-400 dark:placeholder-[#222222] mb-12 transition-colors tracking-tight uppercase focus:translate-x-4 duration-500"
        />

        <div className="flex flex-col gap-4 pl-4 border-l-4 border-transparent focus-within:border-[#ff3333] dark:focus-within:border-[#ccff00] transition-colors duration-500">
          {blocks.map(block => (
            <Block 
              key={block.id} 
              block={block} 
              onChange={updateBlock} 
              onAddBlock={addBlock} 
              onDeleteBlock={deleteBlock}
              onReorder={handleReorder}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
