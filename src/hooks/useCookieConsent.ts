
// ===== 3. REACT HOOK FOR CONSENT STATE =====
// src/hooks/useCookieConsent.ts
import { ConsentPreferences, CookieManager } from '@/lib/cookies';
import { useState, useEffect } from 'react';

export const useCookieConsent = () => {
  const [hasConsent, setHasConsent] = useState<boolean>(false);
  const [preferences, setPreferences] = useState<ConsentPreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
    preferences: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkConsent = () => {
      const consentData = CookieManager.getConsentData();
      setHasConsent(!!consentData);
      
      if (consentData) {
        setPreferences(consentData.preferences);
      }
      
      setIsLoading(false);
    };

    // Check immediately
    checkConsent();

    // Listen for consent changes
    const handleConsentChange = (event: CustomEvent<ConsentPreferences>) => {
      setPreferences(event.detail);
      setHasConsent(true);
    };

    window.addEventListener('cookieConsentChanged', handleConsentChange as EventListener);

    return () => {
      window.removeEventListener('cookieConsentChanged', handleConsentChange as EventListener);
    };
  }, []);

  const giveConsent = (newPreferences: ConsentPreferences) => {
    CookieManager.setConsentData(newPreferences);
    setPreferences(newPreferences);
    setHasConsent(true);
  };

  const revokeConsent = () => {
    CookieManager.revokeConsent();
    setHasConsent(false);
    setPreferences({
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false,
    });
  };

  return {
    hasConsent,
    preferences,
    isLoading,
    giveConsent,
    revokeConsent,
  };
};
