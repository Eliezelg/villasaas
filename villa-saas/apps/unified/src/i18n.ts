import { getRequestConfig } from 'next-intl/server';
import { messages } from '@villa-saas/i18n';

export default getRequestConfig(async ({ locale }) => {
  // Provide a default locale if none is provided
  const currentLocale = locale || 'fr';
  
  return {
    locale: currentLocale,
    messages: messages[currentLocale as keyof typeof messages] || messages.fr,
    timeZone: 'Europe/Paris',
    now: new Date(),
  };
});