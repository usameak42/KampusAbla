/**
 * Login Page
 * Unified login with email/password authentication
 */

import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuthentication } from "@/hooks/useAuthentication";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { validateEmailAscii } from "@/utils/emailValidator";

export default function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation();
    const { handleSignIn, isLoading } = useAuthentication();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(false);
    const [emailError, setEmailError] = useState<string | null>(null);

    const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/";

    const handleEmailChange = (value: string) => {
        setEmail(value);
        setEmailError(validateEmailAscii(value));
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        const asciiError = validateEmailAscii(email);
        if (asciiError) {
            setEmailError(asciiError);
            return;
        }

        try {
            await handleSignIn(email, password);

            localStorage.setItem("remember_me", rememberMe.toString());
            localStorage.setItem("session_start_time", Date.now().toString());

            navigate(from, { replace: true });
        } catch (error) {
            // Error handled by hook with toast
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">
                        KampusAbla - {t("auth.login.title")}
                    </CardTitle>
                    <CardDescription className="text-center">
                        {t("auth.login.subtitle")}
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">{t("auth.login.email")}</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder={t("auth.login.emailPlaceholder", "ornek@email.com")}
                                value={email}
                                onChange={(e) => handleEmailChange(e.target.value)}
                                required
                                disabled={isLoading}
                                className={emailError ? "border-destructive" : ""}
                            />
                            {emailError && (
                                <p className="text-xs text-destructive">{emailError}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">{t("auth.login.password")}</Label>
                                <Button
                                    variant="link"
                                    className="p-0 h-auto font-normal text-sm"
                                    onClick={() => navigate("/forgot-password")}
                                    type="button"
                                >
                                    {t("auth.login.forgotPassword")}
                                </Button>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={isLoading}
                                minLength={8}
                            />
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="rememberMe"
                                checked={rememberMe}
                                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                                disabled={isLoading}
                            />
                            <Label htmlFor="rememberMe" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                {t("auth.login.rememberMe")}
                            </Label>
                        </div>

                        <Button type="submit" className="w-full" disabled={isLoading || !!emailError}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {t("auth.login.loggingIn", "Giriş yapılıyor...")}
                                </>
                            ) : (
                                t("auth.login.button")
                            )}
                        </Button>
                    </form>
                </CardContent>

                <CardFooter className="flex flex-col space-y-2">
                    <div className="text-sm text-muted-foreground text-center">
                        {t("auth.login.noAccount")}{" "}
                        <Button
                            variant="link"
                            className="p-0 h-auto font-semibold"
                            onClick={() => navigate("/register")}
                        >
                            {t("auth.signup.button")}
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
