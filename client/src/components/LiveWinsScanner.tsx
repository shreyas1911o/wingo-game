"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const names = ["98******21", "91******05", "88******44", "70******12", "95******88", "82******33", "77******90"];
const amounts = [100, 500, 200, 1000, 2500, 50, 150, 2000];
const types = ["Hara", "Laal", "Neela", "Bada", "Chhota"];
const typeColors: Record<string, string> = {
    Hara: "#1A9B5C",
    Laal: "#C0392B",
    Neela: "#9B59B6",
    Bada: "#D4A017",
    Chhota: "#1A6B3C",
};

export function LiveWinsScanner() {
    const [wins, setWins] = useState<any[]>([]);

    useEffect(() => {
        const initial = Array.from({ length: 10 }).map(() => generateWin());
        setWins(initial);
    }, []);

    const generateWin = () => ({
        id: Math.random().toString(36).substr(2, 9),
        mobile: names[Math.floor(Math.random() * names.length)],
        amount: amounts[Math.floor(Math.random() * amounts.length)],
        type: types[Math.floor(Math.random() * types.length)],
    });

    return (
        <div
            className="w-full py-2 overflow-hidden relative mb-4"
            style={{
                background: "linear-gradient(90deg, rgba(18,6,8,0.95), rgba(45,20,8,0.9), rgba(18,6,8,0.95))",
                borderTop: "1px solid rgba(212,160,23,0.2)",
                borderBottom: "1px solid rgba(212,160,23,0.2)",
            }}
        >
            {/* Fade masks */}
            <div className="absolute left-0 top-0 bottom-0 w-16 z-10 pointer-events-none" style={{ background: "linear-gradient(to right, rgba(18,6,8,1), transparent)" }} />
            <div className="absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none" style={{ background: "linear-gradient(to left, rgba(18,6,8,1), transparent)" }} />

            {/* Prefix label */}
            <div
                className="absolute left-3 top-1/2 -translate-y-1/2 z-20 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest"
                style={{
                    background: "rgba(212,160,23,0.15)",
                    border: "1px solid rgba(212,160,23,0.3)",
                    color: "#D4A017",
                    fontFamily: "var(--font-serif)",
                }}
            >
                ✦ Wins
            </div>

            <motion.div
                className="flex gap-8 whitespace-nowrap items-center pl-20"
                animate={{ x: [0, -1000] }}
                transition={{
                    duration: 30,
                    repeat: Infinity,
                    ease: "linear",
                }}
            >
                {[...wins, ...wins].map((win, i) => (
                    <div key={`${win.id}-${i}`} className="flex items-center gap-2 text-[11px]">
                        <span className="font-mono" style={{ color: "rgba(212,160,23,0.5)" }}>{win.mobile}</span>
                        <span className="font-bold" style={{ color: "rgba(253,246,227,0.7)" }}>ne jeeta</span>
                        <span className="font-black" style={{ color: "#D4A017", textShadow: "0 0 8px rgba(212,160,23,0.4)" }}>
                            ₹{win.amount}
                        </span>
                        <span
                            className="px-2 py-0.5 rounded text-[9px] font-black uppercase"
                            style={{
                                background: `${typeColors[win.type]}20`,
                                border: `1px solid ${typeColors[win.type]}50`,
                                color: typeColors[win.type],
                            }}
                        >
                            {win.type}
                        </span>
                        <span className="opacity-20" style={{ color: "#D4A017" }}>✦</span>
                    </div>
                ))}
            </motion.div>
        </div>
    );
}
