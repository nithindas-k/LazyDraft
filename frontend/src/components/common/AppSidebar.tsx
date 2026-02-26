import React, { createContext, useContext, useState } from "react";
import { NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    LayoutDashboard,
    Mail,
    History,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Zap,
    Menu,
    X,
    Settings,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { Separator } from "../../components/ui/separator";
import { APP_ROUTES } from "../../constants/routes";
import { useAuth } from "../../contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";

// ─── Types ───────────────────────────────────────────────────────────────────
interface NavItem {
    label: string;
    href: string;
    icon: React.ElementType;
}

// ─── Navigation items ────────────────────────────────────────────────────────
const NAV_ITEMS: NavItem[] = [
    { label: "Dashboard", href: APP_ROUTES.USER.DASHBOARD, icon: LayoutDashboard },
    { label: "Mail Sender", href: APP_ROUTES.USER.MAIL_SENDER, icon: Mail },
    { label: "History", href: APP_ROUTES.USER.HISTORY, icon: History },
];

// ─── Sidebar Context ─────────────────────────────────────────────────────────
interface SidebarCtx {
    collapsed: boolean;
    toggle: () => void;
    mobileOpen: boolean;
    setMobileOpen: (v: boolean) => void;
}
const SidebarContext = createContext<SidebarCtx>({
    collapsed: false,
    toggle: () => { },
    mobileOpen: false,
    setMobileOpen: () => { },
});
export const useSidebar = () => useContext(SidebarContext);


export function SidebarProvider({ children }: { children: React.ReactNode }) {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    return (
        <SidebarContext.Provider value={{
            collapsed,
            toggle: () => setCollapsed(p => !p),
            mobileOpen,
            setMobileOpen,
        }}>
            {children}
        </SidebarContext.Provider>
    );
}


function SidebarLogo({ collapsed }: { collapsed: boolean }) {
    return (
        <div className="flex items-center gap-2.5 px-4 h-16">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <AnimatePresence>
                {!collapsed && (
                    <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.2 }}
                        className="font-bold text-slate-800 text-lg tracking-tight overflow-hidden whitespace-nowrap"
                    >
                        LazyDraft
                    </motion.span>
                )}
            </AnimatePresence>
        </div>
    );
}


function SidebarNavItem({ item, collapsed, onClick }: {
    item: NavItem;
    collapsed: boolean;
    onClick?: () => void;
}) {
    const Icon = item.icon;
    return (
        <NavLink
            to={item.href}
            onClick={onClick}
            className={({ isActive }) =>
                cn(
                    "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    "hover:bg-blue-50 hover:text-blue-700",
                    isActive
                        ? "bg-blue-50 text-blue-700 shadow-sm"
                        : "text-slate-600"
                )
            }
        >
            {({ isActive }) => (
                <>
                    {/* Active indicator bar */}
                    {isActive && (
                        <motion.span
                            layoutId="active-pill"
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-500 rounded-r-full"
                        />
                    )}

                    <Icon
                        className={cn(
                            "flex-shrink-0 w-5 h-5 transition-colors",
                            isActive ? "text-blue-600" : "text-slate-400 group-hover:text-blue-500"
                        )}
                    />

                    <AnimatePresence>
                        {!collapsed && (
                            <motion.span
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: "auto" }}
                                exit={{ opacity: 0, width: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden whitespace-nowrap"
                            >
                                {item.label}
                            </motion.span>
                        )}
                    </AnimatePresence>

                    {/* Tooltip when collapsed */}
                    {collapsed && (
                        <span className="
                            absolute left-full ml-3 px-2.5 py-1.5 text-xs font-medium
                            bg-slate-800 text-white rounded-lg opacity-0 pointer-events-none
                            group-hover:opacity-100 transition-opacity whitespace-nowrap z-50
                            shadow-lg
                        ">
                            {item.label}
                        </span>
                    )}
                </>
            )}
        </NavLink>
    );
}

// ─── User Profile Dropdown ────────────────────────────────────────────────────
function UserProfileDropdown({ collapsed }: { collapsed?: boolean }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    if (!user) return null;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    className={cn(
                        "w-full flex items-center gap-2.5 rounded-xl p-1.5 text-sm text-left hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-100",
                        collapsed ? "justify-center" : "justify-start"
                    )}
                >
                    <Avatar className="w-8 h-8 shrink-0">
                        <AvatarImage src={user.profilePic} />
                        <AvatarFallback className="bg-blue-100 text-blue-700 font-bold text-xs ring-1 ring-blue-200">
                            {user.name?.charAt(0)?.toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    {!collapsed && (
                        <div className="flex-1 overflow-hidden">
                            <p className="text-[13px] font-semibold text-slate-800 leading-tight truncate">{user.name}</p>
                            <p className="text-[11px] text-slate-500 leading-tight truncate">{user.email}</p>
                        </div>
                    )}
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={collapsed ? "start" : "start"} className="w-56 bg-white" sideOffset={12}>
                <DropdownMenuLabel className="font-semibold text-slate-800">My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate(APP_ROUTES.USER.SETTINGS)} className="cursor-pointer py-2">
                    <Settings className="mr-2 w-4 h-4 text-slate-500" />
                    <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700 py-2">
                    <LogOut className="mr-2 w-4 h-4" />
                    <span>Log out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

// ─── Sidebar Inner ────────────────────────────────────────────────────────────
function SidebarInner({ onNavClick }: { onNavClick?: () => void }) {
    const { collapsed, toggle } = useSidebar();

    return (
        <div className="flex flex-col h-full">
            {/* Logo + collapse button */}
            <div className="flex items-center justify-between pr-2">
                <SidebarLogo collapsed={collapsed} />
                {/* Collapse toggle — desktop only */}
                <button
                    onClick={toggle}
                    className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors flex-shrink-0"
                    aria-label="Toggle sidebar"
                >
                    {collapsed
                        ? <ChevronRight className="w-4 h-4" />
                        : <ChevronLeft className="w-4 h-4" />
                    }
                </button>
            </div>

            <Separator className="mb-3" />

            {/* Nav label */}
            <AnimatePresence>
                {!collapsed && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="px-4 mb-1.5 text-[10px] font-semibold tracking-widest text-slate-400 uppercase"
                    >
                        Menu
                    </motion.p>
                )}
            </AnimatePresence>

            {/* Nav items */}
            <nav className="flex-1 px-2 space-y-1 overflow-y-auto">
                {NAV_ITEMS.map(item => (
                    <SidebarNavItem
                        key={item.href}
                        item={item}
                        collapsed={collapsed}
                        onClick={onNavClick}
                    />
                ))}
            </nav>

            {/* Bottom: Profile Dropdown */}
            <div className="px-2 pb-4 pt-3 mt-auto">
                <Separator className="mb-3" />
                <UserProfileDropdown collapsed={collapsed} />
            </div>
        </div>
    );
}

// ─── Mobile Drawer ────────────────────────────────────────────────────────────
function MobileDrawer() {
    const { mobileOpen, setMobileOpen } = useSidebar();
    return (
        <AnimatePresence>
            {mobileOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        key="backdrop"
                        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setMobileOpen(false)}
                    />
                    {/* Drawer panel */}
                    <motion.aside
                        key="drawer"
                        className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-100 shadow-2xl lg:hidden"
                        initial={{ x: -260 }}
                        animate={{ x: 0 }}
                        exit={{ x: -260 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
                        {/* Close button */}
                        <button
                            onClick={() => setMobileOpen(false)}
                            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                        <SidebarInner onNavClick={() => setMobileOpen(false)} />
                    </motion.aside>
                </>
            )}
        </AnimatePresence>
    );
}

// ─── Desktop Sidebar ──────────────────────────────────────────────────────────
function DesktopSidebar() {
    const { collapsed } = useSidebar();
    return (
        <motion.aside
            className="hidden lg:flex flex-col fixed inset-y-0 left-0 z-30 bg-white border-r border-slate-100 shadow-sm overflow-visible"
            animate={{ width: collapsed ? 64 : 240 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
            <SidebarInner />
        </motion.aside>
    );
}

// ─── Mobile Top Bar ───────────────────────────────────────────────────────────
function MobileTopBar() {
    const { setMobileOpen } = useSidebar();
    return (
        <header className="lg:hidden fixed top-0 inset-x-0 z-30 h-14 bg-white border-b border-slate-100 flex items-center justify-between px-4 shadow-sm">
            <div className="flex items-center gap-3">
                <button
                    onClick={() => setMobileOpen(true)}
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
                    aria-label="Open menu"
                >
                    <Menu className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                        <Zap className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                    </div>
                    <span className="font-bold text-slate-800 text-base">LazyDraft</span>
                </div>
            </div>

            <div className="scale-90 opacity-90 hover:opacity-100 -mr-2">
                <UserProfileDropdown collapsed={true} />
            </div>
        </header>
    );
}

// ─── Desktop Top Bar ──────────────────────────────────────────────────────────
function DesktopTopBar() {
    return (
        <header className="hidden lg:flex sticky top-0 z-20 h-16 bg-white/80 backdrop-blur-md border-b border-slate-100 items-center justify-end px-8 shadow-sm">
            <div className="flex items-center gap-4">
                <UserProfileDropdown collapsed={true} />
            </div>
        </header>
    );
}

// ─── Exports ──────────────────────────────────────────────────────────────────
export { DesktopSidebar, MobileDrawer, MobileTopBar, DesktopTopBar };
