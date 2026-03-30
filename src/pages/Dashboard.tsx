import { GreetingCard } from '@/components/dashboard/GreetingCard';
import { ClientFlowCard } from '@/components/dashboard/ClientFlowCard';
import { ExternalLinksCard } from '@/components/dashboard/ExternalLinksCard';
import { useClientStats } from '@/hooks/useClientStats';
import AppleCardsCarouselStats from '@/components/dashboard/AppleCardsCarouselStats';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const { stats, loading } = useClientStats();

  return (
    <div className="space-y-8 p-1 md:p-4">
      {/* 1. Header Section */}
      <motion.section 
        className=""
      >
        <GreetingCard />
      </motion.section>

      {/* 2. Top Highlights Carousel - Standardizing to Apple-style white/light aesthetic */}
      <motion.section 
        className="stagger-1"
      >
        <div className="bg-white/50 backdrop-blur-sm rounded-[2rem] border border-border/50">
          <AppleCardsCarouselStats stats={stats} />
        </div>
      </motion.section>

      {/* 3. Bottom Grid Section */}
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <ClientFlowCard
            ativos={stats.ativos}
            entradas={stats.entradasMes}
            saidas={stats.saidasMes}
            recentExits={stats.recentExits}
            loading={loading}
          />
        </div>
        <div className="lg:col-span-2">
          <ExternalLinksCard />
        </div>
      </div>
    </div>
  );
}