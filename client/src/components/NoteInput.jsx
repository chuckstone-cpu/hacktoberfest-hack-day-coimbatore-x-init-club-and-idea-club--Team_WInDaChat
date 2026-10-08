import { useState } from 'react';

const MAX_LEN = 2000;

export default function NoteInput({ onSave }) {
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (saving) return;
    if (!text.trim()) {
      setError('Write something before saving.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave(text);
      setText('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="glass px-5 py-4 z-20">
      <div className="mx-auto flex max-w-4xl items-center gap-4">
        <input
          value={text}
          onChange={(e) => { setText(e.target.value); setError(''); }}
          maxLength={MAX_LEN}
          placeholder={saving ? 'Gemma is tagging and linking your note…' : 'Write a brilliant note and press Enter…'}
          readOnly={saving}
          autoFocus
          className={`flex-1 rounded-xl glass-input px-5 py-3 text-base outline-none placeholder:text-muted/70 text-ink ${saving ? 'opacity-50 scale-[0.99]' : 'hover:scale-[1.01]'}`}
        />
        <button 
          type="submit" 
          disabled={saving || !text.trim()} 
          className="rounded-xl bg-accent px-6 py-3 font-semibold text-white shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all hover:bg-accent/80 hover:shadow-[0_0_25px_rgba(168,85,247,0.6)] active:scale-95 disabled:opacity-50 disabled:active:scale-100"
        >
          {saving ? 'Mapping...' : 'Synthesize'}
        </button>
      </div>
      {error && <p className="mx-auto mt-2 max-w-4xl text-xs font-medium text-red-400 animate-pulse">{error}</p>}
    </form>
  );
}
