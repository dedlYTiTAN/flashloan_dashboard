"use client";

import { Cpu, ShieldAlert, GitMerge, AlertTriangle } from "lucide-react";

export function MEVEducation() {
    return (
        <div className="space-y-6 text-sm text-foreground/90 leading-relaxed font-sans">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 border border-orange-500/20 bg-orange-500/5 rounded-lg space-y-4">
                    <h3 className="font-mono font-bold text-lg text-orange-400 flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5" /> The MEV Invisible Hand
                    </h3>
                    <p>
                        <strong>Maximal Extractable Value (MEV)</strong> refers to the maximum value that can be extracted from block production in excess of the standard block reward and gas fees, achieved by including, excluding, or changing the order of transactions.
                    </p>
                    <p>
                        When you submit a profitable arbitrage transaction using MetaMask, it enters the public <em>mempool</em>. Sophisticated bots (Searchers) monitor this mempool constantly.
                    </p>
                    <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-md font-mono text-xs mt-4 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <p>If they spot your profitable transaction, they will dynamically simulate it, calculate the exact profit, copy your transaction data, and submit it themselves with a massive tip.</p>
                    </div>
                </div>

                <div className="p-5 border border-border bg-card rounded-lg space-y-4">
                    <h3 className="font-mono font-bold text-lg flex items-center gap-2">
                        <GitMerge className="w-5 h-5" /> Flashbots & The Supply Chain
                    </h3>
                    <p>
                        Standard mempool gas-bidding wars (PGAs) severely congested the Ethereum network. The modern solution is an off-chain auction system.
                    </p>

                    <div className="space-y-3 font-mono text-xs mt-4">
                        <div className="flex items-center gap-3 p-2 bg-background border border-border rounded">
                            <div className="w-20 font-bold text-indigo-400 text-right shrink-0">Searcher</div>
                            <div className="text-muted-foreground w-4 flex justify-center">→</div>
                            <div className="flex-1 text-foreground/80">Identifies the arbitrage and builds a "Bundle" (transactions + tip/bribe).</div>
                        </div>

                        <div className="flex items-center gap-3 p-2 bg-background border border-border rounded">
                            <div className="w-20 font-bold text-purple-400 text-right shrink-0">Builder</div>
                            <div className="text-muted-foreground w-4 flex justify-center">→</div>
                            <div className="flex-1 text-foreground/80">Aggregates searcher bundles into the most profitable full block possible.</div>
                        </div>

                        <div className="flex items-center gap-3 p-2 bg-background border border-border rounded">
                            <div className="w-20 font-bold text-blue-400 text-right shrink-0">Relay</div>
                            <div className="text-muted-foreground w-4 flex justify-center">→</div>
                            <div className="flex-1 text-foreground/80">Trusted middlemen acting as escrow; forwards blocks without revealing contents.</div>
                        </div>

                        <div className="flex items-center gap-3 p-2 bg-background border border-border rounded">
                            <div className="w-20 font-bold text-green-400 text-right shrink-0">Validator</div>
                            <div className="text-muted-foreground w-4 flex justify-center">✓</div>
                            <div className="flex-1 text-foreground/80">Proposes the block to Ethereum L1 and receives the high tip/bribe.</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-5 border border-border bg-card rounded-lg">
                <h3 className="font-mono font-bold text-base flex items-center gap-2 text-muted-foreground mb-3">
                    <Cpu className="w-4 h-4" /> Why Retail Cannot Compete
                </h3>
                <p className="text-muted-foreground mb-4">
                    A retail trader using a web dashboard cannot execute traditional MEV arbitrage effectively for three reasons:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
                    <div className="p-4 bg-background border border-border rounded shadow-sm">
                        <div className="font-bold text-primary mb-2 text-sm">1. Network Latency</div>
                        <p className="text-muted-foreground leading-relaxed">Searchers colocate their bare-metal servers physically near validator nodes in AWS/GCP data centers, saving precious milliseconds.</p>
                    </div>
                    <div className="p-4 bg-background border border-border rounded shadow-sm">
                        <div className="font-bold text-primary mb-2 text-sm">2. Execution Speed</div>
                        <p className="text-muted-foreground leading-relaxed">Top searchers write heavily optimized, multi-threaded bots in Rust or Go, bypassing slow Web3.js / Ethers.js wrappers.</p>
                    </div>
                    <div className="p-4 bg-background border border-border rounded shadow-sm">
                        <div className="font-bold text-primary mb-2 text-sm">3. Private Orderflow</div>
                        <p className="text-muted-foreground leading-relaxed">Searchers execute via private endpoints (like Flashbots) so their bundles bypass the public mempool entirely, preventing theft.</p>
                    </div>
                </div>
            </div>

        </div>
    );
}
