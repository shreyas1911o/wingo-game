import { cn } from "@/lib/utils";

interface GameTimerProps {
    timeRemaining: number;
    totalTime: number;
}

export function GameTimer({ timeRemaining, totalTime }: GameTimerProps) {
    const percentage = (timeRemaining / totalTime) * 100;
    const isUrgent = timeRemaining <= 5;
    const circumference = 2 * Math.PI * 44; // r=44

    return (
        <div className="flex flex-col items-center justify-center w-full max-w-[200px] mb-4">
            {/* Circular dial */}
            <div className="relative w-32 h-32 flex items-center justify-center">
                {/* Outer decorative ring */}
                <div
                    className="absolute inset-0 rounded-full"
                    style={{
                        background: "conic-gradient(from 0deg, rgba(212,160,23,0.08), rgba(212,160,23,0.02), rgba(212,160,23,0.08))",
                        border: "1px solid rgba(212,160,23,0.15)",
                    }}
                />

                {/* SVG progress ring */}
                <svg
                    className="absolute inset-0 w-full h-full -rotate-90"
                    viewBox="0 0 100 100"
                >
                    {/* Track */}
                    <circle
                        cx="50" cy="50" r="44"
                        fill="none"
                        stroke="rgba(212,160,23,0.1)"
                        strokeWidth="5"
                    />
                    {/* Progress arc */}
                    <circle
                        cx="50" cy="50" r="44"
                        fill="none"
                        stroke={isUrgent ? "#B22222" : "#D4A017"}
                        strokeWidth="5"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={circumference - (circumference * percentage) / 100}
                        style={{
                            transition: "stroke-dashoffset 0.9s linear, stroke 0.3s ease",
                            filter: isUrgent
                                ? "drop-shadow(0 0 6px rgba(178,34,34,0.8))"
                                : "drop-shadow(0 0 6px rgba(212,160,23,0.6))",
                        }}
                    />
                </svg>

                {/* Inner time display */}
                <div
                    className={cn(
                        "relative z-10 flex flex-col items-center justify-center w-20 h-20 rounded-full",
                        isUrgent && "animate-pulse"
                    )}
                    style={{
                        background: "radial-gradient(circle, rgba(45,20,8,0.95) 60%, rgba(18,6,8,0.8) 100%)",
                        border: `1px solid ${isUrgent ? "rgba(178,34,34,0.6)" : "rgba(212,160,23,0.2)"}`,
                        boxShadow: isUrgent
                            ? "0 0 20px rgba(178,34,34,0.3), inset 0 1px 0 rgba(255,255,255,0.05)"
                            : "0 0 20px rgba(212,160,23,0.15), inset 0 1px 0 rgba(212,160,23,0.08)",
                    }}
                >
                    <span
                        className="text-2xl font-black font-mono leading-none"
                        style={{ color: isUrgent ? "#E74C3C" : "#D4A017" }}
                    >
                        {timeRemaining}
                    </span>
                    <span
                        className="text-[9px] font-bold uppercase tracking-widest"
                        style={{ color: "rgba(212,160,23,0.5)" }}
                    >
                        sec
                    </span>
                </div>

                {/* Corner lotus dots */}
                {[0, 1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="absolute w-1.5 h-1.5 rounded-full"
                        style={{
                            background: isUrgent ? "#B22222" : "#D4A017",
                            opacity: 0.6,
                            top: i < 2 ? (i === 0 ? "0%" : "calc(50% - 3px)") : "100%",
                            left: i % 2 === 0 ? "calc(50% - 3px)" : (i === 1 ? "0%" : "100%"),
                            transform: "translate(-50%, -50%)",
                        }}
                    />
                ))}
            </div>

            {/* Progress bar */}
            <div
                className="w-full h-1.5 rounded-full mt-4 overflow-hidden"
                style={{ background: "rgba(212,160,23,0.1)", border: "1px solid rgba(212,160,23,0.1)" }}
            >
                <div
                    className="h-full rounded-full transition-all duration-1000 ease-linear"
                    style={{
                        width: `${percentage}%`,
                        background: isUrgent
                            ? "linear-gradient(90deg, #7B241C, #E74C3C)"
                            : "linear-gradient(90deg, #8B6914, #D4A017, #F5C842)",
                        boxShadow: isUrgent ? "0 0 8px rgba(178,34,34,0.5)" : "0 0 8px rgba(212,160,23,0.5)",
                    }}
                />
            </div>
        </div>
    );
}
