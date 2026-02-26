import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Inbox, Loader2, Mail, CheckCircle, XCircle, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import axios from "axios";
import { API_BASE_URL, API_ENDPOINTS } from "@/constants/routes";

// Define the type corresponding to IMailEntity from backend
interface IMailRecord {
    id: string;
    to: string;
    subject: string;
    content: string;
    status: "SENT" | "FAILED" | "PENDING";
    createdAt: string; // ISO date string
}

const HistoryPage: React.FC = () => {
    const [emails, setEmails] = useState<IMailRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}${API_ENDPOINTS.MAIL.HISTORY}`);
                if (response.data.success) {
                    setEmails(response.data.data);
                } else {
                    setError("Failed to load history.");
                }
            } catch (err: any) {
                console.error("History fetch error", err);
                setError(err.response?.data?.message || "Something went wrong loading emails.");
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, []);

    // Format date string
    const formatDate = (dateString: string) => {
        const d = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            month: 'short', day: 'numeric',
            hour: 'numeric', minute: '2-digit', hour12: true
        }).format(d);
    };

    return (
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
                <p className="text-slate-500 text-sm">
                    All emails you've sent through LazyDraft.
                </p>
            </motion.div>

            <AnimatePresence mode="wait">
                {loading ? (
                    <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center py-20 gap-3"
                    >
                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                        <p className="text-slate-500 text-sm animate-pulse">Loading your history...</p>
                    </motion.div>
                ) : error ? (
                    <motion.div
                        key="error"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 shadow-sm text-center"
                    >
                        {error}
                    </motion.div>
                ) : emails.length === 0 ? (
                    <motion.div
                        key="empty"
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4 }}
                    >
                        <Card className="border-0 shadow-sm bg-white/50 backdrop-blur-sm border border-slate-100">
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
                    <motion.div
                        key="list"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="grid grid-cols-1 gap-4"
                    >
                        {emails.map((email, index) => (
                            <motion.div
                                key={email.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Card className="border-0 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                                    <div className={`absolute top-0 left-0 bottom-0 w-1 ${email.status === 'SENT' ? 'bg-green-500' :
                                            email.status === 'FAILED' ? 'bg-red-500' : 'bg-yellow-500'
                                        }`} />

                                    <CardContent className="p-5 pl-6 sm:p-6 sm:pl-8 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <div className="flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-md w-fit bg-slate-100 text-slate-600">
                                                    <Mail className="w-3.5 h-3.5 text-blue-500" />
                                                    <span className="truncate max-w-[150px] sm:max-w-[200px]">{email.to}</span>
                                                </div>
                                                <span className="text-xs text-slate-400 hidden sm:inline-block">•</span>
                                                <span className="text-xs text-slate-400">{formatDate(email.createdAt)}</span>
                                            </div>

                                            <h3 className="font-medium text-slate-800 text-sm sm:text-base mb-1 truncate">
                                                {email.subject}
                                            </h3>

                                            <p className="text-xs sm:text-sm text-slate-500 line-clamp-1">
                                                {email.content}
                                            </p>
                                        </div>

                                        <div className="flex items-center sm:flex-col sm:items-end gap-2 shrink-0">
                                            <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${email.status === 'SENT' ? 'bg-green-50 text-green-700 border border-green-100' :
                                                    email.status === 'FAILED' ? 'bg-red-50 text-red-700 border border-red-100' :
                                                        'bg-yellow-50 text-yellow-700 border border-yellow-100'
                                                }`}>
                                                {email.status === 'SENT' && <CheckCircle className="w-3.5 h-3.5" />}
                                                {email.status === 'FAILED' && <XCircle className="w-3.5 h-3.5" />}
                                                {email.status === 'PENDING' && <Clock className="w-3.5 h-3.5" />}
                                                {email.status}
                                            </div>
                                            <span className="text-[10px] text-slate-400 sm:hidden ml-auto">
                                                {formatDate(email.createdAt)}
                                            </span>
                                        </div>

                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Simple History icon fallback
function HistoryIcon(props: any) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M12 7v5l4 2" />
        </svg>
    )
}

export default HistoryPage;
