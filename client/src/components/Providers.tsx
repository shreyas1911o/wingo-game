"use client";

import { AuthProvider } from "@/context/AuthContext";
import { SocketProvider } from "@/context/SocketContext";
import { SoundProvider } from "@/context/SoundContext";
import { ThemeProvider } from "./ThemeProvider";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
            <AuthProvider>
                <SocketProvider>
                    <SoundProvider>
                        {children}
                    </SoundProvider>
                </SocketProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}
