import { useState, useMemo } from 'react';
import {
    Search,
    MailCheck,
    Building2,
    Filter,
    LayoutGrid,
    List,
    CalendarDays,
    FileText,
    RefreshCw,
    Loader2,
    ShieldCheck,
    Eye,
    ExternalLink,
    Globe,
    Clock,
    Mail,
    ChevronRight,
    Inbox
} from 'lucide-react';
import { format, parseISO, subMonths, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Table, TableBody, TableCell,
    TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { useClients } from '@/hooks/useClients';
import { useDeliveryList } from '@/hooks/useDeliveryList';
import { useBranding } from '@/context/BrandingContext';
import { cn } from "@/lib/utils";
import {
    Dialog, DialogContent, DialogHeader,
    DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

const DEPARTMENTS = ['Todos', 'Fiscal', 'Contábil', 'Trabalhista'];

export default function EmailLogs() {
    const { officeName } = useBranding();
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchTerm, setSearchTerm] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState('Todos');
    const [selectedMonth, setSelectedMonth] = useState(() => format(new Date(), 'yyyy-MM'));
    const [selectedClient, setSelectedClient] = useState<any | null>(null);
    const [detailLog, setDetailLog] = useState<any | null>(null);

    const { clients } = useClients();
    const { guides, loading, fetchGuides } = useDeliveryList(selectedMonth || undefined);

    // Apenas guias enviados
    const sentGuides = useMemo(() =>
        guides.filter(g => g.status === 'sent' && g.sent_at),
        [guides]
    );

    // Meses disponíveis
    const availableMonths = useMemo(() => {
        const months = [];
        const today = startOfMonth(new Date());
        for (let i = 0; i < 13; i++) {
            const d = subMonths(today, i);
            months.push({ value: format(d, 'yyyy-MM'), label: format(d, 'MMMM / yyyy', { locale: ptBR }) });
        }
        return months;
    }, []);

    // Agrupar por empresa — mostra TODAS as empresas ativas como cards
    const clientsWithLogs = useMemo(() => {
        const searchLower = searchTerm.toLowerCase();
        return clients
            .filter(c => c.isActive)
            .map(client => {
                const logs = sentGuides.filter(g => {
                    const matchesClient = g.client_id === client.id;
                    const matchesDept = departmentFilter === 'Todos' || (g.type || '').toLowerCase().includes(departmentFilter.toLowerCase());
                    return matchesClient && matchesDept;
                }).sort((a, b) => new Date(b.sent_at!).getTime() - new Date(a.sent_at!).getTime());
                return { client, logs };
            })
            .filter(({ client, logs }) => {
                // Com busca: filtra por nome/cnpj da empresa ou por tipo de tarefa enviada
                if (!searchTerm) return true; // Sem busca: mostra TODOS
                const matchesName =
                    (client.nomeFantasia || '').toLowerCase().includes(searchLower) ||
                    (client.razaoSocial || '').toLowerCase().includes(searchLower) ||
                    (client.cnpj || '').includes(searchTerm);
                const matchesLog = logs.some(l => (l.type || '').toLowerCase().includes(searchLower));
                return matchesName || matchesLog;
            })
            .sort((a, b) => {
                // Empresas com mais envios aparecem primeiro
                if (b.logs.length !== a.logs.length) return b.logs.length - a.logs.length;
                return (a.client.nomeFantasia || a.client.razaoSocial || '').localeCompare(b.client.nomeFantasia || b.client.razaoSocial || '');
            });
    }, [clients, sentGuides, searchTerm, departmentFilter]);

    // Logs FLAT para a visão de lista
    const flatLogs = useMemo(() => {
        return clientsWithLogs.flatMap(({ client, logs }) =>
            logs.map(l => ({ ...l, clientData: client }))
        );
    }, [clientsWithLogs]);

    // Logs do cliente selecionado (para o modal)
    const selectedClientLogs = useMemo(() => {
        if (!selectedClient) return [];
        return sentGuides
            .filter(g => g.client_id === selectedClient.id)
            .filter(g => departmentFilter === 'Todos' || (g.type || '').toLowerCase().includes(departmentFilter.toLowerCase()))
            .sort((a, b) => new Date(b.sent_at!).getTime() - new Date(a.sent_at!).getTime());
    }, [selectedClient, sentGuides, departmentFilter]);

    const totalSent = sentGuides.length;
    const uniqueClients = new Set(sentGuides.map(g => g.client_id)).size;
    const uniqueTasks = new Set(sentGuides.map(g => g.type)).size;

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-10">
            {/* Header */}
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between pt-4">
                <div>
                    <h1 className="text-4xl font-light tracking-tight text-foreground">Logs de <span className="text-primary font-medium">Envios</span></h1>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.2em] mt-2">
                        {officeName} • Rastreio e Auditoria Completa de E-mails
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-muted/10 p-1 rounded-2xl border border-border/10 flex gap-1">
                        <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('grid')} className="rounded-xl h-10 px-4 text-[10px] uppercase font-bold tracking-widest gap-2">
                            <LayoutGrid className="h-4 w-4" /> Grid
                        </Button>
                        <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('list')} className="rounded-xl h-10 px-4 text-[10px] uppercase font-bold tracking-widest gap-2">
                            <List className="h-4 w-4" /> Lista
                        </Button>
                    </div>
                    <Button variant="outline" size="icon" onClick={() => fetchGuides(selectedMonth)} className="h-11 w-11 rounded-2xl border-border/30 hover:bg-primary/5 hover:text-primary">
                        <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <Card className="rounded-[2.5rem] border-none bg-emerald-500/5 p-6 flex items-center gap-5">
                    <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                        <MailCheck className="h-7 w-7" />
                    </div>
                    <div>
                        <p className="text-[32px] font-light text-emerald-600 leading-none">{totalSent}</p>
                        <p className="text-[9px] uppercase font-black tracking-widest text-emerald-600/60 mt-2">E-mails no Mês</p>
                    </div>
                </Card>
                <Card className="rounded-[2.5rem] border-none bg-blue-500/5 p-6 flex items-center gap-5">
                    <div className="h-14 w-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600 shrink-0">
                        <Building2 className="h-7 w-7" />
                    </div>
                    <div>
                        <p className="text-[32px] font-light text-blue-600 leading-none">{uniqueClients}</p>
                        <p className="text-[9px] uppercase font-black tracking-widest text-blue-600/60 mt-2">Empresas Atendidas</p>
                    </div>
                </Card>
                <Card className="rounded-[2.5rem] border-none bg-primary/5 p-6 flex items-center gap-5">
                    <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <FileText className="h-7 w-7" />
                    </div>
                    <div>
                        <p className="text-[32px] font-light text-primary leading-none">{uniqueTasks}</p>
                        <p className="text-[9px] uppercase font-black tracking-widest text-primary/60 mt-2">Tipos de Obrigação</p>
                    </div>
                </Card>
            </div>

            {/* Filters */}
            <div className="bg-card/30 backdrop-blur-md rounded-[2.5rem] p-6 border border-border/40 flex flex-wrap items-center gap-4 shadow-sm">
                <div className="flex-1 min-w-[220px] relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                    <Input placeholder="Buscar empresa, tarefa ou e-mail..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                        className="h-12 rounded-xl border-border/20 bg-muted/20 pl-11 font-light text-xs focus-visible:ring-primary/20" />
                </div>
                <div className="flex items-center gap-2 bg-muted/20 rounded-xl px-4 h-12 border border-border/20 min-w-[160px]">
                    <Filter className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                    <select className="bg-transparent text-xs font-medium outline-none cursor-pointer w-full" value={departmentFilter} onChange={e => setDepartmentFilter(e.target.value)}>
                        {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>
                <div className="flex items-center gap-2 bg-muted/20 rounded-xl px-4 h-12 border border-border/20 min-w-[180px]">
                    <CalendarDays className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                    <select className="bg-transparent text-xs font-medium outline-none cursor-pointer w-full" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>
                        {availableMonths.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                </div>
                <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest shrink-0 px-2">
                    {clientsWithLogs.length} empresa{clientsWithLogs.length !== 1 ? 's' : ''}
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center py-32">
                    <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
                </div>
            ) : clientsWithLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 gap-4 opacity-40">
                    <Inbox className="h-16 w-16 stroke-[1px]" />
                    <p className="font-light italic">Nenhuma empresa encontrada.</p>
                </div>
            ) : viewMode === 'grid' ? (
                /* ── GRID: estilo idêntico ao Alertas ── */
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {clientsWithLogs.map(({ client, logs }) => {
                        const lastSent = logs[0];
                        const taskTypes = [...new Set(logs.map(l => l.type))];
                        const hasSent = logs.length > 0;
                        return (
                            <Card
                                key={client.id}
                                onClick={() => setSelectedClient(client)}
                                className="group rounded-[3rem] border border-border/40 bg-white/40 backdrop-blur-md overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5 cursor-pointer"
                            >
                                {/* Head - igual ao Alertas */}
                                <div className="p-8 flex items-start justify-between">
                                    <div className="flex gap-6">
                                        <div className={cn(
                                            "h-16 w-16 rounded-3xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 duration-500 ring-1 ring-white/20",
                                            hasSent ? "bg-emerald-500 text-white shadow-emerald-500/20" : "bg-muted text-muted-foreground"
                                        )}>
                                            <Building2 className="h-8 w-8" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <h3 className="text-xl font-bold tracking-tight text-foreground/80">
                                                    {client.nomeFantasia || client.razaoSocial}
                                                </h3>
                                                <Badge variant="outline" className="text-[8px] font-black tracking-widest opacity-40 uppercase py-0.5">
                                                    {client.regimeTributario || 'regime'}
                                                </Badge>
                                            </div>
                                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-[0.2em] mt-1 italic">
                                                CNPJ: {client.cnpj}
                                                {lastSent?.sent_at && (
                                                    <> • Último envio: {format(parseISO(lastSent.sent_at), 'dd/MM/yy HH:mm')}</>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    {/* Contador de envios no topo direito */}
                                    <div className="flex flex-col items-end gap-3">
                                        <div className={cn(
                                            "flex items-center gap-2 px-4 py-2 rounded-2xl border",
                                            hasSent
                                                ? "bg-emerald-50 border-emerald-200/40 text-emerald-700"
                                                : "bg-muted/20 border-white/20 text-muted-foreground"
                                        )}>
                                            <MailCheck className="h-4 w-4" />
                                            <span className="text-[9px] font-black uppercase tracking-widest">
                                                {logs.length} {logs.length === 1 ? 'envio' : 'envios'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Body com 2 colunas - igual ao Alertas */}
                                <div className="px-8 pb-10 grid grid-cols-1 md:grid-cols-2 gap-10 border-t border-border/5 pt-8 bg-muted/[0.02]">
                                    {/* Obrigações enviadas */}
                                    <div className="space-y-4">
                                        <label className="text-[9px] uppercase font-black tracking-widest text-muted-foreground/40 flex items-center gap-2">
                                            <FileText className="h-3.5 w-3.5 fill-primary/20 text-primary" />
                                            Obrigações Enviadas
                                        </label>
                                        {taskTypes.length > 0 ? (
                                            <div className="flex flex-wrap gap-2">
                                                {taskTypes.slice(0, 5).map(t => (
                                                    <div key={t} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-border/20 shadow-sm">
                                                        <span className="text-xs font-bold text-foreground/70">{t}</span>
                                                    </div>
                                                ))}
                                                {taskTypes.length > 5 && (
                                                    <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-muted/40 border border-border/10">
                                                        <span className="text-xs font-bold text-muted-foreground">+{taskTypes.length - 5} mais</span>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-[11px] text-muted-foreground/40 italic">Nenhum envio neste período</p>
                                        )}
                                    </div>

                                    {/* E-mail destino */}
                                    <div className="space-y-4">
                                        <label className="text-[9px] uppercase font-black tracking-widest text-muted-foreground/40 flex items-center gap-2">
                                            <Mail className="h-3.5 w-3.5 fill-blue-500/20 text-blue-500" />
                                            Destino dos Envios
                                        </label>
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-border/10 shadow-sm">
                                                <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                                    <Mail className="h-4 w-4" />
                                                </div>
                                                <div className="flex-1 overflow-hidden">
                                                    <p className="text-[10px] font-bold text-blue-600/70 uppercase">E-mail Principal</p>
                                                    <p className="text-[11px] font-medium text-foreground/60 truncate" title={client.email}>
                                                        {client.email || 'Não configurado'}
                                                    </p>
                                                </div>
                                                {hasSent && <Badge className="bg-emerald-50 text-emerald-600 border-none text-[8px] h-4 shrink-0">ENVIADO</Badge>}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="border-t border-border/5 px-8 py-4 flex items-center justify-between bg-muted/10">
                                    <span className="text-[9px] text-muted-foreground/30 uppercase font-black tracking-widest">
                                        Clique para ver o histórico completo
                                    </span>
                                    <div className="flex items-center gap-1.5 text-primary text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Eye className="h-3.5 w-3.5" /> Ver Logs <ChevronRight className="h-3 w-3" />
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            ) : (
                /* ── LIST: uma linha por empresa (todos) ── */
                <Card className="rounded-[2.5rem] border-border/40 bg-white/40 backdrop-blur-md overflow-hidden shadow-2xl">
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-muted/30">
                                <TableRow className="hover:bg-transparent border-border/10">
                                    <TableHead className="py-6 px-8 text-xs font-bold uppercase tracking-wider text-muted-foreground">Empresa</TableHead>
                                    <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">E-mail</TableHead>
                                    <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground text-center">Regime</TableHead>
                                    <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground text-center">Total de Envios</TableHead>
                                    <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground text-center">Último Envio</TableHead>
                                    <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground text-right px-8" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {clientsWithLogs.map(({ client, logs }) => {
                                    const lastSent = logs[0];
                                    const hasSent = logs.length > 0;
                                    return (
                                        <TableRow
                                            key={client.id}
                                            onClick={() => setSelectedClient(client)}
                                            className="group hover:bg-primary/[0.02] border-border/10 transition-all duration-200 cursor-pointer"
                                        >
                                            <TableCell className="py-5 px-8">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                                                        hasSent ? "bg-emerald-500/10 text-emerald-600" : "bg-muted/40 text-muted-foreground"
                                                    )}>
                                                        <Building2 className="h-4 w-4" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-foreground leading-tight">{client.nomeFantasia || client.razaoSocial}</p>
                                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mt-0.5">{client.cnpj}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <Mail className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                                                    <span className="truncate max-w-[200px] font-medium">{client.email || '—'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="outline" className="text-[9px] font-black uppercase opacity-60">
                                                    {client.regimeTributario || '—'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className={cn(
                                                    "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold",
                                                    hasSent ? "bg-emerald-500/10 text-emerald-600" : "bg-muted/30 text-muted-foreground"
                                                )}>
                                                    <MailCheck className="h-3 w-3" />
                                                    {logs.length} envio{logs.length !== 1 ? 's' : ''}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {lastSent?.sent_at ? (
                                                    <div className="flex flex-col items-center gap-0.5">
                                                        <span className="text-sm font-semibold text-foreground">{format(parseISO(lastSent.sent_at), 'dd/MM/yyyy')}</span>
                                                        <span className="text-[10px] text-muted-foreground font-mono font-bold">{format(parseISO(lastSent.sent_at), 'HH:mm')}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground/30 italic text-[10px]">Sem envios</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right px-8">
                                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl opacity-20 group-hover:opacity-100 transition-opacity hover:bg-primary/10 text-primary">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {/* Modal: Logs de um cliente específico */}
            <ClientLogsDialog
                client={selectedClient}
                logs={selectedClientLogs}
                onClose={() => setSelectedClient(null)}
                onViewDetail={(log) => { setDetailLog(log); }}
            />

            {/* Modal: Detalhe de um log individual */}
            <LogDetailDialog log={detailLog} onClose={() => setDetailLog(null)} />

        </div>
    );
}

// ─── Modal: Todos os logs de uma empresa ────────────────────────────────────

function ClientLogsDialog({ client, logs, onClose, onViewDetail }: {
    client: any;
    logs: any[];
    onClose: () => void;
    onViewDetail: (log: any) => void;
}) {
    const [search, setSearch] = useState('');
    const filtered = useMemo(() =>
        logs.filter(l => !search || (l.type || '').toLowerCase().includes(search.toLowerCase())),
        [logs, search]
    );

    return (
        <Dialog open={!!client} onOpenChange={o => !o && onClose()}>
            <DialogContent className="sm:max-w-4xl p-0 bg-card border border-border/40 overflow-hidden flex flex-col rounded-[2.5rem] shadow-2xl h-[90vh] max-h-[90vh]">
                {client && (
                    <>
                        {/* Header */}
                        <div className="p-8 pb-5 bg-emerald-500/[0.03] border-b border-border/10 shrink-0">
                            <DialogHeader>
                                <div className="flex items-center gap-5 pr-8">
                                    <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 border border-emerald-200/30 flex items-center justify-center text-emerald-600 shrink-0">
                                        <Building2 className="h-8 w-8" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <DialogTitle className="text-2xl font-light text-foreground truncate">
                                            {client.nomeFantasia || client.razaoSocial}
                                        </DialogTitle>
                                        <DialogDescription className="text-[10px] uppercase font-bold tracking-[0.2em] mt-1 text-emerald-600/70 flex items-center gap-3">
                                            <span>{client.cnpj}</span>
                                            <span className="text-muted-foreground/30">•</span>
                                            <span>{logs.length} e-mail{logs.length !== 1 ? 's' : ''} enviado{logs.length !== 1 ? 's' : ''}</span>
                                            <span className="text-muted-foreground/30">•</span>
                                            <span>{client.email}</span>
                                        </DialogDescription>
                                    </div>
                                </div>
                            </DialogHeader>
                            <div className="mt-5 relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                                <Input placeholder="Filtrar por nome da obrigação..." value={search} onChange={e => setSearch(e.target.value)}
                                    className="h-12 pl-11 rounded-2xl border-border/20 bg-card text-xs w-full focus-visible:ring-primary/20" />
                            </div>
                        </div>

                        {/* Log List */}
                        <ScrollArea className="flex-1 p-6 bg-muted/10 h-full">
                            {filtered.length === 0 ? (
                                <div className="text-center py-20 text-muted-foreground/40 font-light italic">Nenhum log encontrado.</div>
                            ) : (
                                <div className="space-y-3 pb-10">
                                    {filtered.map(log => (
                                        <div
                                            key={log.id}
                                            onClick={() => onViewDetail(log)}
                                            className="bg-card border border-border/30 rounded-2xl p-5 flex items-center gap-5 cursor-pointer hover:shadow-md hover:border-emerald-200/60 transition-all duration-200 group"
                                        >
                                            <div className="h-11 w-11 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0 group-hover:scale-110 transition-transform">
                                                <MailCheck className="h-5 w-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-foreground truncate">{log.type}</p>
                                                <div className="flex items-center gap-3 mt-1">
                                                    {log.competency && <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Comp. {log.competency}</span>}
                                                    {log.due_date && <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Venc. {format(parseISO(log.due_date), 'dd/MM/yyyy')}</span>}
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-sm font-semibold text-foreground">{log.sent_at ? format(parseISO(log.sent_at), 'dd/MM/yyyy') : '—'}</p>
                                                <p className="text-[10px] font-mono font-bold text-muted-foreground/60 mt-0.5">{log.sent_at ? format(parseISO(log.sent_at), 'HH:mm:ss') : ''}</p>
                                            </div>
                                            {log.sender_ip && (
                                                <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground bg-muted/40 rounded-lg px-3 py-1.5 shrink-0">
                                                    <Globe className="h-3 w-3" />{log.sender_ip}
                                                </div>
                                            )}
                                            <Eye className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>

                        {/* Footer */}
                        <div className="border-t border-border/10 px-8 py-4 bg-muted/20 shrink-0 flex items-center gap-3">
                            <MailCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                            <p className="text-[11px] text-muted-foreground font-light">
                                Clique em qualquer item para ver o <strong className="font-semibold text-foreground">protocolo completo</strong> do envio, incluindo IP, horário exato e dados técnicos.
                            </p>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}

// ─── Modal: Detalhe completo de um log ─────────────────────────────────────

function LogDetailDialog({ log, onClose }: { log: any; onClose: () => void }) {
    return (
        <Dialog open={!!log} onOpenChange={o => !o && onClose()}>
            <DialogContent className="sm:max-w-2xl p-0 bg-card border border-border/40 overflow-hidden flex flex-col rounded-[2.5rem] shadow-2xl">
                {log && (
                    <>
                        <div className="p-8 bg-emerald-500/[0.03] border-b border-border/10">
                            <DialogHeader>
                                <div className="flex items-center gap-5 pr-6">
                                    <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                                        <ShieldCheck className="h-8 w-8" />
                                    </div>
                                    <div>
                                        <DialogTitle className="text-xl font-light">Protocolo de <span className="text-emerald-600 font-semibold">Entrega</span></DialogTitle>
                                        <DialogDescription className="text-[10px] uppercase font-bold tracking-[0.2em] mt-1 text-muted-foreground/60">
                                            ID: {log.id.substring(0, 16)}... • Auditoria Completa
                                        </DialogDescription>
                                    </div>
                                </div>
                            </DialogHeader>
                        </div>

                        <ScrollArea className="flex-1 p-8 max-h-[70vh]">
                            <div className="space-y-8">
                                <Section title="Empresa Atendida" icon={<Building2 className="h-4 w-4" />}>
                                    <Row label="Nome Fantasia" value={log.client?.nome_fantasia || log.clientData?.nomeFantasia || '—'} />
                                    <Row label="Razão Social" value={log.client?.razao_social || log.clientData?.razaoSocial || '—'} />
                                    <Row label="CNPJ" value={log.client?.cnpj || log.clientData?.cnpj || '—'} mono />
                                    <Row label="Regime" value={log.clientData?.regimeTributario || '—'} />
                                </Section>
                                <Section title="Obrigação Entregue" icon={<FileText className="h-4 w-4" />}>
                                    <Row label="Tipo / Guia" value={log.type || '—'} />
                                    {log.competency && <Row label="Competência" value={log.competency} />}
                                    {log.due_date && <Row label="Vencimento" value={format(parseISO(log.due_date), "dd/MM/yyyy", { locale: ptBR })} />}
                                </Section>
                                <Section title="Dados do Envio" icon={<Mail className="h-4 w-4" />}>
                                    <Row label="E-mail Destino" value={log.client?.email || log.clientData?.email || '—'} />
                                    {log.sent_at && <>
                                        <Row label="Data de Envio" value={format(parseISO(log.sent_at), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })} />
                                        <Row label="Hora Exata" value={format(parseISO(log.sent_at), 'HH:mm:ss')} mono />
                                    </>}
                                </Section>
                                <Section title="Rastreio Técnico" icon={<Globe className="h-4 w-4" />}>
                                    <Row label="IP de Origem" value={log.sender_ip || 'Não registrado'} mono />
                                    <Row label="Mês de Referência" value={log.reference_month || '—'} mono />
                                    <Row label="ID do Registro" value={log.id} mono />
                                    {log.file_url && (
                                        <div className="flex items-center justify-between px-5 py-3.5">
                                            <span className="text-[10px] uppercase font-bold text-muted-foreground/50 tracking-widest">Arquivo PDF</span>
                                            <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-primary text-[10px] uppercase font-bold" onClick={() => window.open(log.file_url, '_blank')}>
                                                <ExternalLink className="h-3 w-3" /> Abrir PDF
                                            </Button>
                                        </div>
                                    )}
                                </Section>
                            </div>
                        </ScrollArea>

                        <div className="border-t border-border/10 px-8 py-5 bg-muted/10 flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                            <p className="text-[11px] text-muted-foreground font-light">
                                Entrega confirmada via <strong className="font-semibold text-foreground">Resend</strong> e auditada em sistema.
                            </p>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
    return (
        <div>
            <div className="flex items-center gap-2 mb-4">
                <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">{icon}</div>
                <h4 className="text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground/50">{title}</h4>
            </div>
            <div className="bg-muted/10 rounded-2xl border border-border/20 overflow-hidden">{children}</div>
        </div>
    );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
    return (
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/10 last:border-0">
            <span className="text-[10px] uppercase font-bold text-muted-foreground/50 tracking-widest shrink-0">{label}</span>
            <span className={cn("text-sm text-foreground/80 font-medium text-right break-all ml-4", mono && "font-mono text-xs")}>{value}</span>
        </div>
    );
}
