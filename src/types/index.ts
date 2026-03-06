// ── Enums ──────────────────────────────────────────────────────────────────
export type DealStatus = 'active' | 'archived' | 'closed'
export type FieldType = 'text' | 'number' | 'currency' | 'percentage' | 'select' | 'computed' | 'date'

export interface DealFieldDef {
  id: string
  label: string
  type: FieldType
  builtIn?: string       // maps to a Deal property (e.g. 'name', 'stage_id', 'revenue_k')
  computed?: string      // e.g. 'ebitda_margin'
  options?: string[]     // for select type
  position: number
  showInTable: boolean
}
export type ContactType = 'seller' | 'broker' | 'advisor' | 'other'
export type MilestoneStatus = 'not_started' | 'in_progress' | 'completed'
export type UserRole = 'admin' | 'member' | 'read_only'
export type EventType =
  | 'note'
  | 'task'
  | 'stage_change'
  | 'document_added'
  | 'score_updated'
  | 'milestone_updated'
  | 'deal_created'
  | 'deal_updated'

// ── Core Entities ──────────────────────────────────────────────────────────
export interface Stage {
  id: string
  name: string
  position: number
  color: string
  is_default: boolean
}

export interface Contact {
  id: string
  name: string
  organization: string
  email: string
  phone: string
  type: ContactType
  notes: string
  created_at: string
  updated_at: string
}

export interface DealContact {
  contact: Contact
  relationship_role: string
}

export interface ScoreCategory {
  id: string
  name: string
  weight: number
  position: number
  description: string
}

export interface DealScore {
  category_id: string
  value: number // 0–100
  notes: string
}

export interface DiligenceMilestone {
  id: string
  name: string
  position: number
  category: string
}

export interface DealMilestoneStatus {
  milestone_id: string
  status: MilestoneStatus
  completed_at?: string
  notes: string
}

export interface TimelineEvent {
  id: string
  deal_id: string
  actor: string
  event_type: EventType
  payload: Record<string, unknown>
  created_at: string
}

export interface Document {
  id: string
  deal_id: string
  filename: string
  size_bytes: number
  mime_type: string
  uploader: string
  created_at: string
}

export interface Deal {
  id: string
  name: string
  source: string
  stage_id: string
  owner: string
  description: string
  next_follow_up_at?: string
  status: DealStatus
  created_at: string
  updated_at: string
  // financials
  asking_price_k?: number
  sde_k?: number
  gm_adjusted_k?: number
  revenue_k?: number
  ebitda_k?: number
  // business info
  industry?: string
  location?: string
  years_in_business?: number
  employees?: number
  top_customer_pct?: number
  recurring_revenue_pct?: number
  remote_operable?: boolean
  owner_dependence?: number // 1–10
  // relations
  contacts: DealContact[]
  scores: DealScore[]
  milestones: DealMilestoneStatus[]
  timeline: TimelineEvent[]
  documents: Document[]
  // dynamic custom fields
  custom_fields: Record<string, string | number | boolean | null>
}

// ── Settings ───────────────────────────────────────────────────────────────
export interface BuyBoxCriteria {
  id: string
  text: string
}

export interface AppSettings {
  theme: 'dark' | 'light'
  ownerName: string
  buyBox: BuyBoxCriteria[]
}

// ── Computed ───────────────────────────────────────────────────────────────
export interface ComputedScore {
  total: number       // 0–100
  letter: 'A' | 'B' | 'C' | 'D'
  breakdown: Record<string, number>
}
