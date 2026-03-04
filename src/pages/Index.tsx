import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { StatsSection } from "@/components/landing/StatsSection";
import { CTASection } from "@/components/landing/CTASection";
import ParentDashboard from "@/pages/dashboard/ParentDashboard";
import SitterDashboard from "@/pages/dashboard/SitterDashboard";

const Index = () => {
  const { user, loading } = useAuth();
  const role = user?.user_metadata?.role as string | undefined;

  if (loading) return null;

  if (user && role === "parent") return <ParentDashboard />;
  if (user && role === "sitter") return <SitterDashboard />;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <StatsSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
