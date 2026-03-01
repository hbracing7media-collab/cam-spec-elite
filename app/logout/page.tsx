"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { supabase } from "../../lib/supabaseClient";

export default function Logout() {
  const router = useRouter();
  const t = useTranslations();

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
      <h1>{t("logout.message")}</h1>
    </main>
  );
}
