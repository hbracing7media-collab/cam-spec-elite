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

type Profile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
};

export default function ProfilePage() {
  const supabase = useMemo(() => makeSupabase(), []);
  const [msg, setMsg] = useState<string>("");
  const [email, setEmail] = useState<string | null>(null);
  const [uid, setUid] = useState<string | null>(null);

  // future
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      setMsg("");

      if (!supabase) {
        setMsg("Missing Supabase env vars in .env.local");
        return;
      }

      const { data: u, error: uerr } = await supabase.auth.getUser();
      if (!alive) return;

      if (uerr) {
        setMsg(uerr.message);
        return;
      }

      if (!u.user) {
        setEmail(null);
        setUid(null);
        setProfile(null);
        setMsg("Not logged in yet.");
        return;
      }

      setEmail(u.user.email ?? null);
      setUid(u.user.id);

      // If/when you add a profiles table, this will work.
      // For now it will just quietly skip if table isn't present.
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id,display_name,avatar_url")
          .eq("id", u.user.id)
          .single();

        if (!alive) return;

        if (!error && data) setProfile(data as Profile);
      } catch {
        // ignore until profiles table exists
      }
    }

    load();

    if (supabase) {
      const { data: sub } = supabase.auth.onAuthStateChange(() => load());
      return () => {
        alive = false;
        sub.subscription.unsubscribe();
      };
    }

    return () => {
      alive = false;
    };
  }, [supabase]);

  return (
    <div className="card">
      <div className="card-inner">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <h1 className="h1" style={{ margin: 0 }}>Profile</h1>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link className="pill" href="/">Home</Link>
            <Link className="pill" href="/forum">Forum</Link>
            <Link className="pill" href="/calculators">Calculators</Link>
          </div>
        </div>

        <hr className="hr" />

        {msg ? (
          <div className="card" style={{ background: "rgba(2,6,23,0.55)" }}>
            <div className="card-inner">
              <p className="small">{msg}</p>
              {!uid ? (
                <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <Link className="pill" href="/login">Go to Login</Link>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="grid-2" style={{ marginTop: 12 }}>
          <div className="card" style={{ background: "rgba(2,6,23,0.55)" }}>
            <div className="card-inner">
              <h2 className="h2">Account</h2>
              <p className="small"><b>Email:</b> {email ?? "—"}</p>
              <p className="small"><b>User ID:</b> {uid ?? "—"}</p>
            </div>
          </div>

          <div className="card" style={{ background: "rgba(2,6,23,0.55)" }}>
            <div className="card-inner">
              <h2 className="h2">Public Profile</h2>
              <p className="small"><b>Display Name:</b> {profile?.display_name ?? "—"}</p>
              <p className="small"><b>Avatar URL:</b> {profile?.avatar_url ?? "—"}</p>
              <p className="small" style={{ opacity: 0.85 }}>
                (Avatar upload + edit tools will be added next.)
              </p>
            </div>
          </div>
        </div>

        <hr className="hr" />

        <div className="small" style={{ opacity: 0.85 }}>
          Next: profile editing + avatar uploads (Storage) once calculators pages are finished.
        </div>
      </div>
    </div>
  );
}
