import { z } from 'zod';
import { callJson } from '../llm.js';
import { diffCues } from './cues.js';

const ExtractSchema = z.object({
  facts: z.array(z.object({
    fact: z.string(),
    source_span: z.string(),
    category: z.string(),
    question: z.string()
  })).max(6)
});

const AnswerSchema = z.object({
  answers: z.array(z.object({
    index: z.number(),
    answer: z.string(),
    evidence_quote: z.string().nullable()
  }))
});

export async function verifyStory(sourceText, generatedText) {
  // 1. Cue Diff
  const cues = diffCues(sourceText, generatedText);
  
  // 2. Fact Extraction
  const extractPrompt = `
Extract up to 6 must-keep facts from these source notes.
Prefer facts containing numbers, conditions, or strict rules.
Source notes:
"${sourceText}"

Return JSON matching:
{
  "facts": [
    {
      "fact": "The actual fact",
      "source_span": "Exact quote from source",
      "category": "number/condition/rule",
      "question": "A question to verify this fact"
    }
  ]
}
`;
  let factsResult = { facts: [] };
  try {
    factsResult = await callJson(ExtractSchema, [{ role: 'user', content: extractPrompt }]);
  } catch(e) {
    console.error("Fact extraction failed", e);
  }

  // 3. Answer from Output
  if (factsResult.facts.length === 0) {
    return { cues, facts: [] };
  }

  const questionsList = factsResult.facts.map((f, i) => `${i}: ${f.question}`).join('\n');
  const answerPrompt = `
Answer the following questions using ONLY the provided generated text.
If the text does not contain the answer, your answer MUST be "not stated".

Generated text:
"${generatedText}"

Questions:
${questionsList}

Return JSON matching:
{
  "answers": [
    {
      "index": 0,
      "answer": "The answer or 'not stated'",
      "evidence_quote": "Quote from text or null"
    }
  ]
}
`;

  let answersResult = { answers: [] };
  try {
    answersResult = await callJson(AnswerSchema, [{ role: 'user', content: answerPrompt }]);
  } catch(e) {
    console.error("Fact answering failed", e);
  }

  // Combine
  const facts = factsResult.facts.map((f, i) => {
    const ans = answersResult.answers.find(a => a.index === i);
    const answerText = ans ? ans.answer.toLowerCase() : "not stated";
    let status = "Appears preserved";
    
    if (answerText.includes("not stated")) {
      status = "Possible mismatch";
    } else {
      // Check if cues from this span are missing
      const spanCues = diffCues(f.source_span, generatedText);
      if (spanCues.length > 0) {
        status = "Needs review"; // missing cues
      }
    }
    
    return {
      fact: f.fact,
      span: f.source_span,
      question: f.question,
      answer: ans ? ans.answer : "Error answering",
      status
    };
  });

  return { cues, facts };
}
