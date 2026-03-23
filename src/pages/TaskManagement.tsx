import { useState, useMemo, useEffect } from 'react';
import { 
    Search, 
    Filter, 
    Calendar as CalendarIcon, 
    Eye, 
    Download, 
    MailCheck, 
    Clock, 
    History,
    CheckCircle2,
    SearchX,
    Building2,
    ArrowUpDown,
    ExternalLink,
    ShieldCheck,
    MousePointer2,
    RotateCcw,
    XCircle,
    RefreshCw,
    Loader2,
    Columns,
    List,
    GripVertical,
    Send,
    UserCircle2
} from 'lucide-react';
import { format, parseISO, startOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table";
import { useDeliveryList, AccountingGuide } from '@/hooks/useDeliveryList';
import { useClients } from '@/hooks/useClients';
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useBranding } from '@/context/BrandingContext';
import { TaskGeneratorService } from '@/services/taskGeneratorService';
import { 
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { toast } from 'sonner';

export default function TaskManagement() {
    const { officeName } = useBranding();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterType, setFilterType] = useState('all');
    const [competencyFilter, setCompetencyFilter] = useState('all');
    const [clientFilter, setClientFilter] = useState('all');
    const [selectedMonth, setSelectedMonth] = useState(() => format(new Date(), 'yyyy-MM'));
    const [selectedTask, setSelectedTask] = useState<AccountingGuide | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');

    const { clients } = useClients();

    // Fetch guides for the selected month
    const { guides, loading, fetchGuides, updateGuide } = useDeliveryList(selectedMonth || undefined);

    // Available months for reference filtering
    const availableMonths = useMemo(() => {
        const months = [];
        const today = startOfMonth(new Date());
        for (let i = 0; i < 13; i++) {
            const date = subMonths(today, i);
            months.push({
                value: format(date, 'yyyy-MM'),
                label: format(date, 'MMMM / yyyy', { locale: ptBR })
            });
        }
        return months;
    }, []);

    // Unique types for filter
    const obligationTypes = useMemo(() => {
        const types = guides.map(g => g.type);
        return Array.from(new Set(types)).sort();
    }, [guides]);

    // Unique competencies for filter
    const competencyTypes = useMemo(() => {
        const competencies = guides.map(g => g.competency).filter(Boolean) as string[];
        return Array.from(new Set(competencies)).sort((a, b) => {
            const [mA, yA] = a.split('/').map(Number);
            const [mB, yB] = b.split('/').map(Number);
            const dateA = new Date(yA || 0, (mA || 1) - 1);
            const dateB = new Date(yB || 0, (mB || 1) - 1);
            return dateB.getTime() - dateA.getTime();
        });
    }, [guides]);

    // Filtering logic
    const filteredGuides = useMemo(() => {
        return guides.filter(guide => {
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch = 
                !searchTerm ||
                guide.client?.nome_fantasia.toLowerCase().includes(searchLower) ||
                guide.client?.razao_social.toLowerCase().includes(searchLower) ||
                guide.client?.cnpj.includes(searchTerm) ||
                guide.type.toLowerCase().includes(searchLower) ||
                guide.competency?.toLowerCase().includes(searchLower);
            
            const matchesStatus = filterStatus === 'all' || guide.status === filterStatus;
            const matchesType = filterType === 'all' || guide.type === filterType;
            const matchesCompetency = competencyFilter === 'all' || guide.competency === competencyFilter;
            const matchesClient = clientFilter === 'all' || guide.client_id === clientFilter;

            return matchesSearch && matchesStatus && matchesType && matchesCompetency && matchesClient;
        });
    }, [guides, searchTerm, filterStatus, filterType, competencyFilter, clientFilter]);

    const kanbanColumns = useMemo(() => {
        return {
            todo: filteredGuides.filter(g => g.status === 'pending' && !g.file_url),
            ready: filteredGuides.filter(g => g.status === 'pending' && !!g.file_url),
            sent: filteredGuides.filter(g => g.status === 'sent')
        };
    }, [filteredGuides]);

    const resetFilters = () => {
        setSearchTerm('');
        setFilterStatus('all');
        setFilterType('all');
        setCompetencyFilter('all');
        setClientFilter('all');
        toast.info("Filtros limpos");
    };

    const handleSync = async () => {
        if (!selectedMonth) return;
        setIsSyncing(true);
        const toastId = toast.loading("Sincronizando tarefas...");
        try {
            const results = await TaskGeneratorService.syncTasksForMonth(selectedMonth);
            toast.success(`Sincronização concluída! ${results.created} criadas, ${results.deleted} removidas.`, { id: toastId });
            fetchGuides(selectedMonth);
        } catch (error) {
            console.error(error);
            toast.error("Erro ao sincronizar tarefas.", { id: toastId });
        } finally {
            setIsSyncing(false);
        }
    };

    const handleDragStart = (e: React.DragEvent, guideId: string) => {
        e.dataTransfer.setData('guideId', guideId);
    };

    const handleDrop = async (e: React.DragEvent, targetColumn: 'todo' | 'ready' | 'sent') => {
        const guideId = e.dataTransfer.getData('guideId');
        const guide = guides.find(g => g.id === guideId);
        
        if (!guide) return;

        // Logic for state transition
        if (targetColumn === 'sent') {
            if (!guide.file_url) {
                toast.error("Não é possível marcar como enviado sem anexo.");
                return;
            }
            await updateGuide(guideId, { status: 'sent', sent_at: new Date().toISOString() });
            toast.success("Tarefa movida para Enviados");
        } else if (targetColumn === 'ready') {
            await updateGuide(guideId, { status: 'pending' });
            toast.info("Tarefa movida para Pronto para Enviar");
        } else if (targetColumn === 'todo') {
            await updateGuide(guideId, { status: 'pending' }); // Note: todo and ready both use 'pending', but differ by file_url presence
            toast.info("Tarefa movida para A Fazer");
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'sent':
                return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20 gap-1.5 rounded-lg px-2 text-xs font-semibold uppercase"><CheckCircle2 className="h-3 w-3" /> Enviado</Badge>;
            case 'pending':
                return <Badge variant="outline" className="text-amber-600 border-amber-500/20 bg-amber-500/5 gap-1.5 rounded-lg px-2 text-xs font-semibold uppercase"><Clock className="h-3 w-3" /> Pendente</Badge>;
            case 'scheduled':
                return <Badge variant="outline" className="text-blue-600 border-blue-500/20 bg-blue-500/5 gap-1.5 rounded-lg px-2 text-xs font-semibold uppercase"><CalendarIcon className="h-3 w-3" /> Agendado</Badge>;
            case 'expired':
                return <Badge variant="outline" className="text-red-600 border-red-500/20 bg-red-500/5 gap-1.5 rounded-lg px-2 text-xs font-semibold uppercase"><XCircle className="h-3 w-3" /> Expirado</Badge>;
            default:
                return <Badge variant="outline" className="text-xs font-semibold uppercase rounded-lg px-2">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-10">
            {/* Header */}
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between pt-4">
                <div>
                    <h1 className="text-4xl font-light tracking-tight text-foreground">Gestão de <span className="text-primary font-medium">Tarefas</span></h1>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.2em] mt-2">
                        {officeName} • Auditoria & Visão Kanban
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    {/* View Switcher */}
                    <div className="bg-muted/10 p-1 rounded-2xl border border-border/10 flex gap-1">
                        <Button 
                            variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
                            size="sm" 
                            onClick={() => setViewMode('list')}
                            className="rounded-xl h-10 px-4 text-[10px] uppercase font-light tracking-widest gap-2"
                        >
                            <List className="h-4 w-4" /> Lista
                        </Button>
                        <Button 
                            variant={viewMode === 'kanban' ? 'secondary' : 'ghost'} 
                            size="sm" 
                            onClick={() => setViewMode('kanban')}
                            className="rounded-xl h-10 px-4 text-[10px] uppercase font-light tracking-widest gap-2"
                        >
                            <Columns className="h-4 w-4" /> Kanban
                        </Button>
                    </div>

                    <Button
                        onClick={handleSync}
                        disabled={isSyncing || !selectedMonth}
                        variant="outline"
                        className="h-12 rounded-2xl px-6 gap-2 border-primary/20 hover:bg-primary/5 text-primary transition-all active:scale-95"
                    >
                        {isSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                        Sincronizar
                    </Button>

                    <div className="flex items-center gap-4 bg-white/60 backdrop-blur-md p-2 rounded-2xl border border-border/20 shadow-sm">
                        <div className="flex flex-col items-end px-4">
                            <span className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground mb-1">Mês de Referência (Trabalho)</span>
                            <select 
                                className="bg-transparent text-sm font-normal outline-none text-right cursor-pointer text-foreground appearance-none"
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                            >
                                <option value="">Todos os Meses</option>
                                {availableMonths.map(m => (
                                    <option key={m.value} value={m.value}>{m.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <CalendarIcon className="h-5 w-5" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters Area */}
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
                <div className="xl:col-span-4 bg-card/30 backdrop-blur-md rounded-[2.5rem] p-6 border border-border/40 flex flex-wrap items-center gap-6 shadow-sm">
                    <div className="flex-1 min-w-[200px] relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                        <Input 
                            placeholder="Buscar cliente ou obrigação..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-12 rounded-xl border-border/20 bg-muted/20 pl-11 font-light text-xs focus-visible:ring-primary/20"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5 min-w-[140px]">
                        <label className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground flex items-center gap-2">
                           <CalendarIcon className="h-3.5 w-3.5" /> Competência
                        </label>
                        <select 
                            className="bg-transparent text-sm font-normal outline-none cursor-pointer"
                            value={competencyFilter}
                            onChange={(e) => setCompetencyFilter(e.target.value)}
                        >
                            <option value="all">Todas</option>
                            {competencyTypes.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-1.5 min-w-[140px]">
                        <label className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground flex items-center gap-2">
                           <Building2 className="h-3.5 w-3.5" /> Obrigação
                        </label>
                        <select 
                            className="bg-transparent text-sm font-normal outline-none cursor-pointer"
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                        >
                            <option value="all">Todos</option>
                            {obligationTypes.map(t => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-1.5 min-w-[200px]">
                        <label className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground flex items-center gap-2">
                           <Building2 className="h-3.5 w-3.5" /> Empresa / Cliente
                        </label>
                        <select 
                            className="bg-transparent text-sm font-normal outline-none cursor-pointer max-w-[250px] truncate"
                            value={clientFilter}
                            onChange={(e) => setClientFilter(e.target.value)}
                        >
                            <option value="all">Todas as Empresas</option>
                            {clients.sort((a,b) => (a.nomeFantasia || a.razaoSocial).localeCompare(b.nomeFantasia || b.razaoSocial)).map(client => (
                                <option key={client.id} value={client.id}>
                                    {client.nomeFantasia || client.razaoSocial}
                                </option>
                            ))}
                        </select>
                    </div>

                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={resetFilters}
                        className="h-10 w-10 rounded-xl text-muted-foreground hover:text-primary transition-colors"
                    >
                        <RotateCcw className="h-4 w-4" />
                    </Button>
                </div>

                <div className="bg-primary/5 rounded-[2.5rem] p-6 border border-primary/20 flex items-center justify-around shadow-inner">
                    <div className="text-center">
                        <p className="text-[24px] font-light text-primary tracking-tighter">{filteredGuides.filter(g => g.status === 'sent').length}</p>
                        <p className="text-[8px] uppercase font-light tracking-widest text-primary/40">Fizeram Check</p>
                    </div>
                    <div className="w-px h-10 bg-primary/10" />
                    <div className="text-center">
                        <p className="text-[24px] font-light text-amber-600 tracking-tighter">{filteredGuides.filter(g => g.status === 'pending').length}</p>
                        <p className="text-[8px] uppercase font-light tracking-widest text-amber-600/40">Em Aberto</p>
                    </div>
                </div>
            </div>

            {/* List View */}
            {viewMode === 'list' ? (
                <Card className="rounded-[2.5rem] border-border/40 bg-white/40 backdrop-blur-md overflow-hidden shadow-2xl">
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-muted/30">
                                <TableRow className="hover:bg-transparent border-border/10">
                                    <TableHead className="py-6 px-10 text-xs font-bold uppercase tracking-wider text-muted-foreground w-[25%]">Cliente</TableHead>
                                    <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Obrigação</TableHead>
                                    <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground text-center w-[120px]">Competência</TableHead>
                                    <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground w-[120px]">Status</TableHead>
                                    <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground w-[220px]">Dados de Envio</TableHead>
                                    <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground text-right px-10">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="py-32 text-center text-muted-foreground/40 font-light italic">Sincronizando dados...</TableCell>
                                    </TableRow>
                                ) : filteredGuides.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="py-32 text-center text-muted-foreground/40 font-light italic">Nenhuma tarefa encontrada.</TableCell>
                                    </TableRow>
                                ) : (
                                    filteredGuides.map((guide) => (
                                        <TableRow key={guide.id} className="group hover:bg-primary/[0.02] border-border/10 transition-all duration-300">
                                            <TableCell className="py-6 px-10">
                                                <div className="flex flex-col">
                                                    <span className="text-base font-medium text-foreground tracking-tight">{guide.client?.nome_fantasia || guide.client?.razao_social}</span>
                                                    <span className="text-xs font-normal text-muted-foreground tracking-wider mt-1 uppercase">{guide.client?.cnpj}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="h-9 w-9 rounded-lg bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
                                                        <Building2 className="h-5 w-5" />
                                                    </div>
                                                    <span className="text-sm font-medium text-foreground/80">{guide.type}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="outline" className="bg-muted/30 text-muted-foreground border-none rounded-md font-mono text-xs px-3 py-1 font-semibold">
                                                    {guide.competency || '--'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {getStatusBadge(guide.status)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1.5">
                                                    {guide.status === 'sent' && guide.sent_at ? (
                                                        <>
                                                            <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs truncate max-w-[200px]" title={guide.client?.email}>
                                                                <MailCheck className="h-3.5 w-3.5 shrink-0" />
                                                                <span className="truncate">{guide.client?.email || 'Email não disponível'}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase font-bold tracking-tight">
                                                                <span className="shrink-0">{format(parseISO(guide.sent_at), 'dd/MM/yyyy • HH:mm', { locale: ptBR })}</span>
                                                                {guide.sender_ip && (
                                                                    <span className="flex items-center gap-1 border-l pl-2 border-border/10 truncate">
                                                                        IP: {guide.sender_ip}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground/50 italic font-medium">Aguardando envio...</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right px-10">
                                                <div className="flex items-center justify-end gap-1 opacity-20 group-hover:opacity-100 transition-opacity">
                                                    {guide.file_url && (
                                                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-primary/10 text-primary" onClick={() => window.open(guide.file_url!, '_blank')}><Eye className="h-4 w-4" /></Button>
                                                    )}
                                                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-primary/10 text-primary" onClick={() => setSelectedTask(guide)}><History className="h-4 w-4" /></Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            ) : (
                /* Kanban View */
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 min-h-[600px]">
                    {/* TO DO COLUMN */}
                    <div 
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleDrop(e, 'todo')}
                        className="flex flex-col gap-5"
                    >
                        <div className="flex items-center justify-between px-6 py-2">
                            <div className="flex items-center gap-3">
                                <div className="h-3 w-3 rounded-full bg-red-400" />
                                <h3 className="text-[11px] uppercase font-light tracking-[0.2em] text-muted-foreground/60">A Fazer</h3>
                            </div>
                            <Badge variant="outline" className="bg-red-400/5 text-red-500 border-red-400/20 rounded-full h-6 px-3">{kanbanColumns.todo.length}</Badge>
                        </div>

                        <ScrollArea className="flex-1 h-[700px] pr-2">
                            <div className="space-y-4 pb-10">
                                {kanbanColumns.todo.map(guide => (
                                    <KanbanCard key={guide.id} guide={guide} onDragStart={handleDragStart} onClick={() => setSelectedTask(guide)} />
                                ))}
                            </div>
                        </ScrollArea>
                    </div>

                    {/* READY COLUMN */}
                    <div 
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleDrop(e, 'ready')}
                        className="flex flex-col gap-5"
                    >
                        <div className="flex items-center justify-between px-6 py-2">
                            <div className="flex items-center gap-3">
                                <div className="h-3 w-3 rounded-full bg-amber-400" />
                                <h3 className="text-[11px] uppercase font-light tracking-[0.2em] text-muted-foreground/60">Pronto para Enviar</h3>
                            </div>
                            <Badge variant="outline" className="bg-amber-400/5 text-amber-500 border-amber-400/20 rounded-full h-6 px-3">{kanbanColumns.ready.length}</Badge>
                        </div>

                        <ScrollArea className="flex-1 h-[700px] pr-2">
                            <div className="space-y-4 pb-10">
                                {kanbanColumns.ready.map(guide => (
                                    <KanbanCard key={guide.id} guide={guide} onDragStart={handleDragStart} onClick={() => setSelectedTask(guide)} />
                                ))}
                            </div>
                        </ScrollArea>
                    </div>

                    {/* SENT COLUMN */}
                    <div 
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleDrop(e, 'sent')}
                        className="flex flex-col gap-5"
                    >
                        <div className="flex items-center justify-between px-6 py-2">
                            <div className="flex items-center gap-3">
                                <div className="h-3 w-3 rounded-full bg-emerald-400" />
                                <h3 className="text-[11px] uppercase font-light tracking-[0.2em] text-muted-foreground/60">Enviado</h3>
                            </div>
                            <Badge variant="outline" className="bg-emerald-400/5 text-emerald-500 border-emerald-400/20 rounded-full h-6 px-3">{kanbanColumns.sent.length}</Badge>
                        </div>

                        <ScrollArea className="flex-1 h-[700px] pr-2">
                            <div className="space-y-4 pb-10">
                                {kanbanColumns.sent.map(guide => (
                                    <KanbanCard key={guide.id} guide={guide} onDragStart={handleDragStart} onClick={() => setSelectedTask(guide)} />
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                </div>
            )}

            {/* Audit Log Sheet */}
            <Sheet open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
                <SheetContent className="sm:max-w-xl p-0 bg-card border-l border-border/40 overflow-hidden flex flex-col rounded-l-[3rem] shadow-2xl">
                    {selectedTask && (
                        <>
                            <div className="p-10 bg-muted/20 border-b border-border/10">
                                <SheetHeader>
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-lg shadow-primary/5 ring-1 ring-primary/20">
                                            <ShieldCheck className="h-7 w-7" />
                                        </div>
                                        <div>
                                            <SheetTitle className="text-2xl font-medium">Auditoria de <span className="text-primary font-bold">Tarefa</span></SheetTitle>
                                            <SheetDescription className="text-xs uppercase tracking-widest font-semibold text-muted-foreground">
                                                Rastreamento Completo • ID: {selectedTask.id.substring(0, 8)}
                                            </SheetDescription>
                                        </div>
                                    </div>
                                </SheetHeader>
                            </div>

                            <ScrollArea className="flex-1 p-10">
                                <div className="space-y-12">
                                    <div className="grid grid-cols-1 gap-6">
                                        <Card className="rounded-[2rem] border-border/10 bg-muted/10 overflow-hidden shadow-sm">
                                            <CardContent className="p-8 space-y-8">
                                                <div>
                                                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-2">Empresa Atendida</p>
                                                    <p className="text-xl font-medium leading-snug text-foreground">{selectedTask.client?.razao_social}</p>
                                                    <p className="text-sm font-mono text-muted-foreground mt-1">{selectedTask.client?.cnpj}</p>
                                                </div>
                                                <div className="grid grid-cols-2 gap-8 pt-8 border-t border-border/10 text-center">
                                                    <div>
                                                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-2">Obrigação / Guia</p>
                                                        <Badge className="bg-primary/10 text-primary border-none text-xs font-bold uppercase rounded-md">{selectedTask.type}</Badge>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-2">Período de Competência</p>
                                                        <p className="text-sm font-semibold text-foreground">{selectedTask.competency || '--'}</p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    <div className="space-y-8">
                                        <h4 className="text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground/30 flex items-center gap-2">
                                            <History className="h-4 w-4 opacity-50" /> Linha do Tempo Auditada
                                        </h4>
                                        <div className="relative space-y-10 pl-8 border-l border-border/10 ml-2">
                                            <div className="relative">
                                                <div className="absolute -left-[41px] top-0 h-6 w-6 rounded-full bg-card border-[3px] border-border/20 shadow-sm flex items-center justify-center">
                                                    <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                                                </div>
                                                <div>
                                                    <p className="text-[12px] font-light text-foreground">Tarefa Criada no Sistema</p>
                                                    <p className="text-[10px] text-muted-foreground/70 mt-1">{format(parseISO(selectedTask.created_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}</p>
                                                </div>
                                            </div>
                                            {selectedTask.sent_at && (
                                                <div className="relative">
                                                    <div className="absolute -left-[41px] top-0 h-6 w-6 rounded-full bg-emerald-500 border-[3px] border-card shadow-sm flex items-center justify-center">
                                                        <MailCheck className="h-3 w-3 text-white" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[12px] font-light text-foreground">E-mail Despachado</p>
                                                        <p className="text-[10px] text-muted-foreground/70 mt-1">{format(parseISO(selectedTask.sent_at), "dd/MM/yyyy 'às' HH:mm:ss")}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </ScrollArea>

                            <div className="p-10 border-t border-border/10 bg-muted/20 flex gap-4">
                                {selectedTask.file_url && (
                                    <Button variant="outline" className="flex-1 h-14 rounded-2xl gap-3 text-[10px] font-light uppercase border-border/50" onClick={() => window.open(selectedTask.file_url!, '_blank')}><Eye className="h-4 w-4" /> Ver PDF</Button>
                                )}
                                <Button className="flex-1 h-14 rounded-2xl gap-3 text-[10px] font-light uppercase shadow-xl shadow-primary/20" onClick={() => toast.success("Exportando relatório...")}><Download className="h-4 w-4" /> Protocolo PDF</Button>
                            </div>
                        </>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}

function KanbanCard({ guide, onDragStart, onClick }: { guide: AccountingGuide, onDragStart: (e: React.DragEvent, id: string) => void, onClick: () => void }) {
    return (
        <Card 
            draggable 
            onDragStart={(e) => onDragStart(e, guide.id)}
            onClick={onClick}
            className="group hover:border-primary/40 border-border/10 bg-white/40 backdrop-blur-md rounded-[1.8rem] p-6 shadow-sm cursor-grab active:cursor-grabbing transition-all hover:scale-[1.02] shadow-primary/5"
        >
            <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col gap-1">
                        <span className="text-base font-semibold text-foreground leading-tight tracking-tight">{guide.client?.nome_fantasia || guide.client?.razao_social}</span>
                        <span className="text-[10px] font-bold uppercase text-muted-foreground/70 tracking-widest">{guide.client?.cnpj}</span>
                    </div>
                    <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                <div className="flex flex-wrap gap-2 pt-2 border-t border-border/10">
                    <Badge variant="outline" className="bg-primary/10 text-primary border-none text-[10px] px-2 py-0.5 font-bold uppercase tracking-tight">{guide.type}</Badge>
                    <Badge variant="outline" className="bg-muted text-muted-foreground border-none text-[10px] px-2 py-0.5 font-mono font-bold">{guide.competency}</Badge>
                </div>

                <div className="flex items-center justify-between mt-2 pt-4 border-t border-border/20">
                    <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground/40" />
                        <span className="text-[10px] text-muted-foreground font-medium">{format(parseISO(guide.created_at), 'dd/MM')}</span>
                    </div>
                    {guide.file_url ? (
                        <div className="h-7 w-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                            <Eye className="h-3.5 w-3.5" />
                        </div>
                    ) : (
                        <div className="h-7 w-7 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500 animate-pulse">
                            <XCircle className="h-3.5 w-3.5" />
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
}
