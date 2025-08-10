'use client'

import Link from 'next/link'
import { useLocale } from 'next-intl'
import { Phone, Mail, MapPin, Facebook, Instagram } from 'lucide-react'

interface BookingFooterProps {
  siteName?: string
  address?: string
  phone?: string
  email?: string
}

export function BookingFooter({ 
  siteName = 'Maison Aviv',
  address = 'Diemeringen, France',
  phone = '+33 3 88 00 00 00',
  email = 'contact@maisonaviv.fr'
}: BookingFooterProps) {
  const locale = useLocale()

  return (
    <footer className="bg-primary text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* À propos */}
          <div>
            <h3 className="font-playfair text-xl mb-4">{siteName}</h3>
            <p className="text-sm opacity-90">
              Une demeure d'exception pour vos événements inoubliables
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-semibold mb-4">Navigation</h4>
            <ul className="space-y-2 text-sm opacity-90">
              <li>
                <Link href={`/${locale}`} className="hover:text-accent transition-colors">
                  Accueil
                </Link>
              </li>
              <li>
                <Link href={`/${locale}#chambres`} className="hover:text-accent transition-colors">
                  Chambres
                </Link>
              </li>
              <li>
                <Link href={`/${locale}#installations`} className="hover:text-accent transition-colors">
                  Installations
                </Link>
              </li>
              <li>
                <Link href={`/${locale}#tarifs`} className="hover:text-accent transition-colors">
                  Tarifs
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-sm opacity-90">
              <li className="flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                {address}
              </li>
              <li className="flex items-center">
                <Phone className="h-4 w-4 mr-2" />
                <a href={`tel:${phone}`} className="hover:text-accent transition-colors">
                  {phone}
                </a>
              </li>
              <li className="flex items-center">
                <Mail className="h-4 w-4 mr-2" />
                <a href={`mailto:${email}`} className="hover:text-accent transition-colors">
                  {email}
                </a>
              </li>
            </ul>
          </div>

          {/* Réseaux sociaux */}
          <div>
            <h4 className="font-semibold mb-4">Suivez-nous</h4>
            <div className="flex space-x-4">
              <a 
                href="#" 
                className="hover:text-accent transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                className="hover:text-accent transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-white/20 text-center text-sm opacity-70">
          <p>&copy; {new Date().getFullYear()} {siteName}. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  )
}