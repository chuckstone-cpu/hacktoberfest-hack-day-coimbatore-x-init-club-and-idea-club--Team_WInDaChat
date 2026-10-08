import { useState, useRef } from 'react';

export default function Dashboard({ nodes, links }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    // Simulate upload delay for UI effect
    setTimeout(() => {
      setUploading(false);
      alert(`Successfully processed ${file.name}! Notes are being synthesized.`);
    }, 1500);
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 z-10 w-full h-full relative">
      <div className="max-w-6xl mx-auto space-y-8 pb-20">
        
        {/* Header */}
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-white/50 bg-clip-text text-transparent">Intelligence Dashboard</h2>
            <p className="text-muted mt-2">Overview of your synthesized knowledge base.</p>
          </div>
          <button 
            onClick={handleUploadClick}
            className="glass flex items-center gap-2 px-5 py-2.5 rounded-xl hover:bg-white/10 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] active:scale-95 text-sm font-semibold"
          >
            <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            Upload Notes Data
          </button>
          <input type="file" ref={fileInputRef} className="hidden" accept=".txt,.json,.md" onChange={handleFileChange} />
        </div>

        {/* Bento Grid Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass p-6 rounded-3xl flex flex-col justify-center items-center hover:-translate-y-1 transition-transform">
            <h3 className="text-muted text-sm uppercase tracking-widest font-semibold mb-2">Total Notes</h3>
            <span className="text-5xl font-black text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">{nodes.length}</span>
          </div>
          <div className="glass p-6 rounded-3xl flex flex-col justify-center items-center hover:-translate-y-1 transition-transform">
            <h3 className="text-muted text-sm uppercase tracking-widest font-semibold mb-2">Logical Links</h3>
            <span className="text-5xl font-black text-accent drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]">{links.length}</span>
          </div>
          <div className="glass p-6 rounded-3xl flex flex-col justify-center items-center hover:-translate-y-1 transition-transform bg-gradient-to-br from-pink-500/5 to-accent/10 border-accent/20">
            <h3 className="text-accent text-sm uppercase tracking-widest font-semibold mb-2">System Status</h3>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-green-400 shadow-[0_0_10px_#4ade80] animate-pulse"></div>
              <span className="text-2xl font-bold text-white">Online</span>
            </div>
          </div>
        </div>

        {/* Recent Notes List */}
        <div className="glass rounded-3xl p-8 mt-8">
          <h3 className="text-lg font-semibold mb-6 border-b border-white/10 pb-4">Recently Added Notes</h3>
          <div className="space-y-4">
            {nodes.slice(-5).reverse().map((note, i) => (
              <div key={i} className="p-5 rounded-2xl bg-black/20 border border-white/5 hover:border-accent/30 transition-colors">
                <p className="text-sm text-ink/90 leading-relaxed">{note.summary || note.text}</p>
                <div className="flex flex-wrap gap-2 mt-4">
                  {note.terms?.slice(0,5).map((term, j) => (
                    <span key={j} className="text-[10px] uppercase tracking-wide bg-accent/20 text-accent px-2.5 py-1 rounded-full border border-accent/30">{term}</span>
                  ))}
                </div>
              </div>
            ))}
            {nodes.length === 0 && (
              <div className="text-center py-12 text-muted">
                No notes synthesized yet. Try adding one from the Graph view or uploading a dataset!
              </div>
            )}
          </div>
        </div>

      </div>
      
      {/* Uploading Overlay */}
      {uploading && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex flex-col items-center justify-center rounded-3xl">
          <div className="w-12 h-12 border-4 border-accent/30 border-t-accent rounded-full animate-spin"></div>
          <p className="mt-4 font-medium text-lg text-white">Processing Data...</p>
        </div>
      )}
    </div>
  );
}
