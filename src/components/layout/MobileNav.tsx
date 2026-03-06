/**
 * Mobile Nav - Bottom navigation for mobile devices
 */

import { cn } from "@/lib/utils";
import {
    Home,
    Baby,
    Search,
    Calendar,
    MessageSquare,
    FileText,
    DollarSign
} from "lucide-react";
import { useLocation, Link } from "react-router-dom";

interface MobileNavProps {
    role?: "parent" | "sitter";
}

export function MobileNav({ role }: MobileNavProps) {
    const location = useLocation();

    const parentMenuItems = [
        { icon: Home, label: "Ana Sayfa", href: "/" },
        { icon: Search, label: "Bakıcı Bul", href: "/find-sitter" },
        { icon: Calendar, label: "Rezervasyonlar", href: "/bookings" },
        { icon: Baby, label: "Çocuklarım", href: "/children" },
        { icon: MessageSquare, label: "Mesajlar", href: "/messages" },
    ];

    const sitterMenuItems = [
        { icon: Home, label: "Ana Sayfa", href: "/" },
        { icon: FileText, label: "İlanlar", href: "/need-posts" },
        { icon: Calendar, label: "İş İlanlarım", href: "/jobpost" },
        { icon: DollarSign, label: "Kazanç", href: "/earnings" },
        { icon: MessageSquare, label: "Mesajlar", href: "/messages" },
    ];

    const menuItems = role === "parent" ? parentMenuItems : sitterMenuItems;
    const activeColor = role === "parent" ? "text-blue-600" : "text-green-600";

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-inset-bottom">
            <nav className="flex items-center justify-around h-16 px-2">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.href ||
                        (item.href === "/" && location.pathname === "/dashboard");

                    return (
                        <Link
                            key={item.href}
                            to={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg flex-1 transition-colors",
                                isActive ? activeColor : "text-gray-600"
                            )}
                        >
                            <Icon className={cn("h-5 w-5", isActive && "stroke-[2.5]")} />
                            <span className="text-xs font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
