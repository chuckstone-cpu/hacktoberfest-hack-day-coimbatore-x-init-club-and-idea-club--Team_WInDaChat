// Deterministic cue diff (no AI): finds numbers, dates, negations, conditions,
// bounds and obligations in the source notes and reports the ones that are
// missing or changed in a generated text. Condition words follow the team's
// earlier Python prototype (src/verification/extractor.py on main).

const UNITS = [
  ['%', /^(%|percent|per\s?cent)$/i],
  ['business day', /^business\s+days?$/i],
  ['day', /^days?$/i],
  ['hour', /^(hours?|hrs?)$/i],
  ['minute', /^(minutes?|mins?)$/i],
  ['week', /^weeks?$/i],
  ['month', /^months?$/i],
  ['year', /^(years?|yrs?)$/i],
  ['km', /^km$/i],
  ['kg', /^kg$/i],
  ['mg', /^mg$/i],
  ['bps', /^(bps|basis\s+points?)$/i],
];
const UNIT_SRC = '%|percent|per\\s?cent|business\\s+days?|days?|hours?|hrs?|minutes?|mins?|weeks?|months?|years?|yrs?|km|kg|mg|bps|basis\\s+points?';
const CURRENCIES = [['INR', /^(₹|rs\.?|inr)$/i], ['USD', /^\$$/]];
const CURRENCY_SRC = '₹|rs\\.?|inr|\\$';

// Currency before the number, or a unit after it ("₹2", "14-day", "30 %").
const NUMBER_RE = new RegExp(
  `(?:(${CURRENCY_SRC})\\s?)?(?<![\\w.])(\\d+(?:[.,]\\d+)*)(?:\\s?-?\\s?(${UNIT_SRC})(?![a-z]))?`,
  'gi',
);
const MONTHS = 'jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?';
const DATE_RE = new RegExp(`\\b(?:\\d{1,2}\\s+(?:${MONTHS})|(?:${MONTHS})\\s+\\d{1,2})\\b`, 'gi');

// Word cues, longest phrases first so "only if" wins over "if".
// "by" from the guide's bound list is left out: it matches almost every sentence.
const WORD_CUES = {
  negation: ['cannot', 'never', 'none', 'without', 'not', 'nor', 'no'],
  condition: ['provided that', 'as long as', 'subject to', 'only if', 'unless', 'except', 'if'],
  bound: ['no more than', 'no less than', 'at least', 'at most', 'up to', 'minimum', 'maximum', 'within', 'before', 'after', 'until'],
  obligation: ['must not', 'may not', 'prohibited', 'required', 'must', 'shall', 'may'],
};
const WORD_KIND = new Map();
for (const [kind, words] of Object.entries(WORD_CUES)) for (const w of words) WORD_KIND.set(w, kind);
const WORD_RE = new RegExp(
  `\\b(${[...WORD_KIND.keys()].sort((a, b) => b.length - a.length).map((w) => w.replace(/ /g, '\\s+')).join('|')}|\\w+n't)\\b`,
  'gi',
);

function lookup(table, raw) {
  return table.find(([, re]) => re.test(raw.trim()))?.[0] ?? null;
}

function splitSentences(text) {
  return text.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
}

function numberCues(sentence) {
  const out = [];
  const dates = [...sentence.matchAll(DATE_RE)];
  const inDate = (i) => dates.some((d) => i >= d.index && i < d.index + d[0].length);
  for (const m of sentence.matchAll(NUMBER_RE)) {
    if (inDate(m.index)) continue; // "5 March" is a date, not the number 5
    const [raw, cur, num, unit] = m;
    const value = Number(num.replace(/,/g, ''));
    const isYear = !cur && !unit && /^(19|20)\d{2}$/.test(num);
    out.push({
      kind: isYear ? 'date' : 'number',
      text: raw.trim(),
      value,
      unit: (cur && lookup(CURRENCIES, cur)) || (unit && lookup(UNITS, unit)) || null,
    });
  }
  for (const m of dates) {
    out.push({ kind: 'date', text: m[0], key: m[0].toLowerCase().replace(/\s+/g, ' ') });
  }
  return out;
}

function wordCues(sentence) {
  return [...sentence.matchAll(WORD_RE)].map((m) => {
    const raw = m[1].toLowerCase().replace(/\s+/g, ' ');
    // "doesn't", "cannot" and "not" all count as the same negation.
    const norm = raw.endsWith("n't") || raw === 'cannot' ? 'not' : raw;
    return { kind: WORD_KIND.get(norm) ?? 'negation', text: m[1], norm };
  });
}

// All cues in a text, each tagged with the sentence it came from.
function extractCues(text) {
  return splitSentences(text).flatMap((sentence) =>
    [...numberCues(sentence), ...wordCues(sentence)].map((c) => ({ ...c, sentence })),
  );
}

const numKey = (c) => `${c.value}|${c.unit ?? ''}`;

// Compares cues in `source` against `output`. Returns one issue per distinct
// cue that is missing (or, for numbers, appears with a different value).
export function diffCues(source, output) {
  const out = extractCues(output);
  const outNums = out.filter((c) => c.value !== undefined);
  const outKeys = new Set(outNums.map(numKey));
  const outValues = new Set(outNums.map((c) => c.value));
  const outDates = new Set(out.filter((c) => c.key).map((c) => c.key));
  const outWords = new Set(out.filter((c) => c.norm).map((c) => c.norm));

  const issues = [];
  const seen = new Set();
  for (const c of extractCues(source)) {
    const id = c.norm ?? c.key ?? numKey(c);
    if (seen.has(id)) continue;
    seen.add(id);

    if (c.norm) {
      if (!outWords.has(c.norm)) issues.push({ kind: c.kind, cue: c.norm, status: 'missing', sentence: c.sentence });
    } else if (c.key) {
      if (!outDates.has(c.key)) issues.push({ kind: c.kind, cue: c.text, status: 'missing', sentence: c.sentence });
    } else if (!outKeys.has(numKey(c)) && !(c.unit === null && outValues.has(c.value))) {
      // Same unit but a different value reads as "changed"; otherwise it's gone.
      const other = c.unit && outNums.find((o) => o.unit === c.unit);
      issues.push(
        other
          ? { kind: c.kind, cue: c.text, status: 'changed', found: other.text, sentence: c.sentence }
          : { kind: c.kind, cue: c.text, status: 'missing', sentence: c.sentence },
      );
    }
  }
  return issues;
}

// Numbers (with units) mentioned in a text, for comparing quiz answers.
export function numbersIn(text) {
  return extractCues(text).filter((c) => c.kind === 'number').map((c) => ({ value: c.value, unit: c.unit }));
}
