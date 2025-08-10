'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useLocale } from 'next-intl'
import { Menu } from 'lucide-react'

interface BookingHeaderProps {
  siteName?: string
}

export function BookingHeader({ siteName = 'Maison Aviv' }: BookingHeaderProps) {
  const locale = useLocale()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems = [
    { href: `/${locale}`, text: 'Accueil' },
    { href: `/${locale}#chambres`, text: 'Chambres' },
    { href: `/${locale}#installations`, text: 'Installations' },
    { href: `/${locale}#tarifs`, text: 'Tarifs' },
    { href: `/${locale}#contact`, text: 'Contact' }
  ]

  return (
    <nav className="bg-primary/95 backdrop-blur-custom text-white py-4 fixed w-full z-50">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link 
          href={`/${locale}`} 
          className="font-playfair text-2xl hover:text-accent transition-colors"
        >
          {siteName}
        </Link>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex space-x-8">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="hover:text-accent transition-colors text-sm uppercase tracking-wider"
            >
              {item.text}
            </Link>
          ))}
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute w-full bg-primary/95 backdrop-blur-custom">
          <div className="px-4 py-4 space-y-4">
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="block hover:text-accent transition-colors text-sm uppercase tracking-wider"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.text}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  )
}