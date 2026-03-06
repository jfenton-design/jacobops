import type { Deal, ComputedScore, ScoreCategory } from '@/types'

export function computeScore(deal: Deal, categories: ScoreCategory[]): ComputedScore {
  const totalWeight = categories.reduce((s, c) => s + c.weight, 0)
  if (totalWeight === 0) return { total: 0, letter: 'D', breakdown: {} }

  let weighted = 0
  const breakdown: Record<string, number> = {}

  for (const cat of categories) {
    const sc = deal.scores.find((s) => s.category_id === cat.id)
    const val = sc?.value ?? 0
    breakdown[cat.id] = val
    weighted += (val * cat.weight) / totalWeight
  }

  const total = Math.round(weighted)
  const letter = total >= 80 ? 'A' : total >= 65 ? 'B' : total >= 45 ? 'C' : 'D'
  return { total, letter, breakdown }
}

export function scoreColor(letter: string) {
  if (letter === 'A') return 'text-lime-400'
  if (letter === 'B') return 'text-sky-400'
  if (letter === 'C') return 'text-amber-400'
  return 'text-red-400'
}

export function scoreBg(letter: string) {
  if (letter === 'A') return 'bg-lime-400/10 border-lime-400/30 text-lime-400'
  if (letter === 'B') return 'bg-sky-400/10 border-sky-400/30 text-sky-400'
  if (letter === 'C') return 'bg-amber-400/10 border-amber-400/30 text-amber-400'
  return 'bg-red-400/10 border-red-400/30 text-red-400'
}

export function barColor(val: number) {
  if (val >= 75) return 'bg-lime-400'
  if (val >= 50) return 'bg-amber-400'
  return 'bg-red-400'
}

export function formatCurrency(k?: number) {
  if (!k) return '—'
  if (k >= 1000) return `$${(k / 1000).toFixed(1)}M`
  return `$${k}K`
}

export function stageColor(stageId: string): string {
  const map: Record<string, string> = {
    sourced: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
    reviewed: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
    loi: 'bg-lime-500/20 text-lime-400 border-lime-500/30',
    due_diligence: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    closed: 'bg-green-500/20 text-green-400 border-green-500/30',
    passed: 'bg-red-500/20 text-red-400 border-red-500/30',
  }
  return map[stageId] ?? 'bg-zinc-500/20 text-zinc-400'
}

export function stageDot(stageId: string): string {
  const map: Record<string, string> = {
    sourced: 'bg-zinc-400',
    reviewed: 'bg-sky-400',
    loi: 'bg-lime-400',
    due_diligence: 'bg-amber-400',
    closed: 'bg-green-400',
    passed: 'bg-red-400',
  }
  return map[stageId] ?? 'bg-zinc-400'
}
