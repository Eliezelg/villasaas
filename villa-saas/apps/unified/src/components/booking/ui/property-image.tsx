'use client'

import { useState } from 'react'
import Image from 'next/image'

interface PropertyImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  sizes?: string
  quality?: number
}

export function PropertyImage({ 
  src, 
  alt, 
  width = 400, 
  height = 300, 
  className = '', 
  priority = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  quality = 75
}: PropertyImageProps) {
  const [error, setError] = useState(false)
  const [isLoading, setIsLoading] = useState(!priority)
  
  // Si erreur avec Next/Image, utiliser une image normale
  if (error) {
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        style={{ width: '100%', height: 'auto' }}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
      />
    )
  }
  
  // Pour les images locales, S3 ou R2, utiliser Next/Image
  if (src.startsWith('/') || src.startsWith('http://localhost') || src.includes('amazonaws.com') || src.includes('r2.dev')) {
    return (
      <div className={`relative ${isLoading ? 'animate-pulse bg-gray-200' : ''}`}>
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
          priority={priority}
          quality={quality}
          sizes={sizes}
          onLoad={() => setIsLoading(false)}
          onError={() => setError(true)}
          placeholder="empty"
        />
      </div>
    )
  }
  
  // Pour les autres images externes, utiliser une balise img normale avec lazy loading
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={{ width: '100%', height: 'auto' }}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
    />
  )
}