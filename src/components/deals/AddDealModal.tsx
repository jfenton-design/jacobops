'use client'
import { useState } from 'react'
import { X } from 'lucide-react'
import { useStore, DEFAULT_MILESTONES, DEFAULT_CATEGORIES } from '@/lib/store'
import type { Deal } from '@/types'
import clsx from 'clsx'

const INDUSTRIES = [
  'B2B Services','Home Services','Healthcare','Light Manufacturing',
  'Distribution','Landscaping','HVAC / Mechanical','IT / MSP',
  'Specialty Retail','Staffing','Logistics','Environmental','Other',
]

interface Props { onClose: () => void }

export function AddDealModal({ onClose }: Props) {
  const { stages, addDeal, fieldDefs } = useStore()
  const customFieldDefs = fieldDefs
    .filter(f => !f.builtIn && !f.computed)
    .sort((a, b) => a.position - b.position)

  const [form, setForm] = useState({
    name: '', source: '', stage_id: 'sourced', industry: '', location: '',
    description: '', asking_price_k: '', sde_k: '', gm_adjusted_k: '',
    revenue_k: '', years_in_business: '', employees: '',
    top_customer_pct: '', recurring_revenue_pct: '', owner_dependence: '5',
    remote_operable: false, next_follow_up_at: '',
  })
  const [customFields, setCustomFields] = useState<Record<string, string>>(() =>
    Object.fromEntries(customFieldDefs.map(f => [f.id, '']))
  )

  function set(k: string, v: any) { setForm(f => ({ ...f, [k]: v })) }

  function handleSave() {
    if (!form.name.trim()) return
    const deal: Deal = {
      id: `d${Date.now()}`,
      name: form.name,
      source: form.source,
      stage_id: form.stage_id,
      owner: 'Jacob Fenton',
      description: form.description,
      next_follow_up_at: form.next_follow_up_at || undefined,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      asking_price_k: Number(form.asking_price_k) || undefined,
      sde_k: Number(form.sde_k) || undefined,
      gm_adjusted_k: Number(form.gm_adjusted_k) || undefined,
      revenue_k: Number(form.revenue_k) || undefined,
      industry: form.industry || undefined,
      location: form.location || undefined,
      years_in_business: Number(form.years_in_business) || undefined,
      employees: Number(form.employees) || undefined,
      top_customer_pct: Number(form.top_customer_pct) || undefined,
      recurring_revenue_pct: Number(form.recurring_revenue_pct) || undefined,
      owner_dependence: Number(form.owner_dependence) || undefined,
      remote_operable: form.remote_operable,
      contacts: [],
      scores: DEFAULT_CATEGORIES.map(c => ({ category_id: c.id, value: 0, notes: '' })),
      milestones: DEFAULT_MILESTONES.map(m => ({ milestone_id: m.id, status: 'not_started', notes: '' })),
      timeline: [{
        id: `t${Date.now()}`, deal_id: `d${Date.now()}`,
        actor: 'Jacob Fenton', event_type: 'deal_created',
        payload: { note: 'Deal added.' }, created_at: new Date().toISOString(),
      }],
      documents: [],
      custom_fields: Object.fromEntries(
        customFieldDefs.map(f => {
          const raw = customFields[f.id] ?? ''
          const val = (f.type === 'number' || f.type === 'currency' || f.type === 'percentage')
            ? (raw === '' ? null : Number(raw))
            : raw || null
          return [f.id, val]
        })
      ),
    }
    addDeal(deal)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="rounded-2xl border w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-5 border-b" style={{ borderColor: 'var(--border)' }}>
          <h3 className="font-display text-lg flex-1">Add New Deal</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-white/10 transition-colors" style={{ color: 'var(--muted)' }}>
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <FieldGroup>
            <Field label="Deal Name *">
              <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Midwest HVAC Solutions" className={input} style={inputStyle} />
            </Field>
            <Field label="Source">
              <input value={form.source} onChange={e => set('source', e.target.value)} placeholder="Broker / BizBuySell / Direct" className={input} style={inputStyle} />
            </Field>
          </FieldGroup>

          <FieldGroup>
            <Field label="Stage">
              <select value={form.stage_id} onChange={e => set('stage_id', e.target.value)} className={input} style={inputStyle}>
                {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
            <Field label="Industry">
              <select value={form.industry} onChange={e => set('industry', e.target.value)} className={input} style={inputStyle}>
                <option value="">Select…</option>
                {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </Field>
          </FieldGroup>

          <Field label="Location">
            <input value={form.location} onChange={e => set('location', e.target.value)} placeholder="City, MI" className={input} style={inputStyle} />
          </Field>

          <SectionLabel>Financials (in $K)</SectionLabel>
          <FieldGroup>
            <Field label="Asking Price ($K)"><input type="number" value={form.asking_price_k} onChange={e => set('asking_price_k', e.target.value)} placeholder="e.g. 3000" className={input} style={inputStyle} /></Field>
            <Field label="Revenue ($K)"><input type="number" value={form.revenue_k} onChange={e => set('revenue_k', e.target.value)} placeholder="e.g. 4000" className={input} style={inputStyle} /></Field>
          </FieldGroup>
          <FieldGroup>
            <Field label="SDE ($K)"><input type="number" value={form.sde_k} onChange={e => set('sde_k', e.target.value)} placeholder="e.g. 750" className={input} style={inputStyle} /></Field>
            <Field label="GM-Adjusted CF ($K)"><input type="number" value={form.gm_adjusted_k} onChange={e => set('gm_adjusted_k', e.target.value)} placeholder="e.g. 300" className={input} style={inputStyle} /></Field>
          </FieldGroup>

          <SectionLabel>Operations</SectionLabel>
          <FieldGroup>
            <Field label="Years in Business"><input type="number" value={form.years_in_business} onChange={e => set('years_in_business', e.target.value)} placeholder="e.g. 15" className={input} style={inputStyle} /></Field>
            <Field label="Employees"><input type="number" value={form.employees} onChange={e => set('employees', e.target.value)} placeholder="e.g. 12" className={input} style={inputStyle} /></Field>
          </FieldGroup>
          <FieldGroup>
            <Field label="Top Customer % (concentration)"><input type="number" value={form.top_customer_pct} onChange={e => set('top_customer_pct', e.target.value)} placeholder="e.g. 20" className={input} style={inputStyle} /></Field>
            <Field label="Recurring Revenue %"><input type="number" value={form.recurring_revenue_pct} onChange={e => set('recurring_revenue_pct', e.target.value)} placeholder="e.g. 60" className={input} style={inputStyle} /></Field>
          </FieldGroup>
          <FieldGroup>
            <Field label={`Owner Dependence (${form.owner_dependence}/10)`}>
              <input type="range" min={1} max={10} value={form.owner_dependence} onChange={e => set('owner_dependence', e.target.value)} className="w-full mt-2" />
            </Field>
            <Field label="Remote Operable">
              <div className="flex gap-3 mt-1">
                {['Yes','No'].map(v => (
                  <label key={v} className="flex items-center gap-1.5 cursor-pointer text-[12px]" style={{ color: 'var(--subtext)' }}>
                    <input type="radio" checked={form.remote_operable === (v==='Yes')} onChange={() => set('remote_operable', v==='Yes')} />
                    {v}
                  </label>
                ))}
              </div>
            </Field>
          </FieldGroup>

          <Field label="Next Follow-up">
            <input type="date" value={form.next_follow_up_at} onChange={e => set('next_follow_up_at', e.target.value)} className={input} style={inputStyle} />
          </Field>

          <Field label="Notes / Description">
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} placeholder="Initial observations, deal context…" className={input + ' resize-none'} style={inputStyle} />
          </Field>

          {customFieldDefs.length > 0 && (
            <>
              <SectionLabel>Custom Fields</SectionLabel>
              <div className="space-y-3">
                {customFieldDefs.map(f => (
                  <Field key={f.id} label={f.label}>
                    {f.type === 'select' ? (
                      <select
                        value={customFields[f.id] ?? ''}
                        onChange={e => setCustomFields(cf => ({ ...cf, [f.id]: e.target.value }))}
                        className={input}
                        style={inputStyle}
                      >
                        <option value="">Select…</option>
                        {(f.options ?? []).map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input
                        type={f.type === 'number' || f.type === 'currency' || f.type === 'percentage' ? 'number' : 'text'}
                        value={customFields[f.id] ?? ''}
                        onChange={e => setCustomFields(cf => ({ ...cf, [f.id]: e.target.value }))}
                        placeholder={f.type === 'percentage' ? 'e.g. 45' : f.type === 'currency' ? 'e.g. 1500' : ''}
                        className={input}
                        style={inputStyle}
                      />
                    )}
                  </Field>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex justify-end gap-2" style={{ borderColor: 'var(--border)' }}>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-[12px] border transition-colors hover:text-white" style={{ borderColor: 'var(--border)', color: 'var(--subtext)' }}>Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 rounded-lg text-[12px] font-semibold transition-all hover:opacity-90" style={{ background: 'var(--accent)', color: '#0a0b09' }}>Save Deal</button>
        </div>
      </div>
    </div>
  )
}

const input = 'w-full rounded-lg px-3 py-2 text-[12px] outline-none border transition-colors focus:border-lime-400/50'
const inputStyle = { background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text)' }

function FieldGroup({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-mono text-[9px] uppercase tracking-widest" style={{ color: 'var(--muted)' }}>{label}</label>
      {children}
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="font-mono text-[9px] uppercase tracking-widest pb-1 border-b" style={{ color: 'var(--muted)', borderColor: 'var(--border)' }}>{children}</p>
}
