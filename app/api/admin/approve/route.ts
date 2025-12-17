import { NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = supabaseServer();
    const body = await req.json().catch(() => null);

    const object_id = body?.object_id;
    if (!object_id || typeof object_id !== "string") {
      return NextResponse.json({ error: "Missing object_id" }, { status: 400 });
    }

    // Check admin
    const { data: isAdmin, error: adminErr } = await supabase
      .schema("cse")
      .rpc("current_user_is_admin");

    if (adminErr) {
      return NextResponse.json({ error: adminErr.message }, { status: 500 });
    }
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Approve file
    const { error: approveErr } = await supabase
      .schema("cse")
      .rpc("approve_storage_object", { object_id });

    if (approveErr) {
      return NextResponse.json({ error: approveErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}
