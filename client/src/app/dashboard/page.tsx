"use client";

import { BottomNav } from "@/components/BottomNav";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import { useRouter } from "next/navigation";
import { GameTimer } from "@/components/GameTimer";
import { BettingPanel } from "@/components/BettingPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { useSound } from "@/hooks/useSound";
import { useSoundContext } from "@/context/SoundContext";
import { Volume2, VolumeX, Sun, Moon } from "lucide-react";
import { BannerSlider } from "@/components/BannerSlider";
import { LiveWinsScanner } from "@/components/LiveWinsScanner";

const GAME_TYPES = {
    "30s": { label: "30 Seconds", duration: 30 },
    "1m": { label: "1 Minute", duration: 60 },
    "3m": { label: "3 Minutes", duration: 180 },
};

// Decorative lotus header ornament
function LotusOrnament() {
    return (
        <svg viewBox="0 0 80 20" className="w-16 h-4" fill="rgba(212,160,23,0.35)">
            <ellipse cx="40" cy="18" rx="8" ry="10" />
            <ellipse cx="30" cy="18" rx="6" ry="8" transform="rotate(-25 30 18)" />
            <ellipse cx="50" cy="18" rx="6" ry="8" transform="rotate(25 50 18)" />
            <ellipse cx="20" cy="18" rx="4" ry="6" transform="rotate(-45 20 18)" />
            <ellipse cx="60" cy="18" rx="4" ry="6" transform="rotate(45 60 18)" />
            <line x1="1" y1="12" x2="79" y2="12" stroke="rgba(212,160,23,0.25)" strokeWidth="0.5" />
        </svg>
    );
}

export default function DashboardPage() {
    const { user, token, loading, updateBalance } = useAuth();
    const { socket } = useSocket();
    const { setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const { isMuted, toggleMute } = useSoundContext();

    useEffect(() => { setMounted(true); }, []);
    const router = useRouter();
    const { playTick, playUrgentTick, playBet, playWin, playLoss } = useSound();
    const [activeTab, setActiveTab] = useState("30s");
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [currentPeriodId, setCurrentPeriodId] = useState("");
    const [history, setHistory] = useState([]);
    const [betMessage, setBetMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    useEffect(() => { updateBalance(); }, []);

    useEffect(() => {
        if (!socket) return;

        socket.on("timer-update", (data: { gameType: string; timeRemaining: number }) => {
            if (data.gameType === activeTab) {
                setTimeRemaining(data.timeRemaining);
                if (data.timeRemaining <= 3 && data.timeRemaining > 0) playUrgentTick();
                else if (data.timeRemaining <= 5 && data.timeRemaining > 0) playTick();
            }
        });

        socket.on("new-round", (data: { gameType: string; periodId: string }) => {
            if (data.gameType === activeTab) {
                setCurrentPeriodId(data.periodId);
                setTimeRemaining(GAME_TYPES[activeTab as keyof typeof GAME_TYPES].duration);
            }
        });

        socket.on("round-result", (data: { gameType: string; resultColor?: string }) => {
            if (data.gameType === activeTab) {
                fetchHistory(activeTab);
                updateBalance();
                if (data.resultColor) playWin();
            }
        });

        return () => {
            socket.off("timer-update");
            socket.off("new-round");
            socket.off("round-result");
        };
    }, [socket, activeTab]);

    useEffect(() => { fetchHistory(activeTab); }, [activeTab]);

    const fetchHistory = async (gameType: string) => {
        if (!token) return;
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/game/history?gameType=${gameType}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setHistory(data);
        } catch (error) {
            console.error("Failed to fetch history", error);
        }
    };

    const handlePlaceBet = async (selection: string, amount: number) => {
        if (!token) return;
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/game/bet`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ gameType: activeTab, selection, amount }),
            });

            const data = await res.json();
            if (res.ok) {
                playBet();
                setBetMessage({ text: `✦ ₹${amount} ka daav ${selection} par lagaya!`, type: "success" });
                setTimeout(() => setBetMessage(null), 3000);
            } else {
                setBetMessage({ text: data.message || "Daav lagane mein galti", type: "error" });
                setTimeout(() => setBetMessage(null), 3000);
            }
        } catch (error) {
            console.error("Bet error", error);
            setBetMessage({ text: "Daav lagane mein galti", type: "error" });
            setTimeout(() => setBetMessage(null), 3000);
        }
    };

    if (loading || !user) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: "#120608" }}>
                {/* Spinning mandala loader */}
                <div className="relative w-16 h-16">
                    <div
                        className="absolute inset-0 rounded-full animate-spin"
                        style={{
                            background: "conic-gradient(from 0deg, #D4A017, transparent, #D4A017)",
                            padding: "2px",
                        }}
                    />
                    <div
                        className="absolute inset-1 rounded-full flex items-center justify-center"
                        style={{ background: "#120608" }}
                    >
                        <span style={{ color: "#D4A017", fontSize: "18px" }}>✦</span>
                    </div>
                </div>
                <p className="text-xs uppercase tracking-widest" style={{ color: "rgba(212,160,23,0.5)", fontFamily: "var(--font-serif)" }}>
                    Loading...
                </p>
            </div>
        );
    }

    return (
        <>
            <div
                className="min-h-screen text-foreground p-4 pb-24 bg-mandala-pattern"
                style={{ background: "#120608" }}
            >
                {/* ── HEADER ── */}
                <header className="flex justify-between items-center mb-5">
                    <div className="flex items-center gap-3">
                        {/* Logo with gold halo */}
                        <div className="relative">
                            <div
                                className="absolute -inset-1.5 rounded-full opacity-40 animate-pulse"
                                style={{ background: "radial-gradient(circle, #D4A017, transparent)" }}
                            />
                            <div
                                className="relative w-10 h-10 rounded-full flex items-center justify-center text-lg font-black"
                                style={{
                                    background: "linear-gradient(135deg, #2D1408, #1E0A0A)",
                                    border: "1.5px solid rgba(212,160,23,0.5)",
                                    color: "#D4A017",
                                    fontFamily: "var(--font-serif)",
                                    boxShadow: "0 0 12px rgba(212,160,23,0.2)",
                                }}
                            >
                                W
                            </div>
                        </div>

                        {/* Brand name */}
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <h1
                                    className="text-2xl font-black tracking-tight leading-none bg-branding-gradient animate-text-shimmer"
                                    style={{ fontFamily: "var(--font-serif)" }}
                                >
                                    WINGO
                                </h1>
                                {user?.isAdmin && (
                                    <Link href="/admin">
                                        <span className="text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-widest transition-colors"
                                            style={{ background: "rgba(178,34,34,0.2)", color: "#E74C3C", border: "1px solid rgba(178,34,34,0.35)" }}>
                                            Admin
                                        </span>
                                    </Link>
                                )}
                            </div>
                            {/* Online count */}
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="relative flex h-1.5 w-1.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "#1A9B5C" }} />
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: "#1A9B5C" }} />
                                </span>
                                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(26,155,92,0.8)" }}>
                                    {Math.floor(Math.random() * 500) + 1200} Players Online
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Header action buttons */}
                    <div className="flex items-center gap-2">
                        {/* Help */}
                        <button
                            className="p-2 rounded-lg transition-all"
                            title="Help & Support"
                            style={{
                                background: "rgba(212,160,23,0.06)",
                                border: "1px solid rgba(212,160,23,0.15)",
                                color: "rgba(212,160,23,0.5)",
                            }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                                <line x1="12" y1="17" x2="12.01" y2="17" />
                            </svg>
                        </button>

                        {/* Mute */}
                        <button
                            onClick={toggleMute}
                            className="p-2 rounded-lg transition-all"
                            title={isMuted ? "Unmute" : "Mute"}
                            style={{
                                background: "rgba(212,160,23,0.06)",
                                border: "1px solid rgba(212,160,23,0.15)",
                                color: isMuted ? "rgba(212,160,23,0.35)" : "rgba(212,160,23,0.7)",
                            }}
                        >
                            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                        </button>

                        {/* Theme toggle */}
                        <button
                            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                            className="p-2 rounded-lg transition-all flex items-center justify-center"
                            title="Toggle Theme"
                            style={{
                                background: "rgba(212,160,23,0.06)",
                                border: "1px solid rgba(212,160,23,0.15)",
                                color: "rgba(212,160,23,0.6)",
                                minWidth: "34px",
                            }}
                        >
                            {mounted && (resolvedTheme === "dark"
                                ? <Sun size={16} className="text-yellow-400" />
                                : <Moon size={16} className="text-blue-400" />
                            )}
                        </button>

                        {/* Wallet card */}
                        <Link href="/wallet">
                            <div
                                className="cursor-pointer transition-all hover:scale-105 relative overflow-hidden rounded-xl"
                                style={{
                                    background: "linear-gradient(135deg, rgba(212,160,23,0.15), rgba(212,160,23,0.08))",
                                    border: "1px solid rgba(212,160,23,0.3)",
                                    boxShadow: "0 4px 16px rgba(212,160,23,0.1)",
                                    padding: "8px 12px",
                                    minWidth: "100px",
                                }}
                            >
                                {/* Shimmer overlay */}
                                <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(212,160,23,0.4), transparent)" }} />

                                <div className="text-[9px] uppercase font-black tracking-widest mb-0.5" style={{ color: "rgba(212,160,23,0.5)" }}>
                                    ID: {user?.mobile}
                                </div>
                                <div className="text-[10px] uppercase font-black tracking-widest" style={{ color: "rgba(212,160,23,0.5)" }}>Balance</div>
                                <div className="text-lg font-black leading-tight" style={{ color: "#D4A017", fontFamily: "var(--font-serif)" }}>
                                    ₹{user?.walletBalance?.toFixed(2) || "0.00"}
                                </div>
                                <div className="text-[9px] font-bold mt-1 flex items-center gap-1" style={{ color: "#D4A017" }}>
                                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#D4A017", opacity: 0.6 }} />
                                    Jama Karein
                                </div>
                            </div>
                        </Link>
                    </div>
                </header>

                {/* Lotus ornament divider */}
                <div className="flex justify-center mb-4">
                    <LotusOrnament />
                </div>

                {/* Hero Banner */}
                <BannerSlider />

                {/* Promo row */}
                <div className="grid grid-cols-3 gap-3 mb-2 px-1">
                    <div className="col-span-2 rounded-xl overflow-hidden shadow-lg" style={{ border: "1px solid rgba(212,160,23,0.15)", background: "rgba(45,20,8,0.4)" }}>
                        <Image src="/promo-banner.svg" alt="Win Big with Wingo" width={400} height={160} className="w-full h-auto opacity-90" />
                    </div>
                    <div className="rounded-xl overflow-hidden flex items-center justify-center" style={{ border: "1px solid rgba(212,160,23,0.15)", background: "rgba(18,6,8,0.5)" }}>
                        <Image src="/color-balls-animated.svg" alt="Color Prediction" width={200} height={200} className="w-full h-auto" />
                    </div>
                </div>

                <LiveWinsScanner />

                {/* Game Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList
                        className="grid w-full grid-cols-3 mb-8 p-1 rounded-xl"
                        style={{
                            background: "rgba(18,6,8,0.8)",
                            border: "1px solid rgba(212,160,23,0.2)",
                        }}
                    >
                        <TabsTrigger
                            value="30s"
                            className="rounded-lg text-xs font-black uppercase tracking-wide data-[state=active]:text-[#D4A017] transition-all"
                            style={{ fontFamily: "var(--font-serif)" }}
                        >
                            30s Turbo
                        </TabsTrigger>
                        <TabsTrigger
                            value="1m"
                            className="rounded-lg text-xs font-black uppercase tracking-wide data-[state=active]:text-[#1A9B5C] transition-all"
                            style={{ fontFamily: "var(--font-serif)" }}
                        >
                            1 Min Pro
                        </TabsTrigger>
                        <TabsTrigger
                            value="3m"
                            className="rounded-lg text-xs font-black uppercase tracking-wide data-[state=active]:text-[#D4A017] transition-all"
                            style={{ fontFamily: "var(--font-serif)" }}
                        >
                            3 Min Classic
                        </TabsTrigger>
                    </TabsList>

                    {/* Bet toast */}
                    {betMessage && (
                        <div
                            className="mb-6 px-4 py-3 rounded-xl text-sm font-semibold text-center transition-all animate-in fade-in slide-in-from-top-2 duration-300"
                            style={betMessage.type === "success" ? {
                                background: "rgba(26,155,92,0.12)",
                                border: "1px solid rgba(26,155,92,0.3)",
                                color: "#1A9B5C",
                            } : {
                                background: "rgba(178,34,34,0.12)",
                                border: "1px solid rgba(178,34,34,0.3)",
                                color: "#E74C3C",
                            }}
                        >
                            {betMessage.text}
                        </div>
                    )}

                    {Object.entries(GAME_TYPES).map(([key, config]) => (
                        <TabsContent key={key} value={key} className="space-y-8 outline-none">
                            {/* Period banner */}
                            <div
                                className="w-full rounded-2xl overflow-hidden h-[90px] mb-4 relative"
                                style={{
                                    border: "1px solid rgba(212,160,23,0.2)",
                                    background: "linear-gradient(135deg, #1E0A0A, #2D1408)",
                                }}
                            >
                                <Image
                                    src={key === "30s" ? "/turbo-30s.svg" : key === "1m" ? "/pro-1m.svg" : "/classic-3m.svg"}
                                    alt={`${config.label} Banner`}
                                    width={400}
                                    height={90}
                                    className="w-full h-full object-cover opacity-50"
                                />
                                <div className="absolute inset-0 flex flex-col justify-center px-6" style={{ background: "linear-gradient(90deg, rgba(18,6,8,0.8) 0%, transparent 100%)" }}>
                                    <div className="label-luxury mb-1">Vartaman Daur</div>
                                    <div
                                        className="text-xl font-black font-mono tracking-wider"
                                        style={{ color: "#D4A017", textShadow: "0 0 12px rgba(212,160,23,0.4)" }}
                                    >
                                        #{currentPeriodId.slice(-6) || "------"}
                                    </div>
                                </div>
                                {/* Corner ornaments */}
                                <div className="absolute top-2 right-2 w-4 h-4 border-t border-r rounded-tr-lg" style={{ borderColor: "rgba(212,160,23,0.4)" }} />
                                <div className="absolute bottom-2 right-2 w-4 h-4 border-b border-r rounded-br-lg" style={{ borderColor: "rgba(212,160,23,0.4)" }} />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                                {/* Timer section */}
                                <div
                                    className="flex flex-col items-center p-6 rounded-3xl"
                                    style={{
                                        background: "linear-gradient(160deg, #1E0A0A, #2D1408)",
                                        border: "1px solid rgba(212,160,23,0.2)",
                                        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                                    }}
                                >
                                    {/* Corner ornaments */}
                                    <div className="self-start w-full flex justify-between mb-4">
                                        <div className="w-4 h-4 border-t border-l rounded-tl-lg" style={{ borderColor: "rgba(212,160,23,0.4)" }} />
                                        <div className="w-4 h-4 border-t border-r rounded-tr-lg" style={{ borderColor: "rgba(212,160,23,0.4)" }} />
                                    </div>

                                    <div className="mb-4 text-center">
                                        <div className="label-luxury mb-3">Baaki Samay</div>
                                        <div className={cn("transition-all duration-500", timeRemaining <= 5 && "scale-110")}>
                                            <GameTimer timeRemaining={timeRemaining} totalTime={config.duration} />
                                        </div>
                                    </div>

                                    {/* Live status */}
                                    <div
                                        className="flex gap-2 items-center text-[10px] font-mono px-3 py-1.5 rounded-full uppercase italic"
                                        style={{
                                            background: "rgba(0,0,0,0.4)",
                                            border: "1px solid rgba(212,160,23,0.15)",
                                            color: "rgba(212,160,23,0.5)",
                                        }}
                                    >
                                        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#1A9B5C" }} />
                                        Live — Parinam Ganak Raha Hai
                                    </div>

                                    <div className="self-end w-full flex justify-between mt-4">
                                        <div className="w-4 h-4 border-b border-l rounded-bl-lg" style={{ borderColor: "rgba(212,160,23,0.4)" }} />
                                        <div className="w-4 h-4 border-b border-r rounded-br-lg" style={{ borderColor: "rgba(212,160,23,0.4)" }} />
                                    </div>
                                </div>

                                <BettingPanel
                                    onPlaceBet={handlePlaceBet}
                                    disabled={timeRemaining < 5}
                                    walletBalance={user?.walletBalance}
                                />
                            </div>

                            {/* History Table */}
                            <div
                                className="rounded-2xl overflow-hidden"
                                style={{
                                    border: "1px solid rgba(212,160,23,0.2)",
                                    background: "linear-gradient(160deg, #1E0A0A, #2D1408)",
                                }}
                            >
                                {/* Header */}
                                <div
                                    className="flex items-center justify-between px-5 py-3"
                                    style={{ borderBottom: "1px solid rgba(212,160,23,0.15)", background: "rgba(212,160,23,0.04)" }}
                                >
                                    <h3
                                        className="text-sm font-black uppercase tracking-wider"
                                        style={{ color: "#D4A017", fontFamily: "var(--font-serif)" }}
                                    >
                                        ✦ Itihaas ✦
                                    </h3>
                                    <span className="label-luxury">Game History</span>
                                </div>

                                <div className="p-4">
                                    {/* Column headers */}
                                    <div
                                        className="grid grid-cols-5 gap-2 text-center text-[9px] font-black uppercase tracking-widest pb-2 mb-2"
                                        style={{ color: "rgba(212,160,23,0.5)", borderBottom: "1px solid rgba(212,160,23,0.1)" }}
                                    >
                                        <div>Daur</div>
                                        <div>Ank</div>
                                        <div>Rang</div>
                                        <div>Akar</div>
                                        <div>Mulya</div>
                                    </div>

                                    <div className="space-y-1.5">
                                        {history.map((round: any) => (
                                            <div
                                                key={round._id}
                                                className="grid grid-cols-5 gap-2 text-center text-sm items-center py-2 rounded-lg transition-all"
                                                style={{
                                                    borderBottom: "1px solid rgba(212,160,23,0.06)",
                                                }}
                                            >
                                                <div className="font-mono text-xs" style={{ color: "rgba(212,160,23,0.4)" }}>
                                                    {round.periodId.slice(-4)}
                                                </div>
                                                <div
                                                    className="font-black"
                                                    style={{ fontFamily: "var(--font-serif)", color: round.resultNumber === 5 ? "#9B59B6" : [1, 3, 7, 9].includes(round.resultNumber) ? "#1A9B5C" : "#C0392B" }}
                                                >
                                                    {round.resultNumber}
                                                </div>
                                                <div className="flex justify-center gap-1">
                                                    {round.resultColor === "Violet" ? (
                                                        <>
                                                            <div className="w-3 h-3 rounded-full" style={{ background: "#9B59B6" }} />
                                                            <div className="w-3 h-3 rounded-full" style={{ background: "#C0392B" }} />
                                                        </>
                                                    ) : (
                                                        <div
                                                            className="w-3 h-3 rounded-full"
                                                            style={{ background: round.resultColor === "Green" ? "#1A9B5C" : "#C0392B" }}
                                                        />
                                                    )}
                                                </div>
                                                <div className="text-xs" style={{ color: "rgba(253,246,227,0.6)" }}>{round.resultSize}</div>
                                                <div className="font-mono text-xs" style={{ color: "rgba(212,160,23,0.5)" }}>{round.price}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </TabsContent>
                    ))}
                </Tabs>
            </div>
            <BottomNav />
        </>
    );
}
