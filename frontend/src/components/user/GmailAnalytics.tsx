import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, LineChart, Line,
} from "recharts";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { MailService } from "@/services/mail.service";
import { Mail, Users, Inbox, RefreshCw, AlertCircle, Tag, Send, Reply, Eye, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

const G_BLUE = "#4285F4";
const G_RED = "#EA4335";
const G_YELLOW = "#FBBC05";
const G_GREEN = "#34A853";
const G_COLORS = [G_BLUE, G_RED, G_YELLOW, G_GREEN, "#0EA5E9", "#F97316"];

interface InboxAnalytics {
    totalInbox: number;
    unread: number;
    topSenders: { email: string; count: number }[];
    dailyVolume: { date: string; received: number }[];
    labels: { name: string; count: number }[];
}

interface HistoryMail {
    status: "SENT" | "FAILED" | "PENDING";
    createdAt: string;
    repliedAt?: string;
    openedAt?: string;
}

function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function truncEmail(email: string, max = 24) {
    return email.length > max ? `${email.slice(0, max)}...` : email;
}

function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white shadow-lg border border-slate-100 rounded-xl px-3 py-2 text-xs">
            <p className="font-semibold text-slate-700 mb-0.5">{fmtDate(label)}</p>
            <p style={{ color: G_BLUE }}>{payload[0].value} received</p>
        </div>
    );
}

function StatCard({ icon: Icon, label, value, color }: {
    icon: React.ElementType; label: string; value: string | number; color: string;
}) {
    return (
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow h-full">
            <CardContent className="flex items-center gap-4 p-5 h-full">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}18` }}>
                    <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <div>
                    <p className="text-2xl font-bold text-slate-800">{value}</p>
                    <p className="text-xs text-slate-500 font-medium">{label}</p>
                </div>
            </CardContent>
        </Card>
    );
}

const GmailAnalytics: React.FC = () => {
    const [inboxData, setInboxData] = useState<InboxAnalytics | null>(null);
    const [history, setHistory] = useState<HistoryMail[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const exportRef = useRef<HTMLDivElement>(null);

    const fetchAll = async () => {
        setLoading(true);
        setError(null);
        try {
            const [analyticsRes, historyRes] = await Promise.all([
                MailService.getAnalytics(),
                MailService.getHistory(),
            ]);

            if (!analyticsRes.success) throw new Error("Failed to load Gmail analytics");
            if (!historyRes.success) throw new Error("Failed to load history");

            setInboxData(analyticsRes.data);

            let nextHistory = historyRes.data || [];
            try {
                await MailService.checkReplies();
                const refreshed = await MailService.getHistory();
                if (refreshed.success) nextHistory = refreshed.data || [];
            } catch {
                // Use already fetched history when reply sync fails.
            }
            setHistory(nextHistory);
        } catch (err: any) {
            setError(err?.response?.data?.message || err?.message || "Failed to fetch analytics.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAll();
    }, []);

    const sentMails = useMemo(() => history.filter(m => m.status === "SENT"), [history]);
    const failedMails = useMemo(() => history.filter(m => m.status === "FAILED"), [history]);
    const sentCount = sentMails.length;
    const failedCount = failedMails.length;
    const successRate = sentCount + failedCount > 0 ? Math.round((sentCount / (sentCount + failedCount)) * 100) : 0;
    const repliedCount = sentMails.filter(m => !!m.repliedAt).length;
    const openedCount = sentMails.filter(m => !!m.openedAt).length;
    const responseRate = sentCount > 0 ? Math.round((repliedCount / sentCount) * 100) : 0;
    const openRate = sentCount > 0 ? Math.round((openedCount / sentCount) * 100) : 0;

    const sentPerDay = useMemo(() => {
        const map = new Map<string, number>();
        const now = new Date();
        for (let i = 29; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(now.getDate() - i);
            map.set(d.toISOString().split("T")[0], 0);
        }
        sentMails.forEach((m) => {
            const key = new Date(m.createdAt).toISOString().split("T")[0];
            if (map.has(key)) map.set(key, (map.get(key) || 0) + 1);
        });
        return Array.from(map.entries()).map(([date, sent]) => ({ date, sent }));
    }, [sentMails]);

    const bestTimeData = useMemo(() => {
        const bucket = Array.from({ length: 24 }, (_, hour) => ({ hour, sent: 0 }));
        sentMails.forEach((m) => {
            const hour = new Date(m.createdAt).getHours();
            bucket[hour].sent += 1;
        });
        return bucket.map((b) => ({ ...b, label: `${String(b.hour).padStart(2, "0")}:00` }));
    }, [sentMails]);

    const sentVsFailed = useMemo(
        () => [{ label: "Sent", value: sentCount }, { label: "Failed", value: failedCount }],
        [sentCount, failedCount]
    );

    const exportCSV = () => {
        const lines = [
            ["Metric", "Value"],
            ["Sent Emails", String(sentCount)],
            ["Failed Emails", String(failedCount)],
            ["Success Rate (%)", String(successRate)],
            ["Response Rate (%)", String(responseRate)],
            ["Open Rate (%)", String(openRate)],
            [],
            ["Date", "Sent (Last 30 Days)"],
            ...sentPerDay.map(d => [d.date, String(d.sent)]),
            [],
            ["Hour", "Sent Count"],
            ...bestTimeData.map(d => [d.label, String(d.sent)]),
        ];
        const csv = lines.map((row) => row.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `lazydraft-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const exportPDF = async () => {
        if (!exportRef.current) return;
        const canvas = await html2canvas(exportRef.current, { scale: 2, useCORS: true, backgroundColor: "#f8fafc" });
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");
        const pageWidth = pdf.internal.pageSize.getWidth();
        const margin = 10;
        const targetWidth = pageWidth - margin * 2;
        const targetHeight = (canvas.height * targetWidth) / canvas.width;
        pdf.addImage(imgData, "PNG", margin, margin, targetWidth, targetHeight);
        pdf.save(`lazydraft-analytics-${new Date().toISOString().slice(0, 10)}.pdf`);
    };

    if (loading) return (
        <div className="relative overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 min-h-[520px]">
            {/* Skeleton background */}
            <div className="p-4 sm:p-6 space-y-4 blur-[2px]">
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <div className="h-6 w-56 bg-slate-200 rounded-lg animate-pulse" />
                        <div className="h-4 w-72 bg-slate-100 rounded-lg animate-pulse" />
                    </div>
                    <div className="h-8 w-24 bg-slate-200 rounded-lg animate-pulse" />
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2 h-56 bg-slate-100 rounded-xl animate-pulse" />
                    <div className="h-56 bg-slate-100 rounded-xl animate-pulse" />
                </div>
                <div className="h-64 bg-slate-100 rounded-xl animate-pulse" />
            </div>

            {/* Foreground loading reminder */}
            <div className="absolute inset-0 flex items-center justify-center bg-white/35 backdrop-blur-sm">
                <div className="px-5 py-4 rounded-2xl bg-white/90 border border-slate-200 shadow-sm flex items-center gap-3">
                    <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
                    <div>
                        <p className="text-sm font-semibold text-slate-800">Loading Gmail analytics...</p>
                        <p className="text-xs text-slate-500">Your dashboard data is coming.</p>
                    </div>
                </div>
            </div>
        </div>
    );

    if (error) return (
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: `${G_RED}15` }}>
                <AlertCircle className="w-7 h-7" style={{ color: G_RED }} />
            </div>
            <div>
                <p className="font-semibold text-slate-800">Couldn't load Gmail analytics</p>
                <p className="text-sm text-slate-500 mt-1 max-w-sm">{error}</p>
            </div>
            <Button variant="outline" onClick={fetchAll} className="gap-2">
                <RefreshCw className="w-4 h-4" /> Try again
            </Button>
        </div>
    );

    if (!inboxData) return null;

    const readRatio = inboxData.totalInbox > 0
        ? Math.round(((inboxData.totalInbox - inboxData.unread) / inboxData.totalInbox) * 100)
        : 100;
    const readPieData = [
        { name: "Read", value: inboxData.totalInbox - inboxData.unread },
        { name: "Unread", value: inboxData.unread },
    ];

    return (
        <div className="space-y-6" ref={exportRef}>
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
                    <p className="text-sm text-slate-500 mt-0.5">Inbox + sent-mail performance overview</p>
                </div>
                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2 text-xs">
                                <Download className="w-3.5 h-3.5" /> Export
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { exportCSV(); toast.success("CSV downloaded."); }}>
                                Download CSV
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={async () => { await exportPDF(); toast.success("PDF downloaded."); }}>
                                Download PDF
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="outline" size="sm" onClick={fetchAll} className="gap-2 text-xs">
                        <RefreshCw className="w-3.5 h-3.5" /> Refresh
                    </Button>
                </div>
            </motion.div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={Inbox} label="Inbox Emails" value={inboxData.totalInbox.toLocaleString()} color={G_BLUE} />
                <StatCard icon={Mail} label="Unread" value={inboxData.unread.toLocaleString()} color={G_RED} />
                <StatCard icon={Users} label="Top Senders" value={inboxData.topSenders.length} color={G_YELLOW} />
                <StatCard icon={Tag} label="Read Rate" value={`${readRatio}%`} color={G_GREEN} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card className="border-0 shadow-sm lg:col-span-2">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold text-slate-700">Emails Received - Last 14 Days</CardTitle>
                    </CardHeader>
                    <CardContent className="pr-2">
                        <ResponsiveContainer width="100%" height={200}>
                            <AreaChart data={inboxData.dailyVolume} margin={{ top: 4, right: 8, bottom: 0, left: -28 }}>
                                <defs>
                                    <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={G_BLUE} stopOpacity={0.25} />
                                        <stop offset="95%" stopColor={G_BLUE} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fontSize: 10, fill: "#94a3b8" }} interval={1} />
                                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} allowDecimals={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="received" stroke={G_BLUE} strokeWidth={2} fill="url(#blueGrad)" dot={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold text-slate-700">Read vs Unread</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center gap-3 pb-4">
                        <ResponsiveContainer width="100%" height={140}>
                            <PieChart>
                                <Pie data={readPieData} cx="50%" cy="50%" innerRadius={38} outerRadius={62} paddingAngle={3} dataKey="value">
                                    {readPieData.map((_, i) => <Cell key={i} fill={i === 0 ? G_BLUE : G_RED} />)}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-slate-700">Your Sent Emails</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                    <StatCard icon={Send} label="Sent" value={sentCount} color={G_BLUE} />
                    <StatCard icon={Tag} label="Success Rate" value={`${successRate}%`} color={G_GREEN} />
                    <StatCard icon={Reply} label="Response Rate" value={`${responseRate}%`} color={G_YELLOW} />
                    <StatCard icon={Eye} label="Open Rate" value={`${openRate}%`} color={G_RED} />
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold text-slate-700">Sent Per Day - Last 30 Days</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={220}>
                            <LineChart data={sentPerDay} margin={{ top: 4, right: 8, bottom: 0, left: -28 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fontSize: 10, fill: "#94a3b8" }} interval={3} />
                                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} allowDecimals={false} />
                                <Tooltip />
                                <Line type="monotone" dataKey="sent" stroke={G_BLUE} strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold text-slate-700">Sent vs Failed</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={sentVsFailed}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                                <Tooltip />
                                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                    <Cell fill={G_GREEN} />
                                    <Cell fill={G_RED} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold text-slate-700">Best Time to Send</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={bestTimeData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="label" tick={{ fontSize: 9, fill: "#94a3b8" }} interval={2} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                                <Tooltip />
                                <Bar dataKey="sent" fill={G_BLUE} radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold text-slate-700">Top Senders</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {inboxData.topSenders.length === 0 ? (
                            <p className="text-xs text-slate-400 text-center py-8">Not enough data yet</p>
                        ) : (
                            <div className="space-y-3">
                                {inboxData.topSenders.map((s, i) => {
                                    const pct = Math.round((s.count / (inboxData.topSenders[0]?.count || 1)) * 100);
                                    return (
                                        <div key={s.email}>
                                            <div className="flex justify-between text-xs mb-1">
                                                <span className="text-slate-700 font-medium">{truncEmail(s.email)}</span>
                                                <span className="font-semibold" style={{ color: G_COLORS[i % G_COLORS.length] }}>{s.count} emails</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <motion.div
                                                    className="h-full rounded-full"
                                                    style={{ backgroundColor: G_COLORS[i % G_COLORS.length], width: `${pct}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default GmailAnalytics;
