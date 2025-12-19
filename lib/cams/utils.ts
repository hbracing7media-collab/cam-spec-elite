const FAMILY_STOPWORDS = new Set([
  "engine",
  "family",
  "series",
  "block",
  "blocks",
  "small",
  "big",
  "gen",
  "iii",
  "iv",
  "v",
  "vi",
  "ls",
  "lt",
  "ohv",
  "ohc",
  "sohc",
  "dohc",
]);

export function stripParenthetical(value: string) {
  return value.replace(/\(.*?\)/g, " ").trim();
}

function sanitizeToken(token: string) {
  return token.replace(/[^a-z0-9]/gi, "").toLowerCase();
}

export function familyTokensForSearch(value: string) {
  return stripParenthetical(value)
    .toLowerCase()
    .split(/[\s/,&-]+/)
    .map((token) => sanitizeToken(token))
    .filter((token) => token.length >= 3 && !/^[0-9]+$/.test(token) && !FAMILY_STOPWORDS.has(token));
}

export function familiesOverlap(a: string, b: string) {
  const aTokens = familyTokensForSearch(a);
  const bTokens = familyTokensForSearch(b);
  if (!aTokens.length || !bTokens.length) {
    return a.trim().toLowerCase() === b.trim().toLowerCase();
  }
  return aTokens.some((token) => bTokens.includes(token));
}
