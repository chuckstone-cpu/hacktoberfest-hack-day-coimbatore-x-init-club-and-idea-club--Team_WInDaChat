import { useState } from 'react';
import NotionSidebar from './NotionSidebar';
import NotionPageEditor from './NotionPageEditor';

export default function NotionWorkspace() {
  const [activePageId, setActivePageId] = useState(null);

  return (
    <div className="flex h-[calc(100vh-80px)] w-full relative">
      {/* Background Decorative Grid/Shapes */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 flex items-center justify-center opacity-20">
         <div className="w-[120vw] h-[1px] bg-black dark:bg-white absolute top-1/3 -rotate-12"></div>
         <div className="w-[120vw] h-[1px] bg-black dark:bg-white absolute top-2/3 -rotate-12"></div>
      </div>

      <NotionSidebar 
        activePageId={activePageId} 
        onSelectPage={setActivePageId} 
      />
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        {activePageId ? (
          <NotionPageEditor pageId={activePageId} />
        ) : (
          <div className="flex-1 flex items-center justify-center flex-col gap-16 bg-[#e3e3e0] dark:bg-[#0a0a0a] m-0 border-l border-black/10 dark:border-white/10 transition-colors relative">
            
            {/* The Glowing Shape Element */}
            <div className="relative group cursor-crosshair">
              {/* Outer massive glow */}
              <div className="absolute inset-0 bg-[#ff3333] dark:bg-[#ccff00] opacity-50 blur-[100px] rounded-full scale-150 group-hover:scale-150 transition-transform duration-1000 animate-pulse"></div>
              
              {/* Geometric Shape (Diamond) with Astra 6 rotating hover */}
              <div className="w-32 h-32 bg-black dark:bg-white flex items-center justify-center shadow-2xl transition-all duration-700 animate-glowPulse group-hover:bg-[#ff3333] dark:group-hover:bg-[#ccff00]">
                {/* Inner counter-rotating element */}
                <div className="w-16 h-16 border-4 border-[#ff3333] dark:border-[#ccff00] group-hover:border-black dark:group-hover:border-black transition-colors duration-500 animate-spinSlow absolute z-10"></div>
                <span className="text-4xl relative z-20 text-white dark:text-black group-hover:scale-0 transition-transform duration-500 -rotate-45 font-black">?</span>
              </div>
            </div>

            <div className="relative overflow-hidden group hover-glitch cursor-pointer">
              <p className="font-black text-4xl tracking-tighter text-transparent" style={{ WebkitTextStroke: '2px currentColor', color: 'transparent' }}>
                <span className="text-black dark:text-white">SELECT A PAGE</span>
              </p>
              <div className="absolute inset-0 bg-[#ff3333] dark:bg-[#ccff00] transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] flex items-center justify-center">
                <p className="font-black text-4xl tracking-tighter text-white dark:text-black">
                  SELECT A PAGE
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
