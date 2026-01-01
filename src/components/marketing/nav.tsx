"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Github, Menu, Wrench, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

const navLinks = [
  { href: "/features", label: "Features", mobile: true },
  { href: "/compare", label: "Compare", mobile: true },
  { href: "/pricing", label: "Pricing", mobile: true },
  { href: "/deploy", label: "Deploy", mobile: true },
  { href: "/enterprise", label: "Enterprise", mobile: true },
  { href: "/architecture", label: "Architecture", mobile: false },
];

export function MarketingNav() {
  const [isOpen, setIsOpen] = React.useState(false);
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/70 backdrop-blur-md">
      <div className="flex items-center justify-between px-6 py-4 md:px-12 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="flex items-center gap-2 group"
            aria-label="FixIt Home"
          >
            <div className="bg-primary p-1.5 rounded-md group-hover:opacity-90 transition-opacity">
              <Wrench className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-black tracking-tighter font-mono uppercase">
              FixIt<span className="text-muted-foreground">.io</span>
            </span>
          </Link>
        </div>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-6 text-sm">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "font-mono text-xs uppercase tracking-widest transition-colors hover:text-primary",
                pathname === link.href
                  ? "text-primary underline underline-offset-4"
                  : "text-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
          <div className="h-4 w-[1px] bg-border mx-2" />
          <Link
            href="/login"
            className="font-mono text-xs uppercase tracking-widest hover:text-primary transition-colors"
          >
            Demo
          </Link>
          <Button
            asChild
            size="sm"
            className="bg-primary text-primary-foreground hover:opacity-90 rounded-md px-5 h-9 font-bold text-xs uppercase tracking-wider"
          >
            <Link
              href="https://github.com/0xForelsket/fixit-app"
              aria-label="Star on GitHub"
            >
              <Github className="mr-2 h-4 w-4" /> STAR
            </Link>
          </Button>
        </div>

        {/* Mobile Toggle */}
        <div className="lg:hidden flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? "Close menu" : "Open menu"}
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-b border-border bg-background overflow-hidden"
          >
            <div className="flex flex-col p-6 gap-6">
              {navLinks
                .filter((l) => l.mobile)
                .map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "font-mono text-lg uppercase tracking-widest transition-colors flex justify-between items-center group",
                      pathname === link.href
                        ? "text-primary"
                        : "text-foreground"
                    )}
                  >
                    {link.label}
                    <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                ))}
              <hr className="border-border" />
              <Link
                href="/login"
                className="font-mono text-lg uppercase tracking-widest text-foreground"
              >
                Demo Portal
              </Link>
              <Button
                asChild
                className="w-full h-14 rounded-none font-black uppercase tracking-widest text-xs"
              >
                <Link href="https://github.com/0xForelsket/fixit-app">
                  Initialize Protocol
                </Link>
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
