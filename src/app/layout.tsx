import { Metadata } from "next";
import "./globals.css";
import { ConfirmationProvider } from "@/components/ConfirmationContext";
import { AuthProvider } from "@/components/AuthProvider";
import StoreHydrator from "@/components/StoreHydrator";
import { getSettings, getIntegrations } from "@/lib/data";
import { LazyMotion, domAnimation } from "motion/react";
import { CookieBannerMount } from "@/components/CookieBannerMount";
import { getEnv } from "@/lib/env";
import { CartDrawer } from "@/components/layout/CartDrawer";
import { getServerLocale } from "@/lib/server-locale";
import { Toaster } from "sonner";
import Script from "next/script";
import { getBrowserSupabaseConfig } from "@/lib/supabase-browser-config";
import { headers } from "next/headers";


function sanitizeClarityId(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim();
  return /^[a-z0-9]+$/i.test(normalized) ? normalized : null;
}

function getOptionalStringSetting(source: object, key: string): string {
  const value = Reflect.get(source, key);
  return typeof value === 'string' ? value : '';
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const lang = await getServerLocale();
  const faviconUrl = getOptionalStringSetting(settings, 'faviconUrl');
  const siteUrl = getEnv('SITE_URL') || 'https://www.vinthem.com';

  return {
    title: settings.seoTitle?.[lang] || settings.storeName?.[lang] || "Vinthem",
    description: settings.seoDescription?.[lang] || "Premium E-commerce",
    metadataBase: new URL(siteUrl),

    keywords: [
      "vinthem", "vinhem", "vind hem", "vindhem", "vind-hem", "vintam", "vintham", "vnthem", "vntem", "vintem", "winthem", "winhem", "findhem", "find hem", "venthem", "vanthem", "vinth-em", "vin-them", "vin-hem",
      "vinthem shop", "vinhem shop", "vind hem shop", "vindhem store", "vinthem official", "vinthem brand", "vinthem online",
      "vinthem clothing", "vinthem sweden", "vinthem fashion", "vinthem stockholm",
      "wintem", "wintham", "venhem", "vanhem", "vintheme", "vinheme", "vinthem-shop", "vinthem-store",
      "vintham store", "vintham shop", "vintam store", "vintam shop", "vintem shop", "vintem store",
      "vindhem shop", "vindhem store", "findhem shop", "findhem store", "vinthem.com", "vinhem.com",
      "vinthem collection", "vinthem arrivals", "vinthem apparel", "vinthem wear", "vinthem outfit",
      "vinthem mens fashion", "vinthem womens fashion", "vinthem unisex", "vinthem lifestyle",
      "vinhem clothing store", "vinhem online shop", "vinhem sweden brand", "vinhem luxury fashion",
      "minimalist aesthetic clothing", "quiet luxury brand sweden", "capsule wardrobe essentials",
      "vinthem best sellers", "vinthem exclusive", "vinthem discount", "vinthem shipping",
      "vinthem review", "vinthem quality", "vinthem material", "vinthem organic cotton",
      "vinthem durable fashion", "vinthem slow fashion", "vinthem eco-friendly",
      "vinthem global shipping", "vinthem europe", "vinthem international",
      "vinthem customer service", "vinthem returns", "vinthem size guide",
      "vinthem accessories", "vinthem headwear", "vinthem knitwear", "vinthem outerwear",
      "vinthem summer collection", "vinthem winter collection", "vinthem spring", "vinthem autumn",
      "vinthem gift card", "vinthem voucher", "vinthem coupon", "vinthem promo",
      "vinthem influencers", "vinthem style guide", "vinthem lookbook", "vinthem blog",
      "vinthem news", "vinthem updates", "vinthem contact", "vinthem support",
      "vinthem privacy", "vinthem terms", "vinthem legal", "vinthem about us",
      "vinthem career", "vinthem jobs", "vinthem location", "vinthem contact",
      "vinthem hours", "vinthem support", "vinthem faq", "vinthem shipping policy"
    ],
    icons: {
      icon: faviconUrl || "/favicon.ico",
    },
    alternates: {
      canonical: siteUrl,
      languages: {
        'en': '/',
        'sv': '/sv',
        'fi': '/fi',
        'da': '/da',
        'de': '/de',
        'x-default': '/',
      },
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSettings();
  const integrations = await getIntegrations();
  const lang = await getServerLocale();
  const supabaseConfig = getBrowserSupabaseConfig();

  const siteUrl = getEnv('SITE_URL') || 'https://www.vinthem.com';
  const clarityId = sanitizeClarityId(integrations.CLARITY_ID);
  const faviconUrl = getOptionalStringSetting(settings, 'faviconUrl');
  const nonce = (await headers()).get('x-csp-nonce') || '';


  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Vinthem",
    "alternateName": [
      "Vinhem", "Vind Hem", "Vindhem", "Vintham", "Vintam", "Vnthem", "Vntem", "Vintem", 
      "Winthem", "Winhem", "Findhem", "Find Hem", "Vinthem Sweden", "Vinthem Stockholm",
      "Vinthem Shop", "Vinhem Store", "Vinthem Official", "Vinthem Brand", "Vinthem.com"
    ],
    "url": siteUrl,
    "logo": faviconUrl || `${siteUrl}/favicon.ico`,
    "description": settings.seoDescription?.[lang] || "Vinthem - Stockholm based quality everyday essentials with 20+ years of retail experience.",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "Sweden"
    },
    "keywords": "vinthem, vinhem, stockholm fashion, everyday essentials, useful products, quality goods, stockholm style"
  };

  const cookieBannerCopy = {
    eyebrow: settings.consentBannerTitleText?.[lang] || "Cookies",
    description: settings.consentBannerDescriptionText?.[lang] || "We use cookies.",
    privacyLabel: settings.consentPrivacyLinkText?.[lang] || "Privacy Policy",
    cookieLabel: settings.consentCookieLinkText?.[lang] || "Cookie Settings",
    acceptAllLabel: settings.consentAcceptAllText?.[lang] || "Accept",
    essentialOnlyLabel: settings.consentEssentialOnlyText?.[lang] || "Decline",
  };

  return (
    <html lang={lang} className="h-full">
      <head>
        {clarityId && (
          <Script
            id="clarity-script"
            strategy="afterInteractive"
            nonce={nonce}
            dangerouslySetInnerHTML={{
              __html: `
                (function(c,l,a,r,i,t,y){
                    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                    t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
                })(window, document, "clarity", "script", "${clarityId}");
              `,
            }}
          />
        )}
        <script
          id="supabase-browser-config"
          nonce={nonce}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              window.__supabase_url = ${JSON.stringify(supabaseConfig.url)};
              window.__supabase_key = ${JSON.stringify(supabaseConfig.anonKey)};
            `,
          }}
        />

        <script
          type="application/ld+json"
          nonce={nonce}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        <link rel="dns-prefetch" href="https://xeatyjjiywcrkuvifyhm.supabase.co" />
        <link rel="preconnect" href="https://xeatyjjiywcrkuvifyhm.supabase.co" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="" />
      </head>
      <body className="min-h-full flex flex-col font-sans" suppressHydrationWarning>
        <StoreHydrator 
          settings={settings} 
          supabaseConfig={supabaseConfig}
        />
        <CookieBannerMount copy={cookieBannerCopy} />
        <AuthProvider>
          <ConfirmationProvider>
            <LazyMotion features={domAnimation}>
              <CartDrawer />
              {children}
              

              <Toaster position="top-right" richColors />
            </LazyMotion>
          </ConfirmationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
