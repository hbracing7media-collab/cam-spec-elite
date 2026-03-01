"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { CAM_MAKE_OPTIONS, CAM_ENGINE_FAMILIES, CamMakeKey } from "@/lib/engineOptions";
import { SearchableDropdown } from "@/components/SearchableDropdown";

export default function DynoSubmitPage() {
  const router = useRouter();
  const t = useTranslations();
  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submissionMsg, setSubmissionMsg] = useState<string | null>(null);

  // Engine specs form
  const [engineSpecs, setEngineSpecs] = useState({
    block_name: "",
    engine_make: "",
    engine_family: "",
    displacement: "",
    bore: "",
    stroke: "",
    deck_height: "",
    piston_dome_dish: "",
    rod_length: "",
    head_gasket_bore: "",
    head_gasket_compressed_thickness: "",
  });

  // Dyno results form
  const [dynoData, setDynoData] = useState({
    engine_name: "",
    hp: 0,
    torque: undefined as number | undefined,
  });

  // RPM intervals
  const [rpmIntervals, setRpmIntervals] = useState<
    Array<{ rpm: number; hp: number; torque: number }>
  >([{ rpm: 1000, hp: 0, torque: 0 }]);

  // Visibility setting
  const [visibility, setVisibility] = useState<"public" | "private">("public");

  // File uploads (required)
  const [dynoGraphFile, setDynoGraphFile] = useState<File | null>(null);
  const [camCardFile, setCamCardFile] = useState<File | null>(null);
  const [carPhotoFile, setCarPhotoFile] = useState<File | null>(null);

  // Cam and Head selection
  const [selectedCamId, setSelectedCamId] = useState<string | null>(null);
  const [selectedHeadId, setSelectedHeadId] = useState<string | null>(null);
  const [availableCams, setAvailableCams] = useState<Array<{ id: string; name: string }>>([]);
  const [availableHeads, setAvailableHeads] = useState<Array<{ id: string; name: string }>>([]);
  const [camsLoading, setCamsLoading] = useState(false);
  const [headsLoading, setHeadsLoading] = useState(false);

  // Check auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      const res = await fetch("/api/auth/me");
      if (!res.ok) {
        router.replace("/auth/login");
      } else {
        setChecking(false);
      }
    };
    checkAuth();
  }, [router]);

  // Fetch available cams when make/family changes
  useEffect(() => {
    if (engineSpecs.engine_make && engineSpecs.engine_family) {
      console.log("[DYNO-SUBMIT] Fetching cams for:", engineSpecs.engine_make, engineSpecs.engine_family);
      setCamsLoading(true);
      setSelectedCamId(null);
      setAvailableCams([]);

      fetch(
        `/api/dyno-wars/cams?make=${encodeURIComponent(
          engineSpecs.engine_make
        )}&family=${encodeURIComponent(engineSpecs.engine_family)}`
      )
        .then((res) => res.json())
        .then((data) => {
          console.log("[DYNO-SUBMIT] Cams API response:", data);
          if (data.ok && Array.isArray(data.cams)) {
            console.log("[DYNO-SUBMIT] Setting cams:", data.cams);
            setAvailableCams(data.cams);
          } else {
            console.warn("[DYNO-SUBMIT] Invalid cams response:", data);
          }
        })
        .catch((err) => console.error("Failed to fetch cams:", err))
        .finally(() => setCamsLoading(false));
    }
  }, [engineSpecs.engine_make, engineSpecs.engine_family]);

  // Fetch available heads when make/family changes
  useEffect(() => {
    if (engineSpecs.engine_make && engineSpecs.engine_family) {
      console.log("[DYNO-SUBMIT] Fetching heads for:", engineSpecs.engine_make, engineSpecs.engine_family);
      setHeadsLoading(true);
      setSelectedHeadId(null);
      setAvailableHeads([]);

      fetch(
        `/api/dyno-wars/heads?make=${encodeURIComponent(
          engineSpecs.engine_make
        )}&family=${encodeURIComponent(engineSpecs.engine_family)}`
      )
        .then((res) => res.json())
        .then((data) => {
          console.log("[DYNO-SUBMIT] Heads API response:", data);
          if (data.ok && Array.isArray(data.heads)) {
            console.log("[DYNO-SUBMIT] Setting heads:", data.heads);
            setAvailableHeads(data.heads);
          } else {
            console.warn("[DYNO-SUBMIT] Invalid heads response:", data);
          }
        })
        .catch((err) => console.error("Failed to fetch heads:", err))
        .finally(() => setHeadsLoading(false));
    }
  }, [engineSpecs.engine_make, engineSpecs.engine_family]);

  const handleDynoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmissionMsg(null);

    // Validate cam and head selection
    if (!selectedCamId || !selectedHeadId) {
      setSubmissionMsg("Please select both a cam and a head before submitting");
      setSubmitting(false);
      return;
    }

    // Validate required files
    if (!dynoGraphFile || !camCardFile || !carPhotoFile) {
      setSubmissionMsg("All three image files are required (Dyno Graph, Cam Card, Car Photo)");
      setSubmitting(false);
      return;
    }

    if (!rpmIntervals.length || !rpmIntervals[0].hp) {
      setSubmissionMsg("Please enter at least one RPM interval with horsepower");
      setSubmitting(false);
      return;
    }

    try {
      // Calculate max HP and torque from intervals
      const maxHp = Math.max(...rpmIntervals.map((i) => i.hp || 0));
      const maxTorque = Math.max(...rpmIntervals.map((i) => i.torque || 0));

      // Create FormData for file upload
      const formData = new FormData();
      formData.append("engine_name", dynoData.engine_name || "Unnamed Engine");
      formData.append("engine_make", engineSpecs.engine_make);
      formData.append("engine_family", engineSpecs.engine_family);
      formData.append("horsepower", maxHp.toString());
      formData.append("torque", (maxTorque || 0).toString());
      formData.append("engine_specs", JSON.stringify(engineSpecs));
      formData.append("rpm_intervals", JSON.stringify(rpmIntervals));
      formData.append("visibility", visibility);
      formData.append("selected_cam_id", selectedCamId || "");
      formData.append("selected_head_id", selectedHeadId || "");
      formData.append("dyno_graph", dynoGraphFile);
      formData.append("cam_card", camCardFile);
      formData.append("car_photo", carPhotoFile);

      const res = await fetch("/api/dyno-wars/submit", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setSubmissionMsg("Dyno submission successful! Pending admin approval 🎉");
        setEngineSpecs({
          block_name: "",
          engine_make: "",
          engine_family: "",
          displacement: "",
          bore: "",
          stroke: "",
          deck_height: "",
          piston_dome_dish: "",
          rod_length: "",
          head_gasket_bore: "",
          head_gasket_compressed_thickness: "",
        });
        setDynoData({
          engine_name: "",
          hp: 0,
          torque: undefined,
        });
        setRpmIntervals([{ rpm: 1000, hp: 0, torque: 0 }]);
        setVisibility("public");
        setDynoGraphFile(null);
        setCamCardFile(null);
        setCarPhotoFile(null);
        setTimeout(() => router.push("/dyno-wars"), 1500);
      } else {
        const data = await res.json();
        setSubmissionMsg(data.message || "Failed to submit dyno data");
      }
    } catch (err: any) {
      setSubmissionMsg("Error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const addInterval = () => {
    const lastRpm = rpmIntervals[rpmIntervals.length - 1]?.rpm || 1000;
    setRpmIntervals([...rpmIntervals, { rpm: lastRpm + 500, hp: 0, torque: 0 }]);
  };

  const removeInterval = (index: number) => {
    if (rpmIntervals.length > 1) {
      setRpmIntervals(rpmIntervals.filter((_, i) => i !== index));
    }
  };

  const updateInterval = (
    index: number,
    field: "rpm" | "hp" | "torque",
    value: number
  ) => {
    const updated = [...rpmIntervals];
    updated[index] = { ...updated[index], [field]: value };
    setRpmIntervals(updated);
  };

  if (checking) {
    return (
      <main style={{ padding: 40, textAlign: "center" }}>
        <h1>{t("common.loading")}</h1>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "40px 20px",
        background:
          "radial-gradient(circle at 20% 10%, rgba(34,211,238,0.10), rgba(15,23,42,0.92))",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: 40, textAlign: "center" }}>
          <h1
            style={{
              fontSize: 42,
              fontWeight: 700,
              color: "#00d4ff",
              margin: "0 0 8px 0",
              textShadow: "0 0 20px rgba(0,212,255,0.4)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            ⚡ {t("dynoWars.submit.title")}
          </h1>
          <p
            style={{
              color: "rgba(226,232,240,0.7)",
              fontSize: 15,
              margin: 0,
            }}
          >
            {t("dynoWars.submit.description")}
          </p>
        </div>

        {/* Submission Form */}
        <div
          style={{
            borderRadius: 16,
            padding: 36,
            border: "1px solid rgba(56,189,248,0.35)",
            background: "rgba(2,6,23,0.85)",
            boxShadow: "0 18px 50px rgba(0,0,0,0.6)",
          }}
        >
          <form onSubmit={handleDynoSubmit}>
            {/* Build Name */}
            <div style={{ marginBottom: 24 }}>
              <label
                style={{
                  display: "block",
                  fontWeight: 600,
                  color: "#7dd3fc",
                  fontSize: 12,
                  marginBottom: 8,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Build Name
              </label>
              <input
                type="text"
                name="build_name"
                value={dynoData.engine_name}
                onChange={(e) =>
                  setDynoData({ ...dynoData, engine_name: e.target.value })
                }
                placeholder="e.g., Twin Turbo Build v2"
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: 8,
                  border: "1px solid rgba(148,163,184,0.3)",
                  background: "rgba(2,6,23,0.6)",
                  color: "#e2e8f0",
                  fontSize: 14,
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Short Block Selection */}
            <div style={{ marginBottom: 24 }}>
              <h3
                style={{
                  margin: "0 0 16px 0",
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#7dd3fc",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Engine Specifications
              </h3>

              {/* Row 1: Block Name & Make */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                  marginBottom: 16,
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontWeight: 600,
                      color: "#7dd3fc",
                      fontSize: 12,
                      marginBottom: 8,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Block Name
                  </label>
                  <input
                    type="text"
                    value={engineSpecs.block_name}
                    onChange={(e) =>
                      setEngineSpecs({ ...engineSpecs, block_name: e.target.value })
                    }
                    placeholder="e.g., Small Block Chevy"
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: 8,
                      border: "1px solid rgba(148,163,184,0.3)",
                      background: "rgba(2,6,23,0.6)",
                      color: "#e2e8f0",
                      fontSize: 14,
                      fontFamily: "inherit",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontWeight: 600,
                      color: "#7dd3fc",
                      fontSize: 12,
                      marginBottom: 8,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Engine Make
                  </label>
                  <select
                    value={engineSpecs.engine_make}
                    onChange={(e) =>
                      setEngineSpecs({
                        ...engineSpecs,
                        engine_make: e.target.value,
                        engine_family: "",
                      })
                    }
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: 8,
                      border: "1px solid rgba(148,163,184,0.3)",
                      background: "rgba(2,6,23,0.6)",
                      color: "#e2e8f0",
                      fontSize: 14,
                      fontFamily: "inherit",
                      boxSizing: "border-box",
                      cursor: "pointer",
                    }}
                  >
                    <option value="">Select Make</option>
                    {CAM_MAKE_OPTIONS.map((make) => (
                      <option key={make} value={make}>
                        {make}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Engine Family & Displacement */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                  marginBottom: 16,
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontWeight: 600,
                      color: "#7dd3fc",
                      fontSize: 12,
                      marginBottom: 8,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Engine Family
                  </label>
                  <select
                    value={engineSpecs.engine_family}
                    onChange={(e) =>
                      setEngineSpecs({ ...engineSpecs, engine_family: e.target.value })
                    }
                    disabled={!engineSpecs.engine_make}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: 8,
                      border: "1px solid rgba(148,163,184,0.3)",
                      background: "rgba(2,6,23,0.6)",
                      color: "#e2e8f0",
                      fontSize: 14,
                      fontFamily: "inherit",
                      boxSizing: "border-box",
                      cursor: engineSpecs.engine_make ? "pointer" : "not-allowed",
                      opacity: engineSpecs.engine_make ? 1 : 0.5,
                    }}
                  >
                    <option value="">
                      {!engineSpecs.engine_make
                        ? "Select Make First"
                        : "Select Family"}
                    </option>
                    {engineSpecs.engine_make &&
                      CAM_ENGINE_FAMILIES[
                        engineSpecs.engine_make as keyof typeof CAM_ENGINE_FAMILIES
                      ]?.map((family) => (
                        <option key={family} value={family}>
                          {family}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontWeight: 600,
                      color: "#7dd3fc",
                      fontSize: 12,
                      marginBottom: 8,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Displacement (cc)
                  </label>
                  <input
                    type="text"
                    value={engineSpecs.displacement}
                    onChange={(e) =>
                      setEngineSpecs({ ...engineSpecs, displacement: e.target.value })
                    }
                    placeholder="e.g., 427"
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: 8,
                      border: "1px solid rgba(148,163,184,0.3)",
                      background: "rgba(2,6,23,0.6)",
                      color: "#e2e8f0",
                      fontSize: 14,
                      fontFamily: "inherit",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              {/* Row 3: Bore & Stroke */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                  marginBottom: 16,
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontWeight: 600,
                      color: "#7dd3fc",
                      fontSize: 12,
                      marginBottom: 8,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Bore
                  </label>
                  <input
                    type="text"
                    value={engineSpecs.bore}
                    onChange={(e) =>
                      setEngineSpecs({ ...engineSpecs, bore: e.target.value })
                    }
                    placeholder='e.g., 4.030"'
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: 8,
                      border: "1px solid rgba(148,163,184,0.3)",
                      background: "rgba(2,6,23,0.6)",
                      color: "#e2e8f0",
                      fontSize: 14,
                      fontFamily: "inherit",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontWeight: 600,
                      color: "#7dd3fc",
                      fontSize: 12,
                      marginBottom: 8,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Stroke
                  </label>
                  <input
                    type="text"
                    value={engineSpecs.stroke}
                    onChange={(e) =>
                      setEngineSpecs({ ...engineSpecs, stroke: e.target.value })
                    }
                    placeholder='e.g., 4.00"'
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: 8,
                      border: "1px solid rgba(148,163,184,0.3)",
                      background: "rgba(2,6,23,0.6)",
                      color: "#e2e8f0",
                      fontSize: 14,
                      fontFamily: "inherit",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              {/* Row 4: Deck Height & Rod Length */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                  marginBottom: 16,
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontWeight: 600,
                      color: "#7dd3fc",
                      fontSize: 12,
                      marginBottom: 8,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Deck Height
                  </label>
                  <input
                    type="text"
                    value={engineSpecs.deck_height}
                    onChange={(e) =>
                      setEngineSpecs({ ...engineSpecs, deck_height: e.target.value })
                    }
                    placeholder='e.g., 8.500"'
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: 8,
                      border: "1px solid rgba(148,163,184,0.3)",
                      background: "rgba(2,6,23,0.6)",
                      color: "#e2e8f0",
                      fontSize: 14,
                      fontFamily: "inherit",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontWeight: 600,
                      color: "#7dd3fc",
                      fontSize: 12,
                      marginBottom: 8,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Rod Length
                  </label>
                  <input
                    type="text"
                    value={engineSpecs.rod_length}
                    onChange={(e) =>
                      setEngineSpecs({ ...engineSpecs, rod_length: e.target.value })
                    }
                    placeholder='e.g., 5.700"'
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: 8,
                      border: "1px solid rgba(148,163,184,0.3)",
                      background: "rgba(2,6,23,0.6)",
                      color: "#e2e8f0",
                      fontSize: 14,
                      fontFamily: "inherit",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              {/* Row 5: Piston Dome/Dish & Compression Height */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                  marginBottom: 16,
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontWeight: 600,
                      color: "#7dd3fc",
                      fontSize: 12,
                      marginBottom: 8,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Piston Dome/Dish
                  </label>
                  <input
                    type="text"
                    value={engineSpecs.piston_dome_dish}
                    onChange={(e) =>
                      setEngineSpecs({ ...engineSpecs, piston_dome_dish: e.target.value })
                    }
                    placeholder="e.g., Dome +20cc"
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: 8,
                      border: "1px solid rgba(148,163,184,0.3)",
                      background: "rgba(2,6,23,0.6)",
                      color: "#e2e8f0",
                      fontSize: 14,
                      fontFamily: "inherit",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontWeight: 600,
                      color: "#7dd3fc",
                      fontSize: 12,
                      marginBottom: 8,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Head Gasket Bore
                  </label>
                  <input
                    type="text"
                    value={engineSpecs.head_gasket_bore}
                    onChange={(e) =>
                      setEngineSpecs({ ...engineSpecs, head_gasket_bore: e.target.value })
                    }
                    placeholder='e.g., 4.125"'
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: 8,
                      border: "1px solid rgba(148,163,184,0.3)",
                      background: "rgba(2,6,23,0.6)",
                      color: "#e2e8f0",
                      fontSize: 14,
                      fontFamily: "inherit",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              {/* Row 6: Head Gasket Thickness */}
              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    display: "block",
                    fontWeight: 600,
                    color: "#7dd3fc",
                    fontSize: 12,
                    marginBottom: 8,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Head Gasket Compressed Thickness
                </label>
                <input
                  type="text"
                  value={engineSpecs.head_gasket_compressed_thickness}
                  onChange={(e) =>
                    setEngineSpecs({
                      ...engineSpecs,
                      head_gasket_compressed_thickness: e.target.value,
                    })
                  }
                  placeholder='e.g., 0.040"'
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: 8,
                    border: "1px solid rgba(148,163,184,0.3)",
                    background: "rgba(2,6,23,0.6)",
                    color: "#e2e8f0",
                    fontSize: 14,
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            {/* RPM Intervals Section */}
            <div style={{ marginBottom: 20 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: 16,
                    fontWeight: 700,
                    color: "#7dd3fc",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  RPM Intervals
                </h3>
                <button
                  type="button"
                  onClick={addInterval}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 6,
                    border: "1px solid rgba(0,212,255,0.5)",
                    background: "rgba(0,212,255,0.1)",
                    color: "#00d4ff",
                    fontWeight: 600,
                    fontSize: 12,
                    cursor: "pointer",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(0,212,255,0.2)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(0,212,255,0.1)";
                  }}
                >
                  + Add Interval
                </button>
              </div>

              {rpmIntervals.map((interval, index) => (
                <div
                  key={index}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr auto",
                    gap: 12,
                    marginBottom: 12,
                    padding: 12,
                    borderRadius: 8,
                    background: "rgba(0,212,255,0.05)",
                    border: "1px solid rgba(0,212,255,0.2)",
                  }}
                >
                  {/* RPM */}
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontWeight: 600,
                        color: "#7dd3fc",
                        fontSize: 11,
                        marginBottom: 4,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      RPM
                    </label>
                    <input
                      type="number"
                      value={interval.rpm}
                      onChange={(e) =>
                        updateInterval(index, "rpm", parseInt(e.target.value) || 0)
                      }
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
                    />
                  </div>

                  {/* HP */}
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontWeight: 600,
                        color: "#7dd3fc",
                        fontSize: 11,
                        marginBottom: 4,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      HP
                    </label>
                    <input
                      type="number"
                      value={interval.hp}
                      onChange={(e) =>
                        updateInterval(index, "hp", parseFloat(e.target.value) || 0)
                      }
                      placeholder="0"
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
                    />
                  </div>

                  {/* Torque */}
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontWeight: 600,
                        color: "#7dd3fc",
                        fontSize: 11,
                        marginBottom: 4,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Torque
                    </label>
                    <input
                      type="number"
                      value={interval.torque}
                      onChange={(e) =>
                        updateInterval(index, "torque", parseFloat(e.target.value) || 0)
                      }
                      placeholder="0"
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
                    />
                  </div>

                  {/* Delete Button */}
                  {rpmIntervals.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeInterval(index)}
                      style={{
                        padding: "10px 12px",
                        borderRadius: 6,
                        border: "1px solid rgba(251,113,133,0.3)",
                        background: "rgba(251,113,133,0.1)",
                        color: "#fb7185",
                        fontWeight: 600,
                        cursor: "pointer",
                        fontSize: 12,
                        alignSelf: "flex-end",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(251,113,133,0.2)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "rgba(251,113,133,0.1)";
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Visibility Selector */}
            <div style={{ marginTop: 28, marginBottom: 20 }}>
              <label
                style={{
                  display: "block",
                  fontWeight: 600,
                  color: "#7dd3fc",
                  fontSize: 12,
                  marginBottom: 8,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Visibility
              </label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as "public" | "private")}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: 8,
                  border: "1px solid rgba(148,163,184,0.3)",
                  background: "rgba(2,6,23,0.6)",
                  color: "#e2e8f0",
                  fontSize: 14,
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                  cursor: "pointer",
                }}
              >
                <option value="public">Public (Leaderboard & Profile)</option>
                <option value="private">Private (Profile & Datasets Only)</option>
              </select>
            </div>

            {/* Cam & Head Selection */}
            <div style={{ marginTop: 28, paddingTop: 28, borderTop: "1px solid rgba(56,189,248,0.2)" }}>
              <h3
                style={{
                  margin: "0 0 8px 0",
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#7dd3fc",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                🔧 Required: Select Cam & Head
              </h3>
              <p
                style={{
                  margin: "0 0 20px 0",
                  fontSize: 12,
                  color: "rgba(226,232,240,0.7)",
                  fontStyle: "italic",
                }}
              >
                Essential for data set collection and proof of work. Improves calculator accuracy without skewed data.
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 24,
                  marginBottom: 20,
                }}
              >
                {/* Cam Selector */}
                <SearchableDropdown
                  label="Cam Selection"
                  placeholder={
                    !engineSpecs.engine_make || !engineSpecs.engine_family
                      ? "Select make & family first"
                      : camsLoading
                      ? "Loading cams..."
                      : "Choose a cam"
                  }
                  items={availableCams}
                  selectedId={selectedCamId}
                  onSelect={setSelectedCamId}
                  buttonLabel="Submit Cam"
                  onButtonClick={() => router.push("/cams/new")}
                  disabled={!engineSpecs.engine_make || !engineSpecs.engine_family || camsLoading}
                />

                {/* Head Selector */}
                <SearchableDropdown
                  label="Head Selection"
                  placeholder={
                    !engineSpecs.engine_make || !engineSpecs.engine_family
                      ? "Select make & family first"
                      : headsLoading
                      ? "Loading heads..."
                      : "Choose a head"
                  }
                  items={availableHeads}
                  selectedId={selectedHeadId}
                  onSelect={setSelectedHeadId}
                  buttonLabel="Submit Head"
                  onButtonClick={() => router.push("/cylinder-heads/submit")}
                  disabled={!engineSpecs.engine_make || !engineSpecs.engine_family || headsLoading}
                />
              </div>
            </div>

            {/* Image Uploads Section */}
            <div style={{ marginTop: 28, paddingTop: 28, borderTop: "1px solid rgba(56,189,248,0.2)" }}>
              <h3
                style={{
                  margin: "0 0 16px 0",
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#7dd3fc",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                📸 Required Photos (All 3 Required)
              </h3>

              {/* Dyno Graph Photo */}
              <div style={{ marginBottom: 20 }}>
                <label
                  style={{
                    display: "block",
                    fontWeight: 600,
                    color: "#7dd3fc",
                    fontSize: 13,
                    marginBottom: 8,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  📊 Dyno Graph Photo *
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/jpg"
                  onChange={(e) => setDynoGraphFile(e.target.files?.[0] || null)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: 8,
                    border: `2px ${dynoGraphFile ? "solid rgba(34,197,94,0.5)" : "dashed rgba(148,163,184,0.3)"}`,
                    background: "rgba(2,6,23,0.6)",
                    color: "#e2e8f0",
                    fontSize: 13,
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                    cursor: "pointer",
                  }}
                />
                {dynoGraphFile && (
                  <div style={{ color: "#86efac", fontSize: 12, marginTop: 6 }}>
                    ✓ {dynoGraphFile.name}
                  </div>
                )}
              </div>

              {/* Cam Card Photo */}
              <div style={{ marginBottom: 20 }}>
                <label
                  style={{
                    display: "block",
                    fontWeight: 600,
                    color: "#7dd3fc",
                    fontSize: 13,
                    marginBottom: 8,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  🔧 Cam Card Photo *
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,application/pdf"
                  onChange={(e) => setCamCardFile(e.target.files?.[0] || null)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: 8,
                    border: `2px ${camCardFile ? "solid rgba(34,197,94,0.5)" : "dashed rgba(148,163,184,0.3)"}`,
                    background: "rgba(2,6,23,0.6)",
                    color: "#e2e8f0",
                    fontSize: 13,
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                    cursor: "pointer",
                  }}
                />
                {camCardFile && (
                  <div style={{ color: "#86efac", fontSize: 12, marginTop: 6 }}>
                    ✓ {camCardFile.name}
                  </div>
                )}
              </div>

              {/* Car Photo */}
              <div style={{ marginBottom: 20 }}>
                <label
                  style={{
                    display: "block",
                    fontWeight: 600,
                    color: "#7dd3fc",
                    fontSize: 13,
                    marginBottom: 8,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  🏎️ Car Photo *
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/jpg"
                  onChange={(e) => setCarPhotoFile(e.target.files?.[0] || null)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: 8,
                    border: `2px ${carPhotoFile ? "solid rgba(34,197,94,0.5)" : "dashed rgba(148,163,184,0.3)"}`,
                    background: "rgba(2,6,23,0.6)",
                    color: "#e2e8f0",
                    fontSize: 13,
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                    cursor: "pointer",
                  }}
                />
                {carPhotoFile && (
                  <div style={{ color: "#86efac", fontSize: 12, marginTop: 6 }}>
                    ✓ {carPhotoFile.name}
                  </div>
                )}
              </div>
            </div>

            {/* Submit Section */}
            <div style={{ marginTop: 28 }}>
              {submissionMsg && (
                <div
                  style={{
                    padding: 16,
                    borderRadius: 8,
                    marginBottom: 16,
                    background:
                      submissionMsg.includes("successful") ||
                      submissionMsg.includes("🎉")
                        ? "rgba(34,197,94,0.1)"
                        : "rgba(239,68,68,0.1)",
                    border:
                      submissionMsg.includes("successful") ||
                      submissionMsg.includes("🎉")
                        ? "1px solid rgba(34,197,94,0.3)"
                        : "1px solid rgba(239,68,68,0.3)",
                    color:
                      submissionMsg.includes("successful") ||
                      submissionMsg.includes("🎉")
                        ? "#86efac"
                        : "#fca5a5",
                    fontSize: 14,
                  }}
                >
                  {submissionMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={!rpmIntervals.length || !rpmIntervals[0]?.hp || !dynoGraphFile || !camCardFile || !carPhotoFile || !selectedCamId || !selectedHeadId || submitting}
                style={{
                  width: "100%",
                  padding: "14px 24px",
                  borderRadius: 8,
                  border: "none",
                  background:
                    !rpmIntervals.length || !rpmIntervals[0]?.hp || !dynoGraphFile || !camCardFile || !carPhotoFile || !selectedCamId || !selectedHeadId || submitting
                      ? "rgba(56,189,248,0.3)"
                      : "linear-gradient(135deg, #00d4ff 0%, #0099ff 100%)",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: !rpmIntervals.length || !rpmIntervals[0]?.hp || !dynoGraphFile || !camCardFile || !carPhotoFile || !selectedCamId || !selectedHeadId || submitting ? "not-allowed" : "pointer",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  transition: "all 0.3s ease",
                  opacity: !rpmIntervals.length || !rpmIntervals[0]?.hp || !dynoGraphFile || !camCardFile || !carPhotoFile || !selectedCamId || !selectedHeadId || submitting ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!rpmIntervals.length || !rpmIntervals[0]?.hp || !dynoGraphFile || !camCardFile || !carPhotoFile || !selectedCamId || !selectedHeadId || submitting) return;
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 10px 30px rgba(0,212,255,0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {submitting ? "Submitting..." : "Submit Dyno Results"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
