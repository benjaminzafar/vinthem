import { Metadata } from "next";
import { Inter, Roboto, Outfit } from "next/font/google";
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

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const roboto = Roboto({ weight: ["400", "700"], subsets: ["latin"], variable: "--font-roboto" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const lang = await getServerLocale();
  
  const siteUrl = getEnv('SITE_URL') || 'https://www.vinthem.com';

  return {
    title: settings.seoTitle?.[lang] || settings.storeName?.[lang] || "Vinthem",
    description: settings.seoDescription?.[lang] || "Premium E-commerce",
    metadataBase: new URL(siteUrl),
    keywords: [
      "vinthem", "vinhem", "vinthem shop", "vinhem shop", "vinthem store", 
      "vinthem online", "vinthem clothing", "vinthem sweden", "vinthem fashion",
      "vinthem brand", "vinthem official"
    ],
    icons: {
      icon: settings.faviconUrl || "/favicon.ico",
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

  const siteUrl = getEnv('SITE_URL') || 'https://www.vinthem.com';

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Vinthem",
    "alternateName": ["Vinhem", "Vinthem Shop", "Vinhem Store", "Vinthem Sweden"],
    "url": siteUrl,
    "logo": settings.faviconUrl || `${siteUrl}/favicon.ico`,
    "description": settings.seoDescription?.[lang] || "Premium E-commerce brand",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "Sweden"
    }
  };

  const cookieBannerCopy = {
    eyebrow: settings.cookieBannerTitle?.[lang] || "Cookies",
    description: settings.cookieBannerDescription?.[lang] || "We use cookies.",
    privacyLabel: "Privacy Policy",
    cookieLabel: "Cookie Settings",
    acceptAllLabel: settings.cookieBannerAcceptText?.[lang] || "Accept",
    essentialOnlyLabel: settings.cookieBannerDeclineText?.[lang] || "Decline",
  };

  return (
    <html lang={lang} className={`${inter.variable} ${roboto.variable} ${outfit.variable} h-full`}>
      <head>
        {integrations.CLARITY_ID && (
          <Script
            id="clarity-script"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                (function(c,l,a,r,i,t,y){
                    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                    t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
                })(window, document, "clarity", "script", "${integrations.CLARITY_ID}");
              `,
            }}
          />
        )}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="" />
      </head>
      <body className="min-h-full flex flex-col font-sans" suppressHydrationWarning>
        <StoreHydrator 
          settings={settings} 
          supabaseConfig={{
            url: getEnv('SUPABASE_URL') || '',
            anonKey: getEnv('SUPABASE_PUBLISHABLE_KEY') || ''
          }}
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
