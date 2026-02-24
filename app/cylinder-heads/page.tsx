"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

function FlowGraph({ flowData }: { flowData: Array<{ lift: number; intake_flow: number; exhaust_flow: number }> }) {
  if (!flowData || flowData.length === 0) return null;

  const maxLift = Math.max(...flowData.map((d) => d.lift));
  const maxFlow = Math.max(...flowData.map((d) => Math.max(d.intake_flow, d.exhaust_flow)));

  const padding = 50;
  const width = 700;
  const height = 400;
  const graphWidth = width - padding * 2;
  const graphHeight = height - padding * 2;

  const scaleX = (lift: number) => padding + (lift / maxLift) * graphWidth;
  const scaleY = (flow: number) => height - padding - (flow / maxFlow) * graphHeight;

  return (
    <div style={{ marginBottom: 24 }}>
      <svg
        width={width}
        height={height}
        style={{
          border: "1px solid rgba(148,163,184,0.3)",
          borderRadius: 8,
          background: "linear-gradient(135deg, rgba(2,6,23,0.6), rgba(15,23,42,0.8))",
          display: "block",
          margin: "0 auto",
        }}
      >
        {/* Grid lines - horizontal */}
        {[0, 0.2, 0.4, 0.6, 0.8, 1].map((frac) => (
          <g key={`h-${frac}`}>
            <line
              x1={padding}
              y1={height - padding - frac * graphHeight}
              x2={width - padding}
              y2={height - padding - frac * graphHeight}
              stroke="rgba(148,163,184,0.15)"
              strokeWidth="1"
              strokeDasharray="3,3"
            />
            <text
              x={padding - 10}
              y={height - padding - frac * graphHeight + 4}
              textAnchor="end"
              fill="rgba(226,232,240,0.6)"
              fontSize="11"
            >
              {Math.round(frac * maxFlow)}
            </text>
          </g>
        ))}

        {/* Grid lines - vertical */}
        {[0, 0.25, 0.5, 0.75, 1].map((frac) => (
          <g key={`v-${frac}`}>
            <line
              x1={padding + frac * graphWidth}
              y1={padding}
              x2={padding + frac * graphWidth}
              y2={height - padding}
              stroke="rgba(148,163,184,0.15)"
              strokeWidth="1"
              strokeDasharray="3,3"
            />
            <text
              x={padding + frac * graphWidth}
              y={height - padding + 20}
              textAnchor="middle"
              fill="rgba(226,232,240,0.6)"
              fontSize="11"
            >
              {(frac * maxLift).toFixed(2)}"
            </text>
          </g>
        ))}

        {/* Axes */}
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="rgba(148,163,184,0.5)" strokeWidth="2" />
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="rgba(148,163,184,0.5)" strokeWidth="2" />

        {/* Intake flow curve */}
        <polyline
          points={flowData.map((d) => `${scaleX(d.lift)},${scaleY(d.intake_flow)}`).join(" ")}
          fill="none"
          stroke="#00f5ff"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Exhaust flow curve */}
        <polyline
          points={flowData.map((d) => `${scaleX(d.lift)},${scaleY(d.exhaust_flow)}`).join(" ")}
          fill="none"
          stroke="#ff3bd4"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points - Intake */}
        {flowData.map((d, idx) => (
          <circle key={`i-${idx}`} cx={scaleX(d.lift)} cy={scaleY(d.intake_flow)} r="4" fill="#00f5ff" opacity="0.8" />
        ))}

        {/* Data points - Exhaust */}
        {flowData.map((d, idx) => (
          <circle key={`e-${idx}`} cx={scaleX(d.lift)} cy={scaleY(d.exhaust_flow)} r="4" fill="#ff3bd4" opacity="0.8" />
        ))}

        {/* Y Axis Label */}
        <text
          x="15"
          y={height / 2}
          textAnchor="middle"
          fill="rgba(226,232,240,0.7)"
          fontSize="13"
          fontWeight="600"
          transform={`rotate(-90 15 ${height / 2})`}
        >
          CFM
        </text>

        {/* X Axis Label */}
        <text x={width / 2} y={height - 5} textAnchor="middle" fill="rgba(226,232,240,0.7)" fontSize="13" fontWeight="600">
          Lift (Inches)
        </text>

        {/* Legend */}
        <g>
          <rect x={width - 180} y={padding + 10} width="160" height="80" fill="rgba(2,6,23,0.9)" stroke="rgba(148,163,184,0.3)" rx="6" />

          {/* Intake */}
          <line x1={width - 170} y1={padding + 25} x2={width - 145} y2={padding + 25} stroke="#00f5ff" strokeWidth="3" />
          <text x={width - 140} y={padding + 30} fill="#00f5ff" fontSize="12" fontWeight="600">
            Intake Flow
          </text>

          {/* Exhaust */}
          <line x1={width - 170} y1={padding + 50} x2={width - 145} y2={padding + 50} stroke="#ff3bd4" strokeWidth="3" />
          <text x={width - 140} y={padding + 55} fill="#ff3bd4" fontSize="12" fontWeight="600">
            Exhaust Flow
          </text>

          {/* Max values */}
          <text x={width - 170} y={padding + 75} fill="rgba(226,232,240,0.6)" fontSize="10">
            Max: {Math.round(maxFlow)} CFM
          </text>
        </g>
      </svg>
    </div>
  );
}

function useAuthCheck() {
  const router = useRouter();
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const res = await fetch("/api/auth/me");
      if (!res.ok) {
        router.replace("/auth/login");
      } else {
        setIsAuthed(true);
      }
    };
    checkAuth();
  }, [router]);

  return isAuthed;
}

type Head = {
  id: string;
  brand: string;
  part_number: string;
  part_name: string;
  engine_make: string;
  engine_family: string;
  intake_valve_size: number;
  exhaust_valve_size: number;
  max_lift: number;
  max_rpm: number;
  intake_runner_cc: number;
  chamber_cc: number;
  notes: string;
  created_at: string;
};

type MakeKey =
  | "Ford"
  | "Chevrolet"
  | "Dodge/Mopar"
  | "Toyota"
  | "Honda"
  | "Nissan"
  | "Subaru"
  | "Mitsubishi"
  | "Mazda"
  | "BMW"
  | "VW/Audi"
  | "Mercedes"
  | "Other";

const MAKE_OPTIONS: MakeKey[] = [
  "Ford",
  "Chevrolet",
  "Dodge/Mopar",
  "Toyota",
  "Honda",
  "Nissan",
  "Subaru",
  "Mitsubishi",
  "Mazda",
  "BMW",
  "VW/Audi",
  "Mercedes",
  "Other",
];

const ENGINE_FAMILIES: Record<MakeKey, string[]> = {
  Ford: [
    "Small Block Windsor (221/260/289/302/351W)",
    "Cleveland (351C/351M/400)",
    "FE Big Block (352/390/406/427/428)",
    "385-Series (429/460)",
    "Modular 4.6/5.4 (2V/3V/4V)",
    "Coyote 5.0 (Gen 1/2/3/4)",
    "Godzilla 7.3",
    "EcoBoost V6 (3.5/2.7)",
    "Lima 2.3",
    "Y-Block",
    "Other Ford",
  ],
  Chevrolet: [
    "Gen I Small Block (265–400)",
    "Gen II LT1/LT4 (1992–1997)",
    "Gen III/IV LS (4.8/5.3/6.0/6.2 etc.)",
    "Gen V LT (LT1/LT4/LT2 etc.)",
    "Big Block Mark IV (396/402/427/454)",
    "Big Block Gen V/VI (454/502 etc.)",
    "Other Chevy",
  ],
  "Dodge/Mopar": [
    "LA Small Block (273/318/340/360)",
    "Magnum (5.2/5.9)",
    "Gen III Hemi (5.7/6.1/6.4/6.2)",
    "RB Big Block (383/400/413/426W/440)",
    "B Big Block",
    "Slant-6",
    "Other Mopar",
  ],
  Toyota: ["2JZ", "1JZ", "UZ (1UZ/2UZ/3UZ)", "UR", "GR", "Other Toyota"],
  Honda: ["B-Series", "K-Series", "D-Series", "H-Series", "J-Series", "Other Honda"],
  Nissan: ["SR", "RB", "VG", "VQ", "VR", "Other Nissan"],
  Subaru: ["EJ", "FA/FB", "Other Subaru"],
  Mitsubishi: ["4G63", "4B11", "Other Mitsubishi"],
  Mazda: ["BP", "B6", "K-Series V6", "13B (Rotary)", "Other Mazda"],
  BMW: ["M50/M52", "S50/S52", "N54", "S55", "B58", "S58", "Other BMW"],
  "VW/Audi": ["1.8T", "2.0T EA888", "VR6", "07K 2.5", "Other VW/Audi"],
  Mercedes: ["M113", "M112", "M156", "M157", "Other Mercedes"],
  Other: ["Other / Custom"],
};

export default function ViewHeadsPage() {
  const t = useTranslations();
  const isAuthed = useAuthCheck();
  const [heads, setHeads] = useState<Head[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMake, setSelectedMake] = useState<MakeKey | "">("");
  const [selectedFamily, setSelectedFamily] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedPartName, setSelectedPartName] = useState("");
  const [selectedHead, setSelectedHead] = useState<(Head & { flow_data: Array<any> }) | null>(null);
  const [flowLoading, setFlowLoading] = useState(false);

  useEffect(() => {
    const fetchHeads = async () => {
      try {
        const res = await fetch("/api/cylinder-heads/browse");
        if (res.ok) {
          const data = await res.json();
          setHeads(data.heads || []);
        }
      } catch (error) {
        console.error("Failed to load heads:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHeads();
  }, []);

  const openHeadDetail = async (head: Head) => {
    setFlowLoading(true);
    try {
      const res = await fetch(`/api/cylinder-heads/flow?headId=${head.id}`);
      if (res.ok) {
        const data = await res.json();
        console.log("Flow data received:", data);
        setSelectedHead({ ...head, flow_data: data.flow_data || [] });
      } else {
        console.error("Failed to fetch flow data:", res.status);
        setSelectedHead({ ...head, flow_data: [] });
      }
    } catch (error) {
      console.error("Failed to load flow data:", error);
      setSelectedHead({ ...head, flow_data: [] });
    } finally {
      setFlowLoading(false);
    }
  };

  const filteredHeads = heads.filter((head) => {
    if (selectedMake && head.engine_make !== selectedMake) return false;
    if (selectedFamily) {
      // Normalize both: remove the part in parentheses
      const selectedNormalized = selectedFamily.split('(')[0].trim();
      const headNormalized = head.engine_family.split('(')[0].trim();
      if (headNormalized !== selectedNormalized) return false;
    }
    if (selectedBrand && head.brand.toLowerCase() !== selectedBrand.toLowerCase()) return false;
    if (selectedPartName && head.part_name.toLowerCase() !== selectedPartName.toLowerCase()) return false;
    return true;
  });

  const familyOptions = selectedMake ? ENGINE_FAMILIES[selectedMake] : [];
  const brands = Array.from(new Set(heads.map((h) => h.brand))).sort();
  const partNames = Array.from(new Set(heads.map((h) => h.part_name))).sort();

  if (loading) return <div style={{ padding: 20 }}>{t('common.loading')}</div>;
  if (isAuthed === null) return <div style={{ padding: 20 }}>{t('common.loading')}</div>;

  // Modal styles
  const modalOverlay: React.CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.7)",
    display: selectedHead ? "flex" : "none",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  };

  const modalContent: React.CSSProperties = {
    background: "linear-gradient(135deg, rgba(15,23,42,0.98), rgba(30,41,59,0.95))",
    border: "1px solid rgba(168,85,247,0.3)",
    borderRadius: 16,
    padding: 30,
    maxWidth: 900,
    width: "90%",
    maxHeight: "90vh",
    overflowY: "auto",
    color: "#e2e8f0",
    fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
  };

  return (
    <main style={{ padding: 20, maxWidth: 600, margin: "0 auto" }}>
      <div
        style={{
          borderRadius: 18,
          padding: 30,
          border: "1px solid rgba(168,85,247,0.35)",
          background: "radial-gradient(circle at 20% 10%, rgba(168,85,247,0.16), rgba(15,23,42,0.92))",
          boxShadow: "0 18px 50px rgba(0,0,0,0.6)",
          color: "#e2e8f0",
          fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
        }}
      >
        <h1
          style={{
            margin: "0 0 8px 0",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            fontSize: 20,
            color: "#d8b4fe",
          }}
        >
          {t('heads.title')}
        </h1>

        <p
          style={{
            marginTop: 0,
            marginBottom: 24,
            color: "rgba(226,232,240,0.8)",
            fontSize: 13,
          }}
        >
          {t('heads.browseDescription')}
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
          {/* Make Dropdown */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 600,
                color: "#d8b4fe",
                marginBottom: 6,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {t('heads.engineMake')}
            </label>
            <select
              value={selectedMake}
              onChange={(e) => {
                setSelectedMake(e.target.value as MakeKey | "");
                setSelectedFamily("");
              }}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: 6,
                border: "1px solid rgba(148,163,184,0.3)",
                background: "rgba(2,6,23,0.6)",
                color: "#e2e8f0",
                fontSize: 13,
                fontFamily: "inherit",
                boxSizing: "border-box",
              }}
            >
              <option value="">{t('heads.allMakes')}</option>
              {MAKE_OPTIONS.map((make) => (
                <option key={make} value={make}>
                  {make}
                </option>
              ))}
            </select>
          </div>

          {/* Family Dropdown */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 600,
                color: "#d8b4fe",
                marginBottom: 6,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {t('heads.engineFamily')}
            </label>
            <select
              value={selectedFamily}
              onChange={(e) => setSelectedFamily(e.target.value)}
              disabled={!selectedMake}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: 6,
                border: "1px solid rgba(148,163,184,0.3)",
                background: "rgba(2,6,23,0.6)",
                color: "#e2e8f0",
                fontSize: 13,
                fontFamily: "inherit",
                boxSizing: "border-box",
                opacity: !selectedMake ? 0.5 : 1,
                cursor: !selectedMake ? "not-allowed" : "pointer",
              }}
            >
              <option value="">{t('heads.allFamilies')}</option>
              {familyOptions.map((family) => (
                <option key={family} value={family}>
                  {family}
                </option>
              ))}
            </select>
          </div>

          {/* Brand Dropdown */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 600,
                color: "#d8b4fe",
                marginBottom: 6,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {t('heads.brand')}
            </label>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: 6,
                border: "1px solid rgba(148,163,184,0.3)",
                background: "rgba(2,6,23,0.6)",
                color: "#e2e8f0",
                fontSize: 13,
                fontFamily: "inherit",
                boxSizing: "border-box",
              }}
            >
              <option value="">{t('heads.allBrands')}</option>
              {brands.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
          </div>

          {/* Part Name Dropdown */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 600,
                color: "#d8b4fe",
                marginBottom: 6,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {t('heads.partName')}
            </label>
            <select
              value={selectedPartName}
              onChange={(e) => setSelectedPartName(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: 6,
                border: "1px solid rgba(148,163,184,0.3)",
                background: "rgba(2,6,23,0.6)",
                color: "#e2e8f0",
                fontSize: 13,
                fontFamily: "inherit",
                boxSizing: "border-box",
              }}
            >
              <option value="">{t('heads.allPartNames')}</option>
              {partNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredHeads.length === 0 ? (
          <div style={{ opacity: 0.7, textAlign: "center", padding: 20 }}>
            {heads.length === 0 ? "No heads available yet." : "No results found."}
          </div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {filteredHeads.map((head) => (
              <div
                key={head.id}
                onClick={() => openHeadDetail(head)}
                style={{
                  padding: 16,
                  borderRadius: 12,
                  border: "1px solid rgba(168,85,247,0.25)",
                  background: "rgba(168,85,247,0.08)",
                  transition: "all 0.2s ease",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(168,85,247,0.5)";
                  (e.currentTarget as HTMLDivElement).style.background = "rgba(168,85,247,0.15)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(168,85,247,0.25)";
                  (e.currentTarget as HTMLDivElement).style.background = "rgba(168,85,247,0.08)";
                }}
              >
                <div style={{ fontWeight: 600, color: "#d8b4fe", marginBottom: 4 }}>
                  {head.part_name}
                </div>
                <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 2 }}>
                  {head.brand} - {head.part_number}
                </div>
                <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 8 }}>
                  {head.engine_make} - {head.engine_family}
                </div>
                <div style={{ fontSize: 11, opacity: 0.6 }}>
                  {new Date(head.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Detail Modal */}
        <div style={modalOverlay} onClick={() => selectedHead && setSelectedHead(null)}>
          <div style={modalContent} onClick={(e) => e.stopPropagation()}>
            {flowLoading ? (
              <div style={{ textAlign: "center", padding: 40 }}>Loading flow data...</div>
            ) : selectedHead ? (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 24 }}>
                  <div>
                    <h2 style={{ margin: "0 0 12px 0", color: "#d8b4fe", fontSize: 24 }}>
                      {selectedHead.part_name}
                    </h2>
                    <div style={{ fontSize: 14, opacity: 0.8, marginBottom: 4 }}>
                      {selectedHead.brand} - {selectedHead.part_number}
                    </div>
                    <div style={{ fontSize: 14, opacity: 0.7 }}>
                      {selectedHead.engine_make} - {selectedHead.engine_family}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedHead(null)}
                    style={{
                      background: "rgba(239,68,68,0.2)",
                      border: "1px solid rgba(239,68,68,0.5)",
                      color: "#fca5a5",
                      borderRadius: 6,
                      padding: "8px 16px",
                      cursor: "pointer",
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  >
                    Close
                  </button>
                </div>

                {/* Specs Grid - Expanded */}
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ margin: "0 0 16px 0", fontSize: 14, color: "#d8b4fe" }}>Specifications</h3>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: 12,
                      padding: 16,
                      background: "rgba(148,163,184,0.05)",
                      borderRadius: 8,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 10, opacity: 0.7, textTransform: "uppercase", marginBottom: 6, letterSpacing: "0.05em" }}>
                        Intake Valve Size
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 600, color: "#a5f3fc" }}>
                        {selectedHead.intake_valve_size}"
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, opacity: 0.7, textTransform: "uppercase", marginBottom: 6, letterSpacing: "0.05em" }}>
                        Exhaust Valve Size
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 600, color: "#a5f3fc" }}>
                        {selectedHead.exhaust_valve_size}"
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, opacity: 0.7, textTransform: "uppercase", marginBottom: 6, letterSpacing: "0.05em" }}>
                        Max Lift
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 600, color: "#a5f3fc" }}>
                        {selectedHead.max_lift}"
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, opacity: 0.7, textTransform: "uppercase", marginBottom: 6, letterSpacing: "0.05em" }}>
                        Max RPM
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 600, color: "#a5f3fc" }}>
                        {selectedHead.max_rpm.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, opacity: 0.7, textTransform: "uppercase", marginBottom: 6, letterSpacing: "0.05em" }}>
                        Intake Runner CC
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 600, color: "#a5f3fc" }}>
                        {selectedHead.intake_runner_cc} cc
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, opacity: 0.7, textTransform: "uppercase", marginBottom: 6, letterSpacing: "0.05em" }}>
                        Chamber CC
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 600, color: "#a5f3fc" }}>
                        {selectedHead.chamber_cc} cc
                      </div>
                    </div>
                  </div>
                </div>

                {/* Flow Graph */}
                {selectedHead.flow_data && selectedHead.flow_data.length > 0 ? (
                  <>
                    <h3 style={{ margin: "16px 0 16px 0", fontSize: 16, color: "#d8b4fe" }}>Flow Data</h3>
                    <FlowGraph flowData={selectedHead.flow_data} />

                    {/* Data Table */}
                    <div
                      style={{
                        marginTop: 16,
                        padding: 16,
                        background: "rgba(148,163,184,0.05)",
                        borderRadius: 8,
                        border: "1px solid rgba(148,163,184,0.1)",
                      }}
                    >
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
                          <thead>
                            <tr style={{ borderBottom: "2px solid rgba(168,85,247,0.3)" }}>
                              <th
                                style={{
                                  textAlign: "left",
                                  padding: "12px 8px",
                                  color: "#a5f3fc",
                                  fontWeight: 600,
                                  textTransform: "uppercase",
                                  fontSize: 11,
                                  letterSpacing: "0.05em",
                                }}
                              >
                                Lift (")
                              </th>
                              <th
                                style={{
                                  textAlign: "left",
                                  padding: "12px 8px",
                                  color: "#00f5ff",
                                  fontWeight: 600,
                                  textTransform: "uppercase",
                                  fontSize: 11,
                                  letterSpacing: "0.05em",
                                }}
                              >
                                Intake Flow (CFM)
                              </th>
                              <th
                                style={{
                                  textAlign: "left",
                                  padding: "12px 8px",
                                  color: "#ff3bd4",
                                  fontWeight: 600,
                                  textTransform: "uppercase",
                                  fontSize: 11,
                                  letterSpacing: "0.05em",
                                }}
                              >
                                Exhaust Flow (CFM)
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedHead.flow_data.map((row, idx) => (
                              <tr
                                key={idx}
                                style={{
                                  borderBottom: "1px solid rgba(148,163,184,0.1)",
                                  background: idx % 2 === 0 ? "rgba(168,85,247,0.05)" : "transparent",
                                }}
                              >
                                <td style={{ padding: "10px 8px", color: "#e2e8f0" }}>{row.lift.toFixed(3)}</td>
                                <td style={{ padding: "10px 8px", color: "#00f5ff", fontWeight: 600 }}>
                                  {row.intake_flow.toFixed(1)}
                                </td>
                                <td style={{ padding: "10px 8px", color: "#ff3bd4", fontWeight: 600 }}>
                                  {row.exhaust_flow.toFixed(1)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                ) : (
                  <div
                    style={{
                      marginTop: 16,
                      padding: 20,
                      background: "rgba(148,163,184,0.1)",
                      borderRadius: 8,
                      border: "1px solid rgba(148,163,184,0.2)",
                      color: "rgba(226,232,240,0.7)",
                      textAlign: "center",
                    }}
                  >
                    No flow data available for this head.
                  </div>
                )}

                {selectedHead.notes && (
                  <div style={{ marginTop: 16 }}>
                    <h3 style={{ margin: "0 0 8px 0", fontSize: 14, color: "#d8b4fe" }}>Notes</h3>
                    <div style={{ fontSize: 13, opacity: 0.8, lineHeight: 1.6 }}>
                      {selectedHead.notes}
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}
