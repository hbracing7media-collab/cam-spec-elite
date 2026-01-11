"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { calculateSalesTax, formatTaxRate, getAllStates } from "@/lib/salesTax";

interface EMSProduct {
  id: string;
  name: string;
  brand: string;
  partNumber: string;
  description: string;
  category: "ecus" | "wideband" | "sensors" | "ignition" | "wiring" | "gauges" | "datalogging" | "accessories";
  price: number;
  compareAtPrice?: number;
  inStock: boolean;
  image: string;
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

const SHIPPING_COST = 14.99;

// Calculate shipping cost based on product price for MaxxECU items
// Tiered shipping: $5 (under $50) to $30 (over $2000)
function getShippingCostByPrice(price: number): number {
  if (price < 50) return 5;
  if (price < 200) return 8;
  if (price < 500) return 12;
  if (price < 1000) return 18;
  if (price < 2000) return 24;
  return 30; // $2000+
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  background: "rgba(30, 30, 50, 0.8)",
  border: "1px solid rgba(0, 200, 255, 0.3)",
  borderRadius: 8,
  color: "#e2e8f0",
  fontSize: 14,
  outline: "none",
};

// Engine management products - MaxxECU 2025 (Organized to match maxxecu.com website structure)
const emsProducts: EMSProduct[] = [
  // ============================================================================
  // SECTION 1: STANDALONE ECU KITS (Ordered: MINI → STREET → SPORT → RACE → RACE H2O → PRO)
  // ============================================================================
  
  // --- MINI Kits ---
  { id: "maxx-1997", name: "MaxxECU MINI BASIC", brand: "MaxxECU", partNumber: "1997", description: "MINI ECU with connectors and accessories.", category: "ecus", price: 737.23, inStock: true, image: "/shop/maxxecu_mini--03.jpg", isRealImage: true },
  { id: "maxx-1998", name: "MaxxECU MINI STANDARD", brand: "MaxxECU", partNumber: "1998", description: "MINI ECU with harness and accessories.", category: "ecus", price: 760.27, inStock: true, image: "/shop/maxxecu_mini--03.jpg", isRealImage: true },
  { id: "maxx-2264", name: "MaxxECU MINI STANDARD (no CAN)", brand: "MaxxECU", partNumber: "2264", description: "MINI ECU with harness and accessories, without internal CAN resistor.", category: "ecus", price: 760.27, inStock: true, image: "/shop/maxxecu_mini--03.jpg", isRealImage: true },
  
  // --- STREET Kits ---
  { id: "maxx-1812", name: "MaxxECU STREET STANDARD", brand: "MaxxECU", partNumber: "1812", description: "Complete STREET package with ECU, harness and accessories.", category: "ecus", price: 1048.25, inStock: true, image: "/shop/maxxecu_street.jpg", isRealImage: true },
  { id: "maxx-1765", name: "MaxxECU STREET PREMIUM (LSU 4.2)", brand: "MaxxECU", partNumber: "1765", description: "STREET ECU with harness, accessories and Bosch LSU 4.2 wideband sensor.", category: "ecus", price: 1151.92, inStock: true, image: "/shop/maxxecu_street.jpg", isRealImage: true },
  { id: "maxx-2249", name: "MaxxECU STREET PREMIUM (LSU 4.9)", brand: "MaxxECU", partNumber: "2249", description: "STREET ECU with harness, accessories and Bosch LSU 4.9 wideband sensor.", category: "ecus", price: 1174.96, inStock: true, image: "/shop/maxxecu_street.jpg", isRealImage: true },
  
  // --- SPORT Kits ---
  { id: "maxx-1916", name: "MaxxECU SPORT STANDARD", brand: "MaxxECU", partNumber: "1916", description: "Complete SPORT package with ECU, harness and accessories.", category: "ecus", price: 1451.42, inStock: true, image: "/shop/maxxecu_sport--02.png", isRealImage: true },
  { id: "maxx-1917", name: "MaxxECU SPORT PREMIUM (LSU 4.2)", brand: "MaxxECU", partNumber: "1917", description: "SPORT ECU with harness, accessories and LSU 4.2 wideband.", category: "ecus", price: 1566.61, inStock: true, image: "/shop/maxxecu_sport--02.png", isRealImage: true },
  { id: "maxx-2250", name: "MaxxECU SPORT PREMIUM (LSU 4.9)", brand: "MaxxECU", partNumber: "2250", description: "SPORT ECU with harness, accessories and LSU 4.9 wideband.", category: "ecus", price: 1566.61, inStock: true, image: "/shop/maxxecu_sport--02.png", isRealImage: true },
  
  // --- RACE Kits ---
  { id: "maxx-1817", name: "MaxxECU RACE STANDARD", brand: "MaxxECU", partNumber: "1817", description: "Complete RACE package with ECU, harness 1 and accessories.", category: "ecus", price: 1862.65, inStock: true, image: "/shop/maxxecu_race--02.png", isRealImage: true },
  { id: "maxx-1786", name: "MaxxECU RACE PREMIUM (LSU 4.2)", brand: "MaxxECU", partNumber: "1786", description: "RACE ECU with harnesses, accessories and LSU 4.2 wideband.", category: "ecus", price: 2007.80, inStock: true, image: "/shop/maxxecu_race--02.png", isRealImage: true },
  { id: "maxx-2251", name: "MaxxECU RACE PREMIUM (LSU 4.9)", brand: "MaxxECU", partNumber: "2251", description: "RACE ECU with harnesses, accessories and LSU 4.9 wideband.", category: "ecus", price: 2007.80, inStock: true, image: "/shop/maxxecu_race--02.png", isRealImage: true },
  
  // --- RACE H2O Kits ---
  { id: "maxx-1897", name: "MaxxECU RACE H2O PREMIUM (LSU 4.2)", brand: "MaxxECU", partNumber: "1897", description: "Waterproof RACE ECU with harnesses, accessories and LSU 4.2.", category: "ecus", price: 2050.42, inStock: true, image: "/shop/maxxecu_race--02.png", isRealImage: true },
  { id: "maxx-2252", name: "MaxxECU RACE H2O PREMIUM (LSU 4.9)", brand: "MaxxECU", partNumber: "2252", description: "Waterproof RACE ECU with harnesses, accessories and LSU 4.9.", category: "ecus", price: 2050.42, inStock: true, image: "/shop/maxxecu_race--02.png", isRealImage: true },
  
  // --- PRO Kits ---
  { id: "maxx-1613", name: "MaxxECU PRO STANDARD", brand: "MaxxECU", partNumber: "1613", description: "Complete PRO package for professional applications.", category: "ecus", price: 2787.65, inStock: true, image: "/shop/maxxecu_pro--02.png", isRealImage: true },
  { id: "maxx-1624", name: "MaxxECU PRO PREMIUM (LSU 4.2)", brand: "MaxxECU", partNumber: "1624", description: "PRO ECU with harnesses, accessories and LSU 4.2 wideband.", category: "ecus", price: 3329.05, inStock: true, image: "/shop/maxxecu_pro--02.png", isRealImage: true },
  { id: "maxx-2253", name: "MaxxECU PRO PREMIUM (LSU 4.9)", brand: "MaxxECU", partNumber: "2253", description: "PRO ECU with harnesses, accessories and LSU 4.9 wideband.", category: "ecus", price: 3329.05, inStock: true, image: "/shop/maxxecu_pro--02.png", isRealImage: true },

  // ============================================================================
  // SECTION 2: ECU UNITS ONLY (No accessories - Ordered: MINI board → MINI → STREET → SPORT → RACE → RACE H2O → PRO)
  // ============================================================================
  
  // --- MINI Units ---
  { id: "maxx-2125", name: "MaxxECU MINI board", brand: "MaxxECU", partNumber: "2125", description: "MINI ECU board for custom installations.", category: "ecus", price: 552.92, inStock: true, image: "/shop/maxxecu_mini--03.jpg", isRealImage: true },
  { id: "maxx-2333", name: "MaxxECU MINI board with connector", brand: "MaxxECU", partNumber: "2333", description: "MINI ECU board with connector for custom installations.", category: "ecus", price: 575.96, inStock: true, image: "/shop/maxxecu_mini--03.jpg", isRealImage: true },
  { id: "maxx-1995", name: "MaxxECU MINI unit (no accessories)", brand: "MaxxECU", partNumber: "1995", description: "Compact standalone ECU for smaller engines and tight spaces.", category: "ecus", price: 708.43, inStock: true, image: "/shop/maxxecu_mini--03.jpg", isRealImage: true },
  { id: "maxx-2209", name: "MaxxECU MINI unit (no CAN resistor)", brand: "MaxxECU", partNumber: "2209", description: "MINI ECU without internal CAN resistor for CAN bus integration.", category: "ecus", price: 708.43, inStock: true, image: "/shop/maxxecu_mini--03.jpg", isRealImage: true },
  { id: "maxx-2300", name: "MaxxECU MINI (threaded MAP)", brand: "MaxxECU", partNumber: "2300", description: "MINI ECU with threaded MAP sensor connection.", category: "ecus", price: 708.43, inStock: true, image: "/shop/maxxecu_mini--03.jpg", isRealImage: true },
  { id: "maxx-2301", name: "MaxxECU MINI (threaded MAP, no CAN)", brand: "MaxxECU", partNumber: "2301", description: "MINI ECU with threaded MAP, without internal CAN resistor.", category: "ecus", price: 708.43, inStock: true, image: "/shop/maxxecu_mini--03.jpg", isRealImage: true },
  
  // --- STREET Unit ---
  { id: "maxx-1814", name: "MaxxECU STREET unit (no accessories)", brand: "MaxxECU", partNumber: "1814", description: "Entry-level standalone ECU for street applications. No accessories included.", category: "ecus", price: 967.61, inStock: true, image: "/shop/maxxecu_street.jpg", isRealImage: true },
  
  // --- SPORT Unit ---
  { id: "maxx-1914", name: "MaxxECU SPORT unit (no accessories)", brand: "MaxxECU", partNumber: "1914", description: "Mid-range standalone ECU for performance applications.", category: "ecus", price: 1359.27, inStock: true, image: "/shop/maxxecu_sport--02.png", isRealImage: true },
  
  // --- RACE Unit ---
  { id: "maxx-1816", name: "MaxxECU RACE unit (no accessories)", brand: "MaxxECU", partNumber: "1816", description: "High-performance standalone ECU for racing applications.", category: "ecus", price: 1589.65, inStock: true, image: "/shop/maxxecu_race--02.png", isRealImage: true },
  
  // --- RACE H2O Unit ---
  { id: "maxx-1895", name: "MaxxECU RACE H2O unit (no accessories)", brand: "MaxxECU", partNumber: "1895", description: "Waterproof RACE ECU for marine and extreme environments.", category: "ecus", price: 1727.88, inStock: true, image: "/shop/maxxecu_race--02.png", isRealImage: true },
  
  // --- PRO Unit ---
  { id: "maxx-1815", name: "MaxxECU PRO unit (no accessories)", brand: "MaxxECU", partNumber: "1815", description: "Top-tier standalone ECU for professional motorsport.", category: "ecus", price: 2465.11, inStock: true, image: "/shop/maxxecu_pro--02.png", isRealImage: true },

  // ============================================================================
  // SECTION 3: PLUGIN ECUs (By Vehicle Manufacturer: Audi → BMW → Ford → GM → Mitsubishi → Nissan → Porsche → Toyota)
  // ============================================================================
  
  // --- Audi Plugin ECUs ---
  { id: "maxx-1862", name: "Audi A4 (AEB, AJL) STREET Plugin EXTRA", brand: "MaxxECU", partNumber: "1862", description: "Plug-and-play STREET ECU for Audi A4 1.8T.", category: "ecus", price: 1428.38, inStock: true, image: "/shop/maxxecu_street.jpg", isRealImage: true },
  { id: "maxx-1863", name: "Audi A4 (AEB, AJL) RACE Plugin EXTRA", brand: "MaxxECU", partNumber: "1863", description: "Plug-and-play RACE ECU for Audi A4 1.8T.", category: "ecus", price: 1756.34, inStock: true, image: "/shop/maxxecu_race--02.png", isRealImage: true },
  { id: "maxx-1860", name: "Audi S2 (3B) STREET Plugin EXTRA", brand: "MaxxECU", partNumber: "1860", description: "Plug-and-play STREET ECU for Audi S2 (3B engine).", category: "ecus", price: 1428.38, inStock: true, image: "/shop/maxxecu_street.jpg", isRealImage: true },
  { id: "maxx-1861", name: "Audi S2 (3B) RACE Plugin EXTRA", brand: "MaxxECU", partNumber: "1861", description: "Plug-and-play RACE ECU for Audi S2 (3B engine).", category: "ecus", price: 1756.34, inStock: true, image: "/shop/maxxecu_race--02.png", isRealImage: true },
  { id: "maxx-1921", name: "Audi S2 (3B) RACE Plugin STANDARD", brand: "MaxxECU", partNumber: "1921", description: "Plug-and-play RACE ECU package for Audi S2 (3B).", category: "ecus", price: 1773.96, inStock: true, image: "/shop/maxxecu_race--02.png", isRealImage: true },
  { id: "maxx-1858", name: "Audi S2/S4/S6 (AAN) STREET Plugin EXTRA", brand: "MaxxECU", partNumber: "1858", description: "Plug-and-play STREET ECU for Audi S2/S4/S6 (AAN, ADY, ABY).", category: "ecus", price: 1428.38, inStock: true, image: "/shop/maxxecu_street.jpg", isRealImage: true },
  { id: "maxx-1859", name: "Audi S2/S4/S6 (AAN) RACE Plugin EXTRA", brand: "MaxxECU", partNumber: "1859", description: "Plug-and-play RACE ECU for Audi S2/S4/S6 (AAN, ADY, ABY).", category: "ecus", price: 1756.34, inStock: true, image: "/shop/maxxecu_race--02.png", isRealImage: true },
  { id: "maxx-1919", name: "Audi S2/S4/S6 (AAN) RACE Plugin STANDARD", brand: "MaxxECU", partNumber: "1919", description: "Plug-and-play RACE ECU package for Audi S2/S4/S6.", category: "ecus", price: 1773.96, inStock: true, image: "/shop/maxxecu_race--02.png", isRealImage: true },
  { id: "maxx-1889", name: "Audi S3/A4 1.8T (ME 7.5) RACE Plugin EXTRA", brand: "MaxxECU", partNumber: "1889", description: "Plug-and-play RACE ECU for Audi S3/A4 1.8T ME 7.5.", category: "ecus", price: 1958.26, inStock: true, image: "/shop/maxxecu_race--02.png", isRealImage: true },
  { id: "maxx-1920", name: "Audi S3/A4 1.8T (ME 7.5) RACE Plugin STANDARD", brand: "MaxxECU", partNumber: "1920", description: "Plug-and-play RACE ECU package for Audi S3/A4 1.8T.", category: "ecus", price: 1912.19, inStock: true, image: "/shop/maxxecu_race--02.png", isRealImage: true },
  { id: "maxx-2240", name: "Audi S3/A4 1.8T RACE H2O Plugin EXTRA", brand: "MaxxECU", partNumber: "2240", description: "Waterproof RACE ECU for Audi S3/A4 1.8T.", category: "ecus", price: 2073.46, inStock: true, image: "/shop/maxxecu_race--02.png", isRealImage: true },
  { id: "maxx-1894", name: "Audi S4/RS4 2.7 Biturbo RACE Plugin EXTRA", brand: "MaxxECU", partNumber: "1894", description: "Plug-and-play RACE ECU for Audi S4/RS4 2.7 biturbo.", category: "ecus", price: 1958.26, inStock: true, image: "/shop/maxxecu_race--02.png", isRealImage: true },
  { id: "maxx-1922", name: "Audi S4/RS4 2.7 Biturbo RACE Plugin STANDARD", brand: "MaxxECU", partNumber: "1922", description: "Plug-and-play RACE package for Audi S4/RS4 2.7 biturbo.", category: "ecus", price: 1912.19, inStock: true, image: "/shop/maxxecu_race--02.png", isRealImage: true },
  
  // --- BMW Plugin ECUs ---
  { id: "maxx-2001", name: "BMW M54 (MS42/43) RACE Plugin EXTRA", brand: "MaxxECU", partNumber: "2001", description: "Plug-and-play RACE ECU for BMW M54 engine.", category: "ecus", price: 2211.69, inStock: true, image: "/shop/maxxecu_race--02.png", isRealImage: true },
  
  // --- Ford Plugin ECUs ---
  { id: "maxx-1903", name: "Ford Focus RS/ST 2009-2010 RACE H2O Plugin", brand: "MaxxECU", partNumber: "1903", description: "Waterproof plug-and-play RACE ECU for Focus RS/ST.", category: "ecus", price: 1958.26, inStock: true, image: "/shop/maxxecu_race--02.png", isRealImage: true },
  
  // --- GM Plugin ECUs ---
  { id: "maxx-1962", name: "Corvette C6 (E38 ECM) PRO Plugin EXTRA", brand: "MaxxECU", partNumber: "1962", description: "Plug-and-play PRO ECU for GM Corvette C6.", category: "ecus", price: 3444.24, inStock: true, image: "/shop/maxxecu_pro--02.png", isRealImage: true },
  
  // --- Mitsubishi Plugin ECUs ---
  { id: "maxx-1618", name: "Mitsubishi EVO IV-VIII RACE Plugin EXTRA", brand: "MaxxECU", partNumber: "1618", description: "Plug-and-play RACE ECU for Mitsubishi EVO 4-8.", category: "ecus", price: 1866.11, inStock: true, image: "/shop/maxxecu_race--02.png", isRealImage: true },
  { id: "maxx-1944", name: "Mitsubishi EVO IV-VIII RACE Plugin STANDARD", brand: "MaxxECU", partNumber: "1944", description: "Plug-and-play RACE ECU package for EVO 4-8.", category: "ecus", price: 1773.96, inStock: true, image: "/shop/maxxecu_race--02.png", isRealImage: true },
  
  // --- Nissan Plugin ECUs ---
  { id: "maxx-908", name: "Nissan 200sx S13 CA18 STREET Plugin EXTRA", brand: "MaxxECU", partNumber: "908", description: "Plug-and-play STREET ECU for Nissan S13 CA18.", category: "ecus", price: 1428.38, inStock: true, image: "/shop/maxxecu_street.jpg", isRealImage: true },
  { id: "maxx-1923", name: "Nissan 200sx S13 CA18 RACE Plugin EXTRA", brand: "MaxxECU", partNumber: "1923", description: "Plug-and-play RACE ECU for Nissan S13 CA18.", category: "ecus", price: 1866.11, inStock: true, image: "/shop/maxxecu_race--02.png", isRealImage: true },
  { id: "maxx-1475", name: "Nissan S14 SR20 76-pin RACE Plugin EXTRA", brand: "MaxxECU", partNumber: "1475", description: "Plug-and-play RACE ECU for Nissan S14 SR20 (76-pin).", category: "ecus", price: 1866.11, inStock: true, image: "/shop/maxxecu_race--02.png", isRealImage: true },
  { id: "maxx-1854", name: "Nissan S14A/S15 SR20 STREET Plugin EXTRA", brand: "MaxxECU", partNumber: "1854", description: "Plug-and-play STREET ECU for Nissan S14A/S15 SR20 (short).", category: "ecus", price: 1428.38, inStock: true, image: "/shop/maxxecu_street.jpg", isRealImage: true },
  { id: "maxx-1855", name: "Nissan S14A/S15 SR20 RACE Plugin EXTRA", brand: "MaxxECU", partNumber: "1855", description: "Plug-and-play RACE ECU for Nissan S14A/S15 SR20 (short).", category: "ecus", price: 1866.11, inStock: true, image: "/shop/maxxecu_race--02.png", isRealImage: true },
  { id: "maxx-1850", name: "Nissan Skyline R32/33 STREET Plugin EXTRA", brand: "MaxxECU", partNumber: "1850", description: "Plug-and-play STREET ECU for Nissan Skyline GTS/GT-R R32/33.", category: "ecus", price: 1428.38, inStock: true, image: "/shop/maxxecu_street.jpg", isRealImage: true },
  { id: "maxx-1853", name: "Nissan Skyline R32/33 RACE Plugin EXTRA", brand: "MaxxECU", partNumber: "1853", description: "Plug-and-play RACE ECU for Nissan Skyline GTS/GT-R R32/33.", category: "ecus", price: 1866.11, inStock: true, image: "/shop/maxxecu_race--02.png", isRealImage: true },
  { id: "maxx-1918", name: "Nissan Skyline R32/33 RACE Plugin STANDARD", brand: "MaxxECU", partNumber: "1918", description: "Plug-and-play RACE ECU package for Skyline R32/33.", category: "ecus", price: 1773.96, inStock: true, image: "/shop/maxxecu_race--02.png", isRealImage: true },
  { id: "maxx-1054", name: "Nissan Skyline GT-R R34 RACE Plugin EXTRA", brand: "MaxxECU", partNumber: "1054", description: "Plug-and-play RACE ECU for Nissan Skyline GT-R R34.", category: "ecus", price: 1866.11, inStock: true, image: "/shop/maxxecu_race--02.png", isRealImage: true },
  
  // --- Porsche Plugin ECUs ---
  { id: "maxx-1658", name: "Porsche 996 Turbo PRO Plugin STANDARD", brand: "MaxxECU", partNumber: "1658", description: "Plug-and-play PRO ECU for Porsche 996 Turbo 2001-2005.", category: "ecus", price: 3432.72, inStock: true, image: "/shop/maxxecu_pro--02.png", isRealImage: true },
  
  // --- Toyota Plugin ECUs ---
  { id: "maxx-1893", name: "Toyota Supra MKIV 2JZ STREET Plugin EXTRA", brand: "MaxxECU", partNumber: "1893", description: "Plug-and-play STREET ECU for Toyota Supra MKIV (2JZ).", category: "ecus", price: 1428.38, inStock: true, image: "/shop/maxxecu_street.jpg", isRealImage: true },
  { id: "maxx-1892", name: "Toyota Supra MKIV 2JZ RACE Plugin EXTRA", brand: "MaxxECU", partNumber: "1892", description: "Plug-and-play RACE ECU for Toyota Supra MKIV (2JZ).", category: "ecus", price: 1866.11, inStock: true, image: "/shop/maxxecu_race--02.png", isRealImage: true },

  // ============================================================================
  // SECTION 4: WIDEBAND CONTROLLERS & SENSORS
  // ============================================================================
  { id: "maxx-107", name: "Bosch Wideband Lambda LSU 4.2", brand: "Bosch", partNumber: "107", description: "Bosch LSU 4.2 wideband oxygen sensor for accurate AFR monitoring.", category: "wideband", price: 116.92, inStock: true, image: "/shop/maxxecu_can_wbo_module_kit--02.jpg", isRealImage: true },
  { id: "maxx-2038", name: "MaxxECU WBO Module (incl. LSU 4.2)", brand: "MaxxECU", partNumber: "2038", description: "Standalone wideband controller with LSU 4.2 sensor included.", category: "wideband", price: 247.66, inStock: true, image: "/shop/maxxecu_can_wbo_module_kit--02.jpg", isRealImage: true },
  { id: "maxx-1900", name: "MaxxECU WBO Cable 1.5m", brand: "MaxxECU", partNumber: "1900", description: "1.5 meter wideband oxygen sensor cable.", category: "wideband", price: 66.81, inStock: true, image: "📊" },
  { id: "maxx-1901", name: "MaxxECU WBO Cable 2.5m", brand: "MaxxECU", partNumber: "1901", description: "2.5 meter wideband oxygen sensor cable.", category: "wideband", price: 69.12, inStock: true, image: "📊" },
  { id: "maxx-894", name: "Connector 6-way (LSU 4.2 sensor)", brand: "MaxxECU", partNumber: "894", description: "6-way socket housing for LSU 4.2 wideband sensor.", category: "wideband", price: 8.29, inStock: true, image: "📊" },
  { id: "maxx-947", name: "MaxxECU Plugin Lambda Cable (16-pin)", brand: "MaxxECU", partNumber: "947", description: "16-pin lambda cable for Plugin ECU installations.", category: "wideband", price: 34.56, inStock: true, image: "📊" },

  // === Sensors ===
  { id: "maxx-1991", name: "MaxxECU Acceleration Sensor (+/- 3G)", brand: "MaxxECU", partNumber: "1991", description: "3-axis acceleration sensor for datalogging and traction control.", category: "sensors", price: 99.07, inStock: true, image: "🔌" },
  { id: "maxx-948", name: "External Intake Temp Sensor Cable", brand: "MaxxECU", partNumber: "948", description: "Extra cable for external intake air temperature sensor.", category: "sensors", price: 19.04, inStock: true, image: "🔌" },
  { id: "maxx-928", name: "MAP Sensor Hose Kit (incl. nipples)", brand: "MaxxECU", partNumber: "928", description: "Complete hose kit for MAP sensor installation.", category: "sensors", price: 16.70, inStock: true, image: "🔌" },
  { id: "maxx-1767", name: "Push-Lock to Barb (MAP sensor)", brand: "MaxxECU", partNumber: "1767", description: "Push-lock to barb adapter for MAP sensor.", category: "sensors", price: 2.88, inStock: true, image: "🔌" },

  // === Wiring Harnesses ===
  { id: "maxx-1763", name: "MaxxECU STREET Flying Lead Harness 3m", brand: "MaxxECU", partNumber: "1763", description: "3 meter flying lead wiring harness for STREET ECU.", category: "wiring", price: 184.31, inStock: true, image: "/shop/accessories-maxxecu-harness.jpg", isRealImage: true },
  { id: "maxx-1915", name: "MaxxECU SPORT Cable Harness", brand: "MaxxECU", partNumber: "1915", description: "Main wiring harness for SPORT ECU.", category: "wiring", price: 201.59, inStock: true, image: "/shop/accessories-maxxecu-harness.jpg", isRealImage: true },
  { id: "maxx-871", name: "MaxxECU V1/RACE/PRO Harness Connector 1", brand: "MaxxECU", partNumber: "871", description: "Flying lead wiring harness connector 1 for V1/RACE/PRO.", category: "wiring", price: 230.38, inStock: true, image: "/shop/accessories-maxxecu-harness.jpg", isRealImage: true },
  { id: "maxx-1787", name: "MaxxECU RACE Harness 2 (EGT/E-Throttle)", brand: "MaxxECU", partNumber: "1787", description: "RACE harness 2 for EGT, E-Throttle and extra outputs.", category: "wiring", price: 201.59, inStock: true, image: "/shop/accessories-maxxecu-harness.jpg", isRealImage: true },
  { id: "maxx-1467", name: "MaxxECU PRO Harness Connector 4", brand: "MaxxECU", partNumber: "1467", description: "3m harness for extra in/out, CAN 2, and knock sensing.", category: "wiring", price: 184.31, inStock: true, image: "/shop/accessories-maxxecu-harness.jpg", isRealImage: true },
  { id: "maxx-1468", name: "MaxxECU PRO Harness Connector 3", brand: "MaxxECU", partNumber: "1468", description: "3m harness for cylinders 9-16, E-Throttle, extra outputs.", category: "wiring", price: 207.35, inStock: true, image: "/shop/accessories-maxxecu-harness.jpg", isRealImage: true },
  { id: "maxx-1470", name: "MaxxECU PRO Harness Connector 2 (EGT)", brand: "MaxxECU", partNumber: "1470", description: "3m EGT harness for PRO ECU.", category: "wiring", price: 224.62, inStock: true, image: "/shop/accessories-maxxecu-harness.jpg", isRealImage: true },
  { id: "maxx-1985", name: "MaxxECU MINI Cable Harness", brand: "MaxxECU", partNumber: "1985", description: "Main wiring harness for MINI ECU.", category: "wiring", price: 172.79, inStock: true, image: "/shop/accessories-maxxecu-harness.jpg", isRealImage: true },
  { id: "maxx-1276", name: "MaxxECU PWM Module Harness", brand: "MaxxECU", partNumber: "1276", description: "Wiring harness for PWM module.", category: "wiring", price: 65.45, inStock: true, image: "/shop/accessories-maxxecu-harness.jpg", isRealImage: true },
  { id: "maxx-1868", name: "MaxxECU CAN Cable with Terminals", brand: "MaxxECU", partNumber: "1868", description: "CAN bus cable with pre-terminated ends.", category: "wiring", price: 13.82, inStock: true, image: "/shop/accessories-maxxecu-harness.jpg", isRealImage: true },
  { id: "maxx-1899", name: "MaxxECU Plugin Flex Fuel Cable", brand: "MaxxECU", partNumber: "1899", description: "Flex fuel sensor cable for Plugin ECUs.", category: "wiring", price: 34.56, inStock: true, image: "/shop/accessories-maxxecu-harness.jpg", isRealImage: true },
  { id: "maxx-1052", name: "MaxxECU Extra Installation Cable", brand: "MaxxECU", partNumber: "1052", description: "Extra cable for custom installations.", category: "wiring", price: 5.53, inStock: true, image: "/shop/accessories-maxxecu-harness.jpg", isRealImage: true },

  // === Terminated Engine Harnesses ===
  { id: "maxx-1775", name: "Engine Harness - Toyota 2JZ", brand: "MaxxECU", partNumber: "1775", description: "Complete terminated engine harness for Toyota 2JZ.", category: "wiring", price: 944.57, inStock: true, image: "/shop/accessories-maxxecu-harness.jpg", isRealImage: true },
  { id: "maxx-1950", name: "Engine Harness - BMW M50", brand: "MaxxECU", partNumber: "1950", description: "Complete terminated engine harness for BMW M50.", category: "wiring", price: 944.57, inStock: true, image: "/shop/accessories-maxxecu-harness.jpg", isRealImage: true },
  { id: "maxx-1951", name: "Engine Harness - BMW M50 (w/ coils & LSU 4.2)", brand: "MaxxECU", partNumber: "1951", description: "BMW M50 harness with coil-on-plug and LSU 4.2 sensor.", category: "wiring", price: 1198.00, inStock: true, image: "/shop/accessories-maxxecu-harness.jpg", isRealImage: true },
  { id: "maxx-1884", name: "Engine Harness - Volvo T5", brand: "MaxxECU", partNumber: "1884", description: "Complete terminated engine harness for Volvo T5.", category: "wiring", price: 1244.07, inStock: true, image: "/shop/accessories-maxxecu-harness.jpg", isRealImage: true },
  { id: "maxx-2172", name: "Engine Harness - GM LS Gen III/IV", brand: "MaxxECU", partNumber: "2172", description: "Complete terminated engine harness for GM LS engines.", category: "wiring", price: 1359.27, inStock: true, image: "/shop/accessories-maxxecu-harness.jpg", isRealImage: true },
  { id: "maxx-1961", name: "Engine Harness - GM LS (incl. RACE kit)", brand: "MaxxECU", partNumber: "1961", description: "GM LS harness including complete MaxxECU RACE kit.", category: "wiring", price: 2902.84, inStock: true, image: "/shop/accessories-maxxecu-harness.jpg", isRealImage: true },

  // === Plugin Adapters ===
  { id: "maxx-1161", name: "Plugin Adapter - Toyota Supra MKIV", brand: "MaxxECU", partNumber: "1161", description: "Plugin adapter for Toyota Supra MKIV (non-VVTi).", category: "wiring", price: 483.81, inStock: true, image: "/shop/accessories-maxxecu-harness.jpg", isRealImage: true },
  { id: "maxx-1162", name: "Plugin Adapter - Nissan S13 CA18", brand: "MaxxECU", partNumber: "1162", description: "Plugin adapter for Nissan 200SX S13 CA18.", category: "wiring", price: 483.81, inStock: true, image: "/shop/accessories-maxxecu-harness.jpg", isRealImage: true },
  { id: "maxx-1163", name: "Plugin Adapter - Nissan Skyline R32/33", brand: "MaxxECU", partNumber: "1163", description: "Plugin adapter for Nissan Skyline R32/33.", category: "wiring", price: 483.81, inStock: true, image: "/shop/accessories-maxxecu-harness.jpg", isRealImage: true },
  { id: "maxx-1342", name: "Plugin Adapter - Nissan Skyline R34 GT-R", brand: "MaxxECU", partNumber: "1342", description: "Plugin adapter for Nissan Skyline GT-R R34.", category: "wiring", price: 483.81, inStock: true, image: "/shop/accessories-maxxecu-harness.jpg", isRealImage: true },
  { id: "maxx-1459", name: "Plugin Adapter - Nissan S14A/S15 SR20 (64-pin)", brand: "MaxxECU", partNumber: "1459", description: "Plugin adapter for Nissan S14A/S15 SR20 (64-pin).", category: "wiring", price: 483.81, inStock: true, image: "/shop/accessories-maxxecu-harness.jpg", isRealImage: true },
  { id: "maxx-1473", name: "Plugin Adapter - Nissan S14 SR20 (76-pin)", brand: "MaxxECU", partNumber: "1473", description: "Plugin adapter for Nissan S14 SR20 (76-pin).", category: "wiring", price: 483.81, inStock: true, image: "/shop/accessories-maxxecu-harness.jpg", isRealImage: true },
  { id: "maxx-1164", name: "Plugin Adapter - Audi AAN", brand: "MaxxECU", partNumber: "1164", description: "Plugin adapter for Audi AAN engine.", category: "wiring", price: 483.81, inStock: true, image: "/shop/accessories-maxxecu-harness.jpg", isRealImage: true },
  { id: "maxx-1304", name: "Plugin Adapter - Audi 3B (STREET/RACE)", brand: "MaxxECU", partNumber: "1304", description: "Plugin adapter for Audi 3B engine.", category: "wiring", price: 483.81, inStock: true, image: "/shop/accessories-maxxecu-harness.jpg", isRealImage: true },
  { id: "maxx-1597", name: "Plugin Adapter - Audi A4 1.8T (AEB)", brand: "MaxxECU", partNumber: "1597", description: "Plugin adapter for Audi A4 1.8T (AEB, no E-Throttle).", category: "wiring", price: 483.81, inStock: true, image: "/shop/accessories-maxxecu-harness.jpg", isRealImage: true },
  { id: "maxx-1880", name: "Plugin Adapter - Audi 1.8T (ME 7.5)", brand: "MaxxECU", partNumber: "1880", description: "RACE plugin adapter for Audi 1.8T ME 7.5.", category: "wiring", price: 483.81, inStock: true, image: "/shop/accessories-maxxecu-harness.jpg", isRealImage: true },
  { id: "maxx-1890", name: "Plugin Adapter - Audi S4 2.7T (ME 7.1)", brand: "MaxxECU", partNumber: "1890", description: "RACE plugin adapter for Audi S4 2.7 turbo.", category: "wiring", price: 483.81, inStock: true, image: "/shop/accessories-maxxecu-harness.jpg", isRealImage: true },
  { id: "maxx-1619", name: "Plugin Adapter - Mitsubishi EVO IV-VIII", brand: "MaxxECU", partNumber: "1619", description: "Plugin adapter for Mitsubishi EVO 4-8.", category: "wiring", price: 483.81, inStock: true, image: "/shop/accessories-maxxecu-harness.jpg", isRealImage: true },
  { id: "maxx-1983", name: "Plugin Adapter - BMW M54 (RACE)", brand: "MaxxECU", partNumber: "1983", description: "RACE plugin adapter for BMW M54.", category: "wiring", price: 622.04, inStock: true, image: "/shop/accessories-maxxecu-harness.jpg", isRealImage: true },
  { id: "maxx-1705", name: "Plugin Adapter - Porsche 996 E-Throttle", brand: "MaxxECU", partNumber: "1705", description: "PRO plugin adapter for Porsche 996 E-Throttle (ME 7.8).", category: "wiring", price: 783.31, inStock: true, image: "/shop/accessories-maxxecu-harness.jpg", isRealImage: true },
  { id: "maxx-1714", name: "Plugin Adapter - Mustang GT V8 2011 E-Throttle", brand: "MaxxECU", partNumber: "1714", description: "PRO plugin adapter for Ford Mustang GT V8 2011.", category: "wiring", price: 783.31, inStock: true, image: "/shop/accessories-maxxecu-harness.jpg", isRealImage: true },
  { id: "maxx-1898", name: "Adapter Harness - Corvette C6 (E38 ECM)", brand: "MaxxECU", partNumber: "1898", description: "PRO adapter harness for Corvette C6 E38 ECM.", category: "wiring", price: 737.23, inStock: true, image: "/shop/accessories-maxxecu-harness.jpg", isRealImage: true },
  { id: "maxx-1902", name: "Adapter Harness - Ford Focus RS 2010", brand: "MaxxECU", partNumber: "1902", description: "RACE adapter harness for Ford Focus RS 2010 (ME 9.0).", category: "wiring", price: 552.92, inStock: true, image: "/shop/accessories-maxxecu-harness.jpg", isRealImage: true },

  // === GM LS Adapter Cables ===
  { id: "maxx-1955", name: "GM LS Adapter - Bosch Alternator", brand: "MaxxECU", partNumber: "1955", description: "Adapter cable for GM LS harness to Bosch alternator.", category: "wiring", price: 20.73, inStock: true, image: "/shop/accessories-maxxecu-harness.jpg", isRealImage: true },
  { id: "maxx-1956", name: "GM LS Adapter - Mitsubishi Alternator", brand: "MaxxECU", partNumber: "1956", description: "Adapter cable for GM LS harness to Mitsubishi alternator.", category: "wiring", price: 20.73, inStock: true, image: "/shop/accessories-maxxecu-harness.jpg", isRealImage: true },
  { id: "maxx-1957", name: "GM LS Adapter - Gen3 Crank Trigger", brand: "MaxxECU", partNumber: "1957", description: "Adapter cable for GM LS Gen 3 crank trigger.", category: "wiring", price: 23.04, inStock: true, image: "/shop/accessories-maxxecu-harness.jpg", isRealImage: true },
  { id: "maxx-1958", name: "GM LS Adapter - Gen4 Crank Trigger", brand: "MaxxECU", partNumber: "1958", description: "Adapter cable for GM LS Gen 4 crank trigger.", category: "wiring", price: 23.04, inStock: true, image: "/shop/accessories-maxxecu-harness.jpg", isRealImage: true },
  { id: "maxx-1959", name: "GM LS Adapter - Gen3 Cam Trigger", brand: "MaxxECU", partNumber: "1959", description: "Adapter cable for GM LS Gen 3 cam trigger.", category: "wiring", price: 23.04, inStock: true, image: "/shop/accessories-maxxecu-harness.jpg", isRealImage: true },
  { id: "maxx-1960", name: "GM LS Adapter - Gen4 Cam Trigger", brand: "MaxxECU", partNumber: "1960", description: "Adapter cable for GM LS Gen 4 cam trigger.", category: "wiring", price: 23.04, inStock: true, image: "/shop/accessories-maxxecu-harness.jpg", isRealImage: true },

  // === ECU Connectors ===
  { id: "maxx-1151", name: "ECU Connector - BMW M50B25", brand: "MaxxECU", partNumber: "1151", description: "OEM-style ECU connector for BMW M50B25.", category: "wiring", price: 46.08, inStock: true, image: "/shop/accessories-maxxecu-harness.jpg", isRealImage: true },
  { id: "maxx-1152", name: "ECU Connector - Audi AAN/3B", brand: "MaxxECU", partNumber: "1152", description: "OEM-style ECU connector for Audi AAN/3B engines.", category: "wiring", price: 69.12, inStock: true, image: "/shop/accessories-maxxecu-harness.jpg", isRealImage: true },
  { id: "maxx-1153", name: "ECU Connector - Toyota Supra MKIV", brand: "MaxxECU", partNumber: "1153", description: "OEM-style ECU connector for Toyota Supra MKIV (no VVTi).", category: "wiring", price: 82.94, inStock: true, image: "/shop/accessories-maxxecu-harness.jpg", isRealImage: true },
  { id: "maxx-1154", name: "ECU Connector - Nissan 76-pin", brand: "MaxxECU", partNumber: "1154", description: "OEM-style 76-pin ECU connector for Nissan.", category: "wiring", price: 69.12, inStock: true, image: "/shop/accessories-maxxecu-harness.jpg", isRealImage: true },
  { id: "maxx-1155", name: "ECU Connector - Nissan 64-pin", brand: "MaxxECU", partNumber: "1155", description: "OEM-style 64-pin ECU connector for Nissan.", category: "wiring", price: 69.12, inStock: true, image: "/shop/accessories-maxxecu-harness.jpg", isRealImage: true },
  { id: "maxx-1530", name: "ECU Connector - VW/Audi S4 121-pin", brand: "MaxxECU", partNumber: "1530", description: "OEM-style 121-pin ECU connector for VW/Audi S4.", category: "wiring", price: 69.12, inStock: true, image: "/shop/accessories-maxxecu-harness.jpg", isRealImage: true },
  { id: "maxx-1568", name: "ECU Connector - BMW S54/Porsche 996 120-pin", brand: "MaxxECU", partNumber: "1568", description: "OEM-style 120-pin ECU connector for BMW S54/Porsche 996.", category: "wiring", price: 69.12, inStock: true, image: "/shop/accessories-maxxecu-harness.jpg", isRealImage: true },
  { id: "maxx-1596", name: "ECU Connector - Mitsubishi EVO 4-8 76-pin", brand: "MaxxECU", partNumber: "1596", description: "OEM-style 76-pin ECU connector for Mitsubishi EVO 4-8.", category: "wiring", price: 69.12, inStock: true, image: "/shop/accessories-maxxecu-harness.jpg", isRealImage: true },
  { id: "maxx-1887", name: "ECU Connector - Ford Focus RS 2010 154-pin", brand: "MaxxECU", partNumber: "1887", description: "OEM-style 154-pin ECU connector for Ford Focus RS 2010.", category: "wiring", price: 69.12, inStock: true, image: "/shop/accessories-maxxecu-harness.jpg", isRealImage: true },

  // === Connectors & Cables ===
  { id: "maxx-925", name: "MaxxECU C1 Connector (48-pin molex)", brand: "MaxxECU", partNumber: "925", description: "48-pin molex C1 connector for STREET/SPORT/RACE/PRO.", category: "wiring", price: 33.41, inStock: true, image: "🔗" },
  { id: "maxx-1943", name: "MaxxECU PRO C3 (48-pin molex brown)", brand: "MaxxECU", partNumber: "1943", description: "48-pin brown molex C3 connector for PRO ECU.", category: "wiring", price: 33.41, inStock: true, image: "🔗" },
  { id: "maxx-2088", name: "MaxxECU PRO C2 (32-pin molex)", brand: "MaxxECU", partNumber: "2088", description: "32-pin molex C2 connector for PRO ECU.", category: "wiring", price: 33.41, inStock: true, image: "🔗" },
  { id: "maxx-1982", name: "MaxxECU MINI/RACE C2/PRO C4 (32-pin)", brand: "MaxxECU", partNumber: "1982", description: "32-pin molex connector for MINI, RACE C2, PRO C4.", category: "wiring", price: 32.25, inStock: true, image: "🔗" },
  { id: "maxx-927", name: "Connector 12-way GT150", brand: "MaxxECU", partNumber: "927", description: "12-way GT150 socket housing for MaxxECU harness.", category: "wiring", price: 11.40, inStock: true, image: "🔗" },
  { id: "maxx-1845", name: "Connector 16-way GT150", brand: "MaxxECU", partNumber: "1845", description: "16-way GT150 socket housing.", category: "wiring", price: 9.10, inStock: true, image: "🔗" },

  // === USB Cables ===
  { id: "maxx-924", name: "MaxxECU USB Cable 1.5m (STREET/V1/RACE)", brand: "MaxxECU", partNumber: "924", description: "1.5m USB cable for STREET, V1, and RACE ECUs.", category: "accessories", price: 7.49, inStock: true, image: "🛠️" },
  { id: "maxx-1606", name: "MaxxECU PRO/RACE H2O USB Cable 1.5m", brand: "MaxxECU", partNumber: "1606", description: "1.5m USB cable for PRO and RACE H2O ECUs.", category: "accessories", price: 40.32, inStock: true, image: "🛠️" },
  { id: "maxx-1988", name: "MaxxECU MINI USB Cable (micro)", brand: "MaxxECU", partNumber: "1988", description: "Micro USB cable for MINI ECU.", category: "accessories", price: 6.91, inStock: true, image: "🛠️" },

  // === Ignition ===
  { id: "maxx-1972", name: "MaxxECU IGBT Driver", brand: "MaxxECU", partNumber: "1972", description: "IGBT ignition driver for high-power coil applications.", category: "ignition", price: 74.87, inStock: true, image: "⚡" },

  // === PDM (Power Distribution) ===
  { id: "maxx-2098", name: "MaxxECU PDM20 unit (no accessories)", brand: "MaxxECU", partNumber: "2098", description: "20-channel power distribution module.", category: "accessories", price: 1727.88, inStock: true, image: "/shop/maxxecu_pdm20--02.jpg", isRealImage: true },
  { id: "maxx-2002", name: "MaxxECU PDM20 with Accessories", brand: "MaxxECU", partNumber: "2002", description: "PDM20 with accessories package.", category: "accessories", price: 1750.92, inStock: true, image: "/shop/maxxecu_pdm20--02.jpg", isRealImage: true },
  { id: "maxx-2257", name: "MaxxECU PDM20 PREMIUM (w/ harnesses)", brand: "MaxxECU", partNumber: "2257", description: "Complete PDM20 package with harnesses and accessories.", category: "accessories", price: 2061.94, inStock: true, image: "/shop/maxxecu_pdm20--02.jpg", isRealImage: true },
  { id: "maxx-2097", name: "MaxxECU PDM20 Accessories", brand: "MaxxECU", partNumber: "2097", description: "Accessory kit for PDM20.", category: "accessories", price: 28.80, inStock: true, image: "/shop/maxxecu_pdm20--02.jpg", isRealImage: true },
  { id: "maxx-2100", name: "MaxxECU PDM20 Harness 1 (34-pin)", brand: "MaxxECU", partNumber: "2100", description: "Terminated 34-pin harness for PDM20.", category: "wiring", price: 172.79, inStock: true, image: "/shop/accessories-maxxecu-harness.jpg", isRealImage: true },
  { id: "maxx-2101", name: "MaxxECU PDM20 Harness 2 (26-pin)", brand: "MaxxECU", partNumber: "2101", description: "Terminated 26-pin harness for PDM20.", category: "wiring", price: 149.75, inStock: true, image: "/shop/accessories-maxxecu-harness.jpg", isRealImage: true },

  // === Transmission Harnesses ===
  { id: "maxx-2015", name: "BMW M3 DCT Harness (GS7D36SG)", brand: "MaxxECU", partNumber: "2015", description: "DCT cable harness for BMW M3 GS7D36SG transmission.", category: "wiring", price: 368.61, inStock: true, image: "/shop/accessories-maxxecu-harness.jpg", isRealImage: true },
  { id: "maxx-2254", name: "BMW M4 DCT Harness (GS7D36SG)", brand: "MaxxECU", partNumber: "2254", description: "DCT cable harness for BMW M4 GS7D36SG transmission.", category: "wiring", price: 391.65, inStock: true, image: "/shop/accessories-maxxecu-harness.jpg", isRealImage: true },
  { id: "maxx-2283", name: "8HP Gen1 Harness (Dodge shifter)", brand: "MaxxECU", partNumber: "2283", description: "8HP Gen1 cable harness for Dodge shifter.", category: "wiring", price: 368.61, inStock: true, image: "/shop/accessories-maxxecu-harness.jpg", isRealImage: true },
  { id: "maxx-2287", name: "8HP Gen1 Harness (BMW shifter)", brand: "MaxxECU", partNumber: "2287", description: "8HP Gen1 cable harness for BMW 8HP shifter.", category: "wiring", price: 368.61, inStock: true, image: "/shop/accessories-maxxecu-harness.jpg", isRealImage: true },

  // === Modules & Accessories ===
  { id: "maxx-942", name: "MaxxECU PWM Module Kit", brand: "MaxxECU", partNumber: "942", description: "PWM module kit for electronic boost control and more.", category: "accessories", price: 247.66, inStock: true, image: "🛠️" },
  { id: "maxx-1945", name: "MaxxECU Relay and Fuse Box", brand: "MaxxECU", partNumber: "1945", description: "Integrated relay and fuse box for clean installations.", category: "accessories", price: 184.31, inStock: true, image: "🛠️" },
  { id: "maxx-949", name: "MaxxECU Bluetooth Antenna", brand: "MaxxECU", partNumber: "949", description: "Bluetooth mobile antenna for wireless tuning.", category: "accessories", price: 5.76, inStock: true, image: "🛠️" },
  { id: "maxx-2134", name: "BMW BSD Communication Board", brand: "MaxxECU", partNumber: "2134", description: "BSD communication board for BMW applications.", category: "accessories", price: 64.51, inStock: true, image: "🛠️" },
  { id: "maxx-2214", name: "MaxxECU PRO Bracket Kit", brand: "MaxxECU", partNumber: "2214", description: "Mounting bracket kit for PRO ECU.", category: "accessories", price: 69.12, inStock: true, image: "🛠️" },
  { id: "maxx-1559", name: "MaxxECU Cap", brand: "MaxxECU", partNumber: "1559", description: "Protective cap for MaxxECU.", category: "accessories", price: 18.43, inStock: true, image: "🛠️" },
  { id: "maxx-1685", name: "MaxxECU PRO Rubber Sleeve", brand: "MaxxECU", partNumber: "1685", description: "Protective rubber sleeve for PRO ECU.", category: "accessories", price: 2.07, inStock: true, image: "🛠️" },
  { id: "maxx-1383", name: "OP MaxxECU Plugin", brand: "MaxxECU", partNumber: "1383", description: "Optional plugin accessory.", category: "accessories", price: 23.04, inStock: true, image: "🛠️" },
  { id: "maxx-1852", name: "MaxxECU Quick Guide (English)", brand: "MaxxECU", partNumber: "1852", description: "Printed quick start guide in English.", category: "accessories", price: 6.91, inStock: true, image: "🛠️" },
  { id: "maxx-1235", name: "MaxxECU Sticker", brand: "MaxxECU", partNumber: "1235", description: "MaxxECU logo sticker.", category: "accessories", price: 3.46, inStock: true, image: "🛠️" },

  // === Tools ===
  { id: "maxx-1967", name: "CMC Removal Tool (small terminals)", brand: "MaxxECU", partNumber: "1967", description: "Terminal removal tool for small CMC terminals.", category: "accessories", price: 23.04, inStock: true, image: "🛠️" },
  { id: "maxx-1968", name: "CMC Removal Tool (big terminals)", brand: "MaxxECU", partNumber: "1968", description: "Terminal removal tool for big CMC terminals.", category: "accessories", price: 23.04, inStock: true, image: "🛠️" },
  { id: "maxx-2277", name: "Yanhua ACDP-2 8HPxx TCU Tool Package", brand: "Yanhua", partNumber: "2277", description: "TCU programming tool package for 8HP transmissions.", category: "accessories", price: 618.80, inStock: true, image: "🛠️" },
];

const categoryLabels: Record<string, string> = {
  ecus: "ECUs & Standalone",
  wideband: "Wideband Controllers",
  sensors: "Sensors",
  ignition: "Ignition Systems",
  wiring: "Wiring & Harnesses",
  gauges: "Gauges & Displays",
  datalogging: "Datalogging",
  accessories: "Accessories",
};

const categoryIcons: Record<string, string> = {
  ecus: "🖥️",
  wideband: "📊",
  sensors: "🔌",
  ignition: "⚡",
  wiring: "🔗",
  gauges: "🎛️",
  datalogging: "📈",
  accessories: "🛠️",
};

// Section definitions for organized display
interface ProductSection {
  id: string;
  title: string;
  description: string;
  icon: string;
  filter: (product: EMSProduct) => boolean;
}

const productSections: ProductSection[] = [
  // === ECU SECTIONS (includes kits AND unit-only options) ===
  {
    id: "ecu-kits-mini",
    title: "MINI ECU Kits",
    description: "Compact ECUs for smaller engines and tight spaces",
    icon: "🖥️",
    filter: (p) => p.category === "ecus" && p.name.includes("MINI") && !p.name.includes("Plugin"),
  },
  {
    id: "ecu-kits-street",
    title: "STREET ECU Kits",
    description: "Entry-level standalone ECUs for street applications",
    icon: "🖥️",
    filter: (p) => p.category === "ecus" && p.name.includes("STREET") && !p.name.includes("Plugin"),
  },
  {
    id: "ecu-kits-sport",
    title: "SPORT ECU Kits",
    description: "Mid-range ECUs for performance applications",
    icon: "🖥️",
    filter: (p) => p.category === "ecus" && p.name.includes("SPORT") && !p.name.includes("Plugin"),
  },
  {
    id: "ecu-kits-race",
    title: "RACE ECU Kits",
    description: "High-performance ECUs for racing applications",
    icon: "🖥️",
    filter: (p) => p.category === "ecus" && p.name.includes("RACE") && !p.name.includes("H2O") && !p.name.includes("Plugin"),
  },
  {
    id: "ecu-kits-race-h2o",
    title: "RACE H2O ECU Kits",
    description: "Waterproof RACE ECUs for marine and extreme environments",
    icon: "🖥️",
    filter: (p) => p.category === "ecus" && p.name.includes("RACE H2O") && !p.name.includes("Plugin"),
  },
  {
    id: "ecu-kits-pro",
    title: "PRO ECU Kits",
    description: "Top-tier ECUs for professional motorsport",
    icon: "🖥️",
    filter: (p) => p.category === "ecus" && p.name.includes("PRO") && !p.name.includes("Plugin"),
  },
  // === PLUGIN ECUs BY MANUFACTURER ===
  {
    id: "plugin-audi",
    title: "Audi Plugin ECUs",
    description: "Plug-and-play ECUs for Audi vehicles",
    icon: "🚗",
    filter: (p) => p.category === "ecus" && p.name.includes("Audi") && p.name.includes("Plugin"),
  },
  {
    id: "plugin-bmw",
    title: "BMW Plugin ECUs",
    description: "Plug-and-play ECUs for BMW vehicles",
    icon: "🚗",
    filter: (p) => p.category === "ecus" && p.name.includes("BMW") && p.name.includes("Plugin"),
  },
  {
    id: "plugin-ford",
    title: "Ford Plugin ECUs",
    description: "Plug-and-play ECUs for Ford vehicles",
    icon: "🚗",
    filter: (p) => p.category === "ecus" && p.name.includes("Ford") && p.name.includes("Plugin"),
  },
  {
    id: "plugin-gm",
    title: "GM Plugin ECUs",
    description: "Plug-and-play ECUs for GM vehicles",
    icon: "🚗",
    filter: (p) => p.category === "ecus" && (p.name.includes("Corvette") || p.name.includes("GM")) && p.name.includes("Plugin"),
  },
  {
    id: "plugin-mitsubishi",
    title: "Mitsubishi Plugin ECUs",
    description: "Plug-and-play ECUs for Mitsubishi vehicles",
    icon: "🚗",
    filter: (p) => p.category === "ecus" && p.name.includes("Mitsubishi") && p.name.includes("Plugin"),
  },
  {
    id: "plugin-nissan",
    title: "Nissan Plugin ECUs",
    description: "Plug-and-play ECUs for Nissan vehicles",
    icon: "🚗",
    filter: (p) => p.category === "ecus" && p.name.includes("Nissan") && p.name.includes("Plugin"),
  },
  {
    id: "plugin-porsche",
    title: "Porsche Plugin ECUs",
    description: "Plug-and-play ECUs for Porsche vehicles",
    icon: "🚗",
    filter: (p) => p.category === "ecus" && p.name.includes("Porsche") && p.name.includes("Plugin"),
  },
  {
    id: "plugin-toyota",
    title: "Toyota Plugin ECUs",
    description: "Plug-and-play ECUs for Toyota vehicles",
    icon: "🚗",
    filter: (p) => p.category === "ecus" && p.name.includes("Toyota") && p.name.includes("Plugin"),
  },
  // === WIDEBAND & SENSORS ===
  {
    id: "wideband",
    title: "Wideband Controllers & Sensors",
    description: "Accurate AFR monitoring for safe tuning",
    icon: "📊",
    filter: (p) => p.category === "wideband",
  },
  {
    id: "sensors",
    title: "Sensors",
    description: "Temperature, pressure, and acceleration sensors",
    icon: "🔌",
    filter: (p) => p.category === "sensors",
  },
  // === WIRING SECTIONS ===
  {
    id: "harness-flying-lead",
    title: "Flying Lead Harnesses",
    description: "Main wiring harnesses for MaxxECU installations",
    icon: "🔗",
    filter: (p) => p.category === "wiring" && (p.name.includes("Flying Lead") || p.name.includes("Cable Harness") || (p.name.includes("Harness") && p.name.includes("Connector"))),
  },
  {
    id: "harness-engine",
    title: "Engine Harnesses",
    description: "Complete terminated engine harnesses for specific platforms",
    icon: "🔗",
    filter: (p) => p.category === "wiring" && p.name.includes("Engine Harness"),
  },
  {
    id: "harness-plugin-adapters",
    title: "Plugin Adapters",
    description: "Plugin adapters for vehicle-specific installations",
    icon: "🔗",
    filter: (p) => p.category === "wiring" && (p.name.includes("Plugin Adapter") || p.name.includes("Adapter Harness")),
  },
  {
    id: "harness-gm-ls",
    title: "GM LS Adapter Cables",
    description: "Adapter cables for GM LS installations",
    icon: "🔗",
    filter: (p) => p.category === "wiring" && p.name.includes("GM LS Adapter"),
  },
  {
    id: "harness-ecu-connectors",
    title: "ECU Connectors",
    description: "OEM-style ECU connectors for various platforms",
    icon: "🔗",
    filter: (p) => p.category === "wiring" && p.name.includes("ECU Connector"),
  },
  {
    id: "harness-transmission",
    title: "Transmission Harnesses",
    description: "DCT and automatic transmission harnesses",
    icon: "🔗",
    filter: (p) => p.category === "wiring" && (p.name.includes("DCT") || p.name.includes("8HP")),
  },
  {
    id: "harness-connectors",
    title: "Connectors & Cables",
    description: "Molex connectors, GT150 housings, and misc cables",
    icon: "🔗",
    filter: (p) => p.category === "wiring" && !p.name.includes("Engine Harness") && !p.name.includes("Plugin Adapter") && !p.name.includes("Adapter Harness") && !p.name.includes("GM LS Adapter") && !p.name.includes("ECU Connector") && !p.name.includes("DCT") && !p.name.includes("8HP") && !p.name.includes("Flying Lead") && !p.name.includes("Cable Harness") && !(p.name.includes("Harness") && p.name.includes("Connector")) && !p.name.includes("PDM"),
  },
  // === PDM ===
  {
    id: "pdm",
    title: "Power Distribution Modules",
    description: "MaxxECU PDM20 units and accessories",
    icon: "⚡",
    filter: (p) => p.name.includes("PDM"),
  },
  // === IGNITION ===
  {
    id: "ignition",
    title: "Ignition Components",
    description: "IGBT drivers and ignition accessories",
    icon: "⚡",
    filter: (p) => p.category === "ignition",
  },
  // === ACCESSORIES ===
  {
    id: "accessories-usb",
    title: "USB Cables",
    description: "USB cables for ECU communication",
    icon: "🛠️",
    filter: (p) => p.category === "accessories" && p.name.includes("USB"),
  },
  {
    id: "accessories-modules",
    title: "Modules & Accessories",
    description: "PWM modules, relay boxes, brackets, and misc accessories",
    icon: "🛠️",
    filter: (p) => p.category === "accessories" && !p.name.includes("USB") && !p.name.includes("PDM"),
  },
];

// Product Card Component
function ProductCard({ product, addToCart }: { product: EMSProduct; addToCart: (p: EMSProduct) => void }) {
  return (
    <div
      style={{
        background: "rgba(20, 20, 40, 0.8)",
        border: "1px solid rgba(0, 200, 255, 0.2)",
        borderRadius: 12,
        overflow: "hidden",
        transition: "all 0.2s ease",
      }}
    >
      {/* Product Image */}
      <div
        style={{
          height: 180,
          background: "linear-gradient(135deg, rgba(0,200,255,0.1), rgba(0,128,255,0.05))",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 64,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {product.isRealImage ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            style={{ objectFit: "contain", padding: 10 }}
          />
        ) : (
          categoryIcons[product.category] || "🖥️"
        )}
        {!product.inStock && (
          <div
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              background: "#ef4444",
              color: "white",
              padding: "4px 10px",
              borderRadius: 4,
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            OUT OF STOCK
          </div>
        )}
        {product.compareAtPrice && product.inStock && (
          <div
            style={{
              position: "absolute",
              top: 12,
              left: 12,
              background: "#22c55e",
              color: "white",
              padding: "4px 10px",
              borderRadius: 4,
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            SALE
          </div>
        )}
      </div>

      {/* Product Info */}
      <div style={{ padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
          <span style={{ color: "#00c8ff", fontSize: 12, fontWeight: 600 }}>{product.brand}</span>
          <span style={{ color: "#64748b", fontSize: 11 }}>{product.partNumber}</span>
        </div>
        <h3 style={{ color: "#e2e8f0", fontSize: 15, fontWeight: 600, margin: "0 0 8px 0", lineHeight: 1.3 }}>
          {product.name}
        </h3>
        <p style={{ color: "#94a3b8", fontSize: 13, margin: "0 0 12px 0", lineHeight: 1.4 }}>
          {product.description}
        </p>

        {/* Specs Preview */}
        {product.specs && (
          <div style={{ marginBottom: 12 }}>
            {Object.entries(product.specs)
              .slice(0, 2)
              .map(([key, value]) => (
                <div
                  key={key}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 12,
                    color: "#64748b",
                    marginBottom: 2,
                  }}
                >
                  <span>{key}:</span>
                  <span style={{ color: "#94a3b8" }}>{value}</span>
                </div>
              ))}
          </div>
        )}

        {/* Price & Add to Cart */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto" }}>
          <div>
            <span style={{ color: "#00c8ff", fontSize: 20, fontWeight: 700 }}>
              ${product.price.toFixed(2)}
            </span>
            {product.compareAtPrice && (
              <span
                style={{
                  color: "#64748b",
                  fontSize: 14,
                  textDecoration: "line-through",
                  marginLeft: 8,
                }}
              >
                ${product.compareAtPrice.toFixed(2)}
              </span>
            )}
          </div>
          <button
            onClick={() => addToCart(product)}
            disabled={!product.inStock}
            style={{
              padding: "10px 16px",
              background: product.inStock
                ? "linear-gradient(135deg, #00c8ff, #0080ff)"
                : "rgba(100, 100, 120, 0.3)",
              color: product.inStock ? "white" : "#64748b",
              border: "none",
              borderRadius: 6,
              fontWeight: 600,
              fontSize: 13,
              cursor: product.inStock ? "pointer" : "not-allowed",
            }}
          >
            {product.inStock ? "Add to Cart" : "Sold Out"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EngineManagementPage() {
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
    const brands = [...new Set(emsProducts.map((p) => p.brand))];
    return brands.sort();
  }, []);

  // Filter products
  const filteredProducts = useMemo(() => {
    return emsProducts.filter((product) => {
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

  // Group filtered products into sections
  const groupedProducts = useMemo(() => {
    const sections: { section: ProductSection; products: EMSProduct[] }[] = [];
    const usedProductIds = new Set<string>();

    for (const section of productSections) {
      const sectionProducts = filteredProducts.filter((p) => {
        if (usedProductIds.has(p.id)) return false;
        return section.filter(p);
      });
      
      if (sectionProducts.length > 0) {
        // Sort products by price low to high within each section
        sectionProducts.sort((a, b) => a.price - b.price);
        sectionProducts.forEach((p) => usedProductIds.add(p.id));
        sections.push({ section, products: sectionProducts });
      }
    }

    // Catch any remaining products
    const remainingProducts = filteredProducts.filter((p) => !usedProductIds.has(p.id));
    if (remainingProducts.length > 0) {
      // Sort remaining products by price low to high
      remainingProducts.sort((a, b) => a.price - b.price);
      sections.push({
        section: { id: "other", title: "Other Products", description: "Additional products", icon: "📦", filter: () => true },
        products: remainingProducts,
      });
    }

    return sections;
  }, [filteredProducts]);

  // Check if we're searching or filtering (show flat list) vs browsing (show sections)
  const showSections = !searchQuery && selectedCategory === "all" && selectedBrand === "all";

  // Cart functions
  const addToCart = (product: EMSProduct) => {
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
          image: product.image,
          shippingCost: product.shippingCost ?? getShippingCostByPrice(product.price),
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

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Calculate shipping - use max of custom shipping costs or default
  const shippingTotal = useMemo(() => {
    const customShipping = cart.reduce((max, item) => {
      if (item.shippingCost && item.shippingCost > max) return item.shippingCost;
      return max;
    }, 0);
    return customShipping > 0 ? customShipping : SHIPPING_COST;
  }, [cart]);

  // Tax calculation
  const taxInfo = useMemo(() => {
    if (!checkoutForm.state) {
      return { taxAmount: 0, taxRate: 0, stateAbbr: null };
    }
    return calculateSalesTax(cartTotal, checkoutForm.state, false, shippingTotal);
  }, [cartTotal, checkoutForm.state, shippingTotal]);

  const orderTotal = cartTotal + shippingTotal + taxInfo.taxAmount;

  const usStates = useMemo(() => getAllStates(), []);

  const handleCheckoutSubmit = async () => {
    if (
      !checkoutForm.name ||
      !checkoutForm.email ||
      !checkoutForm.address ||
      !checkoutForm.city ||
      !checkoutForm.state ||
      !checkoutForm.zip
    ) {
      alert("Please fill in all required fields");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(checkoutForm.email)) {
      alert("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/shop/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            name: checkoutForm.name,
            email: checkoutForm.email,
            phone: checkoutForm.phone,
          },
          shipping: {
            address: checkoutForm.address,
            city: checkoutForm.city,
            state: checkoutForm.state,
            zip: checkoutForm.zip,
          },
          items: cart.map((item) => ({
            id: item.id,
            name: `${item.brand} ${item.name}`,
            partNumber: item.partNumber,
            quantity: item.quantity,
            price: item.price,
          })),
          tax: {
            amount: taxInfo.taxAmount,
            rate: taxInfo.taxRate,
            state: taxInfo.stateAbbr,
          },
          notes: checkoutForm.notes,
        }),
      });

      const data = await response.json();

      if (data.ok) {
        setOrderComplete({
          orderNumber: data.order.orderNumber,
          total: data.order.total,
          paypalUrl: data.paypalUrl,
        });
        setCart([]);
        setCartOpen(false);
      } else {
        alert(data.message || "Failed to create order");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      alert("Failed to process order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetCheckout = () => {
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
    <main style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 100%)" }}>
      {/* Cart Overlay */}
      {cartOpen && (
        <div
          onClick={() => setCartOpen(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            zIndex: 999,
          }}
        />
      )}

      {/* Cart Sidebar */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: cartOpen ? 0 : -420,
          width: 400,
          height: "100vh",
          background: "rgba(10, 10, 30, 0.98)",
          borderLeft: "1px solid rgba(0, 200, 255, 0.3)",
          zIndex: 1001,
          transition: "right 0.3s ease",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ padding: 20, borderBottom: "1px solid rgba(100, 100, 120, 0.3)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ color: "#e2e8f0", fontSize: 20, fontWeight: 700, margin: 0 }}>
              🛒 Cart ({cartCount})
            </h2>
            <button
              onClick={() => setCartOpen(false)}
              style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 24, cursor: "pointer" }}
            >
              ×
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
          {cart.length === 0 ? (
            <p style={{ color: "#64748b", textAlign: "center", marginTop: 40 }}>Your cart is empty</p>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  gap: 12,
                  padding: 12,
                  background: "rgba(30, 30, 50, 0.5)",
                  borderRadius: 8,
                  marginBottom: 12,
                }}
              >
                <div style={{ width: 60, height: 60, background: "rgba(0,200,255,0.1)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>
                  🖥️
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 600, margin: "0 0 2px 0" }}>
                    {item.brand}
                  </h4>
                  <p style={{ color: "#94a3b8", fontSize: 12, margin: "0 0 4px 0" }}>{item.name}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      style={{
                        width: 24,
                        height: 24,
                        background: "rgba(100, 100, 120, 0.3)",
                        border: "none",
                        borderRadius: 4,
                        color: "#e2e8f0",
                        cursor: "pointer",
                      }}
                    >
                      -
                    </button>
                    <span style={{ color: "#e2e8f0", fontSize: 14 }}>{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      style={{
                        width: 24,
                        height: 24,
                        background: "rgba(100, 100, 120, 0.3)",
                        border: "none",
                        borderRadius: 4,
                        color: "#e2e8f0",
                        cursor: "pointer",
                      }}
                    >
                      +
                    </button>
                    <span style={{ color: "#00c8ff", fontSize: 14, fontWeight: 600, marginLeft: "auto" }}>
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => removeFromCart(item.id)}
                  style={{ background: "none", border: "none", color: "#ef4444", fontSize: 18, cursor: "pointer", padding: 0 }}
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div style={{ padding: 20, borderTop: "1px solid rgba(100, 100, 120, 0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: "#94a3b8", fontSize: 14 }}>Subtotal:</span>
              <span style={{ color: "#e2e8f0", fontSize: 14 }}>${cartTotal.toFixed(2)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: "#94a3b8", fontSize: 14 }}>Shipping:</span>
              <span style={{ color: "#e2e8f0", fontSize: 14 }}>${shippingTotal.toFixed(2)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: "#94a3b8", fontSize: 14 }}>Tax:</span>
              <span style={{ color: "#e2e8f0", fontSize: 14 }}>
                {taxInfo.stateAbbr ? `$${taxInfo.taxAmount.toFixed(2)}` : "Calculated at checkout"}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 16,
                paddingTop: 8,
                borderTop: "1px solid rgba(100, 100, 120, 0.2)",
              }}
            >
              <span style={{ color: "#e2e8f0", fontSize: 16, fontWeight: 600 }}>Total:</span>
              <span style={{ color: "#00c8ff", fontSize: 20, fontWeight: 700 }}>
                ${orderTotal.toFixed(2)}
                {!taxInfo.stateAbbr && "+tax"}
              </span>
            </div>
            <button
              onClick={() => {
                setCartOpen(false);
                setCheckoutOpen(true);
              }}
              style={{
                width: "100%",
                padding: "14px 24px",
                background: "linear-gradient(135deg, #00c8ff, #0080ff)",
                color: "white",
                border: "none",
                borderRadius: 8,
                fontSize: 16,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Proceed to Checkout
            </button>
          </div>
        )}
      </div>

      {/* Checkout Modal */}
      {checkoutOpen && (
        <div
          onClick={() => !orderComplete && resetCheckout()}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.8)",
            zIndex: 1002,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "rgba(10, 10, 30, 0.98)",
              border: "1px solid rgba(0, 200, 255, 0.3)",
              borderRadius: 16,
              maxWidth: 500,
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            {orderComplete ? (
              <div style={{ padding: 32, textAlign: "center" }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
                <h2 style={{ color: "#22c55e", fontSize: 24, fontWeight: 700, margin: "0 0 8px 0" }}>
                  Order Placed!
                </h2>
                <p style={{ color: "#94a3b8", fontSize: 14, margin: "0 0 24px 0" }}>
                  Order #{orderComplete.orderNumber}
                </p>

                <div style={{ background: "rgba(30, 30, 50, 0.5)", borderRadius: 8, padding: 20, marginBottom: 24 }}>
                  <p style={{ color: "#e2e8f0", fontSize: 16, margin: "0 0 8px 0" }}>
                    Total: <strong style={{ color: "#00c8ff" }}>${orderComplete.total.toFixed(2)}</strong>
                  </p>
                  <p style={{ color: "#94a3b8", fontSize: 13, margin: 0 }}>
                    Please complete payment via PayPal to process your order.
                  </p>
                </div>

                <a
                  href={orderComplete.paypalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-block",
                    width: "100%",
                    padding: "14px 24px",
                    background: "#0070ba",
                    color: "white",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 16,
                    fontWeight: 700,
                    textDecoration: "none",
                    marginBottom: 12,
                  }}
                >
                  Pay with PayPal - ${orderComplete.total.toFixed(2)}
                </a>

                <p style={{ color: "#64748b", fontSize: 12, margin: "0 0 20px 0" }}>
                  Include order #{orderComplete.orderNumber} in PayPal notes
                </p>

                <button
                  onClick={resetCheckout}
                  style={{
                    padding: "10px 24px",
                    background: "rgba(100, 100, 120, 0.3)",
                    color: "#94a3b8",
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                  }}
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(100, 100, 120, 0.3)" }}>
                  <h2 style={{ color: "#e2e8f0", fontSize: 20, fontWeight: 700, margin: 0 }}>Checkout</h2>
                </div>

                <div style={{ padding: 24 }}>
                  {/* Order Summary */}
                  <div style={{ marginBottom: 24 }}>
                    <h3 style={{ color: "#94a3b8", fontSize: 12, fontWeight: 600, marginBottom: 12, textTransform: "uppercase" }}>
                      Order Summary
                    </h3>
                    {cart.map((item) => (
                      <div key={item.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <span style={{ color: "#e2e8f0", fontSize: 13 }}>
                          {item.brand} {item.name} x{item.quantity}
                        </span>
                        <span style={{ color: "#e2e8f0", fontSize: 13 }}>${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                    <div style={{ borderTop: "1px solid rgba(100, 100, 120, 0.2)", marginTop: 12, paddingTop: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ color: "#94a3b8", fontSize: 13 }}>Subtotal</span>
                        <span style={{ color: "#e2e8f0", fontSize: 13 }}>${cartTotal.toFixed(2)}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ color: "#94a3b8", fontSize: 13 }}>Shipping</span>
                        <span style={{ color: "#e2e8f0", fontSize: 13 }}>${shippingTotal.toFixed(2)}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ color: "#94a3b8", fontSize: 13 }}>
                          Tax {taxInfo.stateAbbr && `(${taxInfo.stateAbbr} ${formatTaxRate(taxInfo.taxRate)})`}
                        </span>
                        <span style={{ color: "#e2e8f0", fontSize: 13 }}>
                          {taxInfo.stateAbbr ? `$${taxInfo.taxAmount.toFixed(2)}` : "Select state"}
                        </span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
                        <span style={{ color: "#e2e8f0", fontSize: 14 }}>Total</span>
                        <span style={{ color: "#00c8ff", fontSize: 16 }}>${orderTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <h3 style={{ color: "#94a3b8", fontSize: 12, fontWeight: 600, marginBottom: 12, textTransform: "uppercase" }}>
                    Contact Information
                  </h3>
                  <div style={{ display: "grid", gap: 12, marginBottom: 24 }}>
                    <input
                      type="text"
                      placeholder="Full Name *"
                      value={checkoutForm.name}
                      onChange={(e) => setCheckoutForm((prev) => ({ ...prev, name: e.target.value }))}
                      style={inputStyle}
                    />
                    <input
                      type="email"
                      placeholder="Email *"
                      value={checkoutForm.email}
                      onChange={(e) => setCheckoutForm((prev) => ({ ...prev, email: e.target.value }))}
                      style={inputStyle}
                    />
                    <input
                      type="tel"
                      placeholder="Phone (optional)"
                      value={checkoutForm.phone}
                      onChange={(e) => setCheckoutForm((prev) => ({ ...prev, phone: e.target.value }))}
                      style={inputStyle}
                    />
                  </div>

                  {/* Shipping Address */}
                  <h3 style={{ color: "#94a3b8", fontSize: 12, fontWeight: 600, marginBottom: 12, textTransform: "uppercase" }}>
                    Shipping Address
                  </h3>
                  <div style={{ display: "grid", gap: 12, marginBottom: 24 }}>
                    <input
                      type="text"
                      placeholder="Street Address *"
                      value={checkoutForm.address}
                      onChange={(e) => setCheckoutForm((prev) => ({ ...prev, address: e.target.value }))}
                      style={inputStyle}
                    />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <input
                        type="text"
                        placeholder="City *"
                        value={checkoutForm.city}
                        onChange={(e) => setCheckoutForm((prev) => ({ ...prev, city: e.target.value }))}
                        style={inputStyle}
                      />
                      <select
                        value={checkoutForm.state}
                        onChange={(e) => setCheckoutForm((prev) => ({ ...prev, state: e.target.value }))}
                        style={{ ...inputStyle, cursor: "pointer" }}
                      >
                        <option value="">Select State *</option>
                        {usStates.map((st) => (
                          <option key={st.abbr} value={st.abbr}>
                            {st.abbr} - {st.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <input
                      type="text"
                      placeholder="ZIP Code *"
                      value={checkoutForm.zip}
                      onChange={(e) => setCheckoutForm((prev) => ({ ...prev, zip: e.target.value }))}
                      style={inputStyle}
                    />
                  </div>

                  {/* Notes */}
                  <textarea
                    placeholder="Order notes (optional)"
                    value={checkoutForm.notes}
                    onChange={(e) => setCheckoutForm((prev) => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    style={{ ...inputStyle, resize: "vertical" }}
                  />
                </div>

                <div style={{ padding: "16px 24px", borderTop: "1px solid rgba(100, 100, 120, 0.3)", display: "flex", gap: 12 }}>
                  <button
                    onClick={resetCheckout}
                    style={{
                      flex: 1,
                      padding: "12px 20px",
                      background: "rgba(100, 100, 120, 0.3)",
                      color: "#94a3b8",
                      border: "none",
                      borderRadius: 8,
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCheckoutSubmit}
                    disabled={isSubmitting}
                    style={{
                      flex: 2,
                      padding: "12px 20px",
                      background: isSubmitting ? "rgba(100, 100, 120, 0.3)" : "linear-gradient(135deg, #00c8ff, #0080ff)",
                      color: isSubmitting ? "#94a3b8" : "white",
                      border: "none",
                      borderRadius: 8,
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: isSubmitting ? "not-allowed" : "pointer",
                    }}
                  >
                    {isSubmitting ? "Processing..." : `Place Order - $${orderTotal.toFixed(2)}`}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "20px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 30 }}>
          <div>
            <Link href="/shop" style={{ color: "#00c8ff", textDecoration: "none", fontSize: 14 }}>
              ← Back to Shop
            </Link>
            <h1
              style={{
                fontSize: "2.5rem",
                marginTop: 10,
                marginBottom: 8,
                background: "linear-gradient(90deg, #00c8ff, #0080ff)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              🖥️ Engine Management
            </h1>
            <p style={{ color: "#94a3b8", fontSize: 16, margin: 0 }}>
              ECUs, wideband controllers, sensors & tuning accessories
            </p>
          </div>

          <button
            onClick={() => setCartOpen(true)}
            style={{
              background: "linear-gradient(135deg, #00c8ff, #0080ff)",
              color: "white",
              border: "none",
              padding: "12px 24px",
              borderRadius: 8,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            🛒 Cart {cartCount > 0 && `(${cartCount})`}
          </button>
        </div>

        {/* Category Pills */}
        <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
          <button
            onClick={() => setSelectedCategory("all")}
            style={{
              padding: "10px 18px",
              background: selectedCategory === "all" ? "linear-gradient(135deg, #00c8ff, #0080ff)" : "rgba(30, 30, 50, 0.8)",
              border: selectedCategory === "all" ? "none" : "1px solid rgba(0, 200, 255, 0.3)",
              borderRadius: 20,
              color: selectedCategory === "all" ? "white" : "#e2e8f0",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            All Products
          </button>
          {Object.entries(categoryLabels).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              style={{
                padding: "10px 18px",
                background: selectedCategory === key ? "linear-gradient(135deg, #00c8ff, #0080ff)" : "rgba(30, 30, 50, 0.8)",
                border: selectedCategory === key ? "none" : "1px solid rgba(0, 200, 255, 0.3)",
                borderRadius: 20,
                color: selectedCategory === key ? "white" : "#e2e8f0",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              {categoryIcons[key]} {label}
            </button>
          ))}
        </div>

        {/* Filters Row */}
        <div
          style={{
            display: "flex",
            gap: 12,
            marginBottom: 24,
            flexWrap: "wrap",
            background: "rgba(0,0,0,0.3)",
            padding: 16,
            borderRadius: 10,
          }}
        >
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: "10px 14px",
              background: "rgba(30,30,50,0.8)",
              border: "1px solid rgba(0,200,255,0.2)",
              borderRadius: 6,
              color: "#fff",
              minWidth: 250,
            }}
          />
          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            style={{
              padding: "10px 14px",
              background: "rgba(30,30,50,0.8)",
              border: "1px solid rgba(0,200,255,0.2)",
              borderRadius: 6,
              color: "#fff",
            }}
          >
            <option value="all">All Brands</option>
            {uniqueBrands.map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
          </select>
          <div style={{ marginLeft: "auto", color: "#94a3b8", fontSize: 14, alignSelf: "center" }}>
            {filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Products Grid or Coming Soon */}
        {filteredProducts.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60 }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🖥️</div>
            <h2 style={{ color: "#00c8ff", fontSize: 24, fontWeight: 700, marginBottom: 12 }}>
              Coming Soon
            </h2>
            <p style={{ color: "#94a3b8", fontSize: 16, maxWidth: 500, margin: "0 auto" }}>
              We&apos;re sourcing the best engine management products at competitive prices. 
              Check back soon for ECUs, wideband controllers, sensors, and more!
            </p>
          </div>
        ) : showSections ? (
          // Sectioned view when browsing all products
          <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
            {groupedProducts.map(({ section, products }) => (
              <div key={section.id}>
                {/* Section Header */}
                <div style={{ 
                  marginBottom: 20, 
                  paddingBottom: 12, 
                  borderBottom: "1px solid rgba(0, 200, 255, 0.2)" 
                }}>
                  <h2 style={{ 
                    color: "#00c8ff", 
                    fontSize: 22, 
                    fontWeight: 700, 
                    margin: 0, 
                    display: "flex", 
                    alignItems: "center", 
                    gap: 10 
                  }}>
                    <span style={{ fontSize: 24 }}>{section.icon}</span>
                    {section.title}
                    <span style={{ 
                      fontSize: 14, 
                      fontWeight: 500, 
                      color: "#64748b", 
                      marginLeft: 8 
                    }}>
                      ({products.length})
                    </span>
                  </h2>
                  <p style={{ color: "#94a3b8", fontSize: 14, margin: "8px 0 0 0" }}>
                    {section.description}
                  </p>
                </div>
                
                {/* Section Products Grid */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                    gap: 20,
                  }}
                >
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} addToCart={addToCart} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Flat grid when searching or filtering
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: 20,
            }}
          >
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} addToCart={addToCart} />
            ))}
          </div>
        )}

        {/* Info Section */}
        <div
          style={{
            marginTop: 40,
            padding: 24,
            background: "rgba(20, 20, 40, 0.6)",
            borderRadius: 12,
            border: "1px solid rgba(0, 200, 255, 0.2)",
          }}
        >
          <h3 style={{ color: "#00c8ff", fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
            🖥️ Engine Management Essentials
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 20 }}>
            <div>
              <h4 style={{ color: "#e2e8f0", fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                🎯 Standalone ECUs
              </h4>
              <p style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.5 }}>
                Full control over fuel, ignition, boost, and more. Essential for serious builds with aftermarket cams, forced induction, or E85.
              </p>
            </div>
            <div>
              <h4 style={{ color: "#e2e8f0", fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                📊 Wideband O2
              </h4>
              <p style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.5 }}>
                Accurate AFR monitoring is critical for tuning. A quality wideband controller helps you dial in fuel curves safely.
              </p>
            </div>
            <div>
              <h4 style={{ color: "#e2e8f0", fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                📈 Datalogging
              </h4>
              <p style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.5 }}>
                Record sensor data during runs to analyze performance, catch issues early, and refine your tune over time.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Cart Button (Mobile) */}
      <button
        onClick={() => setCartOpen(true)}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          width: 60,
          height: 60,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #00c8ff, #0080ff)",
          color: "white",
          border: "none",
          fontSize: 24,
          cursor: "pointer",
          boxShadow: "0 4px 20px rgba(0, 200, 255, 0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 100,
        }}
      >
        🛒
        {cartCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: -4,
              right: -4,
              background: "#ef4444",
              color: "white",
              width: 22,
              height: 22,
              borderRadius: "50%",
              fontSize: 12,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {cartCount}
          </span>
        )}
      </button>
    </main>
  );
}
