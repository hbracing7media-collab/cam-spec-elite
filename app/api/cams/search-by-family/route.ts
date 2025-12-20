import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: Request) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRole) {
    return NextResponse.json({ ok: false, message: "Server misconfigured" }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const engine_make = searchParams.get("engine_make");
    const engine_family = searchParams.get("engine_family");

    if (!engine_make || !engine_family) {
      return NextResponse.json({ ok: false, message: "engine_make and engine_family are required" }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });

    const { data: cams, error } = await supabase
      .from("cse_cam_submissions_table")
      .select("id, name, brand, part_number, engine_make, engine_family, status")
      .eq("engine_make", engine_make)
      .eq("engine_family", engine_family)
      .eq("status", "approved")
      .order("brand", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching cams:", error);
      return NextResponse.json({ ok: false, message: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, cams: cams || [] });
  } catch (err: any) {
    console.error("Exception:", err);
    return NextResponse.json({ ok: false, message: err.message }, { status: 500 });
  }
}
