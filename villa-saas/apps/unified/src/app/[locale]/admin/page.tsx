import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { 
  Building2, 
  Calendar, 
  BarChart3, 
  MessageSquare, 
  Shield, 
  Smartphone,
  CheckCircle,
  ArrowRight
} from 'lucide-react'

const features = [
  {
    icon: Building2,
    title: 'Gestion multi-propriétés',
    description: 'Gérez toutes vos locations depuis une seule plateforme'
  },
  {
    icon: Calendar,
    title: 'Calendrier intelligent',
    description: 'Synchronisation automatique avec Airbnb, Booking.com'
  },
  {
    icon: BarChart3,
    title: 'Analytics avancés',
    description: 'Suivez vos performances et optimisez vos revenus'
  },
  {
    icon: MessageSquare,
    title: 'Messagerie unifiée',
    description: 'Réponses automatiques et chatbot IA intégré'
  },
  {
    icon: Shield,
    title: 'Paiements sécurisés',
    description: 'Stripe Connect pour des transactions sûres'
  },
  {
    icon: Smartphone,
    title: 'Application mobile',
    description: 'Gérez vos propriétés où que vous soyez'
  }
]

const benefits = [
  'Site de réservation personnalisé avec votre domaine',
  'Commission de seulement 15% sur les réservations',
  'Support client dédié 7j/7',
  'Mises à jour et nouvelles fonctionnalités gratuites',
  'Formation et accompagnement inclus',
  'Aucun engagement, résiliable à tout moment'
]

export default function AdminHomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold">Villa SaaS</h1>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/admin/login">
                <Button variant="ghost">Se connecter</Button>
              </Link>
              <Link href="/admin/signup">
                <Button>
                  Commencer gratuitement
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              La plateforme tout-en-un pour gérer vos locations de vacances
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Simplifiez la gestion de vos propriétés, automatisez vos processus et augmentez vos revenus avec notre solution complète.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/admin/signup">
                <Button size="lg" className="px-8">
                  Créer mon compte gratuit
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="#features">
                <Button size="lg" variant="outline">
                  Découvrir les fonctionnalités
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              Essai gratuit de 30 jours • Sans carte bancaire • Sans engagement
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold mb-4">
              Tout ce dont vous avez besoin pour réussir
            </h3>
            <p className="text-lg text-gray-600">
              Des outils puissants pour simplifier votre quotidien
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="p-6 rounded-lg border hover:shadow-lg transition-shadow">
                <div className="mb-4 p-3 bg-primary/10 rounded-lg inline-block">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h4 className="text-xl font-semibold mb-2">{feature.title}</h4>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-primary/5 rounded-2xl p-12">
            <h3 className="text-3xl font-bold mb-8 text-center">
              Pourquoi choisir Villa SaaS ?
            </h3>
            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-lg">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-primary text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h3 className="text-3xl font-bold mb-4">
            Prêt à transformer votre activité de location ?
          </h3>
          <p className="text-xl mb-8 opacity-90">
            Rejoignez des centaines de propriétaires qui ont déjà fait confiance à Villa SaaS
          </p>
          <Link href="/admin/signup">
            <Button size="lg" variant="secondary" className="px-8">
              Commencer maintenant
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t">
        <div className="container mx-auto text-center text-gray-600">
          <p>&copy; 2024 Villa SaaS. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  )
}