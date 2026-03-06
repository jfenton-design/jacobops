'use client'
import { LayoutGrid, Users, Settings } from 'lucide-react'
import type { NavPage } from './AppShell'
import { useStore } from '@/lib/store'
import clsx from 'clsx'

interface Props {
  activePage: NavPage
  onNavigate: (p: NavPage) => void
}

const nav = [
  { id: 'pipeline' as NavPage, label: 'Pipeline',  Icon: LayoutGrid },
  { id: 'contacts' as NavPage, label: 'Contacts',  Icon: Users },
]

export function Sidebar({ activePage, onNavigate }: Props) {
  const { deals, settings } = useStore()
  const active = deals.filter(d => d.status === 'active')
  const loi = deals.filter(d => ['loi','due_diligence'].includes(d.stage_id))
  const pipelineValue = loi.reduce((s,d) => s + (d.asking_price_k ?? 0), 0)

  return (
    <aside
      className="w-52 flex-shrink-0 flex flex-col border-r"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      {/* Logo */}
      <div className="px-5 py-6 border-b" style={{ borderColor: 'var(--border)' }}>
        <h1 className="font-display text-xl leading-none" style={{ color: 'var(--accent)' }}>
          JacobOps
        </h1>
        <p className="font-mono text-[9px] tracking-widest uppercase mt-1" style={{ color: 'var(--muted)' }}>
          Acquisition OS
        </p>
      </div>

      {/* Nav */}
      <nav className="px-3 pt-4 flex-1">
        <p className="font-mono text-[9px] tracking-[2px] uppercase px-2 mb-2" style={{ color: 'var(--muted)' }}>
          Workspace
        </p>
        {nav.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            className={clsx(
              'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] font-medium transition-all mb-0.5',
              activePage === id
                ? 'text-lime-400'
                : 'hover:text-white'
            )}
            style={activePage === id
              ? { background: 'rgba(200,240,96,0.08)' }
              : { color: 'var(--subtext)' }
            }
          >
            <Icon size={14} className="opacity-80" />
            {label}
          </button>
        ))}

        {/* Stats */}
        <div className="mt-6 mb-2">
          <p className="font-mono text-[9px] tracking-[2px] uppercase px-2 mb-3" style={{ color: 'var(--muted)' }}>
            Snapshot
          </p>
          <div className="space-y-1 px-1">
            <StatRow label="Active deals" value={String(active.length)} accent />
            <StatRow label="LOI + DD value" value={pipelineValue >= 1000 ? `$${(pipelineValue/1000).toFixed(1)}M` : `$${pipelineValue}K`} />
            <StatRow label="Closed" value={String(deals.filter(d=>d.stage_id==='closed').length)} />
            <StatRow label="Passed" value={String(deals.filter(d=>d.stage_id==='passed').length)} dim />
          </div>
        </div>

        {/* Buy box reminder */}
        {settings.buyBox.length > 0 && (
          <div
            className="mt-5 mx-1 rounded-lg p-3 border"
            style={{ background: 'rgba(200,240,96,0.04)', borderColor: 'rgba(200,240,96,0.15)' }}
          >
            <p className="font-mono text-[9px] tracking-[2px] uppercase mb-2" style={{ color: 'var(--accent)' }}>Buy Box</p>
            <div className="space-y-1">
              {settings.buyBox.filter(b => b.text).map(b => (
                <p key={b.id} className="text-[10px] leading-tight" style={{ color: 'var(--subtext)' }}>· {b.text}</p>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t" style={{ borderColor: 'var(--border)' }}>
        <button
          onClick={() => onNavigate('settings')}
          className={clsx(
            'w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition-all mb-2 text-left',
            activePage === 'settings' ? 'text-lime-400' : 'hover:text-white'
          )}
          style={activePage === 'settings' ? { background: 'rgba(200,240,96,0.08)' } : { color: 'var(--subtext)' }}
        >
          <Settings size={13} className="opacity-80" />
          <span className="text-[13px] font-medium">Settings</span>
        </button>
        <div className="flex items-center gap-2 px-2">
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-black shrink-0" style={{ background: 'var(--accent)' }}>
            {settings.ownerName.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium truncate" style={{ color: 'var(--text)' }}>{settings.ownerName}</p>
            <p className="text-[10px]" style={{ color: 'var(--muted)' }}>Admin</p>
          </div>
        </div>
      </div>
    </aside>
  )
}

function StatRow({ label, value, accent, dim }: { label: string; value: string; accent?: boolean; dim?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1 px-1">
      <span className="text-[11px]" style={{ color: 'var(--muted)' }}>{label}</span>
      <span
        className="font-mono text-[11px] font-medium"
        style={{ color: accent ? 'var(--accent)' : dim ? 'var(--muted)' : 'var(--subtext)' }}
      >
        {value}
      </span>
    </div>
  )
}
