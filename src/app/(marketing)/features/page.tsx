import type { Metadata } from "next";
import FeaturesPage from "./features-page";

export const metadata: Metadata = {
  title: "Features | FixIt CMMS",
  description:
    "Comprehensive feature breakdown for FixIt CMMS. Industrial reliability meets modern design.",
  openGraph: {
    title: "Features | FixIt CMMS",
    description:
      "Every feature you need to run a world-class maintenance department. From Work Orders to Predictive Analytics.",
  },
};

export default function Page() {
  return <FeaturesPage />;
}
