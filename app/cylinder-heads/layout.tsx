import Link from "next/link";

export default function CylinderHeadsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div
        style={{
          padding: 20,
          maxWidth: 600,
          margin: "0 auto",
        }}
      >
        <div style={{ display: "flex", gap: 10, marginBottom: 20, justifyContent: "center" }}>
          <Link href="/cylinder-heads/submit" className="pill" style={{ textDecoration: "none" }}>Submit Head</Link>
        </div>
        {children}
      </div>
    </>
  );
}
