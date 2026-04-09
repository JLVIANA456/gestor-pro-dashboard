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
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { ScrollArea } from "@/components/ui/scroll-area";
import { useClients, Client } from '@/hooks/useClients';
import { useDeliveryList, AccountingGuide } from '@/hooks/useDeliveryList';
import { useAuth } from '@/context/AuthContext';
import { useObligations } from '@/hooks/useObligations';
import { useClientObligations } from '@/hooks/useClientObligations';
import { format, subMonths, parseISO, isValid } from 'date-fns';
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
  const [selectedMonth, setSelectedMonth] = useState(() => format(subMonths(new Date(), 1), 'yyyy-MM'));
  
  // Data Hooks
  const { clients = [], loading: clientsLoading } = useClients();
  const { guides = [], loading: guidesLoading, updateGuide, createGuide } = useDeliveryList(selectedMonth);
  const { obligations = [], loading: obsLoading } = useObligations();
  const { clientObligations = [], loading: coLoading } = useClientObligations();
  
  // Local State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [taskSearch, setTaskSearch] = useState('');
  const [taskStatusFilter, setTaskStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [departmentFilter, setDepartmentFilter] = useState<'all' | 'DP' | 'Fiscal' | 'CONTÁBIL'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isCompetencyDialogOpen, setIsCompetencyDialogOpen] = useState(false);
  const [selectedTaskForBaixa, setSelectedTaskForBaixa] = useState<AccountingGuide | null>(null);
  const [tempCompetency, setTempCompetency] = useState('');

  const isLoading = clientsLoading || obsLoading || coLoading || (guidesLoading && guides.length === 0);

  // 1. Calculate Unified Progress for each client
  const clientProgress = useMemo(() => {
    const progress: Record<string, { total: number; completed: number; tasks: any[] }> = {};
    
    // Defensive check
    if (!clients || !Array.isArray(clients)) return progress;

    clients.forEach(client => {
      if (!client?.isActive) return;
      
      // Calculate Active Obligations for this client
      const activeObligations = (obligations || []).filter(obl => {
        if (!obl?.is_active || obl.periodicity === 'eventual') return false;
        
        const explicitCompanies = obl.company_ids || [];
        let appliesByDefault = false;
        
        if (explicitCompanies.length > 0) {
          appliesByDefault = explicitCompanies.includes(client.id);
        } else {
          const obsRegimes = obl.tax_regimes || [];
          const clientRegime = (client.regimeTributario || '').toLowerCase();
          appliesByDefault = obsRegimes.length === 0 ||
            obsRegimes.some((r: string) => (r || '').toLowerCase() === 'all') ||
            (clientRegime && obsRegimes.some((r: string) => (r || '').toLowerCase() === clientRegime));
        }
        
        const override = (clientObligations || []).find(co => co.client_id === client.id && co.obligation_id === obl.id);
        return override ? override.status === 'enabled' : appliesByDefault;
      });

      const clientGuides = (guides || []).filter(g => g.client_id === client.id);
      const unifiedTasks: any[] = [];
      let completedCount = 0;

      activeObligations.forEach(obl => {
        if (!obl) return;
        const oblNameNormal = (obl.name || '').toLowerCase();
        const existingGuide = clientGuides.find(g => (g.type || '').toLowerCase() === oblNameNormal);
        
        if (existingGuide) {
          if (existingGuide.status === 'completed' || existingGuide.status === 'sent') completedCount++;
          unifiedTasks.push({
            ...existingGuide,
            dept: obl.department,
            is_virtual: false
          });
        } else {
          unifiedTasks.push({
            id: `virtual-${client.id}-${obl.id}`,
            client_id: client.id,
            type: obl.name,
            status: 'pending',
            dept: obl.department,
            is_virtual: true,
            due_date: null
          });
        }
      });

      progress[client.id] = {
        total: activeObligations.length,
        completed: completedCount,
        tasks: unifiedTasks
      };
    });
    
    return progress;
  }, [clients, obligations, clientObligations, guides]);

  // 2. Filter Clients based on Search
  const filteredClients = useMemo(() => {
    if (!clients || !Array.isArray(clients)) return [];
    return clients.filter(client => {
      if (!client?.isActive) return false;
      const q = searchQuery.toLowerCase();
      return (
        (client.nomeFantasia || '').toLowerCase().includes(q) ||
        (client.razaoSocial || '').toLowerCase().includes(q) ||
        (client.cnpj || '').includes(q)
      );
    }).sort((a, b) => (a.nomeFantasia || a.razaoSocial || '').localeCompare(b.nomeFantasia || b.razaoSocial || ''));
  }, [clients, searchQuery]);

  // Handlers
  const handleOpenDetail = (client: Client) => {
    setSelectedClient(client);
    setIsDetailOpen(true);
    setTaskSearch('');
    setTaskStatusFilter('all');
    setDepartmentFilter('all');
  };

  const handleUpdateTaskStatus = async (guide: AccountingGuide, chosenCompetency?: string) => {
    if (!guide || !guide.id) {
      console.error('Tentativa de baixar tarefa sem ID válido:', guide);
      toast.error('Erro: ID da tarefa não encontrado.');
      return;
    }

    const isCompleted = guide.status === 'completed' || guide.status === 'sent';
    const newStatus = isCompleted ? 'pending' : 'completed';
    
    console.log(`[DemandList] Ação disparada: ${newStatus} para tarefa ${guide.id}`);

    if (newStatus === 'completed') {
      try {
        await updateGuide(guide.id, {
          status: 'completed',
          competency: chosenCompetency || guide.competency,
          justification: 'Baixa manual via Lista de Demandas',
          completed_at: new Date().toISOString(),
          completed_by: user?.name || user?.email || 'Usuário'
        });
        toast.success(`Tarefa "${guide.type}" baixada com sucesso!`);
      } catch (error) {
        console.error('Erro na baixa manual:', error);
        toast.error("Falha ao processar a baixa.");
      }
    } else {
      try {
        await updateGuide(guide.id, {
          status: 'pending',
          justification: null,
          completed_at: null,
          completed_by: null,
          sent_at: null,
          delivered_at: null,
          opened_at: null
        });
        toast.success("Baixa desfeita com sucesso.");
      } catch (error) {
        console.error('Erro no estorno:', error);
        toast.error("Falha ao desfazer a baixa.");
      }
    }
  };

  // 3. Modal Tasks Filtering
  const modalTasks = useMemo(() => {
    if (!selectedClient || !clientProgress[selectedClient.id]) return [];
    const clientData = clientProgress[selectedClient.id];
    
    return clientData.tasks.filter(task => {
      const taskName = (task.type || '').toLowerCase();
      const matchesSearch = taskName.includes(taskSearch.toLowerCase());
      
      let dept = task.dept;
      if (!dept) {
        const obs = obligations.find(o => (o.name || '').toLowerCase() === taskName);
        dept = obs?.department || 'Outros';
      }
      
      const matchesDept = departmentFilter === 'all' || 
                         (dept || '').toUpperCase() === departmentFilter.toUpperCase();
      
      let matchesStatus = true;
      const isTaskDone = task.status === 'completed' || task.status === 'sent';
      if (taskStatusFilter === 'completed') matchesStatus = isTaskDone;
      if (taskStatusFilter === 'pending') matchesStatus = !isTaskDone;

      return matchesSearch && matchesDept && matchesStatus;
    }).sort((a, b) => {
      if (a.status !== b.status) return a.status === 'completed' ? 1 : -1;
      return (a.type || '').localeCompare(b.type || '');
    });
  }, [selectedClient, clientProgress, taskSearch, taskStatusFilter, departmentFilter, obligations]);

  const currentStats = useMemo(() => {
    if (!selectedClient) return { total: 0, completed: 0, pending: 0 };
    const stats = clientProgress[selectedClient.id] || { total: 0, completed: 0, tasks: [] };
    return {
      total: stats.total,
      completed: stats.completed,
      pending: Math.max(0, stats.total - stats.completed)
    };
  }, [selectedClient, clientProgress]);

  // Safely format date
  const displayMonth = useMemo(() => {
    try {
      const date = parseISO(selectedMonth + '-01');
      if (!isValid(date)) return selectedMonth;
      return format(date, 'MMMM yyyy', { locale: ptBR }).toUpperCase();
    } catch {
      return selectedMonth;
    }
  }, [selectedMonth]);

  return (
    <div className="space-y-10 pb-16 animate-in fade-in duration-700">
      {/* Header Section - Always Visible */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between pt-6">
        <div className="relative group">
          <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-1.5 h-16 bg-primary rounded-full opacity-20 group-hover:opacity-100 transition-opacity duration-500" />
          <h1 className="text-4xl font-extralight tracking-tight text-slate-800 dark:text-slate-100">
            Lista de <span className="text-primary font-semibold italic">Demandas</span>
          </h1>
          <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.3em] mt-3 ml-1">
            Gestão Operacional Mensal • {displayMonth}
          </p>
        </div>
        
        <div className="flex items-center gap-4 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl p-3 rounded-[2rem] border border-slate-200/50 shadow-2xl shadow-primary/5">
          <div className="flex items-center gap-3 px-5 py-2.5 bg-primary/5 rounded-2xl border border-primary/10">
            <CalendarDays className="h-5 w-5 text-primary opacity-60" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent border-none text-sm font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer hover:text-primary transition-colors pr-2"
            />
          </div>

          <div className="h-8 w-px bg-slate-200/50 mx-1" />

          <div className="bg-slate-200/20 p-1 rounded-xl flex items-center gap-1">
            <Button
              variant={viewMode === 'grid' ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode('grid')}
              className={cn("h-9 w-9 rounded-lg transition-all", viewMode === 'grid' && "shadow-sm bg-white")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode('list')}
              className={cn("h-9 w-9 rounded-lg transition-all", viewMode === 'list' && "shadow-sm bg-white")}
            >
              <ListIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Search Bar - Always Visible */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center animate-slide-in-up stagger-1">
        <div className="relative flex-1 group">
          <Search className="absolute left-6 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Buscar por razão social, nome fantasia ou CNPJ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-16 w-full rounded-[2rem] border-none bg-white dark:bg-slate-800 shadow-xl shadow-slate-200/20 pl-14 pr-6 text-sm font-light placeholder:text-slate-400 focus:ring-4 focus:ring-primary/5 transition-all"
          />
        </div>
      </div>

      {/* Área de Conteúdo - Loader ou Resultados */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-40 gap-6 bg-white/40 dark:bg-slate-900/40 rounded-[4rem] border border-dashed border-red-200">
           <div className="relative">
              <Loader2 className="h-12 w-12 animate-spin text-red-500/30" />
              <Target className="absolute inset-0 m-auto h-4 w-4 text-red-500 animate-pulse" />
           </div>
           <p className="text-[10px] uppercase font-black tracking-[0.4em] text-red-400 italic">Sincronizando Centro de Operações...</p>
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-40 bg-slate-50/50 dark:bg-slate-900/50 rounded-[4rem] border border-dashed border-slate-200 animate-slide-in-up">
          <Building2 className="h-20 w-20 text-slate-200 mb-6" />
          <p className="text-sm font-light text-slate-400 tracking-wide italic">Nenhuma empresa mapeada para o ciclo atual.</p>
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
                  "group relative rounded-[3.5rem] border border-slate-200/60 bg-white dark:bg-slate-900 overflow-hidden transition-all duration-700 hover:shadow-[0_40px_80px_-20px_rgba(220,38,38,0.12)] hover:border-red-500/40 hover:-translate-y-2 cursor-pointer shadow-lg shadow-slate-200/40",
                )}
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => handleOpenDetail(client)}
              >
                <div className="p-10 space-y-8 relative z-10">
                  <div className="flex gap-8">
                    <div className={cn(
                      "h-16 w-16 rounded-[2rem] flex items-center justify-center shadow-2xl transition-all group-hover:scale-110 group-hover:rotate-3 duration-700 border border-white/50",
                      percentage === 100 && stats.total > 0 ? "bg-emerald-500 text-white shadow-emerald-500/20" : "bg-red-600 text-white shadow-red-500/40"
                    )}>
                      {percentage === 100 && stats.total > 0 ? <CheckCircle2 className="h-8 w-8" /> : <Building2 className="h-8 w-8" />}
                    </div>
                    <div className="min-w-0 flex-1 flex flex-col justify-center">
                      <h3 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100 truncate leading-tight group-hover:text-red-600 transition-colors duration-500">
                        {client.nomeFantasia || client.razaoSocial}
                      </h3>
                      <div className="flex items-center gap-2 mt-2">
                         <span className={cn("h-1.5 w-1.5 rounded-full animate-pulse", percentage === 100 ? "bg-emerald-500" : "bg-red-500")} />
                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Progresso: {percentage}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6 bg-slate-50 dark:bg-slate-800/50 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800/50">
                    <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden shadow-inner">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all duration-1000",
                          percentage === 100 && stats.total > 0 ? "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]" : "bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.3)]"
                        )}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-6 text-center">
                          <div className="flex flex-col">
                            <span className="text-xl font-bold text-slate-800 dark:text-slate-100">{stats.completed}</span>
                            <span className="text-[8px] uppercase font-black tracking-widest text-slate-400">CONCLUÍDO</span>
                          </div>
                          <div className="h-8 w-px bg-slate-200/50" />
                          <div className="flex flex-col">
                            <span className="text-xl font-bold text-red-600 dark:text-red-500">{stats.total - stats.completed}</span>
                            <span className="text-[8px] uppercase font-black tracking-widest text-slate-400">PENDENTE</span>
                          </div>
                       </div>
                       
                       <Badge variant="outline" className={cn(
                         "h-7 px-3 text-[8px] font-black tracking-[0.2em] uppercase border-none rounded-xl",
                         regimeStyles[client.regimeTributario] || 'bg-slate-100 text-slate-500'
                       )}>
                         {regimeLabels[client.regimeTributario] || 'Simples'}
                       </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-3">
                       <div className="flex -space-x-3">
                          {[1,2,3].map((_, i) => (
                            <div key={i} className="h-6 w-6 rounded-full border-2 border-white dark:border-slate-800 bg-red-500/10 flex items-center justify-center">
                               <PieChart className="h-3 w-3 text-red-600/60" />
                            </div>
                          ))}
                       </div>
                       <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Mapeamento: {stats.total} tarefas</span>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-600 translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500 shadow-sm border border-red-100 dark:border-red-900/30">
                      <ArrowRight className="h-4 w-4" />
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
                  className="group flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 rounded-[2.5rem] border border-slate-100 bg-white hover:shadow-2xl hover:border-red-500/30 transition-all cursor-pointer shadow-sm"
                  style={{ animationDelay: `${index * 30}ms` }}
               >
                  <div className="flex items-center gap-6 min-w-0 flex-1">
                    <div className={cn(
                      "h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 border transition-all duration-500 shadow-sm",
                      percentage === 100 && stats.total > 0 ? "bg-emerald-500 text-white border-emerald-500" : "bg-red-600 text-white border-red-500 shadow-red-500/20"
                    )}>
                      {percentage === 100 && stats.total > 0 ? <CheckCircle2 className="h-6 w-6" /> : <Building2 className="h-6 w-6" />}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg font-bold text-slate-800 truncate group-hover:text-red-600 transition-colors">{client.nomeFantasia || client.razaoSocial}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{client.cnpj}</span>
                        <span className="h-1 w-1 rounded-full bg-slate-200" />
                        <span className="text-[9px] font-black text-red-600 uppercase tracking-widest leading-none">{regimeLabels[client.regimeTributario]}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-12">
                     <div className="w-40 h-2 bg-slate-100 rounded-full overflow-hidden hidden lg:block shadow-inner">
                        <div className="h-full bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.4)]" style={{ width: `${percentage}%` }} />
                     </div>
                     <div className="flex items-center gap-8 text-center min-w-[120px]">
                        <div>
                           <p className="text-xl font-bold text-slate-800">{stats.completed}</p>
                           <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">FEITAS</p>
                        </div>
                        <div className="h-8 w-px bg-slate-100" />
                        <div>
                           <p className="text-xl font-bold text-red-600">{stats.total - stats.completed}</p>
                           <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">PENDENTES</p>
                        </div>
                     </div>
                     <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center text-red-600 border border-red-100 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                        <ArrowRight className="h-4 w-4" />
                     </div>
                  </div>
               </div>
             );
           })}
        </div>
      )}

      {/* Optimized Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-[calc(100vw-2rem)] lg:max-w-4xl w-full p-0 overflow-hidden rounded-[2rem] lg:rounded-[3rem] border-none bg-slate-50 dark:bg-slate-900 shadow-2xl max-h-[95vh] flex flex-col">
          {selectedClient && (
            <div className="flex flex-col h-full max-h-[85vh] overflow-hidden">
              {/* Modal Header */}
              <div className="p-6 lg:p-10 pb-6 lg:pb-8 bg-white dark:bg-slate-800 relative overflow-hidden shrink-0">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full -translate-y-32 translate-x-32 blur-[80px]" />
                  
                  <div className="flex items-center gap-6 relative z-10">
                      <div className="h-16 w-16 rounded-[2rem] bg-red-600 text-white flex flex-col items-center justify-center shadow-xl shadow-red-500/20">
                          <Target className="h-7 w-7" />
                      </div>
                      <div className="flex-1 min-w-0">
                          <h2 className="text-xl lg:text-2xl font-bold text-slate-800 dark:text-white truncate lg:max-w-xl">
                              {selectedClient.nomeFantasia || selectedClient.razaoSocial}
                          </h2>
                          <div className="flex items-center gap-4 mt-2">
                             <div className="flex items-center gap-2">
                                <Activity className="h-3.5 w-3.5 text-red-600" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{selectedMonth} • {regimeLabels[selectedClient.regimeTributario]}</span>
                             </div>
                             <div className="h-1 w-1 rounded-full bg-slate-200" />
                             <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">{currentStats.completed}/{currentStats.total} CONCLUÍDAS</span>
                          </div>
                      </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 relative z-10">
                      <div className="relative group">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-red-500 transition-colors" />
                          <input
                              placeholder="Filtro rápido de tarefa..."
                              value={taskSearch}
                              onChange={e => setTaskSearch(e.target.value)}
                              className="h-12 w-full pl-12 pr-4 rounded-2xl border-none bg-slate-100 dark:bg-slate-700 text-xs font-medium focus:ring-4 focus:ring-red-500/10 transition-all shadow-inner"
                          />
                      </div>
                      <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 p-1.5 rounded-2xl border border-slate-200/50 shadow-inner">
                         {['all', 'pending', 'completed'].map(s => (
                            <button
                              key={s}
                              onClick={() => setTaskStatusFilter(s as any)}
                              className={cn(
                                "flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                                taskStatusFilter === s ? "bg-white dark:bg-slate-600 text-red-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                              )}
                            >
                               {s === 'all' ? 'VER TUDO' : s === 'pending' ? 'PENDENTES' : 'CONCLUÍDAS'}
                            </button>
                         ))}
                      </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-4 relative z-10">
                      {['all', 'DP', 'Fiscal', 'CONTÁBIL'].map(d => (
                          <button
                            key={d}
                            onClick={() => setDepartmentFilter(d as any)}
                            className={cn(
                                "px-6 py-2 rounded-xl text-[9px] font-bold uppercase tracking-[0.1em] border transition-all",
                                departmentFilter === d
                                    ? "bg-red-600 text-white border-red-600 shadow-lg shadow-red-500/20"
                                    : "bg-transparent text-slate-400 border-slate-200 hover:border-slate-300"
                            )}
                          >
                              {d === 'all' ? 'TODOS OS SETORES' : d}
                          </button>
                      ))}
                  </div>
              </div>

              <ScrollArea className="flex-1 bg-slate-50 dark:bg-slate-900 overflow-y-auto">
                  <div className="p-6 lg:p-10 pt-4 lg:pt-6 space-y-4 pb-20">
                      {modalTasks.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-24 text-slate-300 gap-4">
                              <BoxIcon className="h-16 w-16 opacity-30" />
                              <p className="text-[10px] uppercase font-black tracking-widest opacity-60">Nenhuma demanda ativa para este filtro.</p>
                          </div>
                      ) : (
                          modalTasks.map((task) => {
                              const isCompleted = task.status === 'completed' || task.status === 'sent';
                              return (
                                  <div
                                      key={task.id}
                                      className={cn(
                                        "group/item bg-white dark:bg-slate-800 border rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center gap-6 transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/50",
                                        isCompleted ? "border-emerald-100 bg-emerald-50/20" : "border-slate-100"
                                      )}
                                  >
                                      <div className={cn(
                                        "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 border shadow-sm",
                                        isCompleted ? "bg-emerald-500 text-white border-emerald-500" : "bg-red-50 text-red-600 border-red-100"
                                      )}>
                                          {isCompleted ? <CheckCircle2 className="h-6 w-6" /> : <Clock className="h-6 w-6" />}
                                      </div>

                                      <div className="flex-1 min-w-0">
                                          <div className="flex flex-wrap items-center gap-3">
                                            <p className={cn(
                                              "text-base font-bold",
                                              isCompleted ? "text-slate-400 line-through opacity-60" : "text-slate-800 dark:text-white"
                                            )}>
                                              {task.type}
                                            </p>
                                            <Badge variant="outline" className={cn(
                                              "h-5 text-[8px] font-black uppercase border-none px-2 rounded-lg",
                                              (task.dept || '').toUpperCase() === 'DP' ? "bg-blue-500/10 text-blue-600" :
                                              (task.dept || '').toUpperCase() === 'FISCAL' ? "bg-amber-500/10 text-amber-600" :
                                              (task.dept || '').toUpperCase() === 'CONTÁBIL' ? "bg-violet-500/10 text-violet-600" :
                                              "bg-slate-100 text-slate-400"
                                            )}>
                                              {task.dept || 'Outros'}
                                            </Badge>
                                          </div>
                                          
                                          <div className="flex flex-wrap items-center gap-4 mt-2">
                                              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">
                                                <CalendarDays className="h-3 w-3" />
                                                VENCIMENTO: <span className="text-slate-600 dark:text-slate-300">{task.due_date ? format(parseISO(task.due_date), "dd/MM") : '-'}</span>
                                              </div>
                                              <div className="h-1 w-1 rounded-full bg-slate-200" />
                                              {isCompleted ? (
                                                <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-emerald-600">
                                                   <CheckCircle2 className="h-3 w-3" />
                                                   BAIXADA POR: {task.completed_by || 'Sistema'}
                                                </div>
                                              ) : (
                                                <div className="text-[9px] font-black uppercase text-red-600 animate-pulse">
                                                   Aguardando Envio
                                                </div>
                                              )}
                                          </div>
                                          
                                          {isCompleted && task.justification && (
                                            <div className="mt-4 py-3 px-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100/50 relative">
                                                <Quote className="h-4 w-4 text-emerald-500/20 absolute -top-2 -left-2" />
                                                <p className="text-[10px] text-slate-500 dark:text-slate-400 italic leading-snug pl-1">
                                                  {task.justification}
                                                </p>
                                            </div>
                                          )}
                                      </div>

                                      <div className="shrink-0 pt-4 sm:pt-0">
                                          {isCompleted ? (
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              disabled={task.is_virtual}
                                              onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                if (!task.is_virtual) handleUpdateTaskStatus(task);
                                              }}
                                              className="h-11 px-6 rounded-2xl text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 group/rev"
                                            >
                                              <Undo2 className="h-4 w-4 mr-2 group-hover/rev:-rotate-45 transition-transform" />
                                              DESFAZER BAIXA
                                            </Button>
                                          ) : (
                                            <Button
                                              onClick={() => {
                                                if (task.is_virtual) {
                                                   const confirmCreation = window.confirm(`Esta tarefa ainda não foi gerada no ciclo de ${selectedMonth}. Deseja gerar e baixar manualmente agora?`);
                                                   if (confirmCreation) {
                                                      const [y, m] = selectedMonth.split('-').map(Number);
                                                      const refDate = new Date(y, m - 1, 1);
                                                      const obligation = (obligations || []).find(o => (o.name || '').toLowerCase() === (task.type || '').toLowerCase());
                                                      
                                                      let competency = format(refDate, 'MM/yyyy');
                                                      if (obligation?.competency_rule === 'previous_month') {
                                                         competency = format(new Date(y, m - 2, 1), 'MM/yyyy');
                                                      }

                                                      toast.promise(
                                                        createGuide({
                                                          client_id: selectedClient.id,
                                                          type: task.type,
                                                          reference_month: selectedMonth,
                                                          status: 'pending',
                                                          file_url: null,
                                                          competency: competency,
                                                          due_date: null,
                                                          amount: null,
                                                          scheduled_for: null,
                                                          sent_at: null,
                                                          delivered_at: null,
                                                          opened_at: null
                                                        }).then(newGuide => {
                                                            setSelectedTaskForBaixa(newGuide as any);
                                                            const currentComp = newGuide.competency || format(new Date(), 'MM/yyyy');
                                                            if (currentComp.includes('/')) {
                                                                const [m, y] = currentComp.split('/');
                                                                setTempCompetency(`${y}-${m.padStart(2, '0')}`);
                                                            } else {
                                                                setTempCompetency(currentComp);
                                                            }
                                                            setIsCompetencyDialogOpen(true);
                                                        }),
                                                        {
                                                          loading: 'Mapeando obrigação...',
                                                          success: 'Obrigação mapeada. Escolha a competência para concluir...',
                                                          error: 'Falha na comunicação com o banco.'
                                                        }
                                                      );
                                                   }
                                                } else {
                                                    setSelectedTaskForBaixa(task as any);
                                                    const currentComp = task.competency || format(new Date(), 'MM/yyyy');
                                                    if (currentComp.includes('/')) {
                                                        const [m, y] = currentComp.split('/');
                                                        setTempCompetency(`${y}-${m.padStart(2, '0')}`);
                                                    } else {
                                                        setTempCompetency(currentComp);
                                                    }
                                                    setIsCompetencyDialogOpen(true);
                                                }
                                              }}
                                              className="h-12 px-8 rounded-2xl bg-red-600 hover:bg-red-700 hover:scale-[1.02] shadow-xl shadow-red-500/30 hover:shadow-red-500/40 transition-all text-[9px] font-black uppercase tracking-[0.2em] text-white border-none"
                                            >
                                               BAIXAR A TAREFA
                                            </Button>
                                          )}
                                      </div>
                                  </div>
                              );
                          })
                      )}
                  </div>
              </ScrollArea>
              
              {/* Modal Footer */}
              <div className="p-6 lg:p-8 bg-white dark:bg-slate-800 border-t border-slate-100 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                     <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Auditoria em tempo real habilitada</p>
                  </div>
                  <Button variant="ghost" onClick={() => setIsDetailOpen(false)} className="rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600">Fechar Janela</Button>
              </div>
           </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isCompetencyDialogOpen} onOpenChange={setIsCompetencyDialogOpen}>
        <DialogContent className="max-w-[calc(100vw-2rem)] lg:max-w-md rounded-[2rem] lg:rounded-[2.5rem] border-none p-6 lg:p-10 bg-card shadow-2xl">
            <div className="space-y-6">
                <div>
                    <h3 className="text-2xl font-light">Competência</h3>
                    <p className="text-xs uppercase font-bold tracking-widest pt-2 opacity-60">
                        Confirme o mês de competência desta tarefa.
                    </p>
                </div>

                <div className="space-y-3">
                    <Label className="text-[10px] uppercase font-black tracking-widest opacity-60 ml-1">Mês de Competência</Label>
                    <Input 
                        type="month" 
                        value={tempCompetency}
                        onChange={(e) => setTempCompetency(e.target.value)}
                        className="h-14 rounded-2xl border-border/40 bg-muted/20 text-sm font-medium focus-visible:ring-primary/20"
                    />
                </div>

                <div className="flex gap-4 pt-4">
                    <Button 
                        variant="ghost" 
                        onClick={() => setIsCompetencyDialogOpen(false)}
                        className="flex-1 rounded-2xl h-14 text-[10px] uppercase font-black tracking-widest"
                    >
                        Cancelar
                    </Button>
                    <Button 
                        onClick={() => {
                                 if (selectedTaskForBaixa && tempCompetency) {
                                    const [y, m] = tempCompetency.split('-');
                                    const formattedComp = `${m}/${y}`;
                                    handleUpdateTaskStatus(selectedTaskForBaixa, formattedComp);
                                    setIsCompetencyDialogOpen(false);
                                }
                        }}
                        className="flex-1 rounded-2xl h-14 bg-red-600 hover:bg-red-700 text-white shadow-xl shadow-red-500/20 text-[10px] uppercase font-black tracking-widest"
                    >
                        Confirmar Baixa
                    </Button>
                </div>
            </div>
        </DialogContent>
      </Dialog>
      
      <style>{`
        @keyframes slide-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-in-up {
          animation: slide-in-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .stagger-1 { animation-delay: 0.1s; opacity: 0; }
        .stagger-2 { animation-delay: 0.2s; opacity: 0; }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
    </div>
  );
}

function BoxIcon({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
      <path d="m3.3 7 8.7 5 8.7-5"/>
      <path d="M12 22V12"/>
    </svg>
  );
}
