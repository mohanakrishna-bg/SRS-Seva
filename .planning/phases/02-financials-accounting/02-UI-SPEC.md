---
phase: 2
slug: financials-accounting
status: approved
shadcn_initialized: false
preset: glassmorphism-temple
created: 2026-04-22
---

# Phase 2 — UI Design Contract: Financials & Accounting

> Visual and interaction contract for receipt generation, payment tracking, and daily ledger views.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none (Tailwind CSS only) |
| Preset | glassmorphism-temple |
| Component library | Custom (extends Phase 1 glass system) |
| Icon library | lucide-react |
| Font | Inter (numbers/body) + Outfit (headings) — load from Google Fonts |

---

## Spacing Scale

Declared values (must be multiples of 4):

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon gaps, inline padding |
| sm | 8px | Compact element spacing |
| md | 16px | Default element spacing |
| lg | 24px | Section padding |
| xl | 32px | Layout gaps |
| 2xl | 48px | Major section breaks |
| 3xl | 64px | Page-level spacing |

Exceptions: Receipt card uses 20px internal padding for print-safe margins.

---

## Typography

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Body | 14px | 400 | 1.5 |
| Label | 12px | 500 | 1.4 |
| Heading | 20px | 700 | 1.3 |
| Display | 32px | 800 | 1.2 |
| Monospace (amounts) | 14px | 600 | 1.4 |

Currency/amount values MUST use tabular-nums (`font-variant-numeric: tabular-nums`) for column alignment in ledger views.

---

## Color

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `#121212` → `#1A0F02` gradient | Page background |
| Secondary (30%) | `rgba(255,255,255,0.08)` | Glass cards, table rows |
| Accent/Saffron (10%) | `#FF9933` | Primary CTAs, active states, income highlights |
| Gold | `#D4AF37` | Headings, section labels, balance amount |
| Income | `#00E676` | Positive amounts, income rows |
| Expense | `#FF5252` | Negative amounts, expense rows |
| Neutral text | `#E6CDA9` | Body copy on dark background |
| Muted | `rgba(255,255,255,0.4)` | Labels, secondary text |

Accent (saffron) reserved for: primary CTA buttons, active tab underline, receipt download button, selected payment mode card.

---

## Component Contracts

### 1. Daily Summary Grid (top of FinancialsDashboard)
- 4 metric cards in a responsive grid (2×2 on mobile, 4×1 on desktop)
- Cards: Opening Balance (Gold), Total Income (Income green), Total Expenses (Expense red), Closing Balance (Saffron)
- Each card: large display-size number + label below + subtle % change badge
- Glass card: `bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl`

### 2. Payment Mode Selector
- Segmented toggle with 3 options: Cash | UPI | Cheque/DD
- Active mode: `bg-saffron/20 border-saffron text-saffron`
- Inactive: `bg-white/5 border-white/10 text-white/60`
- UPI selected → show QR code placeholder + UTR input field below
- Cash selected → show "Amount Received" + "Change" fields
- Cheque selected → show Cheque No, Bank, Branch fields

### 3. Digital Receipt Card
- Vertical card with temple name/logo at top
- Dashed divider (`border-dashed border-white/20`) separating header from line items
- Itemized rows: Seva name | Qty | Amount (right-aligned, monospace)
- Totals row: bold, with top border
- Footer: Transaction ID, timestamp in `text-xs font-mono text-white/40`
- Action buttons below card: "Download PDF" (saffron fill) | "Share" (ghost)

### 4. Daily Ledger Table
- Full-width table with `divide-y divide-white/10`
- Columns: Date | Voucher No | Description | Mode | Debit | Credit | Balance
- Row hover: `hover:bg-white/5`
- Amount columns: right-aligned, monospace, income green / expense red
- Sticky header row: `sticky top-0 bg-slate-900/80 backdrop-blur-sm`

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Primary CTA (receipt) | "Generate Receipt" |
| Primary CTA (payment) | "Record Payment" |
| Empty ledger heading | "No transactions today" |
| Empty ledger body | "Payments recorded here will appear in today's ledger." |
| Error state | "Unable to save — check your connection and try again." |
| Delete confirmation | "Delete payment: This cannot be undone. Remove payment #{id}?" |
| Successful save toast | "Payment recorded successfully" |
| PDF download pending | "Generating receipt…" |

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| lucide-react | Receipt, CreditCard, Banknote, QrCode, Download, Share2 | not required |
| jsPDF (existing) | PDF generation | already in project — reuse existing ReceiptGenerator |

---

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS
- [x] Dimension 2 Visuals: PASS (glassmorphism consistent with Phase 1)
- [x] Dimension 3 Color: PASS (spiritual palette, clear income/expense differentiation)
- [x] Dimension 4 Typography: PASS (Inter for numbers, Outfit for headings)
- [x] Dimension 5 Spacing: PASS (8pt grid, 20px receipt exception documented)
- [x] Dimension 6 Registry Safety: PASS (no third-party shadcn components)

**Approval:** approved 2026-04-22
