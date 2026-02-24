"use client";

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";

interface SoundContextType {
    isMuted: boolean;
    toggleMute: () => void;
    getAudioContext: () => AudioContext | null;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export function SoundProvider({ children }: { children: React.ReactNode }) {
    const [isMuted, setIsMuted] = useState(false);
    const audioContextRef = useRef<AudioContext | null>(null);

    useEffect(() => {
        const saved = localStorage.getItem("wingo_muted");
        if (saved !== null) {
            setIsMuted(saved === "true");
        }
    }, []);

    const getAudioContext = useCallback(() => {
        if (typeof window === "undefined") return null;

        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        if (audioContextRef.current.state === "suspended") {
            audioContextRef.current.resume();
        }

        return audioContextRef.current;
    }, []);

    const toggleMute = () => {
        // Resume context on toggle if it's a user gesture
        getAudioContext();

        setIsMuted((prev) => {
            const newVal = !prev;
            localStorage.setItem("wingo_muted", String(newVal));
            return newVal;
        });
    };

    return (
        <SoundContext.Provider value={{ isMuted, toggleMute, getAudioContext }}>
            {children}
        </SoundContext.Provider>
    );
}

export function useSoundContext() {
    const context = useContext(SoundContext);
    if (context === undefined) {
        throw new Error("useSoundContext must be used within a SoundProvider");
    }
    return context;
}
