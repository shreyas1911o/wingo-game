"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Sun, Moon, Volume2, VolumeX } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const API = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/admin`;

const fmt = (n: number) => "₹" + (n ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (d: string) => new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
const COLOR_MAP: Record<string, string> = { Green: "#00cc7a", Red: "#ff3366", Violet: "#9d00ff" };

const statusBadge = (status: string) => {
    const map: Record<string, string> = {
        active: "bg-green-500/20 text-green-400 border-green-500/30",
        banned: "bg-red-500/20 text-red-400 border-red-500/30",
        suspended: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
        success: "bg-green-500/20 text-green-400 border-green-500/30",
        pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
        failed: "bg-red-500/20 text-red-400 border-red-500/30",
        win: "bg-green-500/20 text-green-400 border-green-500/30",
        loss: "bg-red-500/20 text-red-400 border-red-500/30",
        completed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
        deposit: "bg-blue-500/20 text-blue-400 border-blue-500/30",
        withdraw: "bg-orange-500/20 text-orange-400 border-orange-500/30",
        bet: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    };
    return `px-2 py-0.5 rounded text-xs border font-semibold capitalize ${map[status] ?? "bg-muted/20 text-muted-foreground border-border/30"}`;
};

// ── Components ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, color, sub }: { label: string; value: string | number; icon: string; color: string; sub?: string }) {
    return (
        <div className="rounded-xl p-4 border border-border/30 flex flex-col gap-1" style={{ background: "rgba(15,15,15,0.85)" }}>
            <div className="flex items-center justify-between">
                <span className="text-xl">{icon}</span>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
            </div>
            <p className="text-2xl font-bold mt-1" style={{ color }}>{value}</p>
            {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
        </div>
    );
}

function Pagination({ page, pages, onPage }: { page: number; pages: number; onPage: (p: number) => void }) {
    if (pages <= 1) return null;
    return (
        <div className="flex items-center gap-2 justify-end mt-3">
            <button disabled={page === 1} onClick={() => onPage(page - 1)}
                className="px-3 py-1 rounded text-xs border border-border/30 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors">← Prev</button>
            <span className="text-xs text-muted-foreground">{page} / {pages}</span>
            <button disabled={page === pages} onClick={() => onPage(page + 1)}
                className="px-3 py-1 rounded text-xs border border-border/30 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors">Next →</button>
        </div>
    );
}

function Table({ heads, children, empty }: { heads: string[]; children: React.ReactNode; empty?: boolean }) {
    return (
        <div className="rounded-xl border border-border/30 overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
                <thead>
                    <tr className="bg-muted/10 border-b border-border/20">
                        {heads.map(h => <th key={h} className="text-left px-4 py-3 text-xs text-muted-foreground font-semibold whitespace-nowrap">{h}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {empty ? (
                        <tr><td colSpan={heads.length} className="px-4 py-8 text-center text-muted-foreground text-sm">No data found</td></tr>
                    ) : children}
                </tbody>
            </table>
        </div>
    );
}

// ── Mini Bar Chart (pure CSS) ──────────────────────────────────────────────────
function BarChart({ days, metric, color, label }: { days: any[]; metric: string; color: string; label: string }) {
    const max = Math.max(...days.map(d => d[metric] || 0), 1);
    return (
        <div>
            <p className="text-xs text-muted-foreground font-semibold mb-3 uppercase tracking-wider">{label}</p>
            <div className="flex items-end gap-2 h-24">
                {days.map((d, i) => {
                    const pct = ((d[metric] || 0) / max) * 100;
                    return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                            <div className="relative w-full flex items-end justify-center" style={{ height: "72px" }}>
                                <div title={metric === "revenue" ? fmt(d[metric]) : String(d[metric])}
                                    className="w-full rounded-t-sm transition-all duration-300 group-hover:opacity-80 cursor-help"
                                    style={{ height: `${Math.max(pct, 3)}%`, background: color, minHeight: "3px" }} />
                            </div>
                            <span className="text-xs text-muted-foreground whitespace-nowrap" style={{ fontSize: "9px" }}>{d.date}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function AdminPage() {
    const { user, token, loading, logout } = useAuth();
    const router = useRouter();
    const [tab, setTab] = useState<"overview" | "users" | "bets" | "transactions" | "withdrawals" | "results" | "gamecontrol" | "giftcards" | "banners">("overview");

    const [stats, setStats] = useState<any>(null);
    const [dailyData, setDailyData] = useState<any[]>([]);
    const [topPlayers, setTopPlayers] = useState<any[]>([]);
    const [activity, setActivity] = useState<any[]>([]);

    const [users, setUsers] = useState<any[]>([]);
    const [userSearch, setUserSearch] = useState("");
    const [userPage, setUserPage] = useState(1);
    const [userMeta, setUserMeta] = useState({ total: 0, pages: 1 });
    const [balanceModal, setBalanceModal] = useState<{ userId: string; mobile: string } | null>(null);
    const [balanceAmt, setBalanceAmt] = useState("");
    const [balanceReason, setBalanceReason] = useState("");
    const [userDetail, setUserDetail] = useState<any>(null);

    const [bets, setBets] = useState<any[]>([]);
    const [betPage, setBetPage] = useState(1);
    const [betMeta, setBetMeta] = useState({ total: 0, pages: 1, totals: {} as any });
    const [betFilter, setBetFilter] = useState({ gameType: "", status: "" });

    const [transactions, setTransactions] = useState<any[]>([]);
    const [txPage, setTxPage] = useState(1);
    const [txMeta, setTxMeta] = useState({ total: 0, pages: 1 });
    const [txFilter, setTxFilter] = useState({ type: "", status: "" });

    const [withdrawals, setWithdrawals] = useState<any[]>([]);
    const [wdPage, setWdPage] = useState(1);
    const [wdMeta, setWdMeta] = useState({ total: 0, pages: 1 });
    const { setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    const [results, setResults] = useState<any[]>([]);
    const [resultPage, setResultPage] = useState(1);
    const [resultMeta, setResultMeta] = useState({ total: 0, pages: 1 });
    const [resultFilter, setResultFilter] = useState("");

    const [giftCards, setGiftCards] = useState<any[]>([]);
    const [gcAmount, setGCAmount] = useState("");
    const [gcCount, setGCCount] = useState("1");

    // Banner states
    const [banners, setBanners] = useState<any[]>([]);
    const [bannerForm, setBannerForm] = useState({ id: "", src: "", alt: "", color: "rgba(157, 0, 255, 0.2)", order: "0" });
    const [editingBannerId, setEditingBannerId] = useState<string | null>(null);

    const [actionMsg, setActionMsg] = useState<{ text: string; ok: boolean } | null>(null);
    const [chartMetric, setChartMetric] = useState<"revenue" | "bets" | "newUsers">("revenue");

    // Game control state
    const [liveRounds, setLiveRounds] = useState<any[]>([]);
    const [forceNum, setForceNum] = useState<Record<string, string>>({ "30s": "", "1m": "", "3m": "" });

    const H = useCallback(() => ({ "Content-Type": "application/json", Authorization: `Bearer ${token}` }), [token]);
    const flash = (text: string, ok = true) => { setActionMsg({ text, ok }); setTimeout(() => setActionMsg(null), 3000); };

    // ── fetchers ───────────────────────────────────────────────────────────────
    const fetchStats = useCallback(async () => { const r = await fetch(`${API}/stats`, { headers: H() }); if (r.ok) setStats(await r.json()); }, [H]);
    const fetchDaily = useCallback(async () => { const r = await fetch(`${API}/daily-revenue`, { headers: H() }); if (r.ok) { const d = await r.json(); setDailyData(d.days); } }, [H]);
    const fetchTopPlayers = useCallback(async () => { const r = await fetch(`${API}/top-players`, { headers: H() }); if (r.ok) { const d = await r.json(); setTopPlayers(d.players); } }, [H]);
    const fetchActivity = useCallback(async () => { const r = await fetch(`${API}/activity`, { headers: H() }); if (r.ok) { const d = await r.json(); setActivity(d.events); } }, [H]);
    const fetchLiveRounds = useCallback(async () => { const r = await fetch(`${API}/game/live`, { headers: H() }); if (r.ok) setLiveRounds(await r.json()); }, [H]);

    const fetchUsers = useCallback(async () => {
        const p = new URLSearchParams({ search: userSearch, page: String(userPage), limit: "12" });
        const r = await fetch(`${API}/users?${p}`, { headers: H() });
        if (r.ok) { const d = await r.json(); setUsers(d.users); setUserMeta({ total: d.total, pages: d.pages }); }
    }, [H, userSearch, userPage]);

    const fetchBets = useCallback(async () => {
        const p = new URLSearchParams({ ...betFilter, page: String(betPage), limit: "15" });
        const r = await fetch(`${API}/bets?${p}`, { headers: H() });
        if (r.ok) { const d = await r.json(); setBets(d.bets); setBetMeta({ total: d.total, pages: d.pages, totals: d.totals }); }
    }, [H, betFilter, betPage]);

    const fetchTransactions = useCallback(async () => {
        const p = new URLSearchParams({ ...txFilter, page: String(txPage), limit: "15" });
        const r = await fetch(`${API}/transactions?${p}`, { headers: H() });
        if (r.ok) { const d = await r.json(); setTransactions(d.transactions); setTxMeta({ total: d.total, pages: d.pages }); }
    }, [H, txFilter, txPage]);

    const fetchWithdrawals = useCallback(async () => {
        const p = new URLSearchParams({ type: "withdraw", status: "pending", page: String(wdPage), limit: "15" });
        const r = await fetch(`${API}/transactions?${p}`, { headers: H() });
        if (r.ok) { const d = await r.json(); setWithdrawals(d.transactions); setWdMeta({ total: d.total, pages: d.pages }); }
    }, [H, wdPage]);

    const fetchResults = useCallback(async () => {
        const p = new URLSearchParams({ ...(resultFilter ? { gameType: resultFilter } : {}), page: String(resultPage), limit: "20" });
        const r = await fetch(`${API}/results?${p}`, { headers: H() });
        if (r.ok) { const d = await r.json(); setResults(d.results); setResultMeta({ total: d.total, pages: d.pages }); }
    }, [H, resultFilter, resultPage]);

    const fetchGiftCards = useCallback(async () => {
        const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/giftcard/all`, { headers: H() });
        if (r.ok) setGiftCards(await r.json());
    }, [H]);

    const fetchBanners = useCallback(async () => {
        const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/banners/admin`, { headers: H() });
        if (r.ok) setBanners(await r.json());
    }, [H]);

    const fetchUserDetail = async (id: string) => {
        const r = await fetch(`${API}/users/${id}`, { headers: H() });
        if (r.ok) setUserDetail(await r.json());
    };

    // ── auth guard ─────────────────────────────────────────────────────────────
    useEffect(() => { if (!loading && (!user || !(user as any).isAdmin)) router.push("/dashboard"); }, [user, loading, router]);

    useEffect(() => {
        if (token) { fetchStats(); fetchDaily(); fetchTopPlayers(); fetchActivity(); fetchUsers(); fetchBets(); fetchTransactions(); fetchWithdrawals(); fetchResults(); }
    }, [token]);

    useEffect(() => { if (token) fetchUsers(); }, [userSearch, userPage, token]);
    useEffect(() => { if (token) fetchBets(); }, [betFilter, betPage, token]);
    useEffect(() => { if (token) fetchTransactions(); }, [txFilter, txPage, token]);
    useEffect(() => { if (token) fetchWithdrawals(); }, [wdPage, token]);
    useEffect(() => { if (token) fetchResults(); }, [resultFilter, resultPage, token]);
    useEffect(() => { if (token && tab === "giftcards") fetchGiftCards(); }, [tab, token, fetchGiftCards]);
    useEffect(() => { if (token && tab === "banners") fetchBanners(); }, [tab, token, fetchBanners]);

    // Auto-refresh live rounds while on game control tab
    useEffect(() => {
        if (!token || tab !== "gamecontrol") return;
        fetchLiveRounds();
        const id = setInterval(fetchLiveRounds, 3000);
        return () => clearInterval(id);
    }, [tab, token, fetchLiveRounds]);

    // ── actions ────────────────────────────────────────────────────────────────
    const setUserStatus = async (id: string, status: string) => {
        const r = await fetch(`${API}/users/${id}/status`, { method: "PUT", headers: H(), body: JSON.stringify({ status }) });
        flash(r.ok ? `User ${status}` : "Error", r.ok); fetchUsers(); fetchStats();
    };

    const doAdjustBalance = async () => {
        if (!balanceModal) return;
        const r = await fetch(`${API}/users/${balanceModal.userId}/balance`, {
            method: "PUT", headers: H(),
            body: JSON.stringify({ amount: parseFloat(balanceAmt), reason: balanceReason }),
        });
        flash(r.ok ? `Balance adjusted by ₹${balanceAmt}` : "Error", r.ok);
        setBalanceModal(null); setBalanceAmt(""); setBalanceReason("");
        fetchUsers(); fetchStats();
    };

    const doGenerateGiftCards = async () => {
        const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/giftcard/generate`, {
            method: "POST", headers: H(),
            body: JSON.stringify({ amount: parseFloat(gcAmount), count: parseInt(gcCount) }),
        });
        const d = await r.json();
        flash(r.ok ? d.message : (d.message || "Error"), r.ok);
        if (r.ok) { setGCAmount(""); setGCCount("1"); fetchGiftCards(); }
    };

    const doCreateOrUpdateBanner = async () => {
        const url = editingBannerId
            ? `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/banners/${editingBannerId}`
            : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/banners`;
        const method = editingBannerId ? "PUT" : "POST";

        const r = await fetch(url, {
            method, headers: H(),
            body: JSON.stringify({ ...bannerForm, order: parseInt(bannerForm.order) }),
        });

        if (r.ok) {
            flash(editingBannerId ? "Banner updated" : "Banner created");
            setBannerForm({ id: "", src: "", alt: "", color: "rgba(157, 0, 255, 0.2)", order: "0" });
            setEditingBannerId(null);
            fetchBanners();
        } else {
            flash("Error saving banner", false);
        }
    };

    const toggleBannerStatus = async (id: string, active: boolean) => {
        const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/banners/${id}`, {
            method: "PUT", headers: H(),
            body: JSON.stringify({ active }),
        });
        if (r.ok) { flash("Banner status updated"); fetchBanners(); }
    };

    const deleteBanner = async (id: string) => {
        if (!confirm("Are you sure you want to delete this banner?")) return;
        const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/banners/${id}`, { method: "DELETE", headers: H() });
        if (r.ok) { flash("Banner deleted"); fetchBanners(); }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("image", file);

        try {
            const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/upload`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });
            const d = await r.json();
            if (r.ok) {
                setBannerForm(f => ({ ...f, src: d.url }));
                flash("Image uploaded successfully");
            } else {
                flash(d.message || "Upload failed", false);
            }
        } catch (error) {
            flash("Upload failed", false);
        }
    };

    const txAction = async (id: string, action: "approve" | "reject") => {
        const r = await fetch(`${API}/transactions/${id}/${action}`, { method: "PUT", headers: H() });
        flash(r.ok ? `Withdrawal ${action}d` : "Error", r.ok);
        fetchTransactions(); fetchWithdrawals(); fetchStats();
    };

    // Game control actions
    const gameAction = async (endpoint: string, body: object) => {
        const r = await fetch(`${API}/${endpoint}`, { method: "POST", headers: H(), body: JSON.stringify(body) });
        const d = await r.json();
        flash(r.ok ? d.message : (d.message || "Error"), r.ok);
        fetchLiveRounds();
    };

    const parseDetails = (desc: string) => {
        try {
            if (!desc || !desc.includes("-")) return desc;
            const jsonPart = desc.split("-")[1].trim();
            const data = JSON.parse(jsonPart);
            return data.details || data.accNo || desc;
        } catch { return desc; }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        flash("Copied to clipboard");
    };

    if (loading || !user) return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
        </div>
    );

    const TABS = [
        { id: "overview", label: "📊 Overview" },
        { id: "users", label: "👥 Users" },
        { id: "bets", label: "🎯 Bets" },
        { id: "transactions", label: "💳 Transactions" },
        { id: "withdrawals", label: "⏳ Withdrawals", badge: stats?.pendingWithdrawals > 0 ? stats.pendingWithdrawals : null },
        { id: "giftcards", label: "🎁 Gift Cards" },
        { id: "banners", label: "🖼️ Banners" },
        { id: "results", label: "🎲 Results" },
        { id: "gamecontrol", label: "🎮 Game Control" },
    ] as const;

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Header */}
            <header className="sticky top-0 z-50 border-b border-[var(--color-glass-border)] px-6 py-3 flex items-center justify-between bg-[var(--color-glass-bg)] backdrop-blur-md">
                <div className="flex items-center gap-5">
                    <div className="relative group flex items-center gap-3">
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-full blur opacity-10 group-hover:opacity-25 transition-opacity" />
                        <Image src="/wingo-logo.svg" alt="WINGO Logo" width={36} height={36} className="relative rounded-full shadow-lg" />
                        <div className="flex flex-col">
                            <h1 className="text-lg font-black text-transparent bg-clip-text bg-branding-gradient animate-text-shimmer tracking-tighter uppercase leading-none">
                                WINGO
                            </h1>
                            <span className="text-[9px] font-black tracking-[0.2em] text-red-500 mt-0.5">ADMIN PANEL</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {actionMsg && (
                        <span className={`text-[10px] px-3 py-1 rounded-full border-2 font-black uppercase tracking-wider animate-in fade-in slide-in-from-top-2 duration-300 ${actionMsg.ok ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-red-500/10 border-red-500/30 text-red-400"}`}>
                            {actionMsg.ok ? "✓" : "✗"} {actionMsg.text}
                        </span>
                    )}

                    <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--color-glass-bg)] border border-[var(--color-glass-border)]">
                        <button
                            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                            className="p-2 rounded-lg hover:bg-[var(--color-glass-hover)] text-muted-foreground hover:text-foreground transition-all flex items-center justify-center min-w-[38px]"
                            title="Toggle Theme"
                        >
                            {mounted && (resolvedTheme === 'dark' ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} className="text-blue-500" />)}
                        </button>
                        <div className="w-px h-5 bg-border/20 mx-1" />
                        <button onClick={() => { fetchStats(); fetchDaily(); fetchTopPlayers(); flash("Stats Refreshed"); }}
                            className="p-2 rounded-lg hover:bg-[var(--color-glass-hover)] text-muted-foreground hover:text-primary transition-all" title="Refresh">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M3 21v-5h5" /></svg>
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link href="/dashboard" className="px-4 py-2 rounded-xl text-[10px] font-black bg-[var(--color-glass-bg)] border border-[var(--color-glass-border)] hover:bg-[var(--color-glass-hover)] transition-all uppercase tracking-widest text-muted-foreground hover:text-foreground">
                            Game
                        </Link>
                        <button onClick={logout} className="px-4 py-2 rounded-xl text-[10px] font-black bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-all uppercase tracking-widest">
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 py-6">
                {/* Tab Nav */}
                <div className="flex gap-1 mb-6 p-1 rounded-xl bg-muted/10 border border-border/20 w-fit flex-wrap">
                    {TABS.map(t => (
                        <button key={t.id} onClick={() => setTab(t.id)}
                            className={`relative px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${tab === t.id ? "bg-primary/20 text-primary border border-primary/30" : "text-muted-foreground hover:text-foreground"}`}>
                            {t.label}
                            {"badge" in t && t.badge && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">{t.badge}</span>
                            )}
                        </button>
                    ))}
                </div>

                {/* ══ OVERVIEW ══════════════════════════════════════════════════ */}
                {tab === "overview" && (
                    <div className="space-y-6">
                        {stats ? (
                            <>
                                {/* Stat rows */}
                                <div className="space-y-4">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">👥 Users</p>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        <StatCard label="Total" value={stats.totalUsers} icon="👥" color="#9d00ff" />
                                        <StatCard label="Active" value={stats.activeUsers} icon="✅" color="#00cc7a" />
                                        <StatCard label="Banned" value={stats.bannedUsers} icon="🚫" color="#ef4444" />
                                        <StatCard label="New Today" value={stats.newUsersToday} icon="🆕" color="#3b82f6" />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">💰 Finance</p>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        <StatCard label="Total Revenue" value={fmt(stats.totalRevenue)} icon="💰" color="#ffd700" sub="All deposits" />
                                        <StatCard label="Today" value={fmt(stats.todayRevenue)} icon="📈" color="#00cc7a" sub="Today's deposits" />
                                        <StatCard label="Total Payout" value={fmt(stats.totalPayout)} icon="💸" color="#f59e0b" sub="All winnings" />
                                        <StatCard label="Pending Withdraw" value={fmt(stats.pendingWithdrawAmount)} icon="⏳" color="#ef4444" sub={`${stats.pendingWithdrawals} requests`} />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">🎲 Game</p>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        <StatCard label="Total Bets" value={stats.totalBets} icon="🎯" color="#3b82f6" />
                                        <StatCard label="Bet Volume" value={fmt(stats.totalBetVolume)} icon="🎰" color="#a855f7" />
                                        <StatCard label="Win Rate" value={`${stats.winRate}%`} icon="🏆" color="#00cc7a" sub={`${stats.winBets}W · ${stats.lossBets}L`} />
                                        <StatCard label="House Edge" value={`${stats.houseEdge}%`} icon="🏦" color="#ffd700" sub="Net profit margin" />
                                    </div>
                                </div>

                                {/* 7-day Chart */}
                                {dailyData.length > 0 && (
                                    <div className="rounded-xl border border-border/30 p-5" style={{ background: "rgba(15,15,15,0.85)" }}>
                                        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                                            <p className="text-sm font-bold">📅 Last 7 Days</p>
                                            <div className="flex gap-1">
                                                {(["revenue", "bets", "newUsers"] as const).map(m => (
                                                    <button key={m} onClick={() => setChartMetric(m)}
                                                        className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${chartMetric === m ? "bg-primary/20 text-primary border border-primary/30" : "text-muted-foreground hover:text-foreground"}`}>
                                                        {m === "revenue" ? "💰 Revenue" : m === "bets" ? "🎯 Bets" : "👥 Signups"}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <BarChart days={dailyData} metric={chartMetric} color={chartMetric === "revenue" ? "#ffd700" : chartMetric === "bets" ? "#9d00ff" : "#00cc7a"} label="" />
                                        {/* Data table below bars */}
                                        <div className="mt-4 overflow-x-auto">
                                            <table className="w-full text-xs">
                                                <thead>
                                                    <tr className="border-b border-border/20">
                                                        <th className="text-left py-2 text-muted-foreground font-semibold">Date</th>
                                                        <th className="text-right py-2 text-muted-foreground font-semibold">Revenue</th>
                                                        <th className="text-right py-2 text-muted-foreground font-semibold">Bets</th>
                                                        <th className="text-right py-2 text-muted-foreground font-semibold">Bet Volume</th>
                                                        <th className="text-right py-2 text-muted-foreground font-semibold">New Users</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {dailyData.map((d, i) => (
                                                        <tr key={i} className="border-b border-border/10">
                                                            <td className="py-1.5 text-muted-foreground">{d.date}</td>
                                                            <td className="py-1.5 text-right text-yellow-400 font-semibold">{fmt(d.revenue)}</td>
                                                            <td className="py-1.5 text-right">{d.bets}</td>
                                                            <td className="py-1.5 text-right text-purple-400">{fmt(d.betVolume)}</td>
                                                            <td className="py-1.5 text-right text-green-400">{d.newUsers}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {/* Top Players */}
                                    <div className="rounded-xl border border-border/30 p-5" style={{ background: "rgba(15,15,15,0.85)" }}>
                                        <p className="text-sm font-bold mb-4">🏆 Top Players by Balance</p>
                                        <div className="space-y-2">
                                            {topPlayers.slice(0, 8).map((p, i) => (
                                                <div key={p._id} className="flex items-center gap-3 px-3 py-2 rounded-lg" style={{ background: i < 3 ? "rgba(255,215,0,0.05)" : "rgba(255,255,255,0.02)" }}>
                                                    <span className="text-sm font-bold w-6" style={{ color: i === 0 ? "#ffd700" : i === 1 ? "#c0c0c0" : i === 2 ? "#cd7f32" : "#555" }}>
                                                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                                                    </span>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-mono truncate">{p.mobile}</p>
                                                        <p className="text-xs text-muted-foreground">{p.totalBets} bets · {p.wins}W</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-bold text-green-400">{fmt(p.walletBalance)}</p>
                                                        <p className="text-xs text-muted-foreground">Won: {fmt(p.totalWon)}</p>
                                                    </div>
                                                </div>
                                            ))}
                                            {topPlayers.length === 0 && <p className="text-center text-muted-foreground text-sm py-4">No players yet</p>}
                                        </div>
                                    </div>

                                    {/* Recent Activity Feed */}
                                    <div className="rounded-xl border border-border/30 p-5" style={{ background: "rgba(15,15,15,0.85)" }}>
                                        <p className="text-sm font-bold mb-4">⚡ Live Activity</p>
                                        <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                                            {activity.map((ev, i) => (
                                                <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-muted/5 text-xs">
                                                    <span className={statusBadge(ev.type)}>{ev.type}</span>
                                                    <span className="font-mono text-muted-foreground truncate flex-1">{ev.mobile ?? "—"}</span>
                                                    {ev.type === "bet" && (
                                                        <span className="font-bold" style={{ color: COLOR_MAP[ev.selection] ?? "#e0e0e0" }}>{ev.selection}</span>
                                                    )}
                                                    <span className={`font-semibold ${ev.type === "deposit" ? "text-green-400" : ev.type === "withdraw" ? "text-red-400" : ev.status === "win" ? "text-green-400" : "text-foreground"}`}>
                                                        {fmt(ev.amount)}
                                                    </span>
                                                    {ev.status && <span className={statusBadge(ev.status)}>{ev.status}</span>}
                                                    <span className="text-muted-foreground whitespace-nowrap">{fmtDate(ev.time)}</span>
                                                </div>
                                            ))}
                                            {activity.length === 0 && <p className="text-center text-muted-foreground py-6 text-sm">No recent activity</p>}
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center justify-center py-24">
                                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary" />
                            </div>
                        )}
                    </div>
                )}

                {/* ══ USERS ═════════════════════════════════════════════════════ */}
                {tab === "users" && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 flex-wrap">
                            <input placeholder="Search by mobile..." value={userSearch}
                                onChange={e => { setUserSearch(e.target.value); setUserPage(1); }}
                                className="px-3 py-2 rounded-lg bg-muted/10 border border-border/40 text-sm w-64 focus:border-primary outline-none" />
                            <span className="text-xs text-muted-foreground">{userMeta.total} users total</span>
                        </div>
                        <Table heads={["Rank", "Mobile", "Balance", "VIP", "Referral", "Status", "Joined", "Actions"]} empty={users.length === 0}>
                            {users.map((u, i) => (
                                <tr key={u._id} className="border-b border-border/10 hover:bg-muted/5 transition-colors">
                                    <td className="px-4 py-3 text-xs text-muted-foreground">#{((userPage - 1) * 12) + i + 1}</td>
                                    <td className="px-4 py-3">
                                        <button onClick={() => fetchUserDetail(u._id)} className="font-mono text-xs text-primary hover:underline">{u.mobile}</button>
                                    </td>
                                    <td className="px-4 py-3 text-green-400 font-bold text-sm">{fmt(u.walletBalance)}</td>
                                    <td className="px-4 py-3 text-yellow-400 text-sm">⭐ {u.vipLevel}</td>
                                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{u.referralCode}</td>
                                    <td className="px-4 py-3"><span className={statusBadge(u.status)}>{u.status}</span></td>
                                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{fmtDate(u.createdAt)}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-1.5">
                                            {u.status !== "banned"
                                                ? <button onClick={() => setUserStatus(u._id, "banned")} className="px-2 py-1 rounded text-xs bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-colors">Ban</button>
                                                : <button onClick={() => setUserStatus(u._id, "active")} className="px-2 py-1 rounded text-xs bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500/20 transition-colors">Unban</button>
                                            }
                                            <button onClick={() => setBalanceModal({ userId: u._id, mobile: u.mobile })} className="px-2 py-1 rounded text-xs bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 transition-colors">₹</button>
                                            <button onClick={() => fetchUserDetail(u._id)} className="px-2 py-1 rounded text-xs bg-muted/10 text-muted-foreground border border-border/30 hover:text-foreground transition-colors">👁</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </Table>
                        <Pagination page={userPage} pages={userMeta.pages} onPage={setUserPage} />
                    </div>
                )}

                {/* ══ BETS ══════════════════════════════════════════════════════ */}
                {tab === "bets" && (
                    <div className="space-y-4">
                        <div className="flex gap-3 flex-wrap items-center">
                            <select value={betFilter.gameType} onChange={e => { setBetFilter(f => ({ ...f, gameType: e.target.value })); setBetPage(1); }}
                                className="px-3 py-2 rounded-lg bg-muted/10 border border-border/40 text-sm focus:border-primary outline-none">
                                <option value="">All Types</option>
                                <option value="30s">30s Turbo</option>
                                <option value="1m">1 Min</option>
                                <option value="3m">3 Min</option>
                            </select>
                            <select value={betFilter.status} onChange={e => { setBetFilter(f => ({ ...f, status: e.target.value })); setBetPage(1); }}
                                className="px-3 py-2 rounded-lg bg-muted/10 border border-border/40 text-sm focus:border-primary outline-none">
                                <option value="">All Statuses</option>
                                <option value="win">Win</option>
                                <option value="loss">Loss</option>
                                <option value="pending">Pending</option>
                            </select>
                            <span className="text-xs text-muted-foreground">{betMeta.total} bets</span>
                            {betMeta.totals?.totalAmount > 0 && (
                                <div className="flex gap-3 ml-auto flex-wrap">
                                    <span className="text-xs px-3 py-1 rounded-full bg-muted/10 border border-border/30">Vol: <span className="text-primary font-bold">{fmt(betMeta.totals.totalAmount)}</span></span>
                                    <span className="text-xs px-3 py-1 rounded-full bg-muted/10 border border-border/30">Payout: <span className="text-green-400 font-bold">{fmt(betMeta.totals.totalWin)}</span></span>
                                    <span className="text-xs px-3 py-1 rounded-full bg-muted/10 border border-border/30">Profit: <span className="text-yellow-400 font-bold">{fmt((betMeta.totals.totalAmount || 0) - (betMeta.totals.totalWin || 0))}</span></span>
                                </div>
                            )}
                        </div>
                        <Table heads={["User", "Period", "Type", "Selection", "Amount", "After Tax", "Win", "Status", "Time"]} empty={bets.length === 0}>
                            {bets.map((b: any) => (
                                <tr key={b._id} className="border-b border-border/10 hover:bg-muted/5 transition-colors">
                                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{b.userId?.mobile ?? "—"}</td>
                                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground truncate max-w-[90px]" title={b.periodId}>{b.periodId?.slice(-8)}</td>
                                    <td className="px-4 py-3 text-xs uppercase tracking-wider">{b.gameType}</td>
                                    <td className="px-4 py-3 font-bold text-sm" style={{ color: COLOR_MAP[b.selection] ?? (["Big", "Small"].includes(b.selection) ? "#f59e0b" : "#e0e0e0") }}>{b.selection}</td>
                                    <td className="px-4 py-3 font-semibold text-sm">{fmt(b.amount)}</td>
                                    <td className="px-4 py-3 text-xs text-muted-foreground">{fmt(b.afterTaxAmount)}</td>
                                    <td className="px-4 py-3 text-green-400 font-semibold text-sm">{b.winAmount > 0 ? fmt(b.winAmount) : "—"}</td>
                                    <td className="px-4 py-3"><span className={statusBadge(b.status)}>{b.status}</span></td>
                                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{fmtDate(b.createdAt)}</td>
                                </tr>
                            ))}
                        </Table>
                        <Pagination page={betPage} pages={betMeta.pages} onPage={setBetPage} />
                    </div>
                )}

                {/* ══ TRANSACTIONS ══════════════════════════════════════════════ */}
                {tab === "transactions" && (
                    <div className="space-y-4">
                        <div className="flex gap-3 flex-wrap items-center">
                            <select value={txFilter.type} onChange={e => { setTxFilter(f => ({ ...f, type: e.target.value })); setTxPage(1); }}
                                className="px-3 py-2 rounded-lg bg-muted/10 border border-border/40 text-sm focus:border-primary outline-none">
                                <option value="">All Types</option>
                                <option value="deposit">Deposit</option>
                                <option value="withdraw">Withdraw</option>
                                <option value="win">Win</option>
                                <option value="bet">Bet</option>
                                <option value="bonus">Bonus</option>
                            </select>
                            <select value={txFilter.status} onChange={e => { setTxFilter(f => ({ ...f, status: e.target.value })); setTxPage(1); }}
                                className="px-3 py-2 rounded-lg bg-muted/10 border border-border/40 text-sm focus:border-primary outline-none">
                                <option value="">All Statuses</option>
                                <option value="success">Success</option>
                                <option value="pending">Pending</option>
                                <option value="failed">Failed</option>
                            </select>
                            <span className="text-xs text-muted-foreground">{txMeta.total} transactions</span>
                        </div>
                        <Table heads={["User", "Type", "Amount", "Status", "Description", "Date", "Actions"]} empty={transactions.length === 0}>
                            {transactions.map((tx: any) => {
                                const isCr = ["deposit", "win", "bonus"].includes(tx.type);
                                return (
                                    <tr key={tx._id} className="border-b border-border/10 hover:bg-muted/5 transition-colors">
                                        <td className="px-4 py-3 font-mono text-xs">{tx.userId?.mobile ?? "—"}</td>
                                        <td className="px-4 py-3"><span className={statusBadge(tx.type)}>{tx.type}</span></td>
                                        <td className={`px-4 py-3 font-bold text-sm ${isCr ? "text-green-400" : "text-red-400"}`}>{isCr ? "+" : "−"}{fmt(tx.amount)}</td>
                                        <td className="px-4 py-3"><span className={statusBadge(tx.status)}>{tx.status}</span></td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-xs text-muted-foreground max-w-[200px] truncate" title={tx.description}>{tx.description}</span>
                                                {tx.type === "withdraw" && (
                                                    <span className="text-[10px] font-mono bg-muted/20 px-1 py-0.5 rounded w-fit">{parseDetails(tx.description)}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{fmtDate(tx.createdAt)}</td>
                                        <td className="px-4 py-3">
                                            {tx.type === "withdraw" && tx.status === "pending" && (
                                                <div className="flex gap-1.5">
                                                    <button onClick={() => txAction(tx._id, "approve")} className="px-2 py-1 rounded text-xs bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500/20 transition-colors">✓</button>
                                                    <button onClick={() => txAction(tx._id, "reject")} className="px-2 py-1 rounded text-xs bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-colors">✗</button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </Table>
                        <Pagination page={txPage} pages={txMeta.pages} onPage={setTxPage} />
                    </div>
                )}

                {/* ══ WITHDRAWALS ═══════════════════════════════════════════════ */}
                {tab === "withdrawals" && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between flex-wrap gap-3">
                            <div>
                                <p className="text-sm font-bold">Pending Withdrawal Requests</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{wdMeta.total} awaiting approval · Total: {fmt(stats?.pendingWithdrawAmount || 0)}</p>
                            </div>
                            {stats?.pendingWithdrawals === 0 && (
                                <span className="text-xs px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 font-semibold">✓ All clear</span>
                            )}
                        </div>
                        <Table heads={["User", "Amount", "Details", "Status", "Requested", "Actions"]} empty={withdrawals.length === 0}>
                            {withdrawals.map((tx: any) => {
                                const details = parseDetails(tx.description);
                                return (
                                    <tr key={tx._id} className="border-b border-border/10 hover:bg-muted/5 transition-colors">
                                        <td className="px-4 py-3 font-mono text-xs">{tx.userId?.mobile ?? "—"}</td>
                                        <td className="px-4 py-3 text-red-400 font-bold text-lg">−{fmt(tx.amount)}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs bg-muted/20 px-2 py-1 rounded font-mono truncate max-w-[150px]" title={details}>{details}</span>
                                                <button onClick={() => copyToClipboard(details)} className="p-1 hover:text-primary transition-colors text-muted-foreground">📋</button>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3"><span className={statusBadge(tx.status)}>{tx.status}</span></td>
                                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{fmtDate(tx.createdAt)}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2">
                                                <button onClick={() => txAction(tx._id, "approve")}
                                                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500/20 transition-colors">
                                                    ✓ Approve
                                                </button>
                                                <button onClick={() => txAction(tx._id, "reject")}
                                                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-colors">
                                                    ✗ Reject & Refund
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </Table>
                        <Pagination page={wdPage} pages={wdMeta.pages} onPage={setWdPage} />
                    </div>
                )}

                {/* ══ GIFT CARDS ═══════════════════════════════════════════════ */}
                {tab === "giftcards" && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <div>
                                <p className="text-sm font-bold">🎁 Gift Card Management</p>
                                <p className="text-xs text-muted-foreground mt-0.5">Generate promo codes for user bonus balance</p>
                            </div>
                        </div>

                        {/* Generation Form */}
                        <div className="p-5 rounded-xl border border-primary/20 bg-primary/5 space-y-4">
                            <p className="text-xs font-bold uppercase tracking-widest text-primary">Generate New Codes</p>
                            <div className="flex gap-4 items-end flex-wrap">
                                <div className="space-y-1.5 flex-1 min-w-[200px]">
                                    <label className="text-[10px] text-muted-foreground uppercase font-bold">Amount (₹)</label>
                                    <input
                                        type="number"
                                        placeholder="Amount"
                                        value={gcAmount}
                                        onChange={(e) => setGCAmount(e.target.value)}
                                        className="w-full bg-background border border-border/40 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-colors"
                                    />
                                </div>
                                <div className="space-y-1.5 w-32">
                                    <label className="text-[10px] text-muted-foreground uppercase font-bold">Count</label>
                                    <input
                                        type="number"
                                        placeholder="1"
                                        value={gcCount}
                                        onChange={(e) => setGCCount(e.target.value)}
                                        className="w-full bg-background border border-border/40 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-colors"
                                    />
                                </div>
                                <Button onClick={doGenerateGiftCards} className="bg-primary hover:bg-primary/80 font-bold px-8 h-10">
                                    GENERATE CODES
                                </Button>
                            </div>
                        </div>

                        {/* Gift Cards Table */}
                        <Table heads={["Code", "Amount", "Status", "Used By", "Redeemed At", "Created"]} empty={giftCards.length === 0}>
                            {giftCards.map((gc: any) => (
                                <tr key={gc._id} className="border-b border-border/10 hover:bg-muted/5 transition-colors">
                                    <td className="px-4 py-3 font-mono text-sm font-bold text-secondary">{gc.code}</td>
                                    <td className="px-4 py-3 font-bold text-sm text-yellow-400">{fmt(gc.amount)}</td>
                                    <td className="px-4 py-3">
                                        <span className={cn(
                                            "px-2 py-0.5 rounded text-[10px] font-bold border uppercase",
                                            gc.isUsed ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-green-500/10 text-green-400 border-green-500/20"
                                        )}>
                                            {gc.isUsed ? "Redeemed" : "Available"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 font-mono text-xs">
                                        {gc.usedBy?.mobile || "—"}
                                    </td>
                                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                                        {gc.usedAt ? fmtDate(gc.usedAt) : "—"}
                                    </td>
                                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                                        {fmtDate(gc.createdAt)}
                                    </td>
                                </tr>
                            ))}
                        </Table>
                    </div>
                )}
                {tab === "banners" && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                            <div>
                                <p className="text-base font-bold">🖼️ Banner Management</p>
                                <p className="text-xs text-muted-foreground mt-0.5">Manage banners shown in the dashboard slider</p>
                            </div>
                        </div>

                        {/* Add/Edit Form */}
                        <div className="p-5 rounded-2xl border border-border/20 bg-muted/5 space-y-4">
                            <p className="text-xs font-black uppercase tracking-widest text-primary/80">
                                {editingBannerId ? "Edit Banner" : "Create New Banner"}
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">Unique ID</label>
                                    <input placeholder="e.g. holiday-promo" value={bannerForm.id}
                                        onChange={e => setBannerForm(f => ({ ...f, id: e.target.value }))}
                                        className="w-full px-3 py-2 rounded-lg bg-black/40 border border-border/40 text-sm focus:border-primary outline-none" />
                                </div>
                                <div className="space-y-1.5 ">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">Image Source (URL/Path)</label>
                                    <div className="flex gap-2">
                                        <input placeholder="e.g. /promo-banner.svg" value={bannerForm.src}
                                            onChange={e => setBannerForm(f => ({ ...f, src: e.target.value }))}
                                            className="flex-1 px-3 py-2 rounded-lg bg-black/40 border border-border/40 text-sm focus:border-primary outline-none" />
                                        <label className="flex items-center justify-center p-2 rounded-lg bg-primary/10 border border-primary/30 cursor-pointer hover:bg-primary/20 transition-all text-sm" title="Upload Image">
                                            📤
                                            <input type="file" className="hidden" accept="image/*" onChange={handleUpload} />
                                        </label>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">Alt Text</label>
                                    <input placeholder="e.g. Holiday Special" value={bannerForm.alt}
                                        onChange={e => setBannerForm(f => ({ ...f, alt: e.target.value }))}
                                        className="w-full px-3 py-2 rounded-lg bg-black/40 border border-border/40 text-sm focus:border-primary outline-none" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">Accent Color (CSS)</label>
                                    <input placeholder="e.g. rgba(157, 0, 255, 0.2)" value={bannerForm.color}
                                        onChange={e => setBannerForm(f => ({ ...f, color: e.target.value }))}
                                        className="w-full px-3 py-2 rounded-lg bg-black/40 border border-border/40 text-sm focus:border-primary outline-none" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">Display Order</label>
                                    <input type="number" placeholder="0" value={bannerForm.order}
                                        onChange={e => setBannerForm(f => ({ ...f, order: e.target.value }))}
                                        className="w-full px-3 py-2 rounded-lg bg-black/40 border border-border/40 text-sm focus:border-primary outline-none" />
                                </div>
                                <div className="flex items-end gap-2">
                                    <button onClick={doCreateOrUpdateBanner} className="flex-1 h-10 rounded-lg text-sm font-bold text-white bg-primary hover:bg-primary/80 transition-all uppercase tracking-tighter shadow-lg shadow-primary/20">
                                        {editingBannerId ? "Update Banner" : "Add Banner"}
                                    </button>
                                    {editingBannerId && (
                                        <button onClick={() => { setEditingBannerId(null); setBannerForm({ id: "", src: "", alt: "", color: "rgba(157, 0, 255, 0.2)", order: "0" }); }}
                                            className="h-10 px-4 rounded-lg text-sm font-bold border border-border/40 text-muted-foreground hover:text-foreground">Cancel</button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* List */}
                        <Table heads={["Order", "Preview", "ID / Alt", "Status", "Actions"]} empty={banners.length === 0}>
                            {banners.map((b: any) => (
                                <tr key={b._id} className="border-b border-border/10 hover:bg-muted/5 transition-colors">
                                    <td className="px-4 py-4 text-sm font-mono text-muted-foreground">{b.order}</td>
                                    <td className="px-4 py-4">
                                        <div className="w-32 aspect-[800/240] rounded-md overflow-hidden relative border border-white/10 bg-black/40">
                                            <Image src={b.src} alt={b.alt} fill className="object-cover" unoptimized />
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <p className="font-bold text-sm tracking-tight">{b.id}</p>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{b.alt}</p>
                                    </td>
                                    <td className="px-4 py-4">
                                        <button onClick={() => toggleBannerStatus(b._id, !b.active)}
                                            className={cn(
                                                "px-2 py-0.5 rounded text-[10px] font-black border uppercase tracking-widest transition-all",
                                                b.active ? "bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20" : "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20"
                                            )}>
                                            {b.active ? "Active" : "Inactive"}
                                        </button>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex gap-2">
                                            <button onClick={() => { setEditingBannerId(b._id); setBannerForm({ id: b.id, src: b.src, alt: b.alt, color: b.color, order: String(b.order) }); }}
                                                className="p-1.5 rounded-md bg-white/5 border border-white/10 text-muted-foreground hover:text-primary transition-all">✏️</button>
                                            <button onClick={() => deleteBanner(b._id)}
                                                className="p-1.5 rounded-md bg-white/5 border border-white/10 text-muted-foreground hover:text-red-400 transition-all">🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </Table>
                    </div>
                )}
                {tab === "results" && (
                    <div className="space-y-4">
                        <div className="flex gap-3 items-center flex-wrap">
                            <select value={resultFilter} onChange={e => { setResultFilter(e.target.value); setResultPage(1); }}
                                className="px-3 py-2 rounded-lg bg-muted/10 border border-border/40 text-sm focus:border-primary outline-none">
                                <option value="">All Types</option>
                                <option value="30s">30s Turbo</option>
                                <option value="1m">1 Min</option>
                                <option value="3m">3 Min</option>
                            </select>
                            <span className="text-xs text-muted-foreground">{resultMeta.total} completed rounds</span>
                        </div>
                        <Table heads={["Period", "Type", "#", "Color", "Size", "Price", "End Time"]} empty={results.length === 0}>
                            {results.map((r: any) => (
                                <tr key={r._id} className="border-b border-border/10 hover:bg-muted/5 transition-colors">
                                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{r.periodId?.slice(-10)}</td>
                                    <td className="px-4 py-3 text-xs uppercase tracking-wider">{r.gameType}</td>
                                    <td className="px-4 py-3">
                                        <span className="w-7 h-7 rounded-full inline-flex items-center justify-center text-xs font-bold text-white"
                                            style={{ background: COLOR_MAP[r.resultColor] ?? "#666" }}>{r.resultNumber}</span>
                                    </td>
                                    <td className="px-4 py-3 font-bold text-sm" style={{ color: COLOR_MAP[r.resultColor] ?? "#a3a3a3" }}>{r.resultColor}</td>
                                    <td className="px-4 py-3 text-sm">{r.resultSize}</td>
                                    <td className="px-4 py-3 text-xs text-muted-foreground">{r.price?.toFixed(2) ?? "—"}</td>
                                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{fmtDate(r.endTime || r.createdAt)}</td>
                                </tr>
                            ))}
                        </Table>
                        <Pagination page={resultPage} pages={resultMeta.pages} onPage={setResultPage} />
                    </div>
                )}

                {/* ══ GAME CONTROL ═══════════════════════════════════════════════ */}
                {tab === "gamecontrol" && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between flex-wrap gap-3">
                            <div>
                                <p className="text-base font-bold">🎮 Live Game Control</p>
                                <p className="text-xs text-muted-foreground mt-0.5">Auto-refreshes every 3s · Changes take effect on next round end</p>
                            </div>
                            <button onClick={fetchLiveRounds} className="text-xs text-muted-foreground hover:text-primary transition-colors">🔄 Refresh now</button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            {(["30s", "1m", "3m"] as const).map((gt) => {
                                const round = liveRounds.find((r: any) => r.gameType === gt);
                                const pct = round ? Math.max(0, Math.min(100, (round.timeRemaining / round.totalDuration) * 100)) : 0;
                                const forced = round?.forcedResult;
                                const cm: Record<string, string> = { Green: "#00cc7a", Red: "#ff3366", Violet: "#9d00ff" };
                                return (
                                    <div key={gt} className="rounded-xl border p-5 space-y-4 flex flex-col"
                                        style={{ background: "rgba(10,10,10,0.9)", borderColor: round?.paused ? "#f59e0b50" : "#ffffff15" }}>

                                        {/* Header */}
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-base font-black uppercase tracking-wider">
                                                    {gt === "30s" ? "⚡ 30s Turbo" : gt === "1m" ? "⏱ 1 Minute" : "🕐 3 Minute"}
                                                </p>
                                                <p className="font-mono text-xs text-muted-foreground mt-0.5">
                                                    {round?.periodId ? `#${round.periodId.slice(-8)}` : "Loading..."}
                                                </p>
                                            </div>
                                            <span className={`text-xs px-2 py-1 rounded-full font-bold border ${round?.paused
                                                ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                                                : "bg-green-500/20 text-green-400 border-green-500/30"
                                                }`}>{round?.paused ? "⏸ PAUSED" : "▶ LIVE"}</span>
                                        </div>

                                        {/* Timer bar */}
                                        <div>
                                            <div className="flex items-center justify-between text-xs mb-1.5">
                                                <span className="text-muted-foreground">Time Remaining</span>
                                                <span className={`font-mono font-bold text-lg ${round?.timeRemaining <= 5 ? "text-red-400" :
                                                    round?.timeRemaining <= 10 ? "text-yellow-400" : "text-foreground"
                                                    }`}>{round?.timeRemaining ?? "—"}s</span>
                                            </div>
                                            <div className="w-full h-2 bg-muted/20 rounded-full overflow-hidden">
                                                <div className="h-full rounded-full transition-all duration-1000"
                                                    style={{
                                                        width: `${pct}%`,
                                                        background: pct > 40 ? "#00cc7a" : pct > 15 ? "#f59e0b" : "#ef4444"
                                                    }} />
                                            </div>
                                        </div>

                                        {/* Bet stats */}
                                        <div className="grid grid-cols-2 gap-2 text-[10px] font-bold uppercase tracking-wider">
                                            <div className="bg-primary/5 rounded-xl p-2.5 border border-primary/20 flex flex-col items-center gap-1 group overflow-hidden relative">
                                                <div className="absolute top-0 right-0 p-1 opacity-20"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg></div>
                                                <p className="text-muted-foreground">Live Bets</p>
                                                <p className="text-base font-black text-primary">{round?.betCount ?? 0}</p>
                                            </div>
                                            <div className="bg-yellow-500/5 rounded-xl p-2.5 border border-yellow-500/20 flex flex-col items-center gap-1 group overflow-hidden relative">
                                                <div className="absolute top-0 right-0 p-1 opacity-20"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg></div>
                                                <p className="text-muted-foreground">Net Volume</p>
                                                <p className="text-base font-black text-yellow-400">{fmt(round?.betVolume ?? 0)}</p>
                                            </div>
                                        </div>

                                        {/* Forced result indicator */}
                                        {forced && (
                                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
                                                style={{ background: `${cm[forced.color]}18`, border: `1px solid ${cm[forced.color]}40` }}>
                                                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-white"
                                                    style={{ background: cm[forced.color] }}>{forced.number}</span>
                                                <span className="font-bold" style={{ color: cm[forced.color] }}>{forced.color}</span>
                                                <span className="text-muted-foreground">locked for next result</span>
                                                <button onClick={() => gameAction("game/clear-force", { gameType: gt })}
                                                    className="ml-auto text-red-400 hover:text-red-300 transition-colors">✕ Clear</button>
                                            </div>
                                        )}

                                        {/* Pause / Resume + Force End */}
                                        <div className="flex gap-2">
                                            {!round?.paused ? (
                                                <button onClick={() => gameAction("game/pause", { gameType: gt })}
                                                    className="flex-1 py-2 rounded-lg text-xs font-bold border bg-yellow-500/10 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/20 transition-colors">
                                                    ⏸ Pause Timer
                                                </button>
                                            ) : (
                                                <button onClick={() => gameAction("game/resume", { gameType: gt })}
                                                    className="flex-1 py-2 rounded-lg text-xs font-bold border bg-green-500/10 text-green-400 border-green-500/30 hover:bg-green-500/20 transition-colors">
                                                    ▶ Resume Timer
                                                </button>
                                            )}
                                            <button onClick={() => { if (window.confirm(`Force-end the ${gt} round NOW?`)) gameAction("game/force-end", { gameType: gt }); }}
                                                className="py-2 px-3 rounded-lg text-xs font-bold border bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20 transition-colors">
                                                ⚡ End Now
                                            </button>
                                        </div>

                                        {/* Force Result Picker */}
                                        <div>
                                            <p className="text-xs text-muted-foreground font-semibold mb-2 uppercase tracking-wider">🎯 Force Next Result</p>
                                            <div className="grid grid-cols-5 gap-1.5 mb-3">
                                                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => {
                                                    const c = (n === 0 || n === 5) ? "Violet" : [1, 3, 7, 9].includes(n) ? "Green" : "Red";
                                                    const sel = forceNum[gt] === String(n);
                                                    return (
                                                        <button key={n}
                                                            onClick={() => setForceNum(f => ({ ...f, [gt]: sel ? "" : String(n) }))}
                                                            className="h-9 rounded-lg text-sm font-black text-white transition-all duration-150 border-2"
                                                            style={{
                                                                background: sel ? cm[c] : `${cm[c]}25`,
                                                                borderColor: sel ? cm[c] : "transparent",
                                                                transform: sel ? "scale(1.1)" : "scale(1)",
                                                            }}>{n}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            {forceNum[gt] !== "" && (
                                                <button onClick={() => {
                                                    gameAction("game/force-result", { gameType: gt, number: Number(forceNum[gt]) });
                                                    setForceNum(f => ({ ...f, [gt]: "" }));
                                                }}
                                                    className="w-full py-2 rounded-lg text-xs font-bold text-white transition-colors"
                                                    style={{ background: "linear-gradient(135deg,#9d00ff,#ff3366)" }}>
                                                    🔒 Lock #{forceNum[gt]} as Next Result
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Legend */}
                        <div className="rounded-xl border border-border/30 p-4" style={{ background: "rgba(10,10,10,0.85)" }}>
                            <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">📖 Color Guide & Payouts</p>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
                                {[
                                    { n: "0", c: "Violet", pay: "4.5× avg", sub: "Red+Violet" },
                                    { n: "1,3,7,9", c: "Green", pay: "2×", sub: "Standard" },
                                    { n: "2,4,6,8", c: "Red", pay: "2×", sub: "Standard" },
                                    { n: "5", c: "Violet", pay: "4.5× avg", sub: "Green+Violet" },
                                    { n: "0–4", c: "Red", pay: "2×", sub: "Small label" },
                                ].map(row => (
                                    <div key={row.n} className="rounded-lg p-2 border border-border/20 bg-muted/5">
                                        <p className="font-black text-lg" style={{ color: COLOR_MAP[row.c] ?? "#e0e0e0" }}>{row.n}</p>
                                        <p className="font-bold" style={{ color: COLOR_MAP[row.c] }}>{row.c}</p>
                                        <p className="text-muted-foreground">{row.pay}</p>
                                        <p className="text-muted-foreground" style={{ fontSize: "10px" }}>{row.sub}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Balance Adjust Modal ───────────────────────────────────────── */}
            {balanceModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div className="rounded-2xl p-6 w-80 border border-border/40" style={{ background: "rgba(8,8,8,0.98)" }}>
                        <h3 className="text-base font-bold mb-1">Adjust Balance</h3>
                        <p className="text-xs text-muted-foreground mb-4 font-mono">{balanceModal.mobile}</p>
                        <input type="number" placeholder="Amount (+ add / − deduct)" value={balanceAmt}
                            onChange={e => setBalanceAmt(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-muted/10 border border-border/40 text-sm mb-3 focus:border-primary outline-none" />
                        <input placeholder="Reason (optional)" value={balanceReason}
                            onChange={e => setBalanceReason(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-muted/10 border border-border/40 text-sm mb-4 focus:border-primary outline-none" />
                        <div className="flex gap-3">
                            <button onClick={() => setBalanceModal(null)} className="flex-1 py-2 rounded-lg text-sm border border-border/40 text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
                            <button onClick={doAdjustBalance} className="flex-1 py-2 rounded-lg text-sm font-bold text-white" style={{ background: "linear-gradient(135deg,#9d00ff,#6600cc)" }}>Confirm</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── User Detail Modal ──────────────────────────────────────────── */}
            {userDetail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="rounded-2xl w-full max-w-2xl border border-border/40 max-h-[90vh] overflow-y-auto" style={{ background: "rgba(8,8,8,0.98)" }}>
                        <div className="sticky top-0 flex items-center justify-between p-5 border-b border-border/20" style={{ background: "rgba(8,8,8,0.98)" }}>
                            <div>
                                <h3 className="font-bold text-base font-mono">{userDetail.user.mobile}</h3>
                                <div className="flex gap-2 mt-1 flex-wrap">
                                    <span className={statusBadge(userDetail.user.status)}>{userDetail.user.status}</span>
                                    <span className="text-xs text-yellow-400">⭐ VIP {userDetail.user.vipLevel}</span>
                                    <span className="text-xs text-green-400 font-bold">{fmt(userDetail.user.walletBalance)}</span>
                                    <span className="text-xs text-muted-foreground font-mono">Ref: {userDetail.user.referralCode}</span>
                                </div>
                            </div>
                            <button onClick={() => setUserDetail(null)} className="text-muted-foreground hover:text-foreground text-xl transition-colors">✕</button>
                        </div>
                        <div className="p-5 space-y-5">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">🎯 Bet Stats</p>
                                <div className="grid grid-cols-3 gap-3">
                                    {userDetail.betStats.length === 0 && <p className="text-sm text-muted-foreground col-span-3">No bets placed yet</p>}
                                    {userDetail.betStats.map((s: any) => (
                                        <div key={s._id} className="rounded-lg p-3 border border-border/20 bg-muted/5">
                                            <span className={statusBadge(s._id)}>{s._id}</span>
                                            <p className="text-lg font-bold mt-2">{s.count} bets</p>
                                            <p className="text-xs text-muted-foreground">Wagered: {fmt(s.totalAmount)}</p>
                                            {s._id === "win" && <p className="text-xs text-green-400">Won: {fmt(s.totalWin)}</p>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Recent Bets</p>
                                <div className="space-y-1">
                                    {userDetail.recentBets.length === 0 && <p className="text-sm text-muted-foreground py-2">No bets</p>}
                                    {userDetail.recentBets.map((b: any) => (
                                        <div key={b._id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/5 text-xs flex-wrap">
                                            <span className="font-bold" style={{ color: COLOR_MAP[b.selection] ?? "#e0e0e0" }}>{b.selection}</span>
                                            <span className="text-muted-foreground">{b.gameType}</span>
                                            <span className="font-semibold">{fmt(b.amount)}</span>
                                            <span className={statusBadge(b.status)}>{b.status}</span>
                                            {b.winAmount > 0 && <span className="text-green-400 font-semibold">+{fmt(b.winAmount)}</span>}
                                            <span className="text-muted-foreground ml-auto">{fmtDate(b.createdAt)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Recent Transactions</p>
                                <div className="space-y-1">
                                    {userDetail.recentTxs.length === 0 && <p className="text-sm text-muted-foreground py-2">No transactions</p>}
                                    {userDetail.recentTxs.map((tx: any) => {
                                        const isCr = ["deposit", "win", "bonus"].includes(tx.type);
                                        return (
                                            <div key={tx._id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/5 text-xs flex-wrap">
                                                <span className={statusBadge(tx.type)}>{tx.type}</span>
                                                <span className={`font-bold ${isCr ? "text-green-400" : "text-red-400"}`}>{isCr ? "+" : "−"}{fmt(tx.amount)}</span>
                                                <span className={statusBadge(tx.status)}>{tx.status}</span>
                                                <span className="text-muted-foreground ml-auto">{fmtDate(tx.createdAt)}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
