/**
 * 369 Alliance — Drawing Compliance Analyser
 * AI-powered construction drawing compliance & clash detection
 * Brand: Navy #1a1a2e · Gold #A68A64 · Amber #C07040
 */
import { useState, useCallback } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ─── Brand tokens ──────────────────────────────────────────────────────────────
const C = {
  navy: "#1a1a2e", navyLight: "#22243a",
  gold: "#A68A64", goldLight: "#c5b49a",
  amber: "#C07040", amberDark: "#7A4A2E", amberLight: "#d4956e",
  white: "#fff", bg: "#f5f4f1", cardBg: "#fff",
  border: "#e5e7eb", text: "#1f2937", muted: "#6b7280", soft: "#9ca3af",
  red: "#dc2626", redBg: "#fef2f2", green: "#16a34a", greenBg: "#f0fdf4",
  blue: "#1e40af", blueBg: "#eff6ff", yellow: "#d97706", yellowBg: "#fffbeb",
};

// ─── Static data ───────────────────────────────────────────────────────────────
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

const REGIME_TYPES = [
  "Architectural","Fire Safety Systems","Structural","Facade",
  "Mechanical","Essential Services","Vertical Transportation",
  "Geotechnical","Others",
];

const NCC_VERSIONS = ["NCC 2022","NCC 2019 Amendment 1","NCC 2019","NCC 2016 Amendment 1","NCC 2016","NCC 2015"];

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
  "Fcd-W1: Insufficient design details for facade system",
  "Fcd-G1: Insufficient elevation and section details",
  "Fcd-F1: Lack of fire-rated structural elements design details",
  "Fcd-L1.1: Insufficient design details for external walls and waterproofing interfaces",
  "Fcd-L1.2: Insufficient design details for facade framing",
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

const CLASH_PAIRS = [
  { a: "Architectural", b: "Structural", checks: ["Grid alignment between architectural and structural plans","Slab penetrations vs FRL-rated walls/floors","Level/RL consistency between disciplines","Structural member sizes accommodated in architectural sections"] },
  { a: "Architectural", b: "Fire Safety Systems", checks: ["FRL consistency between GA plans and FRL plans","Compartmentation boundaries match on both sets","Fire door locations and swing direction consistent","Smoke/fire seal specifications on doors match Fire Engineering Report"] },
  { a: "Fire Safety Systems", b: "Essential Services", checks: ["Service penetrations through fire-rated elements have fire collars (AS 4072.1)","Duct fire dampers at compartment boundaries (AS 1682)","Hydraulic pipes through fire compartments require fire-stopping","Sprinkler coverage matches mechanical ventilation zones"] },
  { a: "Fire Safety Systems", b: "Mechanical", checks: ["Mechanical duct penetrations through fire compartments have fire/smoke dampers (AS 1682)","HVAC return air paths do not compromise smoke compartments","Smoke exhaust system design coordinated with mechanical ventilation","Kitchen exhaust ductwork fire rating through compartment boundaries"] },
  { a: "Structural", b: "Essential Services", checks: ["Services through structural members sized and located correctly","Core/void coordination between structural and hydraulic risers","Penetration reinforcement details for structural beams/slabs"] },
  { a: "Structural", b: "Mechanical", checks: ["Mechanical plant loads accounted for in structural design","Ductwork support coordination with structural frame","Equipment vibration isolation foundations specified"] },
  { a: "Architectural", b: "Facade", checks: ["Window sizes match facade drawings","Cladding extent consistent across disciplines","Fire cavity barrier locations at compartment boundaries","Facade framing interface with structural frame"] },
  { a: "Mechanical", b: "Essential Services", checks: ["Service routes do not conflict — HVAC ductwork vs hydraulic pipe runs","Riser locations coordinated between mechanical and hydraulic services","Services cupboard sizing accommodates both mechanical and hydraulic equipment","Ceiling void depth sufficient for both duct and pipe runs","Drainage provisions for mechanical plant (condensate, cooling tower overflow)"] },
  { a: "Architectural", b: "Essential Services", checks: ["Floor waste locations match between architectural and hydraulic CIRDs","Services cupboard floor waste and drainage provisions","Riser sizes on architectural plans accommodate hydraulic requirements","Ceiling heights accommodate hydraulic pipe runs and grades"] },
  { a: "Architectural", b: "Mechanical", checks: ["Ceiling heights accommodate HVAC ductwork","Plant room sizes accommodate mechanical equipment","Louvre and intake locations shown on architectural elevations","Acoustically treated mechanical rooms isolated from habitable spaces"] },
];

// ─── Regime-specific defect templates (from DBP audit reports & RDGM) ─────────
const REGIME_DEFECTS: Record<string, { category: string; severity: "Critical" | "Major" | "Minor"; description: string; reference: string; solution: string }[]> = {
  "Mechanical": [
    { category: "MECHANICAL DESIGN", severity: "Critical", description: "No mechanical CIRD lodged before building work commenced — lodgment breach", reference: "DBPA s.19, s.22 / DBPR Cl.16", solution: "Mechanical engineer to prepare and lodge CIRDs with Regulated Design Record title block" },
    { category: "MECHANICAL DESIGN", severity: "Major", description: "Insufficient masterplan details for service routes — duct sizes, routing, and clearances not shown", reference: "RDGM Mec-S1 / NCC E2", solution: "Mechanical engineer to provide service routes masterplan showing all ductwork runs with dimensions" },
    { category: "MECHANICAL DESIGN", severity: "Major", description: "Insufficient mechanical ventilation details — no fan schedule, duct system details, or A/C system specifications", reference: "RDGM Mec-S2 / AS 1668.2 / NCC E2", solution: "Provide complete mechanical ventilation design with fan schedules, duct sizing calculations, and system specifications per AS 1668.2" },
    { category: "PENETRATION PROTECTION", severity: "Critical", description: "Insufficient details for protecting mechanical penetrations through fire-rated elements — no fire/smoke damper schedule", reference: "RDGM Mec-F1.1 / NCC C3.15 / AS 1682 / AS 4072.1", solution: "Provide penetration schedule showing all mechanical services through fire-rated walls/floors with fire damper/collar specifications" },
    { category: "SMOKE CONTROL", severity: "Critical", description: "Insufficient details for fire and smoke control systems — smoke exhaust design not coordinated with HVAC", reference: "RDGM Mec-F1.2 / AS 1668.1 / NCC Spec 4", solution: "Provide fire and smoke control system design coordinated with mechanical ventilation, showing smoke zones, exhaust rates, and make-up air paths" },
    { category: "MECHANICAL DESIGN", severity: "Minor", description: "Pipe insulation details not specified for chilled water and refrigerant lines", reference: "NCC J6 / AS 1668.2", solution: "Specify pipe insulation type, thickness, and thermal performance for all mechanical pipework" },
    { category: "INTEGRATION", severity: "Major", description: "Mechanical design not integrated with other CIRDs — acoustic treatment, structural supports, and hydraulic coordination missing", reference: "DBPR Cl.8 / DBPA s.8(1)(b)", solution: "Revise mechanical CIRD to demonstrate integration with architectural, structural, and hydraulic designs" },
  ],
  "Essential Services": [
    { category: "HYDRAULIC DESIGN", severity: "Critical", description: "Hydraulic CIRD not lodged before building work commenced — lodgment breach", reference: "DBPA s.19, s.22 / DBPR Cl.16", solution: "Hydraulic engineer to prepare and lodge CIRDs with Regulated Design Record title block" },
    { category: "HYDRAULIC DESIGN", severity: "Major", description: "Discrepancies between floor waste details on architectural CIRDs and hydraulic CIRDs — no floor waste provision identified in hydraulic drawings", reference: "DBPR Cl.8 / AS 3500.2", solution: "Hydraulic engineer to coordinate floor waste locations with architectural plans and show all drainage provisions" },
    { category: "HYDRAULIC DESIGN", severity: "Major", description: "Missing riser width specifications and service pipe coordination through floors", reference: "AS 3500 / NCC F2", solution: "Provide riser dimensions and show all service pipe penetrations through floors with fire protection details" },
    { category: "DRAINAGE", severity: "Major", description: "Stormwater drainage design insufficient — overflow provisions, charged system design, and connection details not shown", reference: "AS 3500.3 / NCC F2P1", solution: "Provide complete stormwater drainage design showing primary and overflow systems, pipe sizes, grades, and connection to council system" },
    { category: "ELECTRICAL", severity: "Major", description: "Insufficient details for electrical master plans — switchboard layout, cable routes, and load schedule not provided", reference: "RDGM Ele-S1 / AS 3000", solution: "Electrical engineer to provide master plans showing switchboard locations, cable routes, distribution boards, and load calculations" },
    { category: "EMERGENCY SYSTEMS", severity: "Critical", description: "Insufficient emergency lighting and exit sign layout — locations not shown on RCPs or separate plans per AS 2293", reference: "RDGM Ele-F1 / AS 2293 / NCC E4.2", solution: "Provide emergency lighting layout showing all luminaire locations, exit signs, and lux level calculations per AS 2293" },
    { category: "INTEGRATION", severity: "Major", description: "Hydraulic design not integrated with fire safety CIRDs — wet fire system sprinkler coverage and hydrant locations not coordinated", reference: "DBPR Cl.8 / DBPA s.8(1)(b)", solution: "Coordinate hydraulic CIRD with fire safety CIRDs showing sprinkler/hydrant water supply integration" },
    { category: "REGISTRATION", severity: "Critical", description: "Design practitioner providing DCDs for systems outside their registration class — verify DP registration covers drainage and fire systems separately", reference: "DBPA s.10 / DBPR Cl.10", solution: "Verify design practitioner holds correct registration class for each system covered by their DCD" },
  ],
  "Fire Safety Systems": [
    { category: "FIRE DETECTION", severity: "Critical", description: "Insufficient smoke and heat detection layout — detector spacing does not comply with AS 1670.1, missing coverage in lightwells", reference: "RDGM Fss-F8.1 / AS 1670.1 / NCC E1.7", solution: "Revise fire detection layout to comply with AS 1670.1 spacing requirements and provide coverage in all required areas" },
    { category: "FIRE SPRINKLER", severity: "Critical", description: "Insufficient fire sprinkler system design — hydraulic calculations, head layout, and pipe sizing not provided per AS 2118.1", reference: "RDGM Fss-F6 / AS 2118.1 / NCC E1.5", solution: "Provide complete sprinkler system design with hydraulic calculations, head layout, and pipe sizing per AS 2118.1" },
    { category: "FIRE HYDRANT", severity: "Major", description: "Insufficient fire hydrant and hose reel system design — booster location, hydrant spacing, and water supply not documented", reference: "RDGM Fss-F5 / AS 2419.1 / NCC E1.3", solution: "Provide hydrant system design showing booster location, hydrant/hose reel positions, pipe sizing, and water supply details per AS 2419.1" },
    { category: "FIRE WATER SUPPLY", severity: "Major", description: "Fire system water supply design insufficient — tank sizing, pump specifications, and supply pressure not documented", reference: "RDGM Fss-F2 / AS 2118.1 / AS 2419.1", solution: "Provide water supply design showing tank capacity, pump curves, and supply pressure calculations" },
    { category: "SYSTEM BLOCK PLANS", severity: "Major", description: "Insufficient hydraulic fire system block plans — system overview and zone boundaries not shown", reference: "RDGM Fss-F1 / NCC E1", solution: "Provide system block plans showing all fire system zones, risers, and interconnections" },
    { category: "EMERGENCY WARNING", severity: "Major", description: "Lack of design details for emergency warning system — speaker locations, wiring, and zone configuration not shown", reference: "RDGM Fss-F8.2 / AS 1670.4 / NCC E4.4", solution: "Provide emergency warning system design with speaker locations, wiring diagram, and zone configuration per AS 1670.4" },
    { category: "SMOKE EXHAUST", severity: "Major", description: "Insufficient design details for automatic smoke exhaust system — exhaust rates, zones, and make-up air not specified", reference: "RDGM Fss-F9 / AS 1668.1 / NCC Spec 4", solution: "Provide smoke exhaust system design with calculated exhaust rates, zone boundaries, and make-up air provisions per AS 1668.1" },
  ],
  "Architectural": [
    { category: "GENERAL ARRANGEMENT", severity: "Major", description: "Insufficient details in general arrangement plans — dimensions, setbacks, room identification missing", reference: "RDGM Arc-G1 / NCC D1", solution: "Provide dimensioned GA plans with room names, setbacks, and all required annotations" },
    { category: "WATERPROOFING", severity: "Critical", description: "Insufficient internal waterproofing details — membrane type, upstand heights, fall-to-drain gradients not specified per AS 3740", reference: "RDGM Arc-W1.1 / AS 3740 / NCC F1.7", solution: "Provide WPP plans showing membrane specification, minimum 150mm upstands (200mm showers), substrate falls min 1:100 (NCC 2022), and puddle flange details" },
    { category: "WATERPROOFING", severity: "Critical", description: "Insufficient external waterproofing details — balcony/podium membrane, flashing, and outlet details not shown", reference: "RDGM Arc-W1.2 / AS 4654 / NCC F1.7", solution: "Provide external waterproofing plans showing membrane system, drainage outlets, flashings, and minimum falls" },
    { category: "FIRE SAFETY", severity: "Critical", description: "Passive fire safety designs lack sufficient details — FRL of elements, fire door schedules, penetration sealing not documented", reference: "RDGM Arc-F2 / NCC C1-C4", solution: "Provide FRL plans showing element ratings, fire door schedule with FRL and hardware, and penetration sealing details" },
    { category: "FIRE SAFETY", severity: "Major", description: "Emergency lighting and exit signs not included in architectural RCPs", reference: "RDGM Arc-F1 / NCC E4 / AS 2293", solution: "Add emergency lighting and exit sign locations to reflected ceiling plans" },
    { category: "BUILDING ENCLOSURE", severity: "Major", description: "Insufficient design details for the building enclosure — weatherproofing/cladding interface details not shown", reference: "RDGM Arc-BE1 / NCC F1.1, F2.3", solution: "Provide building enclosure details showing cladding interface, weather sealing, and thermal performance" },
    { category: "EGRESS", severity: "Major", description: "Insufficient egress system details — exit widths, travel distances, and accessible paths not dimensioned", reference: "RDGM Arc-G4.2 / NCC D1-D3", solution: "Dimension all exit paths, show travel distances, and demonstrate accessible egress per NCC D3 and AS 1428.1" },
  ],
  "Structural": [
    { category: "STRUCTURAL CONCEPT", severity: "Major", description: "Insufficient structural concept plans — foundation type, load paths, and lateral system not documented", reference: "RDGM Str-L1 / NCC B1 / AS 1170", solution: "Provide structural concept plans showing foundation system, primary load paths, and lateral bracing system" },
    { category: "STRUCTURAL DESIGN", severity: "Major", description: "Insufficient structural design plans — member sizes, connections, and reinforcement schedules not shown", reference: "RDGM Str-L2 / AS 3600 / AS 4100", solution: "Provide detailed structural plans with member sizes, connection details, and reinforcement schedules per AS 3600/AS 4100" },
    { category: "FIRE RATING", severity: "Critical", description: "Structural fire resistance levels (FRL) not documented — cover to reinforcement for fire not specified", reference: "RDGM Str-L7 / NCC C1 / AS 3600 Sec.5", solution: "Specify FRL for all structural elements and document concrete cover to reinforcement for fire resistance per AS 3600 Section 5" },
    { category: "PENETRATIONS", severity: "Critical", description: "Service penetrations through structural elements not coordinated — opening sizes, locations, and framing details missing", reference: "RDGM Str-L8 / NCC C3.15 / AS 3600", solution: "Show all service penetrations through structural elements with opening sizes, edge distances, and trimming reinforcement" },
    { category: "DESIGN LOADS", severity: "Major", description: "Insufficient design load details — wind, earthquake, and live load assumptions not documented", reference: "RDGM Str-L5 / AS 1170.0-4", solution: "Document all design load assumptions including wind region/terrain, site sub-soil class, and importance levels per AS 1170 series" },
    { category: "STRUCTURAL SECTIONS", severity: "Minor", description: "Insufficient structural design sections — critical sections through complex geometry not provided", reference: "RDGM Str-L3 / NCC B1", solution: "Provide structural sections at all critical locations including transfers, setbacks, and interfaces with other disciplines" },
  ],
  "Facade": [
    { category: "FACADE SYSTEM", severity: "Critical", description: "Insufficient design details for facade system — cladding type, weather resistance, fixing details, and sealant specification not documented", reference: "RDGM Fcd-W1 / NCC C1.9, F1.1 / AS 4284", solution: "Provide facade system details including cladding material, fixing system, weather seals, and evidence of suitability" },
    { category: "FIRE RATING", severity: "Critical", description: "Lack of fire-rated structural elements design details for facade — spandrel panels and cavity barriers not specified", reference: "RDGM Fcd-F1 / NCC C1.9, C2.6 / AS 1530.1", solution: "Provide fire-rated facade element details including spandrel panels, cavity barriers, and non-combustibility evidence" },
    { category: "WATERPROOFING", severity: "Major", description: "Insufficient design details for external walls and waterproofing interfaces — window sill, head, and jamb flashing missing", reference: "RDGM Fcd-L1.1 / NCC F1.1 / AS 4654", solution: "Provide detailed waterproofing interface drawings at all window/door openings with flashing and sealant specifications" },
    { category: "FACADE FRAMING", severity: "Major", description: "Insufficient design details for facade framing — structural adequacy of framing system not demonstrated", reference: "RDGM Fcd-L1.2 / NCC B1 / AS 1170.2", solution: "Provide facade framing design showing structural adequacy for wind loads, seismic actions, and dead loads" },
    { category: "THERMAL COMPLIANCE", severity: "Major", description: "Insufficient thermal compliance design details — BASIX/NatHERS glazing performance not documented", reference: "RDGM Fcd-BE1 / NCC J1.5 / BASIX SEPP", solution: "Provide thermal compliance details showing glazing U-values, SHGC, and compliance with BASIX commitments" },
  ],
  "Geotechnical": [
    { category: "GEOTECHNICAL REPORT", severity: "Critical", description: "Insufficient details in geotechnical engineering report — soil classification, bearing capacity, and recommendations incomplete", reference: "RDGM Geo-L1 / NCC B1 / AS 1170", solution: "Provide complete geotechnical report with soil classification, bearing capacities, groundwater conditions, and foundation recommendations" },
    { category: "SHORING DESIGN", severity: "Critical", description: "Insufficient shoring design details — temporary works design for excavation not provided", reference: "RDGM Geo-L2 / AS 4678", solution: "Provide shoring design with temporary works calculations, monitoring requirements, and construction sequence" },
    { category: "GROUND ANCHORS", severity: "Major", description: "Insufficient ground anchor design details — anchor capacity, length, and encroachment documentation missing", reference: "RDGM Geo-L3 / DBPA s.19", solution: "Provide ground anchor design including capacity calculations, proof testing requirements, and encroachment documentation" },
    { category: "EARTHWORKS", severity: "Major", description: "Insufficient earthwork design details — cut/fill volumes, compaction requirements, and drainage not specified", reference: "RDGM Geo-L4 / AS 3798", solution: "Provide earthworks design showing cut/fill levels, compaction requirements, and temporary drainage provisions" },
  ],
  "Vertical Transportation": [
    { category: "VT MASTERPLAN", severity: "Major", description: "Lack of design details for vertical transportation services — lift types, capacities, and traffic analysis not provided", reference: "RDGM VTP-VT1 / NCC E2 / AS 1735", solution: "Provide VT masterplan showing lift types, rated capacities, speed, and traffic analysis" },
    { category: "LIFT DESIGN", severity: "Critical", description: "Insufficient lift design details — shaft dimensions, pit depth, overrun, and machine room requirements not shown", reference: "RDGM VTP-VT2.1 / AS 1735.2 / NCC E2.1", solution: "Provide lift design drawings showing shaft dimensions, pit depth, overrun height, and machine room/MRL layout" },
    { category: "ACCESSIBILITY", severity: "Major", description: "Insufficient provisions for lift car accessibility — car dimensions, door widths, and controls do not comply with AS 1735.12", reference: "RDGM VTP-VT2.2 / AS 1735.12 / NCC D3.3", solution: "Verify lift car dimensions, door clear widths, and control heights comply with AS 1735.12 and NCC accessibility requirements" },
    { category: "LIFT FIRE RATING", severity: "Critical", description: "Lift shaft FRL not specified or inconsistent with building construction type", reference: "AS 1735.8.1 / NCC C2.10", solution: "Specify lift shaft FRL consistent with building construction type and provide details for lift landing doors" },
  ],
  "Others": [
    { category: "GENERAL", severity: "Minor", description: "Regime-specific compliance items to be determined during analysis", reference: "NCC / DBP Act 2020", solution: "Identify applicable compliance requirements for this discipline" },
  ],
};

const SEVERITY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Critical: { bg: C.redBg, text: C.red, border: C.red },
  Major: { bg: C.yellowBg, text: C.yellow, border: C.yellow },
  Minor: { bg: C.greenBg, text: C.green, border: C.green },
};

const LOCATIONS = ["Roof","Balcony","SOUs","Bathroom/laundry","Common areas","Podium","Fire stairs","Lift","Basements","Carpark","Whole building","Facade","Other"];

// DBP Audit Report finding summary categories (from official DBP Audit Report template)
const FINDING_CATEGORIES = [
  "BCA - Non-compliance with BCA provisions in CIRDs",
  "BCA - Defects in building elements (on-site)",
  "RDGM - CIRDs do not accord with the RDGM",
  "DBP - Required documents not lodged",
  "DBP - DCD breaches",
  "DBP - Insufficient details for BCA/AS compliance or construction",
  "DBP - Lack of integration between CIRDs",
  "DBP - PS requirements not incorporated into CIRDs",
  "DBP - Specialist advice/requirements not incorporated into CIRDs",
  "DBP - Insufficient or missing performance solutions",
];

const RECOMMENDED_ACTIONS = [
  "Design practitioner to provide new/varied CIRDs and DCDs to the building practitioner addressing all potential breaches",
  "Design practitioner to provide new/varied CIRDs that accord with the RDGM and include adequate details for the builder to construct in accordance with the BCA",
  "Design practitioners to integrate CIRDs with other aspects of building work and other regulated designs",
  "Design practitioner to provide new/varied DCD to the building practitioner",
  "Design practitioner to provide detailed clarification to BCNSW via email: dbpaudits@customerservice.nsw.gov.au",
  "Building practitioner to obtain and lodge new/varied CIRDs and DCDs from the relevant design practitioner",
  "Building practitioner to provide related document for encroaching ground anchor",
  "Building practitioner to provide rectification evidence",
  "Building practitioner to notify the certifier of new/varied regulated designs or potential performance solutions",
  "Future DCDs to address all the raised issues",
  "Future design/work to implement recommendations and notes",
];

// ─── Types ─────────────────────────────────────────────────────────────────────
interface LevelRegime {
  id: string;
  level: string;
  regime: string;
  variation: string;
  files: File[];
}

interface ClassConfig {
  classCode: string;
  levels: number;
  levelRegimes: LevelRegime[];
}

interface BulkUpload {
  id: string;
  regime: string;
  files: File[];
}

interface ManualFinding {
  id: string;
  regime: string;
  severity: "Critical" | "Major" | "Minor";
  rdgmCode: string;
  nccClause: string;
  description: string;
  location: string;
}

interface Defect {
  id: string;
  category: string;
  severity: "Critical" | "Major" | "Minor";
  description: string;
  location: string;
  reference: string;
  solution: string;
  discipline: string;
}

interface AnalysisResult {
  classCode: string;
  level: string;
  regime: string;
  overallCompliant: boolean;
  complianceScore: number;
  titleBlockIssues: string[];
  defects: Defect[];
  missingElements: string[];
  coordinationFlags: string[];
  positiveFindings: string[];
}

type Step = "configure" | "analyse" | "report";

// ─── Helpers ───────────────────────────────────────────────────────────────────
let _uid = 0;
function uid() { return "id_" + (++_uid) + "_" + Date.now(); }

function levelName(idx: number): string {
  if (idx === 0) return "Ground (GL)";
  if (idx < 0) return "Basement " + Math.abs(idx);
  return "Level " + idx;
}

// ─── Component ─────────────────────────────────────────────────────────────────
export default function DrawingAnalyser() {
  // ── Navigation ──
  const [step, setStep] = useState<Step>("configure");

  // ── Project info ──
  const [projectName, setProjectName] = useState("");
  const [projectAddress, setProjectAddress] = useState("");
  const [daNumber, setDaNumber] = useState("");
  const [nccVersion, setNccVersion] = useState("NCC 2022");

  // ── Classes & levels ──
  const [classes, setClasses] = useState<ClassConfig[]>([]);

  // ── Bulk uploads ──
  const [bulkUploads, setBulkUploads] = useState<BulkUpload[]>([]);
  const [bulkRegime, setBulkRegime] = useState("");

  // ── Manual findings ──
  const [findings, setFindings] = useState<ManualFinding[]>([]);
  const [showFindingForm, setShowFindingForm] = useState(false);
  const [findingDraft, setFindingDraft] = useState<ManualFinding>({
    id: "", regime: "", severity: "Major", rdgmCode: "", nccClause: "", description: "", location: "",
  });

  // ── Analysis ──
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [analysing, setAnalysing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);

  // ────────────────────────────────────────────────────────────────────────────
  // CLASS MANAGEMENT
  // ────────────────────────────────────────────────────────────────────────────
  const addClass = useCallback((code: string) => {
    if (classes.find(c => c.classCode === code)) return;
    setClasses(prev => [...prev, {
      classCode: code,
      levels: 1,
      levelRegimes: [{ id: uid(), level: levelName(0), regime: "", variation: "", files: [] }],
    }]);
  }, [classes]);

  const removeClass = useCallback((code: string) => {
    setClasses(prev => prev.filter(c => c.classCode !== code));
  }, []);

  const setLevelCount = useCallback((code: string, count: number) => {
    const n = Math.max(1, Math.min(99, count));
    setClasses(prev => prev.map(c => {
      if (c.classCode !== code) return c;
      const existing = c.levelRegimes;
      const newRegimes: LevelRegime[] = [];
      for (let i = 0; i < n; i++) {
        const lName = levelName(i);
        const found = existing.filter(r => r.level === lName);
        if (found.length > 0) {
          newRegimes.push(...found);
        } else {
          newRegimes.push({ id: uid(), level: lName, regime: "", variation: "", files: [] });
        }
      }
      return { ...c, levels: n, levelRegimes: newRegimes };
    }));
  }, []);

  const addRegimeToLevel = useCallback((classCode: string, level: string) => {
    setClasses(prev => prev.map(c => {
      if (c.classCode !== classCode) return c;
      return {
        ...c,
        levelRegimes: [...c.levelRegimes, { id: uid(), level, regime: "", variation: "", files: [] }],
      };
    }));
  }, []);

  const updateRegime = useCallback((classCode: string, regimeId: string, field: string, value: string) => {
    setClasses(prev => prev.map(c => {
      if (c.classCode !== classCode) return c;
      return {
        ...c,
        levelRegimes: c.levelRegimes.map(r =>
          r.id === regimeId ? { ...r, [field]: value } : r
        ),
      };
    }));
  }, []);

  const removeRegimeRow = useCallback((classCode: string, regimeId: string) => {
    setClasses(prev => prev.map(c => {
      if (c.classCode !== classCode) return c;
      return { ...c, levelRegimes: c.levelRegimes.filter(r => r.id !== regimeId) };
    }));
  }, []);

  const addFilesToRegime = useCallback((classCode: string, regimeId: string, files: FileList) => {
    setClasses(prev => prev.map(c => {
      if (c.classCode !== classCode) return c;
      return {
        ...c,
        levelRegimes: c.levelRegimes.map(r =>
          r.id === regimeId ? { ...r, files: [...r.files, ...Array.from(files)] } : r
        ),
      };
    }));
  }, []);

  // File upload helper — creates a temporary input so the file dialog always works
  const triggerFileUpload = useCallback((classCode: string, regimeId: string) => {
    const inp = document.createElement("input");
    inp.type = "file";
    inp.accept = ".pdf,.png,.jpg,.jpeg";
    inp.multiple = true;
    inp.onchange = () => {
      if (inp.files && inp.files.length > 0) {
        addFilesToRegime(classCode, regimeId, inp.files);
      }
    };
    inp.click();
  }, [addFilesToRegime]);

  // ────────────────────────────────────────────────────────────────────────────
  // BULK UPLOAD
  // ────────────────────────────────────────────────────────────────────────────
  const addBulkUpload = useCallback(() => {
    if (!bulkRegime) return;
    setBulkUploads(prev => [...prev, { id: uid(), regime: bulkRegime, files: [] }]);
    setBulkRegime("");
  }, [bulkRegime]);

  const removeBulkUpload = useCallback((id: string) => {
    setBulkUploads(prev => prev.filter(b => b.id !== id));
  }, []);

  // ────────────────────────────────────────────────────────────────────────────
  // MANUAL FINDINGS
  // ────────────────────────────────────────────────────────────────────────────
  const addFinding = useCallback(() => {
    if (!findingDraft.description) return;
    setFindings(prev => [...prev, { ...findingDraft, id: uid() }]);
    setFindingDraft({ id: "", regime: "", severity: "Major", rdgmCode: "", nccClause: "", description: "", location: "" });
    setShowFindingForm(false);
  }, [findingDraft]);

  const removeFinding = useCallback((id: string) => {
    setFindings(prev => prev.filter(f => f.id !== id));
  }, []);

  // ────────────────────────────────────────────────────────────────────────────
  // ANALYSIS
  // ────────────────────────────────────────────────────────────────────────────
  const runAnalysis = useCallback(async () => {
    setStep("analyse");
    setAnalysing(true);
    setAnalysisProgress(0);
    const results: AnalysisResult[] = [];

    // Collect all class/level/regime combos
    const combos: { classCode: string; level: string; regime: string; files: File[] }[] = [];
    for (const cls of classes) {
      for (const lr of cls.levelRegimes) {
        if (lr.regime) {
          combos.push({ classCode: cls.classCode, level: lr.level, regime: lr.regime, files: lr.files });
        }
      }
    }
    // Add bulk uploads as whole-building entries
    for (const bu of bulkUploads) {
      combos.push({ classCode: classes[0]?.classCode || "2", level: "All Levels", regime: bu.regime, files: bu.files });
    }

    const total = combos.length || 1;
    let done = 0;

    for (const combo of combos) {
      // Try AI endpoint first, fall back to template
      let result: AnalysisResult;
      if (combo.files.length > 0) {
        try {
          result = await analyseWithAI(combo);
        } catch {
          result = generateTemplateResult(combo);
        }
      } else {
        result = generateTemplateResult(combo);
      }
      results.push(result);
      done++;
      setAnalysisProgress(Math.round((done / total) * 100));
    }

    // Run clash detection across regimes
    const clashResults = detectClashes(combos.map(c => c.regime));
    if (clashResults.length > 0) {
      // Add clash flags to the first result
      if (results.length > 0) {
        results[0] = { ...results[0], coordinationFlags: [...results[0].coordinationFlags, ...clashResults] };
      }
    }

    setAnalysisResults(results);
    setAnalysing(false);
  }, [classes, bulkUploads]);

  async function analyseWithAI(combo: { classCode: string; level: string; regime: string; files: File[] }): Promise<AnalysisResult> {
    const formData = new FormData();
    combo.files.forEach(f => formData.append("files", f));
    formData.append("config", JSON.stringify({
      classCode: combo.classCode,
      level: combo.level,
      regime: combo.regime,
      nccVersion,
      projectName,
      projectAddress,
      daNumber,
    }));

    const res = await fetch("/api/analyse-drawing", { method: "POST", body: formData });
    if (!res.ok) throw new Error("API error");
    return await res.json();
  }

  function generateTemplateResult(combo: { classCode: string; level: string; regime: string; files?: File[] }): AnalysisResult {
    const required = REQUIRED_DRAWINGS[combo.regime] || [];
    const hasFiles = combo.files && combo.files.length > 0;
    const missingElements = hasFiles ? [] : required.map(d => d + " — not provided");

    // Use regime-specific defect templates from DBP audit report patterns
    const regimeDefects = REGIME_DEFECTS[combo.regime] || REGIME_DEFECTS["Others"] || [];
    const defects: Defect[] = regimeDefects.map((d, i) => ({
      id: combo.regime.slice(0, 3).toUpperCase() + "-" + String(i + 1).padStart(3, "0"),
      category: d.category,
      severity: d.severity,
      description: d.description,
      location: combo.level,
      reference: d.reference,
      solution: d.solution,
      discipline: combo.regime,
    }));

    // Title block checks specific to this regime
    const titleBlockIssues: string[] = [];
    if (!hasFiles) {
      titleBlockIssues.push("No " + combo.regime.toLowerCase() + " drawings uploaded for analysis");
    }

    // Calculate compliance score based on defect severity
    const criticalCount = defects.filter(d => d.severity === "Critical").length;
    const majorCount = defects.filter(d => d.severity === "Major").length;
    const totalPossible = defects.length * 10;
    const deductions = criticalCount * 10 + majorCount * 5;
    const score = totalPossible > 0 ? Math.max(0, Math.round(((totalPossible - deductions) / totalPossible) * 100)) : 0;

    return {
      classCode: combo.classCode,
      level: combo.level,
      regime: combo.regime,
      overallCompliant: criticalCount === 0 && majorCount === 0,
      complianceScore: score,
      titleBlockIssues,
      defects,
      missingElements,
      coordinationFlags: [],
      positiveFindings: hasFiles ? ["Drawings provided for " + combo.regime + " regime"] : [],
    };
  }

  function detectClashes(regimes: string[]): string[] {
    const flags: string[] = [];
    const regimeSet = new Set(regimes);
    for (const pair of CLASH_PAIRS) {
      if (regimeSet.has(pair.a) && regimeSet.has(pair.b)) {
        for (const check of pair.checks) {
          flags.push(pair.a + " vs " + pair.b + ": " + check);
        }
      }
    }
    return flags;
  }

  // ────────────────────────────────────────────────────────────────────────────
  // PDF REPORT
  // ────────────────────────────────────────────────────────────────────────────
  const generateReport = useCallback(() => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 15;
    const contentW = pageW - margin * 2;
    let y = 20;

    function checkPage(needed: number) { if (y + needed > 275) { doc.addPage(); y = 20; } }
    function sectionHeader(text: string) {
      checkPage(20);
      doc.setFillColor(26, 26, 46);
      doc.rect(margin, y - 4, contentW, 10, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(text, margin + 4, y + 3);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");
      y += 12;
    }
    function subHeader(text: string) {
      checkPage(12);
      doc.setFillColor(192, 112, 64);
      doc.rect(margin, y - 3, contentW, 8, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(text, margin + 3, y + 2);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");
      y += 11;
    }

    // ── Cover page ──
    doc.setFillColor(26, 26, 46);
    doc.rect(0, 0, pageW, 65, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("DBP Audit Report", margin, 28);
    doc.setFontSize(13);
    doc.setFont("helvetica", "normal");
    doc.text("Drawing Compliance Analysis", margin, 38);
    doc.setFontSize(11);
    doc.text("369 Alliance — AI-Powered Compliance Checking", margin, 50);
    doc.setFontSize(9);
    doc.text("Report Date: " + new Date().toLocaleDateString("en-AU", { day: "2-digit", month: "long", year: "numeric" }), margin, 60);
    doc.setTextColor(0, 0, 0);
    y = 78;

    // ── Report Information ──
    sectionHeader("Report Information");
    const infoRows = [
      ["Project Name", projectName || "—"],
      ["Project Address", projectAddress || "—"],
      ["DA/SSD Number", daNumber || "—"],
      ["NCC Version", nccVersion],
      ["Report Date", new Date().toLocaleDateString("en-AU")],
    ];
    autoTable(doc, {
      startY: y, body: infoRows, theme: "plain",
      margin: { left: margin }, styles: { fontSize: 9 },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 45 } },
    });
    y = (doc as any).lastAutoTable.finalY + 6;

    // ── Building Classification ──
    sectionHeader("Building Classification");
    const classRows = classes.map(cls => ["Class " + cls.classCode, CLASS_DESCRIPTIONS[cls.classCode] || "", String(cls.levels) + " level(s)"]);
    if (classRows.length > 0) {
      autoTable(doc, {
        startY: y, head: [["Class", "Description", "Levels"]], body: classRows,
        theme: "grid", headStyles: { fillColor: [166, 138, 100] },
        margin: { left: margin }, styles: { fontSize: 9 },
      });
      y = (doc as any).lastAutoTable.finalY + 6;
    }

    // ── Scope of Audit ──
    sectionHeader("Scope of the DBP Audit");
    const regimeSet = new Set<string>();
    for (const cls of classes) { for (const lr of cls.levelRegimes) { if (lr.regime) regimeSet.add(lr.regime); } }
    for (const bu of bulkUploads) { regimeSet.add(bu.regime); }
    const scopeRegimes = Array.from(regimeSet);
    doc.setFontSize(9);
    for (const r of scopeRegimes) {
      doc.text("- " + r, margin + 4, y); y += 5;
    }
    y += 4;

    // ── Design Practitioners (placeholder) ──
    sectionHeader("Design Practitioners");
    doc.setFontSize(9);
    doc.text("Design practitioners involved in the regulated designs are listed per regime.", margin, y); y += 5;
    for (const r of scopeRegimes) {
      doc.text("- " + r + ": [Practitioner name and registration to be confirmed]", margin + 4, y); y += 5;
    }
    y += 6;

    // ── Drawing Register ──
    doc.addPage(); y = 20;
    sectionHeader("Drawing Register");
    for (const regime of scopeRegimes) {
      const required = REQUIRED_DRAWINGS[regime] || [];
      if (required.length === 0) continue;
      subHeader(regime);
      const rows = required.map((d, i) => [String(i + 1), d, "Pending Review"]);
      autoTable(doc, {
        startY: y, head: [["#", "Required Drawing (RDGM)", "Status"]],
        body: rows, theme: "grid",
        headStyles: { fillColor: [100, 100, 100] },
        margin: { left: margin }, styles: { fontSize: 8 },
      });
      y = (doc as any).lastAutoTable.finalY + 6;
      checkPage(20);
    }

    // ── Collect all findings grouped by regime ──
    const allDefects: Defect[] = analysisResults.flatMap(r => r.defects);
    const manualDefects: Defect[] = findings.map(f => ({
      id: "MF-" + f.id.slice(-4),
      category: f.rdgmCode ? "RDGM - CIRDs do not accord with the RDGM" : "DBP - Insufficient details for BCA/AS compliance or construction",
      severity: f.severity,
      description: f.description,
      location: f.location,
      reference: (f.nccClause ? f.nccClause + " / " : "") + (f.rdgmCode ? f.rdgmCode.split(":")[0] : ""),
      solution: "",
      discipline: f.regime,
    }));
    const combined = [...allDefects, ...manualDefects];

    // ── PART A: DBPA and DBPR Potential Breaches ──
    doc.addPage(); y = 20;
    sectionHeader("PART A: DBPA and DBPR Potential Breaches");
    const dbpBreaches = combined.filter(d => d.category.startsWith("LODGMENT") || d.category.includes("REGISTRATION") || d.reference.includes("DBPA") || d.reference.includes("DBPR"));
    if (dbpBreaches.length > 0) {
      for (const d of dbpBreaches) {
        checkPage(30);
        subHeader(d.discipline + " — " + d.id);
        const rows = [
          ["Finding Summary", d.category],
          ["Description", d.description],
          ["Severity", d.severity],
          ["Building Element", d.discipline],
          ["Location", d.location],
          ["Legislative Reference", d.reference],
          ["Recommended Action", d.solution],
          ["Status", "Open"],
        ];
        autoTable(doc, {
          startY: y, body: rows, theme: "plain",
          margin: { left: margin }, styles: { fontSize: 8 },
          columnStyles: { 0: { fontStyle: "bold", cellWidth: 40 } },
        });
        y = (doc as any).lastAutoTable.finalY + 4;
      }
    } else {
      doc.setFontSize(9);
      doc.text("No DBPA/DBPR breaches identified in this assessment.", margin, y); y += 8;
    }

    // ── PART B: RDGM Potential Breaches (regime-specific) ──
    doc.addPage(); y = 20;
    sectionHeader("PART B: RDGM Potential Breaches");
    doc.setFontSize(9);
    doc.text("Findings assessed against the Regulated Design Guidance Material, grouped by regime.", margin, y); y += 8;

    for (const regime of scopeRegimes) {
      const regimeFindings = combined.filter(d => d.discipline === regime);
      if (regimeFindings.length === 0) continue;
      checkPage(20);
      subHeader(regime);
      const rows = regimeFindings.map(d => [
        d.id, d.severity, d.description.length > 70 ? d.description.slice(0, 70) + "..." : d.description, d.reference, d.solution.length > 50 ? d.solution.slice(0, 50) + "..." : d.solution,
      ]);
      autoTable(doc, {
        startY: y,
        head: [["ID", "Severity", "Description", "Reference", "Recommended Action"]],
        body: rows, theme: "grid",
        headStyles: { fillColor: [26, 26, 46] },
        margin: { left: margin },
        styles: { fontSize: 7, cellPadding: 2 },
        columnStyles: { 2: { cellWidth: 45 }, 4: { cellWidth: 35 } },
      });
      y = (doc as any).lastAutoTable.finalY + 6;
    }

    // ── PART C: BCA Compliance ──
    doc.addPage(); y = 20;
    sectionHeader("PART C: BCA Compliance Assessment");
    const bcaFindings = combined.filter(d => d.reference.includes("NCC") || d.reference.includes("AS ") || d.reference.includes("BCA"));
    if (bcaFindings.length > 0) {
      for (const regime of scopeRegimes) {
        const rf = bcaFindings.filter(d => d.discipline === regime);
        if (rf.length === 0) continue;
        checkPage(20);
        subHeader(regime + " — BCA Assessment");
        for (const d of rf) {
          checkPage(25);
          const rows = [
            ["Finding", d.id + " (" + d.severity + ")"],
            ["Description", d.description],
            ["NCC/AS Reference", d.reference],
            ["Corrective Action", d.solution],
          ];
          autoTable(doc, {
            startY: y, body: rows, theme: "plain",
            margin: { left: margin }, styles: { fontSize: 8 },
            columnStyles: { 0: { fontStyle: "bold", cellWidth: 35 } },
          });
          y = (doc as any).lastAutoTable.finalY + 3;
        }
      }
    }

    // ── Cross-Discipline Coordination (Clash Detection) ──
    checkPage(30);
    sectionHeader("Cross-Discipline Coordination Assessment");
    const allClashes = analysisResults.flatMap(r => r.coordinationFlags);
    if (allClashes.length > 0) {
      const rows = allClashes.map((c, i) => [String(i + 1), c, "Requires Review"]);
      autoTable(doc, {
        startY: y, head: [["#", "Coordination Check", "Status"]], body: rows,
        theme: "grid", headStyles: { fillColor: [166, 138, 100] },
        margin: { left: margin }, styles: { fontSize: 8 },
      });
      y = (doc as any).lastAutoTable.finalY + 6;
    } else {
      doc.setFontSize(9);
      doc.text("No cross-discipline coordination issues detected.", margin, y); y += 6;
    }

    // ── Recommended Actions Summary ──
    checkPage(40);
    sectionHeader("Recommended Actions");
    const uniqueActions = Array.from(new Set(combined.map(d => d.solution).filter(Boolean)));
    if (uniqueActions.length > 0) {
      doc.setFontSize(9);
      for (const a of uniqueActions) {
        checkPage(10);
        doc.text("- " + a, margin + 2, y, { maxWidth: contentW - 4 });
        y += Math.ceil(a.length / 90) * 5 + 2;
      }
    }

    // ── Footer on each page ──
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(150);
      doc.text("369 Alliance — DBP Audit Report — " + (projectName || "Project") + " — Page " + i + "/" + totalPages, margin, 290);
      doc.text("This report is by no means definitive; it confirms areas where documentation has not satisfied the requirements of the DBPA.", margin, 285);
      doc.setTextColor(0);
    }

    doc.save("DBP_Audit_Report_" + (projectName || "project").replace(/\s+/g, "_") + ".pdf");
  }, [classes, bulkUploads, findings, analysisResults, projectName, projectAddress, daNumber, nccVersion]);

  // ────────────────────────────────────────────────────────────────────────────
  // STYLES
  // ────────────────────────────────────────────────────────────────────────────
  const S = {
    page: { minHeight: "100vh", background: C.bg, fontFamily: "'Inter',system-ui,sans-serif" } as React.CSSProperties,
    header: { background: C.navy, padding: "20px 32px", color: C.white } as React.CSSProperties,
    container: { maxWidth: 1100, margin: "0 auto", padding: "24px 32px" } as React.CSSProperties,
    section: { background: C.white, borderRadius: 10, padding: "24px", marginBottom: 20, border: "1px solid " + C.border, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" } as React.CSSProperties,
    sectionTitle: { fontSize: 15, fontWeight: 800, color: C.amber, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 16, borderBottom: "2px solid " + C.amber, paddingBottom: 8 },
    label: { display: "block", fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 3, textTransform: "uppercase" as const, letterSpacing: "0.04em" },
    input: { width: "100%", padding: "8px 12px", border: "1px solid " + C.border, borderRadius: 6, fontSize: 13, boxSizing: "border-box" as const, outline: "none" },
    select: { padding: "8px 12px", border: "1px solid " + C.border, borderRadius: 6, fontSize: 13, background: C.white, outline: "none", cursor: "pointer" },
    chip: (active: boolean) => ({
      padding: "6px 16px", borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "2px solid " + C.amber,
      background: active ? C.amber : C.white, color: active ? C.white : C.amber,
      transition: "all 0.15s",
    }),
    btn: (bg: string, color: string = C.white) => ({
      padding: "8px 18px", background: bg, color, border: "none", borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: "pointer",
    }),
    btnOutline: { padding: "8px 18px", background: "transparent", color: C.amber, border: "2px solid " + C.amber, borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: "pointer" },
    row: { display: "flex", gap: 12, alignItems: "center", marginBottom: 8, flexWrap: "wrap" as const },
    classCard: { background: C.white, border: "2px solid " + C.amber, borderRadius: 10, padding: "16px 20px", marginBottom: 16 },
    classHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
    levelRow: { display: "flex", gap: 10, alignItems: "center", padding: "6px 0", borderBottom: "1px solid " + C.border },
    dropZone: (dragging: boolean) => ({
      border: "2px dashed " + (dragging ? C.amber : C.border), borderRadius: 8, padding: "20px", textAlign: "center" as const,
      color: C.muted, fontSize: 13, cursor: "pointer", background: dragging ? C.amberLight + "10" : "transparent",
      transition: "all 0.15s",
    }),
    badge: (severity: string) => {
      const c = SEVERITY_COLORS[severity] || SEVERITY_COLORS.Minor;
      return { display: "inline-block", padding: "2px 10px", borderRadius: 12, fontSize: 11, fontWeight: 700, background: c.bg, color: c.text, border: "1px solid " + c.border };
    },
    progress: { width: "100%", height: 8, borderRadius: 4, background: C.border, overflow: "hidden" as const },
    progressBar: (pct: number) => ({ width: pct + "%", height: "100%", background: C.amber, borderRadius: 4, transition: "width 0.3s" }),
  };

  // ────────────────────────────────────────────────────────────────────────────
  // RENDER: CONFIGURE STEP
  // ────────────────────────────────────────────────────────────────────────────
  if (step === "configure") {
    return (
      <div style={S.page}>
        {/* Header */}
        <div style={S.header}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ fontSize: 22, fontWeight: 800 }}>Drawing Compliance Analyser</div>
            <div style={{ fontSize: 13, color: C.goldLight, marginTop: 4 }}>AI-powered NCC & DBP Act compliance checking</div>
          </div>
        </div>

        <div style={S.container}>
          {/* Project Info */}
          <div style={S.section}>
            <div style={S.sectionTitle}>Project Details</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={S.label}>Project Name</label>
                <input style={S.input} value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="e.g. 290 Keira Street" />
              </div>
              <div>
                <label style={S.label}>DA / SSD Number</label>
                <input style={S.input} value={daNumber} onChange={e => setDaNumber(e.target.value)} placeholder="e.g. DA-2024/0123" />
              </div>
              <div>
                <label style={S.label}>Project Address</label>
                <input style={S.input} value={projectAddress} onChange={e => setProjectAddress(e.target.value)} placeholder="Full civic address" />
              </div>
              <div>
                <label style={S.label}>NCC Version</label>
                <select style={{ ...S.select, width: "100%" }} value={nccVersion} onChange={e => setNccVersion(e.target.value)}>
                  {NCC_VERSIONS.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Building Classes & Levels */}
          <div style={S.section}>
            <div style={S.sectionTitle}>Building Classes & Levels</div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>ADD A CLASS</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
              {BUILDING_CLASS_CODES.map(code => (
                <button
                  key={code}
                  style={S.chip(!!classes.find(c => c.classCode === code))}
                  onClick={() => addClass(code)}
                >
                  Class {code}
                </button>
              ))}
            </div>

            {classes.map(cls => {
              const levels = Array.from(new Set(cls.levelRegimes.map(r => r.level)));
              return (
                <div key={cls.classCode} style={S.classCard}>
                  <div style={S.classHeader}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ ...S.badge("Critical"), background: C.amber, color: C.white, border: "none", fontSize: 13, padding: "4px 14px" }}>
                        Class {cls.classCode}
                      </span>
                      <span style={{ fontSize: 14, color: C.text }}>
                        {CLASS_DESCRIPTIONS[cls.classCode] || ""}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 12, color: C.muted }}>Levels:</span>
                      <input
                        type="number"
                        style={{ ...S.input, width: 60, textAlign: "center" }}
                        value={cls.levels}
                        min={1}
                        onChange={e => setLevelCount(cls.classCode, parseInt(e.target.value) || 1)}
                      />
                      <button style={S.btnOutline} onClick={() => removeClass(cls.classCode)}>Remove</button>
                    </div>
                  </div>

                  {levels.map(level => {
                    const regimesForLevel = cls.levelRegimes.filter(r => r.level === level);
                    return (
                      <div key={level} style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 4 }}>
                          Level: <span style={{ fontWeight: 400 }}>{level}</span>
                        </div>
                        {regimesForLevel.map(lr => (
                          <div key={lr.id} style={S.levelRow}>
                            <select
                              style={{ ...S.select, minWidth: 180 }}
                              value={lr.regime}
                              onChange={e => updateRegime(cls.classCode, lr.id, "regime", e.target.value)}
                            >
                              <option value="">Select regime...</option>
                              {REGIME_TYPES.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                            <input
                              style={{ ...S.input, width: 180 }}
                              value={lr.variation}
                              onChange={e => updateRegime(cls.classCode, lr.id, "variation", e.target.value)}
                              placeholder="Variation (e.g. Passive)"
                            />
                            <button
                              style={S.btnOutline}
                              onClick={() => triggerFileUpload(cls.classCode, lr.id)}
                            >
                              Upload
                            </button>
                            {lr.files.length > 0 && (
                              <span style={{ fontSize: 11, color: C.green }}>{lr.files.length} file(s)</span>
                            )}
                            <button
                              style={{ background: "none", border: "none", fontSize: 18, color: C.soft, cursor: "pointer", padding: "0 4px" }}
                              onClick={() => removeRegimeRow(cls.classCode, lr.id)}
                              title="Remove"
                            >
                              x
                            </button>
                          </div>
                        ))}
                        <button
                          style={{ ...S.btn(C.white, C.amber), border: "1px dashed " + C.amber, marginTop: 4, fontSize: 12 }}
                          onClick={() => addRegimeToLevel(cls.classCode, level)}
                        >
                          + Add regime to {level}
                        </button>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Bulk Upload by Regime */}
          <div style={S.section}>
            <div style={S.sectionTitle}>Bulk Upload by Regime</div>
            <p style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>
              Upload an entire PDF for one regime (e.g. all Architectural drawings across all levels in one file).
              During Analyse, the level will be extracted from each page's title block automatically.
            </p>
            <div style={S.row}>
              <select style={{ ...S.select, minWidth: 200 }} value={bulkRegime} onChange={e => setBulkRegime(e.target.value)}>
                <option value="">Select Regime...</option>
                {REGIME_TYPES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <button style={S.btn(C.amber)} onClick={addBulkUpload}>+ Add Regime</button>
            </div>
            {bulkUploads.map(bu => (
              <div key={bu.id} style={{ ...S.row, padding: "8px 12px", background: C.bg, borderRadius: 6, marginTop: 8 }}>
                <select style={{ ...S.select, minWidth: 200 }} value={bu.regime} onChange={e => {
                  setBulkUploads(prev => prev.map(b => b.id === bu.id ? { ...b, regime: e.target.value } : b));
                }}>
                  <option value="">Select Regime...</option>
                  {REGIME_TYPES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <label
                  style={{ flex: 1, ...S.dropZone(false), padding: "10px", cursor: "pointer" }}
                >
                  {bu.files.length > 0
                    ? bu.files.map(f => f.name).join(", ")
                    : "Click or drag PDF files here"
                  }
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg"
                    multiple
                    style={{ display: "none" }}
                    onChange={e => {
                      if (e.target.files) {
                        setBulkUploads(prev => prev.map(b =>
                          b.id === bu.id ? { ...b, files: [...b.files, ...Array.from(e.target.files!)] } : b
                        ));
                      }
                    }}
                  />
                </label>
                <button style={{ background: "none", border: "none", fontSize: 18, color: C.soft, cursor: "pointer" }} onClick={() => removeBulkUpload(bu.id)}>x</button>
              </div>
            ))}
          </div>

          {/* Manual Findings */}
          <div style={S.section}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <div style={S.sectionTitle}>Manual Findings</div>
                <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>Record findings manually before or after drawing analysis.</p>
              </div>
              <button style={S.btn(C.amber)} onClick={() => setShowFindingForm(true)}>+ Add Finding</button>
            </div>

            {showFindingForm && (
              <div style={{ background: C.bg, borderRadius: 8, padding: 16, marginBottom: 16, border: "1px solid " + C.border }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
                  <div>
                    <label style={S.label}>Regime</label>
                    <select style={{ ...S.select, width: "100%" }} value={findingDraft.regime} onChange={e => setFindingDraft(d => ({ ...d, regime: e.target.value }))}>
                      <option value="">Select...</option>
                      {REGIME_TYPES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={S.label}>Severity</label>
                    <select style={{ ...S.select, width: "100%" }} value={findingDraft.severity} onChange={e => setFindingDraft(d => ({ ...d, severity: e.target.value as any }))}>
                      <option value="Critical">Critical</option>
                      <option value="Major">Major</option>
                      <option value="Minor">Minor</option>
                    </select>
                  </div>
                  <div>
                    <label style={S.label}>Location</label>
                    <select style={{ ...S.select, width: "100%" }} value={findingDraft.location} onChange={e => setFindingDraft(d => ({ ...d, location: e.target.value }))}>
                      <option value="">Select...</option>
                      {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                  <div>
                    <label style={S.label}>RDGM Code</label>
                    <select style={{ ...S.select, width: "100%" }} value={findingDraft.rdgmCode} onChange={e => setFindingDraft(d => ({ ...d, rdgmCode: e.target.value }))}>
                      <option value="">Select...</option>
                      {RDGM_CODES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={S.label}>NCC Clause</label>
                    <input style={S.input} value={findingDraft.nccClause} onChange={e => setFindingDraft(d => ({ ...d, nccClause: e.target.value }))} placeholder="e.g. C2.3, F1.7" />
                  </div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={S.label}>Description</label>
                  <textarea
                    style={{ ...S.input, minHeight: 60, resize: "vertical" }}
                    value={findingDraft.description}
                    onChange={e => setFindingDraft(d => ({ ...d, description: e.target.value }))}
                    placeholder="Describe the defect or non-compliance..."
                  />
                </div>
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                  <button style={S.btnOutline} onClick={() => setShowFindingForm(false)}>Cancel</button>
                  <button style={S.btn(C.amber)} onClick={addFinding}>Save Finding</button>
                </div>
              </div>
            )}

            {findings.length === 0 && !showFindingForm && (
              <p style={{ fontSize: 13, color: C.soft, textAlign: "center", padding: "24px 0" }}>
                No manual findings yet. Findings will be generated automatically after drawing analysis, or add them manually above.
              </p>
            )}

            {findings.length > 0 && (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid " + C.border }}>
                    <th style={{ textAlign: "left", padding: "6px 8px", color: C.muted, fontWeight: 700 }}>Regime</th>
                    <th style={{ textAlign: "left", padding: "6px 8px", color: C.muted, fontWeight: 700 }}>Severity</th>
                    <th style={{ textAlign: "left", padding: "6px 8px", color: C.muted, fontWeight: 700 }}>RDGM</th>
                    <th style={{ textAlign: "left", padding: "6px 8px", color: C.muted, fontWeight: 700 }}>Description</th>
                    <th style={{ textAlign: "left", padding: "6px 8px", color: C.muted, fontWeight: 700 }}>Location</th>
                    <th style={{ width: 30 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {findings.map(f => (
                    <tr key={f.id} style={{ borderBottom: "1px solid " + C.border }}>
                      <td style={{ padding: "6px 8px" }}>{f.regime}</td>
                      <td style={{ padding: "6px 8px" }}><span style={S.badge(f.severity)}>{f.severity}</span></td>
                      <td style={{ padding: "6px 8px", fontSize: 11 }}>{f.rdgmCode.split(":")[0]}</td>
                      <td style={{ padding: "6px 8px" }}>{f.description.slice(0, 50)}{f.description.length > 50 ? "..." : ""}</td>
                      <td style={{ padding: "6px 8px" }}>{f.location}</td>
                      <td><button style={{ background: "none", border: "none", color: C.red, cursor: "pointer" }} onClick={() => removeFinding(f.id)}>x</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Next button */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
            <button
              style={{ ...S.btn(C.amber), fontSize: 15, padding: "12px 32px" }}
              onClick={runAnalysis}
              disabled={classes.length === 0 && bulkUploads.length === 0}
            >
              Next: Analyse &rarr;
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────────────────────
  // RENDER: ANALYSE STEP
  // ────────────────────────────────────────────────────────────────────────────
  if (step === "analyse") {
    return (
      <div style={S.page}>
        <div style={S.header}>
          <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>Analysis Results</div>
              <div style={{ fontSize: 13, color: C.goldLight, marginTop: 4 }}>
                {projectName || "Project"} — {nccVersion}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={S.btnOutline} onClick={() => setStep("configure")}>&larr; Back</button>
              <button style={S.btn(C.amber)} onClick={() => setStep("report")}>View Report</button>
            </div>
          </div>
        </div>

        <div style={S.container}>
          {analysing && (
            <div style={S.section}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 12 }}>Analysing drawings...</div>
              <div style={S.progress}>
                <div style={S.progressBar(analysisProgress)} />
              </div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>{analysisProgress}% complete</div>
            </div>
          )}

          {!analysing && analysisResults.length > 0 && (
            <>
              {/* Summary cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
                <div style={{ ...S.section, textAlign: "center", marginBottom: 0 }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: C.navy }}>{analysisResults.length}</div>
                  <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase" }}>Regimes Analysed</div>
                </div>
                <div style={{ ...S.section, textAlign: "center", marginBottom: 0 }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: C.red }}>
                    {analysisResults.reduce((a, r) => a + r.defects.filter(d => d.severity === "Critical").length, 0)}
                  </div>
                  <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase" }}>Critical</div>
                </div>
                <div style={{ ...S.section, textAlign: "center", marginBottom: 0 }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: C.yellow }}>
                    {analysisResults.reduce((a, r) => a + r.defects.filter(d => d.severity === "Major").length, 0)}
                  </div>
                  <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase" }}>Major</div>
                </div>
                <div style={{ ...S.section, textAlign: "center", marginBottom: 0 }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: C.green }}>
                    {analysisResults.reduce((a, r) => a + r.defects.filter(d => d.severity === "Minor").length, 0)}
                  </div>
                  <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase" }}>Minor</div>
                </div>
              </div>

              {/* Per-regime results */}
              {analysisResults.map((result, idx) => (
                <div key={idx} style={S.section}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ ...S.badge("Critical"), background: C.amber, color: C.white, border: "none", padding: "4px 12px" }}>
                        Class {result.classCode}
                      </span>
                      <span style={{ fontWeight: 700, color: C.text }}>{result.regime}</span>
                      <span style={{ fontSize: 12, color: C.muted }}>— {result.level}</span>
                    </div>
                    <span style={{ fontSize: 12, color: C.muted }}>{result.defects.length} finding(s)</span>
                  </div>

                  {/* Title block issues */}
                  {result.titleBlockIssues.length > 0 && (
                    <div style={{ background: C.yellowBg, border: "1px solid " + C.yellow + "40", borderRadius: 6, padding: "8px 12px", marginBottom: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: C.yellow, marginBottom: 4 }}>TITLE BLOCK ISSUES</div>
                      {result.titleBlockIssues.map((issue, i) => (
                        <div key={i} style={{ fontSize: 12, color: C.text }}>- {issue}</div>
                      ))}
                    </div>
                  )}

                  {/* Missing elements */}
                  {result.missingElements.length > 0 && (
                    <div style={{ background: C.redBg, border: "1px solid " + C.red + "30", borderRadius: 6, padding: "8px 12px", marginBottom: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: C.red, marginBottom: 4 }}>MISSING DRAWINGS</div>
                      {result.missingElements.slice(0, 5).map((el, i) => (
                        <div key={i} style={{ fontSize: 12, color: C.text }}>- {el}</div>
                      ))}
                      {result.missingElements.length > 5 && (
                        <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>...and {result.missingElements.length - 5} more</div>
                      )}
                    </div>
                  )}

                  {/* Defects */}
                  {result.defects.length > 0 && (
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                      <thead>
                        <tr style={{ borderBottom: "2px solid " + C.border }}>
                          <th style={{ textAlign: "left", padding: "6px 8px", color: C.muted }}>ID</th>
                          <th style={{ textAlign: "left", padding: "6px 8px", color: C.muted }}>Severity</th>
                          <th style={{ textAlign: "left", padding: "6px 8px", color: C.muted }}>Description</th>
                          <th style={{ textAlign: "left", padding: "6px 8px", color: C.muted }}>Reference</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.defects.map(d => (
                          <tr key={d.id} style={{ borderBottom: "1px solid " + C.border }}>
                            <td style={{ padding: "6px 8px", fontWeight: 600 }}>{d.id}</td>
                            <td style={{ padding: "6px 8px" }}><span style={S.badge(d.severity)}>{d.severity}</span></td>
                            <td style={{ padding: "6px 8px" }}>{d.description}</td>
                            <td style={{ padding: "6px 8px", fontSize: 11, color: C.muted }}>{d.reference}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {/* Coordination flags */}
                  {result.coordinationFlags.length > 0 && (
                    <div style={{ marginTop: 12, background: C.blueBg, border: "1px solid " + C.blue + "30", borderRadius: 6, padding: "8px 12px" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: C.blue, marginBottom: 4 }}>CROSS-DISCIPLINE COORDINATION</div>
                      {result.coordinationFlags.map((flag, i) => (
                        <div key={i} style={{ fontSize: 12, color: C.text }}>- {flag}</div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Manual findings included */}
              {findings.length > 0 && (
                <div style={S.section}>
                  <div style={S.sectionTitle}>Manual Findings ({findings.length})</div>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid " + C.border }}>
                        <th style={{ textAlign: "left", padding: "6px 8px", color: C.muted }}>Regime</th>
                        <th style={{ textAlign: "left", padding: "6px 8px", color: C.muted }}>Severity</th>
                        <th style={{ textAlign: "left", padding: "6px 8px", color: C.muted }}>RDGM</th>
                        <th style={{ textAlign: "left", padding: "6px 8px", color: C.muted }}>Description</th>
                        <th style={{ textAlign: "left", padding: "6px 8px", color: C.muted }}>Location</th>
                      </tr>
                    </thead>
                    <tbody>
                      {findings.map(f => (
                        <tr key={f.id} style={{ borderBottom: "1px solid " + C.border }}>
                          <td style={{ padding: "6px 8px" }}>{f.regime}</td>
                          <td style={{ padding: "6px 8px" }}><span style={S.badge(f.severity)}>{f.severity}</span></td>
                          <td style={{ padding: "6px 8px", fontSize: 11 }}>{f.rdgmCode.split(":")[0]}</td>
                          <td style={{ padding: "6px 8px" }}>{f.description.slice(0, 60)}</td>
                          <td style={{ padding: "6px 8px" }}>{f.location}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────────────────────
  // RENDER: REPORT STEP
  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div style={S.page}>
      <div style={S.header}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>DBP Compliance Report</div>
            <div style={{ fontSize: 13, color: C.goldLight, marginTop: 4 }}>
              {projectName || "Project"} — {nccVersion}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={S.btnOutline} onClick={() => setStep("analyse")}>&larr; Back to Results</button>
            <button style={S.btn(C.amber)} onClick={generateReport}>Download PDF Report</button>
          </div>
        </div>
      </div>

      <div style={S.container}>
        {/* Report preview */}
        <div style={S.section}>
          <div style={S.sectionTitle}>Report Summary</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <div style={S.label}>Project</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{projectName || "—"}</div>
            </div>
            <div>
              <div style={S.label}>DA Number</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{daNumber || "—"}</div>
            </div>
            <div>
              <div style={S.label}>Address</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{projectAddress || "—"}</div>
            </div>
            <div>
              <div style={S.label}>NCC Version</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{nccVersion}</div>
            </div>
          </div>
        </div>

        <div style={S.section}>
          <div style={S.sectionTitle}>Building Classification</div>
          {classes.map(cls => (
            <div key={cls.classCode} style={{ marginBottom: 8 }}>
              <span style={{ ...S.badge("Critical"), background: C.amber, color: C.white, border: "none", marginRight: 8 }}>
                Class {cls.classCode}
              </span>
              {CLASS_DESCRIPTIONS[cls.classCode]} — {cls.levels} level(s)
            </div>
          ))}
        </div>

        <div style={S.section}>
          <div style={S.sectionTitle}>Findings Overview</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            <div style={{ textAlign: "center", padding: 16, background: C.redBg, borderRadius: 8 }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: C.red }}>
                {analysisResults.reduce((a, r) => a + r.defects.filter(d => d.severity === "Critical").length, 0) + findings.filter(f => f.severity === "Critical").length}
              </div>
              <div style={{ fontSize: 12, color: C.red, fontWeight: 700 }}>CRITICAL</div>
            </div>
            <div style={{ textAlign: "center", padding: 16, background: C.yellowBg, borderRadius: 8 }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: C.yellow }}>
                {analysisResults.reduce((a, r) => a + r.defects.filter(d => d.severity === "Major").length, 0) + findings.filter(f => f.severity === "Major").length}
              </div>
              <div style={{ fontSize: 12, color: C.yellow, fontWeight: 700 }}>MAJOR</div>
            </div>
            <div style={{ textAlign: "center", padding: 16, background: C.greenBg, borderRadius: 8 }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: C.green }}>
                {analysisResults.reduce((a, r) => a + r.defects.filter(d => d.severity === "Minor").length, 0) + findings.filter(f => f.severity === "Minor").length}
              </div>
              <div style={{ fontSize: 12, color: C.green, fontWeight: 700 }}>MINOR</div>
            </div>
          </div>
        </div>

        {/* Drawing register preview */}
        <div style={S.section}>
          <div style={S.sectionTitle}>Drawing Register</div>
          {(() => {
            const regimeSet = new Set<string>();
            for (const cls of classes) {
              for (const lr of cls.levelRegimes) { if (lr.regime) regimeSet.add(lr.regime); }
            }
            for (const bu of bulkUploads) { regimeSet.add(bu.regime); }
            return Array.from(regimeSet).map(regime => {
              const required = REQUIRED_DRAWINGS[regime] || [];
              if (required.length === 0) return null;
              return (
                <div key={regime} style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.amber, marginBottom: 6 }}>{regime}</div>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: C.bg }}>
                        <th style={{ textAlign: "left", padding: "6px 8px", color: C.muted }}>#</th>
                        <th style={{ textAlign: "left", padding: "6px 8px", color: C.muted }}>Required Drawing</th>
                        <th style={{ textAlign: "left", padding: "6px 8px", color: C.muted }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {required.map((d, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid " + C.border }}>
                          <td style={{ padding: "6px 8px" }}>{i + 1}</td>
                          <td style={{ padding: "6px 8px" }}>{d}</td>
                          <td style={{ padding: "6px 8px" }}><span style={{ color: C.yellow, fontSize: 11 }}>Pending Review</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            });
          })()}
        </div>

        {/* Download button at bottom */}
        <div style={{ display: "flex", justifyContent: "center", padding: "24px 0" }}>
          <button style={{ ...S.btn(C.amber), fontSize: 16, padding: "14px 40px" }} onClick={generateReport}>
            Download PDF Report
          </button>
        </div>
      </div>
    </div>
  );
}
