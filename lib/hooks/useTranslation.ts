import { useTranslations } from 'next-intl';

// Re-export for convenient usage
export { useTranslations };

// Type-safe translation hook with namespace
export function useT(namespace?: string) {
  return useTranslations(namespace);
}
