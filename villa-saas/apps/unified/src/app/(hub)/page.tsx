'use client';

import { useState } from 'react';
import { Sparkles, MapPin, Calendar, Users, Home as HomeIcon, Building2, ChevronRight } from 'lucide-react';
import { AIChat } from '@/components/chat/ai-chat';
import Link from 'next/link';

export default function HomePage() {
  const [showChat, setShowChat] = useState(false);
  const [foundProperties, setFoundProperties] = useState<any[]>([]);

  const handlePropertiesFound = (properties: any[]) => {
    setFoundProperties(properties);
    // TODO: Afficher les propriétés trouvées
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-10 p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-purple-600" />
            <h1 className="text-2xl font-bold text-gray-900">Villa Hub AI</h1>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#" className="text-gray-600 hover:text-gray-900 transition">Explorer</a>
            <a href="#" className="text-gray-600 hover:text-gray-900 transition">Expériences</a>
            <a href="#proprietaires" className="text-gray-600 hover:text-gray-900 transition">Propriétaires</a>
            <Link href="/admin/signup" className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
              Commencer gratuitement
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Trouvez votre séjour parfait
            <span className="block text-purple-600">avec l&apos;IA</span>
          </h2>
          <p className="text-xl text-gray-600 mb-12">
            Décrivez votre voyage idéal et laissez notre IA trouver les meilleures propriétés pour vous
          </p>

          {/* AI Chat Interface */}
          {showChat ? (
            <div className="mb-12">
              <AIChat onPropertiesFound={handlePropertiesFound} />
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-12">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Sparkles className="h-6 w-6 text-purple-600" />
                  <h3 className="text-xl font-semibold text-gray-900">Assistant IA de Voyage</h3>
                </div>
                <p className="text-gray-700 mb-6">
                  Décrivez votre séjour idéal et laissez notre IA trouver les meilleures propriétés pour vous
                </p>
                <button
                  onClick={() => setShowChat(true)}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
                >
                  Commencer la recherche
                </button>
              </div>
            </div>
          )}

          {/* Quick Search Options */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <button className="flex items-center justify-center gap-2 p-4 bg-white rounded-lg shadow hover:shadow-md transition">
              <MapPin className="h-5 w-5 text-purple-600" />
              <span>Côte d&apos;Azur</span>
            </button>
            <button className="flex items-center justify-center gap-2 p-4 bg-white rounded-lg shadow hover:shadow-md transition">
              <Calendar className="h-5 w-5 text-purple-600" />
              <span>Ce weekend</span>
            </button>
            <button className="flex items-center justify-center gap-2 p-4 bg-white rounded-lg shadow hover:shadow-md transition">
              <Users className="h-5 w-5 text-purple-600" />
              <span>Famille</span>
            </button>
            <button className="flex items-center justify-center gap-2 p-4 bg-white rounded-lg shadow hover:shadow-md transition">
              <HomeIcon className="h-5 w-5 text-purple-600" />
              <span>Villa piscine</span>
            </button>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">IA Conversationnelle</h3>
              <p className="text-gray-600">Décrivez vos besoins en langage naturel</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Recommandations Locales</h3>
              <p className="text-gray-600">Découvrez les meilleures expériences</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <HomeIcon className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Propriétés Vérifiées</h3>
              <p className="text-gray-600">Sélection de qualité garantie</p>
            </div>
          </div>
        </div>

        {/* Section Propriétaires */}
        <section id="proprietaires" className="mt-32 py-20 bg-white/50 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-4xl font-bold text-gray-900 mb-6">
                  Vous êtes propriétaire ?
                  <span className="block text-purple-600">Gérez vos locations facilement</span>
                </h2>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mt-0.5">
                      <ChevronRight className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Dashboard complet</h4>
                      <p className="text-gray-600">Gérez vos propriétés, réservations et revenus en un seul endroit</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mt-0.5">
                      <ChevronRight className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Site de réservation personnalisé</h4>
                      <p className="text-gray-600">Votre propre site avec votre domaine et votre marque</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mt-0.5">
                      <ChevronRight className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Synchronisation multi-canaux</h4>
                      <p className="text-gray-600">Connectez Airbnb, Booking.com et plus encore</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mt-0.5">
                      <ChevronRight className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Paiements automatisés</h4>
                      <p className="text-gray-600">Recevez vos paiements directement via Stripe</p>
                    </div>
                  </li>
                </ul>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/admin/signup" className="inline-flex items-center justify-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium">
                    Essai gratuit 30 jours
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Link>
                  <Link href="/admin/login" className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium">
                    Se connecter
                  </Link>
                </div>
              </div>
              <div className="relative">
                <div className="bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl p-8">
                  <div className="bg-white rounded-xl shadow-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Building2 className="h-8 w-8 text-purple-600" />
                      <h3 className="text-xl font-bold">Tableau de bord</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="bg-gray-100 rounded-lg p-3">
                        <div className="text-sm text-gray-600">Revenus ce mois</div>
                        <div className="text-2xl font-bold text-gray-900">12 450 €</div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-100 rounded-lg p-3">
                          <div className="text-sm text-gray-600">Réservations</div>
                          <div className="text-xl font-bold text-gray-900">24</div>
                        </div>
                        <div className="bg-gray-100 rounded-lg p-3">
                          <div className="text-sm text-gray-600">Taux occupation</div>
                          <div className="text-xl font-bold text-gray-900">87%</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}