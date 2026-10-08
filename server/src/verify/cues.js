export function extractCues(text) {
  if (!text) return { numbers: [], bounds: [], negations: [], conditions: [], obligations: [] };
  const lower = text.toLowerCase();
  
  // Extract numbers (naive but sufficient for demo)
  const numberMatches = Array.from(lower.matchAll(/\d+(?:\.\d+)?(?:\s*(?:%|days|hours|weeks|months|years|business days|₹|rs|inr|\$|km|kg|mg|bps|basis points))?/g));
  
  // Extract other cues
  const negations = ['not', 'no', 'never', 'none', 'cannot', "n't", 'without'];
  const conditions = ['unless', 'except', 'only if', 'if', 'provided that', 'as long as', 'subject to'];
  const bounds = ['at least', 'at most', 'up to', 'no more than', 'minimum', 'maximum', 'within', 'before', 'after', 'until', 'by'];
  const obligations = ['must', 'shall', 'required', 'may', 'may not', 'prohibited'];

  const extractMatches = (words) => {
    return words.filter(w => lower.includes(w));
  };

  return {
    numbers: numberMatches.map(m => m[0]),
    negations: extractMatches(negations),
    conditions: extractMatches(conditions),
    bounds: extractMatches(bounds),
    obligations: extractMatches(obligations)
  };
}

export function diffCues(sourceText, targetText) {
  const srcCues = extractCues(sourceText);
  const tgtCues = extractCues(targetText);
  
  const missing = [];
  const check = (category, srcList, tgtList) => {
    for (const item of srcList) {
      if (!tgtList.includes(item)) {
        missing.push({ category, expected: item });
      }
    }
  };
  
  check('number', srcCues.numbers, tgtCues.numbers);
  check('negation', srcCues.negations, tgtCues.negations);
  check('condition', srcCues.conditions, tgtCues.conditions);
  check('bound', srcCues.bounds, tgtCues.bounds);
  check('obligation', srcCues.obligations, tgtCues.obligations);
  
  return missing;
}
