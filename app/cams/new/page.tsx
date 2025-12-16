"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "../../../lib/supabase/browser";

type Msg = { type: "ok" | "err" | "info"; text: string };

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

function safeName(name: string) {
  return name.replace(/[^\w.\-]+/g, "_");
}

export default function NewCamSubmissionPage() {
  const supabase = useMemo(() => supabaseBrowser(), []);

  const [userId, setUserId] = useState<string>("");
  const [email, setEmail] = useState<string>("");

  const [camName, setCamName] = useState("");
  const [brand, setBrand] = useState("");
  const [partNumber, setPartNumber] = useState("");

  const [engineMake, setEngineMake] = useState<MakeKey>("Ford");
  const [engineFamily, setEngineFamily] = useState<string>(ENGINE_FAMILIES["Ford"][0]);

  const [lsa, setLsa] = useState<number | "">("");
  const [icl, setIcl] = useState<number | "">("");
  const [durInt050, setDurInt050] = useState<number | "">("");
  const [durExh050, setDurExh050] = useState<number | "">("");
  const [advInt, setAdvInt] = useState<number | "">("");
  const [advExh, setAdvExh] = useState<number | "">("");
  const [liftInt, setLiftInt] = useState<number | "">("");
  const [liftExh, setLiftExh] = useState<number | "">("");
  const [rocker, setRocker] = useState<number | "">("");
  const [lashInt, setLashInt] = useState<number | "">("");
  const [lashExh, setLashExh] = useState<number | "">("");
  const [notes, setNotes] = useState("");

  const [camCardFile, setCamCardFile] = useState<File | null>(null);
  const [dynoFiles, setDynoFiles] = useState<File[]>([]);

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Msg | null>(null);

  // Make -> Family reset
  useEffect(() => {
    const list = ENGINE_FAMILIES[engineMake] ?? ENGINE_FAMILIES["Other"];
    setEngineFamily(list[0]);
  }, [engineMake]);

  // ✅ REAL login detection: ask the server (cookie session)
  useEffect(() => {
    (async () => {
      const res = await fetch("/api/auth/whoami", { cache: "no-store" }).catch(() => null);
      if (!res || !res.ok) {
        setUserId("");
        setEmail("");
        setMsg({ type: "info", text: "Log in to submit a cam." });
        return;
      }
      const j: any = await res.json().catch(() => ({}));
      if (!j?.ok || !j?.id) {
        setUserId("");
        setEmail("");
        setMsg({ type: "info", text: "Log in to submit a cam." });
        return;
      }
      setUserId(String(j.id));
      setEmail(String(j.email || ""));
      setMsg(null);
    })();
  }, []);

  const familyOptions = ENGINE_FAMILIES[engineMake] ?? ENGINE_FAMILIES["Other"];

  async function uploadToBucket(bucket: "cam_cards" | "dyno_sheets", file: File) {
    if (!userId) throw new Error("You must be logged in to submit.");

    const objectPath = `${userId}/${safeName(engineMake)}/${safeName(engineFamily)}/${crypto.randomUUID()}_${safeName(
      file.name
    )}`;

    const { error } = await supabase.storage.from(bucket).upload(objectPath, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
      metadata: {
        approved: "false",
        kind: bucket === "cam_cards" ? "cam_card" : "dyno_sheet",
        uploaded_by: userId,
        uploader_email: email || "",
        cam_name: camName || "",
        brand: brand || "",
        part_number: partNumber || "",
        engine_make: engineMake || "",
        engine_family: engineFamily || "",
      },
    });

    if (error) throw new Error(error.message);
    return objectPath;
  }

  async function submit() {
    setMsg(null);

    if (!userId) return setMsg({ type: "err", text: "You must be logged in to submit." });

    const cn = camName.trim();
    const br = brand.trim();
    const pn = partNumber.trim();

    if (!cn) return setMsg({ type: "err", text: "Cam Name is required." });
    if (!br) return setMsg({ type: "err", text: "Brand is required." });
    if (!pn) return setMsg({ type: "err", text: "Part Number is required." });
    if (!engineFamily) return setMsg({ type: "err", text: "Engine Family is required." });
    if (!camCardFile) return setMsg({ type: "err", text: "Cam Card file is required." });

    setBusy(true);
    try {
      const spec = {
        cam_name: cn,
        brand: br,
        part_number: pn,
        engine_make: engineMake,
        engine_family: engineFamily,

        lsa,
        icl,
        duration_int_050: durInt050,
        duration_exh_050: durExh050,
        advertised_int: advInt,
        advertised_exh: advExh,
        lift_int: liftInt,
        lift_exh: liftExh,
        rocker_ratio: rocker,
        lash_int: lashInt,
        lash_exh: lashExh,

        notes,
      };

      const camCardObject = await uploadToBucket("cam_cards", camCardFile);

      const dynoObjects: string[] = [];
      for (const f of dynoFiles) dynoObjects.push(await uploadToBucket("dyno_sheets", f));

      const res = await fetch("/api/cams/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cam_name: cn,
          spec,
          cam_card_object: camCardObject,
          dyno_objects: dynoObjects,
          notes: notes || null,
        }),
      });

      const out: any = await res.json().catch(() => ({}));
      if (!res.ok) return setMsg({ type: "err", text: out?.error || `Submit failed (HTTP ${res.status})` });

      setMsg({ type: "ok", text: "Submitted! Waiting for admin approval." });

      setCamName("");
      setBrand("");
      setPartNumber("");
      setNotes("");
      setCamCardFile(null);
      setDynoFiles([]);
    } catch (e: any) {
      setMsg({ type: "err", text: e?.message || "Submit failed." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ padding: 18, maxWidth: 980, margin: "0 auto" }}>
      <div
        style={{
          borderRadius: 18,
          padding: 18,
          border: "1px solid rgba(56,189,248,0.35)",
          background: "radial-gradient(circle at 20% 10%, rgba(34,211,238,0.16), rgba(15,23,42,0.92))",
          boxShadow: "0 18px 50px rgba(0,0,0,0.6)",
          color: "#e2e8f0",
          fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
        }}
      >
        <h1 style={{ margin: 0, letterSpacing: "0.12em", textTransform: "uppercase", fontSize: 16, color: "#7dd3fc" }}>
          Cam Submission
        </h1>

        <p style={{ marginTop: 8, marginBottom: 14, color: "rgba(226,232,240,0.9)", fontSize: 12 }}>
          Enter the cam specs, upload the cam card, and optionally dyno sheets. Cam card + dyno sheets remain private until admin approval.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <Field label="Cam Name (required)" value={camName} setValue={setCamName} />
          <Field label="Brand (required)" value={brand} setValue={setBrand} />
          <Field label="Part Number (required)" value={partNumber} setValue={setPartNumber} />
          <div />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <Select label="Engine Make (required)" value={engineMake} onChange={(v) => setEngineMake(v as MakeKey)} options={MAKE_OPTIONS} />
          <Select key={engineMake} label="Engine Family (required)" value={engineFamily} onChange={(v) => setEngineFamily(v)} options={familyOptions} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          <NumField label="LSA" value={lsa} setValue={setLsa} />
          <NumField label="ICL" value={icl} setValue={setIcl} />
          <NumField label="Rocker Ratio" value={rocker} setValue={setRocker} />

          <NumField label="Dur Int @ .050" value={durInt050} setValue={setDurInt050} />
          <NumField label="Dur Exh @ .050" value={durExh050} setValue={setDurExh050} />
          <NumField label="Lift Int" value={liftInt} setValue={setLiftInt} />

          <NumField label="Lift Exh" value={liftExh} setValue={setLiftExh} />
          <NumField label="Adv Int" value={advInt} setValue={setAdvInt} />
          <NumField label="Adv Exh" value={advExh} setValue={setAdvExh} />

          <NumField label="Lash Int" value={lashInt} setValue={setLashInt} />
          <NumField label="Lash Exh" value={lashExh} setValue={setLashExh} />
          <div />
        </div>

        <div style={{ height: 14 }} />

        <div style={{ borderRadius: 14, border: "1px solid rgba(148,163,184,0.25)", background: "rgba(2,6,23,0.55)", padding: 14 }}>
          <label style={{ display: "block", fontSize: 12, color: "#cbd5e1", marginBottom: 8 }}>
            Cam Card (required) — image or PDF
          </label>
          <input type="file" accept="image/*,application/pdf" onChange={(e) => setCamCardFile(e.target.files?.[0] ?? null)} />

          <div style={{ height: 12 }} />

          <label style={{ display: "block", fontSize: 12, color: "#cbd5e1", marginBottom: 8 }}>
            Dyno Sheets (optional) — multiple images/PDFs
          </label>
          <input type="file" accept="image/*,application/pdf" multiple onChange={(e) => setDynoFiles(Array.from(e.target.files ?? []))} />

          <div style={{ height: 12 }} />

          <label style={{ display: "block", fontSize: 12, color: "#cbd5e1", marginBottom: 8 }}>
            Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            style={{
              width: "100%",
              borderRadius: 12,
              border: "1px solid rgba(148,163,184,0.25)",
              background: "rgba(2,6,23,0.65)",
              color: "#e2e8f0",
              padding: 10,
              outline: "none",
              resize: "vertical",
            }}
          />

          <div style={{ height: 14 }} />

          <button
            type="button"
            onClick={() => void submit()}
            disabled={busy}
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              border: "1px solid rgba(34,211,238,0.45)",
              background: busy ? "rgba(100,116,139,0.25)" : "linear-gradient(90deg, rgba(34,211,238,0.18), rgba(236,72,153,0.14))",
              color: "#e2e8f0",
              cursor: busy ? "not-allowed" : "pointer",
              fontWeight: 900,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              fontSize: 12,
            }}
          >
            {busy ? "Submitting..." : "Submit for Approval"}
          </button>

          {msg ? (
            <div
              style={{
                marginTop: 12,
                fontSize: 12,
                color: msg.type === "err" ? "#fb7185" : msg.type === "ok" ? "#86efac" : "#93c5fd",
                whiteSpace: "pre-wrap",
              }}
            >
              {msg.text}
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}

function Field(props: { label: string; value: string; setValue: (v: string) => void }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 12, color: "#cbd5e1", marginBottom: 6 }}>{props.label}</label>
      <input
        value={props.value}
        onChange={(e) => props.setValue(e.target.value)}
        style={{
          width: "100%",
          borderRadius: 12,
          border: "1px solid rgba(148,163,184,0.25)",
          background: "rgba(2,6,23,0.65)",
          color: "#e2e8f0",
          padding: 10,
          outline: "none",
        }}
      />
    </div>
  );
}

function Select(props: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 12, color: "#cbd5e1", marginBottom: 6 }}>{props.label}</label>
      <select
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        style={{
          width: "100%",
          borderRadius: 12,
          border: "1px solid rgba(148,163,184,0.25)",
          background: "rgba(2,6,23,0.65)",
          color: "#e2e8f0",
          padding: 10,
          outline: "none",
        }}
      >
        {props.options.map((opt) => (
          <option key={opt} value={opt} style={{ background: "#020617" }}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

function NumField(props: { label: string; value: number | ""; setValue: (v: number | "") => void }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 12, color: "#cbd5e1", marginBottom: 6 }}>{props.label}</label>
      <input
        type="number"
        value={props.value}
        onChange={(e) => props.setValue(e.target.value === "" ? "" : Number(e.target.value))}
        style={{
          width: "100%",
          borderRadius: 12,
          border: "1px solid rgba(148,163,184,0.25)",
          background: "rgba(2,6,23,0.65)",
          color: "#e2e8f0",
          padding: 10,
          outline: "none",
        }}
      />
    </div>
  );
}
