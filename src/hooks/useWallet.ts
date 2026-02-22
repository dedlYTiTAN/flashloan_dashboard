"use client";

import { useState, useCallback, useEffect } from "react";
import { ethers } from "ethers";

export const TOKENS = [
    { symbol: "WETH", address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", decimals: 18 },
    { symbol: "WBTC", address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", decimals: 8 },
    { symbol: "USDC", address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", decimals: 6 },
    { symbol: "DAI", address: "0x6B175474E89094C44Da98b954EedeAC495271d0F", decimals: 18 },
];

const ERC20_ABI = [
    "function balanceOf(address owner) view returns (uint256)"
];

export interface TokenBalance {
    symbol: string;
    balance: string;
    raw: bigint;
}

export function useWallet() {
    const [address, setAddress] = useState<string | null>(null);
    const [ethBalance, setEthBalance] = useState<string | null>(null);
    const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchBalances = useCallback(async (provider: ethers.BrowserProvider, userAddress: string) => {
        try {
            // Fetch ETH balance
            const balance = await provider.getBalance(userAddress);
            setEthBalance(ethers.formatEther(balance));

            // Fetch ERC-20 token balances sequentially to avoid rate limits on free RPCs
            const balances: TokenBalance[] = [];
            for (const token of TOKENS) {
                const contract = new ethers.Contract(token.address, ERC20_ABI, provider);
                try {
                    const rawBalance: bigint = await contract.balanceOf(userAddress);
                    balances.push({
                        symbol: token.symbol,
                        balance: ethers.formatUnits(rawBalance, token.decimals),
                        raw: rawBalance
                    });
                } catch (err) {
                    console.error(`Failed to fetch balance for ${token.symbol}`, err);
                    balances.push({ symbol: token.symbol, balance: "0", raw: 0n });
                }
            }
            setTokenBalances(balances);
        } catch (err) {
            console.error("Failed to fetch balances", err);
        }
    }, []);

    const connect = useCallback(async () => {
        setIsConnecting(true);
        setError(null);

        // Check if ethereum is available on window
        if (typeof window !== "undefined" && (window as any).ethereum) {
            try {
                const provider = new ethers.BrowserProvider((window as any).ethereum);

                // Request connection
                const accounts = await provider.send("eth_requestAccounts", []);
                if (accounts.length > 0) {
                    const connectedAddress = accounts[0];
                    setAddress(connectedAddress);
                    await fetchBalances(provider, connectedAddress);
                }
            } catch (err: any) {
                console.error("Connection failed", err);
                setError(err.message || "Failed to connect wallet.");
            }
        } else {
            setError("MetaMask or a Web3 wallet is not installed.");
        }
        setIsConnecting(false);
    }, [fetchBalances]);

    const disconnect = useCallback(() => {
        setAddress(null);
        setEthBalance(null);
        setTokenBalances([]);
    }, []);

    // Handle account changes
    useEffect(() => {
        if (typeof window !== "undefined" && (window as any).ethereum) {
            const handleAccountsChanged = (accounts: string[]) => {
                if (accounts.length === 0) {
                    disconnect();
                } else {
                    setAddress(accounts[0]);
                    const provider = new ethers.BrowserProvider((window as any).ethereum);
                    fetchBalances(provider, accounts[0]);
                }
            };

            (window as any).ethereum.on("accountsChanged", handleAccountsChanged);
            return () => {
                if ((window as any).ethereum.removeListener) {
                    (window as any).ethereum.removeListener("accountsChanged", handleAccountsChanged);
                }
            };
        }
    }, [disconnect, fetchBalances]);

    return {
        address,
        ethBalance,
        tokenBalances,
        isConnecting,
        error,
        connect,
        disconnect
    };
}
