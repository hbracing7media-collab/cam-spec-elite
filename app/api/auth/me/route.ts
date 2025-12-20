import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const cookieStore = await cookies();

  if (!supabaseUrl || !serviceRole) {
    return NextResponse.json({ ok: false, message: "Server misconfigured" }, { status: 500 });
  }

  const access_token = cookieStore.get("sb-access-token")?.value;
  if (!access_token) {
    return NextResponse.json({ ok: false, message: "Not authenticated" }, { status: 401 });
  }

  // Use service role for admin validation
  const supabase = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });
  const { data, error } = await supabase.auth.getUser(access_token);

  if (error || !data.user) {
    return NextResponse.json({ ok: false, message: "Not authenticated" }, { status: 401 });
  }

  // Fetch user profile data
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("forum_handle,forum_avatar_url")
    .eq("id", data.user.id)
    .single();

  // Merge profile data with auth user
  const userWithProfile = {
    ...data.user,
    forum_handle: profile?.forum_handle || null,
    forum_avatar_url: profile?.forum_avatar_url || null,
  };

  return NextResponse.json({ ok: true, user: userWithProfile });
}