'use client'

const FORMATS: Record<string, Intl.DateTimeFormatOptions> = {
  datetime: { dateStyle: 'medium', timeStyle: 'short' },
  date: { dateStyle: 'medium' },
  time: { timeStyle: 'short' },
  long: { weekday: 'long', month: 'long', day: 'numeric' },
  day: { day: 'numeric' },
  month: { month: 'short' },
}

export function LocalTime({ iso, format = 'datetime', className }: { iso: string; format?: keyof typeof FORMATS; className?: string }) {
  // Rendered in the viewer's own time zone; the server render may differ, hence suppressHydrationWarning.
  return (
    <time dateTime={iso} className={className} suppressHydrationWarning>
      {new Date(iso).toLocaleString(undefined, FORMATS[format])}
    </time>
  )
}
