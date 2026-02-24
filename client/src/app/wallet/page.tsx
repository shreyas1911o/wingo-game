"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import Image from "next/image";
import { useSound } from "@/hooks/useSound";

const QUICK_AMOUNTS = [100, 200, 500, 1000, 2000, 5000];

export default function WalletPage() {
    const { user, token, loading, updateBalance } = useAuth();
    const router = useRouter();
    const { playDeposit } = useSound();

    const [activeTab, setActiveTab] = useState<"deposit" | "withdraw">("deposit");
    const [amount, setAmount] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("UPI");
    const [accountDetails, setAccountDetails] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [txLoading, setTxLoading] = useState(true);

    useEffect(() => {
        if (!loading && !user) router.push("/login");
    }, [user, loading, router]);

    // Fetch live balance on mount
    useEffect(() => {
        updateBalance();
    }, []);

    useEffect(() => {
        if (!token) return;
        fetchTransactions();
    }, [token]);

    const fetchTransactions = async () => {
        setTxLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/wallet/transactions`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setTransactions(Array.isArray(data) ? data.slice(0, 10) : []);
        } catch {
            setTransactions([]);
        } finally {
            setTxLoading(false);
        }
    };

    const handleDeposit = async () => {
        const amt = parseFloat(amount);
        if (!amt || amt < 10) {
            setMessage({ text: "Minimum deposit is ₹10", type: "error" });
            return;
        }
        setIsLoading(true);
        setMessage(null);
        try {
            const txId = "TXN" + Date.now();
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/wallet/deposit`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ amount: amt, paymentMethod: "UPI", transactionId: txId }),
            });
            const data = await res.json();
            if (res.ok) {
                setAmount("");
                setMessage({ text: `₹${amt.toFixed(2)} added successfully!`, type: "success" });
                playDeposit();
                await updateBalance();
                fetchTransactions();
            } else {
                setMessage({ text: data.message || "Deposit failed", type: "error" });
            }
        } catch {
            setMessage({ text: "Network error, please try again", type: "error" });
        } finally {
            setIsLoading(false);
        }
    };

    const handleWithdraw = async () => {
        const amt = parseFloat(amount);
        if (!amt || amt < 100) {
            setMessage({ text: "Minimum withdrawal is ₹100", type: "error" });
            return;
        }
        if (!accountDetails) {
            setMessage({ text: "Please enter account details", type: "error" });
            return;
        }
        if (user!.walletBalance < amt) {
            setMessage({ text: "Insufficient balance", type: "error" });
            return;
        }

        setIsLoading(true);
        setMessage(null);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/wallet/withdraw`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    amount: amt,
                    paymentMethod,
                    accountDetails: { details: accountDetails }
                }),
            });
            const data = await res.json();
            if (res.ok) {
                setAmount("");
                setAccountDetails("");
                setMessage({ text: "Withdrawal request submitted! It will be processed after admin approval.", type: "success" });
                await updateBalance();
                fetchTransactions();
            } else {
                setMessage({ text: data.message || "Withdrawal failed", type: "error" });
            }
        } catch {
            setMessage({ text: "Network error, please try again", type: "error" });
        } finally {
            setIsLoading(false);
        }
    };

    if (loading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: "#120608" }}>
                <div className="relative w-12 h-12">
                    <div className="absolute inset-0 rounded-full animate-spin" style={{ background: "conic-gradient(from 0deg, #D4A017, transparent, #D4A017)" }} />
                    <div className="absolute inset-1 rounded-full flex items-center justify-center" style={{ background: "#120608" }}>
                        <span style={{ color: "#D4A017" }}>✦</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen text-foreground pb-24 bg-mandala-pattern" style={{ background: "#120608" }}>
            {/* Header */}
            <header className="sticky top-0 z-10 px-4 py-3 flex items-center justify-between" style={{ background: "rgba(18,6,8,0.95)", borderBottom: "1px solid rgba(212,160,23,0.2)", backdropFilter: "blur(12px)" }}>
                <Link href="/dashboard" className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest px-3 py-2 rounded-lg transition-all" style={{ background: "rgba(212,160,23,0.08)", border: "1px solid rgba(212,160,23,0.15)", color: "rgba(212,160,23,0.7)" }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                    Wapas
                </Link>
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-sm font-black" style={{ background: "linear-gradient(135deg, #D4A017, #8B6914)", color: "#1a0800", fontFamily: "var(--font-serif)" }}>W</div>
                    <h1 className="text-base font-black uppercase bg-branding-gradient animate-text-shimmer" style={{ fontFamily: "var(--font-serif)" }}>Mera Bटua</h1>
                </div>
                <div className="w-[60px]" />
            </header>

            <div className="px-4 pt-6 space-y-5 max-w-lg mx-auto">
                {/* Balance Card */}
                <div
                    className="relative overflow-hidden rounded-2xl p-6"
                    style={{ background: "linear-gradient(135deg, #1E0A0A 0%, #2D1408 100%)", border: "1px solid rgba(212,160,23,0.3)", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}
                >
                    {/* Corner ornaments */}
                    <div className="absolute top-2 left-2 w-4 h-4 border-t border-l rounded-tl-lg" style={{ borderColor: "rgba(212,160,23,0.35)" }} />
                    <div className="absolute top-2 right-2 w-4 h-4 border-t border-r rounded-tr-lg" style={{ borderColor: "rgba(212,160,23,0.35)" }} />
                    <div className="absolute bottom-2 left-2 w-4 h-4 border-b border-l rounded-bl-lg" style={{ borderColor: "rgba(212,160,23,0.35)" }} />
                    <div className="absolute bottom-2 right-2 w-4 h-4 border-b border-r rounded-br-lg" style={{ borderColor: "rgba(212,160,23,0.35)" }} />
                    <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full" style={{ background: "radial-gradient(circle, rgba(212,160,23,0.12) 0%, transparent 70%)" }} />
                    <p className="label-luxury mb-2">Kul Raashi</p>
                    <p className="text-4xl font-bold" style={{ fontFamily: "var(--font-serif)", color: "#D4A017" }}>₹{(user.walletBalance ?? 0).toFixed(2)}</p>
                    <p className="text-xs mt-2" style={{ color: "rgba(212,160,23,0.4)" }}>ID: {user.mobile}</p>
                </div>

                {/* Tabs */}
                <div className="flex p-1 rounded-xl" style={{ background: "rgba(212,160,23,0.05)", border: "1px solid rgba(212,160,23,0.15)" }}>
                    <button
                        onClick={() => { setActiveTab("deposit"); setMessage(null); }}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === "deposit"
                            ? "shadow-lg"
                            : ""
                            }`}
                        style={activeTab === "deposit"
                            ? { background: "linear-gradient(135deg, #D4A017, #8B6914)", color: "#1a0800" }
                            : { color: "rgba(212,160,23,0.5)" }}
                    >
                        Jama Karein
                    </button>
                    <button
                        onClick={() => { setActiveTab("withdraw"); setMessage(null); }}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === "withdraw"
                            ? "shadow-lg"
                            : ""
                            }`}
                        style={activeTab === "withdraw"
                            ? { background: "linear-gradient(135deg, #D4A017, #8B6914)", color: "#1a0800" }
                            : { color: "rgba(212,160,23,0.5)" }}
                    >
                        Nikaalen
                    </button>
                </div>

                {/* Main Card */}
                <div className="rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg, #1E0A0A, #2D1408)", border: "1px solid rgba(212,160,23,0.25)" }}>
                    <div className="p-4 pb-3" style={{ borderBottom: "1px solid rgba(212,160,23,0.1)" }}>
                        <p className="label-luxury">
                            {activeTab === "deposit" ? "💰 Paise Jama Karein" : "💸 Paise Nikaalein"}
                        </p>
                    </div>
                    <div className="p-4 space-y-4">
                        {activeTab === "deposit" ? (
                            <>
                                {/* Quick amounts */}
                                <div className="grid grid-cols-3 gap-2">
                                    {QUICK_AMOUNTS.map((q) => (
                                        <button
                                            key={q}
                                            onClick={() => setAmount(String(q))}
                                            className={`py-2 rounded-xl text-sm font-semibold border transition-all duration-150`}
                                            style={amount === String(q)
                                                ? { borderColor: "rgba(212,160,23,0.6)", background: "rgba(212,160,23,0.15)", color: "#D4A017" }
                                                : { borderColor: "rgba(212,160,23,0.15)", background: "rgba(0,0,0,0.2)", color: "rgba(212,160,23,0.5)" }}
                                        >
                                            ₹{q}
                                        </button>
                                    ))}
                                </div>

                                {/* Custom amount */}
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-medium" style={{ color: "rgba(212,160,23,0.5)" }}>₹</span>
                                    <input
                                        type="number"
                                        min="10"
                                        placeholder="Custom amount"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="w-full pl-7 pr-4 py-3 rounded-xl text-sm font-medium outline-none transition-all"
                                        style={{ background: "rgba(0,0,0,0.35)", border: "1px solid rgba(212,160,23,0.2)", color: "#FDF6E3" }}
                                    />
                                </div>

                                <button
                                    onClick={handleDeposit}
                                    disabled={isLoading || !amount}
                                    className="w-full py-3.5 rounded-xl font-black h-11 transition-all active:scale-95 uppercase tracking-widest text-sm"
                                    style={{ background: "linear-gradient(135deg, #D4A017 0%, #8B6914 50%, #D4A017 100%)", backgroundSize: "200% auto", color: "#1a0800", fontFamily: "var(--font-serif)", opacity: isLoading || !amount ? 0.5 : 1 }}
                                >
                                    {isLoading ? "Processing..." : `✦ ₹${amount || "0"} Jama Karein`}
                                </button>
                                <p className="text-xs text-center" style={{ color: "rgba(212,160,23,0.4)" }}>Minimum: ₹10</p>
                            </>
                        ) : (
                            <>
                                {/* Withdrawal Form */}
                                <div className="space-y-3">
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-medium" style={{ color: "rgba(212,160,23,0.5)" }}>₹</span>
                                        <input
                                            type="number"
                                            min="100"
                                            placeholder="Withdrawal Amount"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            className="w-full pl-7 pr-4 py-3 rounded-xl text-sm font-medium outline-none transition-all"
                                            style={{ background: "rgba(0,0,0,0.35)", border: "1px solid rgba(212,160,23,0.2)", color: "#FDF6E3" }}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        {["UPI", "Bank"].map((pm) => (
                                            <button
                                                key={pm}
                                                onClick={() => setPaymentMethod(pm)}
                                                className={`py-2 rounded-xl text-xs font-bold border transition-all`}
                                                style={paymentMethod === pm
                                                    ? { borderColor: "rgba(212,160,23,0.6)", background: "rgba(212,160,23,0.15)", color: "#D4A017" }
                                                    : { borderColor: "rgba(212,160,23,0.15)", background: "rgba(0,0,0,0.2)", color: "rgba(212,160,23,0.4)" }}
                                            >
                                                {pm === "UPI" ? "UPI" : "Bank Transfer"}
                                            </button>
                                        ))}
                                    </div>

                                    <input
                                        placeholder={paymentMethod === "UPI" ? "UPI ID (e.g. user@okaxis)" : "Bank Acc No & IFSC"}
                                        value={accountDetails}
                                        onChange={(e) => setAccountDetails(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl text-sm font-medium outline-none transition-all"
                                        style={{ background: "rgba(0,0,0,0.35)", border: "1px solid rgba(212,160,23,0.2)", color: "#FDF6E3" }}
                                    />

                                    <button
                                        onClick={handleWithdraw}
                                        disabled={isLoading || !amount || !accountDetails}
                                        className="w-full py-3.5 rounded-xl font-black h-11 transition-all active:scale-95 uppercase tracking-widest text-sm"
                                        style={{ background: "linear-gradient(135deg, #7A0000, #B22222)", color: "#FDF6E3", fontFamily: "var(--font-serif)", opacity: isLoading || !amount || !accountDetails ? 0.5 : 1 }}
                                    >
                                        {isLoading ? "Processing..." : `✦ ₹${amount || "0"} Nikaalein`}
                                    </button>
                                    <p className="text-xs text-center" style={{ color: "rgba(212,160,23,0.4)" }}>Minimum: ₹100 • Admin verification required</p>
                                </div>
                            </>
                        )}

                        {/* Message */}
                        {message && (
                            <div className={`text-sm text-center p-3 rounded-xl animate-in fade-in zoom-in duration-300`}
                                style={message.type === "success"
                                    ? { background: "rgba(26,155,92,0.1)", border: "1px solid rgba(26,155,92,0.3)", color: "#1A9B5C" }
                                    : { background: "rgba(178,34,34,0.1)", border: "1px solid rgba(178,34,34,0.3)", color: "#E74C3C" }}
                            >
                                {message.type === "success" ? "✦ " : "✗ "}{message.text}
                            </div>
                        )}
                    </div>
                </div>

                {/* Transaction History */}
                <div className="rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg, #1E0A0A, #2D1408)", border: "1px solid rgba(212,160,23,0.2)" }}>
                    <div className="p-4 pb-3" style={{ borderBottom: "1px solid rgba(212,160,23,0.1)" }}>
                        <p className="label-luxury">Len-Den Itihaas</p>
                    </div>
                    <div className="p-4">
                        {txLoading ? (
                            <div className="flex justify-center py-6">
                                <div className="w-6 h-6 rounded-full animate-spin" style={{ background: "conic-gradient(from 0deg, #D4A017, transparent)" }} />
                            </div>
                        ) : transactions.length === 0 ? (
                            <p className="text-sm text-center py-6" style={{ color: "rgba(212,160,23,0.4)" }}>Koi len-den nahi hai abhi</p>
                        ) : (
                            <div className="space-y-3">
                                {transactions.map((tx: any) => (
                                    <div key={tx._id} className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid rgba(212,160,23,0.08)" }}>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold`}
                                                style={tx.type === "deposit" || tx.type === "win" || tx.type === "bonus"
                                                    ? { background: "rgba(26,155,92,0.15)", color: "#1A9B5C" }
                                                    : { background: "rgba(178,34,34,0.15)", color: "#E74C3C" }}
                                            >
                                                {tx.type === "deposit" || tx.type === "win" || tx.type === "bonus" ? "+" : "−"}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium capitalize" style={{ color: "#FDF6E3" }}>{tx.type}</p>
                                                <p className="text-xs" style={{ color: "rgba(212,160,23,0.4)" }}>
                                                    {new Date(tx.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold" style={{ color: tx.type === "deposit" || tx.type === "win" || tx.type === "bonus" ? "#1A9B5C" : "#E74C3C" }}>
                                                {tx.type === "deposit" || tx.type === "win" || tx.type === "bonus" ? "+" : "−"}₹{tx.amount?.toFixed(2)}
                                            </p>
                                            <p className="text-xs" style={{ color: tx.status === "success" ? "rgba(26,155,92,0.7)" : tx.status === "pending" ? "rgba(212,160,23,0.6)" : "rgba(178,34,34,0.6)" }}>
                                                {tx.status}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
