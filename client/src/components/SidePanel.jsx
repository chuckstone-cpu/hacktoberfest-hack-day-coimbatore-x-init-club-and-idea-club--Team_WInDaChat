import { useEffect, useState } from 'react';
import FaithReport from './FaithReport';

export default function SidePanel({ noteId, onClose }) {
  const [thread, setThread] = useState([]);
  const [story, setStory] = useState('');
  const [loadingStory, setLoadingStory] = useState(false);

  useEffect(() => {
    if (noteId) {
      fetch(`/api/thread/${noteId}`)
        .then(r => r.json())
        .then(data => setThread(data));
      setStory('');
    }
  }, [noteId]);

  const handleTellStory = async () => {
    setLoadingStory(true);
    setStory('');
    try {
      const res = await fetch('/api/story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteIds: thread.map(n => n.id) })
      });
      
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\\n\\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (dataStr === '[DONE]') break;
            try {
              const data = JSON.parse(dataStr);
              if (data.text) setStory(s => s + data.text);
            } catch (e) {}
          }
        }
      }
    } finally {
      setLoadingStory(false);
    }
  };

  if (!noteId) return null;

  return (
    <div className="w-[400px] h-full bg-[#111] border-l border-gray-800 flex flex-col shadow-2xl z-10 absolute right-0">
      <div className="p-4 border-b border-gray-800 flex justify-between items-center">
        <h2 className="font-bold">Thread</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-white">✕</button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="space-y-4">
          {thread.map((n, i) => (
            <div key={n.id} className="bg-[#1a1a1a] p-3 rounded-lg border border-gray-800">
              <div className="text-xs text-gray-500 mb-2">{new Date(n.created_at).toLocaleString()}</div>
              <p className="text-sm text-gray-300">{n.text}</p>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-800 pt-4">
          <button 
            onClick={handleTellStory}
            disabled={loadingStory || thread.length === 0}
            className="w-full bg-accent/20 text-accent py-2 rounded-lg hover:bg-accent/30 font-medium mb-4"
          >
            {loadingStory ? 'Narrating...' : 'Tell the story'}
          </button>
          
          {story && (
            <div className="mt-4">
              <div className="bg-[#1a1a1a] p-4 rounded-lg border border-accent/30 text-sm leading-relaxed text-gray-200 whitespace-pre-wrap">
                {story}
              </div>
              <FaithReport noteIds={thread.map(n => n.id)} storyText={story} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
