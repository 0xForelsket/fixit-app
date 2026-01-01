import type { Metadata } from "next";
import DeployPage from "./deploy-page";

export const metadata: Metadata = {
  title: "Deploy | FixIt CMMS",
  description:
    "Deployment guides for FixIt CMMS. Support for Docker, Vercel, Railway, and manual infrastructure.",
  openGraph: {
    title: "Deploy FixIt | Installation Guides",
    description:
      "Initialize your FixIt instance on any infrastructure. Professional deployment blueprints for modern engineering teams.",
  },
};

export default function Page() {
  return <DeployPage />;
}
