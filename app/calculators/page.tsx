"use client";

import Link from "next/link";
import LayawayBanner from "@/components/LayawayBanner";
import { useTranslations } from "next-intl";

const CALCULATORS: { slug: string; name: string; desc: string }[] = [
  { slug: "cam-spec-elite", name: "Cam Spec Elite Basic HP Calculator", desc: "Cam and engine combo estimator + dyno curve." },
  { slug: "cam-spec-elite-selective", name: "Cam Spec Elite Selective HP Calculator", desc: "Cam and engine combo estimator + dyno curve." },
  { slug: "cam-spec-elite-generative", name: "Cam Spec Elite Generative", desc: "AI-assisted cam + power curve estimator." },
  { slug: "drag-simulator", name: "Drag Simulator", desc: "HP/weight ET + trap estimate." },
  { slug: "roll-race-60-130", name: "60–130 Roll Race", desc: "Estimate time based on power/weight/drag." },
  { slug: "gear-ratio", name: "Gear Ratio / RPM", desc: "RPM vs speed by tire + gearing." },
  { slug: "boost-estimator", name: "Boost Estimator", desc: "HP + Boost = New HP" },
  { slug: "turbo-sizing-calculator", name: "Turbo Sizing Calculator", desc: "Turbo Sizing Calculator" },
  { slug: "camshaft-suggestor-basic", name: "Camshaft Suggestor Basic", desc: "Camshaft suggested specs from engine combo estimates." },
  { slug: "camshaft-suggestor-selective", name: "Camshaft Suggestor Selective", desc: "Camshaft suggestor based on databased cams." },
  { slug: "cam-suggestor-global", name: "Cam Suggestor Global", desc: "Cam suggestion based on calculations, cross referenced with available cams from web data" },
  { slug: "intercooler-calc", name: "Cam Suggestor Generative", desc: "AI-assisted, data-based cam suggestor." },
  { slug: "tire-size", name: "Tire Size & Speedo", desc: "Diameter + speedo correction." },
  { slug: "brake-math", name: "Brake Bias / Force", desc: "Simple bias and clamp force calculator." },
  { slug: "coming-soon", name: "Calculator Slot 15", desc: "Reserved slot for next tool." }
];

const GENERATIVE_SLUGS = new Set(
  CALCULATORS.filter((c) => c.name.toLowerCase().includes("generative")).map((c) => c.slug)
);

export default function CalculatorsHubPage() {
  const t = useTranslations();
  return (
    <div className="card">
      <div className="card-inner">
        <LayawayBanner />
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <h1 className="h1" style={{ margin: 0 }}>{t('calculator.title')}</h1>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link className="pill" href="/">{t('nav.home')}</Link>
            <Link className="pill" href="/forum">{t('nav.forum')}</Link>
            <Link className="pill" href="/profile">{t('nav.profile')}</Link>
          </div>
        </div>

        <p className="small" style={{ marginTop: 10 }}>
          {t('calculator.selectTool')}
        </p>

        <hr className="hr" />

        <div className="grid-2">
          {CALCULATORS.map((c) => {
            const isGenerative = GENERATIVE_SLUGS.has(c.slug);

            return (
            <div key={c.slug} className="card" style={{ background: "rgba(2,6,23,0.55)" }}>
              <div className="card-inner">
                <div style={{ fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase", color: "#7dd3fc" }}>
                  {c.name}
                </div>
                <p className="small" style={{ marginTop: 8, opacity: 0.9 }}>{c.desc}</p>
                {isGenerative ? (
                  <p className="small" style={{ marginTop: 4, color: "#fbbf24", fontStyle: "italic" }}>
                    Under construction: generative calculator rollout in progress.
                  </p>
                ) : null}
                <div style={{ marginTop: 10 }}>
                  <Link className="pill" href={`/calculators/${c.slug}`}>Open</Link>
                </div>
              </div>
            </div>
            );
          })}
        </div>

        <hr className="hr" />

        <p className="small" style={{ opacity: 0.85 }}>
          Next: create the dynamic calculator page at <b>/calculators/[slug]</b>.
        </p>
      </div>
    </div>
  );
}
