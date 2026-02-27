import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Mail, History, Zap, ArrowRight, XCircle, ConciergeBell } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { APP_ROUTES } from "@/constants/routes";
import { useAuth } from "@/contexts/AuthContext";
import { MailService } from "@/services/mail.service";
import GmailAnalytics from "@/components/user/GmailAnalytics";


const G_BLUE = "#4285F4";
const G_GREEN = "#34A853";
const G_RED = "#EA4335";

interface IMailRecord {
    id: string;
    to: string;
    subject: string;
    content: string;
    status: "SENT" | "FAILED" | "PENDING";
    createdAt: string;
}

const UserDashboard: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    const [stats, setStats] = useState({
        sent: "—",
        failed: "—",
        total: "—"
    });

    // Capture JWT token from URL query param after Google OAuth redirect
    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const token = searchParams.get("token");
        if (token) {
            localStorage.setItem("token", token);
            // Remove token from URL bar without reloading
            window.history.replaceState({}, document.title, location.pathname);
        }
    }, []);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await MailService.getHistory();
                if (response.success) {
                    const emails: IMailRecord[] = response.data;
                    const sentCount = emails.filter(e => e.status === "SENT").length;
                    const failedCount = emails.filter(e => e.status === "FAILED").length;
                    setStats({
                        sent: sentCount.toString(),
                        failed: failedCount.toString(),
                        total: emails.length.toString()
                    });
                }
            } catch (err) {
                console.error("Dashboard stats fetch error", err);
            }
        };

        // Fetch immediately on mount
        fetchStats();

        // Re-fetch whenever the window regains focus (e.g. user sent email on another page)
        window.addEventListener("focus", fetchStats);
        return () => window.removeEventListener("focus", fetchStats);
    }, []);

    const statsCards = [
        { label: "Emails Sent", value: stats.sent, color: G_BLUE, icon: Mail },
        { label: "Failed Mails", value: stats.failed, color: G_RED, icon: XCircle },
        { label: "Total History", value: stats.total, color: G_GREEN, icon: History },
    ];

    return (
        <div className="space-y-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <h1 className="text-2xl font-bold text-slate-800">Welcome back, {user?.name?.split(' ')[0] || 'User'}!</h1>
                <p className="text-slate-500 mt-1 text-sm">
                    Use AI to draft and send professional emails in seconds.
                </p>
            </motion.div>

            {/* Stats row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {statsCards.map((card, i) => {
                    const Icon = card.icon;
                    return (
                        <motion.div
                            key={card.label}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.08, duration: 0.4 }}
                        >
                            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow h-full">
                                <CardContent className="flex items-center gap-4 p-5 h-full">
                                    <div
                                        className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                                        style={{ backgroundColor: `${card.color}18` }}
                                    >
                                        <Icon className="w-5 h-5" style={{ color: card.color }} />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-slate-800">{card.value}</p>
                                        <p className="text-xs text-slate-500 font-medium">{card.label}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    );
                })}
            </div>

            {/* Quick actions */}
            <motion.div
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
            >
                {/* Magic Fill CTA */}
                <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                    onClick={() => navigate(APP_ROUTES.USER.MAIL_SENDER)}>
                    <CardContent className="p-6 flex items-center justify-between">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <Zap className="w-5 h-5" style={{ color: G_BLUE }} />
                                <span className="font-semibold text-slate-800">Magic Fill</span>
                            </div>
                            <p className="text-xs text-slate-500 pr-8">
                                Paste rough notes — AI drafts a professional email.
                            </p>
                        </div>
                        <ArrowRight className="w-5 h-5 shrink-0 text-slate-300 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                    </CardContent>
                </Card>

                {/* History CTA */}
                <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                    onClick={() => navigate(APP_ROUTES.USER.HISTORY)}>
                    <CardContent className="p-6 flex items-center justify-between">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <History className="w-5 h-5" style={{ color: G_GREEN }} />
                                <span className="font-semibold text-slate-800">Email History</span>
                            </div>
                            <p className="text-xs text-slate-500 pr-8">
                                View all your previously sent emails.
                            </p>
                        </div>
                        <ArrowRight className="w-5 h-5 shrink-0 text-slate-300 group-hover:text-green-400 group-hover:translate-x-1 transition-all" />
                    </CardContent>
                </Card>

                {/* Services CTA */}
                <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                    onClick={() => navigate(APP_ROUTES.USER.SERVICES)}>
                    <CardContent className="p-6 flex items-center justify-between">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <ConciergeBell className="w-5 h-5" style={{ color: G_BLUE }} />
                                <span className="font-semibold text-slate-800">Services</span>
                            </div>
                            <p className="text-xs text-slate-500 pr-8">
                                Explore all available LazyDraft features in one page.
                            </p>
                        </div>
                        <ArrowRight className="w-5 h-5 shrink-0 text-slate-300 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                    </CardContent>
                </Card>
            </motion.div>

            {/* ── Gmail Analytics ── */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
            >
                <div className="border-t border-slate-100 pt-6">
                    <GmailAnalytics />
                </div>
            </motion.div>

        </div>
    );
};

export default UserDashboard;
