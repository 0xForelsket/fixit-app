"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { StatsTicker } from "@/components/ui/stats-ticker";
import {
  Activity,
  ArrowRight,
  Box,
  Code2,
  Cpu,
  Database,
  Github,
  Laptop,
  Search,
  Server,
  ShieldCheck,
  Wrench,
  Zap,
  GitFork,
  Users,
  Building,
  Terminal,
  Copy,
  Check,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

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
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  },
};

export default function MarketingPageV2() {
  const systemStats = [
    {
      label: "Assets Indexed",
      value: "2.4k",
      icon: Box,
      variant: "primary" as const,
    },
    {
      label: "Uptime (24h)",
      value: "99.9",
      icon: Zap,
      variant: "success" as const,
    },
    {
      label: "MTTR (hrs)",
      value: "1.2",
      icon: Activity,
      variant: "danger" as const,
      trend: -12.5,
    },
    {
      label: "Queries/s",
      value: "840",
      icon: Search,
      variant: "default" as const,
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground overflow-x-hidden">
      {/* Sticky Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/70 backdrop-blur-md">
        <div className="flex items-center justify-between px-6 py-4 md:px-12 max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <Link href="/v2" className="flex items-center gap-2 group">
              <div className="bg-primary p-1.5 rounded-md group-hover:opacity-90 transition-opacity">
                <Wrench className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-black tracking-tighter font-mono uppercase">
                FixIt<span className="text-muted-foreground">.io</span>
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <Link
              href="https://github.com/0xForelsket/fixit-app"
              className="hidden md:block font-mono text-xs uppercase tracking-widest hover:text-muted-foreground transition-colors"
            >
              Github
            </Link>
            <Link
              href="/v2/architecture"
              className="hidden md:block font-mono text-xs uppercase tracking-widest hover:text-muted-foreground transition-colors"
            >
              Engine
            </Link>
            <div className="h-4 w-[1px] bg-border hidden md:block" />
            <Link
              href="http://app.localhost:3000/login"
              className="font-mono text-xs uppercase tracking-widest hover:text-muted-foreground transition-colors"
            >
              Demo
            </Link>
            <Button
              asChild
              className="bg-primary text-primary-foreground hover:opacity-90 rounded-md px-5 h-9 font-bold text-xs uppercase tracking-wider"
            >
              <Link href="https://github.com/0xForelsket/fixit-app">
                <Github className="mr-2 h-4 w-4" /> STAR
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      <main className="px-6 md:px-12 max-w-7xl mx-auto pt-16 md:pt-24 pb-20">
        {/* Hero Section */}
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="grid md:grid-cols-2 gap-12 md:gap-24 items-center"
        >
          <div className="space-y-8">
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 bg-secondary border border-border px-3 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground">
                v1.2.0 Stable Release
              </span>
            </motion.div>
            
            <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-serif font-black leading-[0.95] tracking-tighter text-foreground">
              INDUSTRIAL <br />
              <span className="text-muted-foreground font-sans italic font-light">
                intelligence.
              </span>
              <br />
              OPEN SOURCE.
            </motion.h1>
            
            <motion.p variants={itemVariants} className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-lg font-light">
              The high-density CMMS for modern operations. Built for speed,
              scalability, and total data sovereignty.
            </motion.p>
            
            <motion.div variants={itemVariants} className="pt-4 flex flex-wrap gap-4">
              <Button
                asChild
                size="lg"
                className="bg-primary text-primary-foreground hover:opacity-90 rounded-none px-8 h-14 text-sm font-black uppercase tracking-widest group"
              >
                <Link href="https://github.com/0xForelsket/fixit-app">
                  Initialize Deployment
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-border hover:bg-secondary rounded-none px-8 h-14 text-sm font-black uppercase tracking-widest transition-all hover:scale-[1.02]"
              >
                <Link href="http://app.localhost:3000/login">Launch Demo</Link>
              </Button>
            </motion.div>
          </div>

          <motion.div 
            variants={itemVariants}
            className="relative mt-8 md:mt-0"
          >
            {/* Abstract Visual / Hero Graphic */}
            <div className="aspect-[4/5] md:aspect-square bg-card rounded-2xl flex flex-col justify-between relative overflow-hidden group border border-border shadow-2xl shadow-primary/5 hover:border-primary/20 transition-all duration-500">
              <div className="absolute inset-0 industrial-grid opacity-10" />
              <div className="relative z-10 p-8 h-full flex flex-col justify-center items-center">
                <motion.div
                  animate={{ y: [0, -15, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Image
                    src="/hero-illustration.png"
                    alt="Industrial Dashboard Illustration"
                    width={600}
                    height={600}
                    className="object-contain opacity-90 drop-shadow-2xl mix-blend-multiply"
                    priority
                  />
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.div>



        {/* Product Screenshots Showcase */}
        <div className="mt-32 space-y-12">
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center space-y-4"
          >
            <h2 className="text-3xl md:text-5xl font-serif font-black tracking-tight">
              Command Center Interface
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Purpose-built for high-velocity maintenance operations. Every pixel calibrated for efficiency.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <Tabs defaultValue="dashboard" className="w-full">
              <div className="flex justify-center mb-8">
                <TabsList className="bg-secondary/50 p-1 border border-border rounded-full">
                  <TabsTrigger value="dashboard" className="rounded-full px-6 py-2 text-xs font-mono font-bold uppercase tracking-wider data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Dashboard</TabsTrigger>
                  <TabsTrigger value="work-orders" className="rounded-full px-6 py-2 text-xs font-mono font-bold uppercase tracking-wider data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Work Orders</TabsTrigger>
                  <TabsTrigger value="equipment" className="rounded-full px-6 py-2 text-xs font-mono font-bold uppercase tracking-wider data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Equipment</TabsTrigger>
                  <TabsTrigger value="analytics" className="rounded-full px-6 py-2 text-xs font-mono font-bold uppercase tracking-wider data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Analytics</TabsTrigger>
                </TabsList>
              </div>

              {["dashboard", "work-orders", "equipment", "analytics"].map((tab) => (
                <TabsContent key={tab} value={tab} className="mt-0">
                  <div className="relative aspect-video bg-card rounded-xl border border-border shadow-2xl overflow-hidden group">
                    <div className="absolute inset-0 bg-secondary/20 industrial-grid opacity-10" />
                    
                    {/* Browser Chrome */}
                    <div className="bg-background/90 backdrop-blur border-b border-border h-10 px-4 flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                        <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/50" />
                        <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/50" />
                      </div>
                      <div className="ml-4 bg-secondary/50 rounded-md py-1 px-3 text-[10px] font-mono text-muted-foreground w-64 flex items-center gap-2">
                        <ShieldCheck className="w-3 h-3" />
                        app.fixit.io/maintenance/{tab}
                      </div>
                    </div>

                    {/* Placeholder Content - In real app, this would be an image */}
                    <div className="p-12 flex items-center justify-center h-[calc(100%-2.5rem)]">
                      <div className="text-center space-y-4">
                        <div className="mx-auto w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
                          {tab === "dashboard" && <Activity className="w-10 h-10 text-primary" />}
                          {tab === "work-orders" && <Wrench className="w-10 h-10 text-primary" />}
                          {tab === "equipment" && <Box className="w-10 h-10 text-primary" />}
                          {tab === "analytics" && <Activity className="w-10 h-10 text-primary" />}
                        </div>
                        <h3 className="text-xl font-bold uppercase tracking-widest text-muted-foreground">
                          {tab.replace("-", " ")} Feature Preview
                        </h3>
                        <p className="text-sm text-muted-foreground/60 max-w-md mx-auto">
                          High-fidelity screenshot of the {tab.replace("-", " ")} interface would appear here.
                          Currently showing placeholder for development.
                        </p>
                      </div>
                    </div>
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </motion.div>
        </div>

        {/* Feature Grid */}
        <div className="mt-32 space-y-12">
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="border-t border-border pt-8 flex items-baseline justify-between"
          >
            <h2 className="text-[10px] font-black tracking-[0.4em] uppercase text-muted-foreground">
              Architecture & Strategy
            </h2>
            <Link
              href="/v2/architecture"
              className="hidden md:flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest hover:opacity-70 transition-opacity"
            >
              Blueprint Reference <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={containerVariants}
            className="grid md:grid-cols-3 gap-6"
          >
            <FeatureCard
              title="Data Sovereignty"
              description="Deploy on-premise or in your private cloud. Your operational data never leaves your infrastructure."
              icon={Server}
              tag="Infrastructure"
            />
            <FeatureCard
              title="High-Density UI"
              description="A calibrated interface designed for high-throughput maintenance teams. Zero friction workflow."
              icon={Laptop}
              tag="Interface"
            />
            <FeatureCard
              title="Secure by Design"
              description="Granular permissions, encrypted sessions, and robust audit logging for enterprise requirements."
              icon={ShieldCheck}
              tag="Security"
            />
          </motion.div>

          {/* Social Proof */}
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="border-y border-border py-12"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="flex flex-col items-center justify-center gap-2 text-center group cursor-default">
                <div className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground transition-colors">
                  <Github className="w-5 h-5" />
                  <span className="text-xs font-mono font-bold uppercase tracking-widest">Stars</span>
                </div>
                <span className="text-3xl font-serif font-black tracking-tighter">2.4k+</span>
              </div>
              <div className="flex flex-col items-center justify-center gap-2 text-center group cursor-default">
                <div className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground transition-colors">
                  <GitFork className="w-5 h-5" />
                  <span className="text-xs font-mono font-bold uppercase tracking-widest">Forks</span>
                </div>
                <span className="text-3xl font-serif font-black tracking-tighter">340+</span>
              </div>
              <div className="flex flex-col items-center justify-center gap-2 text-center group cursor-default">
                <div className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground transition-colors">
                  <Users className="w-5 h-5" />
                  <span className="text-xs font-mono font-bold uppercase tracking-widest">Users</span>
                </div>
                <span className="text-3xl font-serif font-black tracking-tighter">10k+</span>
              </div>
              <div className="flex flex-col items-center justify-center gap-2 text-center group cursor-default">
                <div className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground transition-colors">
                  <Building className="w-5 h-5" />
                  <span className="text-xs font-mono font-bold uppercase tracking-widest">Sites</span>
                </div>
                <span className="text-3xl font-serif font-black tracking-tighter">850+</span>
              </div>
            </div>
          </motion.div>

          {/* CTA Box */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="bg-primary rounded-2xl p-8 md:p-12 overflow-hidden relative group/cta shadow-2xl shadow-primary/20"
          >
            <div className="absolute inset-0 industrial-grid opacity-5 invert pointer-events-none" />
            
            {/* Focal glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary-foreground/10 blur-[120px] rounded-full group-hover/cta:bg-primary-foreground/20 transition-colors pointer-events-none" />

            <div className="md:flex items-start justify-between gap-12 relative z-10">
              <div className="space-y-6 max-w-xl">
                <h3 className="text-3xl font-serif font-black text-primary-foreground leading-tight">
                  Open Engine. <br />
                  <span className="opacity-60 italic font-light">
                    Enterprise Reliability.
                  </span>
                </h3>
                <p className="text-lg text-primary-foreground/70 font-light leading-relaxed">
                  FixIt is built on a modern, high-performance stack that scales
                  with your organization. Extensible by default, powered by the
                  community.
                </p>
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="flex items-center gap-3 text-[10px] font-mono font-bold text-primary-foreground/60 uppercase tracking-widest hover:text-primary-foreground transition-colors group/item">
                    <motion.div whileHover={{ rotate: 180 }} transition={{ duration: 0.5 }}>
                      <Cpu className="h-4 w-4" />
                    </motion.div> 
                    Next.js 15+
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-mono font-bold text-primary-foreground/60 uppercase tracking-widest hover:text-primary-foreground transition-colors group/item">
                    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
                      <Database className="h-4 w-4" />
                    </motion.div>
                    Drizzle ORM
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-mono font-bold text-primary-foreground/60 uppercase tracking-widest hover:text-primary-foreground transition-colors group/item">
                    <motion.div whileHover={{ scale: 1.2 }}>
                      <ShieldCheck className="h-4 w-4" />
                    </motion.div>
                    Auth.js v5
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-mono font-bold text-primary-foreground/60 uppercase tracking-widest hover:text-primary-foreground transition-colors group/item">
                    <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                      <Code2 className="h-4 w-4" />
                    </motion.div>
                    TypeScript
                  </div>
                </div>
              </div>
              <div className="mt-8 md:mt-0 flex-shrink-0">
                <Button
                  asChild
                  className="bg-primary-foreground text-primary hover:opacity-90 rounded-none px-8 h-12 font-black uppercase tracking-widest transition-transform hover:scale-105"
                >
                  <Link href="https://github.com/0xForelsket/fixit-app">
                    Inspect Source
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Quick Deploy Section */}
          <div className="pt-16">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12 space-y-4"
            >
              <h2 className="text-3xl font-serif font-black tracking-tight">
                Deploy in Seconds
              </h2>
              <p className="text-muted-foreground font-light text-lg">
                Choose your infrastructure. We support it all.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              <DeployCard 
                title="Docker" 
                icon={Box}
                description="The standard for self-hosting. Production ready."
              >
                <CodeBlock code="docker compose up -d" />
              </DeployCard>
              
              <DeployCard 
                title="Vercel" 
                icon={Zap}
                description="One-click serverless deployment with global edge network."
              >
                 <Button className="w-full bg-foreground text-background hover:opacity-90 font-bold uppercase tracking-wide h-10">
                   <svg className="mr-2 h-3 w-3" viewBox="0 0 1155 1000" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                     <path d="M577.344 0L1154.69 1000H0L577.344 0Z" />
                   </svg>
                   Deploy to Vercel
                 </Button>
              </DeployCard>

              <DeployCard 
                title="Railway" 
                icon={Server}
                description="Full stack infrastructure. Database included."
              >
                <Button className="w-full bg-[#a855f7] text-white hover:opacity-90 font-bold uppercase tracking-wide h-10">
                  <span className="mr-2">🚂</span>
                  Deploy to Railway
                </Button>
              </DeployCard>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-secondary border-t border-border px-6 py-12 md:px-12 md:py-16">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-12 text-foreground font-sans">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Wrench className="h-6 w-6 text-primary" />
              <span className="text-xl font-black uppercase tracking-tighter font-mono">
                FIXIT<span className="text-muted-foreground">.IO</span>
              </span>
            </div>
            <p className="text-xs font-mono font-bold text-muted-foreground uppercase tracking-widest max-w-[240px] leading-loose">
              Operational Excellence through <br /> Open Source Software.
            </p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-12 md:gap-24">
            <div className="space-y-6">
              <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">
                Protocol
              </h4>
              <ul className="space-y-3 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground">
                <li>
                  <Link
                    href="https://github.com/0xForelsket/fixit-app"
                    className="hover:text-primary transition-colors"
                  >
                    GitHub
                  </Link>
                </li>
                <li>
                  <Link
                    href="/docs"
                    className="hover:text-primary transition-colors"
                  >
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link
                    href="/roadmap"
                    className="hover:text-primary transition-colors"
                  >
                    Roadmap
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-6">
              <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">
                Organization
              </h4>
              <ul className="space-y-3 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground">
                <li>
                  <Link
                    href="#"
                    className="hover:text-primary transition-colors"
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="hover:text-primary transition-colors"
                  >
                    Careers
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="hover:text-primary transition-colors"
                  >
                    Legal
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-border flex flex-col md:flex-row justify-between gap-4">
          <p className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest">
            © 2025 FIXIT OPS INC. ALL RIGHTS RESERVED.
          </p>
          <p className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest">
            STABLE_BUILD_HASH: 0XF9E2A
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  title,
  description,
  icon: Icon,
  tag,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  tag: string;
}) {
  return (
    <motion.div 
      variants={itemVariants}
      className="bg-card border border-border p-8 rounded-xl flex flex-col justify-between h-full min-h-[320px] group transition-all hover:border-primary hover:shadow-2xl hover:shadow-primary/10 relative overflow-hidden"
    >
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div className="bg-background p-3 rounded-lg group-hover:bg-primary group-hover:text-primary-foreground transition-colors transition-all duration-300">
            <Icon className="h-6 w-6" />
          </div>
          <span className="text-[8px] font-mono font-black uppercase tracking-[0.2em] bg-background px-2 py-1 rounded text-muted-foreground">
            [{tag}]
          </span>
        </div>
        <h3 className="text-2xl font-serif font-black text-foreground mb-4 tracking-tighter leading-tight">
          {title}
        </h3>
        <p className="text-muted-foreground text-base font-light leading-relaxed">
          {description}
        </p>
      </div>

      <div className="mt-8 flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest group-hover:text-primary text-muted-foreground transition-colors relative z-10">
        Architecture Docs{" "}
        <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
      </div>

      {/* Decorative background accent */}
      <motion.div 
        animate={{ rotate: [0, 5, -5, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -bottom-12 -right-12 opacity-[0.03] group-hover:opacity-[0.1] transition-opacity pointer-events-none"
      >
        <Icon className="w-64 h-64" />
      </motion.div>
    </motion.div>
  );
}

function DeployCard({ title, icon: Icon, description, children }: { title: string, icon: any, description: string, children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border p-6 rounded-xl flex flex-col justify-between h-full group hover:border-primary/50 transition-colors">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-secondary p-2 rounded-md group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            <Icon className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-lg">{title}</h3>
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {description}
        </p>
      </div>
      <div>
        {children}
      </div>
    </div>
  )
}

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-secondary/50 border border-border rounded-md p-3 flex items-center justify-between group/code relative hover:border-primary/30 transition-colors">
      <code className="font-mono text-xs text-foreground font-bold">
        {code}
      </code>
      <button 
        onClick={copy}
        className="text-muted-foreground hover:text-foreground transition-colors p-1"
      >
        {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
      </button>
    </div>
  );
}

