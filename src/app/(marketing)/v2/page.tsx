import type { Metadata } from "next";
import MarketingPageV2 from "./marketing-page";

export const metadata: Metadata = {
  title: "FixIt | Industrial Intelligence. Open Source.",
  description: "The high-density CMMS for modern operations. Built for speed, scalability, and total data sovereignty. Open Source, Self-Hosted, No Vendor Lock-in.",
  openGraph: {
    title: "FixIt | Industrial Intelligence. Open Source.",
    description: "The high-density CMMS for modern operations. Built for speed, scalability, and total data sovereignty.",
    url: "https://fixit.io",
    siteName: "FixIt CMMS",
    images: [
      {
        url: "/og-image.png", // We might need to generate this or it's a placeholder
        width: 1200,
        height: 630,
        alt: "FixIt CMMS Dashboard",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FixIt | Industrial Intelligence. Open Source.",
    description: "The high-density CMMS for modern operations. Built for speed, scalability, and total data sovereignty.",
    creator: "@fixit_cmms",
    images: ["/og-image.png"],
  },
};

export default function Page() {
  return <MarketingPageV2 />;
}
