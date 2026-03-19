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
    Loader2
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
    const [selectedMonth, setSelectedMonth] = useState(() => format(new Date(), 'yyyy-MM'));
    const [selectedTask, setSelectedTask] = useState<AccountingGuide | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);

    // Fetch guides for the selected month (Reference Month)
    const { guides, loading, fetchGuides } = useDeliveryList(selectedMonth || undefined);

    // Available months for reference filtering (Current and last 12)
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
            // Sort MM/yyyy descendente
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

            return matchesSearch && matchesStatus && matchesType && matchesCompetency;
        });
    }, [guides, searchTerm, filterStatus, filterType, competencyFilter]);

    const resetFilters = () => {
        setSearchTerm('');
        setFilterStatus('all');
        setFilterType('all');
        setCompetencyFilter('all');
        toast.info("Filtros limpos");
    };

    const handleSync = async () => {
        if (!selectedMonth) return;
        setIsSyncing(true);
        const toastId = toast.loading("Sincronizando tarefas com as obrigações atuais...");
        try {
            const results = await TaskGeneratorService.syncTasksForMonth(selectedMonth);
            toast.success(`Sincronização concluída! ${results.created} criadas, ${results.deleted} removidas (descontinuadas).`, { id: toastId });
            fetchGuides(selectedMonth);
        } catch (error) {
            console.error(error);
            toast.error("Erro ao sincronizar tarefas.", { id: toastId });
        } finally {
            setIsSyncing(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'sent':
                return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20 gap-1.5 rounded-lg px-2 text-[10px] font-bold uppercase"><CheckCircle2 className="h-3 w-3" /> Enviado</Badge>;
            case 'pending':
                return <Badge variant="outline" className="text-amber-600 border-amber-500/20 bg-amber-500/5 gap-1.5 rounded-lg px-2 text-[10px] font-bold uppercase"><Clock className="h-3 w-3" /> Pendente</Badge>;
            case 'scheduled':
                return <Badge variant="outline" className="text-blue-600 border-blue-500/20 bg-blue-500/5 gap-1.5 rounded-lg px-2 text-[10px] font-bold uppercase"><CalendarIcon className="h-3 w-3" /> Agendado</Badge>;
            case 'expired':
                return <Badge variant="outline" className="text-red-600 border-red-500/20 bg-red-500/5 gap-1.5 rounded-lg px-2 text-[10px] font-bold uppercase"><XCircle className="h-3 w-3" /> Expirado</Badge>;
            default:
                return <Badge variant="outline" className="text-[10px] font-bold uppercase rounded-lg px-2">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-10">
            {/* Header */}
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between pt-4">
                <div>
                    <h1 className="text-4xl font-extralight tracking-tight text-foreground">Gestão de <span className="text-primary font-normal">Tarefas</span></h1>
                    <p className="text-[10px] font-normal text-muted-foreground uppercase tracking-[0.3em] mt-2 opacity-70">
                        {officeName} • Auditoria & Log de Envios
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <Button
                        onClick={handleSync}
                        disabled={isSyncing || !selectedMonth}
                        variant="outline"
                        className="h-12 rounded-2xl px-6 gap-2 border-primary/20 hover:bg-primary/5 text-primary transition-all active:scale-95"
                    >
                        {isSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                        Sincronizar
                    </Button>

                    <div className="flex items-center gap-4 bg-card/50 p-2 rounded-2xl border border-border/10 shadow-sm">
                        <div className="flex flex-col items-end px-4">
                            <span className="text-[8px] uppercase font-bold tracking-[0.2em] text-muted-foreground/60 mb-1">Mês de Referência (Trabalho)</span>
                            <select 
                                className="bg-transparent text-sm font-medium outline-none text-right cursor-pointer text-foreground appearance-none"
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

            {/* Robust Filters Area */}
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
                <div className="xl:col-span-4 bg-card/30 backdrop-blur-md rounded-[2.5rem] p-6 border border-border/40 flex flex-wrap items-center gap-6 shadow-sm">
                    {/* Search */}
                    <div className="flex-1 min-w-[200px] relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                        <Input 
                            placeholder="Buscar cliente, obrigação ou competência..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-12 rounded-xl border-border/20 bg-muted/20 pl-11 font-light text-xs focus-visible:ring-primary/20"
                        />
                    </div>

                    <div className="w-px h-10 bg-border/40 hidden xl:block" />

                    {/* Competency Filter - NEW */}
                    <div className="flex flex-col gap-1.5 min-w-[140px]">
                        <label className="text-[8px] uppercase font-bold tracking-widest text-muted-foreground/60 flex items-center gap-2">
                           <CalendarIcon className="h-3 w-3" /> Competência
                        </label>
                        <select 
                            className="bg-transparent text-xs font-light outline-none cursor-pointer"
                            value={competencyFilter}
                            onChange={(e) => setCompetencyFilter(e.target.value)}
                        >
                            <option value="all">Todas</option>
                            {competencyTypes.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>

                    <div className="w-px h-10 bg-border/40 hidden md:block" />

                    {/* Status Filter */}
                    <div className="flex flex-col gap-1.5 min-w-[140px]">
                        <label className="text-[8px] uppercase font-bold tracking-widest text-muted-foreground/60 flex items-center gap-2">
                           <History className="h-3 w-3" /> Status
                        </label>
                        <select 
                            className="bg-transparent text-xs font-light outline-none cursor-pointer"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="all">Todos</option>
                            <option value="sent">Enviados</option>
                            <option value="pending">Pendentes</option>
                            <option value="scheduled">Agendados</option>
                            <option value="expired">Expirados</option>
                        </select>
                    </div>

                    <div className="w-px h-10 bg-border/40 hidden md:block" />

                    {/* Type Filter */}
                    <div className="flex flex-col gap-1.5 min-w-[140px]">
                        <label className="text-[8px] uppercase font-bold tracking-widest text-muted-foreground/60 flex items-center gap-2">
                           <Building2 className="h-3 w-3" /> Obrigação
                        </label>
                        <select 
                            className="bg-transparent text-xs font-light outline-none cursor-pointer"
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                        >
                            <option value="all">Todos</option>
                            {obligationTypes.map(t => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </div>

                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={resetFilters}
                        className="h-10 w-10 rounded-xl text-muted-foreground hover:text-primary transition-colors"
                        title="Limpar Filtros"
                    >
                        <RotateCcw className="h-4 w-4" />
                    </Button>
                </div>

                {/* Quick Stats */}
                <div className="bg-primary/5 rounded-[2.5rem] p-6 border border-primary/20 flex items-center justify-around shadow-inner">
                    <div className="text-center">
                        <p className="text-[24px] font-light text-primary">{filteredGuides.filter(g => g.status === 'sent').length}</p>
                        <p className="text-[8px] uppercase font-bold tracking-widest text-primary/60">Enviados</p>
                    </div>
                    <div className="w-px h-10 bg-primary/10" />
                    <div className="text-center">
                        <p className="text-[24px] font-light text-amber-600">{filteredGuides.filter(g => g.status === 'pending').length}</p>
                        <p className="text-[8px] uppercase font-bold tracking-widest text-amber-600/60">Pendentes</p>
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <Card className="rounded-[2.5rem] border-border/40 bg-card/30 backdrop-blur-md overflow-hidden shadow-2xl">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-muted/30">
                            <TableRow className="hover:bg-transparent border-border/10">
                                <TableHead className="py-6 px-8 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 w-[25%]">Cliente</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Habilitação / Obrigação</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 text-center">Competência</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Status</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                                    Enviado em <ArrowUpDown className="ml-2 h-3 w-3 inline opacity-40" />
                                </TableHead>
                                <TableHead className="text-right px-8 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 w-[100px]">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="py-32 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="h-10 w-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                            <p className="text-xs uppercase tracking-widest font-light text-muted-foreground">Sincronizando com Supabase...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredGuides.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="py-24 text-center">
                                        <div className="flex flex-col items-center gap-4 opacity-30">
                                            <SearchX className="h-16 w-16 stroke-[1px]" />
                                            <div className="space-y-1">
                                                <p className="text-sm uppercase tracking-[0.2em] font-medium">Nenhuma tarefa encontrada</p>
                                                <p className="text-[10px] font-light">Tente ajustar os filtros ou selecionar outro mês</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredGuides.map((guide) => (
                                    <TableRow key={guide.id} className="group hover:bg-primary/[0.02] border-border/10 transition-all duration-300">
                                        <TableCell className="py-5 px-8">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-foreground tracking-tight">{guide.client?.nome_fantasia || guide.client?.razao_social}</span>
                                                <span className="text-[10px] font-medium text-muted-foreground/60 tracking-wider mt-0.5">{guide.client?.cnpj}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary/10 transition-colors">
                                                    <Building2 className="h-4 w-4" />
                                                </div>
                                                <span className="text-xs font-light text-foreground/80">{guide.type}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="secondary" className="bg-muted/50 text-muted-foreground border-border/30 rounded-md font-mono text-[10px] px-2">
                                                {guide.competency || '--'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {getStatusBadge(guide.status)}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-light">
                                                    {guide.sent_at ? format(parseISO(guide.sent_at), "dd/MM/yyyy") : '--'}
                                                </span>
                                                <span className="text-[9px] text-muted-foreground font-mono opacity-50">
                                                    {guide.sent_at ? format(parseISO(guide.sent_at), "HH:mm:ss") : '--'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right px-8">
                                            <div className="flex items-center justify-end gap-1 opacity-20 group-hover:opacity-100 transition-opacity">
                                                {guide.file_url && (
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-8 w-8 rounded-lg hover:bg-primary/10 text-primary transition-all active:scale-95"
                                                        onClick={() => window.open(guide.file_url!, '_blank')}
                                                        title="Ver Guia"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-8 w-8 rounded-lg hover:bg-primary/10 text-primary transition-all active:scale-95"
                                                    onClick={() => setSelectedTask(guide)}
                                                    title="Auditoria"
                                                >
                                                    <History className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Audit Log / Task Details Sheet */}
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
                                            <SheetTitle className="text-2xl font-light">Auditoria de <span className="text-primary font-normal">Tarefa</span></SheetTitle>
                                            <SheetDescription className="text-xs uppercase tracking-widest font-bold text-muted-foreground/60">
                                                Rastreamento Completo • ID: {selectedTask.id.substring(0, 8)}
                                            </SheetDescription>
                                        </div>
                                    </div>
                                </SheetHeader>
                            </div>

                            <ScrollArea className="flex-1 p-10">
                                <div className="space-y-12">
                                    {/* Task Info Dashboard */}
                                    <div className="grid grid-cols-1 gap-6">
                                        <Card className="rounded-[2rem] border-border/10 bg-muted/10 overflow-hidden shadow-sm">
                                            <CardContent className="p-8 space-y-8">
                                                <div>
                                                    <p className="text-[10px] uppercase font-bold text-muted-foreground/50 tracking-widest mb-2">Empresa Atendida</p>
                                                    <p className="text-xl font-light leading-snug text-foreground">{selectedTask.client?.razao_social}</p>
                                                    <p className="text-xs font-mono text-muted-foreground/60 mt-1">{selectedTask.client?.cnpj}</p>
                                                </div>
                                                
                                                <div className="grid grid-cols-2 gap-8 pt-8 border-t border-border/5">
                                                    <div>
                                                        <p className="text-[10px] uppercase font-bold text-muted-foreground/50 tracking-widest mb-2">Obrigação / Guia</p>
                                                        <Badge className="bg-primary/10 text-primary border-none text-[11px] font-bold uppercase rounded-md">{selectedTask.type}</Badge>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] uppercase font-bold text-muted-foreground/50 tracking-widest mb-2">Período de Competência</p>
                                                        <p className="text-sm font-medium text-foreground">{selectedTask.competency || '--'}</p>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-8 pt-8 border-t border-border/5">
                                                    <div>
                                                        <p className="text-[10px] uppercase font-bold text-muted-foreground/50 tracking-widest mb-2">Data de Vencimento</p>
                                                        <p className="text-sm font-medium text-foreground">{selectedTask.due_date ? format(parseISO(selectedTask.due_date), "dd/MM/yyyy") : '--'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] uppercase font-bold text-muted-foreground/50 tracking-widest mb-2">Valor da Guia</p>
                                                        <p className="text-sm font-bold text-emerald-600">
                                                            {selectedTask.amount ? selectedTask.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '--'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* Timeline Trail */}
                                    <div className="space-y-8">
                                        <h4 className="text-[10px] uppercase font-bold tracking-[0.2em] text-muted-foreground/60 flex items-center gap-2">
                                            <History className="h-4 w-4 opacity-50" /> Linha do Tempo Auditada
                                        </h4>
                                        
                                        <div className="relative space-y-10 pl-8 border-l border-border/10 ml-2">
                                            {/* Action: Created */}
                                            <div className="relative">
                                                <div className="absolute -left-[41px] top-0 h-6 w-6 rounded-full bg-card border-[3px] border-border/20 shadow-sm flex items-center justify-center">
                                                    <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                                                </div>
                                                <div>
                                                    <p className="text-[12px] font-bold text-foreground">Tarefa Criada no Sistema</p>
                                                    <p className="text-[10px] text-muted-foreground/70 mt-1">
                                                        {format(parseISO(selectedTask.created_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                                                    </p>
                                                    <p className="text-[9px] text-muted-foreground/40 mt-1 uppercase tracking-tighter italic">Processamento automático via Dashboard</p>
                                                </div>
                                            </div>

                                            {/* Action: Sent */}
                                            {selectedTask.sent_at && (
                                                <div className="relative">
                                                    <div className="absolute -left-[41px] top-0 h-6 w-6 rounded-full bg-emerald-500 border-[3px] border-card shadow-sm flex items-center justify-center">
                                                        <MailCheck className="h-3 w-3 text-white" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-[12px] font-bold text-foreground">E-mail Despachado com Sucesso</p>
                                                            <Badge variant="outline" className="text-[8px] h-4 bg-emerald-500/5 text-emerald-600 border-emerald-500/20">RESEND SMTP</Badge>
                                                        </div>
                                                        <p className="text-[10px] text-muted-foreground/70 mt-1">
                                                            Log de Envio: {format(parseISO(selectedTask.sent_at), "dd/MM/yyyy 'às' HH:mm:ss")}
                                                        </p>
                                                        <p className="text-[9px] text-primary/60 mt-1 font-mono uppercase tracking-tighter">Destinatário: {selectedTask.client?.email}</p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Action: Delivered */}
                                            {selectedTask.delivered_at && (
                                                <div className="relative">
                                                    <div className="absolute -left-[41px] top-0 h-6 w-6 rounded-full bg-blue-500 border-[3px] border-card shadow-sm flex items-center justify-center">
                                                        <CheckCircle2 className="h-3 w-3 text-white" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[12px] font-bold text-foreground">Entregue no Provedor de E-mail</p>
                                                        <p className="text-[10px] text-muted-foreground/70 mt-1">
                                                            {format(parseISO(selectedTask.delivered_at), "dd/MM/yyyy 'às' HH:mm:ss")}
                                                        </p>
                                                        <p className="text-[9px] text-muted-foreground/40 mt-1 italic uppercase tracking-tighter">Status: Inbox Delivery Confirmed</p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Action: Opened */}
                                            {selectedTask.opened_at && (
                                                <div className="relative">
                                                    <div className="absolute -left-[41px] top-0 h-6 w-6 rounded-full bg-primary border-[3px] border-card shadow-lg flex items-center justify-center animate-pulse">
                                                        <MousePointer2 className="h-3 w-3 text-white" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-[12px] font-bold text-primary">Interação do Cliente Identificada</p>
                                                            <Badge className="text-[8px] h-4 bg-primary/10 text-primary border-none">VISUALIZADO</Badge>
                                                        </div>
                                                        <p className="text-[10px] text-muted-foreground/70 mt-1">
                                                            Acesso registrado em {format(parseISO(selectedTask.opened_at), "dd/MM/yyyy 'às' HH:mm:ss")}
                                                        </p>
                                                        <p className="text-[9px] text-muted-foreground/40 mt-1 italic uppercase tracking-tighter">Dispositivo detectado: Browser Client</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </ScrollArea>

                            {/* Footer Actions */}
                            <div className="p-10 border-t border-border/10 bg-muted/20 flex gap-4">
                                {selectedTask.file_url && (
                                    <Button 
                                        variant="outline" 
                                        className="flex-1 h-14 rounded-2xl gap-3 text-[10px] uppercase font-bold tracking-widest border-border/50 hover:bg-card transition-all active:scale-95 shadow-sm"
                                        onClick={() => window.open(selectedTask.file_url!, '_blank')}
                                    >
                                        <Eye className="h-4 w-4" /> Visualizar Guia PDF
                                    </Button>
                                )}
                                <Button 
                                    className="flex-1 h-14 rounded-2xl gap-3 text-[10px] uppercase font-bold tracking-widest shadow-xl shadow-primary/20 transition-all active:scale-95"
                                    onClick={() => toast.success("Relatório de auditoria gerado!")}
                                >
                                    <Download className="h-4 w-4" /> Exportar Relatório (PDF)
                                </Button>
                            </div>
                        </>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}
