// src/lib/gtag.ts - Fixed Google Analytics with Admin Check
import { CookieManager } from "./cookies";

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

export const GA_TRACKING_ID = 'AW-17267533077';

// Check if we're in admin area or server-side
const isAdminArea = (): boolean => {
  if (typeof window === 'undefined') return true;
  return window.location.pathname.startsWith('/admin');
};

// Check if GA is loaded and available
const isGAAvailable = (): boolean => {
  return typeof window !== 'undefined' && 
         typeof window.gtag === 'function' && 
         Array.isArray(window.dataLayer);
};

export const initGA = (): void => {
  // Don't initialize GA in admin areas or server-side
  if (typeof window === 'undefined' || isAdminArea()) {
    console.log('GA: Skipping initialization (admin area or server-side)');
    return;
  }

  // Check if GA script is loaded
  if (!isGAAvailable()) {
    console.warn('GA: Google Analytics script not loaded yet');
    return;
  }

  try {
    // Initialize consent first
    CookieManager.initializeGoogleConsent();

    // Initialize Google Analytics
    window.gtag('config', GA_TRACKING_ID, {
      page_title: document.title,
      page_location: window.location.href,
    });

    console.log('GA: Initialized successfully');
  } catch (error) {
    console.error('GA: Initialization failed:', error);
  }
};

export const trackEvent = (action: string, category: string, label?: string, value?: number): void => {
  // Don't track in admin areas
  if (isAdminArea()) {
    console.log('GA: Skipping event tracking (admin area)');
    return;
  }

  if (!isGAAvailable()) {
    console.warn('GA: Cannot track event - GA not available');
    return;
  }

  try {
    // Only track if analytics consent is given
    if (!CookieManager.hasAnalyticsConsent()) {
      console.log('GA: Skipping event tracking (no consent)');
      return;
    }

    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });

    console.log(`GA: Event tracked - ${action} (${category})`);
  } catch (error) {
    console.error('GA: Event tracking failed:', error);
  }
};

export const trackConversion = (conversionId: string, conversionLabel: string, value?: number): void => {
  // Don't track in admin areas
  if (isAdminArea()) {
    console.log('GA: Skipping conversion tracking (admin area)');
    return;
  }

  if (!isGAAvailable()) {
    console.warn('GA: Cannot track conversion - GA not available');
    return;
  }

  try {
    // Only track if marketing consent is given
    if (!CookieManager.hasMarketingConsent()) {
      console.log('GA: Skipping conversion tracking (no consent)');
      return;
    }

    window.gtag('event', 'conversion', {
      send_to: `${conversionId}/${conversionLabel}`,
      value: value || 1,
      currency: 'EUR',
    });

    console.log(`GA: Conversion tracked - ${conversionId}/${conversionLabel}`);
  } catch (error) {
    console.error('GA: Conversion tracking failed:', error);
  }
};

// Delayed initialization for when GA script loads asynchronously
export const initGAWhenReady = (): void => {
  if (isAdminArea()) return;

  if (isGAAvailable()) {
    initGA();
  } else {
    // Wait for GA to load
    const checkGA = setInterval(() => {
      if (isGAAvailable()) {
        clearInterval(checkGA);
        initGA();
      }
    }, 100);

    // Stop checking after 10 seconds
    setTimeout(() => {
      clearInterval(checkGA);
      console.warn('GA: Timeout waiting for Google Analytics to load');
    }, 10000);
  }
};