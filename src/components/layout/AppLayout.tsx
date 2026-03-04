/**
 * App Layout - Main layout wrapper with responsive navigation
 */

import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
    children: ReactNode;
    className?: string;
}

export function AppLayout({ children, className }: AppLayoutProps) {
    const { user } = useAuth();
    const userRole = user?.user_metadata?.role as "parent" | "sitter" | undefined;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <Header />

            <div className="flex">
                {/* Desktop Sidebar */}
                <aside className="hidden lg:block">
                    <Sidebar role={userRole} />
                </aside>

                {/* Main Content */}
                <main
                    className={cn(
                        "flex-1 w-full",
                        "pb-20 lg:pb-6", // Extra padding bottom for mobile nav
                        "px-4 sm:px-6 lg:px-8",
                        "pt-20", // Space for fixed header
                        className
                    )}
                >
                    <div className="mx-auto max-w-7xl py-6">
                        {children}
                    </div>
                </main>
            </div>

            {/* Mobile Bottom Navigation */}
            <div className="lg:hidden">
                <MobileNav role={userRole} />
            </div>
        </div>
    );
}
