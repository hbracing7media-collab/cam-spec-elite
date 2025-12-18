import Link from "next/link";

const CALCULATORS: { slug: string; name: string; desc: string }[] = [
  { slug: "cam-spec-elite", name: "Cam Spec Elite Basic HP Calculator", desc: "Cam and engine combo estimator + dyno curve." },
  { slug: "turbo-sizing", name: "Turbo Sizing", desc: "Compressor/turbine suggestions based on goals." },
  { slug: "drag-sim-1320", name: "Drag Simulator (1/4 mile)", desc: "HP/weight ET + trap estimate." },
  { slug: "drag-sim-660", name: "Drag Simulator (1/8 mile)", desc: "HP/weight 1/8 ET + mph estimate." },
  { slug: "roll-race-60-130", name: "60–130 Roll Race", desc: "Estimate time based on power/weight/drag." },
  { slug: "gear-ratio", name: "Gear Ratio / RPM", desc: "RPM vs speed by tire + gearing." },
  { slug: "compression-ratio", name: "Compression Ratio", desc: "Static compression from bore/stroke/chamber." },
  { slug: "injector-sizing", name: "Injector Sizing", desc: "Fuel injector size estimate for HP + fuel type." },
  { slug: "fuel-system", name: "Fuel System Flow", desc: "Pump flow / line sizing helper." },
  { slug: "converter-slip", name: "Converter Slip", desc: "Trap RPM vs mph slip estimate." },
  { slug: "boost-psi-target", name: "Boost Target PSI", desc: "Estimate boost for target HP and efficiency." },
  { slug: "intercooler-calc", name: "Intercooler Sizing", desc: "Temp drop targets and core sizing." },
  { slug: "tire-size", name: "Tire Size & Speedo", desc: "Diameter + speedo correction." },
  { slug: "brake-math", name: "Brake Bias / Force", desc: "Simple bias and clamp force calculator." },
  { slug: "coming-soon", name: "Calculator Slot 15", desc: "Reserved slot for next tool." }
];

export default function CalculatorsHubPage() {
  return (
    <div className="card">
      <div className="card-inner">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <h1 className="h1" style={{ margin: 0 }}>Calculators</h1>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link className="pill" href="/">Home</Link>
            <Link className="pill" href="/forum">Forum</Link>
            <Link className="pill" href="/profile">Profile</Link>
          </div>
        </div>

        <p className="small" style={{ marginTop: 10 }}>
          Select a tool. Each calculator is isolated so nothing breaks the rest of the system.
        </p>

        <hr className="hr" />

        <div className="grid-2">
          {CALCULATORS.map((c) => (
            <div key={c.slug} className="card" style={{ background: "rgba(2,6,23,0.55)" }}>
              <div className="card-inner">
                <div style={{ fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase", color: "#7dd3fc" }}>
                  {c.name}
                </div>
                <p className="small" style={{ marginTop: 8, opacity: 0.9 }}>{c.desc}</p>
                <div style={{ marginTop: 10 }}>
                  <Link className="pill" href={`/calculators/${c.slug}`}>Open</Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        <hr className="hr" />

        <p className="small" style={{ opacity: 0.85 }}>
          Next: create the dynamic calculator page at <b>/calculators/[slug]</b>.
        </p>
      </div>
    </div>
  );
}
