'use client'
import { useRef, useState } from 'react'
import { Plus, X, Sun, Moon, Upload, CheckCircle2, AlertCircle, Lock } from 'lucide-react'
import { useStore } from '@/lib/store'
import { DEFAULT_MILESTONES, DEFAULT_CATEGORIES } from '@/lib/store'
import type { Deal, DealMilestoneStatus, DealScore, FieldType } from '@/types'

// ── CSV Import ──────────────────────────────────────────────────────────────
const STAGE_ALIASES: Record<string, string> = {
  sourced: 'sourced', source: 'sourced',
  reviewed: 'reviewed', review: 'reviewed',
  loi: 'loi',
  due_diligence: 'due_diligence', 'due diligence': 'due_diligence', dd: 'due_diligence',
  closed: 'closed', close: 'closed',
  passed: 'passed', pass: 'passed',
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''))
  return lines.slice(1).map(line => {
    // Handle quoted fields
    const values: string[] = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') { inQuotes = !inQuotes }
      else if (line[i] === ',' && !inQuotes) { values.push(current.trim()); current = '' }
      else { current += line[i] }
    }
    values.push(current.trim())
    const row: Record<string, string> = {}
    headers.forEach((h, i) => { row[h] = values[i] ?? '' })
    return row
  })
}

function rowToDeal(row: Record<string, string>, existingIds: Set<string>): Deal | null {
  const name = row['name'] || row['deal_name'] || row['company'] || row['company_name']
  if (!name) return null

  const id = `import_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
  while (existingIds.has(id)) { /* retry handled by random suffix */ }
  existingIds.add(id)

  const rawStage = (row['stage'] || row['stage_id'] || 'sourced').toLowerCase().trim()
  const stage_id = STAGE_ALIASES[rawStage] ?? 'sourced'

  const num = (key: string) => {
    const aliases: Record<string, string[]> = {
      asking_price_k: ['asking_price_k', 'asking_price', 'price_k', 'price'],
      sde_k: ['sde_k', 'sde'],
      gm_adjusted_k: ['gm_adjusted_k', 'gm_adjusted', 'gm_adj_cf', 'gm_adj'],
      revenue_k: ['revenue_k', 'revenue'],
      ebitda_k: ['ebitda_k', 'ebitda'],
      years_in_business: ['years_in_business', 'years', 'age'],
      employees: ['employees', 'headcount', 'employee_count'],
      top_customer_pct: ['top_customer_pct', 'top_customer', 'customer_concentration'],
      recurring_revenue_pct: ['recurring_revenue_pct', 'recurring_revenue', 'recurring'],
      owner_dependence: ['owner_dependence', 'owner_dep'],
    }
    const keys = aliases[key] ?? [key]
    for (const k of keys) {
      const val = parseFloat(row[k] ?? '')
      if (!isNaN(val)) return val
    }
    return undefined
  }

  const milestones: DealMilestoneStatus[] = DEFAULT_MILESTONES.map(m => ({
    milestone_id: m.id,
    status: 'not_started',
    notes: '',
  }))

  const scores: DealScore[] = DEFAULT_CATEGORIES.map(c => ({
    category_id: c.id,
    value: 0,
    notes: '',
  }))

  const remoteRaw = (row['remote_operable'] || row['remote'] || '').toLowerCase()
  const remote_operable = remoteRaw === 'true' || remoteRaw === 'yes' || remoteRaw === '1' ? true
    : remoteRaw === 'false' || remoteRaw === 'no' || remoteRaw === '0' ? false
    : undefined

  return {
    id,
    name: name.trim(),
    source: row['source'] || row['deal_source'] || '',
    stage_id,
    owner: row['owner'] || 'Jacob Fenton',
    description: row['description'] || row['notes'] || '',
    status: stage_id === 'passed' ? 'archived' : 'active',
    created_at: new Date().toISOString().slice(0, 10),
    updated_at: new Date().toISOString().slice(0, 10),
    next_follow_up_at: row['next_follow_up_at'] || row['follow_up'] || undefined,
    asking_price_k: num('asking_price_k'),
    sde_k: num('sde_k'),
    gm_adjusted_k: num('gm_adjusted_k'),
    revenue_k: num('revenue_k'),
    ebitda_k: num('ebitda_k'),
    industry: row['industry'] || undefined,
    location: row['location'] || undefined,
    years_in_business: num('years_in_business'),
    employees: num('employees'),
    top_customer_pct: num('top_customer_pct'),
    recurring_revenue_pct: num('recurring_revenue_pct'),
    remote_operable,
    owner_dependence: num('owner_dependence'),
    contacts: [],
    scores,
    milestones,
    documents: [],
    custom_fields: {},
    timeline: [{
      id: `t${Date.now()}`,
      deal_id: id,
      actor: 'Jacob Fenton',
      event_type: 'deal_created',
      payload: { note: 'Imported via CSV.' },
      created_at: new Date().toISOString(),
    }],
  }
}

// ── Section wrapper ─────────────────────────────────────────────────────────
function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="py-8 border-b last:border-b-0" style={{ borderColor: 'var(--border)' }}>
      <div className="flex gap-10">
        <div className="w-56 shrink-0">
          <p className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>{title}</p>
          {description && (
            <p className="text-[11px] mt-1 leading-relaxed" style={{ color: 'var(--muted)' }}>{description}</p>
          )}
        </div>
        <div className="flex-1 max-w-xl">{children}</div>
      </div>
    </div>
  )
}

// ── Settings Page ──────────────────────────────────────────────────────────
export function SettingsPage() {
  const {
    settings,
    updateSettings,
    addBuyBoxItem,
    updateBuyBoxItem,
    removeBuyBoxItem,
    addDeal,
    deals,
    fieldDefs,
    addFieldDef,
    removeFieldDef,
  } = useStore()

  const [newField, setNewField] = useState({ label: '', type: 'text' as FieldType, options: '' })
  const [addingField, setAddingField] = useState(false)

  const fileRef = useRef<HTMLInputElement>(null)
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [importPreview, setImportPreview] = useState<{ count: number; names: string[] } | null>(null)
  const [pendingDeals, setPendingDeals] = useState<Deal[]>([])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setImportStatus(null)
    setImportPreview(null)
    setPendingDeals([])
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.name.endsWith('.csv')) {
      setImportStatus({ type: 'error', message: 'Please upload a .csv file.' })
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const rows = parseCSV(text)
      const existingIds = new Set(deals.map(d => d.id))
      const parsed = rows.map(r => rowToDeal(r, existingIds)).filter((d): d is Deal => d !== null)
      if (parsed.length === 0) {
        setImportStatus({ type: 'error', message: 'No valid deals found. Make sure your CSV has a "name" column.' })
        return
      }
      setPendingDeals(parsed)
      setImportPreview({ count: parsed.length, names: parsed.slice(0, 5).map(d => d.name) })
    }
    reader.readAsText(file)
  }

  function confirmImport() {
    pendingDeals.forEach(d => addDeal(d))
    setImportStatus({ type: 'success', message: `${pendingDeals.length} deal${pendingDeals.length !== 1 ? 's' : ''} imported successfully.` })
    setImportPreview(null)
    setPendingDeals([])
    if (fileRef.current) fileRef.current.value = ''
  }

  function cancelImport() {
    setImportPreview(null)
    setPendingDeals([])
    if (fileRef.current) fileRef.current.value = ''
  }

  const inputCls = "w-full px-3 py-2 rounded-md text-[13px] outline-none border focus:border-lime-400/50 transition-colors"
  const inputStyle = { background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text)' }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 h-14 border-b shrink-0" style={{ borderColor: 'var(--border)' }}>
        <h2 className="font-display text-lg flex-1">Settings</h2>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto px-6 py-2">

          {/* ── Appearance ── */}
          <Section title="Appearance" description="Choose how the app looks.">
            <div
              className="flex items-center gap-1 p-1 rounded-lg border w-fit"
              style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
            >
              {(['dark', 'light'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => updateSettings({ theme: t })}
                  className="flex items-center gap-2 px-4 py-2 rounded-md text-[12px] font-mono transition-all"
                  style={settings.theme === t
                    ? { background: 'var(--surface)', color: 'var(--accent)', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }
                    : { color: 'var(--muted)' }
                  }
                >
                  {t === 'dark' ? <Moon size={13} /> : <Sun size={13} />}
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </Section>

          {/* ── Profile ── */}
          <Section title="Profile" description="Your name shown throughout the app.">
            <input
              className={inputCls}
              style={inputStyle}
              value={settings.ownerName}
              onChange={e => updateSettings({ ownerName: e.target.value })}
              placeholder="Your name"
            />
          </Section>

          {/* ── Buy Box ── */}
          <Section
            title="Buy Box"
            description="Criteria displayed in the sidebar as a quick reference. Edit, reorder, or remove as your thesis evolves."
          >
            <div className="space-y-2">
              {settings.buyBox.map(item => (
                <div key={item.id} className="flex items-center gap-2">
                  <input
                    className={inputCls}
                    style={inputStyle}
                    value={item.text}
                    onChange={e => updateBuyBoxItem(item.id, e.target.value)}
                    placeholder="e.g. SDE $500K–$1.5M"
                  />
                  <button
                    onClick={() => removeBuyBoxItem(item.id)}
                    className="p-2 rounded-md transition-colors hover:text-red-400 shrink-0"
                    style={{ color: 'var(--muted)' }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              <button
                onClick={addBuyBoxItem}
                className="flex items-center gap-1.5 text-[12px] font-mono px-3 py-2 rounded-md border border-dashed transition-colors hover:border-lime-400/50 hover:text-lime-400"
                style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
              >
                <Plus size={12} /> Add criteria
              </button>
            </div>
          </Section>

          {/* ── Deal Fields ── */}
          <Section
            title="Deal Fields"
            description="Fields that appear on every deal in the table and drawer. Built-in fields cannot be removed."
          >
            <div className="space-y-2">
              {[...fieldDefs].sort((a, b) => a.position - b.position).map(field => {
                const isLocked = !!(field.builtIn || field.computed)
                return (
                  <div
                    key={field.id}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg border"
                    style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
                  >
                    <span className="text-[12px] flex-1" style={{ color: 'var(--text)' }}>{field.label}</span>
                    <span
                      className="font-mono text-[9px] px-1.5 py-0.5 rounded border"
                      style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--muted)' }}
                    >
                      {field.computed ? 'computed' : field.type}
                    </span>
                    {field.options && (
                      <span className="font-mono text-[9px]" style={{ color: 'var(--muted)' }}>
                        {field.options.join(', ')}
                      </span>
                    )}
                    {isLocked ? (
                      <Lock size={11} style={{ color: 'var(--muted)', flexShrink: 0 }} />
                    ) : (
                      <button
                        onClick={() => removeFieldDef(field.id)}
                        className="p-1 rounded transition-colors hover:text-red-400 shrink-0"
                        style={{ color: 'var(--muted)' }}
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                )
              })}

              {addingField ? (
                <div className="rounded-lg border p-3 space-y-2" style={{ background: 'var(--card)', borderColor: 'rgba(200,240,96,0.25)' }}>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      className={inputCls}
                      style={inputStyle}
                      placeholder="Field label"
                      value={newField.label}
                      onChange={e => setNewField(f => ({ ...f, label: e.target.value }))}
                    />
                    <select
                      className={inputCls}
                      style={inputStyle}
                      value={newField.type}
                      onChange={e => setNewField(f => ({ ...f, type: e.target.value as FieldType }))}
                    >
                      <option value="text">Text</option>
                      <option value="number">Number</option>
                      <option value="currency">Currency ($K)</option>
                      <option value="percentage">Percentage (%)</option>
                      <option value="select">Select (dropdown)</option>
                      <option value="date">Date</option>
                    </select>
                  </div>
                  {newField.type === 'select' && (
                    <input
                      className={inputCls}
                      style={inputStyle}
                      placeholder="Options (comma-separated, e.g. Yes, No, Maybe)"
                      value={newField.options}
                      onChange={e => setNewField(f => ({ ...f, options: e.target.value }))}
                    />
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (!newField.label.trim()) return
                        const id = newField.label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
                        const options = newField.type === 'select'
                          ? newField.options.split(',').map(o => o.trim()).filter(Boolean)
                          : undefined
                        addFieldDef({
                          id: `${id}_${Date.now()}`,
                          label: newField.label.trim(),
                          type: newField.type,
                          options,
                          showInTable: true,
                        })
                        setNewField({ label: '', type: 'text', options: '' })
                        setAddingField(false)
                      }}
                      disabled={!newField.label.trim()}
                      className="px-3 py-1.5 rounded-md text-[12px] font-semibold transition-all disabled:opacity-40"
                      style={{ background: 'var(--accent)', color: '#0a0b09' }}
                    >
                      Add Field
                    </button>
                    <button
                      onClick={() => { setAddingField(false); setNewField({ label: '', type: 'text', options: '' }) }}
                      className="px-3 py-1.5 rounded-md text-[12px] font-mono border transition-all hover:text-white"
                      style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setAddingField(true)}
                  className="flex items-center gap-1.5 text-[12px] font-mono px-3 py-2 rounded-md border border-dashed transition-colors hover:border-lime-400/50 hover:text-lime-400"
                  style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
                >
                  <Plus size={12} /> Add custom field
                </button>
              )}
            </div>
          </Section>

          {/* ── CSV Import ── */}
          <Section
            title="Import Deals"
            description="Upload a .csv file to bulk-create deal cards. One row per deal."
          >
            <div className="space-y-4">
              {/* Expected columns reference */}
              <div
                className="rounded-lg border p-3"
                style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
              >
                <p className="font-mono text-[10px] tracking-widest uppercase mb-2" style={{ color: 'var(--muted)' }}>
                  Expected CSV columns
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { col: 'name', required: true },
                    { col: 'source' },
                    { col: 'stage' },
                    { col: 'industry' },
                    { col: 'location' },
                    { col: 'asking_price_k' },
                    { col: 'sde_k' },
                    { col: 'gm_adjusted_k' },
                    { col: 'revenue_k' },
                    { col: 'ebitda_k' },
                    { col: 'years_in_business' },
                    { col: 'employees' },
                    { col: 'top_customer_pct' },
                    { col: 'recurring_revenue_pct' },
                    { col: 'owner_dependence' },
                    { col: 'remote_operable' },
                    { col: 'description' },
                    { col: 'next_follow_up_at' },
                  ].map(({ col, required }) => (
                    <span
                      key={col}
                      className="font-mono text-[10px] px-1.5 py-0.5 rounded border"
                      style={required
                        ? { background: 'rgba(200,240,96,0.08)', borderColor: 'rgba(200,240,96,0.3)', color: 'var(--accent)' }
                        : { background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--subtext)' }
                      }
                    >
                      {col}{required ? ' *' : ''}
                    </span>
                  ))}
                </div>
                <p className="font-mono text-[10px] mt-2" style={{ color: 'var(--muted)' }}>
                  * required · price/sde/revenue columns in $K (e.g. 2800 = $2.8M) · stage: sourced, reviewed, loi, due_diligence, closed, passed
                </p>
              </div>

              {/* File input */}
              <div>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                  id="csv-upload"
                />
                <label
                  htmlFor="csv-upload"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-[12px] font-mono border cursor-pointer transition-all hover:border-lime-400/50 hover:text-lime-400"
                  style={{ borderColor: 'var(--border)', color: 'var(--subtext)', background: 'var(--card)' }}
                >
                  <Upload size={13} /> Choose CSV file
                </label>
              </div>

              {/* Preview before confirming */}
              {importPreview && (
                <div
                  className="rounded-lg border p-4 space-y-3"
                  style={{ background: 'var(--card)', borderColor: 'rgba(200,240,96,0.25)' }}
                >
                  <p className="text-[13px] font-medium" style={{ color: 'var(--text)' }}>
                    {importPreview.count} deal{importPreview.count !== 1 ? 's' : ''} ready to import
                  </p>
                  <ul className="space-y-0.5">
                    {importPreview.names.map(n => (
                      <li key={n} className="font-mono text-[11px]" style={{ color: 'var(--subtext)' }}>· {n}</li>
                    ))}
                    {importPreview.count > 5 && (
                      <li className="font-mono text-[11px]" style={{ color: 'var(--muted)' }}>
                        + {importPreview.count - 5} more…
                      </li>
                    )}
                  </ul>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={confirmImport}
                      className="px-4 py-1.5 rounded-md text-[12px] font-semibold transition-all hover:opacity-90"
                      style={{ background: 'var(--accent)', color: '#0a0b09' }}
                    >
                      Import {importPreview.count} deal{importPreview.count !== 1 ? 's' : ''}
                    </button>
                    <button
                      onClick={cancelImport}
                      className="px-4 py-1.5 rounded-md text-[12px] font-mono border transition-all hover:text-white"
                      style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Status message */}
              {importStatus && (
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-[12px] font-mono"
                  style={{
                    background: importStatus.type === 'success' ? 'rgba(200,240,96,0.08)' : 'rgba(240,80,80,0.08)',
                    color: importStatus.type === 'success' ? 'var(--accent)' : 'var(--danger)',
                    border: `1px solid ${importStatus.type === 'success' ? 'rgba(200,240,96,0.2)' : 'rgba(240,80,80,0.2)'}`,
                  }}
                >
                  {importStatus.type === 'success' ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                  {importStatus.message}
                </div>
              )}
            </div>
          </Section>

        </div>
      </div>
    </div>
  )
}
