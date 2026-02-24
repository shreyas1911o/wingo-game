"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
    {
        href: "/dashboard",
        label: "Khel",
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
    },
    {
        href: "/wallet",
        label: "Bटua",
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
        ),
    },
    {
        href: "/account",
        label: "Khata",
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
    },
];

export function BottomNav() {
    const pathname = usePathname();
    return (
        <nav
            className="fixed bottom-0 left-0 right-0 z-50"
            style={{
                background: "linear-gradient(to top, #120608 0%, rgba(18,6,8,0.97) 100%)",
                borderTop: "1px solid rgba(212,160,23,0.3)",
                boxShadow: "0 -4px 24px rgba(0,0,0,0.5), 0 -1px 0 rgba(212,160,23,0.1)",
                backdropFilter: "blur(16px)",
            }}
        >
            {/* Top gold accent line */}
            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(212,160,23,0.5), transparent)" }} />

            <div className="flex items-center justify-around max-w-lg mx-auto h-16">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-all duration-300 relative group"
                            style={{
                                color: isActive ? "#D4A017" : "rgba(212,160,23,0.35)",
                            }}
                        >
                            {/* Active indicator background */}
                            {isActive && (
                                <div
                                    className="absolute inset-0 rounded-xl"
                                    style={{ background: "rgba(212,160,23,0.07)", border: "1px solid rgba(212,160,23,0.15)" }}
                                />
                            )}

                            <span
                                className="relative z-10 transition-all duration-300"
                                style={isActive ? {
                                    filter: "drop-shadow(0 0 6px rgba(212,160,23,0.6))",
                                    transform: "translateY(-1px)",
                                } : {}}
                            >
                                {item.icon}
                            </span>
                            <span
                                className="text-[10px] font-bold relative z-10 tracking-wide"
                                style={{ fontFamily: "var(--font-sans)" }}
                            >
                                {item.label}
                            </span>

                            {/* Gold dot indicator */}
                            {isActive && (
                                <span
                                    className="absolute -bottom-0.5 w-5 h-0.5 rounded-full"
                                    style={{ background: "linear-gradient(90deg, transparent, #D4A017, transparent)" }}
                                />
                            )}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
