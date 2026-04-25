import type { Metadata } from "next";
import "./globals.css";

import { ConfirmationProvider } from "@/components/ConfirmationContext";
import { AuthProvider } from "@/components/AuthProvider";
import { StoreHydrator } from "@/components/StoreHydrator";
import { Analytics } from "@vercel/analytics/next";
import { getSettings, getIntegrations } from "@/lib/data";
import { LazyMotion, domAnimation } from "motion/react";
import { CookieBannerMount } from "@/components/CookieBannerMount";
import { CartDrawer } from "@/components/layout/CartDrawer";
import { getServerLocale } from "@/lib/server-locale";
import { Toaster } from "sonner";
import { Prata } from 'next/font/google';

const prata = Prata({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-prata',
  display: 'swap',
});

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getServerLocale();
  const settings = await getSettings();
  
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.vinthem.com';
  const storeName = settings?.storeName?.[lang] || settings?.storeName?.en || 'Vinthem';
  
  const title = settings?.seoTitle?.[lang] || settings?.seoTitle?.en || storeName;
  const description = settings?.seoDescription?.[lang] || settings?.seoDescription?.en || '';
  const keywords = settings?.seoKeywords?.[lang] || settings?.seoKeywords?.en || "";
  const ogImage = settings?.seoImage || `${siteUrl}/og-image.jpg`;

  return {
    title: {
      template: `%s | ${settings?.storeName?.[lang] || settings?.storeName?.en || 'Vinthem'}`,
      default: title,
    },
    description: description,
    keywords: keywords,
    metadataBase: new URL(siteUrl),
    alternates: {
      canonical: '/',
      languages: {
        'en-US': '/en',
        'sv-SE': '/sv',
        'fi-FI': '/fi',
        'da-DK': '/da',
        'de-DE': '/de',
      },
    },
    openGraph: {
      title: title,
      description: description,
      url: siteUrl,
      siteName: settings?.storeName?.[lang] || settings?.storeName?.en || 'Vinthem',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: lang,
      type: 'website',
    },
  };
}


export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const lang = await getServerLocale();
  // Fetch settings on the server for hydration (cached)
  const settings = await getSettings() || {};
  const integrations = await getIntegrations() || {};
  const cookieBannerCopy = {
    eyebrow: settings.consentBannerEyebrowText?.[lang] || "Privacy Controls",
    description: settings.consentBannerDescriptionText?.[lang] || "Essential cookies keep checkout and login secure. Optional analytics helps us improve the store.",
    privacyLabel: settings.consentPrivacyLinkText?.[lang] || "Privacy Policy",
    cookieLabel: settings.consentCookieLinkText?.[lang] || "Cookie Policy",
    acceptAllLabel: settings.consentAcceptAllText?.[lang] || "Accept all",
    essentialOnlyLabel: settings.consentEssentialOnlyText?.[lang] || "Essential only",
  };

  // Only use Clarity ID from integrations, no hardcoded fallbacks
  const clarityId = integrations.CLARITY_ID;

  return (
    <html lang={lang} className={`h-full antialiased ${prata.variable}`} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://auth.vinthem.com" crossOrigin="" />
        <link rel="preconnect" href="https://pub-f44233c26dba4e9795b3ccf51fe6f2cb.r2.dev" crossOrigin="" />
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="" />
      </head>
      <body className="min-h-full flex flex-col font-sans" suppressHydrationWarning>
        <StoreHydrator settings={settings} />
        <CookieBannerMount copy={cookieBannerCopy} />
        <AuthProvider>
          <ConfirmationProvider>
            <LazyMotion features={domAnimation}>
              {children}
              <CartDrawer initialSettings={settings} />
              <Toaster position="top-center" expand={false} richColors />
            </LazyMotion>
            {process.env.NODE_ENV === 'production' ? <Analytics /> : null}
          </ConfirmationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
