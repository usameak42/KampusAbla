import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CTASection() {
  const { t } = useTranslation();

  return (
    <section className="gradient-warm py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-3xl text-center"
        >
          <h2 className="mb-4 font-display text-3xl font-bold text-primary-foreground sm:text-4xl">
            {t("landing.cta.title")}
          </h2>
          <p className="mb-8 text-lg text-primary-foreground/80">{t("landing.cta.subtitle")}</p>
          <Link to="/register">
            <Button size="lg" variant="secondary" className="h-14 px-8 text-lg font-semibold">
              {t("landing.cta.button")}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
