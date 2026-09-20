'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { CalendarPlus, MapPin, Pencil, Trash2 } from 'lucide-react'
import { EmptyState } from './PageHeader'
import { LocalTime } from './LocalTime'
import { Modal } from './Modal'
import { useConfirm } from './Confirm'
import { useToast } from './Toast'
import { api, ClientApiError } from '@/lib/client'
import { cn, planPhase, type PlanPhase } from '@/lib/utils'

export type PlanDTO = {
  id: string
  title: string
  description: string
  location: string
  startsAt: string
  endsAt: string | null
  creator: { id: string; username: string }
  participants: { userId: string; username: string; status: 'GOING' | 'MAYBE' }[]
}

const pad = (n: number) => String(n).padStart(2, '0')
const toDate = (iso: string) => {
  const d = new Date(iso)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
const toTime = (iso: string) => {
  const d = new Date(iso)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function PlanForm({ plan, open, onClose }: { plan?: PlanDTO; open: boolean; onClose: () => void }) {
  const router = useRouter()
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const date = String(f.get('date') || '')
    const time = String(f.get('time') || '')
    const endTime = String(f.get('endTime') || '')
    if (!date || !time) return setErrors({ startsAt: 'Choose a date and time' })
    const start = new Date(`${date}T${time}`)
    let end: Date | null = null
    if (endTime) {
      end = new Date(`${date}T${endTime}`)
      if (end <= start) end = new Date(end.getTime() + 24 * 3600_000) // ends after midnight
    }
    setBusy(true)
    setErrors({})
    try {
      await api(plan ? `/api/plans/${plan.id}` : '/api/plans', {
        method: plan ? 'PATCH' : 'POST',
        body: {
          title: f.get('title'),
          description: f.get('description'),
          location: f.get('location'),
          startsAt: start.toISOString(),
          endsAt: end?.toISOString() ?? null,
        },
      })
      toast.success(plan ? 'Plan updated.' : 'Plan created.')
      onClose()
      router.refresh()
    } catch (err) {
      setErrors((err as ClientApiError).fields ?? {})
      toast.error((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={plan ? 'Edit plan' : 'New plan'} wide>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div>
          <label className="label" htmlFor="p-title">Title</label>
          <input id="p-title" name="title" className="input" defaultValue={plan?.title} maxLength={120} required autoFocus />
          {errors.title && <p className="field-error">{errors.title}</p>}
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="p-date">Date</label>
            <input id="p-date" name="date" type="date" className="input" defaultValue={plan ? toDate(plan.startsAt) : ''} required />
          </div>
          <div>
            <label className="label" htmlFor="p-time">Starts</label>
            <input id="p-time" name="time" type="time" className="input" defaultValue={plan ? toTime(plan.startsAt) : ''} required />
          </div>
          <div>
            <label className="label" htmlFor="p-end">Ends (optional)</label>
            <input id="p-end" name="endTime" type="time" className="input" defaultValue={plan?.endsAt ? toTime(plan.endsAt) : ''} />
          </div>
        </div>
        {(errors.startsAt || errors.endsAt) && <p className="field-error">{errors.startsAt || errors.endsAt}</p>}
        <div>
          <label className="label" htmlFor="p-loc">Location</label>
          <input id="p-loc" name="location" className="input" defaultValue={plan?.location} maxLength={160} />
        </div>
        <div>
          <label className="label" htmlFor="p-desc">Description</label>
          <textarea id="p-desc" name="description" className="input" rows={4} defaultValue={plan?.description} maxLength={2000} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={busy}>{plan ? 'Save changes' : 'Create plan'}</button>
        </div>
      </form>
    </Modal>
  )
}

function PlanCard({ plan, phase, meId, isAdmin }: { plan: PlanDTO; phase: PlanPhase; meId: string; isAdmin: boolean }) {
  const router = useRouter()
  const toast = useToast()
  const confirm = useConfirm()
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)
  const mine = plan.participants.find((p) => p.userId === meId)?.status ?? null
  const going = plan.participants.filter((p) => p.status === 'GOING')
  const maybe = plan.participants.filter((p) => p.status === 'MAYBE')
  const canManage = plan.creator.id === meId || isAdmin

  async function attend(status: 'GOING' | 'MAYBE') {
    setBusy(true)
    try {
      await api(`/api/plans/${plan.id}/attend`, { method: 'POST', body: { status: mine === status ? null : status } })
      router.refresh()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    if (!(await confirm({ title: `Delete “${plan.title}”?`, message: 'This removes the plan and its attendance list.', confirmLabel: 'Delete plan', danger: true }))) return
    try {
      await api(`/api/plans/${plan.id}`, { method: 'DELETE' })
      toast.success('Plan deleted.')
      router.refresh()
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  return (
    <article className={cn('card p-5', phase === 'ongoing' && 'shadow-glow border-accent/30', phase === 'past' && 'opacity-75')}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold">{plan.title}</h3>
            {phase === 'ongoing' && <span className="chip border-accent/40 text-accent">Happening now</span>}
            {phase === 'past' && <span className="chip">Past</span>}
          </div>
          <p className="mt-1 text-sm text-muted">
            <LocalTime iso={plan.startsAt} format="time" />
            {plan.endsAt && (
              <>
                {' – '}
                <LocalTime iso={plan.endsAt} format="time" />
              </>
            )}
            {plan.location && (
              <span className="ml-3 inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" aria-hidden /> {plan.location}
              </span>
            )}
          </p>
        </div>
        {canManage && (
          <div className="flex shrink-0 gap-0.5">
            <button className="btn-icon" onClick={() => setEditing(true)} aria-label={`Edit ${plan.title}`}><Pencil className="h-4 w-4" /></button>
            <button className="btn-icon hover:text-red-300" onClick={remove} aria-label={`Delete ${plan.title}`}><Trash2 className="h-4 w-4" /></button>
          </div>
        )}
      </div>

      {plan.description && <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-fg/80">{plan.description}</p>}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-fg/10 pt-4">
        <div className="text-xs text-muted">
          <span>
            By{' '}
            <Link href={`/members/${plan.creator.username}`} className="text-fg/80 hover:text-accent">
              @{plan.creator.username}
            </Link>
          </span>
          <span className="ml-3">
            {going.length} going{maybe.length > 0 && `, ${maybe.length} maybe`}
          </span>
          {going.length > 0 && <p className="mt-1 max-w-md truncate">{going.map((g) => `@${g.username}`).join(', ')}</p>}
        </div>
        {phase !== 'past' && (
          <div className="flex gap-2" role="group" aria-label="Your attendance">
            <button disabled={busy} onClick={() => attend('GOING')} aria-pressed={mine === 'GOING'} className={cn('btn btn-sm', mine === 'GOING' ? 'btn-primary' : 'btn-ghost')}>
              Going
            </button>
            <button disabled={busy} onClick={() => attend('MAYBE')} aria-pressed={mine === 'MAYBE'} className={cn('btn btn-sm', mine === 'MAYBE' ? 'btn-primary' : 'btn-ghost')}>
              Maybe
            </button>
          </div>
        )}
      </div>
      {editing && <PlanForm plan={plan} open onClose={() => setEditing(false)} />}
    </article>
  )
}

export function PlansView({ plans, meId, isAdmin, serverNow }: { plans: PlanDTO[]; meId: string; isAdmin: boolean; serverNow: number }) {
  const [creating, setCreating] = useState(false)
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming')
  const [now, setNow] = useState(serverNow)
  useEffect(() => {
    setNow(Date.now())
    const t = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(t)
  }, [])

  const withPhase = plans.map((p) => ({ p, phase: planPhase(p.startsAt, p.endsAt, now) }))
  const current = withPhase.filter((x) => x.phase !== 'past').sort((a, b) => +new Date(a.p.startsAt) - +new Date(b.p.startsAt))
  const past = withPhase.filter((x) => x.phase === 'past').sort((a, b) => +new Date(b.p.startsAt) - +new Date(a.p.startsAt))
  const shown = tab === 'upcoming' ? current : past

  // Group by local calendar day for the timeline.
  const groups: { key: string; iso: string; items: typeof shown }[] = []
  for (const x of shown) {
    const key = toDate(x.p.startsAt)
    const g = groups.find((g) => g.key === key)
    if (g) g.items.push(x)
    else groups.push({ key, iso: x.p.startsAt, items: [x] })
  }

  return (
    <>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-fg/10 p-1" role="tablist" aria-label="Plan filter">
          {(['upcoming', 'past'] as const).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={cn('rounded-md px-4 py-1.5 text-sm capitalize transition', tab === t ? 'bg-fg/10 text-fg' : 'text-muted hover:text-fg')}
            >
              {t} <span className="ml-1 text-xs text-muted">{t === 'upcoming' ? current.length : past.length}</span>
            </button>
          ))}
        </div>
        <button className="btn btn-primary" onClick={() => setCreating(true)}>
          <CalendarPlus className="h-4 w-4" aria-hidden /> New plan
        </button>
      </div>

      {groups.length === 0 ? (
        <EmptyState
          title={tab === 'upcoming' ? 'Nothing planned yet' : 'No past plans'}
          message={tab === 'upcoming' ? 'Suggest a hangout, a trip or a movie night. Everyone can join in.' : 'Plans move here once they’re over.'}
          action={tab === 'upcoming' ? <button className="btn btn-primary" onClick={() => setCreating(true)}>Create the first plan</button> : undefined}
        />
      ) : (
        <ol className="relative space-y-10 border-l border-fg/10 pl-6 sm:pl-8">
          {groups.map((g) => (
            <li key={g.key} className="relative">
              <span className="absolute -left-[29px] top-1.5 h-2.5 w-2.5 rounded-full bg-accent ring-4 ring-bg sm:-left-[37px]" aria-hidden />
              <h2 className="mb-4 text-sm font-medium text-fg/90">
                <LocalTime iso={g.iso} format="long" />
              </h2>
              <div className="space-y-3">
                {g.items.map(({ p, phase }) => (
                  <PlanCard key={p.id} plan={p} phase={phase} meId={meId} isAdmin={isAdmin} />
                ))}
              </div>
            </li>
          ))}
        </ol>
      )}
      <PlanForm open={creating} onClose={() => setCreating(false)} key={String(creating)} />
    </>
  )
}
