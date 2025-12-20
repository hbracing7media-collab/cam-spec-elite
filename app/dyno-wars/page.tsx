"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CAM_MAKE_OPTIONS, CAM_ENGINE_FAMILIES } from "@/lib/engineOptions";
import { DynoGraph } from "@/components/DynoGraph";

interface DynoEntry {
  id: string;
  engine_name: string;
  user_id: string;
  horsepower?: number;
  torque?: number;
  engine_make?: string;
  engine_family?: string;
  car_name?: string;
  created_at: string;
  spec?: {
    rpm_intervals?: Array<{ rpm: number; hp: number; torque: number }>;
  };
}

export default function DynoWarsPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [entries, setEntries] = useState<DynoEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<DynoEntry[]>([]);
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedMake, setSelectedMake] = useState<string>("");
  const [selectedFamily, setSelectedFamily] = useState<string>("");
  const [selectedCar, setSelectedCar] = useState<string>("");

  const [uniqueMakes, setUniqueMakes] = useState<string[]>([]);
  const [uniqueFamilies, setUniqueFamilies] = useState<string[]>([]);
  const [uniqueCars, setUniqueCars] = useState<string[]>([]);

  // Check auth and load dyno data
  useEffect(() => {
    const checkAuth = async () => {
      const res = await fetch("/api/auth/me");
      if (!res.ok) {
        router.replace("/auth/login");
      } else {
        setChecking(false);
        await loadDynoData();
        
        // Auto-refresh every 10 seconds
        const interval = setInterval(loadDynoData, 10000);
        return () => clearInterval(interval);
      }
    };
    checkAuth();
  }, [router]);

  // Load all dyno entries from engine submissions
  const loadDynoData = async () => {
    try {
      const res = await fetch("/api/dyno-wars/leaderboard");
      if (res.ok) {
        const data = await res.json();
        const filtered = data.entries.filter(
          (e: DynoEntry) => e.horsepower || e.torque
        );
        setEntries(filtered);
        
        // Extract unique values for dropdowns
        const makes = Array.from(
          new Set(filtered.map((e: DynoEntry) => e.engine_make).filter(Boolean))
        ) as string[];
        const cars = Array.from(
          new Set(filtered.map((e: DynoEntry) => e.car_name).filter(Boolean))
        ) as string[];
        
        setUniqueMakes(makes.sort());
        setUniqueCars(cars.sort());
        setFilteredEntries(filtered);
      }
    } catch (err) {
      console.error("Failed to load dyno data:", err);
    }
  };

  // Update families when make changes
  useEffect(() => {
    if (selectedMake) {
      const families =
        CAM_ENGINE_FAMILIES[selectedMake as keyof typeof CAM_ENGINE_FAMILIES] ||
        [];
      setUniqueFamilies(families);
      setSelectedFamily("");
    } else {
      const allFamilies = Array.from(
        new Set(entries.map((e) => e.engine_family).filter(Boolean))
      ) as string[];
      setUniqueFamilies(allFamilies);
    }
  }, [selectedMake, entries]);

  // Apply filters
  useEffect(() => {
    let filtered = entries;

    if (selectedMake) {
      filtered = filtered.filter((e) => e.engine_make === selectedMake);
    }
    if (selectedFamily) {
      filtered = filtered.filter((e) => e.engine_family === selectedFamily);
    }
    if (selectedCar) {
      filtered = filtered.filter((e) => e.car_name === selectedCar);
    }

    setFilteredEntries(filtered);
  }, [selectedMake, selectedFamily, selectedCar, entries]);

  if (checking) {
    return (
      <main style={{ padding: 40, textAlign: "center" }}>
        <h1>Loading...</h1>
      </main>
    );
  }

  // Sort entries by horsepower and torque
  const hpLeaderboard = [...filteredEntries]
    .filter((e) => e.horsepower)
    .sort((a, b) => (b.horsepower || 0) - (a.horsepower || 0))
    .slice(0, 20);

  const torqueLeaderboard = [...filteredEntries]
    .filter((e) => e.torque)
    .sort((a, b) => (b.torque || 0) - (a.torque || 0))
    .slice(0, 20);

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
          maxWidth: "1400px",
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
            ⚡ Dyno Wars
          </h1>
          <p
            style={{
              color: "rgba(226,232,240,0.7)",
              fontSize: 15,
              margin: "0 0 16px 0",
            }}
          >
            Peak Performance Leaderboards
          </p>
          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={() => router.push("/dyno-wars/submit")}
              style={{
                padding: "10px 20px",
                borderRadius: 8,
                border: "1px solid rgba(56,189,248,0.5)",
                background: "rgba(56,189,248,0.2)",
                color: "#7dd3fc",
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              + Submit Your Dyno
            </button>
            <button
              onClick={async () => {
                setRefreshing(true);
                await loadDynoData();
                setRefreshing(false);
              }}
              disabled={refreshing}
              style={{
                padding: "10px 20px",
                borderRadius: 8,
                border: "1px solid rgba(100,116,139,0.5)",
                background: "rgba(100,116,139,0.2)",
                color: "#cbd5e1",
                fontWeight: 700,
                fontSize: 14,
                cursor: refreshing ? "not-allowed" : "pointer",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                opacity: refreshing ? 0.6 : 1,
              }}
            >
              {refreshing ? "🔄 Refreshing..." : "🔄 Refresh"}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: 16,
            marginBottom: 32,
          }}
        >
          <div>
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
              Engine Make
            </label>
            <select
              value={selectedMake}
              onChange={(e) => setSelectedMake(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid rgba(56,189,248,0.3)",
                background: "rgba(2,6,23,0.8)",
                color: "#e2e8f0",
                fontSize: 14,
                fontFamily: "inherit",
                cursor: "pointer",
              }}
            >
              <option value="">All Makes</option>
              {uniqueMakes.map((make) => (
                <option key={make} value={make}>
                  {make}
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
                fontSize: 13,
                marginBottom: 8,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Engine Family
            </label>
            <select
              value={selectedFamily}
              onChange={(e) => setSelectedFamily(e.target.value)}
              disabled={!uniqueFamilies.length}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid rgba(56,189,248,0.3)",
                background: "rgba(2,6,23,0.8)",
                color: "#e2e8f0",
                fontSize: 14,
                fontFamily: "inherit",
                cursor: uniqueFamilies.length ? "pointer" : "not-allowed",
                opacity: uniqueFamilies.length ? 1 : 0.5,
              }}
            >
              <option value="">All Families</option>
              {uniqueFamilies.map((family) => (
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
                fontSize: 13,
                marginBottom: 8,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Car/Build
            </label>
            <select
              value={selectedCar}
              onChange={(e) => setSelectedCar(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid rgba(56,189,248,0.3)",
                background: "rgba(2,6,23,0.8)",
                color: "#e2e8f0",
                fontSize: 14,
                fontFamily: "inherit",
                cursor: "pointer",
              }}
            >
              <option value="">All Cars</option>
              {uniqueCars.map((car) => (
                <option key={car} value={car}>
                  {car}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Leaderboards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(500px, 1fr))",
            gap: 24,
          }}
        >
          {/* Horsepower Leaderboard */}
          <div
            style={{
              borderRadius: 16,
              padding: 24,
              border: "1px solid rgba(56,189,248,0.35)",
              background: "rgba(2,6,23,0.85)",
              boxShadow: "0 18px 50px rgba(0,0,0,0.6)",
            }}
          >
            <h2
              style={{
                margin: "0 0 20px 0",
                fontSize: 20,
                fontWeight: 700,
                color: "#fbbf24",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              🏎️ Horsepower Rankings
            </h2>

            {hpLeaderboard.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {hpLeaderboard.map((entry, idx) => {
                  const isExpanded = expandedEntryId === entry.id;
                  const hasRpmData = entry.spec?.rpm_intervals && entry.spec.rpm_intervals.length > 0;
                  
                  return (
                    <div
                      key={entry.id}
                      style={{
                        borderRadius: 8,
                        background:
                          idx === 0
                            ? "rgba(251,191,36,0.12)"
                            : idx === 1
                            ? "rgba(148,163,184,0.12)"
                            : idx === 2
                            ? "rgba(205,92,92,0.12)"
                            : "rgba(0,212,255,0.05)",
                        border:
                          idx === 0
                            ? "1px solid rgba(251,191,36,0.4)"
                            : idx === 1
                            ? "1px solid rgba(148,163,184,0.4)"
                            : idx === 2
                            ? "1px solid rgba(205,92,92,0.4)"
                            : "1px solid rgba(56,189,248,0.2)",
                      }}
                    >
                      <div
                        style={{
                          padding: 14,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              marginBottom: 6,
                            }}
                          >
                            <span
                              style={{
                                fontSize: 18,
                                fontWeight: 700,
                                color:
                                  idx === 0
                                    ? "#fbbf24"
                                    : idx === 1
                                    ? "#d1d5db"
                                    : idx === 2
                                    ? "#cd5c5c"
                                    : "#7dd3fc",
                                width: 28,
                              }}
                            >
                              {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
                            </span>
                            <div style={{ flex: 1 }}>
                              <div
                                style={{
                                  fontWeight: 700,
                                  color: "#00d4ff",
                                  fontSize: 14,
                                }}
                              >
                                {entry.engine_name}
                              </div>
                              <div
                                style={{
                                  fontSize: 12,
                                  color: "rgba(226,232,240,0.6)",
                                }}
                              >
                                {entry.engine_make}
                                {entry.engine_family && ` • ${entry.engine_family}`}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div
                          style={{
                            textAlign: "right",
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                          }}
                        >
                          <div>
                            <div
                              style={{
                                fontSize: 16,
                                fontWeight: 700,
                                color: "#fbbf24",
                              }}
                            >
                              {entry.horsepower} hp
                            </div>
                            <div
                              style={{
                                fontSize: 11,
                                color: "rgba(226,232,240,0.5)",
                              }}
                            >
                              {new Date(entry.created_at).toLocaleDateString()}
                            </div>
                          </div>
                          {hasRpmData && (
                            <button
                              onClick={() => setExpandedEntryId(isExpanded ? null : entry.id)}
                              style={{
                                padding: "6px 12px",
                                borderRadius: 4,
                                border: "1px solid rgba(56,189,248,0.3)",
                                background: "rgba(56,189,248,0.15)",
                                color: "#7dd3fc",
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: "pointer",
                              }}
                            >
                              {isExpanded ? "▼ Hide" : "▶ Graph"}
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {isExpanded && hasRpmData && (
                        <div
                          style={{
                            padding: "0 14px 14px 14px",
                            borderTop: "1px solid rgba(56,189,248,0.15)",
                          }}
                        >
                          <DynoGraph
                            rpmIntervals={entry.spec!.rpm_intervals!}
                            engineName={entry.engine_name}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div
                style={{
                  padding: 20,
                  textAlign: "center",
                  color: "rgba(226,232,240,0.5)",
                }}
              >
                No horsepower data available
              </div>
            )}
          </div>

          {/* Torque Leaderboard */}
          <div
            style={{
              borderRadius: 16,
              padding: 24,
              border: "1px solid rgba(56,189,248,0.35)",
              background: "rgba(2,6,23,0.85)",
              boxShadow: "0 18px 50px rgba(0,0,0,0.6)",
            }}
          >
            <h2
              style={{
                margin: "0 0 20px 0",
                fontSize: 20,
                fontWeight: 700,
                color: "#f472b6",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              💪 Torque Rankings
            </h2>

            {torqueLeaderboard.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {torqueLeaderboard.map((entry, idx) => (
                  <div
                    key={entry.id}
                    style={{
                      padding: 14,
                      borderRadius: 8,
                      background:
                        idx === 0
                          ? "rgba(244,114,182,0.12)"
                          : idx === 1
                          ? "rgba(148,163,184,0.12)"
                          : idx === 2
                          ? "rgba(205,92,92,0.12)"
                          : "rgba(0,212,255,0.05)",
                      border:
                        idx === 0
                          ? "1px solid rgba(244,114,182,0.4)"
                          : idx === 1
                          ? "1px solid rgba(148,163,184,0.4)"
                          : idx === 2
                          ? "1px solid rgba(205,92,92,0.4)"
                          : "1px solid rgba(56,189,248,0.2)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          marginBottom: 6,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 18,
                            fontWeight: 700,
                            color:
                              idx === 0
                                ? "#f472b6"
                                : idx === 1
                                ? "#d1d5db"
                                : idx === 2
                                ? "#cd5c5c"
                                : "#7dd3fc",
                            width: 28,
                          }}
                        >
                          {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
                        </span>
                        <div>
                          <div
                            style={{
                              fontWeight: 700,
                              color: "#00d4ff",
                              fontSize: 14,
                            }}
                          >
                            {entry.engine_name}
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              color: "rgba(226,232,240,0.6)",
                            }}
                          >
                            {entry.engine_make}
                            {entry.engine_family && ` • ${entry.engine_family}`}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        textAlign: "right",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 16,
                          fontWeight: 700,
                          color: "#f472b6",
                        }}
                      >
                        {entry.torque} lb-ft
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "rgba(226,232,240,0.5)",
                        }}
                      >
                        {new Date(entry.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  padding: 20,
                  textAlign: "center",
                  color: "rgba(226,232,240,0.5)",
                }}
              >
                No torque data available
              </div>
            )}
          </div>
        </div>

        {/* Back Button */}
        <div
          style={{
            marginTop: 32,
            textAlign: "center",
          }}
        >
          <button
            onClick={() => router.back()}
            style={{
              padding: "10px 20px",
              borderRadius: 8,
              border: "1px solid rgba(56,189,248,0.3)",
              background: "rgba(56,189,248,0.1)",
              color: "#7dd3fc",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            ← Back
          </button>
        </div>
      </div>
    </main>
  );
}
