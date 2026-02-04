import { Users, FileCheck, Building, AlertTriangle } from 'lucide-react';
import { GreetingCard } from '@/components/dashboard/GreetingCard';
import { ClientFlowCard } from '@/components/dashboard/ClientFlowCard';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { ExternalLinksCard } from '@/components/dashboard/ExternalLinksCard';
import { useClientStats } from '@/hooks/useClientStats';

export default function Dashboard() {
  const { stats, loading } = useClientStats();

  return (
    <div className="space-y-8 animate-slide-in-up">
      {/* Greeting */}
      <GreetingCard />

      {/* Greeting and Top Stats */}
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-light tracking-tight text-foreground">Visão Geral</h1>
            <p className="text-xs font-normal text-muted-foreground uppercase tracking-[0.2em] mt-1">Status e métricas em tempo real</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Clientes"
            value={stats.total}
            icon={Users}
            delay={0}
          />
          <StatsCard
            title="Simples Nacional"
            value={stats.simples}
            icon={Building}
            variant="simples"
            delay={100}
          />
          <StatsCard
            title="Lucro Presumido"
            value={stats.presumido}
            icon={FileCheck}
            variant="presumido"
            delay={200}
          />
          <StatsCard
            title="Lucro Real"
            value={stats.real}
            icon={AlertTriangle}
            variant="real"
            delay={300}
          />
        </div>
      </div>

      {/* Flow and Links */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <ClientFlowCard
            total={stats.total}
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
