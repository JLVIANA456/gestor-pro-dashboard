import { motion } from 'framer-motion';
import { ManagementPanel } from '@/components/dashboard/ManagementPanel';
import { useManagementStats } from '@/hooks/useManagementStats';
import { LayoutDashboard } from 'lucide-react';

export default function OperationalPanel() {
  const { stats: managementStats, loading: managementLoading } = useManagementStats();

  return (
    <div className="space-y-8 p-1 md:p-8 animate-in fade-in duration-700">
      {/* Header Section */}
      <motion.section 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-2"
      >
        <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-[2rem] bg-primary/10 flex items-center justify-center text-primary shadow-lg shadow-primary/5">
                <LayoutDashboard className="h-7 w-7" />
            </div>
            <div>
                <h1 className="text-4xl font-light tracking-tight text-foreground">
                    Painel <span className="text-primary font-medium">Operacional</span>
                </h1>
                <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.3em] mt-1">
                    Visão Executiva em Tempo Real
                </p>
            </div>
        </div>
      </motion.section>

      {/* Management Operational Panel */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <ManagementPanel stats={managementStats} loading={managementLoading} />
      </motion.section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
          <div className="p-8 rounded-[3rem] bg-primary/[0.02] border border-primary/10 space-y-4">
              <h3 className="text-lg font-bold text-foreground/80 tracking-tight">Sobre este Painel</h3>
              <p className="text-sm font-light text-muted-foreground leading-relaxed">
                  Este painel centraliza as métricas mais críticas do seu escritório. 
                  As informações de <strong>Entregas</strong> e <strong>A Realizar</strong> são baseadas no calendário de guias do mês atual. 
                  Os dados de <strong>Documentos</strong> refletem as entradas via Portal do Cliente que aguardam revisão.
              </p>
          </div>
          <div className="p-8 rounded-[3rem] bg-slate-50 border border-border/40 space-y-4">
              <h3 className="text-lg font-bold text-foreground/80 tracking-tight">Dica de Gestão</h3>
              <p className="text-sm font-light text-muted-foreground leading-relaxed">
                  Utilize as métricas de <strong>"Prazo Técnico"</strong> para priorizar o trabalho da sua equipe antes que as obrigações entrem em zona crítica de atraso. 
                  O status de <strong>"Concluídos"</strong> em processos ajuda a garantir que o fechamento contábil esteja rigorosamente em dia.
              </p>
          </div>
      </div>
    </div>
  );
}
