import { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { useAccounting, AccountingReportItem } from '@/hooks/useAccounting';
import { useClients } from '@/hooks/useClients';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Search,
    Loader2,
    TrendingUp,
    CheckCircle2,
    Clock,
    XCircle,
    Users,
    Building2,
    BarChart3,
    Filter,
    ChevronDown,
    ChevronUp,
    CalendarDays,
    Download,
    FileSpreadsheet,
    Printer,
    Eraser,
    Trash2,
} from 'lucide-react';
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
import { cn } from '@/lib/utils';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

// ─── helpers ────────────────────────────────────────────────────────────────
const MONTHS_PT = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function formatMesAno(raw: string) {
    // raw pode ser YYYY-MM-DD ou YYYY-MM
    const parts = raw.split('-');
    const year = parts[0];
    const month = parseInt(parts[1], 10);
    return `${MONTHS_PT[month - 1]} / ${year}`;
}

function getYearMonth(raw: string) {
    const parts = raw.split('-');
    return `${parts[0]}-${parts[1].padStart(2, '0')}`;
}

// ─── component ──────────────────────────────────────────────────────────────
export default function AccountingProgress() {
    const { fetchAllClosings, loading, resetAll } = useAccounting();
    const { clients } = useClients();

    const [closings, setClosings] = useState<AccountingReportItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterMonth, setFilterMonth] = useState('');       // YYYY-MM
    const [filterColaborador, setFilterColaborador] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'closed' | 'pending' | 'open' | 'progress' | 'no_record'>('all');
    const [filterRegime, setFilterRegime] = useState<string>('all');
    const [showFilters, setShowFilters] = useState(true);
    const [sortField, setSortField] = useState<'empresa' | 'mes' | 'colaborador'>('mes');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

    // ── load data ──────────────────────────────────────────────────────────
    useEffect(() => {
        fetchAllClosings().then(setClosings);
    }, []);

    // ── derived lists for filter dropdowns ────────────────────────────────
    const allColaboradores = useMemo(() => {
        const set = new Set(closings.map(c => c.colaboradorResponsavel));
        return Array.from(set).sort();
    }, [closings]);

    const allMonths = useMemo(() => {
        const set = new Set(closings.map(c => getYearMonth(c.mesAnoFechamento)));
        return Array.from(set).sort().reverse();
    }, [closings]);

    // ── set of client IDs that have AT LEAST one closing record ───────────
    const closingClientIds = useMemo(() => new Set(closings.map(c => c.clientId)), [closings]);

    // ── clients that have NO closing record at all (truly "open/pending") ─
    const clientsWithoutAnyClosing = useMemo(() => {
        return clients.filter(cl => cl.isActive && !closingClientIds.has(cl.id));
    }, [clients, closingClientIds]);

    // ── filter closings ───────────────────────────────────────────────────
    const filteredClosings = useMemo(() => {
        let result = [...closings];

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(c =>
                c.clientRazaoSocial.toLowerCase().includes(q) ||
                c.clientCnpj.includes(q) ||
                c.colaboradorResponsavel.toLowerCase().includes(q)
            );
        }

        if (filterMonth) {
            result = result.filter(c => getYearMonth(c.mesAnoFechamento) === filterMonth);
        }

        // Filter out records for inactive clients
        result = result.filter(c => {
            const client = clients.find(cl => cl.id === c.clientId);
            return client?.isActive;
        });

        if (filterColaborador) {
            result = result.filter(c => c.colaboradorResponsavel === filterColaborador);
        }

        if (filterStatus === 'closed') {
            result = result.filter(c => c.empresaEncerrada);
        } else if (filterStatus === 'progress') {
            result = result.filter(c => c.empresaEmAndamento && !c.empresaEncerrada);
        } else if (filterStatus === 'pending') {
            result = result.filter(c => !c.empresaEncerrada && !c.empresaEmAndamento && c.pendencias && c.pendencias.trim() !== '');
        } else if (filterStatus === 'open') {
            result = result.filter(c => !c.empresaEncerrada && !c.empresaEmAndamento && (!c.pendencias || c.pendencias.trim() === ''));
        }

        if (filterStatus === 'no_record') {
            // When filtered by no record, we return the clients without any closing for the selected month
            // map them to a virtual AccountingReportItem structure
            const monthsToFilter = filterMonth ? [filterMonth] : allMonths;
            
            // This is a bit complex because we need to check if client has NO record in ALL filtered months
            // but usually users filter by a specific month here
            return clientsWithoutAnyClosing.map(client => ({
                id: `virtual-${client.id}`,
                clientId: client.id,
                clientRazaoSocial: client.razaoSocial,
                clientNomeFantasia: client.nomeFantasia || '',
                clientCnpj: client.cnpj,
                colaboradorResponsavel: 'N/A',
                mesAnoFechamento: filterMonth || 'Sem registro',
                conciliacaoContabil: false,
                controleLucros: false,
                controleAplicacaoFinanceira: false,
                controleAnual: false,
                empresaEncerrada: false,
                empresaEmAndamento: false,
                pendencias: 'Nenhum registro de fechamento encontrado',
                updatedAt: new Date().toISOString()
            })).filter(item => {
                if (searchQuery) {
                    const search = searchQuery.toLowerCase();
                    return item.clientRazaoSocial.toLowerCase().includes(search) || 
                           item.clientCnpj.includes(search);
                }
                return true;
            }).filter(item => {
                if (filterRegime !== 'all') {
                    const client = clients.find(cl => cl.id === item.clientId);
                    return client?.regimeTributario === filterRegime;
                }
                return true;
            });
        }

        if (filterRegime !== 'all') {
            // Need to find the regime from the clients list
            result = result.filter(c => {
                const client = clients.find(cl => cl.id === c.clientId);
                return client?.regimeTributario === filterRegime;
            });
        }

        result.sort((a, b) => {
            let valA = '';
            let valB = '';
            if (sortField === 'empresa') {
                valA = a.clientRazaoSocial.toLowerCase();
                valB = b.clientRazaoSocial.toLowerCase();
            } else if (sortField === 'mes') {
                valA = getYearMonth(a.mesAnoFechamento);
                valB = getYearMonth(b.mesAnoFechamento);
            } else {
                valA = a.colaboradorResponsavel.toLowerCase();
                valB = b.colaboradorResponsavel.toLowerCase();
            }
            if (valA < valB) return sortDir === 'asc' ? -1 : 1;
            if (valA > valB) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [closings, searchQuery, filterMonth, filterColaborador, filterStatus, sortField, sortDir]);

    // ── KPIs ──────────────────────────────────────────────────────────────
    const kpis = useMemo(() => {
        const activeClients = clients.filter(c => c.isActive);
        const totalEmpresas = activeClients.length;
        const activeClientIdsSet = new Set(activeClients.map(c => c.id));
        
        const filteredClosingsForKPI = closings.filter(c => activeClientIdsSet.has(c.clientId));
        const totalFechamentos = filteredClosingsForKPI.length;
        const encerradas = filteredClosingsForKPI.filter(c => c.empresaEncerrada).length;
        const emAndamento = filteredClosingsForKPI.filter(c => c.empresaEmAndamento && !c.empresaEncerrada).length;
        const comPendencia = filteredClosingsForKPI.filter(c => !c.empresaEncerrada && !c.empresaEmAndamento && c.pendencias && c.pendencias.trim() !== '').length;
        const normais = filteredClosingsForKPI.filter(c => !c.empresaEncerrada && !c.empresaEmAndamento && (!c.pendencias || c.pendencias.trim() === '')).length;
        const semRegistro = clientsWithoutAnyClosing.length;

        return { totalEmpresas, totalFechamentos, encerradas, emAndamento, comPendencia, normais, semRegistro };
    }, [clients, closings, clientsWithoutAnyClosing]);

    // ── Por colaborador (no mês selecionado ou geral) ─────────────────────
    const porColaborador = useMemo(() => {
        const base = filterMonth
            ? closings.filter(c => getYearMonth(c.mesAnoFechamento) === filterMonth)
            : closings;

        const map: Record<string, { total: number; encerradas: number; andamento: number; pendentes: number }> = {};
        base.forEach(c => {
            if (!map[c.colaboradorResponsavel]) {
                map[c.colaboradorResponsavel] = { total: 0, encerradas: 0, andamento: 0, pendentes: 0 };
            }
            map[c.colaboradorResponsavel].total++;
            if (c.empresaEncerrada) map[c.colaboradorResponsavel].encerradas++;
            else if (c.empresaEmAndamento) map[c.colaboradorResponsavel].andamento++;
            else if (c.pendencias && c.pendencias.trim() !== '') {
                map[c.colaboradorResponsavel].pendentes++;
            }
        });
        return Object.entries(map).sort((a, b) => b[1].total - a[1].total);
    }, [closings, filterMonth]);

    // ── Export functionality ─────────────────────────────────────────────
    const handleExportExcel = () => {
        if (filteredClosings.length === 0) return;

        const data = filteredClosings.map(c => ({
            'Empresa': c.clientRazaoSocial,
            'CNPJ': c.clientCnpj,
            'Mes/Ano': formatMesAno(c.mesAnoFechamento),
            'Colaborador': c.colaboradorResponsavel,
            'Conciliação Contábil': c.conciliacaoContabil ? 'Sim' : 'Não',
            'Controle Lucros': c.controleLucros ? 'Sim' : 'Não',
            'Controle Aplicação': c.controleAplicacaoFinanceira ? 'Sim' : 'Não',
            'Controle Anual': c.controleAnual ? 'Sim' : 'Não',
            'Status': c.empresaEncerrada ? 'Encerrada' : c.empresaEmAndamento ? 'Em Andamento' : (c.pendencias && c.pendencias.trim() !== '' ? 'Pendente' : 'Fechada'),
            'Pendências': c.pendencias || ''
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Progresso Contábil');

        // Ajustar largura das colunas
        const wscols = [
            { wch: 40 }, // Empresa
            { wch: 20 }, // CNPJ
            { wch: 20 }, // Mês/Ano
            { wch: 25 }, // Colaborador
            { wch: 15 }, // Conciliação
            { wch: 15 }, // Lucros
            { wch: 15 }, // Aplicação
            { wch: 15 }, // Anual
            { wch: 15 }, // Status
            { wch: 50 }, // Pendências
        ];
        worksheet['!cols'] = wscols;

        XLSX.writeFile(workbook, `relatorio-progresso-contabil-${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    const handleExportNoRecordsXLSX = () => {
        const noRecords = clientsWithoutAnyClosing.map(c => ({
            'Razão Social': c.razaoSocial,
            'Nome Fantasia': c.nomeFantasia || '',
            'CNPJ': c.cnpj,
            'Regime Tributário': c.regimeTributario,
            'Status': 'Sem Registro de Fechamento'
        }));

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(noRecords);

        const colWidths = [
            { wch: 40 }, // Razão Social
            { wch: 30 }, // Nome Fantasia
            { wch: 20 }, // CNPJ
            { wch: 20 }, // Regime
            { wch: 30 }, // Status
        ];
        ws['!cols'] = colWidths;

        XLSX.utils.book_append_sheet(wb, ws, 'Sem Registro');
        XLSX.writeFile(wb, `empresas_sem_registro_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const handlePrint = () => {
        window.print();
    };

    const handleResetAll = async () => {
        try {
            await resetAll();
            setClosings([]); // Limpa localmente após reset
        } catch (err) {
            // Toast já disparado pelo hook
        }
    };

    // ── sort toggle ───────────────────────────────────────────────────────
    const handleSort = (field: typeof sortField) => {
        if (sortField === field) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDir('asc');
        }
    };

    const SortIcon = ({ field }: { field: typeof sortField }) => {
        if (sortField !== field) return null;
        return sortDir === 'asc' ? <ChevronUp className="h-3 w-3 inline ml-1" /> : <ChevronDown className="h-3 w-3 inline ml-1" />;
    };

    // ── status badge helper ───────────────────────────────────────────────
    const StatusBadge = ({ closing }: { closing: AccountingReportItem }) => {
        if (closing.id.startsWith('virtual-')) {
            return (
                <Badge className="bg-slate-500/15 text-slate-700 border-slate-200 text-[10px] uppercase tracking-wider gap-1">
                    <Users className="h-3 w-3" /> Sem Registro
                </Badge>
            );
        }
        if (closing.empresaEncerrada) {
            return (
                <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-200 text-[10px] uppercase tracking-wider gap-1">
                    <XCircle className="h-3 w-3" /> Encerrada
                </Badge>
            );
        }
        if (closing.empresaEmAndamento) {
            return (
                <Badge className="bg-blue-500/15 text-blue-700 border-blue-200 text-[10px] uppercase tracking-wider gap-1">
                    <TrendingUp className="h-3 w-3" /> Em Andamento
                </Badge>
            );
        }
        if (closing.pendencias && closing.pendencias.trim() !== '') {
            return (
                <Badge className="bg-amber-500/15 text-amber-700 border-amber-200 text-[10px] uppercase tracking-wider gap-1">
                    <Clock className="h-3 w-3" /> Pendente
                </Badge>
            );
        }
        return (
            <Badge className="bg-red-500/15 text-red-700 border-red-200 text-[10px] uppercase tracking-wider gap-1">
                <CheckCircle2 className="h-3 w-3" /> Fechada
            </Badge>
        );
    };

    if (loading && closings.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Print Only Header */}
            <div className="hidden print:block mb-8 border-b pb-4">
                <h1 className="text-2xl font-bold">Relatório de Progresso Contábil</h1>
                <p className="text-sm text-muted-foreground">Gerado em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}</p>
                {filterMonth && <p className="text-sm mt-1">Mês Ref: {formatMesAno(filterMonth + '-01')}</p>}
            </div>

            {/* ── Header ─────────────────────────────────────────────── */}
            <div className="flex flex-col gap-1 animate-slide-in-up">
                <h1 className="text-3xl font-light tracking-tight text-foreground flex items-center gap-3">
                    <TrendingUp className="h-7 w-7 text-primary" />
                    Progresso Contábil
                </h1>
                <p className="text-xs font-normal text-muted-foreground uppercase tracking-[0.2em] mt-1">
                    Controle de fechamentos — visão geral e por colaborador
                </p>
                <div className="flex items-center gap-3 mt-4 no-print">
                    <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl border-border/50 bg-card hover:bg-muted/50 text-[10px] uppercase tracking-wider gap-2 h-9"
                        onClick={handleExportExcel}
                        disabled={filteredClosings.length === 0}
                    >
                        <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                        Exportar Excel (XLSX)
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl border-border/50 bg-card hover:bg-muted/50 text-[10px] uppercase tracking-wider gap-2 h-9"
                        onClick={handlePrint}
                    >
                        <Printer className="h-3.5 w-3.5 text-slate-600" />
                        Imprimir / PDF
                    </Button>

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className="rounded-xl border-border/50 bg-card hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 text-[10px] uppercase tracking-wider gap-2 h-9 ml-auto transition-all"
                            >
                                <Eraser className="h-3.5 w-3.5 opacity-60" />
                                Zerar Tudo
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-3xl border-border bg-card shadow-elevated">
                            <AlertDialogHeader>
                                <AlertDialogTitle className="text-xl font-light">Zerar Toda a Contabilidade?</AlertDialogTitle>
                                <AlertDialogDescription className="text-sm font-light">
                                    Esta ação irá **apagar permanentemente** todos os registros de fechamento contábil de todos os meses e clientes. 
                                    Esta operação não pode ser desfeita.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-xl font-light">Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={handleResetAll} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl font-light">
                                    Sim, Resetar Tudo
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>

            {/* ── KPI Cards ──────────────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 animate-slide-in-up stagger-1">
                {[
                    { label: 'Total Empresas', value: kpis.totalEmpresas, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-500/10' },
                    { label: 'Registros', value: kpis.totalFechamentos, icon: BarChart3, color: 'text-primary', bg: 'bg-primary/10' },
                    { label: 'Fechadas', value: kpis.normais, icon: CheckCircle2, color: 'text-red-600', bg: 'bg-red-500/10' },
                    { label: 'Em Andamento', value: kpis.emAndamento, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-500/10' },
                    { label: 'Pendentes', value: kpis.comPendencia, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-500/10' },
                    { label: 'Encerradas', value: kpis.encerradas, icon: XCircle, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
                    { label: 'Sem Registro', value: kpis.semRegistro, icon: Users, color: 'text-slate-600', bg: 'bg-slate-500/10' },
                ].map(({ label, value, icon: Icon, color, bg }) => (
                    <div key={label} className="rounded-2xl border border-border/50 bg-card p-5 shadow-card flex flex-col gap-3">
                        <div className={cn('h-9 w-9 flex items-center justify-center rounded-xl', bg)}>
                            <Icon className={cn('h-4 w-4', color)} />
                        </div>
                        <div>
                            <p className="text-2xl font-light text-foreground">{value}</p>
                            <p className="text-[10px] font-normal text-muted-foreground uppercase tracking-[0.15em] mt-0.5">{label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Colaboradores Ranking ──────────────────────────────── */}
            <div className="rounded-2xl border border-border/50 bg-card shadow-card animate-slide-in-up stagger-2">
                <div className="flex items-center justify-between p-5 border-b border-border/30">
                    <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" />
                        <h2 className="text-sm font-light tracking-wide text-foreground">
                            Fechamentos por Colaborador
                            {filterMonth && (
                                <span className="ml-2 text-[10px] text-muted-foreground uppercase tracking-wider">
                                    — {formatMesAno(filterMonth + '-01')}
                                </span>
                            )}
                        </h2>
                    </div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        {filterMonth ? 'mês filtrado' : 'todos os meses'}
                    </p>
                </div>
                {porColaborador.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-muted-foreground text-sm">
                        <Users className="h-8 w-8 mb-2 opacity-30" />
                        Nenhum dado encontrado
                    </div>
                ) : (
                    <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {porColaborador.map(([colab, stats], idx) => {
                            const maxTotal = porColaborador[0]?.[1].total || 1;
                            const pct = Math.round((stats.total / maxTotal) * 100);
                            return (
                                <div
                                    key={colab}
                                    className="flex flex-col gap-2 rounded-xl border border-border/40 bg-muted/20 p-4"
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-[11px] font-light shrink-0">
                                                {idx + 1}
                                            </div>
                                            <span className="text-sm font-light text-foreground truncate">{colab}</span>
                                        </div>
                                        <span className="text-lg font-light text-primary shrink-0">{stats.total}</span>
                                    </div>
                                    {/* progress bar */}
                                    <div className="h-1.5 w-full rounded-full bg-border/40 overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-primary transition-all duration-500"
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground uppercase tracking-wider">
                                        <span className="text-red-600">{stats.total - stats.encerradas - stats.andamento - stats.pendentes} fechadas</span>
                                        {stats.andamento > 0 && <span className="text-blue-600">{stats.andamento} em andamento</span>}
                                        {stats.pendentes > 0 && <span className="text-amber-600">{stats.pendentes} pendentes</span>}
                                        {stats.encerradas > 0 && <span className="text-emerald-600">{stats.encerradas} encerradas</span>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── Filters ────────────────────────────────────────────── */}
            <div className="rounded-2xl border border-border/50 bg-card shadow-card animate-slide-in-up stagger-3 no-print">
                <button
                    className="flex w-full items-center justify-between p-5 border-b border-border/30"
                    onClick={() => setShowFilters(f => !f)}
                >
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-primary" />
                        <h2 className="text-sm font-light tracking-wide text-foreground">Filtros</h2>
                    </div>
                    {showFilters ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </button>

                {showFilters && (
                    <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                            <input
                                type="text"
                                placeholder="Buscar empresa ou colaborador..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="h-10 w-full rounded-xl border border-border/50 bg-background pl-9 pr-4 text-sm font-light placeholder:text-muted-foreground/30 focus:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                            />
                        </div>

                        {/* Month filter */}
                        <div className="relative">
                            <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 pointer-events-none" />
                            <select
                                value={filterMonth}
                                onChange={e => setFilterMonth(e.target.value)}
                                className="h-10 w-full rounded-xl border border-border/50 bg-background pl-9 pr-4 text-sm font-light text-foreground focus:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all appearance-none cursor-pointer"
                            >
                                <option value="">Todos os meses</option>
                                {allMonths.map(m => (
                                    <option key={m} value={m}>{formatMesAno(m + '-01')}</option>
                                ))}
                            </select>
                        </div>

                        {/* Colaborador filter */}
                        <div className="relative">
                            <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 pointer-events-none" />
                            <select
                                value={filterColaborador}
                                onChange={e => setFilterColaborador(e.target.value)}
                                className="h-10 w-full rounded-xl border border-border/50 bg-background pl-9 pr-4 text-sm font-light text-foreground focus:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all appearance-none cursor-pointer"
                            >
                                <option value="">Todos os colaboradores</option>
                                {allColaboradores.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>

                        {/* Status filter */}
                        <div className="flex items-center gap-1 p-1 bg-muted/20 rounded-xl border border-border/50 h-10 lg:col-span-2">
                            {([
                                ['all', 'Todos'],
                                ['closed', 'Encerradas'],
                                ['progress', 'Em Andamento'],
                                ['pending', 'Pendentes'],
                                ['open', 'Fechadas'],
                                ['no_record', 'Sem Registro'],
                            ] as const).map(([val, label]) => (
                                <button
                                    key={val}
                                    onClick={() => setFilterStatus(val)}
                                    className={cn(
                                        'flex-1 rounded-lg text-[10px] uppercase tracking-wider font-normal transition-all h-full px-1',
                                        filterStatus === val
                                            ? 'bg-card text-primary shadow-sm border border-border/10'
                                            : 'text-muted-foreground hover:text-foreground'
                                    )}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>

                        {/* Export No Records Button */}
                        <div className="flex items-center">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={handleExportNoRecordsXLSX}
                                className="h-10 w-full rounded-xl border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 font-light text-[10px] uppercase tracking-wider gap-2 shadow-sm"
                            >
                                <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                                Exportar s/ Registro
                            </Button>
                        </div>

                        {/* Regime filter */}
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 pointer-events-none" />
                            <select
                                value={filterRegime}
                                onChange={e => setFilterRegime(e.target.value)}
                                className="h-10 w-full rounded-xl border border-border/50 bg-background pl-9 pr-4 text-sm font-light text-foreground focus:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all appearance-none cursor-pointer"
                            >
                                <option value="all">Todos os Regimes</option>
                                <option value="simples">Simples Nacional</option>
                                <option value="presumido">Lucro Presumido</option>
                                <option value="real">Lucro Real</option>
                                <option value="domestico">Empregador Doméstico</option>
                            </select>
                        </div>
                    </div>
                )}

                {showFilters && (filterMonth || filterColaborador || filterStatus !== 'all' || searchQuery) && (
                    <div className="px-5 pb-4 flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Filtros ativos:</span>
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="flex items-center gap-1 text-[10px] uppercase tracking-wider px-2 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all"
                            >
                                "{searchQuery}" ✕
                            </button>
                        )}
                        {filterMonth && (
                            <button
                                onClick={() => setFilterMonth('')}
                                className="flex items-center gap-1 text-[10px] uppercase tracking-wider px-2 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all"
                            >
                                {formatMesAno(filterMonth + '-01')} ✕
                            </button>
                        )}
                        {filterColaborador && (
                            <button
                                onClick={() => setFilterColaborador('')}
                                className="flex items-center gap-1 text-[10px] uppercase tracking-wider px-2 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all"
                            >
                                {filterColaborador} ✕
                            </button>
                        )}
                        {filterStatus !== 'all' && (
                            <button
                                onClick={() => setFilterStatus('all')}
                                className="flex items-center gap-1 text-[10px] uppercase tracking-wider px-2 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all"
                            >
                                {filterStatus === 'closed' ? 'Encerradas' : filterStatus === 'progress' ? 'Em Andamento' : filterStatus === 'pending' ? 'Pendentes' : filterStatus === 'no_record' ? 'Sem Registro' : 'Fechadas'} ✕
                            </button>
                        )}
                        {filterRegime !== 'all' && (
                            <button
                                onClick={() => setFilterRegime('all')}
                                className="flex items-center gap-1 text-[10px] uppercase tracking-wider px-2 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all"
                            >
                                {filterRegime === 'simples' ? 'Simples Nacional' : filterRegime === 'presumido' ? 'Lucro Presumido' : filterRegime === 'real' ? 'Lucro Real' : 'Doméstico'} ✕
                            </button>
                        )}
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-[10px] uppercase tracking-wider ml-auto text-muted-foreground hover:text-destructive"
                            onClick={() => { setSearchQuery(''); setFilterMonth(''); setFilterColaborador(''); setFilterStatus('all'); setFilterRegime('all'); }}
                        >
                            Limpar tudo
                        </Button>
                    </div>
                )}
            </div>

            {/* ── Main Table ─────────────────────────────────────────── */}
            <div className="rounded-2xl border border-border/50 bg-card shadow-card overflow-hidden animate-slide-in-up stagger-4">
                <div className="flex items-center justify-between p-5 border-b border-border/30">
                    <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-primary" />
                        <h2 className="text-sm font-light tracking-wide text-foreground">
                            Registros de Fechamento
                        </h2>
                    </div>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        {filteredClosings.length} resultado{filteredClosings.length !== 1 ? 's' : ''}
                    </span>
                </div>

                {filteredClosings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                        <BarChart3 className="h-10 w-10 mb-3 opacity-20" />
                        <p className="text-sm font-light">Nenhum registro encontrado com os filtros aplicados.</p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader className="bg-muted/20">
                            <TableRow className="hover:bg-transparent border-border/40">
                                <TableHead
                                    className="text-[10px] font-normal uppercase tracking-[0.2em] py-4 cursor-pointer select-none hover:text-primary transition-colors"
                                    onClick={() => handleSort('empresa')}
                                >
                                    Empresa <SortIcon field="empresa" />
                                </TableHead>
                                <TableHead
                                    className="text-[10px] font-normal uppercase tracking-[0.2em] py-4 cursor-pointer select-none hover:text-primary transition-colors"
                                    onClick={() => handleSort('mes')}
                                >
                                    Mês / Ano <SortIcon field="mes" />
                                </TableHead>
                                <TableHead
                                    className="text-[10px] font-normal uppercase tracking-[0.2em] py-4 cursor-pointer select-none hover:text-primary transition-colors"
                                    onClick={() => handleSort('colaborador')}
                                >
                                    Colaborador <SortIcon field="colaborador" />
                                </TableHead>
                                <TableHead className="text-[10px] font-normal uppercase tracking-[0.2em] py-4 text-center">Conciliação</TableHead>
                                <TableHead className="text-[10px] font-normal uppercase tracking-[0.2em] py-4 text-center">Lucros</TableHead>
                                <TableHead className="text-[10px] font-normal uppercase tracking-[0.2em] py-4">Status</TableHead>
                                <TableHead className="text-[10px] font-normal uppercase tracking-[0.2em] py-4">Pendências</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredClosings.map((closing) => (
                                <TableRow
                                    key={closing.id}
                                    className={cn(
                                        'border-border/20 hover:bg-muted/20 transition-colors',
                                        closing.id.startsWith('virtual-') && 'bg-slate-500/[0.03]',
                                        closing.empresaEncerrada && 'bg-emerald-500/[0.03]',
                                        closing.empresaEmAndamento && !closing.empresaEncerrada && 'bg-blue-500/[0.03]',
                                        !closing.empresaEncerrada && !closing.empresaEmAndamento && !closing.id.startsWith('virtual-') && closing.pendencias && closing.pendencias.trim() !== '' && 'bg-amber-500/[0.03]',
                                        !closing.empresaEncerrada && !closing.empresaEmAndamento && !closing.id.startsWith('virtual-') && (!closing.pendencias || closing.pendencias.trim() === '') && 'bg-red-500/[0.03]',
                                    )}
                                >
                                    <TableCell className="py-4">
                                        <div>
                                            <p className="text-sm font-light text-foreground">{closing.clientRazaoSocial}</p>
                                            <p className="text-[10px] text-muted-foreground mt-0.5">{closing.clientCnpj}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4">
                                        <span className="text-sm font-light text-foreground">{formatMesAno(closing.mesAnoFechamento)}</span>
                                    </TableCell>
                                    <TableCell className="py-4">
                                        <span className="text-sm font-light text-foreground">{closing.colaboradorResponsavel}</span>
                                    </TableCell>
                                    <TableCell className="text-center py-4">
                                        <span className={closing.conciliacaoContabil ? 'text-emerald-600' : 'text-red-400'}>
                                            {closing.conciliacaoContabil ? '✓' : '✗'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-center py-4">
                                        <span className={closing.controleLucros ? 'text-emerald-600' : 'text-red-400'}>
                                            {closing.controleLucros ? '✓' : '✗'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="py-4">
                                        <StatusBadge closing={closing} />
                                    </TableCell>
                                    <TableCell className="py-4 max-w-[200px]">
                                        {closing.pendencias && closing.pendencias.trim() !== '' ? (
                                            <p className="text-xs text-amber-700 truncate" title={closing.pendencias}>
                                                {closing.pendencias}
                                            </p>
                                        ) : (
                                            <span className="text-[10px] text-muted-foreground/40">—</span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>

            {/* ── Empresas sem nenhum fechamento ─────────────────────── */}
            {clientsWithoutAnyClosing.length > 0 && (filterStatus === 'all' || filterStatus === 'open') && !filterMonth && !filterColaborador && !searchQuery && (
                <div className="rounded-2xl border border-border/50 bg-card shadow-card overflow-hidden animate-slide-in-up stagger-5 no-print">
                    <div className="flex items-center gap-2 p-5 border-b border-border/30">
                        <Clock className="h-4 w-4 text-slate-500" />
                        <h2 className="text-sm font-light tracking-wide text-foreground">
                            Empresas Sem Nenhum Registro de Fechamento
                        </h2>
                        <span className="ml-auto text-[10px] text-muted-foreground uppercase tracking-wider">
                            {clientsWithoutAnyClosing.length} empresa{clientsWithoutAnyClosing.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                    <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {clientsWithoutAnyClosing.map(cl => (
                            <div
                                key={cl.id}
                                className="flex items-center gap-3 rounded-xl border border-border/40 bg-muted/20 px-4 py-3"
                            >
                                <div className="h-8 w-8 flex items-center justify-center rounded-full bg-slate-500/10 text-slate-500 shrink-0">
                                    <Building2 className="h-4 w-4" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-light text-foreground truncate">{cl.nomeFantasia || cl.razaoSocial}</p>
                                    <p className="text-[10px] text-muted-foreground">{cl.cnpj}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
