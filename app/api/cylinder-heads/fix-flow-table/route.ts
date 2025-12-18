import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRole) {
    return NextResponse.json({ ok: false, message: "Server misconfigured" }, { status: 500 });
  }

  const supabase = createClient(url, serviceRole, { auth: { persistSession: false } });

  try {
    // Run the migration SQL to fix the table
    const { error } = await supabase.rpc("exec_sql", {
      sql: `
        DROP TABLE IF EXISTS public.cylinder_heads_flow_data CASCADE;

        CREATE TABLE public.cylinder_heads_flow_data (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          head_id UUID NOT NULL REFERENCES public.cylinder_heads(id) ON DELETE CASCADE,
          lift NUMERIC NOT NULL,
          intake_flow NUMERIC NOT NULL,
          exhaust_flow NUMERIC NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE INDEX idx_cylinder_heads_flow_data_head_id ON public.cylinder_heads_flow_data (head_id);

        ALTER TABLE public.cylinder_heads_flow_data ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "Public view flow data for approved heads" ON public.cylinder_heads_flow_data
          FOR SELECT USING (
            EXISTS (
              SELECT 1 FROM public.cylinder_heads 
              WHERE id = head_id AND status = 'approved'
            )
          );
      `,
    });

    if (error) {
      // rpc might not exist, try direct SQL approach
      console.log("RPC exec_sql not available, trying alternative...");
      
      // Alternative: We'll create a simple test to verify table structure
      const { data: tableInfo, error: checkError } = await supabase
        .from("information_schema.columns")
        .select("column_name, data_type, column_default")
        .eq("table_name", "cylinder_heads_flow_data")
        .eq("table_schema", "public");

      return NextResponse.json({
        ok: false,
        message: "Please run the migration manually in Supabase SQL Editor. Copy the SQL from migrations/007_fix_cylinder_heads_flow_data_table.sql",
        error: error?.message,
        table_columns: tableInfo,
      });
    }

    return NextResponse.json({
      ok: true,
      message: "Table fixed! cylinder_heads_flow_data now has auto-generating IDs",
    });
  } catch (err) {
    console.error("Error:", err);
    return NextResponse.json(
      { ok: false, message: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}
