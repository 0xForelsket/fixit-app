import type { Metadata, Viewport } from "next";
import { JetBrains_Mono } from "next/font/google";
import { OfflineIndicator } from "@/components/pwa/offline-indicator";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#f97316",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "FixIt - CMMS Lite",
  description:
    "Lightweight maintenance management system for tracking equipment maintenance requests",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FixIt CMMS",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${jetbrainsMono.variable} min-h-screen antialiased font-sans`}
        suppressHydrationWarning
      >
        {children}
        <OfflineIndicator />
      </body>
    </html>
  );
}

