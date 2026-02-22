"use client";

import { useState, useMemo } from "react";
import { useTokenPrices } from "@/hooks/useTokenPrices";
import { useGasPrice } from "@/hooks/useGasPrice";
import { Calculator, Settings2, Info, ArrowRight, Zap, AlertTriangle } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from "recharts";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// Fixed DEX fees for simulation
const DEX_FEES = {
    "Uniswap V3": 0.0005,
    "Sushiswap": 0.003,
    "Curve": 0.0004
};

export function GasAwareArbSimulator() {
    const { data: priceData, isLoading: pricesLoading } = useTokenPrices();
    const { gasData, isLoading: gasLoading } = useGasPrice();

    // Inputs
    const [selectedPair, setSelectedPair] = useState("WETH/USDC");
    const [tradeSize, setTradeSize] = useState<number>(10);
    const [buyDex, setBuyDex] = useState("Curve");
    const [sellDex, setSellDex] = useState("Uniswap V3");
    const [gasPreset, setGasPreset] = useState<"cheap" | "normal" | "fast">("fast");
    const [complexity, setComplexity] = useState<"simple" | "complex">("complex");

    const activePair = useMemo(() => priceData.find(p => p.pair === selectedPair), [priceData, selectedPair]);

    // Math Simulation
    const metrics = useMemo(() => {
        if (!activePair || !gasData) return null;

        const buyQuote = activePair.quotes.find(q => q.dex === buyDex) || activePair.quotes[0];
        const sellQuote = activePair.quotes.find(q => q.dex === sellDex) || activePair.quotes[1];

        // 1. Raw Spread
        const rawSpreadItem = sellQuote.price - buyQuote.price;
        const rawSpreadTotal = rawSpreadItem * tradeSize;
        const rawSpreadPct = (rawSpreadItem / buyQuote.price) * 100;

        // 2. DEX Fees (Quote Token)
        const buyFeePct = DEX_FEES[buyDex as keyof typeof DEX_FEES] || 0.003;
        const sellFeePct = DEX_FEES[sellDex as keyof typeof DEX_FEES] || 0.003;
        const dexFeesTotal = (buyFeePct * buyQuote.price * tradeSize) + (sellFeePct * sellQuote.price * tradeSize);

        // 3. Liquidity/Slippage Impact (Simulated model: 0.1% slip per $100k equivalent)
        const notionalValue = tradeSize * buyQuote.price;
        const slipBasis = notionalValue / 100000;
        const slippagePct = Math.min(slipBasis * 0.001, 0.05); // Cap at 5%
        const slippageTotal = slippagePct * notionalValue * 2; // Hit slip on both sides

        // 4. Gas Cost
        // simple = 300k gas, complex (flash loan) = 750k gas
        const gasLimit = complexity === "simple" ? 300000 : 750000;
        const gasPriceGwei = gasData.baseFee + gasData.priorityFee[gasPreset];
        const gasCostEth = (gasPriceGwei * gasLimit) / 1e9;
        const gasCostQuote = gasCostEth * gasData.usdPrice; // Approximation mapping ETH to Quote if Quote is stable

        // 5. Net Profit
        const netProfit = rawSpreadTotal - dexFeesTotal - slippageTotal - gasCostQuote;
        const roi = (netProfit / notionalValue) * 100;

        return {
            buyPrice: buyQuote.price,
            sellPrice: sellQuote.price,
            rawSpreadTotal,
            rawSpreadPct,
            dexFeesTotal,
            slippageTotal,
            gasCostEth,
            gasCostQuote,
            netProfit,
            roi,
            notionalValue
        };
    }, [activePair, gasData, tradeSize, buyDex, sellDex, gasPreset, complexity]);

    if (pricesLoading || gasLoading || !metrics) {
        return (
            <div className="flex items-center justify-center p-12 border border-border bg-card/30 rounded-lg animate-pulse">
                <Calculator className="w-6 h-6 text-primary animate-spin mr-3" />
                <span className="font-mono text-muted-foreground">Loading Arbitrage Engine...</span>
            </div>
        );
    }

    // Recharts Donut data (where does the spread go?)
    const chartData = [
        { name: "Net Profit", value: Math.max(0, metrics.netProfit) },
        { name: "Gas Costs", value: metrics.gasCostQuote },
        { name: "DEX Fees", value: metrics.dexFeesTotal },
        { name: "Slippage", value: metrics.slippageTotal },
    ];

    const COLORS = ["#22c55e", "#ef4444", "#f59e0b", "#6366f1"];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* LEFT COLUMN: Controls */}
            <div className="space-y-6">
                <div className="p-5 rounded-lg border border-border bg-card shadow-sm space-y-5">
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border">
                        <Settings2 className="w-4 h-4 text-primary" />
                        <h3 className="font-mono font-bold uppercase tracking-wider text-sm">Reality Controls</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-mono text-muted-foreground uppercase">Token Pair</label>
                            <select
                                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm font-mono focus:ring-1 focus:ring-primary outline-none"
                                value={selectedPair}
                                onChange={(e) => setSelectedPair(e.target.value)}
                            >
                                {priceData.map(p => <option key={p.pair} value={p.pair}>{p.pair}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-mono text-muted-foreground uppercase">Trade Size ({activePair?.baseToken})</label>
                            <input
                                type="number"
                                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm font-mono focus:ring-1 focus:ring-primary outline-none"
                                value={tradeSize}
                                onChange={(e) => setTradeSize(Number(e.target.value) || 0)}
                                min="0.1"
                                step="1"
                            />
                        </div>
                    </div>

                    <div className="space-y-3 p-3 bg-white/5 rounded-md border border-border/50">
                        <div className="flex items-center gap-2 justify-between">
                            <div className="space-y-1 w-[45%]">
                                <label className="text-xs font-mono text-muted-foreground uppercase flex justify-between">
                                    <span>Buy On</span>
                                    <span className="text-foreground">${metrics.buyPrice.toFixed(1)}</span>
                                </label>
                                <select
                                    className="w-full bg-background border border-border rounded-md px-2 py-1.5 text-xs font-mono"
                                    value={buyDex}
                                    onChange={(e) => setBuyDex(e.target.value)}
                                >
                                    {activePair?.quotes.map(q => <option key={q.dex} value={q.dex}>{q.dex} (Fee: {q.feeTier})</option>)}
                                </select>
                            </div>

                            <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 mt-3" />

                            <div className="space-y-1 w-[45%]">
                                <label className="text-xs font-mono text-muted-foreground uppercase flex justify-between">
                                    <span>Sell On</span>
                                    <span className="text-foreground">${metrics.sellPrice.toFixed(1)}</span>
                                </label>
                                <select
                                    className="w-full bg-background border border-border rounded-md px-2 py-1.5 text-xs font-mono"
                                    value={sellDex}
                                    onChange={(e) => setSellDex(e.target.value)}
                                >
                                    {activePair?.quotes.map(q => <option key={q.dex} value={q.dex}>{q.dex} (Fee: {q.feeTier})</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-mono text-muted-foreground uppercase">Gas Preset</label>
                            <select
                                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm font-mono"
                                value={gasPreset}
                                onChange={(e) => setGasPreset(e.target.value as any)}
                            >
                                <option value="cheap">Cheap (Base + {gasData?.priorityFee.cheap}gwei)</option>
                                <option value="normal">Normal (Base + {gasData?.priorityFee.normal}gwei)</option>
                                <option value="fast">Fast / MEV (Base + {gasData?.priorityFee.fast}gwei)</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-mono text-muted-foreground uppercase">Complexity (Gas)</label>
                            <select
                                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm font-mono"
                                value={complexity}
                                onChange={(e) => setComplexity(e.target.value as any)}
                            >
                                <option value="simple">Direct Swap (300k gas)</option>
                                <option value="complex">Flash Loan (750k gas)</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-400 font-mono text-xs flex gap-3">
                    <Info className="w-4 h-4 shrink-0 mt-0.5" />
                    <p>
                        <strong>MEV Note:</strong> Even if Net Profit is strictly positive, professional MEV searchers running optimized Rust bots directly connected to Flashbots relays will likely see your transaction in the public mempool, copy it, bid up the priority fee, and steal the arbitrage before your block lands.
                    </p>
                </div>
            </div>

            {/* RIGHT COLUMN: Output Visualizer */}
            <div className="space-y-6 flex flex-col">
                <div className="grid grid-cols-2 gap-4">
                    <div className={cn(
                        "p-5 rounded-lg border flex flex-col justify-center items-center text-center",
                        metrics.netProfit > 0
                            ? "bg-green-500/10 border-green-500/30 text-green-400"
                            : "bg-red-500/10 border-red-500/30 text-red-500"
                    )}>
                        <div className="text-xs font-mono uppercase tracking-wider mb-2 opacity-80">Final Net Profit</div>
                        <div className="text-3xl font-mono font-bold truncate w-full px-2">
                            {metrics.netProfit > 0 ? "+" : ""}${metrics.netProfit.toFixed(2)}
                        </div>
                        <div className="mt-1 text-xs font-mono opacity-80">ROI: {metrics.roi.toFixed(3)}%</div>
                    </div>

                    <div className="p-5 rounded-lg border border-border bg-card flex flex-col justify-center items-center text-center">
                        <div className="text-xs font-mono uppercase tracking-wider mb-2 text-muted-foreground">Breakdown Engine</div>
                        <div className="text-2xl font-mono text-foreground">${metrics.rawSpreadTotal.toFixed(2)}</div>
                        <div className="text-[10px] text-muted-foreground mt-1 uppercase">Theoretical Gross PnL</div>
                    </div>
                </div>

                <div className="p-5 rounded-lg border border-border bg-card flex-1 flex flex-col">
                    <h3 className="font-mono font-bold uppercase tracking-wider text-sm mb-4 border-b border-border pb-2 text-muted-foreground">
                        Where does the spread go?
                    </h3>

                    <div className="flex-1 flex flex-col md:flex-row gap-6 items-center">
                        {/* Waterfall text breakdown */}
                        <div className="w-full md:w-1/2 space-y-3 font-mono text-sm">
                            <div className="flex justify-between items-center text-foreground">
                                <span>Raw Spread</span>
                                <span>+${metrics.rawSpreadTotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-orange-400">
                                <span>DEX Fees</span>
                                <span>-${metrics.dexFeesTotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-indigo-400">
                                <span>Slippage Impact</span>
                                <span>-${metrics.slippageTotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-red-400">
                                <span className="flex items-center gap-1 group cursor-help relative">
                                    Network Gas
                                    <Info className="w-3 h-3 text-muted-foreground" />
                                    <div className="absolute left-0 bottom-full mb-1 w-48 p-2 bg-popover text-xs border border-border rounded text-popover-foreground hidden group-hover:block z-50">
                                        {gasData?.baseFee.toFixed(1)} Base + {gasData?.priorityFee[gasPreset]} Priority
                                    </div>
                                </span>
                                <span>-${metrics.gasCostQuote.toFixed(2)}</span>
                            </div>
                            <div className="h-px w-full bg-border my-2"></div>
                            <div className={cn(
                                "flex justify-between items-center font-bold",
                                metrics.netProfit > 0 ? "text-green-400" : "text-red-500"
                            )}>
                                <span>Net Outcome</span>
                                <span>{metrics.netProfit > 0 ? "+" : ""}${metrics.netProfit.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Donut Chart */}
                        <div className="w-full md:w-1/2 h-48 relative">
                            {metrics.rawSpreadTotal <= 0 ? (
                                <div className="absolute inset-0 flex items-center justify-center text-sm font-mono text-red-400 border border-red-500/20 bg-red-500/5 rounded-full p-4 text-center">
                                    Negative spread.<br />Arbitrage impossible.
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={chartData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={70}
                                            paddingAngle={2}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip
                                            formatter={(value: number | undefined, name: string | undefined) => [
                                                `$${(value || 0).toFixed(2)}`,
                                                name || ""
                                            ]}
                                            contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)', fontFamily: 'monospace' }}
                                            itemStyle={{ color: 'var(--foreground)' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    {metrics.netProfit > 0 && metrics.netProfit < 50 && (
                        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded flex items-start gap-2 text-xs font-mono text-red-400">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            <p>Warning: Positive PnL is extremely thin. High failure risk if gas base fee spikes in the next block. MEV bots will outbid you.</p>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}
