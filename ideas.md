# 369 Alliance System – Design Ideas

## Design Approach Options

<response>
<text>
**Option A – Deep Navy Command Centre**
- **Design Movement**: Government-grade enterprise dashboard, inspired by Australian regulatory authority interfaces
- **Core Principles**: Authority through restraint; data-first hierarchy; structured density without clutter; professional credibility
- **Color Philosophy**: Deep Navy (#1a1a2e) as the dominant shell — headers, sidebars, nav bars. Bronze gradient (#7A6342 → #A68A64) as the accent for interactive elements, CTAs, and highlights. White/light-grey for content surfaces. Red/amber/green for status indicators.
- **Layout Paradigm**: Fixed top header bar (Deep Navy) + full-width tab bar below it. Content area is a scrollable table-first layout. Modals for add/edit. Left panel for timeline project list.
- **Signature Elements**: Bronze gradient buttons; Deep Navy header with white text; status badge chips (Low/Medium/High risk) in traffic-light colours
- **Interaction Philosophy**: Click-to-reveal filters; row-click opens detail modal; tab switching highlights active tab with bronze underline
- **Animation**: Subtle fade-in on modal open; smooth tab underline slide; row hover lift (shadow)
- **Typography System**: IBM Plex Sans (body/UI) + IBM Plex Mono (codes/numbers). Clean, authoritative, legible at small sizes.
</text>
<probability>0.08</probability>
</response>

<response>
<text>
**Option B – Slate & Copper Professional**
- **Design Movement**: Modern SaaS enterprise, influenced by Atlassian/Linear design language
- **Core Principles**: Minimal chrome; content-forward; consistent spacing grid; accessible contrast
- **Color Philosophy**: Slate-900 header, white body, copper/bronze accents for interactive states. Muted greys for secondary text.
- **Layout Paradigm**: Sticky top nav + secondary tab bar. Full-width table with frozen first columns. Slide-in drawer for project details.
- **Signature Elements**: Copper border-left on active items; pill-shaped status badges; subtle grid lines on tables
- **Interaction Philosophy**: Hover states reveal action buttons; inline editing; keyboard-navigable filters
- **Animation**: Drawer slides from right; filter chips animate in; skeleton loading states
- **Typography System**: Geist Sans (headings) + Inter (body). Modern, neutral, highly legible.
</text>
<probability>0.06</probability>
</response>

<response>
<text>
**Option C – Authoritative Dark Navy with Bronze Accents (CHOSEN)**
- **Design Movement**: Australian Government regulatory system — professional, dense, functional
- **Core Principles**: Deep Navy dominance; Bronze gradient as the identity accent; clear information hierarchy; role-based colour coding for status
- **Color Philosophy**: #1a1a2e (Deep Navy) for all structural chrome (header, tab bar, modals headers). Bronze gradient (#7A6342 → #A68A64) for primary action buttons, active tab indicators, and key CTAs. White (#ffffff) for content surfaces. Status colours: green (low/closed), amber (medium/WIP), red (high/SWO), purple (BWRO).
- **Layout Paradigm**: Full-width fixed header (Deep Navy, 56px). Tab row below (INTEL, OC Inspections, OC, DBP) with active bronze underline. Search + action bar. Scrollable data table with horizontal scroll for overflow columns.
- **Signature Elements**: Bronze gradient on primary buttons; Deep Navy header with 369 Alliance logo left + user info right; coloured risk badges; project code in monospace
- **Interaction Philosophy**: Filter labels click-to-expand; table rows open View/Modify modal; Report/Order/History/Tools open full-screen overlay pages
- **Animation**: Modal fade+scale; tab indicator slide; filter panel accordion expand; row hover subtle background shift
- **Typography System**: IBM Plex Sans for UI text; IBM Plex Mono for codes and numbers. Sizes: 13px table cells, 14px labels, 16px headings, 24px page titles.
</text>
<probability>0.09</probability>
</response>

## Selected Design: Option C — Authoritative Dark Navy with Bronze Accents

This design reflects the professional, regulatory nature of the 369 Alliance system. The Deep Navy (#1a1a2e) establishes authority and professionalism, while the Bronze gradient (#7A6342 → #A68A64) provides warmth and brand identity. The layout prioritises data density and efficient workflow for inspectors and administrators.
