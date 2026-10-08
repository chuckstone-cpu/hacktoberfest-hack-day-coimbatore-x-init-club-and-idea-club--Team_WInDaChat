import React, { useState, useEffect, useRef } from 'react';

export default function BubbleMenu({
  logo,
  items,
  menuAriaLabel = "Toggle navigation",
  menuBg = "#ffffff",
  menuContentColor = "#111111",
  useFixedPosition = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={menuRef} className={`relative z-50 ${useFixedPosition ? 'fixed bottom-6 right-6' : ''}`}>
      <button
        aria-label={menuAriaLabel}
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-lg z-50 relative backdrop-blur-md border border-white/10"
        style={{ backgroundColor: menuBg, color: menuContentColor }}
      >
        {logo}
      </button>

      <div
        className={`absolute top-14 left-0 transition-all duration-300 ease-out origin-top-left flex flex-col gap-3 ${
          isOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-50 pointer-events-none'
        }`}
      >
        {items.map((item, idx) => (
          <button
            key={idx}
            onClick={() => {
              if (item.onClick) item.onClick();
              setIsOpen(false);
            }}
            className="px-5 py-2.5 rounded-full font-bold text-sm transition-all duration-200 shadow-xl capitalize backdrop-blur-md border border-white/10 whitespace-nowrap"
            style={{
              backgroundColor: menuBg,
              color: menuContentColor,
              transform: isOpen ? `rotate(${item.rotation}deg) translateY(0px)` : `translateY(-20px)`,
              transitionDelay: isOpen ? `${idx * 0.05}s` : '0s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = item.hoverStyles.bgColor;
              e.currentTarget.style.color = item.hoverStyles.textColor;
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = menuBg;
              e.currentTarget.style.color = menuContentColor;
              e.currentTarget.style.transform = `rotate(${item.rotation}deg) translateY(0px)`;
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
