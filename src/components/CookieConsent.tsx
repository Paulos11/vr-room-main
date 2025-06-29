
// ===== 4. COOKIE CONSENT BANNER COMPONENT =====
// src/components/CookieConsent.tsx
import React, { useState } from 'react';
import { X, Settings, Shield, BarChart3, Target, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ConsentPreferences } from '@/lib/cookies';

interface CookieConsentProps {
  onAccept: (preferences: ConsentPreferences) => void;
  onDecline: () => void;
}

export const CookieConsent: React.FC<CookieConsentProps> = ({ onAccept, onDecline }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<ConsentPreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
    preferences: false,
  });

  const handleAcceptAll = () => {
    const allAccepted: ConsentPreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
    };
    onAccept(allAccepted);
  };

  const handleAcceptSelected = () => {
    onAccept(preferences);
    setShowSettings(false);
  };

  const handleDeclineAll = () => {
    onDecline();
  };

  const cookieCategories = [
    {
      id: 'necessary' as keyof ConsentPreferences,
      title: 'Necessary Cookies',
      description: 'Essential for website functionality, security, and user experience. These cannot be disabled.',
      icon: Shield,
      required: true,
    },
    {
      id: 'analytics' as keyof ConsentPreferences,
      title: 'Analytics Cookies',
      description: 'Help us understand how visitors interact with our website by collecting anonymous information.',
      icon: BarChart3,
      required: false,
    },
    {
      id: 'marketing' as keyof ConsentPreferences,
      title: 'Marketing Cookies',
      description: 'Used to deliver personalized advertisements and measure advertising campaign effectiveness.',
      icon: Target,
      required: false,
    },
    {
      id: 'preferences' as keyof ConsentPreferences,
      title: 'Preference Cookies',
      description: 'Remember your choices and settings to provide a personalized experience.',
      icon: Palette,
      required: false,
    },
  ];

  return (
    <>
      {/* Main Cookie Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-ems-blue-50 rounded-lg">
                  <Shield className="w-5 h-5 text-ems-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    We value your privacy
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    We use cookies to enhance your browsing experience, analyze site traffic, and deliver personalized content. 
                    By clicking "Accept All", you consent to our use of cookies. You can manage your preferences or learn more in our{' '}
                    <a href="/privacy-policy" className="text-ems-blue-600 hover:underline font-medium">
                      Privacy Policy
                    </a>.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(true)}
                className="flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Settings
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeclineAll}
                className="text-gray-600 hover:text-gray-800"
              >
                Decline All
              </Button>
              <Button
                size="sm"
                onClick={handleAcceptAll}
                className="bg-ems-green-600 hover:bg-ems-green-700 text-white"
              >
                Accept All Cookies
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Cookie Preferences
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <p className="text-sm text-gray-600">
              Manage your cookie preferences below. You can enable or disable different types of cookies. 
              Note that disabling some cookies may affect your experience on our website.
            </p>

            <div className="space-y-4">
              {cookieCategories.map((category) => {
                const Icon = category.icon;
                return (
                  <div key={category.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className="w-4 h-4 text-ems-blue-600" />
                          <h4 className="font-medium text-gray-900">{category.title}</h4>
                          {category.required && (
                            <span className="text-xs bg-ems-green-100 text-ems-green-800 px-2 py-1 rounded-full">
                              Required
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{category.description}</p>
                      </div>
                      <Switch
                        checked={preferences[category.id]}
                        onCheckedChange={(checked) => 
                          setPreferences(prev => ({ ...prev, [category.id]: checked }))
                        }
                        disabled={category.required}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <Separator />

            <div className="flex justify-between gap-3">
              <Button
                variant="outline"
                onClick={() => setShowSettings(false)}
              >
                Cancel
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleDeclineAll}
                >
                  Decline All
                </Button>
                <Button
                  onClick={handleAcceptSelected}
                  className="bg-ems-green-600 hover:bg-ems-green-700 text-white"
                >
                  Save Preferences
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
