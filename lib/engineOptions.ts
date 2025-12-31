export type CamMakeKey =
  | "Ford"
  | "Chevrolet"
  | "Dodge/Mopar"
  | "Jeep"
  | "Toyota"
  | "Honda"
  | "Nissan"
  | "Subaru"
  | "Mitsubishi"
  | "Mazda"
  | "BMW"
  | "VW/Audi"
  | "Mercedes"
  | "Other";

export const CAM_MAKE_OPTIONS: CamMakeKey[] = [
  "Ford",
  "Chevrolet",
  "Dodge/Mopar",
  "Jeep",
  "Toyota",
  "Honda",
  "Nissan",
  "Subaru",
  "Mitsubishi",
  "Mazda",
  "BMW",
  "VW/Audi",
  "Mercedes",
  "Other",
];

export const CAM_ENGINE_FAMILIES: Record<CamMakeKey, string[]> = {
  Ford: [
    "Small Block Windsor (221/260/289/302/351W)",
    "Cleveland (351C/351M/400)",
    "FE Big Block (352/390/406/427/428)",
    "385-Series (429/460)",
    "Modular 4.6/5.4 (2V/3V/4V)",
    "Coyote 5.0 (Gen 1/2/3/4)",
    "Godzilla 7.3",
    "EcoBoost V6 (3.5/2.7)",
    "Lima 2.3",
    "Y-Block",
    "Other Ford",
  ],
  Chevrolet: [
    "Gen I Small Block (265–400)",
    "Gen II LT1/LT4 (1992–1997)",
    "Gen III/IV LS (4.8/5.3/6.0/6.2 etc.)",
    "Gen V LT (LT1/LT4/LT2 etc.)",
    "Big Block Mark IV (396/402/427/454)",
    "Big Block Gen V/VI (454/502 etc.)",
    "Other Chevy",
  ],
  "Dodge/Mopar": [
    "LA Small Block (273/318/340/360)",
    "Magnum (5.2/5.9)",
    "Gen III Hemi (5.7/6.1/6.4/6.2)",
    "RB Big Block (383/400/413/426W/440)",
    "B Big Block",
    "Slant-6",
    "Other Mopar",
  ],
  Jeep: [
    "AMC Inline-6 (4.0L/4.2L)",
    "Pentastar V6 (3.6L)",
    "Hurricane I4 (2.0L Turbo)",
    "Hurricane I6 (3.0L Twin-Turbo)",
    "Hemi V8 (5.7/6.4)",
    "AMC V8 (304/360/401)",
    "GM 2.5L Iron Duke",
    "Willys Go-Devil (L-134)",
    "Willys Hurricane (F-134)",
    "Buick Dauntless V6 (225)",
    "Other Jeep",
  ],
  Toyota: ["2JZ", "1JZ", "UZ (1UZ/2UZ/3UZ)", "UR", "GR", "Other Toyota"],
  Honda: ["B-Series", "K-Series", "D-Series", "H-Series", "J-Series", "Other Honda"],
  Nissan: ["SR", "RB", "VG", "VQ", "VR", "Other Nissan"],
  Subaru: ["EJ", "FA/FB", "Other Subaru"],
  Mitsubishi: ["4G63", "4B11", "Other Mitsubishi"],
  Mazda: ["BP", "B6", "K-Series V6", "13B (Rotary)", "Other Mazda"],
  BMW: ["M50/M52", "S50/S52", "N54", "S55", "B58", "S58", "Other BMW"],
  "VW/Audi": ["1.8T", "2.0T EA888", "VR6", "07K 2.5", "Other VW/Audi"],
  Mercedes: ["M113", "M112", "M156", "M157", "Other Mercedes"],
  Other: ["Other / Custom"],
};

export type HeadMakeKey =
  | "Ford"
  | "GM"
  | "Mopar"
  | "Jeep"
  | "Toyota"
  | "Honda"
  | "Nissan"
  | "Mazda"
  | "Subaru"
  | "Mitsubishi"
  | "VW/Audi"
  | "BMW"
  | "Mercedes"
  | "Hyundai/Kia"
  | "Other";

export const HEAD_MAKE_OPTIONS: HeadMakeKey[] = [
  "Ford",
  "GM",
  "Mopar",
  "Jeep",
  "Toyota",
  "Honda",
  "Nissan",
  "Mazda",
  "Subaru",
  "Mitsubishi",
  "VW/Audi",
  "BMW",
  "Mercedes",
  "Hyundai/Kia",
  "Other",
];

export const HEAD_ENGINE_FAMILIES: Record<HeadMakeKey, string[]> = {
  Ford: [
    "Small Block Windsor",
    "Small Block Cleveland",
    "Modular 4.6/5.4",
    "Coyote 5.0",
    "Godzilla 7.3",
    "FE Big Block",
    "385 Series (429/460)",
    "EcoBoost 2.3",
    "EcoBoost 2.7/3.0/3.5",
  ],
  GM: [
    "LS (Gen III/IV)",
    "LT (Gen V)",
    "Small Block Chevy (SBC)",
    "Big Block Chevy (BBC)",
    "Gen I/II LT1/LT4 (90s)",
    "Ecotec",
    "Duramax",
  ],
  Mopar: [
    "Gen III HEMI (5.7/6.1/6.4)",
    "Hellcat 6.2",
    "LA Small Block",
    "Magnum Small Block",
    "B/RB Big Block",
    "Slant-6",
  ],
  Jeep: [
    "AMC Inline-6 (4.0L/4.2L)",
    "Pentastar V6 (3.6L)",
    "Hurricane I4 (2.0L Turbo)",
    "Hurricane I6 (3.0L Twin-Turbo)",
    "Hemi V8 (5.7/6.4)",
    "AMC V8 (304/360/401)",
  ],
  Toyota: ["2JZ", "1JZ", "3S", "1UZ/3UZ", "2UZ", "GR (3.5/4.0/4.3)"],
  Honda: ["B-Series", "K-Series", "D-Series", "H/F-Series", "J-Series"],
  Nissan: ["SR20", "RB (RB20/25/26)", "VQ (VQ35/37)", "VR30", "KA24"],
  Mazda: ["BP", "13B Rotary", "MZR/Duratec", "Skyactiv"],
  Subaru: ["EJ", "FA/FB"],
  Mitsubishi: ["4G63", "4B11"],
  "VW/Audi": ["1.8T", "2.0T EA888", "VR6", "5-Cyl (07K)", "Audi V6T/V8"],
  BMW: ["N54", "N55", "B58", "S55", "S58"],
  Mercedes: ["M113", "M156", "M157", "M177/M178", "OM606"],
  "Hyundai/Kia": ["Theta II 2.0T", "Lambda V6", "Smartstream"],
  Other: ["Other/Custom"],
};
