"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  CircleDollarSign,
  Minus,
  TrendingUp,
  Users,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import { useState } from "react";

const comparisonData = [
  {
    item: "Self-Hosted Option",
    fixit: "yes",
    upkeep: "no",
    fiix: "no",
    limble: "no",
    maintainx: "no",
  },
  {
    item: "Open Source",
    fixit: "yes",
    upkeep: "no",
    fiix: "no",
    limble: "no",
    maintainx: "no",
  },
  {
    item: "No Per-User Pricing",
    fixit: "yes",
    upkeep: "no",
    fiix: "no",
    limble: "no",
    maintainx: "no",
  },
  {
    item: "Unlimited Users",
    fixit: "yes",
    upkeep: "cost",
    fiix: "cost",
    limble: "cost",
    maintainx: "cost",
  },
  {
    item: "Total Data Sovereignty",
    fixit: "yes",
    upkeep: "no",
    fiix: "no",
    limble: "no",
    maintainx: "no",
  },
  {
    item: "Data Export (Full)",
    fixit: "yes",
    upkeep: "limited",
    fiix: "limited",
    limble: "limited",
    maintainx: "limited",
  },
  {
    item: "Modern Next.js Stack",
    fixit: "yes",
    upkeep: "no",
    fiix: "no",
    limble: "no",
    maintainx: "no",
  },
  {
    item: "API Access",
    fixit: "yes",
    upkeep: "cost",
    fiix: "cost",
    limble: "yes",
    maintainx: "cost",
  },
  {
    item: "Offline Mode",
    fixit: "soon",
    upkeep: "limited",
    fiix: "no",
    limble: "limited",
    maintainx: "yes",
  },
];

function StatusIcon({ status }: { status: string }) {
  if (status === "yes")
    return <Check className="h-5 w-5 text-emerald-500 mx-auto" />;
  if (status === "no")
    return <X className="h-5 w-5 text-rose-500/30 mx-auto" />;
  if (status === "cost")
    return <CircleDollarSign className="h-5 w-5 text-amber-500 mx-auto" />;
  if (status === "limited")
    return <Minus className="h-5 w-5 text-muted-foreground mx-auto" />;
  if (status === "soon")
    return (
      <span className="text-[8px] font-mono font-bold text-primary-500 bg-primary-500/10 px-1 py-0.5 rounded">
        SOON
      </span>
    );
  return null;
}

export default function ComparePage() {
  const [users, setUsers] = useState(25);
  const avgCostPerUser = 45; // Average monthly cost from competitors

  const annualSavings = users * avgCostPerUser * 12;

  return (
    <>
      <main className="max-w-7xl mx-auto px-6 md:px-12 py-20 lg:py-32">
        <header className="mb-24 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            <h1 className="text-5xl md:text-8xl font-serif font-black tracking-tight leading-[0.9]">
              FIXIT VS. <br />
              <span className="text-muted-foreground italic font-light font-sans">
                The Old Guard.
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-light">
              SaaS CMMS platforms thrive on vendor lock-in and per-user taxes.
              We're building the first modern, open-source alternative.
            </p>
          </motion.div>
        </header>

        {/* Comparison Table */}
        <section className="mb-48 overflow-x-auto">
          <div className="min-w-[800px]">
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-4 mb-8 text-center items-end border-b border-border pb-8">
              <div className="text-left font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Protocol Feature
              </div>
              <div className="space-y-2">
                <div className="bg-primary p-2 rounded-lg w-fit mx-auto mb-2">
                  <Wrench className="h-5 w-5 text-primary-foreground" />
                </div>
                <div className="font-black text-xs uppercase tracking-widest">
                  FixIt
                </div>
              </div>
              <div className="space-y-2 text-muted-foreground">
                <div className="font-bold text-[10px] uppercase tracking-widest">
                  UpKeep
                </div>
              </div>
              <div className="space-y-2 text-muted-foreground">
                <div className="font-bold text-[10px] uppercase tracking-widest">
                  Fiix
                </div>
              </div>
              <div className="space-y-2 text-muted-foreground">
                <div className="font-bold text-[10px] uppercase tracking-widest">
                  Limble
                </div>
              </div>
              <div className="space-y-2 text-muted-foreground">
                <div className="font-bold text-[10px] uppercase tracking-widest">
                  MaintainX
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {comparisonData.map((row) => (
                <div
                  key={row.item}
                  className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-4 py-4 border-b border-border/50 hover:bg-muted/30 transition-colors items-center text-center"
                >
                  <div className="text-left text-sm font-bold uppercase tracking-tight">
                    {row.item}
                  </div>
                  <div className="bg-primary/5 rounded py-2">
                    <StatusIcon status={row.fixit} />
                  </div>
                  <div>
                    <StatusIcon status={row.upkeep} />
                  </div>
                  <div>
                    <StatusIcon status={row.fiix} />
                  </div>
                  <div>
                    <StatusIcon status={row.limble} />
                  </div>
                  <div>
                    <StatusIcon status={row.maintainx} />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-4 text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Check className="h-3 w-3 text-emerald-500" /> Included
              </div>
              <div className="flex items-center gap-1.5">
                <CircleDollarSign className="h-3 w-3 text-amber-500" /> Paid
                Add-on
              </div>
              <div className="flex items-center gap-1.5">
                <Minus className="h-3 w-3" /> Limited
              </div>
              <div className="flex items-center gap-1.5">
                <X className="h-3 w-3 text-rose-500" /> Not Available
              </div>
            </div>
          </div>
        </section>

        {/* Savings Calculator */}
        <section className="mb-48 grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 bg-secondary border border-border px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground">
              Economic Model
            </div>
            <h2 className="text-4xl md:text-6xl font-serif font-black tracking-tight leading-none">
              STOP THE <br />
              <span className="text-primary italic font-light font-sans">
                PER-USER TAX.
              </span>
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Traditional CMMS vendors charge more as your team grows. FixIt is
              open source. Whether you have 10 technicians or 1,000, your
              software cost remains $0.
            </p>
            <div className="grid grid-cols-2 gap-6 pt-4">
              <div className="p-6 bg-card border border-border rounded-xl">
                <Users className="h-5 w-5 text-primary mb-3" />
                <h3 className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground mb-1">
                  Your Team Size
                </h3>
                <input
                  type="range"
                  min="5"
                  max="500"
                  step="5"
                  value={users}
                  onChange={(e) => setUsers(Number.parseInt(e.target.value))}
                  className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="mt-2 text-2xl font-black font-mono">
                  {users} Users
                </div>
              </div>
              <div className="p-6 bg-primary text-primary-foreground rounded-xl relative overflow-hidden shadow-2xl shadow-primary/20">
                <TrendingUp className="h-5 w-5 mb-3 opacity-60" />
                <h3 className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-60 mb-1">
                  Annual Savings
                </h3>
                <div className="text-3xl font-black font-mono tabular-nums leading-none">
                  ${annualSavings.toLocaleString()}
                </div>
                <div className="text-[8px] uppercase tracking-widest opacity-50 mt-2">
                  *Based on $45/mo avg industry rate
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-3xl p-8 relative overflow-hidden">
            <div className="absolute inset-0 industrial-grid opacity-5" />
            <h3 className="text-xl font-bold uppercase tracking-tight mb-8">
              What could you do with that surplus?
            </h3>
            <div className="space-y-6">
              {[
                { label: "Hire modern maintenance leads", value: "2 FTEs" },
                { label: "Predictive sensor retrofitting", value: "50 Units" },
                { label: "Critical spare parts cache", value: "Full Stack" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex justify-between items-center py-4 border-b border-border last:border-0 hover:translate-x-1 transition-transform cursor-default"
                >
                  <span className="text-sm font-mono font-bold uppercase tracking-widest text-muted-foreground">
                    {item.label}
                  </span>
                  <span className="text-sm font-black text-primary">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-12">
              <Button className="w-full h-14 rounded-none font-black uppercase tracking-widest text-xs group">
                Reclaim Your Budget{" "}
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </div>
        </section>

        {/* Migration Guide CTA */}
        <section className="py-24 border-y border-border">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <Zap className="h-10 w-10 text-primary mx-auto" />
            <h2 className="text-3xl font-serif font-black tracking-tight">
              Ready to migrate?
            </h2>
            <p className="text-muted-foreground">
              We've built specialized tools to import your legacy data from
              UpKeep, Fiix, and MaintainX in minutes. Don't let your history
              hold you hostage.
            </p>
            <div className="flex justify-center gap-4">
              <Button
                size="lg"
                variant="outline"
                className="rounded-none uppercase font-black tracking-tighter text-xs h-12"
              >
                Migration Guide
              </Button>
              <Button
                size="lg"
                className="rounded-none uppercase font-black tracking-tighter text-xs h-12"
              >
                Talk to an Expert
              </Button>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
