export const LINK_TYPES = {
  same_idea: { color: '#a78bfa', label: 'same idea' },
  causes: { color: '#fb923c', label: 'causes' },
  consequence_of: { color: '#fbbf24', label: 'consequence of' },
  continuation: { color: '#60a5fa', label: 'continuation' },
  contradicts: { color: '#f87171', label: 'contradicts' },
};

export const linkColor = (type) => LINK_TYPES[type]?.color ?? '#52525b';
export const linkLabel = (type) => LINK_TYPES[type]?.label ?? type;
