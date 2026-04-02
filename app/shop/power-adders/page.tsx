"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { calculateSalesTax, formatTaxRate, getAllStates } from "@/lib/salesTax";

interface PowerAdderProduct {
  id: string;
  name: string;
  brand: string;
  partNumber: string;
  description: string;
  category: "turbo" | "supercharger" | "nitrous" | "intercooler" | "wastegate" | "blow-off-valve" | "piping" | "accessories";
  subcategory?: string;
  power?: string; // HP support
  compressor?: string; // Compressor wheel specs
  turbine?: string; // Turbine wheel specs
  ar?: string; // A/R ratio
  price: number;
  compareAtPrice?: number;
  originalPrice?: number;
  inStock: boolean;
  image?: string;
  isRealImage?: boolean;
  shippingCost?: number;
  specs?: Record<string, string>;
}

interface CartItem {
  id: string;
  name: string;
  brand: string;
  partNumber: string;
  price: number;
  quantity: number;
  image: string;
  shippingCost?: number;
}

interface CheckoutForm {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  notes: string;
}

const SHIPPING_COST = 49.99;

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  background: "rgba(30, 30, 50, 0.8)",
  border: "1px solid rgba(255, 100, 50, 0.3)",
  borderRadius: 8,
  color: "#e2e8f0",
  fontSize: 14,
  outline: "none",
};

// Image paths for Texas Speed products - mapped to match website order (download order)
const IMAGE_PATHS: Record<string, string> = {
  // Products 1-13: Precision Turbo (positions match)
  'pt-74-85': '/shop/power%20adders/turbos+/25780.webp',           // pos 1
  'pt-56-62': '/shop/power%20adders/turbos+/25681.webp',           // pos 2
  'pt-scp-66-70': '/shop/power%20adders/turbos+/25698_1.webp',     // pos 3
  'pt-74-80-sportsman': '/shop/power%20adders/turbos+/25783_1.webp', // pos 4
  'pt-nextr-62-80': '/shop/power%20adders/turbos+/25791.webp',     // pos 5
  'pt-68-80-sportsman': '/shop/power%20adders/turbos+/25758_1.webp', // pos 6
  'pt-ss-vband-rr-68-70': '/shop/power%20adders/turbos+/25745_1.webp', // pos 7
  'pt-t3-rr-62-66': '/shop/power%20adders/turbos+/25690.webp',     // pos 8
  'pt-scp-68-70': '/shop/power%20adders/turbos+/25727_1.webp',     // pos 9
  'pt-71-80-sportsman': '/shop/power%20adders/turbos+/25778_1.webp', // pos 10
  'pt-t3-rr-56-58': '/shop/power%20adders/turbos+/25680_1.webp',   // pos 11
  'pt-80-80-sportsman': '/shop/power%20adders/turbos+/25786_2.webp', // pos 12
  'pt-68-75-sportsman': '/shop/power%20adders/turbos+/25755.webp', // pos 13
  // Position 14: S&B Green screen (was incorrectly assigned to pt-scp-64-66)
  'sb-turbo-screen-green': '/shop/power%20adders/turbos+/19709_2.webp', // pos 14
  'pt-scp-64-66': '/shop/power%20adders/turbos+/25692_2.webp',     // pos 15
  'pt-71-75-sportsman': '/shop/power%20adders/turbos+/25759.webp', // pos 16
  'pt-74-80-sportsman-1375': '/shop/power%20adders/turbos+/25781.webp', // pos 17
  'pt-83-85-sportsman': '/shop/power%20adders/turbos+/25787.webp', // pos 18
  'pt-75-75': '/shop/power%20adders/turbos+/25754_1.webp',         // pos 19
  'pt-80-85-sportsman': '/shop/power%20adders/turbos+/25784.webp', // pos 20
  // Position 21: S&B Red screen
  'sb-turbo-screen-red': '/shop/power%20adders/turbos+/19707_1.webp', // pos 21
  'pt-86-85-sportsman': '/shop/power%20adders/turbos+/25790.webp', // pos 22
  'pt-68-85-sportsman': '/shop/power%20adders/turbos+/25757.webp', // pos 23
  'pt-56-58': '/shop/power%20adders/turbos+/25678_1.webp',         // pos 24
  'pt-scp-68-75': '/shop/power%20adders/turbos+/25746.webp',       // pos 25
  'pt-74-75-sportsman': '/shop/power%20adders/turbos+/25779.webp', // pos 26
  'pt-t3-rr-h-64-66': '/shop/power%20adders/turbos+/25695.webp',   // pos 27
  'pt-60-62': '/shop/power%20adders/turbos+/25689_1.webp',         // pos 28
  'pt-62-66': '/shop/power%20adders/turbos+/25691_1.webp',         // pos 29
  'pt-h-68-75': '/shop/power%20adders/turbos+/25750.webp',         // pos 30
  'pt-t3-rr-scp-64-66': '/shop/power%20adders/turbos+/25693.webp', // pos 31
  'pt-h-66-70': '/shop/power%20adders/turbos+/25718_1.webp',       // pos 32
  'pt-76-85-sportsman': '/shop/power%20adders/turbos+/25782_1.webp', // pos 33
  'pt-h-68-70': '/shop/power%20adders/turbos+/25738.webp',         // pos 34
  'pt-ss-rr-scp-68-70': '/shop/power%20adders/turbos+/25742_1.webp', // pos 35
  'pt-hp-64-66': '/shop/power%20adders/turbos+/25694_1.webp',      // pos 36
  // Positions 37-38: S&B Black and Blue screens
  'sb-turbo-screen-black': '/shop/power%20adders/turbos+/19706.webp', // pos 37
  'sb-turbo-screen-blue': '/shop/power%20adders/turbos+/19708_1.webp', // pos 38
  // Positions 39-60: Turbosmart and VS Racing products
  'ts-iwg75-gt2860rs': '/shop/power%20adders/turbos+/25761.webp',  // pos 39
  'ts-bov-controller-kit': '/shop/power%20adders/turbos+/25723.webp', // pos 40
  'vs-4-113mm-t6': '/shop/power%20adders/turbos+/26487.webp',      // pos 41
  'ts-wg40-compgate-blue': '/shop/power%20adders/turbos+/9196.webp', // pos 42
  'ts-wg60cg-black': '/shop/power%20adders/turbos+/9205.webp',     // pos 43
  'ts-bov-raceport-red': '/shop/power%20adders/turbos+/9185.webp', // pos 44
  'ts-ts2-7170-wc': '/shop/power%20adders/turbos+/25724.webp',     // pos 45
  'ts-raceport-plumback-sc': '/shop/power%20adders/turbos+/25772.webp', // pos 46
  'ts-ts2-6466-wc': '/shop/power%20adders/turbos+/25743.webp',     // pos 47
  'ts-proport-sleeper': '/shop/power%20adders/turbos+/25767.webp', // pos 48
  'ts-wg60cg-blue': '/shop/power%20adders/turbos+/9204.webp',      // pos 49
  'ts-big-bubba-sleeper': '/shop/power%20adders/turbos+/25748.webp', // pos 50
  'ts-bov-raceport-female-purple': '/shop/power%20adders/turbos+/9188.webp', // pos 51
  'ts-iwg75-twin-14psi': '/shop/power%20adders/turbos+/25739.webp', // pos 52
  'ts-raceport-sc-black': '/shop/power%20adders/turbos+/25737.webp', // pos 53
  'ts-ts1-7880-vband': '/shop/power%20adders/turbos+/25732.webp',  // pos 54
  'ts-ts1-6870-kompact': '/shop/power%20adders/turbos+/25717.webp', // pos 55
  'ts-ts1-6262-rr': '/shop/power%20adders/turbos+/25740.webp',     // pos 56
  'ts-opr-fitting-kit': '/shop/power%20adders/turbos+/9208.webp',  // pos 57
  'ts-wg40-compgate-black': '/shop/power%20adders/turbos+/9197.webp', // pos 58
  'ts-ts1-7880-t4': '/shop/power%20adders/turbos+/25735.webp',     // pos 59
  'ts-wg50-progate-black': '/shop/power%20adders/turbos+/9201.webp', // pos 60
  // Positions 61-117 - Corrected based on website order
  'ts-ebg50': '/shop/power%20adders/turbos+/25683.webp',           // pos 61 - eBG50 Electronic BoostGate
  'ts-fpr-800': '/shop/power%20adders/turbos+/9193.webp',          // pos 62 - FPR 800
  'ts-raceport-plumback-sleeper': '/shop/power%20adders/turbos+/25711.webp', // pos 63 - RacePort Plumback Sleeper
  'ts-ts1-6262-vband': '/shop/power%20adders/turbos+/25722.webp',  // pos 64 - TS-1 6262 V-Band
  'ts-bov-raceport-female-sleeper': '/shop/power%20adders/turbos+/25760.webp', // pos 65 - BOV RacePort Female Sleeper
  'ts-proport-black': '/shop/power%20adders/turbos+/25764.webp',   // pos 66 - ProPort BOV Black
  'ts-raceport-em-sleeper': '/shop/power%20adders/turbos+/25775.webp', // pos 67 - RacePort EM Sleeper
  'ts-ts1-6466-vband': '/shop/power%20adders/turbos+/25673.webp',  // pos 68 - TS-1 6466 V-Band
  'ts-ts1-5862-vband': '/shop/power%20adders/turbos+/25730.webp',  // pos 69 - TS-1 5862 V-Band
  'ts-ts2-6262-int': '/shop/power%20adders/turbos+/25734.webp',    // pos 70 - TS-2 6262 Internal WG
  'ts-ts1-6870-t4': '/shop/power%20adders/turbos+/25726.webp',     // pos 71 - TS-1 6870 T4
  'ts-ts1-5862-t3': '/shop/power%20adders/turbos+/25744.webp',     // pos 72 - TS-1 5862 T3
  'ts-opr-t40-black': '/shop/power%20adders/turbos+/9207.webp',    // pos 73 - OPR T40 Black
  'ts-ts1-7675-t4': '/shop/power%20adders/turbos+/25721.webp',     // pos 74 - TS-1 7675 T4
  'ts-oil-filter': '/shop/power%20adders/turbos+/25776.webp',      // pos 75 - Oil Feed Filter
  'ts-bov-raceport-female-red': '/shop/power%20adders/turbos+/9189.webp', // pos 76 - BOV RacePort Female Red
  'ts-bov-raceport-purple': '/shop/power%20adders/turbos+/9184.webp', // pos 77 - BOV RacePort Purple
  'ts-wg60-powergate-blue': '/shop/power%20adders/turbos+/9202.webp', // pos 78 - WG60 Power-Gate Blue
  'ts-ts2-6262-ext': '/shop/power%20adders/turbos+/25747.webp',    // pos 79 - TS-2 6262 External WG
  'dd-ls-oil-feed': '/shop/power%20adders/turbos+/4027.webp',      // pos 80 - Dirty Dingo LS Oil Feed
  'ts-opr-t40-blue': '/shop/power%20adders/turbos+/9206.webp',     // pos 81 - OPR T40 Blue
  'ts-ts1-7675-vband': '/shop/power%20adders/turbos+/25707.webp',  // pos 82 - TS-1 7675 V-Band
  'ts-powerport-black': '/shop/power%20adders/turbos+/25765.webp', // pos 83 - PowerPort BOV Black
  'vs-80mm-t6': '/shop/power%20adders/turbos+/16146.webp',         // pos 84 - VS Racing 80mm T6
  'vs-ng-7875': '/shop/power%20adders/turbos+/16143.webp',         // pos 85 - VS Racing NG 7875
  'ts-fpr-2000': '/shop/power%20adders/turbos+/9195.webp',         // pos 86 - FPR 2000
  'vs-85mm-slip': '/shop/power%20adders/turbos+/16156.webp',       // pos 87 - VS Racing 85mm Slip
  'vs-50mm-bov': '/shop/power%20adders/turbos+/17994.webp',        // pos 88 - VS Racing 50mm BOV
  'vs-88-103mm': '/shop/power%20adders/turbos+/16144.webp',        // pos 89 - VS Racing 88/103mm
  'vs-gen3-7875': '/shop/power%20adders/turbos+/16171.webp',       // pos 90 - VS Racing Gen3 7875
  'vs-70-70-t4': '/shop/power%20adders/turbos+/16170.webp',        // pos 91 - VS Racing 70/70 T4
  'vs-67-66-t4': '/shop/power%20adders/turbos+/16216_1.webp',      // pos 92 - VS Racing 67/66 T4
  'ts-eboost-street': '/shop/power%20adders/turbos+/9192.webp',    // pos 93 - E-Boost Street
  'ts-ts1-6466-rev': '/shop/power%20adders/turbos+/25715.webp',    // pos 94 - TS-1 6466 Reversed
  'ts-wg45-hypergate-black': '/shop/power%20adders/turbos+/9199.webp', // pos 95 - WG45 Hyper-Gate Black
  'vs-7875-t51r': '/shop/power%20adders/turbos+/16148.webp',       // pos 96 - VS Racing 7875 T51R
  'ts-ts2-6466-ext': '/shop/power%20adders/turbos+/25699.webp',    // pos 97 - TS-2 6466 External WG
  'ts-eb2-solenoid': '/shop/power%20adders/turbos+/9191.webp',     // pos 98 - EB2 Solenoid
  'ts-fpr-1200': '/shop/power%20adders/turbos+/9194.webp',         // pos 99 - FPR 1200
  'ts-wg45-hypergate-blue': '/shop/power%20adders/turbos+/9198.webp', // pos 100 - WG45 Hyper-Gate Blue
  'ts-eboost2-60mm-black': '/shop/power%20adders/turbos+/9190.webp', // pos 101 - EBoost2 60mm Black
  'ts-opr-v2': '/shop/power%20adders/turbos+/18459.webp',          // pos 102 - OPR V2
  'ts-bov-raceport-female-black': '/shop/power%20adders/turbos+/9187.webp', // pos 103 - BOV RacePort Female Black
  'ts-bov-raceport-blue': '/shop/power%20adders/turbos+/9182.webp', // pos 104 - BOV RacePort Blue
  'ts-raceport-sleeper': '/shop/power%20adders/turbos+/25682.webp', // pos 105 - RacePort BOV Sleeper
  'ts-bov-raceport-female-blue': '/shop/power%20adders/turbos+/9186.webp', // pos 106 - BOV RacePort Female Blue
  'ts-wg50-progate-blue': '/shop/power%20adders/turbos+/9200.webp', // pos 107 - WG50 Pro-Gate Blue
  'ts-wg60-powergate-black': '/shop/power%20adders/turbos+/9203.webp', // pos 108 - WG60 Power-Gate Black
  'ts-bov-raceport-black': '/shop/power%20adders/turbos+/9183.webp', // pos 109 - BOV RacePort Black
  'pc-race-valve-steel': '/shop/power%20adders/turbos+/20566.webp', // pos 110 - Procharger Race Valve Steel
  'pte-discharge-flange': '/shop/power%20adders/turbos+/7331.webp', // pos 111 - PTE Discharge Flange
  'pte-50mm-bov': '/shop/power%20adders/turbos+/9495.webp',        // pos 112 - PTE 50mm BOV
  'pc-race-valve-alum': '/shop/power%20adders/turbos+/20565.webp', // pos 113 - Procharger Race Valve Aluminum
  'pte-vband-flange': '/shop/power%20adders/turbos+/7330.webp',    // pos 114 - PTE V-Band Flange
  'ict-ls-oil-adapter': '/shop/power%20adders/turbos+/11863.webp', // pos 115 - ICT LS Oil Adapter
  'ict-oil-line-48': '/shop/power%20adders/turbos+/11832.webp',    // pos 116 - ICT Oil Line 48"
  'ict-oil-line-60': '/shop/power%20adders/turbos+/11827.webp',    // pos 117 - ICT Oil Line 60"
  
  // ===== NITROUS PRODUCTS =====
  'no-xseries-efi-single': '/shop/power%20adders/Nitrous/16353_48.webp',       // 1 - Nitrous Outlet X-Series
  'tz-bottle-holder-single-10': '/shop/power%20adders/Nitrous/22101_1.webp',   // 2 - Team Z Single 10lb
  'tz-bottle-holder-double-10': '/shop/power%20adders/Nitrous/22102_2__1.webp', // 3 - Team Z Double 10lb
  'nx-coyote-direct-port': '/shop/power%20adders/Nitrous/25519_1.webp',        // 4 - NX Coyote Direct Port
  'nx-shark-dual-alc': '/shop/power%20adders/Nitrous/25435.webp',              // 5 - NX SHARK Dual ALC
  'nx-ls-78mm-plate': '/shop/power%20adders/Nitrous/25432.webp',               // 6 - NX LS 78mm
  'nx-hemi-single-nozzle': '/shop/power%20adders/Nitrous/25527_1.webp',        // 7 - NX Hemi Single Nozzle
  'nx-ls-102mm-plate': '/shop/power%20adders/Nitrous/25429_1.webp',            // 8 - NX LS 102mm
  'nx-lt1-corvette-camaro': '/shop/power%20adders/Nitrous/25496_1.webp',       // 9 - NX LT1 Corvette/Camaro
  'nx-hemi-direct-port': '/shop/power%20adders/Nitrous/25529.webp',            // 10 - NX Hemi Direct Port
  'nx-pro-shk-gas-rails': '/shop/power%20adders/Nitrous/25440.webp',           // 11 - NX Pro Shark Gas Rails
  'nx-shark-dual-gas-rails': '/shop/power%20adders/Nitrous/25437.webp',        // 12 - NX SHARK Dual Gas Rails
  'nx-lt4-supercharged': '/shop/power%20adders/Nitrous/25508_1.webp',          // 13 - NX LT4 Supercharged
  'nx-lt4-billet-lid': '/shop/power%20adders/Nitrous/25500.webp',              // 14 - NX LT4 Billet Lid
  'tz-bottle-holder-double-15': '/shop/power%20adders/Nitrous/22107_2__1.webp', // 15 - Team Z Double 15lb
  'nx-f150-coyote': '/shop/power%20adders/Nitrous/25521_1.webp',               // 16 - NX F-150 Coyote
  'nx-coyote-godzilla-hi': '/shop/power%20adders/Nitrous/25517.webp',          // 17 - NX Coyote Godzilla HI
  'nx-90mm-hemi-plate': '/shop/power%20adders/Nitrous/25531_1.webp',           // 18 - NX 90mm Hemi Plate
  'nx-coyote-single-nozzle': '/shop/power%20adders/Nitrous/25514.webp',        // 19 - NX Coyote Single Nozzle
  'nx-lt4-wm-billet': '/shop/power%20adders/Nitrous/25501_1.webp',             // 20 - NX LT4 WM Billet
  'nx-pro-shk-gas-4sol': '/shop/power%20adders/Nitrous/25439_1.webp',          // 21 - NX Pro Shark 4 Sol
  'nx-ls-90mm-hardline': '/shop/power%20adders/Nitrous/25430.webp',            // 22 - NX LS 90mm Hardline
  'nx-sx2-dual-gas': '/shop/power%20adders/Nitrous/25438_1.webp',              // 23 - NX SX2 Dual Gas
  'nx-shark-dual-gas-8sol': '/shop/power%20adders/Nitrous/25433_1.webp',       // 24 - NX SHARK 8 Sol
  'nx-hemi-plate-50-400': '/shop/power%20adders/Nitrous/25528_1.webp',         // 25 - NX Hemi Plate 50-400
  'nx-coyote-dry-direct': '/shop/power%20adders/Nitrous/25520_1.webp',         // 26 - NX Coyote Dry Direct
  'no-camaro-hardline': '/shop/power%20adders/Nitrous/5870_1.webp',            // 27 - NO Camaro Hardline
  'nx-coyote-godzilla': '/shop/power%20adders/Nitrous/25515.webp',             // 28 - NX Coyote Godzilla
  'no-lsx-78mm-conv': '/shop/power%20adders/Nitrous/1730.webp',                // 29 - NO LSX 78mm Conv
  'nx-bottle-pressure-gauge': '/shop/power%20adders/Nitrous/1324.webp',        // 30 - NX Bottle Gauge
  'no-326-valve-4an': '/shop/power%20adders/Nitrous/1790.webp',                // 31 - NO 326 Valve 4AN
  'no-gto-90mm-15lb': '/shop/power%20adders/Nitrous/6901.webp',                // 32 - NO GTO 90mm 15lb
  'no-90-blowdown': '/shop/power%20adders/Nitrous/1787.webp',                  // 33 - NO 90 Blowdown
  'no-lsx-magnuson-90mm': '/shop/power%20adders/Nitrous/1780.webp',            // 34 - NO Magnuson 90mm
  'no-fbody-halo-dry': '/shop/power%20adders/Nitrous/1719.webp',               // 35 - NO F-Body HALO
  'no-gm-truck-78mm': '/shop/power%20adders/Nitrous/6905.webp',                // 36 - NO GM Truck 78mm
  'no-326-valve-6an': '/shop/power%20adders/Nitrous/6923.webp',                // 37 - NO 326 Valve 6AN
  'nos-gm-90mm-wet': '/shop/power%20adders/Nitrous/10896.webp',                // 38 - NOS GM 90mm Wet
  'no-micro-wot': '/shop/power%20adders/Nitrous/1812.webp',                    // 39 - NO Micro WOT
  'no-gto-78mm-no-bottle': '/shop/power%20adders/Nitrous/1770.webp',           // 40 - NO GTO 78mm NB
  'no-gto-hardline-78mm': '/shop/power%20adders/Nitrous/6824.webp',            // 41 - NO GTO Hardline
  'nos-ls2-wet-plate': '/shop/power%20adders/Nitrous/10925.webp',              // 42 - NOS LS2 Wet Plate
  'no-lsx-truck-90mm': '/shop/power%20adders/Nitrous/7007.webp',               // 43 - NO LSX Truck 90mm
  'no-gm-efi-small-dry': '/shop/power%20adders/Nitrous/6812.webp',             // 44 - NO EFI Small Dry
  'no-180-blowdown': '/shop/power%20adders/Nitrous/6919.webp',                 // 45 - NO 180 Blowdown
  'nx-ls3-solenoid-bracket': '/shop/power%20adders/Nitrous/25547.webp',        // 46 - NX LS3 Bracket
  'no-gm-efi-large-dry': '/shop/power%20adders/Nitrous/6814.webp',             // 47 - NO EFI Large Dry
  'no-gm-efi-dual-stage': '/shop/power%20adders/Nitrous/6840.webp',            // 48 - NO EFI Dual Stage
  'no-dry-90mm-lsx': '/shop/power%20adders/Nitrous/1725.webp',                 // 49 - NO Dry 90mm LSX
  'nos-ls-102mm-wet': '/shop/power%20adders/Nitrous/10891.webp',               // 50 - NOS LS 102mm Wet
  'no-gto-fast-92mm': '/shop/power%20adders/Nitrous/6898.webp',                // 51 - NO GTO FAST 92mm
  'no-corvette-z06-90mm-nb': '/shop/power%20adders/Nitrous/1769.webp',         // 52 - NO Z06 90mm NB
  'nos-holley-lt-hiram-dry': '/shop/power%20adders/Nitrous/10919.webp',        // 53 - NOS Holley LT Dry
  'no-corvette-z06-90mm-10lb': '/shop/power%20adders/Nitrous/6892.webp',       // 54 - NO Z06 90mm 10lb
  'no-universal-dual-stage': '/shop/power%20adders/Nitrous/7033.webp',         // 55 - NO Universal Dual
  'no-lsx-90mm-15lb': '/shop/power%20adders/Nitrous/6871.webp',                // 56 - NO LSX 90mm 15lb
  'no-corvette-92mm-nb': '/shop/power%20adders/Nitrous/4928.webp',             // 57 - NO Corvette 92mm NB
  'nx-hemi-90mm-plate-only': '/shop/power%20adders/Nitrous/25538.webp',        // 58 - NX Hemi 90mm Plate
  'no-camaro-solenoid-brackets': '/shop/power%20adders/Nitrous/1830.webp',     // 59 - NO Camaro Brackets
  'nx-universal-fbw-10lb': '/shop/power%20adders/Nitrous/6727.webp',           // 60 - NX Universal FBW
  // Nitrous batch 2 (61-120)
  'no-dual-vertical-bracket': '/shop/power%20adders/Nitrous/6930.webp',        // 61 - NO Dual Vertical Bracket
  'no-c5-bracket-pass': '/shop/power%20adders/Nitrous/6932.webp',              // 62 - NO C5 Bracket Pass
  'no-dual-stage-90mm-conv': '/shop/power%20adders/Nitrous/6836.webp',         // 63 - NO Dual Stage 90mm Conv
  'nos-ls1-wet-plate': '/shop/power%20adders/Nitrous/10924.webp',              // 64 - NOS LS1 Wet Plate
  'no-lsx-92mm-nb': '/shop/power%20adders/Nitrous/1754.webp',                  // 65 - NO LSX 92mm NB
  'no-180-blowdown-90': '/shop/power%20adders/Nitrous/1786.webp',              // 66 - NO 180 Blowdown 90
  'no-dual-78mm-10lb': '/shop/power%20adders/Nitrous/6842.webp',               // 67 - NO Dual 78mm 10lb
  'no-102mm-fast-truck': '/shop/power%20adders/Nitrous/7013.webp',             // 68 - NO 102mm FAST Truck
  'no-102mm-ctsv-10lb': '/shop/power%20adders/Nitrous/6991.webp',              // 69 - NO 102mm CTS-V 10lb
  'no-univ-dry-15lb': '/shop/power%20adders/Nitrous/6804.webp',                // 70 - NO Univ Dry 15lb
  'no-efi-large-dry-10lb': '/shop/power%20adders/Nitrous/6813.webp',           // 71 - NO EFI Large Dry 10lb
  'nos-ls-90-92mm': '/shop/power%20adders/Nitrous/10893.webp',                 // 72 - NOS LS 90-92mm
  'no-pump-station': '/shop/power%20adders/Nitrous/6940.webp',                 // 73 - NO Pump Station
  'nx-efi-single-nb': '/shop/power%20adders/Nitrous/662.webp',                 // 74 - NX EFI Single NB
  'no-78mm-fbody-15lb': '/shop/power%20adders/Nitrous/6877.webp',              // 75 - NO 78mm F-Body 15lb
  'no-gm-truck-lt1-nb': '/shop/power%20adders/Nitrous/4564.webp',              // 76 - NO GM Truck LT1 NB
  'no-fbody-bracket-plate': '/shop/power%20adders/Nitrous/1799.webp',          // 77 - NO F-Body Bracket Plate
  'no-102mm-dual-nb': '/shop/power%20adders/Nitrous/4926.webp',                // 78 - NO 102mm Dual NB
  'nx-efi-dual-15lb': '/shop/power%20adders/Nitrous/6737.webp',                // 79 - NX EFI Dual 15lb
  'nos-sniper-ls-dry': '/shop/power%20adders/Nitrous/10913.webp',              // 80 - NOS Sniper LS Dry
  'no-univ-dual-dry-nb': '/shop/power%20adders/Nitrous/6808.webp',             // 81 - NO Univ Dual Dry NB
  'no-90mm-fast-corvette-nb': '/shop/power%20adders/Nitrous/1764.webp',        // 82 - NO 90mm FAST Corvette NB
  'nx-ls-90mm-15lb': '/shop/power%20adders/Nitrous/6794.webp',                 // 83 - NX LS 90mm 15lb
  'no-lsx-78mm-nb': '/shop/power%20adders/Nitrous/1751.webp',                  // 84 - NO LSX 78mm NB
  'no-dry-90mm-10lb': '/shop/power%20adders/Nitrous/6817.webp',                // 85 - NO Dry 90mm 10lb
  'no-efi-dual-nb': '/shop/power%20adders/Nitrous/1735.webp',                  // 86 - NO EFI Dual NB
  'no-gto-90mm-10lb': '/shop/power%20adders/Nitrous/6900.webp',                // 87 - NO GTO 90mm 10lb
  'no-gto-92mm-fast-nb': '/shop/power%20adders/Nitrous/1772.webp',             // 88 - NO GTO 92mm FAST NB
  'nx-ls-90mm-12lb-comp': '/shop/power%20adders/Nitrous/6796.webp',            // 89 - NX LS 90mm 12lb Comp
  'nx-hemi-dp-conv': '/shop/power%20adders/Nitrous/25540.webp',                // 90 - NX Hemi DP Conv
  'no-c7-lt1-hardline-nb': '/shop/power%20adders/Nitrous/4456.webp',           // 91 - NO C7 LT1 Hardline NB
  'no-dual-90mm-10lb': '/shop/power%20adders/Nitrous/6851.webp',               // 92 - NO Dual 90mm 10lb
  'no-univ-efi-single-15lb': '/shop/power%20adders/Nitrous/7029.webp',         // 93 - NO Univ EFI Single 15lb
  'no-ls3-90mm-hardline': '/shop/power%20adders/Nitrous/4931.webp',            // 94 - NO LS3 90mm Hardline
  'nx-hemi-plate-conv': '/shop/power%20adders/Nitrous/25539.webp',             // 95 - NX Hemi Plate Conv
  'no-ls2-90mm-hardline': '/shop/power%20adders/Nitrous/6826.webp',            // 96 - NO LS2 90mm Hardline
  'nx-efi-dual-12lb-comp': '/shop/power%20adders/Nitrous/6736.webp',           // 97 - NX EFI Dual 12lb Comp
  'no-trailblazer-switch': '/shop/power%20adders/Nitrous/1847.webp',           // 98 - NO Trailblazer Switch
  'no-gm-truck-lt1-10lb': '/shop/power%20adders/Nitrous/6999.webp',            // 99 - NO GM Truck LT1 10lb
  'no-intake-brackets-corvette': '/shop/power%20adders/Nitrous/1832.webp',     // 100 - NO Intake Brackets Corvette
  'no-92mm-ls1-dual-nb': '/shop/power%20adders/Nitrous/1738.webp',             // 101 - NO 92mm LS1 Dual NB
  'no-326-bottle-nut': '/shop/power%20adders/Nitrous/6924.webp',               // 102 - NO 326 Bottle Nut
  'no-ctsv-90mm-10lb': '/shop/power%20adders/Nitrous/6993.webp',               // 103 - NO CTS-V 90mm 10lb
  'no-lsx-dry-bracket': '/shop/power%20adders/Nitrous/6957.webp',              // 104 - NO LSX Dry Bracket
  'no-gm-truck-lt1-15lb': '/shop/power%20adders/Nitrous/7000.webp',            // 105 - NO GM Truck LT1 15lb
  'no-accessory-pkg-4an': '/shop/power%20adders/Nitrous/1781.webp',            // 106 - NO Accessory Pkg 4AN
  'no-dual-90mm-15lb': '/shop/power%20adders/Nitrous/6852.webp',               // 107 - NO Dual 90mm 15lb
  'nx-proton-plus-fbw-nb': '/shop/power%20adders/Nitrous/4984.webp',           // 108 - NX Proton Plus FBW NB
  'nx-5gen-camaro-15lb': '/shop/power%20adders/Nitrous/6798.webp',             // 109 - NX 5th Gen Camaro 15lb
  'no-660-bottle-nut': '/shop/power%20adders/Nitrous/1791.webp',               // 110 - NO 660 Bottle Nut
  'nx-proton-plus-nb': '/shop/power%20adders/Nitrous/4983.webp',               // 111 - NX Proton Plus NB
  'no-single-nozzle-truck-corvette-nb': '/shop/power%20adders/Nitrous/4561.webp', // 112 - NO Single Nozzle Truck/Corvette NB
  'no-gto-78mm-15lb': '/shop/power%20adders/Nitrous/6895.webp',                // 113 - NO GTO 78mm 15lb
  'nx-5gen-camaro-10lb': '/shop/power%20adders/Nitrous/6797.webp',             // 114 - NX 5th Gen Camaro 10lb
  'no-dual-78mm-conv': '/shop/power%20adders/Nitrous/1731.webp',               // 115 - NO Dual 78mm Conv
  'no-92mm-ls1-dual-10lb': '/shop/power%20adders/Nitrous/6853.webp',           // 116 - NO 92mm LS1 Dual 10lb
  'no-dual-78mm-nb': '/shop/power%20adders/Nitrous/1736.webp',                 // 117 - NO Dual 78mm NB
  'no-dual-78mm-15lb': '/shop/power%20adders/Nitrous/6843.webp',               // 118 - NO Dual 78mm 15lb
  'no-lsx-90mm-10lb': '/shop/power%20adders/Nitrous/6870.webp',                // 119 - NO LSX 90mm 10lb
  'no-ctsv-90mm-15lb': '/shop/power%20adders/Nitrous/6994.webp',               // 120 - NO CTS-V 90mm 15lb
  // Nitrous products 121-180
  'no-ss-bottle-bracket': '/shop/power%20adders/Nitrous/1795.webp',            // 121 - NO SS Bottle Bracket
  'no-mag-90mm-10lb': '/shop/power%20adders/Nitrous/6914.webp',                // 122 - NO Magnuson 90mm 10lb
  'no-gto-fast-90mm-nb': '/shop/power%20adders/Nitrous/1771.webp',             // 123 - NO GTO FAST 90mm NB
  'no-fbody-solenoid-bracket': '/shop/power%20adders/Nitrous/1829.webp',       // 124 - NO F-Body Solenoid Bracket
  'no-truck-dash-panel': '/shop/power%20adders/Nitrous/1842.webp',             // 125 - NO Truck Dash Panel
  'no-gto-92mm-fast-15lb': '/shop/power%20adders/Nitrous/6899.webp',           // 126 - NO GTO 92mm FAST 15lb
  'no-truck-90mm-bracket': '/shop/power%20adders/Nitrous/1834.webp',           // 127 - NO Truck 90mm Bracket
  'no-z06-hardline-90mm': '/shop/power%20adders/Nitrous/6827.webp',            // 128 - NO Z06 Hardline 90mm
  'holley-nos-mustang-wet': '/shop/power%20adders/Nitrous/9773.webp',          // 129 - Holley NOS Mustang Wet
  'no-heated-bottle-bracket': '/shop/power%20adders/Nitrous/1808.webp',        // 130 - NO Heated Bottle Bracket
  'no-univ-dual-nozzle-nb': '/shop/power%20adders/Nitrous/4977.webp',          // 131 - NO Universal Dual Nozzle NB
  'no-pressure-relief-disc': '/shop/power%20adders/Nitrous/6922.webp',         // 132 - NO Pressure Relief Disc
  'no-lsx-90mm-conv': '/shop/power%20adders/Nitrous/6833.webp',                // 133 - NO LSX 90mm Conv
  'no-zl1-hardline-10lb': '/shop/power%20adders/Nitrous/6985.webp',            // 134 - NO ZL1 Hardline 10lb
  'no-102mm-fast-hardline-nb': '/shop/power%20adders/Nitrous/4934.webp',       // 135 - NO 102mm FAST Hardline NB
  'nx-gm-efi-sn-12lb-comp': '/shop/power%20adders/Nitrous/6724.webp',          // 136 - NX GM EFI SN 12lb Comp
  'nx-genx-heater-pkg': '/shop/power%20adders/Nitrous/673.webp',               // 137 - NX Gen-X Heater Pkg
  'no-lsx-90mm-nb': '/shop/power%20adders/Nitrous/1752.webp',                  // 138 - NO LSX 90mm NB
  'no-dry-92mm-15lb': '/shop/power%20adders/Nitrous/6820.webp',                // 139 - NO Dry 92mm 15lb
  'no-lsx-78mm-15lb': '/shop/power%20adders/Nitrous/6869.webp',                // 140 - NO LSX 78mm 15lb
  'no-zl1-mag-90mm-conv': '/shop/power%20adders/Nitrous/1728.webp',            // 141 - NO ZL1 Magnuson 90mm Conv
  'nx-gm-efi-dual-nb': '/shop/power%20adders/Nitrous/669.webp',                // 142 - NX GM EFI Dual NB
  'no-lsx-ds-solenoid-brkt': '/shop/power%20adders/Nitrous/6954.webp',         // 143 - NO LSX DS Solenoid Bracket
  'nx-efi-plate-conv-102mm': '/shop/power%20adders/Nitrous/25456.webp',        // 144 - NX EFI Plate Conv 102mm
  'nx-gm-efi-dual-jet-pack': '/shop/power%20adders/Nitrous/670.webp',          // 145 - NX GM EFI Dual Jet Pack
  'nx-proton-plus-sn-12lb-comp': '/shop/power%20adders/Nitrous/6785.webp',     // 146 - NX Proton Plus 12lb Comp
  'holley-nos-coyote-wet-plate': '/shop/power%20adders/Nitrous/9772.webp',     // 147 - Holley NOS Coyote Wet Plate
  'no-univ-dual-dry-15lb': '/shop/power%20adders/Nitrous/6810.webp',           // 148 - NO Universal Dual Dry 15lb
  'nx-gm-efi-dual-5lb': '/shop/power%20adders/Nitrous/6734.webp',              // 149 - NX GM EFI Dual 5lb
  'no-78mm-hardline-truck': '/shop/power%20adders/Nitrous/4933.webp',          // 150 - NO 78mm Hardline Truck
  'no-corvette-aio-bracket': '/shop/power%20adders/Nitrous/6950.webp',         // 151 - NO Corvette AIO Bracket
  'nx-camaro-dash-panel': '/shop/power%20adders/Nitrous/4981.webp',            // 152 - NX Camaro Dash Panel
  'nos-sniper-fab-dry-plate': '/shop/power%20adders/Nitrous/10917.webp',       // 153 - NOS Sniper Fab Dry Plate
  'no-univ-efi-sn-nb': '/shop/power%20adders/Nitrous/4976.webp',               // 154 - NO Universal EFI SN NB
  'nx-hemi-85mm-plate': '/shop/power%20adders/Nitrous/25537.webp',             // 155 - NX Hemi 85mm Plate
  'no-15lb-bottle': '/shop/power%20adders/Nitrous/6938.webp',                  // 156 - NO 15lb Bottle
  'nos-sniper-race-dry-sys': '/shop/power%20adders/Nitrous/10910.webp',        // 157 - NOS Sniper Race Dry Sys
  'no-g8-90mm-15lb': '/shop/power%20adders/Nitrous/6903.webp',                 // 158 - NO G8 90mm 15lb
  'no-zl1-hardline-sys': '/shop/power%20adders/Nitrous/4271.webp',             // 159 - NO ZL1 Hardline Sys
  'no-gm-efi-dual-nb': '/shop/power%20adders/Nitrous/1743.webp',               // 160 - NO GM EFI Dual NB
  'nx-proton-plus-fbw-5lb': '/shop/power%20adders/Nitrous/6787.webp',          // 161 - NX Proton Plus FBW 5lb
  'no-truck-tbss-90mm-15lb': '/shop/power%20adders/Nitrous/6913.webp',         // 162 - NO Truck TBSS 90mm 15lb
  'no-sn-2014-truck-10lb': '/shop/power%20adders/Nitrous/6995.webp',           // 163 - NO SN 2014 Truck 10lb
  'no-univ-solenoid-brkt': '/shop/power%20adders/Nitrous/6947.webp',           // 164 - NO Universal Solenoid Bracket
  'no-univ-dual-dry-single-nb': '/shop/power%20adders/Nitrous/1716.webp',             // 165 - NO Universal Dual Dry NB (single stage)
  'no-102mm-fast-truck-nb': '/shop/power%20adders/Nitrous/4571_1.webp',        // 166 - NO 102mm FAST Truck NB
  'no-x-series-accessory': '/shop/power%20adders/Nitrous/1785.webp',           // 167 - NO X-Series Accessory
  'no-camaro-hardline-90mm': '/shop/power%20adders/Nitrous/6823.webp',         // 168 - NO Camaro Hardline 90mm
  'no-660-6an-bottle-nut': '/shop/power%20adders/Nitrous/6926.webp',           // 169 - NO 660 6AN Bottle Nut
  'no-gm-efi-dual-stage-15lb': '/shop/power%20adders/Nitrous/6841.webp',       // 170 - NO GM EFI Dual Stage 15lb
  'no-fbody-hardline-78mm': '/shop/power%20adders/Nitrous/6821.webp',          // 171 - NO F-Body Hardline 78mm
  'no-gto-ds-aio-bracket': '/shop/power%20adders/Nitrous/6956.webp',           // 172 - NO GTO DS AIO Bracket
  'nx-hd-auto-heater': '/shop/power%20adders/Nitrous/1328.webp',               // 173 - NX HD Auto Heater
  'no-dual-stage-lsx-90mm-nb': '/shop/power%20adders/Nitrous/1737.webp',       // 174 - NO Dual Stage LSX 90mm NB
  'no-gm-efi-dual-15lb': '/shop/power%20adders/Nitrous/6858.webp',             // 175 - NO GM EFI Dual 15lb
  'no-corvette-aio-catch-brkt': '/shop/power%20adders/Nitrous/6952.webp',      // 176 - NO Corvette AIO Catch Bracket
  'no-g8-90mm-nb': '/shop/power%20adders/Nitrous/1774.webp',                   // 177 - NO G8 90mm NB
  'no-digital-scale': '/shop/power%20adders/Nitrous/1819.webp',                // 178 - NO Digital Scale
  'no-102mm-fast-camaro-nb': '/shop/power%20adders/Nitrous/4927.webp',         // 179 - NO 102mm FAST Camaro NB
  'nx-5th-gen-camaro-plate-5lb': '/shop/power%20adders/Nitrous/6730.webp',     // 180 - NX 5th Gen Camaro Plate 5lb
  // Nitrous products 181-240
  'no-90mm-ctsv-nb-2': '/shop/power%20adders/Nitrous/4560.webp',               // 181 - NO 90mm CTS-V NB 2
  'nx-univ-fbw-5lb': '/shop/power%20adders/Nitrous/6726.webp',                 // 182 - NX Univ FBW 5lb
  'nx-univ-fbw-nb': '/shop/power%20adders/Nitrous/664.webp',                   // 183 - NX Univ FBW NB
  'nos-hemi-57-61-wet': '/shop/power%20adders/Nitrous/16936.webp',             // 184 - NOS HEMI 5.7/6.1 Wet
  'nos-coyote-fogger': '/shop/power%20adders/Nitrous/9774.webp',               // 185 - NOS Coyote Fogger
  'no-univ-efi-dual-10lb': '/shop/power%20adders/Nitrous/7032.webp',           // 186 - NO Univ EFI Dual 10lb
  'nx-gm-efi-sn-15lb': '/shop/power%20adders/Nitrous/6725.webp',               // 187 - NX GM EFI SN 15lb
  'nx-coy-god-plate-conv': '/shop/power%20adders/Nitrous/25522.webp',          // 188 - NX Coyote/Godzilla Plate Conv
  'no-bottle-blanket-12-15': '/shop/power%20adders/Nitrous/6933.webp',         // 189 - NO Bottle Blanket 12/15
  'no-ls9-blower-15lb': '/shop/power%20adders/Nitrous/7003.webp',              // 190 - NO LS9 Blower 15lb
  'no-90mm-fast-corvette-10lb': '/shop/power%20adders/Nitrous/6886.webp',      // 191 - NO 90mm FAST Corvette 10lb
  'no-102mm-ctsv-nb': '/shop/power%20adders/Nitrous/4559.webp',                // 192 - NO 102mm CTS-V NB
  'no-efi-lg-dry-nb': '/shop/power%20adders/Nitrous/1718.webp',                // 193 - NO EFI Large Dry NB
  'nx-gm-efi-sn-5lb': '/shop/power%20adders/Nitrous/6722.webp',                // 194 - NX GM EFI SN 5lb
  'no-smokers-panel-gto': '/shop/power%20adders/Nitrous/4760.webp',            // 195 - NO Smokers Panel GTO
  'nx-ls-lt-90mm-plate-only': '/shop/power%20adders/Nitrous/25453.webp',       // 196 - NX LS/LT 90mm Plate Only
  'nx-90mm-4bolt-plate-only': '/shop/power%20adders/Nitrous/25447.webp',       // 197 - NX 90mm 4-Bolt Plate Only
  'no-efi-sm-dry-nb': '/shop/power%20adders/Nitrous/1717.webp',                // 198 - NO EFI Small Dry NB
  'nx-proton-fbw-12lb-comp': '/shop/power%20adders/Nitrous/6789.webp',         // 199 - NX Proton FBW 12lb Comp
  'no-90mm-fast-fbody-15lb': '/shop/power%20adders/Nitrous/6879.webp',         // 200 - NO 90mm FAST F-Body 15lb
  'no-zl1-hardline-15lb': '/shop/power%20adders/Nitrous/6986.webp',            // 201 - NO ZL1 Hardline 15lb
  'no-90mm-lsx-truck-nb': '/shop/power%20adders/Nitrous/4566.webp',            // 202 - NO 90mm LSX Truck NB
  'no-bracket-c6-z06-ls7': '/shop/power%20adders/Nitrous/1831.webp',           // 203 - NO Bracket C6 Z06/LS7
  'no-90-blowdown-straight': '/shop/power%20adders/Nitrous/6920.webp',         // 204 - NO 90 Blowdown Straight
  'no-pressure-relief-valve': '/shop/power%20adders/Nitrous/1789.webp',        // 205 - NO Pressure Relief Valve
  'no-univ-dual-dry-single-15lb': '/shop/power%20adders/Nitrous/6806.webp',    // 206 - NO Univ Dual Dry Single 15lb
  'no-racelight-15lb-horiz': '/shop/power%20adders/Nitrous/18426.webp',        // 207 - NO Race-Light 15lb Horiz
  'nx-3bolt-ls-plate-only': '/shop/power%20adders/Nitrous/25450.webp',         // 208 - NX 3-Bolt LS Plate Only
  'no-efi-sm-dry-10lb': '/shop/power%20adders/Nitrous/6811.webp',              // 209 - NO EFI Small Dry 10lb
  'nx-gm-efi-sn-jetpack': '/shop/power%20adders/Nitrous/668.webp',             // 210 - NX GM EFI SN Jetpack
  'no-hardline-fbody-90-92': '/shop/power%20adders/Nitrous/6822.webp',         // 211 - NO Hardline F-Body 90/92
  'no-halo-fbody-15lb': '/shop/power%20adders/Nitrous/6816.webp',              // 212 - NO HALO F-Body 15lb
  'no-bracket-corvette-gto': '/shop/power%20adders/Nitrous/6951.webp',         // 213 - NO Bracket Corvette/GTO
  'nx-102mm-4bolt-plate-only': '/shop/power%20adders/Nitrous/25443.webp',      // 214 - NX 102mm 4-Bolt Plate Only
  'no-90mm-fast-c6-nb': '/shop/power%20adders/Nitrous/1767.webp',              // 215 - NO 90mm FAST C6 NB
  'nx-proton-fbw-15lb': '/shop/power%20adders/Nitrous/6790.webp',              // 216 - NX Proton FBW 15lb
  'nx-5gen-camaro-sn-12lb-comp': '/shop/power%20adders/Nitrous/6799.webp',     // 217 - NX 5th Gen Camaro SN 12lb Comp
  'no-tss-titan-hardline': '/shop/power%20adders/Nitrous/18544.webp',          // 218 - NO TSS Titan Hardline
  'no-90mm-fast-fbody-nb': '/shop/power%20adders/Nitrous/1759.webp',           // 219 - NO 90mm FAST F-Body NB
  'no-lsx-92mm-15lb': '/shop/power%20adders/Nitrous/6873.webp',                // 220 - NO LSX 92mm 15lb
  'no-lsa-ctsv-zl1-blower-nb': '/shop/power%20adders/Nitrous/4462.webp',       // 221 - NO LSA CTS-V/ZL1 Blower NB
  'no-xseries-core-kit': '/shop/power%20adders/Nitrous/1739.webp',             // 222 - NO X-Series Core Kit
  'nx-5gen-camaro-plate-nb': '/shop/power%20adders/Nitrous/666.webp',          // 223 - NX 5th Gen Camaro Plate NB
  'nx-n20-filter-ss-hose': '/shop/power%20adders/Nitrous/1325.webp',           // 224 - NX N20 Filter SS Hose
  'nx-5gen-camaro-sn-5lb': '/shop/power%20adders/Nitrous/6800.webp',           // 225 - NX 5th Gen Camaro SN 5lb
  'no-bottle-stand': '/shop/power%20adders/Nitrous/6939.webp',                 // 226 - NO Bottle Stand
  'no-92mm-ls1-dual-15lb': '/shop/power%20adders/Nitrous/6854.webp',           // 227 - NO 92mm LS1 Dual 15lb
  'no-90mm-fast-gto-15lb': '/shop/power%20adders/Nitrous/6897.webp',           // 228 - NO 90mm FAST GTO 15lb
  'nx-5gen-camaro-sn-nb': '/shop/power%20adders/Nitrous/4988.webp',            // 229 - NX 5th Gen Camaro SN NB
  'no-mag-90mm-15lb': '/shop/power%20adders/Nitrous/6915.webp',                // 230 - NO Magnuson 90mm 15lb
  'no-sn-truck-corvette-15lb': '/shop/power%20adders/Nitrous/6996.webp',       // 231 - NO SN Truck/Corvette 15lb
  'nx-coyote-wet-dp-conv': '/shop/power%20adders/Nitrous/25524.webp',          // 232 - NX Coyote Wet DP Conv
  'no-univ-efi-dual-nb': '/shop/power%20adders/Nitrous/4979.webp',             // 233 - NO Univ EFI Dual NB
  'no-bracket-catchcan-corvette-gto': '/shop/power%20adders/Nitrous/6953.webp', // 234 - NO Bracket Catch Can
  'no-92mm-fast-corvette-nb': '/shop/power%20adders/Nitrous/1765.webp',        // 235 - NO 92mm FAST Corvette NB
  'nx-univ-fbw-12lb': '/shop/power%20adders/Nitrous/6728.webp',                // 236 - NX Univ FBW 12lb
  'nx-proton-sn-5lb': '/shop/power%20adders/Nitrous/6783.webp',                // 237 - NX Proton SN 5lb
  'nos-c7-corvette-black': '/shop/power%20adders/Nitrous/10906.webp',          // 238 - NOS C7 Corvette Black
  'no-maf-solenoid-bracket': '/shop/power%20adders/Nitrous/6958.webp',         // 239 - NO MAF Solenoid Bracket
  'nos-sniper-fab-ls-silver': '/shop/power%20adders/Nitrous/10918.webp',       // 240 - NOS Sniper Fab LS Silver
  // Nitrous products 241-300
  'nx-coy-god-ho-conv': '/shop/power%20adders/Nitrous/25523.webp',             // 241 - NX Coyote/Godzilla HO Conv
  'no-efi-race-sn-15lb': '/shop/power%20adders/Nitrous/6856.webp',             // 242 - NO EFI Race SN 15lb
  'no-lsx-aio-bracket': '/shop/power%20adders/Nitrous/1837.webp',              // 243 - NO LSX AIO Bracket
  'nx-tps-switch': '/shop/power%20adders/Nitrous/1331.webp',                   // 244 - NX TPS Switch
  'nos-hemi-64-plate': '/shop/power%20adders/Nitrous/16935.webp',              // 245 - NOS Hemi 6.4L Plate
  'no-lsx-102mm-nb': '/shop/power%20adders/Nitrous/1755.webp',                 // 246 - NO LSX 102mm NB
  'no-78mm-sol-bracket-truck': '/shop/power%20adders/Nitrous/1833.webp',       // 247 - NO 78mm Sol Bracket Truck
  'no-zl1-hl-kit': '/shop/power%20adders/Nitrous/4935.webp',                   // 248 - NO ZL1 HL Kit
  'no-x-univ-sol-bracket': '/shop/power%20adders/Nitrous/1835.webp',           // 249 - NO X-Series Sol Bracket
  'nx-coyote-dry-dp-conv': '/shop/power%20adders/Nitrous/25525.webp',          // 250 - NX Coyote Dry DP Conv
  'no-fbody-78mm-nb': '/shop/power%20adders/Nitrous/1758.webp',                // 251 - NO F-Body 78mm NB
  'no-classic-truck-78mm-15lb': '/shop/power%20adders/Nitrous/6911.webp',      // 252 - NO Classic Truck 78mm 15lb
  'nx-remote-opener': '/shop/power%20adders/Nitrous/1321.webp',                // 253 - NX Remote Opener
  'nx-fuel-pressure-switch': '/shop/power%20adders/Nitrous/132.webp',          // 254 - NX Fuel Pressure Switch
  'no-camaro-90mm-15lb': '/shop/power%20adders/Nitrous/6883.webp',             // 255 - NO Camaro 90mm 15lb
  'no-univ-efi-dual-15lb': '/shop/power%20adders/Nitrous/7031.webp',           // 256 - NO Univ EFI Dual 15lb
  'no-univ-dual-dry-10lb-v2': '/shop/power%20adders/Nitrous/6805.webp',        // 257 - NO Univ Dual Dry 10lb v2
  'no-4an-filter': '/shop/power%20adders/Nitrous/1818.webp',                   // 258 - NO 4AN Filter
  'no-fbody-fast-92mm-nb': '/shop/power%20adders/Nitrous/1760.webp',           // 259 - NO F-Body FAST 92mm NB
  'no-dual-lsx-92mm-conv': '/shop/power%20adders/Nitrous/6837.webp',           // 260 - NO Dual LSX 92mm Conv
  'no-truck-78mm-nb-v2': '/shop/power%20adders/Nitrous/1775.webp',             // 261 - NO Truck 78mm NB v2
  'no-dry-92mm-nb': '/shop/power%20adders/Nitrous/1726.webp',                  // 262 - NO Dry 92mm NB
  'no-dry-90mm-15lb-v2': '/shop/power%20adders/Nitrous/6818.webp',             // 263 - NO Dry 90mm 15lb v2
  'no-lsx-78mm-10lb': '/shop/power%20adders/Nitrous/6868.webp',                // 264 - NO LSX 78mm 10lb
  'no-lsx-aio-catch-can': '/shop/power%20adders/Nitrous/6949.webp',            // 265 - NO LSX AIO Catch Can
  'no-univ-sn-dry-nb': '/shop/power%20adders/Nitrous/1713.webp',               // 266 - NO Univ SN Dry NB
  'nx-efi-dual-10lb': '/shop/power%20adders/Nitrous/6735.webp',                // 267 - NX EFI Dual 10lb
  'nx-camaro-plate-12lb': '/shop/power%20adders/Nitrous/6732.webp',            // 268 - NX Camaro Plate 12lb
  'no-corvette-78mm-nb': '/shop/power%20adders/Nitrous/1763.webp',             // 269 - NO Corvette 78mm NB
  'no-corvette-78mm-15lb': '/shop/power%20adders/Nitrous/6885.webp',           // 270 - NO Corvette 78mm 15lb
  'no-c7-lt1-hl-15lb': '/shop/power%20adders/Nitrous/6988.webp',               // 271 - NO C7 LT1 HL 15lb
  'no-c5-bracket-driver': '/shop/power%20adders/Nitrous/6931.webp',            // 272 - NO C5 Bracket Driver
  'nx-c7-plate-conv': '/shop/power%20adders/Nitrous/25497.webp',               // 273 - NX C7 Plate Conv
  'nos-sniper-race-ls-silver': '/shop/power%20adders/Nitrous/10911.webp',      // 274 - NOS Sniper Race LS Silver
  'no-bottle-bath': '/shop/power%20adders/Nitrous/1810.webp',                  // 275 - NO Bottle Bath
  'no-fbody-halo-10lb': '/shop/power%20adders/Nitrous/6815.webp',              // 276 - NO HALO F-Body 10lb
  'nx-dual-stage-upgrade': '/shop/power%20adders/Nitrous/25471.webp',          // 277 - NX Dual Stage Upgrade
  'no-z06-90mm-15lb-v2': '/shop/power%20adders/Nitrous/6893.webp',             // 278 - NO Z06 90mm 15lb v2
  'nos-90mm-dbw-blk': '/shop/power%20adders/Nitrous/10895.webp',               // 279 - NOS 90mm DBW Black
  'nx-ls-90mm-nb': '/shop/power%20adders/Nitrous/4985.webp',                   // 280 - NX LS 90mm NB
  'no-fbody-fast-92mm-10lb': '/shop/power%20adders/Nitrous/6880.webp',         // 281 - NO F-Body FAST 92mm 10lb
  'no-gto-fold-panel': '/shop/power%20adders/Nitrous/1841.webp',               // 282 - NO GTO Fold Panel
  'no-gto-slide-panel': '/shop/power%20adders/Nitrous/4759.webp',              // 283 - NO GTO Slide Panel
  'no-corvette-92mm-15lb': '/shop/power%20adders/Nitrous/7025.webp',           // 284 - NO Corvette 92mm 15lb
  'no-c5-switch-panel': '/shop/power%20adders/Nitrous/1845.webp',              // 285 - NO C5 Switch Panel
  'nos-holley-ls-hi-ram-blk': '/shop/power%20adders/Nitrous/10907.webp',       // 286 - NOS Holley LS Hi-Ram Black
  'nx-camaro-plate-15lb-v2': '/shop/power%20adders/Nitrous/6733.webp',         // 287 - NX Camaro Plate 15lb v2
  'no-camaro-console-panel': '/shop/power%20adders/Nitrous/6959.webp',         // 288 - NO Camaro Console Panel
  'no-gto-90mm-nb-v2': '/shop/power%20adders/Nitrous/1773.webp',               // 289 - NO GTO 90mm NB v2
  'no-ls9-blower-10lb': '/shop/power%20adders/Nitrous/7002.webp',              // 290 - NO LS9 Blower 10lb
  'nos-camaro-ls3-plate': '/shop/power%20adders/Nitrous/10926.webp',           // 291 - NOS Camaro LS3 Plate
  'no-fbody-fast-90mm-10lb': '/shop/power%20adders/Nitrous/6878.webp',         // 292 - NO F-Body FAST 90mm 10lb
  'no-fbody-fast-92mm-15lb': '/shop/power%20adders/Nitrous/6881.webp',         // 293 - NO F-Body FAST 92mm 15lb
  'nx-flo-thru-gauge': '/shop/power%20adders/Nitrous/4978.webp',               // 294 - NX Flo-Thru Gauge
  'no-corvette-fast-92mm-15lb': '/shop/power%20adders/Nitrous/6889.webp',      // 295 - NO Corvette FAST 92mm 15lb
  'no-efi-race-sn-nb': '/shop/power%20adders/Nitrous/1742.webp',               // 296 - NO EFI Race SN NB
  'nx-proton-sn-10lb': '/shop/power%20adders/Nitrous/6784.webp',               // 297 - NX Proton SN 10lb
  'no-big-show-purge': '/shop/power%20adders/Nitrous/1823.webp',               // 298 - NO Big Show Purge
  'no-truck-78mm-10lb-v2': '/shop/power%20adders/Nitrous/6904.webp',           // 299 - NO Truck 78mm 10lb v2
  'nos-sniper-102mm': '/shop/power%20adders/Nitrous/10914.webp',               // 300 - NOS Sniper 102mm
  // Nitrous products 301-360
  'no-big-show-standalone': '/shop/power%20adders/Nitrous/1820.webp',          // 301 - NO Big Show Standalone
  'nos-hemi-57-61-sniper': '/shop/power%20adders/Nitrous/16938_1.webp',        // 302 - NOS Hemi 5.7/6.1 Sniper
  'nos-102mm-105mm-dbw': '/shop/power%20adders/Nitrous/10903.webp',            // 303 - NOS 102/105mm DBW
  'nos-sniper-80mm-3bolt': '/shop/power%20adders/Nitrous/10916.webp',          // 304 - NOS Sniper 80mm 3-Bolt
  'no-fast-102mm-hl-10lb': '/shop/power%20adders/Nitrous/7026_1.webp',         // 305 - NO FAST 102mm HL 10lb
  'no-4an-purge-kit': '/shop/power%20adders/Nitrous/1822.webp',                // 306 - NO 4AN Purge Kit
  'no-acc-pkg-hfp-6an': '/shop/power%20adders/Nitrous/6916.webp',              // 307 - NO Acc Pkg HFP 6AN
  'no-c6-switch-panel': '/shop/power%20adders/Nitrous/1846.webp',              // 308 - NO C6 Switch Panel
  'no-dual-vent-purge': '/shop/power%20adders/Nitrous/6945.webp',              // 309 - NO Dual Vent Purge
  'no-trans-tunnel-bracket': '/shop/power%20adders/Nitrous/1800.webp',         // 310 - NO Trans Tunnel Bracket
  'no-x-heater-element': '/shop/power%20adders/Nitrous/1809.webp',             // 311 - NO X-Series Heater Element
  'no-pump-station-full': '/shop/power%20adders/Nitrous/6941.webp',            // 312 - NO Pump Station Full
  'no-x-4an-purge': '/shop/power%20adders/Nitrous/1824.webp',                  // 313 - NO X-Series 4AN Purge
  'no-camaro-cup-holder': '/shop/power%20adders/Nitrous/1844.webp',            // 314 - NO Camaro Cup Holder
  'no-fast-102mm-truck-10lb': '/shop/power%20adders/Nitrous/4571.webp',        // 315 - NO FAST 102mm Truck 10lb
  'no-102mm-dual-15lb': '/shop/power%20adders/Nitrous/7015.webp',              // 316 - NO 102mm Dual 15lb
  'no-pump-station-scale': '/shop/power%20adders/Nitrous/6942.webp',           // 317 - NO Pump Station Scale
  'no-x-the-show-purge': '/shop/power%20adders/Nitrous/1821.webp',             // 318 - NO X-Series The Show Purge
  'no-lsx-102mm-conv': '/shop/power%20adders/Nitrous/6835.webp',               // 319 - NO LSX 102mm Conv
  'no-heated-bracket-4an': '/shop/power%20adders/Nitrous/6934.webp',           // 320 - NO Heated Bracket 4AN
  'no-x-heater-6an': '/shop/power%20adders/Nitrous/7009.webp',                 // 321 - NO X-Series Heater 6AN
  'no-lsa-blower-10lb': '/shop/power%20adders/Nitrous/6989.webp',              // 322 - NO LSA Blower 10lb
  'no-truck-78mm-conv': '/shop/power%20adders/Nitrous/1734.webp',              // 323 - NO Truck 78mm Conv
  'no-90-blowdown-tube': '/shop/power%20adders/Nitrous/6921.webp',             // 324 - NO 90 Blowdown Tube
  'nx-efi-sn-10lb': '/shop/power%20adders/Nitrous/6723.webp',                  // 325 - NX EFI SN 10lb
  'no-univ-efi-dual-nozzle-10lb': '/shop/power%20adders/Nitrous/7030.webp',    // 326 - NO Univ EFI Dual Nozzle 10lb
  'nx-6an-purge-valve': '/shop/power%20adders/Nitrous/675.webp',               // 327 - NX 6AN Purge Valve
  'nx-univ-fbw-15lb-v2': '/shop/power%20adders/Nitrous/6729.webp',             // 328 - NX Univ FBW 15lb v2
  'no-x-10lb-bottle': '/shop/power%20adders/Nitrous/1817.webp',                // 329 - NO X-Series 10lb Bottle
  'no-adj-pressure-switch': '/shop/power%20adders/Nitrous/1811.webp',          // 330 - NO Adj Pressure Switch
  'no-fast-102mm-hl-kit': '/shop/power%20adders/Nitrous/6830.webp',            // 331 - NO FAST 102mm HL Kit
  'no-big-show-6an-purge': '/shop/power%20adders/Nitrous/6944.webp',           // 332 - NO Big Show 6AN Purge
  'no-gto-78mm-10lb': '/shop/power%20adders/Nitrous/6894.webp',                // 333 - NO GTO 78mm 10lb
  'no-fbody-78mm-10lb': '/shop/power%20adders/Nitrous/6876.webp',              // 334 - NO F-Body 78mm 10lb
  'no-660-nut-gasket': '/shop/power%20adders/Nitrous/6927.webp',               // 335 - NO 660 Nut Gasket
  'no-fast-90mm-c6-10lb': '/shop/power%20adders/Nitrous/6890.webp',            // 336 - NO FAST 90mm C6 10lb
  'no-classic-truck-78mm-10lb': '/shop/power%20adders/Nitrous/6910.webp',      // 337 - NO Classic Truck 78mm 10lb
  'nx-4an-purge-valve': '/shop/power%20adders/Nitrous/1403.webp',              // 338 - NX 4AN Purge Valve
  'no-6an-filter': '/shop/power%20adders/Nitrous/6937.webp',                   // 339 - NO 6AN Filter
  'no-remote-opener': '/shop/power%20adders/Nitrous/1828.webp',                // 340 - NO Remote Opener
  'nx-genx2-heater-pkg': '/shop/power%20adders/Nitrous/674.webp',              // 341 - NX GenX2 Heater Pkg
  'no-180-blowdown-tube': '/shop/power%20adders/Nitrous/1788.webp',            // 342 - NO 180 Blowdown Tube
  'no-single-billet-bracket': '/shop/power%20adders/Nitrous/1798.webp',        // 343 - NO Single Billet Bracket
  'no-truck-tbss-90mm-nb': '/shop/power%20adders/Nitrous/1779.webp',           // 344 - NO TBSS 90mm NB
  'no-c6-bracket-mount': '/shop/power%20adders/Nitrous/1805.webp',             // 345 - NO C6 Bracket Mount
  'no-102mm-dual-10lb': '/shop/power%20adders/Nitrous/7014.webp',              // 346 - NO 102mm Dual 10lb
  'no-corvette-78mm-10lb': '/shop/power%20adders/Nitrous/6884.webp',           // 347 - NO Corvette 78mm 10lb
  'no-truck-90mm-conv': '/shop/power%20adders/Nitrous/6838.webp',              // 348 - NO Truck 90mm Conv
  'no-lsx-92mm-conv': '/shop/power%20adders/Nitrous/6834.webp',                // 349 - NO LSX 92mm Conv
  'no-10lb-bottle-blanket': '/shop/power%20adders/Nitrous/1807.webp',          // 350 - NO 10lb Bottle Blanket
  'no-4an-purge-tubing': '/shop/power%20adders/Nitrous/6946.webp',             // 351 - NO 4AN Purge Tubing
  'no-x-efi-sn-dry-maf': '/shop/power%20adders/Nitrous/1714.webp',             // 352 - NO X-Series Dry MAF
  'nx-camaro-plate-10lb': '/shop/power%20adders/Nitrous/6731.webp',            // 353 - NX Camaro Plate 10lb
  'nos-102mm-wet-plate-only': '/shop/power%20adders/Nitrous/10927.webp',       // 354 - NOS 102mm Wet Plate Only
  'nos-sniper-90-92mm': '/shop/power%20adders/Nitrous/10915.webp',             // 355 - NOS Sniper 90-92mm
  'nx-bottle-pressure-gauge-v2': '/shop/power%20adders/Nitrous/1329.webp',     // 356 - NX Bottle Pressure Gauge v2
  'no-g8-90mm-10lb': '/shop/power%20adders/Nitrous/6902.webp',                 // 357 - NO G8 90mm 10lb
  'nos-90-92mm-wet-full': '/shop/power%20adders/Nitrous/10902.webp',           // 358 - NOS 90-92mm Wet Full
  'no-battery-mount': '/shop/power%20adders/Nitrous/18427.webp',               // 359 - NO Battery Mount
  'nx-proton-fbw-10lb': '/shop/power%20adders/Nitrous/6788.webp',              // 360 - NX Proton FBW 10lb
  // Nitrous products 361-408 (last 48)
  'no-univ-dual-stage-dry-10lb': '/shop/power%20adders/Nitrous/6809.webp',     // 361 - NO Univ Dual Stage Dry 10lb
  'no-92mm-corvette-10lb': '/shop/power%20adders/Nitrous/7024.webp',           // 362 - NO 92mm Corvette 10lb
  'no-10lb-bottle': '/shop/power%20adders/Nitrous/1816.webp',                  // 363 - NO 10lb Bottle
  'nos-sniper-coyote': '/shop/power%20adders/Nitrous/9771.webp',               // 364 - NOS Sniper Coyote
  'no-90mm-truck-tbss-10lb': '/shop/power%20adders/Nitrous/6912.webp',         // 365 - NO 90mm Truck TBSS 10lb
  'no-spare-tire-bracket': '/shop/power%20adders/Nitrous/1801.webp',           // 366 - NO Spare Tire Bracket
  'no-dual-vent-windshield': '/shop/power%20adders/Nitrous/1826.webp',         // 367 - NO Dual Vent Windshield
  'no-truck-102mm-conv': '/shop/power%20adders/Nitrous/6839.webp',             // 368 - NO Truck 102mm Conv
  'no-univ-sn-dry-10lb': '/shop/power%20adders/Nitrous/6803.webp',             // 369 - NO Univ SN Dry 10lb
  'no-hardline-fast-90-92': '/shop/power%20adders/Nitrous/6825.webp',          // 370 - NO Hardline FAST 90/92
  'no-lsx-102mm-15lb': '/shop/power%20adders/Nitrous/6875.webp',               // 371 - NO LSX 102mm 15lb
  'no-efi-race-sn-10lb': '/shop/power%20adders/Nitrous/6855.webp',             // 372 - NO EFI Race SN 10lb
  'no-lsx-92mm-10lb': '/shop/power%20adders/Nitrous/6872.webp',                // 373 - NO LSX 92mm 10lb
  'no-heated-bracket-6an': '/shop/power%20adders/Nitrous/6935.webp',           // 374 - NO Heated Bracket 6AN
  'no-classic-truck-78mm-nb': '/shop/power%20adders/Nitrous/1778.webp',        // 375 - NO Classic Truck 78mm NB
  'no-fast-90mm-c6-15lb': '/shop/power%20adders/Nitrous/6891.webp',            // 376 - NO FAST 90mm C6 15lb
  'no-fast-102mm-camaro-15lb': '/shop/power%20adders/Nitrous/7017.webp',       // 377 - NO FAST 102mm Camaro 15lb
  'no-fast-102mm-hl-15lb': '/shop/power%20adders/Nitrous/7027.webp',           // 378 - NO FAST 102mm HL 15lb
  'no-dual-voltage-heater': '/shop/power%20adders/Nitrous/18425.webp',         // 379 - NO Dual Voltage Heater
  'no-ls9-blower-nb': '/shop/power%20adders/Nitrous/4565_1.webp',              // 380 - NO LS9 Blower NB
  'no-c7-lt1-hl-10lb': '/shop/power%20adders/Nitrous/6987.webp',               // 381 - NO C7 LT1 HL 10lb
  'nos-plate-wet-gm': '/shop/power%20adders/Nitrous/10890.webp',               // 382 - NOS Plate Wet GM
  'nx-ls-solenoid-bracket': '/shop/power%20adders/Nitrous/1802.webp',          // 383 - NX LS Solenoid Bracket
  'nos-4an-purge-valve-blk': '/shop/power%20adders/Nitrous/16399.webp',        // 384 - NOS 4AN Purge Valve Blk
  'no-univ-efi-sn-10lb': '/shop/power%20adders/Nitrous/7028.webp',             // 385 - NO Univ EFI SN 10lb
  'no-dry-92mm-lsx-10lb': '/shop/power%20adders/Nitrous/6819.webp',            // 386 - NO Dry 92mm LSX 10lb
  'no-x-gm-efi-sn-10lb': '/shop/power%20adders/Nitrous/1741.webp',             // 387 - NO X GM EFI SN 10lb
  'no-6an-purge-kit': '/shop/power%20adders/Nitrous/6943.webp',                // 388 - NO 6AN Purge Kit
  'nx-jet-pack-fbw': '/shop/power%20adders/Nitrous/667.webp',                  // 389 - NX Jet Pack FBW
  'nx-ls-90mm-5lb': '/shop/power%20adders/Nitrous/6795.webp',                  // 390 - NX LS 90mm 5lb
  'no-fast-90mm-gto-10lb': '/shop/power%20adders/Nitrous/6896.webp',           // 391 - NO FAST 90mm GTO 10lb
  'no-90mm-camaro-10lb': '/shop/power%20adders/Nitrous/6882.webp',             // 392 - NO 90mm Camaro 10lb
  'nx-proton-plus-15lb': '/shop/power%20adders/Nitrous/6786.webp',             // 393 - NX Proton Plus 15lb
  'no-90mm-camaro-nb': '/shop/power%20adders/Nitrous/1761.webp',               // 394 - NO 90mm Camaro NB
  'no-micro-wot-switch': '/shop/power%20adders/Nitrous/6936.webp',             // 395 - NO Micro WOT Switch
  'no-90mm-lsx-truck-10lb': '/shop/power%20adders/Nitrous/7006.webp',          // 396 - NO 90mm LSX Truck 10lb
  'nx-ls-90mm-10lb': '/shop/power%20adders/Nitrous/6793.webp',                 // 397 - NX LS 90mm 10lb
  'no-fast-90mm-c5-15lb': '/shop/power%20adders/Nitrous/6887.webp',            // 398 - NO FAST 90mm C5 15lb
  'nos-plate-camaro-ls3': '/shop/power%20adders/Nitrous/10889.webp',           // 399 - NOS Plate Camaro LS3
  'no-fast-102mm-camaro-10lb': '/shop/power%20adders/Nitrous/7016.webp',       // 400 - NO FAST 102mm Camaro 10lb
  'no-102mm-ctsv-15lb': '/shop/power%20adders/Nitrous/6992.webp',              // 401 - NO 102mm CTSV 15lb
  'nx-auto-heater-no-gauge': '/shop/power%20adders/Nitrous/672.webp',          // 402 - NX Auto Heater No Gauge
  'no-lsx-102mm-10lb': '/shop/power%20adders/Nitrous/6874.webp',               // 403 - NO LSX 102mm 10lb
  'nx-auto-heater-gauge': '/shop/power%20adders/Nitrous/671.webp',             // 404 - NX Auto Heater Gauge
  'no-3an-purge-tubing': '/shop/power%20adders/Nitrous/1827.webp',             // 405 - NO 3AN Purge Tubing
  'no-lsa-blower-15lb': '/shop/power%20adders/Nitrous/6990.webp',              // 406 - NO LSA Blower 15lb
  'no-fast-92mm-c5-10lb': '/shop/power%20adders/Nitrous/6888.webp',            // 407 - NO FAST 92mm C5 10lb
  'no-gm-efi-dual-10lb': '/shop/power%20adders/Nitrous/6857.webp',             // 408 - NO GM EFI Dual 10lb
};

// Helper to get product image - use placeholder for nitrous until images downloaded
function getProductImage(productId: string): string {
  const path = IMAGE_PATHS[productId];
  if (path) return path;
  // Nitrous products - return empty string until images are downloaded
  if (productId.startsWith('no-') || productId.startsWith('nx-') || productId.startsWith('nos-') || productId.startsWith('tz-')) {
    return '';
  }
  return '/shop/power%20adders/turbos+/7330.webp';
}

// Power adder products - Real products
const powerAdderProducts: PowerAdderProduct[] = [
  // Precision Turbo Products
  {
    id: "pt-74-85",
    name: "Precision Turbo and Engine Next Gen Sportsman 74/85 Turbo - Rated 1400HP",
    brand: "Precision Turbo & Engine",
    partNumber: "PT-NG-74/85",
    description: "Next Gen Sportsman 74/85 turbocharger rated for 1400HP. Ball bearing, billet compressor wheel.",
    category: "turbo",
    power: "1400HP",
    compressor: "74mm",
    turbine: "85mm",
    price: 3763.61,
    inStock: true,
    image: "/precision-turbo-placeholder.png",
  },
  {
    id: "pt-56-62",
    name: "Precision Turbo and Engine Next Gen 56/62 Turbo - Rated 800HP",
    brand: "Precision Turbo & Engine",
    partNumber: "PT-NG-56/62",
    description: "Next Gen 56/62 turbocharger rated for 800HP. Perfect for street/strip applications.",
    category: "turbo",
    power: "800HP",
    compressor: "56mm",
    turbine: "62mm",
    price: 2009.47,
    inStock: true,
    image: "/precision-turbo-placeholder.png",
  },
  {
    id: "pt-scp-66-70",
    name: "Precision Turbo and Engine Next Gen SCP-Cover 66/70 Turbo - Rated 1100HP",
    brand: "Precision Turbo & Engine",
    partNumber: "PT-NG-SCP-66/70",
    description: "Next Gen SCP-Cover 66/70 turbocharger rated for 1100HP with SCP cover design.",
    category: "turbo",
    power: "1100HP",
    compressor: "66mm",
    turbine: "70mm",
    price: 2769.15,
    inStock: true,
    image: "/precision-turbo-placeholder.png",
  },
  {
    id: "pt-74-80-sportsman",
    name: "Precision Turbo and Engine Next Gen Sportsman 74/80 Turbo - Rated 1475HP",
    brand: "Precision Turbo & Engine",
    partNumber: "PT-NG-S-74/80",
    description: "Next Gen Sportsman 74/80 turbocharger rated for 1475HP. Race-proven performance.",
    category: "turbo",
    power: "1475HP",
    compressor: "74mm",
    turbine: "80mm",
    price: 4381.61,
    inStock: true,
    image: "/precision-turbo-placeholder.png",
  },
  {
    id: "pt-nextr-62-80",
    name: "Precision Turbo and Engine Next R Sportsman 62/80 Turbo - Rated 1150HP",
    brand: "Precision Turbo & Engine",
    partNumber: "PT-NR-S-62/80",
    description: "Next R Sportsman 62/80 turbocharger rated for 1150HP.",
    category: "turbo",
    power: "1150HP",
    compressor: "62mm",
    turbine: "80mm",
    price: 3853.99,
    inStock: true,
    image: "/precision-turbo-placeholder.png",
  },
  {
    id: "pt-68-80-sportsman",
    name: "Precision Turbo and Engine Next Gen Sportsman 68/80 Turbo - 1225HP",
    brand: "Precision Turbo & Engine",
    partNumber: "PT-NG-S-68/80",
    description: "Next Gen Sportsman 68/80 turbocharger rated for 1225HP.",
    category: "turbo",
    power: "1225HP",
    compressor: "68mm",
    turbine: "80mm",
    price: 3506.11,
    inStock: true,
    image: "/precision-turbo-placeholder.png",
  },
  {
    id: "pt-ss-vband-rr-68-70",
    name: "Precision Turbo and Engine SS V-Band Reverse Rotation H-Cover Next Gen 68/70 Turbo - Rated 1200HP",
    brand: "Precision Turbo & Engine",
    partNumber: "PT-SS-RR-68/70",
    description: "SS V-Band Reverse Rotation H-Cover Next Gen 68/70 turbocharger rated for 1200HP.",
    category: "turbo",
    power: "1200HP",
    compressor: "68mm",
    turbine: "70mm",
    price: 3147.68,
    inStock: true,
    image: "/precision-turbo-placeholder.png",
  },
  {
    id: "pt-t3-rr-62-66",
    name: "Precision Turbo and Engine T3 SS V-Band Reverse Rotation Next Gen 62/66 Turbo - Rated 925 HP",
    brand: "Precision Turbo & Engine",
    partNumber: "PT-T3-RR-62/66",
    description: "T3 SS V-Band Reverse Rotation Next Gen 62/66 turbocharger rated for 925HP.",
    category: "turbo",
    power: "925HP",
    compressor: "62mm",
    turbine: "66mm",
    price: 2459.16,
    inStock: true,
    image: "/precision-turbo-placeholder.png",
  },
  {
    id: "pt-scp-68-70",
    name: "Precision Turbo and Engine Next Gen SCP-Cover 68/70 Turbo - Rated 1200HP",
    brand: "Precision Turbo & Engine",
    partNumber: "PT-NG-SCP-68/70",
    description: "Next Gen SCP-Cover 68/70 turbocharger rated for 1200HP.",
    category: "turbo",
    power: "1200HP",
    compressor: "68mm",
    turbine: "70mm",
    price: 2882.45,
    inStock: true,
    image: "/precision-turbo-placeholder.png",
  },
  {
    id: "pt-71-80-sportsman",
    name: "Precision Turbo and Engine Next Gen Sportsman 71/80 Turbo - Rated 1300HP",
    brand: "Precision Turbo & Engine",
    partNumber: "PT-NG-S-71/80",
    description: "Next Gen Sportsman 71/80 turbocharger rated for 1300HP.",
    category: "turbo",
    power: "1300HP",
    compressor: "71mm",
    turbine: "80mm",
    price: 3609.11,
    inStock: true,
    image: "/precision-turbo-placeholder.png",
  },
  {
    id: "pt-t3-rr-56-58",
    name: "Precision Turbo and Engine T3 SS V-Band Reverse Rotation Next Gen 56/58 Turbo - Rated 770HP",
    brand: "Precision Turbo & Engine",
    partNumber: "PT-T3-RR-56/58",
    description: "T3 SS V-Band Reverse Rotation Next Gen 56/58 turbocharger rated for 770HP.",
    category: "turbo",
    power: "770HP",
    compressor: "56mm",
    turbine: "58mm",
    price: 2274.70,
    inStock: true,
    image: "/precision-turbo-placeholder.png",
  },
  {
    id: "pt-80-80-sportsman",
    name: "Precision Turbo and Engine Next Gen Sportsman 80/80 Turbo - 1550HP",
    brand: "Precision Turbo & Engine",
    partNumber: "PT-NG-S-80/80",
    description: "Next Gen Sportsman 80/80 turbocharger rated for 1550HP.",
    category: "turbo",
    power: "1550HP",
    compressor: "80mm",
    turbine: "80mm",
    price: 4381.61,
    inStock: true,
    image: "/precision-turbo-placeholder.png",
  },
  {
    id: "pt-68-75-sportsman",
    name: "Precision Turbo and Engine Next Gen Sportsman 68/75 Turbo - Rated 1200HP",
    brand: "Precision Turbo & Engine",
    partNumber: "PT-NG-S-68/75",
    description: "Next Gen Sportsman 68/75 turbocharger rated for 1200HP.",
    category: "turbo",
    power: "1200HP",
    compressor: "68mm",
    turbine: "75mm",
    price: 3454.61,
    inStock: true,
    image: "/precision-turbo-placeholder.png",
  },
  {
    id: "pt-scp-64-66",
    name: "Precision Turbo and Engine Next Gen SCP-Cover 64/66 Turbo - Rated 1000HP",
    brand: "Precision Turbo & Engine",
    partNumber: "PT-NG-SCP-64/66",
    description: "Next Gen SCP-Cover 64/66 turbocharger rated for 1000HP.",
    category: "turbo",
    power: "1000HP",
    compressor: "64mm",
    turbine: "66mm",
    price: 2509.01,
    inStock: true,
    image: "/precision-turbo-placeholder.png",
  },
  {
    id: "pt-71-75-sportsman",
    name: "Precision Turbo and Engine Next Gen Sportsman 71/75 Turbo - Rated 1275HP",
    brand: "Precision Turbo & Engine",
    partNumber: "PT-NG-S-71/75",
    description: "Next Gen Sportsman 71/75 turbocharger rated for 1275HP.",
    category: "turbo",
    power: "1275HP",
    compressor: "71mm",
    turbine: "75mm",
    price: 3557.61,
    inStock: true,
    image: "/precision-turbo-placeholder.png",
  },
  {
    id: "pt-74-80-sportsman-1375",
    name: "Precision Turbo and Engine Next Gen Sportsman 74/80 Turbo - Rated 1375HP",
    brand: "Precision Turbo & Engine",
    partNumber: "PT-NG-S-74/80-1375",
    description: "Next Gen Sportsman 74/80 turbocharger rated for 1375HP.",
    category: "turbo",
    power: "1375HP",
    compressor: "74mm",
    turbine: "80mm",
    price: 3712.11,
    inStock: true,
    image: "/precision-turbo-placeholder.png",
  },
  {
    id: "pt-83-85-sportsman",
    name: "Precision Turbo and Engine Next Gen Sportsman 83/85 Turbo - Rated 1700HP",
    brand: "Precision Turbo & Engine",
    partNumber: "PT-NG-S-83/85",
    description: "Next Gen Sportsman 83/85 turbocharger rated for 1700HP.",
    category: "turbo",
    power: "1700HP",
    compressor: "83mm",
    turbine: "85mm",
    price: 4639.11,
    inStock: true,
    image: "/precision-turbo-placeholder.png",
  },
  {
    id: "pt-75-75",
    name: "Precision Turbo and Engine Next Gen 75/75 Turbo - Rated 1380HP",
    brand: "Precision Turbo & Engine",
    partNumber: "PT-NG-75/75",
    description: "Next Gen 75/75 turbocharger rated for 1380HP.",
    category: "turbo",
    power: "1380HP",
    compressor: "75mm",
    turbine: "75mm",
    price: 2932.45,
    inStock: true,
    image: "/precision-turbo-placeholder.png",
  },
  {
    id: "pt-80-85-sportsman",
    name: "Precision Turbo and Engine Next Gen Sportsman 80/85 Turbo - Rated 1600HP",
    brand: "Precision Turbo & Engine",
    partNumber: "PT-NG-S-80/85",
    description: "Next Gen Sportsman 80/85 turbocharger rated for 1600HP.",
    category: "turbo",
    power: "1600HP",
    compressor: "80mm",
    turbine: "85mm",
    price: 4561.86,
    inStock: true,
    image: "/precision-turbo-placeholder.png",
  },
  {
    id: "pt-86-85-sportsman",
    name: "Precision Turbo and Engine Next Gen Sportsman 86/85 Turbo - Rated 1800HP",
    brand: "Precision Turbo & Engine",
    partNumber: "PT-NG-S-86/85",
    description: "Next Gen Sportsman 86/85 turbocharger rated for 1800HP.",
    category: "turbo",
    power: "1800HP",
    compressor: "86mm",
    turbine: "85mm",
    price: 4821.78,
    inStock: true,
    image: "/precision-turbo-placeholder.png",
  },
  {
    id: "pt-68-85-sportsman",
    name: "Precision Turbo and Engine Next Gen Sportsman 68/85 Turbo - Rated 1250HP",
    brand: "Precision Turbo & Engine",
    partNumber: "PT-NG-S-68/85",
    description: "Next Gen Sportsman 68/85 turbocharger rated for 1250HP.",
    category: "turbo",
    power: "1250HP",
    compressor: "68mm",
    turbine: "85mm",
    price: 3557.61,
    inStock: true,
    image: "/precision-turbo-placeholder.png",
  },
  {
    id: "pt-56-58",
    name: "Precision Turbo and Engine Next Gen 56/58 Turbo - Rated 770HP",
    brand: "Precision Turbo & Engine",
    partNumber: "PT-NG-56/58",
    description: "Next Gen 56/58 turbocharger rated for 770HP.",
    category: "turbo",
    power: "770HP",
    compressor: "56mm",
    turbine: "58mm",
    price: 2009.47,
    inStock: true,
    image: "/precision-turbo-placeholder.png",
  },
  {
    id: "pt-scp-68-75",
    name: "Precision Turbo and Engine SCP-Cover Next Gen 68/75 Turbo - Rated 1250HP",
    brand: "Precision Turbo & Engine",
    partNumber: "PT-SCP-68/75",
    description: "SCP-Cover Next Gen 68/75 turbocharger rated for 1250HP.",
    category: "turbo",
    power: "1250HP",
    compressor: "68mm",
    turbine: "75mm",
    price: 2882.45,
    inStock: true,
    image: "/precision-turbo-placeholder.png",
  },
  {
    id: "pt-74-75-sportsman",
    name: "Precision Turbo and Engine Next Gen Sportsman 74/75 Turbo - Rated 1350HP",
    brand: "Precision Turbo & Engine",
    partNumber: "PT-NG-S-74/75",
    description: "Next Gen Sportsman 74/75 turbocharger rated for 1350HP.",
    category: "turbo",
    power: "1350HP",
    compressor: "74mm",
    turbine: "75mm",
    price: 3660.61,
    inStock: true,
    image: "/precision-turbo-placeholder.png",
  },
  {
    id: "pt-t3-rr-h-64-66",
    name: "Precision Turbo and Engine T3 SS V-Band Reverse Rotation H-Cover Next Gen 64/66 Turbo - Rated 1000HP",
    brand: "Precision Turbo & Engine",
    partNumber: "PT-T3-RR-H-64/66",
    description: "T3 SS V-Band Reverse Rotation H-Cover Next Gen 64/66 turbocharger rated for 1000HP.",
    category: "turbo",
    power: "1000HP",
    compressor: "64mm",
    turbine: "66mm",
    price: 2774.24,
    inStock: true,
    image: "/precision-turbo-placeholder.png",
  },
  {
    id: "pt-60-62",
    name: "Precision Turbo and Engine Next Gen 60/62 Turbo - Rated 840HP",
    brand: "Precision Turbo & Engine",
    partNumber: "PT-NG-60/62",
    description: "Next Gen 60/62 turbocharger rated for 840HP.",
    category: "turbo",
    power: "840HP",
    compressor: "60mm",
    turbine: "62mm",
    price: 2107.63,
    inStock: true,
    image: "/precision-turbo-placeholder.png",
  },
  {
    id: "pt-62-66",
    name: "Precision Turbo and Engine Next Gen 62/66 Turbo - Rated 925HP",
    brand: "Precision Turbo & Engine",
    partNumber: "PT-NG-62/66",
    description: "Next Gen 62/66 turbocharger rated for 925HP.",
    category: "turbo",
    power: "925HP",
    compressor: "62mm",
    turbine: "66mm",
    price: 2193.93,
    inStock: true,
    image: "/precision-turbo-placeholder.png",
  },
  {
    id: "pt-h-68-75",
    name: "Precision Turbo and Engine H-Cover Next Gen 68/75 Turbo - Rated 1250HP",
    brand: "Precision Turbo & Engine",
    partNumber: "PT-H-68/75",
    description: "H-Cover Next Gen 68/75 turbocharger rated for 1250HP.",
    category: "turbo",
    power: "1250HP",
    compressor: "68mm",
    turbine: "75mm",
    price: 2882.45,
    inStock: true,
    image: "/precision-turbo-placeholder.png",
  },
  {
    id: "pt-t3-rr-scp-64-66",
    name: "Precision Turbo and Engine T3 SS V-Band Reverse Rotation SCP-Cover Next Gen 64/66 Turbo - Rated 1000HP",
    brand: "Precision Turbo & Engine",
    partNumber: "PT-T3-RR-SCP-64/66",
    description: "T3 SS V-Band Reverse Rotation SCP-Cover Next Gen 64/66 turbocharger rated for 1000HP.",
    category: "turbo",
    power: "1000HP",
    compressor: "64mm",
    turbine: "66mm",
    price: 2774.24,
    inStock: true,
    image: "/precision-turbo-placeholder.png",
  },
  {
    id: "pt-h-66-70",
    name: "Precision Turbo and Engine Next Gen H-Cover 66/70 Turbo - Rated 1100HP",
    brand: "Precision Turbo & Engine",
    partNumber: "PT-H-66/70",
    description: "Next Gen H-Cover 66/70 turbocharger rated for 1100HP.",
    category: "turbo",
    power: "1100HP",
    compressor: "66mm",
    turbine: "70mm",
    price: 2769.15,
    inStock: true,
    image: "/precision-turbo-placeholder.png",
  },
  {
    id: "pt-76-85-sportsman",
    name: "Precision Turbo and Engine Next Gen Sportsman 76/85 Turbo - Rated 1500HP",
    brand: "Precision Turbo & Engine",
    partNumber: "PT-NG-S-76/85",
    description: "Next Gen Sportsman 76/85 turbocharger rated for 1500HP.",
    category: "turbo",
    power: "1500HP",
    compressor: "76mm",
    turbine: "85mm",
    price: 4561.86,
    inStock: true,
    image: "/precision-turbo-placeholder.png",
  },
  {
    id: "pt-h-68-70",
    name: "Precision Turbo and Engine Next Gen H-Cover 68/70 Turbo - Rated 1200HP",
    brand: "Precision Turbo & Engine",
    partNumber: "PT-H-68/70",
    description: "Next Gen H-Cover 68/70 turbocharger rated for 1200HP.",
    category: "turbo",
    power: "1200HP",
    compressor: "68mm",
    turbine: "70mm",
    price: 2882.45,
    inStock: true,
    image: "/precision-turbo-placeholder.png",
  },
  {
    id: "pt-ss-rr-scp-68-70",
    name: "Precision Turbo and Engine SS V-Band Reverse Rotation SCP-Cover Next Gen 68/70 Turbo - Rated 1200HP",
    brand: "Precision Turbo & Engine",
    partNumber: "PT-SS-RR-SCP-68/70",
    description: "SS V-Band Reverse Rotation SCP-Cover Next Gen 68/70 turbocharger rated for 1200HP.",
    category: "turbo",
    power: "1200HP",
    compressor: "68mm",
    turbine: "70mm",
    price: 3147.68,
    inStock: true,
    image: "/precision-turbo-placeholder.png",
  },
  {
    id: "pt-hp-64-66",
    name: "Precision Turbo and Engine Next Gen HP-Cover 64/66 Turbo - Rated 1000HP",
    brand: "Precision Turbo & Engine",
    partNumber: "PT-HP-64/66",
    description: "Next Gen HP-Cover 64/66 turbocharger rated for 1000HP.",
    category: "turbo",
    power: "1000HP",
    compressor: "64mm",
    turbine: "66mm",
    price: 2509.01,
    inStock: true,
    image: "/precision-turbo-placeholder.png",
  },

  // S&B Filters Products
  {
    id: "sb-turbo-screen-green",
    name: "S&B Turbo Screen Guard With Velocity Stack (Green)",
    brand: "S&B Filters",
    partNumber: "SB-TSG-GREEN",
    description: "Turbo screen guard with velocity stack in green. Protects turbo inlet from debris.",
    category: "accessories",
    price: 75.00,
    inStock: true,
    image: "/sb-filters-placeholder.png",
  },
  {
    id: "sb-turbo-screen-red",
    name: "S&B Turbo Screen Guard With Velocity Stack (Red)",
    brand: "S&B Filters",
    partNumber: "SB-TSG-RED",
    description: "Turbo screen guard with velocity stack in red. Protects turbo inlet from debris.",
    category: "accessories",
    price: 75.00,
    inStock: true,
    image: "/sb-filters-placeholder.png",
  },
  {
    id: "sb-turbo-screen-black",
    name: "S&B Turbo Screen Guard With Velocity Stack (Black)",
    brand: "S&B Filters",
    partNumber: "SB-TSG-BLACK",
    description: "Turbo screen guard with velocity stack in black. Protects turbo inlet from debris.",
    category: "accessories",
    price: 75.00,
    inStock: true,
    image: "/sb-filters-placeholder.png",
  },
  {
    id: "sb-turbo-screen-blue",
    name: "S&B Turbo Screen Guard With Velocity Stack (Blue)",
    brand: "S&B Filters",
    partNumber: "SB-TSG-BLUE",
    description: "Turbo screen guard with velocity stack in blue. Protects turbo inlet from debris.",
    category: "accessories",
    price: 75.00,
    inStock: true,
    image: "/sb-filters-placeholder.png",
  },

  // Turbosmart Products
  {
    id: "ts-iwg75-gt2860rs",
    name: "Turbosmart IWG75 Wastegate Actuator Suit Garrett GT2860RS (Disco Potato) 5 PSI Black",
    brand: "Turbosmart",
    partNumber: "TS-IWG75-GT2860",
    description: "IWG75 wastegate actuator for Garrett GT2860RS turbo. 5 PSI spring included.",
    category: "wastegate",
    price: 218.95,
    inStock: true,
    image: "/turbosmart-placeholder.png",
  },
  {
    id: "ts-bov-controller-kit",
    name: "Turbosmart Blow Off Valve Controller Kit – GenV RacePort BOV (Black)",
    brand: "Turbosmart",
    partNumber: "TS-BOV-CTRL",
    description: "Electronic BOV controller kit for GenV RacePort BOV. Black finish.",
    category: "blow-off-valve",
    price: 634.95,
    inStock: true,
    image: "/turbosmart-placeholder.png",
  },
  {
    id: "ts-wg40-compgate-blue",
    name: "Turbosmart Gen-V WG40 Comp-Gate40 14psi Blue",
    brand: "Turbosmart",
    partNumber: "TS-WG40-BLUE",
    description: "Gen-V WG40 Comp-Gate40 wastegate. 14psi spring. Blue finish.",
    category: "wastegate",
    price: 393.95,
    inStock: true,
    image: "/turbosmart-placeholder.png",
  },
  {
    id: "ts-wg60cg-black",
    name: "Turbosmart Gen-V WG60CG Power-Gate60 Compressed Gas 5psi Black",
    brand: "Turbosmart",
    partNumber: "TS-WG60CG-BLACK",
    description: "Gen-V WG60CG Power-Gate60 wastegate for compressed gas applications. 5psi. Black.",
    category: "wastegate",
    price: 704.95,
    inStock: true,
    image: "/turbosmart-placeholder.png",
  },
  {
    id: "ts-bov-raceport-red",
    name: "Turbosmart BOV Race Port Gen-V Red",
    brand: "Turbosmart",
    partNumber: "TS-BOV-RP-RED",
    description: "Race Port Gen-V blow off valve in red. Atmospheric venting.",
    category: "blow-off-valve",
    price: 319.95,
    inStock: true,
    image: "/turbosmart-placeholder.png",
  },
  {
    id: "ts-ts2-7170-wc",
    name: "Turbosmart TS-2 Performance Turbocharger (Water Cooled) 7170 (Kompact) V-Band 0.96AR Externally Wastegated",
    brand: "Turbosmart",
    partNumber: "TS-2-7170-WC",
    description: "TS-2 water cooled 7170 Kompact turbocharger. V-Band 0.96AR. Externally wastegated.",
    category: "turbo",
    power: "850HP",
    ar: "0.96",
    price: 2808.95,
    inStock: true,
    image: "/turbosmart-placeholder.png",
  },
  {
    id: "ts-raceport-plumback-sc",
    name: "Turbosmart GenV RacePort Plumback Valve (Sleeper) Female Suit Supercharger",
    brand: "Turbosmart",
    partNumber: "TS-RP-PB-SC",
    description: "GenV RacePort plumback valve for supercharger applications. Sleeper design.",
    category: "blow-off-valve",
    price: 324.95,
    inStock: true,
    image: "/turbosmart-placeholder.png",
  },
  {
    id: "ts-ts2-6466-wc",
    name: "Turbosmart TS-2 Performance Turbocharger (Water Cooled) 6466 V-Band 0.82AR Internally Wastegated",
    brand: "Turbosmart",
    partNumber: "TS-2-6466-WC",
    description: "TS-2 water cooled 6466 turbocharger. V-Band 0.82AR. Internally wastegated.",
    category: "turbo",
    power: "700HP",
    ar: "0.82",
    price: 2561.95,
    inStock: true,
    image: "/turbosmart-placeholder.png",
  },
  {
    id: "ts-proport-sleeper",
    name: "Turbosmart GenV ProPort BOV (Sleeper)",
    brand: "Turbosmart",
    partNumber: "TS-PROPORT-SLP",
    description: "GenV ProPort BOV in sleeper design. Quiet operation.",
    category: "blow-off-valve",
    price: 440.95,
    inStock: true,
    image: "/turbosmart-placeholder.png",
  },
  {
    id: "ts-wg60cg-blue",
    name: "Turbosmart Gen-V WG60CG Power-Gate60 Compressed Gas 5psi Blue",
    brand: "Turbosmart",
    partNumber: "TS-WG60CG-BLUE",
    description: "Gen-V WG60CG Power-Gate60 wastegate for compressed gas applications. 5psi. Blue.",
    category: "wastegate",
    price: 669.95,
    inStock: true,
    image: "/turbosmart-placeholder.png",
  },
  {
    id: "ts-big-bubba-sleeper",
    name: "Turbosmart Big Bubba BPV 'By-Pass Valve' BOV (Sleeper)",
    brand: "Turbosmart",
    partNumber: "TS-BIGBUBBA-SLP",
    description: "Big Bubba by-pass valve in sleeper design. High flow capacity.",
    category: "blow-off-valve",
    price: 435.95,
    inStock: true,
    image: "/turbosmart-placeholder.png",
  },
  {
    id: "ts-bov-raceport-female-purple",
    name: "Turbosmart BOV Race Port Female Gen-V Purple (fits competitors flange) - NO WELD FLANGE",
    brand: "Turbosmart",
    partNumber: "TS-BOV-RP-PURPLE",
    description: "Race Port Gen-V BOV in purple. Female design fits competitors flange. No welding required.",
    category: "blow-off-valve",
    price: 309.95,
    inStock: true,
    image: "/turbosmart-placeholder.png",
  },
  {
    id: "ts-iwg75-twin-14psi",
    name: "Turbosmart IWG75 Twin-Port Universal Wastegate Actuator (UNF) 14PSI",
    brand: "Turbosmart",
    partNumber: "TS-IWG75-TWIN",
    description: "IWG75 twin-port universal wastegate actuator. 14PSI spring.",
    category: "wastegate",
    price: 235.95,
    inStock: true,
    image: "/turbosmart-placeholder.png",
  },
  {
    id: "ts-raceport-sc-black",
    name: "Turbosmart GenV RacePort BOV suit Supercharger (Black)",
    brand: "Turbosmart",
    partNumber: "TS-RP-SC-BLACK",
    description: "GenV RacePort BOV for supercharger applications. Black finish.",
    category: "blow-off-valve",
    price: 319.95,
    inStock: true,
    image: "/turbosmart-placeholder.png",
  },
  {
    id: "ts-ts1-7880-vband",
    name: "Turbosmart TS-1 Performance Turbocharger 7880 V-Band 0.96AR Externally Wastegated",
    brand: "Turbosmart",
    partNumber: "TS-1-7880",
    description: "TS-1 7880 turbocharger. V-Band 0.96AR. Externally wastegated.",
    category: "turbo",
    power: "1100HP",
    ar: "0.96",
    price: 3138.95,
    inStock: true,
    image: "/turbosmart-placeholder.png",
  },
  {
    id: "ts-ts1-6870-kompact",
    name: "Turbosmart TS-1 Performance Turbocharger 6870 (Kompact) V-Band 0.96AR Externally Wastegated",
    brand: "Turbosmart",
    partNumber: "TS-1-6870",
    description: "TS-1 6870 Kompact turbocharger. V-Band 0.96AR. Externally wastegated.",
    category: "turbo",
    power: "800HP",
    ar: "0.96",
    price: 2587.95,
    inStock: true,
    image: "/turbosmart-placeholder.png",
  },
  {
    id: "ts-ts1-6262-rr",
    name: "Turbosmart TS-1 Performance Turbocharger 6262 V-Band 0.82AR Externally Wastegated (Reversed Rotation)",
    brand: "Turbosmart",
    partNumber: "TS-1-6262-RR",
    description: "TS-1 6262 turbocharger reversed rotation. V-Band 0.82AR. Externally wastegated.",
    category: "turbo",
    power: "650HP",
    ar: "0.82",
    price: 2094.95,
    inStock: true,
    image: "/turbosmart-placeholder.png",
  },
  {
    id: "ts-opr-fitting-kit",
    name: "Turbosmart OPR -4 AN Fitting Kit – Clear",
    brand: "Turbosmart",
    partNumber: "TS-OPR-4AN",
    description: "OPR -4 AN fitting kit. Clear finish.",
    category: "accessories",
    price: 35.95,
    inStock: true,
    image: "/turbosmart-placeholder.png",
  },
  {
    id: "ts-wg40-compgate-black",
    name: "Turbosmart Gen-V WG40 Comp-Gate40 14psi Black",
    brand: "Turbosmart",
    partNumber: "TS-WG40-BLACK",
    description: "Gen-V WG40 Comp-Gate40 wastegate. 14psi spring. Black finish.",
    category: "wastegate",
    price: 393.95,
    inStock: true,
    image: "/turbosmart-placeholder.png",
  },
  {
    id: "ts-ts1-7880-t4",
    name: "Turbosmart TS-1 Performance Turbocharger 7880 T4 0.96AR Externally Wastegated",
    brand: "Turbosmart",
    partNumber: "TS-1-7880-T4",
    description: "TS-1 7880 turbocharger with T4 flange. 0.96AR. Externally wastegated.",
    category: "turbo",
    power: "1100HP",
    ar: "0.96",
    price: 3002.95,
    inStock: true,
    image: "/turbosmart-placeholder.png",
  },
  {
    id: "ts-wg50-progate-black",
    name: "Turbosmart Gen-V WG50 Pro-Gate50 14psi Black",
    brand: "Turbosmart",
    partNumber: "TS-WG50-BLACK",
    description: "Gen-V WG50 Pro-Gate50 wastegate. 14psi spring. Black finish.",
    category: "wastegate",
    price: 555.95,
    inStock: true,
    image: "/turbosmart-placeholder.png",
  },

  // VS Racing
  {
    id: "vs-4-113mm-t6",
    name: "VS Racing 4/113mm Billet T6 1.24 Turbo",
    brand: "VS Racing",
    partNumber: "VS-4-113-T6",
    description: "4/113mm billet T6 turbocharger. 1.24 A/R turbine housing.",
    category: "turbo",
    power: "2000HP+",
    compressor: "113mm",
    ar: "1.24",
    price: 2299.00,
    inStock: true,
    image: "/vs-racing-placeholder.png",
  },
  {
    id: "vs-80mm-t6",
    name: "VS Racing 80mm Billet T6 1.32ar",
    brand: "VS Racing",
    partNumber: "VS-80MM-T6",
    description: "80mm billet T6 turbocharger. 1.32 A/R turbine housing.",
    category: "turbo",
    compressor: "80mm",
    ar: "1.32",
    price: 800.00,
    inStock: true,
    image: "/vs-racing-placeholder.png",
  },
  {
    id: "vs-ng-7875",
    name: "VS Racing Next Gen 7875 Billet .96ar Turbo",
    brand: "VS Racing",
    partNumber: "VS-NG-7875",
    description: "Next Gen 7875 billet turbocharger. 0.96 A/R turbine housing.",
    category: "turbo",
    compressor: "78mm",
    turbine: "75mm",
    ar: "0.96",
    price: 749.00,
    inStock: true,
    image: "/vs-racing-placeholder.png",
  },
  {
    id: "vs-85mm-slip",
    name: "VS Racing 85mm Billet slip fit 1.32ar t6",
    brand: "VS Racing",
    partNumber: "VS-85MM-SLIP",
    description: "85mm billet slip fit turbocharger. T6 flange, 1.32 A/R.",
    category: "turbo",
    compressor: "85mm",
    ar: "1.32",
    price: 899.00,
    inStock: true,
    image: "/vs-racing-placeholder.png",
  },
  {
    id: "vs-50mm-bov",
    name: "VS Racing 50mm BOV",
    brand: "VS Racing",
    partNumber: "VS-50MM-BOV",
    description: "50mm blow-off valve. Affordable performance.",
    category: "blow-off-valve",
    price: 68.00,
    inStock: true,
    image: "/vs-racing-placeholder.png",
  },
  {
    id: "vs-88-103mm",
    name: "VS Racing 88/103 mm Next Gen Billet",
    brand: "VS Racing",
    partNumber: "VS-88-103-NG",
    description: "88/103mm Next Gen billet turbocharger. Massive power potential.",
    category: "turbo",
    compressor: "88mm",
    turbine: "103mm",
    power: "2000HP+",
    price: 1399.00,
    inStock: true,
    image: "/vs-racing-placeholder.png",
  },
  {
    id: "vs-gen3-7875",
    name: "VS Racing Gen3 7875 Billet .96ar T4",
    brand: "VS Racing",
    partNumber: "VS-G3-7875-T4",
    description: "Gen3 7875 billet turbocharger. T4 flange, 0.96 A/R.",
    category: "turbo",
    compressor: "78mm",
    turbine: "75mm",
    ar: "0.96",
    price: 879.00,
    inStock: true,
    image: "/vs-racing-placeholder.png",
  },
  {
    id: "vs-70-70-t4",
    name: "VS Racing 70/70 Billet T4 .96ar T4",
    brand: "VS Racing",
    partNumber: "VS-70-70-T4",
    description: "70/70 billet turbocharger. T4 flanges, 0.96 A/R.",
    category: "turbo",
    compressor: "70mm",
    turbine: "70mm",
    ar: "0.96",
    price: 679.00,
    inStock: true,
    image: "/vs-racing-placeholder.png",
  },
  {
    id: "vs-67-66-t4",
    name: "VS Racing 67/66 Billet T4",
    brand: "VS Racing",
    partNumber: "VS-67-66-T4",
    description: "67/66 billet turbocharger. T4 flange.",
    category: "turbo",
    compressor: "67mm",
    turbine: "66mm",
    price: 679.00,
    inStock: true,
    image: "/vs-racing-placeholder.png",
  },
  {
    id: "vs-7875-t51r",
    name: "VS Racing 7875 Billet T51R .96ar or 1.25 ar options (Reverse Options)",
    brand: "VS Racing",
    partNumber: "VS-7875-T51R",
    description: "7875 billet turbocharger with T51R housing. Available in 0.96 or 1.25 A/R. Reverse rotation options available.",
    category: "turbo",
    compressor: "78mm",
    turbine: "75mm",
    ar: "0.96/1.25",
    price: 679.00,
    inStock: true,
    image: "/vs-racing-placeholder.png",
  },

  // Additional Turbosmart products
  {
    id: "ts-ebg50",
    name: "Turbosmart eBG50 Electronic BoostGate 50 Charge Air Valve",
    brand: "Turbosmart",
    partNumber: "TS-EBG50",
    description: "Electronic BoostGate 50 charge air valve. Electronic boost control.",
    category: "accessories",
    price: 1390.95,
    inStock: true,
    image: "/turbosmart-placeholder.png",
  },
  {
    id: "ts-fpr-800",
    name: "Turbosmart Fuel Pressure Regulator 800 1/8 NPT – Black",
    brand: "Turbosmart",
    partNumber: "TS-FPR-800",
    description: "Fuel pressure regulator 800. 1/8 NPT ports. Black finish.",
    category: "accessories",
    price: 178.95,
    inStock: true,
    image: "/turbosmart-placeholder.png",
  },
  {
    id: "ts-raceport-plumback-sleeper",
    name: "Turbosmart GenV RacePort Plumback Valve (Sleeper)",
    brand: "Turbosmart",
    partNumber: "TS-RP-PLUM-SLP",
    description: "GenV RacePort plumb-back valve. Sleeper edition for quiet operation.",
    category: "blow-off-valve",
    price: 329.95,
    inStock: true,
    image: "/turbosmart-placeholder.png",
  },
  {
    id: "ts-ts1-6262-vband",
    name: "Turbosmart TS-1 Performance Turbocharger 6262 V-Band 0.82AR Externally Wastegated",
    brand: "Turbosmart",
    partNumber: "TS-1-6262-VB",
    description: "TS-1 performance turbocharger 6262. V-Band inlet/outlet, 0.82 A/R, external wastegate.",
    category: "turbo",
    compressor: "62mm",
    turbine: "62mm",
    ar: "0.82",
    price: 2094.95,
    inStock: true,
    image: "/turbosmart-placeholder.png",
  },
  {
    id: "ts-bov-raceport-female-sleeper",
    name: "Turbosmart BOV RacePort Female GenV – Sleeper",
    brand: "Turbosmart",
    partNumber: "TS-RP-FEM-SLP",
    description: "RacePort Female GenV BOV. Sleeper edition.",
    category: "blow-off-valve",
    price: 329.95,
    inStock: true,
    image: "/turbosmart-placeholder.png",
  },
  {
    id: "ts-proport-black",
    name: "Turbosmart GenV ProPort BOV (Black)",
    brand: "Turbosmart",
    partNumber: "TS-PROPORT-BLK",
    description: "GenV ProPort blow-off valve. Black finish.",
    category: "blow-off-valve",
    price: 440.95,
    inStock: true,
    image: "/turbosmart-placeholder.png",
  },
  {
    id: "ts-raceport-em-sleeper",
    name: "Turbosmart GenV RacePort EM Valve – Sleeper",
    brand: "Turbosmart",
    partNumber: "TS-RP-EM-SLP",
    description: "GenV RacePort EM valve. Sleeper edition.",
    category: "blow-off-valve",
    price: 419.95,
    inStock: true,
    image: "/turbosmart-placeholder.png",
  },
  {
    id: "ts-ts1-6466-vband",
    name: "Turbosmart TS-1 Performance Turbocharger 6466 V-Band 0.82AR Externally Wastegated",
    brand: "Turbosmart",
    partNumber: "TS-1-6466-VB",
    description: "TS-1 performance turbocharger 6466. V-Band inlet/outlet, 0.82 A/R, external wastegate.",
    category: "turbo",
    compressor: "64mm",
    turbine: "66mm",
    ar: "0.82",
    price: 2288.95,
    inStock: true,
    image: "/turbosmart-placeholder.png",
  },
  {
    id: "ts-ts1-5862-vband",
    name: "Turbosmart TS-1 Performance Turbocharger 5862 V-Band 0.82AR Externally Wastegated",
    brand: "Turbosmart",
    partNumber: "TS-1-5862-VB",
    description: "TS-1 performance turbocharger 5862. V-Band inlet/outlet, 0.82 A/R, external wastegate.",
    category: "turbo",
    compressor: "58mm",
    turbine: "62mm",
    ar: "0.82",
    price: 2094.95,
    inStock: true,
    image: "/turbosmart-placeholder.png",
  },
  {
    id: "ts-ts2-6262-int",
    name: "Turbosmart TS-2 Performance Turbocharger (Water Cooled) 6262 V-Band 0.82AR Internally Wastegated",
    brand: "Turbosmart",
    partNumber: "TS-2-6262-INT",
    description: "TS-2 water cooled turbocharger 6262. V-Band, 0.82 A/R, internal wastegate.",
    category: "turbo",
    compressor: "62mm",
    turbine: "62mm",
    ar: "0.82",
    price: 2340.95,
    inStock: true,
    image: "/turbosmart-placeholder.png",
  },
  {
    id: "ts-ts1-6870-t4",
    name: "Turbosmart TS-1 Performance Turbocharger 6870 (Kompact) T4 0.96AR Externally Wastegated",
    brand: "Turbosmart",
    partNumber: "TS-1-6870-T4",
    description: "TS-1 Kompact turbocharger 6870. T4 flange, 0.96 A/R, external wastegate.",
    category: "turbo",
    compressor: "68mm",
    turbine: "70mm",
    ar: "0.96",
    price: 2477.95,
    inStock: true,
    image: "/turbosmart-placeholder.png",
  },
  {
    id: "ts-ts1-5862-t3",
    name: "Turbosmart TS-1 Performance Turbocharger 5862 T3 0.63AR Externally Wastegated",
    brand: "Turbosmart",
    partNumber: "TS-1-5862-T3",
    description: "TS-1 performance turbocharger 5862. T3 flange, 0.63 A/R, external wastegate.",
    category: "turbo",
    compressor: "58mm",
    turbine: "62mm",
    ar: "0.63",
    price: 2010.95,
    inStock: true,
    image: "/turbosmart-placeholder.png",
  },
  {
    id: "ts-opr-t40-black",
    name: "Turbosmart OPR T40 40psi Black",
    brand: "Turbosmart",
    partNumber: "TS-OPR-T40-BLK",
    description: "Oil pressure regulator T40. 40psi. Black finish.",
    category: "accessories",
    price: 143.28,
    inStock: true,
    image: "/turbosmart-placeholder.png",
  },
  {
    id: "ts-ts1-7675-t4",
    name: "Turbosmart TS-1 Performance Turbocharger 7675 T4 0.96AR Externally Wastegated",
    brand: "Turbosmart",
    partNumber: "TS-1-7675-T4",
    description: "TS-1 performance turbocharger 7675. T4 flange, 0.96 A/R, external wastegate.",
    category: "turbo",
    compressor: "76mm",
    turbine: "75mm",
    ar: "0.96",
    price: 2697.95,
    inStock: true,
    image: "/turbosmart-placeholder.png",
  },
  {
    id: "ts-oil-filter",
    name: "Turbosmart Billet Turbo Oil Feed Filter 44um -4AN – Black",
    brand: "Turbosmart",
    partNumber: "TS-OIL-FILTER",
    description: "Billet turbo oil feed filter. 44 micron, -4AN fittings. Black.",
    category: "accessories",
    price: 47.95,
    inStock: true,
    image: "/turbosmart-placeholder.png",
  },
  {
    id: "ts-bov-raceport-female-red",
    name: "Turbosmart BOV Race Port Female Gen-V Red (fits competitors flange) - NO WELD FLANGE",
    brand: "Turbosmart",
    partNumber: "TS-RP-FEM-RED",
    description: "Race Port Female Gen-V BOV. Red finish. Fits competitor flanges, no weld required.",
    category: "blow-off-valve",
    price: 309.95,
    inStock: true,
    image: "/turbosmart-placeholder.png",
  },
  {
    id: "ts-bov-raceport-purple",
    name: "Turbosmart BOV Race Port Gen-V Purple",
    brand: "Turbosmart",
    partNumber: "TS-RP-PURPLE",
    description: "Race Port Gen-V BOV. Purple finish.",
    category: "blow-off-valve",
    price: 319.95,
    inStock: true,
    image: "/turbosmart-placeholder.png",
  },
  {
    id: "ts-wg60-powergate-blue",
    name: "Turbosmart Gen-V WG60 Power-Gate60 14psi Blue",
    brand: "Turbosmart",
    partNumber: "TS-WG60-BLUE",
    description: "Gen-V WG60 Power-Gate60 wastegate. 14psi spring. Blue finish.",
    category: "wastegate",
    price: 674.95,
    inStock: true,
    image: "/turbosmart-placeholder.png",
  },
  {
    id: "ts-ts2-6262-ext",
    name: "Turbosmart TS-2 Performance Turbocharger (Water Cooled) 6262 V-Band 0.82AR Externally Wastegated",
    brand: "Turbosmart",
    partNumber: "TS-2-6262-EXT",
    description: "TS-2 water cooled turbocharger 6262. V-Band, 0.82 A/R, external wastegate.",
    category: "turbo",
    compressor: "62mm",
    turbine: "62mm",
    ar: "0.82",
    price: 2146.95,
    inStock: true,
    image: "/turbosmart-placeholder.png",
  },
  {
    id: "ts-opr-t40-blue",
    name: "Turbosmart OPR T40 40psi Blue",
    brand: "Turbosmart",
    partNumber: "TS-OPR-T40-BLU",
    description: "Oil pressure regulator T40. 40psi. Blue finish.",
    category: "accessories",
    price: 128.95,
    inStock: true,
    image: "/turbosmart-placeholder.png",
  },
  {
    id: "ts-ts1-7675-vband",
    name: "Turbosmart TS-1 Performance Turbocharger 7675 V-Band 0.96AR Externally Wastegated",
    brand: "Turbosmart",
    partNumber: "TS-1-7675-VB",
    description: "TS-1 performance turbocharger 7675. V-Band inlet/outlet, 0.96 A/R, external wastegate.",
    category: "turbo",
    compressor: "76mm",
    turbine: "75mm",
    ar: "0.96",
    price: 2865.95,
    inStock: true,
    image: "/turbosmart-placeholder.png",
  },
  {
    id: "ts-powerport-black",
    name: "Turbosmart PowerPort BOV (Black)",
    brand: "Turbosmart",
    partNumber: "TS-POWERPORT-BLK",
    description: "PowerPort blow-off valve. Black finish.",
    category: "blow-off-valve",
    price: 519.95,
    inStock: true,
    image: "/turbosmart-placeholder.png",
  },
  {
    id: "ts-fpr-2000",
    name: "Turbosmart Fuel Pressure Regulator 2000 -8AN – Black",
    brand: "Turbosmart",
    partNumber: "TS-FPR-2000",
    description: "Fuel pressure regulator 2000. -8AN ports. Black finish. High flow.",
    category: "accessories",
    price: 249.95,
    inStock: true,
    image: "/turbosmart-placeholder.png",
  },
  {
    id: "ts-eboost-street",
    name: "Turbosmart E-Boost Street 40psi",
    brand: "Turbosmart",
    partNumber: "TS-EBOOST-ST",
    description: "E-Boost Street electronic boost controller. 40psi max.",
    category: "accessories",
    price: 440.95,
    inStock: true,
    image: "/turbosmart-placeholder.png",
  },
  {
    id: "ts-ts1-6466-rev",
    name: "Turbosmart TS-1 Performance Turbocharger 6466 V-Band 0.82AR Externally Wastegated (Reversed Rotation)",
    brand: "Turbosmart",
    partNumber: "TS-1-6466-REV",
    description: "TS-1 performance turbocharger 6466. V-Band, 0.82 A/R, external wastegate. Reversed rotation.",
    category: "turbo",
    compressor: "64mm",
    turbine: "66mm",
    ar: "0.82",
    price: 2288.95,
    inStock: true,
    image: "/turbosmart-placeholder.png",
  },
  {
    id: "ts-wg45-hypergate-black",
    name: "Turbosmart Gen-V WG45 Hyper-Gate45 14psi Black",
    brand: "Turbosmart",
    partNumber: "TS-WG45-HG-BLK",
    description: "Gen-V WG45 Hyper-Gate45 wastegate. 14psi spring. Black finish.",
    category: "wastegate",
    price: 466.95,
    inStock: true,
    image: "/turbosmart-placeholder.png",
  },
  {
    id: "ts-ts2-6466-ext",
    name: "Turbosmart TS-2 Performance Turbocharger (Water Cooled) 6466 V-Band 0.82AR Externally Wastegated",
    brand: "Turbosmart",
    partNumber: "TS-2-6466-EXT",
    description: "TS-2 water cooled turbocharger 6466. V-Band, 0.82 A/R, external wastegate.",
    category: "turbo",
    compressor: "64mm",
    turbine: "66mm",
    ar: "0.82",
    price: 2340.95,
    inStock: true,
    image: "/turbosmart-placeholder.png",
  },
  {
    id: "ts-eb2-solenoid",
    name: "Turbosmart EB2 4 Port Solenoid",
    brand: "Turbosmart",
    partNumber: "TS-EB2-SOL",
    description: "EB2 4 port solenoid for electronic boost control.",
    category: "accessories",
    price: 167.72,
    inStock: true,
    image: "/turbosmart-placeholder.png",
  },
  {
    id: "ts-fpr-1200",
    name: "Turbosmart Fuel Pressure Regulator 1200 -6AN – Black",
    brand: "Turbosmart",
    partNumber: "TS-FPR-1200",
    description: "Fuel pressure regulator 1200. -6AN ports. Black finish.",
    category: "accessories",
    price: 197.95,
    inStock: true,
    image: "/turbosmart-placeholder.png",
  },
  {
    id: "ts-wg45-hypergate-blue",
    name: "Turbosmart Gen-V WG45 Hyper-Gate45 14psi Blue",
    brand: "Turbosmart",
    partNumber: "TS-WG45-HG-BLU",
    description: "Gen-V WG45 Hyper-Gate45 wastegate. 14psi spring. Blue finish.",
    category: "wastegate",
    price: 466.95,
    inStock: true,
    image: "/turbosmart-placeholder.png",
  },
  {
    id: "ts-eboost2-60mm-black",
    name: "Turbosmart EBoost2 60mm Black",
    brand: "Turbosmart",
    partNumber: "TS-EBOOST2-BLK",
    description: "EBoost2 electronic boost controller with 60mm gauge. Black.",
    category: "accessories",
    price: 660.95,
    inStock: true,
    image: "/turbosmart-placeholder.png",
  },
  {
    id: "ts-opr-v2",
    name: "Turbosmart OPR V2 Turbo Oil Pressure Regulator",
    brand: "Turbosmart",
    partNumber: "TS-OPR-V2",
    description: "OPR V2 turbo oil pressure regulator. Precision oil control.",
    category: "accessories",
    price: 157.95,
    inStock: true,
    image: "/turbosmart-placeholder.png",
  },
  {
    id: "ts-bov-raceport-female-black",
    name: "Turbosmart BOV Race Port Female Gen-V Black (fits competitors flange) - NO WELD FLANGE",
    brand: "Turbosmart",
    partNumber: "TS-RP-FEM-BLK",
    description: "Race Port Female Gen-V BOV. Black finish. Fits competitor flanges.",
    category: "blow-off-valve",
    price: 309.95,
    inStock: true,
    image: "/turbosmart-placeholder.png",
  },
  {
    id: "ts-bov-raceport-blue",
    name: "Turbosmart BOV Race Port Gen-V Blue",
    brand: "Turbosmart",
    partNumber: "TS-RP-BLUE",
    description: "Race Port Gen-V BOV. Blue finish.",
    category: "blow-off-valve",
    price: 319.95,
    inStock: true,
    image: "/turbosmart-placeholder.png",
  },
  {
    id: "ts-raceport-sleeper",
    name: "Turbosmart GenV Raceport BOV – (Sleeper)",
    brand: "Turbosmart",
    partNumber: "TS-RP-SLP",
    description: "GenV Raceport BOV. Sleeper edition for quiet operation.",
    category: "blow-off-valve",
    price: 329.95,
    inStock: true,
    image: "/turbosmart-placeholder.png",
  },
  {
    id: "ts-bov-raceport-female-blue",
    name: "Turbosmart BOV Race Port Female Gen-V Blue (fits competitors flange) - NO WELD FLANGE",
    brand: "Turbosmart",
    partNumber: "TS-RP-FEM-BLU",
    description: "Race Port Female Gen-V BOV. Blue finish. Fits competitor flanges.",
    category: "blow-off-valve",
    price: 309.95,
    inStock: true,
    image: "/turbosmart-placeholder.png",
  },
  {
    id: "ts-wg50-progate-blue",
    name: "Turbosmart Gen-V WG50 Pro-Gate50 14psi Blue",
    brand: "Turbosmart",
    partNumber: "TS-WG50-BLUE",
    description: "Gen-V WG50 Pro-Gate50 wastegate. 14psi spring. Blue finish.",
    category: "wastegate",
    price: 555.95,
    inStock: true,
    image: "/turbosmart-placeholder.png",
  },
  {
    id: "ts-wg60-powergate-black",
    name: "Turbosmart Gen-V WG60 Power-Gate60 14psi Black",
    brand: "Turbosmart",
    partNumber: "TS-WG60-BLACK",
    description: "Gen-V WG60 Power-Gate60 wastegate. 14psi spring. Black finish.",
    category: "wastegate",
    price: 674.95,
    inStock: true,
    image: "/turbosmart-placeholder.png",
  },
  {
    id: "ts-bov-raceport-black",
    name: "Turbosmart BOV Race Port Gen-V Black",
    brand: "Turbosmart",
    partNumber: "TS-RP-BLACK",
    description: "Race Port Gen-V BOV. Black finish.",
    category: "blow-off-valve",
    price: 319.95,
    inStock: true,
    image: "/turbosmart-placeholder.png",
  },

  // Dirty Dingo
  {
    id: "dd-ls-oil-feed",
    name: "Dirty Dingo LS Turbo Oil Feed Kit",
    brand: "Dirty Dingo",
    partNumber: "DD-LS-OIL",
    description: "LS turbo oil feed kit. Complete kit for LS engine turbo installations.",
    category: "accessories",
    price: 89.99,
    inStock: true,
    image: "/dirty-dingo-placeholder.png",
  },

  // Procharger
  {
    id: "pc-race-valve-steel",
    name: "Procharger Race Valve - Open with Steel Flange",
    brand: "Procharger",
    partNumber: "PC-RV-STEEL",
    description: "Race valve - open style with steel flange. For supercharger applications.",
    category: "blow-off-valve",
    price: 498.00,
    inStock: true,
    image: "/procharger-placeholder.png",
  },
  {
    id: "pc-race-valve-alum",
    name: "Procharger Race Valve \"OPEN\" with mounting hardware - Aluminum Flange",
    brand: "Procharger",
    partNumber: "PC-RV-ALUM",
    description: "Race valve - open style with aluminum flange. Includes mounting hardware.",
    category: "blow-off-valve",
    price: 498.00,
    inStock: true,
    image: "/procharger-placeholder.png",
  },

  // Precision Turbo Accessories
  {
    id: "pte-discharge-flange",
    name: "PTE 074-3029 5 1/4\" Turbine Discharge Flange for Large Frame Turbochargers",
    brand: "Precision Turbo & Engine",
    partNumber: "074-3029",
    description: "5 1/4\" turbine discharge flange for large frame turbochargers.",
    category: "accessories",
    price: 62.99,
    inStock: true,
    image: "/precision-turbo-placeholder.png",
  },
  {
    id: "pte-50mm-bov",
    name: "PTE 50mm Blow-Off Valve",
    brand: "Precision Turbo & Engine",
    partNumber: "PTE-50MM-BOV",
    description: "50mm blow-off valve from Precision Turbo.",
    category: "blow-off-valve",
    price: 267.79,
    inStock: true,
    image: "/precision-turbo-placeholder.png",
  },
  {
    id: "pte-vband-flange",
    name: "PTE 074-1030 V-Band Flange For Turbine Inlet on a PTE V-Band Inlet/Outlet Turbine Housing",
    brand: "Precision Turbo & Engine",
    partNumber: "074-1030",
    description: "V-Band flange for turbine inlet. Fits PTE V-Band inlet/outlet turbine housings.",
    category: "accessories",
    price: 41.99,
    inStock: true,
    image: "/precision-turbo-placeholder.png",
  },

  // ICT Billet
  {
    id: "ict-ls-oil-adapter",
    name: "ICT BILLET LS Turbo Oil Supply / Feed Adapter Port M16-1.5 to -4AN Fitting LSX LS1 LS3 LS2",
    brand: "ICT BILLET",
    partNumber: "ICT-LS-OIL-ADPT",
    description: "LS turbo oil supply adapter. M16-1.5 to -4AN. Fits LS1, LS2, LS3, LSX engines.",
    category: "accessories",
    price: 25.99,
    inStock: true,
    image: "/ict-billet-placeholder.png",
  },
  {
    id: "ict-oil-line-48",
    name: "ICT BILLET Steel Braided Turbo Oil Feed Line 48\" Length Hose -4AN 90 degree straight",
    brand: "ICT BILLET",
    partNumber: "ICT-OIL-48",
    description: "Steel braided turbo oil feed line. 48\" length. -4AN with 90 degree and straight fittings.",
    category: "accessories",
    price: 54.99,
    inStock: true,
    image: "/ict-billet-placeholder.png",
  },
  {
    id: "ict-oil-line-60",
    name: "ICT BILLET Steel Braided Turbo Oil Feed Line 60\" Length Hose -4AN 90 degree straight",
    brand: "ICT BILLET",
    partNumber: "ICT-OIL-60",
    description: "Steel braided turbo oil feed line. 60\" length. -4AN with 90 degree and straight fittings.",
    category: "accessories",
    price: 58.99,
    inStock: true,
    image: "/ict-billet-placeholder.png",
  },

  // ===== NITROUS PRODUCTS =====
  {
    id: "no-xseries-efi-single",
    name: "Nitrous Outlet X-Series Universal EFI Single Nozzle System with Bottle Upgrade",
    brand: "Nitrous Outlet",
    partNumber: "NO-X-EFI-SINGLE",
    description: "X-Series Universal EFI Single Nozzle System with Bottle Upgrade.",
    category: "nitrous",
    price: 611.99,
    inStock: true,
  },
  {
    id: "tz-bottle-holder-single-10",
    name: "Team Z Motorsports Nitrous Bottle Holder Single - 10lbs",
    brand: "Team Z",
    partNumber: "TZ-BH-S10",
    description: "Single nitrous bottle holder for 10lb bottles.",
    category: "nitrous",
    price: 220.00,
    inStock: true,
  },
  {
    id: "tz-bottle-holder-double-10",
    name: "Team Z Motorsports Nitrous Bottle Holder Double - 10lbs",
    brand: "Team Z",
    partNumber: "TZ-BH-D10",
    description: "Double nitrous bottle holder for 10lb bottles.",
    category: "nitrous",
    price: 315.00,
    inStock: true,
  },
  {
    id: "nx-coyote-direct-port",
    name: "Nitrous Express Direct Port Plate System For Coyote Engine",
    brand: "Nitrous Express",
    partNumber: "NX-COYOTE-DP",
    description: "Direct Port Plate System designed specifically for Coyote engines.",
    category: "nitrous",
    price: 1526.48,
    inStock: true,
  },
  {
    id: "nx-shark-dual-alc",
    name: "Nitrous Express SHARK DUAL STG/ALC 16 NZLS (200-1200HP) 8 SOLENOIDS",
    brand: "Nitrous Express",
    partNumber: "NX-SHARK-DUAL-ALC",
    description: "SHARK dual stage alcohol nitrous system with 16 nozzles, 200-1200HP capability with 8 solenoids.",
    category: "nitrous",
    power: "200-1200HP",
    price: 2554.68,
    inStock: true,
  },
  {
    id: "nx-ls-78mm-plate",
    name: "Nitrous Express LS 78MM 3-BOLT PLATE SYSTEM (50-350HP)",
    brand: "Nitrous Express",
    partNumber: "NX-LS-78MM",
    description: "LS 78mm 3-bolt plate system for 50-350HP.",
    category: "nitrous",
    power: "50-350HP",
    price: 857.57,
    inStock: true,
  },
  {
    id: "nx-hemi-single-nozzle",
    name: "Nitrous Express Hemi & Srt8 Single Nozzle Fly-By-Wire Sys (35-150Hp)",
    brand: "Nitrous Express",
    partNumber: "NX-HEMI-SN",
    description: "Hemi & SRT8 single nozzle fly-by-wire system for 35-150HP.",
    category: "nitrous",
    power: "35-150HP",
    price: 924.88,
    inStock: true,
  },
  {
    id: "nx-ls-102mm-plate",
    name: "Nitrous Express LS 102mm Plate System",
    brand: "Nitrous Express",
    partNumber: "NX-LS-102MM",
    description: "LS 102mm plate system for high-flow applications.",
    category: "nitrous",
    price: 857.57,
    inStock: true,
  },
  {
    id: "nx-lt1-corvette-camaro",
    name: "Nitrous Express LT1 6.2L Corvette/Camaro Nitrous Plate System",
    brand: "Nitrous Express",
    partNumber: "NX-LT1-PLATE",
    description: "LT1 6.2L nitrous plate system for Corvette and Camaro.",
    category: "nitrous",
    price: 1094.48,
    inStock: true,
  },
  {
    id: "nx-hemi-direct-port",
    name: "Nitrous Express Direct Port Plate System For 5.7, 6.1 and 6.4 Hemi",
    brand: "Nitrous Express",
    partNumber: "NX-HEMI-DP",
    description: "Direct port plate system for 5.7, 6.1 and 6.4 Hemi engines.",
    category: "nitrous",
    price: 1526.47,
    inStock: true,
  },
  {
    id: "nx-pro-shk-gas-rails",
    name: "Nitrous Express PRO-SHK/GAS (200,300,400,500,600HP) W/ RAILS",
    brand: "Nitrous Express",
    partNumber: "NX-PRO-SHK-GAS",
    description: "Pro Shark gasoline system with rails, 200-600HP capability.",
    category: "nitrous",
    power: "200-600HP",
    price: 2043.21,
    inStock: true,
  },
  {
    id: "nx-shark-dual-gas-rails",
    name: "Nitrous Express SHARK DUAL STG/GAS/RAILS 16 NZLS (200-1200HP)",
    brand: "Nitrous Express",
    partNumber: "NX-SHARK-DUAL-GAS",
    description: "SHARK dual stage gasoline system with rails, 16 nozzles, 200-1200HP.",
    category: "nitrous",
    power: "200-1200HP",
    price: 2993.26,
    inStock: true,
  },
  {
    id: "nx-lt4-supercharged",
    name: "Nitrous Express LT4 Supercharged 6.2L Nitrous Plate System (50-250HP)",
    brand: "Nitrous Express",
    partNumber: "NX-LT4-PLATE",
    description: "LT4 supercharged 6.2L nitrous plate system, 50-250HP.",
    category: "nitrous",
    power: "50-250HP",
    price: 973.08,
    inStock: true,
  },
  {
    id: "nx-lt4-billet-lid",
    name: "Nitrous Express Nitrous System With Billet LT4 Supercharger Lid",
    brand: "Nitrous Express",
    partNumber: "NX-LT4-BILLET",
    description: "Nitrous system with billet LT4 supercharger lid.",
    category: "nitrous",
    price: 2779.10,
    inStock: true,
  },
  {
    id: "tz-bottle-holder-double-15",
    name: "Team Z Motorsports Nitrous Bottle Holder Double - 15lbs",
    brand: "Team Z",
    partNumber: "TZ-BH-D15",
    description: "Double nitrous bottle holder for 15lb bottles.",
    category: "nitrous",
    price: 320.00,
    inStock: true,
  },
  {
    id: "nx-f150-coyote",
    name: "Nitrous Express 21+ F-150 5.0 Coyote Truck Nitrous Plate System",
    brand: "Nitrous Express",
    partNumber: "NX-F150-COYOTE",
    description: "2021+ F-150 5.0 Coyote truck nitrous plate system.",
    category: "nitrous",
    price: 950.13,
    inStock: true,
  },
  {
    id: "nx-coyote-godzilla-hi",
    name: "Nitrous Express 5.0L Coyote and 7.3L Godzilla Plate High Output System (50-250Hp)",
    brand: "Nitrous Express",
    partNumber: "NX-COY-GOD-HI",
    description: "5.0L Coyote and 7.3L Godzilla plate high output system, 50-250HP.",
    category: "nitrous",
    power: "50-250HP",
    price: 952.63,
    inStock: true,
  },
  {
    id: "nx-90mm-hemi-plate",
    name: "Nitrous Express 90mm Hemi Plate System (50-400Hp)",
    brand: "Nitrous Express",
    partNumber: "NX-90MM-HEMI",
    description: "90mm Hemi plate system, 50-400HP.",
    category: "nitrous",
    power: "50-400HP",
    price: 1011.02,
    inStock: true,
  },
  {
    id: "nx-coyote-single-nozzle",
    name: "Nitrous Express 5.0 Coyote Single Nozzle System (35-150Hp)",
    brand: "Nitrous Express",
    partNumber: "NX-COYOTE-SN",
    description: "5.0 Coyote single nozzle system, 35-150HP.",
    category: "nitrous",
    power: "35-150HP",
    price: 924.88,
    inStock: true,
  },
  {
    id: "nx-lt4-wm-billet",
    name: "Nitrous Express Nitrous & Water Methanol System W/Billet LT4 Supercharger Lid",
    brand: "Nitrous Express",
    partNumber: "NX-LT4-WM-BILLET",
    description: "Nitrous and water methanol system with billet LT4 supercharger lid.",
    category: "nitrous",
    price: 4497.22,
    inStock: true,
  },
  {
    id: "nx-pro-shk-gas-4sol",
    name: "Nitrous Express Pro-Shk/Gas (200-300-400-500Hp) 4 Solenoids With Rails",
    brand: "Nitrous Express",
    partNumber: "NX-PRO-SHK-4SOL",
    description: "Pro Shark gasoline system with 4 solenoids and rails, 200-500HP.",
    category: "nitrous",
    power: "200-500HP",
    price: 1824.58,
    inStock: true,
  },
  {
    id: "nx-ls-90mm-hardline",
    name: "Nitrous Express LS Single Entry 90mm Plate Hardline System (50-400Hp)",
    brand: "Nitrous Express",
    partNumber: "NX-LS-90MM-HL",
    description: "LS single entry 90mm plate hardline system, 50-400HP.",
    category: "nitrous",
    power: "50-400HP",
    price: 957.57,
    inStock: true,
  },
  {
    id: "nx-sx2-dual-gas",
    name: "Nitrous Express SX2 DUAL STG/GAS/RAILS 8 NZLS (200-1200HP)",
    brand: "Nitrous Express",
    partNumber: "NX-SX2-DUAL-GAS",
    description: "SX2 dual stage gasoline system with rails, 8 nozzles, 200-1200HP.",
    category: "nitrous",
    power: "200-1200HP",
    price: 3089.89,
    inStock: true,
  },
  {
    id: "nx-shark-dual-gas-8sol",
    name: "Nitrous Express SHARK DUAL STG /GAS 16 NZLS (200-1200HP) 8 SOLENOIDS",
    brand: "Nitrous Express",
    partNumber: "NX-SHARK-8SOL",
    description: "SHARK dual stage gasoline system, 16 nozzles, 200-1200HP with 8 solenoids.",
    category: "nitrous",
    power: "200-1200HP",
    price: 2554.68,
    inStock: true,
  },
  {
    id: "nx-hemi-plate-50-400",
    name: "Nitrous Express Hemi Plate System (50-400Hp)",
    brand: "Nitrous Express",
    partNumber: "NX-HEMI-PLATE",
    description: "Hemi plate system, 50-400HP.",
    category: "nitrous",
    power: "50-400HP",
    price: 1011.02,
    inStock: true,
  },
  {
    id: "nx-coyote-dry-direct",
    name: "Nitrous Express Dry Direct Port Plate System For Coyote Engine",
    brand: "Nitrous Express",
    partNumber: "NX-COYOTE-DRY",
    description: "Dry direct port plate system for Coyote engine.",
    category: "nitrous",
    price: 1470.63,
    inStock: true,
  },
  {
    id: "no-camaro-hardline",
    name: "Nitrous Outlet 00-10154 GM 2016 Camaro Hardline Plate System",
    brand: "Nitrous Outlet",
    partNumber: "00-10154",
    description: "GM 2016 Camaro hardline plate system.",
    category: "nitrous",
    price: 1085.99,
    inStock: true,
  },
  {
    id: "nx-coyote-godzilla",
    name: "Nitrous Express 5.0L Coyote and 7.3L Godzilla Plate System",
    brand: "Nitrous Express",
    partNumber: "NX-COY-GOD",
    description: "5.0L Coyote and 7.3L Godzilla plate system.",
    category: "nitrous",
    price: 805.22,
    inStock: true,
  },
  {
    id: "no-lsx-78mm-conv",
    name: "Nitrous Outlet GM LSX 78mm Nitrous Plate Conversion",
    brand: "Nitrous Outlet",
    partNumber: "NO-LSX-78MM",
    description: "GM LSX 78mm nitrous plate conversion.",
    category: "nitrous",
    price: 315.99,
    inStock: true,
  },
  {
    id: "nx-bottle-pressure-gauge",
    name: "Nitrous Express Electric Bottle Pressure Guage",
    brand: "Nitrous Express",
    partNumber: "NX-GAUGE",
    description: "Electric bottle pressure gauge for monitoring nitrous pressure.",
    category: "nitrous",
    price: 412.16,
    inStock: true,
  },
  {
    id: "no-326-valve-4an",
    name: "Nitrous Outlet 326 Style Bottle Valve 4AN Nipple",
    brand: "Nitrous Outlet",
    partNumber: "NO-326-4AN",
    description: "326 style bottle valve with 4AN nipple.",
    category: "nitrous",
    price: 6.99,
    inStock: true,
  },
  {
    id: "no-gto-90mm-15lb",
    name: "Nitrous Outlet 90mm Plate System, 2005-06 GTO, 15lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-GTO-90MM",
    description: "90mm plate system for 2005-06 GTO with 15lb bottle.",
    category: "nitrous",
    price: 1319.99,
    inStock: true,
  },
  {
    id: "no-90-blowdown",
    name: "Nitrous Outlet 90 Degree Blow Down Kit w/90 Degree Bulk Head Fitting",
    brand: "Nitrous Outlet",
    partNumber: "NO-90-BLOWDOWN",
    description: "90 degree blow down kit with 90 degree bulk head fitting.",
    category: "nitrous",
    price: 85.99,
    inStock: true,
  },
  {
    id: "no-lsx-magnuson-90mm",
    name: "Nitrous Outlet LSX Magnuson Supercharger 90mm Plate System, No Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-MAG-90MM",
    description: "LSX Magnuson supercharger 90mm plate system, no bottle included.",
    category: "nitrous",
    price: 1040.99,
    inStock: true,
  },
  {
    id: "no-fbody-halo-dry",
    name: "Nitrous Outlet Filter Entry HALO Dry Nitrous System, 1998-02 GM F-Body, No Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-FBODY-HALO",
    description: "Filter entry HALO dry nitrous system for 1998-02 GM F-Body, no bottle.",
    category: "nitrous",
    price: 594.99,
    inStock: true,
  },
  {
    id: "no-gm-truck-78mm",
    name: "Nitrous Outlet 78mm Plate System, 1999-04 GM Truck, 15lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-TRUCK-78MM",
    description: "78mm plate system for 1999-04 GM Truck with 15lb bottle.",
    category: "nitrous",
    price: 1298.99,
    inStock: true,
  },
  {
    id: "no-326-valve-6an",
    name: "Nitrous Outlet 326 Style Bottle Valve 6AN Nipple",
    brand: "Nitrous Outlet",
    partNumber: "NO-326-6AN",
    description: "326 style bottle valve with 6AN nipple.",
    category: "nitrous",
    price: 6.99,
    inStock: true,
  },
  {
    id: "nos-gm-90mm-wet",
    name: "NOS PLATE WET NITROUS SYSTEM - GM 90mm or 92mm 4-Bolt Drive-By-Wire",
    brand: "NOS",
    partNumber: "NOS-GM-90MM",
    description: "NOS plate wet nitrous system for GM 90mm or 92mm 4-bolt drive-by-wire.",
    category: "nitrous",
    price: 1303.95,
    compareAtPrice: 1449.95,
    inStock: true,
  },
  {
    id: "no-micro-wot",
    name: "Nitrous Outlet Micro WOT Switch",
    brand: "Nitrous Outlet",
    partNumber: "NO-WOT",
    description: "Micro WOT switch for nitrous activation.",
    category: "nitrous",
    price: 4.99,
    inStock: true,
  },
  {
    id: "no-gto-78mm-no-bottle",
    name: "Nitrous Outlet 78mm Plate System, 2004 GTO, No Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-GTO-78MM-NB",
    description: "78mm plate system for 2004 GTO, no bottle included.",
    category: "nitrous",
    price: 1078.99,
    inStock: true,
  },
  {
    id: "no-gto-hardline-78mm",
    name: "Nitrous Outlet Hardline Kit, 2004-06 GTO, 78mm",
    brand: "Nitrous Outlet",
    partNumber: "NO-GTO-HL",
    description: "Hardline kit for 2004-06 GTO, 78mm.",
    category: "nitrous",
    price: 101.99,
    inStock: true,
  },
  {
    id: "nos-ls2-wet-plate",
    name: "NOS EFI NITROUS WET PLATE - GM LS2 Plate Only Kit, 90mm 4-bolt OEM Fuel Injection Wet Plate",
    brand: "NOS",
    partNumber: "NOS-LS2-WET",
    description: "NOS EFI nitrous wet plate for GM LS2, 90mm 4-bolt OEM fuel injection.",
    category: "nitrous",
    price: 460.95,
    inStock: true,
  },
  {
    id: "no-lsx-truck-90mm",
    name: "Nitrous Outlet 90mm LSX Truck Plate System, 15lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-TRUCK-90MM",
    description: "90mm LSX truck plate system with 15lb bottle.",
    category: "nitrous",
    price: 1268.99,
    inStock: true,
  },
  {
    id: "no-gm-efi-small-dry",
    name: "Nitrous Outlet GM EFI Small Ring Dry Nitrous System, 15lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-EFI-SMALL-DRY",
    description: "GM EFI small ring dry nitrous system with 15lb bottle.",
    category: "nitrous",
    price: 924.99,
    inStock: true,
  },
  {
    id: "no-180-blowdown",
    name: "Nitrous Outlet 180 Degree Blow Down Kit w/Straight Bulk Head Fitting",
    brand: "Nitrous Outlet",
    partNumber: "NO-180-BLOWDOWN",
    description: "180 degree blow down kit with straight bulk head fitting.",
    category: "nitrous",
    price: 83.99,
    inStock: true,
  },
  {
    id: "nx-ls3-solenoid-bracket",
    name: "Nitrous Express LS3 Solenoid Bracket (Pair)",
    brand: "Nitrous Express",
    partNumber: "NX-LS3-BRACKET",
    description: "LS3 solenoid bracket pair.",
    category: "nitrous",
    price: 49.37,
    inStock: true,
  },
  {
    id: "no-gm-efi-large-dry",
    name: "Nitrous Outlet GM EFI Large Dry Distribution Ring Nitrous System, 15lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-EFI-LARGE-DRY",
    description: "GM EFI large dry distribution ring nitrous system with 15lb bottle.",
    category: "nitrous",
    price: 924.99,
    inStock: true,
  },
  {
    id: "no-gm-efi-dual-stage",
    name: "Nitrous Outlet GM EFI Dual Stage Single Nozzle Nitrous System, 10lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-EFI-DUAL",
    description: "GM EFI dual stage single nozzle nitrous system with 10lb bottle.",
    category: "nitrous",
    price: 1753.99,
    inStock: true,
  },
  {
    id: "no-dry-90mm-lsx",
    name: "Nitrous Outlet Dry 90mm LSx Plate System, No Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-DRY-90MM",
    description: "Dry 90mm LSx plate system, no bottle included.",
    category: "nitrous",
    price: 828.99,
    inStock: true,
  },
  {
    id: "nos-ls-102mm-wet",
    name: "NOS PLATE WET NITROUS SYSTEM - 1997-2012 GM LS 102mm or 105mm",
    brand: "NOS",
    partNumber: "NOS-LS-102MM",
    description: "NOS plate wet nitrous system for 1997-2012 GM LS 102mm or 105mm.",
    category: "nitrous",
    price: 1075.95,
    inStock: true,
  },
  {
    id: "no-gto-fast-92mm",
    name: "Nitrous Outlet 92mm FAST Plate System, 2004-06 GTO, 10lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-GTO-FAST",
    description: "92mm FAST plate system for 2004-06 GTO with 10lb bottle.",
    category: "nitrous",
    price: 1270.99,
    inStock: true,
  },
  {
    id: "no-corvette-z06-90mm-nb",
    name: "Nitrous Outlet 90mm Plate System, 2005-13 Corvette Z06, No Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-Z06-90MM-NB",
    description: "90mm plate system for 2005-13 Corvette Z06, no bottle included.",
    category: "nitrous",
    price: 1036.99,
    inStock: true,
  },
  {
    id: "nos-holley-lt-hiram-dry",
    name: "NOS DRY NITROUS PLATE FOR HOLLEY GEN-V LT HI-RAM EFI INTAKE MANIFOLDS - BLACK",
    brand: "NOS",
    partNumber: "NOS-HOLLEY-LT",
    description: "NOS dry nitrous plate for Holley Gen-V LT Hi-Ram EFI intake manifolds, black.",
    category: "nitrous",
    price: 609.95,
    inStock: true,
  },
  {
    id: "no-corvette-z06-90mm-10lb",
    name: "Nitrous Outlet 90mm Plate System, 2005-13 Corvette Z06, 10lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-Z06-90MM-10LB",
    description: "90mm plate system for 2005-13 Corvette Z06 with 10lb bottle.",
    category: "nitrous",
    price: 1267.99,
    inStock: true,
  },
  {
    id: "no-universal-dual-stage",
    name: "Nitrous Outlet Universal EFI Dual Stage Single Nozzle Nitrous System, 15lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-UNIV-DUAL",
    description: "Universal EFI dual stage single nozzle nitrous system with 15lb bottle.",
    category: "nitrous",
    price: 1806.99,
    inStock: true,
  },
  {
    id: "no-lsx-90mm-15lb",
    name: "Nitrous Outlet GM LSX 90mm Plate System, 15lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-LSX-90MM",
    description: "GM LSX 90mm plate system with 15lb bottle.",
    category: "nitrous",
    price: 1296.99,
    inStock: true,
  },
  {
    id: "no-corvette-92mm-nb",
    name: "Nitrous Outlet 92mm Intake Plate System, 2005-09 Corvette, No Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-CORVETTE-92MM",
    description: "92mm intake plate system for 2005-09 Corvette, no bottle included.",
    category: "nitrous",
    price: 1040.99,
    inStock: true,
  },
  {
    id: "nx-hemi-90mm-plate-only",
    name: "Nitrous Express Hemi 90mm Plate Only With Fittings",
    brand: "Nitrous Express",
    partNumber: "NX-HEMI-90MM-PO",
    description: "Hemi 90mm plate only with fittings.",
    category: "nitrous",
    price: 326.78,
    inStock: true,
  },
  {
    id: "no-camaro-solenoid-brackets",
    name: "Nitrous Outlet Solenoid Brackets, 2010-15 Camaro",
    brand: "Nitrous Outlet",
    partNumber: "NO-CAMARO-BRACKET",
    description: "Solenoid brackets for 2010-15 Camaro.",
    category: "nitrous",
    price: 49.99,
    inStock: true,
  },
  {
    id: "nx-universal-fbw-10lb",
    name: "Nitrous Express Universal Fly-By-Wire Single Nozzle System, 10lb Bottle",
    brand: "Nitrous Express",
    partNumber: "NX-UNIV-FBW",
    description: "Universal fly-by-wire single nozzle system with 10lb bottle.",
    category: "nitrous",
    price: 960.33,
    inStock: true,
  },
  // Nitrous products batch 2 (61-120)
  {
    id: "no-dual-vertical-bracket",
    name: "Nitrous Outlet Dual Vertical Billet 10lb/15lb Nitrous Bottle Bracket",
    brand: "Nitrous Outlet",
    partNumber: "NO-DUAL-VERT",
    description: "Dual vertical billet nitrous bottle bracket for 10lb/15lb bottles.",
    category: "nitrous",
    price: 759.99,
    inStock: true,
  },
  {
    id: "no-c5-bracket-pass",
    name: "Nitrous Outlet 10lb/15lb Bottle Bracket Mounting Plate, Passenger Side, 1997-04 C5 Corvette",
    brand: "Nitrous Outlet",
    partNumber: "NO-C5-PASS",
    description: "Bottle bracket mounting plate for passenger side, 1997-04 C5 Corvette.",
    category: "nitrous",
    price: 92.99,
    inStock: true,
  },
  {
    id: "no-dual-stage-90mm-conv",
    name: "Nitrous Outlet Dual Stage GM LSX 90mm Nitrous Plate Conversion",
    brand: "Nitrous Outlet",
    partNumber: "NO-DS-90MM-CONV",
    description: "Dual stage GM LSX 90mm nitrous plate conversion.",
    category: "nitrous",
    price: 340.99,
    inStock: true,
  },
  {
    id: "nos-ls1-wet-plate",
    name: "NOS EFI NITROUS WET PLATE - GM LS1 Plate Only Kit - OEM Fuel Injection Plate",
    brand: "NOS",
    partNumber: "NOS-LS1-WET",
    description: "NOS EFI nitrous wet plate for GM LS1, OEM fuel injection plate only kit.",
    category: "nitrous",
    price: 421.95,
    inStock: true,
  },
  {
    id: "no-lsx-92mm-nb",
    name: "Nitrous Outlet GM LSX 92mm Plate System, No Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-LSX-92MM-NB",
    description: "GM LSX 92mm plate system, no bottle included.",
    category: "nitrous",
    price: 1013.99,
    inStock: true,
  },
  {
    id: "no-180-blowdown-90",
    name: "Nitrous Outlet 180 Degree Blow Down Kit w/90 Degree Bulk Head Fitting",
    brand: "Nitrous Outlet",
    partNumber: "NO-180-BD-90",
    description: "180 degree blow down kit with 90 degree bulk head fitting.",
    category: "nitrous",
    price: 90.99,
    inStock: true,
  },
  {
    id: "no-dual-78mm-10lb",
    name: "Nitrous Outlet Dual Stage GM LSX 78mm Plate System, 10lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-DS-78MM-10LB",
    description: "Dual stage GM LSX 78mm plate system with 10lb bottle.",
    category: "nitrous",
    price: 2125.99,
    inStock: true,
  },
  {
    id: "no-102mm-fast-truck",
    name: "Nitrous Outlet 102mm FAST Plate System, LSX Truck, 15lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-102MM-FAST-TRUCK",
    description: "102mm FAST plate system for LSX truck with 15lb bottle.",
    category: "nitrous",
    price: 1130.99,
    inStock: true,
  },
  {
    id: "no-102mm-ctsv-10lb",
    name: "Nitrous Outlet 102mm Plate System, 2009-14 Cadillac CTS-V, 10lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-CTSV-102MM-10LB",
    description: "102mm plate system for 2009-14 Cadillac CTS-V with 10lb bottle.",
    category: "nitrous",
    price: 1252.99,
    inStock: true,
  },
  {
    id: "no-univ-dry-15lb",
    name: "Nitrous Outlet Universal Single Nozzle Dry Kit, 15lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-UNIV-DRY-15LB",
    description: "Universal single nozzle dry kit with 15lb bottle.",
    category: "nitrous",
    price: 920.99,
    inStock: true,
  },
  {
    id: "no-efi-large-dry-10lb",
    name: "Nitrous Outlet GM EFI Large Dry Distribution Ring Nitrous System, 10lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-EFI-LARGE-10LB",
    description: "GM EFI large dry distribution ring nitrous system with 10lb bottle.",
    category: "nitrous",
    price: 887.99,
    inStock: true,
  },
  {
    id: "nos-ls-90-92mm",
    name: "NOS PLATE WET NITROUS SYSTEM - GM LS 90mm or 92mm",
    brand: "NOS",
    partNumber: "NOS-LS-90-92MM",
    description: "NOS plate wet nitrous system for GM LS 90mm or 92mm.",
    category: "nitrous",
    price: 1177.95,
    inStock: true,
  },
  {
    id: "no-pump-station",
    name: "Nitrous Outlet Pump Station (Pump Only)",
    brand: "Nitrous Outlet",
    partNumber: "NO-PUMP",
    description: "Nitrous pump station, pump only.",
    category: "nitrous",
    price: 1503.99,
    inStock: true,
  },
  {
    id: "nx-efi-single-nb",
    name: "Nitrous Express GM EFI Single Nozzle System, No Bottle",
    brand: "Nitrous Express",
    partNumber: "NX-EFI-SINGLE-NB",
    description: "GM EFI single nozzle nitrous system, no bottle included.",
    category: "nitrous",
    price: 744.54,
    inStock: true,
  },
  {
    id: "no-78mm-fbody-15lb",
    name: "Nitrous Outlet 78mm Plate System, 1998-02 F-Body, 15lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-FBODY-78MM-15LB",
    description: "78mm plate system for 1998-02 F-Body with 15lb bottle.",
    category: "nitrous",
    price: 1378.99,
    inStock: true,
  },
  {
    id: "no-gm-truck-lt1-nb",
    name: "Nitrous Outlet Plate System, 2014+ GM Truck 5.3L LT1, No Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-TRUCK-LT1-NB",
    description: "Plate system for 2014+ GM Truck 5.3L LT1, no bottle included.",
    category: "nitrous",
    price: 1118.99,
    inStock: true,
  },
  {
    id: "no-fbody-bracket-plate",
    name: "Nitrous Outlet 10lb/15lb Nitrous Bottle Bracket Mounting Plate, 1993-02 F-Body",
    brand: "Nitrous Outlet",
    partNumber: "NO-FBODY-BRACKET",
    description: "Nitrous bottle bracket mounting plate for 1993-02 F-Body.",
    category: "nitrous",
    price: 169.99,
    inStock: true,
  },
  {
    id: "no-102mm-dual-nb",
    name: "Nitrous Outlet 102mm LSX Dual Stage Plate System, No Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-102MM-DUAL-NB",
    description: "102mm LSX dual stage plate system, no bottle included.",
    category: "nitrous",
    price: 1796.99,
    inStock: true,
  },
  {
    id: "nx-efi-dual-15lb",
    name: "Nitrous Express GM EFI Dual Nozzle System, 15lb Bottle",
    brand: "Nitrous Express",
    partNumber: "NX-EFI-DUAL-15LB",
    description: "GM EFI dual nozzle nitrous system with 15lb bottle.",
    category: "nitrous",
    price: 1276.40,
    inStock: true,
  },
  {
    id: "nos-sniper-ls-dry",
    name: "NOS DRY NITROUS PLATE SYSTEM FOR SNIPER EFI RACE SERIES LS INTAKE MANIFOLD - BLACK",
    brand: "NOS",
    partNumber: "NOS-SNIPER-LS",
    description: "NOS dry nitrous plate system for Sniper EFI race series LS intake manifold, black.",
    category: "nitrous",
    price: 2449.99,
    inStock: true,
  },
  {
    id: "no-univ-dual-dry-nb",
    name: "Nitrous Outlet Universal Dual Nozzle Dual Stage Dry Nitrous System, No Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-UNIV-DUAL-DRY-NB",
    description: "Universal dual nozzle dual stage dry nitrous system, no bottle.",
    category: "nitrous",
    price: 1016.99,
    inStock: true,
  },
  {
    id: "no-90mm-fast-corvette-nb",
    name: "Nitrous Outlet 90mm FAST Plate System, 1997-04 Corvette, No Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-CORVETTE-FAST-NB",
    description: "90mm FAST plate system for 1997-04 Corvette, no bottle included.",
    category: "nitrous",
    price: 1096.99,
    inStock: true,
  },
  {
    id: "nx-ls-90mm-15lb",
    name: "Nitrous Express LS 90mm Nitrous Plate System (50-400hp), 15lb Bottle",
    brand: "Nitrous Express",
    partNumber: "NX-LS-90MM-15LB",
    description: "LS 90mm nitrous plate system, 50-400hp, with 15lb bottle.",
    category: "nitrous",
    price: 1040.21,
    inStock: true,
  },
  {
    id: "no-lsx-78mm-nb",
    name: "Nitrous Outlet GM LSX 78mm Plate System, No Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-LSX-78MM-NB",
    description: "GM LSX 78mm plate system, no bottle included.",
    category: "nitrous",
    price: 1051.99,
    inStock: true,
  },
  {
    id: "no-dry-90mm-10lb",
    name: "Nitrous Outlet Dry 90mm LSx Plate System, 10lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-DRY-90MM-10LB",
    description: "Dry 90mm LSx plate system with 10lb bottle.",
    category: "nitrous",
    price: 1089.99,
    inStock: true,
  },
  {
    id: "no-efi-dual-nb",
    name: "Nitrous Outlet GM EFI Dual Stage Single Nozzle Nitrous System, No Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-EFI-DUAL-NB",
    description: "GM EFI dual stage single nozzle nitrous system, no bottle.",
    category: "nitrous",
    price: 1603.99,
    inStock: true,
  },
  {
    id: "no-gto-90mm-10lb",
    name: "Nitrous Outlet 90mm Plate System, 2005-06 GTO, 10lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-GTO-90MM-10LB",
    description: "90mm plate system for 2005-06 GTO with 10lb bottle.",
    category: "nitrous",
    price: 1281.99,
    inStock: true,
  },
  {
    id: "no-gto-92mm-fast-nb",
    name: "Nitrous Outlet 92mm FAST Plate System, 2004-06 GTO, No Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-GTO-FAST-NB",
    description: "92mm FAST plate system for 2004-06 GTO, no bottle included.",
    category: "nitrous",
    price: 1040.99,
    inStock: true,
  },
  {
    id: "nx-ls-90mm-12lb-comp",
    name: "Nitrous Express LS 90mm Nitrous Plate System (50-400hp), 12lb Composite Bottle",
    brand: "Nitrous Express",
    partNumber: "NX-LS-90MM-12LB-COMP",
    description: "LS 90mm nitrous plate system, 50-400hp, with 12lb composite bottle.",
    category: "nitrous",
    price: 1634.76,
    inStock: true,
  },
  {
    id: "nx-hemi-dp-conv",
    name: "Nitrous Express Hemi Direct Port Plate Conversion",
    brand: "Nitrous Express",
    partNumber: "NX-HEMI-DP-CONV",
    description: "Hemi direct port plate conversion kit.",
    category: "nitrous",
    price: 954.34,
    inStock: true,
  },
  {
    id: "no-c7-lt1-hardline-nb",
    name: "Nitrous Outlet Hard-line Plate System, C7 Corvette LT1, No Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-C7-LT1-HL-NB",
    description: "Hard-line plate system for C7 Corvette LT1, no bottle included.",
    category: "nitrous",
    price: 1127.99,
    inStock: true,
  },
  {
    id: "no-dual-90mm-10lb",
    name: "Nitrous Outlet Dual Stage GM LSX 90mm Plate System, 10lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-DS-90MM-10LB",
    description: "Dual stage GM LSX 90mm plate system with 10lb bottle.",
    category: "nitrous",
    price: 1851.99,
    inStock: true,
  },
  {
    id: "no-univ-efi-single-15lb",
    name: "Nitrous Outlet Universal EFI Single Nozzle Nitrous System, 15lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-UNIV-EFI-15LB",
    description: "Universal EFI single nozzle nitrous system with 15lb bottle.",
    category: "nitrous",
    price: 1167.99,
    inStock: true,
  },
  {
    id: "no-ls3-90mm-hardline",
    name: "Nitrous Outlet GM LS3 90mm Plate Hard Line Kit",
    brand: "Nitrous Outlet",
    partNumber: "NO-LS3-HL",
    description: "GM LS3 90mm plate hard line kit.",
    category: "nitrous",
    price: 101.99,
    inStock: true,
  },
  {
    id: "nx-hemi-plate-conv",
    name: "Nitrous Express Plate Conversion For Hemi Vehicles",
    brand: "Nitrous Express",
    partNumber: "NX-HEMI-CONV",
    description: "Plate conversion kit for Hemi vehicles.",
    category: "nitrous",
    price: 405.50,
    inStock: true,
  },
  {
    id: "no-ls2-90mm-hardline",
    name: "Nitrous Outlet Hardline Kit, GM LS2, 90mm",
    brand: "Nitrous Outlet",
    partNumber: "NO-LS2-HL",
    description: "Hardline kit for GM LS2, 90mm.",
    category: "nitrous",
    price: 101.99,
    inStock: true,
  },
  {
    id: "nx-efi-dual-12lb-comp",
    name: "Nitrous Express GM EFI Dual Nozzle System, 12lb Composite Bottle",
    brand: "Nitrous Express",
    partNumber: "NX-EFI-DUAL-12LB-COMP",
    description: "GM EFI dual nozzle nitrous system with 12lb composite bottle.",
    category: "nitrous",
    price: 1895.11,
    inStock: true,
  },
  {
    id: "no-trailblazer-switch",
    name: "Nitrous Outlet Trail Blazer SS Switch Panel",
    brand: "Nitrous Outlet",
    partNumber: "NO-TBSS-SWITCH",
    description: "Trail Blazer SS switch panel for nitrous control.",
    category: "nitrous",
    price: 84.99,
    inStock: true,
  },
  {
    id: "no-gm-truck-lt1-10lb",
    name: "Nitrous Outlet Plate System, 2014+ GM Truck 5.3L LT1, 10lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-TRUCK-LT1-10LB",
    description: "Plate system for 2014+ GM Truck 5.3L LT1 with 10lb bottle.",
    category: "nitrous",
    price: 1337.99,
    inStock: true,
  },
  {
    id: "no-intake-brackets-corvette",
    name: "Nitrous Outlet Intake Mounted Solenoid Brackets, 1997-10 Corvette, 2004-06 GTO/CTS-V",
    brand: "Nitrous Outlet",
    partNumber: "NO-CORVETTE-BRACKETS",
    description: "Intake mounted solenoid brackets for 1997-10 Corvette, 2004-06 GTO/CTS-V.",
    category: "nitrous",
    price: 52.99,
    inStock: true,
  },
  {
    id: "no-92mm-ls1-dual-nb",
    name: "Nitrous Outlet 92mm LS1 Dual Stage Plate System, No Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-LS1-92MM-DUAL-NB",
    description: "92mm LS1 dual stage plate system, no bottle included.",
    category: "nitrous",
    price: 1729.99,
    inStock: true,
  },
  {
    id: "no-326-bottle-nut",
    name: "Nitrous Outlet 326 Style Bottle Valve Bottle Nut",
    brand: "Nitrous Outlet",
    partNumber: "NO-326-NUT",
    description: "326 style bottle valve bottle nut.",
    category: "nitrous",
    price: 5.99,
    inStock: true,
  },
  {
    id: "no-ctsv-90mm-10lb",
    name: "Nitrous Outlet 90mm Plate System, 2009-14 Cadillac CTS-V, 10lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-CTSV-90MM-10LB",
    description: "90mm plate system for 2009-14 Cadillac CTS-V with 10lb bottle.",
    category: "nitrous",
    price: 1315.99,
    inStock: true,
  },
  {
    id: "no-lsx-dry-bracket",
    name: "Nitrous Outlet LSX Dry Solenoid Bracket",
    brand: "Nitrous Outlet",
    partNumber: "NO-LSX-DRY-BRACKET",
    description: "LSX dry solenoid bracket.",
    category: "nitrous",
    price: 50.99,
    inStock: true,
  },
  {
    id: "no-gm-truck-lt1-15lb",
    name: "Nitrous Outlet Plate System, 2014+ GM Truck 5.3L LT1, 15lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-TRUCK-LT1-15LB",
    description: "Plate system for 2014+ GM Truck 5.3L LT1 with 15lb bottle.",
    category: "nitrous",
    price: 1374.99,
    inStock: true,
  },
  {
    id: "no-accessory-pkg-4an",
    name: "Nitrous Outlet Accessory Package - High Fuel Pressure/4AN",
    brand: "Nitrous Outlet",
    partNumber: "NO-ACC-PKG-4AN",
    description: "Accessory package for high fuel pressure, 4AN fittings.",
    category: "nitrous",
    price: 742.99,
    inStock: true,
  },
  {
    id: "no-dual-90mm-15lb",
    name: "Nitrous Outlet Dual Stage GM LSX 90mm Plate System, 15lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-DS-90MM-15LB",
    description: "Dual stage GM LSX 90mm plate system with 15lb bottle.",
    category: "nitrous",
    price: 1888.99,
    inStock: true,
  },
  {
    id: "nx-proton-plus-fbw-nb",
    name: "Nitrous Express Proton Plus Fly-By-Wire Single Nozzle Nitrous System, No Bottle",
    brand: "Nitrous Express",
    partNumber: "NX-PROTON-FBW-NB",
    description: "Proton Plus fly-by-wire single nozzle nitrous system, no bottle.",
    category: "nitrous",
    price: 661.13,
    inStock: true,
  },
  {
    id: "nx-5gen-camaro-15lb",
    name: "Nitrous Express 5th Gen Camaro Single Nozzle Nitrous System (35-150hp), 15lb Bottle",
    brand: "Nitrous Express",
    partNumber: "NX-5GEN-CAMARO-15LB",
    description: "5th Gen Camaro single nozzle nitrous system, 35-150hp, with 15lb bottle.",
    category: "nitrous",
    price: 1105.46,
    inStock: true,
  },
  {
    id: "no-660-bottle-nut",
    name: "Nitrous Outlet 660 Style Bottle Valve 4AN Bottle Nut",
    brand: "Nitrous Outlet",
    partNumber: "NO-660-4AN-NUT",
    description: "660 style bottle valve 4AN bottle nut.",
    category: "nitrous",
    price: 5.99,
    inStock: true,
  },
  {
    id: "nx-proton-plus-nb",
    name: "Nitrous Express Proton Plus Single Nozzle Nitrous System, No Bottle",
    brand: "Nitrous Express",
    partNumber: "NX-PROTON-NB",
    description: "Proton Plus single nozzle nitrous system, no bottle.",
    category: "nitrous",
    price: 482.72,
    inStock: true,
  },
  {
    id: "no-single-nozzle-truck-corvette-nb",
    name: "Nitrous Outlet Single Nozzle Nitrous System, 2014+ Truck & Corvette, No Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-TRUCK-CORVETTE-SN-NB",
    description: "Single nozzle nitrous system for 2014+ Truck & Corvette, no bottle.",
    category: "nitrous",
    price: 892.99,
    inStock: true,
  },
  {
    id: "no-gto-78mm-15lb",
    name: "Nitrous Outlet 78mm Plate System, 2004 GTO, 15lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-GTO-78MM-15LB",
    description: "78mm plate system for 2004 GTO with 15lb bottle.",
    category: "nitrous",
    price: 1340.99,
    inStock: true,
  },
  {
    id: "nx-5gen-camaro-10lb",
    name: "Nitrous Express 5th Gen Camaro Single Nozzle Nitrous System (35-150hp), 10lb Bottle",
    brand: "Nitrous Express",
    partNumber: "NX-5GEN-CAMARO-10LB",
    description: "5th Gen Camaro single nozzle nitrous system, 35-150hp, with 10lb bottle.",
    category: "nitrous",
    price: 1010.81,
    inStock: true,
  },
  {
    id: "no-dual-78mm-conv",
    name: "Nitrous Outlet Dual Stage GM LSX 78mm Nitrous Plate Conversion",
    brand: "Nitrous Outlet",
    partNumber: "NO-DS-78MM-CONV",
    description: "Dual stage GM LSX 78mm nitrous plate conversion.",
    category: "nitrous",
    price: 401.99,
    inStock: true,
  },
  {
    id: "no-92mm-ls1-dual-10lb",
    name: "Nitrous Outlet 92mm LS1 Dual Stage Plate System, 10lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-LS1-92MM-DUAL-10LB",
    description: "92mm LS1 dual stage plate system with 10lb bottle.",
    category: "nitrous",
    price: 1860.99,
    inStock: true,
  },
  {
    id: "no-dual-78mm-nb",
    name: "Nitrous Outlet Dual Stage GM LSX 78mm Plate System, No Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-DS-78MM-NB",
    description: "Dual stage GM LSX 78mm plate system, no bottle included.",
    category: "nitrous",
    price: 2037.99,
    inStock: true,
  },
  {
    id: "no-dual-78mm-15lb",
    name: "Nitrous Outlet Dual Stage GM LSX 78mm Plate System, 15lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-DS-78MM-15LB",
    description: "Dual stage GM LSX 78mm plate system with 15lb bottle.",
    category: "nitrous",
    price: 2162.99,
    inStock: true,
  },
  {
    id: "no-lsx-90mm-10lb",
    name: "Nitrous Outlet GM LSX 90mm Plate System, 10lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-LSX-90MM-10LB",
    description: "GM LSX 90mm plate system with 10lb bottle.",
    category: "nitrous",
    price: 1258.99,
    inStock: true,
  },
  {
    id: "no-ctsv-90mm-15lb",
    name: "Nitrous Outlet 90mm Plate System, 2009-14 Cadillac CTS-V, 15lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-CTSV-90MM-15LB",
    description: "90mm plate system for 2009-14 Cadillac CTS-V with 15lb bottle.",
    category: "nitrous",
    price: 1353.99,
    inStock: true,
  },
  // Nitrous products 121-180
  {
    id: "no-ss-bottle-bracket",
    name: "Nitrous Outlet 10lb/15lb Stainless Steel Nitrous Bottle Brackets",
    brand: "Nitrous Outlet",
    partNumber: "NO-SS-BRACKET",
    description: "Stainless steel nitrous bottle brackets for 10lb/15lb bottles.",
    category: "nitrous",
    price: 36.99,
    inStock: true,
  },
  {
    id: "no-mag-90mm-10lb",
    name: "Nitrous Outlet LSX Magnuson Supercharger 90mm Plate System, 10lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-MAG-90MM-10LB",
    description: "LSX Magnuson supercharger 90mm plate system with 10lb bottle.",
    category: "nitrous",
    price: 1270.99,
    inStock: true,
  },
  {
    id: "no-gto-fast-90mm-nb",
    name: "Nitrous Outlet 90mm FAST Plate System, 2004-06 GTO, No Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-GTO-FAST-90MM-NB",
    description: "90mm FAST plate system for 2004-06 GTO, no bottle included.",
    category: "nitrous",
    price: 1053.99,
    inStock: true,
  },
  {
    id: "no-fbody-solenoid-bracket",
    name: "Nitrous Outlet Intake Mounted Solenoid Brackets, 1998-02 GM F-Body",
    brand: "Nitrous Outlet",
    partNumber: "NO-FBODY-SOL-BRKT",
    description: "Intake mounted solenoid brackets for 1998-02 GM F-Body.",
    category: "nitrous",
    price: 94.99,
    inStock: true,
  },
  {
    id: "no-truck-dash-panel",
    name: "Nitrous Outlet In Dash Switch Panel, 1999-02 GM Truck",
    brand: "Nitrous Outlet",
    partNumber: "NO-TRUCK-DASH",
    description: "In dash switch panel for 1999-02 GM Truck.",
    category: "nitrous",
    price: 84.99,
    inStock: true,
  },
  {
    id: "no-gto-92mm-fast-15lb",
    name: "Nitrous Outlet 92mm FAST Plate System, 2004-06 GTO, 15lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-GTO-92MM-FAST-15LB",
    description: "92mm FAST plate system for 2004-06 GTO with 15lb bottle.",
    category: "nitrous",
    price: 1308.99,
    inStock: true,
  },
  {
    id: "no-truck-90mm-bracket",
    name: "Nitrous Outlet 90mm Solenoid Bracket, 1998-07 GM Truck",
    brand: "Nitrous Outlet",
    partNumber: "NO-TRUCK-90MM-BRKT",
    description: "90mm solenoid bracket for 1998-07 GM Truck.",
    category: "nitrous",
    price: 59.99,
    inStock: true,
  },
  {
    id: "no-z06-hardline-90mm",
    name: "Nitrous Outlet Hardline Kit, 2006-13 Corvette Z06, 90mm",
    brand: "Nitrous Outlet",
    partNumber: "NO-Z06-HL-90MM",
    description: "Hardline kit for 2006-13 Corvette Z06, 90mm.",
    category: "nitrous",
    price: 89.99,
    inStock: true,
  },
  {
    id: "holley-nos-mustang-wet",
    name: "HOLLEY NOS PLATE WET NITROUS SYSTEM - 2018-2021 Ford Mustang w/ 5.0L Coyote V8 Engine",
    brand: "Holley",
    partNumber: "NOS-MUSTANG-WET",
    description: "NOS plate wet nitrous system for 2018-2021 Ford Mustang with 5.0L Coyote V8.",
    category: "nitrous",
    price: 1349.95,
    inStock: true,
  },
  {
    id: "no-heated-bottle-bracket",
    name: "Nitrous Outlet Heated 10lb/15lb Nitrous Bottle Bracket",
    brand: "Nitrous Outlet",
    partNumber: "NO-HEATED-BRKT",
    description: "Heated nitrous bottle bracket for 10lb/15lb bottles.",
    category: "nitrous",
    price: 262.99,
    inStock: true,
  },
  {
    id: "no-univ-dual-nozzle-nb",
    name: "Nitrous Outlet Universal EFI Dual Nozzle Nitrous System, No Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-UNIV-DUAL-NB",
    description: "Universal EFI dual nozzle nitrous system, no bottle included.",
    category: "nitrous",
    price: 1027.99,
    inStock: true,
  },
  {
    id: "no-pressure-relief-disc",
    name: "Nitrous Outlet Pressure Relief Disc",
    brand: "Nitrous Outlet",
    partNumber: "NO-RELIEF-DISC",
    description: "Pressure relief disc for nitrous systems.",
    category: "nitrous",
    price: 11.99,
    inStock: true,
  },
  {
    id: "no-lsx-90mm-conv",
    name: "Nitrous Outlet GM LSX 90mm Nitrous Plate Conversion",
    brand: "Nitrous Outlet",
    partNumber: "NO-LSX-90MM-CONV",
    description: "GM LSX 90mm nitrous plate conversion kit.",
    category: "nitrous",
    price: 315.99,
    inStock: true,
  },
  {
    id: "no-zl1-hardline-10lb",
    name: "Nitrous Outlet Hardline Plate System, 2012+ Camaro ZL1, 10lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-ZL1-HL-10LB",
    description: "Hardline plate system for 2012+ Camaro ZL1 with 10lb bottle.",
    category: "nitrous",
    price: 1283.99,
    inStock: true,
  },
  {
    id: "no-102mm-fast-hardline-nb",
    name: "Nitrous Outlet 102mm FAST Intake Hard-Lined Plate System, No Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-102MM-FAST-HL-NB",
    description: "102mm FAST intake hard-lined plate system, no bottle included.",
    category: "nitrous",
    price: 1011.99,
    inStock: true,
  },
  {
    id: "nx-gm-efi-sn-12lb-comp",
    name: "Nitrous Express GM EFI Single Nozzle System, 12lb Bottle Composite",
    brand: "Nitrous Express",
    partNumber: "NX-GM-EFI-SN-12LB-COMP",
    description: "GM EFI single nozzle system with 12lb composite bottle.",
    category: "nitrous",
    price: 1627.90,
    inStock: true,
  },
  {
    id: "nx-genx-heater-pkg",
    name: "Nitrous Express Gen-X Nitrous Bottle Heater Accessory Package for EFI System",
    brand: "Nitrous Express",
    partNumber: "NX-GENX-HEATER",
    description: "Gen-X nitrous bottle heater accessory package for EFI systems.",
    category: "nitrous",
    price: 506.92,
    inStock: true,
  },
  {
    id: "no-lsx-90mm-nb",
    name: "Nitrous Outlet GM LSX 90mm Plate System, No Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-LSX-90MM-NB",
    description: "GM LSX 90mm plate system, no bottle included.",
    category: "nitrous",
    price: 1026.99,
    inStock: true,
  },
  {
    id: "no-dry-92mm-15lb",
    name: "Nitrous Outlet Dry 92mm LSx Plate System, 15lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-DRY-92MM-15LB",
    description: "Dry 92mm LSx plate system with 15lb bottle.",
    category: "nitrous",
    price: 1115.99,
    inStock: true,
  },
  {
    id: "no-lsx-78mm-15lb",
    name: "Nitrous Outlet GM LSX 78mm Plate System, 15lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-LSX-78MM-15LB",
    description: "GM LSX 78mm plate system with 15lb bottle.",
    category: "nitrous",
    price: 1317.99,
    inStock: true,
  },
  {
    id: "no-zl1-mag-90mm-conv",
    name: "Nitrous Outlet 90mm ZL1 Magnuson Nitrous Plate Conversion",
    brand: "Nitrous Outlet",
    partNumber: "NO-ZL1-MAG-90MM",
    description: "90mm ZL1 Magnuson nitrous plate conversion kit.",
    category: "nitrous",
    price: 315.99,
    inStock: true,
  },
  {
    id: "nx-gm-efi-dual-nb",
    name: "Nitrous Express GM EFI Dual Nozzle System, No Bottle",
    brand: "Nitrous Express",
    partNumber: "NX-GM-EFI-DUAL-NB",
    description: "GM EFI dual nozzle system, no bottle included.",
    category: "nitrous",
    price: 985.24,
    inStock: true,
  },
  {
    id: "no-lsx-ds-solenoid-brkt",
    name: "Nitrous Outlet LSX Driver Side All-In-One Solenoid Bracket",
    brand: "Nitrous Outlet",
    partNumber: "NO-LSX-DS-BRKT",
    description: "LSX driver side all-in-one solenoid bracket.",
    category: "nitrous",
    price: 50.99,
    inStock: true,
  },
  {
    id: "nx-efi-plate-conv-102mm",
    name: "Nitrous Express EFI PLATE CONVERSION, GM LS 102MM",
    brand: "Nitrous Express",
    partNumber: "NX-EFI-CONV-102MM",
    description: "EFI plate conversion for GM LS 102mm.",
    category: "nitrous",
    price: 405.50,
    inStock: true,
  },
  {
    id: "nx-gm-efi-dual-jet-pack",
    name: "Nitrous Express GM EFI Dual Nozzle Jet Pack",
    brand: "Nitrous Express",
    partNumber: "NX-DUAL-JET-PACK",
    description: "GM EFI dual nozzle jet pack.",
    category: "nitrous",
    price: 118.28,
    inStock: true,
  },
  {
    id: "nx-proton-plus-sn-12lb-comp",
    name: "Nitrous Express Proton Plus Single Nozzle Nitrous System, 12lb Composite Bottle",
    brand: "Nitrous Express",
    partNumber: "NX-PROTON-12LB-COMP",
    description: "Proton Plus single nozzle nitrous system with 12lb composite bottle.",
    category: "nitrous",
    price: 1434.60,
    inStock: true,
  },
  {
    id: "holley-nos-coyote-wet-plate",
    name: "HOLLEY NOS EFI NITROUS WET PLATE 2011-2021 Ford 5.0L V8 Coyote Engine",
    brand: "Holley",
    partNumber: "NOS-COYOTE-WET",
    description: "NOS EFI nitrous wet plate for 2011-2021 Ford 5.0L V8 Coyote engine.",
    category: "nitrous",
    price: 341.95,
    inStock: true,
  },
  {
    id: "no-univ-dual-dry-15lb",
    name: "Nitrous Outlet Universal Dual Nozzle Dual Stage Dry Nitrous System, 15lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-UNIV-DUAL-DRY-15LB",
    description: "Universal dual nozzle dual stage dry nitrous system with 15lb bottle.",
    category: "nitrous",
    price: 1287.99,
    inStock: true,
  },
  {
    id: "nx-gm-efi-dual-5lb",
    name: "Nitrous Express GM EFI Dual Nozzle System, 5lb Bottle",
    brand: "Nitrous Express",
    partNumber: "NX-GM-EFI-DUAL-5LB",
    description: "GM EFI dual nozzle system with 5lb bottle.",
    category: "nitrous",
    price: 1107.42,
    inStock: true,
  },
  {
    id: "no-78mm-hardline-truck",
    name: "Nitrous Outlet 78mm Plate Hard Line Kit, 1999-07 GM Classic Truck",
    brand: "Nitrous Outlet",
    partNumber: "NO-78MM-HL-TRUCK",
    description: "78mm plate hard line kit for 1999-07 GM Classic Truck.",
    category: "nitrous",
    price: 48.99,
    inStock: true,
  },
  {
    id: "no-corvette-aio-bracket",
    name: "Nitrous Outlet All-In-One Solenoid Bracket, 2005-08 Corvette",
    brand: "Nitrous Outlet",
    partNumber: "NO-CORVETTE-AIO",
    description: "All-in-one solenoid bracket for 2005-08 Corvette.",
    category: "nitrous",
    price: 81.99,
    inStock: true,
  },
  {
    id: "nx-camaro-dash-panel",
    name: "Nitrous Express Camaro Custom In-Dash Switch Panel",
    brand: "Nitrous Express",
    partNumber: "NX-CAMARO-DASH",
    description: "Custom in-dash switch panel for Camaro.",
    category: "nitrous",
    price: 72.79,
    inStock: true,
  },
  {
    id: "nos-sniper-fab-dry-plate",
    name: "NOS DRY NITROUS PLATE FOR SNIPER EFI FABRICATED RACE SERIES LS INTAKE MANIFOLDS-BLACK",
    brand: "NOS",
    partNumber: "NOS-SNIPER-FAB-DRY",
    description: "NOS dry nitrous plate for Sniper EFI fabricated race series LS intake manifolds, black.",
    category: "nitrous",
    price: 609.95,
    inStock: true,
  },
  {
    id: "no-univ-efi-sn-nb",
    name: "Nitrous Outlet Universal EFI Single Nozzle Nitrous System, No Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-UNIV-EFI-SN-NB",
    description: "Universal EFI single nozzle nitrous system, no bottle included.",
    category: "nitrous",
    price: 875.99,
    inStock: true,
  },
  {
    id: "nx-hemi-85mm-plate",
    name: "Nitrous Express Hemi 85mm Plate Only With Fittings",
    brand: "Nitrous Express",
    partNumber: "NX-HEMI-85MM-PO",
    description: "Hemi 85mm plate only with fittings.",
    category: "nitrous",
    price: 326.78,
    inStock: true,
  },
  {
    id: "no-15lb-bottle",
    name: "Nitrous Outlet 15lb Nitrous Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-15LB-BOTTLE",
    description: "15lb nitrous bottle.",
    category: "nitrous",
    price: 374.99,
    inStock: true,
  },
  {
    id: "nos-sniper-race-dry-sys",
    name: "NOS DRY NITROUS PLATE SYSTEM FOR SNIPER EFI RACE SERIES LS INTAKE MANIFOLD - BLACK",
    brand: "NOS",
    partNumber: "NOS-SNIPER-RACE-DRY",
    description: "NOS dry nitrous plate system for Sniper EFI race series LS intake manifold, black.",
    category: "nitrous",
    price: 1579.99,
    inStock: true,
  },
  {
    id: "no-g8-90mm-15lb",
    name: "Nitrous Outlet 90mm Plate System, 2008-09 G8 GT/GXP, 15lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-G8-90MM-15LB",
    description: "90mm plate system for 2008-09 G8 GT/GXP with 15lb bottle.",
    category: "nitrous",
    price: 1290.99,
    inStock: true,
  },
  {
    id: "no-zl1-hardline-sys",
    name: "Nitrous Outlet 2012+ Camaro ZL1 Hardline Plate System",
    brand: "Nitrous Outlet",
    partNumber: "NO-ZL1-HL-SYS",
    description: "Hardline plate system for 2012+ Camaro ZL1.",
    category: "nitrous",
    price: 1055.99,
    inStock: true,
  },
  {
    id: "no-gm-efi-dual-nb",
    name: "Nitrous Outlet GM EFI Dual Nozzle Nitrous System, No Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-GM-EFI-DUAL-NB",
    description: "GM EFI dual nozzle nitrous system, no bottle included.",
    category: "nitrous",
    price: 987.99,
    inStock: true,
  },
  {
    id: "nx-proton-plus-fbw-5lb",
    name: "Nitrous Express Proton Plus Fly-By-Wire Single Nozzle Nitrous System, 5lb Bottle",
    brand: "Nitrous Express",
    partNumber: "NX-PROTON-FBW-5LB",
    description: "Proton Plus fly-by-wire single nozzle nitrous system with 5lb bottle.",
    category: "nitrous",
    price: 696.81,
    inStock: true,
  },
  {
    id: "no-truck-tbss-90mm-15lb",
    name: "Nitrous Outlet 90mm Plate System, 2007-13 GM Truck/Trailblazer SS, 15lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-TBSS-90MM-15LB",
    description: "90mm plate system for 2007-13 GM Truck/Trailblazer SS with 15lb bottle.",
    category: "nitrous",
    price: 1255.99,
    inStock: true,
  },
  {
    id: "no-sn-2014-truck-10lb",
    name: "Nitrous Outlet Single Nozzle Nitrous System, 2014+ Truck & Corvette, 10lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-SN-2014-10LB",
    description: "Single nozzle nitrous system for 2014+ Truck & Corvette with 10lb bottle.",
    category: "nitrous",
    price: 1143.99,
    inStock: true,
  },
  {
    id: "no-univ-solenoid-brkt",
    name: "Nitrous Outlet Universal Solenoid Bracket w/Mounting Screws",
    brand: "Nitrous Outlet",
    partNumber: "NO-UNIV-SOL-BRKT",
    description: "Universal solenoid bracket with mounting screws.",
    category: "nitrous",
    price: 9.99,
    inStock: true,
  },
  {
    id: "no-univ-dual-dry-single-nb",
    name: "Nitrous Outlet Universal Dual Nozzle Dry Nitrous System, No Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-UNIV-DUAL-DRY-NB",
    description: "Universal dual nozzle dry nitrous system, no bottle included.",
    category: "nitrous",
    price: 636.99,
    inStock: true,
  },
  {
    id: "no-102mm-fast-truck-nb",
    name: "Nitrous Outlet 102mm FAST Plate System, LSX Truck, No Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-102MM-FAST-TRUCK-NB",
    description: "102mm FAST plate system for LSX Truck, no bottle included.",
    category: "nitrous",
    price: 1065.99,
    inStock: true,
  },
  {
    id: "no-x-series-accessory",
    name: "X-Series Accessory Package - High Fuel Pressure/4AN/6AN",
    brand: "Nitrous Outlet",
    partNumber: "NO-X-ACC",
    description: "X-Series accessory package for high fuel pressure, 4AN/6AN.",
    category: "nitrous",
    price: 480.99,
    inStock: true,
  },
  {
    id: "no-camaro-hardline-90mm",
    name: "Nitrous Outlet Hardline Kit, 2010-15 Camaro, 90mm",
    brand: "Nitrous Outlet",
    partNumber: "NO-CAMARO-HL-90MM",
    description: "Hardline kit for 2010-15 Camaro, 90mm.",
    category: "nitrous",
    price: 101.99,
    inStock: true,
  },
  {
    id: "no-660-6an-bottle-nut",
    name: "Nitrous Outlet 660 Style Bottle Valve 6AN Bottle Nut",
    brand: "Nitrous Outlet",
    partNumber: "NO-660-6AN-NUT",
    description: "660 style bottle valve 6AN bottle nut.",
    category: "nitrous",
    price: 5.99,
    inStock: true,
  },
  {
    id: "no-gm-efi-dual-stage-15lb",
    name: "Nitrous Outlet GM EFI Dual Stage Single Nozzle Nitrous System, 15lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-GM-EFI-DS-15LB",
    description: "GM EFI dual stage single nozzle nitrous system with 15lb bottle.",
    category: "nitrous",
    price: 1791.99,
    inStock: true,
  },
  {
    id: "no-fbody-hardline-78mm",
    name: "Nitrous Outlet Hardline Kit, 1998-02 F-Body, 78mm",
    brand: "Nitrous Outlet",
    partNumber: "NO-FBODY-HL-78MM",
    description: "Hardline kit for 1998-02 F-Body, 78mm.",
    category: "nitrous",
    price: 101.99,
    inStock: true,
  },
  {
    id: "no-gto-ds-aio-bracket",
    name: "Nitrous Outlet Driver Side All-In-One Solenoid Bracket, 2004-06 GTO",
    brand: "Nitrous Outlet",
    partNumber: "NO-GTO-DS-AIO",
    description: "Driver side all-in-one solenoid bracket for 2004-06 GTO.",
    category: "nitrous",
    price: 58.99,
    inStock: true,
  },
  {
    id: "nx-hd-auto-heater",
    name: "Nitrous Express Heavy Duty Fully-Automatic Bottle Heater",
    brand: "Nitrous Express",
    partNumber: "NX-HD-AUTO-HEATER",
    description: "Heavy duty fully-automatic bottle heater.",
    category: "nitrous",
    price: 306.03,
    inStock: true,
  },
  {
    id: "no-dual-stage-lsx-90mm-nb",
    name: "Nitrous Outlet Dual Stage GM LSX 90mm Plate System, No Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-DS-LSX-90MM-NB",
    description: "Dual stage GM LSX 90mm plate system, no bottle included.",
    category: "nitrous",
    price: 1718.99,
    inStock: true,
  },
  {
    id: "no-gm-efi-dual-15lb",
    name: "Nitrous Outlet GM EFI Dual Nozzle Nitrous System, 15lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-GM-EFI-DUAL-15LB",
    description: "GM EFI dual nozzle nitrous system with 15lb bottle.",
    category: "nitrous",
    price: 1263.99,
    inStock: true,
  },
  {
    id: "no-corvette-aio-catch-brkt",
    name: "Nitrous Outlet All-In-One Solenoid Bracket & Catch Can Mount Bracket, 2005-08 Corvette",
    brand: "Nitrous Outlet",
    partNumber: "NO-CORVETTE-AIO-CATCH",
    description: "All-in-one solenoid bracket and catch can mount bracket for 2005-08 Corvette.",
    category: "nitrous",
    price: 71.99,
    inStock: true,
  },
  {
    id: "no-g8-90mm-nb",
    name: "Nitrous Outlet 90mm Plate System, 2008-09 G8 GT/GXP, No Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-G8-90MM-NB",
    description: "90mm plate system for 2008-09 G8 GT/GXP, no bottle included.",
    category: "nitrous",
    price: 1019.99,
    inStock: true,
  },
  {
    id: "no-digital-scale",
    name: "Nitrous Outlet Digital Nitrous Scale",
    brand: "Nitrous Outlet",
    partNumber: "NO-SCALE",
    description: "Digital nitrous scale for bottle monitoring.",
    category: "nitrous",
    price: 87.99,
    inStock: true,
  },
  {
    id: "no-102mm-fast-camaro-nb",
    name: "Nitrous Outlet 102mm FAST Intake Plate System, 2010-15 Camaro, No Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-102MM-FAST-CAMARO-NB",
    description: "102mm FAST intake plate system for 2010-15 Camaro, no bottle included.",
    category: "nitrous",
    price: 1099.99,
    inStock: true,
  },
  {
    id: "nx-5th-gen-camaro-plate-5lb",
    name: "Nitrous Express 5th Gen Camaro Plate System, 5lb Bottle",
    brand: "Nitrous Express",
    partNumber: "NX-5TH-CAMARO-5LB",
    description: "5th Gen Camaro plate system with 5lb bottle.",
    category: "nitrous",
    price: 1107.42,
    inStock: true,
  },
  // Nitrous products 181-240
  {
    id: "no-90mm-ctsv-nb-2",
    name: "Nitrous Outlet 90mm Plate System, 2009-14 Cadillac CTS-V, No Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-CTSV-90MM-NB2",
    description: "90mm plate system for 2009-14 Cadillac CTS-V, no bottle included.",
    category: "nitrous",
    price: 1093.99,
    inStock: true,
  },
  {
    id: "nx-univ-fbw-5lb",
    name: "Nitrous Express Universal Fly-By-Wire Single Nozzle System, 5lb Bottle",
    brand: "Nitrous Express",
    partNumber: "NX-UNIV-FBW-5LB",
    description: "Universal fly-by-wire single nozzle system with 5lb bottle.",
    category: "nitrous",
    price: 947.72,
    inStock: true,
  },
  {
    id: "nx-univ-fbw-nb",
    name: "Nitrous Express Universal Fly-By-Wire Single Nozzle System, No Bottle",
    brand: "Nitrous Express",
    partNumber: "NX-UNIV-FBW-NB",
    description: "Universal fly-by-wire single nozzle system, no bottle included.",
    category: "nitrous",
    price: 830.36,
    inStock: true,
  },
  {
    id: "nos-hemi-57-61-wet",
    name: "NOS 2009-2020 HEMI 5.7L/ 6.1L WET PLATE NITROUS SYSTEM",
    brand: "NOS",
    partNumber: "NOS-HEMI-57-61",
    description: "NOS wet plate nitrous system for 2009-2020 HEMI 5.7L/6.1L engines.",
    category: "nitrous",
    price: 1229.95,
    inStock: true,
  },
  {
    id: "nos-coyote-fogger",
    name: "NOS SINGLE FOGGER WET NITROUS SYSTEM 2011-2021 5.0L V8 Coyote Engine",
    brand: "NOS",
    partNumber: "NOS-COYOTE-FOG",
    description: "NOS single fogger wet nitrous system for 2011-2021 5.0L V8 Coyote engine.",
    category: "nitrous",
    price: 921.95,
    inStock: true,
  },
  {
    id: "no-univ-efi-dual-10lb",
    name: "Nitrous Outlet Universal EFI Dual Stage Single Nozzle Nitrous System, 10lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-UNIV-DUAL-10LB",
    description: "Universal EFI dual stage single nozzle nitrous system with 10lb bottle.",
    category: "nitrous",
    price: 1768.99,
    inStock: true,
  },
  {
    id: "nx-gm-efi-sn-15lb",
    name: "Nitrous Express GM EFI Single Nozzle System, 15lb Bottle",
    brand: "Nitrous Express",
    partNumber: "NX-GM-EFI-SN-15LB",
    description: "GM EFI single nozzle system with 15lb bottle.",
    category: "nitrous",
    price: 969.17,
    inStock: true,
  },
  {
    id: "nx-coy-god-plate-conv",
    name: "Nitrous Express 5.0L Coyote and 7.3L Godzilla Plate Conversion (With Integrated Solenoids)",
    brand: "Nitrous Express",
    partNumber: "NX-COY-GOD-CONV",
    description: "5.0L Coyote and 7.3L Godzilla plate conversion with integrated solenoids.",
    category: "nitrous",
    price: 635.78,
    inStock: true,
  },
  {
    id: "no-bottle-blanket-12-15",
    name: "Nitrous Outlet 12lb/15lb Nitrous Bottle Blanket",
    brand: "Nitrous Outlet",
    partNumber: "NO-BLANKET-12-15",
    description: "Nitrous bottle blanket for 12lb/15lb bottles.",
    category: "nitrous",
    price: 95.99,
    inStock: true,
  },
  {
    id: "no-ls9-blower-15lb",
    name: "Nitrous Outlet LS9 Blower Plate System, 15lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-LS9-BLOWER",
    description: "LS9 blower plate system with 15lb bottle.",
    category: "nitrous",
    price: 2449.99,
    inStock: true,
  },
  {
    id: "no-90mm-fast-corvette-10lb",
    name: "Nitrous Outlet 90mm FAST Plate System, 1997-04 Corvette, 10lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-CORVETTE-FAST-10LB",
    description: "90mm FAST plate system for 1997-04 Corvette with 10lb bottle.",
    category: "nitrous",
    price: 1319.99,
    inStock: true,
  },
  {
    id: "no-102mm-ctsv-nb",
    name: "Nitrous Outlet 102mm Plate System, 2009-14 Cadillac CTS-V, No Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-CTSV-102MM-NB",
    description: "102mm plate system for 2009-14 Cadillac CTS-V, no bottle included.",
    category: "nitrous",
    price: 1018.99,
    inStock: true,
  },
  {
    id: "no-efi-lg-dry-nb",
    name: "Nitrous Outlet GM EFI Large Dry Distribution Ring Nitrous System, No Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-EFI-LARGE-DRY-NB",
    description: "GM EFI large dry distribution ring nitrous system, no bottle included.",
    category: "nitrous",
    price: 593.99,
    inStock: true,
  },
  {
    id: "nx-gm-efi-sn-5lb",
    name: "Nitrous Express GM EFI Single Nozzle System, 5lb Bottle",
    brand: "Nitrous Express",
    partNumber: "NX-GM-EFI-SN-5LB",
    description: "GM EFI single nozzle system with 5lb bottle.",
    category: "nitrous",
    price: 861.90,
    inStock: true,
  },
  {
    id: "no-smokers-panel-gto",
    name: "Nitrous Outlet Smokers Package Switch Panel, 2004-06 GTO",
    brand: "Nitrous Outlet",
    partNumber: "NO-SMOKERS-GTO",
    description: "Smokers package switch panel for 2004-06 GTO.",
    category: "nitrous",
    price: 80.99,
    inStock: true,
  },
  {
    id: "nx-ls-lt-90mm-plate-only",
    name: "Nitrous Express LS/LT 90MM PLATE ONLY",
    brand: "Nitrous Express",
    partNumber: "NX-LS-LT-90MM-PO",
    description: "LS/LT 90mm nitrous plate only.",
    category: "nitrous",
    price: 301.97,
    inStock: true,
  },
  {
    id: "nx-90mm-4bolt-plate-only",
    name: "Nitrous Express 90MM 4 BOLT LS NITROUS PLATE ONLY",
    brand: "Nitrous Express",
    partNumber: "NX-90MM-4BOLT-PO",
    description: "90mm 4 bolt LS nitrous plate only.",
    category: "nitrous",
    price: 326.78,
    inStock: true,
  },
  {
    id: "no-efi-sm-dry-nb",
    name: "Nitrous Outlet GM EFI Small Ring Dry Nitrous System, No Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-EFI-SMALL-DRY-NB",
    description: "GM EFI small ring dry nitrous system, no bottle included.",
    category: "nitrous",
    price: 592.99,
    inStock: true,
  },
  {
    id: "nx-proton-fbw-12lb-comp",
    name: "Nitrous Express Proton Plus Fly-By-Wire Single Nozzle Nitrous System, 12lb Composite Bottle",
    brand: "Nitrous Express",
    partNumber: "NX-PROTON-FBW-12LB",
    description: "Proton Plus fly-by-wire single nozzle nitrous system with 12lb composite bottle.",
    category: "nitrous",
    price: 1565.16,
    inStock: true,
  },
  {
    id: "no-90mm-fast-fbody-15lb",
    name: "Nitrous Outlet 90mm FAST Plate System, 1998-02 F-Body, 15lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-FBODY-FAST-15LB",
    description: "90mm FAST plate system for 1998-02 F-Body with 15lb bottle.",
    category: "nitrous",
    price: 1356.99,
    inStock: true,
  },
  {
    id: "no-zl1-hardline-15lb",
    name: "Nitrous Outlet Hardline Plate System, 2012+ Camaro ZL1, 15lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-ZL1-HL-15LB",
    description: "Hardline plate system for 2012+ Camaro ZL1 with 15lb bottle.",
    category: "nitrous",
    price: 1320.99,
    inStock: true,
  },
  {
    id: "no-90mm-lsx-truck-nb",
    name: "Nitrous Outlet 90mm LSX Truck Plate System, No Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-TRUCK-90MM-NB",
    description: "90mm LSX truck plate system, no bottle included.",
    category: "nitrous",
    price: 993.99,
    inStock: true,
  },
  {
    id: "no-bracket-c6-z06-ls7",
    name: "Nitrous Outlet Intake Mounted Solenoid Brackets, Corvette C6 Z06/LS7",
    brand: "Nitrous Outlet",
    partNumber: "NO-BRACKET-C6-Z06",
    description: "Intake mounted solenoid brackets for Corvette C6 Z06/LS7.",
    category: "nitrous",
    price: 48.99,
    inStock: true,
  },
  {
    id: "no-90-blowdown-straight",
    name: "Nitrous Outlet 90 Degree Blow Down Kit w/Straight Bulk Head Fitting",
    brand: "Nitrous Outlet",
    partNumber: "NO-90-BD-STR",
    description: "90 degree blow down kit with straight bulk head fitting.",
    category: "nitrous",
    price: 78.99,
    inStock: true,
  },
  {
    id: "no-pressure-relief-valve",
    name: "Nitrous Outlet Pressure Relief Valve",
    brand: "Nitrous Outlet",
    partNumber: "NO-RELIEF-VALVE",
    description: "Nitrous pressure relief valve.",
    category: "nitrous",
    price: 37.99,
    inStock: true,
  },
  {
    id: "no-univ-dual-dry-single-15lb",
    name: "Nitrous Outlet Universal Dual Nozzle Dry Nitrous System, 15lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-UNIV-DUAL-DRY-SINGLE-15LB",
    description: "Universal dual nozzle dry nitrous system with 15lb bottle.",
    category: "nitrous",
    price: 962.99,
    inStock: true,
  },
  {
    id: "no-racelight-15lb-horiz",
    name: "Nitrous Outlet Race-Light Single 15lb Bottle Bracket - Horizontal",
    brand: "Nitrous Outlet",
    partNumber: "NO-RACELIGHT-15LB",
    description: "Race-Light single 15lb bottle bracket, horizontal mount.",
    category: "nitrous",
    price: 292.99,
    inStock: true,
  },
  {
    id: "nx-3bolt-ls-plate-only",
    name: "Nitrous Express 3-Bolt LS Nitrous Plate Only",
    brand: "Nitrous Express",
    partNumber: "NX-3BOLT-LS-PO",
    description: "3-bolt LS nitrous plate only.",
    category: "nitrous",
    price: 326.78,
    inStock: true,
  },
  {
    id: "no-efi-sm-dry-10lb",
    name: "Nitrous Outlet GM EFI Small Ring Dry Nitrous System, 10lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-EFI-SMALL-DRY-10LB",
    description: "GM EFI small ring dry nitrous system with 10lb bottle.",
    category: "nitrous",
    price: 886.99,
    inStock: true,
  },
  {
    id: "nx-gm-efi-sn-jetpack",
    name: "Nitrous Express GM EFI Jet Pack for Single Nozzle Systems",
    brand: "Nitrous Express",
    partNumber: "NX-GM-EFI-JETPACK",
    description: "GM EFI jet pack for single nozzle systems.",
    category: "nitrous",
    price: 93.37,
    inStock: true,
  },
  {
    id: "no-hardline-fbody-90-92",
    name: "Nitrous Outlet Hardline Kit, 1998-02 F-Body, 90/92mm",
    brand: "Nitrous Outlet",
    partNumber: "NO-FBODY-HL-90-92",
    description: "Hardline kit for 1998-02 F-Body, 90/92mm.",
    category: "nitrous",
    price: 101.99,
    inStock: true,
  },
  {
    id: "no-halo-fbody-15lb",
    name: "Nitrous Outlet Filter Entry HALO Dry Nitrous System, 1998-02 GM F-Body, 15lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-FBODY-HALO-15LB",
    description: "Filter entry HALO dry nitrous system for 1998-02 GM F-Body with 15lb bottle.",
    category: "nitrous",
    price: 925.99,
    inStock: true,
  },
  {
    id: "no-bracket-corvette-gto",
    name: "Nitrous Outlet All-In-One Solenoid Bracket, 1997-04 Corvette, 2004-06 GTO",
    brand: "Nitrous Outlet",
    partNumber: "NO-BRACKET-CORVETTE-GTO",
    description: "All-in-one solenoid bracket for 1997-04 Corvette and 2004-06 GTO.",
    category: "nitrous",
    price: 56.99,
    inStock: true,
  },
  {
    id: "nx-102mm-4bolt-plate-only",
    name: "Nitrous Express 102MM 4 BOLT LS NITROUS PLATE ONLY",
    brand: "Nitrous Express",
    partNumber: "NX-102MM-4BOLT-PO",
    description: "102mm 4 bolt LS nitrous plate only.",
    category: "nitrous",
    price: 326.78,
    inStock: true,
  },
  {
    id: "no-90mm-fast-c6-nb",
    name: "Nitrous Outlet 90mm FAST Plate System, 2005-13 C6 Corvette, No Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-C6-FAST-NB",
    description: "90mm FAST plate system for 2005-13 C6 Corvette, no bottle included.",
    category: "nitrous",
    price: 1053.99,
    inStock: true,
  },
  {
    id: "nx-proton-fbw-15lb",
    name: "Nitrous Express Proton Plus Fly-By-Wire Single Nozzle Nitrous System, 15lb Bottle",
    brand: "Nitrous Express",
    partNumber: "NX-PROTON-FBW-15LB",
    description: "Proton Plus fly-by-wire single nozzle nitrous system with 15lb bottle.",
    category: "nitrous",
    price: 791.97,
    inStock: true,
  },
  {
    id: "nx-5gen-camaro-sn-12lb-comp",
    name: "Nitrous Express 5th Gen Camaro Single Nozzle Nitrous System (35-150hp), 12lb Composite Bottle",
    brand: "Nitrous Express",
    partNumber: "NX-5GEN-CAMARO-SN-12LB",
    description: "5th Gen Camaro single nozzle nitrous system (35-150hp) with 12lb composite bottle.",
    category: "nitrous",
    price: 1765.45,
    inStock: true,
  },
  {
    id: "no-tss-titan-hardline",
    name: "Nitrous Outlet Texas Speed Titan Intake Hard-line Plate System",
    brand: "Nitrous Outlet",
    partNumber: "NO-TSS-TITAN",
    description: "Texas Speed Titan intake hard-line plate system.",
    category: "nitrous",
    price: 920.99,
    inStock: true,
  },
  {
    id: "no-90mm-fast-fbody-nb",
    name: "Nitrous Outlet 90mm FAST Plate System, 1998-02 F-Body, No Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-FBODY-FAST-NB",
    description: "90mm FAST plate system for 1998-02 F-Body, no bottle included.",
    category: "nitrous",
    price: 1097.99,
    inStock: true,
  },
  {
    id: "no-lsx-92mm-15lb",
    name: "Nitrous Outlet GM LSX 92mm Plate System, 15lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-LSX-92MM-15LB",
    description: "GM LSX 92mm plate system with 15lb bottle.",
    category: "nitrous",
    price: 1285.99,
    inStock: true,
  },
  {
    id: "no-lsa-ctsv-zl1-blower-nb",
    name: "Nitrous Outlet Supercharger Blower Plate System, LSA CTS-V & ZL1, No Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-LSA-BLOWER-NB",
    description: "Supercharger blower plate system for LSA CTS-V & ZL1, no bottle included.",
    category: "nitrous",
    price: 2548.99,
    inStock: true,
  },
  {
    id: "no-xseries-core-kit",
    name: "Nitrous Outlet X-Series Core EFI Nitrous Kit",
    brand: "Nitrous Outlet",
    partNumber: "NO-XSERIES-CORE",
    description: "X-Series core EFI nitrous kit.",
    category: "nitrous",
    price: 423.99,
    inStock: true,
  },
  {
    id: "nx-5gen-camaro-plate-nb",
    name: "Nitrous Express 5th Gen Camaro Plate System, No Bottle",
    brand: "Nitrous Express",
    partNumber: "NX-5GEN-CAMARO-PLATE-NB",
    description: "5th Gen Camaro plate system, no bottle included.",
    category: "nitrous",
    price: 1002.75,
    inStock: true,
  },
  {
    id: "nx-n20-filter-ss-hose",
    name: "Nitrous Express N20 Filter and Stainless Steel Hose",
    brand: "Nitrous Express",
    partNumber: "NX-N20-FILTER",
    description: "N20 filter and stainless steel hose.",
    category: "nitrous",
    price: 80.76,
    inStock: true,
  },
  {
    id: "nx-5gen-camaro-sn-5lb",
    name: "Nitrous Express 5th Gen Camaro Single Nozzle Nitrous System (35-150hp), 5lb Bottle",
    brand: "Nitrous Express",
    partNumber: "NX-5GEN-CAMARO-SN-5LB",
    description: "5th Gen Camaro single nozzle nitrous system (35-150hp) with 5lb bottle.",
    category: "nitrous",
    price: 998.19,
    inStock: true,
  },
  {
    id: "no-bottle-stand",
    name: "Nitrous Outlet Nitrous Bottle Stand",
    brand: "Nitrous Outlet",
    partNumber: "NO-BOTTLE-STAND",
    description: "Nitrous bottle stand.",
    category: "nitrous",
    price: 160.99,
    inStock: true,
  },
  {
    id: "no-92mm-ls1-dual-15lb",
    name: "Nitrous Outlet 92mm LS1 Dual Stage Plate System, 15lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-LS1-92MM-DUAL-15LB",
    description: "92mm LS1 dual stage plate system with 15lb bottle.",
    category: "nitrous",
    price: 1898.99,
    inStock: true,
  },
  {
    id: "no-90mm-fast-gto-15lb",
    name: "Nitrous Outlet 90mm FAST Plate System, 2004-06 GTO, 15lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-GTO-FAST-15LB",
    description: "90mm FAST plate system for 2004-06 GTO with 15lb bottle.",
    category: "nitrous",
    price: 1319.99,
    inStock: true,
  },
  {
    id: "nx-5gen-camaro-sn-nb",
    name: "Nitrous Express 5th Gen Camaro Single Nozzle Nitrous System (35-150hp), No Bottle",
    brand: "Nitrous Express",
    partNumber: "NX-5GEN-CAMARO-SN-NB",
    description: "5th Gen Camaro single nozzle nitrous system (35-150hp), no bottle included.",
    category: "nitrous",
    price: 880.83,
    inStock: true,
  },
  {
    id: "no-mag-90mm-15lb",
    name: "Nitrous Outlet LSX Magnuson Supercharger 90mm Plate System, 15lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-MAG-90MM-15LB",
    description: "LSX Magnuson supercharger 90mm plate system with 15lb bottle.",
    category: "nitrous",
    price: 1308.99,
    inStock: true,
  },
  {
    id: "no-sn-truck-corvette-15lb",
    name: "Nitrous Outlet Single Nozzle Nitrous System, 2014+ Truck & Corvette, 15lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-TRUCK-CORVETTE-15LB",
    description: "Single nozzle nitrous system for 2014+ Truck & Corvette with 15lb bottle.",
    category: "nitrous",
    price: 1181.99,
    inStock: true,
  },
  {
    id: "nx-coyote-wet-dp-conv",
    name: "Nitrous Express Coyote Wet Direct Port Plate Conversion",
    brand: "Nitrous Express",
    partNumber: "NX-COYOTE-WET-DP",
    description: "Coyote wet direct port plate conversion.",
    category: "nitrous",
    price: 954.34,
    inStock: true,
  },
  {
    id: "no-univ-efi-dual-nb",
    name: "Nitrous Outlet Universal EFI Dual Stage Single Nozzle Nitrous System, No Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-UNIV-DUAL-NB",
    description: "Universal EFI dual stage single nozzle nitrous system, no bottle included.",
    category: "nitrous",
    price: 1621.99,
    inStock: true,
  },
  {
    id: "no-bracket-catchcan-corvette-gto",
    name: "Nitrous Outlet All-In-One Solenoid & Catch Can Mount Bracket, 1997-04 Corvette, 2004-06 GTO",
    brand: "Nitrous Outlet",
    partNumber: "NO-BRACKET-CC-CORVETTE-GTO",
    description: "All-in-one solenoid & catch can mount bracket for 1997-04 Corvette and 2004-06 GTO.",
    category: "nitrous",
    price: 50.99,
    inStock: true,
  },
  {
    id: "no-92mm-fast-corvette-nb",
    name: "Nitrous Outlet 92mm FAST Plate System, 1997-04 Corvette, No Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-CORVETTE-FAST-92MM-NB",
    description: "92mm FAST plate system for 1997-04 Corvette, no bottle included.",
    category: "nitrous",
    price: 1084.99,
    inStock: true,
  },
  {
    id: "nx-univ-fbw-12lb",
    name: "Nitrous Express Universal Fly-By-Wire Single Nozzle System, 12lb Bottle",
    brand: "Nitrous Express",
    partNumber: "NX-UNIV-FBW-12LB",
    description: "Universal fly-by-wire single nozzle system with 12lb bottle.",
    category: "nitrous",
    price: 1714.98,
    inStock: true,
  },
  {
    id: "nx-proton-sn-5lb",
    name: "Nitrous Express Proton Plus Single Nozzle Nitrous System, 5lb Bottle",
    brand: "Nitrous Express",
    partNumber: "NX-PROTON-SN-5LB",
    description: "Proton Plus single nozzle nitrous system with 5lb bottle.",
    category: "nitrous",
    price: 519.48,
    inStock: true,
  },
  {
    id: "nos-c7-corvette-black",
    name: "NOS PLATE WET NITROUS SYSTEM - GM 2014-2019 C7 Corvette Nitrous System - Black Components w/ 15 lb Black Bottle",
    brand: "NOS",
    partNumber: "NOS-C7-CORVETTE-BLK",
    description: "NOS plate wet nitrous system for GM 2014-2019 C7 Corvette with black components and 15lb black bottle.",
    category: "nitrous",
    price: 1349.95,
    inStock: true,
  },
  {
    id: "no-maf-solenoid-bracket",
    name: "Nitrous Outlet MAF Solenoid Bracket",
    brand: "Nitrous Outlet",
    partNumber: "NO-MAF-BRACKET",
    description: "MAF solenoid bracket.",
    category: "nitrous",
    price: 51.99,
    inStock: true,
  },
  {
    id: "nos-sniper-fab-ls-silver",
    name: "NOS DRY NITROUS PLATE FOR SNIPER EFI FABRICATED RACE SERIES LS INTAKE MANIFOLDS-SILVER",
    brand: "NOS",
    partNumber: "NOS-SNIPER-FAB-SILVER",
    description: "NOS dry nitrous plate for Sniper EFI fabricated race series LS intake manifolds, silver.",
    category: "nitrous",
    price: 69.95,
    inStock: true,
  },
  // Nitrous products 241-300
  {
    id: "nx-coy-god-ho-conv",
    name: "Nitrous Express 5.0L Coyote and 7.3L Godzilla High Output Plate Conversion",
    brand: "Nitrous Express",
    partNumber: "NX-COY-GOD-HO-CONV",
    description: "5.0L Coyote and 7.3L Godzilla high output plate conversion.",
    category: "nitrous",
    price: 393.69,
    inStock: true,
  },
  {
    id: "no-efi-race-sn-15lb",
    name: "Nitrous Outlet GM EFI Race Single Nozzle Nitrous System, 15lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-RACE-SN-15LB",
    description: "GM EFI race single nozzle nitrous system with 15lb bottle.",
    category: "nitrous",
    price: 1133.99,
    inStock: true,
  },
  {
    id: "no-lsx-aio-bracket",
    name: "Nitrous Outlet LSX All-In-One Solenoid Bracket",
    brand: "Nitrous Outlet",
    partNumber: "NO-LSX-AIO",
    description: "LSX all-in-one solenoid bracket.",
    category: "nitrous",
    price: 52.99,
    inStock: true,
  },
  {
    id: "nx-tps-switch",
    name: "Nitrous Express Throttle Position Sensor Switch",
    brand: "Nitrous Express",
    partNumber: "NX-TPS-SWITCH",
    description: "Throttle position sensor switch for nitrous activation.",
    category: "nitrous",
    price: 143.86,
    inStock: true,
  },
  {
    id: "nos-hemi-64-plate",
    name: "NOS 2011-2020 HEMI 6.4L PLATE WET NITROUS SYSTEM",
    brand: "NOS",
    partNumber: "NOS-HEMI-64",
    description: "NOS 2011-2020 Hemi 6.4L plate wet nitrous system.",
    category: "nitrous",
    price: 1349.95,
    inStock: true,
  },
  {
    id: "no-lsx-102mm-nb",
    name: "Nitrous Outlet GM LSX 102mm Plate System, No Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-LSX-102MM-NB",
    description: "GM LSX 102mm plate system, no bottle included.",
    category: "nitrous",
    price: 983.99,
    inStock: true,
  },
  {
    id: "no-78mm-sol-bracket-truck",
    name: "Nitrous Outlet 78mm Solenoid Bracket, 1998-07 GM Truck",
    brand: "Nitrous Outlet",
    partNumber: "NO-TRUCK-78MM-BRACKET",
    description: "78mm solenoid bracket for 1998-07 GM Truck.",
    category: "nitrous",
    price: 43.99,
    inStock: true,
  },
  {
    id: "no-zl1-hl-kit",
    name: "Nitrous Outlet Hard Line Kit, 2012-15 Camaro ZL1",
    brand: "Nitrous Outlet",
    partNumber: "NO-ZL1-HL-KIT",
    description: "Hard line kit for 2012-15 Camaro ZL1.",
    category: "nitrous",
    price: 51.99,
    inStock: true,
  },
  {
    id: "no-x-univ-sol-bracket",
    name: "Nitrous Outlet X-Series Universal Solenoid Bracket",
    brand: "Nitrous Outlet",
    partNumber: "NO-X-SOL-BRACKET",
    description: "X-Series universal solenoid bracket.",
    category: "nitrous",
    price: 7.99,
    inStock: true,
  },
  {
    id: "nx-coyote-dry-dp-conv",
    name: "Nitrous Express Coyote Dry Direct Port Plate Conversion",
    brand: "Nitrous Express",
    partNumber: "NX-COYOTE-DRY-DP",
    description: "Coyote dry direct port plate conversion.",
    category: "nitrous",
    price: 475.58,
    inStock: true,
  },
  {
    id: "no-fbody-78mm-nb",
    name: "Nitrous Outlet 78mm Plate System, 1998-02 F-Body, No Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-FBODY-78MM-NB",
    description: "78mm plate system for 1998-02 F-Body, no bottle included.",
    category: "nitrous",
    price: 1122.99,
    inStock: true,
  },
  {
    id: "no-classic-truck-78mm-15lb",
    name: "Nitrous Outlet 78mm Plate System, 1999-06 GM Classic Truck, 15lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-CLASSIC-78MM-15LB",
    description: "78mm plate system for 1999-06 GM Classic Truck with 15lb bottle.",
    category: "nitrous",
    price: 1266.99,
    inStock: true,
  },
  {
    id: "nx-remote-opener",
    name: "Nitrous Express Automatic Remote Bottle Opener",
    brand: "Nitrous Express",
    partNumber: "NX-REMOTE-OPENER",
    description: "Automatic remote bottle opener for nitrous systems.",
    category: "nitrous",
    price: 363.43,
    inStock: true,
  },
  {
    id: "nx-fuel-pressure-switch",
    name: "Nitrous Express Fuel Pressure Safety Switch w/ 4AN Manifold",
    brand: "Nitrous Express",
    partNumber: "NX-FP-SWITCH",
    description: "Fuel pressure safety switch with 4AN manifold.",
    category: "nitrous",
    price: 84.62,
    inStock: true,
  },
  {
    id: "no-camaro-90mm-15lb",
    name: "Nitrous Outlet 90mm Plate System, 2010-15 Camaro 15lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-CAMARO-90MM-15LB",
    description: "90mm plate system for 2010-15 Camaro with 15lb bottle.",
    category: "nitrous",
    price: 1366.99,
    inStock: true,
  },
  {
    id: "no-univ-efi-dual-15lb",
    name: "Nitrous Outlet Universal EFI Dual Nozzle Nitrous System, 15lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-UNIV-DUAL-15LB",
    description: "Universal EFI dual nozzle nitrous system with 15lb bottle.",
    category: "nitrous",
    price: 1296.99,
    inStock: true,
  },
  {
    id: "no-univ-dual-dry-10lb-v2",
    name: "Nitrous Outlet Universal Dual Nozzle Dry Kit (10lb Bottle)",
    brand: "Nitrous Outlet",
    partNumber: "NO-UNIV-DRY-10LB-V2",
    description: "Universal dual nozzle dry kit with 10lb bottle.",
    category: "nitrous",
    price: 924.99,
    inStock: true,
  },
  {
    id: "no-4an-filter",
    name: "Nitrous Outlet 4AN Nitrous Filter",
    brand: "Nitrous Outlet",
    partNumber: "NO-4AN-FILTER",
    description: "4AN nitrous filter.",
    category: "nitrous",
    price: 70.99,
    inStock: true,
  },
  {
    id: "no-fbody-fast-92mm-nb",
    name: "Nitrous Outlet 92mm FAST Plate System, 1998-02 F-Body, No Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-FBODY-FAST-92-NB",
    description: "92mm FAST plate system for 1998-02 F-Body, no bottle included.",
    category: "nitrous",
    price: 1084.99,
    inStock: true,
  },
  {
    id: "no-dual-lsx-92mm-conv",
    name: "Nitrous Outlet Dual Stage GM LSX 92mm Nitrous Plate Conversion",
    brand: "Nitrous Outlet",
    partNumber: "NO-DUAL-92MM-CONV",
    description: "Dual stage GM LSX 92mm nitrous plate conversion.",
    category: "nitrous",
    price: 350.99,
    inStock: true,
  },
  {
    id: "no-truck-78mm-nb-v2",
    name: "Nitrous Outlet 78mm Plate System, 1999-04 GM Truck, No Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-TRUCK-78MM-NB-V2",
    description: "78mm plate system for 1999-04 GM Truck, no bottle included.",
    category: "nitrous",
    price: 1029.99,
    inStock: true,
  },
  {
    id: "no-dry-92mm-nb",
    name: "Nitrous Outlet Dry 92mm LSx Plate System, No Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-DRY-92MM-NB",
    description: "Dry 92mm LSx plate system, no bottle included.",
    category: "nitrous",
    price: 816.99,
    inStock: true,
  },
  {
    id: "no-dry-90mm-15lb-v2",
    name: "Nitrous Outlet Dry 90mm LSx Plate System, 15lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-DRY-90MM-15LB-V2",
    description: "Dry 90mm LSx plate system with 15lb bottle.",
    category: "nitrous",
    price: 1126.99,
    inStock: true,
  },
  {
    id: "no-lsx-78mm-10lb",
    name: "Nitrous Outlet GM LSX 78mm Plate System, 10lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-LSX-78MM-10LB",
    description: "GM LSX 78mm plate system with 10lb bottle.",
    category: "nitrous",
    price: 1280.99,
    inStock: true,
  },
  {
    id: "no-lsx-aio-catch-can",
    name: "Nitrous Outlet LSX All-In-One Solenoid & Catch Can Mount Bracket",
    brand: "Nitrous Outlet",
    partNumber: "NO-LSX-AIO-CC",
    description: "LSX all-in-one solenoid and catch can mount bracket.",
    category: "nitrous",
    price: 45.99,
    inStock: true,
  },
  {
    id: "no-univ-sn-dry-nb",
    name: "Nitrous Outlet Universal Single Nozzle Dry Kit, No Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-UNIV-SN-DRY-NB",
    description: "Universal single nozzle dry kit, no bottle included.",
    category: "nitrous",
    price: 588.99,
    inStock: true,
  },
  {
    id: "nx-efi-dual-10lb",
    name: "Nitrous Express GM EFI Dual Nozzle System, 10lb Bottle",
    brand: "Nitrous Express",
    partNumber: "NX-EFI-DUAL-10LB",
    description: "GM EFI dual nozzle system with 10lb bottle.",
    category: "nitrous",
    price: 1119.13,
    inStock: true,
  },
  {
    id: "nx-camaro-plate-12lb",
    name: "Nitrous Express 5th Gen Camaro Plate System, 12lb Composite Bottle",
    brand: "Nitrous Express",
    partNumber: "NX-CAMARO-PLATE-12LB",
    description: "5th Gen Camaro plate system with 12lb composite bottle.",
    category: "nitrous",
    price: 1747.38,
    inStock: true,
  },
  {
    id: "no-corvette-78mm-nb",
    name: "Nitrous Outlet 78mm Plate System, 1997-04 Corvette, No Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-CORVETTE-78MM-NB",
    description: "78mm plate system for 1997-04 Corvette, no bottle included.",
    category: "nitrous",
    price: 1121.99,
    inStock: true,
  },
  {
    id: "no-corvette-78mm-15lb",
    name: "Nitrous Outlet 78mm Plate System, 1997-04 Corvette, 15lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-CORVETTE-78MM-15LB",
    description: "78mm plate system for 1997-04 Corvette with 15lb bottle.",
    category: "nitrous",
    price: 1377.99,
    inStock: true,
  },
  {
    id: "no-c7-lt1-hl-15lb",
    name: "Nitrous Outlet Hard-line Plate System, C7 Corvette LT1, 15lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-C7-LT1-HL-15LB",
    description: "Hard-line plate system for C7 Corvette LT1 with 15lb bottle.",
    category: "nitrous",
    price: 1382.99,
    inStock: true,
  },
  {
    id: "no-c5-bracket-driver",
    name: "Nitrous Outlet 10lb/15lb Bottle Bracket Mounting Plate, Driver Side, 1997-04 C5 Corvette",
    brand: "Nitrous Outlet",
    partNumber: "NO-C5-DRIVER-BRACKET",
    description: "10lb/15lb bottle bracket mounting plate, driver side, for 1997-04 C5 Corvette.",
    category: "nitrous",
    price: 92.99,
    inStock: true,
  },
  {
    id: "nx-c7-plate-conv",
    name: "Nitrous Express C7 Corvette Nitrous Plate Conversion",
    brand: "Nitrous Express",
    partNumber: "NX-C7-CONV",
    description: "C7 Corvette nitrous plate conversion.",
    category: "nitrous",
    price: 405.50,
    inStock: true,
  },
  {
    id: "nos-sniper-race-ls-silver",
    name: "NOS DRY NITROUS PLATE SYSTEM FOR SNIPER EFI RACE SERIES LS INTAKE MANIFOLD - SILVER",
    brand: "NOS",
    partNumber: "NOS-SNIPER-LS-SILVER",
    description: "NOS dry nitrous plate system for Sniper EFI race series LS intake manifold, silver.",
    category: "nitrous",
    price: 1579.99,
    inStock: true,
  },
  {
    id: "no-bottle-bath",
    name: "Nitrous Outlet Nitrous Bottle Hot Water Bath",
    brand: "Nitrous Outlet",
    partNumber: "NO-BOTTLE-BATH",
    description: "Nitrous bottle hot water bath for warming bottles.",
    category: "nitrous",
    price: 848.99,
    inStock: true,
  },
  {
    id: "no-fbody-halo-10lb",
    name: "Nitrous Outlet Filter Entry HALO Dry Nitrous System, 1998-02 GM F-Body, 10lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-FBODY-HALO-10LB",
    description: "Filter entry HALO dry nitrous system for 1998-02 GM F-Body with 10lb bottle.",
    category: "nitrous",
    price: 888.99,
    inStock: true,
  },
  {
    id: "nx-dual-stage-upgrade",
    name: "Nitrous Express Dual Stage Upgrade For Dual Stage Throttle Body Plates",
    brand: "Nitrous Express",
    partNumber: "NX-DUAL-UPGRADE",
    description: "Dual stage upgrade for dual stage throttle body plates.",
    category: "nitrous",
    price: 556.89,
    inStock: true,
  },
  {
    id: "no-z06-90mm-15lb-v2",
    name: "Nitrous Outlet 90mm Plate System, 2005-13 Corvette Z06, 15lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-Z06-90MM-15LB-V2",
    description: "90mm plate system for 2005-13 Corvette Z06 with 15lb bottle.",
    category: "nitrous",
    price: 1304.99,
    inStock: true,
  },
  {
    id: "nos-90mm-dbw-blk",
    name: "NOS PLATE WET NITROUS SYSTEM - GM 90mm or 92mm 4-Bolt Drive-By-Wire - BLACK",
    brand: "NOS",
    partNumber: "NOS-90MM-DBW-BLK",
    description: "NOS plate wet nitrous system for GM 90mm or 92mm 4-bolt drive-by-wire, black.",
    category: "nitrous",
    price: 1349.95,
    inStock: true,
  },
  {
    id: "nx-ls-90mm-nb",
    name: "Nitrous Express LS 90mm Nitrous Plate System (50-400hp), No Bottle",
    brand: "Nitrous Express",
    partNumber: "NX-LS-90MM-NB",
    description: "LS 90mm nitrous plate system (50-400hp), no bottle included.",
    category: "nitrous",
    price: 857.57,
    inStock: true,
  },
  {
    id: "no-fbody-fast-92mm-10lb",
    name: "Nitrous Outlet 92mm FAST Plate System, 1998-02 F-Body, 10lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-FBODY-FAST-92-10LB",
    description: "92mm FAST plate system for 1998-02 F-Body with 10lb bottle.",
    category: "nitrous",
    price: 1308.99,
    inStock: true,
  },
  {
    id: "no-gto-fold-panel",
    name: "Nitrous Outlet Fold Up Switch Panel, 2004-06 GTO",
    brand: "Nitrous Outlet",
    partNumber: "NO-GTO-FOLD-PANEL",
    description: "Fold up switch panel for 2004-06 GTO.",
    category: "nitrous",
    price: 94.99,
    inStock: true,
  },
  {
    id: "no-gto-slide-panel",
    name: "Nitrous Outlet Slide In Switch Panel, 2004-06 GTO",
    brand: "Nitrous Outlet",
    partNumber: "NO-GTO-SLIDE-PANEL",
    description: "Slide in switch panel for 2004-06 GTO.",
    category: "nitrous",
    price: 93.99,
    inStock: true,
  },
  {
    id: "no-corvette-92mm-15lb",
    name: "Nitrous Outlet 92mm Intake Plate System, 2005-09 Corvette, 15lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-CORVETTE-92MM-15LB",
    description: "92mm intake plate system for 2005-09 Corvette with 15lb bottle.",
    category: "nitrous",
    price: 1308.99,
    inStock: true,
  },
  {
    id: "no-c5-switch-panel",
    name: "Nitrous Outlet C5 Corvette Switch Panel",
    brand: "Nitrous Outlet",
    partNumber: "NO-C5-SWITCH",
    description: "C5 Corvette switch panel.",
    category: "nitrous",
    price: 82.99,
    inStock: true,
  },
  {
    id: "nos-holley-ls-hi-ram-blk",
    name: "NOS DRY NITROUS PLATE SYSTEM FOR HOLLEY LS HI RAM INTAKE MANIFOLD - BLACK",
    brand: "NOS",
    partNumber: "NOS-HI-RAM-BLK",
    description: "NOS dry nitrous plate system for Holley LS Hi Ram intake manifold, black.",
    category: "nitrous",
    price: 2151.95,
    inStock: true,
  },
  {
    id: "nx-camaro-plate-15lb-v2",
    name: "Nitrous Express 5th Gen Camaro Plate System, 15lb Bottle",
    brand: "Nitrous Express",
    partNumber: "NX-CAMARO-PLATE-15LB-V2",
    description: "5th Gen Camaro plate system with 15lb bottle.",
    category: "nitrous",
    price: 1216.86,
    inStock: true,
  },
  {
    id: "no-camaro-console-panel",
    name: "Nitrous Outlet Console Switch Panel, 2010-15 Camaro",
    brand: "Nitrous Outlet",
    partNumber: "NO-CAMARO-CONSOLE",
    description: "Console switch panel for 2010-15 Camaro.",
    category: "nitrous",
    price: 102.99,
    inStock: true,
  },
  {
    id: "no-gto-90mm-nb-v2",
    name: "Nitrous Outlet 90mm Plate System, 2005-06 GTO, No Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-GTO-90MM-NB-V2",
    description: "90mm plate system for 2005-06 GTO, no bottle included.",
    category: "nitrous",
    price: 1053.99,
    inStock: true,
  },
  {
    id: "no-ls9-blower-10lb",
    name: "Nitrous Outlet LS9 Blower Plate System, 10lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-LS9-10LB",
    description: "LS9 blower plate system with 10lb bottle.",
    category: "nitrous",
    price: 2399.99,
    inStock: true,
  },
  {
    id: "nos-camaro-ls3-plate",
    name: "NOS EFI NITROUS WET PLATE - GM 2010-2015 Chevrolet Camaro LS3 90mm 4-bolt Nitrous Plate ONLY",
    brand: "NOS",
    partNumber: "NOS-CAMARO-LS3",
    description: "NOS EFI nitrous wet plate for GM 2010-2015 Chevrolet Camaro LS3 90mm 4-bolt, plate only.",
    category: "nitrous",
    price: 318.95,
    inStock: true,
  },
  {
    id: "no-fbody-fast-90mm-10lb",
    name: "Nitrous Outlet 90mm FAST Plate System, 1998-02 F-Body, 10lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-FBODY-FAST-90-10LB",
    description: "90mm FAST plate system for 1998-02 F-Body with 10lb bottle.",
    category: "nitrous",
    price: 1319.99,
    inStock: true,
  },
  {
    id: "no-fbody-fast-92mm-15lb",
    name: "Nitrous Outlet 92mm FAST Plate System, 1998-02 F-Body, 15lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-FBODY-FAST-92-15LB",
    description: "92mm FAST plate system for 1998-02 F-Body with 15lb bottle.",
    category: "nitrous",
    price: 1345.99,
    inStock: true,
  },
  {
    id: "nx-flo-thru-gauge",
    name: "Nitrous Express N2O Flo-Thru Pressure Gauge (0-1500 PSI) 4AN",
    brand: "Nitrous Express",
    partNumber: "NX-FLO-GAUGE",
    description: "N2O flo-thru pressure gauge (0-1500 PSI) 4AN.",
    category: "nitrous",
    price: 70.19,
    inStock: true,
  },
  {
    id: "no-corvette-fast-92mm-15lb",
    name: "Nitrous Outlet 92mm FAST Plate System, 1997-04 Corvette, 15lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-CORVETTE-FAST-92-15LB",
    description: "92mm FAST plate system for 1997-04 Corvette with 15lb bottle.",
    category: "nitrous",
    price: 1345.99,
    inStock: true,
  },
  {
    id: "no-efi-race-sn-nb",
    name: "Nitrous Outlet GM EFI Race Single Nozzle Nitrous System, No Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-RACE-SN-NB",
    description: "GM EFI race single nozzle nitrous system, no bottle included.",
    category: "nitrous",
    price: 836.99,
    inStock: true,
  },
  {
    id: "nx-proton-sn-10lb",
    name: "Nitrous Express Proton Plus Single Nozzle Nitrous System, 10lb Bottle",
    brand: "Nitrous Express",
    partNumber: "NX-PROTON-SN-10LB",
    description: "Proton Plus single nozzle nitrous system with 10lb bottle.",
    category: "nitrous",
    price: 556.23,
    inStock: true,
  },
  {
    id: "no-big-show-purge",
    name: "Nitrous Outlet Big Show 4AN Purge Kits",
    brand: "Nitrous Outlet",
    partNumber: "NO-BIG-SHOW-PURGE",
    description: "Big Show 4AN purge kits.",
    category: "nitrous",
    price: 244.99,
    inStock: true,
  },
  {
    id: "no-truck-78mm-10lb-v2",
    name: "Nitrous Outlet 78mm Plate System, 1999-04 GM Truck, 10lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-TRUCK-78MM-10LB-V2",
    description: "78mm plate system for 1999-04 GM Truck with 10lb bottle.",
    category: "nitrous",
    price: 1261.99,
    inStock: true,
  },
  {
    id: "nos-sniper-102mm",
    name: "NOS SNIPER PLATE WET NITROUS SYSTEM - GM 1997-2012 GM LS 102mm or 105mm 4-Bolt Throttle Body",
    brand: "NOS",
    partNumber: "NOS-SNIPER-102MM",
    description: "NOS Sniper plate wet nitrous system for GM 1997-2012 LS 102mm or 105mm 4-bolt throttle body.",
    category: "nitrous",
    price: 799.95,
    inStock: true,
  },
  // Nitrous products 301-360
  {
    id: "no-big-show-standalone",
    name: "Nitrous Outlet Big Show Stand Alone Purge Kit",
    brand: "Nitrous Outlet",
    partNumber: "NO-BIGSHOW-SA",
    description: "Big Show stand alone purge kit.",
    category: "nitrous",
    price: 696.99,
    inStock: true,
  },
  {
    id: "nos-hemi-57-61-sniper",
    name: "NOS 2005-2020 HEMI 5.7L/ 6.1L SNIPER WET PLATE NITROUS SYSTEM",
    brand: "NOS",
    partNumber: "NOS-HEMI-57-61",
    description: "NOS 2005-2020 Hemi 5.7L/6.1L Sniper wet plate nitrous system.",
    category: "nitrous",
    price: 799.95,
    inStock: true,
  },
  {
    id: "nos-102mm-105mm-dbw",
    name: "NOS PLATE WET NITROUS SYSTEM - GM 1997-2012 GM LS 102mm or 105mm 4-Bolt Drive-By-Wire Throttle Body",
    brand: "NOS",
    partNumber: "NOS-102MM-DBW",
    description: "NOS plate wet nitrous system for GM 1997-2012 LS 102mm or 105mm 4-bolt drive-by-wire throttle body.",
    category: "nitrous",
    price: 1349.95,
    inStock: true,
  },
  {
    id: "nos-sniper-80mm-3bolt",
    name: "NOS SNIPER PLATE WET NITROUS SYSTEM - GM 1997-2012 GM LS 80mm 3-Bolt Throttle Body",
    brand: "NOS",
    partNumber: "NOS-SNIPER-80MM",
    description: "NOS Sniper plate wet nitrous system for GM 1997-2012 LS 80mm 3-bolt throttle body.",
    category: "nitrous",
    price: 782.95,
    originalPrice: 870.95,
    inStock: true,
  },
  {
    id: "no-fast-102mm-hl-10lb",
    name: "Nitrous Outlet 102mm FAST Intake Hard-Lined Plate System, 10lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-FAST-102MM-HL-10LB",
    description: "102mm FAST intake hard-lined plate system with 10lb bottle.",
    category: "nitrous",
    price: 1245.99,
    inStock: true,
  },
  {
    id: "no-4an-purge-kit",
    name: "Nitrous Outlet 4AN Purge Kit",
    brand: "Nitrous Outlet",
    partNumber: "NO-4AN-PURGE",
    description: "4AN purge kit.",
    category: "nitrous",
    price: 192.99,
    inStock: true,
  },
  {
    id: "no-acc-pkg-hfp-6an",
    name: "Nitrous Outlet Accessory Package - High Fuel Pressure/6AN",
    brand: "Nitrous Outlet",
    partNumber: "NO-ACC-HFP-6AN",
    description: "Accessory package for high fuel pressure applications with 6AN fittings.",
    category: "nitrous",
    price: 753.99,
    inStock: true,
  },
  {
    id: "no-c6-switch-panel",
    name: "Nitrous Outlet C6 Switch Panel",
    brand: "Nitrous Outlet",
    partNumber: "NO-C6-SWITCH",
    description: "C6 Corvette switch panel.",
    category: "nitrous",
    price: 137.99,
    inStock: true,
  },
  {
    id: "no-dual-vent-purge",
    name: "Nitrous Outlet Dual Vent Purge, Hood Exit",
    brand: "Nitrous Outlet",
    partNumber: "NO-DUAL-VENT",
    description: "Dual vent purge with hood exit.",
    category: "nitrous",
    price: 100.99,
    inStock: true,
  },
  {
    id: "no-trans-tunnel-bracket",
    name: "Nitrous Outlet Transmission Tunnel 10lb/15lb Nitrous Bottle Bracket, 1993-02 F-Body",
    brand: "Nitrous Outlet",
    partNumber: "NO-TUNNEL-BRACKET",
    description: "Transmission tunnel 10lb/15lb nitrous bottle bracket for 1993-02 F-Body.",
    category: "nitrous",
    price: 160.99,
    inStock: true,
  },
  {
    id: "no-x-heater-element",
    name: "Nitrous Outlet X-Series Black N2O Heater Element",
    brand: "Nitrous Outlet",
    partNumber: "NO-X-HEATER",
    description: "X-Series black N2O heater element.",
    category: "nitrous",
    price: 100.99,
    inStock: true,
  },
  {
    id: "no-pump-station-full",
    name: "Nitrous Outlet Pump Station",
    brand: "Nitrous Outlet",
    partNumber: "NO-PUMP-STATION",
    description: "Nitrous Outlet pump station for filling bottles.",
    category: "nitrous",
    price: 1795.99,
    inStock: true,
  },
  {
    id: "no-x-4an-purge",
    name: "Nitrous Outlet X-Series 4AN Purge Kit",
    brand: "Nitrous Outlet",
    partNumber: "NO-X-4AN-PURGE",
    description: "X-Series 4AN purge kit.",
    category: "nitrous",
    price: 194.99,
    inStock: true,
  },
  {
    id: "no-camaro-cup-holder",
    name: "Nitrous Outlet Camaro Cup Holder Switch Panel, 2010-15 Camaro",
    brand: "Nitrous Outlet",
    partNumber: "NO-CAMARO-CUP",
    description: "Camaro cup holder switch panel for 2010-15 Camaro.",
    category: "nitrous",
    price: 92.99,
    inStock: true,
  },
  {
    id: "no-fast-102mm-truck-10lb",
    name: "Nitrous Outlet 102mm FAST Plate System, LSX Truck, 10lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-FAST-102MM-TRUCK-10LB",
    description: "102mm FAST plate system for LSX Truck with 10lb bottle.",
    category: "nitrous",
    price: 1065.99,
    inStock: true,
  },
  {
    id: "no-102mm-dual-15lb",
    name: "Nitrous Outlet 102mm LSX Dual Stage Plate System, 15lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-102MM-DUAL-15LB",
    description: "102mm LSX dual stage plate system with 15lb bottle.",
    category: "nitrous",
    price: 1955.99,
    inStock: true,
  },
  {
    id: "no-pump-station-scale",
    name: "Nitrous Outlet Pump Station & Scale",
    brand: "Nitrous Outlet",
    partNumber: "NO-PUMP-SCALE",
    description: "Nitrous Outlet pump station with scale.",
    category: "nitrous",
    price: 1822.99,
    inStock: true,
  },
  {
    id: "no-x-the-show-purge",
    name: 'Nitrous Outlet X-Series "The Show" Purge System',
    brand: "Nitrous Outlet",
    partNumber: "NO-X-SHOW-PURGE",
    description: 'X-Series "The Show" purge system.',
    category: "nitrous",
    price: 523.99,
    inStock: true,
  },
  {
    id: "no-lsx-102mm-conv",
    name: "Nitrous Outlet GM LSX 102mm Nitrous Plate Conversion",
    brand: "Nitrous Outlet",
    partNumber: "NO-LSX-102MM-CONV",
    description: "GM LSX 102mm nitrous plate conversion.",
    category: "nitrous",
    price: 315.99,
    inStock: true,
  },
  {
    id: "no-heated-bracket-4an",
    name: "Nitrous Outlet Heated 10lb/15lb Nitrous Bottle Bracket w/4AN Install Accessories",
    brand: "Nitrous Outlet",
    partNumber: "NO-HEATED-BRACKET-4AN",
    description: "Heated 10lb/15lb nitrous bottle bracket with 4AN install accessories.",
    category: "nitrous",
    price: 326.99,
    inStock: true,
  },
  {
    id: "no-x-heater-6an",
    name: "Nitrous Outlet X-Series Nitrous Bottle Heater, 6AN",
    brand: "Nitrous Outlet",
    partNumber: "NO-X-HEATER-6AN",
    description: "X-Series nitrous bottle heater with 6AN fittings.",
    category: "nitrous",
    price: 193.99,
    inStock: true,
  },
  {
    id: "no-lsa-blower-10lb",
    name: "Nitrous Outlet Supercharger Blower Plate System, LSA CTS-V & ZL1, 10lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-LSA-BLOWER-10LB",
    description: "Supercharger blower plate system for LSA CTS-V and ZL1 with 10lb bottle.",
    category: "nitrous",
    price: 2563.99,
    inStock: true,
  },
  {
    id: "no-truck-78mm-conv",
    name: "Nitrous Outlet GM Truck 78mm Nitrous Plate Conversion",
    brand: "Nitrous Outlet",
    partNumber: "NO-TRUCK-78MM-CONV",
    description: "GM Truck 78mm nitrous plate conversion.",
    category: "nitrous",
    price: 315.99,
    inStock: true,
  },
  {
    id: "no-90-blowdown-tube",
    name: "Nitrous Outlet 90 Degree Blow Down Tube",
    brand: "Nitrous Outlet",
    partNumber: "NO-90-TUBE",
    description: "90 degree blow down tube.",
    category: "nitrous",
    price: 13.99,
    inStock: true,
  },
  {
    id: "nx-efi-sn-10lb",
    name: "Nitrous Express GM EFI Single Nozzle System, 10lb Bottle",
    brand: "Nitrous Express",
    partNumber: "NX-EFI-SN-10LB",
    description: "GM EFI single nozzle system with 10lb bottle.",
    category: "nitrous",
    price: 874.52,
    inStock: true,
  },
  {
    id: "no-univ-efi-dual-nozzle-10lb",
    name: "Nitrous Outlet Universal EFI Dual Nozzle Nitrous System, 10lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-UNIV-DUAL-NOZZLE-10LB",
    description: "Universal EFI dual nozzle nitrous system with 10lb bottle.",
    category: "nitrous",
    price: 1259.99,
    inStock: true,
  },
  {
    id: "nx-6an-purge-valve",
    name: "Nitrous Express 6AN Nitrous Purge Valve System",
    brand: "Nitrous Express",
    partNumber: "NX-6AN-PURGE",
    description: "6AN nitrous purge valve system.",
    category: "nitrous",
    price: 175.40,
    inStock: true,
  },
  {
    id: "nx-univ-fbw-15lb-v2",
    name: "Nitrous Express Universal Fly-By-Wire Single Nozzle System, 15lb Bottle",
    brand: "Nitrous Express",
    partNumber: "NX-UNIV-FBW-15LB-V2",
    description: "Universal fly-by-wire single nozzle system with 15lb bottle.",
    category: "nitrous",
    price: 1054.99,
    inStock: true,
  },
  {
    id: "no-x-10lb-bottle",
    name: "Nitrous Outlet X-Series 10lb Nitrous Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-X-10LB",
    description: "X-Series 10lb nitrous bottle.",
    category: "nitrous",
    price: 272.99,
    inStock: true,
  },
  {
    id: "no-adj-pressure-switch",
    name: "Nitrous Outlet Adjustable Pressure Switch",
    brand: "Nitrous Outlet",
    partNumber: "NO-ADJ-SWITCH",
    description: "Adjustable pressure switch.",
    category: "nitrous",
    price: 54.99,
    inStock: true,
  },
  {
    id: "no-fast-102mm-hl-kit",
    name: "Nitrous Outlet Hardline Kit, FAST 102mm",
    brand: "Nitrous Outlet",
    partNumber: "NO-FAST-102MM-HL",
    description: "Hardline kit for FAST 102mm.",
    category: "nitrous",
    price: 103.99,
    inStock: true,
  },
  {
    id: "no-big-show-6an-purge",
    name: "Nitrous Outlet Big Show 6AN Purge Kits",
    brand: "Nitrous Outlet",
    partNumber: "NO-BIGSHOW-6AN",
    description: "Big Show 6AN purge kits.",
    category: "nitrous",
    price: 244.99,
    inStock: true,
  },
  {
    id: "no-gto-78mm-10lb",
    name: "Nitrous Outlet 78mm Plate System, 2004 GTO, 10lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-GTO-78MM-10LB",
    description: "78mm plate system for 2004 GTO with 10lb bottle.",
    category: "nitrous",
    price: 1302.99,
    inStock: true,
  },
  {
    id: "no-fbody-78mm-10lb",
    name: "Nitrous Outlet 78mm Plate System, 1998-02 F-Body, 10lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-FBODY-78MM-10LB",
    description: "78mm plate system for 1998-02 F-Body with 10lb bottle.",
    category: "nitrous",
    price: 1340.99,
    inStock: true,
  },
  {
    id: "no-660-nut-gasket",
    name: "Nitrous Outlet 660 Style Bottle Valve Bottle Nut Gasket",
    brand: "Nitrous Outlet",
    partNumber: "NO-660-GASKET",
    description: "660 style bottle valve bottle nut gasket.",
    category: "nitrous",
    price: 2.49,
    inStock: true,
  },
  {
    id: "no-fast-90mm-c6-10lb",
    name: "Nitrous Outlet 90mm FAST Plate System, 2005-13 C6 Corvette, 10lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-FAST-90MM-C6-10LB",
    description: "90mm FAST plate system for 2005-13 C6 Corvette with 10lb bottle.",
    category: "nitrous",
    price: 1281.99,
    inStock: true,
  },
  {
    id: "no-classic-truck-78mm-10lb",
    name: "Nitrous Outlet 78mm Plate System, 1999-06 GM Classic Truck, 10lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-CLASSIC-78MM-10LB",
    description: "78mm plate system for 1999-06 GM Classic Truck with 10lb bottle.",
    category: "nitrous",
    price: 1228.99,
    inStock: true,
  },
  {
    id: "nx-4an-purge-valve",
    name: "Nitrous Express 4AN Purge Valve System",
    brand: "Nitrous Express",
    partNumber: "NX-4AN-PURGE",
    description: "4AN purge valve system.",
    category: "nitrous",
    price: 174.15,
    inStock: true,
  },
  {
    id: "no-6an-filter",
    name: "Nitrous Outlet 6AN Nitrous Filter",
    brand: "Nitrous Outlet",
    partNumber: "NO-6AN-FILTER",
    description: "6AN nitrous filter.",
    category: "nitrous",
    price: 79.99,
    inStock: true,
  },
  {
    id: "no-remote-opener",
    name: "Nitrous Outlet Remote Bottle Opener",
    brand: "Nitrous Outlet",
    partNumber: "NO-REMOTE",
    description: "Remote bottle opener.",
    category: "nitrous",
    price: 304.99,
    inStock: true,
  },
  {
    id: "nx-genx2-heater-pkg",
    name: "Nitrous Express GenX-2 Nitrous Bottle Heater Accessory Package for EFI System",
    brand: "Nitrous Express",
    partNumber: "NX-GENX2-HEATER",
    description: "GenX-2 nitrous bottle heater accessory package for EFI system.",
    category: "nitrous",
    price: 630.40,
    inStock: true,
  },
  {
    id: "no-180-blowdown-tube",
    name: "Nitrous Outlet 180 Degree Blow Down Tube",
    brand: "Nitrous Outlet",
    partNumber: "NO-180-TUBE",
    description: "180 degree blow down tube.",
    category: "nitrous",
    price: 13.99,
    inStock: true,
  },
  {
    id: "no-single-billet-bracket",
    name: "Nitrous Outlet Single Billet 10lb/15lb Nitrous Bottle Bracket",
    brand: "Nitrous Outlet",
    partNumber: "NO-BILLET-SINGLE",
    description: "Single billet 10lb/15lb nitrous bottle bracket.",
    category: "nitrous",
    price: 549.99,
    inStock: true,
  },
  {
    id: "no-truck-tbss-90mm-nb",
    name: "Nitrous Outlet 90mm Plate System, 2007-13 GM Truck/Trailblazer SS, No Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-TBSS-90MM-NB",
    description: "90mm plate system for 2007-13 GM Truck/Trailblazer SS, no bottle included.",
    category: "nitrous",
    price: 978.99,
    inStock: true,
  },
  {
    id: "no-c6-bracket-mount",
    name: "Nitrous Outlet 10lb/15lb Nitrous Bottle Bracket Mounting Plate, 2005-13 C6 Corvette",
    brand: "Nitrous Outlet",
    partNumber: "NO-C6-BRACKET-MOUNT",
    description: "10lb/15lb nitrous bottle bracket mounting plate for 2005-13 C6 Corvette.",
    category: "nitrous",
    price: 215.99,
    inStock: true,
  },
  {
    id: "no-102mm-dual-10lb",
    name: "Nitrous Outlet 102mm LSX Dual Stage Plate System, 10lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-102MM-DUAL-10LB",
    description: "102mm LSX dual stage plate system with 10lb bottle.",
    category: "nitrous",
    price: 1918.99,
    inStock: true,
  },
  {
    id: "no-corvette-78mm-10lb",
    name: "Nitrous Outlet 78mm Plate System, 1997-04 Corvette, 10lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-CORVETTE-78MM-10LB",
    description: "78mm plate system for 1997-04 Corvette with 10lb bottle.",
    category: "nitrous",
    price: 1340.99,
    inStock: true,
  },
  {
    id: "no-truck-90mm-conv",
    name: "Nitrous Outlet GM Truck 90mm Nitrous Plate Conversion",
    brand: "Nitrous Outlet",
    partNumber: "NO-TRUCK-90MM-CONV",
    description: "GM Truck 90mm nitrous plate conversion.",
    category: "nitrous",
    price: 315.99,
    inStock: true,
  },
  {
    id: "no-lsx-92mm-conv",
    name: "Nitrous Outlet GM LSX 92mm Nitrous Plate Conversion",
    brand: "Nitrous Outlet",
    partNumber: "NO-LSX-92MM-CONV",
    description: "GM LSX 92mm nitrous plate conversion.",
    category: "nitrous",
    price: 315.99,
    inStock: true,
  },
  {
    id: "no-10lb-bottle-blanket",
    name: "Nitrous Outlet 10lb Nitrous Bottle Blanket",
    brand: "Nitrous Outlet",
    partNumber: "NO-10LB-BLANKET",
    description: "10lb nitrous bottle blanket.",
    category: "nitrous",
    price: 90.99,
    inStock: true,
  },
  {
    id: "no-4an-purge-tubing",
    name: "Nitrous Outlet Replacement 4AN Purge Tubing, 3 Foot",
    brand: "Nitrous Outlet",
    partNumber: "NO-4AN-TUBING",
    description: "Replacement 4AN purge tubing, 3 foot.",
    category: "nitrous",
    price: 12.99,
    inStock: true,
  },
  {
    id: "no-x-efi-sn-dry-maf",
    name: "Nitrous Outlet X-Series Universal EFI Single Nozzle Dry MAF System (50-100-150 HP)",
    brand: "Nitrous Outlet",
    partNumber: "NO-X-DRY-MAF",
    description: "X-Series universal EFI single nozzle dry MAF system (50-100-150 HP).",
    category: "nitrous",
    price: 563.99,
    inStock: true,
  },
  {
    id: "nx-camaro-plate-10lb",
    name: "Nitrous Express 5th Gen Camaro Plate System, 10lb Bottle",
    brand: "Nitrous Express",
    partNumber: "NX-CAMARO-PLATE-10LB",
    description: "5th Gen Camaro plate system with 10lb bottle.",
    category: "nitrous",
    price: 1122.89,
    inStock: true,
  },
  {
    id: "nos-102mm-wet-plate-only",
    name: "NOS EFI NITROUS WET PLATE - GM Wet plate only, fits GM LS with 102mm or 105mm 4-bolt throttle body",
    brand: "NOS",
    partNumber: "NOS-102MM-WET-PO",
    description: "NOS EFI nitrous wet plate for GM LS with 102mm or 105mm 4-bolt throttle body, plate only.",
    category: "nitrous",
    price: 357.95,
    inStock: true,
  },
  {
    id: "nos-sniper-90-92mm",
    name: "NOS SNIPER PLATE WET NITROUS SYSTEM - GM 1997-2012 GM LS with 90mm or 92mm 4-Bolt Throttle Body",
    brand: "NOS",
    partNumber: "NOS-SNIPER-90-92MM",
    description: "NOS Sniper plate wet nitrous system for GM 1997-2012 LS with 90mm or 92mm 4-bolt throttle body.",
    category: "nitrous",
    price: 749.95,
    inStock: true,
  },
  {
    id: "nx-bottle-pressure-gauge-v2",
    name: "Nitrous Express Nitrous Bottle Pressure Gauge",
    brand: "Nitrous Express",
    partNumber: "NX-BOTTLE-GAUGE",
    description: "Nitrous bottle pressure gauge.",
    category: "nitrous",
    price: 38.99,
    inStock: true,
  },
  {
    id: "no-g8-90mm-10lb",
    name: "Nitrous Outlet 90mm Plate System, 2008-09 G8 GT/GXP, 10lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-G8-90MM-10LB",
    description: "90mm plate system for 2008-09 G8 GT/GXP with 10lb bottle.",
    category: "nitrous",
    price: 1252.99,
    inStock: true,
  },
  {
    id: "nos-90-92mm-wet-full",
    name: "NOS PLATE WET NITROUS SYSTEM - GM 1997-2012 GM LS 90mm or 92mm 4-Bolt Throttle Body",
    brand: "NOS",
    partNumber: "NOS-90-92MM-WET",
    description: "NOS plate wet nitrous system for GM 1997-2012 LS 90mm or 92mm 4-bolt throttle body.",
    category: "nitrous",
    price: 1499.95,
    inStock: true,
  },
  {
    id: "no-battery-mount",
    name: "Nitrous Outlet Rechargeable Battery Mount",
    brand: "Nitrous Outlet",
    partNumber: "NO-BATTERY-MOUNT",
    description: "Rechargeable battery mount.",
    category: "nitrous",
    price: 72.99,
    inStock: true,
  },
  {
    id: "nx-proton-fbw-10lb",
    name: "Nitrous Express Proton Plus Fly-By-Wire Single Nozzle Nitrous System, 10lb Bottle",
    brand: "Nitrous Express",
    partNumber: "NX-PROTON-FBW-10LB",
    description: "Proton Plus fly-by-wire single nozzle nitrous system with 10lb bottle.",
    category: "nitrous",
    price: 732.50,
    inStock: true,
  },
  // Nitrous products 361-408 (last 48)
  {
    id: "no-univ-dual-stage-dry-10lb",
    name: "Nitrous Outlet Universal Dual Nozzle Dual Stage Dry Nitrous System, 10lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-UNIV-DUAL-STAGE-DRY-10LB",
    description: "Universal dual nozzle dual stage dry nitrous system with 10lb bottle.",
    category: "nitrous",
    price: 1249.99,
    inStock: true,
  },
  {
    id: "no-92mm-corvette-10lb",
    name: "Nitrous Outlet 92mm Intake Plate System, 2005-09 Corvette, 10lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-92MM-CORVETTE-10LB",
    description: "92mm intake plate system for 2005-09 Corvette with 10lb bottle.",
    category: "nitrous",
    price: 1270.99,
    inStock: true,
  },
  {
    id: "no-10lb-bottle",
    name: "Nitrous Outlet 10lb Nitrous Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-10LB-BOTTLE",
    description: "10lb nitrous bottle.",
    category: "nitrous",
    price: 314.99,
    inStock: true,
  },
  {
    id: "nos-sniper-coyote",
    name: "NOS SNIPER PLATE WET NITROUS PLATE SYSTEM 2011-2021 Ford 5.0L V8 Coyote Engine",
    brand: "NOS",
    partNumber: "NOS-SNIPER-COYOTE",
    description: "Sniper plate wet nitrous system for 2011-2021 Ford 5.0L Coyote engine.",
    category: "nitrous",
    price: 767.95,
    inStock: true,
  },
  {
    id: "no-90mm-truck-tbss-10lb",
    name: "Nitrous Outlet 90mm Plate System, 2007-13 GM Truck/Trailblazer SS, 10lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-90MM-TRUCK-TBSS-10LB",
    description: "90mm plate system for 2007-13 GM Truck/Trailblazer SS with 10lb bottle.",
    category: "nitrous",
    price: 1217.99,
    inStock: true,
  },
  {
    id: "no-spare-tire-bracket",
    name: "Nitrous Outlet Spare Tire Bottle Mounting Bracket, 1993-02 F-Body",
    brand: "Nitrous Outlet",
    partNumber: "NO-SPARE-TIRE-BRACKET",
    description: "Spare tire bottle mounting bracket for 1993-02 F-Body.",
    category: "nitrous",
    price: 102.99,
    inStock: true,
  },
  {
    id: "no-dual-vent-windshield",
    name: "Nitrous Outlet Dual Vent Purge, Windshield Exit",
    brand: "Nitrous Outlet",
    partNumber: "NO-DUAL-VENT-WINDSHIELD",
    description: "Dual vent purge with windshield exit.",
    category: "nitrous",
    price: 64.99,
    inStock: true,
  },
  {
    id: "no-truck-102mm-conv",
    name: "Nitrous Outlet GM Truck 102mm Nitrous Plate Conversion",
    brand: "Nitrous Outlet",
    partNumber: "NO-TRUCK-102MM-CONV",
    description: "GM Truck 102mm nitrous plate conversion.",
    category: "nitrous",
    price: 315.99,
    inStock: true,
  },
  {
    id: "no-univ-sn-dry-10lb",
    name: "Nitrous Outlet Universal Single Nozzle Dry Kit, 10lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-UNIV-SN-DRY-10LB",
    description: "Universal single nozzle dry kit with 10lb bottle.",
    category: "nitrous",
    price: 883.99,
    inStock: true,
  },
  {
    id: "no-hardline-fast-90-92",
    name: "Nitrous Outlet Hardline Kit, FAST 90/92mm",
    brand: "Nitrous Outlet",
    partNumber: "NO-HARDLINE-FAST-90-92",
    description: "Hardline kit for FAST 90/92mm throttle bodies.",
    category: "nitrous",
    price: 101.99,
    inStock: true,
  },
  {
    id: "no-lsx-102mm-15lb",
    name: "Nitrous Outlet GM LSX 102mm Plate System, 15lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-LSX-102MM-15LB",
    description: "GM LSX 102mm plate system with 15lb bottle.",
    category: "nitrous",
    price: 1259.99,
    inStock: true,
  },
  {
    id: "no-efi-race-sn-10lb",
    name: "Nitrous Outlet GM EFI Race Single Nozzle Nitrous System, 10lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-EFI-RACE-SN-10LB",
    description: "GM EFI race single nozzle nitrous system with 10lb bottle.",
    category: "nitrous",
    price: 1096.99,
    inStock: true,
  },
  {
    id: "no-lsx-92mm-10lb",
    name: "Nitrous Outlet GM LSX 92mm Plate System, 10lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-LSX-92MM-10LB",
    description: "GM LSX 92mm plate system with 10lb bottle.",
    category: "nitrous",
    price: 1247.99,
    inStock: true,
  },
  {
    id: "no-heated-bracket-6an",
    name: "Nitrous Outlet Heated 10lb/15lb Nitrous Bottle Bracket w/6AN Install Accessories",
    brand: "Nitrous Outlet",
    partNumber: "NO-HEATED-BRACKET-6AN",
    description: "Heated 10lb/15lb nitrous bottle bracket with 6AN install accessories.",
    category: "nitrous",
    price: 327.99,
    inStock: true,
  },
  {
    id: "no-classic-truck-78mm-nb",
    name: "Nitrous Outlet 78mm Plate System, 1999-06 GM Classic Truck, No Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-CLASSIC-TRUCK-78MM-NB",
    description: "78mm plate system for 1999-06 GM Classic Truck, no bottle included.",
    category: "nitrous",
    price: 991.99,
    inStock: true,
  },
  {
    id: "no-fast-90mm-c6-15lb",
    name: "Nitrous Outlet 90mm FAST Plate System, 2005-13 C6 Corvette, 15lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-FAST-90MM-C6-15LB",
    description: "90mm FAST plate system for 2005-13 C6 Corvette with 15lb bottle.",
    category: "nitrous",
    price: 1319.99,
    inStock: true,
  },
  {
    id: "no-fast-102mm-camaro-15lb",
    name: "Nitrous Outlet 102mm FAST Intake Plate System, 2010-15 Camaro, 15lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-FAST-102MM-CAMARO-15LB",
    description: "102mm FAST intake plate system for 2010-15 Camaro with 15lb bottle.",
    category: "nitrous",
    price: 1358.99,
    inStock: true,
  },
  {
    id: "no-fast-102mm-hl-15lb",
    name: "Nitrous Outlet 102mm FAST Intake Hard-Lined Plate System, 15lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-FAST-102MM-HL-15LB",
    description: "102mm FAST intake hard-lined plate system with 15lb bottle.",
    category: "nitrous",
    price: 1282.99,
    inStock: true,
  },
  {
    id: "no-dual-voltage-heater",
    name: "Nitrous Outlet Dual Voltage Wrap Around Bottle Heater - 110v/12v",
    brand: "Nitrous Outlet",
    partNumber: "NO-DUAL-VOLTAGE-HEATER",
    description: "Dual voltage wrap around bottle heater - 110v/12v.",
    category: "nitrous",
    price: 132.99,
    inStock: true,
  },
  {
    id: "no-ls9-blower-nb",
    name: "Nitrous Outlet LS9 Blower Plate System, No Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-LS9-BLOWER-NB",
    description: "LS9 blower plate system, no bottle included.",
    category: "nitrous",
    price: 2268.99,
    inStock: true,
  },
  {
    id: "no-c7-lt1-hl-10lb",
    name: "Nitrous Outlet Hard-line Plate System, C7 Corvette LT1, 10lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-C7-LT1-HL-10LB",
    description: "Hard-line plate system for C7 Corvette LT1 with 10lb bottle.",
    category: "nitrous",
    price: 1344.99,
    inStock: true,
  },
  {
    id: "nos-plate-wet-gm",
    name: "NOS PLATE WET NITROUS SYSTEM - GM",
    brand: "NOS",
    partNumber: "NOS-PLATE-WET-GM",
    description: "Plate wet nitrous system for GM applications.",
    category: "nitrous",
    price: 1177.95,
    inStock: true,
  },
  {
    id: "nx-ls-solenoid-bracket",
    name: "Nitrous Express LS Solenoid Bracket (Passenger Side Head)",
    brand: "Nitrous Express",
    partNumber: "NX-LS-SOLENOID-BRACKET",
    description: "LS solenoid bracket for passenger side head.",
    category: "nitrous",
    price: 40.03,
    inStock: true,
  },
  {
    id: "nos-4an-purge-valve-blk",
    name: "NOS -4AN NITROUS BOTTLE PURGE VALVE-BLACK",
    brand: "NOS",
    partNumber: "NOS-4AN-PURGE-VALVE-BLK",
    description: "-4AN nitrous bottle purge valve in black.",
    category: "nitrous",
    price: 184.45,
    originalPrice: 204.95,
    inStock: true,
  },
  {
    id: "no-univ-efi-sn-10lb",
    name: "Nitrous Outlet Universal EFI Single Nozzle Nitrous System, 10lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-UNIV-EFI-SN-10LB",
    description: "Universal EFI single nozzle nitrous system with 10lb bottle.",
    category: "nitrous",
    price: 1129.99,
    inStock: true,
  },
  {
    id: "no-dry-92mm-lsx-10lb",
    name: "Nitrous Outlet Dry 92mm LSx Plate System, 10lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-DRY-92MM-LSX-10LB",
    description: "Dry 92mm LSx plate system with 10lb bottle.",
    category: "nitrous",
    price: 1078.99,
    inStock: true,
  },
  {
    id: "no-x-gm-efi-sn-10lb",
    name: "Nitrous Outlet X-Series GM EFI Single Nozzle Nitrous System, 10lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-X-GM-EFI-SN-10LB",
    description: "X-Series GM EFI single nozzle nitrous system with 10lb bottle.",
    category: "nitrous",
    price: 771.99,
    inStock: true,
  },
  {
    id: "no-6an-purge-kit",
    name: "Nitrous Outlet 6AN Purge Kit",
    brand: "Nitrous Outlet",
    partNumber: "NO-6AN-PURGE-KIT",
    description: "6AN purge kit.",
    category: "nitrous",
    price: 192.99,
    inStock: true,
  },
  {
    id: "nx-jet-pack-fbw",
    name: "Nitrous Express Jet Pack For Fly By Wire Single Nozzle Systems",
    brand: "Nitrous Express",
    partNumber: "NX-JET-PACK-FBW",
    description: "Jet pack for fly by wire single nozzle systems.",
    category: "nitrous",
    price: 93.37,
    inStock: true,
  },
  {
    id: "nx-ls-90mm-5lb",
    name: "Nitrous Express LS 90mm Nitrous Plate System (50-400hp), 5lb Bottle",
    brand: "Nitrous Express",
    partNumber: "NX-LS-90MM-5LB",
    description: "LS 90mm nitrous plate system (50-400hp) with 5lb bottle.",
    category: "nitrous",
    price: 934.91,
    inStock: true,
  },
  {
    id: "no-fast-90mm-gto-10lb",
    name: "Nitrous Outlet 90mm FAST Plate System, 2004-06 GTO, 10lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-FAST-90MM-GTO-10LB",
    description: "90mm FAST plate system for 2004-06 GTO with 10lb bottle.",
    category: "nitrous",
    price: 1281.99,
    inStock: true,
  },
  {
    id: "no-90mm-camaro-10lb",
    name: "Nitrous Outlet 90mm Plate System, 2010-15 Camaro, 10lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-90MM-CAMARO-10LB",
    description: "90mm plate system for 2010-15 Camaro with 10lb bottle.",
    category: "nitrous",
    price: 1328.99,
    inStock: true,
  },
  {
    id: "nx-proton-plus-15lb",
    name: "Nitrous Express Proton Plus Single Nozzle Nitrous System, 15lb Bottle",
    brand: "Nitrous Express",
    partNumber: "NX-PROTON-PLUS-15LB",
    description: "Proton Plus single nozzle nitrous system with 15lb bottle.",
    category: "nitrous",
    price: 617.49,
    inStock: true,
  },
  {
    id: "no-90mm-camaro-nb",
    name: "Nitrous Outlet 90mm Plate System, 2010-15 Camaro, No Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-90MM-CAMARO-NB",
    description: "90mm plate system for 2010-15 Camaro, no bottle included.",
    category: "nitrous",
    price: 1108.99,
    inStock: true,
  },
  {
    id: "no-micro-wot-switch",
    name: "Nitrous Outlet Micro WOT Switch & Bracket",
    brand: "Nitrous Outlet",
    partNumber: "NO-MICRO-WOT-SWITCH",
    description: "Micro WOT switch and bracket.",
    category: "nitrous",
    price: 10.99,
    inStock: true,
  },
  {
    id: "no-90mm-lsx-truck-10lb",
    name: "Nitrous Outlet 90mm LSX Truck Plate System, 10lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-90MM-LSX-TRUCK-10LB",
    description: "90mm LSX truck plate system with 10lb bottle.",
    category: "nitrous",
    price: 1230.99,
    inStock: true,
  },
  {
    id: "nx-ls-90mm-10lb",
    name: "Nitrous Express LS 90mm Nitrous Plate System (50-400hp), 10lb Bottle",
    brand: "Nitrous Express",
    partNumber: "NX-LS-90MM-10LB",
    description: "LS 90mm nitrous plate system (50-400hp) with 10lb bottle.",
    category: "nitrous",
    price: 945.66,
    inStock: true,
  },
  {
    id: "no-fast-90mm-c5-15lb",
    name: "Nitrous Outlet 90mm FAST Plate System, 1997-04 Corvette, 15lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-FAST-90MM-C5-15LB",
    description: "90mm FAST plate system for 1997-04 Corvette with 15lb bottle.",
    category: "nitrous",
    price: 1356.99,
    inStock: true,
  },
  {
    id: "nos-plate-camaro-ls3",
    name: "NOS PLATE WET NITROUS SYSTEM - GM Camaro LS3",
    brand: "NOS",
    partNumber: "NOS-PLATE-CAMARO-LS3",
    description: "Plate wet nitrous system for GM Camaro LS3.",
    category: "nitrous",
    price: 1399.95,
    inStock: true,
  },
  {
    id: "no-fast-102mm-camaro-10lb",
    name: "Nitrous Outlet 102mm FAST Intake Plate System, 2010-15 Camaro, 10lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-FAST-102MM-CAMARO-10LB",
    description: "102mm FAST intake plate system for 2010-15 Camaro with 10lb bottle.",
    category: "nitrous",
    price: 1321.99,
    inStock: true,
  },
  {
    id: "no-102mm-ctsv-15lb",
    name: "Nitrous Outlet 102mm Plate System, 2009-14 Cadillac CTS-V, 15lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-102MM-CTSV-15LB",
    description: "102mm plate system for 2009-14 Cadillac CTS-V with 15lb bottle.",
    category: "nitrous",
    price: 1289.99,
    inStock: true,
  },
  {
    id: "nx-auto-heater-no-gauge",
    name: "Nitrous Express Fully Automatic Bottle Heater, No Nitrous Gauge",
    brand: "Nitrous Express",
    partNumber: "NX-AUTO-HEATER-NO-GAUGE",
    description: "Fully automatic bottle heater, no nitrous gauge included.",
    category: "nitrous",
    price: 306.04,
    inStock: true,
  },
  {
    id: "no-lsx-102mm-10lb",
    name: "Nitrous Outlet GM LSX 102mm Plate System, 10lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-LSX-102MM-10LB",
    description: "GM LSX 102mm plate system with 10lb bottle.",
    category: "nitrous",
    price: 1221.99,
    inStock: true,
  },
  {
    id: "nx-auto-heater-gauge",
    name: "Nitrous Express Fully Automatic Bottle Heater w/Nitrous Gauge",
    brand: "Nitrous Express",
    partNumber: "NX-AUTO-HEATER-GAUGE",
    description: "Fully automatic bottle heater with nitrous gauge.",
    category: "nitrous",
    price: 368.74,
    inStock: true,
  },
  {
    id: "no-3an-purge-tubing",
    name: "Nitrous Outlet Replacement 3AN Purge Tubing, 3 Foot",
    brand: "Nitrous Outlet",
    partNumber: "NO-3AN-PURGE-TUBING",
    description: "Replacement 3AN purge tubing, 3 foot length.",
    category: "nitrous",
    price: 11.99,
    inStock: true,
  },
  {
    id: "no-lsa-blower-15lb",
    name: "Nitrous Outlet Supercharger Blower Plate System, LSA CTS-V & ZL1, 15lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-LSA-BLOWER-15LB",
    description: "Supercharger blower plate system for LSA CTS-V & ZL1 with 15lb bottle.",
    category: "nitrous",
    price: 2600.99,
    inStock: true,
  },
  {
    id: "no-fast-92mm-c5-10lb",
    name: "Nitrous Outlet 92mm FAST Plate System, 1997-04 Corvette, 10lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-FAST-92MM-C5-10LB",
    description: "92mm FAST plate system for 1997-04 Corvette with 10lb bottle.",
    category: "nitrous",
    price: 1308.99,
    inStock: true,
  },
  {
    id: "no-gm-efi-dual-10lb",
    name: "Nitrous Outlet GM EFI Dual Nozzle Nitrous System, 10lb Bottle",
    brand: "Nitrous Outlet",
    partNumber: "NO-GM-EFI-DUAL-10LB",
    description: "GM EFI dual nozzle nitrous system with 10lb bottle.",
    category: "nitrous",
    price: 1225.99,
    inStock: true,
  },
];

const categoryLabels: Record<string, string> = {
  turbo: "Turbochargers",
  supercharger: "Superchargers",
  nitrous: "Nitrous Systems",
  intercooler: "Intercoolers",
  wastegate: "Wastegates",
  "blow-off-valve": "Blow-Off Valves",
  piping: "Piping & Plumbing",
  accessories: "Accessories",
};

const categoryIcons: Record<string, string | React.ReactNode> = {
  turbo: null, // Uses image instead
  supercharger: "🌪️",
  nitrous: "❄️",
  intercooler: "🧱",
  wastegate: "⚙️",
  "blow-off-valve": "💥",
  piping: "🔩",
  accessories: "🛠️",
};

const TURBO_ICON_PATH = "/shop/power adders/turbos+/25780.webp";

export default function PowerAddersPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState<CheckoutForm>({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState<{
    orderNumber: string;
    total: number;
    paypalUrl: string;
  } | null>(null);

  // Get unique brands
  const uniqueBrands = useMemo(() => {
    const brands = [...new Set(powerAdderProducts.map((p) => p.brand))];
    return brands.sort();
  }, []);

  // Filter products
  const filteredProducts = useMemo(() => {
    return powerAdderProducts.filter((product) => {
      if (selectedCategory !== "all" && product.category !== selectedCategory) return false;
      if (selectedBrand !== "all" && product.brand !== selectedBrand) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          product.name.toLowerCase().includes(query) ||
          product.brand.toLowerCase().includes(query) ||
          product.partNumber.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [selectedCategory, selectedBrand, searchQuery]);

  // Cart functions
  const addToCart = (product: PowerAdderProduct) => {
    if (!product.inStock) {
      alert("This item is currently out of stock");
      return;
    }
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          brand: product.brand,
          partNumber: product.partNumber,
          price: product.price,
          quantity: 1,
          image: getProductImage(product.id),
          shippingCost: product.shippingCost,
        },
      ];
    });
    setCartOpen(true);
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : item;
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  // Calculate shipping - use highest custom shipping or default
  const cartShipping = useMemo(() => {
    if (cart.length === 0) return 0;
    const customShipping = cart.filter(item => item.shippingCost).map(item => item.shippingCost || 0);
    if (customShipping.length > 0) {
      return Math.max(...customShipping);
    }
    return SHIPPING_COST;
  }, [cart]);

  // Calculate tax based on state
  const cartTax = useMemo(() => {
    if (!checkoutForm.state) return 0;
    const taxResult = calculateSalesTax(cartSubtotal, checkoutForm.state);
    return taxResult.taxAmount;
  }, [cartSubtotal, checkoutForm.state]);

  const cartTotal = cartSubtotal + cartShipping + cartTax;

  const handleCheckout = async () => {
    if (!checkoutForm.name || !checkoutForm.email || !checkoutForm.phone || 
        !checkoutForm.address || !checkoutForm.city || !checkoutForm.state || !checkoutForm.zip) {
      alert("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const orderNumber = `PA-${Date.now().toString(36).toUpperCase()}`;
      
      // Create PayPal.me link with total
      const paypalUsername = "CamSpecElite";
      const paypalUrl = `https://paypal.me/${paypalUsername}/${cartTotal.toFixed(2)}`;
      
      // Here you would typically send the order to your backend
      // For now, simulate order creation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setOrderComplete({
        orderNumber,
        total: cartTotal,
        paypalUrl,
      });
    } catch {
      alert("Error processing order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetOrder = () => {
    setCart([]);
    setCartOpen(false);
    setCheckoutOpen(false);
    setOrderComplete(null);
    setCheckoutForm({
      name: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      zip: "",
      notes: "",
    });
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 50%, #16213e 100%)", color: "#e2e8f0" }}>
      {/* Header */}
      <div style={{ background: "rgba(20, 20, 40, 0.9)", borderBottom: "1px solid rgba(255, 100, 50, 0.2)", padding: "20px 0" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <Link href="/shop" style={{ color: "#ff6432", textDecoration: "none", fontSize: 14, marginBottom: 8, display: "block" }}>
                ← Back to Shop
              </Link>
              <h1 style={{ fontSize: 32, fontWeight: 700, background: "linear-gradient(135deg, #ff6432, #ff8c32)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Power Adders
              </h1>
              <p style={{ color: "#94a3b8", marginTop: 4 }}>Turbos, Superchargers, Nitrous & More</p>
            </div>
            
            {/* Cart Button */}
            <button
              onClick={() => setCartOpen(true)}
              style={{
                position: "relative",
                background: "linear-gradient(135deg, #ff6432, #ff8c32)",
                border: "none",
                borderRadius: 12,
                padding: "12px 24px",
                color: "white",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              🛒 Cart
              {cart.length > 0 && (
                <span style={{
                  position: "absolute",
                  top: -8,
                  right: -8,
                  background: "#ef4444",
                  borderRadius: "50%",
                  width: 24,
                  height: 24,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 700,
                }}>
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "30px 20px" }}>
        {/* Category Tiles */}
        <div style={{ marginBottom: 30 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Browse by Category</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12 }}>
            <button
              onClick={() => setSelectedCategory("all")}
              style={{
                padding: "16px 12px",
                background: selectedCategory === "all" ? "linear-gradient(135deg, #ff6432, #ff8c32)" : "rgba(30, 30, 50, 0.8)",
                border: selectedCategory === "all" ? "none" : "1px solid rgba(255, 100, 50, 0.3)",
                borderRadius: 12,
                color: "white",
                cursor: "pointer",
                textAlign: "center",
                transition: "all 0.2s",
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 6 }}>🔥</div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>All Products</div>
            </button>
            {Object.entries(categoryLabels).map(([key, label]) => {
              const count = powerAdderProducts.filter(p => p.category === key).length;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedCategory(key)}
                  style={{
                    padding: "16px 12px",
                    background: selectedCategory === key ? "linear-gradient(135deg, #ff6432, #ff8c32)" : "rgba(30, 30, 50, 0.8)",
                    border: selectedCategory === key ? "none" : "1px solid rgba(255, 100, 50, 0.3)",
                    borderRadius: 12,
                    color: "white",
                    cursor: "pointer",
                    textAlign: "center",
                    transition: "all 0.2s",
                  }}
                >
                  <div style={{ fontSize: 28, marginBottom: 6, display: "flex", justifyContent: "center", alignItems: "center" }}>
                    {key === "turbo" ? (
                      <img src={TURBO_ICON_PATH} alt="Turbo" style={{ width: 32, height: 32, objectFit: "contain", borderRadius: 4 }} />
                    ) : (
                      categoryIcons[key]
                    )}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{label}</div>
                  <div style={{ fontSize: 11, color: selectedCategory === key ? "rgba(255,255,255,0.8)" : "#64748b", marginTop: 2 }}>
                    {count} items
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filters Row */}
        <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
          {/* Search */}
          <div style={{ flex: "1 1 300px" }}>
            <input
              type="text"
              placeholder="Search power adders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                ...inputStyle,
                paddingLeft: 40,
                backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'/%3E%3C/svg%3E\")",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "12px center",
                backgroundSize: "20px",
              }}
            />
          </div>

          {/* Brand Filter */}
          <div style={{ flex: "0 1 200px" }}>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              <option value="all">All Brands</option>
              {uniqueBrands.map((brand) => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div style={{ marginBottom: 16, color: "#94a3b8" }}>
          Showing {filteredProducts.length} of {powerAdderProducts.length} products
        </div>

        {/* Product Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              style={{
                background: "rgba(30, 30, 50, 0.8)",
                border: "1px solid rgba(255, 100, 50, 0.2)",
                borderRadius: 16,
                overflow: "hidden",
                transition: "all 0.2s",
              }}
            >
              {/* Product Image */}
              <div style={{
                height: 160,
                background: "linear-gradient(135deg, rgba(255, 100, 50, 0.1), rgba(255, 140, 50, 0.05))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 64,
                position: "relative",
              }}>
                {getProductImage(product.id) && (
                  <Image 
                    src={getProductImage(product.id)} 
                    alt={product.name} 
                    fill 
                    style={{ objectFit: "contain", padding: 8 }} 
                  />
                )}
                {!product.inStock && (
                  <div style={{
                    position: "absolute",
                    top: 12,
                    right: 12,
                    background: "#ef4444",
                    color: "white",
                    padding: "4px 12px",
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 600,
                  }}>
                    Out of Stock
                  </div>
                )}
                {product.power && (
                  <div style={{
                    position: "absolute",
                    bottom: 12,
                    left: 12,
                    background: "rgba(0,0,0,0.7)",
                    color: "#ff6432",
                    padding: "4px 10px",
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                  }}>
                    {product.power}
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div style={{ padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <span style={{
                    background: "rgba(255, 100, 50, 0.2)",
                    color: "#ff8c32",
                    padding: "4px 10px",
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 500,
                  }}>
                    {product.category === "turbo" ? (
                      <><img src={TURBO_ICON_PATH} alt="" style={{ width: 14, height: 14, objectFit: "contain", verticalAlign: "middle", marginRight: 4 }} />{categoryLabels[product.category]}</>
                    ) : (
                      <>{categoryIcons[product.category]} {categoryLabels[product.category]}</>
                    )}
                  </span>
                  <span style={{ color: "#64748b", fontSize: 12 }}>{product.brand}</span>
                </div>

                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 6, lineHeight: 1.3 }}>{product.name}</h3>
                <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>P/N: {product.partNumber}</p>
                <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 16, lineHeight: 1.5 }}>{product.description}</p>

                {/* Specs Preview */}
                {product.specs && (
                  <div style={{ marginBottom: 16 }}>
                    {Object.entries(product.specs).slice(0, 3).map(([key, value]) => (
                      <div key={key} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                        <span style={{ color: "#64748b" }}>{key}:</span>
                        <span style={{ color: "#e2e8f0" }}>{value}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Price & Add to Cart */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ fontSize: 24, fontWeight: 700, color: "#22c55e" }}>
                      ${product.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    {product.compareAtPrice && (
                      <span style={{ fontSize: 14, color: "#64748b", textDecoration: "line-through", marginLeft: 8 }}>
                        ${product.compareAtPrice.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => addToCart(product)}
                    disabled={!product.inStock}
                    style={{
                      background: product.inStock ? "linear-gradient(135deg, #ff6432, #ff8c32)" : "#374151",
                      border: "none",
                      borderRadius: 8,
                      padding: "10px 20px",
                      color: "white",
                      cursor: product.inStock ? "pointer" : "not-allowed",
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  >
                    {product.inStock ? "Add to Cart" : "Sold Out"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <h3 style={{ fontSize: 20, marginBottom: 8, color: "#e2e8f0" }}>No products found</h3>
            <p>Try adjusting your filters or search query</p>
          </div>
        )}
      </div>

      {/* Cart Drawer */}
      {cartOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000 }}>
          <div
            style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)" }}
            onClick={() => setCartOpen(false)}
          />
          <div style={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            width: "100%",
            maxWidth: 480,
            background: "linear-gradient(135deg, #1a1a2e, #16213e)",
            boxShadow: "-4px 0 20px rgba(0,0,0,0.4)",
            display: "flex",
            flexDirection: "column",
          }}>
            {/* Cart Header */}
            <div style={{ padding: 20, borderBottom: "1px solid rgba(255, 100, 50, 0.2)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: 20, fontWeight: 600 }}>🛒 Your Cart</h2>
              <button
                onClick={() => setCartOpen(false)}
                style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 24 }}
              >
                ×
              </button>
            </div>

            {/* Cart Items */}
            <div style={{ flex: 1, overflow: "auto", padding: 20 }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>🛒</div>
                  <p>Your cart is empty</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {cart.map((item) => (
                    <div key={item.id} style={{
                      background: "rgba(30, 30, 50, 0.8)",
                      borderRadius: 12,
                      padding: 16,
                      display: "flex",
                      gap: 16,
                    }}>
                      <div style={{
                        width: 64,
                        height: 64,
                        background: "rgba(255, 100, 50, 0.1)",
                        borderRadius: 8,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 28,
                        flexShrink: 0,
                        position: "relative",
                        overflow: "hidden",
                      }}>
                        {item.image && <Image src={item.image} alt={item.name} fill style={{ objectFit: "contain", padding: 4 }} />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{item.name}</h4>
                        <p style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>{item.brand} • {item.partNumber}</p>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <button
                              onClick={() => updateQuantity(item.id, -1)}
                              style={{
                                width: 28,
                                height: 28,
                                background: "rgba(255, 100, 50, 0.2)",
                                border: "none",
                                borderRadius: 6,
                                color: "white",
                                cursor: "pointer",
                              }}
                            >
                              −
                            </button>
                            <span style={{ width: 30, textAlign: "center" }}>{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, 1)}
                              style={{
                                width: 28,
                                height: 28,
                                background: "rgba(255, 100, 50, 0.2)",
                                border: "none",
                                borderRadius: 6,
                                color: "white",
                                cursor: "pointer",
                              }}
                            >
                              +
                            </button>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <span style={{ fontWeight: 600, color: "#22c55e" }}>
                              ${(item.price * item.quantity).toFixed(2)}
                            </span>
                            <button
                              onClick={() => removeFromCart(item.id)}
                              style={{
                                background: "none",
                                border: "none",
                                color: "#ef4444",
                                cursor: "pointer",
                                fontSize: 18,
                              }}
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cart Footer */}
            {cart.length > 0 && (
              <div style={{ borderTop: "1px solid rgba(255, 100, 50, 0.2)", padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ color: "#94a3b8" }}>Subtotal</span>
                  <span>${cartSubtotal.toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ color: "#94a3b8" }}>Shipping</span>
                  <span>${cartShipping.toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, paddingTop: 8, borderTop: "1px solid rgba(255, 100, 50, 0.1)" }}>
                  <span style={{ fontWeight: 600 }}>Total</span>
                  <span style={{ fontWeight: 700, fontSize: 20, color: "#22c55e" }}>${(cartSubtotal + cartShipping).toFixed(2)}</span>
                </div>
                <p style={{ fontSize: 12, color: "#64748b", marginBottom: 16, textAlign: "center" }}>
                  Tax calculated at checkout based on shipping state
                </p>
                <button
                  onClick={() => setCheckoutOpen(true)}
                  style={{
                    width: "100%",
                    padding: "14px 20px",
                    background: "linear-gradient(135deg, #ff6432, #ff8c32)",
                    border: "none",
                    borderRadius: 10,
                    color: "white",
                    fontSize: 16,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Proceed to Checkout
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {checkoutOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1001, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div
            style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)" }}
            onClick={() => !orderComplete && setCheckoutOpen(false)}
          />
          <div style={{
            position: "relative",
            background: "linear-gradient(135deg, #1a1a2e, #16213e)",
            borderRadius: 20,
            width: "100%",
            maxWidth: 500,
            maxHeight: "90vh",
            overflow: "auto",
            margin: 20,
          }}>
            {orderComplete ? (
              // Order Confirmation
              <div style={{ padding: 40, textAlign: "center" }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
                <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Order Placed!</h2>
                <p style={{ color: "#94a3b8", marginBottom: 24 }}>Order #{orderComplete.orderNumber}</p>
                
                <div style={{
                  background: "rgba(34, 197, 94, 0.1)",
                  border: "1px solid rgba(34, 197, 94, 0.3)",
                  borderRadius: 12,
                  padding: 20,
                  marginBottom: 24,
                }}>
                  <p style={{ marginBottom: 12 }}>Total: <strong style={{ color: "#22c55e", fontSize: 24 }}>${orderComplete.total.toFixed(2)}</strong></p>
                  <p style={{ fontSize: 14, color: "#94a3b8", marginBottom: 16 }}>Complete your payment via PayPal:</p>
                  <a
                    href={orderComplete.paypalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-block",
                      background: "#0070ba",
                      color: "white",
                      padding: "12px 32px",
                      borderRadius: 8,
                      textDecoration: "none",
                      fontWeight: 600,
                    }}
                  >
                    Pay with PayPal
                  </a>
                </div>

                <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 24 }}>
                  A confirmation email will be sent to {checkoutForm.email}
                </p>

                <button
                  onClick={resetOrder}
                  style={{
                    background: "rgba(255, 100, 50, 0.2)",
                    border: "1px solid rgba(255, 100, 50, 0.3)",
                    borderRadius: 8,
                    padding: "12px 24px",
                    color: "white",
                    cursor: "pointer",
                  }}
                >
                  Close
                </button>
              </div>
            ) : (
              // Checkout Form
              <div style={{ padding: 30 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                  <h2 style={{ fontSize: 22, fontWeight: 700 }}>Checkout</h2>
                  <button
                    onClick={() => setCheckoutOpen(false)}
                    style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 24 }}
                  >
                    ×
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <label style={{ display: "block", marginBottom: 6, fontSize: 14, color: "#94a3b8" }}>Full Name *</label>
                    <input
                      type="text"
                      value={checkoutForm.name}
                      onChange={(e) => setCheckoutForm(f => ({ ...f, name: e.target.value }))}
                      style={inputStyle}
                      required
                    />
                  </div>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div>
                      <label style={{ display: "block", marginBottom: 6, fontSize: 14, color: "#94a3b8" }}>Email *</label>
                      <input
                        type="email"
                        value={checkoutForm.email}
                        onChange={(e) => setCheckoutForm(f => ({ ...f, email: e.target.value }))}
                        style={inputStyle}
                        required
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: 6, fontSize: 14, color: "#94a3b8" }}>Phone *</label>
                      <input
                        type="tel"
                        value={checkoutForm.phone}
                        onChange={(e) => setCheckoutForm(f => ({ ...f, phone: e.target.value }))}
                        style={inputStyle}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: 6, fontSize: 14, color: "#94a3b8" }}>Street Address *</label>
                    <input
                      type="text"
                      value={checkoutForm.address}
                      onChange={(e) => setCheckoutForm(f => ({ ...f, address: e.target.value }))}
                      style={inputStyle}
                      required
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 16 }}>
                    <div>
                      <label style={{ display: "block", marginBottom: 6, fontSize: 14, color: "#94a3b8" }}>City *</label>
                      <input
                        type="text"
                        value={checkoutForm.city}
                        onChange={(e) => setCheckoutForm(f => ({ ...f, city: e.target.value }))}
                        style={inputStyle}
                        required
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: 6, fontSize: 14, color: "#94a3b8" }}>State *</label>
                      <select
                        value={checkoutForm.state}
                        onChange={(e) => setCheckoutForm(f => ({ ...f, state: e.target.value }))}
                        style={{ ...inputStyle, cursor: "pointer" }}
                        required
                      >
                        <option value="">Select</option>
                        {getAllStates().map((st) => (
                          <option key={st.abbr} value={st.abbr}>{st.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: 6, fontSize: 14, color: "#94a3b8" }}>ZIP *</label>
                      <input
                        type="text"
                        value={checkoutForm.zip}
                        onChange={(e) => setCheckoutForm(f => ({ ...f, zip: e.target.value }))}
                        style={inputStyle}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: 6, fontSize: 14, color: "#94a3b8" }}>Order Notes (optional)</label>
                    <textarea
                      value={checkoutForm.notes}
                      onChange={(e) => setCheckoutForm(f => ({ ...f, notes: e.target.value }))}
                      style={{ ...inputStyle, minHeight: 80, resize: "vertical" }}
                      placeholder="Special instructions, vehicle info, etc."
                    />
                  </div>
                </div>

                {/* Order Summary */}
                <div style={{
                  marginTop: 24,
                  padding: 20,
                  background: "rgba(30, 30, 50, 0.8)",
                  borderRadius: 12,
                }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Order Summary</h3>
                  {cart.map((item) => (
                    <div key={item.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 8 }}>
                      <span style={{ color: "#94a3b8" }}>{item.quantity}x {item.name}</span>
                      <span>${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <div style={{ borderTop: "1px solid rgba(255, 100, 50, 0.2)", marginTop: 12, paddingTop: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ color: "#94a3b8" }}>Subtotal</span>
                      <span>${cartSubtotal.toFixed(2)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ color: "#94a3b8" }}>Shipping</span>
                      <span>${cartShipping.toFixed(2)}</span>
                    </div>
                    {checkoutForm.state && (
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <span style={{ color: "#94a3b8" }}>Tax ({formatTaxRate(calculateSalesTax(cartSubtotal, checkoutForm.state).taxRate)})</span>
                        <span>${cartTax.toFixed(2)}</span>
                      </div>
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(255, 100, 50, 0.2)" }}>
                      <span style={{ fontWeight: 600, fontSize: 16 }}>Total</span>
                      <span style={{ fontWeight: 700, fontSize: 20, color: "#22c55e" }}>${cartTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={isSubmitting}
                  style={{
                    width: "100%",
                    marginTop: 20,
                    padding: "16px 20px",
                    background: isSubmitting ? "#374151" : "linear-gradient(135deg, #ff6432, #ff8c32)",
                    border: "none",
                    borderRadius: 10,
                    color: "white",
                    fontSize: 16,
                    fontWeight: 600,
                    cursor: isSubmitting ? "not-allowed" : "pointer",
                  }}
                >
                  {isSubmitting ? "Processing..." : "Place Order"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
