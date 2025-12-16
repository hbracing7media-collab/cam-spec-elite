"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

function makeSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  return createClient(url, anon);
}

export default function LogoutPage() {
  const supabase = useMemo(() => makeSupabase(), []);
  const [msg, setMsg] = useState("Logging out…");

  useEffect(() => {
    (async () => {
      try {
        if (!supabase) {
          setMsg("Missing Supabase env vars in .env.local");
          return;
        }
        await supabase.auth.signOut();
        setMsg("Logged out.");
      } catch (e: any) {
        setMsg(e?.message ?? "Logout error");
      }
    })();
  }, [supabase]);

  return (
    <div className="card">
      <div className="card-inner">
        <h1 className="h1">Logout</h1>
        <p className="small">{msg}</p>

        <hr className="hr" />

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link className="pill" href="/">Home</Link>
          <Link className="pill" href="/login">Login</Link>
          <Link className="pill" href="/forum">Forum</Link>
        </div>
      </div>
    </div>
  );
}
