import { Metadata } from "next";
import EnterprisePage from "./enterprise-page";

export const metadata: Metadata = {
  title: "Enterprise | FixIt CMMS",
  description: "Enterprise-grade reliability for multi-site organizations. SAML/SSO, advanced audit logs, and priority support.",
  openGraph: {
    title: "FixIt Enterprise | Industrial Scale",
    description: "The open-source CMMS built for the enterprise. Total data sovereignty with professional support.",
  }
};

export default function Page() {
  return <EnterprisePage />;
}
