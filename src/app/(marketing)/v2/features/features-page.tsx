"use client";

import { motion } from "framer-motion";
import { 
  Wrench, 
  Calendar, 
  Box, 
  ClipboardList, 
  Clock, 
  BarChart3, 
  Smartphone, 
  ShieldCheck, 
  History, 
  Paperclip,
  ArrowRight,
  ChevronRight
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const features = [
  {
    id: "work-orders",
    name: "Work Order Management",
    description: "The heart of your maintenance operations. Create, assign, and track work orders with sub-second latency.",
    icon: Wrench,
    points: [
      "Real-time status tracking",
      "Priority-based dispatching",
      "Custom fields and procedures",
      "Direct asset association"
    ]
  },
  {
    id: "preventive-maintenance",
    name: "Preventive Maintenance",
    description: "Stop reacting. Start predicting. Schedule recurring maintenance based on time intervals or meter readings.",
    icon: Calendar,
    points: [
      "Calendar and meter triggers",
      "Automated WO generation",
      "Maintenance compliance tracking",
      "Seasonal task scheduling"
    ]
  },
  {
    id: "assets",
    name: "Equipment Registry",
    description: "A digital twin for every asset. Track lifecycle, documentation, and maintenance history in one central vault.",
    icon: Box,
    points: [
      "Hierarchy & location mapping",
      "QR code identification",
      "Warranty tracking",
      "Downtime analytics per asset"
    ]
  },
  {
    id: "inventory",
    name: "Inventory & Spare Parts",
    description: "Never run out of critical spares. Manage stock levels, vendors, and automatic reorder points.",
    icon: ClipboardList,
    points: [
      "Multi-warehouse support",
      "Automatic stock depletion",
      "Vendor catalog management",
      "Low-stock notifications"
    ]
  },
  {
    id: "labor",
    name: "Labor Time Tracking",
    description: "Measure what matters. Track technician hours, performance metrics, and labor costs accurately.",
    icon: Clock,
    points: [
      "Technician time logs",
      "Work order cost calculation",
      "Performance benchmarks",
      "Overtime monitoring"
    ]
  },
  {
    id: "analytics",
    name: "Analytics & Reporting",
    description: "Turn data into decisions. High-density dashboards providing deep insights into your operational efficiency.",
    icon: BarChart3,
    points: [
      "MTTR & MTBF metrics",
      "Maintenance spend analysis",
      "Resource utilization reports",
      "Custom PDF exports"
    ]
  },
  {
    id: "mobile",
    name: "Mobile-First Interface",
    description: "Empower your crew on the floor. A fully responsive interface designed for gloved hands and high-glare environments.",
    icon: Smartphone,
    points: [
      "PWA offline capability",
      "Direct photo uploads",
      "Barcode scanning",
      "Push notification alerts"
    ]
  },
  {
    id: "permissions",
    name: "Roles & Permissions",
    description: "Enterprise-grade security. Control exactly who can see and do what across your entire organization.",
    icon: ShieldCheck,
    points: [
      "Granular RBAC",
      "SAML/SSO integration",
      "Audit trail per user",
      "Department isolation"
    ]
  },
  {
    id: "audit",
    name: "Audit Logging",
    description: "Unmatched transparency. Every change, every login, and every status update is cryptographically logged.",
    icon: History,
    points: [
      "Regulatory compliance ready",
      "Change history per record",
      "Exportable logs for inspectors",
      "Immutable history"
    ]
  },
  {
    id: "attachments",
    name: "File Attachments",
    description: "Ditch the paper binders. Attach manuals, safety sheets, and completion photos directly to any record.",
    icon: Paperclip,
    points: [
      "Unlimited file storage",
      "Versioned documentation",
      "Mobile camera integration",
      "PDF/CAD viewer"
    ]
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }
  }
};

export default function FeaturesPage() {
  return (
    <>
      <main className="max-w-7xl mx-auto px-6 md:px-12 py-20 lg:py-32">
        <header className="mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 bg-secondary border border-border px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground">
              Protocol Breakdown
            </div>
            <h1 className="text-5xl md:text-7xl font-serif font-black tracking-tight leading-[0.95]">
              EVERYTHING YOU NEED. <br />
              <span className="text-muted-foreground italic font-light font-sans">
                Nothing you don't.
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl font-light">
              FixIt is engineered for high-density operations. No fluff, no legacy bloat—just the features required to run a world-class maintenance department.
            </p>
          </motion.div>
        </header>

        {/* Sticky feature nav for larger screens */}
        <div className="hidden lg:block sticky top-24 z-40 mb-16 px-4 py-3 bg-secondary/50 border border-border rounded-full backdrop-blur">
          <div className="flex justify-between items-center text-[10px] font-mono font-bold uppercase tracking-[0.2em]">
            {features.slice(0, 6).map((f) => (
              <a key={f.id} href={`#${f.id}`} className="hover:text-primary transition-colors hover:bg-muted/50 px-3 py-1.5 rounded-full">
                {f.name.split(" ")[0]}
              </a>
            ))}
            <span className="text-muted-foreground/30">|</span>
            <a href="#mobile" className="hover:text-primary transition-colors px-3 py-1.5 rounded-full">Mobile</a>
            <a href="#security" className="hover:text-primary transition-colors px-3 py-1.5 rounded-full">Security</a>
          </div>
        </div>

        <section className="space-y-32">
          {features.map((feature, idx) => (
            <motion.div
              key={feature.id}
              id={feature.id}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={itemVariants}
              className={`grid md:grid-cols-2 gap-12 items-center scroll-mt-32 ${idx % 2 === 0 ? "" : "md:flex-row-reverse"}`}
            >
              <div className={`${idx % 2 === 0 ? "" : "md:order-2"}`}>
                <div className="flex items-center gap-4 mb-6">
                  <motion.div 
                    whileHover={{ rotate: 15, scale: 1.1 }}
                    className="bg-primary/10 p-3 rounded-lg"
                  >
                    <feature.icon className="h-8 w-8 text-primary" />
                  </motion.div>
                  <h2 className="text-3xl font-serif font-black tracking-tight">{feature.name}</h2>
                </div>
                <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                  {feature.description}
                </p>
                <ul className="space-y-4">
                  {feature.points.map((point) => (
                    <li key={point} className="flex items-start gap-3">
                      <ChevronRight className="h-4 w-4 mt-1 text-primary shrink-0" />
                      <span className="text-sm font-mono font-bold uppercase tracking-wider">{point}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-10">
                  <Button variant="outline" size="sm" className="group uppercase font-black text-[10px] tracking-widest px-6 h-10" asChild>
                    <Link href={`/v2/deploy`} aria-label={`Learn about setup for ${feature.name}`}>
                      Technical Guide <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                </div>
              </div>

              <motion.div 
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
                className={`aspect-video bg-card border border-border rounded-2xl overflow-hidden relative shadow-2xl group ${idx % 2 === 0 ? "" : "md:order-1"}`}
              >
                <div className="absolute inset-0 bg-secondary/20 industrial-grid opacity-10" />
                <div className="absolute inset-x-0 top-0 h-8 bg-background/50 border-b border-border flex items-center px-4 gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-500/30" />
                  <div className="w-2 h-2 rounded-full bg-amber-500/30" />
                  <div className="w-2 h-2 rounded-full bg-emerald-500/30" />
                </div>
                <div className="h-full w-full flex items-center justify-center p-8">
                  <div className="text-center space-y-3 opacity-30 group-hover:opacity-50 transition-opacity">
                    <feature.icon className="h-16 w-16 mx-auto mb-2" />
                    <p className="font-mono text-[10px] uppercase font-bold tracking-widest">Screenshot Placeholder</p>
                    <p className="text-[8px] max-w-[200px]">{feature.name} interface visual would be rendered here.</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </section>

        <section className="mt-48 py-24 border-t border-border">
          <div className="bg-primary text-primary-foreground rounded-3xl p-12 md:p-24 relative overflow-hidden text-center">
            <div className="absolute inset-0 industrial-grid opacity-10 invert" />
            <div className="relative z-10 space-y-8">
              <h2 className="text-4xl md:text-6xl font-serif font-black tracking-tight leading-none">
                BUILT FOR POWER USERS. <br />
                <span className="italic font-light opacity-70">Scale your operations instantly.</span>
              </h2>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
                <Button size="lg" className="bg-primary-foreground text-primary hover:bg-muted font-black px-12 h-16 rounded-none uppercase tracking-widest">
                  Deploy Now
                </Button>
                <Button size="lg" variant="outline" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10 font-black px-12 h-16 rounded-none uppercase tracking-widest">
                  Launch Demo
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
