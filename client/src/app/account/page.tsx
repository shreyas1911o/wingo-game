"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

export default function AccountPage() {
    const { user, token, logout, loading, updateBalance } = useAuth();
    const router = useRouter();
    const [profile, setProfile] = useState<any>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [giftCode, setGiftCode] = useState("");
    const [isRedeeming, setIsRedeeming] = useState(false);
    const [redeemMsg, setRedeemMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
    const [copyMsg, setCopyMsg] = useState<string | null>(null);

    const handleRedeem = async () => {
        if (!giftCode.trim() || !token) return;
        setIsRedeeming(true);
        setRedeemMsg(null);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/giftcard/redeem`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ code: giftCode }),
            });
            const data = await res.json();
            if (res.ok) {
                setRedeemMsg({ text: data.message, type: "success" });
                setGiftCode("");
                updateBalance();
                fetchProfile();
            } else {
                setRedeemMsg({ text: data.message || "Failed to redeem code", type: "error" });
            }
        } catch (error) {
            setRedeemMsg({ text: "Error connecting to server", type: "error" });
        } finally {
            setIsRedeeming(false);
            setTimeout(() => setRedeemMsg(null), 5000);
        }
    };

    const fetchProfile = useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/auth/profile`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setProfile(data);
            }
        } catch (error) {
            console.error("Failed to fetch profile", error);
        }
    }, [token]);

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
            return;
        }
        if (user) {
            fetchProfile();
        }
    }, [user, loading, router, fetchProfile]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await updateBalance();
        await fetchProfile();
        setIsRefreshing(false);
    };

    const copyReferral = () => {
        if (profile?.referralCode) {
            navigator.clipboard.writeText(profile.referralCode);
            setCopyMsg("Code copied!");
            setTimeout(() => setCopyMsg(null), 2000);
        }
    };

    const copyInviteLink = () => {
        if (profile?.referralCode) {
            const link = `${window.location.origin}/register?r=${profile.referralCode}`;
            navigator.clipboard.writeText(link);
            setCopyMsg("Link copied!");
            setTimeout(() => setCopyMsg(null), 2000);
        }
    };

    if (loading || (!user && !profile)) {
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
        <div className="min-h-screen text-foreground p-4 pb-24 bg-mandala-pattern" style={{ background: "#120608" }}>
            {/* Header */}
            <header
                className="flex justify-between items-center mb-8 p-4 rounded-2xl"
                style={{ background: "linear-gradient(135deg, #1E0A0A, #2D1408)", border: "1px solid rgba(212,160,23,0.25)", boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}
            >
                <div className="flex items-center gap-3">
                    <div
                        className="w-8 h-8 rounded-full flex items-center justify-center font-black"
                        style={{ background: "linear-gradient(135deg, #2D1408,#1E0A0A)", border: "1.5px solid rgba(212,160,23,0.4)", color: "#D4A017", fontFamily: "var(--font-serif)" }}
                    >
                        W
                    </div>
                    <h1 className="text-xl font-black uppercase leading-none bg-branding-gradient animate-text-shimmer" style={{ fontFamily: "var(--font-serif)" }}>
                        Mera Khata
                    </h1>
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="p-2 rounded-lg transition-all"
                    style={{ background: "rgba(212,160,23,0.08)", border: "1px solid rgba(212,160,23,0.2)", color: "rgba(212,160,23,0.6)" }}
                >
                    <span className={isRefreshing ? "animate-spin inline-block" : ""}>🔄</span>
                </button>
            </header>

            <div className="space-y-5 max-w-lg mx-auto">
                {/* Profile Card */}
                <div
                    className="rounded-2xl p-5 relative overflow-hidden"
                    style={{ background: "linear-gradient(135deg, #1E0A0A, #2D1408)", border: "1px solid rgba(212,160,23,0.3)", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}
                >
                    {/* Corner ornaments */}
                    <div className="absolute top-2 left-2 w-4 h-4 border-t border-l rounded-tl-lg" style={{ borderColor: "rgba(212,160,23,0.35)" }} />
                    <div className="absolute top-2 right-2 w-4 h-4 border-t border-r rounded-tr-lg" style={{ borderColor: "rgba(212,160,23,0.35)" }} />
                    <div className="absolute bottom-2 left-2 w-4 h-4 border-b border-l rounded-bl-lg" style={{ borderColor: "rgba(212,160,23,0.35)" }} />
                    <div className="absolute bottom-2 right-2 w-4 h-4 border-b border-r rounded-br-lg" style={{ borderColor: "rgba(212,160,23,0.35)" }} />
                    <div className="flex items-center gap-4">
                        <div
                            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black"
                            style={{ background: "linear-gradient(135deg, #D4A017, #8B6914)", color: "#1a0800", fontFamily: "var(--font-serif)", boxShadow: "0 0 20px rgba(212,160,23,0.3)" }}
                        >
                            {profile?.mobile?.slice(-2) || "??"}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold" style={{ fontFamily: "var(--font-serif)", color: "#FDF6E3" }}>{profile?.mobile}</h2>
                            <p className="text-sm" style={{ color: "rgba(212,160,23,0.6)" }}>VIP Sthar: {profile?.vipLevel || 0}</p>
                        </div>
                        {user?.isAdmin && (
                            <Link href="/admin" className="ml-auto">
                                <span className="text-[10px] px-2 py-1 rounded font-bold" style={{ background: "rgba(178,34,34,0.2)", color: "#E74C3C", border: "1px solid rgba(178,34,34,0.35)" }}>ADMIN</span>
                            </Link>
                        )}
                    </div>
                </div>

                {/* Balance Section */}
                <div className="grid grid-cols-2 gap-4">
                    {[
                        { label: "Kul Raashi", value: profile?.walletBalance, color: "#D4A017" },
                        { label: "Bonus", value: profile?.bonusBalance, color: "#1A9B5C" },
                    ].map((item) => (
                        <div
                            key={item.label}
                            className="rounded-xl p-4"
                            style={{ background: "linear-gradient(135deg, #1E0A0A, #2D1408)", border: "1px solid rgba(212,160,23,0.2)" }}
                        >
                            <p className="label-luxury mb-1">{item.label}</p>
                            <p className="text-2xl font-black" style={{ fontFamily: "var(--font-serif)", color: item.color }}>₹{item.value?.toFixed(2) || "0.00"}</p>
                        </div>
                    ))}
                </div>

                {/* Referral Section */}
                <div
                    className="rounded-2xl p-5 relative overflow-hidden"
                    style={{ background: "linear-gradient(135deg, #1E0A0A, rgba(26,107,60,0.15))", border: "1px solid rgba(26,155,92,0.25)" }}
                >
                    <p className="label-luxury mb-3">✦ Referral Code</p>
                    <div className="flex justify-between items-center gap-4">
                        <p className="text-lg font-mono font-bold tracking-widest" style={{ color: "#1A9B5C" }}>{profile?.referralCode || "------"}</p>
                        <div className="flex gap-2">
                            <button
                                onClick={copyReferral}
                                className="px-3 py-1.5 rounded-lg text-xs font-black transition-all"
                                style={{ background: "rgba(26,155,92,0.15)", border: "1px solid rgba(26,155,92,0.3)", color: "#1A9B5C" }}
                            >
                                Code
                            </button>
                            <button
                                onClick={copyInviteLink}
                                className="px-3 py-1.5 rounded-lg text-xs font-black transition-all"
                                style={{ background: "rgba(26,155,92,0.25)", border: "1px solid rgba(26,155,92,0.4)", color: "#1A9B5C" }}
                            >
                                Invite Link
                            </button>
                        </div>
                    </div>
                    {copyMsg && (
                        <p className="text-[10px] font-bold mt-2 animate-in fade-in slide-in-from-bottom-1" style={{ color: "#1A9B5C" }}>✓ {copyMsg}</p>
                    )}
                </div>

                {/* Gift Card */}
                <div
                    className="rounded-2xl p-5"
                    style={{ background: "linear-gradient(135deg, #1E0A0A, rgba(212,160,23,0.05))", border: "1px solid rgba(212,160,23,0.25)", boxShadow: "0 0 20px rgba(212,160,23,0.05)" }}
                >
                    <p className="label-luxury mb-3">🎁 Gift Card Kholein</p>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="GIFT CODE DALEIN"
                            value={giftCode}
                            onChange={(e) => setGiftCode(e.target.value)}
                            className="flex-1 px-3 py-2.5 rounded-xl text-sm font-mono outline-none uppercase transition-all"
                            style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(212,160,23,0.2)", color: "#FDF6E3" }}
                        />
                        <button
                            onClick={handleRedeem}
                            disabled={isRedeeming || !giftCode.trim()}
                            className="px-5 py-2.5 rounded-xl font-black text-sm transition-all"
                            style={{ background: "linear-gradient(135deg, #D4A017, #8B6914)", color: "#1a0800", fontFamily: "var(--font-serif)", opacity: isRedeeming || !giftCode.trim() ? 0.5 : 1 }}
                        >
                            {isRedeeming ? "..." : "✦ Open"}
                        </button>
                    </div>
                    {redeemMsg && (
                        <p className={cn("text-xs font-bold mt-2 animate-in fade-in", redeemMsg.type === "success" ? "" : "")} style={{ color: redeemMsg.type === "success" ? "#1A9B5C" : "#E74C3C" }}>
                            {redeemMsg.text}
                        </p>
                    )}
                    <p className="text-[10px] mt-2 italic" style={{ color: "rgba(212,160,23,0.4)" }}>10-ank wala code daalein aur mystery gift paaein!</p>
                </div>

                {/* Quick Links */}
                <div className="space-y-3">
                    {[
                        { href: "/wallet", icon: "💳", label: "Bटua & Len-Den" },
                        { href: "/dashboard", icon: "🎮", label: "Khel Khelein" },
                    ].map((link) => (
                        <Link key={link.href} href={link.href} className="block">
                            <div
                                className="flex items-center gap-3 h-14 px-4 rounded-xl font-bold text-base transition-all hover:scale-[1.01]"
                                style={{ background: "linear-gradient(135deg, #1E0A0A, #2D1408)", border: "1px solid rgba(212,160,23,0.2)", color: "#FDF6E3" }}
                            >
                                {link.icon} {link.label}
                            </div>
                        </Link>
                    ))}
                    <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 h-14 px-4 rounded-xl font-bold text-base transition-all"
                        style={{ background: "rgba(178,34,34,0.1)", border: "1px solid rgba(178,34,34,0.25)", color: "#E74C3C" }}
                    >
                        🚪 Bahar Jaayein (Logout)
                    </button>
                </div>

                <div className="text-center pt-6">
                    <p className="text-[10px] uppercase tracking-[0.2em]" style={{ color: "rgba(212,160,23,0.25)" }}>Wingo Royal Engine v3.0.0</p>
                </div>
            </div>

            <BottomNav />
        </div>
    );
}
