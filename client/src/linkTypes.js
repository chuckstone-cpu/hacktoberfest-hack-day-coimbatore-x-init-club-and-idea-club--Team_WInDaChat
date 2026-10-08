// Relation colours, chosen to read on the paper background. Ochre and coral
// are a shade darker than the palette's accents so thin lines keep ≥ 3:1
// contrast against the page.
export const LINK_TYPES = {
  same_idea: { color: '#0E7C72', label: 'same idea' },
  causes: { color: '#CF5A3C', label: 'causes' },
  consequence_of: { color: '#B57A12', label: 'consequence of' },
  continuation: { color: '#2F6FB0', label: 'continuation' },
  contradicts: { color: '#B83A4B', label: 'contradicts' },
};

export const linkColor = (type) => LINK_TYPES[type]?.color ?? '#5B6B6E';
export const linkLabel = (type) => LINK_TYPES[type]?.label ?? type;
