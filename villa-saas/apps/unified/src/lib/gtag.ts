export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

// https://developers.google.com/analytics/devguides/collection/gtagjs/pages
export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag && GA_TRACKING_ID) {
    window.gtag('config', GA_TRACKING_ID, {
      page_path: url,
    })
  }
}

// https://developers.google.com/analytics/devguides/collection/gtagjs/events
export const event = ({ action, category, label, value }: {
  action: string
  category: string
  label?: string
  value?: number
}) => {
  if (typeof window !== 'undefined' && window.gtag && GA_TRACKING_ID) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    })
  }
}

// Custom events
export const trackSearch = (searchTerm: string, resultCount?: number) => {
  event({
    action: 'search',
    category: 'engagement',
    label: searchTerm,
    value: resultCount,
  })
}

export const trackPropertyView = (propertyId: string, propertyName: string) => {
  event({
    action: 'view_property',
    category: 'engagement',
    label: `${propertyId} - ${propertyName}`,
  })
}

export const trackBookingStarted = (propertyId: string, propertyName: string) => {
  event({
    action: 'booking_started',
    category: 'conversion',
    label: `${propertyId} - ${propertyName}`,
  })
}

export const trackCalendarInteraction = (propertyId: string) => {
  event({
    action: 'calendar_interaction',
    category: 'engagement',
    label: propertyId,
  })
}

declare global {
  interface Window {
    gtag: (...args: any[]) => void
  }
}