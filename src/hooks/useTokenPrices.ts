"use client";

import { useState, useEffect } from "react";

export interface DexQuote {
    dex: string;
    price: number;
    volume24h: string;
    liquidity: string;
    feeTier: string;
}

export interface TokenPairData {
    pair: string;
    baseToken: string;
    quoteToken: string;
    quotes: DexQuote[];
    bestPrice: number;
    worstPrice: number;
    maxSpreadPct: number;
}

const TOKENS = {
    WETH: "coingecko:ethereum",
    WBTC: "coingecko:wrapped-bitcoin",
    USDC: "coingecko:usd-coin",
    DAI: "coingecko:dai"
};

export function useTokenPrices() {
    const [data, setData] = useState<TokenPairData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        const generateDEXQuotes = (basePrice: number, pair: string) => {
            // Simulated deep liquidity metadata
            const meta = {
                "WETH/USDC": { V3: { v: "$1.2B", l: "$340M" }, Sushi: { v: "$45M", l: "$12M" }, Curve: { v: "$120M", l: "$85M" } },
                "WBTC/USDC": { V3: { v: "$800M", l: "$210M" }, Sushi: { v: "$25M", l: "$8M" }, Curve: { v: "$95M", l: "$60M" } },
                "WETH/DAI": { V3: { v: "$400M", l: "$150M" }, Sushi: { v: "$15M", l: "$5M" }, Curve: { v: "$65M", l: "$40M" } }
            }[pair] as any;

            // Generate slight realistic variations (spreads) around the true oracle price
            // Curve is generally tightest, Sushi spreads can be wider
            return [
                { dex: "Uniswap V3", price: basePrice * (1 + (Math.random() * 0.0004 - 0.0002)), volume24h: meta.V3.v, liquidity: meta.V3.l, feeTier: "0.05%" },
                { dex: "Sushiswap", price: basePrice * (1 + (Math.random() * 0.002 - 0.001)), volume24h: meta.Sushi.v, liquidity: meta.Sushi.l, feeTier: "0.30%" },
                { dex: "Curve", price: basePrice * (1 + (Math.random() * 0.0002 - 0.0001)), volume24h: meta.Curve.v, liquidity: meta.Curve.l, feeTier: "0.04%" },
            ].map(q => ({ ...q, price: Number(q.price.toFixed(2)) }));
        };

        const fetchPrices = async () => {
            if (!mounted) return;
            try {
                const url = `https://coins.llama.fi/prices/current/${Object.values(TOKENS).join(",")}`;
                const res = await fetch(url);
                const json = await res.json();

                const pWETH = json.coins[TOKENS.WETH]?.price || 3450;
                const pWBTC = json.coins[TOKENS.WBTC]?.price || 64000;
                const pUSDC = json.coins[TOKENS.USDC]?.price || 1;
                const pDAI = json.coins[TOKENS.DAI]?.price || 1;

                // Calculate ratios
                const wethUsdc = pWETH / pUSDC;
                const wbtcUsdc = pWBTC / pUSDC;
                const wethDai = pWETH / pDAI;

                const pairsInfo = [
                    { pair: "WETH/USDC", baseToken: "WETH", quoteToken: "USDC", anchor: wethUsdc },
                    { pair: "WBTC/USDC", baseToken: "WBTC", quoteToken: "USDC", anchor: wbtcUsdc },
                    { pair: "WETH/DAI", baseToken: "WETH", quoteToken: "DAI", anchor: wethDai }
                ];

                const updatedData = pairsInfo.map(info => {
                    const quotes = generateDEXQuotes(info.anchor, info.pair);
                    const prices = quotes.map(q => q.price);
                    const best = Math.max(...prices);
                    const worst = Math.min(...prices);

                    return {
                        ...info,
                        quotes,
                        bestPrice: best,
                        worstPrice: worst,
                        maxSpreadPct: ((best - worst) / worst) * 100
                    };
                });

                if (mounted) {
                    setData(updatedData);
                    setIsLoading(false);
                }
            } catch (err) {
                console.error("Failed to fetch live token prices", err);
            }
        };

        // Initial fetch
        fetchPrices();

        // Refresh every 10 seconds
        const interval = setInterval(fetchPrices, 10000);

        return () => {
            mounted = false;
            clearInterval(interval);
        };
    }, []);

    return { data, isLoading };
}
