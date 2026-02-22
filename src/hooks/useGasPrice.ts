"use client";

import { useState, useEffect } from "react";
import { ethers, formatUnits } from "ethers";

export interface GasData {
    baseFee: number;
    priorityFee: {
        cheap: number;
        normal: number;
        fast: number;
    };
    usdPrice: number; // ETH price in USD
}

export function useGasPrice() {
    const [gasData, setGasData] = useState<GasData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        // Using a free public RPC for Ethereum Mainnet (Cloudflare is more resilient)
        const provider = new ethers.JsonRpcProvider("https://cloudflare-eth.com", 1, { staticNetwork: true });

        const fetchGas = async () => {
            if (!mounted) return;
            try {
                // Fetch block, fee data, and live ETH price concurrently
                const [block, feeData, priceRes] = await Promise.all([
                    provider.getBlock("latest"),
                    provider.getFeeData(),
                    fetch("https://coins.llama.fi/prices/current/coingecko:ethereum")
                        .then(res => res.json())
                        .catch(() => null)
                ]);

                if (!mounted) return;

                // ETH USD Price (fallback to 3000 if API fails)
                let usdPrice = 3000;
                if (priceRes && priceRes.coins && priceRes.coins["coingecko:ethereum"]) {
                    usdPrice = priceRes.coins["coingecko:ethereum"].price;
                }

                // Base Fee (from the last mined block)
                const baseFeeWei = block?.baseFeePerGas || BigInt(15000000000);
                const baseFeeGwei = Number(formatUnits(baseFeeWei, "gwei"));

                // Priority Fee
                const priorityWei = feeData.maxPriorityFeePerGas || BigInt(1000000000);
                const priorityGwei = Number(formatUnits(priorityWei, "gwei"));

                setGasData({
                    baseFee: Number(baseFeeGwei.toFixed(2)),
                    priorityFee: {
                        cheap: Number((priorityGwei * 0.1).toFixed(2)), // Very slow
                        normal: Number(priorityGwei.toFixed(2)),        // Standard network fee
                        fast: Number((priorityGwei * 3).toFixed(2)),    // Approximated "fast/MEV" jump
                    },
                    usdPrice: usdPrice,
                });
                setIsLoading(false);
            } catch (error) {
                console.error("Failed to fetch live gas data:", error);
            }
        };

        fetchGas();

        // Update every 12 seconds (~Ethereum block time)
        const interval = setInterval(fetchGas, 12000);

        return () => {
            mounted = false;
            clearInterval(interval);
        };
    }, []);

    return { gasData, isLoading };
}
