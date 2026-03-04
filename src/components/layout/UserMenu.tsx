/**
 * User Menu - Dropdown menu with user info and logout
 */

import { LogOut, Settings, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthentication } from "@/hooks/useAuthentication";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function UserMenu() {
    const { user } = useAuth();
    const { handleSignOut } = useAuthentication();

    const fullName = user?.user_metadata?.full_name || "User";
    const role = user?.user_metadata?.role as "parent" | "sitter" | undefined;
    const initials = fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger className="focus:outline-none">
                <Avatar className="h-9 w-9 cursor-pointer ring-2 ring-offset-2 ring-transparent hover:ring-primary transition-all">
                    <AvatarImage src={user?.user_metadata?.profile_photo_url} />
                    <AvatarFallback className="bg-primary text-white">
                        {initials}
                    </AvatarFallback>
                </Avatar>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                    <div className="flex flex-col">
                        <span className="font-semibold">{fullName}</span>
                        <span className="text-xs text-muted-foreground capitalize">
                            {role === "parent" ? "Veli" : "Bakıcı"}
                        </span>
                    </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={() => window.location.href = "/profile"}>
                    <User className="mr-2 h-4 w-4" />
                    Profilim
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => window.location.href = "/settings"}>
                    <Settings className="mr-2 h-4 w-4" />
                    Ayarlar
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Çıkış Yap
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
