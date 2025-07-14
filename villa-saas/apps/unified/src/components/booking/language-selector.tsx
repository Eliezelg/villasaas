'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { locales, localeNames } from '@villa-saas/i18n';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const languageFlags: Record<string, string> = {
  fr: '🇫🇷',
  en: '🇬🇧',
  es: '🇪🇸',
  de: '🇩🇪',
  it: '🇮🇹',
  pt: '🇵🇹',
  nl: '🇳🇱',
  ru: '🇷🇺',
  zh: '🇨🇳',
  ja: '🇯🇵',
  ar: '🇸🇦',
  he: '🇮🇱',
  hi: '🇮🇳',
  tr: '🇹🇷',
  pl: '🇵🇱',
};

export function LanguageSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();

  const handleLocaleChange = (newLocale: string) => {
    // Remplacer la locale actuelle dans le pathname
    const segments = pathname.split('/');
    segments[1] = newLocale; // segments[0] est vide, segments[1] est la locale
    const newPath = segments.join('/');
    
    router.push(newPath);
  };

  return (
    <Select value={locale} onValueChange={handleLocaleChange}>
      <SelectTrigger className="w-[140px]">
        <SelectValue>
          <span className="flex items-center gap-2">
            <span>{languageFlags[locale]}</span>
            <span>{localeNames[locale as keyof typeof localeNames]}</span>
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {locales.map((loc) => (
          <SelectItem key={loc} value={loc}>
            <span className="flex items-center gap-2">
              <span>{languageFlags[loc]}</span>
              <span>{localeNames[loc as keyof typeof localeNames]}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}