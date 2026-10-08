// Deterministic tag colours: the same tag name always hashes to the same
// palette entry, on every card and every reload. Each entry has a tint
// (pill background), an ink (text, ≥ 4.5:1 on the tint and on the surface)
// and a solid shade (outlines and graph nodes, ≥ 3:1 on the page).
const PALETTE = [
  { name: 'teal', tint: '#DDF0EC', ink: '#0A5E57', solid: '#0E7C72' },
  { name: 'coral', tint: '#FBE3DC', ink: '#9A3B22', solid: '#CF5A3C' },
  { name: 'ochre', tint: '#F6EACB', ink: '#7A5208', solid: '#B57A12' },
  { name: 'blue', tint: '#DFEAF6', ink: '#234F80', solid: '#2F6FB0' },
  { name: 'rose', tint: '#F7E0E4', ink: '#8E2433', solid: '#B83A4B' },
  { name: 'green', tint: '#E1F0E5', ink: '#1F6B42', solid: '#2E7D4F' },
  { name: 'olive', tint: '#ECEED3', ink: '#565A12', solid: '#757B1C' },
  { name: 'slate', tint: '#E3E8EC', ink: '#34495A', solid: '#56707F' },
  { name: 'brown', tint: '#F0E3D8', ink: '#6B4426', solid: '#946038' },
  { name: 'berry', tint: '#F5DFEA', ink: '#7F2B59', solid: '#A23B72' },
];

// FNV-1a: a small, stable string hash.
function hash(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function tagColor(name) {
  return PALETTE[hash(name.trim().toLowerCase()) % PALETTE.length];
}

// Patterns first (they are what links subjects), then entities; A–Z within each.
export function sortTerms(terms = []) {
  return [...terms].sort((a, b) => (a.kind === b.kind ? a.name.localeCompare(b.name) : a.kind === 'pattern' ? -1 : 1));
}
