import React, { useState } from "react";
import { motion } from "framer-motion";
import { Settings, Save, ShieldCheck, Mail, User as UserIcon, Loader2, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { useAuth } from "../../contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const G_BLUE = "#4285F4";

const SettingsPage: React.FC = () => {
    const { user, updateProfile } = useAuth();

    
    const [name, setName] = useState(user?.name || "");
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null);

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
        </div>
    );
};

export default SettingsPage;
