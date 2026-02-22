"use client";

import { useTokenPrices, TokenPairData } from "@/hooks/useTokenPrices";
import { ArrowRight, RefreshCw, Activity, Layers } from "lucide-react";
import { useState, useMemo } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function PriceMonitor() {
    const { data, isLoading } = useTokenPrices();
    const [selectedPair, setSelectedPair] = useState<string>("WETH/USDC");

    const activeData = useMemo(() => {
        return data.find(p => p.pair === selectedPair) || data[0];
    }, [data, selectedPair]);

    if (isLoading || !data.length) {
        return (
            <div className="flex items-center justify-center p-12 border border-border bg-card/30 rounded-lg animate-pulse">
                <RefreshCw className="w-6 h-6 text-primary animate-spin mr-3" />
                <span className="font-mono text-muted-foreground">Initializing market data streams...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex gap-2">
                    {data.map((pair) => (
                        <button
                            key={pair.pair}
                            onClick={() => setSelectedPair(pair.pair)}
                            className={cn(
                                "px-4 py-2 text-sm font-mono rounded-md border transition-colors",
                                selectedPair === pair.pair
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "border-border bg-card text-muted-foreground hover:bg-white/5"
                            )}
                        >
                            {pair.pair}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground bg-card px-3 py-1.5 rounded-full border border-border">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    Live via DeFiLlama (10s)
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg border border-border bg-card">
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1 font-mono flex items-center gap-2">
                        <Activity className="w-3 h-3" /> Best BBO
                    </div>
                    <div className="text-2xl font-mono text-primary">
                        ${activeData.bestPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                </div>
                <div className="p-4 rounded-lg border border-border bg-card">
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1 font-mono flex items-center gap-2">
                        <Activity className="w-3 h-3 text-red-500" /> Worst BBO
                    </div>
                    <div className="text-2xl font-mono text-red-400">
                        ${activeData.worstPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                </div>
                <div className={cn(
                    "p-4 rounded-lg border font-mono",
                    activeData.maxSpreadPct > 0.3 ? "border-orange-500/50 bg-orange-500/10" : "border-border bg-card"
                )}>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1 flex justify-between items-center">
                        <span>Raw Spread (Max)</span>
                        {activeData.maxSpreadPct > 0.3 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 font-sans">Arbitrage signal</span>
                        )}
                    </div>
                    <div className={cn(
                        "text-2xl",
                        activeData.maxSpreadPct > 0.3 ? "text-orange-400" : "text-foreground"
                    )}>
                        {activeData.maxSpreadPct.toFixed(3)}%
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1 font-sans italic opacity-70">
                        *Theoretical only &ndash; ignores gas, slippage, MEV
                    </p>
                </div>
            </div>

            <div className="rounded-lg border border-border bg-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm font-mono text-left whitespace-nowrap">
                        <thead className="bg-white/5 text-muted-foreground text-xs uppercase">
                            <tr>
                                <th className="px-6 py-4 font-medium">DEX</th>
                                <th className="px-6 py-4 font-medium">Price (Executable)</th>
                                <th className="px-6 py-4 font-medium">Liquidity Depth</th>
                                <th className="px-6 py-4 font-medium">24h Volume</th>
                                <th className="px-6 py-4 font-medium">Fee Tier</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {activeData.quotes.sort((a, b) => b.price - a.price).map((quote, idx) => (
                                <tr key={quote.dex} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="px-6 py-4 flex items-center gap-2">
                                        <Layers className="w-4 h-4 text-muted-foreground" />
                                        {quote.dex}
                                        {idx === 0 && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary border border-primary/20">Best</span>}
                                    </td>
                                    <td className={cn(
                                        "px-6 py-4 tabular-nums",
                                        idx === 0 ? "text-primary font-bold" : "text-foreground/80"
                                    )}>
                                        ${quote.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-6 py-4 text-foreground/70">{quote.liquidity}</td>
                                    <td className="px-6 py-4 text-foreground/70">{quote.volume24h}</td>
                                    <td className="px-6 py-4 text-foreground/50">{quote.feeTier}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
