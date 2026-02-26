import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    LayoutTemplate, Trash2, Loader2, Plus, Search, FileText, Clock,
} from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MailService } from "../../services/mail.service";
import { toast } from "sonner";

const G_BLUE = "#4285F4";
const G_RED = "#EA4335";
const G_YELLOW = "#FBBC05";
const G_GREEN = "#34A853";

interface ITemplate {
    id: string;
    name: string;
    to?: string;
    subject?: string;
    body?: string;
    createdAt: string;
}

function formatDate(dateString: string) {
    return new Intl.DateTimeFormat("en-US", {
        month: "short", day: "numeric", year: "numeric",
    }).format(new Date(dateString));
}

function stripHtml(html: string): string {
    return html
        .replace(/<br\s*\/?>/gi, " ")
        .replace(/<\/p>/gi, " ")
        .replace(/<[^>]*>/g, "")
        .replace(/&nbsp;/g, " ")
        .trim();
}

const TemplatesPage: React.FC = () => {
    const [templates, setTemplates] = useState<ITemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [search, setSearch] = useState("");

    const fetchTemplates = async () => {
        setLoading(true);
        try {
            const res = await MailService.getTemplates();
            if (res.success) setTemplates(res.data);
        } catch {
            toast.error("Failed to load templates");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTemplates(); }, []);

    const handleDelete = async (id: string, name: string) => {
        setDeleting(id);
        try {
            await MailService.deleteTemplate(id);
            setTemplates(prev => prev.filter(t => t.id !== id));
            toast.success(`Template "${name}" deleted`);
        } catch {
            toast.error("Failed to delete template");
        } finally {
            setDeleting(null);
        }
    };

    const filtered = templates.filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        (t.subject || "").toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            >
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <LayoutTemplate className="w-6 h-6 text-slate-700" />
                        <h1 className="text-2xl font-bold text-slate-800">Email Templates</h1>
                    </div>
                    <p className="text-slate-500 text-sm">
                        Reusable email templates you've saved. Use them in the Mail Sender.
                    </p>
                </div>

                {/* Count badge */}
                {templates.length > 0 && (
                    <Badge
                        className="self-start sm:self-auto px-3 py-1 text-sm font-semibold rounded-full text-white"
                        style={{ backgroundColor: G_BLUE }}
                    >
                        {templates.length} template{templates.length !== 1 ? "s" : ""}
                    </Badge>
                )}
            </motion.div>

            {/* Search */}
            {templates.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="relative"
                >
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        id="template-search"
                        placeholder="Search templates by name or subject…"
                        className="pl-9 bg-white shadow-sm border-slate-200"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </motion.div>
            )}

            {/* Content */}
            <AnimatePresence mode="wait">
                {loading ? (
                    <motion.div key="loading"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center py-20 gap-3"
                    >
                        <Loader2 className="w-8 h-8 animate-spin" style={{ color: G_BLUE }} />
                        <p className="text-slate-500 text-sm animate-pulse">Loading templates…</p>
                    </motion.div>
                ) : templates.length === 0 ? (
                    <motion.div key="empty"
                        initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                    >
                        <Card className="border-0 shadow-sm">
                            <CardContent className="flex flex-col items-center justify-center py-24 gap-4 text-center">
                                <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                                    style={{ backgroundColor: `${G_BLUE}15` }}>
                                    <FileText className="w-8 h-8" style={{ color: G_BLUE }} />
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-700">No templates yet</p>
                                    <p className="text-sm text-slate-400 mt-1 max-w-xs mx-auto">
                                        Save a template from the Mail Sender using the "Save as Template" button.
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-50 rounded-xl px-3 py-2 border border-slate-100">
                                    <Plus className="w-3.5 h-3.5" />
                                    Go to Mail Sender → Save as Template
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ) : filtered.length === 0 ? (
                    <motion.div key="no-results"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="text-center py-12 text-slate-400 text-sm"
                    >
                        No templates match "{search}"
                    </motion.div>
                ) : (
                    <motion.div key="list"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="grid grid-cols-1 gap-3"
                    >
                        {filtered.map((template, index) => (
                            <motion.div
                                key={template.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ delay: index * 0.04 }}
                                layout
                            >
                                <Card className="border-0 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                                    {/* Color accent bar */}
                                    <div className="absolute top-0 left-0 bottom-0 w-1 rounded-l-xl"
                                        style={{ backgroundColor: [G_BLUE, G_GREEN, G_YELLOW, G_RED][index % 4] }} />

                                    <CardContent className="p-4 pl-6 sm:p-5 sm:pl-7 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                                        {/* Left: info */}
                                        <div className="flex items-start gap-3 min-w-0 flex-1">
                                            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0"
                                                style={{ backgroundColor: [G_BLUE, G_GREEN, G_YELLOW, G_RED][index % 4] }}>
                                                {template.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-semibold text-slate-800 truncate mb-0.5">
                                                    {template.name}
                                                </p>
                                                {template.subject && (
                                                    <p className="text-xs text-slate-600 truncate mb-0.5">
                                                        Subject: {template.subject}
                                                    </p>
                                                )}
                                                {template.body && (
                                                    <p className="text-xs text-slate-400 line-clamp-1">
                                                        {stripHtml(template.body)}
                                                    </p>
                                                )}
                                                <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400">
                                                    <Clock className="w-3 h-3" />
                                                    {formatDate(template.createdAt)}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right: actions */}
                                        <div className="flex items-center gap-2 shrink-0">
                                            <Button
                                                id={`delete-template-${template.id}`}
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(template.id, template.name)}
                                                disabled={deleting === template.id}
                                                className="h-8 px-3 text-xs font-medium text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                                            >
                                                {deleting === template.id ? (
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                ) : (
                                                    <><Trash2 className="w-3.5 h-3.5 mr-1" />Delete</>
                                                )}
                                            </Button>
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

export default TemplatesPage;
