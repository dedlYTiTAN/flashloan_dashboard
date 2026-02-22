"use client";

import { Terminal } from "lucide-react";
import { WalletConnector } from "@/components/WalletConnector";
import { PriceMonitor } from "@/components/PriceMonitor";
import { GasAwareArbSimulator } from "@/components/GasAwareArbSimulator";
import { FlashLoanTheory } from "@/components/education/FlashLoanTheory";
import { MEVEducation } from "@/components/education/MEVEducation";
import { LiquidationsEducation } from "@/components/education/LiquidationsEducation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useState } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const NAV_ITEMS = [
  { id: "price-monitor", label: "1. Price Monitor" },
  { id: "arb-simulator", label: "2. Gas & Arb Simulator" },
  { id: "flash-loans", label: "3. Flash Loan Mechanics" },
  { id: "mev", label: "4. MEV & Flashbots" },
  { id: "liquidations", label: "5. Liquidations" },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState("price-monitor");

  const scrollToSection = (id: string) => {
    setActiveTab(id);
    const element = document.getElementById(id);
    if (element) {
      // Find the scrollable container (the div around main content)
      const container = document.getElementById("scrollable-container");
      if (container) {
        // Calculate relative position based on container scroll
        const elementRect = element.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const scrollTop = elementRect.top - containerRect.top + container.scrollTop;

        container.scrollTo({
          top: scrollTop - 30, // 30px padding top
          behavior: 'smooth'
        });
      } else {
        // Fallback to window scroll if container isn't found
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden relative">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card/50 flex flex-col text-sm absolute md:relative z-20 h-full hidden md:flex shrink-0">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <Terminal className="w-5 h-5 text-primary" />
          <span className="font-mono font-bold tracking-tight text-primary">DeFi Research Lab</span>
        </div>

        <nav className="flex-1 p-4 flex flex-col gap-2 font-mono text-muted-foreground">
          <div className="text-xs uppercase tracking-wider mb-2 font-semibold text-foreground/50">Modules</div>

          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded w-full text-left transition-colors",
                activeTab === item.id
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-white/5"
              )}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top Navbar */}
        <header className="h-14 border-b border-border bg-background/80 backdrop-blur shrink-0 flex items-center justify-between px-6 z-10 font-mono text-sm">
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Ethereum Mainnet (Read-Only)
            </div>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <WalletConnector />
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8" id="scrollable-container">
          <div className="max-w-5xl mx-auto space-y-8">
            <section id="price-monitor">
              <div className="mb-4">
                <h1 className="text-2xl font-mono font-bold">Price Monitor</h1>
                <p className="text-sm text-muted-foreground font-mono mt-1">Cross-DEX liquidity and raw spread tracker. No execution capability.</p>
              </div>
              <PriceMonitor />
            </section>

            <div className="h-px bg-border/50 my-10" />

            <section id="arb-simulator">
              <div className="mb-4">
                <h1 className="text-2xl font-mono font-bold">Gas-Aware Arbitrage Simulator</h1>
                <p className="text-sm text-muted-foreground font-mono mt-1">Simulate trade execution accounting for DEX fees, slippage, and live network gas costs.</p>
              </div>
              <GasAwareArbSimulator />
            </section>

            <div className="h-px bg-border/50 my-10" />

            <section id="flash-loans">
              <div className="mb-4">
                <h1 className="text-2xl font-mono font-bold">Flash Loan Mechanics</h1>
                <p className="text-sm text-muted-foreground font-mono mt-1">Theoretical overview of uncollateralized atomic borrowing.</p>
              </div>
              <FlashLoanTheory />
            </section>

            <div className="h-px bg-border/50 my-10" />

            <section id="mev">
              <div className="mb-4">
                <h1 className="text-2xl font-mono font-bold">MEV & Flashbots Education</h1>
                <p className="text-sm text-muted-foreground font-mono mt-1">Understanding the dark forest of Ethereum transaction ordering.</p>
              </div>
              <MEVEducation />
            </section>

            <div className="h-px bg-border/50 my-10" />

            <section id="liquidations">
              <div className="mb-4">
                <h1 className="text-2xl font-mono font-bold">Liquidation Analytics</h1>
                <p className="text-sm text-muted-foreground font-mono mt-1">How searchers profit from under-collateralized lending positions.</p>
              </div>
              <LiquidationsEducation />
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
