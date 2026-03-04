import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { ArrowRight, Shield, MapPin, MessageCircle, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  const { t } = useTranslation();

  return (
    <section className="gradient-soft relative flex min-h-[90vh] items-center justify-center overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-10 top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-20 right-10 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
      </div>

      <div className="container relative z-10 mx-auto px-4 pb-16 pt-20">
        <div className="mx-auto max-w-4xl text-center">
          {/* Trust Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8 inline-flex items-center gap-2 rounded-full bg-trust/10 px-4 py-2 text-sm font-medium text-trust"
          >
            <Shield className="h-4 w-4" />
            {t("landing.hero.trustBadge", { count: 500 })}
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-4 font-display text-4xl font-bold text-foreground sm:text-5xl md:text-6xl"
          >
            {t("landing.hero.title")}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-6 text-xl font-medium text-primary sm:text-2xl"
          >
            {t("landing.hero.subtitle")}
          </motion.p>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground"
          >
            {t("landing.hero.description")}
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-col justify-center gap-4 sm:flex-row"
          >
            <Link to="/find-sitter">
              <Button size="lg" className="btn-warm h-14 w-full px-8 text-lg sm:w-auto">
                {t("landing.hero.ctaParent")}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/register">
              <Button size="lg" variant="outline" className="h-14 w-full border-2 px-8 text-lg sm:w-auto">
                {t("landing.hero.ctaStudent")}
              </Button>
            </Link>
          </motion.div>
        </div>

        {/* Feature Pills */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-16 flex flex-wrap justify-center gap-4"
        >
          {[
            { icon: Shield, label: t("landing.features.verified.title") },
            { icon: MapPin, label: t("landing.features.location.title") },
            { icon: MessageCircle, label: t("landing.features.chat.title") },
            { icon: CreditCard, label: t("landing.features.payment.title") },
          ].map((feature, index) => (
            <div
              key={index}
              className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 shadow-card"
            >
              <feature.icon className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">{feature.label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
