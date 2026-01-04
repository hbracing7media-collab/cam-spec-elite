import { Metadata } from "next";
import Link from "next/link";
import LaunchCalculatorButton from "@/app/components/LaunchCalculatorButton";

export const metadata: Metadata = {
  title: "Camshaft Horsepower Calculator | Free HP Estimator Tool | Cam Spec Elite",
  description:
    "Free camshaft horsepower calculator. Estimate HP and torque from your cam specs, engine displacement, compression ratio, and intake setup. Generate dyno curves instantly.",
  keywords: [
    "camshaft calculator",
    "horsepower calculator",
    "cam HP calculator",
    "engine horsepower estimator",
    "dyno curve calculator",
    "cam duration calculator",
    "dynamic compression ratio calculator",
    "cam timing calculator",
    "performance cam calculator",
    "engine power estimator",
    "small block ford cam calculator",
    "LS cam calculator",
    "SBC cam calculator",
    "free HP calculator",
  ],
  openGraph: {
    title: "Free Camshaft Horsepower Calculator | Cam Spec Elite",
    description:
      "Calculate horsepower and torque from your camshaft specs. Input cam duration, lift, LSA, and engine specs to generate estimated dyno curves.",
    type: "website",
    url: "https://camspecelite.com/calculators/cam-horsepower-calculator",
    siteName: "Cam Spec Elite",
    images: [
      {
        url: "/og-cam-calculator.png",
        width: 1200,
        height: 630,
        alt: "Cam Spec Elite Horsepower Calculator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Camshaft HP Calculator | Free Dyno Curve Estimator",
    description:
      "Estimate horsepower and torque from cam specs. Free tool for engine builders and enthusiasts.",
  },
  alternates: {
    canonical: "https://camspecelite.com/calculators/cam-horsepower-calculator",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

// JSON-LD Structured Data
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Cam Spec Elite Horsepower Calculator",
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Any",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  description:
    "Free camshaft horsepower calculator that estimates engine power output based on cam specs, displacement, compression ratio, and intake configuration.",
  featureList: [
    "Calculate horsepower from cam specs",
    "Estimate torque curves",
    "Dynamic compression ratio calculation",
    "Support for naturally aspirated and boosted engines",
    "Imperial and metric unit support",
    "Cam library database search",
    "Interactive dyno curve visualization",
  ],
  url: "https://camspecelite.com/calculators/cam-horsepower-calculator",
  creator: {
    "@type": "Organization",
    name: "HB Racing",
    url: "https://camspecelite.com",
  },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How do I calculate horsepower from cam specs?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "To calculate horsepower from cam specs, you need the intake and exhaust duration at 0.050\" lift, lobe separation angle (LSA), valve lift, intake valve closing (IVC) point, and your engine's displacement, compression ratio, and head flow. Our calculator combines these inputs with proven formulas to estimate peak HP and generate a full dyno curve.",
      },
    },
    {
      "@type": "Question",
      name: "What is dynamic compression ratio and why does it matter?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Dynamic compression ratio (DCR) is the actual compression your engine sees based on when the intake valve closes. Unlike static CR, DCR accounts for the cam timing. A cam that closes the intake valve later (after BDC) reduces DCR, which affects power output and fuel requirements. Our calculator computes DCR from your cam's IVC spec.",
      },
    },
    {
      "@type": "Question",
      name: "How accurate is a camshaft horsepower calculator?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Cam HP calculators provide estimates based on mathematical models. Real dyno results depend on factors like engine condition, tuning, exhaust, and environmental conditions. Our calculator uses established engineering formulas and typically estimates within 5-15% of actual dyno results for well-built engines.",
      },
    },
    {
      "@type": "Question",
      name: "Can I calculate HP for boosted engines?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes! Our calculator supports both naturally aspirated and forced induction setups. Enter your boost pressure (PSI), and the calculator adjusts HP estimates accounting for increased airflow and effective compression ratio changes.",
      },
    },
    {
      "@type": "Question",
      name: "What cam specs do I need to use this calculator?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "You'll need: intake duration at 0.050\", exhaust duration at 0.050\", lobe separation angle (LSA), intake valve closing (IVC) degrees ABDC, intake lift, and exhaust lift. These specs are found on your cam card or the manufacturer's website.",
      },
    },
  ],
};

export default function CamHorsepowerCalculatorPage() {
  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <div className="card">
        <div className="card-inner">
          {/* Breadcrumb Navigation */}
          <nav aria-label="Breadcrumb" style={{ marginBottom: 16 }}>
            <ol
              style={{
                display: "flex",
                gap: 8,
                listStyle: "none",
                padding: 0,
                margin: 0,
                fontSize: "0.85rem",
              }}
            >
              <li>
                <Link href="/" style={{ color: "#7dd3fc" }}>
                  Home
                </Link>
              </li>
              <li style={{ color: "#64748b" }}>/</li>
              <li>
                <Link href="/calculators" style={{ color: "#7dd3fc" }}>
                  Calculators
                </Link>
              </li>
              <li style={{ color: "#64748b" }}>/</li>
              <li style={{ color: "#94a3b8" }}>Cam HP Calculator</li>
            </ol>
          </nav>

          {/* Hero Section */}
          <header style={{ textAlign: "center", padding: "40px 20px 50px" }}>
            <h1
              style={{
                fontSize: "2.5rem",
                fontWeight: 900,
                marginBottom: 16,
                background: "linear-gradient(90deg, #7dd3fc, #a78bfa, #f472b6)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                lineHeight: 1.2,
              }}
            >
              Camshaft Horsepower Calculator
            </h1>
            <p
              style={{
                color: "#94a3b8",
                fontSize: "1.15rem",
                lineHeight: 1.7,
                maxWidth: 700,
                margin: "0 auto 32px",
              }}
            >
              Calculate estimated <strong style={{ color: "#7dd3fc" }}>horsepower and torque</strong> from
              your camshaft specifications. Enter your cam duration, lift, LSA, and engine specs to
              generate a <strong style={{ color: "#f472b6" }}>dyno curve estimate</strong>.
            </p>

            {/* CTA Button */}
            <LaunchCalculatorButton calculatorPath="/calculators/cam-spec-elite">
              🚀 Launch Calculator
            </LaunchCalculatorButton>

            <p style={{ marginTop: 16, fontSize: "0.85rem", color: "#64748b" }}>
              Free to use • No credit card required • Sign up takes 30 seconds
            </p>
          </header>

          <hr className="hr" />

          {/* Features Grid */}
          <section style={{ padding: "32px 0" }}>
            <h2
              style={{
                fontSize: "1.5rem",
                fontWeight: 700,
                color: "#7dd3fc",
                textAlign: "center",
                marginBottom: 32,
              }}
            >
              What You Can Calculate
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: 24,
              }}
            >
              <FeatureCard
                icon="⚡"
                title="Peak Horsepower & Torque"
                description="Get estimated peak HP and torque numbers based on your complete engine and cam combination."
              />
              <FeatureCard
                icon="📈"
                title="Full Dyno Curve"
                description="Visualize horsepower and torque across your entire RPM range with interactive charts."
              />
              <FeatureCard
                icon="🔧"
                title="Dynamic Compression Ratio"
                description="Calculate true DCR based on intake valve closing timing - critical for cam selection."
              />
              <FeatureCard
                icon="🌀"
                title="Boost Support"
                description="Supports turbo and supercharged setups with intercooler efficiency calculations."
              />
              <FeatureCard
                icon="📚"
                title="Cam Library Database"
                description="Search and load cams by manufacturer - Ford, Chevy, LS, Coyote, and more."
              />
              <FeatureCard
                icon="📐"
                title="Imperial & Metric"
                description="Toggle between inch/CID and mm/cc units to match your preference."
              />
            </div>
          </section>

          <hr className="hr" />

          {/* How It Works */}
          <section style={{ padding: "32px 0" }}>
            <h2
              style={{
                fontSize: "1.5rem",
                fontWeight: 700,
                color: "#7dd3fc",
                textAlign: "center",
                marginBottom: 32,
              }}
            >
              How It Works
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 20,
                maxWidth: 900,
                margin: "0 auto",
              }}
            >
              <StepCard
                step={1}
                title="Enter Engine Specs"
                description="Bore, stroke, rod length, chamber volume, deck height, and head flow CFM."
              />
              <StepCard
                step={2}
                title="Add Cam Specs"
                description="Duration at 0.050&quot;, LSA, IVC, and lift from your cam card."
              />
              <StepCard
                step={3}
                title="Configure Tune"
                description="Intake type, fuel grade, boost (optional), and target AFR."
              />
              <StepCard
                step={4}
                title="Get Results"
                description="View estimated HP, torque, and full dyno curve visualization."
              />
            </div>

            {/* Secondary CTA */}
            <div style={{ textAlign: "center", marginTop: 40 }}>
              <LaunchCalculatorButton calculatorPath="/calculators/cam-spec-elite">
                Try It Now — It&apos;s Free
              </LaunchCalculatorButton>
            </div>
          </section>

          <hr className="hr" />

          {/* FAQ Section */}
          <section style={{ padding: "32px 0" }}>
            <h2
              style={{
                fontSize: "1.5rem",
                fontWeight: 700,
                color: "#7dd3fc",
                textAlign: "center",
                marginBottom: 24,
              }}
            >
              Frequently Asked Questions
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 800, margin: "0 auto" }}>
              <FAQItem
                question="How do I calculate horsepower from cam specs?"
                answer="To calculate horsepower from cam specs, you need the intake and exhaust duration at 0.050&quot; lift, lobe separation angle (LSA), valve lift, intake valve closing (IVC) point, and your engine's displacement, compression ratio, and head flow. Our calculator combines these inputs with proven formulas to estimate peak HP and generate a full dyno curve."
              />
              <FAQItem
                question="What is dynamic compression ratio and why does it matter?"
                answer="Dynamic compression ratio (DCR) is the actual compression your engine sees based on when the intake valve closes. Unlike static CR, DCR accounts for the cam timing. A cam that closes the intake valve later (after BDC) reduces DCR, which affects power output and fuel requirements."
              />
              <FAQItem
                question="How accurate is this camshaft horsepower calculator?"
                answer="Cam HP calculators provide estimates based on mathematical models. Real dyno results depend on factors like engine condition, tuning, exhaust, and environmental conditions. Our calculator uses established engineering formulas and typically estimates within 5-15% of actual dyno results for well-built engines."
              />
              <FAQItem
                question="Can I calculate HP for turbocharged or supercharged engines?"
                answer="Yes! Our calculator supports both naturally aspirated and forced induction setups. Enter your boost pressure (PSI), select turbo or supercharger, and configure intercooler efficiency. The calculator adjusts HP estimates accounting for increased airflow and effective compression changes."
              />
              <FAQItem
                question="What cam specs do I need to use this calculator?"
                answer="You'll need: intake duration at 0.050&quot;, exhaust duration at 0.050&quot;, lobe separation angle (LSA), intake valve closing (IVC) degrees ABDC, intake lift, and exhaust lift. These specs are found on your cam card or the manufacturer's website."
              />
              <FAQItem
                question="Is this calculator really free?"
                answer="Yes, 100% free. Create an account to access the calculator and save your results. No credit card required, no trial period, no hidden fees."
              />
            </div>
          </section>

          <hr className="hr" />

          {/* Final CTA */}
          <section style={{ textAlign: "center", padding: "40px 20px" }}>
            <h2
              style={{
                fontSize: "1.75rem",
                fontWeight: 700,
                color: "#fff",
                marginBottom: 16,
              }}
            >
              Ready to Calculate Your Horsepower?
            </h2>
            <p style={{ color: "#94a3b8", marginBottom: 24, maxWidth: 500, margin: "0 auto 24px" }}>
              Join thousands of engine builders and enthusiasts using Cam Spec Elite to plan their builds.
            </p>
            <LaunchCalculatorButton calculatorPath="/calculators/cam-spec-elite">
              🏁 Get Started Free
            </LaunchCalculatorButton>
          </section>

          <hr className="hr" />

          {/* Related Tools */}
          <section style={{ padding: "24px 0" }}>
            <h2
              style={{
                fontSize: "1.25rem",
                fontWeight: 700,
                color: "#7dd3fc",
                marginBottom: 16,
              }}
            >
              More Performance Calculators
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 12,
              }}
            >
              <Link
                href="/calculators/camshaft-suggestor-basic"
                className="pill"
                style={{ textAlign: "center", padding: "12px 16px" }}
              >
                Cam Suggestor
              </Link>
              <Link
                href="/calculators/drag-simulator"
                className="pill"
                style={{ textAlign: "center", padding: "12px 16px" }}
              >
                Drag Simulator
              </Link>
              <Link
                href="/calculators/boost-estimator"
                className="pill"
                style={{ textAlign: "center", padding: "12px 16px" }}
              >
                Boost Estimator
              </Link>
              <Link
                href="/calculators/turbo-sizing-calculator"
                className="pill"
                style={{ textAlign: "center", padding: "12px 16px" }}
              >
                Turbo Sizing
              </Link>
              <Link
                href="/calculators"
                className="pill"
                style={{ textAlign: "center", padding: "12px 16px" }}
              >
                All Calculators →
              </Link>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

// Component helpers
function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div
      style={{
        background: "rgba(2,6,23,0.6)",
        border: "1px solid rgba(125,211,252,0.15)",
        borderRadius: 12,
        padding: 24,
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: "2rem", marginBottom: 12 }}>{icon}</div>
      <h3 style={{ color: "#f472b6", fontSize: "1.1rem", marginBottom: 8 }}>{title}</h3>
      <p style={{ color: "#94a3b8", fontSize: "0.9rem", lineHeight: 1.5, margin: 0 }}>{description}</p>
    </div>
  );
}

function StepCard({ step, title, description }: { step: number; title: string; description: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #06b6d4, #8b5cf6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 12px",
          fontSize: "1.25rem",
          fontWeight: 700,
        }}
      >
        {step}
      </div>
      <h3 style={{ color: "#7dd3fc", fontSize: "1rem", marginBottom: 6 }}>{title}</h3>
      <p style={{ color: "#94a3b8", fontSize: "0.85rem", lineHeight: 1.5, margin: 0 }}>{description}</p>
    </div>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details
      style={{
        background: "rgba(2,6,23,0.5)",
        borderRadius: 8,
        padding: 16,
        border: "1px solid rgba(125,211,252,0.2)",
      }}
    >
      <summary
        style={{
          color: "#7dd3fc",
          cursor: "pointer",
          fontWeight: 600,
        }}
      >
        {question}
      </summary>
      <p style={{ color: "#94a3b8", marginTop: 12, lineHeight: 1.6, marginBottom: 0 }}>{answer}</p>
    </details>
  );
}
