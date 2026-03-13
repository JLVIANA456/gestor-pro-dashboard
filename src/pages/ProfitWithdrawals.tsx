import { useState, useMemo } from 'react';
import {
    Plus,
    Search,
    Filter,
    Upload,
    Download,
    MoreHorizontal,
    Banknote,
    Edit,
    Trash2,
    Loader2,
    LayoutGrid,
    List,
    FileSpreadsheet,
    ArrowUpDown,
    Building2,
    Calendar,
    DollarSign,
    User,
    BarChart3,
    Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useProfitWithdrawals, type ProfitWithdrawal } from '@/hooks/useProfitWithdrawals';
import { useClients } from '@/hooks/useClients';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ProfitWithdrawalFormDialog } from '@/components/profit-withdrawals/ProfitWithdrawalFormDialog';
import { ProfitWithdrawalImportDialog } from '@/components/profit-withdrawals/ProfitWithdrawalImportDialog';
import { ProfitWithdrawalReportDialog } from '@/components/profit-withdrawals/ProfitWithdrawalReportDialog';
import * as XLSX from 'xlsx';

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

export default function ProfitWithdrawals() {
    const { withdrawals, loading, error, createWithdrawal, updateWithdrawal, deleteWithdrawal, importWithdrawals } = useProfitWithdrawals();
    const { clients } = useClients();

    const [selectedMes, setSelectedMes] = useState(getCurrentMesAno());
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [isReportOpen, setIsReportOpen] = useState(false);
    const [selectedWithdrawal, setSelectedWithdrawal] = useState<ProfitWithdrawal | null>(null);

    // Filtra retiradas pelo mês selecionado e pela busca
    const filteredWithdrawals = useMemo(() => {
        return withdrawals.filter((w) => {
            // Filtro de mês: withdrawal_date está em formato YYYY-MM-DD
            if (selectedMes && w.withdrawal_date) {
                const wMonth = w.withdrawal_date.substring(0, 7); // YYYY-MM
                if (wMonth !== selectedMes) return false;
            }

            const clientName = (w.client?.nome_fantasia || w.client?.razao_social || '').toLowerCase();
            const partnerName = (w.partner_name || '').toLowerCase();
            const partnerCpf = w.partner_cpf || '';
            const search = searchQuery.toLowerCase();

            return clientName.includes(search) ||
                partnerName.includes(search) ||
                partnerCpf.includes(search) ||
                (w.bank || '').toLowerCase().includes(search);
        });
    }, [withdrawals, searchQuery, selectedMes]);

    // KPIs calculados sobre o mês selecionado
    const kpis = useMemo(() => {
        // Total do mês (todas as empresas) - Ignora busca
        const monthTotalAll = withdrawals
            .filter(w => !selectedMes || w.withdrawal_date?.substring(0, 7) === selectedMes)
            .reduce((sum, w) => sum + w.amount, 0);

        // Total filtrado (o que está na busca/selecionado)
        const totalAmount = filteredWithdrawals.reduce((sum, w) => sum + w.amount, 0);
        
        const count = filteredWithdrawals.length;
        const uniquePartners = new Set(filteredWithdrawals.map(w => w.partner_cpf)).size;
        const uniqueClients = new Set(filteredWithdrawals.map(w => w.client_id)).size;

        return { monthTotalAll, totalAmount, count, uniquePartners, uniqueClients };
    }, [withdrawals, filteredWithdrawals, selectedMes]);

    const handleEdit = (withdrawal: ProfitWithdrawal) => {
        setSelectedWithdrawal(withdrawal);
        setIsFormOpen(true);
    };

    const handleNew = () => {
        setSelectedWithdrawal(null);
        setIsFormOpen(true);
    };

    const downloadTemplate = () => {
        const template = [
            {
                'Nome do Sócio': 'João Silva',
                'CPF do Sócio': '000.000.000-00',
                'Data da Retirada (DD-MM-AAAA)': '05-03-2024',
                'Valor': 1500.00,
                'REINF': 'mensal',
                'Observações': 'Retirada mensal antecipada'
            },
            {
                'Nome do Sócio': 'Maria Santos',
                'CPF do Sócio': '111.111.111-11',
                'Data da Retirada (DD-MM-AAAA)': '05-03-2024',
                'Valor': 2000.00,
                'REINF': 'trimestral',
                'Observações': ''
            }
        ];

        const ws = XLSX.utils.json_to_sheet(template);

        // Ajustar largura das colunas
        ws['!cols'] = [
            { wch: 25 }, // Nome do Sócio
            { wch: 20 }, // CPF do Sócio
            { wch: 30 }, // Data da Retirada
            { wch: 12 }, // Valor
            { wch: 15 }, // REINF
            { wch: 30 }, // Observações
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Retiradas');
        XLSX.writeFile(wb, 'modelo_retirada_lucro.xlsx');
    };

    if (loading && withdrawals.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <Banknote className="h-12 w-12 text-destructive/40" />
                <h3 className="text-lg font-light text-foreground">Erro ao carregar retiradas</h3>
                <p className="text-sm text-muted-foreground font-light text-center max-w-md">{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header / Toolbar */}
            <div className="flex flex-col gap-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 flex items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 shadow-sm">
                            <Banknote className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-light tracking-tight text-foreground">
                                Retiradas de <span className="font-light text-primary">Lucro</span>
                            </h2>
                            <p className="text-xs text-muted-foreground font-light uppercase tracking-widest">Controle de Retiradas dos Sócios</p>
                        </div>
                    </div>
                </div>

                {/* KPI Summary Banner */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-card border border-border/50 p-6 rounded-3xl shadow-card relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                        <BarChart3 className="h-24 w-24 text-primary" />
                    </div>
                    
                    <div className="lg:col-span-4 space-y-6">
                        <div className="space-y-1">
                            <h3 className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">Total Retirado no Mês <span className="text-[8px] opacity-70">(Todas as Empresas)</span></h3>
                            <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-light text-primary">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(kpis.monthTotalAll)}
                                </span>
                            </div>
                        </div>

                        {searchQuery && (
                            <div className="space-y-1 animate-in fade-in slide-in-from-left-2 duration-500">
                                <h3 className="text-[10px] font-medium uppercase tracking-[0.2em] text-emerald-600/80">Total da Busca / Empresa</h3>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-xl font-light text-emerald-600">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(kpis.totalAmount)}
                                    </span>
                                </div>
                            </div>
                        )}
                        
                        {!searchQuery && (
                            <div className="h-1.5 w-full rounded-full bg-muted/50 overflow-hidden mt-4">
                                <div className="h-full bg-primary/40 animate-pulse-slow" style={{ width: '100%' }} />
                            </div>
                        )}
                        <p className="text-[10px] text-muted-foreground font-light uppercase tracking-widest">Mês de Referência: <span className="font-medium text-foreground/60">{formatMesAno(selectedMes)}</span></p>
                    </div>

                    <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-4 pl-0 lg:pl-6 lg:border-l border-border/30">
                        {[
                            { label: 'Total Retiradas', value: kpis.count, icon: Banknote, color: 'text-blue-500', bg: 'bg-blue-500/5' },
                            { label: 'Sócios Beneficiados', value: kpis.uniquePartners, icon: User, color: 'text-emerald-500', bg: 'bg-emerald-500/5' },
                            { label: 'Empresas Atendidas', value: kpis.uniqueClients, icon: Building2, color: 'text-amber-500', bg: 'bg-amber-500/5' },
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
                
                {/* Sidebar: Filters & Actions */}
                <aside className="xl:col-span-3 space-y-6">
                    <div className="bg-card border border-border/50 rounded-3xl p-6 shadow-sm space-y-8">
                        {/* Search */}
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-light uppercase tracking-widest text-primary">Pesquisar</h4>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                                <input
                                    type="text"
                                    placeholder="Empresa, Sócio ou CPF..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="h-10 w-full rounded-xl border border-border/50 bg-muted/20 pl-9 pr-4 text-xs font-light placeholder:text-muted-foreground/30 focus:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                                />
                            </div>
                        </div>

                        {/* View Mode Switch */}
                        <div className="space-y-3">
                            <h4 className="text-[10px] font-light uppercase tracking-widest text-primary">Visualização</h4>
                            <div className="flex items-center gap-1.5 p-1 bg-muted/30 rounded-xl border border-border/50">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={cn(
                                        "flex items-center justify-center gap-2 flex-1 py-1.5 rounded-lg transition-all text-[10px] uppercase font-light tracking-widest",
                                        viewMode === 'grid' ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <LayoutGrid className="h-3 w-3" /> Grade
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={cn(
                                        "flex items-center justify-center gap-2 flex-1 py-1.5 rounded-lg transition-all text-[10px] uppercase font-light tracking-widest",
                                        viewMode === 'list' ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <List className="h-3 w-3" /> Lista
                                </button>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="pt-6 border-t border-border/50 space-y-3">
                            <h4 className="text-[10px] font-light uppercase tracking-widest text-primary mb-1">Ações</h4>
                            
                            <Button
                                onClick={handleNew}
                                className="w-full h-10 rounded-xl shadow-sm shadow-primary/10 font-light text-[10px] uppercase tracking-widest"
                            >
                                <Plus className="mr-2 h-3.5 w-3.5" /> Nova Retirada
                            </Button>

                            <div className="grid grid-cols-2 gap-2">
                                <Button variant="outline" size="sm" onClick={downloadTemplate} className="text-[9px] uppercase font-light tracking-widest h-9 rounded-xl border-border/50 text-muted-foreground hover:bg-muted/50">
                                    <Download className="mr-1.5 h-3 w-3 opacity-60" /> Modelo
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => setIsImportOpen(true)} className="text-[9px] uppercase font-light tracking-widest h-9 rounded-xl border-border/50 text-muted-foreground hover:bg-muted/50">
                                    <Upload className="mr-1.5 h-3 w-3 opacity-60" /> Importar
                                </Button>
                            </div>

                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => setIsReportOpen(true)}
                                className="w-full text-[10px] uppercase font-light tracking-widest h-10 rounded-xl border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/5"
                            >
                                <BarChart3 className="mr-2 h-3.5 w-3.5" /> Relatório Detalhado
                            </Button>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="xl:col-span-9 space-y-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
                            <Loader2 className="h-8 w-8 animate-spin opacity-30" />
                            <p className="text-sm font-light uppercase tracking-widest">Carregando dados...</p>
                        </div>
                    ) : filteredWithdrawals.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border py-20 bg-card/30">
                            <Banknote className="h-16 w-16 text-muted-foreground/20 mb-4" />
                            <p className="text-sm font-light text-muted-foreground">Nenhuma retirada encontrada para este período.</p>
                            <Button onClick={handleNew} variant="outline" className="mt-8 rounded-xl font-light text-[10px] uppercase tracking-widest px-8">
                                Registrar Primeira Retirada
                            </Button>
                        </div>
                    ) : viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 animate-slide-in-up">
                            {filteredWithdrawals.map((w, index) => (
                                <div
                                    key={w.id}
                                    className="group relative rounded-2xl border border-border/50 bg-card p-6 shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1"
                                    style={{ animationDelay: `${index * 30}ms` }}
                                >
                                    <div className="absolute right-4 top-4 hover:scale-105 transition-transform z-10">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 transition-colors">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="bg-card border-border rounded-xl shadow-elevated p-1">
                                                <DropdownMenuItem onClick={() => handleEdit(w)} className="rounded-lg gap-2 cursor-pointer font-light text-[10px] uppercase tracking-wider">
                                                    <Edit className="h-3.5 w-3.5 text-blue-500" /> Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-destructive focus:text-destructive rounded-lg gap-2 cursor-pointer font-light text-[10px] uppercase tracking-wider"
                                                    onClick={() => deleteWithdrawal(w.id)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" /> Excluir
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    <div className="flex flex-col h-full space-y-5">
                                        <div className="flex items-start gap-4">
                                            <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-primary/5 border border-primary/10">
                                                <User className="h-5 w-5 text-primary/60" />
                                            </div>
                                            <div className="min-w-0 pr-4">
                                                <h3 className="font-light text-base text-foreground truncate group-hover:text-primary transition-colors leading-tight">
                                                    {w.partner_name}
                                                </h3>
                                                <p className="text-[10px] font-light text-muted-foreground uppercase mt-0.5">
                                                    CPF: {w.partner_cpf}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-4 pt-2">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[9px] font-light text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                                                    <Building2 className="h-3 w-3 opacity-40" /> Empresa
                                                </span>
                                                <p className="text-xs font-light text-foreground truncate">{w.client?.nome_fantasia || w.client?.razao_social}</p>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[9px] font-light text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                                                        <Calendar className="h-3 w-3 opacity-40" /> Data
                                                    </span>
                                                    <p className="text-xs font-light text-foreground">
                                                        {w.withdrawal_date ? format(new Date(w.withdrawal_date), 'dd/MM/yyyy') : '-'}
                                                    </p>
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[9px] font-light text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                                                        <Layers className="h-3 w-3 opacity-40" /> REINF
                                                    </span>
                                                    <p className="text-xs font-light text-foreground uppercase">
                                                        {w.bank || '—'}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-1 pt-2 border-t border-border/10">
                                                <span className="text-[9px] font-light text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                                                    <DollarSign className="h-3 w-3 opacity-40" /> Valor
                                                </span>
                                                <p className="text-sm font-light text-emerald-600">
                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(w.amount)}
                                                </p>
                                            </div>
                                        </div>

                                        {w.observations && (
                                            <div className="mt-2 p-3 rounded-xl bg-muted/20 border border-border/30">
                                                <p className="text-[10px] font-light text-muted-foreground italic line-clamp-2">“{w.observations}”</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-border/50 bg-card overflow-hidden shadow-card">
                            <Table>
                                <TableHeader className="bg-muted/20">
                                    <TableRow className="hover:bg-transparent border-border/40">
                                        <TableHead className="text-[10px] font-light uppercase tracking-[0.1em] py-4 pl-6">Sócio</TableHead>
                                        <TableHead className="text-[10px] font-light uppercase tracking-[0.1em] py-4">Empresa</TableHead>
                                        <TableHead className="text-[10px] font-light uppercase tracking-[0.1em] py-4 text-center">Data</TableHead>
                                        <TableHead className="text-[10px] font-light uppercase tracking-[0.1em] py-4 text-center">REINF</TableHead>
                                        <TableHead className="text-[10px] font-light uppercase tracking-[0.1em] py-4 text-right">Valor</TableHead>
                                        <TableHead className="text-[10px] font-light uppercase tracking-[0.1em] py-4 text-center pr-6">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredWithdrawals.map((w) => (
                                        <TableRow key={w.id} className="group border-border/30 hover:bg-muted/10 transition-colors">
                                            <TableCell className="py-4 pl-6">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-light text-foreground">{w.partner_name}</span>
                                                    <span className="text-[9px] text-muted-foreground uppercase font-light tracking-tighter">{w.partner_cpf}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-xs font-light text-muted-foreground">{w.client?.nome_fantasia || w.client?.razao_social}</span>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span className="text-xs font-light text-muted-foreground italic">
                                                    {w.withdrawal_date ? format(new Date(w.withdrawal_date), 'dd/MM/yyyy') : '-'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span className="text-[10px] font-light text-muted-foreground uppercase tracking-widest">
                                                    {w.bank || '—'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <span className="text-sm font-light text-emerald-600">
                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(w.amount)}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-4 text-center pr-6">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <button className="h-8 w-8 inline-flex items-center justify-center rounded-lg hover:bg-muted transition-colors text-muted-foreground/40 hover:text-muted-foreground">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="bg-card border-border rounded-xl shadow-elevated p-1">
                                                        <DropdownMenuItem onClick={() => handleEdit(w)} className="rounded-lg gap-2 cursor-pointer font-light text-[10px] uppercase tracking-wider">
                                                            <Edit className="h-3.5 w-3.5 text-blue-500" /> Editar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="text-destructive focus:text-destructive rounded-lg gap-2 cursor-pointer font-light text-[10px] uppercase tracking-wider"
                                                            onClick={() => deleteWithdrawal(w.id)}
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" /> Excluir
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </main>
            </div>

            {/* Dialogs */}
            <ProfitWithdrawalFormDialog
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
                withdrawal={selectedWithdrawal}
                clients={clients}
                onSave={async (data) => {
                    if (selectedWithdrawal) {
                        await updateWithdrawal(selectedWithdrawal.id, data);
                    } else {
                        await createWithdrawal(data as any);
                    }
                    setIsFormOpen(false);
                }}
            />

            <ProfitWithdrawalImportDialog
                open={isImportOpen}
                onOpenChange={setIsImportOpen}
                onImport={importWithdrawals}
                clients={clients}
            />

            <ProfitWithdrawalReportDialog
                open={isReportOpen}
                onOpenChange={setIsReportOpen}
                withdrawals={withdrawals}
                clients={clients}
            />
        </div>
    );
}
