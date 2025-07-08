export function generatePropertySchema(property: any, tenant: any) {
  const baseUrl = process.env.NEXT_PUBLIC_BOOKING_URL || 'http://localhost:3002'
  
  return {
    '@context': 'https://schema.org',
    '@type': 'LodgingBusiness',
    '@id': `${baseUrl}/properties/${property.id}`,
    name: property.name,
    description: property.description,
    url: `${baseUrl}/properties/${property.id}`,
    image: property.images?.map((img: any) => img.urls?.large || img.url) || [],
    address: {
      '@type': 'PostalAddress',
      streetAddress: property.address?.street,
      addressLocality: property.city,
      postalCode: property.address?.postalCode,
      addressCountry: property.country,
    },
    geo: property.latitude && property.longitude ? {
      '@type': 'GeoCoordinates',
      latitude: property.latitude,
      longitude: property.longitude,
    } : undefined,
    amenityFeature: (Array.isArray(property.amenities) ? property.amenities : []).map((amenity: string) => ({
      '@type': 'LocationFeatureSpecification',
      name: amenity,
      value: true,
    })),
    priceRange: `${property.basePrice}${property.currency || 'EUR'} - ${property.basePrice * 1.5}${property.currency || 'EUR'}`,
    numberOfRooms: property.bedrooms,
    occupancy: {
      '@type': 'QuantitativeValue',
      maxValue: property.maxGuests,
      unitText: 'guests'
    },
    aggregateRating: property.averageRating ? {
      '@type': 'AggregateRating',
      ratingValue: property.averageRating,
      reviewCount: property.reviewCount || 0,
    } : undefined,
    provider: {
      '@type': 'Organization',
      name: tenant?.name || 'Villa Booking',
      url: baseUrl,
    }
  }
}

export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

export function generateOrganizationSchema(tenant: any) {
  const baseUrl = process.env.NEXT_PUBLIC_BOOKING_URL || 'http://localhost:3002'
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: tenant?.name || 'Villa Booking',
    url: baseUrl,
    logo: tenant?.logo,
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: tenant?.contactPhone,
      email: tenant?.contactEmail,
      contactType: 'customer service',
      availableLanguage: ['French', 'English'],
    },
  }
}

export function generateSearchActionSchema() {
  const baseUrl = process.env.NEXT_PUBLIC_BOOKING_URL || 'http://localhost:3002'
  
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    url: baseUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/search?q={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    }
  }
}