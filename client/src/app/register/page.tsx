"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import Image from "next/image";

const inputStyle = {
    background: "rgba(0,0,0,0.35)",
    border: "1px solid rgba(212,160,23,0.2)",
    color: "#FDF6E3",
    fontFamily: "var(--font-sans)",
};

function RegisterForm() {
    const { login } = useAuth();
    const searchParams = useSearchParams();
    const [mobile, setMobile] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [referralCode, setReferralCode] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const r = searchParams.get("r");
        if (r) setReferralCode(r);
    }, [searchParams]);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mobile, password, referralCode }),
            });
            const data = await res.json();
            if (res.ok) {
                login(data.token, data.user);
            } else {
                setError(data.message || "Registration failed");
            }
        } catch (error) {
            console.error("Registration error:", error);
            setError("Error registering");
        } finally {
            setIsLoading(false);
        }
    };

    const focusStyle = (e: React.FocusEvent<HTMLInputElement>) => {
        e.target.style.borderColor = "rgba(212,160,23,0.5)";
        e.target.style.boxShadow = "0 0 0 2px rgba(212,160,23,0.08)";
    };
    const blurStyle = (e: React.FocusEvent<HTMLInputElement>) => {
        e.target.style.borderColor = "rgba(212,160,23,0.2)";
        e.target.style.boxShadow = "none";
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center p-4 bg-mandala-pattern relative overflow-hidden"
            style={{ background: "#120608" }}
        >
            {/* Ambient glow */}
            <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[150px] pointer-events-none"
                style={{ background: "radial-gradient(circle, rgba(26,107,60,0.1) 0%, transparent 70%)" }}
            />

            <div className="w-full max-w-md space-y-5 relative">
                {/* Hero banner */}
                <div
                    className="rounded-2xl overflow-hidden relative group"
                    style={{ border: "1px solid rgba(212,160,23,0.2)", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}
                >
                    <div className="absolute inset-0 z-10" style={{ background: "linear-gradient(to top, #120608 0%, transparent 60%)" }} />
                    <Image
                        src="/register-hero.svg"
                        alt="Join Wingo"
                        width={360}
                        height={160}
                        className="w-full h-auto scale-105 group-hover:scale-110 transition-transform duration-700 opacity-70"
                        priority
                    />
                    <div className="absolute bottom-4 left-6 z-20">
                        <h2 className="text-xl font-black tracking-tight" style={{ color: "#D4A017", fontFamily: "var(--font-serif)" }}>
                            ✦ Wingo Parivar Mein Aayein ✦
                        </h2>
                        <p className="text-[10px] uppercase tracking-[0.3em] mt-0.5" style={{ color: "rgba(212,160,23,0.5)" }}>
                            Aaj se jeetnaa shuru karein
                        </p>
                    </div>
                    {/* Corner ornaments */}
                    <div className="absolute top-2 left-2 w-4 h-4 border-t border-l rounded-tl-lg z-20" style={{ borderColor: "rgba(212,160,23,0.4)" }} />
                    <div className="absolute top-2 right-2 w-4 h-4 border-t border-r rounded-tr-lg z-20" style={{ borderColor: "rgba(212,160,23,0.4)" }} />
                </div>

                {/* Form card */}
                <div
                    className="rounded-3xl relative overflow-hidden"
                    style={{
                        background: "linear-gradient(160deg, #1E0A0A 0%, #2D1408 100%)",
                        border: "1px solid rgba(212,160,23,0.3)",
                        boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
                    }}
                >
                    {/* Corner ornaments */}
                    <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 rounded-tl-xl" style={{ borderColor: "rgba(212,160,23,0.35)" }} />
                    <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 rounded-tr-xl" style={{ borderColor: "rgba(212,160,23,0.35)" }} />
                    <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 rounded-bl-xl" style={{ borderColor: "rgba(212,160,23,0.35)" }} />
                    <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 rounded-br-xl" style={{ borderColor: "rgba(212,160,23,0.35)" }} />

                    {/* Header */}
                    <div className="pt-8 px-8 pb-5 text-center" style={{ borderBottom: "1px solid rgba(212,160,23,0.1)" }}>
                        <h1 className="text-2xl font-black tracking-tight bg-branding-gradient animate-text-shimmer" style={{ fontFamily: "var(--font-serif)" }}>
                            Nayi Shuruaat
                        </h1>
                        <p className="text-xs uppercase tracking-[0.25em] mt-1" style={{ color: "rgba(212,160,23,0.45)" }}>
                            Create Account
                        </p>
                    </div>

                    {/* Form */}
                    <div className="px-8 py-6">
                        <form onSubmit={handleRegister} className="space-y-4">
                            {error && (
                                <div className="p-3 rounded-xl text-sm text-center font-semibold"
                                    style={{ background: "rgba(178,34,34,0.12)", border: "1px solid rgba(178,34,34,0.3)", color: "#E74C3C" }}>
                                    {error}
                                </div>
                            )}
                            <div className="space-y-1.5">
                                <label className="label-luxury">Mobile Number</label>
                                <input type="text" placeholder="Enter mobile number" value={mobile}
                                    onChange={(e) => setMobile(e.target.value)} required
                                    className="w-full px-4 py-3 rounded-xl text-sm font-medium transition-all outline-none"
                                    style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="label-luxury">Password</label>
                                <input type="password" placeholder="Enter password" value={password}
                                    onChange={(e) => setPassword(e.target.value)} required
                                    className="w-full px-4 py-3 rounded-xl text-sm font-medium transition-all outline-none"
                                    style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="label-luxury">Referral Code (Optional)</label>
                                <input type="text" placeholder="Friends ka referral code" value={referralCode}
                                    onChange={(e) => setReferralCode(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl text-sm font-medium transition-all outline-none"
                                    style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3.5 rounded-xl font-black uppercase tracking-widest text-sm transition-all relative overflow-hidden group"
                                style={{
                                    background: isLoading
                                        ? "rgba(212,160,23,0.3)"
                                        : "linear-gradient(135deg, #D4A017 0%, #8B6914 50%, #D4A017 100%)",
                                    backgroundSize: "200% auto",
                                    color: "#1a0800",
                                    fontFamily: "var(--font-serif)",
                                    boxShadow: "0 4px 20px rgba(212,160,23,0.3)",
                                }}
                            >
                                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                {isLoading ? "✦ Registering..." : "✦ Register Karein ✦"}
                            </button>

                            <div className="text-center text-sm" style={{ color: "rgba(212,160,23,0.5)" }}>
                                Pehle se account hai?{" "}
                                <Link href="/login" className="font-black transition-colors" style={{ color: "#D4A017" }}>
                                    Login Karein
                                </Link>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function RegisterPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center" style={{ background: "#120608" }}>
                <div className="relative w-12 h-12">
                    <div className="absolute inset-0 rounded-full animate-spin" style={{ background: "conic-gradient(from 0deg, #D4A017, transparent, #D4A017)" }} />
                    <div className="absolute inset-1 rounded-full flex items-center justify-center" style={{ background: "#120608" }}>
                        <span style={{ color: "#D4A017" }}>✦</span>
                    </div>
                </div>
            </div>
        }>
            <RegisterForm />
        </Suspense>
    );
}
