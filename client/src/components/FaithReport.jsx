import { useEffect, useState } from 'react';
import { verifyText } from '../api.js';

const STATUS = {
  appears_preserved: { label: 'Appears preserved', chip: 'border-good/40 bg-good/10 text-good-ink' },
  needs_review: { label: 'Needs review', chip: 'border-warn/50 bg-warn/10 text-warn-ink' },
  possible_mismatch: { label: 'Possible mismatch', chip: 'border-bad/40 bg-bad/10 text-bad-ink' },
};
const ORDER = ['possible_mismatch', 'needs_review', 'appears_preserved'];

function FactRow({ f }) {
  const s = STATUS[f.status];
  return (
    <li className="flex flex-col gap-1.5 rounded-xl border border-line bg-bg p-3">
      <span className={`self-start rounded-full border px-2 py-0.5 text-[11px] ${s.chip}`}>{s.label}</span>
      <p className="text-xs text-ink">{f.fact}</p>
      <p className="border-l-2 border-line pl-2 text-xs italic text-muted">Source: “{f.span}”</p>
      {f.evidence ? (
        <p className="border-l-2 border-accent/40 pl-2 text-xs italic text-muted">Story: “{f.evidence}”</p>
      ) : (
        <p className="pl-2 text-xs text-muted">Story: no supporting sentence found.</p>
      )}
      <p className="text-[11px] text-muted">{f.why}</p>
    </li>
  );
}

export default function FaithReport({ noteIds, text }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // A new story invalidates the old report.
  useEffect(() => {
    setReport(null);
    setError('');
  }, [text, noteIds.join(',')]);

  const check = async () => {
    setLoading(true);
    setError('');
    try {
      setReport(await verifyText(noteIds, text));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const facts = report ? [...report.facts].sort((a, b) => ORDER.indexOf(a.status) - ORDER.indexOf(b.status)) : [];
  const counts = Object.fromEntries(ORDER.map((k) => [k, facts.filter((f) => f.status === k).length]));

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={check}
        disabled={loading}
        className="self-start rounded-full border border-accent/60 px-4 py-1.5 text-xs font-medium text-accent-ink hover:bg-accent/15 disabled:opacity-60"
      >
        {loading ? 'Checking facts…' : report ? 'Check again' : 'Check faithfulness'}
      </button>
      {error && <p className="text-xs text-bad-ink">{error}</p>}

      {report && (
        <>
          <p className="text-[11px] text-muted">
            {facts.length} facts from your notes ·{' '}
            {ORDER.filter((k) => counts[k]).map((k) => `${counts[k]} ${STATUS[k].label.toLowerCase()}`).join(' · ') || 'none extracted'}
          </p>
          {report.quizError && <p className="text-xs text-warn-ink">{report.quizError}</p>}
          <ul className="flex flex-col gap-2">
            {facts.map((f, i) => <FactRow key={i} f={f} />)}
          </ul>

          <h4 className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-muted">Cue check</h4>
          {report.cues.length === 0 ? (
            <p className="text-xs text-muted">Every number, condition, negation and limit in the notes also appears in the story.</p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {report.cues.map((c, i) => (
                <li key={i} className="text-xs">
                  <span className={c.status === 'changed' ? 'text-bad-ink' : 'text-warn-ink'}>
                    {c.status === 'changed' ? `“${c.cue}” changed to “${c.found}”` : `“${c.cue}” missing`}
                  </span>
                  <span className="text-muted"> ({c.kind}) · {c.sentence}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="text-[11px] text-muted">This check can miss errors and raise false alarms.</p>
        </>
      )}
    </div>
  );
}
