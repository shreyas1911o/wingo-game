"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function LoginPage() {
    const { login } = useAuth();
    const [mobile, setMobile] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mobile, password }),
            });
            const data = await res.json();
            if (res.ok) {
                login(data.token, data.user);
            } else {
                setError(data.message || "Login failed");
            }
        } catch (error) {
            console.error("Login error:", error);
            setError("Error logging in");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center p-4 bg-mandala-pattern relative overflow-hidden"
            style={{ background: "#120608" }}
        >
            {/* Ambient radial glow */}
            <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[140px] pointer-events-none"
                style={{ background: "radial-gradient(circle, rgba(212,160,23,0.12) 0%, transparent 70%)" }}
            />
            {/* Top decorative element */}
            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(212,160,23,0.5), transparent)" }} />

            <div className="w-full max-w-md relative">
                {/* Outer ornate border frame */}
                <div
                    className="rounded-3xl relative overflow-hidden"
                    style={{
                        background: "linear-gradient(160deg, #1E0A0A 0%, #2D1408 100%)",
                        border: "1px solid rgba(212,160,23,0.3)",
                        boxShadow: "0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(212,160,23,0.05)",
                    }}
                >
                    {/* Corner ornaments */}
                    <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 rounded-tl-xl" style={{ borderColor: "rgba(212,160,23,0.4)" }} />
                    <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 rounded-tr-xl" style={{ borderColor: "rgba(212,160,23,0.4)" }} />
                    <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 rounded-bl-xl" style={{ borderColor: "rgba(212,160,23,0.4)" }} />
                    <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 rounded-br-xl" style={{ borderColor: "rgba(212,160,23,0.4)" }} />

                    {/* Header */}
                    <div className="pt-10 px-8 pb-6 text-center" style={{ borderBottom: "1px solid rgba(212,160,23,0.1)" }}>
                        {/* Logo circle */}
                        <div className="flex justify-center mb-5">
                            <div className="relative">
                                <div className="absolute -inset-2 rounded-full animate-pulse opacity-30" style={{ background: "radial-gradient(circle, #D4A017, transparent)" }} />
                                <div
                                    className="relative w-20 h-20 rounded-full flex items-center justify-center text-4xl font-black"
                                    style={{
                                        background: "linear-gradient(135deg, #2D1408, #1E0A0A)",
                                        border: "2px solid rgba(212,160,23,0.5)",
                                        color: "#D4A017",
                                        fontFamily: "var(--font-serif)",
                                        boxShadow: "0 0 24px rgba(212,160,23,0.2)",
                                    }}
                                >
                                    W
                                </div>
                            </div>
                        </div>

                        <h1
                            className="text-3xl font-black tracking-tight bg-branding-gradient animate-text-shimmer"
                            style={{ fontFamily: "var(--font-serif)" }}
                        >
                            WINGO
                        </h1>
                        <p className="text-xs uppercase tracking-[0.3em] mt-2" style={{ color: "rgba(212,160,23,0.45)" }}>
                            Pravesh Karein
                        </p>
                    </div>

                    {/* Form */}
                    <div className="px-8 py-6">
                        <form onSubmit={handleLogin} className="space-y-5">
                            {error && (
                                <div
                                    className="p-3 rounded-xl text-sm text-center font-semibold"
                                    style={{ background: "rgba(178,34,34,0.12)", border: "1px solid rgba(178,34,34,0.3)", color: "#E74C3C" }}
                                >
                                    {error}
                                </div>
                            )}
                            <div className="space-y-1.5">
                                <label className="label-luxury">Mobile Number</label>
                                <input
                                    type="text"
                                    placeholder="Enter mobile number"
                                    value={mobile}
                                    onChange={(e) => setMobile(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 rounded-xl text-sm font-medium transition-all outline-none"
                                    style={{
                                        background: "rgba(0,0,0,0.35)",
                                        border: "1px solid rgba(212,160,23,0.2)",
                                        color: "#FDF6E3",
                                        fontFamily: "var(--font-sans)",
                                    }}
                                    onFocus={(e) => { e.target.style.borderColor = "rgba(212,160,23,0.5)"; e.target.style.boxShadow = "0 0 0 2px rgba(212,160,23,0.08)"; }}
                                    onBlur={(e) => { e.target.style.borderColor = "rgba(212,160,23,0.2)"; e.target.style.boxShadow = "none"; }}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="label-luxury">Password</label>
                                <input
                                    type="password"
                                    placeholder="Enter password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 rounded-xl text-sm font-medium transition-all outline-none"
                                    style={{
                                        background: "rgba(0,0,0,0.35)",
                                        border: "1px solid rgba(212,160,23,0.2)",
                                        color: "#FDF6E3",
                                        fontFamily: "var(--font-sans)",
                                    }}
                                    onFocus={(e) => { e.target.style.borderColor = "rgba(212,160,23,0.5)"; e.target.style.boxShadow = "0 0 0 2px rgba(212,160,23,0.08)"; }}
                                    onBlur={(e) => { e.target.style.borderColor = "rgba(212,160,23,0.2)"; e.target.style.boxShadow = "none"; }}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3.5 rounded-xl font-black uppercase tracking-widest text-sm transition-all relative overflow-hidden group"
                                style={{
                                    backgroundImage: isLoading
                                        ? "none"
                                        : "linear-gradient(135deg, #D4A017 0%, #8B6914 50%, #D4A017 100%)",
                                    backgroundColor: isLoading ? "rgba(212,160,23,0.3)" : undefined,
                                    color: "#1a0800",
                                    fontFamily: "var(--font-serif)",
                                    boxShadow: "0 4px 20px rgba(212,160,23,0.3)",
                                }}
                            >
                                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                {isLoading ? "✦ Logging in..." : "✦ Pravesh Karein ✦"}
                            </button>

                            <div className="text-center text-sm" style={{ color: "rgba(212,160,23,0.5)" }}>
                                Account nahi hai?{" "}
                                <Link href="/register" className="font-black transition-colors" style={{ color: "#D4A017" }}>
                                    Register Karein
                                </Link>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
