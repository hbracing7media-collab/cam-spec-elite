import { createClient } from "@supabase/supabase-js";

/**
 * Client-side Supabase instance
 * Used ONLY in client components and browser logic
 */
export function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase env vars are missing");
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Get the currently logged-in user
 */
export async function getCurrentUser() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) return null;
  return data.user;
}

/**
 * Login with email/password
 */
export async function loginWithEmail(email: string, password: string) {
  const supabase = getSupabaseClient();
  return supabase.auth.signInWithPassword({
    email,
    password,
  });
}

/**
 * Signup with email/password
 */
export async function signupWithEmail(email: string, password: string) {
  const supabase = getSupabaseClient();
  return supabase.auth.signUp({
    email,
    password,
  });
}

/**
 * Logout current user
 */
export async function logout() {
  const supabase = getSupabaseClient();
  return supabase.auth.signOut();
}
