export type BoostSuitability = "yes" | "no" | "either";

export type CamRecommendation = {
  id: string;
  make: string;
  family: string;
  brand: string;
  pn: string;
  name?: string;
  durInt: number;
  durExh: number;
  lsa: number;
  liftInt: number;
  liftExh: number;
  peakHpRpm: number;
  boostOK: BoostSuitability;
  notes?: string;
  sourceUrl?: string;
};
