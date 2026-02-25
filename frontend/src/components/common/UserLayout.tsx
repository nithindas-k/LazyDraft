import { Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import {
    SidebarProvider,
    DesktopSidebar,
    MobileDrawer,
    MobileTopBar,
    useSidebar,
} from "@/components/common/AppSidebar";

// Inner component so it can use useSidebar context
function LayoutContent() {
    const { collapsed } = useSidebar();

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Desktop sidebar */}
            <DesktopSidebar />

            {/* Mobile top bar + drawer */}
            <MobileTopBar />
            <MobileDrawer />

            {/* Main content — shifts right based on sidebar width */}
            <motion.main
                className="min-h-screen"
                animate={{ paddingLeft: collapsed ? 64 : 240 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
                {/* Mobile top offset */}
                <div className="pt-14 lg:pt-0">
                    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
                        <Outlet />
                    </div>
                </div>
            </motion.main>
        </div>
    );
}

export function UserLayout() {
    return (
        <SidebarProvider>
            <LayoutContent />
        </SidebarProvider>
    );
}
