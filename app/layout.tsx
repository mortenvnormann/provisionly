import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { InstallBanner } from "@/components/pwa/install-banner";
import { AppShell } from "@/components/layout/app-shell";
import { AppProviders } from "@/components/providers/app-providers";
import { AppSerwistProvider } from "@/components/providers/serwist-provider";
import { OfflineBanner } from "@/components/ui/offline-banner";
import { darkPalette, lightPalette } from "@/lib/design/palette";
import { iconAssetUrl } from "@/lib/pwa/icon-url";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Provisionly",
    template: "%s · Provisionly",
  },
  description: "Minimal collaborative grocery lists and recipes",
  applicationName: "Provisionly",
  appleWebApp: {
    capable: true,
    title: "Provisionly",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
  icons: {
    icon: [{ url: iconAssetUrl("/icon.png"), type: "image/png" }],
    apple: [{ url: iconAssetUrl("/apple-icon.png"), type: "image/png" }],
    shortcut: iconAssetUrl("/favicon.ico"),
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: lightPalette.frostSlate },
    { media: "(prefers-color-scheme: dark)", color: darkPalette.nightSlate },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex h-dvh min-h-0 flex-col overflow-hidden">
        <AppSerwistProvider>
          <NextIntlClientProvider messages={messages}>
            <AppProviders>
              <AppShell>
                <OfflineBanner />
                <InstallBanner />
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                  {children}
                </div>
              </AppShell>
            </AppProviders>
          </NextIntlClientProvider>
          <Analytics />
          <SpeedInsights />
        </AppSerwistProvider>
      </body>
    </html>
  );
}
