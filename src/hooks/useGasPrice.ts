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

        const rpcs = [
            "https://ethereum-rpc.publicnode.com",
            "https://1rpc.io/eth",
            "https://rpc.ankr.com/eth"
        ];

        const fetchGas = async () => {
            if (!mounted) return;
            try {
                // Manual Fallback: Try each RPC sequentially until one succeeds
                let block = null;
                let feeData = null;
                let success = false;

                for (const url of rpcs) {
                    try {
                        const provider = new ethers.JsonRpcProvider(url, 1, { staticNetwork: true });
                        block = await provider.getBlock("latest");
                        feeData = await provider.getFeeData();
                        success = true;
                        break; // Stop at first successful RPC
                    } catch (e) {
                        console.warn(`RPC ${url} failed, trying next...`);
                    }
                }

                if (!success) throw new Error("All RPCs failed");

                const priceRes = await fetch("https://coins.llama.fi/prices/current/coingecko:ethereum")
                    .then(res => res.json())
                    .catch(() => null);

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
                const priorityWei = (feeData as any).maxPriorityFeePerGas || BigInt(1000000000);
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
