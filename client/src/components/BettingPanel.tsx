"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useSound } from "@/hooks/useSound";

interface BettingPanelProps {
    onPlaceBet: (selection: string, amount: number) => void;
    disabled: boolean;
    walletBalance?: number;
}

// Lotus divider SVG
const LotusDivider = () => (
    <div className="lotus-divider my-1">
        <svg viewBox="0 0 24 12" className="w-5 h-2.5 shrink-0" fill="rgba(212,160,23,0.5)">
            <ellipse cx="12" cy="10" rx="4" ry="5" />
            <ellipse cx="7" cy="10" rx="3" ry="4" transform="rotate(-25 7 10)" />
            <ellipse cx="17" cy="10" rx="3" ry="4" transform="rotate(25 17 10)" />
            <ellipse cx="3" cy="10" rx="2" ry="3" transform="rotate(-45 3 10)" />
            <ellipse cx="21" cy="10" rx="2" ry="3" transform="rotate(45 21 10)" />
        </svg>
    </div>
);

const COLOR_OPTIONS = [
    {
        id: "Green",
        label: "Hara",
        color: "#1A9B5C",
        glow: "rgba(26,155,92,0.5)",
        icon: (
            <svg viewBox="0 0 40 40" className="w-8 h-8">
                <defs>
                    <radialGradient id="gGrad" cx="35%" cy="35%" r="60%">
                        <stop offset="0%" stopColor="#4ADE80" />
                        <stop offset="100%" stopColor="#0F5132" />
                    </radialGradient>
                    <radialGradient id="gBorder" cx="50%" cy="50%" r="50%">
                        <stop offset="70%" stopColor="transparent" />
                        <stop offset="100%" stopColor="#D4A017" />
                    </radialGradient>
                </defs>
                <circle cx="20" cy="20" r="19" fill="url(#gBorder)" />
                <circle cx="20" cy="20" r="16" fill="url(#gGrad)" />
                <circle cx="14" cy="13" r="4" fill="white" fillOpacity="0.2" />
            </svg>
        ),
    },
    {
        id: "Violet",
        label: "Neela",
        color: "#9B59B6",
        glow: "rgba(155, 89, 182, 0.5)",
        icon: (
            <svg viewBox="0 0 40 40" className="w-8 h-8">
                <defs>
                    <radialGradient id="vGrad" cx="35%" cy="35%" r="60%">
                        <stop offset="0%" stopColor="#C39BD3" />
                        <stop offset="100%" stopColor="#4A235A" />
                    </radialGradient>
                </defs>
                <circle cx="20" cy="20" r="19" fill="#D4A01730" />
                <circle cx="20" cy="20" r="16" fill="url(#vGrad)" />
                <circle cx="14" cy="13" r="4" fill="white" fillOpacity="0.2" />
            </svg>
        ),
    },
    {
        id: "Red",
        label: "Laal",
        color: "#C0392B",
        glow: "rgba(192,57,43,0.5)",
        icon: (
            <svg viewBox="0 0 40 40" className="w-8 h-8">
                <defs>
                    <radialGradient id="rGrad" cx="35%" cy="35%" r="60%">
                        <stop offset="0%" stopColor="#E74C3C" />
                        <stop offset="100%" stopColor="#7B241C" />
                    </radialGradient>
                </defs>
                <circle cx="20" cy="20" r="19" fill="#D4A01730" />
                <circle cx="20" cy="20" r="16" fill="url(#rGrad)" />
                <circle cx="14" cy="13" r="4" fill="white" fillOpacity="0.2" />
            </svg>
        ),
    },
];

const NUMBER_COLORS: Record<number, string> = {
    0: "#C0392B",
    1: "#1A9B5C",
    2: "#C0392B",
    3: "#1A9B5C",
    4: "#C0392B",
    5: "#9B59B6",
    6: "#C0392B",
    7: "#1A9B5C",
    8: "#C0392B",
    9: "#1A9B5C",
};

export function BettingPanel({ onPlaceBet, disabled, walletBalance }: BettingPanelProps) {
    const [baseAmount, setBaseAmount] = useState(10);
    const [multiplier, setMultiplier] = useState(1);
    const [selected, setSelected] = useState<string | null>(null);
    const { playClick, playBet } = useSound();

    const totalAmount = baseAmount * multiplier;

    const handleBet = () => {
        if (selected && totalAmount > 0) {
            playBet();
            onPlaceBet(selected, totalAmount);
            setSelected(null);
        }
    };

    return (
        <Card
            className="w-full relative overflow-hidden"
            style={{
                background: "linear-gradient(160deg, #1E0A0A 0%, #2D1408 100%)",
                border: "1px solid rgba(212,160,23,0.3)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(212,160,23,0.1)",
            }}
        >
            {/* Corner ornaments */}
            <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 rounded-tl-xl pointer-events-none" style={{ borderColor: "rgba(212,160,23,0.5)" }} />
            <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 rounded-tr-xl pointer-events-none" style={{ borderColor: "rgba(212,160,23,0.5)" }} />
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 rounded-bl-xl pointer-events-none" style={{ borderColor: "rgba(212,160,23,0.5)" }} />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 rounded-br-xl pointer-events-none" style={{ borderColor: "rgba(212,160,23,0.5)" }} />

            {/* Ambient gold glow */}
            <div className="absolute top-0 right-0 w-40 h-40 pointer-events-none" style={{ background: "radial-gradient(circle, rgba(212,160,23,0.07) 0%, transparent 70%)" }} />
            <div className="absolute bottom-0 left-0 w-40 h-40 pointer-events-none" style={{ background: "radial-gradient(circle, rgba(178,34,34,0.07) 0%, transparent 70%)" }} />

            <CardHeader className="pb-3" style={{ borderBottom: "1px solid rgba(212,160,23,0.15)", background: "rgba(212,160,23,0.03)" }}>
                <div className="flex items-center justify-between">
                    <CardTitle
                        className="text-sm font-black uppercase tracking-widest"
                        style={{ fontFamily: "var(--font-serif)", color: "#D4A017" }}
                    >
                        ✦ Predict &amp; Win ✦
                    </CardTitle>
                    {walletBalance !== undefined && (
                        <div className="px-3 py-1 rounded-lg text-[10px] font-mono" style={{ background: "rgba(212,160,23,0.1)", border: "1px solid rgba(212,160,23,0.2)" }}>
                            <span style={{ color: "rgba(212,160,23,0.7)" }}>WALLET:</span>
                            <span className="ml-1 font-black" style={{ color: "#D4A017" }}>₹{walletBalance.toFixed(2)}</span>
                        </div>
                    )}
                </div>
            </CardHeader>

            <CardContent className="p-5 space-y-5">

                {/* Color Choices */}
                <div>
                    <p className="label-luxury mb-3">Select Rang (Color)</p>
                    <div className="flex gap-3 justify-between">
                        {COLOR_OPTIONS.map((opt) => (
                            <motion.button
                                key={opt.id}
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => { playClick(); setSelected(opt.id); }}
                                disabled={disabled}
                                className={cn(
                                    "flex-1 flex flex-col items-center gap-2 py-3 rounded-2xl transition-all duration-300 border-2"
                                )}
                                style={{
                                    background: selected === opt.id
                                        ? `linear-gradient(160deg, ${opt.color}22, ${opt.color}11)`
                                        : "rgba(255,255,255,0.02)",
                                    borderColor: selected === opt.id ? opt.color : "rgba(212,160,23,0.15)",
                                    boxShadow: selected === opt.id
                                        ? `0 0 20px ${opt.glow}, 0 0 40px ${opt.glow}40`
                                        : "none",
                                }}
                            >
                                <div className={cn("transition-transform duration-500", selected === opt.id && "scale-110 animate-diya-flicker")}>
                                    {opt.icon}
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: selected === opt.id ? opt.color : "rgba(212,160,23,0.4)" }}>
                                    {opt.label}
                                </span>
                            </motion.button>
                        ))}
                    </div>
                </div>

                <LotusDivider />

                {/* Number Grid */}
                <div>
                    <p className="label-luxury mb-3">Select Ank (Number)</p>
                    <div className="grid grid-cols-5 gap-2 p-3 rounded-xl" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(212,160,23,0.1)" }}>
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
                            const isSelected = selected === num.toString();
                            const numColor = NUMBER_COLORS[num];
                            return (
                                <motion.button
                                    key={num}
                                    whileHover={{ scale: 1.12 }}
                                    whileTap={{ scale: 0.88 }}
                                    onClick={() => { playClick(); setSelected(num.toString()); }}
                                    disabled={disabled}
                                    className={cn("aspect-square rounded-lg text-xs font-black transition-all duration-200 border")}
                                    style={{
                                        background: isSelected ? `${numColor}22` : "rgba(255,255,255,0.02)",
                                        borderColor: isSelected ? numColor : "rgba(212,160,23,0.12)",
                                        color: isSelected ? numColor : "rgba(212,160,23,0.4)",
                                        boxShadow: isSelected ? `0 0 12px ${numColor}60` : "none",
                                        fontFamily: "var(--font-serif)",
                                    }}
                                >
                                    {num}
                                </motion.button>
                            );
                        })}
                    </div>
                </div>

                <LotusDivider />

                {/* Size Choice */}
                <div className="flex gap-3">
                    {[
                        { id: "Big", label: "BADA", sub: "5–9", color: "#D4A017", icon: "▲" },
                        { id: "Small", label: "CHHOTA", sub: "0–4", color: "#1A6B3C", icon: "▼" },
                    ].map((opt) => (
                        <motion.button
                            key={opt.id}
                            whileHover={{ y: -2 }}
                            whileTap={{ y: 0 }}
                            onClick={() => { playClick(); setSelected(opt.id); }}
                            disabled={disabled}
                            className={cn("flex-1 flex items-center justify-between px-4 py-3 rounded-xl font-black text-xs transition-all border")}
                            style={{
                                background: selected === opt.id ? `${opt.color}18` : "rgba(255,255,255,0.02)",
                                borderColor: selected === opt.id ? opt.color : "rgba(212,160,23,0.15)",
                                color: selected === opt.id ? opt.color : "rgba(212,160,23,0.4)",
                                boxShadow: selected === opt.id ? `0 0 16px ${opt.color}30` : "none",
                            }}
                        >
                            <span className="flex flex-col items-start leading-none">
                                <span style={{ fontFamily: "var(--font-serif)" }}>{opt.label}</span>
                                <span className="text-[8px] opacity-50 mt-1">{opt.sub}</span>
                            </span>
                            <span className="text-lg opacity-40">{opt.icon}</span>
                        </motion.button>
                    ))}
                </div>

                <div className="space-y-4 pt-2" style={{ borderTop: "1px solid rgba(212,160,23,0.1)" }}>
                    {/* Amount Chips */}
                    <div>
                        <p className="label-luxury mb-2">Raashi (Amount)</p>
                        <div className="flex gap-2 justify-between">
                            {[10, 100, 1000, 10000].map((val) => (
                                <button
                                    key={val}
                                    onClick={() => { playClick(); setBaseAmount(val); }}
                                    disabled={disabled}
                                    className={cn("flex-1 py-2 rounded-lg text-[10px] font-black tracking-tighter transition-all border")}
                                    style={{
                                        background: baseAmount === val
                                            ? "rgba(212,160,23,0.2)"
                                            : "rgba(255,255,255,0.03)",
                                        borderColor: baseAmount === val ? "#D4A017" : "rgba(212,160,23,0.15)",
                                        color: baseAmount === val ? "#D4A017" : "rgba(212,160,23,0.45)",
                                        boxShadow: baseAmount === val ? "0 0 10px rgba(212,160,23,0.25)" : "none",
                                    }}
                                >
                                    ₹{val >= 1000 ? `${val / 1000}K` : val}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Multiplier */}
                    <div
                        className="flex items-center gap-3 p-1 rounded-xl"
                        style={{ background: "rgba(0,0,0,0.35)", border: "1px solid rgba(212,160,23,0.1)" }}
                    >
                        <span className="text-[9px] font-black pl-2 uppercase tracking-widest" style={{ color: "rgba(212,160,23,0.5)" }}>Gunna</span>
                        <div className="flex flex-1 gap-1">
                            {[1, 2, 5, 10, 20, 50].map((m) => (
                                <button
                                    key={m}
                                    onClick={() => { playClick(); setMultiplier(m); }}
                                    className={cn("flex-1 py-1 rounded-lg text-[10px] font-bold transition-all")}
                                    style={{
                                        background: multiplier === m ? "rgba(212,160,23,0.25)" : "transparent",
                                        color: multiplier === m ? "#D4A017" : "rgba(212,160,23,0.4)",
                                        boxShadow: multiplier === m ? "0 0 8px rgba(212,160,23,0.2)" : "none",
                                    }}
                                >
                                    {m}×
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Final Action Button */}
                <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleBet}
                    disabled={disabled || !selected || totalAmount <= 0}
                    className={cn(
                        "w-full py-4 rounded-2xl font-black text-[12px] uppercase tracking-widest transition-all duration-300 relative overflow-hidden group shadow-xl",
                        (!selected || disabled) ? "opacity-40 grayscale pointer-events-none" : ""
                    )}
                    style={{
                        background: "linear-gradient(135deg, #D4A017 0%, #8B6914 40%, #D4A017 70%, #F5C842 100%)",
                        backgroundSize: "200% auto",
                        color: "#1a0800",
                        fontFamily: "var(--font-serif)",
                        boxShadow: "0 4px 20px rgba(212,160,23,0.35), inset 0 1px 0 rgba(255,255,255,0.2)",
                    }}
                >
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={disabled ? "closed" : selected || "prompt"}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -20, opacity: 0 }}
                            className="flex items-center justify-center gap-2"
                        >
                            {disabled ? (
                                <>⏱ BETTING CLOSED</>
                            ) : selected ? (
                                <>✦ CONFIRM ₹{totalAmount} ON {selected} ✦</>
                            ) : (
                                <>✦ SELECT YOUR PREDICTION ✦</>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </motion.button>
            </CardContent>
        </Card>
    );
}
