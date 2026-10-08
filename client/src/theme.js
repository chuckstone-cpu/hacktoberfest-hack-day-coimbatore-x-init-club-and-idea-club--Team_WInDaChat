// The graph is drawn on a canvas, which can't use Tailwind classes, so it
// reads the same CSS variables that index.css defines.
const css = (name, fallback) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;

export const theme = {
  bg: css('--bg', '#F6F1E7'),
  surface: css('--surface', '#FFFDF8'),
  ink: css('--ink', '#1C2B2D'),
  muted: css('--muted', '#5B6B6E'),
  line: css('--line', '#E4DCCB'),
  accent: css('--accent', '#0E7C72'),
  accent2: css('--accent-2', '#E2674A'),
  bad: css('--bad', '#B83A4B'),
};

// "#RRGGBB" + alpha → "rgba(r, g, b, a)" for fades on the canvas.
export function withAlpha(hex, alpha) {
  const [r, g, b] = hex.replace('#', '').match(/\w\w/g).map((h) => parseInt(h, 16));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
