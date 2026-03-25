// 369 Alliance System – Shared data types and in-memory store

export type Stage = "Site Preparation" | "Excavation" | "Basement" | "GL" | "Facade" | "Occupied" | "CAS complaint" | "Planning Portal" | "Project Intervene" | "DBP referral" | "Other referral";
export type RiskCategory = "Low" | "Medium" | "High";
export type ProjectOutcome = "WIP" | "BWRO Draft" | "BWRO Final" | "SWO" | "RO Draft" | "RO Final" | "Closed";
export type InspectionType = "Selected" | "Complaint" | "Developer" | "Builder" | "Strata" | "Owners Corporation" | "Referral";
export type TabType = "INTEL" | "OC Inspections" | "OC" | "DBP";

export interface DBPPractitioner {
  id: string;
  type: string[];
  name: string;
  company: string;
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
  buildingPractitioner: string;
  history: HistoryEntry[];
  reports: ReportEntry[];
  orders: OrderEntry[];
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

// In-memory store
let projects: Project[] = [
  {
    id: "1",
    projCode: "001",
    tab: "INTEL",
    stage: "Facade",
    riskCategory: "High",
    firstInspectionType: "Developer",
    sequentialInspection: "Builder",
    freeType: "",
    selectedBy: "Raquel Diaz",
    address: "123 George St",
    suburb: "Sydney",
    postcode: "2000",
    photoUrl: "",
    builder: "ABC Constructions Pty Ltd",
    builderACN: "123 456 789",
    builderRegistration: "BLD-2021-001",
    builderExpireDate: "31/12/2026",
    developer: "XYZ Developments Pty Ltd",
    developerACN: "987 654 321",
    certifierCompany: "NSW Certifiers Pty Ltd",
    certifierName: "John Smith",
    certifierACN: "456 789 123",
    buildingClasses: ["2", "6"],
    numberOfUnits: "48",
    numberOfLevelsBasement: "2",
    numberOfLevelsGLRoof: "12",
    effectiveHeight: "36.5",
    developDescription: "Mixed-use residential and commercial development",
    bwItsoc: "BW-2023-0456",
    daNumber: "DA-2021-1234",
    ccNumber: "CC-2022-5678",
    costOfDevelopment: "$24,500,000",
    created: "11/01/2025 13:38",
    projectOutcome: "WIP",
    inspectors: ["Raquel Diaz"],
    dbpPractitioners: [
      { id: "d1", type: ["architecture", "structure"], name: "Jane Doe", company: "Doe Architects" }
    ],
    buildingPractitioner: "ABC Constructions Pty Ltd",
    history: [
      { id: "h1", date: "11/01/2025 13:38", operation: "Project Created", person: "Raquel Diaz", details: "Initial project entry created." },
      { id: "h2", date: "15/01/2025 09:22", operation: "Stage Updated", person: "Simone Baeta Lentini", details: "Stage changed from GL to Facade." }
    ],
    reports: [],
    orders: []
  },
  {
    id: "2",
    projCode: "002",
    tab: "OC Inspections",
    stage: "GL",
    riskCategory: "Medium",
    firstInspectionType: "Complaint",
    sequentialInspection: "Strata",
    freeType: "",
    selectedBy: "Simone Baeta Lentini",
    address: "11 St Ives Ave",
    suburb: "St Ives",
    postcode: "2075",
    photoUrl: "",
    builder: "Metro Build Group",
    builderACN: "234 567 890",
    builderRegistration: "BLD-2020-088",
    builderExpireDate: "30/06/2025",
    developer: "Metro Developments",
    developerACN: "876 543 210",
    certifierCompany: "CertifyNSW",
    certifierName: "Peter Brown",
    certifierACN: "345 678 901",
    buildingClasses: ["2"],
    numberOfUnits: "24",
    numberOfLevelsBasement: "1",
    numberOfLevelsGLRoof: "8",
    effectiveHeight: "24.0",
    developDescription: "Residential apartment complex",
    bwItsoc: "BW-2022-0789",
    daNumber: "DA-2020-5678",
    ccNumber: "CC-2021-9012",
    costOfDevelopment: "$12,000,000",
    created: "05/03/2025 10:15",
    projectOutcome: "BWRO Draft",
    inspectors: ["Simone Baeta Lentini"],
    dbpPractitioners: [],
    buildingPractitioner: "Metro Build Group",
    history: [
      { id: "h1", date: "05/03/2025 10:15", operation: "Project Created", person: "Simone Baeta Lentini", details: "Initial project entry created." }
    ],
    reports: [],
    orders: []
  },
  {
    id: "3",
    projCode: "003",
    tab: "DBP",
    stage: "Occupied",
    riskCategory: "Low",
    firstInspectionType: "Referral",
    sequentialInspection: "Developer",
    freeType: "",
    selectedBy: "Raquel Diaz",
    address: "218 Pitt St",
    suburb: "Sydney",
    postcode: "2000",
    photoUrl: "",
    builder: "Southern Cross Builders",
    builderACN: "345 678 901",
    builderRegistration: "BLD-2019-055",
    builderExpireDate: "31/03/2027",
    developer: "Southern Cross Developments",
    developerACN: "765 432 109",
    certifierCompany: "BuildCert NSW",
    certifierName: "Mary Johnson",
    certifierACN: "234 567 890",
    buildingClasses: ["2", "9a"],
    numberOfUnits: "120",
    numberOfLevelsBasement: "3",
    numberOfLevelsGLRoof: "22",
    effectiveHeight: "68.0",
    developDescription: "High-rise mixed residential and medical",
    bwItsoc: "BW-2021-0123",
    daNumber: "DA-2019-3456",
    ccNumber: "CC-2020-7890",
    costOfDevelopment: "$85,000,000",
    created: "20/06/2024 14:50",
    projectOutcome: "Closed",
    inspectors: ["Raquel Diaz", "Simone Baeta Lentini"],
    dbpPractitioners: [
      { id: "d1", type: ["fire", "waterproofing"], name: "Tom Lee", company: "FireSafe Design" },
      { id: "d2", type: ["structure"], name: "Sara Kim", company: "Structural Solutions" }
    ],
    buildingPractitioner: "Southern Cross Builders",
    history: [
      { id: "h1", date: "20/06/2024 14:50", operation: "Project Created", person: "Raquel Diaz", details: "Initial project entry created." },
      { id: "h2", date: "15/09/2024 11:00", operation: "Project Closed", person: "Raquel Diaz", details: "All rectifications completed and verified." }
    ],
    reports: [],
    orders: []
  }
];

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
    history: [{ id: String(Date.now()), date: created, operation: "Project Created", person: project.selectedBy, details: "Initial project entry created." }],
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
    history: [
      ...projects[idx].history,
      { id: String(Date.now()), date: dateStr, operation: "Project Modified", person, details: "Project details updated." }
    ]
  };
  projects = projects.map(p => p.id === id ? updated : p);
  return updated;
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
      history: [...p.history, { id: String(Date.now()+1), date: dateStr, operation: "Report Uploaded", person: "System", details: `Report "${report.fileName}" uploaded.` }]
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
      history: [...p.history, { id: String(Date.now()+1), date: dateStr, operation: "Order Uploaded", person: "System", details: `Order "${order.fileName}" uploaded.` }]
    };
  });
}

export const BUILDING_CLASSES = ["1","2","3","4","5","6","7a","7b","8","9a","9b","9c","10"];
export const STAGES: Stage[] = ["Site Preparation","Excavation","Basement","GL","Facade","Occupied"];
export const RISK_CATEGORIES: RiskCategory[] = ["Low","Medium","High"];
export const PROJECT_OUTCOMES: ProjectOutcome[] = ["WIP","BWRO Draft","BWRO Final","SWO","RO Draft","RO Final","Closed"];
export const INSPECTION_TYPES: InspectionType[] = ["Selected","Complaint","Developer","Builder","Strata","Owners Corporation","Referral"];
export const INSPECTORS = ["Raquel Diaz","Simone Baeta Lentini"];
export const DBP_TYPES = ["architecture","structure","fire","waterproofing","essential services","cladding","vertical transportation"];
export const TABS: TabType[] = ["INTEL","OC Inspections","OC","DBP"];

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
