import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n/request';

export default createMiddleware({
  locales,
  defaultLocale,
  localeDetection: true,
});

export const config = {
  // Skip locale handling for API routes, static files, etc.
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
