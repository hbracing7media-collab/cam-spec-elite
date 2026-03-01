"use client";

import Link from "next/link";
import LayawayBanner from "@/components/LayawayBanner";
import { useTranslations } from "next-intl";

const CALCULATOR_SLUGS = [
  "cam-spec-elite",
  "cam-spec-elite-selective",
  "cam-spec-elite-generative",
  "drag-simulator",
  "roll-race-60-130",
  "gear-ratio",
  "boost-estimator",
  "turbo-sizing-calculator",
  "camshaft-suggestor-basic",
  "camshaft-suggestor-selective",
  "cam-suggestor-global",
  "cam-suggestor-generative",
  "tire-size",
  "brake-math",
  "coming-soon"
];

const GENERATIVE_SLUGS = new Set([
  "cam-spec-elite-generative",
  "cam-suggestor-generative"
]);

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
          {CALCULATOR_SLUGS.map((slug) => {
            const isGenerative = GENERATIVE_SLUGS.has(slug);
            const nameKey = `calculator.tools.${slug}.name` as any;
            const descKey = `calculator.tools.${slug}.desc` as any;

            return (
            <div key={slug} className="card" style={{ background: "rgba(2,6,23,0.55)" }}>
              <div className="card-inner">
                <div style={{ fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase", color: "#7dd3fc" }}>
                  {t(nameKey)}
                </div>
                <p className="small" style={{ marginTop: 8, opacity: 0.9 }}>{t(descKey)}</p>
                {isGenerative ? (
                  <p className="small" style={{ marginTop: 4, color: "#fbbf24", fontStyle: "italic" }}>
                    {t('calculator.underConstruction')}
                  </p>
                ) : null}
                <div style={{ marginTop: 10 }}>
                  <Link className="pill" href={`/calculators/${slug}`}>{t('calculator.open')}</Link>
                </div>
              </div>
            </div>
            );
          })}
        </div>

        <hr className="hr" />

        <p className="small" style={{ opacity: 0.85 }}>
          {t('calculator.nextStep')}
        </p>
      </div>
    </div>
  );
}
