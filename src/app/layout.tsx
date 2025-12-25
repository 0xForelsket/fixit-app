import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FixIt - CMMS Lite",
  description:
    "Lightweight maintenance management system for tracking machine maintenance requests",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
