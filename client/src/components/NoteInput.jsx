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
    <form onSubmit={submit} className="border-t border-line bg-surface px-5 py-3">
      <div className="mx-auto flex max-w-3xl items-center gap-3">
        <input
          value={text}
          onChange={(e) => { setText(e.target.value); setError(''); }}
          maxLength={MAX_LEN}
          placeholder={saving ? 'Gemma is tagging and linking your note…' : 'Write a note and press Enter…'}
          readOnly={saving}
          autoFocus
          className={`flex-1 rounded-2xl border border-line bg-bg px-4 py-2.5 text-sm text-ink outline-none placeholder:text-muted focus:border-accent ${saving ? 'opacity-60' : ''}`}
        />
        <span className="w-20 text-right text-xs tabular-nums text-muted">
          {saving ? <span className="animate-pulse text-accent">thinking…</span> : `${text.length}/${MAX_LEN}`}
        </span>
      </div>
      {error && <p className="mx-auto mt-2 max-w-3xl text-xs text-bad-ink">{error}</p>}
    </form>
  );
}
