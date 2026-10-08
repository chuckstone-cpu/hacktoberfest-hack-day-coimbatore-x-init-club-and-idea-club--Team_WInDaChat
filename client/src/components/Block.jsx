import { useState, useRef, useEffect } from 'react';
import SlashMenu from './SlashMenu';
import { GripVertical } from 'lucide-react';

export default function Block({ block, onChange, onAddBlock, onDeleteBlock, onReorder }) {
  const [content, setContent] = useState(block.content?.text || '');
  const [showMenu, setShowMenu] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const [menuFilter, setMenuFilter] = useState('');
  const [isDraggable, setIsDraggable] = useState(false);
  const contentRef = useRef(null);

  // Sync content if it changes remotely, but avoid resetting local typing state
  useEffect(() => {
    if (block.content?.text !== content && document.activeElement !== contentRef.current) {
      setContent(block.content?.text || '');
    }
  }, [block.content?.text]);

  const handleInput = (e) => {
    // Read HTML instead of textContent for rich text
    const val = e.currentTarget.innerHTML;
    const textVal = e.currentTarget.textContent;
    setContent(val);
    onChange(block.id, { ...block, content: { html: val, text: textVal } });

    // Detect slash menu using textVal
    const lastCharIndex = textVal.lastIndexOf('/');
    if (lastCharIndex !== -1 && (lastCharIndex === 0 || textVal[lastCharIndex - 1] === ' ')) {
      const selection = window.getSelection();
      if(selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setMenuPos({ x: rect.left, y: rect.bottom + 5 });
        setMenuFilter(textVal.substring(lastCharIndex + 1));
        setShowMenu(true);
      }
    } else {
      setShowMenu(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !showMenu) {
      e.preventDefault();
      onAddBlock(block.id);
    } else if (e.key === 'Backspace' && (content === '' || content === '<br>')) {
      e.preventDefault();
      onDeleteBlock(block.id);
    }
  };

  const handleTypeChange = (newType) => {
    const textVal = contentRef.current.textContent;
    const newText = textVal.replace(/\/\w*$/, '');
    setContent(newText);
    onChange(block.id, { ...block, type: newType, content: { html: newText, text: newText } });
    setShowMenu(false);
    setTimeout(() => { if (contentRef.current) contentRef.current.focus(); }, 0);
  };

  let blockClasses = "outline-none w-full min-h-[1.5em] empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 dark:empty:before:text-gray-600 transition-colors ";
  if (block.type === 'h1') blockClasses += "text-4xl font-bold mt-6 mb-2 text-gray-900 dark:text-gray-100";
  else if (block.type === 'h2') blockClasses += "text-2xl font-bold mt-4 mb-1 text-gray-800 dark:text-gray-200";
  else if (block.type === 'h3') blockClasses += "text-xl font-bold mt-3 mb-1 text-gray-800 dark:text-gray-200";
  else blockClasses += "text-[1.05rem] py-1 leading-relaxed text-gray-700 dark:text-gray-300";

  const renderBullet = () => {
    if (block.type === 'bullet') return <span className="mr-3 text-gray-400 text-xl leading-none mt-1">•</span>;
    if (block.type === 'todo') return (
      <input type="checkbox" className="mr-3 mt-2 cursor-pointer w-4 h-4 rounded border-gray-300 dark:border-gray-600" />
    );
    return null;
  };

  return (
    <div 
      className="group flex items-start -ml-8 py-0.5 relative"
      draggable={isDraggable}
      onDragStart={(e) => { e.dataTransfer.setData('blockId', block.id); }}
      onDragOver={(e) => { e.preventDefault(); }}
      onDrop={(e) => {
        const draggedId = e.dataTransfer.getData('blockId');
        if (draggedId && draggedId !== block.id && onReorder) {
          onReorder(draggedId, block.id);
        }
      }}
    >
      <div className="w-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity mt-1">
        <button 
          onMouseEnter={() => setIsDraggable(true)}
          onMouseLeave={() => setIsDraggable(false)}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 cursor-grab active:cursor-grabbing"
        >
          <GripVertical size={16} />
        </button>
      </div>
      
      <div className="flex-1 flex items-start relative">
        {renderBullet()}
        <div 
          ref={contentRef}
          contentEditable
          suppressContentEditableWarning
          className={blockClasses}
          data-placeholder={block.type === 'paragraph' ? "Type '/' for commands" : `Heading ${block.type.replace('h','')}`}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          dangerouslySetInnerHTML={{ __html: block.content?.html || block.content?.text || '' }}
        />
      </div>

      {showMenu && (
        <SlashMenu 
          position={menuPos} 
          filter={menuFilter} 
          onClose={() => setShowMenu(false)} 
          onSelect={handleTypeChange} 
        />
      )}
    </div>
  );
}
