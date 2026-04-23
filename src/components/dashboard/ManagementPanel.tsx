import { motion } from 'framer-motion';
import { ManagementStats } from '@/hooks/useManagementStats';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { 
    CheckCircle2, 
    Clock, 
    FileText, 
    Share2, 
    AlertCircle, 
    Forward,
    ArrowUpRight,
    Search
} from 'lucide-react';

interface ManagementPanelProps {
  stats: ManagementStats;
  loading: boolean;
  onCardClick?: (type: 'entregas' | 'aRealizar' | 'docs' | 'processos', title: string) => void;
}

export function ManagementPanel({ stats, loading, onCardClick }: ManagementPanelProps) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-64 bg-muted/20 rounded-[2.5rem]" />
        ))}
      </div>
    );
  }

  const formatPercent = (val: number, total: number) => {
    if (total === 0) return '0%';
    return `${Math.round((val / total) * 100)}%`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {/* 1. Entregas */}
      <ManagementCard
        title="Entregas"
        titleColor="text-emerald-500"
        mainNumber={stats.entregas.total}
        mainNumberColor="text-emerald-600"
        onClick={() => onCardClick?.('entregas', 'Entregas Realizadas')}
        rows={[
          { label: 'Antecipadas:', val: stats.entregas.antecipadas, pct: formatPercent(stats.entregas.antecipadas, stats.entregas.total), color: 'bg-emerald-500/80' },
          { label: 'Prazo técnico:', val: stats.entregas.prazoTecnico, pct: formatPercent(stats.entregas.prazoTecnico, stats.entregas.total), color: 'bg-blue-400/80' },
          { label: 'Atrasadas:', val: stats.entregas.atrasadas, pct: formatPercent(stats.entregas.atrasadas, stats.entregas.total), color: 'bg-red-400/80' },
          { label: '↳ Com multa:', val: stats.entregas.comMulta, pct: formatPercent(stats.entregas.comMulta, stats.entregas.atrasadas), color: 'bg-red-600/60', isSub: true },
          { label: 'Atraso justificado:', val: stats.entregas.atrasoJustificado, pct: formatPercent(stats.entregas.atrasoJustificado, stats.entregas.atrasadas), color: 'bg-orange-400/80' },
        ]}
      />

      {/* 2. A Realizar */}
      <ManagementCard
        title="A realizar"
        titleColor="text-orange-500"
        mainNumber={stats.aRealizar.total}
        mainNumberColor="text-orange-500"
        onClick={() => onCardClick?.('aRealizar', 'Pendências Operacionais')}
        rows={[
          { label: 'Prazo antecipado:', val: stats.aRealizar.prazoAntecipado, pct: formatPercent(stats.aRealizar.prazoAntecipado, stats.aRealizar.total), color: 'bg-blue-300/80' },
          { label: 'Prazo técnico:', val: stats.aRealizar.prazoTecnico, pct: formatPercent(stats.aRealizar.prazoTecnico, stats.aRealizar.total), color: 'bg-orange-400/80' },
          { label: 'Atraso legal:', val: stats.aRealizar.atrasoLegal, pct: formatPercent(stats.aRealizar.atrasoLegal, stats.aRealizar.total), color: 'bg-red-600/60' },
          { label: '↳ Com multa:', val: stats.aRealizar.comMulta, pct: formatPercent(stats.aRealizar.comMulta, stats.aRealizar.atrasoLegal), color: 'bg-red-700/60', isSub: true },
          { label: 'Atraso justificado:', val: stats.aRealizar.atrasoJustificado, pct: formatPercent(stats.aRealizar.atrasoJustificado, stats.aRealizar.atrasoLegal), color: 'bg-orange-300/80' },
        ]}
      />

      {/* 3. Docs */}
      <ManagementCard
        title="Docs"
        titleColor="text-blue-500"
        mainNumber={stats.docs.total}
        mainNumberColor="text-blue-600"
        onClick={() => onCardClick?.('docs', 'Documentos Recebidos')}
        rows={[
          { label: 'Lidos:', val: stats.docs.lidos, pct: formatPercent(stats.docs.lidos, stats.docs.total), color: 'bg-blue-500/80' },
          { label: 'Não lidos:', val: stats.docs.naoLidos, pct: formatPercent(stats.docs.naoLidos, stats.docs.total), color: 'bg-red-400/80' },
        ]}
      />

      {/* 4. Processos */}
      <ManagementCard
        title="Processos"
        titleColor="text-indigo-500"
        mainNumber={stats.processos.total}
        mainNumberColor="text-indigo-600"
        onClick={() => onCardClick?.('processos', 'Processos e Fechamentos')}
        rows={[
          { label: 'Iniciados:', val: stats.processos.iniciados, pct: formatPercent(stats.processos.iniciados, stats.processos.total), color: 'bg-indigo-500/80' },
          { label: 'Concluídos:', val: stats.processos.concluidos, pct: formatPercent(stats.processos.concluidos, stats.processos.total), color: 'bg-emerald-400/80' },
          { label: 'Conciliação OK:', val: stats.processos.passosOk, pct: formatPercent(stats.processos.passosOk, stats.processos.total), color: 'bg-indigo-300/80' },
          { label: 'Follow-ups:', val: stats.processos.followUpEnviados, pct: formatPercent(stats.processos.followUpEnviados, stats.processos.total), color: 'bg-indigo-200/80' },
        ]}
      />
    </div>
  );
}

interface CardProps {
    title: string;
    titleColor: string;
    mainNumber: number;
    mainNumberColor: string;
    rows: any[];
    onClick?: () => void;
}

function ManagementCard({ title, titleColor, mainNumber, mainNumberColor, rows, onClick }: CardProps) {
  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onClick={onClick}
      className="cursor-pointer group"
    >
      <Card className="rounded-[3rem] border border-border/40 bg-white/80 backdrop-blur-sm shadow-xl hover:shadow-2xl hover:shadow-primary/5 overflow-hidden flex flex-col h-full transition-all duration-500">
        <div className="p-10 pb-6 text-center relative">
          <div className="absolute top-4 right-8 opacity-0 group-hover:opacity-100 transition-opacity bg-primary/5 p-2 rounded-xl">
            <ArrowUpRight className="h-4 w-4 text-primary" />
          </div>
          <h3 className={cn("text-sm font-black uppercase tracking-[0.2em] mb-4 opacity-60", titleColor)}>
            {title}
          </h3>
          <p className={cn("text-7xl font-light tracking-tighter", mainNumberColor)}>
            {mainNumber}
          </p>
        </div>

        <div className="flex-1 px-8 pb-10 space-y-3">
          {rows.map((row, idx) => (
            <div key={idx} className={cn(
              "flex items-center justify-between border-b border-slate-50 pb-2.5 last:border-none",
              row.isSub && "pl-4"
            )}>
              <span className={cn(
                "text-[10px] font-bold tracking-tight uppercase",
                row.label.includes('Atrasadas') || row.label.includes('Atraso') || row.label.includes('Não lidos') ? 'text-red-500' : 
                row.label.includes('Antecipadas') || row.label.includes('Concluídos') ? 'text-emerald-500' : 'text-slate-400'
              )}>
                {row.label}
              </span>
              <div className={cn(
                "h-6 px-3 rounded-full flex items-center justify-center text-[10px] font-black text-white min-w-[75px] shadow-sm",
                row.color
              )}>
                {row.val} <span className="mx-1 opacity-40">|</span> {row.pct}
              </div>
            </div>
          ))}
        </div>
        
        <div className="px-8 py-4 bg-muted/5 border-t border-border/10 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Search className="h-3 w-3 text-muted-foreground/40" />
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Clique para gerenciar</span>
        </div>
      </Card>
    </motion.div>
  );
}
