async function request(path, options) {
  const res = await fetch(path, options);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
  return body;
}

const postJson = (path, data, extra) =>
  fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    ...extra,
  });

export const getHealth = () => request('/api/health');
export const getGraph = () => request('/api/graph');
export const getThread = (id) => request(`/api/thread/${id}`);

export const createNote = (text) =>
  request('/api/notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });

// Streams the story text, calling onChunk with each piece as it arrives.
export async function streamStory(noteIds, onChunk, signal) {
  const res = await postJson('/api/story', { noteIds }, { signal });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Story failed (${res.status})`);
  }
  const decoder = new TextDecoder();
  const reader = res.body.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    onChunk(decoder.decode(value, { stream: true }));
  }
}

export const verifyText = (noteIds, text) =>
  request('/api/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ noteIds, text }),
  });

export const connectPair = (a, b) =>
  request('/api/connect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ a, b }),
  });
