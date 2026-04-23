import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ManagementPanel } from '@/components/dashboard/ManagementPanel';
import { useManagementStats, ObligationStat } from '@/hooks/useManagementStats';
import { OperationalAnalysisModal } from '@/components/dashboard/OperationalAnalysisModal';
import { LayoutDashboard, CheckCircle2, Clock, Search, SearchX, X, ChevronDown, Building2, CalendarCheck, AlertCircle } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function OperationalPanel() {
  const { stats, loading } = useManagementStats();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal State
  const [analysisModal, setAnalysisModal] = useState<{
    isOpen: boolean;
    type: 'entregas' | 'aRealizar' | 'docs' | 'processos' | null;
    title: string;
  }>({
    isOpen: false,
    type: null,
    title: ''
  });

  const handleCardClick = (type: 'entregas' | 'aRealizar' | 'docs' | 'processos', title: string) => {
    setAnalysisModal({
        isOpen: true,
        type,
        title
    });
  };

  // Filter breakdown based on search query
  const filteredBreakdown = stats.breakdown.filter(item => 
    item.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get raw data for modal based on type
  const getModalData = () => {
    if (!analysisModal.type) return [];
    if (analysisModal.type === 'entregas') return stats.rawData.guides.filter((g: any) => g.status === 'sent' || g.status === 'completed' || g.delivered_at);
    if (analysisModal.type === 'aRealizar') return stats.rawData.guides.filter((g: any) => g.status === 'pending' || g.status === 'scheduled');
    if (analysisModal.type === 'docs') return stats.rawData.docs;
    if (analysisModal.type === 'processos') return stats.rawData.closings;
    return [];
  };

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

      {/* Main Metrics */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <ManagementPanel 
            stats={stats} 
            loading={loading} 
            onCardClick={handleCardClick}
        />
      </motion.section>

      {/* Detailed Breakdown Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-6"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-1">
                <h2 className="text-2xl font-light tracking-tight text-foreground">
                    Status por <span className="font-medium">Obrigação</span>
                </h2>
                <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">
                    Clique em Enviados ou Pendentes para ver detalhes
                </p>
            </div>

            <div className="relative w-full md:w-80 group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 group-focus-within:text-primary transition-colors">
                    <Search className="h-4 w-4" />
                </div>
                <Input 
                    placeholder="Filtrar obrigação (ex: DAS, FGTS...)" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-11 pr-10 h-12 rounded-2xl border-border/40 bg-white/50 focus:bg-white transition-all shadow-sm focus:shadow-md"
                />
                {searchQuery && (
                    <button 
                        onClick={() => setSearchQuery('')}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-red-500 transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i} className="rounded-[2.5rem] border-dashed h-40 animate-pulse bg-muted/20" />
                ))
            ) : filteredBreakdown.length > 0 ? (
                filteredBreakdown.map((item, idx) => (
                    <BreakdownCard 
                        key={idx} 
                        item={item} 
                        allGuides={stats.rawData.guides}
                    />
                ))
            ) : (
                <div className="col-span-full py-20 text-center space-y-4 bg-slate-50 rounded-[3rem] border border-dashed border-border/60">
                    <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                        <SearchX className="h-8 w-8 text-muted-foreground/20" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-slate-600">Nenhuma obrigação encontrada</p>
                        <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">Tente outro termo de busca</p>
                    </div>
                </div>
            )}
        </div>
      </motion.section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
          <div className="p-8 rounded-[3rem] bg-primary/[0.02] border border-primary/10 space-y-4">
              <h3 className="text-lg font-bold text-foreground/80 tracking-tight">Sobre este Painel</h3>
              <p className="text-sm font-light text-muted-foreground leading-relaxed">
                  Este painel centraliza as métricas mais críticas do seu escritório. 
                  As informações de <strong>Entregas</strong> e <strong>A Realizar</strong> são baseadas no calendário de guias do mês atual. 
              </p>
          </div>
          <div className="p-8 rounded-[3rem] bg-slate-50 border border-border/40 space-y-4">
              <h3 className="text-lg font-bold text-foreground/80 tracking-tight">Dica de Gestão</h3>
              <p className="text-sm font-light text-muted-foreground leading-relaxed">
                  Utilize este detalhamento para identificar gargalos em obrigações específicas. Se o número de "Pendentes" em uma guia (como o DAS) estiver alto próximo ao vencimento, priorize essa demanda.
              </p>
          </div>
      </div>

      <OperationalAnalysisModal 
          isOpen={analysisModal.isOpen}
          onClose={() => setAnalysisModal(prev => ({ ...prev, isOpen: false }))}
          type={analysisModal.type}
          title={analysisModal.title}
          data={getModalData()}
      />
    </div>
  );
}

// ─── Breakdown Card com Drill-Down ──────────────────────────────────────────

function BreakdownCard({ item, allGuides }: { item: ObligationStat; allGuides: any[] }) {
    const percentage = Math.round((item.completed / item.total) * 100);
    const isCompleted = percentage === 100;
    const [openPanel, setOpenPanel] = useState<'sent' | 'pending' | null>(null);

    // Filtra as guias deste tipo de obrigação específico
    const guidesOfType = allGuides.filter((g: any) => (g.type || 'Outros') === item.type);
    const sentGuides = guidesOfType.filter((g: any) => g.status === 'sent' || g.status === 'completed' || g.delivered_at);
    const pendingGuides = guidesOfType.filter((g: any) => g.status === 'pending' || g.status === 'scheduled');

    const togglePanel = (panel: 'sent' | 'pending') => {
        setOpenPanel(prev => prev === panel ? null : panel);
    };

    return (
        <Card className="rounded-[2.5rem] border border-border/40 bg-white hover:shadow-xl transition-all duration-300 overflow-hidden group">
            <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 flex-1">
                        <h3 className="text-sm font-black uppercase tracking-wider text-slate-700 line-clamp-1 group-hover:text-primary transition-colors">
                            {item.type}
                        </h3>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tighter rounded-md h-5">
                                {item.total} Total
                            </Badge>
                            {isCompleted && (
                                <Badge className="bg-emerald-500/10 text-emerald-600 border-none text-[9px] font-black uppercase tracking-tighter rounded-md h-5">
                                    <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
                                    100% OK
                                </Badge>
                            )}
                        </div>
                    </div>
                    <div className={cn(
                        "h-10 w-10 rounded-2xl flex items-center justify-center transition-all duration-300",
                        isCompleted ? "bg-emerald-500/10 text-emerald-600 scale-110" : "bg-slate-50 text-slate-400 group-hover:bg-primary/10 group-hover:text-primary"
                    )}>
                        {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                        <span className="text-muted-foreground">Progresso</span>
                        <span className={cn(isCompleted ? "text-emerald-600" : "text-slate-900")}>{percentage}%</span>
                    </div>
                    <Progress 
                        value={percentage} 
                        className="h-2 rounded-full bg-slate-100" 
                    />
                </div>

                {/* Badges clicáveis */}
                <div className="grid grid-cols-2 gap-2">
                    {/* ENVIADOS */}
                    <button
                        onClick={() => togglePanel('sent')}
                        className={cn(
                            "p-2 rounded-2xl border text-center transition-all duration-200 cursor-pointer",
                            openPanel === 'sent'
                                ? "bg-emerald-500 border-emerald-500 shadow-lg shadow-emerald-500/20"
                                : "bg-emerald-50/50 border-emerald-500/5 hover:bg-emerald-100/50"
                        )}
                    >
                        <p className={cn("text-[8px] font-black uppercase tracking-widest mb-0.5 flex items-center justify-center gap-1",
                            openPanel === 'sent' ? "text-white" : "text-emerald-600"
                        )}>
                            Enviados
                            <ChevronDown className={cn("h-2.5 w-2.5 transition-transform", openPanel === 'sent' && "rotate-180")} />
                        </p>
                        <p className={cn("text-lg font-light", openPanel === 'sent' ? "text-white" : "text-emerald-700")}>{item.completed}</p>
                    </button>

                    {/* PENDENTES */}
                    <button
                        onClick={() => togglePanel('pending')}
                        className={cn(
                            "p-2 rounded-2xl border text-center transition-all duration-200 cursor-pointer",
                            openPanel === 'pending'
                                ? "bg-orange-500 border-orange-500 shadow-lg shadow-orange-500/20"
                                : item.pending > 0
                                    ? "bg-orange-50/50 border-orange-500/5 hover:bg-orange-100/50"
                                    : "bg-slate-50/50 border-transparent"
                        )}
                    >
                        <p className={cn(
                            "text-[8px] font-black uppercase tracking-widest mb-0.5 flex items-center justify-center gap-1",
                            openPanel === 'pending' ? "text-white" : item.pending > 0 ? "text-orange-600" : "text-slate-400"
                        )}>
                            Pendentes
                            {item.pending > 0 && <ChevronDown className={cn("h-2.5 w-2.5 transition-transform", openPanel === 'pending' && "rotate-180")} />}
                        </p>
                        <p className={cn(
                            "text-lg font-light",
                            openPanel === 'pending' ? "text-white" : item.pending > 0 ? "text-orange-700" : "text-slate-400"
                        )}>{item.pending}</p>
                    </button>
                </div>

                {/* Painel de Drill-Down Animado */}
                <AnimatePresence>
                    {openPanel && (
                        <motion.div
                            key={openPanel}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.25, ease: 'easeInOut' }}
                            className="overflow-hidden"
                        >
                            <div className={cn(
                                "rounded-2xl p-3 space-y-2 border mt-1",
                                openPanel === 'sent'
                                    ? "bg-emerald-50/60 border-emerald-100"
                                    : "bg-orange-50/60 border-orange-100"
                            )}>
                                <p className={cn(
                                    "text-[9px] font-black uppercase tracking-widest px-1",
                                    openPanel === 'sent' ? "text-emerald-600" : "text-orange-600"
                                )}>
                                    {openPanel === 'sent' ? '✅ Empresas Enviadas' : '⚠️ Empresas Pendentes'}
                                </p>

                                {(openPanel === 'sent' ? sentGuides : pendingGuides).length === 0 ? (
                                    <p className="text-[10px] text-slate-400 px-1">Nenhum registro encontrado.</p>
                                ) : (
                                    <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                                        {(openPanel === 'sent' ? sentGuides : pendingGuides).map((g: any, i: number) => (
                                            <div key={i} className="flex items-center justify-between gap-2 bg-white rounded-xl px-3 py-2 shadow-sm">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    {openPanel === 'sent'
                                                        ? <CalendarCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                                        : <AlertCircle className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                                                    }
                                                    <span className="text-[11px] font-semibold text-slate-700 truncate">
                                                        {g.client?.nome_fantasia || g.client?.razao_social || 'Cliente'}
                                                    </span>
                                                </div>
                                                {openPanel === 'sent' && g.delivered_at && (
                                                    <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg shrink-0 whitespace-nowrap">
                                                        {format(new Date(g.delivered_at), "dd/MM/yy", { locale: ptBR })}
                                                    </span>
                                                )}
                                                {openPanel === 'pending' && g.due_date && (
                                                    <span className="text-[9px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-lg shrink-0 whitespace-nowrap">
                                                        Vcto {format(new Date(g.due_date), "dd/MM", { locale: ptBR })}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </CardContent>
        </Card>
    );
}

