export const taggingPrompt = (noteText) => `
You are an expert at extracting structure from study notes.
Analyze the following note.

Return a JSON object matching this schema exactly. Do not include markdown formatting like \`\`\`json.
Schema:
{
  "summary": "A one-line summary (<= 25 words)",
  "entities": ["array of up to 8 normalized canonical entity names, e.g. 'RBI' instead of 'Reserve Bank of India'"],
  "patterns": ["array of 1 to 4 abstract mechanisms like 'feedback loop', 'trade-off', 'bottleneck', 'equilibrium' in lowercase"]
}

Note:
"${noteText}"
`;

export const linkingPrompt = (newNote, candidates) => `
You are a knowledge graph builder. You must link a new note to older notes if they share a strong conceptual connection.

New Note:
"${newNote.text}"
(Summary: ${newNote.summary})

Candidate Notes:
${candidates.map((c, i) => `[ID: ${c.id}] Summary: ${c.summary}\nText: ${c.text.substring(0, 400)}`).join('\n\n')}

Return a JSON object containing an array of links matching this schema exactly. If there are no strong connections, return an empty array.
Schema:
{
  "links": [
    {
      "note_id": 123, // The ID of the candidate note
      "type": "one of: causes, consequence_of, continuation, contradicts, same_idea",
      "strength": 5, // Integer 1-5. Weak "both are about X" links MUST be <= 2. Only strength >= 4 will be kept.
      "reason": "Short reason citing a specific shared fact (<= 25 words)"
    }
  ]
}
`;

export const storyPrompt = `
You are a storyteller. You will receive a chronological thread of linked notes.
Write a short, engaging narrative (<= 200 words) that ties these ideas together.
Explain the shared mechanism or concept that connects them.
CRITICAL: DO NOT add facts, numbers, or details that are not present in the notes. Only use the provided information.
`;
