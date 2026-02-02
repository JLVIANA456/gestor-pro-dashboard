import { Users, FileCheck, Building, AlertTriangle } from 'lucide-react';
import { GreetingCard } from '@/components/dashboard/GreetingCard';
import { ClientFlowCard } from '@/components/dashboard/ClientFlowCard';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { ExternalLinksCard } from '@/components/dashboard/ExternalLinksCard';
import { useClientStats } from '@/hooks/useClientStats';

export default function Dashboard() {
  const { stats, loading } = useClientStats();

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <GreetingCard />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total de Clientes"
          value={stats.total}
          icon={Users}
          variant="default"
          delay={0}
        />
        <StatsCard
          title="Simples Nacional"
          value={stats.simples}
          icon={Building}
          variant="simples"
          delay={50}
        />
        <StatsCard
          title="Lucro Presumido"
          value={stats.presumido}
          icon={FileCheck}
          variant="presumido"
          delay={100}
        />
        <StatsCard
          title="Lucro Real"
          value={stats.real}
          icon={AlertTriangle}
          variant="real"
          delay={150}
        />
      </div>

      {/* Flow and Links */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <ClientFlowCard
            ativos={stats.ativos}
            entradas={stats.entradasMes}
            saidas={stats.saidasMes}
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