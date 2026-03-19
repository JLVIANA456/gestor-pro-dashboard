import { useState, useMemo } from 'react';
import { 
    ChevronLeft, 
    ChevronRight, 
    Calendar as CalendarIcon, 
    Filter,
    Users,
    Building2,
    AlertCircle,
    CheckCircle2,
    Clock,
    Send,
    FileText,
    BrainCircuit,
    LayoutDashboard,
    Eye,
    Mail,
    ExternalLink,
    Wand2,
    Sparkles
} from 'lucide-react';
import { 
    format, 
    addMonths, 
    subMonths, 
    startOfMonth, 
    endOfMonth, 
    startOfWeek, 
    endOfWeek, 
    eachDayOfInterval, 
    isSameMonth, 
    isSameDay, 
    isToday,
    parseISO
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useDeliveryList, AccountingGuide } from '@/hooks/useDeliveryList';
import { useClients } from '@/hooks/useClients';
import { 
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { AiService } from '@/services/aiService';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { ClientGuidesModal } from '@/components/delivery/ClientGuidesModal';

export default function FiscalCalendar() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedClientForGuide, setSelectedClientForGuide] = useState<any>(null);
    const [isGuidesModalOpen, setIsGuidesModalOpen] = useState(false);
    const referenceMonth = format(currentDate, 'yyyy-MM');
    // Força o carregamento das guias do mês selecionado no calendário
    const { guides, loading, updateGuide, fetchGuides } = useDeliveryList(referenceMonth);
    
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);
    const [dragOverDay, setDragOverDay] = useState<string | null>(null);
    const [isProcessingFile, setIsProcessingFile] = useState(false);
    const [filterCollaborator, setFilterCollaborator] = useState('all');
    const [filterRegime, setFilterRegime] = useState('all');
    const [showOnlyCritical, setShowOnlyCritical] = useState(false);

    const { clients } = useClients();

    // Extrair responsáveis fiscais únicos
    const fiscalResponsibles = useMemo(() => {
        const names = clients
            .map(c => c.responsavelFiscal)
            .filter((name): name is string => !!name && name.trim() !== '');
        return Array.from(new Set(names)).sort();
    }, [clients]);

    // Filtragem de Guias unificada
    const filteredGuides = useMemo(() => {
        return guides.filter(guide => {
            // Encontrar o cliente associado para verificar o responsável
            const client = clients.find(c => c.id === guide.client_id);
            
            // Filtro de Colaborador (Responsável Fiscal)
            if (filterCollaborator !== 'all' && client?.responsavelFiscal !== filterCollaborator) {
                return false;
            }

            // Filtro de Regime
            if (filterRegime !== 'all' && client?.regimeTributario !== filterRegime) {
                return false;
            }

            // Filtro de Críticos (Vencendo hoje/amanhã sem PDF ou pendente de envio)
            if (showOnlyCritical) {
                const isCritical = !guide.file_url || (guide.file_url && guide.status === 'pending');
                if (!isCritical || guide.status === 'sent') return false;
            }

            return true;
        });
    }, [guides, clients, filterCollaborator, filterRegime, showOnlyCritical]);

    // Calendar Calculations
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // 0 is Sunday
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const calendarDays = eachDayOfInterval({
        start: startDate,
        end: endDate
    });

    // Grouping Logic
    const guidesByDay = useMemo(() => {
        const map: Record<string, AccountingGuide[]> = {};
        filteredGuides.forEach(g => {
            if (!g.due_date) return;
            // Sanitiza a data para pegar apenas o YYYY-MM-DD
            const dayKey = g.due_date.split('T')[0];
            if (!map[dayKey]) map[dayKey] = [];
            map[dayKey].push(g);
        });
        return map;
    }, [filteredGuides]);

    // Render Helpers
    const getPillsForDay = (day: Date) => {
        const dayKey = format(day, 'yyyy-MM-dd');
        const dayGuides = guidesByDay[dayKey] || [];
        
        if (dayGuides.length === 0) {
            // Se estiver em modo drag over, mostra um indicativo de drop
            if (dragOverDay === dayKey) {
                return (
                    <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-primary/40 rounded-2xl bg-primary/5 animate-pulse">
                        <FileText className="h-4 w-4 text-primary opacity-40 mb-1" />
                        <span className="text-[7px] uppercase font-bold text-primary/60">Solte o PDF aqui</span>
                    </div>
                );
            }
            return null;
        }

        // Group by type
        const groupedByType = dayGuides.reduce((acc, g) => {
            if (!acc[g.type]) acc[g.type] = [];
            acc[g.type].push(g);
            return acc;
        }, {} as Record<string, AccountingGuide[]>);

        return (
            <div className="space-y-1">
                {Object.entries(groupedByType).map(([type, items]) => {
                    const hasMissingFile = items.some(i => !i.file_url && i.status !== 'sent');
                    const hasPendingSend = items.some(i => i.file_url && i.status === 'pending');
                    const isAllSent = items.every(i => i.status === 'sent');
                    const isScheduled = items.some(i => i.status === 'scheduled');

                    let bgColor = "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
                    let dotColor = "bg-emerald-500";

                    if (hasMissingFile) {
                        bgColor = "bg-red-500/10 text-red-600 border-red-500/20 animate-pulse-subtle";
                        dotColor = "bg-red-500";
                    } else if (hasPendingSend) {
                        bgColor = "bg-amber-500/10 text-amber-600 border-amber-500/20";
                        dotColor = "bg-amber-500";
                    } else if (isScheduled) {
                        bgColor = "bg-blue-500/10 text-blue-600 border-blue-500/20";
                        dotColor = "bg-blue-500";
                    }

                    return (
                        <TooltipProvider key={type}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className={cn(
                                        "flex items-center gap-1.5 px-2 py-1 rounded-md border text-[9px] font-bold uppercase tracking-tighter truncate mb-1 cursor-pointer transition-all hover:scale-[1.02]",
                                        bgColor
                                    )}>
                                        <div className={cn("w-1 h-1 rounded-full", dotColor)} />
                                        <span className="opacity-70">[{items.length}]</span>
                                        <span className="truncate">{type}</span>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent className="p-3 bg-card border-border/40 shadow-2xl rounded-xl no-print">
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-primary border-b border-border/10 pb-1 mb-2">
                                            {type} - {format(day, 'dd/MM')}
                                        </p>
                                        {items.slice(0, 5).map(i => (
                                            <div key={i.id} className="flex items-center justify-between gap-4">
                                                <span className="text-[10px] font-light truncate max-w-[120px]">{i.client?.nome_fantasia || i.client?.razao_social}</span>
                                                <Badge variant="outline" className="text-[8px] h-4 uppercase">{i.status}</Badge>
                                            </div>
                                        ))}
                                        {items.length > 5 && <p className="text-[8px] text-muted-foreground text-center">e mais {items.length - 5} empresas...</p>}
                                    </div>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    );
                })}
                
                {/* Overlay de carregamento no drop */}
                {dragOverDay === dayKey && isProcessingFile && (
                    <div className="absolute inset-0 bg-primary/10 backdrop-blur-[2px] flex items-center justify-center rounded-2xl z-20">
                        <Loader2 className="h-6 w-6 text-primary animate-spin" />
                    </div>
                )}
            </div>
        );
    };

    const handleFileDrop = async (e: React.DragEvent, day: Date) => {
        e.preventDefault();
        const dayKey = format(day, 'yyyy-MM-dd');
        setDragOverDay(null);
        
        const files = Array.from(e.dataTransfer.files);
        if (files.length === 0) return;

        const file = files[0];
        if (file.type !== 'application/pdf') {
            toast.error('Apenas arquivos PDF são suportados');
            return;
        }

        setIsProcessingFile(true);
        const loadingToast = toast.loading(`Processando ${file.name}...`);

        try {
            // 1. Extrair dados com IA
            const extractedData = await AiService.extractGuideData(file);
            console.log('Dados extraídos no Calendário:', extractedData);

            // 2. Upload para Storage
            const { publicUrl } = await AiService.uploadFile(file);

            // 3. Procurar a guia pelo CNPJ e pela data do calendário
            const cleanExtractedCnpj = extractedData.cnpj.replace(/\D/g, '');
            
            const targetGuide = guides.find(g => {
                const sameDay = g.due_date?.split('T')[0] === dayKey;
                const clientCnpj = g.client?.cnpj.replace(/\D/g, '');
                return sameDay && clientCnpj === cleanExtractedCnpj;
            });

            if (targetGuide) {
                await updateGuide(targetGuide.id, {
                    file_url: publicUrl,
                    status: 'pending',
                    amount: parseFloat(extractedData.value),
                    competency: extractedData.referenceMonth
                });
                toast.success(`Guia anexada com sucesso em ${dayKey}`, { id: loadingToast });
            } else {
                // Tenta pelo nome da empresa como fallback
                const targetByName = guides.find(g => {
                    const sameDay = g.due_date?.split('T')[0] === dayKey;
                    const matchesName = g.client?.nome_fantasia.toLowerCase().includes(extractedData.companyName.toLowerCase()) || 
                                      g.client?.razao_social.toLowerCase().includes(extractedData.companyName.toLowerCase());
                    return sameDay && matchesName;
                });

                if (targetByName) {
                    await updateGuide(targetByName.id, {
                        file_url: publicUrl,
                        status: 'pending',
                        amount: parseFloat(extractedData.value),
                        competency: extractedData.referenceMonth
                    });
                    toast.success(`Guia anexada com sucesso em ${dayKey}`, { id: loadingToast });
                } else {
                    toast.error(`Não encontramos uma tarefa pendente para esta empresa no dia ${format(day, 'dd/MM')}`, { id: loadingToast });
                }
            }
        } catch (error: any) {
            console.error('Erro no drop do calendário:', error);
            toast.error(error.message || 'Erro ao processar guia', { id: loadingToast });
        } finally {
            setIsProcessingFile(false);
        }
    };

    const handleSendAllDay = async (day: Date) => {
        const dayKey = format(day, 'yyyy-MM-dd');
        const dayGuides = (guidesByDay[dayKey] || []).filter(g => g.file_url && g.status === 'pending');
        
        if (dayGuides.length === 0) {
            toast.error('Nenhuma guia pronta para envio neste dia.');
            return;
        }

        const loadingToast = toast.loading(`Enviando ${dayGuides.length} guias...`);
        try {
            for (const guide of dayGuides) {
                await updateGuide(guide.id, { status: 'sent', sent_at: new Date().toISOString() });
            }
            toast.success('Todas as guias do dia foram enviadas!', { id: loadingToast });
        } catch (error) {
            toast.error('Erro ao enviar guias em lote.', { id: loadingToast });
        }
    };

    const handleOpenClientModal = (guide: AccountingGuide) => {
        const client = clients.find(c => c.id === guide.client_id);
        if (client) {
            setSelectedClientForGuide(client);
            setIsGuidesModalOpen(true);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header / Command Center Info */}
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between pt-4">
                <div>
                    <h1 className="text-4xl font-extralight tracking-tight text-foreground">Centro de <span className="text-primary font-normal">Comando</span></h1>
                    <p className="text-[10px] font-normal text-muted-foreground uppercase tracking-[0.3em] mt-2 opacity-70">
                        Calendário Fiscal Dinâmico & Priorização
                    </p>
                </div>

                <div className="flex items-center gap-4 bg-card/50 p-2 rounded-2xl border border-border/10">
                    <Button variant="ghost" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex flex-col items-center min-w-[150px]">
                        <span className="text-lg font-light capitalize">{format(currentDate, 'MMMM', { locale: ptBR })}</span>
                        <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-primary/60 mt-0.5">{format(currentDate, 'yyyy')}</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
                        <ChevronRight className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            {/* Filters & AI Suggestion */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 bg-card/30 backdrop-blur-md rounded-[2.5rem] p-6 border border-border/40 flex flex-wrap items-center gap-8 shadow-sm">
                    <div className="flex flex-col gap-1.5 min-w-[180px]">
                        <label className="text-[8px] uppercase font-bold tracking-widest text-muted-foreground/60 flex items-center gap-2">
                           <Users className="h-3 w-3" /> Colaborador
                        </label>
                        <select 
                            className="bg-transparent text-xs font-light outline-none"
                            value={filterCollaborator}
                            onChange={(e) => setFilterCollaborator(e.target.value)}
                        >
                            <option value="all">Todos os Colaboradores</option>
                            {fiscalResponsibles.map(name => (
                                <option key={name} value={name}>{name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="w-px h-10 bg-border/40 hidden md:block" />

                    <div className="flex flex-col gap-1.5 min-w-[180px]">
                        <label className="text-[8px] uppercase font-bold tracking-widest text-muted-foreground/60 flex items-center gap-2">
                           <Building2 className="h-3 w-3" /> Regime Tributário
                        </label>
                        <select 
                            className="bg-transparent text-xs font-light outline-none"
                            value={filterRegime}
                            onChange={(e) => setFilterRegime(e.target.value)}
                        >
                            <option value="all">Todos os Regimes</option>
                            <option value="simples">Simples Nacional</option>
                            <option value="presumido">Lucro Presumido</option>
                            <option value="real">Lucro Real</option>
                        </select>
                    </div>

                    <div className="w-px h-10 bg-border/40 hidden md:block" />

                    <Button 
                        variant={showOnlyCritical ? "destructive" : "outline"}
                        className={cn(
                            "rounded-xl h-12 px-6 text-[10px] uppercase font-bold tracking-widest gap-2 transition-all",
                            showOnlyCritical ? "bg-red-500 text-white border-none shadow-lg shadow-red-500/20" : ""
                        )}
                        onClick={() => setShowOnlyCritical(!showOnlyCritical)}
                    >
                        <AlertCircle className="h-4 w-4" /> 
                        {showOnlyCritical ? "Mostrando Críticos" : "Apenas Críticos"}
                    </Button>
                </div>

                <div className="bg-primary/5 rounded-[2.5rem] p-6 border border-primary/20 flex items-center gap-4 relative overflow-hidden group">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover:scale-110 transition-transform">
                        <BrainCircuit className="h-6 w-6" />
                    </div>
                    <div className="relative z-10">
                        <p className="text-[9px] uppercase font-bold tracking-widest text-primary/60">Insight da IA Auditora</p>
                        <p className="text-[11px] font-medium text-foreground leading-relaxed mt-1">
                            O dia 20 concentra 45% do volume do mês. Sugerimos antecipar o processamento do Simples para o dia 15.
                        </p>
                    </div>
                    <div className="absolute top-0 right-0 p-2 opacity-10">
                        <Wand2 className="h-20 w-20" />
                    </div>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="bg-card/30 backdrop-blur-md rounded-[3rem] border border-border/40 overflow-hidden shadow-2xl">
                {/* Week Days Header */}
                <div className="grid grid-cols-7 border-b border-border/10 bg-muted/20">
                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                        <div key={day} className="py-4 text-center">
                            <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-muted-foreground/60">{day}</span>
                        </div>
                    ))}
                </div>

                {/* Grid */}
                <div className="grid grid-cols-7 h-[750px]">
                    {calendarDays.map((day, idx) => {
                        const isCurrentMonth = isSameMonth(day, monthStart);
                        const isTodayDay = isToday(day);
                        const dayKey = format(day, 'yyyy-MM-dd');
                        const hasGuides = guidesByDay[dayKey]?.length > 0;

                        return (
                            <div 
                                key={day.toString()} 
                                onClick={() => setSelectedDay(day)}
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    if (!isProcessingFile) setDragOverDay(dayKey);
                                }}
                                onDragLeave={() => setDragOverDay(null)}
                                onDrop={(e) => handleFileDrop(e, day)}
                                className={cn(
                                    "border-r border-b border-border/10 p-4 transition-all hover:bg-primary/[0.02] cursor-pointer relative flex flex-col gap-2 min-h-[140px]",
                                    !isCurrentMonth && "bg-transparent opacity-20",
                                    isTodayDay && "bg-primary/[0.03] ring-1 ring-inset ring-primary/20",
                                    dragOverDay === dayKey && "bg-primary/10 ring-2 ring-primary border-transparent z-10"
                                )}
                            >
                                <span className={cn(
                                    "text-sm font-light select-none",
                                    isTodayDay && "text-primary font-bold",
                                    !isCurrentMonth && "text-muted-foreground"
                                )}>
                                    {format(day, 'd')}
                                </span>
                                
                                <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                                    {getPillsForDay(day)}
                                </div>

                                {isTodayDay && (
                                    <div className="absolute top-4 right-4 h-1.5 w-1.5 rounded-full bg-primary animate-ping" />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Day Detail Side Panel */}
            <Sheet open={!!selectedDay} onOpenChange={() => setSelectedDay(null)}>
                <SheetContent className="sm:max-w-xl p-0 bg-card border-l border-border/40 overflow-hidden flex flex-col rounded-l-[3rem] no-print">
                    {selectedDay && (
                        <>
                            <div className="p-10 bg-muted/30 border-b border-border/10">
                                <SheetHeader>
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="h-14 w-14 rounded-2xl bg-primary flex flex-col items-center justify-center text-white shadow-xl shadow-primary/20">
                                            <span className="text-xl font-bold leading-none">{format(selectedDay, 'dd')}</span>
                                            <span className="text-[8px] uppercase font-bold opacity-60 mt-1">{format(selectedDay, 'MMM', { locale: ptBR })}</span>
                                        </div>
                                        <div>
                                            <SheetTitle className="text-2xl font-light">Tarefas do Dia</SheetTitle>
                                            <SheetDescription className="text-xs uppercase tracking-widest font-bold text-muted-foreground">
                                                {format(selectedDay, 'eeee', { locale: ptBR })}
                                            </SheetDescription>
                                        </div>
                                    </div>
                                </SheetHeader>
                            </div>

                            <ScrollArea className="flex-1 p-10">
                                <div className="space-y-10">
                                    {/* Summary Stats */}
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/10">
                                            <p className="text-[8px] uppercase font-bold text-red-600/60 mb-1">Pendentes</p>
                                            <p className="text-xl font-light text-red-600">{(guidesByDay[format(selectedDay, 'yyyy-MM-dd')] || []).filter(g => !g.file_url).length}</p>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10">
                                            <p className="text-[8px] uppercase font-bold text-amber-600/60 mb-1">Prontas</p>
                                            <p className="text-xl font-light text-amber-600">{(guidesByDay[format(selectedDay, 'yyyy-MM-dd')] || []).filter(g => g.file_url && g.status === 'pending').length}</p>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                                            <p className="text-[8px] uppercase font-bold text-emerald-600/60 mb-1">Enviadas</p>
                                            <p className="text-xl font-light text-emerald-600">{(guidesByDay[format(selectedDay, 'yyyy-MM-dd')] || []).filter(g => g.status === 'sent').length}</p>
                                        </div>
                                    </div>

                                    {/* Action List */}
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60 mb-2">Lista de Obrigações</h4>
                                        {(guidesByDay[format(selectedDay, 'yyyy-MM-dd')] || []).length === 0 ? (
                                            <p className="text-sm text-muted-foreground italic py-10 text-center">Nenhuma obrigação para este dia.</p>
                                        ) : (
                                            (guidesByDay[format(selectedDay, 'yyyy-MM-dd')] || []).map(guide => (
                                                <div key={guide.id} className="group p-5 rounded-[2rem] border border-border/40 bg-card hover:border-primary/40 transition-all flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className={cn(
                                                            "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                                                            guide.status === 'sent' ? "bg-emerald-500/10 text-emerald-600" : "bg-primary/5 text-primary"
                                                        )}>
                                                            {guide.status === 'sent' ? <CheckCircle2 className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium">{guide.client?.nome_fantasia || guide.client?.razao_social}</p>
                                                            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter mt-1">{guide.type} • Comp: {guide.competency}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {guide.file_url && (
                                                            <Button 
                                                                variant="ghost" 
                                                                size="icon" 
                                                                onClick={() => window.open(guide.file_url!, '_blank')}
                                                                className="h-10 w-10 rounded-xl hover:bg-primary/10 text-primary"
                                                                title="Ver Guia"
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            onClick={() => handleOpenClientModal(guide)}
                                                            className="h-10 w-10 rounded-xl hover:bg-primary/10 text-primary"
                                                            title="Gerenciar Envio"
                                                        >
                                                            <Mail className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </ScrollArea>

                             <div className="p-10 border-t border-border/10 bg-muted/20">
                                <Button 
                                    onClick={() => handleSendAllDay(selectedDay)}
                                    className="w-full h-14 rounded-2xl gap-3 text-[11px] uppercase font-bold tracking-widest shadow-xl shadow-primary/20 bg-primary text-white hover:bg-primary/90"
                                >
                                    <Send className="h-4 w-4" /> Enviar Todas Prontas deste Dia
                                </Button>
                            </div>

                            {selectedClientForGuide && (
                                <ClientGuidesModal
                                    open={isGuidesModalOpen}
                                    onOpenChange={setIsGuidesModalOpen}
                                    client={selectedClientForGuide}
                                    referenceMonth={referenceMonth}
                                    guides={guides.filter(g => g.client_id === selectedClientForGuide.id)}
                                    onUpdate={() => fetchGuides(referenceMonth)}
                                />
                            )}
                        </>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}
