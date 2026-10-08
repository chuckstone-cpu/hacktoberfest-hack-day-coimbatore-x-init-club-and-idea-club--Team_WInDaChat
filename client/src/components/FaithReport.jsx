import { useState } from 'react';

export default function FaithReport({ noteIds, storyText }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sabotage, setSabotage] = useState(false);

  const SABOTAGED_STORY = "The library lets you renew a book twice. If you return it late, you pay a small fine each day after the loan period.";

  const handleVerify = async () => {
    setLoading(true);
    setReport(null);
    try {
      const textToVerify = sabotage ? SABOTAGED_STORY : storyText;
      const res = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteIds, text: textToVerify })
      });
      const data = await res.json();
      setReport(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6 border-t border-gray-800 pt-4">
      <div className="flex items-center justify-between mb-4">
        <button 
          onClick={handleVerify}
          disabled={loading || !storyText}
          className="bg-gray-800 text-sm px-3 py-1.5 rounded hover:bg-gray-700 disabled:opacity-50"
        >
          {loading ? 'Checking...' : 'Check Faithfulness'}
        </button>
        <label className="text-xs text-gray-500 flex items-center gap-2 cursor-pointer">
          <input 
            type="checkbox" 
            checked={sabotage} 
            onChange={e => setSabotage(e.target.checked)} 
          />
          Use sabotaged story (Demo)
        </label>
      </div>

      {report && (
        <div className="space-y-4">
          <p className="text-xs text-gray-500 italic">This check can miss errors and raise false alarms.</p>
          
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase text-gray-400">Facts Extracted</h3>
            {report.facts.length === 0 ? <p className="text-xs text-gray-500">No verifiable facts found.</p> : null}
            {report.facts.map((f, i) => (
              <div key={i} className="bg-[#111] p-3 rounded border border-gray-800">
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-xs px-2 py-0.5 rounded ${f.status === 'Appears preserved' ? 'bg-green-900/30 text-green-400' : f.status === 'Needs review' ? 'bg-amber-900/30 text-amber-400' : 'bg-red-900/30 text-red-400'}`}>
                    {f.status}
                  </span>
                </div>
                <div className="text-xs text-gray-400 mb-1 border-l-2 border-gray-700 pl-2">"{f.span}"</div>
                <div className="text-xs text-gray-200">Gemma says: {f.answer}</div>
              </div>
            ))}
          </div>

          {report.cues && report.cues.length > 0 && (
            <div className="space-y-1 mt-4">
              <h3 className="text-xs font-bold uppercase text-gray-400 mb-2">Dropped Cues</h3>
              {report.cues.map((c, i) => (
                <div key={i} className="text-xs text-red-400 bg-red-900/10 px-2 py-1 rounded">
                  Missing {c.category}: <strong>{c.expected}</strong>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
