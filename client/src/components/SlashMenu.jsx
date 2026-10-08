import { useEffect, useRef } from 'react';

const MENU_ITEMS = [
  { type: 'paragraph', label: 'Text', icon: '📝' },
  { type: 'h1', label: 'Heading 1', icon: 'H1' },
  { type: 'h2', label: 'Heading 2', icon: 'H2' },
  { type: 'h3', label: 'Heading 3', icon: 'H3' },
  { type: 'bullet', label: 'Bulleted List', icon: '•' },
  { type: 'todo', label: 'To-do List', icon: '☑️' }
];

export default function SlashMenu({ position, onClose, onSelect, filter = '' }) {
  const menuRef = useRef(null);

  const filteredItems = MENU_ITEMS.filter(item => 
    item.label.toLowerCase().includes(filter.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  if (filteredItems.length === 0) return null;

  return (
    <div 
      ref={menuRef}
      className="absolute z-50 w-64 bg-[#2f2f2f] border border-gray-700 rounded shadow-xl py-1"
      style={{ top: position.y, left: position.x }}
    >
      <div className="px-3 py-1 text-xs font-semibold text-gray-400">Basic blocks</div>
      {filteredItems.map(item => (
        <button
          key={item.type}
          onClick={() => onSelect(item.type)}
          className="w-full text-left px-3 py-1.5 hover:bg-gray-700 flex items-center gap-3 text-sm text-gray-200"
        >
          <span className="bg-white/10 w-6 h-6 rounded flex items-center justify-center text-xs">{item.icon}</span>
          {item.label}
        </button>
      ))}
    </div>
  );
}
