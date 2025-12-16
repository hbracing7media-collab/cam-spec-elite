import { NextResponse } from "next/server";
import { supabaseServer } from "../../../../../lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await supabaseServer();

  // must be logged in
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr) return NextResponse.json({ error: userErr.message }, { status: 500 });
  if (!userData.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // must be admin
  const { data: adminOk, error: adminErr } = await supabase.rpc("is_admin");
  if (adminErr) return NextResponse.json({ error: adminErr.message }, { status: 500 });
  if (!adminOk) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // read body
  const body = await req.json().catch(() => ({}));
  const object_uuid = body?.object_uuid;

  if (!object_uuid || typeof object_uuid !== "string") {
    return NextResponse.json({ error: "Missing object_uuid" }, { status: 400 });
  }

  // approve via SQL function
  const { data, error } = await supabase.rpc("approve_storage_object", { object_uuid });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, result: data ?? null }, { status: 200 });
}
