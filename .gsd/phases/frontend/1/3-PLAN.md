---
phase: 1
plan: 3
wave: 2
depends_on: [1, 2]
---

# Plan 1.3: Landing Page, Auth Modal & Market Explorer

## Objective
Implement pixel-polished Next.js components for the Landing Page, 18+ Regulatory Auth Modal, and Market Explorer, adapting the generated HTML/CSS from Stitch screens 01, 02, and 05 into modular React components using the 5-color palette.

## Context
- [`designs/stitch/01-landing-page.html`](file:///c:/Users/Sharanya%20Nagar/Desktop/Projects/mudra/designs/stitch/01-landing-page.html)
- [`designs/stitch/02-auth-modal.html`](file:///c:/Users/Sharanya%20Nagar/Desktop/Projects/mudra/designs/stitch/02-auth-modal.html)
- [`designs/stitch/05-market-explorer.html`](file:///c:/Users/Sharanya%20Nagar/Desktop/Projects/mudra/designs/stitch/05-market-explorer.html)

## Tasks

<task type="auto">
  <name>Build Landing Page and 18+ Auth Modal components</name>
  <files>src/components/landing/HeroSection.tsx, src/components/landing/FeaturesExplainer.tsx, src/components/auth/AuthModal.tsx, src/app/page.tsx</files>
  <action>
    1. Extract and adapt structure from `designs/stitch/01-landing-page.html`:
       - Header with Mudra emerald logo, market badge, and sign-in button.
       - Hero section highlighting ₹1,00,000 virtual balance and zero-risk message.
       - 3-step educational explainer cards.
       - Trust footer with SEBI / no-advice disclaimer.
    2. Extract and adapt modal from `designs/stitch/02-auth-modal.html`:
       - Google OAuth button + Magic link form.
       - Mandatory 18+ and virtual simulator checkboxes (blocks submission if unchecked).
       - Unique display name input.
       - Connect state so clicking "Start Trading with ₹1,00,000 Virtual" opens AuthModal.
  </action>
  <verify>npm run build --dry-run || npx tsc --noEmit</verify>
  <done>Landing page renders with all sections, disclaimer badges, and functional AuthModal open/close toggle.</done>
</task>

<task type="auto">
  <name>Build Market Explorer page with real-time search and sector filters</name>
  <files>src/components/explorer/SearchBar.tsx, src/components/explorer/SectorFilterPills.tsx, src/components/explorer/StockTable.tsx, src/app/explore/page.tsx</files>
  <action>
    Extract and adapt layout from `designs/stitch/05-market-explorer.html`:
    - Search input filtering instruments by symbol or company name with debouncing (<300ms response).
    - Horizontal scrolling sector pills ("All", "IT", "Banking", "Energy", "Automobile", "Pharma").
    - Stock table / card grid showing Symbol, Name, Exchange badge, Last Close Price formatted in ₹ with `formatINR`, and Day Change % with up/down arrows.
    - Neutral sorting controls (Name, Change %, Price) — no biased "top picks".
    - Action buttons: Watchlist star toggle and "Trade" linking to `/stock/[symbol]`.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>Market Explorer displays 50 sample stocks, filters dynamically on typing, and responds to sector pill clicks.</done>
</task>

## Success Criteria
- [ ] Landing page matches Stitch screen 01 design tokens and copy.
- [ ] Auth modal requires 18+ tick before proceeding.
- [ ] Explorer filters stocks seamlessly using client-side search against mock data.
