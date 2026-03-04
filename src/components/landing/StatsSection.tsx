import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Users, Calendar, Star, Clock } from "lucide-react";

const stats = [
  { key: "students", value: "500+", icon: Users },
  { key: "sessions", value: "2,000+", icon: Calendar },
  { key: "rating", value: "4.9", icon: Star },
  { key: "response", value: "< 1h", icon: Clock },
];

export function StatsSection() {
  const { t } = useTranslation();

  return (
    <section className="bg-background py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.key}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-center"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <stat.icon className="h-6 w-6 text-primary" />
              </div>
              <div className="mb-2 font-display text-3xl font-bold text-foreground sm:text-4xl">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{t(`landing.stats.${stat.key}`)}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
