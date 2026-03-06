# JacobOps — Acquisition Dealflow OS

Your personal acquisition dealflow operating system. Built to match JanusOps functionality, pre-loaded with your buy box criteria.

## Features (MVP)

- **Kanban pipeline** — drag & drop deals between stages with auto timeline events
- **Table view** — sortable deal list with all key financials at a glance
- **Auto scoring** — weighted deal grade (A/B/C/D) across 5 buy-box-aligned categories
- **Deal drawer** — full detail panel with 6 tabs:
  - Overview (financials + ops metrics)
  - Timeline (notes, stage changes, tasks — append-only)
  - Scoring (per-category sliders with live weighted score)
  - Diligence (12 configurable milestones with click-to-cycle status)
  - Documents (upload UI + metadata)
  - Contacts (linked sellers, brokers, advisors)
- **Contacts page** — table + detail panel with linked deals
- **Stats bar** — live pipeline snapshot
- **Add deal modal** — full intake form with every buy box field

## Score Categories (weighted)

| Category | Weight | What it measures |
|---|---|---|
| Financial Fit | 30% | SDE, price multiple, GM-adjusted CF |
| Operational Quality | 25% | Owner dependence, team depth, SOPs |
| Business Defensibility | 20% | Recurring revenue, customer concentration |
| Market & Growth | 15% | Industry tailwinds, growth potential |
| Deal Structurability | 10% | Seller note potential, SBA eligibility |

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Run dev server
npm run dev

# 3. Open in browser
open http://localhost:3000
```

## Requirements

- Node.js 18+
- npm 9+

## Next Steps (Phase 2)

When you're ready to go beyond the frontend mock:

- **Backend**: Supabase (Postgres + Auth + Storage) — maps directly to the domain model in the spec
- **Auth**: Supabase Auth or NextAuth
- **File uploads**: Supabase Storage or S3
- **AI scoring**: Anthropic API for auto-analysis of CIM uploads
- **Email integration**: Gmail/Outlook for timeline sync
