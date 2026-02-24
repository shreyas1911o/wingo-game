"use client";

import { useCallback } from "react";
import { useSoundContext } from "@/context/SoundContext";

// All sounds generated via Web Audio API — no files required.
export function useSound() {
    const { isMuted, getAudioContext } = useSoundContext();

    const playSound = useCallback((playFn: (ac: AudioContext) => void) => {
        if (isMuted) return;
        try {
            const ac = getAudioContext();
            if (ac) {
                playFn(ac);
            }
        } catch { }
    }, [getAudioContext, isMuted]);

    /** Short high-pitched tick for countdown */
    const playTick = useCallback(() => {
        playSound((ac) => {
            const osc = ac.createOscillator();
            const gain = ac.createGain();
            osc.connect(gain);
            gain.connect(ac.destination);
            osc.type = "sine";
            osc.frequency.setValueAtTime(880, ac.currentTime);
            gain.gain.setValueAtTime(0.18, ac.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.08);
            osc.start(ac.currentTime);
            osc.stop(ac.currentTime + 0.08);
        });
    }, [playSound]);

    /** Urgent double-tick for last 3 seconds */
    const playUrgentTick = useCallback(() => {
        playSound((ac) => {
            [0, 0.1].forEach((offset) => {
                const osc = ac.createOscillator();
                const gain = ac.createGain();
                osc.connect(gain);
                gain.connect(ac.destination);
                osc.type = "square";
                osc.frequency.setValueAtTime(1200, ac.currentTime + offset);
                gain.gain.setValueAtTime(0.12, ac.currentTime + offset);
                gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + offset + 0.07);
                osc.start(ac.currentTime + offset);
                osc.stop(ac.currentTime + offset + 0.07);
            });
        });
    }, [playSound]);

    /** Satisfying "thud" when placing a bet */
    const playBet = useCallback(() => {
        playSound((ac) => {
            // Low thump
            const osc = ac.createOscillator();
            const gain = ac.createGain();
            osc.connect(gain);
            gain.connect(ac.destination);
            osc.type = "sine";
            osc.frequency.setValueAtTime(200, ac.currentTime);
            osc.frequency.exponentialRampToValueAtTime(60, ac.currentTime + 0.15);
            gain.gain.setValueAtTime(0.4, ac.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.2);
            osc.start(ac.currentTime);
            osc.stop(ac.currentTime + 0.2);

            // Confirmation click
            const osc2 = ac.createOscillator();
            const gain2 = ac.createGain();
            osc2.connect(gain2);
            gain2.connect(ac.destination);
            osc2.type = "sine";
            osc2.frequency.setValueAtTime(660, ac.currentTime + 0.05);
            gain2.gain.setValueAtTime(0.15, ac.currentTime + 0.05);
            gain2.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.18);
            osc2.start(ac.currentTime + 0.05);
            osc2.stop(ac.currentTime + 0.18);
        });
    }, [playSound]);

    /** Ascending arpeggio for win / positive result */
    const playWin = useCallback(() => {
        playSound((ac) => {
            const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
            notes.forEach((freq, i) => {
                const osc = ac.createOscillator();
                const gain = ac.createGain();
                osc.connect(gain);
                gain.connect(ac.destination);
                osc.type = "sine";
                osc.frequency.setValueAtTime(freq, ac.currentTime + i * 0.1);
                gain.gain.setValueAtTime(0.22, ac.currentTime + i * 0.1);
                gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + i * 0.1 + 0.25);
                osc.start(ac.currentTime + i * 0.1);
                osc.stop(ac.currentTime + i * 0.1 + 0.25);
            });
        });
    }, [playSound]);

    /** Descending tone for loss */
    const playLoss = useCallback(() => {
        playSound((ac) => {
            const osc = ac.createOscillator();
            const gain = ac.createGain();
            osc.connect(gain);
            gain.connect(ac.destination);
            osc.type = "sawtooth";
            osc.frequency.setValueAtTime(300, ac.currentTime);
            osc.frequency.exponentialRampToValueAtTime(150, ac.currentTime + 0.35);
            gain.gain.setValueAtTime(0.18, ac.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.4);
            osc.start(ac.currentTime);
            osc.stop(ac.currentTime + 0.4);
        });
    }, [playSound]);

    /** Chime for successful deposit */
    const playDeposit = useCallback(() => {
        playSound((ac) => {
            const notes = [784, 1047, 1319]; // G5 C6 E6
            notes.forEach((freq, i) => {
                const osc = ac.createOscillator();
                const gain = ac.createGain();
                osc.connect(gain);
                gain.connect(ac.destination);
                osc.type = "sine";
                osc.frequency.setValueAtTime(freq, ac.currentTime + i * 0.12);
                gain.gain.setValueAtTime(0.2, ac.currentTime + i * 0.12);
                gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + i * 0.12 + 0.3);
                osc.start(ac.currentTime + i * 0.12);
                osc.stop(ac.currentTime + i * 0.12 + 0.3);
            });
        });
    }, [playSound]);

    /** Soft UI click */
    const playClick = useCallback(() => {
        playSound((ac) => {
            const osc = ac.createOscillator();
            const gain = ac.createGain();
            osc.connect(gain);
            gain.connect(ac.destination);
            osc.type = "sine";
            osc.frequency.setValueAtTime(440, ac.currentTime);
            gain.gain.setValueAtTime(0.1, ac.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.06);
            osc.start(ac.currentTime);
            osc.stop(ac.currentTime + 0.06);
        });
    }, [playSound]);

    return { playTick, playUrgentTick, playBet, playWin, playLoss, playDeposit, playClick };
}
