import { useState, useRef } from 'react';
import { Paperclip, Loader2 } from 'lucide-react';

export default function NoteInput({ onAdd }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.text) {
        setText((prev) => (prev ? prev + '\\n' + data.text : data.text));
      } else {
        alert(data.error || "Failed to extract text");
      }
    } catch (err) {
      console.error(err);
      alert("Error uploading file");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() || loading || uploading) return;
    setLoading(true);
    
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      const data = await res.json();
      if (!data.error) {
        setText('');
        onAdd(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[600px] bg-[#1a1a1a] p-2 rounded-xl shadow-2xl border border-gray-800">
      <form onSubmit={handleSubmit} className="flex flex-col">
        <textarea 
          className="bg-transparent border-none outline-none text-gray-200 resize-none p-3 w-full"
          rows={3}
          placeholder="Write a note... (Enter to save)"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />
        <div className="flex justify-between items-center px-2 pb-1">
          <div className="flex items-center gap-3">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept="image/*,application/pdf" 
              className="hidden" 
            />
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || loading}
              title="Upload Image or PDF"
              className="text-gray-400 hover:text-white disabled:opacity-50 transition-colors"
            >
              {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
            </button>
            <span className="text-xs text-gray-500">Supports markdown. {text.length}/2000</span>
          </div>
          <button 
            type="submit" 
            disabled={loading || uploading || !text.trim()}
            className="bg-accent text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-purple-600 disabled:opacity-50"
          >
            {loading ? 'Thinking...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}
