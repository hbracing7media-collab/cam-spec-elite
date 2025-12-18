import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRole) {
    return NextResponse.json({ ok: false, message: "Server misconfigured" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });

  try {
    const { data: heads, error } = await supabase
      .from("cylinder_heads")
      .select("*")
      .order("brand", { ascending: true });

    if (error) {
      console.error("Query error:", error);
      return NextResponse.json({ ok: false, message: error.message }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      heads,
    });
  } catch (err) {
    console.error("Error:", err);
    return NextResponse.json({ ok: false, message: "Error loading cylinder heads" }, { status: 500 });
  }
}
