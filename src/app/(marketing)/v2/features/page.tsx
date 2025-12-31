import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Features | FixIt CMMS",
  description: "Comprehensive feature breakdown for FixIt CMMS.",
};

export default function FeaturesPage() {
  return (
    <div className="container mx-auto py-20 px-6">
      <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tighter">Everything You Need.<br/>Nothing You Don't.</h1>
      <p className="text-xl text-muted-foreground max-w-2xl">This page is under construction as part of the Marketing v2 plan.</p>
    </div>
  );
}
