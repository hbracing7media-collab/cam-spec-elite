import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRole) {
    return NextResponse.json({ ok: false, message: "Server misconfigured" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });

  // Get optional category filter from query string
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");

  let query = supabase
    .from("cse_parts_products")
    .select("*")
    .eq("is_active", true);

  // Apply category filter if provided
  if (category) {
    query = query.eq("category", category);
  }

  // Order by price then name for cylinder heads, otherwise featured then created_at
  let result;
  if (category === "cylinder_head") {
    result = await query
      .order("price", { ascending: true })
      .order("name", { ascending: true });
  } else {
    result = await query
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false });
  }

  const { data, error } = result;

  if (error) {
    console.error("Failed to fetch products:", error);
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, products: data });
}
