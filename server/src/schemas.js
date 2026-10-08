import { z } from 'zod';

export const TagResultSchema = z.object({
  summary: z.string().describe("A one-line summary (<= 25 words)"),
  entities: z.array(z.string()).max(8).describe("Normalized canonical entity names"),
  patterns: z.array(z.string()).min(1).max(4).describe("Abstract mechanisms (e.g. 'feedback loop', 'trade-off', 'bottleneck') in lowercase")
});

export const LinkResultSchema = z.object({
  links: z.array(z.object({
    note_id: z.number().int(),
    type: z.enum(['causes', 'consequence_of', 'continuation', 'contradicts', 'same_idea']),
    strength: z.number().int().min(1).max(5),
    reason: z.string().describe("Short reason citing a shared fact (<= 25 words)")
  }))
});
