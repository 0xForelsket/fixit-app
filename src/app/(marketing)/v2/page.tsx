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
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

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
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground">
      {/* Sticky Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/70 backdrop-blur-md">
        <div className="flex items-center justify-between px-6 py-4 md:px-12 max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="bg-primary p-1.5 rounded-md">
              <Wrench className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-black tracking-tighter font-mono uppercase">
              FixIt<span className="text-muted-foreground">.io</span>
            </span>
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
        <div className="grid md:grid-cols-2 gap-12 md:gap-24 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 bg-secondary border border-border px-3 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground">
                v1.2.0 Stable Release
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-serif font-black leading-[0.95] tracking-tighter text-foreground">
              INDUSTRIAL <br />
              <span className="text-muted-foreground font-sans italic font-light">
                intelligence.
              </span>
              <br />
              OPEN SOURCE.
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-lg font-light">
              The high-density CMMS for modern operations. Built for speed,
              scalability, and total data sovereignty.
            </p>
            <div className="pt-4 flex flex-wrap gap-4">
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
                className="border-border hover:bg-secondary rounded-none px-8 h-14 text-sm font-black uppercase tracking-widest"
              >
                <Link href="http://app.localhost:3000/login">Launch Demo</Link>
              </Button>
            </div>
          </div>

          <div className="relative mt-8 md:mt-0">
            {/* Abstract Visual / Hero Graphic */}
            <div className="aspect-[4/5] md:aspect-square bg-card rounded-2xl flex flex-col justify-between relative overflow-hidden group border border-border shadow-2xl shadow-primary/5">
              <div className="absolute inset-0 industrial-grid opacity-10" />
              <div className="relative z-10 p-8 h-full flex flex-col justify-center items-center">
                <Image
                  src="/hero-illustration.png"
                  alt="Industrial Dashboard Illustration"
                  width={600}
                  height={600}
                  className="object-contain opacity-90 drop-shadow-2xl mix-blend-multiply"
                  priority
                />
              </div>
            </div>
          </div>
        </div>

        {/* System Stats Ticker */}
        <div className="mt-24 space-y-4">
          <div className="flex items-center gap-3">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-[10px] font-mono font-black uppercase tracking-[0.3em] text-muted-foreground">
              Live System Telemetry
            </h2>
          </div>
          <StatsTicker stats={systemStats} className="border-border" />
        </div>

        {/* Feature Grid */}
        <div className="mt-32 space-y-12">
          <div className="border-t border-border pt-8 flex items-baseline justify-between">
            <h2 className="text-[10px] font-black tracking-[0.4em] uppercase text-muted-foreground">
              Architecture & Strategy
            </h2>
            <Link
              href="/v2/architecture"
              className="hidden md:flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest hover:opacity-70 transition-opacity"
            >
              Blueprint Reference <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
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
          </div>

          <div className="bg-primary rounded-2xl p-8 md:p-12 overflow-hidden relative">
            <div className="absolute inset-0 industrial-grid opacity-5 invert pointer-events-none" />
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
                  <div className="flex items-center gap-3 text-[10px] font-mono font-bold text-primary-foreground/60 uppercase tracking-widest">
                    <Cpu className="h-4 w-4" /> Next.js 15+
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-mono font-bold text-primary-foreground/60 uppercase tracking-widest">
                    <Database className="h-4 w-4" /> Drizzle ORM
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-mono font-bold text-primary-foreground/60 uppercase tracking-widest">
                    <ShieldCheck className="h-4 w-4" /> Auth.js v5
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-mono font-bold text-primary-foreground/60 uppercase tracking-widest">
                    <Code2 className="h-4 w-4" /> TypeScript
                  </div>
                </div>
              </div>
              <div className="mt-8 md:mt-0 flex-shrink-0">
                <Button
                  asChild
                  className="bg-primary-foreground text-primary hover:opacity-90 rounded-none px-8 h-12 font-black uppercase tracking-widest"
                >
                  <Link href="https://github.com/0xForelsket/fixit-app">
                    Inspect Source
                  </Link>
                </Button>
              </div>
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
    <div className="bg-card border border-border p-8 rounded-xl flex flex-col justify-between h-full min-h-[320px] group transition-all hover:border-primary hover:shadow-xl hover:shadow-primary/5 relative overflow-hidden">
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div className="bg-background p-3 rounded-lg group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
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
      <div className="absolute -bottom-12 -right-12 opacity-[0.03] group-hover:opacity-[0.1] transition-opacity">
        <Icon className="w-64 h-64" />
      </div>
    </div>
  );
}
