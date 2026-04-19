import type { Metadata } from "next";
import "./globals.css";

import { ConfirmationProvider } from "@/components/ConfirmationContext";
import { AuthProvider } from "@/components/AuthProvider";
import { StoreHydrator } from "@/components/StoreHydrator";
import { Analytics } from "@vercel/analytics/next";
import { getSettings, getIntegrations } from "@/lib/data";
import { normalizePostHogIngestionHost } from "@/lib/integrations";
import { LazyMotion, domAnimation } from "motion/react";
import { PostHogProvider } from "@/components/PostHogProvider";
import { cookies } from "next/headers";
import { CookieBannerMount } from "@/components/CookieBannerMount";
import { CartDrawer } from "@/components/layout/CartDrawer";

export const metadata: Metadata = {
  title: {
    template: "%s | Mavren Shop",
    default: "Mavren Shop | Premium Scandinavian Interior Design",
  },
  description: "Handpicked premium Scandinavian interior design. Ethical, sustainable, and timeless pieces for your home.",
  metadataBase: new URL('https://mavren-shop.vercel.app'),
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const lang = cookieStore.get('NEXT_LOCALE')?.value || 'en';
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

  // Default Clarity ID from user request
  const clarityId = integrations.CLARITY_ID || "wcb4auvfrs";

  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://xeatyjjiywcrkuvifyhm.supabase.co" crossOrigin="" />
        <link rel="preconnect" href="https://pub-f44233c26dba4e9795b3ccf51fe6f2cb.r2.dev" crossOrigin="" />
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="" />
      </head>
      <body className="min-h-full flex flex-col font-sans" suppressHydrationWarning>
        <PostHogProvider 
          apiKey={integrations.POSTHOG_PROJECT_KEY} 
          host={normalizePostHogIngestionHost(integrations.POSTHOG_HOST)}
        >
          <StoreHydrator settings={settings} />
          <CookieBannerMount copy={cookieBannerCopy} />
          <AuthProvider>
            <ConfirmationProvider>
              <LazyMotion features={domAnimation}>
                {children}
                <CartDrawer />
              </LazyMotion>
              {process.env.NODE_ENV === 'production' ? <Analytics /> : null}
            </ConfirmationProvider>
          </AuthProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
