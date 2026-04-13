import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

import { ConfirmationProvider } from "@/components/ConfirmationContext";
import { AuthProvider } from "@/components/AuthProvider";
import { StoreHydrator } from "@/components/StoreHydrator";
import { createClient } from "@/utils/supabase/server";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

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
  const supabase = await createClient();
  
  // Fetch settings on the server for hydration
  const { data: settingsData } = await supabase
    .from('settings')
    .select('data')
    .eq('id', 'primary')
    .single();

  const settings = settingsData?.data || {};

  return (
    <html
      lang="en"
      className={`${inter.variable} ${outfit.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <StoreHydrator settings={settings} />
        <AuthProvider>
          <ConfirmationProvider>
            {children}
          </ConfirmationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

