"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Building2,
  Check,
  Cloud,
  Github,
  HelpCircle,
  ShieldCheck,
  Users2,
} from "lucide-react";
import Link from "next/link";

const plans = [
  {
    name: "Community",
    price: "FREE",
    period: "FOREVER",
    description:
      "Ideal for growing maintenance teams and enthusiasts who demand total control.",
    cta: "Initialize Deployment",
    href: "https://github.com/0xForelsket/fixit-app",
    icon: Github,
    features: [
      "Full access to all modules",
      "Unlimited assets & locations",
      "Unlimited users & admins",
      "Self-hosted infrastructure",
      "Open source codebase",
      "Community-driven support",
    ],
    highlight: false,
  },
  {
    name: "Enterprise",
    price: "CONTACT",
    period: "PER FACILITY",
    description:
      "Tailored for multi-site organizations requiring compliance and priority support.",
    cta: "Talk to Sales",
    href: "/contact",
    icon: Building2,
    features: [
      "Everything in Community",
      "SAML / SSO integration",
      "Advanced audit logging",
      "Multi-site aggregation",
      "Dedicated account manager",
      "Priority SLA support",
      "Custom training programs",
    ],
    highlight: true,
  },
];

const faqs = [
  {
    q: "Is it really free?",
    a: "Yes. The core FixIt CMMS is open-source and free to use forever. You can self-host it on your own infrastructure without paying a single license fee.",
  },
  {
    q: "What's the catch?",
    a: "No catch. We believe maintenance software should be utility-grade. We make money by offering enterprise support, hosting services, and custom integrations for large organizations.",
  },
  {
    q: "Can I migrate from UpKeep/Fiix?",
    a: "Absolutely. We have import scripts for major SaaS providers. Head over to our compare page or documentation to see how the migration protocol works.",
  },
  {
    q: "Do you offer a cloud version?",
    a: "Soon. We're working on 'FixIt Cloud'—a managed version of the core platform for teams who want the benefits of FixIt without the server management. Sign up for the waiting list!",
  },
  {
    q: "Is it secure?",
    a: "By design. Because you self-host, you control the data residency and firewall rules. Our codebase is open for audit by anyone.",
  },
];

export default function PricingPage() {
  return (
    <>
      <main className="max-w-7xl mx-auto px-6 md:px-12 py-20 lg:py-32">
        <header className="mb-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            <h1 className="text-5xl md:text-8xl font-serif font-black tracking-tight leading-[0.9]">
              FIXIT PRICING. <br />
              <span className="text-muted-foreground italic font-light font-sans">
                Simple logic.
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-light leading-relaxed">
              No hidden fees, no per-user scaling taxes, no vendor lock-in. Just
              powerful maintenance software at whichever scale you operate.
            </p>
          </motion.div>
        </header>

        <section className="grid lg:grid-cols-2 gap-8 mb-48">
          {plans.map((plan) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className={`relative flex flex-col p-8 md:p-12 rounded-3xl border ${plan.highlight ? "border-primary ring-1 ring-primary shadow-2xl shadow-primary/10" : "border-border"}`}
            >
              {plan.highlight && (
                <div className="absolute top-0 right-12 -translate-y-1/2 bg-primary text-primary-foreground text-[10px] font-mono font-black uppercase tracking-widest px-4 py-2 rounded-full">
                  Recommended for Teams
                </div>
              )}

              <div className="flex justify-between items-start mb-12">
                <div className="space-y-2">
                  <div
                    className={`p-3 rounded-xl w-fit ${plan.highlight ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
                  >
                    <plan.icon className="h-6 w-6" />
                  </div>
                  <h2 className="text-3xl font-black font-mono tracking-tighter uppercase">
                    {plan.name}
                  </h2>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-serif font-black">
                    {plan.price}
                  </div>
                  <div className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest">
                    {plan.period}
                  </div>
                </div>
              </div>

              <p className="text-muted-foreground text-sm mb-12 leading-relaxed">
                {plan.description}
              </p>

              <div className="space-y-6 mb-12 flex-grow">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <Check
                      className={`h-4 w-4 shrink-0 ${plan.highlight ? "text-primary" : "text-muted-foreground"}`}
                    />
                    <span className="text-xs font-mono font-black uppercase tracking-wide">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>

              <Button
                asChild
                size="lg"
                variant={plan.highlight ? "default" : "outline"}
                className="w-full h-16 rounded-none font-black uppercase tracking-widest text-[10px] group"
              >
                <Link href={plan.href}>
                  {plan.cta}{" "}
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </motion.div>
          ))}
        </section>

        {/* Feature Comparison Mini-Grid */}
        <section className="mb-48 py-24 border-y border-border">
          <div className="grid md:grid-cols-3 gap-12">
            <div className="space-y-4">
              <Users2 className="h-8 w-8 text-primary" />
              <h3 className="font-serif font-black text-xl">Unlimited Scale</h3>
              <p className="text-sm text-muted-foreground font-light">
                Whether you have 5 assets or 50,000, FixIt handles high-density
                data without slowing down.
              </p>
            </div>
            <div className="space-y-4">
              <ShieldCheck className="h-8 w-8 text-primary" />
              <h3 className="font-serif font-black text-xl">
                Total Sovereignty
              </h3>
              <p className="text-sm text-muted-foreground font-light">
                Your data never leaves your environment. Perfect for SOC2/GDPR
                compliance requirements.
              </p>
            </div>
            <div className="space-y-4">
              <Cloud className="h-8 w-8 text-primary" />
              <h3 className="font-serif font-black text-xl">Modern Stack</h3>
              <p className="text-sm text-muted-foreground font-light">
                Built with Next.js 15, Drizzle ORM, and Tailwind. Fast,
                reliable, and easily extensible.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="max-w-3xl mx-auto mb-24">
          <div className="text-center mb-16 space-y-4">
            <HelpCircle className="h-8 w-8 mx-auto text-primary" />
            <h2 className="text-3xl font-serif font-black tracking-tight uppercase">
              Common Queries
            </h2>
          </div>
          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="border border-border rounded-xl px-4 overflow-hidden"
              >
                <AccordionTrigger className="hover:no-underline font-mono text-[10px] font-black uppercase tracking-widest py-6">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground font-light leading-relaxed pb-6">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        <section className="text-center py-24 bg-secondary rounded-3xl relative overflow-hidden">
          <div className="absolute inset-0 industrial-grid opacity-10" />
          <div className="relative z-10 space-y-8">
            <h2 className="text-3xl md:text-5xl font-serif font-black leading-none">
              Questions on deployment?
            </h2>
            <p className="text-muted-foreground uppercase font-mono font-bold tracking-widest text-xs">
              Check our technical blueprint or join the community.
            </p>
            <div className="flex justify-center gap-4">
              <Button
                variant="outline"
                className="rounded-none uppercase font-black px-8 h-12 text-[10px] tracking-widest"
              >
                Read Blueprint
              </Button>
              <Button className="rounded-none uppercase font-black px-8 h-12 text-[10px] tracking-widest">
                Support Discord
              </Button>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
