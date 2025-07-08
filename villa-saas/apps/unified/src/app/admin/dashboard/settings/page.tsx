'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { 
  Building2, 
  CreditCard, 
  Users, 
  Mail, 
  Shield, 
  Webhook,
  MessageCircle,
  Bot,
  Settings2
} from 'lucide-react';

const settingsCategories = [
  {
    title: 'Profil entreprise',
    description: 'Gérez les informations de votre entreprise',
    icon: Building2,
    href: '/dashboard/settings/company',
  },
  {
    title: 'Paiements',
    description: 'Configurez vos méthodes de paiement et commissions',
    icon: CreditCard,
    href: '/dashboard/settings/payments',
  },
  {
    title: 'Utilisateurs',
    description: 'Gérez les utilisateurs et leurs permissions',
    icon: Users,
    href: '/dashboard/settings/users',
  },
  {
    title: 'Emails',
    description: 'Personnalisez vos templates d\'emails',
    icon: Mail,
    href: '/dashboard/settings/emails',
  },
  {
    title: 'Réponses automatiques',
    description: 'Configurez les messages automatiques et le chatbot IA',
    icon: Bot,
    href: '/settings/auto-responses',
  },
  {
    title: 'Intégrations',
    description: 'Connectez vos outils externes (Airbnb, Booking.com, etc.)',
    icon: Webhook,
    href: '/dashboard/settings/integrations',
  },
  {
    title: 'Sécurité',
    description: 'Gérez la sécurité et les accès',
    icon: Shield,
    href: '/dashboard/settings/security',
  },
  {
    title: 'Préférences',
    description: 'Personnalisez votre expérience',
    icon: Settings2,
    href: '/dashboard/settings/preferences',
  },
];

export default function SettingsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Paramètres</h1>
        <p className="text-muted-foreground">
          Gérez tous les paramètres de votre compte et de vos propriétés
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {settingsCategories.map((category) => (
          <Link key={category.href} href={category.href}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <category.icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{category.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{category.description}</CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}