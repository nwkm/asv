import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({ locales: ['en', 'fr'], defaultLocale: 'fr' });
export type Locale = (typeof routing.locales)[number];
