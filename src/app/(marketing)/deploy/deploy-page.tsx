"use client";

import { motion } from "framer-motion";
import { 
  Box, 
  Terminal, 
  Copy, 
  Check, 
  Server, 
  Zap, 
  Database, 
  ShieldCheck,
  Cloud,
  ArrowRight,
  Globe
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const deployMethods = [
  {
    id: "docker",
    name: "Docker Compose",
    icon: Box,
    description: "Recommended for most self-hosted production environments.",
    command: "git clone https://github.com/0xForelsket/fixit-app.git\ncd fixit-app\ndocker compose up -d",
    recommended: true
  },
  {
    id: "vercel",
    name: "Vercel",
    icon: Zap,
    description: "One-click deployment with integrated CI/CD and edge optimization.",
    link: "https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2F0xForelsket%2Ffixit-app",
    color: "bg-black text-white"
  },
  {
    id: "railway",
    name: "Railway",
    icon: Server,
    description: "Deploy in seconds with managed PostgreSQL and internal networking.",
    link: "https://railway.app/new/template?template=https%3A%2F%2Fgithub.com%2F0xForelsket%2Ffixit-app",
    color: "bg-[#a855f7] text-white"
  }
];

const envVars = [
  { key: "DATABASE_URL", description: "PostgreSQL connection string.", required: true },
  { key: "AUTH_SECRET", description: "Secret for Auth.js session encryption.", required: true },
  { key: "NEXT_PUBLIC_APP_URL", description: "The public URL of your instance.", required: true },
  { key: "S3_UPLOAD_BUCKET", description: "Bucket name for asset storage.", required: false },
];

export default function DeployPage() {
  const [copied, setCopied] = useState<string | null>(null);

  const copyCommand = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

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
            <h1 className="text-5xl md:text-8xl font-serif font-black tracking-tight leading-[0.9]">
              INITIALIZE <br />
              <span className="text-muted-foreground italic font-light font-sans">deployment.</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl font-light leading-relaxed">
              FixIt is infrastructure-agnostic. Deploy on-premise for total privacy, or in the cloud for global availability.
            </p>
          </motion.div>
        </header>

        {/* Methods Grid */}
        <section className="grid lg:grid-cols-3 gap-8 mb-48">
          {deployMethods.map((method) => (
            <motion.div
              key={method.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className={`p-8 rounded-3xl border ${method.recommended ? 'border-primary ring-1 ring-primary' : 'border-border'} bg-card flex flex-col justify-between`}
            >
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className={`p-3 rounded-xl ${method.recommended ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
                    <method.icon className="h-6 w-6" />
                  </div>
                  {method.recommended && (
                    <span className="text-[8px] font-mono font-black uppercase tracking-[0.2em] bg-primary text-primary-foreground px-2 py-1 rounded">Recommended</span>
                  )}
                </div>
                <h2 className="text-2xl font-black font-mono tracking-tighter uppercase mb-2">{method.name}</h2>
                <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
                  {method.description}
                </p>
                
                {method.command ? (
                  <div className="relative group">
                    <pre className="bg-secondary/50 p-4 pt-10 rounded-xl font-mono text-[10px] break-all whitespace-pre-wrap border border-border">
                      {method.command}
                    </pre>
                    <div className="absolute top-2 left-4 text-[8px] font-mono uppercase font-bold text-muted-foreground/50">Terminal</div>
                    <button 
                      onClick={() => copyCommand(method.id, method.command!)}
                      className="absolute top-2 right-2 p-2 hover:bg-background rounded-lg transition-colors"
                    >
                      {copied === method.id ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </div>
                ) : (
                  <Button asChild className={`w-full h-12 rounded-xl group font-black uppercase tracking-widest text-[10px] ${method.color}`}>
                    <Link href={method.link!}>
                      Launch {method.name} <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                )}
              </div>
            </motion.div>
          ))}
        </section>

        {/* Technical Registry */}
        <section className="mb-48 grid lg:grid-cols-2 gap-16">
          <div className="space-y-8">
            <h2 className="text-3xl font-serif font-black tracking-tight">Environment Variables</h2>
            <p className="text-muted-foreground font-light">Configure your instance using standard key-value pairs. All sensitive data is encrypted at the protocol layer.</p>
            <div className="space-y-4">
              {envVars.map((v) => (
                <div key={v.key} className="p-4 border border-border rounded-xl hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <code className="text-[10px] font-black font-mono text-primary">{v.key}</code>
                    {v.required && <span className="text-[8px] font-mono bg-rose-500/10 text-rose-500 px-1 py-0.5 rounded">REQUIRED</span>}
                  </div>
                  <p className="text-[10px] font-mono text-muted-foreground uppercase">{v.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-8">
            <h2 className="text-3xl font-serif font-black tracking-tight">Operational Checklist</h2>
            <div className="bg-card border border-border rounded-3xl p-8 space-y-6">
              {[
                { title: "Database Provisioning", icon: Database, detail: "Ensure PostgreSQL 15+ is reachable" },
                { title: "Storage Configuration", icon: Cloud, detail: "S3-compatible bucket or local disk" },
                { title: "Network Privacy", icon: ShieldCheck, detail: "Configure SSL and CORS headers" },
                { title: "Global CDN", icon: Globe, detail: "Optional: Set up edge caching for assets" }
              ].map((step, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className="bg-secondary p-2 rounded-lg">
                    <step.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-tight">{step.title}</h3>
                    <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">{step.detail}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-6 bg-secondary/50 border border-border rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Terminal className="h-5 w-5 text-muted-foreground" />
                <span className="text-xs font-mono font-bold uppercase tracking-widest">Technical Wiki</span>
              </div>
              <Button variant="outline" size="sm" className="rounded-none uppercase font-black text-[10px] tracking-widest">
                Access Docs
              </Button>
            </div>
          </div>
        </section>

        <section className="py-24 border-t border-border text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="inline-block p-4 bg-emerald-500/10 rounded-full mb-4">
              <ShieldCheck className="h-8 w-8 text-emerald-500" />
            </div>
            <h2 className="text-4xl font-serif font-black tracking-tight">Data Sovereignty Guaranteed.</h2>
            <p className="text-muted-foreground leading-relaxed">FixIt is built on the principle that your operational data belongs to you. No shadows, no telemetry, no backdoors. Just pure maintenance engineering.</p>
            <Button size="lg" className="h-16 px-12 rounded-none font-black uppercase tracking-widest text-xs group">
              Start Your First Build <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </section>
      </main>
    </>
  );
}
