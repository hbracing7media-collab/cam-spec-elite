import { NextResponse } from "next/server";
import { supabaseServer } from "../../../../../lib/supabase/server";

async function requireAdmin() {
  const supabase = await supabaseServer();

  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr) return { ok: false as const, status: 500, message: authErr.message, supabase };
  if (!auth.user) return { ok: false as const, status: 401, message: "Unauthorized", supabase };

  const { data: prof, error: profErr } = await supabase
    .from("cse_profiles")
    .select("is_admin")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (profErr) return { ok: false as const, status: 500, message: profErr.message, supabase };
  if (!prof?.is_admin) return { ok: false as const, status: 403, message: "Forbidden", supabase };

  return { ok: true as const, status: 200, supabase };
}

export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ error: gate.message }, { status: gate.status });

  const { data, error } = await gate.supabase
    .from("cse_cam_submissions")
    .select("id,user_id,status,spec,cam_card_path,dyno_sheet_paths,created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, items: data ?? [] }, { status: 200 });
}
