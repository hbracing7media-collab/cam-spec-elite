/**
 * US State Sales Tax Rates (2024)
 * Note: These are general state rates. Actual rates may vary by locality.
 * Some states have no sales tax on clothing or specific exemptions.
 */

export interface StateTaxInfo {
  name: string;
  rate: number; // as decimal (e.g., 0.06 = 6%)
  hasLocalTax?: boolean; // If true, actual rate may be higher
}

// State abbreviation -> tax info
export const US_STATE_TAX_RATES: Record<string, StateTaxInfo> = {
  AL: { name: "Alabama", rate: 0.04, hasLocalTax: true },
  AK: { name: "Alaska", rate: 0, hasLocalTax: true }, // No state tax, but some localities have tax
  AZ: { name: "Arizona", rate: 0.056, hasLocalTax: true },
  AR: { name: "Arkansas", rate: 0.065, hasLocalTax: true },
  CA: { name: "California", rate: 0.0725, hasLocalTax: true },
  CO: { name: "Colorado", rate: 0.029, hasLocalTax: true },
  CT: { name: "Connecticut", rate: 0.0635 },
  DE: { name: "Delaware", rate: 0 }, // No sales tax
  FL: { name: "Florida", rate: 0.06, hasLocalTax: true },
  GA: { name: "Georgia", rate: 0.04, hasLocalTax: true },
  HI: { name: "Hawaii", rate: 0.04, hasLocalTax: true },
  ID: { name: "Idaho", rate: 0.06 },
  IL: { name: "Illinois", rate: 0.0625, hasLocalTax: true },
  IN: { name: "Indiana", rate: 0.07 },
  IA: { name: "Iowa", rate: 0.06, hasLocalTax: true },
  KS: { name: "Kansas", rate: 0.065, hasLocalTax: true },
  KY: { name: "Kentucky", rate: 0.06 },
  LA: { name: "Louisiana", rate: 0.0445, hasLocalTax: true },
  ME: { name: "Maine", rate: 0.055 },
  MD: { name: "Maryland", rate: 0.06 },
  MA: { name: "Massachusetts", rate: 0.0625 },
  MI: { name: "Michigan", rate: 0.06 },
  MN: { name: "Minnesota", rate: 0.06875, hasLocalTax: true },
  MS: { name: "Mississippi", rate: 0.07 },
  MO: { name: "Missouri", rate: 0.04225, hasLocalTax: true },
  MT: { name: "Montana", rate: 0 }, // No sales tax
  NE: { name: "Nebraska", rate: 0.055, hasLocalTax: true },
  NV: { name: "Nevada", rate: 0.0685, hasLocalTax: true },
  NH: { name: "New Hampshire", rate: 0 }, // No sales tax
  NJ: { name: "New Jersey", rate: 0.06625 },
  NM: { name: "New Mexico", rate: 0.05125, hasLocalTax: true },
  NY: { name: "New York", rate: 0.04, hasLocalTax: true },
  NC: { name: "North Carolina", rate: 0.0475, hasLocalTax: true },
  ND: { name: "North Dakota", rate: 0.05, hasLocalTax: true },
  OH: { name: "Ohio", rate: 0.0575, hasLocalTax: true },
  OK: { name: "Oklahoma", rate: 0.045, hasLocalTax: true },
  OR: { name: "Oregon", rate: 0 }, // No sales tax
  PA: { name: "Pennsylvania", rate: 0.06, hasLocalTax: true },
  RI: { name: "Rhode Island", rate: 0.07 },
  SC: { name: "South Carolina", rate: 0.06, hasLocalTax: true },
  SD: { name: "South Dakota", rate: 0.042, hasLocalTax: true },
  TN: { name: "Tennessee", rate: 0.07, hasLocalTax: true },
  TX: { name: "Texas", rate: 0.0625, hasLocalTax: true },
  UT: { name: "Utah", rate: 0.061, hasLocalTax: true },
  VT: { name: "Vermont", rate: 0.06, hasLocalTax: true },
  VA: { name: "Virginia", rate: 0.053, hasLocalTax: true },
  WA: { name: "Washington", rate: 0.065, hasLocalTax: true },
  WV: { name: "West Virginia", rate: 0.06 },
  WI: { name: "Wisconsin", rate: 0.05, hasLocalTax: true },
  WY: { name: "Wyoming", rate: 0.04, hasLocalTax: true },
  // Territories
  DC: { name: "District of Columbia", rate: 0.06 },
  PR: { name: "Puerto Rico", rate: 0.115 },
  GU: { name: "Guam", rate: 0.04 },
  VI: { name: "US Virgin Islands", rate: 0.05 },
};

// Common state name variations/aliases
const STATE_NAME_TO_ABBR: Record<string, string> = {
  alabama: "AL",
  alaska: "AK",
  arizona: "AZ",
  arkansas: "AR",
  california: "CA",
  colorado: "CO",
  connecticut: "CT",
  delaware: "DE",
  florida: "FL",
  georgia: "GA",
  hawaii: "HI",
  idaho: "ID",
  illinois: "IL",
  indiana: "IN",
  iowa: "IA",
  kansas: "KS",
  kentucky: "KY",
  louisiana: "LA",
  maine: "ME",
  maryland: "MD",
  massachusetts: "MA",
  michigan: "MI",
  minnesota: "MN",
  mississippi: "MS",
  missouri: "MO",
  montana: "MT",
  nebraska: "NE",
  nevada: "NV",
  "new hampshire": "NH",
  "new jersey": "NJ",
  "new mexico": "NM",
  "new york": "NY",
  "north carolina": "NC",
  "north dakota": "ND",
  ohio: "OH",
  oklahoma: "OK",
  oregon: "OR",
  pennsylvania: "PA",
  "rhode island": "RI",
  "south carolina": "SC",
  "south dakota": "SD",
  tennessee: "TN",
  texas: "TX",
  utah: "UT",
  vermont: "VT",
  virginia: "VA",
  washington: "WA",
  "west virginia": "WV",
  wisconsin: "WI",
  wyoming: "WY",
  "district of columbia": "DC",
  "washington dc": "DC",
  "washington d.c.": "DC",
  "puerto rico": "PR",
  guam: "GU",
  "us virgin islands": "VI",
  "virgin islands": "VI",
};

/**
 * Normalize state input to standard abbreviation
 */
export function normalizeStateInput(input: string): string | null {
  const trimmed = input.trim();
  
  // Check if it's already an abbreviation (2 letters)
  const upper = trimmed.toUpperCase();
  if (upper.length === 2 && US_STATE_TAX_RATES[upper]) {
    return upper;
  }
  
  // Try to match by name
  const lower = trimmed.toLowerCase();
  const abbr = STATE_NAME_TO_ABBR[lower];
  if (abbr) {
    return abbr;
  }
  
  return null;
}

/**
 * Get tax rate for a state
 * @param stateInput - State abbreviation or full name
 * @returns Tax rate as decimal, or null if state not found
 */
export function getStateTaxRate(stateInput: string): number | null {
  const abbr = normalizeStateInput(stateInput);
  if (!abbr) return null;
  
  const info = US_STATE_TAX_RATES[abbr];
  return info ? info.rate : null;
}

/**
 * Get full tax info for a state
 */
export function getStateTaxInfo(stateInput: string): StateTaxInfo | null {
  const abbr = normalizeStateInput(stateInput);
  if (!abbr) return null;
  
  return US_STATE_TAX_RATES[abbr] || null;
}

/**
 * Calculate sales tax for an order
 * @param subtotal - Order subtotal (before tax and shipping)
 * @param stateInput - Shipping state
 * @param includeShipping - Whether to tax shipping (varies by state, default false)
 * @returns Tax amount in dollars
 */
export function calculateSalesTax(
  subtotal: number,
  stateInput: string,
  includeShipping: boolean = false,
  shippingCost: number = 0
): { taxAmount: number; taxRate: number; stateAbbr: string | null } {
  const abbr = normalizeStateInput(stateInput);
  if (!abbr) {
    return { taxAmount: 0, taxRate: 0, stateAbbr: null };
  }
  
  const rate = US_STATE_TAX_RATES[abbr]?.rate ?? 0;
  const taxableAmount = includeShipping ? subtotal + shippingCost : subtotal;
  const taxAmount = Math.round(taxableAmount * rate * 100) / 100; // Round to 2 decimals
  
  return { taxAmount, taxRate: rate, stateAbbr: abbr };
}

/**
 * Format tax rate as percentage string
 */
export function formatTaxRate(rate: number): string {
  return `${(rate * 100).toFixed(2)}%`;
}

// Non-continental US states/territories (excluded from shipping)
const NON_CONTINENTAL_US = ["AK", "HI", "PR", "GU", "VI"];

/**
 * Get list of continental US states only (for dropdowns)
 * Excludes Alaska, Hawaii, Puerto Rico, Guam, and US Virgin Islands
 */
export function getAllStates(): Array<{ abbr: string; name: string; rate: number }> {
  return Object.entries(US_STATE_TAX_RATES)
    .filter(([abbr]) => !NON_CONTINENTAL_US.includes(abbr))
    .map(([abbr, info]) => ({
      abbr,
      name: info.name,
      rate: info.rate,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
