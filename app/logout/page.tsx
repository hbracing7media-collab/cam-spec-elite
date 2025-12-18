"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

export default function Logout() {
  const router = useRouter();

  useEffect(() => {
    let finished = false;
    async function doLogout() {
      await supabase.auth.signOut().catch(() => {});
      await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
      if (!finished) {
        finished = true;
        router.replace("/auth/login");
      }
    }
    doLogout();
    const timeout = setTimeout(() => {
      if (!finished) {
        finished = true;
        router.replace("/auth/login");
      }
    }, 2000);
    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <main style={{ padding: 20, textAlign: "center" }}>
      <h1>Logging out...</h1>
    </main>
  );
}
