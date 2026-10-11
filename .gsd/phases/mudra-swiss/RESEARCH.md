---
phase: indisea-frontend
level: 2
researched_at: 2026-10-11
reference_url: https://indisea.com/
---

# Phase: Indisea Website Recreation — Research & Architecture Analysis

## 1. Questions Investigated
1. **Visual & Design System**: What are the exact color tokens, typography scales, spacing grids, and shape radii that define the Indisea design aesthetic?
2. **Component & Section Breakdown**: What is the complete DOM order and responsive layout structure across Sections 01 through 09, Header, and Footer?
3. **Interactive Behaviors & Animations**:
   - How does the Hero cycling verb animation work?
   - How does the Connector Wall dual infinite marquee operate?
   - How is the Section 05 orthogonal routing diagram (`Your product` -> `Indisea hub` -> 4 platform categories) calculated and rendered?
   - How does the scroll-driven SVG spine line behave and navigate around content/obstacles?
   - How does the header and menu toggle react dynamically to the polarity of sections passing under it?
4. **Asset & Icon Strategy**: How are the brand marks, connector logos, client masks, and icons structured, and can they be loaded losslessly without third-party dependencies?
5. **Codebase Integration**: How to integrate this pixel-perfect implementation cleanly within the project's existing Next.js/React environment without breaking existing work?

---

## 2. Findings

### A. Design System Tokens (`indisea-design-system`)
Extracted from canonical live CSS (`tokens/colors.css`, `tokens/typography.css`, `tokens/modes.css`, `tokens/shape.css`, `tokens/spacing.css`):
- **Brand Colors**:
  - Stone (Light Canvas): `#F0EDEA` (`--indisea-stone` / `--indisea-stone-100`)
  - Charcoal (Heading/Dark): `#262626` (`--indisea-charcoal` / `--indisea-stone-900`)
  - Nearly White (Card Surface): `#FAFAF9` (`--indisea-nearly-white` / `--indisea-stone-50`)
  - Nearly Charcoal (Dark Canvas): `#363636` / `#181A1D` (`--indisea-nearly-charcoal` / `--indisea-stone-800`)
  - Sky Blue: `#3BBFF7` (accent, CTA fill, hub terminal, logo paths)
  - Signal Yellow: `#EEA02B` (highlight chips for "Avalara", "Google", "Series A", verb cycle)
  - Link Green: `#07A240` (accounting branch, hover cards)
  - Node Red: `#C92121` (payments branch, contact link numeral)
- **Typography Scale**:
  - Font Sans: `"IBM Plex Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
  - Font Mono: `"IBM Plex Mono", ui-monospace, Menlo, Consolas, monospace`
  - Fixed weights: 400 (regular/body), 500 (medium/headings), 600 (semibold/display/eyebrows)
  - Negative Swiss tracking: `--tracking-display: -0.035em`, `--tracking-heading: -0.032em`, `--tracking-body: -0.011em`, `--tracking-caps: 0.07em`
  - Fluid clamp display sizes:
    - Hero H1: `clamp(46px, min(9.4vw, 124.8px), 190px)` with `line-height: 0.92`
    - Section 04 H2: `clamp(40px, min(7.4vw, 98.3px), 158px)` with `line-height: 0.94`
    - Section 05 H2: `clamp(32px, min(4.4vw, 58.4px), 76px)` with `line-height: 0.98`
    - Section 09 H2: `clamp(40px, min(6.4vw, 85px), 124px)` with `line-height: 0.94`
- **Layout & Rhythm**:
  - Base grid: 12 columns (desktop) -> 8 columns (tablet <1024px) -> 4 columns (mobile <640px)
  - Margin: `clamp(20px, min(4vw, 53.1px), 64px)`
  - Gutter: `clamp(16px, min(1.7vw, 22.6px), 24px)`
  - Section vertical rhythm: `--section: clamp(152px, 19vh, 320px)`

### B. Section-by-Section Specification
1. **Fixed Header & Fullscreen Navigation**:
   - Fixed header at top with logo and circular hamburger toggle button.
   - Dynamic polarity: switches logo (`Indisea-Logo-Primary.svg` vs `-Alt.svg`) and button background token `--menu-fill` based on what block is passing beneath.
   - Slide-down fullscreen menu (01 Home, 02 About, 03 Connectors, 04 Contact) with dynamic hover fill canvas in the right column (Blue, Yellow, Green, Red).
   - Bottom metadata row: Email, Phone, Office address, and Light/Dark theme toggle.
2. **01 / Hero**:
   - Eyebrow `01 / hero`.
   - Massive 4-line headline with line masks:
     "We [build], [host], / and [maintain] / connectors / for FinTechs".
   - Verbs `build`, `host`, `maintain` highlight sequentially every 2.5s in Signal Yellow (`#EEA02B`).
   - "Talk to us" pill button (links to `cal.com/team/indisea/talk-to-us` or contact) + "Scroll" cue with down arrow.
3. **02 / Connector Wall**:
   - Eyebrow `02 / twelve connectors, live`.
   - Dual row infinite marquee (Row A moving left, Row B moving right).
   - 12 connector cards in each row (duplicated for continuous seamless loop): QuickBooks, NetSuite, Coupa, Shopify, Xero, WooCommerce, Shopware, BigCommerce, Chargebee, Adobe Commerce, Stripe, Rillet.
   - Hover dimming (0.3 opacity on siblings, 1.0 on active) + caption slide reveal (`[Name] · [Sector]`).
4. **03 / Who We Are**:
   - Eyebrow `03 / who we are`.
   - 2-column rail (cols 1-3) / main (cols 5-12) split.
   - Two large statement paragraphs highlighting "Avalara" and "Google" in yellow badge chips.
5. **04 / The Problem**:
   - Dark theme block (`[data-theme="dark"]`).
   - Eyebrow `04 / the problem`.
   - 3-line display heading: "Connectors shouldn't be your engineering priority".
   - Yellow accent bar (72px x 4px) and fine copy column (cols 9-12).
6. **05 / Indisea's Impact**:
   - Eyebrow `05 / Indisea's impact`.
   - Left col: Heading "We sit between your product and every system it has to reach" + 2 descriptive paragraphs.
   - Right col: Interactive SVG orthogonal connection diagram:
     - `Your product` (monitor icon in circular node)
     - `Indisea hub` (Indisea icon node)
     - 4 destination nodes: `NetSuite (ERP)`, `QuickBooks (Accounting)`, `Shopify (eCommerce)`, `Stripe (PAYMENTS & TAX)`.
     - SVG orthogonal branches animate into view with stroke-dashoffset transitions.
   - Bottom row: 3 feature cards ("01 Launch faster, say yes more often", "02 Expertise you can't easily hire", "03 A partner, not a vendor") with vibrant color hovers (Sky Blue, Signal Yellow, Link Green).
7. **06 / Why Companies Call Us**:
   - Eyebrow `06 / why companies call us`.
   - 3 reason cards:
     - Reason 1: "Connector gaps in sales calls" (Sky Blue top cap, dark body).
     - Reason 2: "Constrained Product and Engineering" (Signal Yellow top cap, dark body).
     - Reason 3: "An existing customer needs a new connector" (Link Green top cap, dark body).
8. **07 / Who We Work With**:
   - Eyebrow `07 / who we work with`.
   - Statement: "We primarily work with [Series A through growth stage] FinTech companies..."
   - 5 client cards with SVG masks: `Zamp` (Sales tax), `CereTax` (Tax engine), `Valid8` (Forensic accounting), `Mondial` (FinTech), `Sovos` (Tax compliance).
9. **08 / Proof (Customer Quotes)**:
   - Dark theme block (`[data-theme="dark"]`).
   - Eyebrow `08 / proof` + Heading "What our customers are saying".
   - 3 large quote cards with hover color backgrounds (Sky Blue, Signal Yellow, Link Green) and client attribution.
10. **09 / Final CTA**:
    - Vivid Sky Blue block (`[data-mode="blue"]`).
    - Eyebrow `09 / talk to us`.
    - Massive headline: "Let's start / building a / connection".
    - Pill CTA button "Talk to us" + email & phone links.
11. **Footer**:
    - Dark theme block.
    - Brand col (logo + summary), Navigation col, Company col (`SOC2-TYPE-II`), Contact col (copy-to-clipboard email button, phone, Wichita address).
    - Bottom sub-footer: Copyright, credit, and "Back to top" button.
12. **SVG Spine**:
    - Continuous orthogonal background line routing down the page with smooth curved corners, drawn with scroll progress from Section 01 through Section 09.

---

## 3. Decisions Made
| Decision | Choice | Rationale |
|---|---|---|
| Framework Integration | Next.js 14 App Router in `client/` | Leverage existing setup, zero unnecessary dependencies, native fast refresh |
| Styling Approach | CSS variables + Tailwind tokens in `globals.css` | Ensures exact 1:1 match with Indisea's design tokens and fluid typography clamp equations |
| Asset Delivery | Direct inline/public SVGs for brand marks & clients | Guarantees 100% offline uptime, crisp resolution at any scale, exact color fills |
| Font Loading | Google Fonts (`IBM Plex Sans` & `IBM Plex Mono`) | Perfect fidelity to Indisea's typography without missing local files |
| State Management | React `useState` + `useEffect` hooks for theme & menu | Clean, standard, SSR-safe, no external heavy libraries required |

---

## 4. Dependencies & Assets Identified
- **Fonts**: `IBM Plex Sans` (400, 500, 600) + `IBM Plex Mono` (400, 500, 600)
- **Icons**: Phosphor icons / inline SVG icons matching `ph-fill`
- **Brand Assets**:
  - `Indisea-Logo-Primary.svg` (light wordmark)
  - `Indisea-Logo-Primary-Alt.svg` (dark wordmark)
  - `Indisea-Icon-Solid-Charcoal.svg` & `Indisea-Icon-Solid-White.svg`
  - Client SVG masks: Zamp, CereTax, Valid8, Mondial, Sovos
  - Connector logos: QuickBooks, NetSuite, Coupa, Shopify, Xero, WooCommerce, Shopware, BigCommerce, Chargebee, Adobe Commerce, Stripe, Rillet

---

## 5. Ready for Implementation
- [x] Full HTML structure and CSS variables mapped
- [x] Exact copy extracted for all 9 sections and footer
- [x] Animation logic (verbs, marquee, orthogonal SVG spine, node routing) fully analyzed
- [x] Responsive layout rules verified for Desktop, Tablet, and Mobile
