import { Button } from "@/components/ui/button";
import {
  Activity,
  ArrowRight,
  Code2,
  Cpu,
  Database,
  Github,
  Layers,
  Lock,
  Network,
  Server,
  ShieldCheck,
  Zap,
  Box,
  Layout,
  Globe,
  Monitor,
  Workflow,
  Wrench,
} from "lucide-react";
import Link from "next/link";

export default function ArchitecturePage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground">
      {/* Sticky Navigation (Reused from V2 Home) */}
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
              href="/v2/architecture"
              className="hidden md:block font-mono text-xs uppercase tracking-widest text-primary border-b-2 border-primary pb-1"
            >
              Engine
            </Link>
            <Link
              href="/docs"
              className="hidden md:block font-mono text-xs uppercase tracking-widest hover:text-muted-foreground transition-colors"
            >
              Docs
            </Link>
            <div className="h-4 w-[1px] bg-border hidden md:block" />
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

      <main className="px-6 md:px-12 max-w-7xl mx-auto pt-16 md:pt-24 pb-32">
        {/* Hero Section */}
        <div className="space-y-8 max-w-4xl">
          <div className="inline-flex items-center gap-2 bg-secondary border border-border px-3 py-1 rounded-full">
            <Cpu className="h-3 w-3 text-primary" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground">
              Technical Specification v1.2
            </span>
          </div>
          <h1 className="text-5xl md:text-8xl font-serif font-black leading-[0.9] tracking-tighter text-foreground">
            THE ENGINE <br />
            <span className="text-muted-foreground font-sans italic font-light">
              under the hood.
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed font-light max-w-2xl">
            A high-performance architecture designed for industrial-scale reliability, 
            zero-latency workflows, and absolute data control.
          </p>
        </div>

        {/* System Schematic / Diagram Placeholder */}
        <div className="mt-20 border border-border rounded-2xl bg-card overflow-hidden relative group">
          <div className="absolute inset-0 industrial-grid opacity-10 pointer-events-none" />
          <div className="p-8 md:p-12 relative z-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-12">
              <div className="space-y-12 flex-1">
                <div className="space-y-4">
                  <h2 className="text-xs font-mono font-black uppercase tracking-[0.4em] text-primary">
                    [01] System Topology
                  </h2>
                  <p className="text-sm text-muted-foreground font-light leading-relaxed max-w-sm">
                    A decoupled architecture using Next.js 15 App Router for the frontend and a shared PostgreSQL 
                    core for persistent operational data.
                  </p>
                </div>
                
                {/* Abstract Diagram with Code */}
                <div className="grid grid-cols-1 gap-4">
                   <div className="border border-border p-4 bg-background font-mono text-[10px] leading-tight text-muted-foreground rounded-lg shadow-sm">
                      <div className="flex items-center gap-2 text-primary mb-2">
                        <Globe className="h-3 w-3" />
                        <span>EDGE_RUNTIME_LAYER</span>
                      </div>
                      <div className="opacity-50">
                        {`// Global state & routing resolution`} <br />
                        {`export function middleware(req: NextRequest) {`} <br />
                        {`  return resolveSubdomain(req.host);`} <br />
                        {`}`}
                      </div>
                   </div>
                   <div className="border-l-2 border-dashed border-primary/20 ml-6 h-8" />
                   <div className="border border-border p-4 bg-background font-mono text-[10px] leading-tight text-muted-foreground rounded-lg shadow-sm">
                      <div className="flex items-center gap-2 text-primary mb-2">
                        <Layers className="h-3 w-3" />
                        <span>APPLICATION_LOGIC_CORE</span>
                      </div>
                      <div className="opacity-50">
                        {`// Server-side validation & Drizzle ORM implementation`} <br />
                        {`const workOrder = await db.query.workOrders.findFirst({`} <br />
                        {`  where: eq(workOrders.id, params.id)`} <br />
                        {`});`}
                      </div>
                   </div>
                   <div className="border-l-2 border-dashed border-primary/20 ml-6 h-8" />
                   <div className="border border-border p-4 bg-background font-mono text-[10px] leading-tight text-muted-foreground rounded-lg shadow-sm">
                      <div className="flex items-center gap-2 text-primary mb-2">
                        <Database className="h-3 w-3" />
                        <span>PERSISTENCE_LAYER</span>
                      </div>
                      <div className="opacity-50 font-sans italic">
                        PostgreSQL (v16+) | 256-bit AES Encryption at rest
                      </div>
                   </div>
                </div>
              </div>
              
              {/* Visual Decorative Side */}
              <div className="flex-1 hidden md:flex justify-center items-center">
                <div className="relative">
                   <div className="w-64 h-64 border-2 border-primary/20 rounded-full animate-spin-slow flex items-center justify-center">
                      <div className="w-48 h-48 border-4 border-dashed border-primary/10 rounded-full animate-reverse-spin flex items-center justify-center" />
                   </div>
                   <Cpu className="absolute inset-0 m-auto h-12 w-12 text-primary opacity-40 shadow-2xl shadow-primary/50" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stack Deep Dive */}
        <div className="mt-32 space-y-16">
          <div className="border-t border-border pt-8">
            <h2 className="text-[10px] font-black tracking-[0.4em] uppercase text-muted-foreground">
              Core Stack Specifications
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
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
          </div>
        </div>

        {/* Data Sovereignty Section */}
        <div className="mt-32 grid md:grid-cols-2 gap-12 items-center">
          <div className="bg-primary p-12 rounded-3xl text-primary-foreground space-y-8 relative overflow-hidden group">
            <div className="absolute inset-0 industrial-grid opacity-5 invert pointer-events-none" />
            <div className="relative z-10 space-y-6">
              <Lock className="h-10 w-10 opacity-60" />
              <h3 className="text-4xl font-serif font-black leading-tight">
                Absolute Data Sovereignty.
              </h3>
              <p className="text-lg opacity-80 font-light leading-relaxed">
                Unlike traditional SaaS CMMS, FixIt offers complete infrastructure choice. 
                Host on-premise, in your private cloud, or air-gapped from the internet.
              </p>
              <ul className="space-y-4 pt-4">
                <li className="flex items-center gap-3 text-xs font-mono font-bold tracking-widest uppercase">
                   <div className="w-1.5 h-1.5 bg-primary-foreground rounded-full" />
                   Zero Vendor Lock-in
                </li>
                <li className="flex items-center gap-3 text-xs font-mono font-bold tracking-widest uppercase">
                   <div className="w-1.5 h-1.5 bg-primary-foreground rounded-full" />
                   Encrypted Field Exports
                </li>
                <li className="flex items-center gap-3 text-xs font-mono font-bold tracking-widest uppercase">
                   <div className="w-1.5 h-1.5 bg-primary-foreground rounded-full" />
                   Private S3 Attachments
                </li>
              </ul>
            </div>
          </div>

          <div className="space-y-8">
            <h3 className="text-3xl font-serif font-black text-foreground">
              Built for the <br /> 
              <span className="text-muted-foreground italic font-light">Compliance-First Enterprise.</span>
            </h3>
            <p className="text-muted-foreground font-light leading-relaxed">
              We provide the blueprint, you provide the environment. FixIt's open-core model ensures that your 
              operational records—from work orders to safety certifications—are owned by you, forever.
            </p>
            <div className="pt-4">
               <Button
                asChild
                variant="outline"
                size="lg"
                className="border-border hover:bg-secondary rounded-none px-8 h-14 text-sm font-black uppercase tracking-widest"
              >
                <Link href="/docs/security">Download Security Whitepaper</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Integration Layer */}
        <div className="mt-32 border-t border-border pt-16">
          <div className="flex items-center gap-3 mb-12">
            <Network className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-serif font-black">Open Connectors (API)</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="bg-secondary p-2 rounded-lg">
                  <Monitor className="h-5 w-5 text-primary" />
                </div>
                <h4 className="font-mono text-xs font-black uppercase tracking-widest">REST API v1.0</h4>
              </div>
              <p className="text-muted-foreground text-sm font-light leading-relaxed">
                A fully documented OpenAPI specification for programmatic access to every asset, worker, 
                and maintenance log in your system.
              </p>
            </div>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="bg-secondary p-2 rounded-lg">
                  <Workflow className="h-5 w-5 text-primary" />
                </div>
                <h4 className="font-mono text-xs font-black uppercase tracking-widest">Webhooks Engine</h4>
              </div>
              <p className="text-muted-foreground text-sm font-light leading-relaxed">
                Trigger external automations (Zapier, Make, custom scripts) on critical system events: 
                Work Order Overdue, Safety Incidents, or Stock Low alerts.
              </p>
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
          <div className="flex items-center gap-12">
            <Link href="/v2" className="text-xs font-mono font-bold uppercase tracking-widest hover:text-primary transition-colors">Home</Link>
            <Link href="https://github.com/0xForelsket/fixit-app" className="text-xs font-mono font-bold uppercase tracking-widest hover:text-primary transition-colors">GitHub</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function StackCard({
  title,
  spec,
  description,
  icon: Icon,
}: { title: string; spec: string; description: string; icon: React.ElementType }) {
  return (
    <div className="bg-card border border-border p-6 rounded-xl space-y-4 group hover:border-primary/50 transition-all hover:shadow-xl hover:shadow-primary/5">
      <div className="bg-background w-10 h-10 flex items-center justify-center rounded-lg group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h3 className="font-mono text-xs font-black uppercase tracking-widest text-primary">{title}</h3>
        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-tighter opacity-60 mb-2">{spec}</p>
        <p className="text-xs text-muted-foreground font-light leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}
