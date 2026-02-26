import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar,
} from "recharts";
import { MailService } from "@/services/mail.service";
import { Mail, Users, Inbox, RefreshCw, AlertCircle, Tag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// ── Google colours ────────────────────────────────────────────────────────────
const G_BLUE = "#4285F4";
const G_RED = "#EA4335";
const G_YELLOW = "#FBBC05";
const G_GREEN = "#34A853";
const G_COLORS = [G_BLUE, G_RED, G_YELLOW, G_GREEN, "#8B5CF6", "#EC4899"];

// ── Types ─────────────────────────────────────────────────────────────────────
interface Analytics {
    totalInbox: number;
    unread: number;
    topSenders: { email: string; count: number }[];
    dailyVolume: { date: string; received: number }[];
    labels: { name: string; count: number }[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function truncEmail(email: string, max = 24) {
    return email.length > max ? email.slice(0, max) + "…" : email;
}

// ── Custom tooltip ────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white shadow-lg border border-slate-100 rounded-xl px-3 py-2 text-xs">
            <p className="font-semibold text-slate-700 mb-0.5">{fmtDate(label)}</p>
            <p style={{ color: G_BLUE }}>📥 {payload[0].value} received</p>
        </div>
    );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({
    icon: Icon, label, value, color, delay = 0,
}: {
    icon: React.ElementType; label: string; value: string | number; color: string; delay?: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.4 }}
        >
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow h-full">
                <CardContent className="flex items-center gap-4 p-5 h-full">
                    <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${color}18` }}
                    >
                        <Icon className="w-5 h-5" style={{ color }} />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-slate-800">{value}</p>
                        <p className="text-xs text-slate-500 font-medium">{label}</p>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}

// ── Main component ─────────────────────────────────────────────────────────────
const GmailAnalytics: React.FC = () => {
    const [data, setData] = useState<Analytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAnalytics = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await MailService.getAnalytics();
            if (res.success) setData(res.data);
            else throw new Error("Failed to load analytics");
        } catch (err: any) {
            setError(err?.response?.data?.message || err?.message || "Failed to fetch Gmail analytics.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAnalytics(); }, []);

    // ── Loading skeleton ───────────────────────────────────────────────────────
    if (loading) return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <div className="h-6 w-48 bg-slate-200 rounded-lg animate-pulse" />
                    <div className="h-4 w-72 bg-slate-100 rounded-lg animate-pulse mt-2" />
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
                ))}
            </div>
            <div className="h-56 bg-slate-100 rounded-xl animate-pulse" />
        </div>
    );

    // ── Error state ────────────────────────────────────────────────────────────
    if (error) return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center gap-4 py-16 text-center"
        >
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: `${G_RED}15` }}>
                <AlertCircle className="w-7 h-7" style={{ color: G_RED }} />
            </div>
            <div>
                <p className="font-semibold text-slate-800">Couldn't load Gmail analytics</p>
                <p className="text-sm text-slate-500 mt-1 max-w-sm">{error}</p>
            </div>
            <Button variant="outline" onClick={fetchAnalytics} className="gap-2">
                <RefreshCw className="w-4 h-4" /> Try again
            </Button>
        </motion.div>
    );

    if (!data) return null;

    const totalVolume = data.dailyVolume.reduce((s, d) => s + d.received, 0);
    const readRatio = data.totalInbox > 0
        ? Math.round(((data.totalInbox - data.unread) / data.totalInbox) * 100)
        : 100;

    const readPieData = [
        { name: "Read", value: data.totalInbox - data.unread },
        { name: "Unread", value: data.unread },
    ];

    return (
        <div className="space-y-6">

            {/* ── Header ── */}
            <motion.div
                className="flex items-center justify-between"
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
            >
                <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Mail className="w-5 h-5" style={{ color: G_BLUE }} />
                        Gmail Analytics
                    </h2>
                    <p className="text-sm text-slate-500 mt-0.5">Live insights from your connected inbox</p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchAnalytics} className="gap-2 text-xs">
                    <RefreshCw className="w-3.5 h-3.5" /> Refresh
                </Button>
            </motion.div>

            {/* ── Stat cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={Inbox} label="Inbox Emails" value={data.totalInbox.toLocaleString()} color={G_BLUE} delay={0} />
                <StatCard icon={Mail} label="Unread" value={data.unread.toLocaleString()} color={G_RED} delay={0.07} />
                <StatCard icon={Users} label="Top Senders" value={data.topSenders.length} color={G_YELLOW} delay={0.14} />
                <StatCard icon={Tag} label="Read Rate" value={`${readRatio}%`} color={G_GREEN} delay={0.21} />
            </div>

            {/* ── Volume chart + Read/Unread pie ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                {/* Area chart */}
                <motion.div
                    className="lg:col-span-2"
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.28, duration: 0.45 }}
                >
                    <Card className="border-0 shadow-sm h-full">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold text-slate-700">
                                📈 Emails Received — Last 14 Days
                                <span className="ml-2 text-xs font-normal text-slate-400">
                                    ({totalVolume} from last 50 fetched)
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pr-2">
                            <ResponsiveContainer width="100%" height={200}>
                                <AreaChart data={data.dailyVolume} margin={{ top: 4, right: 8, bottom: 0, left: -28 }}>
                                    <defs>
                                        <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={G_BLUE} stopOpacity={0.25} />
                                            <stop offset="95%" stopColor={G_BLUE} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={fmtDate}
                                        tick={{ fontSize: 10, fill: "#94a3b8" }}
                                        interval={1}
                                    />
                                    <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} allowDecimals={false} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area
                                        type="monotone"
                                        dataKey="received"
                                        stroke={G_BLUE}
                                        strokeWidth={2}
                                        fill="url(#blueGrad)"
                                        dot={false}
                                        activeDot={{ r: 5, fill: G_BLUE }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Pie chart */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.34, duration: 0.45 }}
                >
                    <Card className="border-0 shadow-sm h-full">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold text-slate-700">📬 Read vs Unread</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center justify-center gap-3 pb-4">
                            <ResponsiveContainer width="100%" height={140}>
                                <PieChart>
                                    <Pie
                                        data={readPieData}
                                        cx="50%" cy="50%"
                                        innerRadius={38}
                                        outerRadius={62}
                                        paddingAngle={3}
                                        dataKey="value"
                                    >
                                        {readPieData.map((_, i) => (
                                            <Cell key={i} fill={i === 0 ? G_BLUE : G_RED} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(v: number | undefined, name: string | undefined) => [`${v ?? 0} emails`, name ?? ""]}
                                        contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #f1f5f9" }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="flex gap-4 text-xs">
                                {readPieData.map((d, i) => (
                                    <div key={d.name} className="flex items-center gap-1.5">
                                        <span className="w-2.5 h-2.5 rounded-full inline-block"
                                            style={{ backgroundColor: i === 0 ? G_BLUE : G_RED }} />
                                        <span className="text-slate-600">{d.name} <strong className="text-slate-800">{d.value}</strong></span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* ── Top senders bar chart + Labels ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                {/* Top senders */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.45 }}
                >
                    <Card className="border-0 shadow-sm h-full">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold text-slate-700">👥 Top Senders</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {data.topSenders.length === 0 ? (
                                <p className="text-xs text-slate-400 text-center py-8">Not enough data yet</p>
                            ) : (
                                <div className="space-y-3">
                                    {data.topSenders.map((s, i) => {
                                        const pct = Math.round((s.count / (data.topSenders[0]?.count || 1)) * 100);
                                        return (
                                            <div key={s.email}>
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span className="text-slate-700 font-medium">{truncEmail(s.email)}</span>
                                                    <span className="text-slate-500 font-semibold"
                                                        style={{ color: G_COLORS[i % G_COLORS.length] }}>
                                                        {s.count} emails
                                                    </span>
                                                </div>
                                                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <motion.div
                                                        className="h-full rounded-full"
                                                        style={{ backgroundColor: G_COLORS[i % G_COLORS.length] }}
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${pct}%` }}
                                                        transition={{ duration: 0.6, delay: 0.5 + i * 0.08, ease: "easeOut" }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Gmail Labels */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.46, duration: 0.45 }}
                >
                    <Card className="border-0 shadow-sm h-full">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold text-slate-700">🏷️ Your Gmail Labels</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {data.labels.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-8 gap-2">
                                    <Tag className="w-8 h-8 text-slate-200" />
                                    <p className="text-xs text-slate-400">No custom labels found</p>
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height={180}>
                                    <BarChart
                                        data={data.labels}
                                        margin={{ top: 4, right: 8, bottom: 0, left: -28 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                        <XAxis
                                            dataKey="name"
                                            tick={{ fontSize: 9, fill: "#94a3b8" }}
                                            interval={0}
                                            angle={-20}
                                            textAnchor="end"
                                            height={36}
                                        />
                                        <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} allowDecimals={false} />
                                        <Tooltip
                                            formatter={(v: number | undefined) => [`${v ?? 0} emails`]}
                                            contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #f1f5f9" }}
                                        />
                                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                            {data.labels.map((_, i) => (
                                                <Cell key={i} fill={G_COLORS[i % G_COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
};

export default GmailAnalytics;
