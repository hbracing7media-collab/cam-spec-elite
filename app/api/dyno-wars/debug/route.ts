import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE) {
  throw new Error("Missing SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY");
}

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
});

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const type = url.searchParams.get("type") || "all"; // 'all', 'heads', 'cams'

    let result: any = {};

    if (type === "all" || type === "heads") {
      const { data: heads, error: headsError } = await supabaseAdmin
        .from("cylinder_heads")
        .select("id, part_name, brand, part_number, engine_make, engine_family, status")
        .limit(50);

      if (headsError) {
        result.headsError = headsError.message;
      } else {
        result.headsCount = heads?.length || 0;
        result.heads = heads || [];
        // Get unique makes and families
        const makes = [...new Set((heads || []).map((h: any) => h.engine_make))];
        const families = [...new Set((heads || []).map((h: any) => h.engine_family))];
        result.uniqueMakes = makes;
        result.uniqueFamilies = families;
      }
    }

    if (type === "all" || type === "cams") {
      const { data: cams, error: camsError } = await supabaseAdmin
        .from("cse_cam_submissions_table")
        .select("id, cam_name, brand, part_number, engine_make, engine_family, status")
        .limit(50);

      if (camsError) {
        result.camsError = camsError.message;
      } else {
        result.camsCount = cams?.length || 0;
        result.cams = cams || [];
        // Get unique makes and families
        const makes = [...new Set((cams || []).map((c: any) => c.engine_make))];
        const families = [...new Set((cams || []).map((c: any) => c.engine_family))];
        result.uniqueMakes = makes;
        result.uniqueFamilies = families;
      }
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("[DEBUG-API]", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
