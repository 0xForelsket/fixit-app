"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Cpu,
  Database,
  Globe,
  Layers,
  Lock,
  Monitor,
  Network,
  ShieldCheck,
  Workflow,
  Zap,
} from "lucide-react";
import Link from "next/link";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  },
};

const revealVariants = {
  hidden: { clipPath: "inset(0 100% 0 0)" },
  visible: {
    clipPath: "inset(0 0 0 0)",
    transition: {
      duration: 0.8,
      ease: [0.77, 0, 0.175, 1] as const,
    },
  },
};

export default function ArchitecturePage() {
  return (
    <main className="px-6 md:px-12 max-w-7xl mx-auto pt-16 md:pt-24 pb-32">
      {/* Hero Section */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="space-y-8 max-w-4xl"
      >
        <motion.div
          variants={itemVariants}
          className="inline-flex items-center gap-2 bg-secondary border border-border px-3 py-1 rounded-full"
        >
          <Cpu className="h-3 w-3 text-primary animate-pulse" />
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground">
            Technical Specification v1.2
          </span>
        </motion.div>

        <motion.h1
          variants={itemVariants}
          className="text-5xl md:text-8xl font-serif font-black leading-[0.9] tracking-tighter text-foreground"
        >
          THE ENGINE <br />
          <span className="text-muted-foreground font-sans italic font-light">
            under the hood.
          </span>
        </motion.h1>

        <motion.p
          variants={itemVariants}
          className="text-xl md:text-2xl text-muted-foreground leading-relaxed font-light max-w-2xl"
        >
          A high-performance architecture designed for industrial-scale
          reliability, zero-latency workflows, and absolute data control.
        </motion.p>
      </motion.div>

      {/* System Schematic / Diagram Placeholder */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={itemVariants}
        className="mt-20 border border-border rounded-2xl bg-card overflow-hidden relative group"
      >
        <div className="absolute inset-0 industrial-grid opacity-10 pointer-events-none" />

        {/* Scan line effect (Keep CSS animation for background) */}
        <div className="absolute left-0 w-full h-[2px] bg-primary/20 animate-scan z-20 pointer-events-none" />

        <div className="p-8 md:p-12 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="space-y-12 flex-1">
              <div className="space-y-4">
                <h2 className="text-sm font-mono font-black uppercase tracking-[0.4em] text-primary">
                  [01] System Topology
                </h2>
                <p className="text-base text-muted-foreground font-light leading-relaxed max-w-lg">
                  A decoupled architecture using Next.js 15 App Router for the
                  frontend and a shared PostgreSQL core for persistent
                  operational data.
                </p>
              </div>

              {/* Abstract Diagram with Code */}
              <div className="grid grid-cols-1 gap-6">
                <TopologyBlock
                  icon={Globe}
                  title="EDGE_RUNTIME_LAYER"
                  code={`// Global state & routing resolution\nexport function middleware(req: NextRequest) {\n  return resolveSubdomain(req.host);\n}`}
                />
                <div className="border-l-2 border-dashed border-primary/20 ml-8 h-8" />
                <TopologyBlock
                  icon={Layers}
                  title="APPLICATION_LOGIC_CORE"
                  code={`// Server-side validation & Drizzle ORM implementation\nconst workOrder = await db.query.workOrders.findFirst({\n  where: eq(workOrders.id, params.id)\n});`}
                />
                <div className="border-l-2 border-dashed border-primary/20 ml-8 h-8" />
                <TopologyBlock
                  icon={Database}
                  title="PERSISTENCE_LAYER"
                  code={`PostgreSQL (v16+) | 256-bit AES Encryption at rest`}
                  isTextOnly
                />
              </div>
            </div>

            {/* Visual Decorative Side */}
            <div className="flex-1 hidden md:flex justify-center items-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="relative group/orbit"
              >
                <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full animate-pulse" />
                <div className="w-80 h-80 border border-primary/10 rounded-full animate-spin-slow flex items-center justify-center relative">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full shadow-[0_0_15px_rgba(0,0,0,0.5)]" />
                  <div className="w-64 h-64 border border-dashed border-primary/10 rounded-full animate-reverse-spin flex items-center justify-center" />
                </div>
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{
                    duration: 6,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                  }}
                  className="absolute inset-0 m-auto h-20 w-20 bg-background border border-border rounded-2xl shadow-2xl flex items-center justify-center group-hover/orbit:scale-110 transition-transform"
                >
                  <Cpu className="h-10 w-10 text-primary opacity-80" />
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stack Deep Dive */}
      <div className="mt-32 space-y-16">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="border-t border-border pt-8"
        >
          <h2 className="text-xs font-black tracking-[0.4em] uppercase text-muted-foreground">
            Core Stack Specifications
          </h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={containerVariants}
          className="grid md:grid-cols-4 gap-4"
        >
          <StackCard
            title="Next.js 15+"
            spec="React 19 / App Router"
            description="Server Components by default for zero-bundle core logic and instantaneous page transitions."
            icon={Zap}
          />
          <StackCard
            title="Drizzle ORM"
            spec="Type-Safe SQL"
            description="Low-overhead database interaction with full TypeScript inference and auto-migrations."
            icon={Database}
          />
          <StackCard
            title="Postgres Core"
            spec="Relational Engine"
            description="ACID compliant reliability for mission-critical maintenance logs and audit trails."
            icon={Globe}
          />
          <StackCard
            title="Auth.js v5"
            spec="Edge-Ready Auth"
            description="Secure, decentralized authentication supporting OIDC, LDAP, and custom providers."
            icon={ShieldCheck}
          />
        </motion.div>
      </div>

      {/* Data Sovereignty Section */}
      <div className="mt-32 grid md:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="bg-primary p-12 rounded-3xl text-primary-foreground space-y-8 relative overflow-hidden group shadow-2xl shadow-primary/20"
        >
          <div className="absolute inset-0 industrial-grid opacity-5 invert pointer-events-none" />
          <div className="relative z-10 space-y-6">
            <Lock className="h-10 w-10 opacity-60" />
            <h3 className="text-4xl font-serif font-black leading-tight">
              Absolute Data Sovereignty.
            </h3>
            <p className="text-lg opacity-80 font-light leading-relaxed">
              Unlike traditional SaaS CMMS, FixIt offers complete infrastructure
              choice. Host on-premise, in your private cloud, or air-gapped from
              the internet.
            </p>
            <ul className="space-y-4 pt-4 text-xs font-mono font-bold tracking-widest uppercase">
              <li className="flex items-center gap-3">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: 6 }}
                  className="h-1.5 bg-primary-foreground rounded-full"
                />
                Zero Vendor Lock-in
              </li>
              <li className="flex items-center gap-3">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: 6 }}
                  className="h-1.5 bg-primary-foreground rounded-full"
                />
                Encrypted Field Exports
              </li>
              <li className="flex items-center gap-3">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: 6 }}
                  className="h-1.5 bg-primary-foreground rounded-full"
                />
                Private S3 Attachments
              </li>
            </ul>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="space-y-8"
        >
          <h3 className="text-3xl font-serif font-black text-foreground">
            Built for the <br />
            <span className="text-muted-foreground italic font-light">
              Compliance-First Enterprise.
            </span>
          </h3>
          <p className="text-muted-foreground font-light leading-relaxed">
            We provide the blueprint, you provide the environment. FixIt's
            open-core model ensures that your operational records—from work
            orders to safety certifications—are owned by you, forever.
          </p>
          <div className="pt-4">
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-border hover:bg-secondary rounded-none px-8 h-14 text-sm font-black uppercase tracking-widest transition-all hover:scale-[1.02]"
            >
              <Link href="/docs/security">Download Security Whitepaper</Link>
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Integration Layer */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="mt-32 border-t border-border pt-16"
      >
        <div className="flex items-center gap-3 mb-12">
          <Network className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-serif font-black">
            Open Connectors (API)
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          <motion.div
            whileHover={{ x: 10 }}
            className="space-y-6 group cursor-default"
          >
            <div className="flex items-center gap-4">
              <div className="bg-secondary p-2 rounded-lg group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Monitor className="h-5 w-5" />
              </div>
              <h4 className="font-mono text-xs font-black uppercase tracking-widest">
                REST API v1.0
              </h4>
            </div>
            <p className="text-muted-foreground text-sm font-light leading-relaxed">
              A fully documented OpenAPI specification for programmatic access
              to every asset, worker, and maintenance log in your system.
            </p>
          </motion.div>
          <motion.div
            whileHover={{ x: 10 }}
            className="space-y-6 group cursor-default"
          >
            <div className="flex items-center gap-4">
              <div className="bg-secondary p-2 rounded-lg group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Workflow className="h-5 w-5" />
              </div>
              <h4 className="font-mono text-xs font-black uppercase tracking-widest">
                Webhooks Engine
              </h4>
            </div>
            <p className="text-muted-foreground text-sm font-light leading-relaxed">
              Trigger external automations (Zapier, Make, custom scripts) on
              critical system events: Work Order Overdue, Safety Incidents, or
              Stock Low alerts.
            </p>
          </motion.div>
        </div>
      </motion.div>
    </main>
  );
}

function TopologyBlock({
  icon: Icon,
  title,
  code,
  isTextOnly,
}: { icon: any; title: string; code: string; isTextOnly?: boolean }) {
  return (
    <motion.div
      variants={revealVariants}
      className="border border-border p-5 bg-background font-mono text-xs leading-relaxed text-muted-foreground rounded-lg shadow-sm group/block hover:border-primary/30 transition-colors"
    >
      <div className="flex items-center gap-2 text-primary mb-3">
        <Icon className="h-4 w-4" />
        <span className="font-bold text-sm tracking-tight text-foreground/80">
          {title}
        </span>
      </div>
      <div
        className={`opacity-60 group-hover:opacity-100 transition-opacity ${isTextOnly ? "font-sans italic text-sm" : ""}`}
      >
        {code.split("\n").map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>
    </motion.div>
  );
}

function StackCard({
  title,
  spec,
  description,
  icon: Icon,
}: {
  title: string;
  spec: string;
  description: string;
  icon: React.ElementType;
}) {
  return (
    <motion.div
      variants={itemVariants}
      className="bg-card border border-border p-6 rounded-xl space-y-4 group hover:border-primary/50 transition-all hover:shadow-xl hover:shadow-primary/5"
    >
      <div className="bg-background w-10 h-10 flex items-center justify-center rounded-lg group-hover:bg-primary group-hover:text-primary-foreground transition-colors transition-all duration-300">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h3 className="font-mono text-sm font-black uppercase tracking-widest text-primary mb-1">
          {title}
        </h3>
        <p className="text-xs font-mono text-muted-foreground uppercase tracking-tighter opacity-70 mb-3">
          {spec}
        </p>
        <p className="text-sm text-muted-foreground font-light leading-relaxed">
          {description}
        </p>
      </div>
    </motion.div>
  );
}
