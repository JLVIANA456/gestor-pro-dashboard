import { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
    FileSpreadsheet,
    CheckCircle2,
    Clock,
    RefreshCw,
    Search,
    CalendarDays,
    Users,
    BarChart3,
    Building2,
    Send,
    Loader2,
    RotateCcw,
    Download,
    LayoutGrid,
    List,
    Mail,
    Filter,
    Eraser,
    Trash2,
    ChevronUp,
    ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { useClients } from '@/hooks/useClients';
import { useProfitSheetTasks, type ProfitSheetTask } from '@/hooks/useProfitSheetTasks';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// ─── helpers ────────────────────────────────────────────────────────────────
const MONTHS_PT = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function getCurrentMesAno(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function formatMesAno(raw: string): string {
    const [year, month] = raw.split('-');
    return `${MONTHS_PT[parseInt(month, 10) - 1]} / ${year}`;
}

function getLast12Months(): string[] {
    const result: string[] = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        result.push(
            `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        );
    }
    return result;
}

const RESPONSAVEL_KEY = 'profit_sheet_responsavel';
const COLABORADORES = ['Lucas', 'Natiele', 'Filipe'];

// ─── component ──────────────────────────────────────────────────────────────
export default function ProfitSheetTasks() {
    const { clients, loading: loadingClients } = useClients();
    const [selectedMes, setSelectedMes] = useState(getCurrentMesAno());
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'pendente' | 'recebido' | 'cobrado'>('all');
    const [responsavel, setResponsavel] = useState(() => localStorage.getItem(RESPONSAVEL_KEY) || '');
    const [baixaDate, setBaixaDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [showFilters, setShowFilters] = useState(true);

    const {
        tasks,
        loading: loadingTasks,
        fetchTasks,
        ensureTasksForMonth,
        markReceived,
        markCobrado,
        resetTask,
        resetAllForMonth,
    } = useProfitSheetTasks(selectedMes);

    // Salva responsável localmente
    useEffect(() => {
        if (responsavel) localStorage.setItem(RESPONSAVEL_KEY, responsavel);
    }, [responsavel]);

    // Ao mudar o mês, garante que todos os clientes ativos têm registro
    useEffect(() => {
        const activeClients = clients.filter(c => c.isActive);
        if (activeClients.length > 0 && selectedMes) {
            ensureTasksForMonth(activeClients.map(c => c.id), selectedMes);
        }
    }, [clients, selectedMes]);

    // Mapa clientId -> task
    const taskMap = useMemo(() => {
        const map: Record<string, ProfitSheetTask> = {};
        tasks.forEach(t => { map[t.client_id] = t; });
        return map;
    }, [tasks]);

    // Lista de clientes ativos enriquecidos com a task do mês
    const enrichedClients = useMemo(() => {
        return clients
            .filter(c => c.isActive)
            .map(c => ({ client: c, task: taskMap[c.id] ?? null }));
    }, [clients, taskMap]);

    // Filtros
    const filtered = useMemo(() => {
        let result = enrichedClients;

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(({ client }) =>
                client.nomeFantasia?.toLowerCase().includes(q) ||
                client.razaoSocial.toLowerCase().includes(q) ||
                client.cnpj.includes(q)
            );
        }

        if (filterStatus !== 'all') {
            result = result.filter(({ task }) => task?.status === filterStatus);
        }

        return result;
    }, [enrichedClients, searchQuery, filterStatus]);

    // KPIs
    const kpis = useMemo(() => {
        const total = enrichedClients.length;
        const recebido = enrichedClients.filter(({ task }) => task?.status === 'recebido').length;
        const cobrado = enrichedClients.filter(({ task }) => task?.status === 'cobrado').length;
        const pendente = enrichedClients.filter(({ task }) => !task || task.status === 'pendente').length;
        return { total, recebido, cobrado, pendente };
    }, [enrichedClients]);

    // ── handlers ────────────────────────────────────────────────────────────
    const handleMarkReceived = async (task: ProfitSheetTask | null, clientId: string) => {
        if (!task) return;
        // Exige nome do colaborador antes de dar baixa
        if (!responsavel.trim() && task.status !== 'recebido') {
            toast.error('Selecione o "Colaborador responsável" antes de dar baixa.', {
                description: 'O nome é necessário para identificação no relatório.',
            });
            return;
        }
        if (task.status === 'recebido') {
            await resetTask(task.id);
        } else {
            // Usa a data selecionada convertida para ISO
            const dateToUse = new Date(`${baixaDate}T12:00:00`).toISOString();
            await markReceived(task.id, responsavel.trim() || undefined, dateToUse);
        }
    };

    const handleSendEmail = async (
        task: ProfitSheetTask | null,
        clientEmail: string,
        clientName: string,
        provider: 'gmail' | 'outlook',
        responsavelEmpresa?: string
    ) => {
        if (!task) return;

        const mes = formatMesAno(selectedMes);
        const subject = `Planilha de Distribuição de Lucros — ${mes}`;
        
        // Use responsavelEmpresa if available, otherwise generic
        const greeting = responsavelEmpresa 
            ? `Prezado(a) Cliente ${responsavelEmpresa}, ${clientName}`
            : `Prezado(a) Cliente, ${clientName}`;

        const body =
            `${greeting},\n\n` +
            `Passamos a informar que ainda não recebemos a planilha de distribuição de lucros referente ao mês de ${mes}.\n\n` +
            `Por favor, encaminhe o documento o quanto antes para que possamos dar seguimento ao fechamento contábil.\n\n` +
            `Em caso de dúvidas, estamos à disposição.\n\n` +
            `Atenciosamente,\n${responsavel || 'JLVIANA Consultoria Contábil'}`;

        if (provider === 'gmail') {
            const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(clientEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            window.open(gmailUrl, '_blank');
        } else {
            const outlookUrl = `https://outlook.office.com/mail/deeplink/compose?to=${encodeURIComponent(clientEmail)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            window.open(outlookUrl, '_blank');
        }

        // Registra como cobrado
        await markCobrado(task.id, responsavel || undefined);
    };

    // ── export XLSX ──────────────────────────────────────────────────────────
    const handleExportXLSX = () => {
        const mes = formatMesAno(selectedMes);
        const now = new Date().toLocaleDateString('pt-BR');

        // Use filtered current data instead of all enriched clients to reflect UI state
        // Aba 1 — Recebidas
        const recebidas = filtered
            .filter(({ task }) => task?.status === 'recebido')
            .map(({ client, task }) => ({
                'Empresa': client.nomeFantasia || client.razaoSocial,
                'Razão Social': client.razaoSocial,
                'Responsável Empresa': client.responsavelEmpresa || 'Não informado',
                'CNPJ': client.cnpj,
                'E-mail': client.email,
                'Status': 'Recebido ✓',
                'Data de Recebimento': task?.received_at
                    ? format(new Date(task.received_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                    : '',
                'Responsável Baixa': task?.responsavel || '',
            }));

        // Aba 2 — Pendentes e Cobradas (não enviaram)
        const naoEnviadas = filtered
            .filter(({ task }) => !task || task.status === 'pendente' || task.status === 'cobrado')
            .map(({ client, task }) => ({
                'Empresa': client.nomeFantasia || client.razaoSocial,
                'Razão Social': client.razaoSocial,
                'Responsável Empresa': client.responsavelEmpresa || 'Não informado',
                'CNPJ': client.cnpj,
                'E-mail': client.email,
                'Status': !task || task.status === 'pendente' ? 'Pendente' : 'Cobrado — E-mail enviado',
                'Data de Recobrança': task?.cobrado_at
                    ? format(new Date(task.cobrado_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                    : '',
                'Responsável': task?.responsavel || '',
            }));

        const wb = XLSX.utils.book_new();

        // Colunas largas
        const cols = [
            { wch: 35 }, // Empresa
            { wch: 40 }, // Razão Social
            { wch: 30 }, // Responsável Empresa
            { wch: 20 }, // CNPJ
            { wch: 35 }, // E-mail
            { wch: 28 }, // Status
            { wch: 25 }, // Data
            { wch: 20 }, // Responsável
        ];

        const wsRecebidas = XLSX.utils.json_to_sheet(
            recebidas.length > 0 ? recebidas : [{ 'Empresa': 'Nenhum cliente recebido ainda.' }]
        );
        wsRecebidas['!cols'] = cols;
        XLSX.utils.book_append_sheet(wb, wsRecebidas, 'Recebidas');

        const wsNaoEnviadas = XLSX.utils.json_to_sheet(
            naoEnviadas.length > 0 ? naoEnviadas : [{ 'Empresa': 'Todos os clientes enviaram!' }]
        );
        wsNaoEnviadas['!cols'] = cols;
        XLSX.utils.book_append_sheet(wb, wsNaoEnviadas, 'Pendentes e Cobradas');

        const filename = `planilha-lucros-${selectedMes}-${new Date().toISOString().slice(0, 10)}.xlsx`;
        XLSX.writeFile(wb, filename);
    };

    const loading = loadingClients || loadingTasks;

    // ── status badge ─────────────────────────────────────────────────────────
    const StatusBadge = ({ task }: { task: ProfitSheetTask | null }) => {
        if (!task || task.status === 'pendente') {
            return (
                <Badge className="bg-amber-500/10 text-amber-600 border-amber-200/60 text-[10px] uppercase tracking-wider gap-1 font-light">
                    <Clock className="h-3 w-3" /> Pendente
                </Badge>
            );
        }
        if (task.status === 'recebido') {
            return (
                <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-200/60 text-[10px] uppercase tracking-wider gap-1 font-light">
                    <CheckCircle2 className="h-3 w-3" /> Recebido
                </Badge>
            );
        }
        return (
            <Badge className="bg-blue-500/10 text-blue-700 border-blue-200/60 text-[10px] uppercase tracking-wider gap-1 font-light">
                <Send className="h-3 w-3" /> Cobrado
            </Badge>
        );
    };

    // ── render ───────────────────────────────────────────────────────────────
    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header / Toolbar */}
            <div className="flex flex-col gap-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 flex items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 shadow-sm">
                            <FileSpreadsheet className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-light tracking-tight text-foreground">
                                Recibos de <span className="font-light text-primary">Lucros</span>
                            </h2>
                            <p className="text-xs text-muted-foreground font-light uppercase tracking-widest">Controle Mensal de Recebimento</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 bg-muted/30 p-1.5 rounded-2xl border border-border/50">
                        <div className="flex items-center gap-2 pl-2">
                            <CalendarDays className="h-4 w-4 text-muted-foreground/50" />
                            <span className="text-[10px] uppercase tracking-widest font-light text-muted-foreground">Mês:</span>
                        </div>
                        <select
                            value={selectedMes}
                            onChange={e => setSelectedMes(e.target.value)}
                            className="bg-transparent border-none text-sm font-light text-foreground focus:ring-0 cursor-pointer pr-8"
                        >
                            {getLast12Months().map(m => (
                                <option key={m} value={m}>{formatMesAno(m)}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* KPI Summary Banner */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-card border border-border/50 p-6 rounded-3xl shadow-card relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                        <BarChart3 className="h-24 w-24 text-primary" />
                    </div>
                    
                    <div className="lg:col-span-4 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-light uppercase tracking-widest text-muted-foreground">Progresso do Mês</h3>
                            <span className="text-2xl font-light text-primary">{Math.round((kpis.recebido / kpis.total) * 100)}%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted/50 overflow-hidden">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-primary transition-all duration-1000"
                                style={{ width: `${Math.round((kpis.recebido / kpis.total) * 100)}%` }}
                            />
                        </div>
                        <div className="flex items-center gap-4">
                           <div className="flex items-center gap-1.5">
                               <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                               <span className="text-[10px] font-light text-emerald-600 uppercase tracking-tighter">{kpis.recebido} Recebidos</span>
                           </div>
                           <div className="flex items-center gap-1.5">
                               <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                               <span className="text-[10px] font-light text-amber-600 uppercase tracking-tighter">{kpis.pendente} Pendentes</span>
                           </div>
                        </div>
                    </div>

                    <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-4 pl-0 lg:pl-6 lg:border-l border-border/30">
                        {[
                            { label: 'Total Clientes', value: kpis.total, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/5' },
                            { label: 'Recebidas', value: kpis.recebido, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/5' },
                            { label: 'Pendentes', value: kpis.pendente, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/5' },
                            { label: 'Cobradas', value: kpis.cobrado, icon: Send, color: 'text-primary', bg: 'bg-primary/5' },
                        ].map((k) => (
                            <div key={k.label} className="flex flex-col gap-1 p-3 rounded-2xl hover:bg-muted/30 transition-colors">
                                <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center mb-1", k.bg)}>
                                    <k.icon className={cn("h-3.5 w-3.5", k.color)} />
                                </div>
                                <span className="text-lg font-light text-foreground leading-none">{k.value}</span>
                                <span className="text-[9px] font-light text-muted-foreground uppercase tracking-widest">{k.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Main Area ────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                
                {/* Sidebar: Filters & Config */}
                <aside className="xl:col-span-3 space-y-6">
                    <div className="bg-card border border-border/50 rounded-3xl p-6 shadow-sm space-y-8">
                        {/* Search */}
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-light uppercase tracking-widest text-primary">Pesquisar</h4>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
                                <input
                                    type="text"
                                    placeholder="Nome, CNPJ ou E-mail..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="h-10 w-full rounded-xl border border-border/50 bg-muted/20 pl-9 pr-4 text-xs font-light placeholder:text-muted-foreground/30 focus:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                                />
                            </div>
                        </div>

                        {/* Status Filter */}
                        <div className="space-y-3">
                            <h4 className="text-[10px] font-light uppercase tracking-widest text-primary">Status do Recibo</h4>
                            <div className="flex flex-col gap-2">
                                {([
                                    { id: 'all', label: 'Todos os Clientes', icon: List },
                                    { id: 'pendente', label: 'Aguardando', icon: Clock },
                                    { id: 'cobrado', label: 'Cobrança Enviada', icon: Send },
                                    { id: 'recebido', label: 'Recebidos ✓', icon: CheckCircle2 },
                                ] as const).map(s => (
                                    <button
                                        key={s.id}
                                        onClick={() => setFilterStatus(s.id)}
                                        className={cn(
                                            'flex items-center gap-3 w-full px-4 py-3 rounded-xl text-xs font-light transition-all border',
                                            filterStatus === s.id
                                                ? 'bg-primary/10 border-primary/20 text-primary font-light'
                                                : 'bg-transparent border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                                        )}
                                    >
                                        <s.icon className={cn("h-3.5 w-3.5", filterStatus === s.id ? "text-primary" : "opacity-40")} />
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Action Config */}
                        <div className="pt-6 border-t border-border/50 space-y-4">
                            <div className="bg-primary/[0.03] border border-primary/10 p-5 rounded-2xl space-y-4">
                                <h4 className="text-[10px] font-light uppercase tracking-widest text-primary mb-1">Ações de Baixa</h4>
                                <p className="text-[10px] text-muted-foreground font-light leading-snug">Configure quem está realizando a baixa e a data do processo.</p>
                                
                                <div className="space-y-4 pt-2">
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] uppercase font-light text-muted-foreground/70 pl-1">Colaborador</label>
                                        <div className="relative">
                                            <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40 pointer-events-none" />
                                            <select
                                                value={responsavel}
                                                onChange={e => setResponsavel(e.target.value)}
                                                className="h-9 w-full rounded-xl border border-border/50 bg-background pl-9 text-xs font-light text-foreground focus:ring-2 focus:ring-primary/10 appearance-none cursor-pointer"
                                            >
                                                <option value="">Selecionar...</option>
                                                {COLABORADORES.map(c => (
                                                    <option key={c} value={c}>{c}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[9px] uppercase font-light text-muted-foreground/70 pl-1">Data da Baixa</label>
                                        <div className="relative">
                                            <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40 pointer-events-none" />
                                            <input
                                                type="date"
                                                value={baixaDate}
                                                onChange={e => setBaixaDate(e.target.value)}
                                                className="h-9 w-full rounded-xl border border-border/50 bg-background pl-9 pr-4 text-xs font-light text-foreground focus:ring-2 focus:ring-primary/10 cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Secondary Actions */}
                        <div className="flex flex-col gap-2 pt-2">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={handleExportXLSX}
                                className="w-full text-[10px] uppercase font-light tracking-widest h-10 rounded-xl border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/5"
                            >
                                <Download className="mr-2 h-3.5 w-3.5" /> Exportar Planilha
                            </Button>
                            
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button 
                                        variant="ghost" 
                                        size="sm"
                                        className="w-full text-[10px] uppercase font-light tracking-widest h-10 rounded-xl text-muted-foreground/50 hover:text-destructive hover:bg-destructive/5"
                                    >
                                        <Eraser className="mr-2 h-3.5 w-3.5" /> Zerar Mês
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="rounded-3xl border-border bg-card shadow-elevated">
                                    <AlertDialogHeader>
                                        <AlertDialogTitle className="text-xl font-light">Zerar Mês?</AlertDialogTitle>
                                        <AlertDialogDescription className="text-sm font-light">
                                            Isso irá marcar todos os clientes como PENDENTES para o mês selecionado.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => resetAllForMonth(selectedMes)} className="rounded-xl bg-destructive text-white hover:bg-destructive/90">Confirmar</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>
                </aside>

                {/* Main Content: Task List/Grid */}
                <main className="xl:col-span-9 space-y-6">
                    <div className="flex items-center justify-between mb-2">
                         <div className="flex items-center gap-2">
                             <div className="h-2 w-2 rounded-full bg-primary" />
                             <h3 className="text-sm font-light text-foreground">
                                {filterStatus === 'all' ? 'Todos os Registros' : filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)}
                             </h3>
                             <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground font-light">{filtered.length} Clientes</span>
                         </div>
                         
                         <div className="flex items-center gap-1.5 p-1 bg-muted/30 rounded-xl border border-border/50">
                             <button
                                 onClick={() => setViewMode('grid')}
                                 className={cn(
                                     "p-2 rounded-lg transition-all",
                                     viewMode === 'grid' ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                                 )}
                             >
                                 <LayoutGrid className="h-4 w-4" />
                             </button>
                             <button
                                 onClick={() => setViewMode('list')}
                                 className={cn(
                                     "p-2 rounded-lg transition-all",
                                     viewMode === 'list' ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                                 )}
                             >
                                 <List className="h-4 w-4" />
                             </button>
                         </div>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
                            <Loader2 className="h-8 w-8 animate-spin opacity-30" />
                            <p className="text-sm font-light">Carregando dados...</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border py-20 bg-card/30">
                            <FileSpreadsheet className="h-16 w-16 text-muted-foreground/20 mb-4" />
                            <p className="text-sm font-light text-muted-foreground">Nenhum cliente encontrado com os filtros aplicados.</p>
                        </div>
                    ) : viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 animate-slide-in-up">
                            {filtered.map(({ client, task }, index) => {
                                const isReceived = task?.status === 'recebido';
                                const isCobrado = task?.status === 'cobrado';
                                return (
                                    <div
                                        key={client.id}
                                        className={cn(
                                            'group relative rounded-2xl border bg-card p-5 shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1 flex flex-col gap-4',
                                            isReceived ? 'border-emerald-200/60' : isCobrado ? 'border-primary/20' : 'border-border/50'
                                        )}
                                        style={{ animationDelay: `${index * 30}ms` }}
                                    >
                                        <div className={cn(
                                            'absolute top-0 left-0 right-0 h-1 rounded-t-2xl',
                                            isReceived ? 'bg-emerald-400' : isCobrado ? 'bg-primary' : 'bg-amber-400'
                                        )} />

                                        <div className="flex items-start gap-3 mt-1">
                                            <div className={cn(
                                                'h-10 w-10 flex items-center justify-center rounded-xl shrink-0',
                                                isReceived ? 'bg-emerald-500/10' : isCobrado ? 'bg-primary/10' : 'bg-amber-500/10'
                                            )}>
                                                <Building2 className={cn(
                                                    'h-4 w-4',
                                                    isReceived ? 'text-emerald-600' : isCobrado ? 'text-primary' : 'text-amber-600'
                                                )} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-light text-foreground truncate group-hover:text-primary transition-colors">
                                                    {client.nomeFantasia || client.razaoSocial}
                                                </p>
                                                <p className="text-[10px] text-muted-foreground/60 font-mono mt-0.5">{client.cnpj}</p>
                                            </div>
                                            <StatusBadge task={task} />
                                        </div>

                                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                            <Mail className="h-3 w-3 opacity-40 shrink-0" />
                                            <span className="truncate text-xs">{client.email}</span>
                                        </div>

                                        {(isReceived || isCobrado) && (
                                            <div className="text-[10px] space-y-0.5 mt-auto">
                                                {isReceived && task?.received_at && (
                                                    <p className="text-emerald-600 font-light">
                                                        ✓ Recebido em {format(new Date(task.received_at), "dd/MM/yyyy", { locale: ptBR })}
                                                    </p>
                                                )}
                                                {isCobrado && task?.cobrado_at && (
                                                    <p className="text-primary font-light">
                                                        ✉ Cobrado em {format(new Date(task.cobrado_at), "dd/MM/yyyy", { locale: ptBR })}
                                                    </p>
                                                )}
                                                {task?.responsavel && (
                                                    <p className="text-[9px] text-muted-foreground uppercase tracking-widest opacity-60">por {task.responsavel}</p>
                                                )}
                                            </div>
                                        )}

                                        <div className="flex items-center gap-2 pt-2 border-t border-border/30 flex-wrap">
                                            {!isCobrado && (
                                                <button
                                                    onClick={() => handleMarkReceived(task, client.id)}
                                                    className={cn(
                                                        'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-light uppercase tracking-wider transition-all border',
                                                        isReceived
                                                            ? 'bg-emerald-500/10 text-emerald-700 border-emerald-200/60 hover:bg-emerald-500/20'
                                                            : 'bg-muted/30 text-muted-foreground border-border/50 hover:bg-emerald-500/10 hover:text-emerald-700 hover:border-emerald-200/60'
                                                    )}
                                                >
                                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                                    {isReceived ? 'OK' : 'Marcar OK'}
                                                </button>
                                            )}
                                            {!isReceived && (
                                                <div className="flex items-center gap-1.5">
                                                    <button
                                                        onClick={() => handleSendEmail(task, client.email, client.nomeFantasia || client.razaoSocial, 'gmail', client.responsavelEmpresa)}
                                                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-light uppercase tracking-wider transition-all border bg-[#EA4335]/10 text-[#EA4335] border-[#EA4335]/20 hover:bg-[#EA4335]/20"
                                                    >
                                                        Gmail
                                                    </button>
                                                    <button
                                                        onClick={() => handleSendEmail(task, client.email, client.nomeFantasia || client.razaoSocial, 'outlook', client.responsavelEmpresa)}
                                                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-light uppercase tracking-wider transition-all border bg-[#0078D4]/10 text-[#0078D4] border-[#0078D4]/20 hover:bg-[#0078D4]/20"
                                                    >
                                                        Outlook
                                                    </button>
                                                </div>
                                            )}
                                            {(isReceived || isCobrado) && (
                                                <button
                                                    onClick={() => task && resetTask(task.id)}
                                                    className="ml-auto h-7 w-7 flex items-center justify-center rounded-lg border border-border/50 text-muted-foreground hover:text-destructive transition-all"
                                                >
                                                    <RotateCcw className="h-3 w-3" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-border/50 bg-card shadow-card overflow-hidden">
                            <Table>
                                <TableHeader className="bg-muted/20">
                                    <TableRow className="hover:bg-transparent border-border/40">
                                        <TableHead className="text-[10px] font-light uppercase tracking-[0.1em] py-4 pl-6">Cliente</TableHead>
                                        <TableHead className="text-[10px] font-light uppercase tracking-[0.1em] py-4">CNPJ</TableHead>
                                        <TableHead className="text-[10px] font-light uppercase tracking-[0.1em] py-4">Status</TableHead>
                                        <TableHead className="text-[10px] font-light uppercase tracking-[0.1em] py-4 text-center pr-6">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filtered.map(({ client, task }) => {
                                        const isReceived = task?.status === 'recebido';
                                        const isCobrado = task?.status === 'cobrado';
                                        return (
                                            <TableRow key={client.id} className="border-border/30 hover:bg-muted/10 group transition-colors">
                                                <TableCell className="py-4 pl-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn(
                                                            "h-8 w-8 rounded-lg flex items-center justify-center",
                                                            isReceived ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"
                                                        )}>
                                                            <Building2 className="h-4 w-4" />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-light text-foreground truncate max-w-[200px]">{client.nomeFantasia || client.razaoSocial}</p>
                                                            <p className="text-[9px] text-muted-foreground opacity-60 font-mono uppercase tracking-tighter">{client.email}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell><span className="text-[10px] font-mono text-muted-foreground">{client.cnpj}</span></TableCell>
                                                <TableCell><StatusBadge task={task} /></TableCell>
                                                <TableCell className="py-4 text-right pr-6">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        {!isCobrado && (
                                                            <button
                                                                onClick={() => handleMarkReceived(task, client.id)}
                                                                className={cn(
                                                                    'p-2 rounded-lg border transition-all',
                                                                    isReceived
                                                                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'
                                                                        : 'bg-muted/50 border-border/50 text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-700 hover:border-emerald-200/60'
                                                                )}
                                                                title={isReceived ? "Desmarcar" : "Marcar como recebido"}
                                                            >
                                                                <CheckCircle2 className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                        {!isReceived && (
                                                            <div className="flex items-center gap-1.5">
                                                                <button
                                                                    onClick={() => handleSendEmail(task, client.email, client.nomeFantasia || client.razaoSocial, 'gmail', client.responsavelEmpresa)}
                                                                    className="p-2 rounded-lg border border-[#EA4335]/20 bg-[#EA4335]/10 text-[#EA4335] hover:bg-[#EA4335]/20"
                                                                    title="Gmail"
                                                                >
                                                                    <Mail className="h-4 w-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleSendEmail(task, client.email, client.nomeFantasia || client.razaoSocial, 'outlook', client.responsavelEmpresa)}
                                                                    className="p-2 rounded-lg border border-[#0078D4]/20 bg-[#0078D4]/10 text-[#0078D4] hover:bg-[#0078D4]/20"
                                                                    title="Outlook"
                                                                >
                                                                    <Send className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                        )}
                                                        {(isReceived || isCobrado) && (
                                                            <button
                                                                onClick={() => task && resetTask(task.id)}
                                                                className="p-2 rounded-lg border border-border/50 text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all opacity-0 group-hover:opacity-100"
                                                                title="Zerar"
                                                            >
                                                                <RotateCcw className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
