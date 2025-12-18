"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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

export default function CamsPage() {
  const isAuthed = useAuthCheck();
  const router = useRouter();
  const [selectedMake, setSelectedMake] = useState<MakeKey | "">("");
  const [engineFamily, setEngineFamily] = useState("");

  function handleSearch() {
    if (!selectedMake || !engineFamily.trim()) {
      alert("Please select engine make and engine family.");
      return;
    }
    router.push(
      `/cams/browse?make=${encodeURIComponent(selectedMake)}&family=${encodeURIComponent(engineFamily)}`
    );
  }

  const familyOptions = selectedMake ? ENGINE_FAMILIES[selectedMake] : [];

  if (isAuthed === null) return <div style={{ padding: 20, textAlign: "center" }}>Loading...</div>;

  return (
    <main style={{ padding: 20, maxWidth: 600, margin: "0 auto" }}>
      <div style={{ display: "flex", gap: 10, marginBottom: 20, justifyContent: "center" }}>
        <Link href="/cams/new" className="pill" style={{ textDecoration: "none" }}>Submit Cam</Link>
      </div>
      <div
        style={{
          borderRadius: 18,
          padding: 30,
          border: "1px solid rgba(56,189,248,0.35)",
          background: "radial-gradient(circle at 20% 10%, rgba(34,211,238,0.16), rgba(15,23,42,0.92))",
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
            color: "#7dd3fc",
          }}
        >
          Browse Cams
        </h1>

        <p
          style={{
            marginTop: 0,
            marginBottom: 24,
            color: "rgba(226,232,240,0.8)",
            fontSize: 13,
          }}
        >
          Select your engine to view approved cam specifications.
        </p>

        <div style={{ marginBottom: 24 }}>
          <label
            style={{
              display: "block",
              fontSize: 12,
              fontWeight: 600,
              color: "#7dd3fc",
              marginBottom: 8,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Engine Make
          </label>
          <select
            value={selectedMake}
            onChange={(e) => {
              setSelectedMake(e.target.value as MakeKey);
              setEngineFamily("");
            }}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: 8,
              border: "1px solid rgba(148,163,184,0.3)",
              background: "rgba(2,6,23,0.6)",
              color: "#e2e8f0",
              fontSize: 13,
              cursor: "pointer",
              fontFamily: "inherit",
              boxSizing: "border-box",
            }}
          >
            <option value="">— Select Make —</option>
            {MAKE_OPTIONS.map((make) => (
              <option key={make} value={make}>
                {make}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label
            style={{
              display: "block",
              fontSize: 12,
              fontWeight: 600,
              color: "#7dd3fc",
              marginBottom: 8,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Engine Family
          </label>
          <select
            value={engineFamily}
            onChange={(e) => setEngineFamily(e.target.value)}
            disabled={!selectedMake}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: 8,
              border: "1px solid rgba(148,163,184,0.3)",
              background: "rgba(2,6,23,0.6)",
              color: "#e2e8f0",
              fontSize: 13,
              cursor: selectedMake ? "pointer" : "not-allowed",
              fontFamily: "inherit",
              boxSizing: "border-box",
            }}
          >
            <option value="">— Select Family —</option>
            {familyOptions.map((fam) => (
              <option key={fam} value={fam}>
                {fam}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={handleSearch}
          disabled={!selectedMake || !engineFamily}
          style={{
            width: "100%",
            padding: "12px 16px",
            borderRadius: 8,
            border: "1px solid rgba(56,189,248,0.5)",
            background:
              selectedMake && engineFamily
                ? "rgba(56,189,248,0.2)"
                : "rgba(100,116,139,0.1)",
            color: "#7dd3fc",
            cursor: selectedMake && engineFamily ? "pointer" : "not-allowed",
            fontWeight: 700,
            fontSize: 13,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Search Cams
        </button>
      </div>
    </main>
  );
}