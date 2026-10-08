import StatusPill from './components/StatusPill.jsx';

export default function App() {
  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-edge px-5 py-3">
        <h1 className="text-lg font-semibold tracking-tight">
          <span className="text-accent">●</span> Connectore
        </h1>
        <StatusPill />
      </header>

      <main className="relative flex-1 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#8b5cf61a,transparent_60%)]" />
        <div className="relative flex h-full items-center justify-center">
          <p className="text-sm text-muted">Graph view coming soon</p>
        </div>
      </main>
    </div>
  );
}
