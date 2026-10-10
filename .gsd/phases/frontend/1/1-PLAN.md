---
phase: 1
plan: 1
wave: 1
---

# Plan 1.1: Project Scaffolding & Custom Design System Setup

## Objective
Scaffold the Next.js 14 App Router project with TypeScript, Tailwind CSS, and Lucide Icons, integrating the user-specified 5-color palette (`Graphite: #353535`, `Stormy Teal: #3c6e71`, `White: #ffffff`, `Alabaster Grey: #d9d9d9`, `Yale Blue: #284b63`) and essential Indian financial formatting utilities.

## Context
- [`.gsd/SPEC.md`](file:///c:/Users/Sharanya%20Nagar/Desktop/Projects/mudra/.gsd/SPEC.md)
- [`docs/api.md`](file:///c:/Users/Sharanya%20Nagar/Desktop/Projects/mudra/docs/api.md)
- [`designs/stitch/`](file:///c:/Users/Sharanya%20Nagar/Desktop/Projects/mudra/designs/stitch)

## Tasks

<task type="auto">
  <name>Scaffold Next.js 14 App Router project with Tailwind CSS and dependencies</name>
  <files>package.json, tsconfig.json, tailwind.config.ts, src/app/layout.tsx, src/app/globals.css</files>
  <action>
    Initialize the Next.js 14 project in the repository root (or verify structure).
    Install and configure:
    - tailwindcss, postcss, autoprefixer
    - lucide-react (for UI and navigation icons)
    - clsx, tailwind-merge (for robust class composition)
    Configure tailwind.config.ts with the exact custom Mudra color palette:
      - graphite: '#353535'
      - stormyTeal: '#3c6e71'
      - alabaster: '#d9d9d9'
      - yaleBlue: '#284b63'
      - white: '#ffffff'
    Set up dark/light tokens and root typography font Inter/Outfit.
  </action>
  <verify>npm run build --dry-run || npx tsc --noEmit</verify>
  <done>Next.js builds cleanly with TypeScript and Tailwind configured with the custom palette.</done>
</task>

<task type="auto">
  <name>Implement Indian currency formatting utilities and persistent notice banners</name>
  <files>src/lib/formatters.ts, src/components/common/DisclaimerBanner.tsx, src/components/common/MarketStatusBadge.tsx</files>
  <action>
    1. Create `src/lib/formatters.ts`:
       - `formatINR(paise: number | bigint, options?: { showSign?: boolean }): string` (formats integer paise into ₹ Lakh/Crore Indian decimal formatting).
       - `paiseToRupees(paise: number | bigint): number`.
       - `rupeesToPaise(rupees: number): bigint`.
       - `formatBps(bps: number): string` (basis points to percentage).
    2. Build `DisclaimerBanner.tsx`:
       - Persistent sticky banner: "Simulated money. Prices are end-of-day. Not investment advice." with amber alert styling.
    3. Build `MarketStatusBadge.tsx`:
       - Displays market state (Open until 15:30 IST / Closed) and data freshness (FRESH / DELAYED / OUTDATED).
  </action>
  <verify>npm run test || npx vitest run src/lib/formatters.test.ts || node -e "const f = require('./src/lib/formatters.ts');"</verify>
  <done>Formatters correctly output ₹1,00,000.00 from 10000000 paise; banner and badge components export valid React elements.</done>
</task>

## Success Criteria
- [ ] Tailwind theme contains `graphite`, `stormyTeal`, `alabaster`, `yaleBlue`, and `white`.
- [ ] Currency utilities accurately convert paise to rupee strings with Indian commas (`1,00,000`).
- [ ] Disclaimer and MarketStatusBadge components match Stitch styling.
