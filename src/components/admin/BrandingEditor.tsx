'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Loader2, RotateCcw } from 'lucide-react'
import { useConfirm } from '../Confirm'
import { useToast } from '../Toast'
import { api, ClientApiError } from '@/lib/client'
import { DEFAULT_SETTINGS } from '@/lib/site-defaults'
import type { SiteSettings } from '@/lib/validation'

const COLORS: { key: 'accentColor' | 'backgroundColor' | 'textColor' | 'mutedColor'; label: string; hint: string }[] = [
  { key: 'accentColor', label: 'Accent', hint: 'Links, buttons and the π mark.' },
  { key: 'backgroundColor', label: 'Background', hint: 'The page behind everything.' },
  { key: 'textColor', label: 'Text', hint: 'Headings and body copy.' },
  { key: 'mutedColor', label: 'Secondary text', hint: 'Timestamps, hints and captions.' },
]

const NAV_LABELS: Record<keyof SiteSettings['nav'], string> = {
  home: 'Home',
  chat: 'Global Chat',
  plans: 'Plans',
  announcements: 'Announcements',
  memories: 'Memories',
  members: 'Members',
}

const SECTION_LABELS: Record<keyof SiteSettings['homeSections'], string> = {
  chat: 'Chat preview',
  plans: 'Upcoming plans',
  announcements: 'Recent announcements',
  memories: 'Latest photos',
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="card p-6">
      <h2 className="font-medium">{title}</h2>
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  )
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-2.5 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-fg/25 bg-fg/[0.06] accent-[rgb(var(--accent))]"
      />
      {label}
    </label>
  )
}

export function BrandingEditor({ initial }: { initial: SiteSettings }) {
  const router = useRouter()
  const toast = useToast()
  const confirm = useConfirm()
  const [values, setValues] = useState<SiteSettings>(initial)
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const set = <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) => setValues((v) => ({ ...v, [key]: value }))

  async function save(next: SiteSettings) {
    setBusy(true)
    setErrors({})
    try {
      await api('/api/admin/settings', { method: 'PUT', body: next })
      toast.success('Appearance saved. Everyone sees it on their next page load.')
      router.refresh()
    } catch (err) {
      setErrors((err as ClientApiError).fields ?? {})
      toast.error((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function reset() {
    if (!(await confirm({ title: 'Restore the original look?', message: 'This puts every branding and appearance value back to the PIE defaults.', confirmLabel: 'Restore defaults' }))) return
    setValues(DEFAULT_SETTINGS)
    await save(DEFAULT_SETTINGS)
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        save(values)
      }}
      noValidate
    >
      <Section title="Identity" description="The name, mark and line that appear across the site.">
        <div>
          <label className="label" htmlFor="siteName">Site name</label>
          <input id="siteName" className="input" value={values.siteName} maxLength={30} onChange={(e) => set('siteName', e.target.value)} />
          {errors.siteName && <p className="field-error">{errors.siteName}</p>}
        </div>
        <div>
          <label className="label" htmlFor="slogan">Slogan</label>
          <input id="slogan" className="input" value={values.slogan} maxLength={80} onChange={(e) => set('slogan', e.target.value)} />
          {errors.slogan && <p className="field-error">{errors.slogan}</p>}
        </div>
        <div className="grid gap-4 sm:grid-cols-[120px_1fr] sm:items-end">
          <div>
            <label className="label" htmlFor="logoMark">Logo mark</label>
            <input id="logoMark" className="input text-center text-lg" value={values.logoMark} maxLength={3} onChange={(e) => set('logoMark', e.target.value)} />
          </div>
          <Toggle checked={values.showLogo} onChange={(v) => set('showLogo', v)} label="Show the mark next to the site name" />
        </div>
        {errors.logoMark && <p className="field-error">{errors.logoMark}</p>}

        <div className="flex items-center gap-3 rounded-lg border border-fg/10 bg-fg/[0.03] px-4 py-3">
          {values.showLogo && <span className="font-serif text-3xl leading-none" style={{ color: values.accentColor }}>{values.logoMark}</span>}
          <span className="font-semibold tracking-[0.28em]" style={{ color: values.textColor }}>{values.siteName}</span>
          <span className="ml-auto text-sm" style={{ color: values.mutedColor }}>{values.slogan}</span>
        </div>
      </Section>

      <Section title="Colors" description="Hex values. Keep enough contrast between text and background to stay readable.">
        <div className="grid gap-4 sm:grid-cols-2">
          {COLORS.map(({ key, label, hint }) => (
            <div key={key}>
              <label className="label" htmlFor={key}>{label}</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  aria-label={`${label} color picker`}
                  value={values[key]}
                  onChange={(e) => set(key, e.target.value)}
                  className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-fg/10 bg-transparent p-1"
                />
                <input id={key} className="input font-mono text-[13px]" value={values[key]} onChange={(e) => set(key, e.target.value)} maxLength={7} />
              </div>
              <p className="hint">{hint}</p>
              {errors[key] && <p className="field-error">{errors[key]}</p>}
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-fg/10 p-5" style={{ background: values.backgroundColor }}>
          <p className="text-sm" style={{ color: values.textColor }}>Preview: this is how body text reads.</p>
          <p className="mt-1 text-xs" style={{ color: values.mutedColor }}>Secondary text, like a timestamp.</p>
          <span className="mt-3 inline-block rounded-lg px-4 py-2 text-sm font-medium" style={{ background: values.accentColor, color: values.backgroundColor }}>
            A button
          </span>
        </div>
      </Section>

      <Section title="Navigation" description="Hidden pages disappear from the header. Their content stays in the database.">
        <div className="grid gap-3 sm:grid-cols-2">
          {(Object.keys(NAV_LABELS) as (keyof SiteSettings['nav'])[]).map((k) => (
            <Toggle key={k} checked={values.nav[k]} onChange={(v) => set('nav', { ...values.nav, [k]: v })} label={NAV_LABELS[k]} />
          ))}
        </div>
      </Section>

      <Section title="Homepage sections" description="Which summary cards appear under the slogan.">
        <div className="grid gap-3 sm:grid-cols-2">
          {(Object.keys(SECTION_LABELS) as (keyof SiteSettings['homeSections'])[]).map((k) => (
            <Toggle
              key={k}
              checked={values.homeSections[k]}
              onChange={(v) => set('homeSections', { ...values.homeSections, [k]: v })}
              label={SECTION_LABELS[k]}
            />
          ))}
        </div>
      </Section>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <button type="button" className="btn btn-ghost" onClick={reset} disabled={busy}>
          <RotateCcw className="h-4 w-4" aria-hidden /> Restore defaults
        </button>
        <button className="btn btn-primary" disabled={busy}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          Save appearance
        </button>
      </div>
    </form>
  )
}
