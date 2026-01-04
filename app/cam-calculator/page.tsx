"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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

  const buttonText = isLoggedIn === null ? "Loading..." : "🔥 Launch Calculator";
  const subText = isLoggedIn ? "Go to dashboard" : "Free account required";

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
              Cam Horsepower Calculator
            </h1>
            <p style={{ fontSize: "1.1rem", opacity: 0.9, maxWidth: 600, margin: "0 auto" }}>
              Predict your engine's peak horsepower and torque from camshaft specs.
              Enter duration, lift, and LSA to see estimated power output.
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
              What You Can Calculate
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: 16,
              }}
            >
              {[
                { icon: "⚡", title: "Peak Horsepower", desc: "Estimated max HP from cam specs" },
                { icon: "🔧", title: "Peak Torque", desc: "Torque output and RPM range" },
                { icon: "📊", title: "Power Band", desc: "Where your engine makes power" },
                { icon: "🎯", title: "Cam Suggestions", desc: "Find cams that match your goals" },
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
              Frequently Asked Questions
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
                  How does cam duration affect horsepower?
                </summary>
                <p style={{ marginTop: 10, opacity: 0.85, lineHeight: 1.6 }}>
                  Longer cam duration keeps valves open longer, allowing more air/fuel
                  mixture into the cylinder at high RPM. This shifts the power band higher,
                  increasing peak horsepower but often sacrificing low-end torque and idle quality.
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
                  What is lobe separation angle (LSA)?
                </summary>
                <p style={{ marginTop: 10, opacity: 0.85, lineHeight: 1.6 }}>
                  LSA is the angle in camshaft degrees between the intake and exhaust lobe
                  centerlines. Tighter LSA (106-110°) builds cylinder pressure for more
                  mid-range torque. Wider LSA (112-118°) smooths idle and broadens the power band.
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
                  Does more lift always mean more power?
                </summary>
                <p style={{ marginTop: 10, opacity: 0.85, lineHeight: 1.6 }}>
                  Not always. Lift must match your cylinder head's flow capacity. Once airflow
                  maxes out, extra lift adds valve train stress without power gains. Most street
                  heads peak around 0.550-0.600" lift.
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
              Get Started Free →
            </button>
          </div>
        </article>

        {/* Footer */}
        <footer style={{ textAlign: "center", marginTop: 32, opacity: 0.6, fontSize: "0.85rem" }}>
          <p>© {new Date().getFullYear()} Cam Spec Elite. Built for enthusiasts.</p>
        </footer>
      </main>
    </>
  );
}
                display: "inline-block",
                padding: "14px 40px",
                fontSize: "1.1rem",
              }}
            >
              Get Started Free →
            </Link>
          </div>
        </article>

        {/* Footer */}
        <footer style={{ textAlign: "center", marginTop: 32, opacity: 0.6, fontSize: "0.85rem" }}>
          <p>© {new Date().getFullYear()} Cam Spec Elite. Built for enthusiasts.</p>
        </footer>
      </main>
    </>
  );
}
