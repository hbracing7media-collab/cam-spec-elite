import Link from "next/link";

export default function CamsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "radial-gradient(circle at 20% 10%, rgba(236,72,153,0.10), rgba(2,6,23,0.98))",
        color: "#e2e8f0",
        fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
      }}
    >
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          borderBottom: "1px solid rgba(236,72,153,0.20)",
          background: "rgba(2,6,23,0.78)",
          backdropFilter: "blur(10px)",
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            padding: "10px 14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                fontWeight: 900,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#f472b6",
                fontSize: 12,
              }}
            >
              Cam Spec Elite
            </div>

            <span style={{ color: "rgba(148,163,184,0.9)", fontSize: 12 }}>
              Cams
            </span>
          </div>

          <nav style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <NavPill href="/cams">Cams</NavPill>
            <NavPill href="/upload">Uploads</NavPill>
            <NavPill href="/forum">Forum</NavPill>
            <NavPill href="/">Home</NavPill>
          </nav>
        </div>
      </header>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: 14 }}>
        {children}
      </div>
    </div>
  );
}

function NavPill({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      style={{
        textDecoration: "none",
        padding: "9px 12px",
        borderRadius: 999,
        border: "1px solid rgba(236,72,153,0.22)",
        background: "linear-gradient(90deg, rgba(236,72,153,0.10), rgba(34,211,238,0.08))",
        color: "#e2e8f0",
        fontSize: 12,
        fontWeight: 800,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
      }}
    >
      {children}
    </Link>
  );
}
