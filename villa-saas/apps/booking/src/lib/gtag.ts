export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

// https://developers.google.com/analytics/devguides/collection/gtagjs/pages
export const pageview = (url: string) => {
  if (!GA_TRACKING_ID || typeof window === 'undefined') return
  
  window.gtag('config', GA_TRACKING_ID, {
    page_path: url,
  })
}

// https://developers.google.com/analytics/devguides/collection/gtagjs/events
export const event = ({ action, category, label, value }: {
  action: string
  category: string
  label?: string
  value?: number
}) => {
  if (!GA_TRACKING_ID || typeof window === 'undefined') return
  
  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  })
}

// Booking events
export const trackBookingStarted = (propertyId: string, propertyName: string) => {
  event({
    action: 'begin_checkout',
    category: 'ecommerce',
    label: propertyName,
    value: 1,
  })
}

export const trackBookingCompleted = (bookingId: string, amount: number) => {
  event({
    action: 'purchase',
    category: 'ecommerce',
    label: bookingId,
    value: amount,
  })
}

export const trackPropertyView = (propertyId: string, propertyName: string) => {
  event({
    action: 'view_item',
    category: 'engagement',
    label: propertyName,
  })
}

export const trackSearch = (searchTerm: string, resultsCount: number) => {
  event({
    action: 'search',
    category: 'engagement',
    label: searchTerm,
    value: resultsCount,
  })
}

export const trackCalendarInteraction = (propertyId: string) => {
  event({
    action: 'calendar_interaction',
    category: 'engagement',
    label: propertyId,
  })
}

// Types for window.gtag
declare global {
  interface Window {
    gtag: (...args: any[]) => void
  }
}