export default function Hero() {
  return (
    <section id="home" className="relative flex min-h-[calc(100svh-4rem)] items-center">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_1fr]">
        <div className="flex flex-col gap-6">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-accent-ink">A local-first second brain</p>
          <h1 className="font-display text-5xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-6xl lg:text-7xl">
            Your notes, connected.
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-muted">
            Gemma 4 finds how your ideas link across subjects, tells them as a story, and checks its own story for
            dropped facts. Fully local.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="#add"
              className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-surface shadow-card transition-colors hover:bg-accent-ink"
            >
              Add a note
            </a>
            <a
              href="#graph"
              className="rounded-full border border-line bg-surface px-6 py-3 text-sm font-semibold text-ink transition-colors hover:border-accent"
            >
              Explore the graph
            </a>
          </div>
        </div>

        {/* Placeholder: the carousel of recent notes goes here (UI prompt 3). */}
        <div id="hero-carousel" className="min-h-[18rem]" />
      </div>
    </section>
  );
}
