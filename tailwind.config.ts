import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'rgb(var(--bg) / <alpha-value>)',
        fg: 'rgb(var(--fg) / <alpha-value>)',
        accent: 'rgb(var(--accent) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
      },
      boxShadow: {
        soft: '0 1px 0 0 rgb(255 255 255 / 0.04) inset, 0 16px 40px -18px rgb(0 0 0 / 0.7)',
        glow: '0 0 0 1px rgb(var(--accent) / 0.25), 0 10px 40px -10px rgb(var(--accent) / 0.35)',
      },
      keyframes: {
        toastIn: { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'none' } },
        pulseSoft: { '0%,100%': { opacity: '0.45' }, '50%': { opacity: '1' } },
        ping2: { '75%,100%': { transform: 'scale(2.2)', opacity: '0' } },
      },
      animation: {
        toast: 'toastIn .2s ease-out',
        pulseSoft: 'pulseSoft 1.8s ease-in-out infinite',
        ping2: 'ping2 2s cubic-bezier(0,0,.2,1) infinite',
      },
    },
  },
  plugins: [],
}
export default config
