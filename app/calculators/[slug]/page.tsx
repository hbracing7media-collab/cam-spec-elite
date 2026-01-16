import type { Metadata } from "next";
import Link from "next/link";
import CamSpecEliteCalculator from "../../components/CamSpecEliteCalculator";
import CamSpecEliteSelectiveCalculator from "../../components/CamSpecEliteSelectiveCalculator";
import CamSpecEliteGenerativeCalculator from "../../components/CamSpecEliteGenerativeCalculator";
import DragSim660Calculator from "../../components/DragSim660Calculator";
import RollRace60130Simulator from "../../components/RollRace60130Simulator";
import BoostEstimatorCalculator from "../../components/BoostEstimatorCalculator";
import TurboSizingCalculator from "../../components/TurboSizingCalculator";
import CamshaftSuggestorBasic from "../../components/CamshaftSuggestorBasic";
import ConverterSlipCalculator from "../../components/ConverterSlipCalculatorClient";
import GearRatioCalculator from "../../components/GearRatioCalculator";

const SELECTIVE_SLUGS = ["cam-spec-elite-selective"];

const META: Record<string, { title: string; desc: string }> = {
  "cam-spec-elite": { title: "Cam Spec Elite Basic HP Calculator", desc: "Cam and engine combo estimator + dyno curve." },
  "cam-spec-elite-selective": { title: "Cam Spec Elite Selective HP Calculator", desc: "Cam and engine combo estimator + dyno curve." },
  "cam-spec-elite-generative": { title: "Cam Spec Elite Generative", desc: "AI-assisted cam + power curve estimator." },
  "drag-simulator": { title: "Drag Simulator", desc: "HP/weight ET + trap estimate." },
  "roll-race-60-130": { title: "60–130 Roll Race", desc: "Estimate time based on power/weight/drag." },
  "gear-ratio": { title: "Gear Ratio / RPM", desc: "RPM vs speed by tire + gearing." },
  "boost-estimator": { title: "Boost Estimator", desc: "HP + Boost = New HP" },
  "turbo-sizing-calculator": { title: "Turbo Sizing Calculator", desc: "Turbo Sizing Calculator" },
  "camshaft-suggestor-basic": { title: "Camshaft Suggestor Basic", desc: "Camshaft suggested specs from engine combo estimates." },
  "camshaft-suggestor-selective": { title: "Camshaft Suggestor Selective", desc: "Camshaft suggestor based on databased cams." },
  "cam-suggestor-global": { title: "Cam Suggestor Global", desc: "Cam suggestion based on calculations, cross referenced with available cams from web data" },
  "intercooler-calc": { title: "Cam Suggestor Generative", desc: "AI-assisted, data-based cam suggestor." },
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

        {slug === "cam-spec-elite" ? (
          <CamSpecEliteCalculator />
        ) : slug === "cam-spec-elite-generative" ? (
          <CamSpecEliteGenerativeCalculator />
        ) : SELECTIVE_SLUGS.includes(slug) ? (
          <CamSpecEliteSelectiveCalculator />
        ) : slug === "drag-simulator" ? (
          <DragSim660Calculator />
        ) : slug === "boost-estimator" ? (
          <BoostEstimatorCalculator />
        ) : slug === "turbo-sizing-calculator" ? (
          <TurboSizingCalculator />
        ) : slug === "camshaft-suggestor-basic" ? (
          <CamshaftSuggestorBasic />
        ) : slug === "camshaft-suggestor-selective" ? (
          <ConverterSlipCalculator />
        ) : slug === "cam-suggestor-global" ? (
          <ConverterSlipCalculator mode="global" desiredSuggestions={3} />
        ) : slug === "intercooler-calc" ? (
          <CamSpecEliteGenerativeCalculator />
        ) : slug === "gear-ratio" ? (
          <GearRatioCalculator />
        ) : slug === "roll-race-60-130" ? (
          <RollRace60130Simulator />
        ) : (
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
              Next, we'll wire the first real calculator here (Cam Spec Elite), then add the rest one-by-one.
            </p>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
