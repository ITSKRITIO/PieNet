// The one avatar every member shares: a quiet silhouette with a π where the face would be.
export function Avatar({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="Default avatar" className={className}>
      <defs>
        <clipPath id="pie-avatar-clip">
          <circle cx="32" cy="32" r="31" />
        </clipPath>
      </defs>
      <circle cx="32" cy="32" r="31.5" fill="rgb(var(--bg))" />
      <g clipPath="url(#pie-avatar-clip)">
        <circle cx="32" cy="26" r="10" fill="rgb(var(--fg) / 0.1)" />
        <path d="M10 66c1-16 10-24 22-24s21 8 22 24Z" fill="rgb(var(--fg) / 0.1)" />
      </g>
      <path
        d="M26 22.5h12M28.4 22.5v8.5M35.6 22.5v6.8c0 1.4.7 2.2 2 2.2"
        fill="none"
        stroke="rgb(var(--accent))"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="32" cy="32" r="31.25" fill="none" stroke="rgb(var(--fg) / 0.16)" />
    </svg>
  )
}
