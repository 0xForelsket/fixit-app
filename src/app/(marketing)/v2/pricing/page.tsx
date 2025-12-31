import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing | FixIt CMMS",
  description: "Simple, transparent pricing. Free for everyone.",
};

export default function PricingPage() {
  return (
    <div className="container mx-auto py-20 px-6">
      <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tighter">Community vs Enterprise</h1>
      <p className="text-xl text-muted-foreground max-w-2xl">Pricing tables under construction.</p>
    </div>
  );
}
