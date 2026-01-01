import type { Metadata } from "next";
import PricingPage from "./pricing-page";

export const metadata: Metadata = {
  title: "Pricing | FixIt CMMS",
  description:
    "Simple, transparent pricing for any scale. Open source, self-hosted, and enterprise options available.",
  openGraph: {
    title: "Pricing | FixIt CMMS",
    description:
      "Compare our Community and Enterprise plans. Discover the benefits of zero per-user licensing fees.",
  },
};

export default function Page() {
  return <PricingPage />;
}
