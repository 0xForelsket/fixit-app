import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart3, Clock, ShieldCheck, Wrench } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function MarketingPage() {
  return (
    <div className="min-h-screen bg-[#F3F1E7] text-[#1a1a1a] font-sans selection:bg-[#d0c8b6] selection:text-black">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 md:px-12 md:py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <Wrench className="h-6 w-6" />
          <span className="text-xl font-bold tracking-tight font-serif">FIXIT</span>
        </div>
        <div className="flex items-center gap-6 text-sm font-medium">
          <Link href="#" className="hidden md:block hover:opacity-70 transition-opacity">
            Product
          </Link>
          <Link href="#" className="hidden md:block hover:opacity-70 transition-opacity">
            Solutions
          </Link>
          <Link href="#" className="hidden md:block hover:opacity-70 transition-opacity">
            Pricing
          </Link>
          <div className="h-4 w-[1px] bg-black/10 hidden md:block" />
          <Link href="http://app.localhost:3000/login" className="hover:opacity-70 transition-opacity">
            Log in
          </Link>
          <Button asChild className="bg-black text-[#F3F1E7] hover:bg-black/80 rounded-lg px-5 h-9 font-medium">
            <Link href="http://app.localhost:3000/login">Get Started</Link>
          </Button>
        </div>
      </nav>

      <main className="px-6 md:px-12 max-w-7xl mx-auto pt-16 md:pt-24 pb-20">
        {/* Hero Section */}
        <div className="grid md:grid-cols-2 gap-12 md:gap-24 items-center">
          <div className="space-y-8">
            <h1 className="text-5xl md:text-7xl font-serif font-medium leading-[1.05] tracking-tight">
              Maintenance <br />
              <span className="underline decoration-2 decoration-black/20 underline-offset-4">simplified</span> for the
              <br /> modern age.
            </h1>
            <p className="text-xl md:text-2xl text-black/70 leading-relaxed max-w-lg font-light">
              Streamline your operations with a system designed for clarity.
              FixIt brings intelligent tracking to your equipment maintenance.
            </p>
            <div className="pt-4">
               <Button asChild size="lg" className="bg-black text-[#F3F1E7] hover:bg-black/80 rounded-xl px-8 h-12 text-base font-medium group">
                <Link href="http://app.localhost:3000/login">
                  Start Managing 
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="relative mt-8 md:mt-0">
             {/* Abstract Visual / Hero Graphic */}
             <div className="aspect-[4/5] md:aspect-square bg-[#E6E4D9] rounded-[2rem] flex flex-col justify-between relative overflow-hidden group border border-black/5">
                <Image 
                    src="/hero-illustration.png" 
                    alt="Industrial Dashboard Illustration" 
                    fill 
                    className="object-cover opacity-90 mix-blend-multiply"
                    priority
                />
             </div>
          </div>
        </div>

        {/* Feature Grid - "Claude Opus" style cards */}
        <div className="mt-32 space-y-12">
             <div className="border-t border-black/10 pt-8 flex items-baseline justify-between">
                <h2 className="text-sm font-bold tracking-widest uppercase opacity-60">Features</h2>
                <Link href="#" className="hidden md:flex items-center gap-2 text-sm font-medium hover:opacity-70 transition-opacity">
                    View all capabilities <ArrowRight className="h-4 w-4" />
                </Link>
             </div>

             <div className="grid md:grid-cols-2 gap-6">
                <FeatureCard 
                    title="Asset Intelligence"
                    description="Track the complete lifecycle of your equipment with detailed history logs and real-time status updates."
                    icon={BarChart3}
                />
                 <FeatureCard 
                    title="Preventative Scheduling"
                    description="Automate your maintenance calendar. Never miss a service window with smart recurring work orders."
                    icon={Clock}
                />
             </div>
             
             <div className="bg-[#E6E4D9] rounded-[2rem] p-8 md:p-12">
                <div className="md:flex items-start justify-between gap-12">
                    <div className="space-y-6 max-w-xl">
                        <h3 className="text-3xl font-serif font-medium">Enterprise-grade Security</h3>
                        <p className="text-lg text-black/70">
                            Built with role-based access control, secure authentication, and audit trails to keep your operational data safe.
                        </p>
                        <ul className="space-y-3 pt-4">
                            <li className="flex items-center gap-3 text-sm font-medium opacity-80">
                                <ShieldCheck className="h-5 w-5" /> SOC2 Compliant Practices
                            </li>
                            <li className="flex items-center gap-3 text-sm font-medium opacity-80">
                                <ShieldCheck className="h-5 w-5" /> End-to-end Audit Logging
                            </li>
                        </ul>
                    </div>
                    <div className="mt-8 md:mt-0 flex-shrink-0">
                         <Button variant="outline" className="border-black/20 hover:bg-black/5 rounded-lg">
                            Read Security Whitepaper
                         </Button>
                    </div>
                </div>
             </div>
        </div>
      </main>

      <footer className="bg-[#E6E4D9] px-6 py-12 md:px-12 md:py-16">
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-12">
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <Wrench className="h-5 w-5 opacity-50" />
                    <span className="font-serif font-bold tracking-tight">FIXIT</span>
                </div>
                <p className="text-sm text-black/60 max-w-xs">
                    Empowering maintenance teams with simple, powerful tools.
                </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-12 md:gap-24 text-sm">
                <div className="space-y-4">
                    <h4 className="font-bold opacity-50 uppercase tracking-wider text-xs">Product</h4>
                    <ul className="space-y-3 opacity-80">
                        <li><Link href="#" className="hover:opacity-100">Features</Link></li>
                        <li><Link href="#" className="hover:opacity-100">Integrations</Link></li>
                        <li><Link href="#" className="hover:opacity-100">Pricing</Link></li>
                    </ul>
                </div>
                <div className="space-y-4">
                    <h4 className="font-bold opacity-50 uppercase tracking-wider text-xs">Company</h4>
                    <ul className="space-y-3 opacity-80">
                        <li><Link href="#" className="hover:opacity-100">About</Link></li>
                        <li><Link href="#" className="hover:opacity-100">Careers</Link></li>
                        <li><Link href="#" className="hover:opacity-100">Legal</Link></li>
                    </ul>
                </div>
            </div>
         </div>
      </footer>
    </div>
  );
}

function FeatureCard({ title, description, icon: Icon }: { title: string, description: string, icon: React.ElementType }) {
    return (
        <div className="bg-[#EAE8DE] hover:bg-[#E6E4D9] transition-colors p-8 md:p-10 rounded-[2rem] flex flex-col justify-between h-full min-h-[280px] group cursor-pointer relative overflow-hidden">
             {/* Texture Background */}
             <Image 
                src="/card-texture.png" 
                alt="Texture" 
                fill 
                className="object-cover opacity-30 mix-blend-multiply"
                sizes="(max-width: 768px) 100vw, 50vw"
             />
             
             <div className="relative z-10">
                <h3 className="text-2xl font-serif font-medium mb-3">{title}</h3>
                <p className="text-black/70 text-lg leading-relaxed">{description}</p>
             </div>
             <div className="mt-8 flex items-center gap-2 font-medium text-sm group-hover:translate-x-1 transition-transform relative z-10">
                Learn more <ArrowRight className="h-4 w-4" />
             </div>
             
             {/* Subtle icon placement */}
             <div className="absolute -bottom-4 -right-4 text-black/5 rotate-[-10deg] group-hover:scale-110 group-hover:text-black/10 transition-all duration-500 z-10">
                <Icon className="w-48 h-48" />
             </div>
        </div>
    )
}
