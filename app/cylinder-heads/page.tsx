"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

function useAuthCheck() {
  const router = useRouter();
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const res = await fetch("/api/auth/me");
      if (!res.ok) {
        router.replace("/auth/login");
      } else {
        setIsAuthed(true);
      }
    };
    checkAuth();
  }, [router]);

  return isAuthed;
}

type Head = {
  id: string;
  name: string;
  brand: string;
  created_at: string;
};

export default function ViewHeadsPage() {
  const isAuthed = useAuthCheck();
  const [heads, setHeads] = useState<Head[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchHeads = async () => {
      try {
        const res = await fetch("/api/cylinder-heads/list");
        if (res.ok) {
          const data = await res.json();
          setHeads(data.heads || []);
        }
      } catch (error) {
        console.error("Failed to load heads:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHeads();
  }, []);

  const filteredHeads = heads.filter(
    (head) =>
      head.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      head.brand.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div>Loading...</div>;

  return (
    <main style={{ padding: 20, maxWidth: 600, margin: "0 auto" }}>
      <div
        style={{
          borderRadius: 18,
          padding: 30,
          border: "1px solid rgba(168,85,247,0.35)",
          background: "radial-gradient(circle at 20% 10%, rgba(168,85,247,0.16), rgba(15,23,42,0.92))",
          boxShadow: "0 18px 50px rgba(0,0,0,0.6)",
          color: "#e2e8f0",
          fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
        }}
      >
        <h1
          style={{
            margin: "0 0 8px 0",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            fontSize: 20,
            color: "#d8b4fe",
          }}
        >
          Cylinder Heads
        </h1>

        <p
          style={{
            marginTop: 0,
            marginBottom: 24,
            color: "rgba(226,232,240,0.8)",
            fontSize: 13,
          }}
        >
          Browse approved cylinder head specifications.
        </p>

        <div style={{ marginBottom: 24 }}>
          <label
            style={{
              display: "block",
              fontSize: 12,
              fontWeight: 600,
              color: "#d8b4fe",
              marginBottom: 8,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Search
          </label>
          <input
            type="text"
            placeholder="Search by name or brand..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: 8,
              border: "1px solid rgba(148,163,184,0.3)",
              background: "rgba(2,6,23,0.6)",
              color: "#e2e8f0",
              fontSize: 13,
              fontFamily: "inherit",
              boxSizing: "border-box",
            }}
          />
        </div>

        {filteredHeads.length === 0 ? (
          <div style={{ opacity: 0.7, textAlign: "center", padding: 20 }}>
            {heads.length === 0 ? "No heads available yet." : "No results found."}
          </div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {filteredHeads.map((head) => (
              <div
                key={head.id}
                style={{
                  padding: 16,
                  borderRadius: 12,
                  border: "1px solid rgba(168,85,247,0.25)",
                  background: "rgba(168,85,247,0.08)",
                  transition: "all 0.2s ease",
                }}
              >
                <div style={{ fontWeight: 600, color: "#d8b4fe", marginBottom: 4 }}>
                  {head.name}
                </div>
                <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 8 }}>
                  {head.brand}
                </div>
                <div style={{ fontSize: 11, opacity: 0.6 }}>
                  {new Date(head.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
