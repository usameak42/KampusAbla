import { useState, useEffect } from "react";
import {
    Users,
    Search,
    Filter,
    MoreVertical,
    ShieldAlert,
    ShieldCheck,
    Ban,
    Unlock,
    Loader2,
    Mail,
    Phone,
    Calendar,
    ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UserRecord {
    id: string;
    userId: string;
    fullName: string;
    email: string;
    role: "parent" | "sitter";
    status: "active" | "suspended" | "pending";
    createdAt: string;
    details: any;
}

export default function UserManagement() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState<"all" | "parent" | "sitter">("all");
    const [users, setUsers] = useState<UserRecord[]>([]);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            // Fetch Parents (no users table join - it doesn't exist)
            const { data: parents, error: parentError } = await supabase
                .from("parents")
                .select("*");

            if (parentError) throw parentError;

            // Fetch Sitters
            const { data: sitters, error: sitterError } = await supabase
                .from("sitters")
                .select("*");

            if (sitterError) throw sitterError;

            const formattedParents: UserRecord[] = (parents || []).map(p => ({
                id: p.id,
                userId: p.user_id,
                fullName: p.full_name,
                email: "-", // Email stored in auth.users, not accessible directly
                role: "parent",
                status: "active" as const,
                createdAt: p.created_at,
                details: p
            }));

            const formattedSitters: UserRecord[] = (sitters || []).map(s => ({
                id: s.id,
                userId: s.user_id,
                fullName: s.full_name,
                email: "-", // Email stored in auth.users, not accessible directly
                role: "sitter",
                status: s.verification_status === "verified" ? "active" as const : "pending" as const,
                createdAt: s.created_at,
                details: s
            }));

            setUsers([...formattedParents, ...formattedSitters].sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            ));
        } catch (error) {
            console.error("Error fetching users:", error);
            toast({
                title: "Hata",
                description: "Kullanıcı listesi yüklenemedi.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleStatus = async (user: UserRecord) => {
        // Note: User suspension is handled via user_suspensions table
        const isSuspended = user.status === "suspended";
        try {
            if (isSuspended) {
                // Remove suspension
                const { error } = await supabase
                    .from("user_suspensions")
                    .delete()
                    .eq("user_id", user.userId)
                    .is("lifted_at", null);

                if (error) throw error;
            } else {
                // Add suspension
                const { error } = await supabase
                    .from("user_suspensions")
                    .insert({
                        user_id: user.userId,
                        reason: "Admin tarafından askıya alındı",
                        suspended_at: new Date().toISOString(),
                    });

                if (error) throw error;
            }

            toast({
                title: "Başarılı",
                description: `Kullanıcı ${isSuspended ? "aktive edildi" : "askıya alındı"}.`,
            });

            // Update local state
            setUsers(prev => prev.map(u =>
                u.userId === user.userId
                    ? { ...u, status: isSuspended ? "active" : "suspended" }
                    : u
            ));
        } catch (error) {
            console.error("Error toggling status:", error);
            toast({
                title: "Hata",
                description: "İşlem gerçekleştirilemedi.",
                variant: "destructive",
            });
        }
    };

    const filteredUsers = users.filter(u => {
        const matchesSearch = u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === "all" || u.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 pb-12">
            {/* Header section (reusing dashboard style) */}
            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight mb-2">Kullanıcı Yönetimi</h1>
                        <p className="text-slate-400">Platformdaki tüm ebeveyn ve bakıcıları yönetin.</p>
                    </div>
                </div>

                {/* Filters */}
                <Card className="bg-slate-900 border-slate-800 mb-8">
                    <CardContent className="p-4 flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                            <Input
                                placeholder="İsim veya e-posta ile ara..."
                                className="bg-slate-800/50 border-slate-700 pl-10 text-white"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant={roleFilter === "all" ? "default" : "outline"}
                                className={roleFilter === "all" ? "bg-purple-600 hover:bg-purple-700" : "border-slate-700 text-slate-300"}
                                onClick={() => setRoleFilter("all")}
                            >
                                Hepsi
                            </Button>
                            <Button
                                variant={roleFilter === "parent" ? "default" : "outline"}
                                className={roleFilter === "parent" ? "bg-blue-600 hover:bg-blue-700" : "border-slate-700 text-slate-300"}
                                onClick={() => setRoleFilter("parent")}
                            >
                                Ebeveynler
                            </Button>
                            <Button
                                variant={roleFilter === "sitter" ? "default" : "outline"}
                                className={roleFilter === "sitter" ? "bg-emerald-600 hover:bg-emerald-700" : "border-slate-700 text-slate-300"}
                                onClick={() => setRoleFilter("sitter")}
                            >
                                Bakıcılar
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Main Table */}
                <Card className="bg-slate-900 border-slate-800 overflow-hidden shadow-2xl">
                    <Table>
                        <TableHeader className="bg-slate-800/50">
                            <TableRow className="border-slate-700 hover:bg-transparent">
                                <TableHead className="text-slate-300">Kullanıcı</TableHead>
                                <TableHead className="text-slate-300">Rol</TableHead>
                                <TableHead className="text-slate-300">Durum</TableHead>
                                <TableHead className="text-slate-300">Kayıt Tarihi</TableHead>
                                <TableHead className="text-right text-slate-300">İşlemler</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-40 text-center">
                                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-purple-500" />
                                    </TableCell>
                                </TableRow>
                            ) : filteredUsers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-40 text-center text-slate-500">
                                        Eşleşen kullanıcı bulunamadı.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredUsers.map((user) => (
                                    <TableRow key={user.userId} className="border-slate-800 hover:bg-slate-800/30 transition-colors">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold ${user.role === "parent" ? "bg-blue-600/20 text-blue-400" : "bg-emerald-600/20 text-emerald-400"
                                                    }`}>
                                                    {user.fullName.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-100">{user.fullName}</p>
                                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                                        <Mail className="h-3 w-3" />
                                                        {user.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={
                                                user.role === "parent"
                                                    ? "bg-blue-900/20 text-blue-400 border-blue-500/20"
                                                    : "bg-emerald-900/20 text-emerald-400 border-emerald-500/20"
                                            }>
                                                {user.role === "parent" ? "Ebeveyn" : "Bakıcı"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={
                                                user.status === "active"
                                                    ? "bg-emerald-600/20 text-emerald-400"
                                                    : user.status === "pending"
                                                        ? "bg-amber-600/20 text-amber-400"
                                                        : "bg-rose-600/20 text-rose-400"
                                            }>
                                                {user.status === "active" ? "Aktif" : user.status === "pending" ? "Onay Bekliyor" : "Askıda"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-slate-400 text-sm">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-3 w-3" />
                                                {new Date(user.createdAt).toLocaleDateString("tr-TR")}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="hover:bg-slate-800">
                                                        <MoreVertical className="h-4 w-4 text-slate-400" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 text-slate-200">
                                                    <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                                                    <DropdownMenuSeparator className="bg-slate-800" />
                                                    <DropdownMenuItem className="hover:bg-slate-800 cursor-pointer">
                                                        <Users className="mr-2 h-4 w-4" />
                                                        Profil Görüntüle
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="hover:bg-slate-800 cursor-pointer"
                                                        onClick={() => handleToggleStatus(user)}
                                                    >
                                                        {user.status !== "suspended" ? (
                                                            <>
                                                                <Ban className="mr-2 h-4 w-4 text-rose-500" />
                                                                <span className="text-rose-500">Askıya Al</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Unlock className="mr-2 h-4 w-4 text-emerald-500" />
                                                                <span className="text-emerald-500">Aktif Et</span>
                                                            </>
                                                        )}
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </Card>
            </div>
        </div>
    );
}
