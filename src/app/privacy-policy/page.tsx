
// ===== 5. PRIVACY POLICY PAGE =====
// src/app/privacy-policy/page.tsx
export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
          
          <div className="prose prose-gray max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Cookie Policy</h2>
              <p className="text-gray-600 mb-4">
                This website uses cookies to enhance your browsing experience and provide personalized content. 
                By continuing to use our website, you agree to our use of cookies as described in this policy.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Types of Cookies We Use</h3>
              
              <div className="space-y-4">
                <div className="border-l-4 border-ems-green-500 pl-4">
                  <h4 className="font-semibold text-gray-900">Necessary Cookies</h4>
                  <p className="text-gray-600">
                    Essential for website functionality and security. These cookies cannot be disabled.
                  </p>
                </div>

                <div className="border-l-4 border-ems-blue-500 pl-4">
                  <h4 className="font-semibold text-gray-900">Analytics Cookies</h4>
                  <p className="text-gray-600">
                    Help us understand visitor behavior through Google Analytics. Data is anonymized and used to improve our website.
                  </p>
                </div>

                <div className="border-l-4 border-ems-orange-500 pl-4">
                  <h4 className="font-semibold text-gray-900">Marketing Cookies</h4>
                  <p className="text-gray-600">
                    Used for Google Ads remarketing and conversion tracking. Helps us show relevant advertisements and measure campaign effectiveness.
                  </p>
                </div>

                <div className="border-l-4 border-purple-500 pl-4">
                  <h4 className="font-semibold text-gray-900">Preference Cookies</h4>
                  <p className="text-gray-600">
                    Remember your settings and preferences to provide a personalized experience.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Rights</h2>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>You can change your cookie preferences at any time</li>
                <li>You can withdraw consent for non-essential cookies</li>
                <li>You can clear cookies from your browser settings</li>
                <li>You have the right to data portability and deletion</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Us</h2>
              <p className="text-gray-600">
                If you have any questions about our cookie policy or privacy practices, please contact us:
              </p>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700">
                  <strong>EMS Malta</strong><br />
                  Email: info@ems.com.mt<br />
                  Phone: +356 2755 5597<br />
                  Address: Malta
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== 6. UPDATED LAYOUT WITH CONSENT =====
// Replace your existing layout.tsx head section script tags with this:

{/* Updated Google Ads with Consent - Replace in your layout.tsx */}
<script
  dangerouslySetInnerHTML={{
    __html: `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      
      // Initialize consent first (before loading gtag)
      gtag('consent', 'default', {
        ad_storage: 'denied',
        ad_user_data: 'denied', 
        ad_personalization: 'denied',
        analytics_storage: 'denied',
        functionality_storage: 'denied',
        personalization_storage: 'denied',
        security_storage: 'granted',
        wait_for_update: 500,
      });
      
      gtag('js', new Date());
      gtag('config', 'AW-17267533077');
    `,
  }}
/>
