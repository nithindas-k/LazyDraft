import React from "react";
import { motion } from "framer-motion";
import { Inbox } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const HistoryPage: React.FC = () => (
    <div className="space-y-6">
        <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            <h1 className="text-2xl font-bold text-slate-800">Email History</h1>
            <p className="text-slate-500 mt-1 text-sm">
                All emails you've sent through LazyDraft.
            </p>
        </motion.div>

        <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.4 }}
        >
            <Card className="border-0 shadow-sm">
                <CardContent className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
                        <Inbox className="w-8 h-8 text-slate-300" />
                    </div>
                    <div>
                        <p className="font-semibold text-slate-700">No emails yet</p>
                        <p className="text-sm text-slate-400 mt-1">
                            Emails you send will appear here.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    </div>
);

export default HistoryPage;
