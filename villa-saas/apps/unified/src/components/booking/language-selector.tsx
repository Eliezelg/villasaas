'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { locales } from '@villa-saas/i18n';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const languageNames: Record<string, string> = {
  fr: 'Français',
  en: 'English',
};

const languageFlags: Record<string, string> = {
  fr: '🇫🇷',
  en: '🇬🇧',
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
            <span>{languageNames[locale]}</span>
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {locales.map((loc) => (
          <SelectItem key={loc} value={loc}>
            <span className="flex items-center gap-2">
              <span>{languageFlags[loc]}</span>
              <span>{languageNames[loc]}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}