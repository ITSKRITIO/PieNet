export default function Loading() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading">
      <div className="skeleton h-12 w-64" />
      <div className="skeleton h-4 w-96 max-w-full" />
      <div className="grid gap-4 md:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-48" />
        ))}
      </div>
    </div>
  )
}
