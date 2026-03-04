import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Shield, MapPin, MessageCircle, CreditCard } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    key: "verified",
    icon: Shield,
    color: "text-trust",
    bgColor: "bg-trust/10",
  },
  {
    key: "location",
    icon: MapPin,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    key: "chat",
    icon: MessageCircle,
    color: "text-success",
    bgColor: "bg-success/10",
  },
  {
    key: "payment",
    icon: CreditCard,
    color: "text-warning",
    bgColor: "bg-warning/10",
  },
];

export function FeaturesSection() {
  const { t } = useTranslation();

  return (
    <section className="bg-background py-20">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="mb-16 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-4 font-display text-3xl font-bold text-foreground sm:text-4xl"
          >
            {t("landing.features.title")}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-muted-foreground"
          >
            {t("landing.features.subtitle")}
          </motion.p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <motion.div
              key={feature.key}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-elevated h-full border-0 shadow-card transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className={`h-12 w-12 rounded-xl ${feature.bgColor} mb-4 flex items-center justify-center`}>
                    <feature.icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <h3 className="mb-2 font-display text-lg font-semibold text-foreground">
                    {t(`landing.features.${feature.key}.title`)}
                  </h3>
                  <p className="text-sm text-muted-foreground">{t(`landing.features.${feature.key}.description`)}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
