/**
 * State & territory legislation profiles for the AUS Legislation Brain.
 *
 * The NCC is national; each jurisdiction gives it legal force through its own
 * act, layers its own licensing / contract / warranty / dispute regimes on
 * top, and publishes state variations in the NCC state appendices. These
 * profiles are the curated "state layer" injected into the AI system prompt
 * and shown in the UI. Facts are headline-level: the model is instructed to
 * flag anything threshold-sensitive for verification against the current
 * instrument.
 */

export interface StateAct {
  n: string; // act / instrument name (with year)
  note: string; // one-line scope
}

export interface StateProfile {
  code: string;
  name: string;
  regulator: string;
  adoption: string; // instrument that gives the NCC legal force
  acts: StateAct[];
  licensing: string;
  warranty: string; // home warranty / consumer cover scheme
  contracts: string; // domestic building contract rules
  disputes: string;
  sop: string; // security of payment act
  variations: string[]; // headline NCC state variations & overlays
  watchouts: string[]; // quirks an interstate practitioner would miss
}

export const NATIONAL = {
  summary:
    "The National Construction Code (NCC), published by the ABCB, sets the minimum technical standard Australia-wide: Volume One (Class 2–9), Volume Two + ABCB Housing Provisions (Class 1 and 10), Volume Three (Plumbing Code of Australia). It is given legal force by each state/territory's building or planning act, and each jurisdiction publishes variations, additions and deletions in the NCC state appendices. Australian Standards apply where referenced by the NCC or by contract.",
  instruments: [
    "NCC 2022 (current baseline; NCC 2025 adoption staged from 1 May 2026, subject to jurisdiction)",
    "Referenced Australian Standards (AS/NZS) — as adopted by the NCC edition in force",
    "Disability (Access to Premises — Buildings) Standards 2010 (Cth)",
    "Australian Consumer Law (Competition and Consumer Act 2010, Cth)",
    "Model WHS Act/Regulations (all jurisdictions except VIC, which retains OHS Act 2004)",
  ],
};

export const STATES: StateProfile[] = [
  {
    code: "NSW",
    name: "New South Wales",
    regulator: "Building Commission NSW (with NSW Fair Trading); certifiers regulated under the Building and Development Certifiers Act 2018",
    adoption: "Environmental Planning and Assessment Act 1979 + EP&A (Development Certification and Fire Safety) Regulation 2021 apply the NCC as part of development/construction certificates",
    acts: [
      { n: "Design and Building Practitioners Act 2020", note: "regulated designs + design/building compliance declarations for Class 2, 3 and 9c (incl. mixed use); registered practitioners; s37 statutory duty of care for all buildings" },
      { n: "Residential Apartment Buildings (Compliance and Enforcement Powers) Act 2020", note: "OC audits, expected-completion notices, prohibition orders, rectification of serious defects in Class 2" },
      { n: "Home Building Act 1989", note: "contractor licensing, s18B statutory warranties (6 yrs major / 2 yrs other), HBCF insurance for res. work over $20,000 (Class 2 in buildings over 3 storeys exempt)" },
      { n: "Strata Schemes Management Act 2015", note: "Strata Building Bond & Inspections Scheme — 2% building bond + mandatory defect inspections for Class 2 not covered by HBCF" },
      { n: "Environmental Planning and Assessment Act 1979", note: "DA/CDC pathways, Crown certificates, fire safety statements (AFSS)" },
    ],
    licensing: "Home Building Act licences (residential); DBP-registered design/building practitioners and engineers for Class 2/3/9c work",
    warranty: "HBCF (icare) for residential work > $20,000 except Class 2 in buildings over 3 storeys; Strata Building Bond (2%) for those buildings instead",
    contracts: "Home Building Act: written contract > $5,000; prescribed contract requirements > $20,000; max deposit 10%",
    disputes: "Building Commission NSW complaints; NCAT (Home Building Division); rectification orders under RAB Act",
    sop: "Building and Construction Industry Security of Payment Act 1999 (NSW)",
    variations: [
      "BASIX (SEPP Sustainable Buildings 2022) replaces NCC energy-efficiency DtS provisions for dwellings (Class 1, 2 and 4 parts)",
      "DBP declared-design regime overlays the NCC design documentation process for Class 2/3/9c",
      "NSW appendix fire-safety variations (e.g. fire brigade provisions, EP&A Reg fire safety schedules and annual fire safety statements)",
    ],
    watchouts: [
      "A 'serious defect' under the RAB Act is defined against the NCC performance requirements and AS — findings should cite the exact clause",
      "Lodgement of regulated designs on the NSW Planning Portal BEFORE building work commences is mandatory for prescribed classes",
      "NCC 2022 adopted in NSW from 1 May 2023 (energy/livable housing from 1 Oct 2023); check the version in force at CC/CDC date",
    ],
  },
  {
    code: "VIC",
    name: "Victoria",
    regulator: "Building and Plumbing Commission (formerly Victorian Building Authority); Cladding Safety Victoria for cladding rectification",
    adoption: "Building Act 1993 (Vic) + Building Regulations 2018 adopt the NCC as the technical standard for building permits",
    acts: [
      { n: "Building Act 1993 (Vic)", note: "building permits, occupancy permits, registered building surveyors (private or municipal), protection works, essential safety measures" },
      { n: "Building Regulations 2018", note: "siting, bushfire (BAL/BMO), pool barriers, ESM maintenance, report-and-consent triggers" },
      { n: "Domestic Building Contracts Act 1995", note: "major domestic building contracts > $10,000; s8 implied warranties; cost-escalation and deposit limits" },
      { n: "Owners Corporations Act 2006", note: "OC obligations for multi-unit buildings" },
    ],
    licensing: "Registered building practitioners (builders, surveyors, inspectors, draftspersons, engineers) under the Building Act; licensed/registered plumbers",
    warranty: "Domestic Building Insurance (VMIA) required for domestic work > $16,000 — 'last resort' cover (death, insolvency or disappearance of builder); 6-yr structural / 2-yr non-structural cover",
    contracts: "DBC Act: written major domestic building contract > $10,000; 5-day cooling-off; deposit max 5% (> $20k) / 10% (≤ $20k); progress payment stages fixed unless varied",
    disputes: "Domestic Building Dispute Resolution Victoria (DBDRV) is a mandatory first step; then VCAT",
    sop: "Building and Construction Industry Security of Payment Act 2002 (Vic)",
    variations: [
      "Victorian NCC variations for siting and bushfire — BAL assessment mandatory in designated bushfire-prone areas (Reg + AS 3959)",
      "Swimming pool/spa barrier registration and 4-yearly compliance certification (Building Regulations, AS 1926.1)",
      "Essential Safety Measures maintenance regime (annual ESM report) unique in its formality",
    ],
    watchouts: [
      "Victoria retains its own OHS Act 2004 — the model WHS Act does NOT apply",
      "Building surveyor appointment happens BEFORE permit; changing surveyors mid-project needs VBA/BPC consent",
      "Combustible cladding: state-funded rectification via Cladding Safety Victoria; cladding ban declaration applies to certain ACP/EPS uses",
    ],
  },
  {
    code: "QLD",
    name: "Queensland",
    regulator: "Queensland Building and Construction Commission (QBCC); private building certifiers licensed by QBCC",
    adoption: "Building Act 1975 (Qld) + Building Regulation 2021 apply the NCC (as the 'building assessment provisions') together with the Queensland Development Code (QDC)",
    acts: [
      { n: "Queensland Building and Construction Commission Act 1991", note: "licensing (most building work > $3,300), Queensland Home Warranty Scheme, Minimum Financial Requirements, non-conforming building product laws; Schedule 1B domestic building contracts" },
      { n: "Building Act 1975", note: "building development approvals, private certification, pool safety (ch 8), budget accommodation, inspections" },
      { n: "Plumbing and Drainage Act 2018", note: "plumbing/drainage approvals and licensing" },
      { n: "Building Industry Fairness (Security of Payment) Act 2017", note: "progress payments + statutory trust accounts for eligible contracts" },
      { n: "Planning Act 2016", note: "development assessment framework the Building Act plugs into" },
    ],
    licensing: "QBCC contractor/nominee/site supervisor licences for building work over $3,300 (incl. many trades); certifiers, pool safety inspectors and plumbers separately licensed",
    warranty: "Queensland Home Warranty Scheme (QBCC-run, premium-based) — mandatory for insurable residential construction work > $3,300; covers non-completion and defects (statutory: 6 yrs 6 mths structural)",
    contracts: "QBCC Act Sch 1B: level 1 (> $3,300) and level 2 (> $20,000) domestic building contracts; 5-business-day cooling-off; deposit caps 10% / 5% (> $20k)",
    disputes: "QBCC early dispute resolution + directions to rectify; QCAT review; Queensland Building and Construction Board policies",
    sop: "Building Industry Fairness (Security of Payment) Act 2017 (Qld) — includes project/retention trust accounts",
    variations: [
      "Queensland Development Code (QDC) parts vary/extend the NCC (e.g. siting of single dwellings MP 1.1–1.3, swimming pool barriers MP 3.4)",
      "Pool safety: mandatory pool safety certificates and QBCC-licensed inspectors (chain unique to QLD)",
      "Non-conforming building products chain-of-responsibility duties (QBCC Act Part 6AA) — strongest NCBP law nationally",
    ],
    watchouts: [
      "The $3,300 licensing threshold catches small works other states leave unlicensed",
      "QBCC 'direction to rectify' has a 12-month-from-awareness trigger; do not sit on defect notices",
      "Wind classification for much of coastal QLD is cyclonic (C1–C4) — AS 4055/AS 1170.2 region C applies, changing tie-down and glazing requirements",
    ],
  },
  {
    code: "WA",
    name: "Western Australia",
    regulator: "Building and Energy (DEMIRS — Department of Energy, Mines, Industry Regulation and Safety); Building Commissioner",
    adoption: "Building Act 2011 (WA) + Building Regulations 2012 apply the NCC as the 'applicable building standard' for building permits",
    acts: [
      { n: "Building Act 2011 (WA)", note: "building permits (certified BA1 / uncertified BA2 applications), occupancy permits for Class 2–9, permit authorities = local governments" },
      { n: "Building Services (Registration) Act 2011", note: "registration of builders, building surveyors and painters" },
      { n: "Building Services (Complaint Resolution and Administration) Act 2011", note: "complaints to the Building Commissioner; building service and home building work contract complaints; SAT appeals" },
      { n: "Home Building Contracts Act 1991", note: "regulates home building contracts $7,500–$500,000; deposit max 6.5%; rise-and-fall restrictions" },
      { n: "Plumbers Licensing Act 1995", note: "plumbing licensing (with Water Services regulation)" },
    ],
    licensing: "Registered building practitioners and contractors (Building Services (Registration) Act); owner-builder approvals; electricians/plumbers under separate acts",
    warranty: "Home Indemnity Insurance required for residential work > $20,000 (covers loss from builder death, disappearance or insolvency); 6-yr statutory-style cover via HBCA contract rules",
    contracts: "Home Building Contracts Act: applies $7,500–$500,000; max deposit 6.5%; variations in writing; no cost-plus for that band",
    disputes: "Building Commissioner (Building and Energy) complaint process; State Administrative Tribunal (SAT)",
    sop: "Building and Construction Industry (Security of Payment) Act 2021 (WA) — replaced the Construction Contracts Act 2004 regime",
    variations: [
      "WA applies the NCC with relatively few variations, but permit pathways (certified vs uncertified) and time limits are unique to the Building Act 2011",
      "Cyclonic wind regions C/D in the north-west (AS 1170.2/AS 4055) drive structural and glazing differences",
      "Occupancy permits are mandatory for Class 2–9 buildings before use — a hard gate other states handle via OC equivalents",
    ],
    watchouts: [
      "WA commenced its WHS Act 2020 (model-based) in 2022 — older OSH Act references are obsolete",
      "Unregistered building work over $20,000 is an offence; registration is per-individual and per-company",
      "NCC 2022 energy-efficiency provisions commenced later in WA (deferred adoption) — always confirm the standard in force at permit date",
    ],
  },
  {
    code: "SA",
    name: "South Australia",
    regulator: "Consumer and Business Services (CBS) for licensing; Office of the Technical Regulator (electrical/gas/plumbing); planning system administered by PlanSA",
    adoption: "Planning, Development and Infrastructure Act 2016 + PDI (General) Regulations 2017 — building consent assessed against the Building Rules (NCC + SA Ministerial Building Standards)",
    acts: [
      { n: "Planning, Development and Infrastructure Act 2016", note: "development approval = planning consent + building consent (PlanSA portal); accredited professionals certify" },
      { n: "Building Work Contractors Act 1995", note: "licensing of building work contractors + registered building work supervisors; domestic building work contract rules; statutory warranties 5 yrs" },
      { n: "Ministerial Building Standards (MBS 001+)", note: "SA-specific technical standards varying/supplementing the NCC (replaced the old Minister's Specifications)" },
    ],
    licensing: "Building work contractor licence + building work supervisor registration (CBS); accredited professionals (certifiers) under the PDI Act",
    warranty: "Building indemnity insurance required for domestic building work > $12,000 (covers non-completion/defects on builder death, disappearance or insolvency); 5-yr statutory warranty",
    contracts: "Domestic building work contracts under the Building Work Contractors Act: writing, cooling-off, deposit and progress-payment controls",
    disputes: "CBS advice/conciliation; Magistrates Court (civil) — SA has no dedicated building tribunal",
    sop: "Building and Construction Industry Security of Payment Act 2009 (SA)",
    variations: [
      "Ministerial Building Standards vary the NCC (e.g. additional requirements for bushfire protection areas, designated airfields, upgrading existing buildings)",
      "Bushfire-prone area mapping + AS 3959 via the Planning and Design Code",
      "PlanSA electronic lodgement is the single statutory portal for consents",
    ],
    watchouts: [
      "The PDI Act fully replaced the Development Act 1993 — cite the PDI Act for anything after 2021",
      "Building indemnity threshold ($12,000) is lower than NSW/WA — small renovations are often caught",
      "Class 1 roof-truss/frame changes commonly need a Regulation 76-style engineer sign-off under the PDI Regs (statement of compliance)",
    ],
  },
  {
    code: "TAS",
    name: "Tasmania",
    regulator: "Consumer, Building and Occupational Services (CBOS, Dept of Justice); Director of Building Control",
    adoption: "Building Act 2016 (Tas) + Building Regulations 2016 apply the NCC; Director's Determinations set categories of work and documentation",
    acts: [
      { n: "Building Act 2016 (Tas)", note: "risk-based pathways: low-risk (no approval), notifiable (licensed builder + surveyor certificate), permit work (council permit authority)" },
      { n: "Occupational Licensing Act 2005", note: "licensing of builders, designers, plumbers, electricians, gas-fitters" },
      { n: "Residential Building Work Contracts and Dispute Resolution Act 2016", note: "written contracts > $20,000; implied warranties 6 yrs; dispute resolution via CBOS" },
    ],
    licensing: "Licensed builders/designers/trades under the Occupational Licensing Act; building surveyors licensed; owner-builder permits",
    warranty: "No mandatory home warranty insurance in Tasmania (scheme abolished 2008) — consumer protection relies on statutory warranties + licensing",
    contracts: "Residential Building Work Contracts Act: written contract > $20,000, prescribed content, progress payment rules",
    disputes: "CBOS dispute resolution for residential building disputes; courts thereafter",
    sop: "Building and Construction Industry Security of Payment Act 2009 (Tas)",
    variations: [
      "Director of Building Control Determinations (categories of building/plumbing work, required documentation) are the day-to-day compliance instrument",
      "Bushfire-prone areas: BAL assessments by accredited assessors feed planning + building approval",
      "Heating appliance (wood heater) installation rules and colder-climate energy provisions get Tasmanian attention in the NCC appendix",
    ],
    watchouts: [
      "The 'notifiable work' pathway (no permit, but surveyor-certified) has no direct equivalent in most states — classify the work category first",
      "No home warranty insurance: advise clients on contractual protections instead",
      "NCC 2022 energy efficiency: Tasmania deferred 7-star adoption — verify the current position before advising",
    ],
  },
  {
    code: "ACT",
    name: "Australian Capital Territory",
    regulator: "Access Canberra (Construction Occupations Registrar); ACT Government building policy under EPSDD",
    adoption: "Building Act 2004 (ACT) + Building (General) Regulation 2008 apply the Building Code (NCC); planning under the Planning Act 2023",
    acts: [
      { n: "Building Act 2004 (ACT)", note: "building approvals by certifiers, commencement + completion, statutory warranties (6 yrs structural / 2 yrs non-structural), residential building work insurance/fidelity cover > $12,000" },
      { n: "Construction Occupations (Licensing) Act 2004", note: "licensing of builders, certifiers, plumbers, electricians, gasfitters" },
      { n: "Planning Act 2023", note: "outcomes-based planning system (replaced the Planning and Development Act 2007 in late 2023)" },
      { n: "Unit Titles (Management) Act 2011", note: "owners corporation obligations for Class 2" },
    ],
    licensing: "Construction occupation licences via Access Canberra; certifiers are government-appointed private practitioners",
    warranty: "Residential building insurance or MBA Fidelity Fund certificate required for residential work > $12,000 (covers non-completion + defects up to scheme limits)",
    contracts: "Building Act + regulation prescribe residential building contract requirements; statutory warranties apply regardless of contract",
    disputes: "Access Canberra complaints/rectification orders; ACAT (ACT Civil and Administrative Tribunal)",
    sop: "Building and Construction Industry (Security of Payment) Act 2009 (ACT)",
    variations: [
      "Energy: mandatory Energy Efficiency Rating (EER) disclosure on sale/lease of dwellings — beyond NCC",
      "Lease/land-rule interaction: ACT land is leasehold; development must comply with the Crown lease purpose clause",
      "All-electric transition: ACT bans new fossil-fuel gas network connections in new suburbs (climate policy overlay)",
    ],
    watchouts: [
      "Cite the Planning Act 2023 (not the repealed 2007 Act) for planning matters",
      "Exempt-development rules differ from NSW despite geographic proximity",
      "ACT statutory warranties run from completion and bind successors in title",
    ],
  },
  {
    code: "NT",
    name: "Northern Territory",
    regulator: "Building Advisory Services (DIPL — Dept of Infrastructure, Planning and Logistics); Building Practitioners Board; Director of Building Control",
    adoption: "Building Act 1993 (NT) + Building Regulations 1993 apply the NCC; building permits issued by private registered building certifiers",
    acts: [
      { n: "Building Act 1993 (NT)", note: "building permits by registered certifiers, occupancy permits, Building Practitioners Board registration, Director of Building Control oversight" },
      { n: "Planning Act 1999 (NT)", note: "development consent framework (NT Planning Scheme 2020)" },
      { n: "Construction Contracts (Security of Payments) Act 2004", note: "payment disputes + adjudication (WA-style model)" },
    ],
    licensing: "Registered building practitioners (builders residential, certifiers, architects, engineers) via the Building Practitioners Board; electrical/plumbing licensed separately",
    warranty: "Residential building cover: fidelity-fund certificate (currently MBFF) or insurance required for prescribed residential building work (over $12,000) — covers insolvency/death/disappearance up to scheme limits; 6-yr structural / 1-yr non-structural defect periods",
    contracts: "Prescribed residential building contracts tied to the residential building cover regime; certifier-issued permits gate each stage",
    disputes: "Building Practitioners Board (conduct); Director of Building Control; NTCAT / courts for contract disputes",
    sop: "Construction Contracts (Security of Payments) Act 2004 (NT)",
    variations: [
      "Cyclonic wind regions C and D dominate: AS 1170.2 / AS 4055 wind classification, tie-down, debris-impact glazing (Darwin = Region C)",
      "NT Deemed-to-Comply Manuals for housing in cyclonic areas supplement the NCC",
      "Remote/indigenous community housing programs carry NT-specific technical specifications",
    ],
    watchouts: [
      "Large parts of the NT outside building control areas have reduced permit requirements — confirm whether the land is inside a building control area first",
      "Structural adequacy in Region C/D is the dominant compliance risk — always state the wind classification in findings",
      "Pool safety: NT has its own Swimming Pool Safety Act 2004 regime with registration + compliance certificates",
    ],
  },
];

export const STATE_BY_CODE: Record<string, StateProfile> = Object.fromEntries(
  STATES.map(s => [s.code, s]),
);

/** Compact state block for the AI system prompt. */
export function stateProfileText(s: StateProfile): string {
  return [
    `SELECTED JURISDICTION: ${s.name} (${s.code})`,
    `Regulator: ${s.regulator}`,
    `NCC legal force: ${s.adoption}`,
    `Key legislation:\n${s.acts.map(a => `- ${a.n} — ${a.note}`).join("\n")}`,
    `Licensing: ${s.licensing}`,
    `Consumer cover: ${s.warranty}`,
    `Contracts: ${s.contracts}`,
    `Disputes: ${s.disputes}`,
    `Security of payment: ${s.sop}`,
    `Headline NCC variations / overlays:\n${s.variations.map(v => `- ${v}`).join("\n")}`,
    `State-specific watch-outs:\n${s.watchouts.map(w => `- ${w}`).join("\n")}`,
  ].join("\n");
}
