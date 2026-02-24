"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

export function BannerSlider() {
    const [banners, setBanners] = useState<any[]>([]);
    const [index, setIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchBanners = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/banners`);
                const data = await res.json();
                if (Array.isArray(data) && data.length > 0) {
                    setBanners(data);
                }
            } catch (error) {
                console.error("Failed to fetch banners:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchBanners();
    }, []);

    useEffect(() => {
        if (banners.length <= 1) return;
        const timer = setInterval(() => {
            setIndex((prev) => (prev + 1) % banners.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [banners.length]);

    if (isLoading) {
        return (
            <div
                className="relative w-full aspect-[800/240] mb-6 rounded-2xl overflow-hidden animate-pulse flex items-center justify-center"
                style={{
                    background: "linear-gradient(135deg, #1E0A0A, #2D1408)",
                    border: "1px solid rgba(212,160,23,0.2)",
                }}
            >
                {/* Decorative corner ornaments */}
                <div className="absolute top-2 left-2 w-4 h-4 border-t border-l rounded-tl-lg" style={{ borderColor: "rgba(212,160,23,0.4)" }} />
                <div className="absolute top-2 right-2 w-4 h-4 border-t border-r rounded-tr-lg" style={{ borderColor: "rgba(212,160,23,0.4)" }} />
                <div className="absolute bottom-2 left-2 w-4 h-4 border-b border-l rounded-bl-lg" style={{ borderColor: "rgba(212,160,23,0.4)" }} />
                <div className="absolute bottom-2 right-2 w-4 h-4 border-b border-r rounded-br-lg" style={{ borderColor: "rgba(212,160,23,0.4)" }} />
                <div className="text-xs uppercase font-black tracking-widest animate-pulse" style={{ color: "rgba(212,160,23,0.3)", fontFamily: "var(--font-serif)" }}>
                    ✦ Loading ✦
                </div>
            </div>
        );
    }

    if (banners.length === 0) return null;

    return (
        <div
            className="relative w-full aspect-[800/240] mb-6 rounded-2xl overflow-hidden group"
            style={{
                border: "1px solid rgba(212,160,23,0.3)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(212,160,23,0.05)",
            }}
        >
            <AnimatePresence mode="wait">
                <motion.div
                    key={banners[index].id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                    className="absolute inset-0 cursor-pointer"
                >
                    <Image
                        src={banners[index].src}
                        alt={banners[index].alt}
                        fill
                        unoptimized
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        priority
                    />
                    {/* Gold vignette overlay */}
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            background: "linear-gradient(to bottom, transparent 40%, rgba(18,6,8,0.6) 100%)",
                        }}
                    />
                </motion.div>
            </AnimatePresence>

            {/* Corner ornaments */}
            <div className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 rounded-tl-xl pointer-events-none z-10" style={{ borderColor: "rgba(212,160,23,0.5)" }} />
            <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 rounded-tr-xl pointer-events-none z-10" style={{ borderColor: "rgba(212,160,23,0.5)" }} />
            <div className="absolute bottom-10 left-2 w-5 h-5 border-b-2 border-l-2 rounded-bl-xl pointer-events-none z-10" style={{ borderColor: "rgba(212,160,23,0.5)" }} />
            <div className="absolute bottom-10 right-2 w-5 h-5 border-b-2 border-r-2 rounded-br-xl pointer-events-none z-10" style={{ borderColor: "rgba(212,160,23,0.5)" }} />

            {/* Navigation Dots */}
            <div
                className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 px-3 py-1.5 rounded-full backdrop-blur-md"
                style={{ background: "rgba(18,6,8,0.7)", border: "1px solid rgba(212,160,23,0.2)" }}
            >
                {banners.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setIndex(i)}
                        className="transition-all duration-300 rounded-full"
                        style={{
                            width: index === i ? "16px" : "6px",
                            height: "6px",
                            background: index === i
                                ? "linear-gradient(90deg, #D4A017, #F5C842)"
                                : "rgba(212,160,23,0.25)",
                            boxShadow: index === i ? "0 0 8px rgba(212,160,23,0.6)" : "none",
                        }}
                    />
                ))}
            </div>

            {/* Gold glow overlay */}
            <div
                className="absolute inset-0 pointer-events-none animate-pulse-glow opacity-20"
                style={{ boxShadow: "inset 0 0 30px rgba(212,160,23,0.15)" }}
            />
        </div>
    );
}
