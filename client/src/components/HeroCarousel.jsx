import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Carousel from './reactbits/Carousel/Carousel.jsx';
import TagChip from './TagChip.jsx';
import { sortTerms } from '../tags.js';

const RECENT = 8;
const DRAG_SLOP_PX = 6;

const formatDate = (iso) => new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
  useEffect(() => {
    const q = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!q) return undefined;
    const update = () => setReduced(q.matches);
    q.addEventListener('change', update);
    return () => q.removeEventListener('change', update);
  }, []);
  return reduced;
}

// The 8 newest notes in React Bits' Carousel. The title is a button whose hit
// area stretches over the whole card, so clicking a card opens that note
// (React Bits' Carousel has no click prop), while a swipe doesn't count as a click.
export default function HeroCarousel({ notes, onOpen }) {
  const wrapRef = useRef(null);
  const pressX = useRef(0);
  const [width, setWidth] = useState(0);
  const reduced = usePrefersReducedMotion();

  // Measure once before paint, then follow resizes.
  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    setWidth(el.getBoundingClientRect().width);
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const items = useMemo(
    () =>
      [...notes]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id)
        .slice(0, RECENT)
        .map((n) => ({
          id: n.id,
          title: (
            <button
              type="button"
              className="text-left font-display text-xl font-semibold leading-snug text-ink after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
              onPointerDown={(e) => { pressX.current = e.clientX; }}
              onClick={(e) => {
                if (Math.abs(e.clientX - pressX.current) > DRAG_SLOP_PX && e.detail > 0) return;
                onOpen(n.id);
              }}
              aria-label={`Open note: ${n.summary || n.text}`}
            >
              <span className="line-clamp-4">{n.summary || n.text}</span>
            </button>
          ),
          description: (
            <span className="mt-4 flex flex-col gap-3">
              <span className="flex flex-wrap gap-1.5">
                {sortTerms(n.terms).slice(0, 2).map((t) => (
                  <TagChip key={`${t.kind}:${t.name}`} name={t.name} kind={t.kind} />
                ))}
              </span>
              <span className="text-xs text-muted">{formatDate(n.createdAt)}</span>
            </span>
          ),
        })),
    [notes, onOpen],
  );

  if (notes.length === 0) return null;

  // The carousel takes a fixed pixel width; fit it to the column (and phones).
  const baseWidth = Math.round(Math.min(Math.max(width, 260), 440));

  return (
    <div ref={wrapRef} className="flex w-full justify-center" aria-label="Your most recent notes">
      {width > 0 && (
        <Carousel
          items={items}
          baseWidth={baseWidth}
          autoplay={!reduced}
          autoplayDelay={3500}
          pauseOnHover
          loop
        />
      )}
    </div>
  );
}
