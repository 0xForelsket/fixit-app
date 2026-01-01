import { Metadata } from "next";
import ComparePage from "./compare-page";

export const metadata: Metadata = {
  title: "Compare | FixIt CMMS",
  description: "See how FixIt compares to SaaS vendors like UpKeep, Fiix, and MaintainX. Modern, open-source, and free.",
  openGraph: {
    title: "FixIt vs. The Rest | CMMS Comparison",
    description: "Compare features, pricing, and infrastructure. Why top engineering teams are switching to FixIt.",
  }
};

export default function Page() {
  return <ComparePage />;
}
