import { useEffect, useState } from 'react';
import StatusPill from './StatusPill.jsx';

export const SECTIONS = [
  ['home', 'Home'],
  ['notes', 'Notes'],
  ['graph', 'Graph'],
  ['add', 'Add'],
];

// Sticky top nav: highlights the section in view and smooth-scrolls to anchors
// (smooth scrolling comes from CSS, so reduced-motion users get a jump).
export default function Nav({ noteCount, linkCount }) {
  const [active, setActive] = useState('home');
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // The section crossing the middle band of the viewport is the active one.
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: '-45% 0px -50% 0px' },
    );
    for (const [id] of SECTIONS) {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    }
    return () => io.disconnect();
  }, []);

  const link = (id, label, extra = '') => (
    <a
      key={id}
      href={`#${id}`}
      onClick={() => setMenuOpen(false)}
      aria-current={active === id ? 'true' : undefined}
      className={`relative px-1 py-1 text-sm font-medium transition-colors ${
        active === id ? 'text-accent-ink' : 'text-muted hover:text-ink'
      } ${extra}`}
    >
      {label}
      <span
        aria-hidden="true"
        className={`absolute inset-x-1 -bottom-0.5 h-0.5 rounded-full bg-accent transition-opacity ${active === id ? 'opacity-100' : 'opacity-0'}`}
      />
    </a>
  );

  return (
    <header
      className={`sticky top-0 z-30 border-b bg-bg/80 backdrop-blur-md transition-colors ${
        scrolled ? 'border-line' : 'border-transparent'
      }`}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6" aria-label="Main">
        <a href="#home" className="font-display text-xl font-semibold tracking-tight text-ink">
          Connectore
        </a>

        <div className="hidden items-center gap-6 md:flex">{SECTIONS.map(([id, label]) => link(id, label))}</div>

        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-muted lg:inline">
            {noteCount} notes · {linkCount} links
          </span>
          <div className="hidden sm:block">
            <StatusPill />
          </div>
          <button
            type="button"
            className="rounded-full border border-line bg-surface px-3 py-1.5 text-sm font-medium text-ink md:hidden"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((o) => !o)}
          >
            {menuOpen ? 'Close' : 'Menu'}
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div id="mobile-menu" className="border-t border-line bg-surface px-4 py-3 md:hidden">
          <div className="flex flex-col gap-2">{SECTIONS.map(([id, label]) => link(id, label, 'self-start'))}</div>
          <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-line pt-3">
            <span className="text-xs text-muted">
              {noteCount} notes · {linkCount} links
            </span>
            <StatusPill />
          </div>
        </div>
      )}
    </header>
  );
}
