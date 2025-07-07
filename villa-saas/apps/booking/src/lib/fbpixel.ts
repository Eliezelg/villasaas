export const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID

export const pageview = () => {
  if (!FB_PIXEL_ID || typeof window === 'undefined') return
  
  window.fbq('track', 'PageView')
}

// https://developers.facebook.com/docs/facebook-pixel/advanced/
export const event = (name: string, options = {}) => {
  if (!FB_PIXEL_ID || typeof window === 'undefined') return
  
  window.fbq('track', name, options)
}

// Facebook Pixel Events
export const fbTrackBookingStarted = (value: number, currency: string = 'EUR') => {
  event('InitiateCheckout', {
    value,
    currency,
  })
}

export const fbTrackBookingCompleted = (value: number, currency: string = 'EUR', bookingId: string) => {
  event('Purchase', {
    value,
    currency,
    content_ids: [bookingId],
    content_type: 'product',
  })
}

export const fbTrackPropertyView = (propertyId: string, propertyName: string, value: number) => {
  event('ViewContent', {
    content_ids: [propertyId],
    content_name: propertyName,
    content_type: 'product',
    value,
    currency: 'EUR',
  })
}

export const fbTrackSearch = (searchString: string) => {
  event('Search', {
    search_string: searchString,
  })
}

export const fbTrackAddToWishlist = (propertyId: string, value: number) => {
  event('AddToWishlist', {
    content_ids: [propertyId],
    content_type: 'product',
    value,
    currency: 'EUR',
  })
}

// Types for window.fbq
declare global {
  interface Window {
    fbq: (...args: any[]) => void
    _fbq: (...args: any[]) => void
  }
}