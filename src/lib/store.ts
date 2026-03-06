import { create } from 'zustand'
import type {
  Deal, Stage, Contact, ScoreCategory, DiligenceMilestone,
  TimelineEvent, DealScore, DealMilestoneStatus, Document, DealContact,
  BuyBoxCriteria, AppSettings, DealFieldDef,
} from '@/types'

// ── Default Field Definitions ──────────────────────────────────────────────
export const DEFAULT_FIELD_DEFS: DealFieldDef[] = [
  { id: 'deal_status',     label: 'Deal Status',         type: 'text',       builtIn: 'stage_id',   position: 0,  showInTable: true },
  { id: 'status_updated',  label: 'Status Last Updated', type: 'date',       builtIn: 'updated_at', position: 1,  showInTable: true },
  { id: 'deal_headline',   label: 'Deal Headline',       type: 'text',       builtIn: 'name',       position: 2,  showInTable: true },
  { id: 'company',         label: 'Company',             type: 'text',                              position: 3,  showInTable: true },
  { id: 'primary_contact', label: 'Primary Contact',     type: 'text',       builtIn: 'contacts',   position: 4,  showInTable: true },
  { id: 'nda_type',        label: 'NDA Type',            type: 'select',     options: ['None', 'Unilateral', 'Mutual'], position: 5, showInTable: true },
  { id: 'cim_type',        label: 'CIM Type',            type: 'select',     options: ['None', 'Teaser', 'Full CIM', 'NDA + Teaser'], position: 6, showInTable: true },
  { id: 'revenue',         label: 'Revenue',             type: 'currency',   builtIn: 'revenue_k',  position: 7,  showInTable: true },
  { id: 'ebitda',          label: 'EBITDA',              type: 'currency',   builtIn: 'ebitda_k',   position: 8,  showInTable: true },
  { id: 'industries',      label: 'Industries',          type: 'text',       builtIn: 'industry',   position: 9,  showInTable: true },
  { id: 'geography',       label: 'Geography',           type: 'text',       builtIn: 'location',   position: 10, showInTable: true },
  { id: 'ebitda_margin',   label: 'EBITDA Margin',       type: 'computed',   computed: 'ebitda_margin', position: 11, showInTable: true },
  { id: 'gross_margin',    label: 'Gross Margin',        type: 'percentage',                        position: 12, showInTable: true },
]

// ── Default Stages ─────────────────────────────────────────────────────────
export const DEFAULT_STAGES: Stage[] = [
  { id: 'sourced',       name: 'Sourced',       position: 0, color: '#6b7280', is_default: true  },
  { id: 'reviewed',      name: 'Reviewed',      position: 1, color: '#3b82f6', is_default: false },
  { id: 'loi',           name: 'LOI',           position: 2, color: '#a3e635', is_default: false },
  { id: 'due_diligence', name: 'Due Diligence', position: 3, color: '#f59e0b', is_default: false },
  { id: 'closed',        name: 'Closed',        position: 4, color: '#22c55e', is_default: false },
  { id: 'passed',        name: 'Passed',        position: 5, color: '#ef4444', is_default: false },
]

// ── Default Score Categories ───────────────────────────────────────────────
export const DEFAULT_CATEGORIES: ScoreCategory[] = [
  { id: 'financials',    name: 'Financial Fit',         weight: 30, position: 0, description: 'SDE, price multiple, GM-adjusted cash flow' },
  { id: 'operations',   name: 'Operational Quality',   weight: 25, position: 1, description: 'Owner dependence, team depth, SOPs' },
  { id: 'defensibility',name: 'Business Defensibility', weight: 20, position: 2, description: 'Recurring revenue, customer concentration, moat' },
  { id: 'market',       name: 'Market & Growth',       weight: 15, position: 3, description: 'Industry tailwinds, growth potential' },
  { id: 'structure',    name: 'Deal Structurability',  weight: 10, position: 4, description: 'Seller note potential, SBA eligibility, clean books' },
]

// ── Default Milestones ─────────────────────────────────────────────────────
export const DEFAULT_MILESTONES: DiligenceMilestone[] = [
  { id: 'm1',  name: 'NDA Signed',               position: 0,  category: 'Initial' },
  { id: 'm2',  name: 'CIM Received',             position: 1,  category: 'Initial' },
  { id: 'm3',  name: 'Financials Reviewed',      position: 2,  category: 'Financial' },
  { id: 'm4',  name: 'SDE Normalized',           position: 3,  category: 'Financial' },
  { id: 'm5',  name: 'GM-Adjusted CF Modeled',   position: 4,  category: 'Financial' },
  { id: 'm6',  name: 'LOI Submitted',            position: 5,  category: 'Legal' },
  { id: 'm7',  name: 'LOI Accepted',             position: 6,  category: 'Legal' },
  { id: 'm8',  name: 'Org Chart Reviewed',       position: 7,  category: 'Operations' },
  { id: 'm9',  name: 'Customer Concentration OK',position: 8,  category: 'Operations' },
  { id: 'm10', name: 'Key Person Risk Assessed', position: 9,  category: 'Operations' },
  { id: 'm11', name: 'SBA Pre-Approval',         position: 10, category: 'Financing' },
  { id: 'm12', name: 'Purchase Agreement Signed',position: 11, category: 'Legal' },
]

// ── Seed Contacts ──────────────────────────────────────────────────────────
const CONTACTS: Contact[] = [
  { id: 'c1', name: 'Dave Kowalski',   organization: 'Sunbelt Detroit',      email: 'dave@sunbelt.com',   phone: '313-555-0101', type: 'broker',  notes: 'Active SE Michigan broker. Strong HVAC/mechanical network.', created_at: '2026-01-10', updated_at: '2026-01-10' },
  { id: 'c2', name: 'Pat Okafor',      organization: 'Murphy Business MI',   email: 'pat@murphy.com',     phone: '248-555-0188', type: 'broker',  notes: 'Good tech/IT services deals. Responsive.', created_at: '2026-01-12', updated_at: '2026-01-12' },
  { id: 'c3', name: 'Greg Halverson',  organization: 'Midwest HVAC Solutions',email: 'greg@midwesthvac.com',phone:'734-555-0212',type: 'seller', notes: 'Retiring. 18 years. Very motivated.', created_at: '2026-01-15', updated_at: '2026-02-01' },
  { id: 'c4', name: 'Linda Park',      organization: 'Precision Environmental',email:'linda@precenv.com', phone: '734-555-0309', type: 'seller', notes: 'Founder. Open to seller note up to 20%.', created_at: '2026-02-01', updated_at: '2026-02-15' },
  { id: 'c5', name: 'Tom Ricci',       organization: 'GreatLakes IT',        email: 'tom@glits.com',      phone: '248-555-0420', type: 'seller', notes: 'Wants full exit. Has strong ops mgr in place.', created_at: '2026-02-10', updated_at: '2026-02-10' },
  { id: 'c6', name: 'Sarah Brennan',   organization: 'Axial',                email: 'sbrennan@axial.net', phone: '212-555-0511', type: 'advisor', notes: 'Axial rep. Good for deal sourcing.', created_at: '2026-01-08', updated_at: '2026-01-08' },
]

function mkMilestones(completed: string[], inProgress: string[] = []): DealMilestoneStatus[] {
  return DEFAULT_MILESTONES.map(m => ({
    milestone_id: m.id,
    status: completed.includes(m.id) ? 'completed' : inProgress.includes(m.id) ? 'in_progress' : 'not_started',
    completed_at: completed.includes(m.id) ? '2026-02-01' : undefined,
    notes: '',
  }))
}

function mkScores(vals: Record<string, number>): DealScore[] {
  return DEFAULT_CATEGORIES.map(c => ({ category_id: c.id, value: vals[c.id] ?? 0, notes: '' }))
}

function mkTimeline(events: Partial<TimelineEvent>[]): TimelineEvent[] {
  return events.map((e, i) => ({
    id: `t${i}`,
    deal_id: e.deal_id ?? '',
    actor: e.actor ?? 'Jacob Fenton',
    event_type: e.event_type ?? 'note',
    payload: e.payload ?? {},
    created_at: e.created_at ?? '2026-02-01T10:00:00Z',
  }))
}

// ── Seed Deals ─────────────────────────────────────────────────────────────
const SEED_DEALS: Deal[] = [
  {
    id: 'd1',
    name: 'Midwest HVAC Solutions',
    source: 'Sunbelt Detroit',
    stage_id: 'reviewed',
    owner: 'Jacob Fenton',
    description: 'Established commercial & residential HVAC company in Troy, MI. Strong recurring maintenance contracts. Owner retiring after 18 years.',
    next_follow_up_at: '2026-03-08',
    status: 'active',
    created_at: '2026-01-15',
    updated_at: '2026-02-20',
    asking_price_k: 2800,
    sde_k: 680,
    gm_adjusted_k: 290,
    revenue_k: 3200,
    ebitda_k: 610,
    industry: 'HVAC / Mechanical',
    location: 'Troy, MI',
    years_in_business: 18,
    employees: 14,
    top_customer_pct: 12,
    recurring_revenue_pct: 55,
    remote_operable: false,
    owner_dependence: 3,
    custom_fields: { company: 'Midwest HVAC Solutions', nda_type: 'Mutual', cim_type: 'Full CIM', gross_margin: 42 },
    contacts: [
      { contact: CONTACTS[0], relationship_role: 'Listing Broker' },
      { contact: CONTACTS[2], relationship_role: 'Seller' },
    ],
    scores: mkScores({ financials: 82, operations: 78, defensibility: 71, market: 65, structure: 80 }),
    milestones: mkMilestones(['m1','m2','m3','m4'], ['m5']),
    documents: [
      { id: 'doc1', deal_id: 'd1', filename: 'Midwest_HVAC_CIM.pdf', size_bytes: 2400000, mime_type: 'application/pdf', uploader: 'Jacob Fenton', created_at: '2026-01-18' },
      { id: 'doc2', deal_id: 'd1', filename: 'P&L_2023_2024_2025.xlsx', size_bytes: 180000, mime_type: 'application/vnd.ms-excel', uploader: 'Jacob Fenton', created_at: '2026-01-22' },
    ],
    timeline: mkTimeline([
      { event_type: 'deal_created', payload: { note: 'Deal added from Sunbelt listing.' }, created_at: '2026-01-15T09:00:00Z' },
      { event_type: 'document_added', payload: { filename: 'Midwest_HVAC_CIM.pdf' }, created_at: '2026-01-18T14:30:00Z' },
      { event_type: 'stage_change', payload: { from: 'sourced', to: 'reviewed' }, created_at: '2026-01-20T11:00:00Z' },
      { event_type: 'note', payload: { text: 'Spoke with Dave K. Seller very motivated. Will accept seller note up to 15%. Wants to close by Q3.' }, created_at: '2026-01-25T16:00:00Z' },
      { event_type: 'score_updated', payload: { note: 'Scored after reviewing 3-year P&L. SDE confirmed at $680K.' }, created_at: '2026-02-10T10:00:00Z' },
    ]),
  },
  {
    id: 'd2',
    name: 'Precision Environmental LLC',
    source: 'Direct Outreach',
    stage_id: 'loi',
    owner: 'Jacob Fenton',
    description: 'B2B environmental compliance testing firm. Serves industrial clients across SE Michigan and Ohio. Very sticky contracts, repeat revenue.',
    next_follow_up_at: '2026-03-10',
    status: 'active',
    created_at: '2026-02-01',
    updated_at: '2026-02-28',
    asking_price_k: 3200,
    sde_k: 820,
    gm_adjusted_k: 345,
    revenue_k: 4100,
    ebitda_k: 740,
    industry: 'Environmental Services',
    location: 'Ann Arbor, MI',
    years_in_business: 22,
    employees: 19,
    top_customer_pct: 18,
    recurring_revenue_pct: 72,
    remote_operable: false,
    owner_dependence: 2,
    custom_fields: { company: 'Precision Environmental LLC', nda_type: 'Mutual', cim_type: 'Full CIM', gross_margin: 51 },
    contacts: [
      { contact: CONTACTS[3], relationship_role: 'Seller / Founder' },
    ],
    scores: mkScores({ financials: 91, operations: 88, defensibility: 85, market: 72, structure: 87 }),
    milestones: mkMilestones(['m1','m2','m3','m4','m5','m6'], ['m7']),
    documents: [
      { id: 'doc3', deal_id: 'd2', filename: 'PrecisionEnv_CIM.pdf', size_bytes: 3100000, mime_type: 'application/pdf', uploader: 'Jacob Fenton', created_at: '2026-02-03' },
      { id: 'doc4', deal_id: 'd2', filename: 'Financials_3yr.xlsx', size_bytes: 220000, mime_type: 'application/vnd.ms-excel', uploader: 'Jacob Fenton', created_at: '2026-02-05' },
      { id: 'doc5', deal_id: 'd2', filename: 'LOI_Draft_v2.docx', size_bytes: 95000, mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', uploader: 'Jacob Fenton', created_at: '2026-02-25' },
    ],
    timeline: mkTimeline([
      { event_type: 'deal_created', payload: { note: 'Sourced via direct LinkedIn outreach to Linda Park.' }, created_at: '2026-02-01T08:00:00Z' },
      { event_type: 'note', payload: { text: 'Initial call with Linda. Business doing $4.1M revenue. She wants full exit but open to 6-month consulting transition.' }, created_at: '2026-02-04T15:00:00Z' },
      { event_type: 'stage_change', payload: { from: 'sourced', to: 'reviewed' }, created_at: '2026-02-08T10:00:00Z' },
      { event_type: 'stage_change', payload: { from: 'reviewed', to: 'loi' }, created_at: '2026-02-20T10:00:00Z' },
      { event_type: 'note', payload: { text: 'LOI draft sent. Offering $3.0M with $2.4M SBA + $300K seller note + $300K equity. Linda reviewing.' }, created_at: '2026-02-25T17:00:00Z' },
    ]),
  },
  {
    id: 'd3',
    name: 'GreatLakes IT Managed Services',
    source: 'BizBuySell',
    stage_id: 'due_diligence',
    owner: 'Jacob Fenton',
    description: 'MSP serving SMB clients in Metro Detroit. 85% recurring MRR. Strong ops manager already in place. High multiple ask but fundamentals justify.',
    next_follow_up_at: '2026-03-12',
    status: 'active',
    created_at: '2026-02-10',
    updated_at: '2026-03-01',
    asking_price_k: 4500,
    sde_k: 950,
    gm_adjusted_k: 430,
    revenue_k: 3800,
    ebitda_k: 880,
    industry: 'IT / MSP',
    location: 'Southfield, MI',
    years_in_business: 12,
    employees: 23,
    top_customer_pct: 22,
    recurring_revenue_pct: 85,
    remote_operable: true,
    owner_dependence: 2,
    custom_fields: { company: 'GreatLakes IT Managed Services', nda_type: 'Unilateral', cim_type: 'Full CIM', gross_margin: 68 },
    contacts: [
      { contact: CONTACTS[1], relationship_role: 'Listing Broker' },
      { contact: CONTACTS[4], relationship_role: 'Seller' },
    ],
    scores: mkScores({ financials: 88, operations: 92, defensibility: 90, market: 85, structure: 75 }),
    milestones: mkMilestones(['m1','m2','m3','m4','m5','m6','m7','m8'], ['m9','m10']),
    documents: [
      { id: 'doc6', deal_id: 'd3', filename: 'GLITS_CIM.pdf', size_bytes: 4200000, mime_type: 'application/pdf', uploader: 'Jacob Fenton', created_at: '2026-02-12' },
      { id: 'doc7', deal_id: 'd3', filename: 'GLITS_Financials.xlsx', size_bytes: 310000, mime_type: 'application/vnd.ms-excel', uploader: 'Jacob Fenton', created_at: '2026-02-14' },
      { id: 'doc8', deal_id: 'd3', filename: 'GLITS_OrgChart.pdf', size_bytes: 450000, mime_type: 'application/pdf', uploader: 'Jacob Fenton', created_at: '2026-02-20' },
      { id: 'doc9', deal_id: 'd3', filename: 'LOI_Executed.pdf', size_bytes: 125000, mime_type: 'application/pdf', uploader: 'Jacob Fenton', created_at: '2026-02-28' },
    ],
    timeline: mkTimeline([
      { event_type: 'deal_created', payload: { note: 'Found on BizBuySell. Listed by Murphy Business.' }, created_at: '2026-02-10T09:00:00Z' },
      { event_type: 'stage_change', payload: { from: 'sourced', to: 'reviewed' }, created_at: '2026-02-14T11:00:00Z' },
      { event_type: 'stage_change', payload: { from: 'reviewed', to: 'loi' }, created_at: '2026-02-22T10:00:00Z' },
      { event_type: 'stage_change', payload: { from: 'loi', to: 'due_diligence' }, created_at: '2026-03-01T09:00:00Z' },
      { event_type: 'note', payload: { text: 'LOI executed. DD kicked off. Key risk: top customer at 22% — need to understand contract terms and renewal history.' }, created_at: '2026-03-01T14:00:00Z' },
      { event_type: 'task', payload: { text: 'Request customer concentration detail and top 10 contract terms', due: '2026-03-10' }, created_at: '2026-03-02T08:00:00Z' },
    ]),
  },
  {
    id: 'd4',
    name: 'Arbor Landscape Group',
    source: 'VR Business Brokers',
    stage_id: 'passed',
    owner: 'Jacob Fenton',
    description: 'Residential landscaping. Owner IS the business — all key relationships personal. Heavy seasonal. Passed.',
    status: 'archived',
    created_at: '2026-01-28',
    updated_at: '2026-02-05',
    asking_price_k: 1800,
    sde_k: 380,
    gm_adjusted_k: 90,
    revenue_k: 1400,
    industry: 'Landscaping',
    location: 'Ypsilanti, MI',
    years_in_business: 9,
    employees: 11,
    top_customer_pct: 38,
    recurring_revenue_pct: 20,
    remote_operable: false,
    owner_dependence: 9,
    custom_fields: { company: 'Arbor Landscape Group', nda_type: 'None', cim_type: 'Teaser', gross_margin: 35 },
    contacts: [],
    scores: mkScores({ financials: 28, operations: 15, defensibility: 20, market: 35, structure: 40 }),
    milestones: mkMilestones(['m1','m2']),
    documents: [],
    timeline: mkTimeline([
      { event_type: 'deal_created', payload: { note: 'Broker referral.' }, created_at: '2026-01-28T09:00:00Z' },
      { event_type: 'stage_change', payload: { from: 'sourced', to: 'reviewed' }, created_at: '2026-02-02T10:00:00Z' },
      { event_type: 'note', payload: { text: 'Passed. Owner dependence is a hard no. SDE below floor, GM-adjusted CF is thin. Seasonal concentration risk.' }, created_at: '2026-02-05T10:00:00Z' },
      { event_type: 'stage_change', payload: { from: 'reviewed', to: 'passed' }, created_at: '2026-02-05T10:05:00Z' },
    ]),
  },
  {
    id: 'd5',
    name: 'Cornerstone B2B Staffing',
    source: 'Axial',
    stage_id: 'sourced',
    owner: 'Jacob Fenton',
    description: 'Light industrial staffing placements in Detroit metro. Lean team. Solid ops lead already running day-to-day.',
    next_follow_up_at: '2026-03-07',
    status: 'active',
    created_at: '2026-02-18',
    updated_at: '2026-02-18',
    asking_price_k: 2200,
    sde_k: 560,
    gm_adjusted_k: 225,
    revenue_k: 5100,
    industry: 'Staffing',
    location: 'Detroit, MI',
    years_in_business: 15,
    employees: 8,
    top_customer_pct: 28,
    recurring_revenue_pct: 40,
    remote_operable: true,
    owner_dependence: 3,
    custom_fields: { company: 'Cornerstone B2B Staffing', nda_type: 'None', cim_type: 'None', gross_margin: null },
    contacts: [
      { contact: CONTACTS[5], relationship_role: 'Deal Source' },
    ],
    scores: mkScores({ financials: 65, operations: 72, defensibility: 55, market: 60, structure: 70 }),
    milestones: mkMilestones(['m1']),
    documents: [],
    timeline: mkTimeline([
      { event_type: 'deal_created', payload: { note: 'Sourced via Axial. Sarah Brennan intro.' }, created_at: '2026-02-18T10:00:00Z' },
      { event_type: 'note', payload: { text: 'Need CIM. Emailed broker. Customer concentration at 28% is a yellow flag — need to understand if top customer is under contract.' }, created_at: '2026-02-20T09:00:00Z' },
    ]),
  },
]

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  ownerName: 'Jacob Fenton',
  buyBox: [
    { id: 'bb1', text: 'SDE $500K–$1.5M' },
    { id: 'bb2', text: 'Price $2M–$6M' },
    { id: 'bb3', text: 'SE Michigan / Remote' },
    { id: 'bb4', text: '≥7 yrs in business' },
    { id: 'bb5', text: 'Low owner dependence' },
  ],
}

// ── Store ──────────────────────────────────────────────────────────────────
interface AppState {
  deals: Deal[]
  stages: Stage[]
  categories: ScoreCategory[]
  milestones: DiligenceMilestone[]
  contacts: Contact[]
  fieldDefs: DealFieldDef[]
  activeDealId: string | null
  sidebarOpen: boolean
  settings: AppSettings

  setActiveDeal: (id: string | null) => void
  setSidebarOpen: (v: boolean) => void
  addDeal: (deal: Deal) => void
  updateDeal: (id: string, patch: Partial<Deal>) => void
  deleteDeal: (id: string) => void
  moveDeal: (dealId: string, newStageId: string) => void
  addTimelineEvent: (dealId: string, event: TimelineEvent) => void
  updateMilestone: (dealId: string, status: DealMilestoneStatus) => void
  updateScore: (dealId: string, score: DealScore) => void
  addDocument: (dealId: string, doc: Document) => void
  updateSettings: (patch: Partial<AppSettings>) => void
  addBuyBoxItem: () => void
  updateBuyBoxItem: (id: string, text: string) => void
  removeBuyBoxItem: (id: string) => void
  addFieldDef: (def: Omit<DealFieldDef, 'position'>) => void
  updateFieldDef: (id: string, patch: Partial<DealFieldDef>) => void
  removeFieldDef: (id: string) => void
  addContact: (contact: Contact) => void
  deleteContact: (contactId: string) => void
  addDealContact: (dealId: string, dc: DealContact) => void
  removeDealContact: (dealId: string, contactId: string) => void
}

export const useStore = create<AppState>((set) => ({
  deals: SEED_DEALS,
  stages: DEFAULT_STAGES,
  categories: DEFAULT_CATEGORIES,
  milestones: DEFAULT_MILESTONES,
  contacts: CONTACTS,
  fieldDefs: DEFAULT_FIELD_DEFS,
  activeDealId: null,
  sidebarOpen: true,
  settings: DEFAULT_SETTINGS,

  setActiveDeal: (id) => set({ activeDealId: id }),
  setSidebarOpen: (v) => set({ sidebarOpen: v }),

  addDeal: (deal) => set((s) => ({ deals: [...s.deals, deal] })),

  deleteDeal: (id) => set((s) => ({ deals: s.deals.filter((d) => d.id !== id) })),

  updateDeal: (id, patch) =>
    set((s) => ({
      deals: s.deals.map((d) => (d.id === id ? { ...d, ...patch, updated_at: new Date().toISOString() } : d)),
    })),

  moveDeal: (dealId, newStageId) =>
    set((s) => {
      const deal = s.deals.find((d) => d.id === dealId)
      if (!deal || deal.stage_id === newStageId) return s
      const event: TimelineEvent = {
        id: `t${Date.now()}`,
        deal_id: dealId,
        actor: 'Jacob Fenton',
        event_type: 'stage_change',
        payload: { from: deal.stage_id, to: newStageId },
        created_at: new Date().toISOString(),
      }
      return {
        deals: s.deals.map((d) =>
          d.id === dealId
            ? { ...d, stage_id: newStageId, updated_at: new Date().toISOString(), timeline: [event, ...d.timeline] }
            : d
        ),
      }
    }),

  addTimelineEvent: (dealId, event) =>
    set((s) => ({
      deals: s.deals.map((d) =>
        d.id === dealId ? { ...d, timeline: [event, ...d.timeline] } : d
      ),
    })),

  updateMilestone: (dealId, status) =>
    set((s) => ({
      deals: s.deals.map((d) =>
        d.id === dealId
          ? { ...d, milestones: d.milestones.map((m) => (m.milestone_id === status.milestone_id ? status : m)) }
          : d
      ),
    })),

  updateScore: (dealId, score) =>
    set((s) => ({
      deals: s.deals.map((d) =>
        d.id === dealId
          ? { ...d, scores: d.scores.map((sc) => (sc.category_id === score.category_id ? score : sc)) }
          : d
      ),
    })),

  addDocument: (dealId, doc) =>
    set((s) => ({
      deals: s.deals.map((d) =>
        d.id === dealId ? { ...d, documents: [...d.documents, doc] } : d
      ),
    })),

  updateSettings: (patch) =>
    set((s) => ({ settings: { ...s.settings, ...patch } })),

  addBuyBoxItem: () =>
    set((s) => ({
      settings: {
        ...s.settings,
        buyBox: [...s.settings.buyBox, { id: `bb${Date.now()}`, text: '' }],
      },
    })),

  updateBuyBoxItem: (id, text) =>
    set((s) => ({
      settings: {
        ...s.settings,
        buyBox: s.settings.buyBox.map((item) => (item.id === id ? { ...item, text } : item)),
      },
    })),

  removeBuyBoxItem: (id) =>
    set((s) => ({
      settings: {
        ...s.settings,
        buyBox: s.settings.buyBox.filter((item) => item.id !== id),
      },
    })),

  addFieldDef: (def) =>
    set((s) => {
      const position = s.fieldDefs.length
      const newDef: DealFieldDef = { ...def, position }
      return { fieldDefs: [...s.fieldDefs, newDef] }
    }),

  updateFieldDef: (id, patch) =>
    set((s) => ({
      fieldDefs: s.fieldDefs.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    })),

  removeFieldDef: (id) =>
    set((s) => ({
      fieldDefs: s.fieldDefs.filter((f) => f.id !== id),
    })),

  addContact: (contact) =>
    set((s) => ({ contacts: [...s.contacts, contact] })),

  deleteContact: (contactId) =>
    set((s) => ({
      contacts: s.contacts.filter((c) => c.id !== contactId),
      deals: s.deals.map((d) => ({
        ...d,
        contacts: d.contacts.filter((dc) => dc.contact.id !== contactId),
      })),
    })),

  addDealContact: (dealId, dc) =>
    set((s) => ({
      deals: s.deals.map((d) =>
        d.id === dealId
          ? { ...d, contacts: [...d.contacts, dc], updated_at: new Date().toISOString() }
          : d
      ),
    })),

  removeDealContact: (dealId, contactId) =>
    set((s) => ({
      deals: s.deals.map((d) =>
        d.id === dealId
          ? { ...d, contacts: d.contacts.filter((dc) => dc.contact.id !== contactId), updated_at: new Date().toISOString() }
          : d
      ),
    })),
}))
