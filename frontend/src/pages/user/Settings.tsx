import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Settings, Save, ShieldCheck, Mail, User as UserIcon, Loader2, Info, Bot, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { useAuth } from "../../contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MailService } from "@/services/mail.service";

const G_BLUE = "#4285F4";

const SettingsPage: React.FC = () => {
    const { user, updateProfile } = useAuth();

    
    const [name, setName] = useState(user?.name || "");
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null);
    const [autoReplyEnabled, setAutoReplyEnabled] = useState(false);
    const [autoReplyMode, setAutoReplyMode] = useState<"manual" | "auto">("manual");
    const [autoReplySignature, setAutoReplySignature] = useState("");
    const [autoReplyCooldownMinutes, setAutoReplyCooldownMinutes] = useState(120);
    const [autoSaving, setAutoSaving] = useState(false);
    const [isRunning, setIsRunning] = useState(false);

    useEffect(() => {
        const loadAutoReply = async () => {
            try {
                const result = await MailService.getAutoReplySettings();
                if (result?.success && result?.data) {
                    setAutoReplyEnabled(!!result.data.autoReplyEnabled);
                    setAutoReplyMode(result.data.autoReplyMode || "manual");
                    setAutoReplySignature(result.data.autoReplySignature || "");
                    setAutoReplyCooldownMinutes(Number(result.data.autoReplyCooldownMinutes || 120));
                }
            } catch {
                // keep defaults silently
            }
        };
        loadAutoReply();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsSaving(true);
        setMessage(null);

        try {
            const result = await updateProfile(name);
            setMessage({
                type: result.success ? "success" : "error",
                text: result.message
            });

            // Auto-hide success message after 3 seconds
            if (result.success) {
                setTimeout(() => setMessage(null), 3000);
            }
        } catch (error) {
            setMessage({ type: "error", text: "Something went wrong. Please try again." });
        } finally {
            setIsSaving(false);
        }
    };

    const saveAutoReplySettings = async () => {
        setAutoSaving(true);
        setMessage(null);
        try {
            const result = await MailService.updateAutoReplySettings({
                autoReplyEnabled,
                autoReplyMode,
                autoReplySignature,
                autoReplyCooldownMinutes,
            });
            if (result.success) {
                setMessage({ type: "success", text: "Auto-reply settings updated." });
                setTimeout(() => setMessage(null), 3000);
            } else {
                setMessage({ type: "error", text: "Failed to update auto-reply settings." });
            }
        } catch {
            setMessage({ type: "error", text: "Failed to update auto-reply settings." });
        } finally {
            setAutoSaving(false);
        }
    };

    const runAutoReplyNow = async () => {
        setIsRunning(true);
        setMessage(null);
        try {
            const result = await MailService.runAutoReplyNow();
            if (result.success) {
                setMessage({ type: "success", text: `Scan complete. Processed ${result.data?.processed ?? 0} message(s).` });
                setTimeout(() => setMessage(null), 3000);
            } else {
                setMessage({ type: "error", text: "Auto-reply scan failed." });
            }
        } catch {
            setMessage({ type: "error", text: "Auto-reply scan failed." });
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <div className="flex items-center gap-2 mb-1">
                    <Settings className="w-6 h-6 text-slate-700" />
                    <h1 className="text-2xl font-bold text-slate-800">Account Settings</h1>
                </div>
                <p className="text-slate-500 text-sm">
                    Manage your profile details and account preferences.
                </p>
            </motion.div>

            {/* Profile Card */}
            <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1, duration: 0.4 }}
            >
                <Card className="border-0 shadow-md overflow-hidden">
                    <CardHeader className="bg-slate-50 border-b border-slate-100 pb-6">
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                            <Avatar className="w-24 h-24 border-4 border-white shadow-sm">
                                <AvatarImage src={user?.profilePic} alt={user?.name} />
                                <AvatarFallback className="bg-blue-100 text-blue-700 text-2xl font-bold">
                                    {user?.name?.charAt(0)?.toUpperCase() || "U"}
                                </AvatarFallback>
                            </Avatar>

                            <div className="text-center sm:text-left pt-2">
                                <CardTitle className="text-2xl text-slate-800">{user?.name}</CardTitle>
                                <CardDescription className="text-base mt-1 flex items-center justify-center sm:justify-start gap-1.5">
                                    {user?.email}
                                    {user?.isEmailVerified && (
                                        <span className="inline-flex items-center justify-center p-0.5 rounded-full bg-green-100 text-green-700" title="Verified Google Account">
                                            <ShieldCheck className="w-3.5 h-3.5" />
                                        </span>
                                    )}
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-6 sm:p-8">
                        <form onSubmit={handleSave} className="space-y-6 max-w-2xl">

                            {/* Message Banner */}
                            {message && (
                                <div className={`p-4 rounded-lg flex items-start gap-3 text-sm ${message.type === "success"
                                    ? "bg-green-50 text-green-800 border border-green-200"
                                    : "bg-red-50 text-red-800 border border-red-200"
                                    }`}>
                                    <Info className={`w-5 h-5 shrink-0 ${message.type === "success" ? "text-green-600" : "text-red-600"}`} />
                                    <span>{message.text}</span>
                                </div>
                            )}

                            {/* Name Input */}
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-slate-700 font-medium flex items-center gap-1.5">
                                    <UserIcon className="w-4 h-4 text-slate-400" />
                                    Display Name
                                </Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Enter your name"
                                    className="max-w-md focus-visible:ring-blue-500"
                                    required
                                />
                                <p className="text-xs text-slate-500">
                                    This is the name we use to personalize your experience and when signing your AI drafts.
                                </p>
                            </div>

                            {/* Email Input (Read Only) */}
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-slate-700 font-medium flex items-center gap-1.5">
                                    <Mail className="w-4 h-4 text-slate-400" />
                                    Email Address
                                </Label>
                                <Input
                                    id="email"
                                    value={user?.email || ""}
                                    readOnly
                                    className="max-w-md bg-slate-50 text-slate-500 cursor-not-allowed border-slate-200"
                                />
                                <p className="text-xs text-slate-500 flex items-center gap-1">
                                    <span>Linked to your Google Account.</span>
                                    {user?.isEmailVerified ? (
                                        <span className="text-green-600 font-medium flex items-center gap-1">
                                            <ShieldCheck className="w-3 h-3" /> Verified
                                        </span>
                                    ) : (
                                        <span className="text-amber-600 font-medium">Unverified</span>
                                    )}
                                </p>
                            </div>

                            <div className="pt-4 border-t border-slate-100">
                                <Button
                                    type="submit"
                                    disabled={isSaving || !name.trim() || name === user?.name}
                                    style={{ backgroundColor: G_BLUE }}
                                    className="text-white hover:opacity-90 font-medium shadow-sm w-full sm:w-auto px-6"
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Saving Changes...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4 mr-2" />
                                            Save Changes
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15, duration: 0.4 }}
            >
                <Card className="border-0 shadow-md overflow-hidden">
                    <CardHeader className="bg-slate-50 border-b border-slate-100 pb-6">
                        <div className="flex items-center gap-2">
                            <Bot className="w-5 h-5 text-slate-700" />
                            <CardTitle className="text-lg text-slate-800">AI Auto Reply</CardTitle>
                        </div>
                        <CardDescription>
                            Configure inbound Gmail auto-replies with safe defaults and manual approval mode.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 sm:p-8 space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="auto-reply-enabled">Auto Reply</Label>
                                <label className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                                    <span className="text-sm text-slate-700">Enable auto-reply worker</span>
                                    <input
                                        id="auto-reply-enabled"
                                        type="checkbox"
                                        checked={autoReplyEnabled}
                                        onChange={(e) => setAutoReplyEnabled(e.target.checked)}
                                        className="h-4 w-4 rounded border-slate-300 accent-[#4285F4]"
                                    />
                                </label>
                            </div>

                            <div className="space-y-2">
                                <Label>Mode</Label>
                                <Select value={autoReplyMode} onValueChange={(v: "manual" | "auto") => setAutoReplyMode(v)}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select mode" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="manual">Manual Approval</SelectItem>
                                        <SelectItem value="auto">Fully Automatic</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="auto-reply-cooldown">Cooldown (minutes)</Label>
                                <Input
                                    id="auto-reply-cooldown"
                                    type="number"
                                    min={10}
                                    max={10080}
                                    value={autoReplyCooldownMinutes}
                                    onChange={(e) => setAutoReplyCooldownMinutes(Number(e.target.value || 120))}
                                />
                                <p className="text-xs text-slate-500">Limits multiple replies in the same thread.</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="auto-reply-signature">Signature</Label>
                                <Textarea
                                    id="auto-reply-signature"
                                    value={autoReplySignature}
                                    onChange={(e) => setAutoReplySignature(e.target.value)}
                                    rows={4}
                                    placeholder={"Best regards,\nYour Name\nYour Team"}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-slate-100">
                            <Button
                                type="button"
                                onClick={saveAutoReplySettings}
                                disabled={autoSaving}
                                style={{ backgroundColor: G_BLUE }}
                                className="text-white hover:opacity-90 w-full sm:w-auto"
                            >
                                {autoSaving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        Save Auto Reply
                                    </>
                                )}
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                onClick={runAutoReplyNow}
                                disabled={isRunning}
                                className="w-full sm:w-auto"
                            >
                                {isRunning ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Running Scan...
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw className="w-4 h-4 mr-2" />
                                        Run Scan Now
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
};

export default SettingsPage;
