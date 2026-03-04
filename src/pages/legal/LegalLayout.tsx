/**
 * LegalLayout - Shared layout for legal pages
 */

import { useEffect, useState } from "react";
import { ArrowLeft, FileText, Menu, X } from "lucide-react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface LegalLayoutProps {
    title: string;
    lastUpdated?: string;
    children: React.ReactNode;
}

const LEGAL_PAGES = [
    { path: "/terms", label: "Kullanım Koşulları" },
    { path: "/privacy", label: "Gizlilik Politikası" },
    { path: "/kvkk", label: "KVKK Aydınlatma Metni" },
    { path: "/cookies", label: "Çerez Politikası" },
];

export function LegalLayout({ title, lastUpdated, children }: LegalLayoutProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Close mobile menu on navigation
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [location.pathname]);

    const Sidebar = () => (
        <div className="space-y-1">
            {LEGAL_PAGES.map((page) => (
                <Link
                    key={page.path}
                    to={page.path}
                    className={cn(
                        "block px-3 py-2 rounded-lg text-sm transition-colors",
                        location.pathname === page.path
                            ? "bg-purple-100 text-purple-700 font-medium"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                >
                    {page.label}
                </Link>
            ))}
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            <div className="container max-w-5xl mx-auto px-4 py-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-xl font-semibold flex items-center gap-2">
                                <FileText className="h-5 w-5 text-purple-500" />
                                {title}
                            </h1>
                            {lastUpdated && (
                                <p className="text-sm text-muted-foreground">
                                    Son güncelleme: {lastUpdated}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Mobile menu */}
                    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="icon" className="md:hidden">
                                <Menu className="h-5 w-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-64">
                            <div className="mt-6">
                                <h3 className="font-semibold mb-4">Yasal Sayfalar</h3>
                                <Sidebar />
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>

                {/* Main content */}
                <div className="flex gap-8">
                    {/* Desktop Sidebar */}
                    <aside className="hidden md:block w-56 flex-shrink-0">
                        <div className="sticky top-6">
                            <h3 className="font-semibold mb-4 text-sm text-muted-foreground">
                                Yasal Sayfalar
                            </h3>
                            <Sidebar />
                        </div>
                    </aside>

                    {/* Content */}
                    <main className="flex-1 min-w-0">
                        <div className="bg-white rounded-xl border p-6 md:p-8">
                            <article className="prose prose-gray max-w-none prose-headings:text-gray-900 prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4 prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-3 prose-p:text-gray-600 prose-li:text-gray-600">
                                {children}
                            </article>
                        </div>
                    </main>
                </div>

                {/* Footer */}
                <footer className="mt-8 pt-6 border-t text-center text-sm text-muted-foreground">
                    <p>© 2024 KampusAbla. Tüm hakları saklıdır.</p>
                    <p className="mt-1 text-xs">
                        Sorularınız için:{" "}
                        <a href="mailto:legal@kampusabla.com" className="text-purple-600 hover:underline">
                            legal@kampusabla.com
                        </a>
                    </p>
                </footer>
            </div>
        </div>
    );
}
