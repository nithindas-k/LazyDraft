import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Inbox, Loader2, Mail, CheckCircle, XCircle, Clock, Eye, X, Calendar, User, CornerDownLeft,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { MailService } from "@/services/mail.service";

// ── Google brand colours ──────────────────────────────────────────────────────
const G_BLUE = "#4285F4";
const G_RED = "#EA4335";
const G_YELLOW = "#FBBC05";
const G_GREEN = "#34A853";

// ── Types ─────────────────────────────────────────────────────────────────────
interface IMailRecord {
    id: string;
    from?: string;
    to: string;
    subject: string;
    content: string;
    status: "SENT" | "FAILED" | "PENDING";
    scheduledAt?: string;
    openedAt?: string;
    repliedAt?: string;
    createdAt: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function stripHtml(html: string): string {
    return html
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/p>/gi, "\n")
        .replace(/<[^>]*>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim();
}

function formatDate(dateString: string) {
    return new Intl.DateTimeFormat("en-US", {
        month: "short", day: "numeric",
        hour: "numeric", minute: "2-digit", hour12: true,
    }).format(new Date(dateString));
}

function formatDateFull(dateString: string) {
    return new Intl.DateTimeFormat("en-US", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
        hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true,
    }).format(new Date(dateString));
}

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
    SENT: { color: G_GREEN, bg: "#f0fdf4", border: "#bbf7d0", Icon: CheckCircle, label: "Sent" },
    FAILED: { color: G_RED, bg: "#fff5f5", border: "#fecaca", Icon: XCircle, label: "Failed" },
    PENDING: { color: G_YELLOW, bg: "#fffbeb", border: "#fde68a", Icon: Clock, label: "Pending" },
};

// ── Mail Detail Modal ─────────────────────────────────────────────────────────
function MailDetailModal({ email, onClose }: { email: IMailRecord; onClose: () => void; }) {
    const cfg = STATUS_CONFIG[email.status] || STATUS_CONFIG.PENDING;
    const { Icon: StatusIcon } = cfg;
    const plainContent = stripHtml(email.content);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    return (
        <AnimatePresence>
            {/* ── Backdrop ── */}
            <motion.div
                key="backdrop"
                className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
                style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            >
                {/* ── Panel: bottom-sheet on mobile, centered dialog on desktop ── */}
                <motion.div
                    key="panel"
                    className="relative w-full bg-white shadow-2xl flex flex-col
                               rounded-t-3xl sm:rounded-2xl
                               max-h-[92vh] sm:max-h-[85vh] sm:max-w-2xl"
                    initial={{ y: "100%", opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: "100%", opacity: 0 }}
                    transition={{ type: "spring", stiffness: 340, damping: 30 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Mobile drag handle */}
                    <div className="flex justify-center pt-3 pb-1 sm:hidden shrink-0">
                        <div className="w-10 h-1 rounded-full bg-slate-200" />
                    </div>

                    {/* Google colour bar */}
                    <div className="flex h-1 shrink-0">
                        {[G_BLUE, G_RED, G_YELLOW, G_GREEN].map((c) => (
                            <div key={c} className="flex-1" style={{ backgroundColor: c }} />
                        ))}
                    </div>

                    {/* ── Header (sticky, no scroll) ── */}
                    <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3 shrink-0 border-b border-slate-100">
                        <div className="flex items-start gap-3 min-w-0">
                            <div
                                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 mt-0.5"
                                style={{ backgroundColor: G_BLUE }}
                            >
                                {email.to.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-sm sm:text-base font-semibold text-slate-800 leading-snug line-clamp-2">
                                    {email.subject}
                                </h2>
                                <p className="text-xs text-slate-400 mt-0.5">{formatDate(email.createdAt)}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            {/* Status badge — desktop only in header */}
                            <span
                                className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
                                style={{ backgroundColor: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
                            >
                                <StatusIcon className="w-3.5 h-3.5" />
                                {cfg.label}
                            </span>
                            <button
                                onClick={onClose}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* ── Scrollable body ── */}
                    <div className="flex-1 overflow-y-auto overscroll-contain min-h-0">

                        {/* Meta rows */}
                        <div className="px-5 py-4 space-y-3 border-b border-slate-100">
                            {email.from && (
                                <div className="flex items-center gap-3">
                                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                                        style={{ backgroundColor: `${G_BLUE}18` }}>
                                        <User className="w-3.5 h-3.5" style={{ color: G_BLUE }} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">From</p>
                                        <p className="text-sm text-slate-700 font-medium truncate">{email.from}</p>
                                    </div>
                                </div>
                            )}
                            <div className="flex items-center gap-3">
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                                    style={{ backgroundColor: `${G_RED}18` }}>
                                    <Mail className="w-3.5 h-3.5" style={{ color: G_RED }} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">To</p>
                                    <p className="text-sm text-slate-700 font-medium truncate">{email.to}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                                    style={{ backgroundColor: `${G_GREEN}18` }}>
                                    <Calendar className="w-3.5 h-3.5" style={{ color: G_GREEN }} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{email.status === "PENDING" && email.scheduledAt ? "Scheduled For" : "Sent At"}</p>
                                    <p className="text-sm text-slate-700">{email.status === "PENDING" && email.scheduledAt ? formatDateFull(email.scheduledAt) : formatDateFull(email.createdAt)}</p>
                                </div>
                            </div>
                            {(email.openedAt || email.repliedAt) && (
                                <div className="flex items-center gap-2 flex-wrap">
                                    {email.openedAt && (
                                        <span className="text-[11px] font-semibold px-2 py-1 rounded-full border border-blue-200 bg-blue-50 text-blue-700">
                                            Opened
                                        </span>
                                    )}
                                    {email.repliedAt && (
                                        <span className="text-[11px] font-semibold px-2 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 inline-flex items-center gap-1">
                                            <CornerDownLeft className="w-3 h-3" />
                                            Replied
                                        </span>
                                    )}
                                </div>
                            )}
                            {/* Status — mobile only */}
                            <div className="flex items-center gap-3 sm:hidden">
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                                    style={{ backgroundColor: cfg.bg }}>
                                    <StatusIcon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Status</p>
                                    <p className="text-sm font-bold" style={{ color: cfg.color }}>{cfg.label}</p>
                                </div>
                            </div>
                        </div>

                        {/* Message body */}
                        <div className="px-5 py-5">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-3">Message</p>
                            <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap break-words">
                                {plainContent || <span className="text-slate-400 italic">No content</span>}
                            </div>
                        </div>
                    </div>

                    {/* ── Footer (sticky at bottom) ── */}
                    <div className="px-5 py-4 flex items-center justify-between shrink-0 border-t border-slate-100">
                        {/* Status badge — mobile footer */}
                        <span
                            className="sm:hidden flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                            style={{ backgroundColor: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
                        >
                            <StatusIcon className="w-3.5 h-3.5" />
                            {cfg.label}
                        </span>
                        <div className="flex items-center gap-2 ml-auto flex-wrap justify-end">
                            <button
                                onClick={onClose}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 active:scale-95"
                                style={{ backgroundColor: G_BLUE }}
                            >
                                <X className="w-3.5 h-3.5" />
                                Close
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

// ── History Page ──────────────────────────────────────────────────────────────
const HistoryPage: React.FC = () => {
    const [emails, setEmails] = useState<IMailRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selected, setSelected] = useState<IMailRecord | null>(null);

    const fetchHistory = async () => {
        try {
            const response = await MailService.getHistory();
            if (response.success) {
                setEmails(response.data);
            } else {
                setError("Failed to load history.");
            }
        } catch (err: any) {
            setError(err.response?.data?.message || "Something went wrong loading emails.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const hydrateReplies = async () => {
            await fetchHistory();
            try {
                await MailService.checkReplies();
                await fetchHistory();
            } catch {
                // Keep current history if reply sync fails.
            }
        };
        hydrateReplies();
    }, []);

    return (
        <>
            {selected && <MailDetailModal email={selected} onClose={() => setSelected(null)} />}

            <div className="space-y-6 max-w-5xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    <div className="flex items-center gap-2 mb-1">
                        <HistoryIcon className="w-6 h-6 text-slate-700" />
                        <h1 className="text-2xl font-bold text-slate-800">Email History</h1>
                    </div>
                    <p className="text-slate-500 text-sm">All emails you've sent through LazyDraft, including open/reply status.</p>
                </motion.div>

                <AnimatePresence mode="wait">
                    {loading ? (
                        <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center py-20 gap-3">
                            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                            <p className="text-slate-500 text-sm animate-pulse">Loading your history...</p>
                        </motion.div>
                    ) : error ? (
                        <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 shadow-sm text-center">
                            {error}
                        </motion.div>
                    ) : emails.length === 0 ? (
                        <motion.div key="empty" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
                            <Card className="border-0 shadow-sm">
                                <CardContent className="flex flex-col items-center justify-center py-24 gap-4 text-center">
                                    <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
                                        <Inbox className="w-8 h-8 text-slate-300" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-700">No emails yet</p>
                                        <p className="text-sm text-slate-400 mt-1 max-w-xs mx-auto">
                                            Draft your first email using Magic Fill and it will appear here.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ) : (
                        <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 gap-3">
                            {emails.map((email, index) => {
                                const cfg = STATUS_CONFIG[email.status] || STATUS_CONFIG.PENDING;
                                const { Icon: StatusIcon } = cfg;
                                const plainPreview = stripHtml(email.content);

                                return (
                                    <motion.div
                                        key={email.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.04 }}
                                    >
                                        <Card className="border-0 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                                            <div className="absolute top-0 left-0 bottom-0 w-1" style={{ backgroundColor: cfg.color }} />

                                            <CardContent className="p-4 pl-5 sm:p-5 sm:pl-7 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                                                {/* Left */}
                                                <div className="flex items-start gap-3 min-w-0 flex-1">
                                                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                                                        style={{ backgroundColor: G_BLUE }}>
                                                        {email.to.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                                    <span className="text-xs font-semibold text-slate-700 truncate max-w-[180px]">{email.to}</span>
                                                    <span className="text-[10px] text-slate-400">{formatDate(email.createdAt)}</span>
                                                </div>
                                                <p className="text-sm font-medium text-slate-800 truncate mb-0.5">{email.subject}</p>
                                                <p className="text-xs text-slate-500 line-clamp-1">{plainPreview}</p>
                                                <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                                                    {email.status === "PENDING" && email.scheduledAt && new Date(email.scheduledAt).getTime() > Date.now() && (
                                                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border border-violet-200 bg-violet-50 text-violet-700">
                                                            Scheduled
                                                        </span>
                                                    )}
                                                    {email.openedAt && (
                                                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border border-blue-200 bg-blue-50 text-blue-700">
                                                            Opened
                                                        </span>
                                                    )}
                                                    {email.repliedAt && (
                                                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 inline-flex items-center gap-1">
                                                            <CornerDownLeft className="w-3 h-3" />
                                                            Replied
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                                {/* Right */}
                                                <div className="flex items-center gap-2 sm:gap-3 shrink-0 sm:flex-col sm:items-end">
                                                    <span
                                                        className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                                                        style={{ backgroundColor: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
                                                    >
                                                        <StatusIcon className="w-3 h-3" />
                                                        {cfg.label}
                                                    </span>
                                                    <button
                                                        onClick={() => setSelected(email)}
                                                        className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
                                                        style={{ backgroundColor: `${G_BLUE}12`, color: G_BLUE, border: `1px solid ${G_BLUE}30` }}
                                                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = `${G_BLUE}22`; }}
                                                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = `${G_BLUE}12`; }}
                                                    >
                                                        <Eye className="w-3.5 h-3.5" />
                                                        <span className="hidden sm:inline">View</span>
                                                    </button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </>
    );
};

// ── History SVG icon ──────────────────────────────────────────────────────────
function HistoryIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M12 7v5l4 2" />
        </svg>
    );
}

export default HistoryPage;
