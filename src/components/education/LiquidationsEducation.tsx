"use client";

import { Droplet, Activity, TrendingDown, Info, Server } from "lucide-react";
import { useState, useEffect } from "react";
import { ethers, formatUnits } from "ethers";

// Aave V3 Protocol Data Provider on Mainnet
const AAVE_DATA_PROVIDER = "0x7B4EB56E7CD4b454BA8ff71E4518426369a138a3";
const AAVE_ABI = [
    "function getReserveData(address asset) view returns (uint256 unbacked, uint256 accruedToTreasuryScaled, uint256 totalAToken, uint256 totalStableDebt, uint256 totalVariableDebt, uint256 liquidityRate, uint256 variableBorrowRate, uint256 stableBorrowRate, uint256 averageStableBorrowRate, uint256 liquidityIndex, uint256 variableBorrowIndex, uint40 lastUpdateTimestamp)"
];

const ASSETS = {
    WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    WBTC: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599"
};

export function LiquidationsEducation() {
    const [stats, setStats] = useState([
        { protocol: "Aave V3 (WETH)", health: "Connecting...", supply: "Loading...", borrows: "Loading..." },
        { protocol: "Aave V3 (USDC)", health: "Connecting...", supply: "Loading...", borrows: "Loading..." },
        { protocol: "Aave V3 (WBTC)", health: "Connecting...", supply: "Loading...", borrows: "Loading..." },
    ]);

    useEffect(() => {
        let mounted = true;
        const provider = new ethers.JsonRpcProvider("https://cloudflare-eth.com", 1, { staticNetwork: true });
        const contract = new ethers.Contract(AAVE_DATA_PROVIDER, AAVE_ABI, provider);

        const fetchAave = async () => {
            if (!mounted) return;
            try {
                const [weth, usdc, wbtc] = await Promise.all([
                    contract.getReserveData(ASSETS.WETH),
                    contract.getReserveData(ASSETS.USDC),
                    contract.getReserveData(ASSETS.WBTC)
                ]);

                if (!mounted) return;

                const formatAave = (data: any, decimals: number) => {
                    const supply = Number(formatUnits(data.totalAToken, decimals));
                    const borrows = Number(formatUnits(data.totalVariableDebt, decimals)) + Number(formatUnits(data.totalStableDebt, decimals));
                    const util = supply === 0 ? 0 : (borrows / supply) * 100;

                    let health = "Healthy";
                    if (util >= 85) health = "Warning";
                    if (util >= 95) health = "Critical";

                    return {
                        supply: supply > 1e6 ? `${(supply / 1e6).toFixed(2)}M` : supply > 1e3 ? `${(supply / 1e3).toFixed(2)}K` : supply.toFixed(2),
                        borrows: borrows > 1e6 ? `${(borrows / 1e6).toFixed(2)}M` : borrows > 1e3 ? `${(borrows / 1e3).toFixed(2)}K` : borrows.toFixed(2),
                        health
                    };
                };

                const fweth = formatAave(weth, 18);
                const fusdc = formatAave(usdc, 6);
                const fwbtc = formatAave(wbtc, 8);

                setStats([
                    { protocol: "Aave V3 (WETH)", health: fweth.health, supply: `${fweth.supply} WETH`, borrows: `${fweth.borrows} WETH` },
                    { protocol: "Aave V3 (USDC)", health: fusdc.health, supply: `${fusdc.supply} USDC`, borrows: `${fusdc.borrows} USDC` },
                    { protocol: "Aave V3 (WBTC)", health: fwbtc.health, supply: `${fwbtc.supply} WBTC`, borrows: `${fwbtc.borrows} WBTC` },
                ]);

            } catch (err) {
                console.error("Failed to fetch Aave liquidations", err);
                if (mounted) {
                    setStats(prev => prev.map(p => ({ ...p, health: "RPC Error" })));
                }
            }
        };

        fetchAave();
        const interval = setInterval(fetchAave, 20000);
        return () => {
            mounted = false;
            clearInterval(interval);
        };
    }, []);

    return (
        <div className="space-y-6 text-sm text-foreground/90 leading-relaxed font-sans">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 p-5 border border-border bg-card rounded-lg space-y-4">
                    <h3 className="font-mono font-bold text-lg text-blue-400 flex items-center gap-2">
                        <Droplet className="w-5 h-5" /> The Liquidation Mechanism
                    </h3>
                    <p>
                        In DeFi lending protocols, loans are over-collateralized. Users deposit volatile assets (like ETH) to borrow stable ones (like USDC).
                    </p>
                    <p>
                        The protocol calculates a <strong>Health Factor (HF)</strong>.
                        <br />
                        If <code className="text-secondary-foreground font-mono px-1 rounded border border-border">HF &gt; 1.0</code>, the position is safe.
                        <br />
                        If <code className="text-red-400 font-mono bg-red-500/10 px-1 rounded border border-red-500/20">HF &lt; 1.0</code>, the position becomes eligible for liquidation.
                    </p>
                    <div className="p-3 bg-white/5 border border-border/50 rounded flex gap-3 text-xs">
                        <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                        <p className="text-muted-foreground">
                            Like arbitrage, liquidations are executed by Searchers. When HF drops below 1.0, a searcher repays the user's debt on their behalf. In return, the protocol allows the searcher to seize a portion of the user's collateral at a significant discount (e.g., 5-10% below market price).
                        </p>
                    </div>
                </div>

                <div className="p-5 border border-border bg-card rounded-lg flex flex-col justify-center items-center text-center space-y-2">
                    <Activity className="w-8 h-8 text-muted-foreground mb-2" />
                    <div className="text-xl font-mono font-bold">Health Factor</div>
                    <div className="font-mono text-xs text-muted-foreground uppercase">Formula</div>
                    <div className="p-2 border border-border rounded text-xs font-mono w-full mt-2">
                        (Collateral × Liquidation Threshold) <br />
                        <hr className="border-border my-1" />
                        (Total Borrows)
                    </div>
                </div>
            </div>

            <div className="p-5 border border-border bg-card rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-mono font-bold text-base flex items-center gap-2 text-muted-foreground">
                        <Server className="w-4 h-4" /> Live Market Reserves (Aave V3 Mainnet)
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Live RPC
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm font-mono text-left whitespace-nowrap">
                        <thead className="bg-white/5 text-muted-foreground text-xs uppercase">
                            <tr>
                                <th className="px-4 py-3 font-medium rounded-tl">Market</th>
                                <th className="px-4 py-3 font-medium">Liquidity Risk</th>
                                <th className="px-4 py-3 font-medium">Total Supplied</th>
                                <th className="px-4 py-3 font-medium rounded-tr">Total Borrowed</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {stats.map((stat, idx) => (
                                <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="px-4 py-3 font-medium">{stat.protocol}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${stat.health === "Healthy" ? "bg-green-500/20 text-green-500" :
                                            stat.health === "Warning" ? "bg-orange-500/20 text-orange-500" :
                                                "bg-red-500/20 text-red-500"
                                            }`}>
                                            {stat.health}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-foreground/80">{stat.supply}</td>
                                    <td className="px-4 py-3 text-red-400">{stat.borrows}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
