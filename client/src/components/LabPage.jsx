import { useEffect, useState } from 'react';

export default function LabPage({ onClose }) {
  const [results, setResults] = useState([]);

  useEffect(() => {
    fetch('/api/lab/results')
      .then(r => r.json())
      .then(d => setResults(d))
      .catch(e => console.error(e));
  }, []);

  return (
    <div className="absolute inset-0 bg-darker z-50 p-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-accent">KV Cache Lab</h1>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕ Close</button>
        </div>

        <p className="text-gray-300 mb-6">
          Measuring Gemma 4 E4B fact retention across KV-cache quantizations (f16, q8_0, q4_0) at 32K context.
        </p>

        {results.length === 0 ? (
          <div className="text-gray-500 italic">No lab results found. Run \`npm run lab\` on the server.</div>
        ) : (
          <div className="space-y-8">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400">
                  <th className="py-2">Cache Type</th>
                  <th className="py-2">Context</th>
                  <th className="py-2">Memory (MB)</th>
                  <th className="py-2">Tok/s</th>
                  <th className="py-2">Facts Preserved</th>
                  <th className="py-2">Matches f16?</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={i} className="border-b border-gray-800/50">
                    <td className="py-2 text-accent font-medium">{r.cacheType}</td>
                    <td className="py-2">{r.ctx}</td>
                    <td className="py-2">{r.memoryMB}</td>
                    <td className="py-2">{r.toksPerSec?.toFixed(1)}</td>
                    <td className="py-2">{r.factsPreserved}/{r.factsTotal}</td>
                    <td className="py-2">{r.matchesF16 ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div className="bg-[#111] p-4 rounded-lg border border-gray-800">
              <h3 className="text-sm font-bold mb-2">Hypothesis</h3>
              <p className="text-sm text-gray-400">
                Keys have outlier channels and are more sensitive to quantization than values. 
                We expect q8_0 to keep most facts and q4_0 to drop some at long context. 
                (Small sample, raw counts, no significance claimed).
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
