/**
 * Map Monitor — Construction Site Intelligence
 * NearMap aerial imagery + 106 Sydney construction sites
 * Design: Dark tactical intelligence theme
 */
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import * as XLSX from "xlsx";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  CONSTRUCTION_SITES, SITE_STATUS_CONFIG,
  type ConstructionSite, type SiteStatus
} from "@/lib/constructionSiteData";

const NEARMAP_API_KEY = "ZTBiY2MzYzYtOTFlMC00ODdiLWI5MWUtZjMxZGRhZWFhYTZm";
const NEARMAP_TILE_URL = `https://api.nearmap.com/tiles/v3/Vert/{z}/{x}/{y}.jpg?apikey=${NEARMAP_API_KEY}`;

// ── NearMap AI Construction Layers (official class IDs from NearMap AI Glossary) ─
const AI_LAYERS = [
  { id: "building_under_construction", classId: 80,  label: "Building Under Construction", description: "Buildings where construction is actively underway (class 80)", color: "#ef4444", strokeColor: "#dc2626" },
  { id: "construction_crane",          classId: 79,  label: "Construction Crane",          description: "Fixed cranes on active construction sites (class 79)",            color: "#f59e0b", strokeColor: "#d97706" },
  { id: "construction_site",           classId: 4,   label: "Construction Site",           description: "Active construction sites at any development phase (class 4)",    color: "#f97316", strokeColor: "#ea580c" },
  { id: "heavy_machinery",             classId: 207, label: "Heavy Machinery",             description: "Excavators, bulldozers and heavy plant on site (class 207)",      color: "#a855f7", strokeColor: "#7c3aed" },
] as const;
type AILayerId = typeof AI_LAYERS[number]["id"];
interface AILayerState { loading: boolean; error: string | null; count: number; }

// ── Marker icon ───────────────────────────────────────────────────────────────
function createMarkerIcon(color: string, isSelected: boolean): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<svg width="${isSelected ? 30 : 24}" height="${isSelected ? 40 : 32}" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 20 12 20s12-11 12-20C24 5.373 18.627 0 12 0z" fill="${color}" stroke="white" stroke-width="${isSelected ? 2.5 : 1.5}"/>
      <circle cx="12" cy="12" r="5" fill="white" opacity="0.9"/>
    </svg>`,
    iconSize: [isSelected ? 30 : 24, isSelected ? 40 : 32],
    iconAnchor: [isSelected ? 15 : 12, isSelected ? 40 : 32],
    popupAnchor: [0, -32],
  });
}

// ── Types ─────────────────────────────────────────────────────────────────────
type MapView = "map" | "list";

interface Filters {
  search: string;
  status: string;
  suburb: string;
  lga: string;
  buildingClass: string;
  source: string;
  isActive: string;
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function MapMonitor() {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<number, L.Marker>>(new Map());
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const aiLayerGroupsRef = useRef<Map<AILayerId, L.LayerGroup>>(new Map());

  const [sites, setSites] = useState<ConstructionSite[]>(CONSTRUCTION_SITES);
  const [selectedSite, setSelectedSite] = useState<ConstructionSite | null>(null);
  const [view, setView] = useState<MapView>("map");
  const [lastSync, setLastSync] = useState("Never");
  const [listPage, setListPage] = useState(1);
  const LIST_PAGE_SIZE = 20;

  const [filters, setFilters] = useState<Filters>({
    search: "", status: "", suburb: "", lga: "", buildingClass: "", source: "", isActive: ""
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [showFindResult, setShowFindResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI Layers
  const [enabledLayers, setEnabledLayers] = useState<Set<AILayerId>>(new Set());
  const [layerStates, setLayerStates] = useState<Record<AILayerId, AILayerState>>(
    Object.fromEntries(AI_LAYERS.map(l => [l.id, { loading: false, error: null, count: 0 }])) as Record<AILayerId, AILayerState>
  );
  const [showLayersPanel, setShowLayersPanel] = useState(false);

  // Add marker dialog
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addForm, setAddForm] = useState({ address: "", status: "construction" as SiteStatus, developer: "", storeys: "" });
  const [addLoading, setAddLoading] = useState(false);

  // ── Derived data ──────────────────────────────────────────────────────────
  const suburbs = useMemo(() => Array.from(new Set(sites.map(s => s.suburb))).sort(), [sites]);
  const lgas = useMemo(() => Array.from(new Set(sites.map(s => s.lga))).sort(), [sites]);

  const filteredSites = useMemo(() => {
    return sites.filter(s => {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (![s.address, s.suburb, s.lga, s.developer, s.builder, ...s.portalIds].some(v => v?.toLowerCase().includes(q))) return false;
      }
      if (filters.status && s.status !== filters.status) return false;
      if (filters.suburb && s.suburb !== filters.suburb) return false;
      if (filters.lga && s.lga !== filters.lga) return false;
      if (filters.buildingClass && s.buildingClass !== filters.buildingClass) return false;
      if (filters.source && s.source !== filters.source) return false;
      if (filters.isActive === "active" && !s.isActive) return false;
      if (filters.isActive === "inactive" && s.isActive) return false;
      return true;
    });
  }, [sites, filters]);

  const stats = useMemo(() => ({
    total: filteredSites.length,
    crane: filteredSites.filter(s => s.status === "crane").length,
    construction: filteredSites.filter(s => s.status === "construction").length,
    building: filteredSites.filter(s => s.status === "building").length,
    excavation: filteredSites.filter(s => s.status === "excavation").length,
    inspected: filteredSites.filter(s => s.status === "inspected").length,
    withPortal: filteredSites.filter(s => s.portalIds.length > 0).length,
  }), [filteredSites]);

  // ── Map init ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;
    const map = L.map(mapRef.current, {
      center: [-33.8688, 151.2093],
      zoom: 11,
      zoomControl: true,
    });
    tileLayerRef.current = L.tileLayer(NEARMAP_TILE_URL, {
      attribution: "© Nearmap 2026",
      maxZoom: 21,
      minZoom: 4,
    });
    tileLayerRef.current.addTo(map);
    leafletMap.current = map;
    return () => {
      map.remove();
      leafletMap.current = null;
    };
  }, []);

  // ── Sync markers ──────────────────────────────────────────────────────────
  const selectSite = useCallback((site: ConstructionSite) => {
    setSelectedSite(site);
    if (leafletMap.current) {
      leafletMap.current.flyTo([site.lat, site.lng], 18, { duration: 1 });
    }
    setView("map");
  }, []);

  useEffect(() => {
    const map = leafletMap.current;
    if (!map) return;

    // Remove old markers not in filtered set
    const filteredIds = new Set(filteredSites.map(s => s.id));
    markersRef.current.forEach((marker, id) => {
      if (!filteredIds.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    });

    // Add/update markers
    filteredSites.forEach(site => {
      const isSelected = selectedSite?.id === site.id;
      const color = SITE_STATUS_CONFIG[site.status].color;
      if (markersRef.current.has(site.id)) {
        const m = markersRef.current.get(site.id)!;
        m.setIcon(createMarkerIcon(color, isSelected));
      } else {
        const marker = L.marker([site.lat, site.lng], { icon: createMarkerIcon(color, isSelected) })
          .addTo(map)
          .on("click", () => selectSite(site));
        markersRef.current.set(site.id, marker);
      }
    });
  }, [filteredSites, selectedSite, selectSite]);

  // ── Sync Portal ───────────────────────────────────────────────────────────
  function syncPortal() {
    const now = new Date().toISOString().replace("T", " ").slice(0, 16);
    setSites(prev => prev.map(s => s.isActive ? { ...s, lastUpdated: now.slice(0, 10) } : s));
    setLastSync(now);
  }

  // ── Change status ─────────────────────────────────────────────────────────
  function changeStatus(id: number, status: SiteStatus) {
    setSites(prev => prev.map(s => s.id === id ? { ...s, status, lastUpdated: new Date().toISOString().slice(0, 10) } : s));
    setSelectedSite(prev => prev?.id === id ? { ...prev, status } : prev);
  }

  // ── Delete site ───────────────────────────────────────────────────────────
  function deleteSite(id: number) {
    const marker = markersRef.current.get(id);
    if (marker) { marker.remove(); markersRef.current.delete(id); }
    setSites(prev => prev.filter(s => s.id !== id));
    if (selectedSite?.id === id) setSelectedSite(null);
  }

  // ── Add marker ────────────────────────────────────────────────────────────
  async function handleAddMarker() {
    if (!addForm.address.trim()) return;
    setAddLoading(true);
    try {
      const resp = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addForm.address + ", Sydney, NSW, Australia")}&format=json&limit=1`);
      const data = await resp.json();
      if (data.length === 0) { alert("Address not found"); setAddLoading(false); return; }
      const { lat, lon, display_name } = data[0];
      const parts = display_name.split(", ");
      const newSite: ConstructionSite = {
        id: Date.now(),
        address: addForm.address,
        suburb: parts[1] || "Unknown",
        lga: parts[2] || "Unknown",
        lat: parseFloat(lat),
        lng: parseFloat(lon),
        status: addForm.status,
        developer: addForm.developer || undefined,
        storeys: addForm.storeys ? parseInt(addForm.storeys) : undefined,
        detectedDate: new Date().toISOString().slice(0, 10),
        lastUpdated: new Date().toISOString().slice(0, 10),
        source: "manual",
        portalIds: [],
        isActive: true,
      };
      setSites(prev => [...prev, newSite]);
      setShowAddDialog(false);
      setAddForm({ address: "", status: "construction", developer: "", storeys: "" });
      selectSite(newSite);
    } catch { alert("Geocoding failed"); }
    setAddLoading(false);
  }

  // ── Export CSV ────────────────────────────────────────────────────────────
  function exportCSV() {
    const headers = ["ID","Address","Suburb","LGA","Status","Developer","Builder","PCA","Storeys","Class","Portal IDs","Detected","Last Updated","Source"];
    const rows = filteredSites.map(s => [
      s.id, `"${s.address}"`, s.suburb, s.lga, SITE_STATUS_CONFIG[s.status].label,
      s.developer || "", s.builder || "", s.pca || "", s.storeys || "", s.buildingClass || "",
      s.portalIds.join(";"), s.detectedDate, s.lastUpdated, s.source
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "construction_sites.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  // ── PDF Report ────────────────────────────────────────────────────────────
  async function generatePDFReport() {
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const now = new Date().toLocaleDateString("en-AU");
    // Header
    doc.setFillColor(6, 14, 23);
    doc.rect(0, 0, 297, 20, "F");
    doc.setTextColor(74, 158, 255);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Construction Site Intelligence — Monthly Report", 14, 13);
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated: ${now}  |  Sites shown: ${filteredSites.length}`, 200, 13);
    // Stats summary
    const statItems = [
      ["Total", filteredSites.length, "#4a9eff"],
      ["Crane", stats.crane, "#ef4444"],
      ["Under Const.", stats.construction, "#f97316"],
      ["Building", stats.building, "#3b82f6"],
      ["Excavation", stats.excavation, "#eab308"],
      ["Inspected", stats.inspected, "#22c55e"],
      ["With Portal ID", stats.withPortal, "#a78bfa"],
    ];
    let x = 14;
    statItems.forEach(([label, val]) => {
      doc.setFillColor(15, 25, 35);
      doc.roundedRect(x, 24, 36, 14, 2, 2, "F");
      doc.setTextColor(200, 220, 240);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(String(val), x + 18, 33, { align: "center" });
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text(String(label).toUpperCase(), x + 18, 36, { align: "center" });
      x += 40;
    });
    // Table
    autoTable(doc, {
      startY: 42,
      head: [["#","Address","Suburb","LGA","Status","Developer","Builder","PCA","Class","Storeys","Portal ID","Detected","Last Updated"]],
      body: filteredSites.map((s, i) => [
        i + 1, s.address, s.suburb, s.lga, SITE_STATUS_CONFIG[s.status].label,
        s.developer || "", s.builder || "", s.pca || "",
        s.buildingClass ? `Cl.${s.buildingClass}` : "",
        s.storeys || "", s.portalIds[0] || "", s.detectedDate, s.lastUpdated,
      ]),
      styles: { fontSize: 7, cellPadding: 2, textColor: [200, 220, 240], fillColor: [10, 21, 32] },
      headStyles: { fillColor: [30, 63, 95], textColor: [255, 255, 255], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [15, 25, 35] },
      columnStyles: { 1: { cellWidth: 40 } },
    });
    doc.save(`construction_sites_${now.replace(/\//g, "-")}.pdf`);
  }

  // ── Excel Import ──────────────────────────────────────────────────────────
  async function handleExcelImport(file: File) {
    setImportLoading(true);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: "" });
      const imported: ConstructionSite[] = [];
      for (const row of rows) {
        const address = row["Address"] || row["address"] || row["SITE ADDRESS"] || "";
        if (!address) continue;
        // Try to geocode
        try {
          const resp = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address + ", NSW, Australia")}&format=json&limit=1`);
          const geo = await resp.json();
          if (!geo.length) continue;
          imported.push({
            id: Date.now() + imported.length,
            address,
            suburb: row["Suburb"] || row["suburb"] || geo[0].display_name.split(", ")[1] || "Unknown",
            lga: row["LGA"] || row["lga"] || "Unknown",
            lat: parseFloat(geo[0].lat),
            lng: parseFloat(geo[0].lon),
            status: (row["Status"] || row["status"] || "construction").toLowerCase().replace(/ /g, "_") as SiteStatus,
            developer: row["Developer"] || row["developer"] || undefined,
            builder: row["Builder"] || row["builder"] || undefined,
            pca: row["PCA"] || row["pca"] || undefined,
            storeys: row["Storeys"] ? parseInt(row["Storeys"]) : undefined,
            buildingClass: row["Class"] || row["class"] || undefined,
            detectedDate: new Date().toISOString().slice(0, 10),
            lastUpdated: new Date().toISOString().slice(0, 10),
            source: "manual",
            portalIds: row["Portal ID"] ? [row["Portal ID"]] : [],
            isActive: true,
          });
        } catch { /* skip ungeocoded */ }
      }
      setSites(prev => [...prev, ...imported]);
      setShowImportDialog(false);
      alert(`Imported ${imported.length} of ${rows.length} sites successfully.`);
    } catch (e) {
      alert("Import failed: " + String(e));
    }
    setImportLoading(false);
  }

  // ── Find in Action Manager ────────────────────────────────────────────────
  function findInActionManager(site: ConstructionSite) {
    // Store address in sessionStorage so ActionManager can pick it up
    sessionStorage.setItem("amSearch", site.address.split(",")[0].trim());
    setShowFindResult(`Searching for "${site.address.split(",")[0].trim()}" in Action Manager...`);
    setTimeout(() => setShowFindResult(null), 3000);
  }

  // ── NearMap AI Layers — live API using official class IDs ────────────────────
  const enabledLayersRef = useRef<Set<AILayerId>>(new Set());

  async function fetchAndRenderLayer(layer: typeof AI_LAYERS[number], map: L.Map) {
    const id = layer.id;
    setLayerStates(prev => ({ ...prev, [id]: { ...prev[id], loading: true, error: null } }));

    // Remove old group for this layer before re-rendering
    aiLayerGroupsRef.current.get(id)?.remove();
    aiLayerGroupsRef.current.delete(id);

    try {
      const b = map.getBounds();
      // NearMap AI v4 requires polygon as comma-separated x,y pairs (lon,lat)
      const sw = b.getSouthWest(), ne = b.getNorthEast();
      // Bounding box as closed polygon: SW → SE → NE → NW → SW
      const polygon = [
        `${sw.lng},${sw.lat}`,
        `${ne.lng},${sw.lat}`,
        `${ne.lng},${ne.lat}`,
        `${sw.lng},${ne.lat}`,
        `${sw.lng},${sw.lat}`,
      ].join(",");
      const until = new Date().toISOString().slice(0, 10);
      const since = `${new Date().getFullYear() - 1}-01-01`;
      // Query the full construction pack, then filter client-side by numeric classId
      const params = new URLSearchParams({ packs: "construction", polygon, since, until, apikey: NEARMAP_API_KEY });
      const url = `https://api.nearmap.com/ai/features/v4/features.json?${params}`;
      const res = await fetch(url);
      if (!res.ok) {
        let detail = res.statusText;
        try { const body = await res.json(); detail = body.message || body.error || body.detail || JSON.stringify(body); } catch { /* ignore */ }
        throw new Error(`NearMap API ${res.status}: ${detail}`);
      }
      const data = await res.json();

      const group = L.layerGroup();
      let count = 0;

      // Filter to only features matching this layer's numeric classId
      const features = (data.features ?? []).filter((feat: Record<string, unknown>) => {
        const props = feat.properties as Record<string, unknown> | null;
        return props?.classId === layer.classId || props?.class_id === layer.classId;
      });

      features.forEach((feat: Record<string, unknown>) => {
        count++;
        const geom = feat.geometry as { type: string; coordinates: unknown } | undefined;
        if (!geom) return;
        if (geom.type === "Polygon" || geom.type === "MultiPolygon") {
          L.geoJSON(feat as unknown as Parameters<typeof L.geoJSON>[0], {
            style: { color: layer.strokeColor, fillColor: layer.color, fillOpacity: 0.3, weight: 2 },
          })
            .bindPopup(`<b style="font-family:system-ui;font-size:12px;">${layer.label}</b>`)
            .addTo(group);
        } else if (geom.type === "Point") {
          const [lng, lat] = geom.coordinates as [number, number];
          L.circleMarker([lat, lng], { radius: 8, color: layer.strokeColor, fillColor: layer.color, fillOpacity: 0.85, weight: 2 })
            .bindPopup(`<b style="font-family:system-ui;font-size:12px;">${layer.label}</b>`)
            .addTo(group);
        }
      });

      group.addTo(map);
      aiLayerGroupsRef.current.set(id, group);
      setLayerStates(prev => ({ ...prev, [id]: { loading: false, error: null, count } }));
    } catch (err) {
      setLayerStates(prev => ({ ...prev, [id]: { loading: false, error: (err as Error).message, count: 0 } }));
    }
  }

  async function toggleLayer(layer: typeof AI_LAYERS[number]) {
    const map = leafletMap.current;
    if (!map) return;
    const id = layer.id;

    if (enabledLayersRef.current.has(id)) {
      aiLayerGroupsRef.current.get(id)?.remove();
      aiLayerGroupsRef.current.delete(id);
      enabledLayersRef.current.delete(id);
      setEnabledLayers(prev => { const s = new Set(prev); s.delete(id); return s; });
      setLayerStates(prev => ({ ...prev, [id]: { loading: false, error: null, count: 0 } }));
      return;
    }

    enabledLayersRef.current.add(id);
    setEnabledLayers(prev => { const s = new Set(prev); s.add(id); return s; });
    await fetchAndRenderLayer(layer, map);
  }

  // Auto-refresh enabled layers on map move/zoom
  useEffect(() => {
    const map = leafletMap.current;
    if (!map) return;
    const onMoveEnd = () => {
      enabledLayersRef.current.forEach(id => {
        const layer = AI_LAYERS.find(l => l.id === id);
        if (layer) fetchAndRenderLayer(layer, map);
      });
    };
    map.on("moveend", onMoveEnd);
    return () => { map.off("moveend", onMoveEnd); };
  }, []);

  // ── List pagination ───────────────────────────────────────────────────────
  const totalPages = Math.ceil(filteredSites.length / LIST_PAGE_SIZE);
  const pagedSites = filteredSites.slice((listPage - 1) * LIST_PAGE_SIZE, listPage * LIST_PAGE_SIZE);

  // ── Styles ────────────────────────────────────────────────────────────────
  const s = {
    root: { display: "flex", flexDirection: "column" as const, height: "100%", minHeight: 0, background: "#1a1a2e", color: "#e2e8f0", fontFamily: "'Montserrat', 'Source Sans 3', sans-serif", overflow: "hidden" },
    statsBar: { background: "#22243a", borderBottom: "1px solid #2a2a4e", padding: "8px 16px", display: "flex", gap: 12, alignItems: "center", flexShrink: 0, flexWrap: "wrap" as const },
    statBox: (color: string) => ({ background: "#1a1a2e", border: `1px solid ${color}33`, borderRadius: 6, padding: "4px 12px", display: "flex", flexDirection: "column" as const, alignItems: "center", minWidth: 70 }),
    statVal: (color: string) => ({ fontSize: 18, fontWeight: 800, color, lineHeight: 1.2 }),
    statLbl: { fontSize: 10, color: "#8b9ab5", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.05em" },
    filterBar: { background: "#22243a", borderBottom: "1px solid #2a2a4e", padding: "8px 16px", display: "flex", gap: 8, alignItems: "center", flexShrink: 0, flexWrap: "wrap" as const },
    filterInput: { background: "#1a1a2e", border: "1px solid #2a2a4e", borderRadius: 4, color: "#e2e8f0", padding: "5px 10px", fontSize: 12, outline: "none", fontFamily: "inherit" },
    viewBar: { background: "#22243a", borderBottom: "1px solid #2a2a4e", padding: "0 16px", display: "flex", alignItems: "center", gap: 4, flexShrink: 0 },
    tabBtn: (active: boolean) => ({ padding: "8px 18px", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, background: active ? "#1e5fa8" : "transparent", color: active ? "#fff" : "#94a3b8", borderBottom: active ? "2px solid #4a9eff" : "2px solid transparent", transition: "all 0.15s" }),
    actionBtn: { background: "#22243a", color: "#4a9eff", border: "1px solid #2a2a4e", borderRadius: 4, padding: "5px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" },
    syncBtn: { background: "#1e5fa8", color: "#fff", border: "none", borderRadius: 4, padding: "5px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" },
    mapWrap: { flex: 1, display: "flex", overflow: "hidden" },
    timeline: { width: 300, background: "#1a1a2e", borderLeft: "1px solid #2a2a4e", overflowY: "auto" as const, flexShrink: 0, padding: 0 },
    tlHeader: { background: "#22243a", borderBottom: "1px solid #2a2a4e", padding: "12px 14px" },
    tlSection: { padding: "10px 14px", borderBottom: "1px solid #2a2a4e44" },
    tlLabel: { fontSize: 10, color: "#8b9ab5", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 2 },
    tlValue: { fontSize: 12, color: "#e2e8f0" },
    portalLink: { color: "#4a9eff", fontSize: 12, textDecoration: "none", display: "block", marginBottom: 2 },
    dotBtn: (color: string, active: boolean) => ({ width: 20, height: 20, borderRadius: "50%", background: color, border: active ? "2px solid #fff" : "2px solid transparent", cursor: "pointer", transition: "transform 0.1s", transform: active ? "scale(1.3)" : "scale(1)" }),
    listWrap: { flex: 1, overflowY: "auto" as const, overflowX: "auto" as const },
    table: { width: "100%", borderCollapse: "collapse" as const, fontSize: 11 },
    th: { background: "#22243a", color: "#94a3b8", fontWeight: 700, padding: "8px 10px", textAlign: "left" as const, borderBottom: "1px solid #2a2a4e", whiteSpace: "nowrap" as const, position: "sticky" as const, top: 0, zIndex: 1 },
    td: { padding: "7px 10px", borderBottom: "1px solid #2a2a4e44", color: "#e2e8f0", whiteSpace: "nowrap" as const },
  };

  return (
    <div style={s.root}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      {/* Stats Bar */}
      <div style={s.statsBar}>
        {[
          { key: "", color: "#4a9eff", val: stats.total, lbl: "Total" },
          { key: "crane", color: "#ef4444", val: stats.crane, lbl: "Crane" },
          { key: "construction", color: "#f97316", val: stats.construction, lbl: "Under Const." },
          { key: "building", color: "#3b82f6", val: stats.building, lbl: "Building" },
          { key: "excavation", color: "#eab308", val: stats.excavation, lbl: "Excavation" },
          { key: "inspected", color: "#22c55e", val: stats.inspected, lbl: "Inspected" },
          { key: "__portal", color: "#a78bfa", val: stats.withPortal, lbl: "Portal ID" },
        ].map(({ key, color, val, lbl }) => {
          const isActive = key === "__portal" ? false : filters.status === key;
          return (
            <div
              key={lbl}
              onClick={() => {
                if (key === "__portal") return;
                setFilters(f => ({ ...f, status: f.status === key ? "" : key }));
              }}
              style={{
                ...s.statBox(color),
                cursor: key === "__portal" ? "default" : "pointer",
                border: isActive ? `2px solid ${color}` : `1px solid ${color}22`,
                boxShadow: isActive ? `0 0 8px ${color}55` : "none",
                transform: isActive ? "scale(1.05)" : "scale(1)",
                transition: "all 0.15s",
              }}
              title={key === "__portal" ? "Sites with Planning Portal ID" : key ? `Filter: ${lbl}` : "Show all"}
            >
              <span style={s.statVal(color)}>{val}</span>
              <span style={s.statLbl}>{lbl}</span>
            </div>
          );
        })}
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 10, color: "#64748b" }}>Last sync: {lastSync}</span>
        <button style={s.syncBtn} onClick={syncPortal}>⟳ Sync Portal</button>
        <button style={s.actionBtn} onClick={() => setShowAddDialog(true)}>+ Add Marker</button>
        <button style={{ ...s.actionBtn, color: "#22c55e", borderColor: "#22c55e" }} onClick={() => setShowImportDialog(true)}>↑ Import Excel</button>
        <button style={s.actionBtn} onClick={generatePDFReport}>📄 PDF Report</button>
        <button style={s.actionBtn} onClick={exportCSV}>↓ Export CSV</button>
      </div>

      {/* Filter Bar */}
      <div style={s.filterBar}>
        <input
          style={{ ...s.filterInput, width: 200 }}
          placeholder="🔍 Search address, suburb, portal ID..."
          value={filters.search}
          onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
        />
        <select style={s.filterInput} value={filters.suburb} onChange={e => setFilters(f => ({ ...f, suburb: e.target.value }))}>
          <option value="">All Suburbs</option>
          {suburbs.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select style={s.filterInput} value={filters.lga} onChange={e => setFilters(f => ({ ...f, lga: e.target.value }))}>
          <option value="">All LGAs</option>
          {lgas.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <select style={s.filterInput} value={filters.buildingClass} onChange={e => setFilters(f => ({ ...f, buildingClass: e.target.value }))}>
          <option value="">All Classes</option>
          <option value="2">Class 2</option>
          <option value="3">Class 3</option>
          <option value="9c">Class 9c</option>
          <option value="5">Class 5</option>
          <option value="7">Class 7</option>
          <option value="9b">Class 9b</option>
        </select>
        <select style={s.filterInput} value={filters.source} onChange={e => setFilters(f => ({ ...f, source: e.target.value }))}>
          <option value="">All Sources</option>
          <option value="nearmap_ai">NearMap AI</option>
          <option value="field_survey">Field Survey</option>
          <option value="manual">Manual</option>
        </select>
        <button style={{ ...s.actionBtn, fontSize: 10 }} onClick={() => setShowAdvanced(v => !v)}>
          {showAdvanced ? "▲ Less" : "▼ Advanced"}
        </button>
        <button style={{ ...s.actionBtn, fontSize: 10, color: "#f97316", borderColor: "#f97316" }} onClick={() => setFilters({ search: "", status: "", suburb: "", lga: "", buildingClass: "", source: "", isActive: "" })}>
          Clear
        </button>
        {showAdvanced && (
          <select style={s.filterInput} value={filters.isActive} onChange={e => setFilters(f => ({ ...f, isActive: e.target.value }))}>
            <option value="">Active & Inactive</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        )}
      </div>

      {/* View Toggle Bar */}
      <div style={s.viewBar}>
        <button style={s.tabBtn(view === "map")} onClick={() => setView("map")}>🗺 Map View</button>
        <button style={s.tabBtn(view === "list")} onClick={() => setView("list")}>☰ List View ({filteredSites.length})</button>
        <div style={{ flex: 1 }} />
        {/* Legend */}
        <div style={{ display: "flex", gap: 10, alignItems: "center", padding: "6px 0" }}>
          {(Object.entries(SITE_STATUS_CONFIG) as [SiteStatus, { label: string; color: string }][]).map(([k, v]) => (
            <span key={k} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#94a3b8" }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: v.color, display: "inline-block" }} />
              {v.label}
            </span>
          ))}
        </div>
      </div>

      {/* Main Content */}
      {view === "map" ? (
        <div style={s.mapWrap}>
          {/* Map + AI Layers overlay */}
          <div style={{ flex: 1, position: "relative" }}>
            <div ref={mapRef} style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }} />

            {/* AI Layers Button (top-right) */}
            <div style={{ position: "absolute", top: 12, right: 12, zIndex: 1001 }}>
              <button
                onClick={() => setShowLayersPanel(p => !p)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer",
                  background: showLayersPanel || enabledLayers.size > 0 ? "#1e5fa8" : "#22243a",
                  color: showLayersPanel || enabledLayers.size > 0 ? "#fff" : "#94a3b8",
                  border: showLayersPanel || enabledLayers.size > 0 ? "1px solid #4a9eff" : "1px solid #2a2a4e",
                  boxShadow: "0 2px 12px #0008", transition: "all 0.15s",
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
                </svg>
                AI Layers
                {enabledLayers.size > 0 && (
                  <span style={{ background: "#4a9eff", color: "#fff", borderRadius: "50%", width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800 }}>{enabledLayers.size}</span>
                )}
              </button>

              {showLayersPanel && (
                <div style={{ position: "absolute", top: 38, right: 0, width: 300, background: "#1a1a2e", border: "1px solid #2a2a4e", borderRadius: 8, boxShadow: "0 8px 32px #000c", overflow: "hidden" }}>
                  <div style={{ background: "#22243a", borderBottom: "1px solid #2a2a4e", padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>NearMap AI · Construction Pack</div>
                      <div style={{ fontSize: 10, color: "#8b9ab5", marginTop: 2 }}>Toggle to highlight sites by construction type</div>
                    </div>
                    <button onClick={() => setShowLayersPanel(false)} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: 0 }}>×</button>
                  </div>
                  <div style={{ padding: 8 }}>
                    {AI_LAYERS.map(layer => {
                      const isOn = enabledLayers.has(layer.id);
                      const st = layerStates[layer.id];
                      return (
                        <div key={layer.id}>
                          <button
                            onClick={() => toggleLayer(layer)}
                            disabled={st.loading}
                            style={{
                              width: "100%", display: "flex", alignItems: "flex-start", gap: 10,
                              padding: "8px 10px", borderRadius: 6, cursor: st.loading ? "wait" : "pointer",
                              background: isOn && !st.error ? `${layer.color}18` : "transparent",
                              border: isOn && !st.error ? `1px solid ${layer.color}55` : st.error && isOn ? "1px solid #ef444455" : "1px solid transparent",
                              textAlign: "left", transition: "all 0.15s",
                            }}
                          >
                            <div style={{ position: "relative", flexShrink: 0, marginTop: 2 }}>
                              <div style={{ width: 16, height: 16, borderRadius: 3, border: `2px solid ${isOn && !st.error ? layer.strokeColor : st.error ? "#ef4444" : "#475569"}`, background: isOn && !st.error ? layer.color + "99" : "transparent", opacity: st.loading ? 0.4 : 1, transition: "all 0.15s" }} />
                              {st.loading && (
                                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  <div style={{ width: 12, height: 12, border: `2px solid ${layer.color}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                                </div>
                              )}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                                <span style={{ fontSize: 12, fontWeight: 700, color: isOn ? (st.error ? "#f87171" : "#fff") : "#cbd5e1" }}>{layer.label}</span>
                                {isOn && !st.loading && !st.error && <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 3, background: `${layer.color}33`, color: layer.color, fontWeight: 800, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>ON</span>}
                                {isOn && !st.loading && !st.error && st.count > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: layer.color, marginLeft: "auto" }}>{st.count} detected</span>}
                                {isOn && !st.loading && !st.error && st.count === 0 && <span style={{ fontSize: 10, color: "#64748b", marginLeft: "auto" }}>0 in view</span>}
                              </div>
                              <div style={{ fontSize: 10, color: "#64748b", marginTop: 2, lineHeight: 1.4 }}>{layer.description}</div>
                            </div>
                          </button>
                          {isOn && st.error && (
                            <div style={{ margin: "2px 4px 4px", padding: "6px 8px", background: "#ef444420", border: "1px solid #ef444440", borderRadius: 4, fontSize: 10, color: "#fca5a5", display: "flex", gap: 6, alignItems: "flex-start" }}>
                              <span style={{ flexShrink: 0 }}>⚠</span>{st.error}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ padding: "8px 14px", borderTop: "1px solid #2a2a4e", background: "#22243a" }}>
                    <p style={{ fontSize: 9, color: "#475569", margin: 0, lineHeight: 1.4 }}>Polygons auto-refresh on pan/zoom. Uses official NearMap AI class IDs (Construction Pack). Requires active NearMap AI subscription.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Timeline Panel */}
          <div style={s.timeline}>
            {selectedSite ? (
              <>
                <div style={s.tlHeader}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontSize: 10, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>{selectedSite.suburb} · {selectedSite.lga}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginTop: 2, lineHeight: 1.3 }}>{selectedSite.address}</div>
                    </div>
                    <button onClick={() => setSelectedSite(null)} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 16, padding: 0 }}>×</button>
                  </div>
                  <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ background: SITE_STATUS_CONFIG[selectedSite.status].color + "22", color: SITE_STATUS_CONFIG[selectedSite.status].color, border: `1px solid ${SITE_STATUS_CONFIG[selectedSite.status].color}`, borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>
                      {SITE_STATUS_CONFIG[selectedSite.status].label}
                    </span>
                  </div>
                  {/* Status change dots */}
                  <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
                    {(Object.entries(SITE_STATUS_CONFIG) as [SiteStatus, { label: string; color: string }][]).map(([k, v]) => (
                      <button key={k} title={v.label} style={s.dotBtn(v.color, selectedSite.status === k)} onClick={() => changeStatus(selectedSite.id, k)} />
                    ))}
                  </div>
                </div>

                <div style={s.tlSection}>
                  {selectedSite.developer && <><div style={s.tlLabel}>Developer</div><div style={s.tlValue}>{selectedSite.developer}</div></>}
                  {selectedSite.builder && <><div style={{ ...s.tlLabel, marginTop: 6 }}>Builder</div><div style={s.tlValue}>{selectedSite.builder}</div></>}
                  {selectedSite.pca && <><div style={{ ...s.tlLabel, marginTop: 6 }}>PCA</div><div style={s.tlValue}>{selectedSite.pca}</div></>}
                  {selectedSite.buildingClass && <><div style={{ ...s.tlLabel, marginTop: 6 }}>Class</div><div style={s.tlValue}>Class {selectedSite.buildingClass}</div></>}
                  {selectedSite.storeys && <><div style={{ ...s.tlLabel, marginTop: 6 }}>Storeys</div><div style={s.tlValue}>{selectedSite.storeys}</div></>}
                  {selectedSite.developmentType && <><div style={{ ...s.tlLabel, marginTop: 6 }}>Dev Type</div><div style={s.tlValue}>{selectedSite.developmentType}</div></>}
                </div>

                <div style={s.tlSection}>
                  <div style={s.tlLabel}>Detected</div><div style={s.tlValue}>{selectedSite.detectedDate}</div>
                  <div style={{ ...s.tlLabel, marginTop: 6 }}>Last Updated</div><div style={s.tlValue}>{selectedSite.lastUpdated}</div>
                  <div style={{ ...s.tlLabel, marginTop: 6 }}>Source</div><div style={s.tlValue}>{selectedSite.source === "nearmap_ai" ? "NearMap AI" : selectedSite.source === "field_survey" ? "Field Survey" : "Manual"}</div>
                  <div style={{ ...s.tlLabel, marginTop: 6 }}>Coordinates</div><div style={{ ...s.tlValue, fontSize: 11, color: "#64748b" }}>{selectedSite.lat.toFixed(5)}, {selectedSite.lng.toFixed(5)}</div>
                  {selectedSite.postcode && <><div style={{ ...s.tlLabel, marginTop: 6 }}>Postcode</div><div style={s.tlValue}>{selectedSite.postcode}</div></>}
                  {selectedSite.notes && <><div style={{ ...s.tlLabel, marginTop: 6 }}>Notes</div><div style={{ ...s.tlValue, fontSize: 11, color: "#94a3b8" }}>{selectedSite.notes}</div></>}
                </div>

                {selectedSite.portalIds.length > 0 && (
                  <div style={s.tlSection}>
                    <div style={s.tlLabel}>Planning Portal Cases</div>
                    {selectedSite.portalIds.map(pid => (
                      <a key={pid} href="https://apps.planningportal.nsw.gov.au/prweb/app/default" target="_blank" rel="noreferrer" style={s.portalLink}>{pid} ↗</a>
                    ))}
                    <button style={{ ...s.actionBtn, marginTop: 8, width: "100%", textAlign: "center" }} onClick={() => window.open("https://apps.planningportal.nsw.gov.au/prweb/app/default", "_blank")}>
                      Search Portal ↗
                    </button>
                  </div>
                )}

                <div style={s.tlSection}>
                  <button style={{ ...s.actionBtn, width: "100%", textAlign: "center", marginBottom: 6 }} onClick={() => window.open(`https://apps.nearmap.com/maps/#/@${selectedSite.lat},${selectedSite.lng},18.00z,0d`, "_blank")}>
                    View in NearMap ↗
                  </button>
                  <button
                    style={{ ...s.actionBtn, width: "100%", textAlign: "center", marginBottom: 6, color: "#22c55e", borderColor: "#22c55e" }}
                    onClick={() => findInActionManager(selectedSite)}
                  >
                    🔍 Find in Action Manager
                  </button>
                  <button style={{ ...s.actionBtn, width: "100%", textAlign: "center", color: "#ef4444", borderColor: "#ef4444" }} onClick={() => { if (confirm("Delete this site?")) deleteSite(selectedSite.id); }}>
                    Delete Site
                  </button>
                </div>
              </>
            ) : (
              <div style={{ padding: 24, textAlign: "center", color: "#64748b" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📍</div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>Click a marker to view site details</div>
                <div style={{ fontSize: 11, marginTop: 4 }}>{filteredSites.length} sites shown</div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* List View */
        <div style={s.listWrap}>
          <table style={s.table}>
            <thead>
              <tr>
                {["#","Type","Address","Suburb","LGA","Class","Developer","Builder","PCA","Storeys","Portal ID","Detected","Last Updated","Actions"].map(h => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pagedSites.map((site, i) => (
                <tr key={site.id} style={{ cursor: "pointer" }} onClick={() => selectSite(site)}>
                  <td style={s.td}>{(listPage - 1) * LIST_PAGE_SIZE + i + 1}</td>
                  <td style={s.td}>
                    <span style={{ background: SITE_STATUS_CONFIG[site.status].color + "22", color: SITE_STATUS_CONFIG[site.status].color, border: `1px solid ${SITE_STATUS_CONFIG[site.status].color}55`, borderRadius: 3, padding: "1px 6px", fontSize: 10, fontWeight: 700, whiteSpace: "nowrap" }}>
                      {SITE_STATUS_CONFIG[site.status].label}
                    </span>
                  </td>
                  <td style={{ ...s.td, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis" }}>{site.address}</td>
                  <td style={s.td}>{site.suburb}</td>
                  <td style={s.td}>{site.lga}</td>
                  <td style={s.td}>{site.buildingClass ? `Cl. ${site.buildingClass}` : "—"}</td>
                  <td style={{ ...s.td, maxWidth: 130, overflow: "hidden", textOverflow: "ellipsis" }}>{site.developer || "—"}</td>
                  <td style={{ ...s.td, maxWidth: 130, overflow: "hidden", textOverflow: "ellipsis" }}>{site.builder || "—"}</td>
                  <td style={s.td}>{site.pca || "—"}</td>
                  <td style={s.td}>{site.storeys || "—"}</td>
                  <td style={{ ...s.td, color: "#4a9eff" }}>{site.portalIds[0] || "—"}</td>
                  <td style={s.td}>{site.detectedDate}</td>
                  <td style={s.td}>{site.lastUpdated}</td>
                  <td style={s.td} onClick={e => e.stopPropagation()}>
                    <button style={{ background: "none", border: "1px solid #ef444466", color: "#ef4444", borderRadius: 3, padding: "2px 7px", fontSize: 10, cursor: "pointer" }} onClick={() => { if (confirm("Delete?")) deleteSite(site.id); }}>Del</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Pagination */}
          <div style={{ padding: "10px 16px", display: "flex", gap: 8, alignItems: "center", borderTop: "1px solid #2a2a4e" }}>
            <button style={s.actionBtn} disabled={listPage === 1} onClick={() => setListPage(p => p - 1)}>← Prev</button>
            <span style={{ fontSize: 12, color: "#94a3b8" }}>Page {listPage} of {totalPages}</span>
            <button style={s.actionBtn} disabled={listPage === totalPages} onClick={() => setListPage(p => p + 1)}>Next →</button>
          </div>
        </div>
      )}

      {/* Find in Action Manager toast */}
      {showFindResult && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "#1a1a2e", border: "1px solid #22c55e", borderRadius: 8, padding: "12px 20px", color: "#22c55e", fontSize: 13, fontWeight: 600, zIndex: 9999, boxShadow: "0 4px 20px #000a" }}>
          {showFindResult}
          <button style={{ marginLeft: 12, background: "#22c55e", color: "#000", border: "none", borderRadius: 4, padding: "3px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }} onClick={() => { window.location.hash = ""; window.dispatchEvent(new CustomEvent("amSearch", { detail: sessionStorage.getItem("amSearch") })); setShowFindResult(null); }}>Go →</button>
        </div>
      )}

      {/* Import Excel Dialog */}
      {showImportDialog && (
        <div style={{ position: "fixed", inset: 0, background: "#000a", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#1a1a2e", border: "1px solid #2a2a4e", borderRadius: 8, padding: 24, width: 420 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 8 }}>Import Sites from Excel</div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 16, lineHeight: 1.5 }}>
              Upload an Excel file (.xlsx) with columns: <strong style={{ color: "#4a9eff" }}>Address</strong>, Suburb, LGA, Status, Developer, Builder, PCA, Class, Storeys, Portal ID.
              Each address will be geocoded automatically.
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              style={{ display: "none" }}
              onChange={e => { if (e.target.files?.[0]) handleExcelImport(e.target.files[0]); }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button
                style={{ ...s.syncBtn, flex: 1 }}
                onClick={() => fileInputRef.current?.click()}
                disabled={importLoading}
              >
                {importLoading ? "Importing & Geocoding..." : "📂 Choose Excel File"}
              </button>
              <button style={{ ...s.actionBtn, flex: 1 }} onClick={() => setShowImportDialog(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Marker Dialog */}
      {showAddDialog && (
        <div style={{ position: "fixed", inset: 0, background: "#000a", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#1a1a2e", border: "1px solid #2a2a4e", borderRadius: 8, padding: 24, width: 360 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 16 }}>Add New Marker</div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 11, color: "#94a3b8", display: "block", marginBottom: 4 }}>Address *</label>
              <input style={{ ...s.filterInput, width: "100%", boxSizing: "border-box" }} value={addForm.address} onChange={e => setAddForm(f => ({ ...f, address: e.target.value }))} placeholder="e.g. 100 George Street, Sydney" />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 11, color: "#94a3b8", display: "block", marginBottom: 4 }}>Status</label>
              <select style={{ ...s.filterInput, width: "100%", boxSizing: "border-box" }} value={addForm.status} onChange={e => setAddForm(f => ({ ...f, status: e.target.value as SiteStatus }))}>
                {(Object.keys(SITE_STATUS_CONFIG) as SiteStatus[]).map(k => <option key={k} value={k}>{SITE_STATUS_CONFIG[k].label}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 11, color: "#94a3b8", display: "block", marginBottom: 4 }}>Developer (optional)</label>
              <input style={{ ...s.filterInput, width: "100%", boxSizing: "border-box" }} value={addForm.developer} onChange={e => setAddForm(f => ({ ...f, developer: e.target.value }))} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, color: "#94a3b8", display: "block", marginBottom: 4 }}>Storeys (optional)</label>
              <input type="number" style={{ ...s.filterInput, width: "100%", boxSizing: "border-box" }} value={addForm.storeys} onChange={e => setAddForm(f => ({ ...f, storeys: e.target.value }))} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{ ...s.syncBtn, flex: 1 }} onClick={handleAddMarker} disabled={addLoading}>{addLoading ? "Geocoding..." : "Add Marker"}</button>
              <button style={{ ...s.actionBtn, flex: 1 }} onClick={() => setShowAddDialog(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
