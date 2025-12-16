import { NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabase/server";

export async function GET() {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    return NextResponse.json({ ok: false, error: error?.message || "No session" }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    id: data.user.id,
    email: data.user.email ?? null,
  });
}
