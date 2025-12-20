/**
 * Awards Configuration Loader
 * Loads and manages award token metadata from the public awards config
 */

export interface AwardConfig {
  token_id: string;
  slug: string;
  label: string;
  description: string;
  icon: string;
  type: "submission" | "achievement" | "forum" | "special";
  grant_mode: "automatic" | "manual";
  rarity: "common" | "rare" | "epic" | "legendary";
  badge_color: string;
  threshold?: number;
}

export interface AwardsConfig {
  awards: AwardConfig[];
  rarity_colors: Record<string, string>;
}

let awardsCache: AwardsConfig | null = null;

/**
 * Load awards configuration from public/awards-config.json
 */
export async function loadAwardsConfig(): Promise<AwardsConfig> {
  if (awardsCache) return awardsCache;

  try {
    const response = await fetch("/awards-config.json");
    if (!response.ok) throw new Error("Failed to load awards config");
    awardsCache = await response.json();
    return awardsCache;
  } catch (error) {
    console.error("Error loading awards config:", error);
    throw error;
  }
}

/**
 * Get a specific award config by token ID
 */
export async function getAwardByTokenId(
  tokenId: string
): Promise<AwardConfig | null> {
  const config = await loadAwardsConfig();
  return config.awards.find((a) => a.token_id === tokenId) || null;
}

/**
 * Get award config by slug (database slug)
 */
export async function getAwardBySlug(
  slug: string
): Promise<AwardConfig | null> {
  const config = await loadAwardsConfig();
  return config.awards.find((a) => a.slug === slug) || null;
}

/**
 * Get all awards of a specific type
 */
export async function getAwardsByType(
  type: "submission" | "achievement" | "forum" | "special"
): Promise<AwardConfig[]> {
  const config = await loadAwardsConfig();
  return config.awards.filter((a) => a.type === type);
}

/**
 * Get all automatic-grant awards
 */
export async function getAutomaticAwards(): Promise<AwardConfig[]> {
  const config = await loadAwardsConfig();
  return config.awards.filter((a) => a.grant_mode === "automatic");
}

/**
 * Get rarity color mapping
 */
export async function getRarityColors(): Promise<Record<string, string>> {
  const config = await loadAwardsConfig();
  return config.rarity_colors;
}

/**
 * Get color for a specific rarity
 */
export async function getRarityColor(rarity: string): Promise<string> {
  const config = await loadAwardsConfig();
  return config.rarity_colors[rarity] || config.rarity_colors["common"];
}

/**
 * Validate if award exists in config
 */
export async function isValidAward(tokenId: string): Promise<boolean> {
  const award = await getAwardByTokenId(tokenId);
  return award !== null;
}

/**
 * Get award by type and index (useful for querying specific achievement tiers)
 */
export async function getAwardsByTypeAndRarity(
  type: "submission" | "achievement" | "forum" | "special",
  rarity: "common" | "rare" | "epic" | "legendary"
): Promise<AwardConfig[]> {
  const config = await loadAwardsConfig();
  return config.awards.filter((a) => a.type === type && a.rarity === rarity);
}

/**
 * Get total award count
 */
export async function getTotalAwardCount(): Promise<number> {
  const config = await loadAwardsConfig();
  return config.awards.length;
}

/**
 * Get all awards grouped by type
 */
export async function getAwardsGroupedByType(): Promise<
  Record<string, AwardConfig[]>
> {
  const config = await loadAwardsConfig();
  const grouped: Record<string, AwardConfig[]> = {
    submission: [],
    achievement: [],
    forum: [],
    special: [],
  };

  config.awards.forEach((award) => {
    if (grouped[award.type]) {
      grouped[award.type].push(award);
    }
  });

  return grouped;
}
