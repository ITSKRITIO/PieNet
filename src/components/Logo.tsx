import Link from 'next/link'

export function Logo({
  siteName,
  mark,
  showMark = true,
  href = '/',
  size = 'md',
}: {
  siteName: string
  mark: string
  showMark?: boolean
  href?: string
  size?: 'md' | 'lg'
}) {
  return (
    <Link href={href} className="group inline-flex items-center gap-2.5 rounded-md" aria-label={`${siteName} home`}>
      {showMark && (
        <span
          className={`font-serif leading-none text-accent transition-transform duration-300 group-hover:-translate-y-0.5 ${size === 'lg' ? 'text-5xl' : 'text-[1.7rem]'}`}
          aria-hidden
        >
          {mark}
        </span>
      )}
      <span className={`font-semibold tracking-[0.28em] ${size === 'lg' ? 'text-xl' : 'text-[15px]'}`}>{siteName}</span>
    </Link>
  )
}
