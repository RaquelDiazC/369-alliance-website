# 369 Alliance PTY LTD — Marketing Website
### Export Package — Final Revision 1 | `alliance369-vykdiath.manus.space`

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| UI Framework | React | 19.2 |
| Build Tool | Vite | 7.x |
| Styling | Tailwind CSS | 4.x |
| Component Library | shadcn/ui (Radix UI primitives) | latest |
| Routing | Wouter | 3.x |
| Animation | Framer Motion | 12.x |
| Icons | Lucide React | 0.453 |
| Toasts | Sonner | 2.x |
| Language | TypeScript | 5.6 |
| Package Manager | pnpm | 10.4 |
| Server (placeholder) | Express (static-only, not used in prod) | 4.x |

**Brand Design System:**

| Token | Value |
|---|---|
| Primary background | Navy `#1a1a2e` |
| Accent / gold | `#A68A64` / `#C4A46B` |
| Heading font | Montserrat (Google Fonts) |
| Body font | IBM Plex Sans (Google Fonts) |
| Theme | Dark (navy background, gold accents, white text) |
| Logo symbol | CDN: `logo_symbol_square_cd006bc9.png` (square-cropped, 280×280px) |
| Nav logo symbol | CDN: `nav_symbol_back_of_card.png` |

All external images are hosted on CDN — no local image files are included in the project.

---

## How to Run Locally

### Prerequisites
- Node.js 18+ installed
- pnpm installed: `npm install -g pnpm`

### Steps

```bash
# 1. Extract the zip and enter the project directory
unzip 369-alliance-website-export.zip
cd 369-alliance-system

# 2. Install dependencies
pnpm install

# 3. Start the development server
pnpm dev

# 4. Open in browser
# → http://localhost:3000
```

### Build for Production

```bash
pnpm build
pnpm preview
```

### Type Check

```bash
pnpm check
```

---

## Project Structure

```
369-alliance-system/
├── client/
│   ├── index.html                        ← HTML entry (Google Fonts CDN links here)
│   ├── public/                           ← favicon, robots.txt only
│   └── src/
│       ├── App.tsx                       ← Root router — website routes + system routes
│       ├── main.tsx                      ← React entry point
│       ├── index.css                     ← Global theme, CSS variables, Tailwind config
│       ├── const.ts                      ← App-wide constants
│       ├── pages/
│       │   └── website/
│       │       ├── WebsiteHome.tsx       ← Homepage — hero, pillars, CTA
│       │       ├── WebsiteAbout.tsx      ← About page — team, values, story
│       │       ├── WebsiteServices.tsx   ← Services overview page
│       │       ├── WebsiteRolePage.tsx   ← Dynamic role-specific service page
│       │       └── WebsiteContact.tsx    ← Contact page
│       ├── components/
│       │   └── website/
│       │       ├── WebsiteNav.tsx        ← Top navigation bar
│       │       ├── WebsiteFooter.tsx     ← Footer (placeholders for ABN/address/phone)
│       │       ├── ContactPopups.tsx     ← Get a Quote + Support modals
│       │       └── ui/                  ← Full shadcn/ui component library
│       ├── contexts/
│       │   └── ThemeContext.tsx          ← Theme provider
│       ├── hooks/
│       │   ├── useComposition.ts
│       │   ├── useMobile.tsx
│       │   └── usePersistFn.ts
│       └── lib/
│           ├── data.ts                   ← Service data, role content, pillar data
│           └── utils.ts                  ← Tailwind class merge utility
├── server/
│   └── index.ts                          ← Express placeholder (not used in prod)
├── shared/
│   └── const.ts                          ← Shared constants
├── patches/
│   └── wouter@3.7.1.patch
├── ideas.md                              ← Design brainstorm notes
├── pdf_notes.md                          ← Project brief and reference notes
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
└── components.json                       ← shadcn/ui config
```

---

## Pages & Features Built

| Page / Feature | Route | Status |
|---|---|---|
| Homepage — Hero, Who We Serve panel, Six Pillars, CTA | `/website` | Complete |
| Services Overview | `/website/services` | Complete |
| RAB Act Services | `/website/services/rab-act` | Complete |
| DBP Act Services | `/website/services/dbp-act` | Complete |
| Planning Portal Services | `/website/services/planning-portal` | Complete |
| Project Intervene Services | `/website/services/project-intervene` | Complete |
| Strata Solutions Services | `/website/services/strata-solutions` | Complete |
| CAS Complaints Services | `/website/services/cas-complaints` | Complete |
| Role page — Developer | `/website/role/developer` | Complete |
| Role page — Builder | `/website/role/builder` | Complete |
| Role page — Private Certifier (PCA) | `/website/role/pca` | Complete |
| Role page — Design Practitioner | `/website/role/design-practitioner` | Complete |
| Role page — Building Practitioner | `/website/role/building-practitioner` | Complete |
| Role page — Strata Manager | `/website/role/strata-manager` | Complete |
| Role page — Building Manager | `/website/role/building-manager` | Complete |
| Role page — Owners | `/website/role/owners` | Complete |
| About Page | `/website/about` | Complete |
| Contact Page | `/website/contact` | Complete |
| Get a Quote modal | Overlay (nav CTA) | Complete |
| Top navigation bar | All pages | Complete |
| Footer | All pages | Complete (ABN/address/phone = placeholders) |
| "Client System" button | Nav header | Links to `/` (system portal) |

---

## Pending Items (for Revision 2)

The following items are placeholders awaiting real data:

| Item | Location | Notes |
|---|---|---|
| ABN | `WebsiteFooter.tsx` | Replace `ABN XX XXX XXX XXX` |
| Registered address | `WebsiteFooter.tsx` | Replace placeholder address |
| Phone number | `WebsiteFooter.tsx` | Replace placeholder phone |
| Email | `WebsiteFooter.tsx` | Currently `info@369alliance.com.au` — confirm |

---

## CDN Assets Used

All images are served from the Manus CDN. These URLs are embedded directly in the source code:

| Asset | Usage |
|---|---|
| `logo_symbol_square_cd006bc9.png` | Hero card logo symbol (192px) |
| `nav_symbol_back_of_card.png` | Navigation bar logo |
| Hero background | Dark city skyline (Unsplash CDN) |

---

## Notes for New Task

- This is a **static frontend** project. No database or live backend is used.
- The `server/index.ts` is a placeholder only and is not deployed.
- The `vite-plugin-manus-runtime` dev dependency is Manus-specific and can be removed if deploying outside the Manus platform.
- Google Fonts (Montserrat + IBM Plex Sans) are loaded via `<link>` tags in `client/index.html`.
- The footer contact details (ABN, address, phone) are placeholders — update `WebsiteFooter.tsx` when details are available.

---

*Exported from Manus project: 369-alliance-system | Checkpoint: 88a05658 (Final Revision 1) | Published: alliance369-vykdiath.manus.space | Date: March 2026*
