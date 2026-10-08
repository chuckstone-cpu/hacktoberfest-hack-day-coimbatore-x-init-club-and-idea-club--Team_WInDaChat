import { z } from 'zod';

// Shapes the model must return. These are sent to Ollama as JSON Schema
// (`format`) and used again to validate the reply.

export const TagResult = z.object({
  summary: z.string().min(1).max(300),
  entities: z.array(z.string().min(1).max(60)).max(8),
  patterns: z.array(z.string().min(1).max(40)).min(1).max(4),
});

export const LINK_TYPES = ['causes', 'consequence_of', 'continuation', 'contradicts', 'same_idea'];

export const LinkResult = z.object({
  links: z
    .array(
      z.object({
        note_id: z.number().int(),
        type: z.enum(LINK_TYPES),
        strength: z.number().int().min(1).max(5),
        reason: z.string().min(1).max(250),
      }),
    )
    .max(8),
});

export const FACT_CATEGORIES = ['number', 'date', 'negation', 'condition', 'exception', 'obligation', 'name', 'other'];

export const FactList = z.object({
  facts: z
    .array(
      z.object({
        fact: z.string().min(1).max(200),
        source_span: z.string().min(1).max(300),
        category: z.enum(FACT_CATEGORIES),
        question: z.string().min(1).max(200),
      }),
    )
    .max(8),
});

export const AnswerList = z.object({
  answers: z
    .array(
      z.object({
        index: z.number().int().min(0),
        answer: z.string().min(1).max(200),
        evidence_quote: z.string().max(300).nullable(),
      }),
    )
    .max(8),
});

export const PairResult = z.object({
  type: z.enum(LINK_TYPES),
  strength: z.number().int().min(1).max(5),
  reason: z.string().min(1).max(250),
  difference: z.string().min(1).max(250),
});
