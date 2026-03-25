# 369 Alliance Construction Management System
### Export Package — Ready for New Task Initialisation

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
| Charts | Recharts | 2.x |
| Forms | React Hook Form + Zod | 7.x / 4.x |
| Icons | Lucide React | 0.453 |
| Toasts | Sonner | 2.x |
| Language | TypeScript | 5.6 |
| Package Manager | pnpm | 10.4 |
| Server (placeholder) | Express (static-only, not used in prod) | 4.x |

**Brand Design System:**
- Primary colour: Navy `#1a1a2e`
- Accent colour: Gold `#A68A64`
- Heading font: Montserrat (Google Fonts)
- Body font: IBM Plex Sans (Google Fonts)
- Theme: Dark (navy background, gold accents, white text)

---

## How to Run Locally

### Prerequisites
- Node.js 18+ installed
- pnpm installed (`npm install -g pnpm`)

### Steps

```bash
# 1. Extract the zip and enter the project directory
unzip 369-alliance-system-export.zip
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
│   ├── index.html                  ← HTML entry point (Google Fonts loaded here)
│   ├── public/                     ← Static assets (favicon, robots.txt)
│   └── src/
│       ├── App.tsx                 ← Root router and layout
│       ├── main.tsx                ← React entry point
│       ├── index.css               ← Global theme, CSS variables, Tailwind config
│       ├── const.ts                ← App-wide constants
│       ├── pages/
│       │   ├── LandingPage.tsx     ← Home / portal selector
│       │   ├── RolePortal.tsx      ← Role-specific portal view
│       │   ├── ActionManager.tsx   ← Action/task management dashboard
│       │   ├── DataHub.tsx         ← Data hub / reporting view
│       │   ├── Home.tsx            ← Legacy home (template base)
│       │   └── NotFound.tsx        ← 404 page
│       ├── components/
│       │   ├── ProjectModal.tsx    ← Create/edit project modal
│       │   ├── ViewModal.tsx       ← View project/item detail modal
│       │   ├── ReportScreen.tsx    ← Reports screen component
│       │   ├── OrderScreen.tsx     ← Orders/requests screen component
│       │   ├── HistoryScreen.tsx   ← Audit history screen component
│       │   ├── ToolsScreen.tsx     ← Tools/resources screen component
│       │   ├── BookInspectionModal.tsx ← Book inspection workflow modal
│       │   └── ui/                 ← Full shadcn/ui component library
│       ├── contexts/
│       │   └── ThemeContext.tsx    ← Theme provider context
│       ├── hooks/
│       │   ├── useComposition.ts   ← Composition input hook
│       │   ├── useMobile.tsx       ← Mobile breakpoint hook
│       │   └── usePersistFn.ts     ← Stable function reference hook
│       └── lib/
│           ├── data.ts             ← All mock data and data structures
│           └── utils.ts            ← Tailwind class merge utility
├── server/
│   └── index.ts                    ← Express placeholder (static-only project)
├── shared/
│   └── const.ts                    ← Shared constants (server + client)
├── patches/
│   └── wouter@3.7.1.patch          ← Wouter router patch
├── ideas.md                        ← Original design brainstorm notes
├── pdf_notes.md                    ← Project brief and PDF reference notes
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
└── components.json                 ← shadcn/ui configuration
```

---

## Pages & Features Built

| Page / Feature | Route | Status |
|---|---|---|
| Landing Page — Portal Selector | `/` | Complete |
| Role Portal — Developers | `/portal/developers` | Complete |
| Role Portal — Builders | `/portal/builders` | Complete |
| Role Portal — Private Certifiers (PCA) | `/portal/pca` | Complete |
| Role Portal — Design Practitioners | `/portal/design-practitioners` | Complete |
| Role Portal — Strata Managers | `/portal/strata` | Complete |
| Role Portal — Building Managers | `/portal/building-manager` | Complete |
| Role Portal — Owners | `/portal/owners` | Complete |
| Action Manager Dashboard | `/action-manager` | Complete |
| Data Hub | `/data-hub` | Complete |
| Project Modal (create/edit) | Modal overlay | Complete |
| View Modal (detail view) | Modal overlay | Complete |
| Report Screen | Embedded component | Complete |
| Order Screen | Embedded component | Complete |
| History Screen | Embedded component | Complete |
| Tools Screen | Embedded component | Complete |
| Book Inspection Modal | Modal overlay | Complete |
| ADM → (Admin) navigation button | Nav header | Complete |

---

## Notes for New Task

- This is a **static frontend** project (no live database or backend). All data is sourced from `client/src/lib/data.ts` as mock/seed data. To add persistence, upgrade to a full-stack project with a database.
- The `server/index.ts` is a placeholder only and is not used in the deployed static build.
- All external images are referenced via CDN URLs (no local image files in the project).
- The `vite-plugin-manus-runtime` dev dependency is a Manus-specific plugin and can be removed if deploying outside the Manus platform.
- Google Fonts (Montserrat + IBM Plex Sans) are loaded via `<link>` tags in `client/index.html`.

---

*Exported from Manus project: 369-alliance-system | Checkpoint: de1bbc92 | Date: March 2026*
