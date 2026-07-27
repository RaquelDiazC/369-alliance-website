/**
 * 369 Alliance — Platform Home (/home)
 *
 * The product-only front door. Deliberately separate from the corporate site
 * at "/" (WebsiteHome), which stays untouched: this page speaks about the
 * learning and compliance tooling ONLY — Training, the AUS Expert Brain,
 * the DBP Drawings Audit and Report Studio — with no consultancy services.
 *
 * The Brain is free and leads. Everything else previews itself through a
 * 15-second looping demo before asking for anything.
 *
 * Brand: Navy #1a1a2e · Gold #A68A64 · Amber #C07040
 */
import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import {
  ArrowRight,
  BookOpenText,
  Brain,
  CheckCircle2,
  FileSearch,
  FileText,
  Lock,
  Ruler,
  ScrollText,
  Sparkles,
} from "lucide-react";
import { Logo369 } from "@/components/Logo369";
import { DemoReel, type DemoKind } from "@/components/home/DemoReel";

const NAVY = "#1a1a2e";
const GOLD = "#A68A64";
const AMBER = "#C07040";

/* ─────────────────────────────── scroll reveal ─────────────────────────────── */

function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.classList.add("visible");
          obs.unobserve(el);
        }
      },
      { threshold: 0.12 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className={`reveal ${delay ? `reveal-delay-${delay}` : ""} ${className}`}>
      {children}
    </div>
  );
}

/* ────────────────────────────────── content ────────────────────────────────── */

interface Product {
  id: string;
  kind: DemoKind;
  eyebrow: string;
  title: string;
  price: string;
  priceNote: string;
  free: boolean;
  icon: typeof Brain;
  lead: string;
  bullets: string[];
  proof: string;
  href: string;
  cta: string;
}

const PAID: Product[] = [
  {
    id: "training",
    kind: "training",
    eyebrow: "Learn it once, properly",
    title: "NCC & DBP Training",
    price: "Paid",
    priceNote: "clause-by-clause course",
    free: false,
    icon: BookOpenText,
    lead:
      "824 NCC 2022 clauses turned into a course you can actually finish — each one with the legislation text, the Australian Standard it leans on, a 3D evidence board showing what compliance looks like on site, and a knowledge check that proves you got it.",
    bullets: [
      "Every number traced back to the legislation — no paraphrase, no folklore",
      "3D evidence boards: see the fall, the upturn, the FRL, the penetration",
      "DBP & RAB Act modules: registration, regulated designs, declarations",
      "Progress saved per clause, resume where you stopped",
    ],
    proof: "Watch a clause become a lesson →",
    href: "/training",
    cta: "See the course",
  },
  {
    id: "drawings",
    kind: "drawings",
    eyebrow: "The one nobody does completely",
    title: "DBP Drawings Audit",
    price: "Paid",
    priceNote: "per drawing set",
    free: false,
    icon: Ruler,
    lead:
      "Upload the design set. It is read the way an auditor reads it — title block and CIRD status first, then every discipline against the NCC and the referenced Standards, then the disciplines against each other. You get the defects, the clause, and the fix.",
    bullets: [
      "All 9 regimes in one pass — a fire specialist won't miss the waterproofing",
      "Title block, DP registration and 'Issue for Construction' status checked first",
      "Cross-discipline clash detection: architectural vs fire vs structural vs services",
      "Every finding carries an RDGM defect code, an NCC clause and a corrective action",
    ],
    proof: "Watch a drawing get audited →",
    href: "/drawing-analyser",
    cta: "Audit a drawing set",
  },
  {
    id: "report",
    kind: "report",
    eyebrow: "From evidence to a signed report",
    title: "Report Studio",
    price: "Paid",
    priceNote: "per report",
    free: false,
    icon: FileText,
    lead:
      "Drop in the drawings and the site photos, tag them by regime and location, and the studio builds the findings register in the official NSW audit format — serious, potential serious, minor, compliant — with the executive summary written for you.",
    bullets: [
      "Findings mapped to rectification order / stop work / direction / recommendation",
      "Red-Amber-Green register you can edit before you sign it",
      "Export: official-format PDF report + Excel findings register",
      "Photos and drawings analysed one by one against the defect matrix",
    ],
    proof: "Watch a report assemble itself →",
    href: "/report-studio",
    cta: "Open Report Studio",
  },
];

const STATS = [
  { n: "824", l: "NCC 2022 clauses" },
  { n: "188", l: "DBP defect codes" },
  { n: "9", l: "design regimes" },
  { n: "8", l: "jurisdictions" },
];

/* ──────────────────────────────── page shell ───────────────────────────────── */

export default function PlatformHome() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "#f6f5f2", color: NAVY }}>
      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? NAVY : "transparent",
          boxShadow: scrolled ? "0 6px 24px rgba(0,0,0,.22)" : "none",
        }}
      >
        <div className="mx-auto flex max-w-[1200px] items-center gap-4 px-5 py-3.5">
          <Link href="/home" className="flex items-center gap-2.5">
            <Logo369 size={34} variant="dark" />
            <span className="text-[15px] font-black tracking-tight text-white">369 Alliance</span>
          </Link>
          <nav className="ml-auto hidden items-center gap-6 md:flex">
            <a href="#brain" className="text-[13px] font-semibold text-white/70 transition hover:text-white">
              Brain
            </a>
            <a href="#training" className="text-[13px] font-semibold text-white/70 transition hover:text-white">
              Training
            </a>
            <a href="#drawings" className="text-[13px] font-semibold text-white/70 transition hover:text-white">
              Drawings Audit
            </a>
            <a href="#report" className="text-[13px] font-semibold text-white/70 transition hover:text-white">
              Report Studio
            </a>
          </nav>
          <Link
            href="/brain"
            className="ml-auto flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-black transition hover:brightness-110 md:ml-0"
            style={{ background: GOLD, color: NAVY }}
          >
            <Brain size={14} /> Open the Brain — free
          </Link>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="relative -mt-[64px] overflow-hidden pb-20 pt-32" style={{ background: NAVY }}>
        {/* architectural grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(166,138,100,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(166,138,100,.5) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            maskImage: "radial-gradient(ellipse at 70% 20%, #000 10%, transparent 72%)",
          }}
        />
        <div
          className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full opacity-25 blur-3xl"
          style={{ background: `radial-gradient(circle, ${AMBER}, transparent 65%)` }}
        />

        <div className="relative mx-auto max-w-[1200px] px-5">
          <Reveal>
            <span
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em]"
              style={{ borderColor: "rgba(166,138,100,.5)", color: GOLD }}
            >
              <Sparkles size={12} /> NSW building compliance · learn · audit · report
            </span>
          </Reveal>

          <Reveal delay={1}>
            <h1 className="mt-6 max-w-[15ch] text-[clamp(2.4rem,6vw,4.6rem)] font-black leading-[0.98] tracking-tight text-white">
              The code, <span style={{ color: GOLD }}>made legible.</span>
            </h1>
          </Reveal>

          <Reveal delay={2}>
            <p className="mt-6 max-w-[62ch] text-[clamp(1rem,1.5vw,1.15rem)] leading-relaxed text-white/70">
              Four tools built on one thing: the actual legislation. A free expert brain that
              answers with the clause. A course that turns 824 NCC clauses into something you can
              finish. A drawings audit that reads all nine disciplines in one pass. And a report
              studio that writes the register for you.
            </p>
          </Reveal>

          <Reveal delay={3}>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                href="/brain"
                className="group flex items-center gap-2 rounded-full px-6 py-3 text-[14px] font-black transition hover:brightness-110"
                style={{ background: GOLD, color: NAVY }}
              >
                Ask the Brain — it&apos;s free
                <ArrowRight size={17} className="transition group-hover:translate-x-1" />
              </Link>
              <a
                href="#drawings"
                className="flex items-center gap-2 rounded-full border px-6 py-3 text-[14px] font-bold text-white/85 transition hover:border-white hover:text-white"
                style={{ borderColor: "rgba(255,255,255,.28)" }}
              >
                <FileSearch size={16} /> See a drawing set audited
              </a>
            </div>
          </Reveal>

          <Reveal delay={4}>
            <div className="mt-14 grid max-w-2xl grid-cols-2 gap-6 border-t pt-7 sm:grid-cols-4" style={{ borderColor: "rgba(255,255,255,.12)" }}>
              {STATS.map(s => (
                <div key={s.l}>
                  <p className="text-[26px] font-black leading-none" style={{ color: GOLD }}>
                    {s.n}
                  </p>
                  <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/45">{s.l}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FREE: the Brain ─────────────────────────────────────────────── */}
      <section id="brain" className="scroll-mt-20 py-20 md:py-28" style={{ background: "#fbfaf8" }}>
        <div className="mx-auto max-w-[1200px] px-5">
          <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.05fr]">
            <Reveal>
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-white"
                style={{ background: "#16a34a" }}
              >
                <CheckCircle2 size={13} /> Free · no card, no catch
              </span>

              <h2 className="mt-5 text-[clamp(2rem,4vw,3.1rem)] font-black leading-[1.02] tracking-tight">
                Ask it the question you were about to google.
              </h2>

              <p className="mt-5 text-[17px] leading-relaxed text-[#4a4a55]">
                Most people are one clause away from knowing whether their building is compliant —
                they just can&apos;t find it. The AUS Expert Brain reads the National Construction
                Code, the Australian Standards and each state&apos;s acts, and answers in plain
                English <b style={{ color: AMBER }}>with the clause attached</b>. Drop in a site
                photo and it will tell you what it is looking at.
              </p>

              <ul className="mt-6 space-y-2.5">
                {[
                  "NCC 2022 clause text — quoted, not paraphrased",
                  "Australian Standards, state acts, licensing, warranty and dispute paths",
                  "Eight jurisdictions: NSW · VIC · QLD · WA · SA · TAS · ACT · NT",
                  "Site photo in, defect regime and clause out",
                ].map(t => (
                  <li key={t} className="flex gap-2.5 text-[14px] text-[#4a4a55]">
                    <ScrollText size={16} className="mt-0.5 shrink-0" style={{ color: GOLD }} />
                    {t}
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/brain"
                  className="group flex items-center gap-2 rounded-full px-6 py-3 text-[14px] font-black text-white transition hover:brightness-125"
                  style={{ background: NAVY }}
                >
                  <Brain size={17} /> Start asking
                  <ArrowRight size={16} className="transition group-hover:translate-x-1" />
                </Link>
                <span className="text-[12px] font-semibold text-[#8a8478]">
                  Free questions every day. No sign-up to try.
                </span>
              </div>
            </Reveal>

            <Reveal delay={2}>
              <DemoReel kind="brain" />
              <p className="mt-3 text-center text-[11px] font-semibold uppercase tracking-wider text-[#a09a8e]">
                15-second look · the Brain answering with citations
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Paid products ───────────────────────────────────────────────── */}
      <section className="py-6" style={{ background: "#f6f5f2" }}>
        <div className="mx-auto max-w-[1200px] px-5">
          <Reveal>
            <div className="border-t pt-12" style={{ borderColor: "#e2ddd3" }}>
              <p className="text-[11px] font-black uppercase tracking-[0.2em]" style={{ color: AMBER }}>
                The professional tools
              </p>
              <h2 className="mt-3 max-w-[22ch] text-[clamp(1.8rem,3.4vw,2.7rem)] font-black leading-[1.05] tracking-tight">
                Paid — but you see exactly what they do first.
              </h2>
              <p className="mt-4 max-w-[58ch] text-[15px] leading-relaxed text-[#5a5a66]">
                No demo call, no PDF brochure. Each tool below shows itself working in fifteen
                seconds. If what you see is what you need, open it.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {PAID.map((p, i) => (
        <ProductBlock key={p.id} p={p} flip={i % 2 === 1} />
      ))}

      {/* ── How it fits ─────────────────────────────────────────────────── */}
      <section className="py-20 md:py-24" style={{ background: NAVY }}>
        <div className="mx-auto max-w-[1200px] px-5">
          <Reveal>
            <h2 className="max-w-[24ch] text-[clamp(1.7rem,3.2vw,2.5rem)] font-black leading-[1.05] tracking-tight text-white">
              One knowledge base underneath all four.
            </h2>
            <p className="mt-4 max-w-[60ch] text-[15px] leading-relaxed text-white/60">
              The clause the Brain quotes is the clause the course teaches, the clause the drawings
              audit checks against, and the clause your report cites. Nothing is re-typed between
              tools — which is why the numbers agree.
            </p>
          </Reveal>

          <div className="mt-12 grid gap-px overflow-hidden rounded-xl sm:grid-cols-2 lg:grid-cols-4" style={{ background: "rgba(255,255,255,.1)" }}>
            {[
              { i: Brain, t: "Ask", d: "Free. Get the clause and the standard behind it.", h: "/brain", tag: "Free" },
              { i: BookOpenText, t: "Learn", d: "Clause-by-clause course with 3D evidence boards.", h: "/training", tag: "Paid" },
              { i: Ruler, t: "Audit", d: "Drawing set in, defects + clauses + fixes out.", h: "/drawing-analyser", tag: "Paid" },
              { i: FileText, t: "Report", d: "Findings register and official-format PDF.", h: "/report-studio", tag: "Paid" },
            ].map((s, idx) => (
              <Reveal key={s.t} delay={(idx % 4) + 1}>
                <Link
                  href={s.h}
                  className="group flex h-full flex-col p-6 transition"
                  style={{ background: NAVY }}
                >
                  <s.i size={22} style={{ color: GOLD }} />
                  <div className="mt-4 flex items-center gap-2">
                    <h3 className="text-[17px] font-black text-white">{s.t}</h3>
                    <span
                      className="rounded-full px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider"
                      style={
                        s.tag === "Free"
                          ? { background: "#16a34a", color: "#fff" }
                          : { background: "rgba(255,255,255,.12)", color: GOLD }
                      }
                    >
                      {s.tag}
                    </span>
                  </div>
                  <p className="mt-2 flex-1 text-[13px] leading-relaxed text-white/55">{s.d}</p>
                  <ArrowRight
                    size={17}
                    className="mt-4 transition group-hover:translate-x-1.5"
                    style={{ color: GOLD }}
                  />
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Closing ─────────────────────────────────────────────────────── */}
      <section className="py-20 md:py-28" style={{ background: "#fbfaf8" }}>
        <div className="mx-auto max-w-[820px] px-5 text-center">
          <Reveal>
            <Logo369 size={56} variant="light" className="mx-auto" />
            <h2 className="mt-7 text-[clamp(1.8rem,3.6vw,2.8rem)] font-black leading-[1.05] tracking-tight">
              Start with the free one.
            </h2>
            <p className="mx-auto mt-4 max-w-[52ch] text-[16px] leading-relaxed text-[#5a5a66]">
              Ask the Brain one question about a building you are working on right now. If the answer
              is better than the last three hours you spent looking for it, the rest of the platform
              will make sense.
            </p>
            <Link
              href="/brain"
              className="group mt-8 inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-[15px] font-black text-white transition hover:brightness-125"
              style={{ background: NAVY }}
            >
              <Brain size={18} /> Open the Brain
              <ArrowRight size={17} className="transition group-hover:translate-x-1" />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="py-10" style={{ background: NAVY }}>
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-x-6 gap-y-3 px-5">
          <Link href="/home" className="flex items-center gap-2">
            <Logo369 size={26} variant="dark" />
            <span className="text-[13px] font-black text-white">369 Alliance</span>
          </Link>
          <nav className="flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/brain" className="text-[12px] text-white/50 transition hover:text-white">
              Brain
            </Link>
            <Link href="/training" className="text-[12px] text-white/50 transition hover:text-white">
              Training
            </Link>
            <Link href="/drawing-analyser" className="text-[12px] text-white/50 transition hover:text-white">
              Drawings Audit
            </Link>
            <Link href="/report-studio" className="text-[12px] text-white/50 transition hover:text-white">
              Report Studio
            </Link>
          </nav>
          <p className="ml-auto text-[11px] text-white/30">
            © {new Date().getFullYear()} 369 Alliance · Education & compliance tooling
          </p>
        </div>
      </footer>
    </div>
  );
}

/* ─────────────────────────────── product block ─────────────────────────────── */

function ProductBlock({ p, flip }: { p: Product; flip: boolean }) {
  const Icon = p.icon;
  return (
    <section
      id={p.id}
      className="scroll-mt-20 py-16 md:py-20"
      style={{ background: flip ? "#fbfaf8" : "#f6f5f2" }}
    >
      <div className="mx-auto max-w-[1200px] px-5">
        <div className={`grid items-center gap-12 lg:grid-cols-[1.05fr_1fr] ${flip ? "" : ""}`}>
          <Reveal className={flip ? "lg:order-2" : ""}>
            <div className="flex items-center gap-2.5">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-lg"
                style={{ background: NAVY }}
              >
                <Icon size={18} style={{ color: GOLD }} />
              </span>
              <span className="text-[11px] font-black uppercase tracking-[0.16em]" style={{ color: AMBER }}>
                {p.eyebrow}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <h2 className="text-[clamp(1.7rem,3.2vw,2.5rem)] font-black leading-[1.04] tracking-tight">
                {p.title}
              </h2>
              <span
                className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider"
                style={{ background: NAVY, color: GOLD }}
              >
                <Lock size={11} /> {p.price}
              </span>
            </div>
            <p className="mt-1 text-[12px] font-semibold uppercase tracking-wider text-[#a09a8e]">
              {p.priceNote}
            </p>

            <p className="mt-5 text-[16px] leading-relaxed text-[#4a4a55]">{p.lead}</p>

            <ul className="mt-6 space-y-2.5">
              {p.bullets.map(b => (
                <li key={b} className="flex gap-2.5 text-[14px] leading-snug text-[#4a4a55]">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0" style={{ color: GOLD }} />
                  {b}
                </li>
              ))}
            </ul>

            <Link
              href={p.href}
              className="group mt-8 inline-flex items-center gap-2 rounded-full px-6 py-3 text-[14px] font-black text-white transition hover:brightness-125"
              style={{ background: NAVY }}
            >
              {p.cta}
              <ArrowRight size={16} className="transition group-hover:translate-x-1" />
            </Link>
          </Reveal>

          <Reveal delay={2} className={flip ? "lg:order-1" : ""}>
            <DemoReel kind={p.kind} />
            <p className="mt-3 text-center text-[11px] font-semibold uppercase tracking-wider text-[#a09a8e]">
              {p.proof}
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
