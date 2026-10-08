// QAGS-style fact quiz: Gemma extracts must-keep facts from the source notes,
// then answers a question about each one using only the generated text.
import { callJson } from '../llm.js';
import { answerMessages, factMessages } from '../prompts.js';
import { AnswerList, FactList } from '../schemas.js';
import { diffCues, numbersIn } from './cues.js';

const squash = (s) => s.toLowerCase().replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim();
const contains = (haystack, needle) => squash(haystack).includes(squash(needle));
const NOT_STATED = /\bnot (stated|mentioned|specified|given)\b/i;

// Facts whose quote isn't really in the notes are dropped: we never show the
// user a "source" the model made up.
export async function extractFacts(sources) {
  const { facts } = await callJson(FactList, factMessages(sources), { label: 'facts' });
  const kept = facts.filter((f) => contains(sources, f.source_span));
  if (kept.length < facts.length) {
    console.warn(`[verify] dropped ${facts.length - kept.length} fact(s) with a quote not found in the notes`);
  }
  return kept;
}

export async function answerFacts(facts, text) {
  if (facts.length === 0) return [];
  const { answers } = await callJson(AnswerList, answerMessages(text, facts.map((f) => f.question)), { label: 'answers' });
  return facts.map((_, i) => {
    const a = answers.find((x) => x.index === i);
    const evidence = a?.evidence_quote && contains(text, a.evidence_quote) ? a.evidence_quote : null;
    return { answer: a?.answer ?? 'not stated', evidence };
  });
}

// Combines the quiz answer with the cue check for each fact. Statuses are
// evidence for a human, not a verdict: never "verified" or "safe".
export function judgeFacts(facts, answers, text) {
  return facts.map((f, i) => {
    const { answer, evidence } = answers[i];
    const notStated = NOT_STATED.test(answer);

    const spanNums = numbersIn(f.source_span);
    const answerNums = numbersIn(answer);
    // A number in the source that the answer doesn't repeat was either
    // changed or dropped ("a small fine" for "₹2 per day").
    const numberLost =
      spanNums.length > 0 && !spanNums.some((s) => answerNums.some((a) => a.value === s.value));
    const missingCues = diffCues(f.source_span, text).map((c) => c.cue);

    let status = 'appears_preserved';
    let why = 'The story answers this and keeps the cues from the source.';
    if (notStated) {
      status = 'possible_mismatch';
      why = 'The story does not state this.';
    } else if (numberLost) {
      status = 'possible_mismatch';
      why = answerNums.length
        ? 'The numbers in the story differ from the source.'
        : 'The story leaves out the number from the source.';
    } else if (missingCues.length) {
      status = 'needs_review';
      why = `Answered, but the story drops: ${missingCues.join(', ')}.`;
    }

    return {
      fact: f.fact,
      category: f.category,
      span: f.source_span,
      question: f.question,
      answer,
      evidence,
      status,
      why,
    };
  });
}

export async function runQuiz(sources, text) {
  const facts = await extractFacts(sources);
  const answers = await answerFacts(facts, text);
  return judgeFacts(facts, answers, text);
}
