import { useState, useMemo } from 'react';
import { 
    Search, 
    Building2,
    Settings2,
    ShieldAlert,
    LayoutGrid,
    List,
    Filter,
    CheckCircle2,
    XCircle,
    Loader2,
    ToggleLeft,
    ToggleRight
} from 'lucide-react';
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
import { Switch } from "@/components/ui/switch";
import { useClients } from '@/hooks/useClients';
import { useObligations, Obligation } from '@/hooks/useObligations';
import { useClientObligations } from '@/hooks/useClientObligations';
import { useBranding } from '@/context/BrandingContext';
import { 
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { toast } from 'sonner';

const TAX_REGIMES = ['Simples Nacional', 'Lucro Presumido', 'Lucro Real', 'MEI'];

export default function TaskManagement() {
    const { officeName } = useBranding();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRegime, setSelectedRegime] = useState('all');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [selectedClient, setSelectedClient] = useState<any | null>(null);

    const { clients, loading: clientsLoading } = useClients();
    const { obligations, loading: obsLoading } = useObligations();
    const { clientObligations, loading: coLoading, setClientObligationState } = useClientObligations();

    const filteredClients = useMemo(() => {
        return clients
            .filter(c => c.isActive)
            .filter(client => {
                const searchLower = searchTerm.toLowerCase();
                const matchesSearch = !searchTerm ||
                    (client.nomeFantasia || '').toLowerCase().includes(searchLower) ||
                    (client.razaoSocial || '').toLowerCase().includes(searchLower) ||
                    (client.cnpj || '').includes(searchTerm);
                const matchesRegime = selectedRegime === 'all' ||
                    (client.regimeTributario || '').toLowerCase() === selectedRegime.toLowerCase();
                return matchesSearch && matchesRegime;
            })
            .sort((a, b) => (a.nomeFantasia || a.razaoSocial || '').localeCompare(b.nomeFantasia || b.razaoSocial || ''));
    }, [clients, searchTerm, selectedRegime]);

    const getClientStats = (clientId: string) => {
        let activeCount = 0;
        let totalCount = 0;
        obligations.filter(o => o.is_active && o.periodicity !== 'eventual').forEach(obl => {
            totalCount++;
            const explicitCompanies = obl.company_ids || [];
            let appliesByDefault = false;
            if (explicitCompanies.length > 0) {
                appliesByDefault = explicitCompanies.includes(clientId);
            } else {
                const obsRegimes = obl.tax_regimes || [];
                const clientObj = clients.find(c => c.id === clientId);
                const clientRegime = clientObj?.regimeTributario?.toLowerCase() || '';
                appliesByDefault = obsRegimes.length === 0 ||
                    obsRegimes.some((r: string) => r.toLowerCase() === 'all') ||
                    (clientRegime && obsRegimes.some((r: string) => r.toLowerCase() === clientRegime));
            }
            const override = clientObligations.find(co => co.client_id === clientId && co.obligation_id === obl.id);
            const isTurnedOn = override ? override.status === 'enabled' : appliesByDefault;
            if (isTurnedOn) activeCount++;
        });
        return { activeCount, totalCount };
    };

    const isLoading = clientsLoading || obsLoading || coLoading;

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-10">
            {/* Header */}
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between pt-4">
                <div>
                    <h1 className="text-4xl font-light tracking-tight text-foreground">Gestão de <span className="text-primary font-medium">Tarefas</span></h1>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.2em] mt-2">
                        {officeName} • Controle Individual por Empresa
                    </p>
                </div>
                {/* View Toggle */}
                <div className="flex items-center gap-3">
                    <div className="bg-muted/10 p-1 rounded-2xl border border-border/10 flex gap-1">
                        <Button
                            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('list')}
                            className="rounded-xl h-10 px-4 text-[10px] uppercase font-bold tracking-widest gap-2"
                        >
                            <List className="h-4 w-4" /> Lista
                        </Button>
                        <Button
                            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('grid')}
                            className="rounded-xl h-10 px-4 text-[10px] uppercase font-bold tracking-widest gap-2"
                        >
                            <LayoutGrid className="h-4 w-4" /> Grid
                        </Button>
                    </div>
                </div>
            </div>

            {/* Filters Row */}
            <div className="bg-card/30 backdrop-blur-md rounded-[2.5rem] p-6 border border-border/40 flex flex-wrap items-center gap-4 shadow-sm">
                {/* Search */}
                <div className="flex-1 min-w-[200px] relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                    <Input
                        placeholder="Buscar empresa por nome ou CNPJ..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="h-12 rounded-xl border-border/20 bg-muted/20 pl-11 font-light text-xs focus-visible:ring-primary/20"
                    />
                </div>
                {/* Regime Filter */}
                <div className="flex items-center gap-2 bg-muted/20 rounded-xl px-4 h-12 border border-border/20 min-w-[220px]">
                    <Filter className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                    <select
                        className="bg-transparent text-xs font-medium outline-none cursor-pointer w-full text-foreground"
                        value={selectedRegime}
                        onChange={e => setSelectedRegime(e.target.value)}
                    >
                        <option value="all">Todos os Regimes</option>
                        {TAX_REGIMES.map(r => (
                            <option key={r} value={r}>{r}</option>
                        ))}
                    </select>
                </div>
                {/* Count */}
                <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest shrink-0 px-2">
                    {filteredClients.length} empresa{filteredClients.length !== 1 ? 's' : ''}
                </div>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="flex items-center justify-center py-32">
                    <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
                </div>
            ) : filteredClients.length === 0 ? (
                <div className="text-center py-32 text-muted-foreground/40 font-light italic">
                    Nenhuma empresa encontrada com esses filtros.
                </div>
            ) : viewMode === 'list' ? (
                /* ─── LIST VIEW ─── */
                <Card className="rounded-[2.5rem] border-border/40 bg-white/40 backdrop-blur-md overflow-hidden shadow-2xl">
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-muted/30">
                                <TableRow className="hover:bg-transparent border-border/10">
                                    <TableHead className="py-6 px-10 text-xs font-bold uppercase tracking-wider text-muted-foreground">Empresa</TableHead>
                                    <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground text-center">Regime</TableHead>
                                    <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground text-center">Obrigações Ativas</TableHead>
                                    <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground text-right px-10">Configurar</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredClients.map((client) => {
                                    const { activeCount, totalCount } = getClientStats(client.id);
                                    return (
                                        <TableRow
                                            key={client.id}
                                            className="group hover:bg-primary/[0.02] border-border/10 transition-all duration-300 cursor-pointer"
                                            onClick={() => setSelectedClient(client)}
                                        >
                                            <TableCell className="py-6 px-10">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors shrink-0">
                                                        <Building2 className="h-5 w-5" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-base font-medium text-foreground tracking-tight">{client.nomeFantasia || client.razaoSocial}</span>
                                                        <span className="text-xs font-normal text-muted-foreground tracking-wider mt-1 uppercase">{client.cnpj}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="outline" className="bg-muted text-muted-foreground border-none text-[10px] px-2 py-0.5 font-bold uppercase tracking-tight">
                                                    {client.regimeTributario || 'Não Definido'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <span className={`text-xl font-light ${activeCount > 0 ? 'text-emerald-600' : 'text-muted-foreground/40'}`}>{activeCount}</span>
                                                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">/ {totalCount}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right px-10">
                                                <Button
                                                    variant="secondary"
                                                    className="h-10 px-5 rounded-xl uppercase font-bold tracking-widest text-[10px] gap-2 shadow-sm border border-border/50 hover:bg-primary hover:text-white transition-all"
                                                    onClick={(e) => { e.stopPropagation(); setSelectedClient(client); }}
                                                >
                                                    <Settings2 className="h-3.5 w-3.5" /> Configurar
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            ) : (
                /* ─── GRID VIEW ─── */
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredClients.map((client) => {
                        const { activeCount, totalCount } = getClientStats(client.id);
                        const hasOverrides = clientObligations.some(co => co.client_id === client.id);
                        return (
                            <Card
                                key={client.id}
                                onClick={() => setSelectedClient(client)}
                                className="group rounded-[3rem] border border-border/40 bg-white/40 backdrop-blur-md overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5 cursor-pointer hover:border-primary/30 hover:scale-[1.01]"
                            >
                                <div className="p-8 flex items-start justify-between">
                                    <div className="flex gap-4 flex-1 min-w-0">
                                        <div className="h-14 w-14 rounded-3xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-all duration-500 shrink-0 group-hover:scale-110">
                                            <Building2 className="h-7 w-7" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-lg font-bold tracking-tight text-foreground/80 leading-tight truncate">
                                                {client.nomeFantasia || client.razaoSocial}
                                            </h3>
                                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1 opacity-60">
                                                {client.cnpj}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2 shrink-0 ml-4">
                                        <Badge variant="outline" className="text-[8px] font-black tracking-widest opacity-60 uppercase py-0.5 whitespace-nowrap">
                                            {client.regimeTributario || 'Não def.'}
                                        </Badge>
                                        {hasOverrides && (
                                            <Badge className="bg-blue-500/10 text-blue-600 border-none text-[8px] uppercase font-bold tracking-widest px-2 py-0 h-5">
                                                Personalizado
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                <div className="px-8 pb-8 grid grid-cols-2 gap-4 border-t border-border/5 pt-6">
                                    <div className="bg-emerald-500/5 rounded-2xl p-4 text-center">
                                        <p className="text-[28px] font-light text-emerald-600 leading-none">{activeCount}</p>
                                        <p className="text-[9px] uppercase font-black tracking-widest text-emerald-600/60 mt-2">Ativas</p>
                                    </div>
                                    <div className="bg-muted/30 rounded-2xl p-4 text-center">
                                        <p className="text-[28px] font-light text-muted-foreground leading-none">{totalCount - activeCount}</p>
                                        <p className="text-[9px] uppercase font-black tracking-widest text-muted-foreground/60 mt-2">Inativas</p>
                                    </div>
                                </div>

                                <div className="border-t border-border/5 px-8 py-5 flex items-center justify-between bg-muted/[0.02]">
                                    <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-40">
                                        {totalCount} obrigações no total
                                    </span>
                                    <div className="flex items-center gap-2 text-primary text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Settings2 className="h-3.5 w-3.5" /> Configurar
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Modal de Configuração da Empresa */}
            <ClientObligationsDialog
                client={selectedClient}
                onClose={() => setSelectedClient(null)}
                allObligations={obligations}
                clientOverrides={clientObligations}
                onToggleOverride={setClientObligationState}
            />
        </div>
    );
}

// ─── Dialog Component ─────────────────────────────────────────────────────────

function ClientObligationsDialog({
    client,
    onClose,
    allObligations,
    clientOverrides,
    onToggleOverride
}: {
    client: any,
    onClose: () => void,
    allObligations: Obligation[],
    clientOverrides: any[],
    onToggleOverride: (cId: string, oId: string, state: 'enabled' | 'disabled' | 'default', obligationName?: string) => Promise<void>
}) {
    const [isUpdating, setIsUpdating] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterState, setFilterState] = useState<'all' | 'active' | 'inactive'>('all');

    const handleToggle = async (obl: Obligation, isTurnedOn: boolean, appliesByDefault: boolean) => {
        if (!client) return;
        setIsUpdating(obl.id);
        try {
            const newState = !isTurnedOn;
            let targetState: 'enabled' | 'disabled' | 'default';
            if (newState === appliesByDefault) {
                targetState = 'default';
            } else {
                targetState = newState ? 'enabled' : 'disabled';
            }
            // Passa obl.name para que tarefas pendentes sejam deletadas ao desativar
            await onToggleOverride(client.id, obl.id, targetState, obl.name);
            toast.success(`"${obl.name}" ${newState ? 'ativada' : 'desativada'} para ${client.nomeFantasia || client.razaoSocial}!`);
        } catch (err) {
            // handled in hook
        } finally {
            setIsUpdating(null);
        }
    };

    const obligations = useMemo(() => {
        if (!client) return [];
        return allObligations
            .filter(o => o.is_active && o.periodicity !== 'eventual')
            .map(obl => {
                const explicitCompanies = obl.company_ids || [];
                let appliesByDefault = false;
                if (explicitCompanies.length > 0) {
                    appliesByDefault = explicitCompanies.includes(client.id);
                } else {
                    const obsRegimes = obl.tax_regimes || [];
                    const clientRegime = client.regimeTributario?.toLowerCase() || '';
                    appliesByDefault = obsRegimes.length === 0 ||
                        obsRegimes.some((r: string) => r.toLowerCase() === 'all') ||
                        (clientRegime && obsRegimes.some((r: string) => r.toLowerCase() === clientRegime));
                }
                const override = clientOverrides.find(co => co.client_id === client.id && co.obligation_id === obl.id);
                const isTurnedOn = override ? override.status === 'enabled' : appliesByDefault;
                return { obl, appliesByDefault, override, isTurnedOn };
            });
    }, [client, allObligations, clientOverrides]);

    const filteredObligations = useMemo(() => {
        return obligations
            .filter(({ obl }) => !searchQuery || obl.name.toLowerCase().includes(searchQuery.toLowerCase()))
            .filter(({ isTurnedOn }) => {
                if (filterState === 'active') return isTurnedOn;
                if (filterState === 'inactive') return !isTurnedOn;
                return true;
            });
    }, [obligations, searchQuery, filterState]);

    const activeCount = obligations.filter(o => o.isTurnedOn).length;
    const inactiveCount = obligations.filter(o => !o.isTurnedOn).length;

    return (
        <Dialog open={!!client} onOpenChange={(open) => { if (!open) { onClose(); setSearchQuery(''); setFilterState('all'); } }}>
            <DialogContent className="sm:max-w-4xl p-0 bg-card border border-border/40 overflow-hidden flex flex-col rounded-[2.5rem] shadow-2xl h-[90vh] max-h-[90vh]">
                {client && (
                    <>
                        {/* Header */}
                        <div className="p-8 pb-5 bg-primary/[0.02] border-b border-border/10 shrink-0">
                            <DialogHeader>
                                <div className="flex items-center gap-5 mb-3 pr-8">
                                    <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                                        <Building2 className="h-8 w-8 text-primary opacity-60" />
                                    </div>
                                    <div className="text-left flex-1 min-w-0">
                                        <DialogTitle className="text-2xl font-light text-foreground truncate">
                                            {client.nomeFantasia || client.razaoSocial}
                                        </DialogTitle>
                                        <DialogDescription className="text-[10px] uppercase font-bold tracking-[0.2em] mt-1 text-primary/60 flex items-center gap-3">
                                            Regime: {client.regimeTributario || 'Não definido'}
                                            <span className="text-muted-foreground/30">•</span>
                                            <span className="text-emerald-600">{activeCount} ativa{activeCount !== 1 ? 's' : ''}</span>
                                            <span className="text-muted-foreground/30">•</span>
                                            <span className="text-muted-foreground/60">{inactiveCount} inativa{inactiveCount !== 1 ? 's' : ''}</span>
                                        </DialogDescription>
                                    </div>
                                </div>
                            </DialogHeader>

                            {/* Search + Filter */}
                            <div className="flex gap-3 mt-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                                    <Input
                                        placeholder="Buscar obrigação por nome..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="h-12 pl-11 rounded-2xl border-border/20 bg-card text-xs w-full focus-visible:ring-primary/20"
                                    />
                                </div>
                                <div className="flex bg-muted/10 p-1 rounded-2xl border border-border/10 gap-1 shrink-0">
                                    {(['all', 'active', 'inactive'] as const).map(f => (
                                        <Button
                                            key={f}
                                            variant={filterState === f ? 'secondary' : 'ghost'}
                                            size="sm"
                                            onClick={() => setFilterState(f)}
                                            className="rounded-xl h-10 px-3 text-[10px] uppercase font-bold tracking-widest"
                                        >
                                            {f === 'all' ? 'Todas' : f === 'active' ? 'Ativas' : 'Inativas'}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* List */}
                        <ScrollArea className="flex-1 p-6 bg-muted/10 h-full">
                            {filteredObligations.length === 0 ? (
                                <div className="text-center py-20 text-muted-foreground/40 font-light italic">
                                    Nenhuma obrigação encontrada.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-10">
                                    {filteredObligations.map(({ obl, appliesByDefault, override, isTurnedOn }) => (
                                        <div
                                            key={obl.id}
                                            className={cn(
                                                "bg-card border rounded-2xl p-5 flex items-center justify-between gap-4 shadow-sm transition-all duration-300",
                                                isTurnedOn
                                                    ? "border-emerald-200/60 shadow-emerald-500/5"
                                                    : "border-border/20 opacity-70"
                                            )}
                                        >
                                            {/* Info */}
                                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                                <div className={cn(
                                                    "w-2.5 h-2.5 rounded-full shrink-0 transition-all",
                                                    isTurnedOn
                                                        ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"
                                                        : "bg-muted-foreground/20"
                                                )} />
                                                <div className="min-w-0 flex-1">
                                                    <h4 className={cn(
                                                        "text-sm font-semibold truncate transition-colors",
                                                        isTurnedOn ? "text-foreground" : "text-muted-foreground/50 line-through"
                                                    )}>
                                                        {obl.name}
                                                    </h4>
                                                    <div className="flex flex-wrap gap-2 items-center mt-1">
                                                        <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">
                                                            {obl.periodicity} • {obl.department}
                                                        </span>
                                                        {override?.status === 'enabled' && (
                                                            <Badge className="bg-blue-500/10 text-blue-600 border-none text-[8px] uppercase font-bold tracking-widest px-1.5 py-0 h-4">
                                                                + Adicionada
                                                            </Badge>
                                                        )}
                                                        {override?.status === 'disabled' && (
                                                            <Badge className="bg-red-500/10 text-red-500 border-none text-[8px] uppercase font-bold tracking-widest px-1.5 py-0 h-4 flex items-center gap-1">
                                                                <ShieldAlert className="w-2.5 h-2.5" /> Ocultada
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Toggle */}
                                            <div className="flex flex-col items-center gap-1.5 shrink-0 pl-4 border-l border-border/20">
                                                <Switch
                                                    checked={isTurnedOn}
                                                    disabled={isUpdating === obl.id}
                                                    onCheckedChange={() => handleToggle(obl, isTurnedOn, appliesByDefault)}
                                                    className={isTurnedOn ? "data-[state=checked]:bg-emerald-500" : ""}
                                                />
                                                <span className={cn(
                                                    "text-[9px] font-black uppercase tracking-widest",
                                                    isTurnedOn ? "text-emerald-600" : "text-muted-foreground/40"
                                                )}>
                                                    {isUpdating === obl.id ? '...' : isTurnedOn ? 'ON' : 'OFF'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>

                        {/* Footer Info */}
                        <div className="border-t border-border/10 px-8 py-4 bg-muted/20 shrink-0 flex items-center gap-4">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                            <p className="text-[11px] text-muted-foreground font-light leading-relaxed">
                                As obrigações <strong className="text-foreground font-semibold">desativadas aqui</strong> não serão geradas para esta empresa na <strong className="text-foreground font-semibold">Lista de Entregas</strong>, mesmo que o regime tributário seja compatível.
                            </p>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
