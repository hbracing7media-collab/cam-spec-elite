import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

// GET - Fetch notification preferences
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

  const supabase = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });
  const { data: { user }, error: userError } = await supabase.auth.getUser(access_token);

  if (userError || !user) {
    return NextResponse.json({ ok: false, message: "Not authenticated" }, { status: 401 });
  }

  // Fetch existing preferences or return defaults
  const { data: prefs, error: prefsError } = await supabase
    .from("forum_notification_preferences")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (prefsError && prefsError.code !== "PGRST116") {
    // PGRST116 = no rows found, which is fine - we'll return defaults
    console.error("Error fetching notification preferences:", prefsError);
    return NextResponse.json({ ok: false, message: prefsError.message }, { status: 400 });
  }

  // Return preferences or defaults
  return NextResponse.json({
    ok: true,
    preferences: prefs || {
      notify_on_thread_reply: true,
      notify_on_post_reply: true,
      notify_on_mention: true,
    },
  });
}

// POST - Update notification preferences
export async function POST(req: Request) {
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

  const body = await req.json();
  const { notify_on_thread_reply, notify_on_post_reply, notify_on_mention } = body;

  const supabase = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });
  const { data: { user }, error: userError } = await supabase.auth.getUser(access_token);

  if (userError || !user) {
    return NextResponse.json({ ok: false, message: "Not authenticated" }, { status: 401 });
  }

  // Upsert preferences
  const { data: prefs, error: prefsError } = await supabase
    .from("forum_notification_preferences")
    .upsert({
      user_id: user.id,
      notify_on_thread_reply: notify_on_thread_reply ?? true,
      notify_on_post_reply: notify_on_post_reply ?? true,
      notify_on_mention: notify_on_mention ?? true,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: "user_id",
    })
    .select()
    .single();

  if (prefsError) {
    console.error("Error updating notification preferences:", prefsError);
    return NextResponse.json({ ok: false, message: prefsError.message }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    message: "Notification preferences updated!",
    preferences: prefs,
  });
}
