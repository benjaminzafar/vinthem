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
    keywords: [
      "vinthem", "vinhem", "vintam", "vintham", "vnthem", "vinthem shop", "vinhem shop", "vinthem store", 
      "vinthem online", "vinthem clothing", "vinthem sweden", "vinthem fashion", "vinthem brand", "vinthem official",
      "vinthem stockholm", "vinthem scandinavia", "vinthem luxury", "vinthem premium", "vinthem minimalist",
      "scandinavian design", "minimalist fashion", "premium streetwear", "luxury basics", "sustainable fashion sweden",
      "nordic style", "minimalist wardrobe", "timeless clothing", "high-end basics", "designer streetwear",
      "vinthem collection", "vinthem arrivals", "vinthem apparel", "vinthem wear", "vinthem outfit",
      "buy minimalist clothes", "premium hoodies online", "luxury t-shirts sweden", "minimalist jackets",
      "vinthem mens fashion", "vinthem womens fashion", "vinthem unisex", "vinthem lifestyle",
      "scandinavian streetwear brand", "stockholm fashion store", "vinthem limited edition",
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
    "alternateName": [
      "Vinhem", "Vinthem Shop", "Vinhem Store", "Vinthem Sweden", "Vinthem Stockholm",
      "Vintham", "Vintam", "Vnthem", "Vinthem Brand", "Vinthem Official"
    ],
    "url": siteUrl,
    "logo": settings.faviconUrl || `${siteUrl}/favicon.ico`,
    "description": settings.seoDescription?.[lang] || "Premium Scandinavian minimalist fashion brand Vinthem.",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "Sweden"
    },
    "keywords": "vinthem, vinhem, scandinavian fashion, minimalist clothing, premium streetwear, luxury basics, stockholm style"
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
              
              {/* Aggressive SEO Hidden Section - Invisible to users, golden for bots */}
              <div className="sr-only" aria-hidden="true">
                <h1>Vinthem - Premium Scandinavian Minimalist Fashion</h1>
                <p>Welcome to Vinthem (also known as Vinhem, Vintham, or Vintam), the leading minimalist fashion brand from Stockholm, Sweden. We specialize in premium streetwear, luxury basics, and sustainable fashion with a clean Nordic aesthetic.</p>
                <p>Explore our exclusive collection of hoodies, jackets, t-shirts, and capsule wardrobe essentials. Vinthem Shop offers high-end apparel for those who value timeless design and exceptional quality materials like organic cotton and durable fabrics.</p>
                <p>Whether you are looking for Vinthem official store, Vinhem clothing, or the best scandinavian streetwear, Vinthem is your destination for quiet luxury and minimalist style in Europe and worldwide.</p>
                <ul>
                  <li>Vinthem Official Store Stockholm</li>
                  <li>Vinhem Minimalist Clothing</li>
                  <li>Scandinavian Designer Apparel</li>
                  <li>Premium Nordic Fashion Brand</li>
                  <li>Luxury Minimalist Wardrobe Essentials</li>
                </ul>
              </div>

              <Toaster position="top-right" richColors />
            </LazyMotion>
          </ConfirmationProvider>
        </AuthProvider>
      </body>
    </html>

  );
}
