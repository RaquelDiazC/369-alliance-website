/**
 * 369 Alliance – DBP Act Compliance Auditor v3
 * Design & Building Practitioners Act compliance auditor
 * Brand: Navy #1a1a2e · Gold #A68A64 · DBP Amber #C07040
 */
import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { getProjects, updateProject } from "@/lib/data";

// ─── Brand tokens ──────────────────────────────────────────────────────────────
const C = {
  navy: "#1a1a2e", navyLight: "#22243a",
  gold: "#A68A64", goldLight: "#c5b49a",
  amber: "#C07040", amberDark: "#7A4A2E",
  white: "#fff", bg: "#f5f4f1", cardBg: "#fff",
  border: "#e5e7eb", text: "#1f2937", muted: "#6b7280", soft: "#9ca3af",
  red: "#dc2626", redBg: "#fef2f2", green: "#16a34a", greenBg: "#f0fdf4",
  blue: "#1e40af", blueBg: "#eff6ff",
};

// ─── Static data ───────────────────────────────────────────────────────────────
const AUDIT_TYPES = ["DBP- Design","DBP- A/A","DBP- Remedial","DBP- As-built","DBP- Admin","DBP- RAB","Other"];
const NCC_VERSIONS = ["NCC 2022","NCC 2019 Amendment 1","NCC 2019","NCC 2016 Amendment 1","NCC 2016","NCC 2015"];
const BUILDING_CLASS_CODES = ["2","3","4","5","6","7a","7b","8","9a","9b","9c"];
const CLASS_DESCRIPTIONS: Record<string, string> = {
  "2": "Residential apartment building",
  "3": "Residential (other than Class 1 or 2)",
  "4": "Dwelling in a non-residential building",
  "5": "Office building",
  "6": "Shop or other retail outlet",
  "7a": "Car park",
  "7b": "Warehouse or storage",
  "8": "Laboratory or building for production",
  "9a": "Health care building",
  "9b": "Assembly building",
  "9c": "Aged care building",
};
const REGIME_TYPES = ["Architectural","Fire Safety Systems","Structural","Facade","Mechanical","Essential Services","Vertical Transportation","Geotechnical","Others"];
const BP_BREACHES = ["Section 19 of the DBPA","Section 21 of the DBPA","Clause 16 of the DBPR","Clause 17 of the DBPR","Clause 28B of the DBPR","Clause 28C of the DBPR","Clause 28D of the DBPR"];
const SCOPES = ["Fire safety","Waterproofing system","Structural component","Building enclosure","Building services","Vertical transportation","Integration/coordination requirements","Design Compliance Declarations (DCDs)","DBP legislation- Design practitioners obligations","DBP legislation- Building practitioners obligations","DBP and remedial building work","Construction in accordance with regulated designs"];
const LOCATIONS = ["Roof","Balcony","SOUs","Bathroom/laundry","Common areas","Podium","Fire stairs","Lift","Basements","Carpark","Whole building","Facade","Other"];
const BUILDING_ELEMENTS = ["Fire safety","Waterproofing","Structural component","Building enclosure","Building services","Vertical Transportation","Performance solution","DBP legislation"];
const CIRD_BREACH_CATS = ["Insufficient details to demonstrate compliance with BCA/AS","Inadequate details for construction","Product compatibility and suitability","Non-compliance with manufacturer specifications","Insufficient or missing performance solutions","Failure to incorporate site-specific conditions in regulated designs","Documentation and certification issues","Drafting and administration issues","Other"];
const INTEGRATION_CATS = ["Performance solution requirements not incorporated into relevant CIRDs","Lack of integration between CIRDs","Specialist advice/requirements not incorporated into CIRDs","Other"];
const PRACTITIONER_CLASSES = ["Architectural","Architectural (low rise)","Architectural (medium rise)","Civil engineering","Electrical engineering","Fire safety engineering","Geotechnical engineering","Mechanical engineering","Structural engineering","Building design","Building design (low rise)","Building design (medium rise)","Drainage","Drainage (restricted)","Facade","Fire systems (detection and alarm systems)","Fire systems (fire sprinkler)","Fire systems (fire hydrant and fire hose reel)","Fire systems (mechanical smoke control)","Vertical transportation","Building practitioner- body corporate","Building practitioner- individual (refer to BP details)","Other"];
const STAGES = ["No construction started","Demolition of pre-existing","Excavation","Basement","Primary structure","Internal/external fitout","Part OC issued","Full OC Issued"];
const REC_ACTIONS = ["Design practitioner to provide new/varied CIRDs and DCDs to the building practitioner addressing all potential breaches","Design practitioner to provide new/varied CIRDs that accord with the RDGM and include adequate details for the builder to construct in accordance with the BCA","Design practitioners to integrate CIRDs with other aspects of building work and other regulated designs","Design practitioner to provide new/varied DCD to the building practitioner","Design practitioner to provide detailed clarification to BCNSW via email: dbpaudits@customerservice.nsw.gov.au","Building practitioner to obtain and lodge new/varied CIRDs and DCDs from the relevant design practitioner","Building practitioner to provide related document for encroaching ground anchor","Building practitioner to provide rectification evidence","Building practitioner to notify the certifier of new/varied regulated designs or potential performance solutions, as these may require further action","Future DCDs to address all the raised issues","Future design/work to implement recommendations and notes","Other"];
const RESPONSIBLE = ["Developer","Building practitioner","Design practitioner","Sub-contractor","Certifier","Owners Corp","Consultant","Other"];
const AUDITOR_ROLES = ["Assistant Complaince Officer | DBP Audits","Compliance Officer | DBP Audits","Senior Compliance Officer | DBP Audits","Manager | DBP Audits","Principal Compliance Officer | DBP Audits","Senior Compliance Officer","Compliance Officer","Other"];
const RDGM_CODES = [
  "Arc-G1: Insufficient details in general arrangement plans",
  "Arc-G2: Insufficient details in elevation plans",
  "Arc-G3: Insufficient details in general sections",
  "Arc-G4.1: Insufficient general details for construction methods",
  "Arc-G4.2: Insufficient general details for egress system",
  "Arc-F1: Emergency lighting and exit signs are not included in the architectural RCPs",
  "Arc-F2: The passive fire safety designs lack sufficient details to demonstrate compliance",
  "Arc-W1.1: Insufficient internal waterproofing details",
  "Arc-W1.2: Insufficient external waterproofing details",
  "Arc-BE1: Insufficient design details for the building enclosure",
  "Str-L1: Insufficient/lack of details in structural concept plans",
  "Str-L2: Insufficient structural design plans and details",
  "Str-L3: Insufficient/lack of structural design sections",
  "Str-L4.1: Insufficient/lack of structural elevations",
  "Str-L4.2: Lack of a movement report",
  "Str-L5: Insufficient design load details",
  "Str-L6: Insufficient/lack of flood hazards considerations",
  "Str-L7: Insufficient consideration of fire ratings",
  "Str-L8: Insufficient or lack of coordination for service penetrations",
  "Fcd-W1: Insufficient design details for façade system",
  "Fcd-G1: Insufficient elevation and section details",
  "Fcd-F1: Lack of fire-rated structural elements design details",
  "Fcd-L1.1: Insufficient design details for external walls and waterproofing interfaces",
  "Fcd-L1.2: Insufficient design details for façade framing",
  "Fcd-L1.3: Insufficient design details for balustrade structural design",
  "Fcd-G2: Insufficient waterproofing/weatherproofing detailed drawings",
  "Fcd-BE1: Insufficient thermal compliance design details",
  "Geo-L1: Insufficient details in the structural engineering report",
  "Geo-L2: Insufficient shoring design details",
  "Geo-L3: Insufficient ground anchor design details",
  "Geo-L4: Insufficient earthwork design details",
  "Geo-L5: Insufficient geological assumptions consideration",
  "VTP-VT1: Lack of design details for vertical transportation services",
  "VTP-VT2.1: Insufficient lift design details",
  "VTP-VT2.2: Insufficient provisions for lift car accessibility",
  "VTP-VT2.3: Insufficient details for lift car interior",
  "VTP-VT2.4: Insufficient provisions for maintenance access",
  "Mec-S1: Insufficient masterplan details for service routes",
  "Mec-S2: Insufficient mechanical ventilation details",
  "Mec-F1.1: Insufficient details for protecting penetrations",
  "Mec-F1.2: Insufficient details for fire and smoke control systems",
  "Fss-F1: Insufficient design and system block plans for hydraulic fire systems",
  "Fss-F2: Insufficient design details for fire system water supply",
  "Fss-F5: Insufficient design details for fire hydrant and hose reel systems",
  "Fss-F6: Insufficient design details for fire sprinkler systems",
  "Fss-F8.1: Insufficient details for smoke and heat detection",
  "Fss-F8.2: Lack of design details for emergency warning systems",
  "Fss-F9: Insufficient design details for automatic smoke exhaust systems",
  "Ele-S1: Insufficient details for electrical master plans",
  "Ele-S2: Insufficient design details for electrical plant and equipment",
  "Ele-F1: Insufficient design details for emergency and exit lighting layouts",
];

// NCC clause suggestions by RDGM prefix → NCC version
const NCC_REFS: Record<string, Record<string, string[]>> = {
  "Arc": {
    "NCC 2022": ["C2.3 – Fire resistance of building elements","C2.7 – Fire-protected timber","D2.12 – Egress capacity","F1.7 – Waterproofing of wet areas","F2.3 – Weatherproofing of openings"],
    "NCC 2019 Amendment 1": ["C1.1 – Fire resistance","C1.10 – Openings in walls/floors","D1.7 – Exit travel distance","F1.7 – Waterproofing","FP1.4 – Weatherproofing"],
    "NCC 2019": ["C1.1 – Fire resistance","C1.10 – Openings in walls/floors","D1.7 – Exit travel distance","F1.7 – Waterproofing","FP1.4 – Weatherproofing"],
    "NCC 2016 Amendment 1": ["C1.1","D1.7","F1.7","FP1.4"],
    "NCC 2016": ["C1.1","D1.7","F1.7","FP1.4"],
    "NCC 2015": ["C1.1","D1.7","F1.7"],
  },
  "Str": {
    "NCC 2022": ["H1.2 – Structural reliability","H1.3 – Structural design","H1.4 – Actions on structures"],
    "NCC 2019 Amendment 1": ["B1.2 – Structural reliability","B1.4 – Design resistance","B1.12 – Robustness"],
    "NCC 2019": ["B1.2 – Structural reliability","B1.4 – Design resistance","B1.12 – Robustness"],
    "NCC 2016 Amendment 1": ["B1.2","B1.4"],
    "NCC 2016": ["B1.2","B1.4"],
    "NCC 2015": ["B1.2","B1.4"],
  },
  "Fcd": {
    "NCC 2022": ["C2.3 – Fire resistance of elements","F1.1 – Damp and weatherproofing","F2.3 – Weatherproofing of openings","J1.5 – External wall insulation"],
    "NCC 2019 Amendment 1": ["C1.12 – External walls","FP1.3 – Dampness","FP1.4 – Weatherproofing"],
    "NCC 2019": ["C1.12 – External walls","FP1.3 – Dampness","FP1.4 – Weatherproofing"],
    "NCC 2016 Amendment 1": ["C1.12","FP1.3","FP1.4"],
    "NCC 2016": ["C1.12","FP1.3","FP1.4"],
    "NCC 2015": ["C1.12","FP1.3"],
  },
  "Geo": {
    "NCC 2022": ["H1.2 – Structural reliability","H1.3 – Structural design"],
    "NCC 2019 Amendment 1": ["B1.2 – Structural reliability","B1.4 – Design resistance"],
    "NCC 2019": ["B1.2 – Structural reliability","B1.4 – Design resistance"],
    "NCC 2016 Amendment 1": ["B1.2","B1.4"],
    "NCC 2016": ["B1.2","B1.4"],
    "NCC 2015": ["B1.2"],
  },
  "VTP": {
    "NCC 2022": ["E2.1 – Lift requirements","E2.2 – Lift car dimensions","D3.3 – Accessibility requirements"],
    "NCC 2019 Amendment 1": ["E3.1 – Passenger lifts","E3.2 – Escalators and moving walks"],
    "NCC 2019": ["E3.1 – Passenger lifts","E3.2 – Escalators and moving walks"],
    "NCC 2016 Amendment 1": ["E3.1","E3.2"],
    "NCC 2016": ["E3.1","E3.2"],
    "NCC 2015": ["E3.1"],
  },
  "Mec": {
    "NCC 2022": ["C2.13 – Penetrations through walls/floors","C2.14 – Construction joints","E1.4 – Air-handling systems"],
    "NCC 2019 Amendment 1": ["C2.12 – Penetrations","E1.9 – Air-handling systems"],
    "NCC 2019": ["C2.12 – Penetrations","E1.9 – Air-handling systems"],
    "NCC 2016 Amendment 1": ["C2.12","E1.9"],
    "NCC 2016": ["C2.12","E1.9"],
    "NCC 2015": ["C2.12","E1.9"],
  },
  "Fss": {
    "NCC 2022": ["C2.1 – Automatic sprinkler systems","E1.4 – Fire hose reels","E1.5 – Fire hydrants","E1.6 – Sprinkler systems","E1.8 – Smoke detection and alarm systems"],
    "NCC 2019 Amendment 1": ["C1.1 – Fire resistance","E1.5 – Fire hose reels","E1.8 – Sprinkler systems","E1.9 – Smoke detection"],
    "NCC 2019": ["C1.1 – Fire resistance","E1.5 – Fire hose reels","E1.8 – Sprinkler systems","E1.9 – Smoke detection"],
    "NCC 2016 Amendment 1": ["C1.1","E1.5","E1.8","E1.9"],
    "NCC 2016": ["C1.1","E1.5","E1.8","E1.9"],
    "NCC 2015": ["C1.1","E1.5","E1.8"],
  },
  "Ele": {
    "NCC 2022": ["E4.2 – Emergency lighting","E4.4 – Exit signs","E4.7 – Emergency power supply"],
    "NCC 2019 Amendment 1": ["E2.2 – Emergency lighting","E2.8 – Exit signs"],
    "NCC 2019": ["E2.2 – Emergency lighting","E2.8 – Exit signs"],
    "NCC 2016 Amendment 1": ["E2.2","E2.8"],
    "NCC 2016": ["E2.2","E2.8"],
    "NCC 2015": ["E2.2","E2.8"],
  },
};

// Required drawings per regime (from RDGM standards)
const REQUIRED_DRAWINGS: Record<string, string[]> = {
  "Architectural": ["General arrangement plans (GA plans)","Elevation plans","General sections","Construction method details","Egress/exit system details","Reflected ceiling plans (RCP) with emergency lighting","Passive fire safety design","Internal waterproofing details","External waterproofing details","Building enclosure details"],
  "Structural": ["Structural concept plans","Structural design plans","Structural design sections","Structural elevations","Movement report","Design load details","Flood hazard considerations","Fire ratings schedule","Service penetrations coordination drawings"],
  "Facade": ["Facade system design details","Elevation and section details","Fire-rated structural elements design","External walls and waterproofing interfaces","Facade framing details","Balustrade structural design","Waterproofing/weatherproofing detailed drawings","Thermal compliance design details (BASIX/NatHERS)"],
  "Geotechnical": ["Geotechnical engineering report","Shoring design details","Ground anchor design","Earthwork design details","Geological assumptions and site conditions report"],
  "Vertical Transportation": ["Vertical transportation services masterplan","Lift design details","Lift car accessibility provisions (AS 1735)","Lift car interior details","Maintenance access provisions"],
  "Mechanical": ["Service routes masterplan","Mechanical ventilation design","Penetration protection details (fire)","Fire and smoke control systems design"],
  "Fire Safety Systems": ["Hydraulic fire system block plans","Fire system water supply design","Fire hydrant and hose reel system design","Fire sprinkler system design","Smoke and heat detection layout","Emergency warning system design","Automatic smoke exhaust system design"],
  "Essential Services": ["Emergency lighting layout (AS 2293)","Exit sign layout","Emergency power supply design","Essential services schedule"],
  "Others": [],
};

// Common defects quick-add library by RDGM prefix
const COMMON_DEFECTS: { rdgm: string; element: string; note: string }[] = [
  { rdgm: "Arc-W1.1: Insufficient internal waterproofing details", element: "Waterproofing", note: "Wet area waterproofing details missing: membrane type, upstand heights, fall-to-drain gradients not specified per AS 3740." },
  { rdgm: "Arc-W1.2: Insufficient external waterproofing details", element: "Waterproofing", note: "External waterproofing details missing: balcony/podium membrane, flashing, outlet details not shown per AS 4654." },
  { rdgm: "Arc-F2: The passive fire safety designs lack sufficient details to demonstrate compliance", element: "Fire safety", note: "Passive fire protection details not shown: FRL of elements, fire door schedules, penetration sealing not documented." },
  { rdgm: "Arc-F1: Emergency lighting and exit signs are not included in the architectural RCPs", element: "Fire safety", note: "RCPs do not show emergency lighting points or exit sign locations per NCC Section E." },
  { rdgm: "Arc-G1: Insufficient details in general arrangement plans", element: "Building enclosure", note: "GA plans missing dimensions, setbacks, clearances or room identification required for regulatory compliance." },
  { rdgm: "Arc-BE1: Insufficient design details for the building enclosure", element: "Building enclosure", note: "Weatherproofing/cladding interface details not shown. Thermal performance not demonstrated." },
  { rdgm: "Str-L1: Insufficient/lack of details in structural concept plans", element: "Structural component", note: "Structural concept drawings not provided. Foundation type, load paths and lateral system not documented." },
  { rdgm: "Str-L2: Insufficient structural design plans and details", element: "Structural component", note: "Structural design plans insufficient — member sizes, connections and reinforcement schedules not shown per AS 3600/AS 4100." },
  { rdgm: "Str-L7: Insufficient consideration of fire ratings", element: "Fire safety", note: "Structural fire resistance levels (FRL) not documented. Cover to reinforcement for fire not specified per NCC Section C." },
  { rdgm: "Str-L8: Insufficient or lack of coordination for service penetrations", element: "Structural component", note: "Service penetrations through structural elements not shown or coordinated. Opening sizes, locations and framing details missing." },
  { rdgm: "Fcd-W1: Insufficient design details for façade system", element: "Building enclosure", note: "Facade system details missing: cladding type, weather resistance, fixing details and sealant specification not documented per AS 1562." },
  { rdgm: "Fcd-L1.1: Insufficient design details for external walls and waterproofing interfaces", element: "Waterproofing", note: "Facade-to-structure interface waterproofing not detailed. Window sill, head and jamb flashing details missing." },
  { rdgm: "Fss-F6: Insufficient design details for fire sprinkler systems", element: "Fire safety", note: "Fire sprinkler system design insufficient: hydraulic calculations, head layout, pipe sizing not provided per AS 2118.1." },
  { rdgm: "Fss-F8.1: Insufficient details for smoke and heat detection", element: "Fire safety", note: "Smoke detector layout not shown or insufficient for the coverage area required by AS 1670.1." },
  { rdgm: "Mec-F1.1: Insufficient details for protecting penetrations", element: "Fire safety", note: "Fire-stopping at service penetrations not detailed. Intumescent collars, pillows or mortar seal specification missing per NCC C2.13." },
  { rdgm: "Mec-S2: Insufficient mechanical ventilation details", element: "Building services", note: "Mechanical ventilation design insufficient: duct sizing, air flow rates and zone plans not provided per AS 1668.2." },
  { rdgm: "Ele-F1: Insufficient design details for emergency and exit lighting layouts", element: "Fire safety", note: "Emergency lighting design missing: lux levels, battery backup duration, exit sign locations not documented per AS 2293." },
  { rdgm: "Geo-L2: Insufficient shoring design details", element: "Structural component", note: "Shoring/retention system design details missing. Prop loads, wall type and anchor design not documented." },
  { rdgm: "VTP-VT2.1: Insufficient lift design details", element: "Vertical Transportation", note: "Lift design details missing: shaft dimensions, pit depth, overhead clearance not coordinated per AS 1735." },
];

// Auto-action generation by RDGM prefix
const RDGM_ACTION_MAP: Record<string, { action: string; responsible: string }> = {
  "Arc": { action: "Design practitioner to provide new/varied architectural CIRDs and DCDs addressing all identified deficiencies in general arrangement, passive fire, waterproofing and building enclosure details", responsible: "Design practitioner" },
  "Str": { action: "Design practitioner to provide new/varied structural CIRDs and DCDs with complete member sizes, connection details, reinforcement schedules and coordination drawings for service penetrations", responsible: "Design practitioner" },
  "Fcd": { action: "Design practitioner to provide new/varied facade CIRDs and DCDs with complete facade system design, weatherproofing interface details, thermal compliance and balustrade structural design", responsible: "Design practitioner" },
  "Fss": { action: "Design practitioner to provide new/varied fire safety system CIRDs and DCDs with hydraulic calculations, equipment layouts and all fire system design details to AS standards", responsible: "Design practitioner" },
  "Mec": { action: "Design practitioner to provide new/varied mechanical services CIRDs and DCDs with complete ventilation design, service route masterplan and fire penetration protection details", responsible: "Design practitioner" },
  "Ele": { action: "Design practitioner to provide new/varied electrical and essential services CIRDs and DCDs with complete emergency lighting, exit sign layouts and emergency power supply design", responsible: "Design practitioner" },
  "Geo": { action: "Design practitioner to provide new/varied geotechnical CIRDs and DCDs with complete shoring system design, ground anchor calculations and earthwork design details", responsible: "Design practitioner" },
  "VTP": { action: "Design practitioner to provide new/varied vertical transportation CIRDs and DCDs with complete lift design, accessibility provisions per AS 1735 and maintenance access details", responsible: "Design practitioner" },
};
const STANDARD_FOLLOWUP_ACTIONS: { action: string; responsible: string }[] = [
  { action: "Building practitioner to obtain and lodge new/varied CIRDs and DCDs from the relevant design practitioners to address all identified deficiencies before continuing building work", responsible: "Building practitioner" },
  { action: "Design practitioners to integrate CIRDs with other aspects of building work and other regulated designs to ensure full coordination between all disciplines", responsible: "Design practitioner" },
  { action: "Future DCDs to address all raised compliance issues and confirm the design is in accordance with the NCC and applicable Australian Standards", responsible: "Design practitioner" },
];

// ─── Types ─────────────────────────────────────────────────────────────────────
type Tab = "overview" | "upload" | "analyse" | "action" | "report";

interface UploadedFile { name: string; size: number; }
interface RegimeEntry { id: string; type: string; variation: string; files: UploadedFile[]; }
interface LevelEntry { id: string; label: string; regimes: RegimeEntry[]; }
interface BuildingClassEntry { id: string; classCode: string; description: string; levelCount: number; levels: LevelEntry[]; }

interface DrawingEntry { levelId: string; regimeId: string; drawingType: string; status: "Provided" | "Partial" | "Missing" | "N/A"; drawingRef: string; }
interface BulkRegimeUpload { id: string; regime: string; files: UploadedFile[]; }

interface Finding {
  id: string; rdgm: string; scope: string; location: string;
  buildingElement: string; cirdCategory: string; integrationCategory: string;
  bpBreaches: string[]; notes: string; nccClause: string; levelRef: string;
}
interface AuditOverview {
  auditType: string; auditDate: string; auditorName: string; auditorRole: string;
  nccVersion: string;
  projectName: string; projectAddress: string; lotNumber: string; stage: string;
  practitionerClass: string; practitionerName: string; practitionerLicence: string;
  linkedClientId: string;
}
interface Action {
  id: string; action: string; responsible: string; dueDate: string;
  status: "Open" | "In Progress" | "Closed"; notes: string;
}
interface GapItem {
  id: string;
  level: string;
  regime: string;
  item: string;
  rdgmRef: string;
  status: "Under Review" | "Confirmed Missing" | "Addressed";
  source: "auto" | "manual";
}
interface SavedAudit {
  id: string; overview: AuditOverview; buildingClasses: BuildingClassEntry[];
  findings: Finding[]; actions: Action[]; drawingEntries: DrawingEntry[]; gapItems: GapItem[];
  bulkUploads: BulkRegimeUpload[];
  savedAt: string;
}

// ─── LocalStorage helpers ───────────────────────────────────────────────────────
const LS_INDEX = "dbp_369_index";
const auditKey = (id: string) => `dbp_369_${id}`;
function loadIndex(): string[] { try { return JSON.parse(localStorage.getItem(LS_INDEX) || "[]"); } catch { return []; } }
function saveToLS(audit: SavedAudit) {
  localStorage.setItem(auditKey(audit.id), JSON.stringify(audit));
  const idx = loadIndex();
  if (!idx.includes(audit.id)) localStorage.setItem(LS_INDEX, JSON.stringify([audit.id, ...idx]));
}
function loadAudit(id: string): SavedAudit | null {
  try {
    const raw: SavedAudit | null = JSON.parse(localStorage.getItem(auditKey(id)) || "null");
    if (!raw) return null;
    // Migrate: ensure every RegimeEntry has files[]
    if (raw.buildingClasses) {
      raw.buildingClasses = raw.buildingClasses.map(cls => ({
        ...cls,
        levels: cls.levels.map(l => ({
          ...l,
          regimes: l.regimes.map(r => ({ ...r, files: r.files ?? [] })),
        })),
      }));
    }
    if (!raw.gapItems) raw.gapItems = [];
    if (!raw.bulkUploads) raw.bulkUploads = [];
    return raw;
  } catch { return null; }
}
function deleteAuditLS(id: string) {
  localStorage.removeItem(auditKey(id));
  localStorage.setItem(LS_INDEX, JSON.stringify(loadIndex().filter(x => x !== id)));
}
function listAudits(): SavedAudit[] { return loadIndex().map(id => loadAudit(id)).filter(Boolean) as SavedAudit[]; }

// ─── Helpers ───────────────────────────────────────────────────────────────────
function uid() { return Math.random().toString(36).slice(2, 9); }

function blankOverview(): AuditOverview {
  return { auditType: "", auditDate: new Date().toISOString().split("T")[0], auditorName: "", auditorRole: "", nccVersion: "", projectName: "", projectAddress: "", lotNumber: "", stage: "", practitionerClass: "", practitionerName: "", practitionerLicence: "", linkedClientId: "" };
}

function generateLevels(classCode: string, count: number): LevelEntry[] {
  const isBasement = classCode === "7a" || classCode === "7b";
  const levels: LevelEntry[] = [];
  if (isBasement) {
    for (let i = count; i >= 1; i--) levels.push({ id: uid(), label: `Basement ${i}`, regimes: [] });
  } else {
    for (let i = 0; i < count; i++) levels.push({ id: uid(), label: i === 0 ? "Ground (GL)" : `Level ${i}`, regimes: [] });
  }
  return levels;
}

function adjustLevels(cls: BuildingClassEntry, newCount: number): LevelEntry[] {
  const safeCount = Math.max(1, Math.min(50, newCount));
  const isBasement = cls.classCode === "7a" || cls.classCode === "7b";
  if (safeCount > cls.levelCount) {
    const added = safeCount - cls.levelCount;
    if (isBasement) {
      const newTop: LevelEntry[] = [];
      for (let i = safeCount; i > cls.levelCount; i--) newTop.push({ id: uid(), label: `Basement ${i}`, regimes: [] });
      return [...newTop, ...cls.levels];
    } else {
      const newBottom: LevelEntry[] = [];
      for (let i = cls.levelCount; i < safeCount; i++) newBottom.push({ id: uid(), label: `Level ${i}`, regimes: [] });
      return [...cls.levels, ...newBottom];
    }
  } else if (safeCount < cls.levelCount) {
    return isBasement ? cls.levels.slice(cls.levelCount - safeCount) : cls.levels.slice(0, safeCount);
  }
  return cls.levels;
}

function nccPrefixForRdgm(rdgm: string): string {
  const code = rdgm.split("-")[0];
  return code || "";
}

// ─── UI primitives ─────────────────────────────────────────────────────────────
function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>{children}{required && <span style={{ color: C.amber }}> *</span>}</label>;
}
function Select({ label, value, onChange, options, required }: { label: string; value: string; onChange: (v: string) => void; options: string[]; required?: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <FieldLabel required={required}>{label}</FieldLabel>
      <select value={value} onChange={e => onChange(e.target.value)} style={{ border: `1px solid ${C.border}`, borderRadius: 6, padding: "9px 12px", fontSize: 13, color: C.text, background: C.white, cursor: "pointer", outline: "none", appearance: "none", backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' stroke='%236b7280' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center", paddingRight: 32 }}>
        <option value="">Select…</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
function Input({ label, value, onChange, type = "text", placeholder, required }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; required?: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <FieldLabel required={required}>{label}</FieldLabel>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ border: `1px solid ${C.border}`, borderRadius: 6, padding: "9px 12px", fontSize: 13, color: C.text, background: C.white, outline: "none" }} />
    </div>
  );
}
function Textarea({ label, value, onChange, placeholder, rows = 3 }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <FieldLabel>{label}</FieldLabel>
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} style={{ border: `1px solid ${C.border}`, borderRadius: 6, padding: "9px 12px", fontSize: 13, color: C.text, background: C.white, outline: "none", resize: "vertical", fontFamily: "inherit" }} />
    </div>
  );
}
function SearchSelect({ label, value, onChange, options, required }: { label: string; value: string; onChange: (v: string) => void; options: string[]; required?: boolean }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const filtered = options.filter(o => o.toLowerCase().includes(query.toLowerCase()));
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5, position: "relative" }} ref={ref}>
      <FieldLabel required={required}>{label}</FieldLabel>
      <button onClick={() => setOpen(o => !o)} style={{ border: `1px solid ${open ? C.amber : C.border}`, borderRadius: 6, padding: "9px 12px", fontSize: 13, color: value ? C.text : C.soft, background: C.white, textAlign: "left", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", outline: "none" }}>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "90%" }}>{value || "Search RDGM code…"}</span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}><path d="M2 4l4 4 4-4" stroke={C.muted} strokeWidth="1.5" fill="none" strokeLinecap="round" /></svg>
      </button>
      {open && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 100, background: C.white, border: `1px solid ${C.amber}`, borderRadius: 8, boxShadow: "0 8px 32px rgba(0,0,0,0.14)", marginTop: 4, overflow: "hidden" }}>
          <div style={{ padding: "8px 10px", borderBottom: `1px solid ${C.border}` }}>
            <input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Type code or keyword…" style={{ width: "100%", border: "none", outline: "none", fontSize: 13, color: C.text, fontFamily: "inherit", boxSizing: "border-box" }} />
          </div>
          <div style={{ maxHeight: 240, overflowY: "auto" }}>
            {value && <button onClick={() => { onChange(""); setOpen(false); setQuery(""); }} style={{ width: "100%", textAlign: "left", padding: "9px 12px", fontSize: 12, color: C.red, background: "transparent", border: "none", cursor: "pointer", borderBottom: `1px solid ${C.border}` }}>✕ Clear</button>}
            {filtered.length === 0 && <div style={{ padding: 12, fontSize: 13, color: C.soft, textAlign: "center" }}>No matches</div>}
            {filtered.map(o => (
              <button key={o} onClick={() => { onChange(o); setOpen(false); setQuery(""); }} style={{ width: "100%", textAlign: "left", padding: "9px 12px", fontSize: 12, color: o === value ? C.amberDark : C.text, background: o === value ? `${C.amber}15` : "transparent", border: "none", cursor: "pointer", borderBottom: `1px solid ${C.border}40`, lineHeight: 1.4, fontWeight: o === value ? 600 : 400 }}>
                <span style={{ color: C.amber, fontWeight: 700 }}>{o.split(":")[0]}:</span>{o.includes(":") ? o.substring(o.indexOf(":") + 1) : ""}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
function MultiCheck({ label, options, selected, onChange }: { label: string; options: string[]; selected: string[]; onChange: (v: string[]) => void }) {
  const toggle = (o: string) => onChange(selected.includes(o) ? selected.filter(x => x !== o) : [...selected, o]);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <FieldLabel>{label}</FieldLabel>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {options.map(o => { const on = selected.includes(o); return <button key={o} onClick={() => toggle(o)} style={{ padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 500, border: `1.5px solid ${on ? C.amber : C.border}`, background: on ? `${C.amber}18` : C.white, color: on ? C.amberDark : C.muted, cursor: "pointer" }}>{o}</button>; })}
      </div>
    </div>
  );
}
function Card({ children, style, onMouseEnter, onMouseLeave, onClick }: { children: React.ReactNode; style?: React.CSSProperties; onMouseEnter?: React.MouseEventHandler<HTMLDivElement>; onMouseLeave?: React.MouseEventHandler<HTMLDivElement>; onClick?: React.MouseEventHandler<HTMLDivElement> }) {
  return <div style={{ background: C.cardBg, borderRadius: 12, boxShadow: "0 2px 12px rgba(0,0,0,0.07)", border: `1px solid ${C.border}`, padding: "24px 28px", ...style }} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} onClick={onClick}>{children}</div>;
}
function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, letterSpacing: "0.04em", textTransform: "uppercase", borderBottom: `2px solid ${C.gold}`, paddingBottom: 8, marginBottom: 20 }}>{children}</div>;
}
function Grid2({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>{children}</div>;
}
function StatusBadge({ status, onChange }: { status: Action["status"]; onChange: (s: Action["status"]) => void }) {
  const map: Record<Action["status"], { bg: string; color: string }> = { Open: { bg: C.redBg, color: C.red }, "In Progress": { bg: "#fffbeb", color: "#d97706" }, Closed: { bg: C.greenBg, color: C.green } };
  const { bg, color } = map[status];
  return <select value={status} onChange={e => onChange(e.target.value as Action["status"])} style={{ background: bg, color, border: "none", borderRadius: 12, padding: "3px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{(["Open","In Progress","Closed"] as Action["status"][]).map(s => <option key={s} value={s}>{s}</option>)}</select>;
}
function PrimaryBtn({ children, onClick, style }: { children: React.ReactNode; onClick?: () => void; style?: React.CSSProperties }) {
  return <button onClick={onClick} style={{ background: `linear-gradient(135deg,${C.amberDark},${C.amber})`, color: C.white, border: "none", borderRadius: 8, padding: "10px 24px", fontSize: 13, fontWeight: 700, cursor: "pointer", ...style }}>{children}</button>;
}
function GhostBtn({ children, onClick, danger }: { children: React.ReactNode; onClick?: () => void; danger?: boolean }) {
  return <button onClick={onClick} style={{ background: "transparent", border: `1px solid ${danger ? "#fca5a5" : C.border}`, borderRadius: 6, padding: "8px 18px", fontSize: 12, color: danger ? C.red : C.muted, cursor: "pointer" }}>{children}</button>;
}

// ─── CLIENT Search ──────────────────────────────────────────────────────────────
function ClientSearch({ onSelect }: { onSelect: (p: ReturnType<typeof getProjects>[0]) => void }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const clients = getProjects().filter(p => p.tab === "CLIENT" && !p.isCancelled);
  const filtered = query.length >= 2 ? clients.filter(p => {
    const q = query.toLowerCase();
    return p.projCode.toLowerCase().includes(q)
      || p.developer.toLowerCase().includes(q)
      || p.builder.toLowerCase().includes(q)
      || p.certifierName.toLowerCase().includes(q)
      || p.certifierCompany.toLowerCase().includes(q)
      || p.buildingPractitionerName.toLowerCase().includes(q)
      || p.address.toLowerCase().includes(q)
      || p.suburb.toLowerCase().includes(q)
      || p.dbpPractitioners.some(pr => pr.name.toLowerCase().includes(q) || pr.company.toLowerCase().includes(q));
  }) : [];
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div style={{ position: "relative" }} ref={ref}>
      <div style={{ background: `${C.amber}0d`, border: `1px solid ${C.amber}40`, borderRadius: 8, padding: "12px 14px" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.amberDark, marginBottom: 8 }}>Import from CLIENT List</div>
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search by code (C001), company, or person name…"
          style={{ width: "100%", border: `1px solid ${C.amber}60`, borderRadius: 6, padding: "8px 12px", fontSize: 13, color: C.text, background: C.white, outline: "none", boxSizing: "border-box" }}
        />
        {query.length >= 2 && open && (
          <div style={{ position: "absolute", top: "100%", left: 14, right: 14, zIndex: 200, background: C.white, border: `1px solid ${C.amber}`, borderRadius: 8, boxShadow: "0 8px 32px rgba(0,0,0,0.14)", marginTop: 4, maxHeight: 280, overflowY: "auto" }}>
            {filtered.length === 0 && <div style={{ padding: "16px", fontSize: 13, color: C.soft, textAlign: "center" }}>No CLIENT projects found for "{query}"</div>}
            {filtered.map(p => (
              <button key={p.id} onClick={() => { onSelect(p); setQuery(""); setOpen(false); }} style={{ width: "100%", textAlign: "left", padding: "12px 14px", background: "transparent", border: "none", borderBottom: `1px solid ${C.border}`, cursor: "pointer" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                  <span style={{ background: `${C.amber}18`, color: C.amberDark, borderRadius: 10, padding: "1px 8px", fontSize: 11, fontWeight: 700 }}>{p.projCode}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.navy }}>{p.address}, {p.suburb}</span>
                </div>
                <div style={{ fontSize: 12, color: C.muted }}>{[p.developer, p.builder].filter(Boolean).join(" · ") || "No company recorded"}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Building Classes Card ──────────────────────────────────────────────────────
function BuildingClassesCard({ classes, onChange }: { classes: BuildingClassEntry[]; onChange: (c: BuildingClassEntry[]) => void }) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadModal, setUploadModal] = useState<{ classId: string; levelId: string; regimeId: string } | null>(null);
  const [modalDragOver, setModalDragOver] = useState(false);

  const commitFiles = (classId: string, levelId: string, regimeId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newFiles: UploadedFile[] = Array.from(files).map(f => ({ name: f.name, size: f.size }));
    onChange(classes.map(c => c.id !== classId ? c : { ...c, levels: c.levels.map(l => l.id !== levelId ? l : { ...l, regimes: l.regimes.map(r => r.id !== regimeId ? r : { ...r, files: [...(r.files ?? []), ...newFiles.filter(nf => !(r.files ?? []).some(ef => ef.name === nf.name))] }) }) }));
    setUploadModal(null);
  };
  const removeFile = (classId: string, levelId: string, regimeId: string, fileName: string) => {
    const cls = classes.find(c => c.id === classId);
    if (!cls) return;
    onChange(classes.map(c => c.id !== classId ? c : { ...c, levels: c.levels.map(l => l.id !== levelId ? l : { ...l, regimes: l.regimes.map(r => r.id !== regimeId ? r : { ...r, files: (r.files ?? []).filter(f => f.name !== fileName) }) }) }));
  };

  const addClass = (code: string) => {
    if (classes.some(c => c.classCode === code)) return;
    onChange([...classes, { id: uid(), classCode: code, description: CLASS_DESCRIPTIONS[code] || "", levelCount: 1, levels: generateLevels(code, 1) }]);
  };
  const removeClass = (id: string) => onChange(classes.filter(c => c.id !== id));
  const updateClass = (id: string, updates: Partial<BuildingClassEntry>) => onChange(classes.map(c => c.id === id ? { ...c, ...updates } : c));

  const updateLevelCount = (classId: string, count: number) => {
    const cls = classes.find(c => c.id === classId);
    if (!cls) return;
    const safeCount = Math.max(1, Math.min(50, count));
    updateClass(classId, { levelCount: safeCount, levels: adjustLevels(cls, safeCount) });
  };

  const updateLevelLabel = (classId: string, levelId: string, label: string) => {
    const cls = classes.find(c => c.id === classId);
    if (!cls) return;
    updateClass(classId, { levels: cls.levels.map(l => l.id === levelId ? { ...l, label } : l) });
  };

  const addRegime = (classId: string, levelId: string, type: string) => {
    if (!type) return;
    const cls = classes.find(c => c.id === classId);
    if (!cls) return;
    const regime: RegimeEntry = { id: uid(), type, variation: "", files: [] };
    updateClass(classId, { levels: cls.levels.map(l => l.id === levelId ? { ...l, regimes: [...l.regimes, regime] } : l) });
  };

  const updateRegime = (classId: string, levelId: string, regimeId: string, updates: Partial<RegimeEntry>) => {
    const cls = classes.find(c => c.id === classId);
    if (!cls) return;
    updateClass(classId, { levels: cls.levels.map(l => l.id === levelId ? { ...l, regimes: l.regimes.map(r => r.id === regimeId ? { ...r, ...updates } : r) } : l) });
  };

  const removeRegime = (classId: string, levelId: string, regimeId: string) => {
    const cls = classes.find(c => c.id === classId);
    if (!cls) return;
    updateClass(classId, { levels: cls.levels.map(l => l.id === levelId ? { ...l, regimes: l.regimes.filter(r => r.id !== regimeId) } : l) });
  };

  return (
    <Card>
      <SectionTitle>Building Classes &amp; Levels</SectionTitle>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 8, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>Add a Class</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {BUILDING_CLASS_CODES.map(code => {
            const added = classes.some(c => c.classCode === code);
            return <button key={code} onClick={() => addClass(code)} disabled={added} style={{ padding: "5px 14px", borderRadius: 16, fontSize: 12, fontWeight: 700, border: `2px solid ${added ? C.border : C.amber}`, background: added ? C.bg : `${C.amber}15`, color: added ? C.soft : C.amberDark, cursor: added ? "default" : "pointer" }}>Class {code}</button>;
          })}
        </div>
      </div>

      {classes.length === 0 && <div style={{ textAlign: "center", padding: "20px 0", color: C.soft, fontSize: 13 }}>No classes added. Click a class above to start.</div>}

      {classes.map(cls => (
        <div key={cls.id} style={{ border: `1.5px solid ${C.amber}40`, borderRadius: 10, marginBottom: 14, overflow: "hidden", background: `${C.amber}04` }}>
          {/* Class header */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: `${C.amber}10`, borderBottom: `1px solid ${C.amber}30`, flexWrap: "wrap" }}>
            <div style={{ background: `linear-gradient(135deg,${C.amberDark},${C.amber})`, color: C.white, borderRadius: 6, padding: "3px 12px", fontSize: 13, fontWeight: 800, flexShrink: 0 }}>Class {cls.classCode}</div>
            <input value={cls.description} onChange={e => updateClass(cls.id, { description: e.target.value })} placeholder="e.g. Basement Car Park" style={{ flex: 1, minWidth: 150, border: `1px solid ${C.border}`, borderRadius: 5, padding: "4px 8px", fontSize: 12, color: C.text, background: C.white, outline: "none" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>Levels:</span>
              <input type="number" min={1} max={50} value={cls.levelCount} onChange={e => updateLevelCount(cls.id, parseInt(e.target.value) || 1)} style={{ width: 48, border: `1px solid ${C.border}`, borderRadius: 5, padding: "4px 6px", fontSize: 12, textAlign: "center", outline: "none" }} />
            </div>
            <button onClick={() => removeClass(cls.id)} style={{ background: "transparent", border: `1px solid #fca5a5`, borderRadius: 5, padding: "3px 10px", fontSize: 11, color: C.red, cursor: "pointer" }}>Remove</button>
          </div>

          {/* Levels */}
          {cls.levels.map((level, li) => (
            <div key={level.id} style={{ borderBottom: li < cls.levels.length - 1 ? `1px solid ${C.border}` : "none" }}>
              {/* Level name row */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px 4px", background: "#f8f9fb" }}>
                <span style={{ fontSize: 11, color: C.muted, fontWeight: 600, flexShrink: 0 }}>Level:</span>
                <input value={level.label} onChange={e => updateLevelLabel(cls.id, level.id, e.target.value)} style={{ fontWeight: 700, fontSize: 12, color: C.navy, border: `1px solid ${C.border}`, borderRadius: 5, padding: "3px 8px", background: C.white, outline: "none", minWidth: 120 }} />
              </div>

              {/* Regime rows */}
              <div style={{ padding: "4px 14px 8px 24px" }}>
                {level.regimes.map(r => {
                  const fCount = r.files?.length ?? 0;
                  return (
                    <div key={r.id} style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" as const }}>
                      <select value={r.type} onChange={e => updateRegime(cls.id, level.id, r.id, { type: e.target.value })} style={{ border: `1px solid ${C.blue}40`, borderRadius: 5, padding: "4px 8px", fontSize: 11, color: C.blue, background: C.blueBg, outline: "none", fontWeight: 600, minWidth: 160 }}>
                        {REGIME_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <input value={r.variation} onChange={e => updateRegime(cls.id, level.id, r.id, { variation: e.target.value })} placeholder="Variation (e.g. Passive Fire)" style={{ border: `1px solid ${C.border}`, borderRadius: 5, padding: "4px 8px", fontSize: 11, outline: "none", width: 130 }} />
                      {/* Upload button → opens modal */}
                      <button
                        onClick={() => setUploadModal({ classId: cls.id, levelId: level.id, regimeId: r.id })}
                        style={{ border: `2px dashed ${C.amber}`, borderRadius: 5, padding: "4px 12px", fontSize: 11, color: C.amberDark, background: fCount > 0 ? `${C.amber}10` : C.white, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4, flexShrink: 0 }}
                      >
                        📎 Upload{fCount > 0 ? ` (${fCount})` : ""}
                      </button>
                      {/* Inline file chips */}
                      {(r.files ?? []).map(f => (
                        <span key={f.name} style={{ display: "inline-flex", alignItems: "center", gap: 3, background: C.greenBg, color: C.green, border: "1px solid #bbf7d0", borderRadius: 10, padding: "2px 8px", fontSize: 10, fontWeight: 600 }}>
                          📄 {f.name}
                          <button onClick={() => removeFile(cls.id, level.id, r.id, f.name)} style={{ background: "transparent", border: "none", cursor: "pointer", color: C.muted, fontSize: 11, padding: "0 1px", lineHeight: 1 }}>×</button>
                        </span>
                      ))}
                      <button onClick={() => removeRegime(cls.id, level.id, r.id)} style={{ background: "transparent", border: "none", cursor: "pointer", color: C.soft, fontSize: 14, padding: "0 2px", lineHeight: 1, fontWeight: 700, marginLeft: "auto" }}>×</button>
                    </div>
                  );
                })}
                {/* Add regime button → inline select */}
                <AddRegimeInline onAdd={(type) => addRegime(cls.id, level.id, type)} />
              </div>
            </div>
          ))}
          {/* Add Level button */}
          <div style={{ padding: "6px 14px 10px", borderTop: `1px dashed ${C.border}` }}>
            <button onClick={() => updateLevelCount(cls.id, cls.levelCount + 1)} style={{ background: "transparent", border: `1px dashed ${C.navy}40`, borderRadius: 10, padding: "3px 14px", fontSize: 11, color: C.navy, cursor: "pointer", fontWeight: 600 }}>+ Add Level</button>
          </div>
        </div>
      ))}

      {/* Hidden file input for modal */}
      <input
        type="file"
        multiple
        accept=".pdf"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={e => { if (uploadModal) commitFiles(uploadModal.classId, uploadModal.levelId, uploadModal.regimeId, e.target.files); e.target.value = ""; }}
      />

      {/* Upload modal */}
      {uploadModal && (() => {
        const cls = classes.find(c => c.id === uploadModal.classId);
        const level = cls?.levels.find(l => l.id === uploadModal.levelId);
        const regime = level?.regimes.find(r => r.id === uploadModal.regimeId);
        return (
          <div
            onClick={() => setUploadModal(null)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}
          >
            <div
              onClick={e => e.stopPropagation()}
              onDragOver={e => { e.preventDefault(); setModalDragOver(true); }}
              onDragEnter={e => { e.preventDefault(); setModalDragOver(true); }}
              onDragLeave={() => setModalDragOver(false)}
              onDrop={e => { e.preventDefault(); setModalDragOver(false); commitFiles(uploadModal.classId, uploadModal.levelId, uploadModal.regimeId, e.dataTransfer.files); }}
              style={{ background: C.white, borderRadius: 16, width: 480, maxWidth: "92vw", overflow: "hidden", boxShadow: "0 24px 80px rgba(0,0,0,0.22)" }}
            >
              {/* Modal header */}
              <div style={{ background: C.navy, padding: "16px 22px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ color: C.goldLight, fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: 2 }}>Upload Drawings</div>
                  <div style={{ color: C.white, fontSize: 14, fontWeight: 600 }}>{level?.label} — {regime?.type}{regime?.variation ? ` (${regime.variation})` : ""}</div>
                </div>
                <button onClick={() => setUploadModal(null)} style={{ background: "transparent", border: "none", color: C.goldLight, fontSize: 22, cursor: "pointer", lineHeight: 1, padding: 0 }}>×</button>
              </div>

              {/* Drop zone */}
              <div style={{ padding: "32px 28px" }}>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: `2px dashed ${modalDragOver ? C.amber : "#d1d5db"}`,
                    borderRadius: 12,
                    padding: "40px 24px",
                    textAlign: "center",
                    cursor: "pointer",
                    background: modalDragOver ? `${C.amber}0d` : C.bg,
                    transition: "all 0.15s",
                  }}
                >
                  <div style={{ fontSize: 48, marginBottom: 12 }}>☁️</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.navy, marginBottom: 6 }}>
                    {modalDragOver ? "Release to upload" : "Drop your PDF Drawings here"}
                  </div>
                  <div style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>or click to browse files</div>
                  <button
                    onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}
                    style={{ background: `linear-gradient(135deg,${C.amberDark},${C.amber})`, color: C.white, border: "none", borderRadius: 8, padding: "10px 28px", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8 }}
                  >
                    📄 Upload PDF Drawings
                  </button>
                </div>

                {/* Already-uploaded chips in modal */}
                {(regime?.files ?? []).length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase" as const, letterSpacing: "0.04em", marginBottom: 8 }}>Uploaded ({regime!.files.length})</div>
                    <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6 }}>
                      {regime!.files.map(f => (
                        <span key={f.name} style={{ display: "inline-flex", alignItems: "center", gap: 4, background: C.greenBg, color: C.green, border: "1px solid #bbf7d0", borderRadius: 10, padding: "3px 10px", fontSize: 11, fontWeight: 600 }}>
                          📄 {f.name}
                          <button onClick={() => removeFile(uploadModal.classId, uploadModal.levelId, uploadModal.regimeId, f.name)} style={{ background: "transparent", border: "none", cursor: "pointer", color: C.muted, fontSize: 12, padding: "0 1px", lineHeight: 1 }}>×</button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </Card>
  );
}

function AddRegimeInline({ onAdd }: { onAdd: (type: string) => void }) {
  const [open, setOpen] = useState(false);
  if (!open) return <button onClick={() => setOpen(true)} style={{ background: "transparent", border: `1px dashed ${C.amber}`, borderRadius: 10, padding: "2px 10px", fontSize: 11, color: C.amber, cursor: "pointer", fontWeight: 600 }}>+ Add Regime</button>;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <select defaultValue="" onChange={e => { if (e.target.value) { onAdd(e.target.value); setOpen(false); } }} autoFocus style={{ border: `1px solid ${C.amber}`, borderRadius: 5, padding: "4px 8px", fontSize: 11, outline: "none" }}>
        <option value="">Select regime…</option>
        {REGIME_TYPES.map(r => <option key={r} value={r}>{r}</option>)}
      </select>
      <button onClick={() => setOpen(false)} style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: 5, padding: "3px 8px", fontSize: 11, cursor: "pointer", color: C.muted }}>Cancel</button>
    </div>
  );
}

// ─── Audit List ─────────────────────────────────────────────────────────────────
function AuditList({ onNew, onOpen }: { onNew: () => void; onOpen: (id: string) => void }) {
  const [audits, setAudits] = useState<SavedAudit[]>(() => listAudits());
  const del = (id: string) => { if (!confirm("Delete this audit?")) return; deleteAuditLS(id); setAudits(listAudits()); };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C.navy }}>DBP Audits</h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: C.muted }}>{audits.length} saved audit{audits.length !== 1 ? "s" : ""}</p>
        </div>
        <PrimaryBtn onClick={onNew}>+ New Audit</PrimaryBtn>
      </div>
      {audits.length === 0 && (
        <Card><div style={{ textAlign: "center", padding: "48px 0" }}><div style={{ fontSize: 48, marginBottom: 16 }}>📋</div><div style={{ fontSize: 16, fontWeight: 700, color: C.navy, marginBottom: 8 }}>No audits yet</div><div style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>Create your first DBP Act compliance audit.</div><PrimaryBtn onClick={onNew}>Start First Audit</PrimaryBtn></div></Card>
      )}
      {audits.map(a => {
        const openCount = a.actions.filter(x => x.status === "Open").length;
        const classCount = a.buildingClasses?.length || 0;
        return (
          <Card key={a.id} style={{ cursor: "pointer", transition: "border-color 0.15s" }}
            onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = C.amber}
            onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = C.border}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1 }} onClick={() => onOpen(a.id)}>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.navy, marginBottom: 4 }}>{a.overview.projectName || <span style={{ color: C.soft, fontStyle: "italic" }}>Untitled Project</span>}</div>
                <div style={{ fontSize: 13, color: C.muted, marginBottom: 10 }}>{a.overview.projectAddress || "No address"} · {a.overview.auditDate}</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {a.overview.auditType && <span style={{ background: `${C.amber}18`, color: C.amberDark, border: `1px solid ${C.amber}40`, borderRadius: 12, padding: "2px 10px", fontSize: 11, fontWeight: 600 }}>{a.overview.auditType}</span>}
                  {a.overview.nccVersion && <span style={{ background: C.blueBg, color: C.blue, border: `1px solid ${C.blue}30`, borderRadius: 12, padding: "2px 10px", fontSize: 11, fontWeight: 600 }}>{a.overview.nccVersion}</span>}
                  {classCount > 0 && <span style={{ background: "#f0f4ff", color: "#1e3a5f", border: "1px solid #c7d4f0", borderRadius: 12, padding: "2px 10px", fontSize: 11, fontWeight: 600 }}>{classCount} class{classCount !== 1 ? "es" : ""}</span>}
                  <span style={{ background: C.bg, color: C.muted, border: `1px solid ${C.border}`, borderRadius: 12, padding: "2px 10px", fontSize: 11 }}>{a.findings.length} finding{a.findings.length !== 1 ? "s" : ""}</span>
                  {openCount > 0 && <span style={{ background: C.redBg, color: C.red, borderRadius: 12, padding: "2px 10px", fontSize: 11, fontWeight: 600 }}>{openCount} open</span>}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, marginLeft: 16, flexShrink: 0 }}>
                <GhostBtn onClick={() => onOpen(a.id)}>Open</GhostBtn>
                <GhostBtn onClick={() => del(a.id)} danger>Delete</GhostBtn>
              </div>
            </div>
            <div style={{ marginTop: 10, fontSize: 11, color: C.soft }}>Saved {new Date(a.savedAt).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" })}</div>
          </Card>
        );
      })}
    </div>
  );
}

// ─── Bulk Regime Upload Card ────────────────────────────────────────────────────
function BulkUploadCard({ uploads, onChange }: { uploads: BulkRegimeUpload[]; onChange: (u: BulkRegimeUpload[]) => void }) {
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [dragOver, setDragOver] = useState<string | null>(null);

  const addEntry = () => onChange([...uploads, { id: uid(), regime: "", files: [] }]);
  const removeEntry = (id: string) => onChange(uploads.filter(u => u.id !== id));
  const updateRegime = (id: string, regime: string) => onChange(uploads.map(u => u.id === id ? { ...u, regime } : u));

  const handleFiles = (id: string, files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newFiles: UploadedFile[] = Array.from(files).map(f => ({ name: f.name, size: f.size }));
    onChange(uploads.map(u => u.id === id ? { ...u, files: [...u.files, ...newFiles.filter(nf => !u.files.some(ef => ef.name === nf.name))] } : u));
  };
  const removeFile = (uploadId: string, fileName: string) =>
    onChange(uploads.map(u => u.id === uploadId ? { ...u, files: u.files.filter(f => f.name !== fileName) } : u));

  return (
    <Card style={{ border: `1px solid ${C.amber}40` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
        <div>
          <SectionTitle>Bulk Drawings by Regime</SectionTitle>
          <p style={{ margin: "-14px 0 16px", fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
            Upload grouped PDFs for a whole regime (e.g. all Architectural drawings across all levels in one file).
            During Analyse, the level will be extracted from each page's title block automatically.
          </p>
        </div>
        <button
          onClick={addEntry}
          style={{ background: C.white, border: `1px solid ${C.amber}`, color: C.amberDark, borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" as const }}
        >
          + Add Regime
        </button>
      </div>

      {uploads.length === 0 && (
        <div style={{ textAlign: "center", padding: "24px 0", color: C.soft, fontSize: 13 }}>
          No bulk uploads yet. Click <strong style={{ color: C.amberDark }}>+ Add Regime</strong> to add a grouped drawing set.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {uploads.map(u => (
          <div key={u.id} style={{ border: `1px solid ${C.border}`, borderRadius: 10, background: C.bg, padding: "12px 14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: u.files.length > 0 ? 10 : 0, flexWrap: "wrap" as const }}>
              {/* Regime selector */}
              <select
                value={u.regime}
                onChange={e => updateRegime(u.id, e.target.value)}
                style={{ border: `1px solid ${u.regime ? C.border : C.amber}`, borderRadius: 5, padding: "5px 8px", fontSize: 12, fontWeight: 600, color: u.regime ? C.text : C.muted, background: C.white, cursor: "pointer", minWidth: 160 }}
              >
                <option value="" disabled>Select Regime…</option>
                {REGIME_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>

              {/* Drag-and-drop / click zone */}
              <input
                type="file"
                multiple
                accept=".pdf"
                ref={el => { fileInputRefs.current[u.id] = el; }}
                style={{ display: "none" }}
                onChange={e => handleFiles(u.id, e.target.files)}
              />
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(u.id); }}
                onDragEnter={e => { e.preventDefault(); setDragOver(u.id); }}
                onDragLeave={() => setDragOver(null)}
                onDrop={e => { e.preventDefault(); setDragOver(null); handleFiles(u.id, e.dataTransfer.files); }}
                onClick={() => fileInputRefs.current[u.id]?.click()}
                style={{
                  border: `2px dashed ${dragOver === u.id ? C.amber : C.border}`,
                  borderRadius: 6,
                  padding: "6px 16px",
                  fontSize: 12,
                  color: dragOver === u.id ? C.amberDark : C.muted,
                  cursor: "pointer",
                  background: dragOver === u.id ? `${C.amber}12` : C.white,
                  fontWeight: 600,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  transition: "all 0.15s",
                  userSelect: "none" as const,
                  flex: 1,
                  minWidth: 160,
                  justifyContent: "center",
                }}
              >
                📄 {dragOver === u.id ? "Drop PDF here" : u.files.length > 0 ? `Add more PDFs (${u.files.length} uploaded)` : "Click or drag PDF files here"}
              </div>

              {/* Delete row */}
              <button
                onClick={() => removeEntry(u.id)}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: C.soft, fontSize: 18, padding: "0 4px", lineHeight: 1, fontWeight: 700 }}
                title="Remove this entry"
              >×</button>
            </div>

            {/* File chips */}
            {u.files.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6, paddingTop: 2 }}>
                {u.files.map(f => (
                  <span key={f.name} style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: "2px 8px", fontSize: 11, color: C.blue, fontWeight: 500 }}>
                    📄 {f.name}
                    <button onClick={() => removeFile(u.id, f.name)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#93c5fd", fontSize: 13, lineHeight: 1, padding: 0, fontWeight: 700 }}>×</button>
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {uploads.some(u => u.files.length > 0) && (
        <div style={{ marginTop: 14, background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: C.blue, lineHeight: 1.6 }}>
          ℹ️ <strong>Title block parsing:</strong> During the Analyse step, each page of these PDFs will be scanned for level references in the title block (e.g. "Level 2", "L03", "Ground Floor") and grouped accordingly for per-level compliance analysis.
        </div>
      )}
    </Card>
  );
}

// ─── Audit Editor ───────────────────────────────────────────────────────────────
function AuditEditor({ auditId, onBack }: { auditId: string; onBack: () => void }) {
  const existing = loadAudit(auditId);
  const [tab, setTab] = useState<Tab>("overview");
  const [overview, setOverview] = useState<AuditOverview>(existing?.overview ?? blankOverview());
  const [buildingClasses, setBuildingClasses] = useState<BuildingClassEntry[]>(existing?.buildingClasses ?? []);
  const [findings, setFindings] = useState<Finding[]>(existing?.findings ?? []);
  const [actions, setActions] = useState<Action[]>(existing?.actions ?? []);
  const [drawingEntries, setDrawingEntries] = useState<DrawingEntry[]>(existing?.drawingEntries ?? []);
  const [savedIndicator, setSavedIndicator] = useState(false);
  const [clientUpdatePrompt, setClientUpdatePrompt] = useState<{ clientId: string; field: string; newValue: string } | null>(null);

  const [gapItems, setGapItems] = useState<GapItem[]>(existing?.gapItems ?? []);
  const [bulkUploads, setBulkUploads] = useState<BulkRegimeUpload[]>(existing?.bulkUploads ?? []);
  const [editingFinding, setEditingFinding] = useState<Finding | null>(null);
  const [showFindingForm, setShowFindingForm] = useState(false);
  const [editingAction, setEditingAction] = useState<Action | null>(null);
  const [showActionForm, setShowActionForm] = useState(false);
  const [editingGap, setEditingGap] = useState<GapItem | null>(null);
  const [showGapForm, setShowGapForm] = useState(false);


  useEffect(() => {
    const audit: SavedAudit = { id: auditId, overview, buildingClasses, findings, actions, drawingEntries, gapItems, bulkUploads, savedAt: new Date().toISOString() };
    saveToLS(audit);
    setSavedIndicator(true);
    const t = setTimeout(() => setSavedIndicator(false), 1500);
    return () => clearTimeout(t);
  }, [overview, buildingClasses, findings, actions, drawingEntries, gapItems, bulkUploads, auditId]);

  const ovSet = <K extends keyof AuditOverview>(k: K, v: AuditOverview[K]) => setOverview(o => ({ ...o, [k]: v }));

  const handleClientImport = (p: ReturnType<typeof getProjects>[0]) => {
    const firstPractitioner = p.dbpPractitioners?.[0];
    setOverview(o => ({
      ...o,
      linkedClientId: p.id,
      projectName: p.developDescription || `${p.address}, ${p.suburb}`,
      projectAddress: `${p.address}, ${p.suburb} ${p.postcode}`,
      lotNumber: p.daNumber || p.ccNumber || "",
      stage: p.stage.includes("Basement") ? "Basement" : p.stage.includes("Facade") ? "Primary structure" : p.stage.includes("GL") ? "Primary structure" : p.stage.includes("Excavation") ? "Excavation" : "",
      practitionerName: firstPractitioner?.name || p.buildingPractitionerName || o.practitionerName,
      practitionerClass: firstPractitioner?.type?.[0] || o.practitionerClass,
      practitionerLicence: firstPractitioner?.registration || p.buildingPractitionerReg || o.practitionerLicence,
    }));
    // Auto-populate building classes from client data
    if (p.buildingClasses.length > 0 && buildingClasses.length === 0) {
      const newClasses = p.buildingClasses.map(code => ({
        id: uid(), classCode: code, description: CLASS_DESCRIPTIONS[code] || "", levelCount: 1, levels: generateLevels(code, 1),
      }));
      setBuildingClasses(newClasses);
    }
  };

  const handleUpdateClient = () => {
    if (!clientUpdatePrompt) return;
    updateProject(clientUpdatePrompt.clientId, { buildingPractitionerName: clientUpdatePrompt.newValue } as Parameters<typeof updateProject>[1], "DBP Auditor");
    setClientUpdatePrompt(null);
  };

  const blankFinding = (): Finding => ({ id: uid(), rdgm: "", scope: "", location: "", buildingElement: "", cirdCategory: "", integrationCategory: "", bpBreaches: [], notes: "", nccClause: "", levelRef: "" });
  const saveFinding = () => {
    if (!editingFinding) return;
    setFindings(fs => fs.some(f => f.id === editingFinding.id) ? fs.map(f => f.id === editingFinding.id ? editingFinding : f) : [...fs, editingFinding]);
    setShowFindingForm(false); setEditingFinding(null);
  };

  const blankAction = (): Action => ({ id: uid(), action: "", responsible: "", dueDate: "", status: "Open", notes: "" });
  const saveAction = () => {
    if (!editingAction) return;
    setActions(as => as.some(a => a.id === editingAction.id) ? as.map(a => a.id === editingAction.id ? editingAction : a) : [...as, editingAction]);
    setShowActionForm(false); setEditingAction(null);
  };

  const getDrawingStatus = (levelId: string, regimeId: string, drawingType: string): DrawingEntry["status"] => {
    return drawingEntries.find(d => d.levelId === levelId && d.regimeId === regimeId && d.drawingType === drawingType)?.status || "N/A";
  };
  const getDrawingRef = (levelId: string, regimeId: string, drawingType: string): string => {
    return drawingEntries.find(d => d.levelId === levelId && d.regimeId === regimeId && d.drawingType === drawingType)?.drawingRef || "";
  };
  const setDrawingStatus = (levelId: string, regimeId: string, drawingType: string, status: DrawingEntry["status"]) => {
    setDrawingEntries(prev => {
      const existing = prev.find(d => d.levelId === levelId && d.regimeId === regimeId && d.drawingType === drawingType);
      if (existing) return prev.map(d => d.levelId === levelId && d.regimeId === regimeId && d.drawingType === drawingType ? { ...d, status } : d);
      return [...prev, { levelId, regimeId, drawingType, status, drawingRef: "" }];
    });
  };
  const setDrawingRef = (levelId: string, regimeId: string, drawingType: string, drawingRef: string) => {
    setDrawingEntries(prev => {
      const existing = prev.find(d => d.levelId === levelId && d.regimeId === regimeId && d.drawingType === drawingType);
      if (existing) return prev.map(d => d.levelId === levelId && d.regimeId === regimeId && d.drawingType === drawingType ? { ...d, drawingRef } : d);
      return [...prev, { levelId, regimeId, drawingType, status: "N/A", drawingRef }];
    });
  };

  const completePct = Math.round(([overview.auditType, overview.auditDate, overview.auditorName, overview.projectName, overview.projectAddress, overview.stage, overview.nccVersion].filter(Boolean).length / 7) * 100);

  const TABS: { key: Tab; label: string }[] = [
    { key: "overview", label: "1. Overview" },
    { key: "upload", label: "2. Upload" },
    { key: "analyse", label: "3. Analyse" },
    { key: "action", label: "4. Action" },
    { key: "report", label: "5. Report" },
  ];

  // All level refs for the findings dropdown
  const allLevelRefs = buildingClasses.flatMap(cls => cls.levels.map(l => `Class ${cls.classCode} – ${l.label}`));

  // NCC prefix for current finding's RDGM
  const findingNccPrefix = editingFinding ? nccPrefixForRdgm(editingFinding.rdgm) : "";
  const nccSuggestions = (overview.nccVersion && findingNccPrefix && NCC_REFS[findingNccPrefix]?.[overview.nccVersion]) || [];

  const blankGap = (): GapItem => ({ id: uid(), level: "", regime: "", item: "", rdgmRef: "", status: "Under Review", source: "manual" });
  const saveGap = () => {
    if (!editingGap) return;
    setGapItems(gs => gs.some(g => g.id === editingGap.id) ? gs.map(g => g.id === editingGap.id ? editingGap : g) : [...gs, editingGap]);
    setShowGapForm(false); setEditingGap(null);
  };

  const generateActionsFromFindings = () => {
    const usedPrefixes = new Set<string>();
    const generated: Action[] = [];
    findings.forEach(f => {
      const prefix = nccPrefixForRdgm(f.rdgm);
      if (prefix && !usedPrefixes.has(prefix) && RDGM_ACTION_MAP[prefix]) {
        usedPrefixes.add(prefix);
        generated.push({ id: uid(), action: RDGM_ACTION_MAP[prefix].action, responsible: RDGM_ACTION_MAP[prefix].responsible, dueDate: "", status: "Open", notes: `Generated from findings: ${findings.filter(x => nccPrefixForRdgm(x.rdgm) === prefix).map(x => x.rdgm.split(":")[0]).join(", ")}` });
      }
    });
    STANDARD_FOLLOWUP_ACTIONS.forEach(sa => {
      generated.push({ id: uid(), action: sa.action, responsible: sa.responsible, dueDate: "", status: "Open", notes: "" });
    });
    setActions(prev => {
      // Avoid duplicates if already generated
      const existingTexts = new Set(prev.map(a => a.action));
      return [...prev, ...generated.filter(g => !existingTexts.has(g.action))];
    });
  };

  const autoSuggestGaps = () => {
    const suggestions: GapItem[] = [];
    buildingClasses.forEach(cls => {
      cls.levels.forEach(level => {
        level.regimes.forEach(regime => {
          const hasFiles = (regime.files?.length ?? 0) > 0;
          const required = REQUIRED_DRAWINGS[regime.type] || [];
          if (!hasFiles && required.length > 0) {
            required.forEach(item => {
              suggestions.push({
                id: uid(),
                level: `Class ${cls.classCode} – ${level.label}`,
                regime: regime.type + (regime.variation ? ` (${regime.variation})` : ""),
                item,
                rdgmRef: "",
                status: "Under Review",
                source: "auto",
              });
            });
          }
        });
      });
    });
    setGapItems(prev => {
      const existingKeys = new Set(prev.map(g => `${g.level}||${g.regime}||${g.item}`));
      return [...prev, ...suggestions.filter(s => !existingKeys.has(`${s.level}||${s.regime}||${s.item}`))];
    });
  };

  // ── Word export ──────────────────────────────────────────────────────────────
  const downloadAsWord = () => {
    const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    // Collect gap items for gap analysis section
    const confirmedMissing = gapItems.filter(g => g.status === "Confirmed Missing");
    const underReview = gapItems.filter(g => g.status === "Under Review");

    const findingsHtml = findings.map((f, i) => `
      <div class="finding">
        <p class="finding-title">${i + 1}. ${esc(f.rdgm)}</p>
        ${f.nccClause ? `<p><span class="label">NCC Clause: </span>${esc(f.nccClause)}</p>` : ""}
        ${f.levelRef ? `<p><span class="label">Location: </span>${esc(f.levelRef)}</p>` : ""}
        ${f.scope ? `<p><span class="label">Scope: </span>${esc(f.scope)}</p>` : ""}
        ${f.buildingElement ? `<p><span class="label">Building Element: </span>${esc(f.buildingElement)}</p>` : ""}
        ${f.cirdCategory ? `<p><span class="label">CIRD Breach: </span>${esc(f.cirdCategory)}</p>` : ""}
        ${f.bpBreaches.length ? `<p><span class="label">BP Breaches: </span>${f.bpBreaches.map(esc).join("; ")}</p>` : ""}
        ${f.notes ? `<p><span class="label">Notes: </span>${esc(f.notes)}</p>` : ""}
      </div>`).join("");

    const actionsHtml = actions.length ? `
      <h2>Recommended Actions</h2>
      <table>
        <tr><th>#</th><th>Action</th><th>Responsible</th><th>Due Date</th><th>Status</th></tr>
        ${actions.map((a, i) => `<tr><td>${i + 1}</td><td>${esc(a.action)}</td><td>${esc(a.responsible)}</td><td>${esc(a.dueDate)}</td><td>${esc(a.status)}</td></tr>`).join("")}
      </table>` : "";

    const classesHtml = buildingClasses.length ? `
      <h2>Building Classes</h2>
      <table>
        <tr><th>Class</th><th>Description</th><th>Levels</th><th>Regimes</th></tr>
        ${buildingClasses.map(cls => { const regimeTypes = cls.levels.flatMap(l => l.regimes.map(r => r.type)).filter((v, i, a) => a.indexOf(v) === i); return `<tr><td>Class ${esc(cls.classCode)}</td><td>${esc(cls.description)}</td><td>${cls.levelCount}</td><td>${regimeTypes.join(", ") || "—"}</td></tr>`; }).join("")}
      </table>` : "";

    const missingHtml = (confirmedMissing.length || underReview.length) ? `
      <h2>Drawing Gap Analysis (${gapItems.length} items)</h2>
      ${confirmedMissing.length ? `<p><strong>Confirmed Missing (${confirmedMissing.length}):</strong></p>
      <table>
        <tr><th>#</th><th>Missing Item</th><th>Level</th><th>Regime</th><th>RDGM Ref</th></tr>
        ${confirmedMissing.map((m, i) => `<tr><td>${i + 1}</td><td>${esc(m.item)}</td><td>${esc(m.level)}</td><td>${esc(m.regime)}</td><td>${esc(m.rdgmRef)}</td></tr>`).join("")}
      </table>` : ""}
      ${underReview.length ? `<p><strong>Under Review (${underReview.length}):</strong></p>
      <table>
        <tr><th>#</th><th>Item</th><th>Level</th><th>Regime</th></tr>
        ${underReview.map((m, i) => `<tr><td>${i + 1}</td><td>${esc(m.item)}</td><td>${esc(m.level)}</td><td>${esc(m.regime)}</td></tr>`).join("")}
      </table>` : ""}` : "";

    const html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head><meta charset='utf-8'><title>DBP Audit Report – ${esc(overview.projectName || "Unnamed")}</title>
<style>
  body { font-family: Calibri, sans-serif; font-size: 11pt; color: #1f2937; margin: 2cm; }
  h1 { font-family: Calibri, sans-serif; font-size: 20pt; color: #1a1a2e; margin-bottom: 4pt; }
  h2 { font-family: Calibri, sans-serif; font-size: 14pt; color: #1a1a2e; border-bottom: 1.5pt solid #C07040; padding-bottom: 3pt; margin-top: 18pt; }
  .subtitle { font-size: 11pt; color: #6b7280; margin-bottom: 2pt; }
  .meta-grid { display: grid; grid-template-columns: 140pt auto; gap: 4pt 12pt; margin-bottom: 8pt; }
  .label { font-weight: bold; color: #6b7280; }
  .finding { border-left: 3pt solid #C07040; padding-left: 10pt; margin-bottom: 14pt; }
  .finding-title { font-weight: bold; color: #1a1a2e; font-size: 11pt; margin-bottom: 4pt; }
  table { border-collapse: collapse; width: 100%; margin-bottom: 12pt; font-size: 10pt; }
  td, th { border: 0.75pt solid #d1d5db; padding: 4pt 8pt; vertical-align: top; }
  th { background-color: #1a1a2e; color: white; font-weight: bold; }
  tr:nth-child(even) td { background-color: #f9fafb; }
  .footer { font-size: 9pt; color: #9ca3af; margin-top: 24pt; border-top: 0.75pt solid #e5e7eb; padding-top: 6pt; }
</style>
</head>
<body>
<h1>DBP Act Compliance Audit Report</h1>
<p class="subtitle">${esc(overview.projectAddress || "")} · ${esc(overview.auditDate)}</p>
${overview.nccVersion ? `<p class="subtitle">Assessed under: <strong>${esc(overview.nccVersion)}</strong> · Audit Type: <strong>${esc(overview.auditType || "—")}</strong></p>` : ""}

<h2>Audit Summary</h2>
<table>
  <tr><th>Field</th><th>Detail</th></tr>
  ${[["Project", overview.projectName],["Address", overview.projectAddress],["Audit Date", overview.auditDate],["Audit Type", overview.auditType],["Auditor", overview.auditorName],["Auditor Role", overview.auditorRole],["NCC Version", overview.nccVersion],["Stage", overview.stage],["Lot / DA", overview.lotNumber],["Practitioner Class", overview.practitionerClass],["Practitioner Name", overview.practitionerName],["Practitioner Licence", overview.practitionerLicence]].filter(([,v]) => v).map(([k,v]) => `<tr><td class="label">${esc(k as string)}</td><td>${esc(v as string)}</td></tr>`).join("")}
  <tr><td class="label">Total Findings</td><td>${findings.length}</td></tr>
  <tr><td class="label">Open Actions</td><td>${actions.filter(a => a.status === "Open").length}</td></tr>
</table>

${classesHtml}

${findings.length ? `<h2>Findings (${findings.length})</h2>${findingsHtml}` : ""}

${actionsHtml}

${missingHtml}

<p class="footer">Generated by 369 Alliance DBP Auditor · ${new Date().toLocaleDateString("en-AU", { day: "2-digit", month: "long", year: "numeric" })}</p>
</body></html>`;

    const blob = new Blob([html], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `DBP-Audit-${(overview.projectName || "Report").replace(/[^a-z0-9]/gi, "-")}-${overview.auditDate || new Date().toISOString().slice(0, 10)}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {/* Sub-header */}
      <div style={{ background: "#0f1120", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "10px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={onBack} style={{ background: "transparent", border: "none", color: C.goldLight, fontSize: 12, cursor: "pointer", padding: 0 }}>← All Audits</button>
          <span style={{ color: "rgba(255,255,255,0.2)" }}>|</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.white }}>{overview.projectName || <span style={{ color: "rgba(255,255,255,0.4)", fontStyle: "italic" }}>Untitled project</span>}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 40, height: 3, background: "rgba(255,255,255,0.15)", borderRadius: 2, overflow: "hidden" }}><div style={{ width: `${completePct}%`, height: "100%", background: C.gold, borderRadius: 2 }} /></div>
            <span style={{ fontSize: 11, color: C.goldLight }}>{completePct}%</span>
          </div>
          <span style={{ fontSize: 11, color: savedIndicator ? C.green : "rgba(255,255,255,0.25)", transition: "color 0.3s", minWidth: 40 }}>{savedIndicator ? "✓ Saved" : "Auto-save on"}</span>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ background: C.navy, borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "0 32px", display: "flex", gap: 2 }}>
        {TABS.map(t => <button key={t.key} onClick={() => setTab(t.key)} style={{ background: "transparent", border: "none", cursor: "pointer", padding: "12px 18px", fontSize: 13, fontWeight: 600, color: tab === t.key ? C.gold : "rgba(255,255,255,0.45)", borderBottom: tab === t.key ? `2px solid ${C.gold}` : "2px solid transparent", transition: "color 0.15s" }}>{t.label}</button>)}
      </div>

      {clientUpdatePrompt && (
        <div style={{ background: "#fffbeb", border: "1px solid #fcd34d", padding: "12px 32px", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 13, color: "#92400e" }}>💡 Practitioner "{clientUpdatePrompt.newValue}" is not in the CLIENT record. Update CLIENT?</span>
          <button onClick={handleUpdateClient} style={{ background: C.amber, color: C.white, border: "none", borderRadius: 6, padding: "5px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Update CLIENT</button>
          <button onClick={() => setClientUpdatePrompt(null)} style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: 6, padding: "5px 10px", fontSize: 12, cursor: "pointer", color: C.muted }}>Dismiss</button>
        </div>
      )}

      <main style={{ flex: 1, padding: "32px 32px 60px", maxWidth: 900, width: "100%", margin: "0 auto", boxSizing: "border-box" }}>

        {/* ══ Tab 1: Overview ══ */}
        {tab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <Card>
              <SectionTitle>Audit Details</SectionTitle>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <Grid2>
                  <Select label="Audit Type" value={overview.auditType} onChange={v => ovSet("auditType", v)} options={AUDIT_TYPES} required />
                  <Input label="Audit Date" value={overview.auditDate} onChange={v => ovSet("auditDate", v)} type="date" required />
                  <Input label="Auditor Name" value={overview.auditorName} onChange={v => ovSet("auditorName", v)} placeholder="Full name" required />
                  <Select label="Auditor Role" value={overview.auditorRole} onChange={v => ovSet("auditorRole", v)} options={AUDITOR_ROLES} />
                </Grid2>
                <Select label="NCC Version" value={overview.nccVersion} onChange={v => ovSet("nccVersion", v)} options={NCC_VERSIONS} required />
                {overview.nccVersion && (
                  <div style={{ background: C.blueBg, border: `1px solid ${C.blue}30`, borderRadius: 8, padding: "10px 14px", fontSize: 12, color: C.blue }}>
                    <strong>{overview.nccVersion}</strong> — {overview.nccVersion === "NCC 2022" ? "Current edition. New numbering system (H, C, D, E, F, J sections)." : overview.nccVersion.includes("2019") ? "Volume One. Performance solution framework. Sections B, C, D, E, F, J." : "Building Code of Australia. Sections B, C, D, E, F, J."}
                  </div>
                )}
              </div>
            </Card>

            <Card>
              <SectionTitle>Project / Site</SectionTitle>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <ClientSearch onSelect={handleClientImport} />
                <Grid2>
                  <Input label="Project Name" value={overview.projectName} onChange={v => ovSet("projectName", v)} placeholder="Development name" required />
                  <Input label="Lot / DA Number" value={overview.lotNumber} onChange={v => ovSet("lotNumber", v)} placeholder="e.g. DA-2024/001" />
                </Grid2>
                <Input label="Project Address" value={overview.projectAddress} onChange={v => ovSet("projectAddress", v)} placeholder="Full street address" required />
                <Select label="Stage of Construction" value={overview.stage} onChange={v => ovSet("stage", v)} options={STAGES} required />
              </div>
            </Card>

            <Card>
              <SectionTitle>Building / Design Practitioner</SectionTitle>
              <Grid2>
                <Select label="Practitioner Class" value={overview.practitionerClass} onChange={v => ovSet("practitionerClass", v)} options={PRACTITIONER_CLASSES} />
                <Input label="Practitioner Name" value={overview.practitionerName} onChange={v => {
                  ovSet("practitionerName", v);
                  if (overview.linkedClientId && v && v !== overview.practitionerName) {
                    const client = getProjects().find(p => p.id === overview.linkedClientId);
                    if (client && !client.buildingPractitionerName) setClientUpdatePrompt({ clientId: overview.linkedClientId, field: "practitionerName", newValue: v });
                  }
                }} placeholder="Full name or company" />
                <Input label="Licence / Registration No." value={overview.practitionerLicence} onChange={v => ovSet("practitionerLicence", v)} placeholder="e.g. DBP-12345" />
              </Grid2>
            </Card>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <PrimaryBtn onClick={() => setTab("upload")}>Next: Upload →</PrimaryBtn>
            </div>
          </div>
        )}

        {/* ══ Tab 2: Upload ══ */}
        {tab === "upload" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C.navy }}>Upload Drawings</h2>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: C.muted }}>Upload regulated design drawings per level and regime for compliance analysis.</p>
              </div>
            </div>

            <BuildingClassesCard classes={buildingClasses} onChange={setBuildingClasses} />

            <BulkUploadCard uploads={bulkUploads} onChange={setBulkUploads} />

            {/* Manual Findings Override */}
            <Card style={{ border: `1px solid ${C.amber}30` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                <div>
                  <SectionTitle>Manual Findings</SectionTitle>
                  <p style={{ margin: "-14px 0 16px", fontSize: 12, color: C.muted }}>Record findings manually before or after drawing analysis.{findings.length > 0 ? ` ${findings.length} recorded.` : ""}</p>
                </div>
                <PrimaryBtn onClick={() => { setEditingFinding(blankFinding()); setShowFindingForm(true); }}>+ Add Finding</PrimaryBtn>
              </div>

              {!overview.nccVersion && (
                <div style={{ background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#92400e", marginBottom: 12 }}>
                  ⚠ NCC version not set. <button onClick={() => setTab("overview")} style={{ background: "transparent", border: "none", color: C.amber, fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}>Set it in Overview</button>
                </div>
              )}

              {showFindingForm && editingFinding && (
                <div style={{ border: `2px solid ${C.amber}`, borderRadius: 12, padding: "20px 22px", marginBottom: 16, background: C.white }}>
                  <SectionTitle>{findings.some(f => f.id === editingFinding.id) ? "Edit Finding" : "New Finding"}</SectionTitle>
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <SearchSelect label="RDGM Code / Finding" value={editingFinding.rdgm} onChange={v => setEditingFinding(f => f ? { ...f, rdgm: v } : f)} options={RDGM_CODES} required />
                    {editingFinding.rdgm && overview.nccVersion && nccSuggestions.length > 0 && (
                      <div style={{ background: C.blueBg, border: `1px solid ${C.blue}30`, borderRadius: 8, padding: "10px 14px" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: C.blue, marginBottom: 6, textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>Suggested {overview.nccVersion} Clauses</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {nccSuggestions.map(s => (
                            <button key={s} onClick={() => setEditingFinding(f => f ? { ...f, nccClause: f.nccClause ? `${f.nccClause}; ${s}` : s } : f)} style={{ background: C.white, border: `1px solid ${C.blue}40`, borderRadius: 6, padding: "3px 10px", fontSize: 11, color: C.blue, cursor: "pointer", fontWeight: 600 }}>+ {s}</button>
                          ))}
                        </div>
                      </div>
                    )}
                    <Input label="NCC Clause Reference" value={editingFinding.nccClause} onChange={v => setEditingFinding(f => f ? { ...f, nccClause: v } : f)} placeholder="e.g. C2.3, B1.2 – Structural reliability" />
                    {allLevelRefs.length > 0 && (
                      <Select label="Level / Location Reference" value={editingFinding.levelRef} onChange={v => setEditingFinding(f => f ? { ...f, levelRef: v } : f)} options={allLevelRefs} />
                    )}
                    <Grid2>
                      <Select label="Scope" value={editingFinding.scope} onChange={v => setEditingFinding(f => f ? { ...f, scope: v } : f)} options={SCOPES} />
                      <Select label="Location" value={editingFinding.location} onChange={v => setEditingFinding(f => f ? { ...f, location: v } : f)} options={LOCATIONS} />
                      <Select label="Building Element" value={editingFinding.buildingElement} onChange={v => setEditingFinding(f => f ? { ...f, buildingElement: v } : f)} options={BUILDING_ELEMENTS} />
                      <Select label="CIRD Breach Category" value={editingFinding.cirdCategory} onChange={v => setEditingFinding(f => f ? { ...f, cirdCategory: v } : f)} options={CIRD_BREACH_CATS} />
                    </Grid2>
                    <Select label="Integration Category" value={editingFinding.integrationCategory} onChange={v => setEditingFinding(f => f ? { ...f, integrationCategory: v } : f)} options={INTEGRATION_CATS} />
                    <MultiCheck label="BP Breaches" options={BP_BREACHES} selected={editingFinding.bpBreaches} onChange={v => setEditingFinding(f => f ? { ...f, bpBreaches: v } : f)} />
                    <Textarea label="Auditor Notes" value={editingFinding.notes} onChange={v => setEditingFinding(f => f ? { ...f, notes: v } : f)} placeholder="Describe the finding in detail…" rows={4} />
                    <div style={{ display: "flex", gap: 10 }}>
                      <PrimaryBtn onClick={saveFinding}>Save Finding</PrimaryBtn>
                      <GhostBtn onClick={() => { setShowFindingForm(false); setEditingFinding(null); }}>Cancel</GhostBtn>
                    </div>
                  </div>
                </div>
              )}

              {findings.length === 0 && !showFindingForm && (
                <div style={{ textAlign: "center", padding: "24px 0", color: C.soft }}>
                  <div style={{ fontSize: 13 }}>No manual findings yet. Findings will be generated automatically after drawing analysis, or add them manually above.</div>
                </div>
              )}

              {findings.map((f, i) => (
                <div key={f.id} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "12px 14px", marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                      <div style={{ width: 22, height: 22, borderRadius: "50%", background: `linear-gradient(135deg,${C.amberDark},${C.amber})`, color: C.white, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: C.navy, lineHeight: 1.4 }}>
                        {f.rdgm ? <><span style={{ color: C.amber }}>{f.rdgm.split(":")[0]}:</span>{f.rdgm.includes(":") ? f.rdgm.substring(f.rdgm.indexOf(":") + 1) : ""}</> : <span style={{ color: C.soft, fontStyle: "italic" }}>No RDGM code</span>}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                      <GhostBtn onClick={() => { setEditingFinding({ ...f }); setShowFindingForm(true); }}>Edit</GhostBtn>
                      <GhostBtn onClick={() => setFindings(fs => fs.filter(x => x.id !== f.id))} danger>Delete</GhostBtn>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, paddingLeft: 30 }}>
                    {f.nccClause && <span style={{ background: C.blueBg, color: C.blue, borderRadius: 10, padding: "1px 8px", fontSize: 10, fontWeight: 600 }}>{f.nccClause}</span>}
                    {[f.scope, f.location, f.buildingElement].filter(Boolean).map(t => <span key={t} style={{ background: `${C.amber}18`, color: C.amberDark, borderRadius: 10, padding: "1px 8px", fontSize: 10 }}>{t}</span>)}
                    {f.bpBreaches.map(b => <span key={b} style={{ background: C.redBg, color: C.red, borderRadius: 10, padding: "1px 8px", fontSize: 10 }}>{b}</span>)}
                  </div>
                  {f.notes && <p style={{ margin: "6px 0 0 30px", fontSize: 12, color: C.muted, lineHeight: 1.5 }}>{f.notes}</p>}
                </div>
              ))}
            </Card>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <PrimaryBtn onClick={() => setTab("analyse")}>Next: Analyse →</PrimaryBtn>
            </div>
          </div>
        )}

        {/* ══ Tab 3: Analyse ══ */}
        {tab === "analyse" && (() => {
          const perLevelFiles = buildingClasses.flatMap(c => c.levels.flatMap(l => l.regimes.flatMap(r => r.files ?? []))).length;
          const bulkFiles = bulkUploads.reduce((n, u) => n + u.files.length, 0);
          const totalFiles = perLevelFiles + bulkFiles;
          const regimeCount = buildingClasses.flatMap(c => c.levels.flatMap(l => l.regimes)).length;
          const regimesWithFiles = buildingClasses.flatMap(c => c.levels.flatMap(l => l.regimes.filter(r => (r.files?.length ?? 0) > 0))).length;
          const hasMissingRegimes = buildingClasses.some(c => c.levels.some(l => l.regimes.some(r => (r.files?.length ?? 0) === 0 && (REQUIRED_DRAWINGS[r.type]?.length ?? 0) > 0)));
          return (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C.navy }}>Drawing Analysis</h2>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: C.muted }}>AI-powered compliance analysis of uploaded drawings against RDGM standards and NCC requirements.</p>
              </div>

              {totalFiles === 0 ? (
                <Card>
                  <div style={{ textAlign: "center", padding: "48px 0" }}>
                    <div style={{ fontSize: 56, marginBottom: 16 }}>📐</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: C.navy, marginBottom: 8 }}>Analysis Engine Ready</div>
                    <div style={{ fontSize: 13, color: C.muted, maxWidth: 400, margin: "0 auto 24px", lineHeight: 1.6 }}>No drawings uploaded yet. Upload regulated design drawings in the Upload tab to begin compliance analysis.</div>
                    <PrimaryBtn onClick={() => setTab("upload")}>← Upload Drawings</PrimaryBtn>
                  </div>
                </Card>
              ) : (
                <>
                  <Card style={{ background: `linear-gradient(135deg,${C.navy},${C.navyLight})`, color: C.white }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
                      <div>
                        <div style={{ fontSize: 11, color: C.goldLight, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, marginBottom: 6 }}>Drawing Analysis Engine</div>
                        <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "Montserrat, sans-serif", marginBottom: 4 }}>{totalFiles} Drawing{totalFiles !== 1 ? "s" : ""} Uploaded</div>
                        <div style={{ fontSize: 13, color: C.goldLight }}>{regimesWithFiles} of {regimeCount} regime{regimeCount !== 1 ? "s" : ""} have drawings · {overview.nccVersion || "NCC version not set"}</div>
                      </div>
                      <button onClick={generateActionsFromFindings} style={{ background: `linear-gradient(135deg,${C.amberDark},${C.amber})`, border: "none", color: C.white, borderRadius: 8, padding: "10px 22px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                        ⚡ Generate Actions from Findings
                      </button>
                    </div>
                  </Card>

                  {buildingClasses.map(cls => {
                    const clsFiles = cls.levels.flatMap(l => l.regimes.flatMap(r => r.files ?? [])).length;
                    return (
                      <Card key={cls.id} style={{ padding: "16px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                          <div style={{ background: `linear-gradient(135deg,${C.amberDark},${C.amber})`, color: C.white, borderRadius: 6, padding: "2px 12px", fontSize: 12, fontWeight: 800 }}>Class {cls.classCode}</div>
                          <div style={{ fontSize: 13, color: C.text, fontWeight: 600, flex: 1 }}>{cls.description}</div>
                          <span style={{ fontSize: 11, color: clsFiles > 0 ? C.green : C.soft, fontWeight: 600 }}>{clsFiles > 0 ? `✓ ${clsFiles} file${clsFiles !== 1 ? "s" : ""}` : "No files"}</span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {cls.levels.flatMap(level =>
                            level.regimes.map(r => {
                              const fCount = r.files?.length ?? 0;
                              const hasRequired = (REQUIRED_DRAWINGS[r.type]?.length ?? 0) > 0;
                              const statusColor = fCount > 0 ? C.green : hasRequired ? C.red : C.soft;
                              const statusLabel = fCount > 0 ? `${fCount} file${fCount !== 1 ? "s" : ""}` : hasRequired ? "Missing" : "N/A";
                              return (
                                <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: fCount > 0 ? C.greenBg : hasRequired ? C.redBg : C.bg, borderRadius: 6, border: `1px solid ${fCount > 0 ? "#bbf7d0" : hasRequired ? "#fca5a540" : C.border}`, flexWrap: "wrap" }}>
                                  <span style={{ fontSize: 11, fontWeight: 700, color: statusColor, minWidth: 60 }}>{statusLabel}</span>
                                  <span style={{ fontSize: 11, color: C.text }}>{level.label} — {r.type}{r.variation ? ` (${r.variation})` : ""}</span>
                                  {fCount > 0 && (r.files ?? []).map(f => (
                                    <span key={f.name} style={{ fontSize: 10, color: C.green, background: "#dcfce7", border: "1px solid #bbf7d0", borderRadius: 8, padding: "1px 6px" }}>📄 {f.name}</span>
                                  ))}
                                </div>
                              );
                            })
                          )}
                        </div>
                      </Card>
                    );
                  })}

                  {bulkUploads.length > 0 && (
                    <Card style={{ padding: "16px 20px", border: `1px solid #bfdbfe` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                        <div style={{ background: `linear-gradient(135deg,${C.blue},#3b82f6)`, color: C.white, borderRadius: 6, padding: "2px 12px", fontSize: 12, fontWeight: 800 }}>Bulk PDFs</div>
                        <div style={{ fontSize: 13, color: C.text, fontWeight: 600, flex: 1 }}>Grouped drawings — level extracted from title block</div>
                        <span style={{ fontSize: 11, color: C.blue, fontWeight: 600 }}>{bulkFiles} file{bulkFiles !== 1 ? "s" : ""}</span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {bulkUploads.map(u => (
                          <div key={u.id} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "8px 10px", background: u.files.length > 0 ? "#eff6ff" : C.bg, borderRadius: 6, border: `1px solid ${u.files.length > 0 ? "#bfdbfe" : C.border}`, flexWrap: "wrap" as const }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: C.blue, minWidth: 90 }}>{u.regime}</span>
                            {u.files.length === 0 ? (
                              <span style={{ fontSize: 11, color: C.soft }}>No files uploaded</span>
                            ) : (
                              <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 4 }}>
                                {u.files.map(f => (
                                  <span key={f.name} style={{ fontSize: 10, color: C.blue, background: "#dbeafe", border: "1px solid #bfdbfe", borderRadius: 8, padding: "1px 6px" }}>📄 {f.name}</span>
                                ))}
                                <span style={{ fontSize: 10, color: C.muted, background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 8, padding: "1px 6px" }}>⚙ Level parsed from title block</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}
                </>
              )}

              {hasMissingRegimes && (
                <div style={{ background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 10, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ fontSize: 22 }}>📋</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#92400e", marginBottom: 2 }}>Regimes without uploaded drawings detected</div>
                    <div style={{ fontSize: 12, color: "#78350f" }}>Based on assigned regimes, required drawings may be missing. Load gap suggestions to identify potential compliance issues.</div>
                  </div>
                  <button onClick={autoSuggestGaps} style={{ background: "#d97706", color: C.white, border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" as const }}>Load Gap Suggestions</button>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <PrimaryBtn onClick={() => setTab("action")}>Next: Action →</PrimaryBtn>
              </div>
            </div>
          );
        })()}

        {/* ══ Tab 4: Action ══ */}
        {tab === "action" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C.navy }}>Recommended Actions</h2>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: C.muted }}>{actions.length} assigned · Auto-generated from findings and drawing gaps</p>
              </div>
              <PrimaryBtn onClick={() => { setEditingAction(blankAction()); setShowActionForm(true); }}>+ Add Action</PrimaryBtn>
            </div>

            {findings.length > 0 && actions.length === 0 && (
              <div style={{ background: C.blueBg, border: `1px solid ${C.blue}30`, borderRadius: 10, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ fontSize: 24 }}>⚡</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.blue, marginBottom: 2 }}>{findings.length} finding{findings.length !== 1 ? "s" : ""} recorded — actions can be auto-generated</div>
                  <div style={{ fontSize: 12, color: C.muted }}>Specific recommended actions will be generated for each discipline with applicable standard follow-up actions.</div>
                </div>
                <button onClick={generateActionsFromFindings} style={{ background: `linear-gradient(135deg,${C.blue},#2563eb)`, color: C.white, border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" as const }}>Generate Actions</button>
              </div>
            )}
            {findings.length > 0 && actions.length > 0 && (
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <GhostBtn onClick={generateActionsFromFindings}>⚡ Add Missing Actions from Findings</GhostBtn>
              </div>
            )}

            {showActionForm && editingAction && (
              <Card style={{ border: `2px solid ${C.amber}` }}>
                <SectionTitle>{actions.some(a => a.id === editingAction.id) ? "Edit Action" : "New Action"}</SectionTitle>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 6 }}>Recommended Action <span style={{ color: C.red }}>*</span></div>
                    <textarea value={editingAction.action} onChange={e => setEditingAction(a => a ? { ...a, action: e.target.value } : a)} placeholder="Describe the specific action required…" rows={3} style={{ width: "100%", border: `1.5px solid ${C.border}`, borderRadius: 6, padding: "8px 12px", fontSize: 13, fontFamily: "IBM Plex Sans, sans-serif", resize: "vertical", outline: "none", boxSizing: "border-box" as const }} />
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: -10 }}>Or select from standards:</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {REC_ACTIONS.map(r => <button key={r} onClick={() => setEditingAction(a => a ? { ...a, action: r } : a)} style={{ background: editingAction.action === r ? `${C.amber}20` : C.bg, border: `1px solid ${editingAction.action === r ? C.amber : C.border}`, borderRadius: 16, padding: "3px 10px", fontSize: 11, color: editingAction.action === r ? C.amberDark : C.muted, cursor: "pointer", fontWeight: editingAction.action === r ? 700 : 400 }}>{r}</button>)}
                  </div>
                  <Grid2>
                    <Select label="Responsible Party" value={editingAction.responsible} onChange={v => setEditingAction(a => a ? { ...a, responsible: v } : a)} options={RESPONSIBLE} required />
                    <Input label="Due Date" value={editingAction.dueDate} onChange={v => setEditingAction(a => a ? { ...a, dueDate: v } : a)} type="date" />
                  </Grid2>
                  <Textarea label="Notes / Instructions" value={editingAction.notes} onChange={v => setEditingAction(a => a ? { ...a, notes: v } : a)} placeholder="Specific instructions or context…" />
                  <div style={{ display: "flex", gap: 10 }}>
                    <PrimaryBtn onClick={saveAction}>Save Action</PrimaryBtn>
                    <GhostBtn onClick={() => { setShowActionForm(false); setEditingAction(null); }}>Cancel</GhostBtn>
                  </div>
                </div>
              </Card>
            )}

            {actions.length === 0 && !showActionForm && (
              <Card><div style={{ textAlign: "center", padding: "40px 0", color: C.soft }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: C.muted, marginBottom: 6 }}>No actions yet</div>
                <div style={{ fontSize: 13 }}>{findings.length > 0 ? "Click \"Generate Actions\" above to auto-populate from findings, or add manually." : "Add findings in the Upload tab, then actions will be recommended automatically."}</div>
              </div></Card>
            )}

            {actions.map((a, i) => (
              <Card key={a.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start", flex: 1 }}>
                    <div style={{ width: 22, height: 22, borderRadius: "50%", background: `linear-gradient(135deg,${C.navy},#22243a)`, color: C.white, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.navy, lineHeight: 1.5, flex: 1 }}>{a.action || <span style={{ color: C.soft, fontStyle: "italic" }}>No action specified</span>}</div>
                  </div>
                  <StatusBadge status={a.status} onChange={v => setActions(as => as.map(x => x.id === a.id ? { ...x, status: v } : x))} />
                </div>
                <div style={{ fontSize: 12, color: C.muted, marginBottom: a.notes ? 8 : 0, paddingLeft: 32 }}>
                  {a.responsible && <span>👤 {a.responsible}</span>}{a.responsible && a.dueDate && <span> · </span>}{a.dueDate && <span>📅 {a.dueDate}</span>}
                </div>
                {a.notes && <p style={{ margin: "0 0 0 32px", fontSize: 12, color: C.muted, lineHeight: 1.6, fontStyle: "italic" }}>{a.notes}</p>}
                <div style={{ display: "flex", gap: 8, marginTop: 10, paddingLeft: 32 }}>
                  <GhostBtn onClick={() => { setEditingAction({ ...a }); setShowActionForm(true); }}>Edit</GhostBtn>
                  <GhostBtn onClick={() => setActions(as => as.filter(x => x.id !== a.id))} danger>Delete</GhostBtn>
                </div>
              </Card>
            ))}

            {/* ── Gap Analysis sub-section ── */}
            <div style={{ borderTop: `2px solid ${C.border}`, paddingTop: 24, marginTop: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.navy }}>Drawing Gap Analysis</div>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{gapItems.length} item{gapItems.length !== 1 ? "s" : ""} identified · Specific to submitted drawings</div>
                </div>
                <PrimaryBtn onClick={() => { setEditingGap(blankGap()); setShowGapForm(true); }}>+ Add Gap Item</PrimaryBtn>
              </div>

              {showGapForm && editingGap && (
                <Card style={{ border: `2px solid ${C.amber}`, marginBottom: 16 }}>
                  <SectionTitle>{gapItems.some(g => g.id === editingGap.id) ? "Edit Gap Item" : "New Gap Item"}</SectionTitle>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <Grid2>
                      <Input label="Level / Location" value={editingGap.level} onChange={v => setEditingGap(g => g ? { ...g, level: v } : g)} placeholder="e.g. Class 2 – Ground (GL)" />
                      <Input label="Regime / Discipline" value={editingGap.regime} onChange={v => setEditingGap(g => g ? { ...g, regime: v } : g)} placeholder="e.g. Architectural" />
                    </Grid2>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 6 }}>Missing Item / Drawing <span style={{ color: C.red }}>*</span></div>
                      <textarea value={editingGap.item} onChange={e => setEditingGap(g => g ? { ...g, item: e.target.value } : g)} placeholder="Describe what drawing, detail or specification is missing…" rows={2} style={{ width: "100%", border: `1.5px solid ${C.border}`, borderRadius: 6, padding: "8px 12px", fontSize: 13, fontFamily: "IBM Plex Sans, sans-serif", resize: "vertical", outline: "none", boxSizing: "border-box" as const }} />
                    </div>
                    <Input label="RDGM Reference (optional)" value={editingGap.rdgmRef} onChange={v => setEditingGap(g => g ? { ...g, rdgmRef: v } : g)} placeholder="e.g. Arc-W1.1" />
                    <Select label="Status" value={editingGap.status} onChange={v => setEditingGap(g => g ? { ...g, status: v as GapItem["status"] } : g)} options={["Under Review", "Confirmed Missing", "Addressed"]} />
                    <div style={{ display: "flex", gap: 10 }}>
                      <PrimaryBtn onClick={saveGap}>Save</PrimaryBtn>
                      <GhostBtn onClick={() => { setShowGapForm(false); setEditingGap(null); }}>Cancel</GhostBtn>
                    </div>
                  </div>
                </Card>
              )}

              {gapItems.length === 0 && !showGapForm && (
                <div style={{ textAlign: "center", padding: "24px 0", color: C.soft, background: C.white, borderRadius: 10, border: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: 13 }}>No gap items. Use "Load Gap Suggestions" in the Analyse tab or add manually.</div>
                </div>
              )}

              {gapItems.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {(["Confirmed Missing", "Under Review", "Addressed"] as GapItem["status"][]).map(statusGroup => {
                    const group = gapItems.filter(g => g.status === statusGroup);
                    if (!group.length) return null;
                    const statusStyle = statusGroup === "Confirmed Missing" ? { color: C.red, bg: C.redBg, border: "#fca5a540" } : statusGroup === "Under Review" ? { color: "#d97706", bg: "#fffbeb", border: "#fcd34d40" } : { color: C.green, bg: C.greenBg, border: "#bbf7d040" };
                    return (
                      <div key={statusGroup}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: statusStyle.color, textTransform: "uppercase" as const, letterSpacing: "0.07em", marginBottom: 8, paddingLeft: 4 }}>{statusGroup} ({group.length})</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {group.map((g) => (
                            <div key={g.id} style={{ background: C.white, border: `1px solid ${C.border}`, borderLeft: `3px solid ${statusStyle.color}`, borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "flex-start", gap: 12 }}>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 5 }}>
                                  {g.level && <span style={{ background: `${C.navy}10`, color: C.navy, border: `1px solid ${C.navy}20`, borderRadius: 10, padding: "1px 8px", fontSize: 11, fontWeight: 700 }}>{g.level}</span>}
                                  {g.regime && <span style={{ background: C.blueBg, color: C.blue, border: `1px solid ${C.blue}30`, borderRadius: 10, padding: "1px 8px", fontSize: 11, fontWeight: 600 }}>{g.regime}</span>}
                                  {g.rdgmRef && <span style={{ background: `${C.amber}15`, color: C.amberDark, border: `1px solid ${C.amber}40`, borderRadius: 10, padding: "1px 8px", fontSize: 11, fontWeight: 600 }}>{g.rdgmRef}</span>}
                                  {g.source === "auto" && <span style={{ background: "#f0f4ff", color: "#4b5563", border: "1px solid #d1d5db", borderRadius: 10, padding: "1px 8px", fontSize: 10 }}>auto-suggested</span>}
                                </div>
                                <div style={{ fontSize: 12, color: C.text, lineHeight: 1.5 }}>{g.item}</div>
                              </div>
                              <div style={{ display: "flex", flexDirection: "column", gap: 5, flexShrink: 0, alignItems: "flex-end" }}>
                                <div style={{ display: "flex", gap: 4 }}>
                                  {(["Under Review","Confirmed Missing","Addressed"] as GapItem["status"][]).map(s => (
                                    <button key={s} onClick={() => setGapItems(gs => gs.map(x => x.id === g.id ? { ...x, status: s } : x))} style={{ padding: "2px 8px", borderRadius: 8, fontSize: 10, fontWeight: g.status === s ? 700 : 400, border: `1px solid ${g.status === s ? statusStyle.color : C.border}`, background: g.status === s ? statusStyle.bg : C.white, color: g.status === s ? statusStyle.color : C.soft, cursor: "pointer" }}>{s === "Confirmed Missing" ? "Missing" : s === "Under Review" ? "Review" : "Done"}</button>
                                  ))}
                                </div>
                                <div style={{ display: "flex", gap: 5 }}>
                                  <GhostBtn onClick={() => { setEditingGap({ ...g }); setShowGapForm(true); }}>Edit</GhostBtn>
                                  <GhostBtn onClick={() => setGapItems(gs => gs.filter(x => x.id !== g.id))} danger>×</GhostBtn>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <PrimaryBtn onClick={() => setTab("report")}>View Report →</PrimaryBtn>
            </div>
          </div>
        )}

        {/* ══ Tab 5: Report ══ */}
        {tab === "report" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ background: `linear-gradient(135deg,${C.navy},${C.navyLight})`, borderRadius: 14, padding: "28px 32px", color: C.white, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 11, color: C.goldLight, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>DBP Act Compliance Audit Report</div>
                <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "Montserrat, sans-serif", marginBottom: 4 }}>{overview.projectName || "Unnamed Project"}</div>
                <div style={{ fontSize: 13, color: C.goldLight }}>{overview.projectAddress || "Address not set"} · {overview.auditDate}</div>
                {overview.nccVersion && <div style={{ fontSize: 12, color: C.gold, marginTop: 4 }}>Assessed under: {overview.nccVersion}</div>}
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: C.goldLight, marginBottom: 6 }}>Audit Type</div>
                <div style={{ background: `linear-gradient(135deg,${C.amberDark},${C.amber})`, borderRadius: 8, padding: "4px 14px", fontSize: 13, fontWeight: 700 }}>{overview.auditType || "—"}</div>
                <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap", justifyContent: "flex-end" }}>
                  <button onClick={downloadAsWord} style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)", color: C.white, borderRadius: 6, padding: "6px 14px", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>⬇ Export .doc</button>
                  <button onClick={() => window.print()} style={{ background: `linear-gradient(135deg,${C.amberDark},${C.amber})`, border: "none", color: C.white, borderRadius: 6, padding: "6px 14px", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>🖨 Print / PDF</button>
                </div>
              </div>
            </div>

            {/* Building classes summary */}
            {buildingClasses.length > 0 && (
              <Card>
                <SectionTitle>Building Classes</SectionTitle>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {buildingClasses.map(cls => (
                    <div key={cls.id} style={{ background: `${C.amber}10`, border: `1px solid ${C.amber}40`, borderRadius: 8, padding: "8px 16px" }}>
                      <div style={{ fontWeight: 700, color: C.amberDark, fontSize: 14 }}>Class {cls.classCode}</div>
                      <div style={{ fontSize: 12, color: C.muted }}>{cls.description} · {cls.levelCount} level{cls.levelCount !== 1 ? "s" : ""}</div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
              {[{ label: "Findings", value: findings.length, color: C.amber }, { label: "Open Actions", value: actions.filter(a => a.status === "Open").length, color: C.red }, { label: "Closed Actions", value: actions.filter(a => a.status === "Closed").length, color: C.green }].map(s => (
                <Card key={s.label} style={{ textAlign: "center", padding: "20px" }}>
                  <div style={{ fontSize: 36, fontWeight: 800, color: s.color, fontFamily: "Montserrat, sans-serif" }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 4 }}>{s.label}</div>
                </Card>
              ))}
            </div>

            <Card>
              <SectionTitle>Audit Information</SectionTitle>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 32px" }}>
                {[["Auditor", overview.auditorName], ["Role", overview.auditorRole], ["NCC Version", overview.nccVersion], ["Stage", overview.stage], ["Lot / DA", overview.lotNumber], ["Practitioner Class", overview.practitionerClass], ["Practitioner", overview.practitionerName], ["Licence", overview.practitionerLicence]].map(([k, v]) => v ? (
                  <div key={k} style={{ display: "flex", gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: C.muted, minWidth: 130 }}>{k}</span>
                    <span style={{ fontSize: 13, color: C.text }}>{v}</span>
                  </div>
                ) : null)}
              </div>
            </Card>

            {findings.length > 0 && (
              <Card>
                <SectionTitle>Findings ({findings.length})</SectionTitle>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {findings.map((f, i) => (
                    <div key={f.id} style={{ borderLeft: `3px solid ${C.amber}`, paddingLeft: 14 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, marginBottom: 4 }}>
                        {i + 1}. <span style={{ color: C.amber }}>{f.rdgm.split(":")[0]}:</span>{f.rdgm.includes(":") ? f.rdgm.substring(f.rdgm.indexOf(":") + 1) : f.rdgm}
                      </div>
                      {f.nccClause && <div style={{ fontSize: 11, color: C.blue, marginBottom: 4 }}>📋 {f.nccClause}</div>}
                      {f.levelRef && <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>📍 {f.levelRef}</div>}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: f.notes ? 5 : 0 }}>
                        {[f.scope, f.location, f.buildingElement].filter(Boolean).map(t => <span key={t} style={{ background: `${C.amber}18`, color: C.amberDark, borderRadius: 10, padding: "1px 8px", fontSize: 11 }}>{t}</span>)}
                        {f.bpBreaches.map(b => <span key={b} style={{ background: C.redBg, color: C.red, borderRadius: 10, padding: "1px 8px", fontSize: 11 }}>{b}</span>)}
                      </div>
                      {f.notes && <p style={{ margin: 0, fontSize: 12, color: C.muted, lineHeight: 1.6 }}>{f.notes}</p>}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {actions.length > 0 && (
              <Card>
                <SectionTitle>Recommended Actions ({actions.length})</SectionTitle>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {actions.map((a, i) => (
                    <div key={a.id} style={{ display: "flex", gap: 14, alignItems: "flex-start", borderLeft: `3px solid ${a.status === "Closed" ? C.green : a.status === "In Progress" ? "#d97706" : C.red}`, paddingLeft: 14 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 2 }}>{i + 1}. {a.action}</div>
                        <div style={{ fontSize: 12, color: C.muted }}>{a.responsible && `👤 ${a.responsible}`}{a.responsible && a.dueDate && " · "}{a.dueDate && `📅 ${a.dueDate}`}</div>
                      </div>
                      <span style={{ background: a.status === "Closed" ? C.greenBg : a.status === "In Progress" ? "#fffbeb" : C.redBg, color: a.status === "Closed" ? C.green : a.status === "In Progress" ? "#d97706" : C.red, borderRadius: 10, padding: "2px 10px", fontSize: 11, fontWeight: 600, flexShrink: 0 }}>{a.status}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Gap Analysis in Report */}
            {gapItems.length > 0 && (() => {
              const confirmed = gapItems.filter(g => g.status === "Confirmed Missing");
              const review = gapItems.filter(g => g.status === "Under Review");
              return (
                <Card style={{ border: `1.5px solid ${C.red}40` }}>
                  <SectionTitle>Drawing Gap Analysis ({gapItems.length} items)</SectionTitle>
                  {confirmed.length > 0 && (
                    <>
                      <div style={{ fontSize: 12, fontWeight: 700, color: C.red, marginBottom: 8 }}>Confirmed Missing ({confirmed.length})</div>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginBottom: 16 }}>
                        <thead><tr style={{ background: C.navy }}>{["#","Missing Item","Level","Regime","RDGM"].map(h => <th key={h} style={{ padding: "6px 10px", textAlign: "left", color: C.white, fontWeight: 700, fontSize: 11 }}>{h}</th>)}</tr></thead>
                        <tbody>{confirmed.map((m, i) => <tr key={m.id} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? C.white : C.bg }}><td style={{ padding: "6px 10px", color: C.muted, width: 28 }}>{i + 1}</td><td style={{ padding: "6px 10px", fontWeight: 600, color: C.red }}>{m.item}</td><td style={{ padding: "6px 10px", color: C.text }}>{m.level}</td><td style={{ padding: "6px 10px", color: C.text }}>{m.regime}</td><td style={{ padding: "6px 10px", color: C.muted }}>{m.rdgmRef}</td></tr>)}</tbody>
                      </table>
                    </>
                  )}
                  {review.length > 0 && (
                    <>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#d97706", marginBottom: 8 }}>Under Review ({review.length})</div>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                        <thead><tr style={{ background: C.navy }}>{["#","Item","Level","Regime"].map(h => <th key={h} style={{ padding: "6px 10px", textAlign: "left", color: C.white, fontWeight: 700, fontSize: 11 }}>{h}</th>)}</tr></thead>
                        <tbody>{review.map((m, i) => <tr key={m.id} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? C.white : C.bg }}><td style={{ padding: "6px 10px", color: C.muted, width: 28 }}>{i + 1}</td><td style={{ padding: "6px 10px", color: C.text }}>{m.item}</td><td style={{ padding: "6px 10px", color: C.text }}>{m.level}</td><td style={{ padding: "6px 10px", color: C.text }}>{m.regime}</td></tr>)}</tbody>
                      </table>
                    </>
                  )}
                </Card>
              );
            })()}

            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <button onClick={downloadAsWord} style={{ background: `linear-gradient(135deg,${C.amberDark},${C.amber})`, border: "none", color: C.white, borderRadius: 8, padding: "9px 22px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>⬇ Download Word (.doc)</button>
              <button onClick={() => window.print()} style={{ background: C.navy, border: `1.5px solid ${C.gold}`, color: C.goldLight, borderRadius: 8, padding: "9px 22px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>🖨 Print / Save as PDF</button>
            </div>
            <div style={{ textAlign: "center", fontSize: 11, color: C.soft, marginTop: -8 }}>Ctrl/Cmd + P to print · Use "Save as PDF" in the print dialog for PDF export</div>
          </div>
        )}
      </main>
    </>
  );
}

// ─── Print styles ──────────────────────────────────────────────────────────────
const PRINT_CSS = `
@media print {
  header, footer, button, [role="region"] { display: none !important; }
  body, html { background: white !important; }
  main { padding: 0 !important; max-width: 100% !important; }
}
`;

// ─── Root ──────────────────────────────────────────────────────────────────────
export default function DbpAuditor() {
  const [, navigate] = useLocation();
  const [currentAuditId, setCurrentAuditId] = useState<string | null>(() => {
    // Auto-open if only one audit exists
    const ids = loadIndex();
    return ids.length === 1 ? ids[0] : null;
  });
  const startNew = () => setCurrentAuditId(uid());
  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", fontFamily: "IBM Plex Sans, sans-serif" }}>
      <style>{PRINT_CSS}</style>
      <header style={{ background: C.navy, height: 64, display: "flex", alignItems: "center", padding: "0 32px", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, background: "linear-gradient(135deg,#7A4A2E,#C07040)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 16, color: C.white }}>369</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: C.white }}>369 Alliance</div>
            <div style={{ fontSize: 11, color: C.gold, letterSpacing: "0.06em", textTransform: "uppercase" }}>DBP Act Compliance Auditor</div>
          </div>
        </div>
        <button onClick={() => navigate("/adm")} style={{ background: "transparent", color: C.gold, border: `1px solid ${C.gold}`, borderRadius: 6, padding: "7px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>← ADM</button>
      </header>
      {currentAuditId
        ? <AuditEditor auditId={currentAuditId} onBack={() => setCurrentAuditId(null)} />
        : <main style={{ flex: 1, padding: "32px 32px 60px", maxWidth: 900, width: "100%", margin: "0 auto", boxSizing: "border-box" }}><AuditList onNew={startNew} onOpen={id => setCurrentAuditId(id)} /></main>
      }
      <footer style={{ background: C.navy, color: "#6b7280", padding: "16px 24px", textAlign: "center", fontSize: 12 }}>
        <span style={{ color: C.gold, fontWeight: 600 }}>369 Alliance</span> · DBP Act Compliance Auditor · © {new Date().getFullYear()}
      </footer>
    </div>
  );
}
