// 369 Alliance System – Shared data types and in-memory store

export type Stage = "Site Preparation" | "Excavation" | "Basement" | "GL" | "Facade" | "Occupied" | "CAS complaint" | "Planning Portal" | "Project Intervene" | "DBP referral" | "Other referral";
export type RiskCategory = "Low" | "Medium" | "High";
export type ProjectOutcome = "WIP" | "BWRO Draft" | "BWRO Final" | "Prohibition Order Draft" | "Prohibition Order Final" | "SWO" | "Closed";
export type InspectionType = "Selected" | "Complaint" | "Developer" | "Builder" | "Strata" | "Owners Corporation" | "Referral";
export type TabType = "Proactive Insp" | "From FORM" | "CLIENT" | "Map Monitor";
export type ClientRole = "Developer" | "Builder" | "PCA" | "DBP" | "BP" | "Strata" | "Building Manager" | "Owners";

export interface DBPPractitioner {
  id: string;
  type: string[];
  name: string;
  company: string;
  registration?: string;
}

export interface Project {
  id: string;
  projCode: string;
  tab: TabType;
  stage: Stage;
  riskCategory: RiskCategory;
  firstInspectionType: InspectionType;
  sequentialInspection: InspectionType;
  freeType: string;
  selectedBy: string;
  address: string;
  suburb: string;
  postcode: string;
  photoUrl?: string;
  builder: string;
  builderACN: string;
  builderRegistration: string;
  builderExpireDate: string;
  developer: string;
  developerACN: string;
  certifierCompany: string;
  certifierName: string;
  certifierACN: string;
  buildingClasses: string[];
  numberOfUnits: string;
  numberOfLevelsBasement: string;
  numberOfLevelsGLRoof: string;
  effectiveHeight: string;
  developDescription: string;
  bwItsoc: string;
  daNumber: string;
  ccNumber: string;
  costOfDevelopment: string;
  created: string;
  projectOutcome: ProjectOutcome;
  inspectors: string[];
  dbpPractitioners: DBPPractitioner[];
  buildingPractitionerName: string;
  buildingPractitionerReg: string;
  history: HistoryEntry[];
  reports: ReportEntry[];
  orders: OrderEntry[];
  // From FORM / CLIENT specific
  role?: ClientRole;
  isNew?: boolean;          // true = unactioned (red row, dark-red View btn)
  isNewClient?: boolean;    // true = newly converted CLIENT (red row until first View)
  isClient?: boolean;       // true = converted to CLIENT
  clientCode?: string;      // C001 etc if converted
  combinedWith?: string[];  // proj codes this case is combined with
  sourceFormCode?: string;  // if CLIENT was created from a FORM, reference it
  modified?: string;        // last action description shown in MODIFIED column
  bookings?: BookingEntry[]; // inspection/meeting bookings
  isCancelled?: boolean;     // true = client pulled out; code retired, hidden from CLIENT list
  cancelledAt?: string;      // datetime of cancellation
  cancelledReason?: string;  // optional reason provided at cancellation
}

export type BookingReason = "1st Inspection" | "Return Inspection" | "Meeting" | "Other";

export interface BookingEntry {
  id: string;
  date: string;         // ISO date string YYYY-MM-DD
  reason: BookingReason;
  description: string;
  createdAt: string;    // formatted datetime when booking was made
  createdBy: string;
}

export interface HistoryEntry {
  id: string;
  date: string;
  operation: string;
  person: string;
  details: string;
}

export interface ReportEntry {
  id: string;
  date: string;
  fileName: string;
  type: "iAuditor" | "PDF" | "Word";
  defects: DefectItem[];
}

export interface DefectItem {
  id: string;
  regime: string;
  reportNumber: string;
  bwroNumber: string;
  location: string;
  observation: string;
  photos: string[];
  devComment: string;
  devStatus: string;
  devNotes: string;
  devDate: string;
  ourComment: string;
  ourStatus: string;
}

export interface OrderEntry {
  id: string;
  date: string;
  fileName: string;
  type: "PDF" | "Word";
}

// ─── Inspector Lists ──────────────────────────────────────────────────────────
// Per spec: Selected By = Raquel Diaz or Simone Baeta Lentini
export const SELECTED_BY_OPTIONS = ["Raquel Diaz", "Simone Baeta Lentini"];

export const DBP_INSPECTORS = [
  "Charles Zhang",
  "Daniela Cianci",
  "Farzad Rezvani",
  "James Bray",
  "Marios Chatzidoukakis",
  "Miguel Ruiz",
  "Mitchell Pike",
  "Neda Mirzadeh",
  "Zhinus Zabihi",
];

export const OC_INSPECTORS = [
  "Balaji Thiruppathi",
  "Christopher Nicolson",
  "David Nguyen",
  "Edward Sagala",
  "Fritz Funke",
  "Harrison Andrews",
  "Harry Soo",
  "Jasmine Yeung",
  "Jason Freckelton",
  "Joshua Jackett",
  "Matt Sheary",
  "Matthew Laurenzi",
  "Md Hossain",
  "Md Karin",
  "Michael Hall",
  "Michael Young",
  "Mina Rofiel",
  "Mohamed Moukahal",
  "Mohammad Fazal",
  "Peter Murphy",
  "Phillip Ji",
  "Raquel Diaz",
  "Sally El Falak",
  "Sandeep Vaid",
  "Sanjeev Prasad",
  "Shaw Tran",
  "Steven Johnston",
  "Wallace Zhong",
];

export const ALL_INSPECTORS = Array.from(new Set([...DBP_INSPECTORS, ...OC_INSPECTORS])).sort();

// Legacy export for backward compat
export const INSPECTORS = OC_INSPECTORS;

// ─── Constants ────────────────────────────────────────────────────────────────
export const BUILDING_CLASSES = ["1","2","3","4","5","6","7a","7b","8","9a","9b","9c","10"];
export const PROACTIVE_STAGES: Stage[] = ["Site Preparation","Excavation","Basement","GL","Facade"];
export const INTEL_STAGES: Stage[] = ["Site Preparation","Excavation","Basement","GL","Facade"];
export const OC_STAGES: Stage[] = ["CAS complaint","Planning Portal","Project Intervene","DBP referral","Other referral"];
export const STAGES: Stage[] = [...INTEL_STAGES, ...OC_STAGES];
export const RISK_CATEGORIES: RiskCategory[] = ["Low","Medium","High"];
export const PROJECT_OUTCOMES: ProjectOutcome[] = ["WIP","BWRO Draft","BWRO Final","Prohibition Order Draft","Prohibition Order Final","SWO","Closed"];
export const INSPECTION_TYPES: InspectionType[] = ["Selected","Complaint","Developer","Builder","Strata","Owners Corporation","Referral"];
export const DBP_TYPES = ["architecture","structure","fire","waterproofing","essential services","cladding","vertical transportation"];
export const TABS: TabType[] = ["Proactive Insp","From FORM","CLIENT","Map Monitor"];
export const CLIENT_ROLES: ClientRole[] = ["Developer","Builder","PCA","DBP","BP","Strata","Building Manager","Owners"];

export const ROLES = [
  { key: "developers", label: "Developers", icon: "🏗️" },
  { key: "builders", label: "Builders", icon: "🔨" },
  { key: "pca", label: "Private Certifiers (PCA)", icon: "📋" },
  { key: "design-practitioners", label: "Design Practitioners", icon: "📐" },
  { key: "strata", label: "Strata", icon: "🏢" },
  { key: "building-manager", label: "Building Manager", icon: "🔑" },
  { key: "owners", label: "Owners", icon: "🏠" },
  { key: "government", label: "Government", icon: "⚖️" },
];

// ─── In-memory store ──────────────────────────────────────────────────────────
// Proactive Insp projects: prefix P
// From FORM projects: prefix F (simulated as new/unactioned)
// CLIENT projects: prefix C (converted from Proactive or FORM)
let projects: Project[] = [
  // ── Proactive Insp ──
  {
    id: "p1", projCode: "P001", tab: "Proactive Insp", stage: "Facade", riskCategory: "High",
    firstInspectionType: "Developer", sequentialInspection: "Builder", freeType: "",
    selectedBy: "Raquel Diaz", address: "123 George St", suburb: "Sydney", postcode: "2000",
    builder: "ABC Constructions Pty Ltd", builderACN: "123 456 789", builderRegistration: "BLD-2021-001", builderExpireDate: "31/12/2026",
    developer: "XYZ Developments Pty Ltd", developerACN: "987 654 321",
    certifierCompany: "NSW Certifiers Pty Ltd", certifierName: "John Smith", certifierACN: "456 789 123",
    buildingClasses: ["2","6"], numberOfUnits: "48", numberOfLevelsBasement: "2", numberOfLevelsGLRoof: "12",
    effectiveHeight: "36.5", developDescription: "Mixed-use residential and commercial development",
    bwItsoc: "BW-2023-0456", daNumber: "DA-2021-1234", ccNumber: "CC-2022-5678",
    costOfDevelopment: "$24,500,000", created: "11/01/2025 13:38", projectOutcome: "WIP",
    inspectors: ["Charles Zhang"],
    dbpPractitioners: [{ id: "d1", type: ["architecture","structure"], name: "Jane Doe", company: "Doe Architects", registration: "AP-2019-0042" }],
    buildingPractitionerName: "ABC Constructions Pty Ltd", buildingPractitionerReg: "BLD-2021-001",
    isNew: false, isClient: false,
    history: [
      { id: "h1", date: "11/01/2025 13:38", operation: "Project Created", person: "Raquel Diaz", details: "Initial proactive inspection created for 123 George St, Sydney." },
      { id: "h2", date: "15/01/2025 09:22", operation: "Stage Updated", person: "Raquel Diaz", details: "Stage changed from GL to Facade." },
    ],
    reports: [], orders: []
  },
  {
    id: "p2", projCode: "P002", tab: "Proactive Insp", stage: "Basement", riskCategory: "Medium",
    firstInspectionType: "Selected", sequentialInspection: "Selected", freeType: "",
    selectedBy: "Simone Baeta Lentini", address: "218 Pitt St", suburb: "Sydney", postcode: "2000",
    builder: "Meriton Group Pty Ltd", builderACN: "234 567 890", builderRegistration: "BLD-2020-012", builderExpireDate: "30/06/2026",
    developer: "Pitt Street Developments Pty Ltd", developerACN: "876 543 210",
    certifierCompany: "Certis Pty Ltd", certifierName: "Sarah Johnson", certifierACN: "567 890 234",
    buildingClasses: ["2"], numberOfUnits: "120", numberOfLevelsBasement: "3", numberOfLevelsGLRoof: "28",
    effectiveHeight: "84.0", developDescription: "High-rise residential tower",
    bwItsoc: "BW-2023-0789", daNumber: "DA-2020-5678", ccNumber: "CC-2021-9012",
    costOfDevelopment: "$89,000,000", created: "15/01/2025 10:15", projectOutcome: "BWRO Draft",
    inspectors: ["Farzad Rezvani"],
    dbpPractitioners: [{ id: "d2", type: ["waterproofing","fire"], name: "Tom Brown", company: "Brown Engineering", registration: "SE-2018-0099" }],
    buildingPractitionerName: "Meriton Group Pty Ltd", buildingPractitionerReg: "BLD-2020-012",
    isNew: false, isClient: false,
    history: [
      { id: "h1", date: "15/01/2025 10:15", operation: "Project Created", person: "Simone Baeta Lentini", details: "Initial proactive inspection created for 218 Pitt St, Sydney." },
    ],
    reports: [], orders: []
  },
  {
    id: "p3", projCode: "P003", tab: "Proactive Insp", stage: "GL", riskCategory: "Low",
    firstInspectionType: "Referral", sequentialInspection: "Referral", freeType: "",
    selectedBy: "Raquel Diaz", address: "45 Macquarie St", suburb: "Parramatta", postcode: "2150",
    builder: "Buildcorp Pty Ltd", builderACN: "345 678 901", builderRegistration: "BLD-2022-034", builderExpireDate: "31/03/2027",
    developer: "Parramatta City Developments", developerACN: "765 432 109",
    certifierCompany: "Apex Certification Pty Ltd", certifierName: "Michael Lee", certifierACN: "678 901 345",
    buildingClasses: ["2","5"], numberOfUnits: "72", numberOfLevelsBasement: "1", numberOfLevelsGLRoof: "18",
    effectiveHeight: "54.0", developDescription: "Mixed-use residential and office development",
    bwItsoc: "BW-2024-0123", daNumber: "DA-2022-3456", ccNumber: "CC-2023-7890",
    costOfDevelopment: "$42,000,000", created: "20/01/2025 09:00", projectOutcome: "WIP",
    inspectors: ["Mitchell Pike"],
    dbpPractitioners: [],
    buildingPractitionerName: "Buildcorp Pty Ltd", buildingPractitionerReg: "BLD-2022-034",
    isNew: false, isClient: true, clientCode: "C001",
    history: [{ id: "h1", date: "20/01/2025 09:00", operation: "Project Created", person: "Raquel Diaz", details: "Initial proactive inspection created for 45 Macquarie St, Parramatta." }],
    reports: [], orders: []
  },

  // ── From FORM ──
  {
    id: "f1", projCode: "F001", tab: "From FORM", stage: "Site Preparation", riskCategory: "High",
    firstInspectionType: "Developer", sequentialInspection: "Selected", freeType: "",
    selectedBy: "Raquel Diaz", address: "88 Walker St", suburb: "North Sydney", postcode: "2060",
    builder: "Lendlease Building Pty Ltd", builderACN: "456 789 012", builderRegistration: "BLD-2019-005", builderExpireDate: "28/02/2027",
    developer: "North Sydney Properties Pty Ltd", developerACN: "654 321 098",
    certifierCompany: "Pacific Certifiers Pty Ltd", certifierName: "David Chen", certifierACN: "789 012 456",
    buildingClasses: ["5"], numberOfUnits: "0", numberOfLevelsBasement: "4", numberOfLevelsGLRoof: "22",
    effectiveHeight: "88.0", developDescription: "Commercial office tower",
    bwItsoc: "BW-2024-0234", daNumber: "DA-2023-1122", ccNumber: "",
    costOfDevelopment: "$130,000,000", created: "08/03/2026 09:14", projectOutcome: "WIP",
    inspectors: [],
    dbpPractitioners: [],
    buildingPractitionerName: "", buildingPractitionerReg: "",
    role: "Developer",
    isNew: true, isClient: false,
    history: [{ id: "h1", date: "08/03/2026 09:14", operation: "Form Received", person: "System", details: "New enquiry received from website form. Role: Developer. Address: 88 Walker St, North Sydney." }],
    reports: [], orders: []
  },
  {
    id: "f2", projCode: "F002", tab: "From FORM", stage: "Facade", riskCategory: "Medium",
    firstInspectionType: "Selected", sequentialInspection: "Selected", freeType: "",
    selectedBy: "Raquel Diaz", address: "88 Walker St", suburb: "North Sydney", postcode: "2060",
    builder: "", builderACN: "", builderRegistration: "", builderExpireDate: "",
    developer: "", developerACN: "",
    certifierCompany: "", certifierName: "", certifierACN: "",
    buildingClasses: [], numberOfUnits: "", numberOfLevelsBasement: "", numberOfLevelsGLRoof: "",
    effectiveHeight: "", developDescription: "",
    bwItsoc: "", daNumber: "", ccNumber: "",
    costOfDevelopment: "", created: "08/03/2026 10:52", projectOutcome: "WIP",
    inspectors: [],
    dbpPractitioners: [],
    buildingPractitionerName: "", buildingPractitionerReg: "",
    role: "Building Manager",
    isNew: true, isClient: false,
    history: [{ id: "h1", date: "08/03/2026 10:52", operation: "Form Received", person: "System", details: "New enquiry received from website form. Role: Building Manager. Address: 88 Walker St, North Sydney." }],
    reports: [], orders: []
  },
  {
    id: "f3", projCode: "F003", tab: "From FORM", stage: "GL", riskCategory: "Low",
    firstInspectionType: "Selected", sequentialInspection: "Selected", freeType: "",
    selectedBy: "Simone Baeta Lentini", address: "1 Darling Island Rd", suburb: "Pyrmont", postcode: "2009",
    builder: "", builderACN: "", builderRegistration: "", builderExpireDate: "",
    developer: "", developerACN: "",
    certifierCompany: "", certifierName: "", certifierACN: "",
    buildingClasses: [], numberOfUnits: "", numberOfLevelsBasement: "", numberOfLevelsGLRoof: "",
    effectiveHeight: "", developDescription: "",
    bwItsoc: "", daNumber: "", ccNumber: "",
    costOfDevelopment: "", created: "07/03/2026 16:30", projectOutcome: "WIP",
    inspectors: [],
    dbpPractitioners: [],
    buildingPractitionerName: "", buildingPractitionerReg: "",
    role: "Builder",
    isNew: false, isClient: true, clientCode: "C002",
    history: [{ id: "h1", date: "07/03/2026 16:30", operation: "Form Received", person: "System", details: "New enquiry received from website form. Role: Builder. Address: 1 Darling Island Rd, Pyrmont." }],
    reports: [], orders: []
  },

  // ── CLIENT ──
  {
    id: "c1", projCode: "C001", tab: "CLIENT", stage: "GL", riskCategory: "Low",
    firstInspectionType: "Selected", sequentialInspection: "Selected", freeType: "",
    selectedBy: "Raquel Diaz", address: "45 Macquarie St", suburb: "Parramatta", postcode: "2150",
    builder: "Buildcorp Pty Ltd", builderACN: "345 678 901", builderRegistration: "BLD-2022-034", builderExpireDate: "31/03/2027",
    developer: "Parramatta City Developments", developerACN: "765 432 109",
    certifierCompany: "Apex Certification Pty Ltd", certifierName: "Michael Lee", certifierACN: "678 901 345",
    buildingClasses: ["2","5"], numberOfUnits: "72", numberOfLevelsBasement: "1", numberOfLevelsGLRoof: "18",
    effectiveHeight: "54.0", developDescription: "Mixed-use residential and office development",
    bwItsoc: "BW-2024-0123", daNumber: "DA-2022-3456", ccNumber: "CC-2023-7890",
    costOfDevelopment: "$42,000,000", created: "20/01/2025 09:00", projectOutcome: "WIP",
    inspectors: ["Mitchell Pike"],
    dbpPractitioners: [],
    buildingPractitionerName: "Buildcorp Pty Ltd", buildingPractitionerReg: "BLD-2022-034",
    role: "Developer",
    isNew: false, isClient: true, sourceFormCode: "P003",
    history: [
      { id: "h1", date: "20/01/2025 09:00", operation: "Project Created", person: "Raquel Diaz", details: "Converted from Proactive Insp P003 to CLIENT." },
    ],
    reports: [], orders: []
  },
  {
    id: "c2", projCode: "C002", tab: "CLIENT", stage: "GL", riskCategory: "Low",
    firstInspectionType: "Selected", sequentialInspection: "Selected", freeType: "",
    selectedBy: "Simone Baeta Lentini", address: "1 Darling Island Rd", suburb: "Pyrmont", postcode: "2009",
    builder: "", builderACN: "", builderRegistration: "", builderExpireDate: "",
    developer: "", developerACN: "",
    certifierCompany: "", certifierName: "", certifierACN: "",
    buildingClasses: [], numberOfUnits: "", numberOfLevelsBasement: "", numberOfLevelsGLRoof: "",
    effectiveHeight: "", developDescription: "",
    bwItsoc: "", daNumber: "", ccNumber: "",
    costOfDevelopment: "", created: "07/03/2026 16:30", projectOutcome: "WIP",
    inspectors: [],
    dbpPractitioners: [],
    buildingPractitionerName: "", buildingPractitionerReg: "",
    role: "Builder",
    isNew: false, isClient: true, sourceFormCode: "F003",
    history: [
      { id: "h1", date: "07/03/2026 16:30", operation: "Form Received", person: "System", details: "Converted from FORM F003 to CLIENT." },
    ],
    reports: [], orders: []
  },
];

// ─── Helper: next project code by tab ────────────────────────────────────────
// NOTE: cancelled projects keep their code in the pool so the number is never reused.
// We take the max across ALL projects in that tab (including cancelled), not just active ones.
export function getNextProjectCode(tab: TabType): string {
  const prefix = tab === "Proactive Insp" ? "P" : tab === "From FORM" ? "F" : "C";
  const maxCode = projects
    .filter(p => p.tab === tab)   // include cancelled — their number is retired
    .reduce((max, p) => {
      const n = parseInt(p.projCode.replace(/^[PFC]/, ""), 10);
      return isNaN(n) ? max : Math.max(max, n);
    }, 0);
  return `${prefix}${String(maxCode + 1).padStart(3, "0")}`;
}

export function getNextClientCode(): string {
  return getNextProjectCode("CLIENT");
}

// ─── CRUD functions ───────────────────────────────────────────────────────────
export function getProjects(): Project[] {
  return [...projects];
}

export function getProjectById(id: string): Project | undefined {
  return projects.find(p => p.id === id);
}

export function addProject(project: Omit<Project, "id" | "created" | "history" | "reports" | "orders">): Project {
  const now = new Date();
  const created = `${now.getDate().toString().padStart(2,"0")}/${(now.getMonth()+1).toString().padStart(2,"0")}/${now.getFullYear()} ${now.getHours().toString().padStart(2,"0")}:${now.getMinutes().toString().padStart(2,"0")}`;
  const newProject: Project = {
    ...project,
    id: String(Date.now()),
    created,
    history: [{ id: String(Date.now()), date: created, operation: "Project Created", person: project.selectedBy, details: `New project created: ${project.address}, ${project.suburb} (${project.projCode}).` }],
    reports: [],
    orders: []
  };
  projects = [...projects, newProject];
  return newProject;
}

export function updateProject(id: string, updates: Partial<Project>, person: string): Project | undefined {
  const idx = projects.findIndex(p => p.id === id);
  if (idx === -1) return undefined;
  const now = new Date();
  const dateStr = `${now.getDate().toString().padStart(2,"0")}/${(now.getMonth()+1).toString().padStart(2,"0")}/${now.getFullYear()} ${now.getHours().toString().padStart(2,"0")}:${now.getMinutes().toString().padStart(2,"0")}`;
  const updated: Project = {
    ...projects[idx],
    ...updates,
    modified: `Edited by ${person} on ${dateStr}`,
    history: [
      ...projects[idx].history,
      { id: String(Date.now()), date: dateStr, operation: "Project Modified", person, details: `Project details updated by ${person}.` }
    ]
  };
  projects = projects.map(p => p.id === id ? updated : p);
  return updated;
}

// Convert a Proactive Insp or From FORM project to a CLIENT entry
export function convertToClient(sourceId: string): Project | undefined {
  const source = projects.find(p => p.id === sourceId);
  if (!source) return undefined;
  const clientCode = getNextClientCode();
  const now = new Date();
  const dateStr = `${now.getDate().toString().padStart(2,"0")}/${(now.getMonth()+1).toString().padStart(2,"0")}/${now.getFullYear()} ${now.getHours().toString().padStart(2,"0")}:${now.getMinutes().toString().padStart(2,"0")}`;
  // Mark source as converted
  projects = projects.map(p => p.id === sourceId ? { ...p, isClient: true, clientCode } : p);
  // Create CLIENT entry
  const clientProject: Project = {
    ...source,
    id: String(Date.now()),
    projCode: clientCode,
    tab: "CLIENT",
    isNew: false,
    isNewClient: true,   // red row until first View
    isClient: true,
    sourceFormCode: source.projCode,
    created: source.created,  // preserve original created date
    modified: `Converted from ${source.tab} ${source.projCode} on ${dateStr}`,
    history: [
      ...source.history,
      { id: String(Date.now()), date: dateStr, operation: "Converted to Client", person: "System", details: `Converted from ${source.tab} ${source.projCode} to CLIENT ${clientCode}.` }
    ],
    reports: [],
    orders: []
  };
  projects = [...projects, clientProject];
  return clientProject;
}

// Mark a CLIENT entry as viewed (clears red row)
export function markClientViewed(id: string): void {
  projects = projects.map(p => p.id === id ? { ...p, isNewClient: false } : p);
}

export function addHistoryEntry(projectId: string, entry: Omit<HistoryEntry, "id">): void {
  projects = projects.map(p => {
    if (p.id !== projectId) return p;
    return { ...p, history: [...p.history, { ...entry, id: String(Date.now()) }] };
  });
}

export function addReport(projectId: string, report: Omit<ReportEntry, "id">): void {
  projects = projects.map(p => {
    if (p.id !== projectId) return p;
    const now = new Date();
    const dateStr = `${now.getDate().toString().padStart(2,"0")}/${(now.getMonth()+1).toString().padStart(2,"0")}/${now.getFullYear()} ${now.getHours().toString().padStart(2,"0")}:${now.getMinutes().toString().padStart(2,"0")}`;
    return {
      ...p,
      reports: [...p.reports, { ...report, id: String(Date.now()) }],
      modified: `Report "${report.fileName}" uploaded on ${dateStr}`,
      history: [...p.history, { id: String(Date.now()+1), date: dateStr, operation: "Report Uploaded", person: "System", details: `Report "${report.fileName}" uploaded with ${report.defects.length} defects extracted.` }]
    };
  });
}

export function addOrder(projectId: string, order: Omit<OrderEntry, "id">): void {
  projects = projects.map(p => {
    if (p.id !== projectId) return p;
    const now = new Date();
    const dateStr = `${now.getDate().toString().padStart(2,"0")}/${(now.getMonth()+1).toString().padStart(2,"0")}/${now.getFullYear()} ${now.getHours().toString().padStart(2,"0")}:${now.getMinutes().toString().padStart(2,"0")}`;
    return {
      ...p,
      orders: [...p.orders, { ...order, id: String(Date.now()) }],
      modified: `Order "${order.fileName}" generated on ${dateStr}`,
      history: [...p.history, { id: String(Date.now()+1), date: dateStr, operation: "Order Generated", person: "System", details: `Order document "${order.fileName}" generated and saved.` }]
    };
  });
}

export function addBooking(projectId: string, booking: Omit<BookingEntry, "id" | "createdAt" | "createdBy">, createdBy: string): BookingEntry | undefined {
  const idx = projects.findIndex(p => p.id === projectId);
  if (idx === -1) return undefined;
  const now = new Date();
  const createdAt = `${now.getDate().toString().padStart(2,"0")}/${(now.getMonth()+1).toString().padStart(2,"0")}/${now.getFullYear()} ${now.getHours().toString().padStart(2,"0")}:${now.getMinutes().toString().padStart(2,"0")}`;
  const newBooking: BookingEntry = { ...booking, id: String(Date.now()), createdAt, createdBy };
  // Format date for display
  const [y, m, d] = booking.date.split("-");
  const displayDate = `${d}/${m}/${y}`;
  projects = projects.map(p => {
    if (p.id !== projectId) return p;
    return {
      ...p,
      bookings: [...(p.bookings || []), newBooking],
      modified: `Booking: ${booking.reason} on ${displayDate}`,
      history: [
        ...p.history,
        { id: String(Date.now()+1), date: createdAt, operation: "Booking Created", person: createdBy, details: `${booking.reason} booked for ${displayDate}. ${booking.description ? "Note: " + booking.description : ""}`.trim() }
      ]
    };
  });
  return newBooking;
}

/**
 * Cancel a CLIENT entry: marks it as cancelled (hidden from list) and retires its project code.
 * The project record is kept in memory so the code is never reused.
 * Proactive Insp and From FORM entries that reference this client are NOT affected.
 */
export function cancelClient(id: string, reason?: string): void {
  const now = new Date();
  const dateStr = `${now.getDate().toString().padStart(2,"0")}/${(now.getMonth()+1).toString().padStart(2,"0")}/${now.getFullYear()} ${now.getHours().toString().padStart(2,"0")}:${now.getMinutes().toString().padStart(2,"0")}`;
  projects = projects.map(p => {
    if (p.id !== id) return p;
    return {
      ...p,
      isCancelled: true,
      cancelledAt: dateStr,
      cancelledReason: reason || "Client pulled out",
      modified: `Cancelled on ${dateStr}${reason ? " — " + reason : ""}`,
      history: [
        ...p.history,
        {
          id: String(Date.now()),
          date: dateStr,
          operation: "Client Cancelled",
          person: "Raquel Diaz",
          details: `Client cancelled on ${dateStr}. Reason: ${reason || "Client pulled out"}. Project code ${p.projCode} retired.`
        }
      ]
    };
  });
}

/** Returns the next upcoming booking date (ISO string) for a project, or null if none */
export function getNextBooking(project: Project): BookingEntry | null {
  if (!project.bookings || project.bookings.length === 0) return null;
  const today = new Date().toISOString().split("T")[0];
  const future = project.bookings
    .filter(b => b.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));
  return future[0] || null;
}
