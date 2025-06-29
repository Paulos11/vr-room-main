// ===== 1. COOKIE MANAGEMENT UTILITIES =====
// src/lib/cookies.ts
export type ConsentPreferences = {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
};

export type ConsentData = {
  preferences: ConsentPreferences;
  timestamp: number;
  version: string;
  userAgent: string;
};

const CONSENT_COOKIE_NAME = 'ems_cookie_consent';
const CONSENT_VERSION = '1.0';

export class CookieManager {
  static getConsentData(): ConsentData | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const cookieValue = document.cookie
        .split('; ')
        .find(row => row.startsWith(CONSENT_COOKIE_NAME))
        ?.split('=')[1];
      
      if (!cookieValue) return null;
      
      return JSON.parse(decodeURIComponent(cookieValue));
    } catch (error) {
      console.error('Error reading consent cookie:', error);
      return null;
    }
  }

  static setConsentData(preferences: ConsentPreferences): void {
    if (typeof window === 'undefined') return;
    
    const consentData: ConsentData = {
      preferences,
      timestamp: Date.now(),
      version: CONSENT_VERSION,
      userAgent: navigator.userAgent,
    };

    const cookieValue = encodeURIComponent(JSON.stringify(consentData));
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1); // 1 year

    document.cookie = `${CONSENT_COOKIE_NAME}=${cookieValue}; expires=${expiryDate.toUTCString()}; path=/; secure; samesite=strict`;
    
    // Update Google consent state
    this.updateGoogleConsent(preferences);
    
    // Trigger custom event for other components
    window.dispatchEvent(new CustomEvent('cookieConsentChanged', { detail: preferences }));
  }

  static hasConsent(): boolean {
    return this.getConsentData() !== null;
  }

  static hasAnalyticsConsent(): boolean {
    const data = this.getConsentData();
    return data?.preferences.analytics || false;
  }

  static hasMarketingConsent(): boolean {
    const data = this.getConsentData();
    return data?.preferences.marketing || false;
  }

  static revokeConsent(): void {
    if (typeof window === 'undefined') return;
    
    document.cookie = `${CONSENT_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    
    // Clear analytics cookies
    this.clearAnalyticsCookies();
    
    // Update Google consent to denied
    this.updateGoogleConsent({
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false,
    });
  }

  private static clearAnalyticsCookies(): void {
    const analyticsCookies = [
      '_ga', '_ga_*', '_gid', '_gat', '_gat_*', 
      '_gcl_au', '_gcl_aw', '_gcl_dc', '_gcl_gb',
      '__utma', '__utmb', '__utmc', '__utmt', '__utmz'
    ];

    analyticsCookies.forEach(cookieName => {
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname}`;
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    });
  }

  static updateGoogleConsent(preferences: ConsentPreferences): void {
    if (typeof window === 'undefined' || !window.gtag) return;

    window.gtag('consent', 'update', {
      ad_storage: preferences.marketing ? 'granted' : 'denied',
      ad_user_data: preferences.marketing ? 'granted' : 'denied',
      ad_personalization: preferences.marketing ? 'granted' : 'denied',
      analytics_storage: preferences.analytics ? 'granted' : 'denied',
      functionality_storage: preferences.preferences ? 'granted' : 'denied',
      personalization_storage: preferences.preferences ? 'granted' : 'denied',
      security_storage: 'granted', // Always allowed for necessary cookies
    });
  }

  static initializeGoogleConsent(): void {
    if (typeof window === 'undefined' || !window.gtag) return;

    const consentData = this.getConsentData();
    
    if (consentData) {
      // User has already given consent
      this.updateGoogleConsent(consentData.preferences);
    } else {
      // Default to denied until user consents
      window.gtag('consent', 'default', {
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
        analytics_storage: 'denied',
        functionality_storage: 'denied',
        personalization_storage: 'denied',
        security_storage: 'granted',
        wait_for_update: 500,
      });
    }
  }
}