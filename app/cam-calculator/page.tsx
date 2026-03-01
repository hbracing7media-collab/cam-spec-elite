"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Cam Horsepower Calculator",
  url: "https://camspecelite.com/cam-calculator",
  description:
    "Calculate estimated horsepower and torque from camshaft specifications including duration, lift, and lobe separation angle.",
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Any",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How does cam duration affect horsepower?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Longer cam duration keeps valves open longer, allowing more air/fuel mixture into the cylinder at high RPM. This shifts the power band higher, increasing peak horsepower but often sacrificing low-end torque and idle quality.",
      },
    },
    {
      "@type": "Question",
      name: "What is lobe separation angle (LSA)?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "LSA is the angle in camshaft degrees between the intake and exhaust lobe centerlines. Tighter LSA (106-110°) builds cylinder pressure for more mid-range torque. Wider LSA (112-118°) smooths idle and broadens the power band.",
      },
    },
    {
      "@type": "Question",
      name: "Does more lift always mean more power?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Not always. Lift must match your cylinder head's flow capacity. Once airflow maxes out, extra lift adds valve train stress without power gains. Most street heads peak around 0.550-0.600\" lift.",
      },
    },
  ],
};

export default function CamCalculatorLanding() {
  const router = useRouter();
  const t = useTranslations();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        setIsLoggedIn(res.ok);
      } catch {
        setIsLoggedIn(false);
      }
    };
    checkAuth();
  }, []);

  const handleLaunch = () => {
    if (isLoggedIn) {
      router.push("/");
    } else {
      router.push("/auth/login");
    }
  };

  const buttonText = isLoggedIn === null ? t("camCalculator.loading") : t("camCalculator.launchCalculator");
  const subText = isLoggedIn ? t("camCalculator.goToDashboard") : t("camCalculator.freeAccountRequired");

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <main
        style={{
          minHeight: "100vh",
          backgroundImage: "url('/miami-bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          padding: "40px 20px",
        }}
      >
        <article
          style={{
            maxWidth: 800,
            margin: "0 auto",
            background: "rgba(0,0,0,0.85)",
            borderRadius: 16,
            padding: "40px 32px",
            boxShadow: "0 0 60px rgba(0,255,255,0.2)",
            border: "1px solid rgba(0,255,255,0.3)",
          }}
        >
          {/* Hero */}
          <header style={{ textAlign: "center", marginBottom: 40 }}>
            <h1
              style={{
                fontSize: "2.2rem",
                marginBottom: 12,
                background: "linear-gradient(90deg, #0ff, #f0f)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {t("camCalculator.title")}
            </h1>
            <p style={{ fontSize: "1.1rem", opacity: 0.9, maxWidth: 600, margin: "0 auto" }}>
              {t("camCalculator.description")}
            </p>
          </header>

          {/* CTA */}
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <button
              onClick={handleLaunch}
              disabled={isLoggedIn === null}
              className="pill"
              style={{
                display: "inline-block",
                padding: "16px 48px",
                fontSize: "1.2rem",
                background: "linear-gradient(90deg, #0ff, #0aa)",
                color: "#000",
                fontWeight: 700,
                cursor: isLoggedIn === null ? "wait" : "pointer",
                border: "none",
              }}
            >
              {buttonText}
            </button>
            <p style={{ marginTop: 12, fontSize: "0.9rem", opacity: 0.7 }}>
              {subText}
            </p>
          </div>

          {/* Features */}
          <section style={{ marginBottom: 48 }}>
            <h2 style={{ fontSize: "1.4rem", marginBottom: 20, color: "#0ff" }}>
              {t("camCalculator.whatYouCanCalculate")}
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: 16,
              }}
            >
              {[
                { icon: "⚡", title: t("camCalculator.peakHorsepower"), desc: t("camCalculator.peakHorsepowerDesc") },
                { icon: "🔧", title: t("camCalculator.peakTorque"), desc: t("camCalculator.peakTorqueDesc") },
                { icon: "📊", title: t("camCalculator.powerBand"), desc: t("camCalculator.powerBandDesc") },
                { icon: "🎯", title: t("camCalculator.camSuggestions"), desc: t("camCalculator.camSuggestionsDesc") },
              ].map((f) => (
                <div
                  key={f.title}
                  style={{
                    background: "rgba(0,255,255,0.08)",
                    borderRadius: 10,
                    padding: 16,
                    border: "1px solid rgba(0,255,255,0.2)",
                  }}
                >
                  <div style={{ fontSize: "1.8rem", marginBottom: 8 }}>{f.icon}</div>
                  <h3 style={{ fontSize: "1rem", marginBottom: 4 }}>{f.title}</h3>
                  <p style={{ fontSize: "0.85rem", opacity: 0.8 }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* FAQ */}
          <section style={{ marginBottom: 48 }}>
            <h2 style={{ fontSize: "1.4rem", marginBottom: 20, color: "#0ff" }}>
              {t("camCalculator.faq")}
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <details
                style={{
                  background: "rgba(255,255,255,0.05)",
                  borderRadius: 8,
                  padding: "12px 16px",
                }}
              >
                <summary style={{ cursor: "pointer", fontWeight: 600 }}>
                  {t("camCalculator.faq1Question")}
                </summary>
                <p style={{ marginTop: 10, opacity: 0.85, lineHeight: 1.6 }}>
                  {t("camCalculator.faq1Answer")}
                </p>
              </details>
              <details
                style={{
                  background: "rgba(255,255,255,0.05)",
                  borderRadius: 8,
                  padding: "12px 16px",
                }}
              >
                <summary style={{ cursor: "pointer", fontWeight: 600 }}>
                  {t("camCalculator.faq2Question")}
                </summary>
                <p style={{ marginTop: 10, opacity: 0.85, lineHeight: 1.6 }}>
                  {t("camCalculator.faq2Answer")}
                </p>
              </details>
              <details
                style={{
                  background: "rgba(255,255,255,0.05)",
                  borderRadius: 8,
                  padding: "12px 16px",
                }}
              >
                <summary style={{ cursor: "pointer", fontWeight: 600 }}>
                  {t("camCalculator.faq3Question")}
                </summary>
                <p style={{ marginTop: 10, opacity: 0.85, lineHeight: 1.6 }}>
                  {t("camCalculator.faq3Answer")}
                </p>
              </details>
            </div>
          </section>

          {/* Bottom CTA */}
          <div style={{ textAlign: "center" }}>
            <button
              onClick={handleLaunch}
              disabled={isLoggedIn === null}
              className="pill"
              style={{
                display: "inline-block",
                padding: "14px 40px",
                fontSize: "1.1rem",
                cursor: isLoggedIn === null ? "wait" : "pointer",
                border: "none",
              }}
            >
              {t("camCalculator.getStartedFree")}
            </button>
          </div>
        </article>

        {/* Footer */}
        <footer style={{ textAlign: "center", marginTop: 32, opacity: 0.6, fontSize: "0.85rem" }}>
          <p>{t("camCalculator.copyright", { year: new Date().getFullYear() })}</p>
        </footer>
      </main>
    </>
  );
}
