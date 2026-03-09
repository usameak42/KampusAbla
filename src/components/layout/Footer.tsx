import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-secondary/50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="mb-4 flex items-center gap-2">
              <div className="gradient-warm flex h-10 w-10 items-center justify-center rounded-xl">
                <span className="text-xl font-bold text-primary-foreground">K</span>
              </div>
              <span className="font-display text-xl font-bold text-foreground">KampusAbla</span>
            </Link>
            <p className="text-sm text-muted-foreground">{t("footer.description")}</p>
          </div>

          {/* Company */}
          <div>
            <h4 className="mb-4 font-semibold text-foreground">{t("footer.links.company")}</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  {t("footer.links.about")}
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  {t("footer.links.howItWorks", "Nasıl Çalışır")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="mb-4 font-semibold text-foreground">{t("footer.links.support")}</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/help" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  {t("footer.links.help")}
                </Link>
              </li>
              <li>
                <Link to="/safety" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  {t("footer.links.safety")}
                </Link>
              </li>
              <li>
                <Link to="/kvkk" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  KVKK
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="mb-4 font-semibold text-foreground">{t("footer.links.legal")}</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/terms" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  {t("footer.links.terms")}
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  {t("footer.links.privacy")}
                </Link>
              </li>
              <li>
                <Link to="/cookies" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  {t("footer.links.cookies")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 border-t border-border pt-8 text-center">
          <p className="text-sm text-muted-foreground">{t("footer.copyright", { year: currentYear })}</p>
        </div>
      </div>
    </footer>
  );
}
