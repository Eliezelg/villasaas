export const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID

export const pageview = () => {
  if (typeof window !== 'undefined' && window.fbq && FB_PIXEL_ID) {
    window.fbq('track', 'PageView')
  }
}

// https://developers.facebook.com/docs/facebook-pixel/advanced/
export const event = (name: string, options = {}) => {
  if (typeof window !== 'undefined' && window.fbq && FB_PIXEL_ID) {
    window.fbq('track', name, options)
  }
}

// Custom tracking events
export const fbTrackSearch = (searchTerm: string) => {
  event('Search', { search_string: searchTerm })
}

export const fbTrackViewContent = (propertyId: string, value?: number) => {
  event('ViewContent', { 
    content_ids: [propertyId],
    content_type: 'product',
    value: value,
    currency: 'EUR'
  })
}

export const fbTrackPropertyView = (propertyId: string, propertyName: string, value?: number) => {
  event('ViewContent', { 
    content_ids: [propertyId],
    content_name: propertyName,
    content_type: 'property',
    value: value,
    currency: 'EUR'
  })
}

export const fbTrackBookingStarted = (value: number) => {
  event('InitiateCheckout', {
    value: value,
    currency: 'EUR'
  })
}

declare global {
  interface Window {
    fbq: (...args: any[]) => void
    _fbq: (...args: any[]) => void
  }
}