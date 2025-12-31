import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compare | FixIt CMMS",
  description: "See how FixIt compares to UpKeep, Fiix, and others.",
};

export default function ComparePage() {
  return (
    <div className="container mx-auto py-20 px-6">
      <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tighter">FixIt vs. The Rest</h1>
      <p className="text-xl text-muted-foreground max-w-2xl">Comparison matrix under construction.</p>
    </div>
  );
}
