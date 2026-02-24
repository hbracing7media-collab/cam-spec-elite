import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';

export const locales = ['en', 'es', 'de', 'fr', 'ja', 'pt'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

export const localeNames: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
  de: 'Deutsch',
  fr: 'Français',
  ja: '日本語',
  pt: 'Português',
};

export const localeFlags: Record<Locale, string> = {
  en: '🇺🇸',
  es: '🇪🇸',
  de: '🇩🇪',
  fr: '🇫🇷',
  ja: '🇯🇵',
  pt: '🇧🇷',
};

export default getRequestConfig(async () => {
  // Try to get locale from cookie first
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get('locale')?.value as Locale | undefined;
  
  // Fallback to Accept-Language header
  let locale: Locale = defaultLocale;
  
  if (localeCookie && locales.includes(localeCookie)) {
    locale = localeCookie;
  } else {
    const headerStore = await headers();
    const acceptLanguage = headerStore.get('accept-language') || '';
    const browserLocale = acceptLanguage.split(',')[0]?.split('-')[0] as Locale;
    if (locales.includes(browserLocale)) {
      locale = browserLocale;
    }
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
