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
    // Check current table structure
    const { data: columnInfo } = await supabase.rpc("get_columns", { table_name: "cylinder_heads_flow_data" }).catch(() => ({ data: null }));

    // Try to insert a test record to see if id auto-generates
    const testId = crypto.randomUUID();
    const { error: insertError } = await supabase
      .from("cylinder_heads_flow_data")
      .insert({
        head_id: "05dd0ad0-5fe6-4a60-86c6-18eea5fc5409",
        lift: 0.05,
        intake_flow: 45,
        exhaust_flow: 38,
      });

    if (insertError && insertError.message.includes("null value in column \"id\"")) {
      return NextResponse.json({
        ok: false,
        message: "Table still needs to be fixed. Run the SQL migration in Supabase SQL Editor.",
        error: insertError.message,
        instructions: `
1. Go to Supabase Dashboard > SQL Editor
2. Create a new query and paste:

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

3. Click Run
4. Come back here and POST again to verify
        `,
      });
    }

    if (insertError) {
      return NextResponse.json({
        ok: false,
        message: `Insert error: ${insertError.message}`,
      });
    }

    return NextResponse.json({
      ok: true,
      message: "✅ Table is fixed and working! Flow data can now be inserted.",
      test_insert: "Success - auto-generated ID worked!",
    });
  } catch (err) {
    console.error("Error:", err);
    return NextResponse.json(
      { ok: false, message: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}
