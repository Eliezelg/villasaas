import { useTranslations } from 'next-intl';
import Link from 'next/link';

export default function NotFound() {
  const t = useTranslations();
  
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-lg text-muted-foreground mb-8">
          {t('common.messages.notFound')}
        </p>
        <Link href="/" className="text-primary hover:underline">
          {t('common.actions.backToHome')}
        </Link>
      </div>
    </div>
  );
}
