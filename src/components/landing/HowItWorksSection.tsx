import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Search, Calendar, MapPin, User, FileCheck, Wallet } from "lucide-react";

export function HowItWorksSection() {
  const { t } = useTranslation();

  const parentSteps = [
    { icon: Search, key: "step1" },
    { icon: Calendar, key: "step2" },
    { icon: MapPin, key: "step3" },
  ];

  const studentSteps = [
    { icon: User, key: "step1" },
    { icon: FileCheck, key: "step2" },
    { icon: Wallet, key: "step3" },
  ];

  return (
    <section className="bg-secondary/30 py-20">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="mb-16 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-3xl font-bold text-foreground sm:text-4xl"
          >
            {t("landing.howItWorks.title")}
          </motion.h2>
        </div>

        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
          {/* For Parents */}
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <h3 className="mb-8 text-center font-display text-2xl font-semibold text-foreground lg:text-left">
              {t("landing.howItWorks.parent.title")}
            </h3>
            <div className="space-y-6">
              {parentSteps.map((step, index) => (
                <div key={step.key} className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="gradient-warm flex h-12 w-12 items-center justify-center rounded-full font-bold text-primary-foreground">
                      {index + 1}
                    </div>
                  </div>
                  <div className="pt-1">
                    <h4 className="mb-1 font-semibold text-foreground">
                      {t(`landing.howItWorks.parent.${step.key}.title`)}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {t(`landing.howItWorks.parent.${step.key}.description`)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* For Students */}
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <h3 className="mb-8 text-center font-display text-2xl font-semibold text-foreground lg:text-left">
              {t("landing.howItWorks.student.title")}
            </h3>
            <div className="space-y-6">
              {studentSteps.map((step, index) => (
                <div key={step.key} className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="gradient-trust flex h-12 w-12 items-center justify-center rounded-full font-bold text-trust-foreground">
                      {index + 1}
                    </div>
                  </div>
                  <div className="pt-1">
                    <h4 className="mb-1 font-semibold text-foreground">
                      {t(`landing.howItWorks.student.${step.key}.title`)}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {t(`landing.howItWorks.student.${step.key}.description`)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
