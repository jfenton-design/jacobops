'use client'
import { useState, useMemo, useRef, useEffect } from 'react'
import { LayoutGrid, List, Plus, Search, Trash2 } from 'lucide-react'
import { useStore } from '@/lib/store'
import { computeScore, formatCurrency, stageColor, stageDot, scoreBg, barColor } from '@/lib/utils'
import { ScoreBadge } from '@/components/ui/ScoreBadge'
import { DealDrawer } from './DealDrawer'
import { AddDealModal } from './AddDealModal'
import type { Deal } from '@/types'
import clsx from 'clsx'
import {
  DndContext, DragOverlay, closestCenter, PointerSensor, useSensor, useSensors,
  type DragStartEvent, type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

type View = 'kanban' | 'table'

export function PipelinePage() {
  const { deals, stages, categories, moveDeal, deleteDeal, setActiveDeal, activeDealId } = useStore()
  const [view, setView] = useState<View>('kanban')
  const [search, setSearch] = useState('')
  const [filterStage, setFilterStage] = useState('all')
  const [addOpen, setAddOpen] = useState(false)
  const [activeCard, setActiveCard] = useState<Deal | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const scored = useMemo(
    () => deals.map(d => ({ ...d, score: computeScore(d, categories) })),
    [deals, categories]
  )

  const filtered = scored.filter(d => {
    const q = search.toLowerCase()
    const matchQ = !q || d.name.toLowerCase().includes(q) || (d.industry ?? '').toLowerCase().includes(q) || (d.location ?? '').toLowerCase().includes(q)
    const matchS = filterStage === 'all' || d.stage_id === filterStage
    return matchQ && matchS
  })

  const active = scored.filter(d => d.status === 'active')
  const avgScore = active.length ? Math.round(active.reduce((s, d) => s + d.score.total, 0) / active.length) : 0
  const loi = scored.filter(d => ['loi', 'due_diligence'].includes(d.stage_id))
  const pipeValue = loi.reduce((s, d) => s + (d.asking_price_k ?? 0), 0)

  function handleDragStart(e: DragStartEvent) {
    const deal = scored.find(d => d.id === e.active.id)
    if (deal) setActiveCard(deal)
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveCard(null)
    const { active, over } = e
    if (!over) return
    // over.id may be a stage id or a deal id — find which stage it belongs to
    const stageId = stages.find(s => s.id === over.id)?.id
      ?? scored.find(d => d.id === over.id)?.stage_id
    if (stageId && stageId !== scored.find(d => d.id === active.id)?.stage_id) {
      moveDeal(String(active.id), stageId)
    }
  }

  const activeDeal = activeDealId ? scored.find(d => d.id === activeDealId) ?? null : null

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Topbar */}
      <div className="flex items-center gap-3 px-6 h-14 border-b shrink-0" style={{ borderColor: 'var(--border)' }}>
        <h2 className="font-display text-lg flex-1">
          Pipeline
          <span className="font-mono text-xs ml-2" style={{ color: 'var(--muted)' }}>{filtered.length} deals</span>
        </h2>

        {/* Search */}
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search…"
            className="pl-7 pr-3 py-1.5 rounded-md text-xs font-mono outline-none border focus:border-lime-400/50 transition-colors w-44"
            style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text)' }}
          />
        </div>

        {/* Stage filter */}
        <select
          value={filterStage}
          onChange={e => setFilterStage(e.target.value)}
          className="px-2 py-1.5 rounded-md text-xs font-mono outline-none border transition-colors cursor-pointer"
          style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--subtext)' }}
        >
          <option value="all">All Stages</option>
          {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>

        {/* View toggle */}
        <div className="flex rounded-md overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
          {(['kanban', 'table'] as View[]).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={clsx('px-3 py-1.5 text-xs font-mono flex items-center gap-1.5 transition-all', view === v ? 'text-lime-400' : 'hover:text-white')}
              style={view === v ? { background: 'var(--card)', color: undefined } : { background: 'var(--surface)', color: 'var(--muted)' }}
            >
              {v === 'kanban' ? <LayoutGrid size={11} /> : <List size={11} />}
              {v}
            </button>
          ))}
        </div>

        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all hover:opacity-90"
          style={{ background: 'var(--accent)', color: '#0a0b09' }}
        >
          <Plus size={12} /> Add Deal
        </button>
      </div>

      {/* Stats strip */}
      <div className="flex border-b shrink-0 divide-x" style={{ borderColor: 'var(--border)', divideColor: 'var(--border)' }}>
        {[
          { label: 'Active', value: String(active.length), color: 'var(--accent2)' },
          { label: 'Avg Score', value: String(avgScore), color: 'var(--accent)' },
          { label: 'LOI + DD', value: formatCurrency(pipeValue), color: 'var(--warn)' },
          { label: 'Closed', value: String(scored.filter(d => d.stage_id === 'closed').length), color: '#22c55e' },
          { label: 'Passed', value: String(scored.filter(d => d.stage_id === 'passed').length), color: 'var(--danger)' },
        ].map(s => (
          <div key={s.label} className="flex-1 px-5 py-3" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <p className="font-mono text-[9px] tracking-widest uppercase mb-1" style={{ color: 'var(--muted)' }}>{s.label}</p>
            <p className="font-mono text-lg font-medium" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        {view === 'kanban' ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <KanbanView deals={filtered} onOpen={id => setActiveDeal(id)} onDelete={deleteDeal} />
            <DragOverlay>
              {activeCard && <DealCard deal={activeCard} onOpen={() => {}} onDelete={() => {}} isDragging />}
            </DragOverlay>
          </DndContext>
        ) : (
          <TableView deals={filtered} onOpen={id => setActiveDeal(id)} onDelete={deleteDeal} />
        )}
      </div>

      {/* Deal drawer */}
      {activeDeal && (
        <DealDrawer deal={activeDeal} onClose={() => setActiveDeal(null)} />
      )}

      {addOpen && <AddDealModal onClose={() => setAddOpen(false)} />}
    </div>
  )
}

// ── Kanban ─────────────────────────────────────────────────────────────────
function KanbanView({ deals, onOpen, onDelete }: { deals: ReturnType<typeof computeScore> extends infer S ? (Deal & { score: S })[] : never; onOpen: (id: string) => void; onDelete: (id: string) => void }) {
  const { stages } = useStore()

  return (
    <div className="flex gap-3 p-5 h-full min-w-max">
      {stages.map(stage => {
        const stageDeals = (deals as any[]).filter((d: any) => d.stage_id === stage.id)
        return (
          <SortableContext key={stage.id} id={stage.id} items={stageDeals.map((d: any) => d.id)} strategy={verticalListSortingStrategy}>
            <KanbanColumn stage={stage} deals={stageDeals} onOpen={onOpen} onDelete={onDelete} />
          </SortableContext>
        )
      })}
    </div>
  )
}

function KanbanColumn({ stage, deals, onOpen, onDelete }: { stage: any; deals: any[]; onOpen: (id: string) => void; onDelete: (id: string) => void }) {
  const { setNodeRef, isOver } = useSortable({ id: stage.id, data: { type: 'column' } })
  return (
    <div
      ref={setNodeRef}
      className="w-72 flex flex-col rounded-xl border overflow-hidden shrink-0 transition-all"
      style={{
        background: isOver ? 'rgba(200,240,96,0.03)' : 'var(--surface)',
        borderColor: isOver ? 'rgba(200,240,96,0.3)' : 'var(--border)',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: stage.color }} />
        <span className="text-[12px] font-semibold flex-1" style={{ color: 'var(--text)' }}>{stage.name}</span>
        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded border" style={{ color: 'var(--muted)', background: 'var(--card)', borderColor: 'var(--border)' }}>
          {deals.length}
        </span>
      </div>
      {/* Cards */}
      <div className="flex flex-col gap-2 p-2 flex-1 overflow-y-auto">
        {deals.length === 0 && (
          <p className="text-center font-mono text-[10px] py-6" style={{ color: 'var(--muted)' }}>Empty</p>
        )}
        {deals.map((d: any) => (
          <DealCard key={d.id} deal={d} onOpen={onOpen} onDelete={onDelete} />
        ))}
      </div>
    </div>
  )
}

function DealCard({ deal, onOpen, onDelete, isDragging }: { deal: any; onOpen: (id: string) => void; onDelete: (id: string) => void; isDragging?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSortDragging } = useSortable({ id: deal.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortDragging ? 0.4 : 1,
  }

  const score = deal.score
  const multiple = deal.sde_k && deal.asking_price_k ? (deal.asking_price_k / deal.sde_k).toFixed(1) : null

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, background: 'var(--card)', borderColor: 'var(--border)' }}
      className="rounded-lg border p-3 cursor-pointer hover:border-zinc-600 transition-all group"
      onClick={() => onOpen(deal.id)}
      {...attributes}
      {...listeners}
    >
      {/* Top row */}
      <div className="flex items-start gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold leading-tight truncate" style={{ color: 'var(--text)' }}>{deal.name}</p>
          {deal.industry && (
            <p className="font-mono text-[10px] mt-0.5 truncate" style={{ color: 'var(--muted)' }}>{deal.industry}</p>
          )}
        </div>
        <ScoreBadge letter={score.letter} total={score.total} size="sm" />
        <button
          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:text-red-400"
          style={{ color: 'var(--muted)' }}
          onClick={(e) => { e.stopPropagation(); onDelete(deal.id) }}
          title="Delete deal"
        >
          <Trash2 size={12} />
        </button>
      </div>

      {/* Chips */}
      <div className="flex flex-wrap gap-1 mb-2">
        {deal.asking_price_k && (
          <Chip label={formatCurrency(deal.asking_price_k)} highlight />
        )}
        {deal.sde_k && (
          <Chip label={`SDE ${formatCurrency(deal.sde_k)}`} />
        )}
        {multiple && (
          <Chip label={`${multiple}×`} />
        )}
      </div>

      {/* Score bar */}
      <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
        <div
          className={clsx('h-full rounded-full transition-all', barColor(score.total))}
          style={{ width: `${score.total}%` }}
        />
      </div>
    </div>
  )
}

function Chip({ label, highlight }: { label: string; highlight?: boolean }) {
  return (
    <span
      className="font-mono text-[10px] px-1.5 py-0.5 rounded border"
      style={highlight
        ? { background: 'rgba(200,240,96,0.08)', borderColor: 'rgba(200,240,96,0.25)', color: 'var(--accent)' }
        : { background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--subtext)' }
      }
    >
      {label}
    </span>
  )
}

// ── Table view ─────────────────────────────────────────────────────────────
function TableView({ deals, onOpen, onDelete }: { deals: any[]; onOpen: (id: string) => void; onDelete: (id: string) => void }) {
  const { stages, fieldDefs, updateDeal, moveDeal } = useStore()
  const cols = [...fieldDefs].sort((a, b) => a.position - b.position).filter(f => f.showInTable)

  return (
    <div className="p-5">
      <div className="rounded-xl border overflow-hidden overflow-x-auto" style={{ borderColor: 'var(--border)' }}>
        <table className="border-collapse" style={{ minWidth: 'max-content', width: '100%' }}>
          <thead>
            <tr style={{ background: 'var(--surface)' }}>
              {cols.map(f => (
                <th key={f.id} className="px-4 py-3 text-left font-mono text-[10px] tracking-widest uppercase border-b whitespace-nowrap" style={{ color: 'var(--muted)', borderColor: 'var(--border)' }}>
                  {f.label}
                </th>
              ))}
              <th className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }} />
            </tr>
          </thead>
          <tbody>
            {deals.map((deal, i) => (
              <TableRow
                key={deal.id}
                deal={deal}
                cols={cols}
                stages={stages}
                rowIndex={i}
                onOpen={onOpen}
                onDelete={onDelete}
                updateDeal={updateDeal}
                moveDeal={moveDeal}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TableRow({ deal, cols, stages, rowIndex, onOpen, onDelete, updateDeal, moveDeal }: {
  deal: any; cols: any[]; stages: any[]; rowIndex: number
  onOpen: (id: string) => void; onDelete: (id: string) => void
  updateDeal: (id: string, patch: any) => void; moveDeal: (id: string, stageId: string) => void
}) {
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editVal, setEditVal] = useState<string>('')

  const nonEditable = new Set(['status_updated', 'primary_contact', 'ebitda_margin'])

  function getRaw(field: any) {
    if (field.builtIn) return deal[field.builtIn as string] ?? ''
    return deal.custom_fields?.[field.id] ?? ''
  }

  function startEdit(e: React.MouseEvent, field: any) {
    e.stopPropagation()
    if (nonEditable.has(field.id) || field.computed) return
    setEditingField(field.id)
    setEditVal(String(getRaw(field)))
  }

  function save(field: any, val: string) {
    setEditingField(null)
    if (field.builtIn === 'stage_id') {
      if (val !== deal.stage_id) moveDeal(deal.id, val)
      return
    }
    if (field.builtIn) {
      const numericKeys = ['revenue_k','ebitda_k','asking_price_k','sde_k','gm_adjusted_k']
      const parsed = numericKeys.includes(field.builtIn) ? (val === '' ? undefined : Number(val)) : val
      updateDeal(deal.id, { [field.builtIn]: parsed })
      return
    }
    const isNumeric = ['number','currency','percentage'].includes(field.type)
    const parsed = isNumeric ? (val === '' ? null : Number(val)) : val || null
    updateDeal(deal.id, { custom_fields: { ...deal.custom_fields, [field.id]: parsed } })
  }

  return (
    <tr
      onClick={() => !editingField && onOpen(deal.id)}
      className="border-b cursor-pointer transition-colors hover:bg-white/[0.02] group"
      style={{ borderColor: 'var(--border)', background: rowIndex % 2 === 0 ? 'var(--surface)' : 'var(--bg)' }}
    >
      {cols.map(f => {
        const isEditing = editingField === f.id
        const isLocked = nonEditable.has(f.id) || !!f.computed
        return (
          <td
            key={f.id}
            className="px-4 py-2 whitespace-nowrap"
            onClick={e => !isLocked && startEdit(e, f)}
            style={{ cursor: isLocked ? 'default' : 'text' }}
          >
            {isEditing
              ? <CellEditor field={f} value={editVal} stages={stages} onChange={setEditVal} onSave={() => save(f, editVal)} onCancel={() => setEditingField(null)} />
              : <FieldCell field={f} deal={deal} stages={stages} />
            }
          </td>
        )
      })}
      <td className="px-4 py-2" onClick={e => e.stopPropagation()}>
        <button
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:text-red-400"
          style={{ color: 'var(--muted)' }}
          onClick={() => onDelete(deal.id)}
          title="Delete deal"
        >
          <Trash2 size={13} />
        </button>
      </td>
    </tr>
  )
}

function CellEditor({ field, value, stages, onChange, onSave, onCancel }: {
  field: any; value: string; stages: any[]
  onChange: (v: string) => void; onSave: () => void; onCancel: () => void
}) {
  const ref = useRef<HTMLInputElement | HTMLSelectElement | null>(null)
  useEffect(() => { ref.current?.focus() }, [])

  const baseStyle = {
    background: 'var(--card)', borderColor: 'rgba(200,240,96,0.4)', color: 'var(--text)',
    fontSize: 12, fontFamily: 'monospace', outline: 'none',
    border: '1px solid', borderRadius: 4, padding: '2px 6px', width: '100%',
  }

  if (field.builtIn === 'stage_id') {
    return (
      <select
        ref={ref as any}
        value={value}
        style={baseStyle}
        onChange={e => { onChange(e.target.value); onSave() }}
        onBlur={onCancel}
        onKeyDown={e => e.key === 'Escape' && onCancel()}
      >
        {stages.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
    )
  }

  if (field.type === 'select') {
    return (
      <select
        ref={ref as any}
        value={value}
        style={baseStyle}
        onChange={e => { onChange(e.target.value); onSave() }}
        onBlur={onCancel}
        onKeyDown={e => e.key === 'Escape' && onCancel()}
      >
        {(field.options ?? []).map((o: string) => <option key={o} value={o}>{o}</option>)}
      </select>
    )
  }

  return (
    <input
      ref={ref as any}
      type={['number','currency','percentage'].includes(field.type) ? 'number' : 'text'}
      value={value}
      style={baseStyle}
      onChange={e => onChange(e.target.value)}
      onBlur={onSave}
      onKeyDown={e => { if (e.key === 'Enter') onSave(); if (e.key === 'Escape') onCancel() }}
    />
  )
}

function FieldCell({ field, deal, stages }: { field: any; deal: any; stages: any[] }) {
  // Computed fields
  if (field.computed === 'ebitda_margin') {
    if (!deal.ebitda_k || !deal.revenue_k) return <span style={{ color: 'var(--muted)' }}>—</span>
    const pct = ((deal.ebitda_k / deal.revenue_k) * 100).toFixed(1)
    return <span className="font-mono text-[11px]" style={{ color: 'var(--subtext)' }}>{pct}%</span>
  }

  // Built-in fields with special rendering
  if (field.builtIn === 'stage_id') {
    const stage = stages.find((s: any) => s.id === deal.stage_id)
    return (
      <span className={clsx('inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono border', stageColor(deal.stage_id))}>
        <span className={clsx('w-1.5 h-1.5 rounded-full', stageDot(deal.stage_id))} />
        {stage?.name}
      </span>
    )
  }
  if (field.builtIn === 'updated_at') {
    return <span className="font-mono text-[11px]" style={{ color: 'var(--subtext)' }}>
      {new Date(deal.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
    </span>
  }
  if (field.builtIn === 'name') {
    return <span className="text-[13px] font-medium" style={{ color: 'var(--text)' }}>{deal.name}</span>
  }
  if (field.builtIn === 'contacts') {
    const c = deal.contacts[0]?.contact
    return <span className="font-mono text-[11px]" style={{ color: 'var(--subtext)' }}>{c ? c.name : '—'}</span>
  }
  if (field.builtIn === 'revenue_k') {
    return <span className="font-mono text-[12px]" style={{ color: 'var(--text)' }}>{formatCurrency(deal.revenue_k)}</span>
  }
  if (field.builtIn === 'ebitda_k') {
    return <span className="font-mono text-[12px]" style={{ color: 'var(--text)' }}>{formatCurrency(deal.ebitda_k)}</span>
  }
  if (field.builtIn === 'industry') {
    return <span className="font-mono text-[11px]" style={{ color: 'var(--subtext)' }}>{deal.industry ?? '—'}</span>
  }
  if (field.builtIn === 'location') {
    return <span className="font-mono text-[11px]" style={{ color: 'var(--subtext)' }}>{deal.location ?? '—'}</span>
  }

  // Custom fields stored in deal.custom_fields
  const val = deal.custom_fields?.[field.id]
  if (val == null || val === '') return <span style={{ color: 'var(--muted)' }}>—</span>
  if (field.type === 'currency') return <span className="font-mono text-[12px]" style={{ color: 'var(--text)' }}>{formatCurrency(Number(val))}</span>
  if (field.type === 'percentage') return <span className="font-mono text-[11px]" style={{ color: 'var(--subtext)' }}>{val}%</span>
  return <span className="font-mono text-[11px]" style={{ color: 'var(--subtext)' }}>{String(val)}</span>
}
