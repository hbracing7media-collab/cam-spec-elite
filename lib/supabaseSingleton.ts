import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Global singleton instance - ensures only ONE Supabase client exists
let instance: SupabaseClient | null = null;

export function getSupabaseInstance(): SupabaseClient {
  if (!instance) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!url || !key) {
      throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
    }
    
    instance = createClient(url, key);
  }
  
  return instance;
}
