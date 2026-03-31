import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRole) {
    return NextResponse.json({ error: "Missing credentials" }, { status: 500 });
  }

  const supabase = createClient(url, serviceRole, { auth: { persistSession: false } });

  // Check table columns
  const { data: columns, error: colError } = await supabase
    .from("information_schema.columns")
    .select("column_name, data_type, column_default")
    .eq("table_schema", "public")
    .eq("table_name", "cylinder_heads");

  if (colError) {
    // Try raw SQL instead
    const { data: rawData, error: rawError } = await supabase.rpc("get_cylinder_heads_columns");
    
    // Fallback: just try to select one row
    const { data: sample, error: sampleError } = await supabase
      .from("cylinder_heads")
      .select("*")
      .limit(1);

    return NextResponse.json({
      columns_error: colError.message,
      sample_row: sample?.[0] || null,
      sample_keys: sample?.[0] ? Object.keys(sample[0]) : [],
      sample_error: sampleError?.message || null,
    });
  }

  // Get pending count
  const { count: pendingCount, error: pendingError } = await supabase
    .from("cylinder_heads")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  // Get all statuses
  const { data: allHeads, error: allError } = await supabase
    .from("cylinder_heads")
    .select("id, status, brand, part_number")
    .limit(10);

  return NextResponse.json({
    columns: columns?.map((c: any) => c.column_name) || [],
    has_status_column: columns?.some((c: any) => c.column_name === "status") || false,
    pending_count: pendingCount,
    pending_error: pendingError?.message || null,
    sample_heads: allHeads || [],
    all_error: allError?.message || null,
  });
}
