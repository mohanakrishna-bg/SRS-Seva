---
wave: 1
depends_on: [phase-1-core-devotee-seva]
files_modified:
  - frontend/src/pages/AccountingPage.tsx
  - frontend/src/components/accounting/CollectionDashboard.tsx
  - frontend/src/components/accounting/JournalTable.tsx
  - frontend/src/components/ReceiptGenerator.tsx
  - frontend/src/components/DonationModal.tsx
  - frontend/src/index.css
autonomous: true
---

# Phase 2: Financials & Accounting

## 1. Goal

Implement the full financial tracking interface — receipt generation (FIN-01), manual payment recording for Cash/UPI/Cheque (FIN-02), and a daily ledger/collection summary dashboard (FIN-03) — aligned with the UI-SPEC glassmorphism design system.

## 2. Requirements

- FIN-01: Staff can generate receipts for seva bookings and donations.
- FIN-02: System tracks cash, cheque, and direct UPI payments manually entered by staff.
- FIN-03: System provides basic ledger tracking for daily receipts and expenditures.

---

## 3. Tasks

<task>
<id>1</id>
<title>Load Inter + Outfit fonts and apply global CSS variables</title>
<read_first>
- frontend/src/index.css
- .planning/phases/02-financials-accounting/02-UI-SPEC.md
</read_first>
<action>
1. In `frontend/index.html`, add Google Fonts preconnect + link tag in `<head>`:
   ```html
   <link rel="preconnect" href="https://fonts.googleapis.com" />
   <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
   <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Outfit:wght@400;600;700;800&display=swap" rel="stylesheet" />
   ```
2. In `frontend/src/index.css`, add at the top of `:root`:
   ```css
   --font-body: 'Inter', system-ui, sans-serif;
   --font-heading: 'Outfit', system-ui, sans-serif;
   --color-saffron: #FF9933;
   --color-gold: #D4AF37;
   --color-income: #00E676;
   --color-expense: #FF5252;
   ```
3. Set `body { font-family: var(--font-body); }` and add `.font-heading { font-family: var(--font-heading); }` utility class.
4. Add `.tabular-nums { font-variant-numeric: tabular-nums; }` utility class.
</action>
<acceptance_criteria>
- `frontend/index.html` contains `fonts.googleapis.com/css2?family=Inter`
- `frontend/src/index.css` contains `--font-body: 'Inter'`
- `frontend/src/index.css` contains `--color-saffron: #FF9933`
- `frontend/src/index.css` contains `--color-income: #00E676`
- `frontend/src/index.css` contains `tabular-nums`
</acceptance_criteria>
</task>

<task>
<id>2</id>
<title>Rebuild AccountingPage with glassmorphism design system</title>
<read_first>
- frontend/src/pages/AccountingPage.tsx
- .planning/phases/02-financials-accounting/02-UI-SPEC.md
- frontend/src/components/accounting/CollectionDashboard.tsx
</read_first>
<action>
Rewrite `frontend/src/pages/AccountingPage.tsx`:

1. **Header section**: Replace plain `<h1>Accounting</h1>` with:
   ```tsx
   <div className="bg-gradient-to-r from-[#1A0F02] to-[#121212] rounded-2xl border border-white/10 p-8 mb-6">
     <h1 className="font-heading text-3xl font-bold text-white tracking-tight">ಹಣಕಾಸು ನಿರ್ವಹಣೆ</h1>
     <p className="text-[#E6CDA9]/70 mt-1">Financial Management · Receipt Generation · Daily Ledger</p>
   </div>
   ```

2. **Daily Summary Grid** (above tabs, calls `/api/stats/daily?date=DDMMYY` and `/api/accounting/reports/collection`): 4 glass cards in a `grid grid-cols-2 md:grid-cols-4 gap-4 mb-6`:
   - **Opening Balance** (gold): Static "₹0.00" placeholder until bank module is extended.
   - **Today's Income** (green `#00E676`): Sum of `GrandTotal` from today's registrations.
   - **Today's Expenses** (red `#FF5252`): From journal entries of type Expense for today.
   - **Closing Balance** (saffron `#FF9933`): Income - Expenses.
   
   Each card: `bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6`
   Amount: `text-3xl font-heading font-bold tabular-nums`

3. **Tab nav**: Replace current `border-b` tab with a dark pill-style tab:
   `bg-white/5 border border-white/10 rounded-xl p-1 flex gap-1`
   Active tab: `bg-[#FF9933]/20 text-[#FF9933] border border-[#FF9933]/30 rounded-lg`
   Inactive: `text-white/50 hover:text-white hover:bg-white/5 rounded-lg`

4. Keep all existing `<Routes>` routing intact — only replace the shell layout.
</action>
<acceptance_criteria>
- `AccountingPage.tsx` contains `font-heading` class on h1
- `AccountingPage.tsx` contains `bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl`
- `AccountingPage.tsx` contains `#FF9933` for saffron accent
- `AccountingPage.tsx` contains `grid grid-cols-2 md:grid-cols-4`
- Existing routes (dashboard, journal, bank, reports) are preserved
</acceptance_criteria>
</task>

<task>
<id>3</id>
<title>Rebuild CollectionDashboard with glassmorphic daily ledger table</title>
<read_first>
- frontend/src/components/accounting/CollectionDashboard.tsx
- frontend/src/api.ts
- .planning/phases/02-financials-accounting/02-UI-SPEC.md
</read_first>
<action>
Rewrite `frontend/src/components/accounting/CollectionDashboard.tsx`:

1. **Date filter header**: A dark glassmorphic row with a date picker (`input type="date"` with `[color-scheme:dark]`) defaulting to today. Calls `statsApi.daily(date)` and `reportsApi.getCollectionSummary(from, to)` on date change.

2. **Payment mode breakdown pills**: 3 pill badges showing count and total for Cash, UPI, Cheque. Style:
   ```tsx
   <div className="flex gap-3 mt-4 flex-wrap">
     {['Cash', 'UPI', 'Cheque'].map(mode => (
       <div className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm">
         <span className="text-white/50">{mode}: </span>
         <span className="text-white font-semibold tabular-nums">₹{total} ({count})</span>
       </div>
     ))}
   </div>
   ```

3. **Daily Ledger Table**: Full-width table with glassmorphic rows:
   - Sticky header: `sticky top-0 bg-slate-900/80 backdrop-blur-sm text-white/50 text-xs uppercase`
   - Columns: Reg ID | Devotee | Seva | Mode | Amount
   - Row: `hover:bg-white/5 transition-colors border-b border-white/5`
   - Amount: `text-[#00E676] font-semibold tabular-nums text-right`
   - Empty state: `<p className="text-center text-white/30 py-16">No transactions today</p>`

4. **Total row** at bottom: `bg-[#FF9933]/10 border-t border-[#FF9933]/30 font-bold text-[#FF9933]`
</action>
<acceptance_criteria>
- `CollectionDashboard.tsx` contains `sticky top-0 bg-slate-900/80 backdrop-blur-sm`
- `CollectionDashboard.tsx` contains `tabular-nums`
- `CollectionDashboard.tsx` contains `#00E676` for income color
- `CollectionDashboard.tsx` contains `No transactions today` for empty state
- Component calls `reportsApi.getCollectionSummary` or `statsApi.daily`
</acceptance_criteria>
</task>

<task>
<id>4</id>
<title>Update ReceiptGenerator to match UI-SPEC receipt card design</title>
<read_first>
- frontend/src/components/ReceiptGenerator.tsx
- .planning/phases/02-financials-accounting/02-UI-SPEC.md
</read_first>
<action>
In `frontend/src/components/ReceiptGenerator.tsx`, update the on-screen receipt preview (not the PDF output) to match the UI-SPEC receipt card design:

1. **Receipt card wrapper**: 
   ```tsx
   <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 max-w-sm mx-auto">
   ```

2. **Header**: Temple name in `font-heading text-xl font-bold text-[#D4AF37]`, address in `text-white/50 text-xs`.

3. **Dashed divider**: `<hr className="border-dashed border-white/20 my-4" />`

4. **Line items**: Each seva row:
   ```tsx
   <div className="flex justify-between py-1.5 text-sm">
     <span className="text-white/70">{sevaName}</span>
     <span className="text-white font-semibold tabular-nums">₹{amount}</span>
   </div>
   ```

5. **Grand total row**: `border-t border-white/20 pt-3 mt-2 flex justify-between font-bold text-white text-lg`

6. **Footer (transaction ID, timestamp)**: `text-xs font-mono text-white/30 text-center mt-4`

7. **Action buttons** below card:
   - "Download PDF": `bg-[#FF9933] hover:bg-[#e08820] text-white font-semibold py-2.5 px-6 rounded-xl`
   - "Share": ghost button with `border border-white/20 text-white/70 hover:text-white`
</action>
<acceptance_criteria>
- `ReceiptGenerator.tsx` contains `border-dashed border-white/20`
- `ReceiptGenerator.tsx` contains `bg-[#FF9933]` for PDF download button
- `ReceiptGenerator.tsx` contains `font-mono text-white/30` for transaction footer
- `ReceiptGenerator.tsx` contains `tabular-nums`
- `ReceiptGenerator.tsx` contains `#D4AF37` for gold temple name heading
</acceptance_criteria>
</task>

<task>
<id>5</id>
<title>Add daily stats API endpoint for financial summary</title>
<read_first>
- backend/app/main.py
- backend/app/api/accounting.py
- backend/app/schemas/accounting.py
</read_first>
<action>
In `backend/app/main.py`, update the existing `/api/stats/daily` endpoint to also return `total_income` and `total_expense` breakdown:

1. Extend the query to include `func.sum(SevaRegistration.GrandTotal)` grouped by `PaymentMode`.
2. Add a `payment_mode_breakdown` key to the response dict:
   ```python
   payment_mode_breakdown = {}
   for row in results:
       payment_mode_breakdown[row.SevaCode] = {
           "sevakartas": row.sevakarta_count,
           "prasada": int(row.total_prasada or 0),
       }
   ```
3. Also add a new endpoint `GET /api/stats/daily-summary?date=DDMMYY` that returns:
   ```python
   {
     "date": date,
     "total_registrations": count,
     "total_income": sum_of_grand_totals,
     "payment_breakdown": {"Cash": 1234.0, "UPI": 500.0, "Cheque": 0.0},
     "seva_breakdown": {...}
   }
   ```
   Query: `db.query(SevaRegistration.PaymentMode, func.sum(SevaRegistration.GrandTotal), func.count(SevaRegistration.RegistrationId)).filter(SevaRegistration.RegistrationDate == date).group_by(SevaRegistration.PaymentMode).all()`

4. Add `GET /api/stats/daily-summary` to `statsApi` in `frontend/src/api.ts`:
   ```ts
   dailySummary: (date: string) => api.get(`/stats/daily-summary?date=${date}`),
   ```
</action>
<acceptance_criteria>
- `backend/app/main.py` contains `/api/stats/daily-summary` route
- The route queries `SevaRegistration.PaymentMode` and `func.sum(SevaRegistration.GrandTotal)`
- `frontend/src/api.ts` contains `dailySummary` method in `statsApi`
- Calling `GET /api/stats/daily-summary?date=010124` returns `{"total_income": ..., "payment_breakdown": {...}}`
</acceptance_criteria>
</task>
