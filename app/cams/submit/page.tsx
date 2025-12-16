"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type MakeKey =
  | "Ford" | "GM" | "Mopar" | "Toyota" | "Honda" | "Nissan" | "Mazda"
  | "Subaru" | "Mitsubishi" | "VW/Audi" | "BMW" | "Mercedes" | "Hyundai/Kia" | "Other";

const ENGINE_FAMILIES: Record<MakeKey, string[]> = {
  Ford: ["Small Block Windsor", "Small Block Cleveland", "Modular 4.6/5.4", "Coyote 5.0", "Godzilla 7.3", "FE Big Block", "385 Series (429/460)", "EcoBoost 2.3", "EcoBoost 2.7/3.0/3.5"],
  GM: ["LS (Gen III/IV)", "LT (Gen V)", "Small Block Chevy (SBC)", "Big Block Chevy (BBC)", "Gen I/II LT1/LT4 (90s)", "Ecotec", "Duramax"],
  Mopar: ["Gen III HEMI (5.7/6.1/6.4)", "Hellcat 6.2", "LA Small Block", "Magnum Small Block", "B/RB Big Block", "Slant-6"],
  Toyota: ["2JZ", "1JZ", "3S", "1UZ/3UZ", "2UZ", "GR (3.5/4.0/4.3)"],
  Honda: ["B-Series", "K-Series", "D-Series", "H/F-Series", "J-Series"],
  Nissan: ["SR20", "RB (RB20/25/26)", "VQ (VQ35/37)", "VR30", "KA24"],
  Mazda: ["BP", "13B Rotary", "MZR/Duratec", "Skyactiv"],
  Subaru: ["EJ", "FA/FB"],
  Mitsubishi: ["4G63", "4B11"],
  "VW/Audi": ["1.8T", "2.0T EA888", "VR6", "5-Cyl (07K)", "Audi V6T/V8"],
  BMW: ["N54", "N55", "B58", "S55", "S58"],
  Mercedes: ["M113", "M156", "M157", "M177/M178", "OM606"],
  "Hyundai/Kia": ["Theta II 2.0T", "Lambda V6", "Smartstream"],
  Other: ["Other/Custom"],
};

function makeSupabaseBrowser(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY");
  return createClient(url, anon);
}

const labelStyle: React.CSSProperties = { fontSize: 12, color: "#cbd5f5" };
const inputStyle: React.CSSProperties = {
  width: "100%",
  marginTop: 6,
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid rgba(148,163,184,0.25)",
  background: "rgba(2,6,23,0.55)",
  color: "#e5e7eb",
  outline: "none",
};

export default function CamSubmitPage(): React.JSX.Element {
  const supabase = useMemo(() => makeSupabaseBrowser(), []);
  const [userId, setUserId] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [debug, setDebug] = useState("");

  const [camName, setCamName] = useState("");
  const [engineMake, setEngineMake] = useState<MakeKey>("Ford");
  const [engineFamily, setEngineFamily] = useState<string>(ENGINE_FAMILIES.Ford[0] ?? "");

  const [durInt050, setDurInt050] = useState("");
  const [durExh050, setDurExh050] = useState("");
  const [liftInt, setLiftInt] = useState("");
  const [liftExh, setLiftExh] = useState("");
  const [advInt, setAdvInt] = useState("");
  const [advExh, setAdvExh] = useState("");
  const [lsa, setLsa] = useState("");
  const [icl, setIcl] = useState("");
  const [ecl, setEcl] = useState("");
  const [lashInt, setLashInt] = useState("");
  const [lashExh, setLashExh] = useState("");

  const [camCard, setCamCard] = useState<File | null>(null);
  const [dynoSheets, setDynoSheets] = useState<File[]>([]);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const fam = ENGINE_FAMILIES[engineMake];
    setEngineFamily(fam?.[0] ?? "");
  }, [engineMake]);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      setUserId(data.session?.user?.id ?? "");

      const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
        setUserId(session?.user?.id ?? "");
      });

      return () => sub.subscription.unsubscribe();
    };

    void init();
  }, [supabase]);

  const families = ENGINE_FAMILIES[engineMake] ?? [];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg("");
    setDebug("");

    if (!userId) return setMsg("You must be logged in to submit.");
    if (!camName.trim()) return setMsg("Cam name required.");
    if (!camCard) return setMsg("Cam card is required.");

    setLoading(true);

    try {
      const spec = {
        dur_int_050: durInt050 || null,
        dur_exh_050: durExh050 || null,
        lift_int: liftInt || null,
        lift_exh: liftExh || null,
        adv_int: advInt || null,
        adv_exh: advExh || null,
        lsa: lsa || null,
        icl: icl || null,
        ecl: ecl || null,
        lash_int: lashInt || null,
        lash_exh: lashExh || null,
      };

      // ✅ ALWAYS multipart/form-data
      const fd = new FormData();
      fd.append("cam_name", camName.trim());
      fd.append("engine_make", engineMake);
      fd.append("engine_family", engineFamily);
      fd.append("notes", notes);
      fd.append("spec_json", JSON.stringify(spec));
      fd.append("cam_card", camCard);

      for (const f of dynoSheets) fd.append("dyno_sheets", f);

      setDebug("Posting FormData to /api/cams/create ...");

      // ✅ NO headers set here. Browser will set multipart boundary.
      const res = await fetch("/api/cams/create", {
        method: "POST",
        body: fd,
        credentials: "include",
      });

      const text = await res.text();
      setDebug(`HTTP ${res.status}\n${text}`);

      let payload: any = {};
      try { payload = JSON.parse(text); } catch {}

      if (!res.ok || !payload.ok) {
        setMsg(payload.error ?? `Submit failed (HTTP ${res.status})`);
        return;
      }

      setMsg("Submitted for approval ✅");
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : "Submit failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 980, margin: "0 auto", padding: 16, color: "#e5e7eb", fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif" }}>
      <div style={{ borderRadius: 18, padding: 18, background: "radial-gradient(circle at top left, rgba(56,189,248,0.18), rgba(2,6,23,0.92))", border: "1px solid rgba(56,189,248,0.35)", boxShadow: "0 18px 46px rgba(0,0,0,0.65)" }}>
        <h1 style={{ margin: 0, letterSpacing: "0.12em", textTransform: "uppercase", fontSize: 16, color: "#7dd3fc", textAlign: "center" }}>
          Cam Submission
        </h1>

        <form onSubmit={handleSubmit} encType="multipart/form-data" style={{ marginTop: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
            <label style={labelStyle}>
              Cam Name (required)
              <input value={camName} onChange={(e) => setCamName(e.target.value)} style={inputStyle} />
            </label>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <label style={labelStyle}>
                Engine Make
                <select value={engineMake} onChange={(e) => setEngineMake(e.target.value as MakeKey)} style={inputStyle}>
                  {(Object.keys(ENGINE_FAMILIES) as MakeKey[]).map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </label>

              <label style={labelStyle}>
                Engine Family
                <select value={engineFamily} onChange={(e) => setEngineFamily(e.target.value)} style={inputStyle}>
                  {families.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </label>
            </div>

            <label style={labelStyle}>
              Cam Card (required)
              <input type="file" accept="image/*,application/pdf" onChange={(e) => setCamCard(e.target.files?.[0] ?? null)} style={{ marginTop: 8 }} />
            </label>

            <label style={labelStyle}>
              Dyno Sheets (optional)
              <input type="file" multiple accept="image/*,application/pdf" onChange={(e) => setDynoSheets(Array.from(e.target.files ?? []))} style={{ marginTop: 8 }} />
            </label>

            <label style={labelStyle}>
              Notes (optional)
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} style={{ ...inputStyle, minHeight: 90 }} />
            </label>

            <button
              type="submit"
              disabled={loading}
              style={{
                borderRadius: 14,
                padding: "12px 14px",
                border: "1px solid rgba(34,211,238,0.6)",
                background: "linear-gradient(90deg, rgba(34,211,238,0.25), rgba(236,72,153,0.18))",
                color: "#e5e7eb",
                fontWeight: 800,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: "0 12px 26px rgba(0,0,0,0.55)",
              }}
            >
              {loading ? "Submitting..." : "Submit for Approval"}
            </button>

            {msg ? <div style={{ fontSize: 12, color: msg.includes("✅") ? "#86efac" : "#fda4af" }}>{msg}</div> : null}

            {debug ? (
              <pre style={{ marginTop: 8, padding: 12, borderRadius: 12, background: "rgba(2,6,23,0.6)", border: "1px solid rgba(148,163,184,0.2)", fontSize: 11, whiteSpace: "pre-wrap" }}>
                {debug}
              </pre>
            ) : null}
          </div>
        </form>
      </div>
    </main>
  );
}
