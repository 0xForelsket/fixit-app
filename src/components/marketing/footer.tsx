"use client";

import Link from "next/link";
import { Wrench } from "lucide-react";

export function MarketingFooter() {
  return (
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
            <ul className="space-y-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              <li>
                <Link href="https://github.com/0xForelsket/fixit-app" className="hover:text-primary transition-colors">
                  GitHub
                </Link>
              </li>
              <li>
                <Link href="/features" className="hover:text-primary transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/deploy" className="hover:text-primary transition-colors">
                  Deployment
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-6">
            <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">
              Organization
            </h4>
            <ul className="space-y-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              <li>
                <Link href="/enterprise" className="hover:text-primary transition-colors">
                  Enterprise
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-primary transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/compare" className="hover:text-primary transition-colors">
                  Comparison
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-border flex flex-col md:flex-row justify-between gap-4">
        <p className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest">
          © 2026 FIXIT OPS INC. ALL RIGHTS RESERVED.
        </p>
        <p className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest">
          STABLE_BUILD_HASH: 0XF9E2A
        </p>
      </div>
    </footer>
  );
}
