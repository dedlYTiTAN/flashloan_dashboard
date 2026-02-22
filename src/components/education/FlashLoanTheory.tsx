"use client";

import { Code2, BookOpen, Layers } from "lucide-react";

export function FlashLoanTheory() {
    return (
        <div className="space-y-6 text-sm text-foreground/90 leading-relaxed font-sans">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 border border-border bg-card rounded-lg space-y-4">
                    <h3 className="font-mono font-bold text-lg text-primary flex items-center gap-2">
                        <BookOpen className="w-5 h-5" /> What is a Flash Loan?
                    </h3>
                    <p>
                        A flash loan allows you to borrow a massive amount of liquidity (up to the entire protocol's reserves) <strong>without providing upfront collateral</strong>, provided that the loan principal plus a small fee is returned within the exact same Ethereum transaction.
                    </p>
                    <p>
                        If your transaction fails to return the funds by the end of execution, the entire transaction reverts. To the blockchain, it is as if the loan never happened—meaning the only risk is the gas fee spent attempting the transaction.
                    </p>
                    <div className="mt-4 p-3 bg-white/5 border border-border rounded font-mono text-xs">
                        <div className="text-muted-foreground mb-1 uppercase tracking-wider">Aave V3 Fee Structure:</div>
                        <div className="flex justify-between">
                            <span>Flash Loan Premium:</span>
                            <span className="text-primary">0.05%</span>
                        </div>
                    </div>
                </div>

                <div className="p-5 border border-border bg-card rounded-lg space-y-4">
                    <h3 className="font-mono font-bold text-lg flex items-center gap-2 text-indigo-400">
                        <Layers className="w-5 h-5" /> The Execution Flow
                    </h3>
                    <ol className="list-decimal list-inside space-y-3 font-mono text-xs">
                        <li className="p-2 border border-border/50 rounded bg-background">
                            <span className="text-foreground font-bold">User triggers contract:</span> You call your deployed smart contract.
                        </li>
                        <li className="p-2 border border-border/50 rounded bg-background">
                            <span className="text-foreground font-bold">Request Loan:</span> Your contract calls <code className="text-primary">flashLoanSimple()</code> on Aave Pool.
                        </li>
                        <li className="p-2 border border-border/50 rounded bg-background">
                            <span className="text-foreground font-bold">Callback:</span> Aave sends funds and invokes <code className="text-indigo-400">executeOperation()</code> on your contract.
                        </li>
                        <li className="p-2 border border-border/50 rounded bg-background border-l-2 border-l-primary pl-4 ml-4">
                            <span className="text-foreground font-bold">Arbitrage logic:</span> Inside the callback, trade on DEX A, then DEX B.
                        </li>
                        <li className="p-2 border border-border/50 rounded bg-background">
                            <span className="text-foreground font-bold">Repayment:</span> Aave pulls Principal + 0.05% fee via approval.
                        </li>
                    </ol>
                </div>
            </div>

            <div className="p-6 border border-border bg-[#0a0a0a] rounded-lg">
                <h3 className="font-mono font-bold text-lg flex items-center gap-2 text-muted-foreground mb-4">
                    <Code2 className="w-5 h-5" /> Smart Contract Anatomy (Theoretical)
                </h3>

                <div className="relative">
                    <pre className="p-4 bg-background border border-border rounded overflow-x-auto text-xs font-mono text-muted-foreground">
                        <code>
                            {`// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import {FlashLoanSimpleReceiverBase} from "@aave/core-v3/contracts/flashloan/base/FlashLoanSimpleReceiverBase.sol";

contract FlashLoanArbitrage is FlashLoanSimpleReceiverBase {
    
    function startArbitrage(address asset, uint256 amount) external {
        // 1. Request the flash loan from Aave V3 Pool
        // This will trigger Aave to send us funds and call executeOperation
        POOL.flashLoanSimple(
            address(this),
            asset,
            amount,
            "",
            0
        );
    }

    // 2. Aave invokes this callback after sending us the requested asset
    function executeOperation(
        address asset,
        uint256 amount,
        uint256 premium,
        address initiator,
        bytes calldata params
    ) external override returns (bool) {
        // 3. => Execute Arbitrage Logic Here <=
        // swapExactTokensForTokens (DEX A) -> swapTokensForExactTokens (DEX B)
        
        // 4. Approve Aave to pull the repayment (Principal + 0.05% premium)
        uint256 amountToOwe = amount + premium;
        IERC20(asset).approve(address(POOL), amountToOwe);
        
        // Any remaining tokens in this contract constitute pure profit.
        return true;
    }
}`}
                        </code>
                    </pre>
                    <div className="absolute top-4 right-4 px-2 py-1 bg-primary/20 text-primary border border-primary/30 rounded text-xs font-mono shadow-lg backdrop-blur">
                        Solidity Example
                    </div>
                </div>
                <p className="mt-4 text-xs font-mono text-muted-foreground opacity-70 italic">
                    * Note: You must deploy a smart contract implementing the receiver interface because an Externally Owned Account (EOA/wallet) cannot handle the synchronous callback required by Aave.
                </p>
            </div>

        </div>
    );
}
