import { useState, useEffect } from 'react';
import { useClients, Client } from '@/hooks/useClients';
import { useAccounting } from '@/hooks/useAccounting';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Search,
    Calculator,
    Loader2,
    Lock,
    LayoutGrid,
    List,
    SortAsc,
    SortDesc,
    Building2,
    Eye,
    Eraser,
    ArrowRight
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
import { AccountingModal } from '@/components/accounting/AccountingModal';
import { cn } from '@/lib/utils';
import { useSearchParams } from 'react-router-dom';

export default function Accounting() {
    const { clients, loading } = useClients();
    const { fetchClosedCompanies, resetAll } = useAccounting();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [closedCompanyIds, setClosedCompanyIds] = useState<Set<string>>(new Set());
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [sortBy, setSortBy] = useState<'asc' | 'desc'>('asc');

    const refreshClosedCompanies = () => {
        fetchClosedCompanies().then(setClosedCompanyIds);
    };

    useEffect(() => {
        refreshClosedCompanies();
    }, []);

    const filteredClients = clients.filter((client) => {
        const matchesSearch =
            client.razaoSocial.toLowerCase().includes(searchQuery.toLowerCase()) ||
            client.cnpj.includes(searchQuery) ||
            client.nomeFantasia.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
    }).sort((a, b) => {
        const nameA = (a.nomeFantasia || a.razaoSocial).toLowerCase();
        const nameB = (b.nomeFantasia || b.razaoSocial).toLowerCase();

        if (sortBy === 'asc') {
            return nameA.localeCompare(nameB);
        } else {
            return nameB.localeCompare(nameA);
        }
    });

    const handleClientClick = (client: Client) => {
        setSelectedClient(client);
        setIsModalOpen(true);
    };

    const handleResetAll = async () => {
        try {
            await resetAll();
            refreshClosedCompanies();
        } catch (err) {
            // Error already handled in hook/toast
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-slide-in-up">
                <div>
                    <h1 className="text-3xl font-light tracking-tight text-foreground">Contabilidade</h1>
                    <p className="text-xs font-normal text-muted-foreground uppercase tracking-[0.2em] mt-1">Gerenciamento e fechamentos mensais</p>
                </div>

                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl border-border/50 bg-card hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 text-[10px] uppercase tracking-wider gap-2 h-10 px-4 transition-all"
                        >
                            <Eraser className="h-4 w-4 opacity-60" />
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

            {/* Filters */}
            <div className="flex flex-col gap-6 md:flex-row md:items-center animate-slide-in-up stagger-1">
                {/* Search */}
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/40" />
                    <input
                        type="text"
                        placeholder="Buscar por razão social, CNPJ ou nome fantástico..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-12 w-full rounded-2xl border border-border/50 bg-card pl-12 pr-4 text-sm font-light placeholder:text-muted-foreground/30 focus:border-primary/30 focus:outline-none focus:ring-4 focus:ring-primary/[0.02] shadow-sm transition-all"
                    />
                </div>

                <div className="flex items-center gap-4">
                    {/* Sort Selection */}
                    <div className="flex items-center gap-1 p-1 bg-muted/20 rounded-2xl border border-border/50">
                        <button
                            onClick={() => setSortBy('asc')}
                            className={cn(
                                'p-2 rounded-xl transition-all',
                                sortBy === 'asc'
                                    ? 'bg-card text-primary shadow-sm border border-border/10'
                                    : 'text-muted-foreground hover:text-foreground'
                            )}
                            title="Ordem Alfabética (A-Z)"
                        >
                            <SortAsc className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setSortBy('desc')}
                            className={cn(
                                'p-2 rounded-xl transition-all',
                                sortBy === 'desc'
                                    ? 'bg-card text-primary shadow-sm border border-border/10'
                                    : 'text-muted-foreground hover:text-foreground'
                            )}
                            title="Ordem Alfabética (Z-A)"
                        >
                            <SortDesc className="h-4 w-4" />
                        </button>
                    </div>

                    {/* View Selection */}
                    <div className="flex items-center gap-1 p-1 bg-muted/20 rounded-2xl border border-border/50">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={cn(
                                'p-2 rounded-xl transition-all',
                                viewMode === 'grid'
                                    ? 'bg-card text-primary shadow-sm border border-border/10'
                                    : 'text-muted-foreground hover:text-foreground'
                            )}
                            title="Visualização em Grade"
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
                            title="Visualização em Lista"
                        >
                            <List className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Clients Display */}
            {filteredClients.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
                    <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="font-light text-foreground mb-1">Nenhum cliente encontrado</h3>
                    <p className="text-sm font-light text-muted-foreground">Tente ajustar os filtros.</p>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 animate-slide-in-up stagger-2">
                    {filteredClients.map((client, index) => {
                        const isClosed = closedCompanyIds.has(client.id);
                        return (
                            <div
                                key={client.id}
                                className={cn(
                                    "group relative rounded-[3rem] border border-border/40 bg-white/40 backdrop-blur-md overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1 cursor-pointer",
                                    isClosed ? "ring-2 ring-destructive/30 border-transparent bg-destructive/[0.01]" : "hover:border-primary/20",
                                    !client.isActive && "opacity-60 grayscale-[0.5]"
                                )}
                                style={{ animationDelay: `${index * 50}ms` }}
                                onClick={() => handleClientClick(client)}
                            >
                                {/* Card Content */}
                                <div className="p-8 space-y-8">
                                    <div className="flex gap-6">
                                        <div className={cn(
                                            "h-16 w-16 rounded-3xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 duration-500 ring-1 ring-white/20",
                                            isClosed 
                                                ? "bg-destructive text-white shadow-destructive/20" 
                                                : "bg-primary text-white shadow-primary/20"
                                        )}>
                                            {isClosed ? <Lock className="h-8 w-8" /> : <Calculator className="h-8 w-8" />}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className={cn(
                                                "text-xl font-light tracking-tight truncate transition-colors leading-tight pt-1",
                                                isClosed ? "text-destructive" : "text-foreground/80 group-hover:text-primary"
                                            )}>
                                                {client.nomeFantasia || client.razaoSocial}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant="outline" className="text-[10px] font-light tracking-widest opacity-40 uppercase py-0.5 border-none p-0">ID: {client.cnpj.substring(0, 8)}</Badge>
                                                {isClosed && (
                                                    <span className="text-[8px] font-light text-destructive uppercase tracking-widest border border-destructive/20 bg-white px-1.5 py-0.5 rounded-lg shadow-sm">ENCERRADA</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-6 border-t border-border/5 pt-8 bg-muted/[0.01]">
                                        <div className="space-y-4">
                                            <div className="flex flex-col gap-1.5 text-center sm:text-left">
                                                <label className="text-[9px] uppercase font-light tracking-widest text-muted-foreground/40">CNPJ / CPF</label>
                                                <p className="text-sm font-light text-foreground/70">{client.cnpj}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4 flex items-center justify-between border-t border-border/5">
                                        <div className="flex items-center gap-2">
                                            <Badge variant={client.isActive ? 'default' : 'secondary'} className={cn(
                                                "rounded-xl px-4 py-1.5 text-[9px] font-light uppercase tracking-widest border border-transparent shadow-sm",
                                                client.isActive ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-100' : ''
                                            )}>
                                                {client.isActive ? 'Ativo' : 'Inativo'}
                                            </Badge>
                                        </div>
                                        <div className={cn(
                                            "text-[10px] font-light uppercase tracking-widest transition-all flex items-center gap-2 group-hover:translate-x-1 duration-300",
                                            isClosed ? "text-destructive" : "text-primary opacity-0 group-hover:opacity-100"
                                        )}>
                                            {isClosed ? 'Ver Fechamento' : 'Registrar'} <ArrowRight className="h-4 w-4" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="rounded-2xl border border-border/50 bg-card overflow-hidden animate-slide-in-up shadow-card">
                    <Table>
                        <TableHeader className="bg-muted/30">
                            <TableRow className="hover:bg-transparent border-border/50">
                                <TableHead className="w-12 px-6"></TableHead>
                                <TableHead className="text-[10px] font-normal uppercase tracking-[0.2em] py-5">Cliente</TableHead>
                                <TableHead className="text-[10px] font-normal uppercase tracking-[0.2em] py-5">CNPJ/CPF</TableHead>
                                <TableHead className="text-[10px] font-normal uppercase tracking-[0.2em] py-5">Status</TableHead>
                                <TableHead className="text-right px-6"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredClients.map((client) => {
                                const isClosed = closedCompanyIds.has(client.id);
                                return (
                                    <TableRow
                                        key={client.id}
                                        className={cn(
                                            "group cursor-pointer border-border/30 hover:bg-muted/20 transition-colors",
                                            isClosed ? 'bg-destructive/5 hover:bg-destructive/10' : ''
                                        )}
                                        onClick={() => handleClientClick(client)}
                                    >
                                        <TableCell className="px-6">
                                            <div className={cn(
                                                "flex h-8 w-8 items-center justify-center rounded-lg border transition-colors",
                                                isClosed ? "bg-destructive/10 border-destructive/20" : "bg-muted/30 border-border/10 group-hover:bg-primary/5"
                                            )}>
                                                {isClosed ? (
                                                    <Lock className="h-4 w-4 text-destructive/60" />
                                                ) : (
                                                    <Calculator className={cn("h-4 w-4 text-muted-foreground/40", !isClosed && "group-hover:text-primary/60")} />
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <div className="flex items-center gap-3">
                                                <span className={cn(
                                                    "text-sm font-light transition-colors",
                                                    isClosed ? "text-destructive font-medium" : "text-foreground group-hover:text-primary"
                                                )}>
                                                    {client.nomeFantasia || client.razaoSocial}
                                                </span>
                                                {isClosed && (
                                                    <span className="text-[9px] font-bold text-destructive uppercase tracking-widest border border-destructive/20 bg-destructive/5 px-1.5 py-0.5 rounded-lg">Encerrada</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm font-light text-muted-foreground">{client.cnpj}</span>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={client.isActive ? 'default' : 'secondary'} className={client.isActive ? 'bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 border-emerald-200' : ''}>
                                                {client.isActive ? 'Ativo' : 'Inativo'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right px-6">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className={cn("text-xs font-light uppercase tracking-widest", isClosed ? "text-destructive hover:text-destructive" : "hover:text-primary")}
                                            >
                                                {isClosed ? 'Ver' : 'Abrir'}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            )}

            <AccountingModal
                client={selectedClient}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onUpdate={refreshClosedCompanies}
                isAlreadyClosed={selectedClient ? closedCompanyIds.has(selectedClient.id) : false}
            />
        </div>
    );
}
