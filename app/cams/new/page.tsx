"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CAM_ENGINE_FAMILIES, CAM_MAKE_OPTIONS, CamMakeKey } from "@/lib/engineOptions";

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

type Msg = { type: "ok" | "err" | "info"; text: string };

export default function NewCamSubmissionPage() {
  const isAuthed = useAuthCheck();
  const [userId, setUserId] = useState<string>("");
  const [email, setEmail] = useState<string>("");

  const [camName, setCamName] = useState("");
  const [brand, setBrand] = useState("");
  const [partNumber, setPartNumber] = useState("");

  const [engineMake, setEngineMake] = useState<CamMakeKey>("Ford");
  const [engineFamily, setEngineFamily] = useState<string>(CAM_ENGINE_FAMILIES["Ford"][0]);

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
  const [rpmStart, setRpmStart] = useState<number | "">("");
  const [rpmEnd, setRpmEnd] = useState<number | "">("");
  const [notes, setNotes] = useState("");

  const [camCardFile, setCamCardFile] = useState<File | null>(null);
  const [dynoFiles, setDynoFiles] = useState<File[]>([]);

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Msg | null>(null);

  // Make -> Family reset
  useEffect(() => {
    const list = CAM_ENGINE_FAMILIES[engineMake] ?? CAM_ENGINE_FAMILIES["Other"];
    setEngineFamily(list[0]);
  }, [engineMake]);

  // REAL login detection: ask the server (cookie session)
  useEffect(() => {
    (async () => {
      const res = await fetch("/api/auth/me", { cache: "no-store" }).catch(() => null);
      if (!res || !res.ok) {
        setUserId("");
        setEmail("");
        setMsg({ type: "info", text: "Log in to submit a cam." });
        return;
      }
      const j: any = await res.json().catch(() => ({}));
      if (!j?.ok || !j?.user?.id) {
        setUserId("");
        setEmail("");
        setMsg({ type: "info", text: "Log in to submit a cam." });
        return;
      }
      setUserId(String(j.user.id));
      setEmail(String(j.user.email || ""));
      setMsg(null);
    })();
  }, []);

  const familyOptions = CAM_ENGINE_FAMILIES[engineMake] ?? CAM_ENGINE_FAMILIES["Other"];

  async function submit() {
    setMsg(null);

    if (!userId) return setMsg({ type: "err", text: "You must be logged in to submit." });

    const cn = camName.trim();
    const br = brand.trim();
    const pn = partNumber.trim();

    if (!cn) return setMsg({ type: "err", text: "Cam Name is required." });
    if (!br) return setMsg({ type: "err", text: "Brand is required." });
    if (!pn) return setMsg({ type: "err", text: "Part Number is required." });
    if (!engineMake) return setMsg({ type: "err", text: "Engine Make is required." });
    if (!engineFamily) return setMsg({ type: "err", text: "Engine Family is required." });
    if (!camCardFile) return setMsg({ type: "err", text: "Cam Card file is required." });

    setBusy(true);
    try {
      const fd = new FormData();

      // REQUIRED keys that the API expects (snake_case)
      fd.append("cam_name", cn);
      fd.append("brand", br);
      fd.append("part_number", pn);
      fd.append("engine_make", engineMake);
      fd.append("engine_family", engineFamily);
      fd.append("user_id", userId);

      // Optional numeric/spec fields (only append if set)
      if (lsa !== "") fd.append("lsa", String(lsa));
      if (icl !== "") fd.append("icl", String(icl));
      if (rocker !== "") fd.append("rocker_ratio", String(rocker));

      if (durInt050 !== "") fd.append("dur_int_050", String(durInt050));
      if (durExh050 !== "") fd.append("dur_exh_050", String(durExh050));

      if (advInt !== "") fd.append("adv_int", String(advInt));
      if (advExh !== "") fd.append("adv_exh", String(advExh));

      if (liftInt !== "") fd.append("lift_int", String(liftInt));
      if (liftExh !== "") fd.append("lift_exh", String(liftExh));

      if (lashInt !== "") fd.append("lash_int", String(lashInt));
      if (lashExh !== "") fd.append("lash_exh", String(lashExh));
      if (rpmStart !== "") fd.append("rpm_start", String(rpmStart));
      if (rpmEnd !== "") fd.append("rpm_end", String(rpmEnd));

      if (notes.trim()) fd.append("notes", notes.trim());

      // Files (exact keys)
      fd.append("cam_card", camCardFile);
      for (const f of dynoFiles) fd.append("dyno_sheets", f);

      // IMPORTANT: do not set Content-Type manually (browser adds boundary)
      const res = await fetch("/api/cam-submit", {
        method: "POST",
        body: fd,
      });

      const out: any = await res.json().catch(() => ({}));
      if (!res.ok) {
        const txt =
          out?.message ||
          out?.error?.message ||
          out?.error ||
          `Submit failed (HTTP ${res.status})`;
        return setMsg({ type: "err", text: txt });
      }

      setMsg({ type: "ok", text: "Submitted! Waiting for admin approval." });

      setCamName("");
      setBrand("");
      setPartNumber("");
      setNotes("");
      setCamCardFile(null);
      setDynoFiles([]);
      setRpmStart("");
      setRpmEnd("");
    } catch (e: any) {
      setMsg({ type: "err", text: e?.message || "Submit failed." });
    } finally {
      setBusy(false);
    }
  }

  if (isAuthed === null) return <div style={{ padding: 20, textAlign: "center" }}>Loading...</div>;

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
          <Select label="Engine Make (required)" value={engineMake} onChange={(v) => setEngineMake(v as CamMakeKey)} options={CAM_MAKE_OPTIONS} />
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
          <NumField label="Cam RPM Start" value={rpmStart} setValue={setRpmStart} />
          <NumField label="Cam RPM End" value={rpmEnd} setValue={setRpmEnd} />
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
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => setCamCardFile(e.target.files?.[0] ?? null)}
          />

          <div style={{ height: 12 }} />

          <label style={{ display: "block", fontSize: 12, color: "#cbd5e1", marginBottom: 8 }}>
            Dyno Sheets (optional) — multiple images/PDFs
          </label>
          <input
            type="file"
            accept="image/*,application/pdf"
            multiple
            onChange={(e) => setDynoFiles(Array.from(e.target.files ?? []))}
          />

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