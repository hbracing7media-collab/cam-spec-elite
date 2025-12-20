import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

export async function POST(req: Request) {
  try {
    console.log("[DYNO-SUBMIT] Incoming request");
    
    // Get user from cookies directly
    const cookieStore = await cookies();
    const access_token = cookieStore.get("sb-access-token")?.value;

    if (!access_token) {
      console.log("[DYNO-SUBMIT] No access token in cookies");
      return Response.json(
        { ok: false, message: "Unauthorized - no access token" },
        { status: 401 }
      );
    }

    console.log("[DYNO-SUBMIT] Token found, validating...");

    // Get user info from the token
    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(access_token);
    
    if (authError) {
      console.error("[DYNO-SUBMIT] Auth error:", authError);
      return Response.json(
        { ok: false, message: "Unauthorized - token validation failed: " + authError.message },
        { status: 401 }
      );
    }

    if (!authData.user?.id) {
      console.log("[DYNO-SUBMIT] No user ID in auth response");
      return Response.json(
        { ok: false, message: "Unauthorized - no user found" },
        { status: 401 }
      );
    }

    const user_id = authData.user.id;
    console.log("[DYNO-SUBMIT] User authenticated:", user_id);

    // Parse FormData
    const formData = await req.formData();
    const engine_name = formData.get("engine_name") as string;
    const engine_make = formData.get("engine_make") as string;
    const engine_family = formData.get("engine_family") as string;
    const horsepower = parseFloat(formData.get("horsepower") as string);
    const torque = parseFloat(formData.get("torque") as string);
    const engine_specs = JSON.parse(formData.get("engine_specs") as string);
    const rpm_intervals = JSON.parse(formData.get("rpm_intervals") as string);
    const visibility = formData.get("visibility") as string;
    const selected_cam_id = formData.get("selected_cam_id") as string;
    const selected_head_id = formData.get("selected_head_id") as string;
    
    const dynoGraphFile = formData.get("dyno_graph") as File;
    const camCardFile = formData.get("cam_card") as File;
    const carPhotoFile = formData.get("car_photo") as File;

    console.log("[DYNO-SUBMIT] Request body:", {
      engine_name,
      engine_make,
      engine_family,
      horsepower,
      visibility,
      hasFiles: {
        dynoGraph: !!dynoGraphFile,
        camCard: !!camCardFile,
        carPhoto: !!carPhotoFile,
      },
    });

    if (!engine_name) {
      return Response.json(
        { ok: false, message: "Engine name is required" },
        { status: 400 }
      );
    }

    if (horsepower === null || horsepower === undefined || isNaN(horsepower)) {
      return Response.json(
        { ok: false, message: "Horsepower is required" },
        { status: 400 }
      );
    }

    if (!dynoGraphFile || !camCardFile || !carPhotoFile) {
      return Response.json(
        { ok: false, message: "All three image files are required" },
        { status: 400 }
      );
    }

    // Generate submission ID for storage paths
    const submissionId = crypto.randomUUID();
    const folder = `${user_id}/${submissionId}`;

    // Upload files to Supabase Storage
    let dynoRunPath: string | null = null;
    let camCardPath: string | null = null;
    let carPhotoPath: string | null = null;

    try {
      // Upload dyno graph
      const dynoGraphBuffer = await dynoGraphFile.arrayBuffer();
      const dynoGraphExt = dynoGraphFile.name.split(".").pop() || "jpg";
      dynoRunPath = `${folder}/dyno-graph.${dynoGraphExt}`;
      
      const { error: dynoError } = await supabaseAdmin.storage
        .from("dyno_runs")
        .upload(dynoRunPath, dynoGraphBuffer, {
          contentType: dynoGraphFile.type,
          upsert: true,
        });

      if (dynoError) {
        console.error("[DYNO-SUBMIT] Dyno graph upload error:", dynoError);
        return Response.json(
          { ok: false, message: "Failed to upload dyno graph: " + dynoError.message },
          { status: 500 }
        );
      }

      // Upload cam card
      const camCardBuffer = await camCardFile.arrayBuffer();
      const camCardExt = camCardFile.name.split(".").pop() || "jpg";
      camCardPath = `${folder}/cam-card.${camCardExt}`;
      
      const { error: camError } = await supabaseAdmin.storage
        .from("dyno_cam_cards")
        .upload(camCardPath, camCardBuffer, {
          contentType: camCardFile.type,
          upsert: true,
        });

      if (camError) {
        console.error("[DYNO-SUBMIT] Cam card upload error:", camError);
        return Response.json(
          { ok: false, message: "Failed to upload cam card: " + camError.message },
          { status: 500 }
        );
      }

      // Upload car photo
      const carPhotoBuffer = await carPhotoFile.arrayBuffer();
      const carPhotoExt = carPhotoFile.name.split(".").pop() || "jpg";
      carPhotoPath = `${folder}/car-photo.${carPhotoExt}`;
      
      const { error: carError } = await supabaseAdmin.storage
        .from("dyno_car_photos")
        .upload(carPhotoPath, carPhotoBuffer, {
          contentType: carPhotoFile.type,
          upsert: true,
        });

      if (carError) {
        console.error("[DYNO-SUBMIT] Car photo upload error:", carError);
        return Response.json(
          { ok: false, message: "Failed to upload car photo: " + carError.message },
          { status: 500 }
        );
      }

      console.log("[DYNO-SUBMIT] All files uploaded successfully");
    } catch (uploadErr: any) {
      console.error("[DYNO-SUBMIT] File upload error:", uploadErr);
      return Response.json(
        { ok: false, message: "File upload failed: " + uploadErr.message },
        { status: 500 }
      );
    }

    // Create engine submission with status: pending (requires admin approval)
    const { data: insertData, error: insertError } = await supabaseAdmin
      .from("dyno_submissions")
      .insert({
        engine_name,
        user_id,
        engine_make,
        engine_family,
        horsepower,
        torque,
        visibility: visibility || "public",
        status: "pending", // Requires admin approval
        dyno_run_image: dynoRunPath,
        cam_card_image: camCardPath,
        car_photo_image: carPhotoPath,
        selected_cam_id: selected_cam_id || null,
        selected_head_id: selected_head_id || null,
        spec: {
          engine_specs,
          rpm_intervals,
          submitted_at: new Date().toISOString(),
        },
      })
      .select();

    if (insertError) {
      console.error("[DYNO-SUBMIT] Insert error:", insertError);
      return Response.json(
        { ok: false, message: "Failed to submit dyno data: " + insertError.message, code: insertError.code },
        { status: 500 }
      );
    }

    console.log("[DYNO-SUBMIT] Success! Inserted:", insertData);

    return Response.json({
      ok: true,
      message: "Dyno submission successful! Pending admin approval.",
      submission: insertData?.[0],
    });
  } catch (err: any) {
    console.error("[DYNO-SUBMIT] Catch error:", err);
    return Response.json(
      { ok: false, message: "Server error: " + err.message },
      { status: 500 }
    );
  }
}
