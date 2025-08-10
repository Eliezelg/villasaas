'use client'

import Image from 'next/image'

interface PageHeaderProps {
  title: string
  subtitle?: string
  backgroundImage?: string
}

export function PageHeader({ 
  title, 
  subtitle, 
  backgroundImage = '/images/hero-default.jpg' 
}: PageHeaderProps) {
  // Si l'image vient de l'API (commence par http), on l'utilise directement
  // Sinon on utilise une image locale
  const isExternalImage = backgroundImage?.startsWith('http')
  
  return (
    <section className="relative h-[70vh] flex items-center justify-center overflow-hidden">
      {/* Image de fond */}
      {isExternalImage ? (
        <img 
          src={backgroundImage}
          alt={title}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: `url('${backgroundImage}')`,
            backgroundColor: '#2C3E50'
          }}
        />
      )}
      
      {/* Overlay sombre */}
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>
      
      {/* Contenu */}
      <div className="relative text-center text-white px-4 z-10">
        <h1 className="font-playfair text-5xl md:text-6xl mb-6 leading-tight drop-shadow-lg">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xl max-w-2xl mx-auto leading-relaxed opacity-90 drop-shadow">
            {subtitle}
          </p>
        )}
      </div>
    </section>
  )
}