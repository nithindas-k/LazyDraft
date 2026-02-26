import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface DraftRestoreBannerProps {
    show: boolean;
    onRestore: () => void;
    onDismiss: () => void;
}

export function DraftRestoreBanner({ show, onRestore, onDismiss }: DraftRestoreBannerProps) {
    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0, y: -10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -10, height: 0 }}
                    transition={{ duration: 0.25 }}
                >
                    <Alert className="border border-blue-200 bg-blue-50 text-blue-800 rounded-xl">
                        <AlertDescription className="flex items-center justify-between gap-3 flex-wrap">
                            <span className="text-sm font-medium">
                                 You have a saved draft — restore it?
                            </span>
                            <div className="flex items-center gap-2">
                                <Button
                                    id="draft-restore-btn"
                                    size="sm"
                                    onClick={onRestore}
                                    className="h-7 px-3 text-xs text-white rounded-lg"
                                    style={{ backgroundColor: "#4285F4" }}
                                >
                                    <RotateCcw className="w-3 h-3 mr-1" />
                                    Restore
                                </Button>
                                <Button
                                    id="draft-dismiss-btn"
                                    size="sm"
                                    variant="ghost"
                                    onClick={onDismiss}
                                    className="h-7 px-2 text-xs text-blue-700 hover:bg-blue-100 rounded-lg"
                                >
                                    <X className="w-3 h-3" />
                                </Button>
                            </div>
                        </AlertDescription>
                    </Alert>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
