import { Outlet } from "react-router-dom";

import {
    SidebarProvider,
    DesktopSidebar,
    MobileDrawer,
    MobileTopBar,
    DesktopTopBar,
    useSidebar,
} from "../../components/common/AppSidebar";
import { useAuth } from "../../contexts/AuthContext";
import { AlertTriangle } from "lucide-react";


function LayoutContent() {
    const { collapsed } = useSidebar();
    const { user } = useAuth();

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Desktop sidebar */}
            <DesktopSidebar />

            {/* Mobile top bar + drawer */}
            <MobileTopBar />
            <MobileDrawer />

            {/* Main content — shifts right based on sidebar width */}
            <main
                className={`flex-1 flex flex-col transition-[padding] duration-300 ease-in-out ${collapsed ? "lg:pl-16" : "lg:pl-[240px]"
                    }`}
            >
                {/* Desktop Top Bar */}
                <DesktopTopBar />

                {/* Email Verification Banner */}
                {user && user.isEmailVerified === false && (
                    <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 mt-14 lg:mt-0 flex items-center justify-center gap-2 shadow-sm relative z-10 w-full">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <p className="text-[13px] sm:text-sm text-amber-800 font-medium text-center">
                            Action Required: Please verify your email address to access all features. We've sent a link to your inbox.
                        </p>
                    </div>
                )}

                {/* Mobile top offset applied only if banner isn't showing, otherwise handled contextually */}
                <div className={user?.isEmailVerified === false ? "" : "pt-14 lg:pt-0"}>
                    <div className="p-6 lg:p-8 max-w-6xl mx-auto w-full">
                        <Outlet />
                    </div>
                </div>
            </main>
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
