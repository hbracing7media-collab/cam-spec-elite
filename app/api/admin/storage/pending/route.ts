import { NextResponse } from "next/server";
import { supabaseServer } from "../../../../../lib/supabase/server";

export async function GET() {
  const supabase = await supabaseServer();

  // must be logged in
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr) return NextResponse.json({ error: userErr.message }, { status: 500 });
  if (!userData.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // must be admin (this expects you created public.is_admin() in SQL earlier)
  const { data: adminOk, error: adminErr } = await supabase.rpc("is_admin");
  if (adminErr) return NextResponse.json({ error: adminErr.message }, { status: 500 });
  if (!adminOk) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // list pending objects (expects your SQL function exists)
  const { data, error } = await supabase.rpc("list_pending_storage_uploads");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, items: data ?? [] }, { status: 200 });
}
