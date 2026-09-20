import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-6 text-center">
      <div>
        <p className="font-serif text-8xl text-accent">π</p>
        <h1 className="mt-4 text-2xl font-semibold">This page doesn’t exist</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted">The link may be broken, or the page was removed.</p>
        <Link href="/" className="btn btn-primary mt-6">
          Back home
        </Link>
      </div>
    </main>
  )
}
