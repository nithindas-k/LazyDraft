import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { CalendarClock, Loader2, Play, Repeat, Save, ToggleLeft, ToggleRight, Trash2, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { MailService } from "@/services/mail.service";
import type { RecurringMailPayload } from "@/services/mail.service";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface RecurringMailItem extends RecurringMailPayload {
    id: string;
    isActive: boolean;
    nextRunAt: string;
    lastSentAt?: string;
}

const DAYS = [
    { label: "Sun", value: 0 },
    { label: "Mon", value: 1 },
    { label: "Tue", value: 2 },
    { label: "Wed", value: 3 },
    { label: "Thu", value: 4 },
    { label: "Fri", value: 5 },
    { label: "Sat", value: 6 },
];

const TONES = ["Formal", "Casual", "Friendly", "Assertive", "Apologetic"];
const LANGUAGES = ["English", "Arabic", "French", "Hindi", "Spanish", "German", "Tamil"];
const LENGTH_VALUES = ["short", "medium", "detailed"];
const LENGTH_LABELS = ["Short (~100w)", "Medium (~200w)", "Detailed (~400w)"];

function parseEmails(raw: string): string[] {
    return raw
        .split(/[\n,;]+/)
        .map(v => v.trim())
        .filter(Boolean);
}

const RecurringMailPage: React.FC = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [items, setItems] = useState<RecurringMailItem[]>([]);
    const [aiDrafting, setAiDrafting] = useState(false);
    const [aiText, setAiText] = useState("");
    const [tone, setTone] = useState("Formal");
    const [language, setLanguage] = useState("English");
    const [lengthIndex, setLengthIndex] = useState(1);
    const initialLoadErrorShownRef = useRef(false);
    const [form, setForm] = useState({
        name: "",
        from: user?.email || "",
        toRaw: "",
        ccRaw: "",
        bccRaw: "",
        subject: "",
        content: "",
        timeOfDay: "09:00",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
        daysOfWeek: [1, 2, 3, 4, 5] as number[],
        isActive: true,
    });

    useEffect(() => {
        if (user?.email) setForm(prev => ({ ...prev, from: user.email }));
    }, [user?.email]);

    const fetchItems = async (options?: { silent?: boolean }) => {
        setLoading(true);
        try {
            const res = await MailService.getRecurringMails();
            if (res.success) setItems(res.data || []);
        } catch {
            if (!options?.silent) {
                toast.error("Failed to load recurring mails.");
            }
            throw new Error("Failed to load recurring mails");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let cancelled = false;
        const boot = async () => {
            try {
                await fetchItems({ silent: true });
            } catch {
                if (cancelled) return;
                await new Promise((resolve) => setTimeout(resolve, 1500));
                try {
                    await fetchItems();
                } catch {
                    if (!initialLoadErrorShownRef.current) {
                        initialLoadErrorShownRef.current = true;
                        toast.error("Recurring mail service is not ready yet. Please retry.");
                    }
                }
            }
        };
        void boot();
        return () => { cancelled = true; };
    }, []);

    const recipientCount = useMemo(() => parseEmails(form.toRaw).length, [form.toRaw]);
    const activeCampaignCount = useMemo(() => items.filter((item) => item.isActive).length, [items]);
    const totalCampaignRecipients = useMemo(
        () => items.reduce((sum, item) => sum + (item.to?.length || 0), 0),
        [items]
    );

    const toggleDay = (day: number) => {
        setForm(prev => {
            const exists = prev.daysOfWeek.includes(day);
            return {
                ...prev,
                daysOfWeek: exists ? prev.daysOfWeek.filter(d => d !== day) : [...prev.daysOfWeek, day].sort((a, b) => a - b),
            };
        });
    };

    const onCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        const to = parseEmails(form.toRaw);
        const cc = parseEmails(form.ccRaw);
        const bcc = parseEmails(form.bccRaw);
        if (!form.name || !form.from || !form.subject || !form.content || to.length === 0 || form.daysOfWeek.length === 0) {
            toast.error("Please fill all required fields.");
            return;
        }
        setSaving(true);
        try {
            const payload: RecurringMailPayload = {
                name: form.name,
                from: form.from,
                to,
                cc,
                bcc,
                subject: form.subject,
                content: form.content,
                daysOfWeek: form.daysOfWeek,
                timeOfDay: form.timeOfDay,
                timezone: form.timezone,
                isActive: form.isActive,
            };
            const res = await MailService.createRecurringMail(payload);
            if (res.success) {
                const nextRunText = res?.data?.nextRunAt ? new Date(res.data.nextRunAt).toLocaleString() : null;
                toast.success(nextRunText ? `Recurring mail created. Next run: ${nextRunText}` : "Recurring mail created.");
                setForm(prev => ({ ...prev, name: "", toRaw: "", ccRaw: "", bccRaw: "", subject: "", content: "" }));
                await fetchItems();
            }
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Failed to create recurring mail.");
        } finally {
            setSaving(false);
        }
    };

    const onToggle = async (id: string) => {
        try {
            const res = await MailService.toggleRecurringMail(id);
            const active = Boolean(res?.data?.isActive);
            toast.success(active ? "Recurring mail activated." : "Recurring mail paused.");
            await fetchItems();
        } catch {
            toast.error("Failed to toggle recurring mail.");
        }
    };

    const onRunNow = async (id: string) => {
        try {
            await MailService.runRecurringNow(id);
            toast.success("Recurring mail sent successfully.");
            await fetchItems();
        } catch {
            toast.error("Failed to run recurring mail.");
        }
    };

    const onDelete = async (id: string) => {
        try {
            await MailService.deleteRecurringMail(id);
            toast.success("Recurring mail deleted.");
            await fetchItems();
        } catch {
            toast.error("Failed to delete recurring mail.");
        }
    };

    const onAiDraft = async () => {
        if (!aiText.trim()) {
            toast.error("Enter rough text for AI draft.");
            return;
        }
        setAiDrafting(true);
        try {
            const res = await MailService.parseMagicFill(
                aiText.trim(),
                form.from,
                tone,
                language,
                LENGTH_VALUES[lengthIndex]
            );
            if (res.success && res.data) {
                setForm(prev => ({
                    ...prev,
                    subject: res.data.subject || prev.subject,
                    content: res.data.body || prev.content,
                    toRaw: res.data.to || prev.toRaw,
                }));
                toast.success("AI draft is ready.");
            }
        } catch {
            toast.error("Failed to generate AI draft.");
        } finally {
            setAiDrafting(false);
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <Repeat className="w-6 h-6 text-blue-600" />
                    Recurring Mail
                </h1>
                <p className="text-sm text-slate-500 mt-1">Send repeated emails automatically for teams, students, patients, clients, or communities.</p>
            </motion.div>

            <div className="space-y-6">
                <Card className="border-0 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base">Create Campaign</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form className="space-y-3" onSubmit={onCreate}>
                            <div className="space-y-1">
                                <Label>Campaign Name</Label>
                                <Input value={form.name} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g. Daily Morning Greeting" />
                            </div>
                            <div className="space-y-1">
                                <Label>From</Label>
                                <Input value={form.from} onChange={(e) => setForm(prev => ({ ...prev, from: e.target.value }))} />
                            </div>
                            <div className="space-y-1">
                                <Label>Recipients (multiple)</Label>
                                <Textarea value={form.toRaw} onChange={(e) => setForm(prev => ({ ...prev, toRaw: e.target.value }))} rows={3} placeholder="student1@example.com, team@example.com, client@example.com" />
                                <p className="text-[11px] text-slate-500 flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {recipientCount} recipients</p>
                            </div>
                            <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">AI Draft Assistant</p>
                                <Textarea
                                    value={aiText}
                                    onChange={(e) => setAiText(e.target.value)}
                                    rows={3}
                                    placeholder='e.g. "Write a friendly daily morning greeting to my students with one motivation line."'
                                />
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label>Tone</Label>
                                        <Select value={tone} onValueChange={setTone}>
                                            <SelectTrigger className="h-9">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {TONES.map((t) => (
                                                    <SelectItem key={t} value={t}>{t}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1">
                                        <Label>Language</Label>
                                        <Select value={language} onValueChange={setLanguage}>
                                            <SelectTrigger className="h-9">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {LANGUAGES.map((l) => (
                                                    <SelectItem key={l} value={l}>{l}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label>Length</Label>
                                        <span className="text-xs text-blue-600 font-medium">{LENGTH_LABELS[lengthIndex]}</span>
                                    </div>
                                    <Slider
                                        min={0}
                                        max={2}
                                        step={1}
                                        value={[lengthIndex]}
                                        onValueChange={(vals: number[]) => setLengthIndex(vals[0] ?? 1)}
                                    />
                                </div>
                                <Button type="button" variant="outline" className="w-full" onClick={onAiDraft} disabled={aiDrafting}>
                                    {aiDrafting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                    {aiDrafting ? "Generating..." : "Generate with AI"}
                                </Button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label>CC (optional)</Label>
                                    <Textarea value={form.ccRaw} onChange={(e) => setForm(prev => ({ ...prev, ccRaw: e.target.value }))} rows={2} />
                                </div>
                                <div className="space-y-1">
                                    <Label>BCC (optional)</Label>
                                    <Textarea value={form.bccRaw} onChange={(e) => setForm(prev => ({ ...prev, bccRaw: e.target.value }))} rows={2} />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label>Subject</Label>
                                <Input value={form.subject} onChange={(e) => setForm(prev => ({ ...prev, subject: e.target.value }))} />
                            </div>
                            <div className="space-y-1">
                                <Label>Message</Label>
                                <Textarea value={form.content} onChange={(e) => setForm(prev => ({ ...prev, content: e.target.value }))} rows={5} />
                            </div>
                            <div className="space-y-1">
                                <Label>Days</Label>
                                <div className="flex flex-wrap gap-2">
                                    {DAYS.map((d) => {
                                        const active = form.daysOfWeek.includes(d.value);
                                        return (
                                            <button
                                                key={d.value}
                                                type="button"
                                                onClick={() => toggleDay(d.value)}
                                                className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${active ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-white text-slate-600 border-slate-200"}`}
                                            >
                                                {d.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label>Time</Label>
                                    <Input type="time" value={form.timeOfDay} onChange={(e) => setForm(prev => ({ ...prev, timeOfDay: e.target.value }))} />
                                </div>
                                <div className="space-y-1">
                                    <Label>Timezone</Label>
                                    <Input value={form.timezone} onChange={(e) => setForm(prev => ({ ...prev, timezone: e.target.value }))} />
                                </div>
                            </div>
                            <div className="flex items-center justify-between rounded-lg border border-slate-200 p-2.5">
                                <span className="text-sm font-medium text-slate-700">Active</span>
                                <button type="button" onClick={() => setForm(prev => ({ ...prev, isActive: !prev.isActive }))}>
                                    {form.isActive ? <ToggleRight className="w-6 h-6 text-blue-600" /> : <ToggleLeft className="w-6 h-6 text-slate-400" />}
                                </button>
                            </div>
                            <Button type="submit" className="w-full h-10 text-white bg-blue-600 hover:bg-blue-700" disabled={saving}>
                                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                Save Recurring Mail
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="border-0 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base">Quick Overview</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-3 gap-3">
                            <div className="rounded-xl border border-slate-200 bg-white p-3">
                                <p className="text-xs text-slate-500">Total</p>
                                <p className="text-xl font-bold text-slate-800">{items.length}</p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-white p-3">
                                <p className="text-xs text-slate-500">Active</p>
                                <p className="text-xl font-bold text-emerald-600">{activeCampaignCount}</p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-white p-3">
                                <p className="text-xs text-slate-500">Recipients</p>
                                <p className="text-xl font-bold text-blue-600">{totalCampaignRecipients}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="lg:col-span-2 border-0 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base">Draft Preview</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="text-sm text-slate-700">
                                <span className="font-semibold">Subject:</span> {form.subject || "Not set"}
                            </div>
                            <div className="text-sm text-slate-700">
                                <span className="font-semibold">Recipients:</span> {recipientCount}
                            </div>
                            <div className="text-sm text-slate-700">
                                <span className="font-semibold">Schedule:</span> {form.daysOfWeek.length ? form.daysOfWeek.map((d) => DAYS.find((x) => x.value === d)?.label).join(", ") : "No days"} at {form.timeOfDay} ({form.timezone})
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 max-h-32 overflow-y-auto">
                                {form.content || "Your message preview appears here."}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="border-0 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base">Campaigns</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="h-40 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-blue-500" /></div>
                        ) : items.length === 0 ? (
                            <p className="text-sm text-slate-500">No recurring campaigns yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {items.map((item) => (
                                    <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                            <div>
                                                <p className="font-semibold text-slate-800">{item.name}</p>
                                                <p className="text-xs text-slate-500 mt-0.5">{item.subject}</p>
                                            </div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <Badge variant="secondary" className={item.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}>
                                                    {item.isActive ? "Active" : "Paused"}
                                                </Badge>
                                                <Badge variant="outline">{item.to?.length || 0} recipients</Badge>
                                            </div>
                                        </div>
                                        <div className="mt-2 text-xs text-slate-600 flex items-center gap-2 flex-wrap">
                                            <CalendarClock className="w-3.5 h-3.5 text-blue-500" />
                                            Next: {new Date(item.nextRunAt).toLocaleString()}
                                            {item.lastSentAt ? <span className="text-slate-400">| Last: {new Date(item.lastSentAt).toLocaleString()}</span> : null}
                                        </div>
                                        <div className="mt-3 flex items-center gap-2 flex-wrap">
                                            <Button size="sm" variant="outline" onClick={() => onToggle(item.id)}>
                                                {item.isActive ? <ToggleRight className="w-3.5 h-3.5 mr-1" /> : <ToggleLeft className="w-3.5 h-3.5 mr-1" />}
                                                {item.isActive ? "Pause" : "Activate"}
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={() => onRunNow(item.id)}>
                                                <Play className="w-3.5 h-3.5 mr-1" />
                                                Run Now
                                            </Button>
                                            <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => onDelete(item.id)}>
                                                <Trash2 className="w-3.5 h-3.5 mr-1" />
                                                Delete
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default RecurringMailPage;
