"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  FileText,
  Globe2,
  Lock,
  MessageSquare,
  ShieldCheck,
  Users2,
} from "lucide-react";

const enterpriseFeatures = [
  {
    title: "SAML/SSO Integration",
    description:
      "Connect FixIt to Okta, Azure AD, or any OIDC provider. Manage access at scale through your central directory.",
    icon: Lock,
  },
  {
    title: "Multi-Site Management",
    description:
      "Consolidate telemetry and analytics across multiple facilities. Global visibility with local execution.",
    icon: Globe2,
  },
  {
    title: "Advanced Audit Logs",
    description:
      "Detailed change history for every record. Meet SOC2, GDPR, and industry-specific compliance standards.",
    icon: FileText,
  },
  {
    title: "Priority SLA Support",
    description:
      "Direct access to our engineering team with guaranteed response times for critical production issues.",
    icon: ShieldCheck,
  },
  {
    title: "Custom Integrations",
    description:
      "Bridge FixIt with your existing ERP (SAP, Oracle) or SCADA systems through our robust enterprise API.",
    icon: BarChart3,
  },
  {
    title: "Team Training",
    description:
      "Onboarding sessions for your technicians and managers to ensure rapid adoption and maximum ROI.",
    icon: Users2,
  },
];

export default function EnterprisePage() {
  return (
    <>
      <main className="max-w-7xl mx-auto px-6 md:px-12 py-20 lg:py-32">
        <header className="mb-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-3 py-1 rounded-full text-[10px] font-mono font-black uppercase tracking-widest text-primary">
              Mission Critical Infrastructure
            </div>
            <h1 className="text-5xl md:text-8xl font-serif font-black tracking-tight leading-[0.9]">
              FIXIT FOR THE <br />
              <span className="text-muted-foreground italic font-light font-sans">
                organization.
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl font-light leading-relaxed">
              Scale your maintenance protocol across 10 sites or 10,000. FixIt
              Enterprise provides the control and reliability required by global
              operations.
            </p>
          </motion.div>
        </header>

        {/* Features Grid */}
        <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-48">
          {enterpriseFeatures.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="p-8 rounded-3xl border border-border bg-card group hover:border-primary/50 transition-colors"
            >
              <div className="bg-secondary p-3 rounded-xl w-fit mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <feature.icon className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-black font-mono tracking-tighter uppercase mb-3">
                {feature.title}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </section>

        {/* Security Section */}
        <section className="mb-48 bg-secondary rounded-[3rem] p-8 md:p-16 relative overflow-hidden">
          <div className="absolute inset-0 industrial-grid opacity-5" />
          <div className="grid lg:grid-cols-2 gap-16 items-center relative z-10">
            <div className="space-y-8">
              <h2 className="text-4xl md:text-6xl font-serif font-black tracking-tight leading-none">
                HARDENED <br /> BY DEFAULT.
              </h2>
              <p className="text-lg text-muted-foreground font-light">
                Our architecture is built for organizations that cannot afford a
                data breach. Because you own the infrastructure, you own the
                security posture.
              </p>
              <div className="space-y-4">
                {[
                  "On-premise deployment or private VPC",
                  "Encrypted database-at-rest protocol",
                  "Open-source transparency for security audits",
                  "No third-party data telemetry",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    <span className="text-xs font-mono font-bold uppercase tracking-widest">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="aspect-square bg-background/50 backdrop-blur border border-border rounded-3xl flex flex-col items-center justify-center p-8 text-center">
                <ShieldCheck className="h-10 w-10 text-primary mb-4" />
                <div className="text-[10px] font-mono font-black uppercase tracking-widest">
                  SOC 2 TYPE II
                </div>
                <div className="text-[8px] text-muted-foreground uppercase mt-1">
                  Ready
                </div>
              </div>
              <div className="aspect-square bg-background/50 backdrop-blur border border-border rounded-3xl flex flex-col items-center justify-center p-8 text-center">
                <Lock className="h-10 w-10 text-primary mb-4" />
                <div className="text-[10px] font-mono font-black uppercase tracking-widest">
                  AES-256
                </div>
                <div className="text-[8px] text-muted-foreground uppercase mt-1">
                  Encryption
                </div>
              </div>
              <div className="aspect-square bg-background/50 backdrop-blur border border-border rounded-3xl flex flex-col items-center justify-center p-8 text-center">
                <Building2 className="h-10 w-10 text-primary mb-4" />
                <div className="text-[10px] font-mono font-black uppercase tracking-widest">
                  HIPAA
                </div>
                <div className="text-[8px] text-muted-foreground uppercase mt-1">
                  Compliant
                </div>
              </div>
              <div className="aspect-square bg-background/50 backdrop-blur border border-border rounded-3xl flex flex-col items-center justify-center p-8 text-center">
                <Globe2 className="h-10 w-10 text-primary mb-4" />
                <div className="text-[10px] font-mono font-black uppercase tracking-widest">
                  GDPR
                </div>
                <div className="text-[8px] text-muted-foreground uppercase mt-1">
                  Protected
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Form Section */}
        <section className="max-w-4xl mx-auto py-24">
          <div className="text-center mb-16 space-y-4">
            <MessageSquare className="h-10 w-10 mx-auto text-primary" />
            <h2 className="text-4xl font-serif font-black tracking-tight uppercase">
              Request Enterprise Protocol
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto font-light">
              Speak with our technical leads about volume licensing, custom
              deployment, and enterprise support agreements.
            </p>
          </div>

          <form className="bg-card border border-border rounded-[2rem] p-8 md:p-12 shadow-2xl space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label
                  htmlFor="enterprise-name"
                  className="text-[10px] font-mono font-black uppercase tracking-widest text-muted-foreground"
                >
                  Full Name
                </label>
                <input
                  id="enterprise-name"
                  type="text"
                  className="w-full bg-secondary/50 border border-border h-12 px-4 rounded-xl focus:border-primary outline-none transition-colors"
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="enterprise-email"
                  className="text-[10px] font-mono font-black uppercase tracking-widest text-muted-foreground"
                >
                  Work Email
                </label>
                <input
                  id="enterprise-email"
                  type="email"
                  className="w-full bg-secondary/50 border border-border h-12 px-4 rounded-xl focus:border-primary outline-none transition-colors"
                  placeholder="john@enterprise.com"
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="enterprise-company"
                  className="text-[10px] font-mono font-black uppercase tracking-widest text-muted-foreground"
                >
                  Company
                </label>
                <input
                  id="enterprise-company"
                  type="text"
                  className="w-full bg-secondary/50 border border-border h-12 px-4 rounded-xl focus:border-primary outline-none transition-colors"
                  placeholder="Acme Corp"
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="enterprise-sites"
                  className="text-[10px] font-mono font-black uppercase tracking-widest text-muted-foreground"
                >
                  Facility Sites
                </label>
                <select
                  id="enterprise-sites"
                  className="w-full bg-secondary/50 border border-border h-12 px-4 rounded-xl focus:border-primary outline-none transition-colors appearance-none"
                >
                  <option>1-5 Sites</option>
                  <option>5-20 Sites</option>
                  <option>20-100 Sites</option>
                  <option>100+ Sites</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label
                htmlFor="enterprise-inquiry"
                className="text-[10px] font-mono font-black uppercase tracking-widest text-muted-foreground"
              >
                Inquiry Details
              </label>
              <textarea
                id="enterprise-inquiry"
                className="w-full bg-secondary/50 border border-border h-32 p-4 rounded-xl focus:border-primary outline-none transition-colors resize-none"
                placeholder="Tell us about your operational infrastructure..."
              />
            </div>
            <Button
              size="lg"
              className="w-full h-16 rounded-none font-black uppercase tracking-widest text-[10px] group shadow-xl shadow-primary/20"
            >
              Initialize Contact{" "}
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </form>
        </section>
      </main>
    </>
  );
}
