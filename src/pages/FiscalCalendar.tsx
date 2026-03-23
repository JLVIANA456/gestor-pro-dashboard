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
    Sparkles,
    Columns,
    List,
    GripVertical,
    XCircle
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
    const { guides, loading, updateGuide, fetchGuides } = useDeliveryList(referenceMonth);
    
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);
    const [dragOverDay, setDragOverDay] = useState<string | null>(null);
    const [isProcessingFile, setIsProcessingFile] = useState(false);
    const [filterCollaborator, setFilterCollaborator] = useState('all');
    const [filterRegime, setFilterRegime] = useState('all');
    const [showOnlyCritical, setShowOnlyCritical] = useState(false);
    const [viewMode, setViewMode] = useState<'calendar' | 'kanban'>('calendar');

    const { clients } = useClients();

    const fiscalResponsibles = useMemo(() => {
        const names = clients
            .map(c => c.responsavelFiscal)
            .filter((name): name is string => !!name && name.trim() !== '');
        return Array.from(new Set(names)).sort();
    }, [clients]);

    const filteredGuides = useMemo(() => {
        return guides.filter(guide => {
            const client = clients.find(c => c.id === guide.client_id);
            if (filterCollaborator !== 'all' && client?.responsavelFiscal !== filterCollaborator) return false;
            if (filterRegime !== 'all' && client?.regimeTributario !== filterRegime) return false;
            if (showOnlyCritical) {
                const isCritical = !guide.file_url || (guide.file_url && guide.status === 'pending');
                if (!isCritical || guide.status === 'sent') return false;
            }
            return true;
        });
    }, [guides, clients, filterCollaborator, filterRegime, showOnlyCritical]);

    const kanbanColumns = useMemo(() => {
        return {
            todo: filteredGuides.filter(g => g.status === 'pending' && !g.file_url),
            ready: filteredGuides.filter(g => g.status === 'pending' && !!g.file_url),
            sent: filteredGuides.filter(g => g.status === 'sent')
        };
    }, [filteredGuides]);

    // Calendar Calculations
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });
    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

    const guidesByDay = useMemo(() => {
        const map: Record<string, AccountingGuide[]> = {};
        filteredGuides.forEach(g => {
            if (!g.due_date) return;
            const dayKey = g.due_date.split('T')[0];
            if (!map[dayKey]) map[dayKey] = [];
            map[dayKey].push(g);
        });
        return map;
    }, [filteredGuides]);

    const handleFileDrop = async (e: React.DragEvent, day: Date) => {
        e.preventDefault();
        const dayKey = format(day, 'yyyy-MM-dd');
        setDragOverDay(null);
        
        const files = Array.from(e.dataTransfer.files);
        if (files.length === 0) {
            // Check for internal kanban drag
            const guideId = e.dataTransfer.getData('guideId');
            if (guideId) {
                const guide = guides.find(g => g.id === guideId);
                // If it was a guide being dragged, update its status based on drop context (here it's a day, so we move to 'todo' on that day)
                await updateGuide(guideId, { due_date: dayKey + 'T00:00:00Z' });
                toast.success(`Guia movida para o dia ${format(day, 'dd/MM')}`);
                return;
            }
            return;
        }

        const file = files[0];
        if (file.type !== 'application/pdf') {
            toast.error('Apenas arquivos PDF são suportados');
            return;
        }

        setIsProcessingFile(true);
        const loadingToast = toast.loading(`Processando ${file.name}...`);
        try {
            const extractedData = await AiService.extractGuideData(file);
            const { publicUrl } = await AiService.uploadFile(file);
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
                toast.error(`Não encontramos uma tarefa pendente para esta empresa no dia ${format(day, 'dd/MM')}`, { id: loadingToast });
            }
        } catch (error: any) {
            toast.error(error.message || 'Erro ao processar guia', { id: loadingToast });
        } finally {
            setIsProcessingFile(false);
        }
    };

    const handleKanbanDrop = async (e: React.DragEvent, targetColumn: 'todo' | 'ready' | 'sent') => {
        const guideId = e.dataTransfer.getData('guideId');
        const guide = guides.find(g => g.id === guideId);
        if (!guide) return;

        if (targetColumn === 'sent') {
            if (!guide.file_url) return toast.error("Anexe o arquivo primeiro.");
            await updateGuide(guideId, { status: 'sent', sent_at: new Date().toISOString() });
            toast.success("Enviado com sucesso");
        } else if (targetColumn === 'ready') {
            await updateGuide(guideId, { status: 'pending' });
            toast.info("Marcado como Pronto");
        } else if (targetColumn === 'todo') {
            await updateGuide(guideId, { status: 'pending' });
            toast.info("Marcado como Pendente");
        }
    };

    const handleSendAllDay = async (day: Date) => {
        const dayKey = format(day, 'yyyy-MM-dd');
        const dayGuides = (guidesByDay[dayKey] || []).filter(g => g.file_url && g.status === 'pending');
        if (dayGuides.length === 0) return toast.error('Nenhuma guia pronta.');
        
        const loadingToast = toast.loading(`Enviando...`);
        try {
            for (const guide of dayGuides) {
                await updateGuide(guide.id, { status: 'sent', sent_at: new Date().toISOString() });
            }
            toast.success('Enviadas!', { id: loadingToast });
        } catch (error) {
            toast.error('Erro no envio.', { id: loadingToast });
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-10">
            {/* Header / Command Center Info */}
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between pt-4">
                <div>
                    <h1 className="text-4xl font-extralight tracking-tight text-foreground">Centro de <span className="text-primary font-normal">Comando</span></h1>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] mt-2 opacity-70">
                        {viewMode === 'calendar' ? 'Calendário Fiscal Dinâmico' : 'Gestão Visual por Colunas'}
                    </p>
                </div>

                <div className="flex items-center gap-4">
                     {/* View Switcher */}
                     <div className="bg-muted/10 p-1 rounded-2xl border border-border/10 flex gap-1">
                        <Button 
                            variant={viewMode === 'calendar' ? 'secondary' : 'ghost'} 
                            size="sm" 
                            onClick={() => setViewMode('calendar')}
                            className="rounded-xl h-10 px-4 text-[10px] uppercase font-bold tracking-widest gap-2"
                        >
                            <CalendarIcon className="h-4 w-4" /> Calendário
                        </Button>
                        <Button 
                            variant={viewMode === 'kanban' ? 'secondary' : 'ghost'} 
                            size="sm" 
                            onClick={() => setViewMode('kanban')}
                            className="rounded-xl h-10 px-4 text-[10px] uppercase font-bold tracking-widest gap-2"
                        >
                            <Columns className="h-4 w-4" /> Kanban
                        </Button>
                    </div>

                    <div className="flex items-center gap-4 bg-white/40 backdrop-blur-md p-2 rounded-2xl border border-border/10 shadow-sm">
                        <Button variant="ghost" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <div className="flex flex-col items-center min-w-[150px]">
                            <span className="text-lg font-bold capitalize">{format(currentDate, 'MMMM', { locale: ptBR })}</span>
                            <span className="text-[9px] uppercase font-black tracking-[0.2em] text-primary/40 mt-0.5">{format(currentDate, 'yyyy')}</span>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
                            <ChevronRight className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Filters Area */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 bg-card/30 backdrop-blur-md rounded-[2.5rem] p-6 border border-border/40 flex flex-wrap items-center gap-8 shadow-sm">
                    <div className="flex flex-col gap-1.5 min-w-[180px]">
                        <label className="text-[8px] uppercase font-black tracking-widest text-muted-foreground/40 flex items-center gap-2">
                           <Users className="h-3 w-3" /> Colaborador
                        </label>
                        <select className="bg-transparent text-xs font-light outline-none" value={filterCollaborator} onChange={(e) => setFilterCollaborator(e.target.value)}>
                            <option value="all">Todos</option>
                            {fiscalResponsibles.map(name => <option key={name} value={name}>{name}</option>)}
                        </select>
                    </div>
                    <div className="flex flex-col gap-1.5 min-w-[180px]">
                        <label className="text-[8px] uppercase font-black tracking-widest text-muted-foreground/40 flex items-center gap-2">
                           <Building2 className="h-3 w-3" /> Regime
                        </label>
                        <select className="bg-transparent text-xs font-light outline-none" value={filterRegime} onChange={(e) => setFilterRegime(e.target.value)}>
                            <option value="all">Todos</option>
                            <option value="simples">Simples Nacional</option>
                            <option value="presumido">Lucro Presumido</option>
                            <option value="real">Lucro Real</option>
                        </select>
                    </div>
                    <Button 
                        variant={showOnlyCritical ? "destructive" : "outline"}
                        className={cn("rounded-xl h-12 px-6 text-[10px] uppercase font-black tracking-widest gap-2", showOnlyCritical && "bg-red-500 text-white shadow-lg")}
                        onClick={() => setShowOnlyCritical(!showOnlyCritical)}
                    >
                        <AlertCircle className="h-4 w-4" /> {showOnlyCritical ? "Críticos" : "Apenas Críticos"}
                    </Button>
                </div>

                <div className="bg-primary/5 rounded-[2.5rem] p-6 border border-primary/20 flex items-center gap-4 relative overflow-hidden group">
                    <BrainCircuit className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
                    <div className="relative z-10">
                        <p className="text-[9px] uppercase font-black tracking-widest text-primary/40">Insight Predictor</p>
                        <p className="text-[11px] font-medium leading-relaxed mt-1">O dia 20 concentra 45% do volume do mês. Sugerimos priorizar agora.</p>
                    </div>
                </div>
            </div>

            {viewMode === 'calendar' ? (
                /* Calendar Grid */
                <div className="bg-card/30 backdrop-blur-md rounded-[3rem] border border-border/40 overflow-hidden shadow-2xl">
                    <div className="grid grid-cols-7 border-b border-border/10 bg-muted/20">
                        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                            <div key={day} className="py-4 text-center">
                                <span className="text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground/30">{day}</span>
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 min-h-[700px]">
                        {calendarDays.map((day) => {
                            const isCurrentMonth = isSameMonth(day, monthStart);
                            const dayKey = format(day, 'yyyy-MM-dd');
                            return (
                                <div 
                                    key={day.toString()} 
                                    onClick={() => setSelectedDay(day)}
                                    onDragOver={(e) => { e.preventDefault(); setDragOverDay(dayKey); }}
                                    onDragLeave={() => setDragOverDay(null)}
                                    onDrop={(e) => handleFileDrop(e, day)}
                                    className={cn(
                                        "border-r border-b border-border/5 p-4 transition-all hover:bg-primary/[0.02] cursor-pointer relative flex flex-col gap-2 min-h-[140px]",
                                        !isCurrentMonth && "opacity-10 pointer-events-none",
                                        isToday(day) && "bg-primary/[0.03] ring-1 ring-inset ring-primary/10",
                                        dragOverDay === dayKey && "bg-primary/10 ring-2 ring-primary border-transparent z-10"
                                    )}
                                >
                                    <span className={cn("text-xs font-bold", isToday(day) ? "text-primary" : "text-muted-foreground/50")}>{format(day, 'd')}</span>
                                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">{getPillsForDay(day, guidesByDay)}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                /* Kanban View */
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 min-h-[600px]">
                    <KanbanColumn title="A Fazer" color="bg-red-400" count={kanbanColumns.todo.length} guides={kanbanColumns.todo} onDrop={(e) => handleKanbanDrop(e, 'todo')} onDragStart={(e, id) => e.dataTransfer.setData('guideId', id)} onTaskClick={(g) => {setSelectedDay(parseISO(g.due_date!))}} />
                    <KanbanColumn title="Pronto para Enviar" color="bg-amber-400" count={kanbanColumns.ready.length} guides={kanbanColumns.ready} onDrop={(e) => handleKanbanDrop(e, 'ready')} onDragStart={(e, id) => e.dataTransfer.setData('guideId', id)} onTaskClick={(g) => {setSelectedDay(parseISO(g.due_date!))}} />
                    <KanbanColumn title="Enviado" color="bg-emerald-400" count={kanbanColumns.sent.length} guides={kanbanColumns.sent} onDrop={(e) => handleKanbanDrop(e, 'sent')} onDragStart={(e, id) => e.dataTransfer.setData('guideId', id)} onTaskClick={(g) => {setSelectedDay(parseISO(g.due_date!))}} />
                </div>
            )}

            {/* Day Detail Sheet */}
            <Sheet open={!!selectedDay} onOpenChange={() => setSelectedDay(null)}>
                <SheetContent className="sm:max-w-xl p-0 bg-card border-l border-border/40 overflow-hidden flex flex-col rounded-l-[3rem] no-print">
                    {selectedDay && (
                        <DayDetailContent 
                            day={selectedDay} 
                            guides={guidesByDay[format(selectedDay, 'yyyy-MM-dd')] || []} 
                            onSendAll={() => handleSendAllDay(selectedDay)}
                            onOpenModal={(g) => {
                                const client = clients.find(c => c.id === g.client_id);
                                if (client) { setSelectedClientForGuide(client); setIsGuidesModalOpen(true); }
                            }}
                        />
                    )}
                </SheetContent>
            </Sheet>

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
        </div>
    );
}

function getPillsForDay(day: Date, guidesByDay: any) {
    const dayKey = format(day, 'yyyy-MM-dd');
    const dayGuides = guidesByDay[dayKey] || [];
    if (dayGuides.length === 0) return null;

    const groupedByType = dayGuides.reduce((acc: any, g: any) => {
        if (!acc[g.type]) acc[g.type] = [];
        acc[g.type].push(g);
        return acc;
    }, {});

    return (
        <div className="space-y-1">
            {Object.entries(groupedByType).map(([type, items]: [string, any]) => {
                const hasMissingFile = items.some((i: any) => !i.file_url && i.status !== 'sent');
                const isAllSent = items.every((i: any) => i.status === 'sent');
                let bgColor = isAllSent ? "bg-emerald-500/10 text-emerald-600" : (hasMissingFile ? "bg-red-500/10 text-red-600" : "bg-amber-500/10 text-amber-600");
                return (
                    <div key={type} className={cn("px-2 py-0.5 rounded border border-transparent text-[8px] font-bold uppercase truncate", bgColor)}>
                        {items.length} {type}
                    </div>
                );
            })}
        </div>
    );
}

function KanbanColumn({ title, color, count, guides, onDrop, onDragStart, onTaskClick }: any) {
    return (
        <div onDragOver={(e) => e.preventDefault()} onDrop={onDrop} className="flex flex-col gap-4">
            <div className="flex items-center justify-between px-6 py-1">
                <div className="flex items-center gap-3">
                    <div className={cn("h-3 w-3 rounded-full", color)} />
                    <h3 className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/50">{title}</h3>
                </div>
                <Badge variant="outline" className="rounded-full h-6 px-3 border-border/10 bg-transparent opacity-60">{count}</Badge>
            </div>
            <ScrollArea className="flex-1 h-[700px] pr-2">
                <div className="space-y-4 pb-10">
                    {guides.map((g: any) => (
                        <Card key={g.id} draggable onDragStart={(e) => onDragStart(e, g.id)} onClick={() => onTaskClick(g)} className="border-border/10 bg-white/40 backdrop-blur-md rounded-[1.8rem] p-5 shadow-sm cursor-grab active:cursor-grabbing hover:scale-[1.02] transition-all">
                            <div className="flex justify-between items-start gap-2">
                                <span className="text-xs font-bold leading-tight">{g.client?.nome_fantasia || g.client?.razao_social}</span>
                                <GripVertical className="h-4 w-4 text-muted-foreground/20" />
                            </div>
                            <div className="flex gap-2 mt-3">
                                <Badge variant="outline" className="bg-primary/5 text-primary border-none text-[8px] font-bold uppercase">{g.type}</Badge>
                                <Badge variant="outline" className="text-[8px] opacity-40 border-none">{format(parseISO(g.due_date!), 'dd/MM')}</Badge>
                            </div>
                        </Card>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}

function DayDetailContent({ day, guides, onSendAll, onOpenModal }: any) {
    return (
        <>
            <div className="p-10 bg-muted/20 border-b border-border/10">
                <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-3xl bg-primary flex flex-col items-center justify-center text-white shadow-xl">
                        <span className="text-xl font-black">{format(day, 'dd')}</span>
                        <span className="text-[8px] uppercase font-bold opacity-60">{format(day, 'MMM', { locale: ptBR })}</span>
                    </div>
                    <div>
                        <SheetTitle className="text-2xl font-light">Tarefa do Dia</SheetTitle>
                        <SheetDescription className="text-xs uppercase font-bold text-muted-foreground/40 tracking-widest">{format(day, 'eeee', { locale: ptBR })}</SheetDescription>
                    </div>
                </div>
            </div>
            <ScrollArea className="flex-1 p-8">
                <div className="space-y-4">
                    {guides.map((g: any) => (
                        <div key={g.id} className="p-5 rounded-[2rem] border border-border/40 bg-card/40 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", g.status === 'sent' ? "bg-emerald-500/10 text-emerald-600" : "bg-primary/10 text-primary")}>
                                    {g.status === 'sent' ? <CheckCircle2 className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-foreground/80">{g.client?.nome_fantasia || g.client?.razao_social}</span>
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground/30 tracking-tight">{g.type}</span>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => onOpenModal(g)} className="h-10 w-10 rounded-xl hover:bg-primary/10 text-primary"><Mail className="h-4 w-4" /></Button>
                        </div>
                    ))}
                </div>
            </ScrollArea>
            <div className="p-10 border-t border-border/10 bg-muted/20">
                <Button onClick={onSendAll} className="w-full h-14 rounded-2xl gap-3 text-[11px] font-black uppercase tracking-widest shadow-xl shadow-primary/20"><Send className="h-4 w-4" /> Enviar Tudo deste Dia</Button>
            </div>
        </>
    );
}
