'use client'
import { useState } from 'react'
import { Search, Plus, Trash2 } from 'lucide-react'
import { useStore } from '@/lib/store'
import { stageDot } from '@/lib/utils'
import clsx from 'clsx'
import type { Contact } from '@/types'

const typeColors: Record<string, string> = {
  seller:  'text-lime-400 bg-lime-400/10 border-lime-400/30',
  broker:  'text-sky-400 bg-sky-400/10 border-sky-400/30',
  advisor: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
  other:   'text-zinc-400 bg-zinc-400/10 border-zinc-400/30',
}

export function ContactsPage() {
  const { contacts, deals, deleteContact } = useStore()
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Contact | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const filtered = contacts.filter(c => {
    const q = search.toLowerCase()
    return !q || c.name.toLowerCase().includes(q) || c.organization.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
  })

  function dealsForContact(cid: string) {
    return deals.filter(d => d.contacts.some(dc => dc.contact.id === cid))
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* List */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Topbar */}
        <div className="flex items-center gap-3 px-6 h-14 border-b shrink-0" style={{ borderColor: 'var(--border)' }}>
          <h2 className="font-display text-lg flex-1">Contacts
            <span className="font-mono text-xs ml-2" style={{ color: 'var(--muted)' }}>{filtered.length}</span>
          </h2>
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted)' }} />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search…"
              className="pl-7 pr-3 py-1.5 rounded-md text-xs font-mono outline-none border focus:border-lime-400/50 transition-colors w-44"
              style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text)' }}
            />
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold" style={{ background: 'var(--accent)', color: '#0a0b09' }}>
            <Plus size={12} /> Add Contact
          </button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto p-5">
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ background: 'var(--surface)' }}>
                  {['Name','Organization','Type','Email','Phone','Deals',''].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-mono text-[10px] tracking-widest uppercase border-b" style={{ color: 'var(--muted)', borderColor: 'var(--border)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => {
                  const relatedDeals = dealsForContact(c.id)
                  return (
                    <tr
                      key={c.id}
                      onClick={() => setSelected(selected?.id === c.id ? null : c)}
                      className="border-b cursor-pointer transition-colors hover:bg-white/[0.02] group"
                      style={{ borderColor: 'var(--border)', background: selected?.id === c.id ? 'rgba(200,240,96,0.04)' : i % 2 === 0 ? 'var(--surface)' : 'var(--bg)' }}
                    >
                      <td className="px-4 py-3 font-medium text-[13px]" style={{ color: 'var(--text)' }}>{c.name}</td>
                      <td className="px-4 py-3 text-[12px]" style={{ color: 'var(--subtext)' }}>{c.organization}</td>
                      <td className="px-4 py-3">
                        <span className={clsx('font-mono text-[9px] px-2 py-0.5 rounded border uppercase', typeColors[c.type] ?? typeColors.other)}>{c.type}</span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px]" style={{ color: 'var(--subtext)' }}>{c.email}</td>
                      <td className="px-4 py-3 font-mono text-[11px]" style={{ color: 'var(--subtext)' }}>{c.phone}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {relatedDeals.map(d => (
                            <span key={d.id} className="font-mono text-[9px] px-1.5 py-0.5 rounded border" style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--subtext)' }}>
                              {d.name}
                            </span>
                          ))}
                          {relatedDeals.length === 0 && <span className="font-mono text-[10px]" style={{ color: 'var(--muted)' }}>—</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        {confirmDelete === c.id ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => { deleteContact(c.id); if (selected?.id === c.id) setSelected(null); setConfirmDelete(null) }}
                              className="font-mono text-[10px] px-2 py-0.5 rounded border transition-colors"
                              style={{ background: 'rgba(240,80,80,0.1)', borderColor: 'rgba(240,80,80,0.3)', color: 'var(--danger)' }}
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setConfirmDelete(null)}
                              className="font-mono text-[10px] px-2 py-0.5 rounded border transition-colors hover:text-white"
                              style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDelete(c.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:text-red-400"
                            style={{ color: 'var(--muted)' }}
                            title="Delete contact"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="w-72 border-l flex flex-col overflow-y-auto" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="px-4 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-display text-base leading-tight" style={{ color: 'var(--text)' }}>{selected.name}</h3>
              <span className={clsx('font-mono text-[9px] px-2 py-0.5 rounded border uppercase shrink-0', typeColors[selected.type] ?? typeColors.other)}>{selected.type}</span>
            </div>
            <p className="text-[11px]" style={{ color: 'var(--muted)' }}>{selected.organization}</p>
          </div>
          <div className="px-4 py-4 space-y-3">
            <ContactField label="Email" value={selected.email} />
            <ContactField label="Phone" value={selected.phone} />
            {selected.notes && (
              <div>
                <p className="font-mono text-[9px] uppercase tracking-widest mb-1" style={{ color: 'var(--muted)' }}>Notes</p>
                <p className="text-[11px] leading-relaxed" style={{ color: 'var(--subtext)' }}>{selected.notes}</p>
              </div>
            )}
            <div>
              <p className="font-mono text-[9px] uppercase tracking-widest mb-2" style={{ color: 'var(--muted)' }}>Linked Deals</p>
              <div className="space-y-1.5">
                {dealsForContact(selected.id).map(d => (
                  <div key={d.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                    <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', stageDot(d.stage_id))} />
                    <span className="text-[11px] truncate" style={{ color: 'var(--text)' }}>{d.name}</span>
                  </div>
                ))}
                {dealsForContact(selected.id).length === 0 && (
                  <p className="font-mono text-[10px]" style={{ color: 'var(--muted)' }}>No deals linked.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ContactField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono text-[9px] uppercase tracking-widest mb-0.5" style={{ color: 'var(--muted)' }}>{label}</p>
      <p className="font-mono text-[11px]" style={{ color: 'var(--subtext)' }}>{value || '—'}</p>
    </div>
  )
}
