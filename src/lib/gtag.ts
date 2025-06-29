
// ===== 2. GOOGLE ANALYTICS WITH CONSENT =====

import { CookieManager } from "./cookies";

// src/lib/gtag.ts
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

export const GA_TRACKING_ID = 'AW-17267533077';

export const initGA = (): void => {
  if (typeof window === 'undefined') return;

  // Initialize consent first
  CookieManager.initializeGoogleConsent();

  // Initialize Google Analytics
  window.gtag('config', GA_TRACKING_ID, {
    page_title: document.title,
    page_location: window.location.href,
  });
};

export const trackEvent = (action: string, category: string, label?: string, value?: number): void => {
  if (typeof window === 'undefined' || !window.gtag) return;
  
  // Only track if analytics consent is given
  if (!CookieManager.hasAnalyticsConsent()) return;

  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};

export const trackConversion = (conversionId: string, conversionLabel: string, value?: number): void => {
  if (typeof window === 'undefined' || !window.gtag) return;
  
  // Only track if marketing consent is given
  if (!CookieManager.hasMarketingConsent()) return;

  window.gtag('event', 'conversion', {
    send_to: `${conversionId}/${conversionLabel}`,
    value: value || 1,
    currency: 'EUR',
  });
};
