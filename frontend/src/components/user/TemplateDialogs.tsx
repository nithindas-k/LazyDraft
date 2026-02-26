import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "../../components/ui/scroll-area";
import { LayoutTemplate, Search, Loader2, Save, Clock } from "lucide-react";
import { MailService } from "@/services/mail.service";
import { toast } from "sonner";

const G_BLUE = "#4285F4";
const G_GREEN = "#34A853";

// â”€â”€ Use Template Dialog â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface Template {
    id: string;
    name: string;
    to?: string;
    subject?: string;
    body?: string;
    createdAt: string;
}

interface UseTemplateDialogProps {
    open: boolean;
    onClose: () => void;
    onSelect: (t: Template) => void;
}

export function UseTemplateDialog({ open, onClose, onSelect }: UseTemplateDialogProps) {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(false);
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

    useEffect(() => {
        if (open) {
            fetchTemplates();
        }
    }, [open]);

    const filtered = templates.filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        (t.subject || "").toLowerCase().includes(search.toLowerCase())
    );

    return (
        <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
            <DialogContent className="max-w-md rounded-2xl p-0 overflow-hidden">
                <div className="flex h-1">
                    {["#4285F4", "#EA4335", "#FBBC05", "#34A853"].map(c => (
                        <div key={c} className="flex-1" style={{ backgroundColor: c }} />
                    ))}
                </div>
                <div className="p-5 space-y-3">
                    <DialogTitle className="flex items-center gap-2 text-slate-800">
                        <LayoutTemplate className="w-4 h-4" style={{ color: G_BLUE }} />
                        Use a Template
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-500">
                        Select a template to populate your email form.
                    </DialogDescription>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <Input id="template-search-input" placeholder="Search templatesâ€¦" className="pl-8 text-sm h-8"
                            value={search} onChange={e => setSearch(e.target.value)} />
                    </div>

                    <ScrollArea className="h-64 pr-2">
                        {loading ? (
                            <div className="flex items-center justify-center h-24 gap-2 text-slate-400">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="text-sm">Loadingâ€¦</span>
                            </div>
                        ) : filtered.length === 0 ? (
                            <p className="text-center text-sm text-slate-400 py-10">
                                {templates.length === 0 ? "No templates saved yet." : `No results for "${search}"`}
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {filtered.map(t => (
                                    <button key={t.id} id={`use-template-${t.id}`}
                                        onClick={() => { onSelect(t); onClose(); }}
                                        className="w-full text-left p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50 transition-all group"
                                    >
                                        <p className="text-sm font-semibold text-slate-800 group-hover:text-blue-700">{t.name}</p>
                                        {t.subject && <p className="text-xs text-slate-500 truncate mt-0.5">Subject: {t.subject}</p>}
                                        <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400">
                                            <Clock className="w-3 h-3" />
                                            {new Date(t.createdAt).toLocaleDateString()}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// â”€â”€ Save Template Dialog â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface SaveTemplateDialogProps {
    open: boolean;
    onClose: () => void;
    formValues: { to: string; subject: string; body: string };
}

export function SaveTemplateDialog({ open, onClose, formValues }: SaveTemplateDialogProps) {
    const [name, setName] = useState("");
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!name.trim()) return;
        setSaving(true);
        try {
            await MailService.createTemplate({ name: name.trim(), ...formValues });
            toast.success("Template saved.", { icon: <Save className="w-4 h-4" /> });
            setName("");
            onClose();
        } catch {
            toast.error("Failed to save template");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) { setName(""); onClose(); } }}>
            <DialogContent className="max-w-sm rounded-2xl p-0 overflow-hidden">
                <div className="flex h-1">
                    {["#4285F4", "#EA4335", "#FBBC05", "#34A853"].map(c => (
                        <div key={c} className="flex-1" style={{ backgroundColor: c }} />
                    ))}
                </div>
                <div className="p-5 space-y-4">
                    <DialogTitle className="flex items-center gap-2 text-slate-800">
                        <Save className="w-4 h-4" style={{ color: G_GREEN }} />
                        Save as Template
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-500">
                        Give your template a name. The current To, Subject, and Body will be saved.
                    </DialogDescription>
                    <Input
                        id="template-name-input"
                        placeholder='e.g. "Leave Request"'
                        value={name}
                        onChange={e => setName(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") handleSave(); }}
                        autoFocus
                    />
                    <div className="flex gap-2 justify-end">
                        <Button variant="ghost" size="sm" onClick={() => { setName(""); onClose(); }} className="rounded-xl text-xs">Cancel</Button>
                        <Button size="sm" onClick={handleSave} disabled={!name.trim() || saving}
                            className="rounded-xl text-xs text-white" style={{ backgroundColor: G_GREEN }}>
                            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Save className="w-3 h-3 mr-1" />Save</>}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

