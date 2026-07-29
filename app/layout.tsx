import type { Metadata, Viewport } from "next";
import { Geist, Source_Serif_4 } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { DeferredBanners } from "@/components/ui/deferred-banners";
import { AppShell } from "@/components/layout/app-shell";
import { DockHost } from "@/components/layout/dock-host";
import { NavOriginRestore } from "@/components/layout/nav-origin-restore";
import { AppProviders } from "@/components/providers/app-providers";
import { AppSerwistProvider } from "@/components/providers/serwist-provider";
import { darkPalette, lightPalette } from "@/lib/design/palette";
import { iconAssetUrl } from "@/lib/pwa/icon-url";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
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
      className={`${geistSans.variable} ${sourceSerif.variable} h-full antialiased`}
    >
      <body className="flex h-dvh min-h-0 flex-col overflow-hidden">
        <AppSerwistProvider>
          <NextIntlClientProvider messages={messages}>
            <AppProviders>
              <NavOriginRestore />
              <DockHost>
                <AppShell>
                  <DeferredBanners />
                  <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                    {children}
                  </div>
                </AppShell>
              </DockHost>
            </AppProviders>
          </NextIntlClientProvider>
          <Analytics />
          <SpeedInsights />
        </AppSerwistProvider>
      </body>
    </html>
  );
}
