import React from "react";
import { motion } from "framer-motion";
import { Mail, History, Zap, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { APP_ROUTES } from "@/constants/routes";

const G_BLUE = "#4285F4";
const G_GREEN = "#34A853";
const G_YELLOW = "#FBBC05";

const statsCards = [
    { label: "Emails Sent", value: "—", color: G_BLUE, icon: Mail },
    { label: "AI Drafts Made", value: "—", color: G_GREEN, icon: Zap },
    { label: "History Items", value: "—", color: G_YELLOW, icon: History },
];

const UserDashboard: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="space-y-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <h1 className="text-2xl font-bold text-slate-800">Welcome back !</h1>
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
                            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                                <CardContent className="flex items-center gap-4 p-5">
                                    <div
                                        className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                                        style={{ backgroundColor: `${card.color}18` }}
                                    >
                                        <Icon className="w-5 h-5" style={{ color: card.color }} />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-slate-800">{card.value}</p>
                                        <p className="text-xs text-slate-500">{card.label}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    );
                })}
            </div>

            {/* Quick actions */}
            <motion.div
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
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
                            <p className="text-xs text-slate-500">
                                Paste rough notes — AI drafts a professional email.
                            </p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
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
                            <p className="text-xs text-slate-500">
                                View all your previously sent emails.
                            </p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-green-400 group-hover:translate-x-1 transition-all" />
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
};

export default UserDashboard;
