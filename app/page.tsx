export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className="size-2.5 rounded-full border border-bronze"
          />
          <h1 className="text-2xl tracking-tight">MakeMyMarriage</h1>
        </div>
        <p className="text-muted">The app shell is up.</p>
      </div>
    </main>
  );
}
