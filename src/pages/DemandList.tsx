import { useState, useMemo } from 'react';
import { 
  Building2, 
  Search, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  User,
  PieChart,
  BarChart3,
  Undo2,
  CalendarDays,
  Loader2,
  X,
  Target,
  Quote,
  Activity,
  Filter,
  LayoutGrid,
  List as ListIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { ScrollArea } from "@/components/ui/scroll-area";
import { useClients, Client } from '@/hooks/useClients';
import { useDeliveryList, AccountingGuide } from '@/hooks/useDeliveryList';
import { useAuth } from '@/context/AuthContext';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

const regimeLabels: Record<string, string> = {
  simples: 'Simples Nacional',
  presumido: 'Lucro Presumido',
  real: 'Lucro Real',
  domestico: 'Empregador Doméstico',
};

const regimeStyles: Record<string, string> = {
  simples: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  presumido: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  real: 'bg-violet-500/10 text-violet-600 border-violet-500/20',
  domestico: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
};

export default function DemandList() {
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(() => format(new Date(), 'yyyy-MM'));
  const { clients, loading: clientsLoading } = useClients();
  const { guides, loading: guidesLoading, updateGuide } = useDeliveryList(selectedMonth);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  const [taskSearch, setTaskSearch] = useState('');
  const [taskStatusFilter, setTaskStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      if (!client.isActive) return false;
      const q = searchQuery.toLowerCase();
      return (
        (client.nomeFantasia || '').toLowerCase().includes(q) ||
        (client.razaoSocial || '').toLowerCase().includes(q) ||
        (client.cnpj || '').includes(q)
      );
    }).sort((a, b) => (a.nomeFantasia || a.razaoSocial || '').localeCompare(b.nomeFantasia || b.razaoSocial || ''));
  }, [clients, searchQuery]);

  const clientProgress = useMemo(() => {
    const progress: Record<string, { total: number; completed: number; tasks: AccountingGuide[] }> = {};
    
    guides.forEach(item => {
      if (!progress[item.client_id]) {
        progress[item.client_id] = { total: 0, completed: 0, tasks: [] };
      }
      progress[item.client_id].total++;
      if (item.status === 'completed') {
        progress[item.client_id].completed++;
      }
      progress[item.client_id].tasks.push(item);
    });
    
    return progress;
  }, [guides]);

  const handleOpenDetail = (client: Client) => {
    setSelectedClient(client);
    setIsDetailOpen(true);
    setTaskSearch('');
    setTaskStatusFilter('all');
  };

  const handleUpdateTaskStatus = async (guide: AccountingGuide) => {
    const isCompleted = guide.status === 'completed';
    const newStatus = isCompleted ? 'pending' : 'completed';
    
    if (newStatus === 'completed') {
      const justification = prompt('Digite uma justificativa para a baixa:');
      if (!justification) return;
      
      try {
        await updateGuide(guide.id, {
          status: 'completed',
          justification: justification,
          completed_at: new Date().toISOString(),
          completed_by: user?.name || user?.email || 'Sistema'
        });
        toast.success("Demanda finalizada com sucesso!");
      } catch (error) {
        toast.error("Erro ao finalizar demanda.");
      }
    } else {
      if (confirm('Deseja reverter a baixa desta tarefa?')) {
        try {
          await updateGuide(guide.id, {
            status: 'pending',
            justification: null,
            completed_at: null,
            completed_by: null
          });
          toast.success("Baixa revertida com sucesso.");
        } catch (error) {
          toast.error("Erro ao reverter baixa.");
        }
      }
    }
  };

  const modalTasks = useMemo(() => {
    if (!selectedClient) return [];
    const tasks = clientProgress[selectedClient.id]?.tasks || [];
    
    return tasks.filter(task => {
      const matchesSearch = (task.type || '').toLowerCase().includes(taskSearch.toLowerCase());
      const matchesStatus = taskStatusFilter === 'all' || 
                           (taskStatusFilter === 'completed' ? task.status === 'completed' : task.status !== 'completed');
      return matchesSearch && matchesStatus;
    }).sort((a, b) => (a.type || '').localeCompare(b.type || ''));
  }, [selectedClient, clientProgress, taskSearch, taskStatusFilter]);

  const currentStats = useMemo(() => {
    if (!selectedClient) return { total: 0, completed: 0, pending: 0 };
    const stats = clientProgress[selectedClient.id] || { total: 0, completed: 0, tasks: [] };
    return {
      total: stats.total,
      completed: stats.completed,
      pending: stats.total - stats.completed
    };
  }, [selectedClient, clientProgress]);

  const isLoading = clientsLoading || guidesLoading;

  if (isLoading && guides.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
        <p className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground/40 italic">Iniciando Centro de Operações...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-16 animate-in fade-in duration-700">
      {/* Header Centralizado */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between pt-6">
        <div className="relative group">
          <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-1.5 h-16 bg-primary rounded-full opacity-20 group-hover:opacity-100 transition-opacity duration-500" />
          <h1 className="text-4xl font-extralight tracking-tight text-foreground/90">
            Lista de <span className="text-primary font-semibold italic">Demandas</span>
          </h1>
          <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.3em] mt-3 ml-1">
            Gestão Operacional Mensal • {format(parseISO(selectedMonth + '-01'), 'MMMM yyyy', { locale: ptBR }).toUpperCase()}
          </p>
        </div>
        
        <div className="flex items-center gap-4 bg-white/40 dark:bg-card/30 backdrop-blur-2xl p-3 rounded-[2rem] border border-border/40 shadow-2xl shadow-primary/5">
          <div className="flex items-center gap-3 px-5 py-2.5 bg-primary/5 rounded-2xl border border-primary/10">
            <CalendarDays className="h-5 w-5 text-primary opacity-60" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent border-none text-sm font-bold text-foreground/80 outline-none cursor-pointer hover:text-primary transition-colors pr-2"
            />
          </div>

          <div className="h-8 w-px bg-border/40 mx-1" />

          <div className="bg-muted/20 p-1 rounded-xl flex items-center gap-1">
            <Button
              variant={viewMode === 'grid' ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode('grid')}
              className={cn("h-9 w-9 rounded-lg transition-all", viewMode === 'grid' && "shadow-sm")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode('list')}
              className={cn("h-9 w-9 rounded-lg transition-all", viewMode === 'list' && "shadow-sm")}
            >
              <ListIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Busca Principal */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center animate-slide-in-up stagger-1">
        <div className="relative flex-1 group">
          <Search className="absolute left-6 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/30 group-focus-within:text-primary/50 transition-colors" />
          <input
            type="text"
            placeholder="Buscar por razão social, nome fantasia ou CNPJ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-16 w-full rounded-[2rem] border-none bg-white/60 dark:bg-card/40 backdrop-blur-md pl-14 pr-6 text-sm font-light placeholder:text-muted-foreground/30 focus:ring-4 focus:ring-primary/[0.03] shadow-lg shadow-black/[0.02] transition-all"
          />
        </div>
      </div>

      {/* Grid ou Lista de Empresas */}
      {filteredClients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-40 bg-card/10 rounded-[4rem] border border-dashed border-border/40 animate-slide-in-up">
          <Building2 className="h-20 w-20 text-muted-foreground/10 mb-6" />
          <p className="text-sm font-light text-muted-foreground tracking-wide italic">Nenhuma empresa encontrada para os filtros atuais.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3 animate-slide-in-up stagger-2">
          {filteredClients.map((client, index) => {
            const stats = clientProgress[client.id] || { total: 0, completed: 0, tasks: [] };
            const percentage = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
            
            return (
              <div
                key={client.id}
                className={cn(
                  "group relative rounded-[3.5rem] border border-border/40 bg-white/40 dark:bg-card/20 backdrop-blur-3xl overflow-hidden transition-all duration-700 hover:shadow-[0_40px_80px_-20px_rgba(37,99,235,0.08)] hover:border-primary/30 hover:-translate-y-2 cursor-pointer",
                )}
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => handleOpenDetail(client)}
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-32 translate-x-32 blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

                <div className="p-10 space-y-10 relative z-10">
                  <div className="flex gap-8">
                    <div className={cn(
                      "h-20 w-20 rounded-[2.5rem] flex items-center justify-center shadow-2xl transition-all group-hover:scale-110 group-hover:rotate-3 duration-700 ring-1 ring-white/20",
                      percentage === 100 && stats.total > 0 ? "bg-emerald-500 text-white shadow-emerald-500/30" : "bg-primary text-white shadow-primary/30"
                    )}>
                      {percentage === 100 && stats.total > 0 ? <CheckCircle2 className="h-10 w-10" /> : <Building2 className="h-10 w-10" />}
                    </div>
                    <div className="min-w-0 flex-1 flex flex-col justify-center">
                      <h3 className="text-2xl font-bold tracking-tight text-foreground/90 truncate leading-tight group-hover:text-primary transition-colors duration-500">
                        {client.nomeFantasia || client.razaoSocial}
                      </h3>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">
                          {client.cnpj}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6 bg-muted/20 dark:bg-black/5 p-8 rounded-[3rem] border border-border/5 relative overflow-hidden group/progress">
                    <div className="flex items-center justify-between relative z-10">
                      <p className="text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground/50">
                        Obrigações Mensais
                      </p>
                      <div className="flex items-center gap-2">
                        <Target className="h-3 w-3 text-primary opacity-40" />
                        <span className={cn(
                          "text-sm font-black tracking-tighter",
                          percentage === 100 && stats.total > 0 ? "text-emerald-500" : "text-primary"
                        )}>
                          {percentage}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="h-2 w-full bg-border/20 rounded-full overflow-hidden relative z-10 shadow-inner">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all duration-1000 shadow-lg",
                          percentage === 100 && stats.total > 0 ? "bg-emerald-500 shadow-emerald-500/40" : "bg-primary shadow-primary/40"
                        )}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2 relative z-10">
                       <div className="flex items-center gap-6">
                          <div className="flex flex-col">
                            <span className="text-2xl font-light text-foreground/80">{stats.completed}</span>
                            <span className="text-[9px] uppercase font-black tracking-widest text-muted-foreground/40 mt-1">Concluídas</span>
                          </div>
                          <div className="h-10 w-px bg-border/20" />
                          <div className="flex flex-col">
                            <span className="text-2xl font-light text-foreground/80">{stats.total - stats.completed}</span>
                            <span className="text-[9px] uppercase font-black tracking-widest text-muted-foreground/40 mt-1">Pendentes</span>
                          </div>
                       </div>
                       
                       <div className={cn(
                         "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm",
                         regimeStyles[client.regimeTributario] || 'bg-muted/10 text-muted-foreground'
                       )}>
                         {regimeLabels[client.regimeTributario] || 'Simples'}
                       </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/5">
                    <div className="flex items-center gap-3">
                       <div className="flex -space-x-3 overflow-hidden">
                          {Array.from({ length: Math.min(stats.total, 3) }).map((_, i) => (
                            <div key={i} className="inline-block h-6 w-6 rounded-full ring-4 ring-white/50 dark:ring-card bg-primary/20 border border-primary/20" />
                          ))}
                       </div>
                       <span className="text-[10px] text-muted-foreground/40 font-bold uppercase tracking-widest">
                         {stats.total} total de obrigações
                       </span>
                    </div>
                    <div className="h-12 w-12 rounded-[1.5rem] bg-primary/5 flex items-center justify-center translate-x-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500">
                      <ArrowRight className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-4 animate-slide-in-up stagger-2">
          {filteredClients.map((client, index) => {
            const stats = clientProgress[client.id] || { total: 0, completed: 0, tasks: [] };
            const percentage = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
            
            return (
              <div
                key={client.id}
                onClick={() => handleOpenDetail(client)}
                className="group flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-[2rem] border border-border/40 bg-white/40 dark:bg-card/20 backdrop-blur-xl hover:shadow-xl hover:border-primary/20 transition-all cursor-pointer"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <div className="flex items-center gap-6 min-w-0 flex-1">
                  <div className={cn(
                    "h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 border transition-all duration-500 group-hover:scale-110 group-hover:rotate-3",
                    percentage === 100 && stats.total > 0 ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-primary/5 text-primary border-primary/20"
                  )}>
                    {percentage === 100 && stats.total > 0 ? <CheckCircle2 className="h-7 w-7" /> : <Building2 className="h-7 w-7" />}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-foreground truncate">{client.nomeFantasia || client.razaoSocial}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest">{client.cnpj}</span>
                      <span className={cn(
                         "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border",
                         regimeStyles[client.regimeTributario] || 'bg-muted/10 text-muted-foreground'
                       )}>
                         {regimeLabels[client.regimeTributario] || 'Simples'}
                       </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-8 md:gap-12">
                   <div className="w-full sm:w-48 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Progresso</span>
                        <span className="text-[10px] font-black text-primary">{percentage}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-border/20 rounded-full overflow-hidden shadow-inner">
                        <div 
                          className={cn("h-full rounded-full transition-all duration-1000", percentage === 100 && stats.total > 0 ? "bg-emerald-500" : "bg-primary")}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                   </div>

                   <div className="flex items-center gap-8">
                      <div className="flex flex-col items-center">
                        <span className="text-xl font-light text-foreground/80">{stats.completed}</span>
                        <span className="text-[8px] uppercase font-black tracking-widest text-muted-foreground/30">Feitas</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-xl font-light text-foreground/80">{stats.total - stats.completed}</span>
                        <span className="text-[8px] uppercase font-black tracking-widest text-muted-foreground/30">Abertas</span>
                      </div>
                   </div>

                   <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500">
                      <ArrowRight className="h-4 w-4 text-primary" />
                   </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* NOVO Modal de Detalhamento Estilo Calendário */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-4xl w-full p-0 overflow-hidden rounded-[2.5rem] border border-border/30 bg-card shadow-2xl animate-in zoom-in-95 duration-500">
          {selectedClient && (
            <div className="flex flex-col h-full overflow-hidden">
              {/* Header Estilo Calendário */}
              <div className="p-8 border-b border-border/10 bg-muted/10 shrink-0">
                  <div className="flex items-center gap-5">
                      <div className="h-14 w-14 rounded-2xl bg-primary flex flex-col items-center justify-center text-white shadow-lg shrink-0">
                          <span className="text-xl font-black leading-none">{format(parseISO(selectedMonth + '-01'), 'MM')}</span>
                          <span className="text-[9px] uppercase font-bold opacity-60 mt-0.5">{format(parseISO(selectedMonth + '-01'), 'MMM', { locale: ptBR }).toUpperCase()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                          <h2 className="text-xl font-light text-foreground truncate capitalize">
                              {selectedClient.nomeFantasia || selectedClient.razaoSocial}
                          </h2>
                          <div className="flex items-center gap-3 mt-0.5">
                            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/50">
                                {selectedClient.cnpj} • {regimeLabels[selectedClient.regimeTributario] || 'Simples'}
                            </p>
                            <Badge variant="outline" className="h-5 text-[8px] font-black uppercase border-primary/20 text-primary bg-primary/5">
                                {selectedMonth}
                            </Badge>
                          </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                          <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-700 text-[10px] font-bold uppercase tracking-widest border border-emerald-500/10">{currentStats.completed} Feitas</span>
                          <span className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-700 text-[10px] font-bold uppercase tracking-widest border border-amber-500/10">{currentStats.pending} Abertas</span>
                      </div>
                  </div>

                  {/* Search Interno */}
                  <div className="relative mt-6">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
                      <input
                          placeholder="Buscar tarefa nesta empresa..."
                          value={taskSearch}
                          onChange={e => setTaskSearch(e.target.value)}
                          className="h-11 w-full pl-10 pr-4 rounded-xl border border-border/20 bg-background text-xs font-light focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-muted-foreground/30 shadow-inner"
                      />
                  </div>

                  {/* Filtro de Abas Estilo Calendário */}
                  <div className="flex flex-wrap items-center gap-2 mt-4">
                      {[
                        { key: 'all', label: 'Ver Tudo', icon: Activity },
                        { key: 'pending', label: 'Pendentes', icon: Clock },
                        { key: 'completed', label: 'Concluídas', icon: CheckCircle2 }
                      ].map(s => (
                          <button
                            key={s.key}
                            onClick={() => setTaskStatusFilter(s.key as any)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all duration-300",
                                taskStatusFilter === s.key
                                    ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                                    : "bg-muted/20 text-muted-foreground border-border/10 hover:bg-muted/40"
                            )}
                          >
                              <s.icon className={cn("h-3.5 w-3.5", taskStatusFilter === s.key ? "text-white" : "text-muted-foreground/40")} />
                              {s.label}
                          </button>
                      ))}
                  </div>
              </div>

              {/* Lista de Tarefas Estilo Calendário */}
              <ScrollArea className="h-[60vh]">
                  <div className="p-6 space-y-4">
                      {modalTasks.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground/20 gap-4">
                              <BarChart3 className="h-12 w-12" />
                              <p className="text-xs font-bold uppercase tracking-[0.2em] italic">Nenhuma demanda encontrada neste filtro.</p>
                          </div>
                      ) : (
                          modalTasks.map((task) => {
                              const isCompleted = task.status === 'completed';
                              return (
                                  <div
                                      key={task.id}
                                      className={cn(
                                        "group/item relative bg-background border rounded-2xl p-5 flex items-center gap-5 transition-all duration-300 hover:shadow-md",
                                        isCompleted ? "border-emerald-500/10 bg-emerald-500/[0.01]" : "border-border/20 hover:border-primary/30"
                                      )}
                                  >
                                      {/* Phase icon simulator */}
                                      <div className={cn(
                                        "h-12 w-12 rounded-xl flex items-center justify-center shrink-0 border transition-transform duration-500 group-hover/item:scale-110",
                                        isCompleted ? "bg-emerald-50 text-emerald-600 border-emerald-500/20" : "bg-primary/5 text-primary border-primary/20"
                                      )}>
                                          {isCompleted ? <CheckCircle2 className="h-6 w-6" /> : <Clock className="h-6 w-6" />}
                                      </div>

                                      {/* Details */}
                                      <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-3">
                                            <p className={cn(
                                              "text-base font-semibold truncate",
                                              isCompleted ? "text-foreground/30 line-through" : "text-foreground"
                                            )}>
                                              {task.type}
                                            </p>
                                            {isCompleted && (
                                              <Badge className="bg-emerald-500/10 text-emerald-600 border-none text-[8px] font-black uppercase px-2">Baixado</Badge>
                                            )}
                                          </div>
                                          <div className="flex items-center gap-4 mt-1.5 overflow-hidden">
                                              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/50 font-medium">
                                                <CalendarDays className="h-3 w-3" />
                                                Vencimento: <span className="text-foreground/40 font-bold">{task.due_date ? format(parseISO(task.due_date), "dd/MM/yyyy", { locale: ptBR }) : '-'}</span>
                                              </div>
                                              <div className="h-1 w-1 rounded-full bg-border" />
                                              {isCompleted ? (
                                                <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-emerald-600/60 transition-all">
                                                  <User className="h-3 w-3" />
                                                  {task.completed_by}
                                                </div>
                                              ) : (
                                                <div className="text-[9px] font-black uppercase tracking-widest text-primary/40">
                                                  Aguardando Execução
                                                </div>
                                              )}
                                          </div>
                                          
                                          {isCompleted && task.justification && (
                                            <div className="mt-3 py-2 px-3 rounded-lg bg-emerald-500/5 border border-emerald-500/5 flex items-start gap-2 relative">
                                                <Quote className="h-3 w-3 text-emerald-600/20 shrink-0 absolute -top-1 -left-1 opacity-40" />
                                                <p className="text-[10px] text-muted-foreground/60 italic leading-snug">
                                                  {task.justification}
                                                </p>
                                            </div>
                                          )}
                                      </div>

                                      {/* Ações */}
                                      <div className="shrink-0 flex items-center gap-2">
                                          {isCompleted ? (
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => handleUpdateTaskStatus(task)}
                                              className="h-11 px-6 rounded-xl text-[9px] font-black uppercase tracking-widest text-muted-foreground/30 hover:text-amber-600 hover:bg-amber-500/5 transition-all border border-transparent hover:border-amber-500/10 group/rev"
                                            >
                                              <Undo2 className="h-4 w-4 mr-2 group-hover/rev:-rotate-45 transition-transform" />
                                              Reverter
                                            </Button>
                                          ) : (
                                            <Button
                                              onClick={() => handleUpdateTaskStatus(task)}
                                              className="h-11 px-8 rounded-xl bg-primary hover:bg-primary/90 text-white text-[10px] uppercase font-black tracking-widest shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95"
                                            >
                                              Baixar Tarefa
                                            </Button>
                                          )}
                                      </div>
                                  </div>
                              );
                          })
                      )}
                  </div>
              </ScrollArea>

              <div className="p-8 border-t border-border/10 bg-muted/10 flex flex-col sm:flex-row items-center justify-between gap-6 shrink-0">
                  <div className="flex items-center gap-4 flex-1">
                      <p className="text-[10px] text-muted-foreground/30 font-bold uppercase tracking-[0.2em] leading-relaxed">
                         Todo registro operacional requer auditoria conforme normas jlconecta. Todas as baixas são registradas com timestamp e identificação do operador.
                      </p>
                  </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: hsl(var(--primary) / 0.1);
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--primary) / 0.2);
        }
        @keyframes slide-in-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-in-up {
          animation: slide-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .stagger-1 { animation-delay: 0.1s; opacity: 0; }
        .stagger-2 { animation-delay: 0.2s; opacity: 0; }
      `}</style>
    </div>
  );
}
