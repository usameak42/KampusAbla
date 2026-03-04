/**
 * Registration Role Selection Page
 * Let users choose between parent or sitter registration
 */

import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Baby, GraduationCap } from "lucide-react";

export default function RoleSelection() {
    const navigate = useNavigate();

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            <div className="w-full max-w-4xl space-y-8">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                        KampusAbla'ya Hoş Geldiniz
                    </h1>
                    <p className="text-lg text-gray-600">
                        Güvenli ve doğrulanmış öğrenci bakıcı platformu
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Parent Card */}
                    <Card className="border-2 hover:border-primary transition-colors cursor-pointer group">
                        <CardHeader>
                            <div className="flex items-center justify-center mb-4">
                                <div className="p-4 bg-blue-100 rounded-full group-hover:bg-blue-200 transition-colors">
                                    <Baby className="h-12 w-12 text-blue-600" />
                                </div>
                            </div>
                            <CardTitle className="text-center text-2xl">Veliyim</CardTitle>
                            <CardDescription className="text-center">
                                Çocuğum için güvenilir öğrenci bakıcı arıyorum
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li className="flex items-start">
                                    <span className="mr-2">✓</span>
                                    <span>Doğrulanmış üniversite öğrencileri</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="mr-2">✓</span>
                                    <span>Canlı konum takibi</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="mr-2">✓</span>
                                    <span>Güvenli mesajlaşma</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="mr-2">✓</span>
                                    <span>Detaylı profiller ve yorumlar</span>
                                </li>
                            </ul>
                            <Button
                                className="w-full"
                                size="lg"
                                onClick={() => navigate("/register/parent")}
                            >
                                Veli Olarak Kayıt Ol
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Sitter Card */}
                    <Card className="border-2 hover:border-primary transition-colors cursor-pointer group">
                        <CardHeader>
                            <div className="flex items-center justify-center mb-4">
                                <div className="p-4 bg-green-100 rounded-full group-hover:bg-green-200 transition-colors">
                                    <GraduationCap className="h-12 w-12 text-green-600" />
                                </div>
                            </div>
                            <CardTitle className="text-center text-2xl">Öğrenciyim</CardTitle>
                            <CardDescription className="text-center">
                                Üniversite öğrencisiyim ve bakıcılık yapmak istiyorum
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li className="flex items-start">
                                    <span className="mr-2">✓</span>
                                    <span>Esnek çalışma saatleri</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="mr-2">✓</span>
                                    <span>Kendi ücretini belirle</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="mr-2">✓</span>
                                    <span>Güvenli ödeme sistemi</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="mr-2">✓</span>
                                    <span>Doğrulama ve rozetler</span>
                                </li>
                            </ul>
                            <Button
                                className="w-full"
                                size="lg"
                                onClick={() => navigate("/register/sitter")}
                            >
                                Bakıcı Olarak Kayıt Ol
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                <div className="text-center text-sm text-muted-foreground">
                    Zaten hesabınız var mı?{" "}
                    <Button
                        variant="link"
                        className="p-0 h-auto font-semibold"
                        onClick={() => navigate("/login")}
                    >
                        Giriş Yap
                    </Button>
                </div>
            </div>
        </div>
    );
}
