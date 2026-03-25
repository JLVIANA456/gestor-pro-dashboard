import { useState, useMemo } from 'react';
import { 
    Search, 
    Plus, 
    Edit2, 
    Trash2, 
    Bell, 
    ShieldCheck, 
    Calendar as CalendarIcon, 
    Building2, 
    Mail, 
    Clock, 
    Info, 
    AlertCircle,
    CheckCircle2,
    XCircle,
    RotateCcw,
    Filter,
    X,
    SlidersHorizontal,
    Eye,
    EyeOff
} from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table";
import { 
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { 
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { 
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { useObligations, Obligation, ObligationType, ObligationPeriodicity, ObligationDueRule } from '@/hooks/useObligations';
import { useClients } from '@/hooks/useClients';
import { useBranding } from '@/context/BrandingContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useForm, FormProvider } from 'react-hook-form';

export default function Obligations() {
    const { officeName } = useBranding();
    const { obligations, loading, createObligation, updateObligation, deleteObligation } = useObligations();
    const { clients } = useClients();

    // --- Filter State ---
    const [searchTerm, setSearchTerm]     = useState('');
    const [filterDept, setFilterDept]     = useState('all');
    const [filterType, setFilterType]     = useState('all');
    const [filterRegime, setFilterRegime] = useState('all');
    const [filterPeriod, setFilterPeriod] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'active' | 'inactive'

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingObligation, setEditingObligation] = useState<Obligation | null>(null);
    const [companySearch, setCompanySearch] = useState('');

    const clearAllFilters = () => {
        setSearchTerm('');
        setFilterDept('all');
        setFilterType('all');
        setFilterRegime('all');
        setFilterPeriod('all');
        setFilterStatus('all');
    };

    const activeFilterCount = [
        searchTerm !== '',
        filterDept !== 'all',
        filterType !== 'all',
        filterRegime !== 'all',
        filterPeriod !== 'all',
        filterStatus !== 'all',
    ].filter(Boolean).length;

    const form = useForm({
        defaultValues: {
            name: '',
            type: 'guia' as ObligationType,
            department: 'DP',
            default_due_day: 5,
            is_user_editable: true,
            alert_days: [10, 5, 3],
            alert_recipient_email: '',
            periodicity: 'mensal' as ObligationPeriodicity,
            is_active: true,
            internal_note: '',
            competency: '',
            due_rule: 'dia fixo' as ObligationDueRule,
            anticipate_on_weekend: false,
            tax_regimes: ['simples', 'presumido', 'real', 'domestico'],
            competency_rule: 'previous_month',
            company_ids: [] as string[]
        }
    });

    const filteredObligations = useMemo(() => {
        return obligations.filter(o => {
            const matchSearch =
                !searchTerm ||
                o.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                o.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
                o.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                o.tax_regimes?.some(r => r.toLowerCase().includes(searchTerm.toLowerCase()));

            const matchDept   = filterDept   === 'all' || o.department === filterDept;
            const matchType   = filterType   === 'all' || o.type === filterType;
            const matchRegime = filterRegime === 'all' || o.tax_regimes?.includes(filterRegime);
            const matchPeriod = filterPeriod === 'all' || o.periodicity === filterPeriod;
            const matchStatus =
                filterStatus === 'all' ||
                (filterStatus === 'active'   && o.is_active) ||
                (filterStatus === 'inactive' && !o.is_active);

            return matchSearch && matchDept && matchType && matchRegime && matchPeriod && matchStatus;
        });
    }, [obligations, searchTerm, filterDept, filterType, filterRegime, filterPeriod, filterStatus]);


    const handleOpenDialog = (obligation?: Obligation) => {
        setCompanySearch('');
        if (obligation) {
            setEditingObligation(obligation);
            form.reset({
                ...obligation,
                internal_note: obligation.internal_note || '',
                competency: obligation.competency || '',
                alert_recipient_email: obligation.alert_recipient_email || '',
                tax_regimes: obligation.tax_regimes || ['simples', 'presumido', 'real', 'domestico'],
                competency_rule: obligation.competency_rule || 'previous_month',
                company_ids: obligation.company_ids || []
            });
        } else {
            setEditingObligation(null);
            form.reset({
                name: '',
                type: 'guia',
                department: 'DP',
                default_due_day: 5,
                is_user_editable: true,
                alert_days: [10, 5, 3],
                alert_recipient_email: 'dp@jlviana.com.br',
                periodicity: 'mensal',
                is_active: true,
                internal_note: '',
                competency: '',
                due_rule: 'dia fixo',
                anticipate_on_weekend: false,
                tax_regimes: ['simples', 'presumido', 'real', 'domestico'],
                competency_rule: 'previous_month',
                company_ids: [] as string[]
            });
        }
        setIsDialogOpen(true);
    };

    const onSubmit = async (values: any) => {
        try {
            if (editingObligation) {
                await updateObligation(editingObligation.id, values);
            } else {
                await createObligation(values);
            }
            setIsDialogOpen(false);
        } catch (error) {
            console.error('Submit error:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Tem certeza que deseja excluir esta obrigação?')) {
            await deleteObligation(id);
        }
    };

    const handleToggleStatus = async (obligation: Obligation) => {
        const nextStatus = !obligation.is_active;
        try {
            await updateObligation(obligation.id, { is_active: nextStatus });
            toast.success(`Obrigação ${nextStatus ? 'ativada' : 'inativada'} com sucesso`);
        } catch (error) {
            console.error('Toggle status error:', error);
        }
    };

    const getObligationTypeBadge = (type: string) => {
        const types: Record<string, { color: string, icon: any }> = {
            'guia': { color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: Clock },
            'imposto': { color: 'bg-red-500/10 text-red-600 border-red-500/20', icon: Building2 },
            'tarefa operacional': { color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', icon: CheckCircle2 },
            'obrigação acessória': { color: 'bg-amber-500/10 text-amber-600 border-amber-500/20', icon: Info },
            'envio de documento': { color: 'bg-purple-500/10 text-purple-600 border-purple-500/20', icon: Mail },
            'conferência interna': { color: 'bg-slate-500/10 text-slate-600 border-slate-500/20', icon: ShieldCheck },
        };
        const config = types[type] || types['guia'];
        return (
            <Badge className={`${config.color} gap-1.5 rounded-lg px-3 py-1 text-[12px] font-bold uppercase`}>
                <config.icon className="h-3.5 w-3.5" /> {type}
            </Badge>
        );
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-10">
            {/* Header */}
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between pt-4">
                <div>
                    <h1 className="text-4xl font-extralight tracking-tight text-foreground">Gestão de <span className="text-primary font-normal">Obrigações</span></h1>
                    <p className="text-xs font-normal text-muted-foreground uppercase tracking-[0.3em] mt-2 opacity-70">
                        {officeName} • Configurações de Tarefas & Alertas
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Button 
                        onClick={() => handleOpenDialog()}
                        className="h-12 rounded-2xl px-6 gap-2 shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95"
                    >
                        <Plus className="h-5 w-5" /> Cadastrar Obrigação
                    </Button>
                </div>
            </div>

            {/* Filters Area */}
            <div className="space-y-4">
                {/* Stats row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-primary/5 rounded-2xl p-4 border border-primary/15 flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Filter className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                            <p className="text-2xl font-light text-primary">{obligations.length}</p>
                            <p className="text-[10px] uppercase font-bold tracking-widest text-primary/60">Total</p>
                        </div>
                    </div>
                    <div className="bg-emerald-500/5 rounded-2xl p-4 border border-emerald-500/15 flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-light text-emerald-600">{obligations.filter(o => o.is_active).length}</p>
                            <p className="text-[10px] uppercase font-bold tracking-widest text-emerald-600/60">Ativas</p>
                        </div>
                    </div>
                    <div className="bg-blue-500/5 rounded-2xl p-4 border border-blue-500/15 flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
                            <Building2 className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-light text-blue-600">{obligations.filter(o => o.department === 'Fiscal').length}</p>
                            <p className="text-[10px] uppercase font-bold tracking-widest text-blue-600/60">Fiscal</p>
                        </div>
                    </div>
                    <div className="bg-violet-500/5 rounded-2xl p-4 border border-violet-500/15 flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-violet-500/10 flex items-center justify-center">
                            <ShieldCheck className="h-4 w-4 text-violet-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-light text-violet-600">{obligations.filter(o => o.department === 'DP').length}</p>
                            <p className="text-[10px] uppercase font-bold tracking-widest text-violet-600/60">Dep. Pessoal</p>
                        </div>
                    </div>
                </div>

                {/* Filter bar */}
                <div className="bg-card/50 backdrop-blur-md rounded-2xl p-4 border border-border/40 shadow-sm">
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Search */}
                        <div className="flex-1 min-w-[220px] relative">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                            <Input
                                placeholder="Buscar obrigação..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="h-12 rounded-xl border-border/20 bg-muted/20 pl-10 font-normal text-sm focus-visible:ring-primary/20"
                            />
                        </div>

                        {/* Department */}
                        <select
                            value={filterDept}
                            onChange={(e) => setFilterDept(e.target.value)}
                            className={`h-12 rounded-xl border px-4 text-sm font-normal outline-none transition-all focus:ring-2 focus:ring-primary/20 ${
                                filterDept !== 'all' ? 'bg-primary/10 border-primary/30 text-primary font-medium' : 'bg-muted/20 border-border/20 text-muted-foreground'
                            }`}
                        >
                            <option value="all">Todos Departamentos</option>
                            <option value="Fiscal">Departamento Fiscal</option>
                            <option value="DP">Departamento Pessoal</option>
                            <option value="Contábil">Departamento Contábil</option>
                        </select>

                        {/* Type */}
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className={`h-12 rounded-xl border px-4 text-sm font-normal outline-none transition-all focus:ring-2 focus:ring-primary/20 ${
                                filterType !== 'all' ? 'bg-primary/10 border-primary/30 text-primary font-medium' : 'bg-muted/20 border-border/20 text-muted-foreground'
                            }`}
                        >
                            <option value="all">Todos os Tipos</option>
                            <option value="guia">Guia</option>
                            <option value="imposto">Imposto</option>
                            <option value="tarefa operacional">Tarefa Operacional</option>
                            <option value="obrigação acessória">Obrigação Acessória</option>
                            <option value="envio de documento">Envio de Documento</option>
                            <option value="conferência interna">Conferência Interna</option>
                        </select>

                        {/* Tax Regime */}
                        <select
                            value={filterRegime}
                            onChange={(e) => setFilterRegime(e.target.value)}
                            className={`h-12 rounded-xl border px-4 text-sm font-normal outline-none transition-all focus:ring-2 focus:ring-primary/20 ${
                                filterRegime !== 'all' ? 'bg-primary/10 border-primary/30 text-primary font-medium' : 'bg-muted/20 border-border/20 text-muted-foreground'
                            }`}
                        >
                            <option value="all">Todos os Regimes</option>
                            <option value="simples">Simples Nacional</option>
                            <option value="presumido">Lucro Presumido</option>
                            <option value="real">Lucro Real</option>
                            <option value="domestico">Doméstico</option>
                        </select>

                        {/* Periodicity */}
                        <select
                            value={filterPeriod}
                            onChange={(e) => setFilterPeriod(e.target.value)}
                            className={`h-12 rounded-xl border px-4 text-sm font-normal outline-none transition-all focus:ring-2 focus:ring-primary/20 ${
                                filterPeriod !== 'all' ? 'bg-primary/10 border-primary/30 text-primary font-medium' : 'bg-muted/20 border-border/20 text-muted-foreground'
                            }`}
                        >
                            <option value="all">Todas Periodicidades</option>
                            <option value="mensal">Mensal</option>
                            <option value="trimestral">Trimestral</option>
                            <option value="anual">Anual</option>
                            <option value="eventual">Eventual</option>
                        </select>

                        {/* Status */}
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className={`h-12 rounded-xl border px-4 text-sm font-normal outline-none transition-all focus:ring-2 focus:ring-primary/20 ${
                                filterStatus !== 'all' ? 'bg-primary/10 border-primary/30 text-primary font-medium' : 'bg-muted/20 border-border/20 text-muted-foreground'
                            }`}
                        >
                            <option value="all">Status: Todos</option>
                            <option value="active">Somente Ativas</option>
                            <option value="inactive">Somente Inativas</option>
                        </select>

                        {/* Clear filters */}
                        {activeFilterCount > 0 && (
                            <button
                                onClick={clearAllFilters}
                                className="h-12 rounded-xl px-5 flex items-center gap-2 text-sm font-medium text-destructive bg-destructive/5 border border-destructive/20 hover:bg-destructive/10 transition-all"
                            >
                                <X className="h-4 w-4" />
                                Limpar ({activeFilterCount})
                            </button>
                        )}
                    </div>

                    {/* Active filter chips */}
                    {activeFilterCount > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border/20">
                            {searchTerm && (
                                <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-[12px] font-bold uppercase px-4 py-1.5 rounded-full border border-primary/20">
                                    <Search className="h-3 w-3" /> "{searchTerm}"
                                    <button onClick={() => setSearchTerm('')}><X className="h-2.5 w-2.5" /></button>
                                </span>
                            )}
                            {filterDept !== 'all' && (
                                <span className="inline-flex items-center gap-1.5 bg-blue-500/10 text-blue-600 text-[12px] font-bold uppercase px-4 py-1.5 rounded-full border border-blue-500/20">
                                    <Building2 className="h-3 w-3" /> {filterDept}
                                    <button onClick={() => setFilterDept('all')}><X className="h-2.5 w-2.5" /></button>
                                </span>
                            )}
                            {filterType !== 'all' && (
                                <span className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-600 text-[12px] font-bold uppercase px-4 py-1.5 rounded-full border border-amber-500/20">
                                    <Clock className="h-3 w-3" /> {filterType}
                                    <button onClick={() => setFilterType('all')}><X className="h-2.5 w-2.5" /></button>
                                </span>
                            )}
                            {filterRegime !== 'all' && (
                                <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 text-[12px] font-bold uppercase px-4 py-1.5 rounded-full border border-emerald-500/20">
                                    <ShieldCheck className="h-3 w-3" /> {filterRegime}
                                    <button onClick={() => setFilterRegime('all')}><X className="h-2.5 w-2.5" /></button>
                                </span>
                            )}
                            {filterPeriod !== 'all' && (
                                <span className="inline-flex items-center gap-1.5 bg-violet-500/10 text-violet-600 text-[12px] font-bold uppercase px-4 py-1.5 rounded-full border border-violet-500/20">
                                    <CalendarIcon className="h-3 w-3" /> {filterPeriod}
                                    <button onClick={() => setFilterPeriod('all')}><X className="h-2.5 w-2.5" /></button>
                                </span>
                            )}
                            {filterStatus !== 'all' && (
                                <span className="inline-flex items-center gap-1.5 bg-rose-500/10 text-rose-600 text-[12px] font-bold uppercase px-4 py-1.5 rounded-full border border-rose-500/20">
                                    <CheckCircle2 className="h-3 w-3" /> {filterStatus === 'active' ? 'Ativas' : 'Inativas'}
                                    <button onClick={() => setFilterStatus('all')}><X className="h-2.5 w-2.5" /></button>
                                </span>
                            )}
                            <span className="text-xs text-muted-foreground/50 self-center ml-1">
                                {filteredObligations.length} resultado{filteredObligations.length !== 1 ? 's' : ''}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Table Area */}
            <Card className="rounded-[2.5rem] border-border/40 bg-card/30 backdrop-blur-md shadow-2xl overflow-hidden">
                <CardContent className="p-0 overflow-x-auto scrollbar-thin scrollbar-thumb-primary/10 scrollbar-track-transparent">
                    <Table className="min-w-[1000px]">
                        <TableHeader className="bg-muted/30 text-nowrap">
                            <TableRow className="hover:bg-transparent border-border/10">
                                <TableHead className="py-6 px-6 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60 w-[25%] min-w-[200px]">Obrigação</TableHead>
                                <TableHead className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">Tipo</TableHead>
                                <TableHead className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">Regimes</TableHead>
                                <TableHead className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">Setor</TableHead>
                                <TableHead className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60 text-center">Venc.</TableHead>
                                <TableHead className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">Alertas</TableHead>
                                <TableHead className="text-right px-6 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60 w-[140px]">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="py-32 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="h-10 w-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                            <p className="text-xs uppercase tracking-widest font-light text-muted-foreground">Carregando obrigações...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredObligations.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="py-24 text-center">
                                        <div className="flex flex-col items-center gap-4 opacity-30">
                                            <AlertCircle className="h-16 w-16 stroke-[1px]" />
                                            <div className="space-y-1">
                                                <p className="text-sm uppercase tracking-[0.2em] font-medium">Nenhuma obrigação encontrada</p>
                                                <p className="text-[10px] font-light">Cadastre sua primeira obrigação clicando no botão acima</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredObligations.map((o) => (
                                    <TableRow key={o.id} className="group hover:bg-primary/[0.02] border-border/10 transition-all duration-300">
                                        <TableCell className="py-5 px-6">
                                            <div className="flex flex-col">
                                                <span className="text-base font-medium text-foreground tracking-tight">{o.name}</span>
                                                <div className="flex items-center gap-2 mt-1.5">
                                                    {!o.is_active && <Badge variant="destructive" className="text-[10px] h-5 uppercase px-2">Inativa</Badge>}
                                                    <span className="text-xs font-medium text-muted-foreground/60 tracking-wider truncate max-w-[250px]">{o.internal_note || 'Sem observações'}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {getObligationTypeBadge(o.type)}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                                                {o.tax_regimes?.map(regime => (
                                                    <Badge key={regime} variant="secondary" className="text-[10px] h-5 uppercase px-2 bg-muted/50 text-muted-foreground border-none">
                                                        {regime}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-xs font-mono py-1 px-3 border-border/50 text-muted-foreground">
                                                {o.department}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center font-mono text-sm font-bold text-primary">
                                            {o.default_due_day < 10 ? `0${o.default_due_day}` : o.default_due_day}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex items-center gap-2">
                                                    <Bell className="h-3.5 w-3.5 text-amber-500" />
                                                    <span className="text-xs font-medium text-amber-600">
                                                        {o.alert_days.join(', ')} dias antes
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Mail className="h-3.5 w-3.5 text-muted-foreground/40" />
                                                    <span className="text-[11px] font-mono text-muted-foreground/60">
                                                        {o.alert_recipient_email}
                                                    </span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right px-6">
                                            <div className="flex items-center justify-end gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button 
                                                                variant="ghost" 
                                                                size="icon" 
                                                                className={cn(
                                                                    "h-8 w-8 rounded-lg transition-all",
                                                                    o.is_active 
                                                                        ? "hover:bg-amber-500/10 text-amber-500" 
                                                                        : "hover:bg-emerald-500/10 text-emerald-500"
                                                                )}
                                                                onClick={() => handleToggleStatus(o)}
                                                            >
                                                                {o.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent className="rounded-xl border-border/20 bg-card/95 backdrop-blur-md shadow-xl">
                                                            <p className="text-[10px] font-bold uppercase tracking-widest">
                                                                {o.is_active ? 'Inativar Obrigação' : 'Ativar Obrigação'}
                                                            </p>
                                                        </TooltipContent>
                                                    </Tooltip>

                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button 
                                                                variant="ghost" 
                                                                size="icon" 
                                                                className="h-8 w-8 rounded-lg hover:bg-primary/10 text-primary"
                                                                onClick={() => handleOpenDialog(o)}
                                                            >
                                                                <Edit2 className="h-4 w-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent className="rounded-xl border-border/20 bg-card/95 backdrop-blur-md shadow-xl">
                                                            <p className="text-[10px] font-bold uppercase tracking-widest">Editar Obrigação</p>
                                                        </TooltipContent>
                                                    </Tooltip>

                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button 
                                                                variant="ghost" 
                                                                size="icon" 
                                                                className="h-8 w-8 rounded-lg hover:bg-destructive/10 text-destructive"
                                                                onClick={() => handleDelete(o.id)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent className="rounded-xl border-border/20 bg-card/95 backdrop-blur-md shadow-xl">
                                                            <p className="text-[10px] font-bold uppercase tracking-widest">Excluir Permanente</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Modal for Create/Edit */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[850px] max-h-[90vh] overflow-y-auto rounded-[2rem] p-0 border-none shadow-2xl">
                    <DialogHeader className="p-8 bg-muted/20 border-b border-border/10">
                        <DialogTitle className="text-2xl font-light">
                            {editingObligation ? 'Editar' : 'Cadastrar'} <span className="text-primary font-normal">Obrigação</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs uppercase tracking-widest font-bold text-muted-foreground/60">
                            Defina as regras e alertas para esta tarefa automatizada
                        </DialogDescription>
                    </DialogHeader>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem className="col-span-2">
                                            <FormLabel className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground">Nome da Obrigação</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="Ex: DAS Simples, FGTS Digital..." className="h-12 rounded-xl border-border/20 bg-muted/10 font-light" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="type"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground">Tipo</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="h-12 rounded-xl border-border/20 bg-muted/10 font-normal text-sm">
                                                        <SelectValue placeholder="Selecione o tipo" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="rounded-xl border-border/20 shadow-xl">
                                                    <SelectItem value="guia" className="text-sm">Guia</SelectItem>
                                                    <SelectItem value="imposto" className="text-sm">Imposto</SelectItem>
                                                    <SelectItem value="tarefa operacional" className="text-sm">Tarefa Operacional</SelectItem>
                                                    <SelectItem value="obrigação acessória" className="text-sm">Obrigação Acessória</SelectItem>
                                                    <SelectItem value="envio de documento" className="text-sm">Envio de Documento</SelectItem>
                                                    <SelectItem value="conferência interna" className="text-sm">Conferência Interna</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="department"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground">Departamento Responsável</FormLabel>
                                            <Select onValueChange={(val) => {
                                                field.onChange(val);
                                                // Auto set email based on department
                                                if (val === 'DP') form.setValue('alert_recipient_email', 'dp@jlviana.com.br');
                                                if (val === 'Fiscal') form.setValue('alert_recipient_email', 'fiscal@jlviana.com.br');
                                            }} defaultValue={field.value} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="h-12 rounded-xl border-border/20 bg-muted/10 font-normal text-sm">
                                                        <SelectValue placeholder="Selecione o depto" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="rounded-xl border-border/20 shadow-xl">
                                                    <SelectItem value="DP" className="text-sm">Departamento Pessoal</SelectItem>
                                                    <SelectItem value="Fiscal" className="text-sm">Departamento Fiscal</SelectItem>
                                                    <SelectItem value="Contábil" className="text-sm">Departamento Contábil</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="default_due_day"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground">Dia Padrão de Vencimento</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} min={1} max={31} className="h-12 rounded-xl border-border/20 bg-muted/10 font-light" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="alert_days"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground">Alertas (Dias Antes)</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant="outline"
                                                            role="combobox"
                                                            className={cn(
                                                                "h-12 w-full justify-between rounded-xl border-border/20 bg-muted/10 font-light",
                                                                !field.value?.length && "text-muted-foreground"
                                                            )}
                                                        >
                                                            {field.value?.length 
                                                                ? `${field.value.slice().sort((a,b) => b-a).join(', ')} dias antes`
                                                                : "Selecione os dias"}
                                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[300px] p-0 rounded-xl border-border/20 shadow-xl overflow-hidden" align="start">
                                                    <div className="p-4 bg-muted/20 border-b border-border/10">
                                                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Sugestões de Alerta</p>
                                                    </div>
                                                    <div className="p-2 grid grid-cols-2 gap-1 bg-card">
                                                        {[30, 15, 10, 7, 5, 4, 3, 2, 1, 0].map((day) => {
                                                            const isSelected = field.value?.includes(day);
                                                            return (
                                                                <Button
                                                                    key={day}
                                                                    variant="ghost"
                                                                    type="button"
                                                                    className={cn(
                                                                        "justify-start font-normal text-xs h-9 rounded-lg px-3",
                                                                        isSelected && "bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary"
                                                                    )}
                                                                    onClick={() => {
                                                                        const current = field.value || [];
                                                                        const updated = isSelected
                                                                            ? current.filter(d => d !== day)
                                                                            : [...current, day].sort((a,b) => b-a);
                                                                        field.onChange(updated);
                                                                    }}
                                                                >
                                                                    <div className={cn(
                                                                        "mr-2 flex h-4 w-4 items-center justify-center rounded border border-primary/20 transition-all",
                                                                        isSelected ? "bg-primary border-primary" : "opacity-50"
                                                                    )}>
                                                                        {isSelected && <Check className="h-3 w-3 text-white" />}
                                                                    </div>
                                                                    {day === 0 ? "No dia" : `${day} dias antes`}
                                                                </Button>
                                                            );
                                                        })}
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                            <FormDescription className="text-[9px] text-muted-foreground italic px-1">Selecione quantos lembretes desejar.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="alert_recipient_email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground">E-mails para Alerta (separe por vírgula)</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="email1@jlviana.com.br, email2@jlviana.com.br" className="h-12 rounded-xl border-border/20 bg-muted/10 font-light text-xs" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="periodicity"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground">Periodicidade</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="h-12 rounded-xl border-border/20 bg-muted/10 font-normal text-sm">
                                                        <SelectValue placeholder="Selecione" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="rounded-xl border-border/20 shadow-xl">
                                                    <SelectItem value="mensal" className="text-sm">Mensal</SelectItem>
                                                    <SelectItem value="trimestral" className="text-sm">Trimestral</SelectItem>
                                                    <SelectItem value="anual" className="text-sm">Anual</SelectItem>
                                                    <SelectItem value="eventual" className="text-sm">Eventual</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="due_rule"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground">Regra de Vencimento</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="h-12 rounded-xl border-border/20 bg-muted/10 font-normal text-sm">
                                                        <SelectValue placeholder="Selecione" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="rounded-xl border-border/20 shadow-xl">
                                                    <SelectItem value="dia fixo" className="text-sm">Dia Fixo</SelectItem>
                                                    <SelectItem value="regra especial" className="text-sm">Regra Especial</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="competency_rule"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground">Regra de Competência</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="h-12 rounded-xl border-border/20 bg-muted/10 font-normal text-sm">
                                                        <SelectValue placeholder="Selecione" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="rounded-xl border-border/20 shadow-xl">
                                                    <SelectItem value="previous_month" className="text-sm">Mês Anterior (M-1)</SelectItem>
                                                    <SelectItem value="current_month" className="text-sm">Mês Atual (M)</SelectItem>
                                                    <SelectItem value="quarterly" className="text-sm">Trimestral</SelectItem>
                                                    <SelectItem value="annual" className="text-sm">Anual</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="col-span-2 space-y-3 p-4 border rounded-2xl bg-muted/10 border-border/10">
                                    <FormLabel className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground">Regimes Tributários Aplicáveis</FormLabel>
                                    <div className="flex flex-wrap gap-4">
                                        {['simples', 'presumido', 'real', 'domestico'].map((regime) => (
                                            <FormField
                                                key={regime}
                                                control={form.control}
                                                name="tax_regimes"
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                                        <FormControl>
                                                            <Checkbox
                                                                checked={field.value?.includes(regime)}
                                                                onCheckedChange={(checked) => {
                                                                    const current = field.value || [];
                                                                    const updated = checked
                                                                        ? [...current, regime]
                                                                        : current.filter((r: string) => r !== regime);
                                                                    field.onChange(updated);
                                                                }}
                                                            />
                                                        </FormControl>
                                                        <FormLabel className="text-[12px] font-medium uppercase cursor-pointer">
                                                            {regime}
                                                        </FormLabel>
                                                    </FormItem>
                                                )}
                                            />
                                        ))}
                                    </div>
                                </div>
                                
                                <div className="col-span-2 space-y-3 p-4 border rounded-2xl bg-primary/[0.02] border-primary/10">
                                    <div className="flex flex-col gap-1">
                                        <FormLabel className="text-[12px] font-bold uppercase tracking-widest text-primary/80">Vincular Empresas Especificamente</FormLabel>
                                        <FormDescription className="text-[10px] text-muted-foreground uppercase tracking-widest font-normal">
                                            Se houver empresas selecionadas abaixo, a obrigação será gerada EXCLUSIVAMENTE para elas.
                                        </FormDescription>
                                    </div>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                                        <Input
                                            placeholder="Buscar empresa..."
                                            value={companySearch}
                                            onChange={(e) => setCompanySearch(e.target.value)}
                                            className="h-10 rounded-xl border-border/20 bg-background pl-9 font-normal text-xs"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1 max-h-56 overflow-y-auto pr-2 bg-card border rounded-xl p-3 scrollbar-thin scrollbar-thumb-primary/10">
                                        {clients.filter(c => c.isActive && ((c.nomeFantasia || '').toLowerCase().includes(companySearch.toLowerCase()) || (c.razaoSocial || '').toLowerCase().includes(companySearch.toLowerCase()))).sort((a,b) => (a.nomeFantasia || a.razaoSocial || '').localeCompare(b.nomeFantasia || b.razaoSocial || '')).map((client) => (
                                            <FormField
                                                key={client.id}
                                                control={form.control}
                                                name="company_ids"
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-lg p-2 hover:bg-muted/50 transition-colors">
                                                        <FormControl>
                                                            <Checkbox
                                                                checked={field.value?.includes(client.id)}
                                                                onCheckedChange={(checked) => {
                                                                    const current = field.value || [];
                                                                    const updated = checked
                                                                        ? [...current, client.id]
                                                                        : current.filter((id: string) => id !== client.id);
                                                                    field.onChange(updated);
                                                                }}
                                                            />
                                                        </FormControl>
                                                        <FormLabel className="text-xs font-medium cursor-pointer flex-1 truncate">
                                                            {client.nomeFantasia || client.razaoSocial}
                                                        </FormLabel>
                                                    </FormItem>
                                                )}
                                            />
                                        ))}
                                        {clients.filter(c => c.isActive).length === 0 && (
                                            <p className="text-xs text-muted-foreground text-center py-4">Nenhuma empresa ativa cadastrada.</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-6 pt-4">
                                <FormField
                                    control={form.control}
                                    name="is_active"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center space-x-3 space-y-0 p-4 border rounded-2xl bg-muted/5 border-border/10">
                                            <FormControl>
                                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel className="text-[12px] font-bold uppercase tracking-widest">Obrigação Ativa</FormLabel>
                                            </div>
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="anticipate_on_weekend"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center space-x-3 space-y-0 p-4 border rounded-2xl bg-muted/5 border-border/10">
                                            <FormControl>
                                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel className="text-[12px] font-bold uppercase tracking-widest">Antecipar Fim de Semana/Feriado</FormLabel>
                                            </div>
                                        </FormItem>
                                    )}
                                />
                                
                                <FormField
                                    control={form.control}
                                    name="is_user_editable"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center space-x-3 space-y-0 p-4 border rounded-2xl bg-muted/5 border-border/10">
                                            <FormControl>
                                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel className="text-[12px] font-bold uppercase tracking-widest">Permitir Edição pelo Usuário</FormLabel>
                                            </div>
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="internal_note"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground">Observação Interna</FormLabel>
                                        <FormControl>
                                            <Textarea {...field} value={field.value || ''} placeholder="Notas sobre legislação, regras específicas..." className="rounded-xl border-border/20 bg-muted/10 font-normal text-sm resize-none h-32" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <DialogFooter className="pt-6 border-t border-border/10">
                                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl h-12 text-[12px] font-bold uppercase tracking-widest px-8">Cancelar</Button>
                                <Button type="submit" className="rounded-xl h-12 text-[12px] font-bold uppercase tracking-widest px-10 shadow-lg shadow-primary/20">
                                    {editingObligation ? 'Salvar Alterações' : 'Confirmar Cadastro'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
