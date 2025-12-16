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

export async function POST(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ error: gate.message }, { status: gate.status });

  const body = (await req.json().catch(() => ({}))) as any;

  const submission_id = body?.submission_id;
  const object_uuids = body?.object_uuids;

  if (!submission_id || typeof submission_id !== "string") {
    return NextResponse.json({ error: "Missing submission_id" }, { status: 400 });
  }
  if (!Array.isArray(object_uuids) || !object_uuids.every((x: any) => typeof x === "string")) {
    return NextResponse.json({ error: "object_uuids must be an array of strings" }, { status: 400 });
  }

  // Approve storage objects (your RPC lives in schema cse)
  for (const object_uuid of object_uuids as string[]) {
    const { error } = await gate.supabase.schema("cse").rpc("approve_storage_object", { object_uuid });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data, error } = await gate.supabase
    .from("cse_cam_submissions")
    .update({ status: "approved" })
    .eq("id", submission_id)
    .select("id,status")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, submission: data }, { status: 200 });
}
