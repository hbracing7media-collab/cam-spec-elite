import type { Metadata } from "next";
import Link from "next/link";
import CamSpecEliteCalculator from "../../components/CamSpecEliteCalculator";

const META: Record<string, { title: string; desc: string }> = {
  "cam-spec-elite": { title: "Cam Spec Elite Basic HP Calculator", desc: "Cam and engine combo estimator + dyno curve." },
  "turbo-sizing": { title: "Turbo Sizing", desc: "Compressor/turbine suggestions based on goals." },
  "drag-sim-1320": { title: "Drag Simulator (1/4 mile)", desc: "HP/weight ET + trap estimate." },
  "drag-sim-660": { title: "Drag Simulator (1/8 mile)", desc: "HP/weight 1/8 ET + mph estimate." },
  "roll-race-60-130": { title: "60–130 Roll Race", desc: "Estimate time based on power/weight/drag." },
  "gear-ratio": { title: "Gear Ratio / RPM", desc: "RPM vs speed by tire + gearing." },
  "compression-ratio": { title: "Compression Ratio", desc: "Static compression from bore/stroke/chamber." },
  "injector-sizing": { title: "Injector Sizing", desc: "Fuel injector size estimate for HP + fuel type." },
  "fuel-system": { title: "Fuel System Flow", desc: "Pump flow / line sizing helper." },
  "converter-slip": { title: "Converter Slip", desc: "Trap RPM vs mph slip estimate." },
  "boost-psi-target": { title: "Boost Target PSI", desc: "Estimate boost for target HP and efficiency." },
  "intercooler-calc": { title: "Intercooler Sizing", desc: "Temp drop targets and core sizing." },
  "tire-size": { title: "Tire Size & Speedo", desc: "Diameter + speedo correction." },
  "brake-math": { title: "Brake Bias / Force", desc: "Simple bias and clamp force calculator." },
  "coming-soon": { title: "Calculator Slot 15", desc: "Reserved slot for next tool." },
};

type SlugParams = { slug: string };

// ✅ Next 15 can type `params` as a Promise in generated types
type PageProps = {
  params: Promise<SlugParams>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const meta = META[slug] ?? { title: slug, desc: "This calculator slot is available." };

  return {
    title: `${meta.title} | HB Racing 7`,
    description: meta.desc,
  };
}

export default async function CalculatorSlugPage({ params }: PageProps) {
  const { slug } = await params;
  const meta = META[slug] ?? { title: slug, desc: "This calculator slot is available." };

  return (
    <div className="card">
      <div className="card-inner">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <h1 className="h1" style={{ margin: 0 }}>
            {meta.title}
          </h1>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link className="pill" href="/calculators">
              All Calculators
            </Link>
            <Link className="pill" href="/forum">
              Forum
            </Link>
            <Link className="pill" href="/">
              Home
            </Link>
          </div>
        </div>

        <p className="small" style={{ marginTop: 10 }}>
          {meta.desc}
        </p>

        <hr className="hr" />

        <div className="card" style={{ background: "rgba(2,6,23,0.55)" }}>
          <div className="card-inner">
            <div
              style={{
                fontWeight: 900,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#fb7185",
              }}
            >
              Calculator UI Area
            </div>

            <p className="small" style={{ marginTop: 8, opacity: 0.9 }}>
              This is the placeholder panel for <b>{slug}</b>.
            </p>

            <p className="small" style={{ opacity: 0.85 }}>
              Next, we’ll wire the first real calculator here (Cam Spec Elite), then add the rest one-by-one.
            </p>
          </div>
        </div>

        <hr className="hr" />

        <div className="small" style={{ opacity: 0.85 }}>
          Status: route + layout are working. Math and components will be plugged in per calculator.
        </div>
      </div>
    </div>
  );
}
