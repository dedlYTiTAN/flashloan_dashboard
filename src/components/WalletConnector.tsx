"use client";

import { useWallet } from "@/hooks/useWallet";
import { Wallet, AlertTriangle, ChevronDown, CheckCircle2 } from "lucide-react";
import { useState } from "react";

export function WalletConnector() {
    const { address, ethBalance, tokenBalances, isConnecting, error, connect, disconnect } = useWallet();
    const [isOpen, setIsOpen] = useState(false);

    const formatAddress = (addr: string) => `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
    const formatNumber = (numStr: string) => {
        const num = parseFloat(numStr);
        return num === 0 ? "0.00" : num.toFixed(4);
    };

    if (!address) {
        return (
            <div className="relative">
                <button
                    onClick={connect}
                    disabled={isConnecting}
                    className="flex items-center gap-2 px-4 py-1.5 border border-primary/30 bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors disabled:opacity-50"
                >
                    <Wallet className="w-4 h-4" />
                    {isConnecting ? "Connecting..." : "Connect Wallet"}
                </button>
                {error && (
                    <div className="absolute top-full right-0 mt-2 w-64 p-2 bg-destructive/10 border border-destructive/30 rounded text-xs text-red-500 whitespace-normal">
                        {error}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-1.5 border border-border bg-card hover:bg-white/5 rounded-md transition-colors"
            >
                <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></span>
                <span className="font-mono text-xs">{formatAddress(address)}</span>
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-card border border-border rounded-md shadow-2xl z-50 overflow-hidden font-mono text-sm animate-in fade-in slide-in-from-top-2">
                    {/* Header */}
                    <div className="p-4 border-b border-white/5 bg-white/5">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-muted-foreground text-xs uppercase tracking-wider">Connected Wallet</span>
                            <button
                                onClick={(e) => { e.stopPropagation(); disconnect(); setIsOpen(false); }}
                                className="text-xs text-red-400 hover:text-red-300 transition-colors"
                            >
                                Disconnect
                            </button>
                        </div>
                        <div className="font-medium">{formatAddress(address)}</div>
                    </div>

                    <div className="p-4 border-b border-border/50 bg-primary/5 flex gap-3 text-xs text-primary/80">
                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <p>Read-only connection active. This dashboard will never request transaction signatures.</p>
                    </div>

                    {/* Balances */}
                    <div className="p-4">
                        <span className="text-muted-foreground text-xs uppercase tracking-wider mb-3 block">Asset Holdings (Context)</span>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-foreground/80">ETH</span>
                                <span>{ethBalance ? formatNumber(ethBalance) : "..."}</span>
                            </div>

                            {tokenBalances.map((token) => (
                                <div key={token.symbol} className="flex items-center justify-between">
                                    <span className="text-foreground/80">{token.symbol}</span>
                                    <span className={parseFloat(token.balance) > 0 ? "text-primary" : "text-muted-foreground"}>
                                        {formatNumber(token.balance)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
