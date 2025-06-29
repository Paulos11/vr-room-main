
// ===== 7. MAIN CONSENT WRAPPER COMPONENT =====
// src/components/ConsentWrapper.tsx
'use client';

import { useCookieConsent } from '@/hooks/useCookieConsent';
import { CookieConsent } from './CookieConsent';
import { useEffect } from 'react';
import { initGA } from '@/lib/gtag';

export const ConsentWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { hasConsent, isLoading, giveConsent, revokeConsent } = useCookieConsent();

  useEffect(() => {
    if (!isLoading) {
      // Initialize Google Analytics after consent check
      initGA();
    }
  }, [isLoading]);

  if (isLoading) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      {!hasConsent && (
        <CookieConsent
          onAccept={giveConsent}
          onDecline={() => {
            giveConsent({
              necessary: true,
              analytics: false,
              marketing: false,
              preferences: false,
            });
          }}
        />
      )}
    </>
  );
};

// ===== 8. USAGE EXAMPLES =====

// In your components, use the tracking functions:
import { trackEvent, trackConversion } from '@/lib/gtag';

// Track events (only if user consented to analytics)
trackEvent('click', 'button', 'register-now');

// Track conversions (only if user consented to marketing)
trackConversion('AW-17267533077', 'conversion-label', 25.00);

// Check consent status
import { CookieManager } from '@/lib/cookies';

if (CookieManager.hasAnalyticsConsent()) {
  // Load analytics scripts
}

if (CookieManager.hasMarketingConsent()) {
  // Load marketing pixels
}