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

export default function ProfitWithdrawals() {
    const { withdrawals, loading, error, createWithdrawal, updateWithdrawal, deleteWithdrawal, importWithdrawals } = useProfitWithdrawals();
    const { clients } = useClients();

    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [isReportOpen, setIsReportOpen] = useState(false);
    const [selectedWithdrawal, setSelectedWithdrawal] = useState<ProfitWithdrawal | null>(null);

    const filteredWithdrawals = useMemo(() => {
        return withdrawals.filter((w) => {
            const clientName = (w.client?.nome_fantasia || w.client?.razao_social || '').toLowerCase();
            const partnerName = (w.partner_name || '').toLowerCase();
            const partnerCpf = w.partner_cpf || '';
            const search = searchQuery.toLowerCase();

            return clientName.includes(search) ||
                partnerName.includes(search) ||
                partnerCpf.includes(search) ||
                (w.bank || '').toLowerCase().includes(search);
        });
    }, [withdrawals, searchQuery]);

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
                'Banco': 'Itaú',
                'Observações': 'Retirada mensal antecipada'
            },
            {
                'Nome do Sócio': 'Maria Santos',
                'CPF do Sócio': '111.111.111-11',
                'Data da Retirada (DD-MM-AAAA)': '05-03-2024',
                'Valor': 2000.00,
                'Banco': 'PIX',
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
            { wch: 15 }, // Banco
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
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-slide-in-up">
                <div>
                    <h1 className="text-3xl font-light tracking-tight text-foreground">Retirada de Lucro</h1>
                    <p className="text-xs font-normal text-muted-foreground uppercase tracking-[0.2em] mt-1">Controle mensal de retiradas dos sócios</p>
                </div>
                <div className="flex gap-3 flex-wrap">
                    <Button variant="outline" onClick={downloadTemplate} className="rounded-xl border-border/50 hover:bg-muted/50 font-light text-xs uppercase tracking-wider">
                        <Download className="mr-2 h-4 w-4 opacity-60" />
                        Modelo
                    </Button>
                    <Button variant="outline" onClick={() => setIsImportOpen(true)} className="rounded-xl border-border/50 hover:bg-muted/50 font-light text-xs uppercase tracking-wider">
                        <Upload className="mr-2 h-4 w-4 opacity-60" />
                        Importar
                    </Button>
                    <Button variant="outline" onClick={() => setIsReportOpen(true)} className="rounded-xl border-border/50 hover:bg-muted/50 font-light text-xs uppercase tracking-wider">
                        <BarChart3 className="mr-2 h-4 w-4 opacity-60" />
                        Relatório
                    </Button>
                    <Button onClick={handleNew} className="rounded-xl shadow-sm shadow-primary/10 font-light text-xs uppercase tracking-widest">
                        <Plus className="mr-2 h-4 w-4" />
                        Nova Retirada
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-6 md:flex-row md:items-center animate-slide-in-up stagger-1">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/40" />
                    <input
                        type="text"
                        placeholder="Buscar por empresa, sócio, CPF ou banco..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-12 w-full rounded-2xl border border-border/50 bg-card pl-12 pr-4 text-sm font-light placeholder:text-muted-foreground/30 focus:border-primary/30 focus:outline-none focus:ring-4 focus:ring-primary/[0.02] shadow-sm transition-all"
                    />
                </div>

                <div className="flex items-center gap-1 p-1 bg-muted/20 rounded-2xl border border-border/50">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={cn(
                            'p-2 rounded-xl transition-all',
                            viewMode === 'grid'
                                ? 'bg-card text-primary shadow-sm border border-border/10'
                                : 'text-muted-foreground hover:text-foreground'
                        )}
                    >
                        <LayoutGrid className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={cn(
                            'p-2 rounded-xl transition-all',
                            viewMode === 'list'
                                ? 'bg-card text-primary shadow-sm border border-border/10'
                                : 'text-muted-foreground hover:text-foreground'
                        )}
                    >
                        <List className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Content */}
            {filteredWithdrawals.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border py-20 bg-card/30 animate-slide-in-up stagger-2">
                    <Banknote className="h-16 w-16 text-muted-foreground/20 mb-4" />
                    <h3 className="text-lg font-light text-foreground">Nenhuma retirada encontrada</h3>
                    <p className="text-sm text-muted-foreground font-light px-4 text-center mt-1">Comece registrando uma nova retirada de lucro ou importe uma planilha.</p>
                    <Button onClick={handleNew} variant="outline" className="mt-8 rounded-xl font-light text-xs uppercase tracking-widest px-8">
                        Registrar Primeira Retirada
                    </Button>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 animate-slide-in-up stagger-2">
                    {filteredWithdrawals.map((w, index) => (
                        <div
                            key={w.id}
                            className="group relative rounded-2xl border border-border/50 bg-card p-6 shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <div className="absolute right-5 top-5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted/20 hover:bg-muted transition-colors border border-border/30">
                                            <MoreHorizontal className="h-4 w-4 text-muted-foreground/60" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="bg-card border-border p-1 rounded-xl shadow-elevated">
                                        <DropdownMenuItem onClick={() => handleEdit(w)} className="rounded-lg gap-2 cursor-pointer font-light text-xs uppercase tracking-wider">
                                            <Edit className="h-4 w-4 text-blue-500/60" />
                                            Editar
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            className="text-destructive focus:text-destructive rounded-lg gap-2 cursor-pointer font-light text-xs uppercase tracking-wider"
                                            onClick={() => deleteWithdrawal(w.id)}
                                        >
                                            <Trash2 className="h-4 w-4 opacity-70" />
                                            Excluir
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            <div className="flex flex-col h-full">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/5 border border-primary/10">
                                        <User className="h-6 w-6 text-primary/60" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="font-light text-lg text-foreground truncate group-hover:text-primary transition-colors leading-tight">
                                            {w.partner_name}
                                        </h3>
                                        <p className="text-[10px] font-normal text-muted-foreground uppercase tracking-[0.1em] mt-1">
                                            CPF: {w.partner_cpf}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-4 flex-1">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                                            <Building2 className="h-3 w-3" /> Empresa
                                        </span>
                                        <p className="text-sm font-light text-foreground truncate">{w.client?.nome_fantasia || w.client?.razao_social}</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                                                <Calendar className="h-3 w-3" /> Data
                                            </span>
                                            <p className="text-sm font-light text-foreground">
                                                {w.withdrawal_date ? format(new Date(w.withdrawal_date), 'dd/MM/yyyy') : '-'}
                                            </p>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                                                <DollarSign className="h-3 w-3" /> Valor
                                            </span>
                                            <p className="text-sm font-medium text-primary">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(w.amount)}
                                            </p>
                                        </div>
                                    </div>

                                    {w.bank && (
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em]">Banco</span>
                                            <p className="text-sm font-light text-foreground">{w.bank}</p>
                                        </div>
                                    )}
                                </div>

                                {w.observations && (
                                    <div className="mt-4 pt-4 border-t border-border/20">
                                        <p className="text-[11px] font-light text-muted-foreground italic line-clamp-2">"{w.observations}"</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="rounded-2xl border border-border/50 bg-card overflow-hidden animate-slide-in-up shadow-card">
                    <Table>
                        <TableHeader className="bg-muted/30">
                            <TableRow className="hover:bg-transparent border-border/50">
                                <TableHead className="text-[10px] font-normal uppercase tracking-[0.2em] py-5 pl-6">Sócio</TableHead>
                                <TableHead className="text-[10px] font-normal uppercase tracking-[0.2em] py-5">Empresa</TableHead>
                                <TableHead className="text-[10px] font-normal uppercase tracking-[0.2em] py-5">Data</TableHead>
                                <TableHead className="text-[10px] font-normal uppercase tracking-[0.2em] py-5">Valor</TableHead>
                                <TableHead className="text-[10px] font-normal uppercase tracking-[0.2em] py-5">Banco</TableHead>
                                <TableHead className="text-right pr-6"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredWithdrawals.map((w) => (
                                <TableRow key={w.id} className="group border-border/30 hover:bg-muted/10 transition-colors">
                                    <TableCell className="py-4 pl-6">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-light text-foreground">{w.partner_name}</span>
                                            <span className="text-[10px] text-muted-foreground uppercase font-normal">{w.partner_cpf}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm font-light text-muted-foreground">{w.client?.nome_fantasia || w.client?.razao_social}</span>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm font-light text-muted-foreground">
                                            {w.withdrawal_date ? format(new Date(w.withdrawal_date), 'dd/MM/yyyy') : '-'}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm font-medium text-foreground">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(w.amount)}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm font-light text-muted-foreground">{w.bank || '-'}</span>
                                    </TableCell>
                                    <TableCell className="text-right pr-6">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button className="h-8 w-8 inline-flex items-center justify-center rounded-lg hover:bg-muted transition-colors text-muted-foreground/40 hover:text-muted-foreground">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="bg-card border-border p-1 rounded-xl shadow-elevated">
                                                <DropdownMenuItem onClick={() => handleEdit(w)} className="rounded-lg gap-2 cursor-pointer font-light text-xs uppercase tracking-wider">
                                                    <Edit className="h-4 w-4 text-blue-500/60" />
                                                    Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-destructive focus:text-destructive rounded-lg gap-2 cursor-pointer font-light text-xs uppercase tracking-wider"
                                                    onClick={() => deleteWithdrawal(w.id)}
                                                >
                                                    <Trash2 className="h-4 w-4 opacity-70" />
                                                    Excluir
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
