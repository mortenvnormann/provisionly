import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { InstallBanner } from "@/components/pwa/install-banner";
import { AppShell } from "@/components/layout/app-shell";
import { AppProviders } from "@/components/providers/app-providers";
import { darkPalette, lightPalette } from "@/lib/design/palette";
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
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: lightPalette.fjordBlue },
    { media: "(prefers-color-scheme: dark)", color: darkPalette.deepFjord },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <AppProviders>
          <AppShell>
            <InstallBanner />
            {children}
          </AppShell>
        </AppProviders>
      </body>
    </html>
  );
}
