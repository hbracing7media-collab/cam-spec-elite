import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: Request) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRole) {
    return NextResponse.json({ ok: false, message: "Server misconfigured" }, { status: 500 });
  }

  try {
    const url = new URL(req.url);
    const make = url.searchParams.get("make");
    const family = url.searchParams.get("family");

    console.log(`[Heads API] Searching for: make="${make}", family="${family}"`);

    const supabase = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });

    let query = supabase
      .from("cylinder_heads")
      .select("*");

    if (make) {
      query = query.ilike("engine_make", `%${make}%`);
    }

    if (family) {
      query = query.ilike("engine_family", `%${family}%`);
    }

    const { data: heads, error } = await query.order("created_at", { ascending: false });

    console.log(`[Heads API] Found ${heads?.length || 0} heads. Error: ${error?.message || "none"}`);
    console.log(`[Heads API] Response data:`, JSON.stringify(heads, null, 2));

    if (error) {
      console.error("Error fetching heads:", error);
      return NextResponse.json({ ok: false, message: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, heads });
  } catch (err: any) {
    console.error("Exception:", err);
    return NextResponse.json({ ok: false, message: err.message }, { status: 500 });
  }
}
