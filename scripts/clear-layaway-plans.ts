// Temporary script to delete all test layaway plans
// Run with: npx ts-node --esm scripts/clear-layaway-plans.ts
// Or just visit /api/admin/clear-layaway-plans (one-time use)

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

async function clearLayawayPlans() {
  console.log("Deleting all layaway payments...");
  const { error: paymentsError } = await supabase
    .from("layaway_payments")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all

  if (paymentsError) {
    console.error("Error deleting payments:", paymentsError);
  } else {
    console.log("✓ Layaway payments deleted");
  }

  console.log("Deleting all layaway plans...");
  const { error: plansError } = await supabase
    .from("layaway_plans")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all

  if (plansError) {
    console.error("Error deleting plans:", plansError);
  } else {
    console.log("✓ Layaway plans deleted");
  }

  console.log("Done!");
}

clearLayawayPlans();
