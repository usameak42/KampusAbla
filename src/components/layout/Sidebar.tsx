/**
 * Sidebar - Desktop navigation sidebar
 */

import { cn } from "@/lib/utils";
import {
    Home,
    Baby,
    Search,
    Calendar,
    MessageSquare,
    Settings,
    FileText,
    DollarSign,
    LayoutDashboard,
    CreditCard
} from "lucide-react";
import { useLocation, Link } from "react-router-dom";

interface SidebarProps {
    role?: "parent" | "sitter";
}

export function Sidebar({ role }: SidebarProps) {
    const location = useLocation();

    const parentMenuItems = [
        { icon: Home, label: "Dashboard", href: "/" },
        { icon: Baby, label: "Çocuklarım", href: "/children" },
        { icon: Search, label: "Bakıcı Bul", href: "/find-sitter" },
        { icon: Calendar, label: "Rezervasyonlarım", href: "/bookings" },
        { icon: FileText, label: "İhtiyaç İlanlarım", href: "/my-needs" },
        { icon: MessageSquare, label: "Mesajlar", href: "/messages" },
        { icon: Settings, label: "Ayarlar", href: "/settings" },
    ];

    const sitterMenuItems = [
        { icon: Home, label: "Dashboard", href: "/" },
        { icon: FileText, label: "İhtiyaç İlanları", href: "/need-posts" },
        { icon: Calendar, label: "İş İlanlarım", href: "/jobpost" },
        { icon: MessageSquare, label: "Mesajlar", href: "/messages" },
        { icon: CreditCard, label: "Kazançlarım", href: "/earnings" },
        { icon: FileText, label: "İlanlarım", href: "/my-sitter-posts" },
        { icon: LayoutDashboard, label: "İstatistikler", href: "/stats" },
        { icon: Settings, label: "Ayarlar", href: "/settings" },
    ];

    const menuItems = role === "parent" ? parentMenuItems : sitterMenuItems;
    const sidebarColor = role === "parent" ? "bg-primary/5" : "bg-accent/10";
    const activeColor = role === "parent" ? "bg-primary/10 text-primary" : "bg-accent/20 text-accent-foreground";

    return (
        <div className={cn("w-64 min-h-screen border-r border-gray-200", sidebarColor)}>
            <nav className="pt-20 px-3 space-y-1">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.href || 
                        (item.href === "/" && location.pathname === "/dashboard") ||
                        (item.href === "/jobpost" && location.pathname === "/bookings");

                    return (
                        <Link
                            key={item.href}
                            to={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                                isActive
                                    ? activeColor
                                    : "text-gray-700 hover:bg-gray-100"
                            )}
                        >
                            <Icon className="h-5 w-5" />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
