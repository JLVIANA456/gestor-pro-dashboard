import { useState, useEffect } from 'react';
import { useClients } from '@/hooks/useClients';
import { useFiscal, FiscalReportItem } from '@/hooks/useFiscal';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
    Search,
    Loader2,
    Filter,
    FileSpreadsheet,
    Building2,
    Calendar,
    User,
    CheckCircle2,
    Clock,
    AlertCircle,
    TrendingUp,
    BarChart3,
    ArrowUpRight,
    ArrowDownRight,
    Hash
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import * as XLSX from 'xlsx';
import { cn } from '@/lib/utils';

export default function FiscalProgress() {
    const { clients } = useClients();
    const { fetchAllClosings, loading } = useFiscal();
    const [closings, setClosings] = useState<FiscalReportItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterMonth, setFilterMonth] = useState<string>('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterColaborador, setFilterColaborador] = useState<string>('all');

    useEffect(() => {
        const loadData = async () => {
            const data = await fetchAllClosings();
            setClosings(data);
        };
        loadData();
    }, []);

    const filteredClosings = closings.filter(item => {
        const matchesSearch = 
            item.clientRazaoSocial.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.clientCnpj.includes(searchQuery) ||
            item.colaboradorResponsavel.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesMonth = filterMonth ? item.mesAnoFechamento.startsWith(filterMonth) : true;
        
        const matchesStatus = filterStatus === 'all' 
            ? true 
            : filterStatus === 'closed' 
                ? item.empresaEncerrada 
                : filterStatus === 'ongoing'
                    ? item.empresaEmAndamento
                    : !item.empresaEncerrada && !item.empresaEmAndamento;
        
        const matchesColaborador = filterColaborador === 'all' 
            ? true 
            : item.colaboradorResponsavel === filterColaborador;

        return matchesSearch && matchesMonth && matchesStatus && matchesColaborador;
    });

    const uniqueColaboradores = Array.from(new Set(closings.map(c => c.colaboradorResponsavel))).sort();

    // KPI Calculations
    const totalCompanies = clients.length;
    const closedCompanies = closings.filter(c => c.empresaEncerrada).length;
    const ongoingCompanies = closings.filter(c => c.empresaEmAndamento).length;
    const pendingCompanies = totalCompanies - closedCompanies;
    const percentageClosed = totalCompanies > 0 ? (closedCompanies / totalCompanies) * 100 : 0;

    const exportToExcel = () => {
        const dataToExport = filteredClosings.map(item => ({
            'Cliente': item.clientRazaoSocial,
            'CNPJ': item.clientCnpj,
            'Mês/Ano': item.mesAnoFechamento,
            'Responsável': item.colaboradorResponsavel,
            'Escrituração Fiscal': item.escrituracaoFiscal ? 'Sim' : 'Não',
            'Apuração Impostos': item.apuracaoImpostos ? 'Sim' : 'Não',
            'Obrigações': item.entregaObrigacoes ? 'Sim' : 'Não',
            'Conferência Geral': item.conferenciaGeral ? 'Sim' : 'Não',
            'Status': item.empresaEncerrada ? 'Encerrada' : item.empresaEmAndamento ? 'Em Andamento' : 'Pendente',
            'Pendências': item.pendencias || '-'
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Fechamentos Fiscais');
        XLSX.writeFile(workbook, `Fechamentos_Fiscais_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    // Empresas que não têm NENHUM fechamento registrado (nem pendente)
    const clientsWithClosingIds = new Set(closings.map(c => c.clientId));
    const clientsWithoutAnyClosing = clients.filter(cl => !clientsWithClosingIds.has(cl.id));

    if (loading && closings.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-screen gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-sm font-light text-muted-foreground uppercase tracking-widest">Carregando Dashboard Fiscal...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-slide-in-up no-print">
                <div>
                    <h1 className="text-4xl font-light tracking-tight text-foreground">Acompanhamento <span className="text-primary font-normal">Fiscal</span></h1>
                    <p className="text-xs font-normal text-muted-foreground uppercase tracking-[0.3em] mt-2">Visão geral do progresso de fechamento por competência</p>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => window.print()}
                        className="flex items-center gap-2 px-6 h-12 rounded-2xl bg-white border border-border/50 text-foreground text-xs font-medium uppercase tracking-widest hover:bg-muted/50 transition-all shadow-sm"
                    >
                        Imprimir Relatório
                    </button>
                    <button 
                        onClick={exportToExcel}
                        className="flex items-center gap-2 px-6 h-12 rounded-2xl bg-primary text-white text-xs font-medium uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                    >
                        <FileSpreadsheet className="h-4 w-4" />
                        Exportar Excel
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-in-up stagger-1">
                <Card className="rounded-[2.5rem] border-none bg-white shadow-elevated overflow-hidden group">
                    <CardContent className="p-8">
                        <div className="flex items-center justify-between">
                            <div className="h-14 w-14 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-500">
                                <Building2 className="h-7 w-7" />
                            </div>
                            <Badge variant="outline" className="rounded-lg border-primary/10 text-primary text-[10px] uppercase font-bold px-2 py-0.5">Total</Badge>
                        </div>
                        <div className="mt-6">
                            <h3 className="text-sm font-light text-muted-foreground uppercase tracking-widest">Empresas Ativas</h3>
                            <div className="flex items-baseline gap-2 mt-1">
                                <span className="text-5xl font-light tracking-tighter text-foreground">{totalCompanies}</span>
                                <span className="text-xs text-muted-foreground/40 font-light">unidades</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-[2.5rem] border-none bg-white shadow-elevated overflow-hidden group">
                    <CardContent className="p-8">
                        <div className="flex items-center justify-between">
                            <div className="h-14 w-14 rounded-2xl bg-emerald-500/5 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform duration-500">
                                <CheckCircle2 className="h-7 w-7" />
                            </div>
                            <div className="flex items-center gap-1 text-emerald-500 font-medium text-sm">
                                <ArrowUpRight className="h-4 w-4" />
                                {percentageClosed.toFixed(0)}%
                            </div>
                        </div>
                        <div className="mt-6">
                            <h3 className="text-sm font-light text-muted-foreground uppercase tracking-widest">Encerradas</h3>
                            <div className="flex items-baseline gap-2 mt-1">
                                <span className="text-5xl font-light tracking-tighter text-emerald-600">{closedCompanies}</span>
                                <div className="h-1.5 w-24 bg-muted/30 rounded-full overflow-hidden ml-2">
                                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${percentageClosed}%` }} />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-[2.5rem] border-none bg-white shadow-elevated overflow-hidden group">
                    <CardContent className="p-8">
                        <div className="flex items-center justify-between">
                            <div className="h-14 w-14 rounded-2xl bg-blue-500/5 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform duration-500">
                                <Clock className="h-7 w-7" />
                            </div>
                            <Badge variant="outline" className="rounded-lg border-blue-200 text-blue-600 text-[10px] uppercase font-bold px-2 py-0.5">Em Foco</Badge>
                        </div>
                        <div className="mt-6">
                            <h3 className="text-sm font-light text-muted-foreground uppercase tracking-widest">Em Andamento</h3>
                            <div className="flex items-baseline gap-2 mt-1">
                                <span className="text-5xl font-light tracking-tighter text-blue-600">{ongoingCompanies}</span>
                                <span className="text-xs text-muted-foreground/40 font-light">processando</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-[2.5rem] border-none bg-white shadow-elevated overflow-hidden group">
                    <CardContent className="p-8">
                        <div className="flex items-center justify-between">
                            <div className="h-14 w-14 rounded-2xl bg-amber-500/5 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform duration-500">
                                <AlertCircle className="h-7 w-7" />
                            </div>
                            <div className="flex items-center gap-1 text-amber-500 font-medium text-sm">
                                <ArrowDownRight className="h-4 w-4" />
                                {totalCompanies > 0 ? ((pendingCompanies / totalCompanies) * 100).toFixed(0) : 0}%
                            </div>
                        </div>
                        <div className="mt-6">
                            <h3 className="text-sm font-light text-muted-foreground uppercase tracking-widest">Pendentes</h3>
                            <div className="flex items-baseline gap-2 mt-1">
                                <span className="text-5xl font-light tracking-tighter text-amber-600">{pendingCompanies}</span>
                                <span className="text-xs text-muted-foreground/40 font-light">restantes</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filter Bar */}
            <div className="rounded-[2rem] border border-border/50 bg-white p-5 flex flex-col gap-6 lg:flex-row lg:items-center animate-slide-in-up stagger-2 no-print shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/40" />
                    <input
                        type="text"
                        placeholder="Filtrar por cliente, responsável ou CNPJ..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-12 w-full rounded-2xl border border-border/50 bg-muted/10 pl-12 pr-4 text-sm font-light focus:bg-white focus:border-primary/30 focus:outline-none transition-all"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="h-10 w-10 rounded-xl bg-muted/30 flex items-center justify-center text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                        </div>
                        <Input
                            type="month"
                            value={filterMonth}
                            onChange={(e) => setFilterMonth(e.target.value)}
                            className="h-12 w-44 rounded-2xl border-border/50 bg-muted/10 text-xs font-medium uppercase transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="h-10 w-10 rounded-xl bg-muted/30 flex items-center justify-center text-muted-foreground">
                            <User className="h-4 w-4" />
                        </div>
                        <Select value={filterColaborador} onValueChange={setFilterColaborador}>
                            <SelectTrigger className="h-12 w-48 rounded-2xl border-border/50 bg-muted/10 text-xs font-medium uppercase">
                                <SelectValue placeholder="Colaborador" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-border shadow-elevated">
                                <SelectItem value="all" className="text-xs uppercase">Todos Responsáveis</SelectItem>
                                {uniqueColaboradores.map(name => (
                                    <SelectItem key={name} value={name} className="text-xs uppercase">{name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="h-10 w-10 rounded-xl bg-muted/30 flex items-center justify-center text-muted-foreground">
                            <Filter className="h-4 w-4" />
                        </div>
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger className="h-12 w-48 rounded-2xl border-border/50 bg-muted/10 text-xs font-medium uppercase">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-border shadow-elevated">
                                <SelectItem value="all" className="text-xs uppercase">Todos os Status</SelectItem>
                                <SelectItem value="closed" className="text-xs uppercase">Encerradas</SelectItem>
                                <SelectItem value="ongoing" className="text-xs uppercase">Em Andamento</SelectItem>
                                <SelectItem value="pending" className="text-xs uppercase">Pendentes</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Results Table */}
            <div className="rounded-[2.5rem] border border-border/50 bg-white shadow-card overflow-hidden animate-slide-in-up stagger-3">
                <div className="flex items-center justify-between p-8 border-b border-border/30">
                    <div>
                        <h2 className="text-xl font-light text-foreground">Fechamentos Registrados</h2>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Dados detalhados por período e cliente</p>
                    </div>
                    <Badge variant="secondary" className="bg-muted/10 text-muted-foreground border-none px-4 py-1.5 rounded-xl uppercase tracking-widest text-[10px]">
                        {filteredClosings.length} registros
                    </Badge>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-muted/5">
                            <TableRow className="hover:bg-transparent border-border/30">
                                <TableHead className="pl-8 py-6 text-[10px] font-bold uppercase tracking-widest">Cliente</TableHead>
                                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-center">Competência</TableHead>
                                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest">Responsável</TableHead>
                                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-center">Escrituração</TableHead>
                                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-center">Apuração</TableHead>
                                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-center">Obrigações</TableHead>
                                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-center">Conferência</TableHead>
                                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-center">Status</TableHead>
                                <TableHead className="pr-8 py-6 text-[10px] font-bold uppercase tracking-widest">Pendências</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredClosings.map((closing) => (
                                <TableRow key={closing.id} className="group hover:bg-muted/10 transition-colors border-border/30">
                                    <TableCell className="pl-8 py-5">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{closing.clientRazaoSocial}</span>
                                            <span className="text-[10px] text-muted-foreground/60 mt-0.5 tracking-tight">{closing.clientCnpj}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-5 text-center">
                                        <Badge variant="outline" className="rounded-lg text-[10px] font-medium border-border/50 uppercase">
                                            {closing.mesAnoFechamento}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="py-5">
                                        <div className="flex items-center gap-2">
                                            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] text-primary font-bold">
                                                {closing.colaboradorResponsavel.substring(0, 1)}
                                            </div>
                                            <span className="text-xs text-muted-foreground">{closing.colaboradorResponsavel}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-5 text-center">
                                        <div className="flex justify-center">
                                            {closing.escrituracaoFiscal ? (
                                                <div className="h-5 w-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                                </div>
                                            ) : (
                                                <div className="h-5 w-5 rounded-full bg-muted/30 flex items-center justify-center text-muted-foreground/30">
                                                    <Clock className="h-3.5 w-3.5" />
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-5 text-center">
                                        <div className="flex justify-center">
                                            {closing.apuracaoImpostos ? (
                                                <div className="h-5 w-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                                </div>
                                            ) : (
                                                <div className="h-5 w-5 rounded-full bg-muted/30 flex items-center justify-center text-muted-foreground/30">
                                                    <Clock className="h-3.5 w-3.5" />
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-5 text-center">
                                        <div className="flex justify-center">
                                            {closing.entregaObrigacoes ? (
                                                <div className="h-5 w-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                                </div>
                                            ) : (
                                                <div className="h-5 w-5 rounded-full bg-muted/30 flex items-center justify-center text-muted-foreground/30">
                                                    <Clock className="h-3.5 w-3.5" />
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-5 text-center">
                                        <div className="flex justify-center">
                                            {closing.conferenciaGeral ? (
                                                <div className="h-5 w-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                                </div>
                                            ) : (
                                                <div className="h-5 w-5 rounded-full bg-muted/30 flex items-center justify-center text-muted-foreground/30">
                                                    <Clock className="h-3.5 w-3.5" />
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-5 text-center">
                                        {closing.empresaEncerrada ? (
                                            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200 text-[10px] px-3 py-1 rounded-xl uppercase tracking-tighter font-bold">ENCERRADA</Badge>
                                        ) : closing.empresaEmAndamento ? (
                                            <Badge className="bg-blue-500/10 text-blue-600 border-blue-200 text-[10px] px-3 py-1 rounded-xl uppercase tracking-tighter font-bold">EM ANDAMENTO</Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-[10px] px-3 py-1 rounded-xl uppercase tracking-tighter text-muted-foreground/60 border-border/50">PENDENTE</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="pr-8 py-5 max-w-[200px]">
                                        {closing.pendencias && closing.pendencias.trim() !== '' ? (
                                            <p className="text-xs text-amber-700 truncate font-light italic" title={closing.pendencias}>
                                                "{closing.pendencias}"
                                            </p>
                                        ) : (
                                            <span className="text-[10px] text-muted-foreground/20">—</span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {filteredClosings.length === 0 && (
                        <div className="py-20 flex flex-col items-center justify-center text-muted-foreground/40">
                            <BarChart3 className="h-16 w-16 mb-4 opacity-10" />
                            <p className="text-lg font-light tracking-widest uppercase">Nenhum dado encontrado com os filtros atuais</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Empresas sem nenhum fechamento */}
            {clientsWithoutAnyClosing.length > 0 && (filterStatus === 'all' || filterStatus === 'pending') && !filterMonth && !filterColaborador && !searchQuery && (
                <div className="rounded-[2.5rem] border border-border/50 bg-white shadow-card overflow-hidden animate-slide-in-up stagger-4 no-print">
                    <div className="flex items-center gap-3 p-8 border-b border-border/30">
                        <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                            <Hash className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-light text-foreground">Aguardando Início do Fechamento</h2>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">Empresas ativas sem registros no mês selecionado</p>
                        </div>
                        <span className="ml-auto text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-lg">
                            {clientsWithoutAnyClosing.length} empresas
                        </span>
                    </div>
                    <div className="p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {clientsWithoutAnyClosing.map(cl => (
                            <div
                                key={cl.id}
                                className="flex items-center gap-4 rounded-2xl border border-border/30 bg-muted/[0.05] px-5 py-4 hover:border-primary/20 transition-colors group cursor-default"
                            >
                                <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-white border border-border/50 text-slate-400 group-hover:text-primary transition-colors">
                                    <Building2 className="h-5 w-5" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">{cl.nomeFantasia || cl.razaoSocial}</p>
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest opacity-60">ID: {cl.cnpj.substring(0, 8)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
