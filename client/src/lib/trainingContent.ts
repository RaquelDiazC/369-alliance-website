/**
 * Authored interactive training modules for the 369 Alliance NCC Training
 * Platform. Each module overlays clickable element hotspots on the clause's
 * plain 3D image (served by /api/brain/plainboard/:code) and adds the
 * procedure / checklist / risk / quiz layers.
 *
 * Anchors are percentages of the plain image (x → right, y → down), placed on
 * the actual element in the render — S1C1 anchors were set against
 * "S1C1 Scope - plain 3D image.png" (glazed tower = external wall, centre
 * column line, right-hand stair core, centre service riser, etc.).
 */

export interface TrainingElement {
  id: string;
  label: string;
  frl: string;
  x: number; // % of image width
  y: number; // % of image height
  bullets: string[];
  ncc: string;
  as: string;
}

export interface QuizQuestion {
  q: string;
  options: string[];
  correct: number; // index into options
  why: string;
}

export interface TrainingModule {
  code: string;
  classes: string[]; // applicable building classes
  elements: TrainingElement[];
  steps: { title: string; text: string }[];
  checklist: string[];
  risks: { title: string; text: string }[];
  docChain: { title: string; text: string }[];
  quiz: QuizQuestion[];
}

const S1C1: TrainingModule = {
  code: "S1C1",
  classes: ["2", "3", "4", "5", "6", "7a", "7b", "8", "9a", "9b", "9c"],
  elements: [
    {
      id: "floor-slab",
      label: "Floor Slab",
      frl: "120/120/120",
      x: 50,
      y: 20,
      bullets: [
        "Concrete floor slabs separate storeys and must carry load during fire",
        "Structural adequacy: 120 min — slab must not collapse",
        "Integrity: 120 min — no cracks that let flame or hot gas through",
        "Insulation: 120 min — top surface must stay cool enough not to ignite materials above",
        "Slab thickness and bottom cover to reinforcement per S1C2 tables achieve the rating",
      ],
      ncc: "Spec 1, S1C2 Table (slabs)",
      as: "AS 3600:2018 Section 5",
    },
    {
      id: "concrete-column",
      label: "Concrete Column",
      frl: "120/120/120",
      x: 45.5,
      y: 40,
      bullets: [
        "Exposed concrete columns visible at each floor level of the building",
        "Structural adequacy: 120 min — column must remain load-bearing in fire",
        "Integrity: 120 min — no through-cracks in the concrete section",
        "Insulation: 120 min — cover to reinforcement limits steel temperature rise",
        "Column size ≥ 300 mm × 300 mm with 40 mm cover achieves FRL 120 per AS 3600",
      ],
      ncc: "Spec 1, S1C2 Table 2",
      as: "AS 3600:2018 cl 5.7",
    },
    {
      id: "external-wall",
      label: "External Wall",
      frl: "-/190/120",
      x: 27,
      y: 34,
      bullets: [
        "Outer facade skin — the glazed curtain-wall tower on the left/front face",
        "Non-load-bearing — no structural adequacy criterion applies (the dash)",
        "Integrity: 190 min — highest integrity requirement, prevents external fire spread",
        "Insulation: 120 min — limits radiant heat to adjacent buildings",
        "Evidence: S1C2 Table 3 masonry/concrete, or a tested curtain-wall system",
      ],
      ncc: "Spec 1, S1C2 Table 3",
      as: "AS 1530.4 — Fire Tests",
    },
    {
      id: "spandrel-panel",
      label: "Spandrel Panel",
      frl: "60/60/60",
      x: 27.5,
      y: 60,
      bullets: [
        "Solid band between window openings on the facade (vertical fire spread barrier)",
        "Required where C2D10/C4D5 spandrel provisions apply between storeys",
        "60/60/60 — modest rating, but geometry (≥ 900 mm height) is as critical as the FRL",
        "Must be continuous past the slab edge junction and sealed to the slab",
        "Tested system or concrete/masonry per S1C2 tables",
      ],
      ncc: "Spec 1 + C4D5 (spandrels)",
      as: "AS 1530.4",
    },
    {
      id: "shaft-wall",
      label: "Shaft Wall",
      frl: "-/120/120",
      x: 62,
      y: 12,
      bullets: [
        "Lift, duct and service shafts penetrate every storey — a chimney in fire",
        "Non-load-bearing shaft walls: integrity and insulation 120 min each",
        "The dash: the shaft wall is not part of the load path",
        "Shaft construction per C2D13/C3D13 with Spec 1 evidence",
        "Every opening into the shaft needs a rated door, hatch or damper",
      ],
      ncc: "Spec 1 + C3D13",
      as: "AS 1530.4",
    },
    {
      id: "internal-wall",
      label: "Internal Wall (Fire Wall)",
      frl: "-/120/120",
      x: 57,
      y: 62,
      bullets: [
        "Fire walls subdivide the storey into fire compartments",
        "Integrity + insulation 120 min stop horizontal fire spread",
        "Must extend slab-to-slab (or to a rated ceiling system) — no gaps above ceilings",
        "Junctions, control joints and penetrations must carry the same rating",
        "Lightweight systems must match a tested configuration exactly (linings, studs, fixings)",
      ],
      ncc: "Spec 1 + C2D5 (fire walls)",
      as: "AS 1530.4",
    },
    {
      id: "fire-door",
      label: "Fire Door",
      frl: "-/120/30",
      x: 42.5,
      y: 88,
      bullets: [
        "Doorways through fire walls and into exits need rated doorsets",
        "Integrity 120 min; insulation only 30 min — occupants can move away from a hot door face",
        "Must self-close and latch — a wedged-open fire door is a classic serious defect",
        "The whole DOORSET is rated: leaf + frame + hardware as tested together",
        "Tagged per AS 1905.1 with a compliance tag on the hinge edge",
      ],
      ncc: "Spec 1 + C3D14",
      as: "AS 1905.1",
    },
    {
      id: "service-riser",
      label: "Service Riser",
      frl: "-/120/120",
      x: 56.5,
      y: 70,
      bullets: [
        "Vertical pipes and conduits (the red/steel risers in the centre bay) run through every slab",
        "Riser shaft enclosure carries -/120/120 where required",
        "Access panels into the riser must be rated to match the shaft wall",
        "Combustible pipe risers need fire collars or wraps at each slab",
        "Coordination: hydraulic/electrical drawings must match the fire compartmentation drawings",
      ],
      ncc: "Spec 1 + C3D13 / C4D15",
      as: "AS 4072.1",
    },
    {
      id: "service-penetration",
      label: "Service Penetration",
      frl: "-/120/120",
      x: 56.5,
      y: 46,
      bullets: [
        "Every point where a pipe, cable tray or duct crosses a rated slab or wall",
        "The penetration seal must restore the element's integrity and insulation (here -/120/120)",
        "Collars, wraps, dampers or sealant systems must match a TESTED configuration",
        "Test certificate must cover the exact pipe material, diameter, substrate and annular space",
        "Untested 'generous sealant' penetrations are among the most common serious defects found in OC audits",
      ],
      ncc: "Spec 1 + C4D15",
      as: "AS 4072.1 / AS 1530.4",
    },
    {
      id: "stair-core",
      label: "Stair Core Wall",
      frl: "-/120/120",
      x: 76,
      y: 42,
      bullets: [
        "The fire-isolated stair (right-hand core) is the protected escape route",
        "Core walls: integrity + insulation 120 min keep the stair tenable during evacuation",
        "Openings into the core are strictly limited — rated doorsets only",
        "No services may run through the stair shaft unless they serve it",
        "Pressurisation or open-access balconies per E2 may also apply",
      ],
      ncc: "Spec 1 + D2D4 / C2D11",
      as: "AS 1530.4",
    },
  ],
  steps: [
    { title: "Identify Building Element", text: "Identify every building element on the drawings — slabs, walls, columns, shafts, openings, penetrations, facade elements, fire doors and service risers. Each element must appear in the FRL schedule." },
    { title: "Determine Required FRL", text: "Determine the required FRL from the DtS provisions (Section C), a performance solution, or the S1C2 tables. The FRL is Structural Adequacy / Integrity / Insulation in minutes; a dash means the criterion does not apply." },
    { title: "Apply Specification 1 Procedure", text: "Decide how the FRL is achieved: S1C2 tables (most common), standard fire test to AS 1530.4, calculation to AS 3600 / AS 4100, or a manufacturer's tested system." },
    { title: "S1C2 Tables Where Applicable", text: "S1C2 tables give directly applicable solutions for common concrete elements. If the element matches the table parameters (cover, thickness, dimensions), no further testing is required." },
    { title: "Test / Calculation / System Evidence", text: "Otherwise obtain evidence: a NATA-accredited AS 1530.4 test report, a structural fire-engineering calculation, or the manufacturer's tested system data." },
    { title: "FRL Recorded on Drawings", text: "Record the FRL and its evidence basis on the architectural and structural drawings. Every element carries an FRL tag referencing the schedule (table number, test report or calculation)." },
    { title: "Installed System Verified", text: "During construction verify the installed system matches the evidence — same product, configuration and substrate. Hold-point inspections before fire-rated systems are concealed." },
    { title: "As-Built Sign-Off", text: "At handover the registered practitioner signs off that the FRL outcome is verified, inspected and documented, and as-built drawings reflect any changes." },
  ],
  checklist: [
    "Element identified on drawings with FRL tag",
    "Required FRL pathway selected (DtS / Performance / S1C2)",
    "Specification 1 procedure applied and documented",
    "Table / calculation / test basis recorded on drawings",
    "Drawings and specifications updated with FRL schedule",
    "Installation matches evidence (cover, dimensions, system configuration)",
    "Inspections recorded at hold points",
    "Final sign-off completed by registered practitioner",
  ],
  risks: [
    { title: "Missing FRL Tag (No Evidence)", text: "A building element shown on the drawings without an FRL tag or schedule reference. Critical non-compliance — must be rectified before the Construction Certificate is issued." },
    { title: "Substituted System Not Verified", text: "A different plasterboard brand or thickness substituted on site without checking the new system achieves the required FRL in the same tested configuration." },
    { title: "No Test / Calculation Basis", text: "An FRL recorded on the drawings without its evidence basis (no S1C2 table number, test report or calculation reference). It cannot be verified at inspection." },
    { title: "Inspection Record Absent", text: "Fire-rated systems concealed behind linings without a hold-point inspection record — compliance can no longer be verified." },
  ],
  docChain: [
    { title: "Fire-Resistance Drawings", text: "Architectural and structural drawings showing the FRL for every element with schedule references." },
    { title: "FRL Schedule", text: "Tabulated schedule listing each element, required FRL and evidence basis." },
    { title: "Tested System Report", text: "AS 1530.4 test report from a NATA-accredited laboratory or manufacturer system data." },
    { title: "Calculation Record", text: "Structural fire-engineering calculation per AS 3600, AS 4100 or AS 4600." },
    { title: "Product / System Certificate", text: "Manufacturer's certificate confirming the installed product matches the tested configuration." },
    { title: "Inspection Hold Point", text: "Documented inspection before fire-rated systems are concealed." },
    { title: "As-Built Sign-Off", text: "Registered practitioner sign-off that the FRL outcome is verified, inspected and documented." },
  ],
  quiz: [
    {
      q: "A concrete column has FRL 120/120/120. What does the second number represent?",
      options: ["Structural adequacy — 120 min", "Integrity — 120 min", "Insulation — 120 min", "Fire test duration — 120 min"],
      correct: 1,
      why: "The FRL triplet is Structural Adequacy / Integrity / Insulation — the middle number is integrity: no flame or hot-gas passage for 120 minutes.",
    },
    {
      q: "An external wall has FRL -/190/120. What does the dash (–) mean?",
      options: ["The wall has zero fire resistance", "The structural adequacy criterion does not apply (non-load-bearing)", "The wall is exempt from Specification 1", "The FRL has not yet been determined"],
      correct: 1,
      why: "A dash means that criterion does not apply — here the wall is non-load-bearing, so structural adequacy is not required.",
    },
    {
      q: "Which Australian Standard governs fire testing of building elements to determine an FRL by test?",
      options: ["AS 3600 — Concrete Structures", "AS 1530.4 — Fire Tests on Building Materials, Components and Structures", "AS 4072.1 — Protection of Openings", "AS 1905.1 — Fire-Resistant Doorsets"],
      correct: 1,
      why: "AS 1530.4 is the standard fire-resistance test; AS 3600/AS 4100 support the calculation route, AS 1905.1 covers doorsets specifically.",
    },
    {
      q: "A fire door has FRL -/120/30. Why is the insulation rating lower than the integrity rating?",
      options: ["Fire doors are exempt from insulation requirements", "Doors are permitted reduced insulation because occupants can move away from the door surface", "The door is in a low-risk location", "The 30 min insulation is a minimum — the actual door may exceed this"],
      correct: 1,
      why: "The code accepts a lower insulation rating for doorsets because a hot door face is a transient, avoidable exposure — integrity must still hold 120 minutes.",
    },
    {
      q: "The specified fire collar brand is unavailable and another brand is substituted on site. What must be verified?",
      options: ["The new collar is painted with fire-retardant paint", "The new collar's test certificate covers the exact pipe type, diameter, substrate and annular space of the installation", "The new collar is installed at least 500 mm from any structural element", "The pipe is made of non-combustible material"],
      correct: 1,
      why: "Penetration seals only achieve their FRL in the tested configuration — the substitute must be tested for exactly this installation.",
    },
  ],
};

export const TRAINING_MODULES: Record<string, TrainingModule> = { S1C1 };
