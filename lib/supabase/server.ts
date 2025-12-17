import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

type CookieGetAll = () => Array<{ name: string; value: string }>;
type CookieSet = (name: string, value: string, options?: any) => void;

export function supabaseServer() {
  const cookieStore = cookies() as unknown as {
    getAll: CookieGetAll;
    set: CookieSet;
  };

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string | undefined;

  if (!url) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  if (!anon) throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY");

  return createServerClient(url, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  });
}
