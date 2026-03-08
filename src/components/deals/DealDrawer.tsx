'use client'
import { useState, useRef, useEffect } from 'react'
import { X, FileText, Users, CheckSquare, BarChart2, Clock, Upload, Plus } from 'lucide-react'
import { useStore, DEFAULT_MILESTONES, DEFAULT_FIELD_DEFS } from '@/lib/store'
import { computeScore, formatCurrency, stageColor, stageDot, barColor, scoreColor } from '@/lib/utils'
import { ScoreBadge } from '@/components/ui/ScoreBadge'
import type { Deal, TimelineEvent, DealMilestoneStatus, Contact, ContactType } from '@/types'
import clsx from 'clsx'
import { formatDistanceToNow } from 'date-fns'

type Tab = 'overview' | 'timeline' | 'scoring' | 'diligence' | 'documents' | 'contacts'

const TABS: { id: Tab; label: string; Icon: any }[] = [
  { id: 'overview',   label: 'Overview',   Icon: BarChart2 },
  { id: 'timeline',   label: 'Timeline',   Icon: Clock },
  { id: 'scoring',    label: 'Scoring',    Icon: BarChart2 },
  { id: 'diligence',  label: 'Diligence',  Icon: CheckSquare },
  { id: 'documents',  label: 'Documents',  Icon: FileText },
  { id: 'contacts',   label: 'Contacts',   Icon: Users },
]

interface Props {
  deal: Deal & { score: ReturnType<typeof computeScore> }
  onClose: () => void
}

export function DealDrawer({ deal, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('overview')
  const { stages, categories, fieldDefs, updateDeal, updateMilestone, updateScore, addTimelineEvent, moveDeal } = useStore()
  const stage = stages.find(s => s.id === deal.stage_id)

  return (
    <div
      className="fixed inset-y-0 right-0 z-50 flex flex-col border-l shadow-2xl"
      style={{ width: 680, background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      {/* Header */}
      <div className="flex items-start gap-3 px-6 py-5 border-b shrink-0" style={{ borderColor: 'var(--border)' }}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={clsx('inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono border', stageColor(deal.stage_id))}>
              <span className={clsx('w-1.5 h-1.5 rounded-full', stageDot(deal.stage_id))} />
              {stage?.name}
            </span>
            {deal.next_follow_up_at && new Date(deal.next_follow_up_at) < new Date() && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded border" style={{ background: 'rgba(240,80,80,0.1)', borderColor: 'rgba(240,80,80,0.3)', color: 'var(--danger)' }}>
                Overdue follow-up
              </span>
            )}
          </div>
          <h2 className="font-display text-xl leading-tight" style={{ color: 'var(--text)' }}>{deal.name}</h2>
          <p className="font-mono text-[11px] mt-0.5" style={{ color: 'var(--muted)' }}>
            {deal.industry} · {deal.location} · {deal.source}
          </p>
        </div>
        <ScoreBadge letter={deal.score.letter} total={deal.score.total} size="lg" />
        <button onClick={onClose} className="w-7 h-7 rounded-md flex items-center justify-center transition-colors hover:bg-white/10" style={{ color: 'var(--muted)' }}>
          <X size={15} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b shrink-0 overflow-x-auto" style={{ borderColor: 'var(--border)' }}>
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={clsx(
              'flex items-center gap-1.5 px-4 py-2.5 text-[11px] font-mono whitespace-nowrap border-b-2 transition-all',
              tab === id ? 'border-lime-400 text-lime-400' : 'border-transparent hover:text-white'
            )}
            style={{ color: tab === id ? undefined : 'var(--muted)' }}
          >
            <Icon size={11} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {tab === 'overview'  && <OverviewTab deal={deal} onMoveStage={(s) => moveDeal(deal.id, s)} stages={stages} fieldDefs={fieldDefs} onUpdate={(patch) => updateDeal(deal.id, patch)} />}
        {tab === 'timeline'  && <TimelineTab deal={deal} onAddNote={(t) => {
          const event: TimelineEvent = { id: `t${Date.now()}`, deal_id: deal.id, actor: 'Jacob Fenton', event_type: 'note', payload: { text: t }, created_at: new Date().toISOString() }
          addTimelineEvent(deal.id, event)
        }} />}
        {tab === 'scoring'   && <ScoringTab deal={deal} categories={categories} onUpdate={(s) => updateScore(deal.id, s)} />}
        {tab === 'diligence' && <DiligenceTab deal={deal} onUpdate={(s) => updateMilestone(deal.id, s)} />}
        {tab === 'documents' && <DocumentsTab deal={deal} />}
        {tab === 'contacts'  && <ContactsTab deal={deal} />}
      </div>

      {/* Footer stage mover */}
      <div className="px-6 py-3 border-t flex items-center gap-2" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
        <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color: 'var(--muted)' }}>Move to →</span>
        {stages.filter(s => s.id !== deal.stage_id).map(s => (
          <button
            key={s.id}
            onClick={() => moveDeal(deal.id, s.id)}
            className={clsx('px-2.5 py-1 rounded text-[10px] font-mono border transition-all hover:opacity-80', stageColor(s.id))}
          >
            {s.name}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Overview Tab ───────────────────────────────────────────────────────────
function OverviewTab({ deal, stages, onMoveStage, onUpdate, fieldDefs }: {
  deal: any; stages: any[]; onMoveStage: (s: string) => void
  onUpdate: (patch: Partial<Deal>) => void; fieldDefs: any[]
}) {
  const multiple = deal.sde_k && deal.asking_price_k ? (deal.asking_price_k / deal.sde_k).toFixed(1) : null
  const customFields = fieldDefs
    .filter((f: any) => !f.builtIn && !f.computed)
    .sort((a: any, b: any) => a.position - b.position)

  return (
    <div className="p-6 space-y-6">
      {/* Description */}
      <EditableTextarea
        value={deal.description ?? ''}
        placeholder="Add deal description…"
        onSave={v => onUpdate({ description: v })}
      />

      <Section title="Financials">
        <div className="grid grid-cols-3 gap-3">
          <EditableNumCard label="Asking Price" value={deal.asking_price_k} accent onSave={v => onUpdate({ asking_price_k: v })} />
          <EditableNumCard label="Revenue (TTM)" value={deal.revenue_k} onSave={v => onUpdate({ revenue_k: v })} />
          <EditableNumCard label="SDE" value={deal.sde_k} onSave={v => onUpdate({ sde_k: v })} />
          <EditableNumCard label="EBITDA" value={deal.ebitda_k} onSave={v => onUpdate({ ebitda_k: v })} />
          <EditableNumCard label="GM-Adjusted CF" value={deal.gm_adjusted_k} onSave={v => onUpdate({ gm_adjusted_k: v })} />
          <div className="rounded-lg p-3 border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <p className="font-mono text-[9px] tracking-wider uppercase mb-1" style={{ color: 'var(--muted)' }}>Price Multiple</p>
            <p className="font-mono text-[15px] font-medium" style={{ color: 'var(--subtext)' }}>{multiple ? `${multiple}×` : '—'}</p>
          </div>
        </div>
      </Section>

      <Section title="Operations">
        <div className="grid grid-cols-2 gap-2">
          <EditableOpRow label="Years in Business" value={deal.years_in_business} displayFn={v => `${v} yrs`} onSave={v => onUpdate({ years_in_business: v })} />
          <EditableOpRow label="Employees" value={deal.employees} onSave={v => onUpdate({ employees: v })} />
          <EditableOpRow label="Owner Dependence" value={deal.owner_dependence} displayFn={v => `${v}/10`} max={10} warn={(deal.owner_dependence ?? 0) >= 6} onSave={v => onUpdate({ owner_dependence: v })} />
          <EditableOpRow label="Top Customer %" value={deal.top_customer_pct} displayFn={v => `${v}%`} warn={(deal.top_customer_pct ?? 0) > 30} onSave={v => onUpdate({ top_customer_pct: v })} />
          <EditableOpRow label="Recurring Rev %" value={deal.recurring_revenue_pct} displayFn={v => `${v}%`} good={(deal.recurring_revenue_pct ?? 0) >= 50} onSave={v => onUpdate({ recurring_revenue_pct: v })} />
          <EditableToggleRow label="Remote Operable" value={!!deal.remote_operable} onToggle={v => onUpdate({ remote_operable: v })} />
        </div>
      </Section>

      <Section title="Follow-up">
        <EditableDate value={deal.next_follow_up_at ?? ''} onSave={v => onUpdate({ next_follow_up_at: v || undefined })} />
      </Section>

      {customFields.length > 0 && (
        <Section title="Deal Info">
          <div className="grid grid-cols-2 gap-2">
            {customFields.map((f: any) => (
              <EditableCustomField
                key={f.id}
                field={f}
                value={deal.custom_fields?.[f.id] ?? null}
                onSave={v => onUpdate({ custom_fields: { ...deal.custom_fields, [f.id]: v } })}
              />
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}

// ── Timeline Tab ───────────────────────────────────────────────────────────
function TimelineTab({ deal, onAddNote }: { deal: any; onAddNote: (t: string) => void }) {
  const [note, setNote] = useState('')

  const icons: Record<string, string> = {
    note: '💬', task: '☑️', stage_change: '→', document_added: '📎',
    score_updated: '📊', milestone_updated: '✓', deal_created: '✦', deal_updated: '✎',
  }

  return (
    <div className="p-6">
      {/* Note input */}
      <div className="mb-6 rounded-xl border p-4" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <p className="font-mono text-[9px] uppercase tracking-widest mb-2" style={{ color: 'var(--muted)' }}>Add Note</p>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Add a note, observation, or next action…"
          rows={3}
          className="w-full rounded-lg px-3 py-2 text-[12px] outline-none border resize-none focus:border-lime-400/50 transition-colors"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}
        />
        <div className="flex justify-end mt-2">
          <button
            onClick={() => { if (note.trim()) { onAddNote(note.trim()); setNote('') } }}
            disabled={!note.trim()}
            className="px-3 py-1.5 rounded-md text-xs font-semibold transition-all disabled:opacity-40"
            style={{ background: 'var(--accent)', color: '#0a0b09' }}
          >
            Post Note
          </button>
        </div>
      </div>

      {/* Events */}
      <div className="space-y-3">
        {deal.timeline.map((e: TimelineEvent) => (
          <div key={e.id} className="flex gap-3">
            <div className="w-7 h-7 rounded-full border flex items-center justify-center text-[11px] shrink-0 mt-0.5" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
              {icons[e.event_type] ?? '·'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded border uppercase tracking-wide" style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--muted)' }}>
                  {e.event_type.replace('_', ' ')}
                </span>
                <span className="font-mono text-[10px]" style={{ color: 'var(--muted)' }}>
                  {formatDistanceToNow(new Date(e.created_at), { addSuffix: true })}
                </span>
              </div>
              {e.event_type === 'note' && (
                <p className="text-[12px] leading-relaxed" style={{ color: 'var(--subtext)' }}>{String(e.payload.text ?? '')}</p>
              )}
              {e.event_type === 'stage_change' && (
                <p className="font-mono text-[11px]" style={{ color: 'var(--subtext)' }}>
                  {String(e.payload.from)} → {String(e.payload.to)}
                </p>
              )}
              {e.event_type === 'task' && (
                <p className="text-[12px]" style={{ color: 'var(--subtext)' }}>
                  {String(e.payload.text ?? '')} {e.payload.due ? `· Due ${String(e.payload.due)}` : ''}
                </p>
              )}
              {e.event_type === 'document_added' && (
                <p className="font-mono text-[11px]" style={{ color: 'var(--subtext)' }}>📎 {String(e.payload.filename ?? '')}</p>
              )}
              {['deal_created','deal_updated','score_updated','milestone_updated'].includes(e.event_type) && (
                <p className="text-[12px]" style={{ color: 'var(--subtext)' }}>{String(e.payload.note ?? e.event_type)}</p>
              )}
            </div>
          </div>
        ))}
        {deal.timeline.length === 0 && (
          <p className="font-mono text-[11px] text-center py-8" style={{ color: 'var(--muted)' }}>No events yet.</p>
        )}
      </div>
    </div>
  )
}

// ── Scoring Tab ────────────────────────────────────────────────────────────
function ScoringTab({ deal, categories, onUpdate }: { deal: any; categories: any[]; onUpdate: (s: any) => void }) {
  const score = deal.score
  return (
    <div className="p-6 space-y-4">
      {/* Overall */}
      <div className="rounded-xl border p-4 flex items-center gap-4" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <ScoreBadge letter={score.letter} total={score.total} size="lg" />
        <div className="flex-1">
          <p className="font-mono text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--muted)' }}>Overall Score</p>
          <div className="h-2 rounded-full overflow-hidden mb-1" style={{ background: 'var(--border)' }}>
            <div className={clsx('h-full rounded-full', barColor(score.total))} style={{ width: `${score.total}%` }} />
          </div>
          <p className="font-mono text-[11px]" style={{ color: 'var(--muted)' }}>{score.total}/100 weighted average</p>
        </div>
      </div>

      {/* Categories */}
      {categories.map((cat: any) => {
        const sc = deal.scores.find((s: any) => s.category_id === cat.id)
        const val = sc?.value ?? 0
        return (
          <div key={cat.id} className="rounded-xl border p-4" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>{cat.name}</p>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--muted)' }}>{cat.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px]" style={{ color: 'var(--muted)' }}>wt {cat.weight}%</span>
                <span className={clsx('font-mono text-[15px] font-bold', scoreColor(score.letter))}>{val}</span>
              </div>
            </div>
            <input
              type="range"
              min={0} max={100}
              value={val}
              onChange={e => onUpdate({ category_id: cat.id, value: Number(e.target.value), notes: sc?.notes ?? '' })}
              className="w-full"
            />
            <div className="flex justify-between font-mono text-[9px] mt-0.5" style={{ color: 'var(--muted)' }}>
              <span>0</span><span>50</span><span>100</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Diligence Tab ──────────────────────────────────────────────────────────
function DiligenceTab({ deal, onUpdate }: { deal: any; onUpdate: (s: DealMilestoneStatus) => void }) {
  const categories = Array.from(new Set(DEFAULT_MILESTONES.map(m => m.category)))
  const completed = deal.milestones.filter((m: any) => m.status === 'completed').length
  const total = deal.milestones.length
  const pct = Math.round((completed / total) * 100)

  return (
    <div className="p-6 space-y-4">
      {/* Progress */}
      <div className="rounded-xl border p-4" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between mb-2">
          <p className="font-mono text-[10px] uppercase tracking-widest" style={{ color: 'var(--muted)' }}>Progress</p>
          <p className="font-mono text-[12px]" style={{ color: 'var(--accent)' }}>{completed}/{total} complete</p>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
          <div className="h-full rounded-full bg-lime-400 transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {categories.map(cat => (
        <div key={cat}>
          <p className="font-mono text-[9px] uppercase tracking-widest mb-2 px-1" style={{ color: 'var(--muted)' }}>{cat}</p>
          <div className="space-y-1">
            {DEFAULT_MILESTONES.filter(m => m.category === cat).map(milestone => {
              const ms = deal.milestones.find((m: any) => m.milestone_id === milestone.id)
              const status = ms?.status ?? 'not_started'
              const cycleStatus = (s: string) => {
                if (s === 'not_started') return 'in_progress'
                if (s === 'in_progress') return 'completed'
                return 'not_started'
              }
              return (
                <div
                  key={milestone.id}
                  onClick={() => onUpdate({ milestone_id: milestone.id, status: cycleStatus(status) as any, notes: ms?.notes ?? '', completed_at: cycleStatus(status) === 'completed' ? new Date().toISOString() : undefined })}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors hover:border-zinc-600"
                  style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
                >
                  <div className={clsx('w-4 h-4 rounded border flex items-center justify-center shrink-0 text-[9px]',
                    status === 'completed'  ? 'bg-lime-400 border-lime-400 text-black' :
                    status === 'in_progress'? 'border-amber-400' : 'border-zinc-600'
                  )}>
                    {status === 'completed' ? '✓' : status === 'in_progress' ? '·' : ''}
                  </div>
                  <span className="text-[12px] flex-1" style={{ color: status === 'completed' ? 'var(--muted)' : 'var(--text)', textDecoration: status === 'completed' ? 'line-through' : 'none' }}>
                    {milestone.name}
                  </span>
                  <span className="font-mono text-[9px] uppercase" style={{ color: status === 'completed' ? 'var(--accent)' : status === 'in_progress' ? 'var(--warn)' : 'var(--muted)' }}>
                    {status.replace('_', ' ')}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Documents Tab ──────────────────────────────────────────────────────────
function DocumentsTab({ deal }: { deal: any }) {
  function fmtSize(bytes: number) {
    if (bytes > 1_000_000) return `${(bytes/1_000_000).toFixed(1)} MB`
    return `${Math.round(bytes/1000)} KB`
  }

  const icons: Record<string, string> = {
    'application/pdf': '📄',
    'application/vnd.ms-excel': '📊',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '📊',
  }

  return (
    <div className="p-6 space-y-3">
      <div
        className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors hover:border-lime-400/40"
        style={{ borderColor: 'var(--border)' }}
      >
        <Upload size={20} className="mx-auto mb-2" style={{ color: 'var(--muted)' }} />
        <p className="text-[12px]" style={{ color: 'var(--muted)' }}>Drop files here or <span style={{ color: 'var(--accent)' }}>browse</span></p>
        <p className="font-mono text-[10px] mt-1" style={{ color: 'var(--muted)' }}>PDF, XLSX, DOCX supported</p>
      </div>

      {deal.documents.length === 0 && (
        <p className="font-mono text-[11px] text-center py-4" style={{ color: 'var(--muted)' }}>No documents uploaded.</p>
      )}

      {deal.documents.map((doc: any) => (
        <div key={doc.id} className="flex items-center gap-3 px-4 py-3 rounded-xl border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <span className="text-xl">{icons[doc.mime_type] ?? '📎'}</span>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-medium truncate" style={{ color: 'var(--text)' }}>{doc.filename}</p>
            <p className="font-mono text-[10px]" style={{ color: 'var(--muted)' }}>
              {fmtSize(doc.size_bytes)} · {new Date(doc.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Contacts Tab ───────────────────────────────────────────────────────────
function ContactsTab({ deal }: { deal: any }) {
  const { addContact, addDealContact, removeDealContact } = useStore()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', organization: '', email: '', phone: '', type: 'seller' as ContactType, role: '' })

  const typeColors: Record<string, string> = {
    seller: 'text-lime-400 bg-lime-400/10 border-lime-400/30',
    broker: 'text-sky-400 bg-sky-400/10 border-sky-400/30',
    advisor: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
    other: 'text-zinc-400 bg-zinc-400/10 border-zinc-400/30',
  }

  function handleAdd() {
    if (!form.name.trim()) return
    const contact: Contact = {
      id: `c${Date.now()}`,
      name: form.name.trim(),
      organization: form.organization.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      type: form.type,
      notes: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    addContact(contact)
    addDealContact(deal.id, { contact, relationship_role: form.role.trim() })
    setForm({ name: '', organization: '', email: '', phone: '', type: 'seller', role: '' })
    setShowForm(false)
  }

  const inp = 'w-full px-2.5 py-1.5 rounded-md text-[12px] outline-none border focus:border-lime-400/50 transition-colors'
  const inpStyle = { background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }

  return (
    <div className="p-6 space-y-3">
      {deal.contacts.length === 0 && !showForm && (
        <p className="font-mono text-[11px] text-center py-6" style={{ color: 'var(--muted)' }}>No contacts linked.</p>
      )}
      {deal.contacts.map(({ contact, relationship_role }: any) => (
        <div key={contact.id} className="rounded-xl border p-4 group" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <p className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>{contact.name}</p>
              <p className="text-[11px]" style={{ color: 'var(--muted)' }}>{contact.organization}</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="flex flex-col items-end gap-1">
                <span className={clsx('font-mono text-[9px] px-2 py-0.5 rounded border uppercase', typeColors[contact.type] ?? typeColors.other)}>
                  {contact.type}
                </span>
                <span className="font-mono text-[9px]" style={{ color: 'var(--muted)' }}>{relationship_role}</span>
              </div>
              <button
                onClick={() => removeDealContact(deal.id, contact.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:text-red-400 shrink-0 mt-0.5"
                style={{ color: 'var(--muted)' }}
                title="Remove from this deal"
              >
                <X size={13} />
              </button>
            </div>
          </div>
          <div className="font-mono text-[10px] space-y-0.5" style={{ color: 'var(--subtext)' }}>
            {contact.email && <p>✉ {contact.email}</p>}
            {contact.phone && <p>☎ {contact.phone}</p>}
          </div>
        </div>
      ))}

      {showForm ? (
        <div className="rounded-xl border p-4 space-y-3" style={{ background: 'var(--card)', borderColor: 'rgba(200,240,96,0.25)' }}>
          <p className="font-mono text-[9px] uppercase tracking-widest" style={{ color: 'var(--muted)' }}>New Contact</p>
          <div className="grid grid-cols-2 gap-2">
            <input className={inp} style={inpStyle} placeholder="Name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <input className={inp} style={inpStyle} placeholder="Organization" value={form.organization} onChange={e => setForm(f => ({ ...f, organization: e.target.value }))} />
            <input className={inp} style={inpStyle} placeholder="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            <input className={inp} style={inpStyle} placeholder="Phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            <select className={inp} style={inpStyle} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as ContactType }))}>
              {(['seller','broker','advisor','other'] as ContactType[]).map(t => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
            <input className={inp} style={inpStyle} placeholder="Role in deal (e.g. Seller)" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={!form.name.trim()}
              className="px-3 py-1.5 rounded-md text-[12px] font-semibold transition-all disabled:opacity-40"
              style={{ background: 'var(--accent)', color: '#0a0b09' }}
            >
              Add Contact
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-3 py-1.5 rounded-md text-[12px] font-mono border transition-all hover:text-white"
              style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl border border-dashed text-[12px] font-mono transition-colors hover:border-lime-400/50 hover:text-lime-400"
          style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
        >
          <Plus size={13} /> Add Contact
        </button>
      )}
    </div>
  )
}

// ── Editable helpers ───────────────────────────────────────────────────────

function EditableTextarea({ value, placeholder, onSave }: { value: string; placeholder: string; onSave: (v: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [local, setLocal] = useState(value)
  useEffect(() => { setLocal(value) }, [value])

  if (editing) {
    return (
      <textarea
        autoFocus
        rows={3}
        value={local}
        onChange={e => setLocal(e.target.value)}
        onBlur={() => { onSave(local); setEditing(false) }}
        className="w-full text-[13px] leading-relaxed rounded-lg px-3 py-2 outline-none border resize-none focus:border-lime-400/50 transition-colors"
        style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text)' }}
      />
    )
  }
  return (
    <p
      onClick={() => setEditing(true)}
      className="text-[13px] leading-relaxed cursor-text rounded px-1 -mx-1 hover:bg-white/5 transition-colors min-h-[1.5rem]"
      style={{ color: value ? 'var(--subtext)' : 'var(--muted)' }}
    >
      {value || placeholder}
    </p>
  )
}

function EditableNumCard({ label, value, accent, onSave }: { label: string; value?: number; accent?: boolean; onSave: (v: number | undefined) => void }) {
  const [editing, setEditing] = useState(false)
  const [local, setLocal] = useState('')

  function start() { setEditing(true); setLocal(String(value ?? '')) }
  function save() { setEditing(false); onSave(local === '' ? undefined : Number(local)) }

  return (
    <div
      className="rounded-lg p-3 border cursor-text"
      style={{ background: 'var(--card)', borderColor: editing ? 'rgba(200,240,96,0.4)' : 'var(--border)' }}
      onClick={() => !editing && start()}
    >
      <p className="font-mono text-[9px] tracking-wider uppercase mb-1" style={{ color: 'var(--muted)' }}>{label}</p>
      {editing ? (
        <input
          autoFocus type="number" value={local}
          onChange={e => setLocal(e.target.value)}
          onBlur={save}
          onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false) }}
          className="font-mono text-[15px] font-medium w-full bg-transparent outline-none"
          style={{ color: accent ? 'var(--accent)' : 'var(--text)' }}
          placeholder="e.g. 2500"
        />
      ) : (
        <p className="font-mono text-[15px] font-medium" style={{ color: accent ? 'var(--accent)' : value != null ? 'var(--text)' : 'var(--muted)' }}>
          {value != null ? formatCurrency(value) : '—'}
        </p>
      )}
    </div>
  )
}

function EditableOpRow({ label, value, displayFn, max, warn, good, onSave }: {
  label: string; value?: number; displayFn?: (v: number) => string
  max?: number; warn?: boolean; good?: boolean; onSave: (v: number | undefined) => void
}) {
  const [editing, setEditing] = useState(false)
  const [local, setLocal] = useState('')

  function start() { setEditing(true); setLocal(String(value ?? '')) }
  function save() { setEditing(false); onSave(local === '' ? undefined : Number(local)) }
  const display = value != null ? (displayFn ? displayFn(value) : String(value)) : '—'

  return (
    <div
      className="flex items-center justify-between px-3 py-2 rounded-lg border cursor-text"
      style={{ background: 'var(--card)', borderColor: editing ? 'rgba(200,240,96,0.4)' : 'var(--border)' }}
      onClick={() => !editing && start()}
    >
      <span className="text-[11px] shrink-0" style={{ color: 'var(--muted)' }}>{label}</span>
      {editing ? (
        <input
          autoFocus type="number" value={local}
          max={max}
          onChange={e => setLocal(e.target.value)}
          onBlur={save}
          onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false) }}
          className="font-mono text-[12px] font-medium bg-transparent outline-none text-right w-20"
          style={{ color: 'var(--accent)' }}
        />
      ) : (
        <span className="font-mono text-[12px] font-medium" style={{ color: warn ? 'var(--warn)' : good ? 'var(--accent)' : 'var(--text)' }}>
          {display}
        </span>
      )}
    </div>
  )
}

function EditableToggleRow({ label, value, onToggle }: { label: string; value: boolean; onToggle: (v: boolean) => void }) {
  return (
    <div
      className="flex items-center justify-between px-3 py-2 rounded-lg border cursor-pointer"
      style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      onClick={() => onToggle(!value)}
    >
      <span className="text-[11px]" style={{ color: 'var(--muted)' }}>{label}</span>
      <span className="font-mono text-[12px] font-medium" style={{ color: value ? 'var(--accent)' : 'var(--text)' }}>
        {value ? 'Yes' : 'No'}
      </span>
    </div>
  )
}

function EditableDate({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <Clock size={13} style={{ color: value && new Date(value) < new Date() ? 'var(--danger)' : 'var(--muted)' }} />
      <input
        type="date"
        value={value}
        onChange={e => onSave(e.target.value)}
        className="font-mono text-[12px] bg-transparent outline-none border-b border-transparent hover:border-zinc-600 focus:border-lime-400/50 transition-colors"
        style={{ color: value ? (new Date(value) < new Date() ? 'var(--danger)' : 'var(--subtext)') : 'var(--muted)' }}
      />
    </div>
  )
}

function EditableCustomField({ field, value, onSave }: { field: any; value: any; onSave: (v: any) => void }) {
  const [editing, setEditing] = useState(false)
  const [local, setLocal] = useState('')

  function start() { setEditing(true); setLocal(String(value ?? '')) }
  function save() {
    setEditing(false)
    const isNumeric = ['number', 'currency', 'percentage'].includes(field.type)
    onSave(isNumeric ? (local === '' ? null : Number(local)) : local || null)
  }

  const display = value != null && value !== ''
    ? (field.type === 'percentage' ? `${value}%` : field.type === 'currency' ? formatCurrency(Number(value)) : String(value))
    : '—'

  if (field.type === 'select') {
    return (
      <div className="flex items-center justify-between px-3 py-2 rounded-lg border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <span className="text-[11px] shrink-0" style={{ color: 'var(--muted)' }}>{field.label}</span>
        <select
          value={String(value ?? '')}
          onChange={e => onSave(e.target.value || null)}
          className="font-mono text-[12px] font-medium bg-transparent outline-none text-right"
          style={{ color: 'var(--text)' }}
        >
          <option value="">—</option>
          {(field.options ?? []).map((o: string) => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
    )
  }

  return (
    <div
      className="flex items-center justify-between px-3 py-2 rounded-lg border cursor-text"
      style={{ background: 'var(--card)', borderColor: editing ? 'rgba(200,240,96,0.4)' : 'var(--border)' }}
      onClick={() => !editing && start()}
    >
      <span className="text-[11px] shrink-0" style={{ color: 'var(--muted)' }}>{field.label}</span>
      {editing ? (
        <input
          autoFocus
          type={['number','currency','percentage'].includes(field.type) ? 'number' : 'text'}
          value={local}
          onChange={e => setLocal(e.target.value)}
          onBlur={save}
          onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false) }}
          className="font-mono text-[12px] font-medium bg-transparent outline-none text-right w-24"
          style={{ color: 'var(--text)' }}
        />
      ) : (
        <span className="font-mono text-[12px] font-medium" style={{ color: value != null && value !== '' ? 'var(--text)' : 'var(--muted)' }}>
          {display}
        </span>
      )}
    </div>
  )
}

// ── Helpers ────────────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-mono text-[9px] uppercase tracking-widest mb-2 pb-1.5 border-b" style={{ color: 'var(--muted)', borderColor: 'var(--border)' }}>{title}</p>
      {children}
    </div>
  )
}
