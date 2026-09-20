'use client'

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center px-6 text-center">
      <div>
        <p className="font-serif text-8xl text-accent">π</p>
        <h1 className="mt-4 text-2xl font-semibold">Something went wrong</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
          The page couldn’t load. Try again, and if it keeps happening let an admin know.
        </p>
        <button onClick={reset} className="btn btn-primary mt-6">
          Try again
        </button>
      </div>
    </main>
  )
}
