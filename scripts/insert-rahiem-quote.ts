// Script to insert the layaway quote for Rahiem Richardson
// Run with: npx tsx scripts/insert-rahiem-quote.ts

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join } from "path";

// Manual env loading since dotenv might not be installed
function loadEnv() {
  try {
    const envPath = join(process.cwd(), ".env.local");
    const envContent = readFileSync(envPath, "utf-8");
    const env: Record<string, string> = {};
    for (const line of envContent.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIndex = trimmed.indexOf("=");
      if (eqIndex > 0) {
        const key = trimmed.substring(0, eqIndex).trim();
        let value = trimmed.substring(eqIndex + 1).trim();
        // Remove surrounding quotes
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        env[key] = value;
      }
    }
    return env;
  } catch (e) {
    console.error("Error loading env:", e);
    return {};
  }
}

const env = loadEnv();
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!;

console.log("Connecting to:", SUPABASE_URL);

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

async function insertQuote() {
  // Quote items from Invoice #701
  const items = [
    {
      name: "TSP HEMI 5.7L MDS Delete Kit w/ Camshaft",
      quantity: 1,
      price: 1187.31,
      description: "TSP HEMI 5.7L MDS Delete Kit with Camshaft",
    },
    {
      name: "Oil pan gasket",
      quantity: 1,
      price: 141.79,
    },
    {
      name: "WIX Spin-On Lube Filter",
      quantity: 1,
      price: 5.13,
    },
    {
      name: "MOBIL Full Synthetic 0W-20",
      quantity: 7,
      price: 4.79,
      description: "Mobil Full Synthetic; SAE 0W-20; 1 Quart",
    },
    {
      name: "PRESTONE All Vehicles Antifreeze/Coolant",
      quantity: 2,
      price: 8.21,
      description: "1 Gallon",
    },
    {
      name: "Shipping",
      quantity: 1,
      price: 33.98,
    },
    {
      name: "Labor (18 hours)",
      quantity: 18,
      price: 105.00,
      description: "Professional installation labor",
    },
  ];

  const subtotal = 3308.16;
  const taxAmount = 322.55;
  const shippingCost = 0; // Included in items
  const totalAmount = 3630.71;

  // Suggested payment plan: 25% down, 4 biweekly payments
  const downPaymentPercent = 25;
  const numPayments = 4;
  const paymentFrequency = "biweekly";
  const downPaymentAmount = Math.round((totalAmount * downPaymentPercent / 100) * 100) / 100;
  const remainingBalance = totalAmount - downPaymentAmount;
  const paymentAmount = Math.round((remainingBalance / numPayments) * 100) / 100;

  // Valid until April 30, 2026
  const validUntil = "2026-04-30";

  // Generate quote number
  const quoteNumber = `QTE-20260330-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  // Try to find user by email
  const { data: userProfile } = await supabase
    .from("user_profiles")
    .select("user_id")
    .eq("email", "rahiem.richardson@icloud.com")
    .single();

  const { data: quote, error } = await supabase
    .from("layaway_quotes")
    .insert({
      quote_number: quoteNumber,
      user_id: userProfile?.user_id || null,
      customer_name: "Rahiem Richardson",
      customer_email: "rahiem.richardson@icloud.com",
      customer_phone: "731-439-6808",
      items,
      subtotal,
      tax_amount: taxAmount,
      shipping_cost: shippingCost,
      total_amount: totalAmount,
      discount_amount: 0,
      discount_description: null,
      suggested_down_payment_percent: downPaymentPercent,
      suggested_payment_frequency: paymentFrequency,
      suggested_num_payments: numPayments,
      suggested_down_payment_amount: downPaymentAmount,
      suggested_payment_amount: paymentAmount,
      valid_until: validUntil,
      status: "pending",
      customer_notes: "HEMI 5.7L MDS Delete Kit Installation - All sales final, payment due upon receipt.",
      admin_notes: "Invoice #701 - Salesperson: Phill Hudson",
    })
    .select()
    .single();

  if (error) {
    console.error("Error inserting quote:", error);
    process.exit(1);
  }

  console.log("\n✅ Quote created successfully!");
  console.log("━".repeat(50));
  console.log(`Quote Number: ${quote.quote_number}`);
  console.log(`Quote ID: ${quote.id}`);
  console.log(`Customer: ${quote.customer_name}`);
  console.log(`Email: ${quote.customer_email}`);
  console.log(`Total: $${quote.total_amount.toFixed(2)}`);
  console.log(`Valid Until: ${quote.valid_until}`);
  console.log("━".repeat(50));
  console.log("\n📧 Quote URL:");
  console.log(`   http://localhost:3000/shop/layaway/quote/${quote.id}`);
  console.log(`   https://camspecelite.com/shop/layaway/quote/${quote.id}`);
  console.log("\nPayment Plan:");
  console.log(`   Down Payment (${downPaymentPercent}%): $${downPaymentAmount.toFixed(2)}`);
  console.log(`   ${numPayments} ${paymentFrequency} payments of: $${paymentAmount.toFixed(2)}`);
}

insertQuote().catch(console.error);
