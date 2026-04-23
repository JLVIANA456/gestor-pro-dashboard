import { useState, useMemo } from 'react';
import { useDPTasks, DPTask, SLAStatus } from '@/hooks/useDPTasks';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
    Plus, 
    Calendar, 
    Search, 
    Filter, 
    ArrowRight, 
    Users, 
    Timer, 
    CheckCircle2, 
    AlertCircle, 
    Clock,
    MoreHorizontal,
    Edit,
    Trash2,
    Building2,
    TrendingUp,
    LayoutDashboard,
    Loader2,
    TableProperties
} from 'lucide-react';
import { DPDemandModal } from '@/components/dp/DPDemandModal';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Input } from '@/components/ui/input';
import * as XLSX from 'xlsx';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function DPDemands() {
    const { tasks, loading, deleteTask, refresh } = useDPTasks();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<DPTask | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<string>('all');

    // Metrics Calculation
    const metrics = useMemo(() => {
        const total = tasks.length;
        const concluided = tasks.filter(t => t.status === 'CONCLUIDO').length;
        const delayed = tasks.filter(t => t.status === 'PENDENTE' && t.slaStatus === 'ATRASADO').length;
        const atRisk = tasks.filter(t => t.status === 'PENDENTE' && t.slaStatus === 'EM_RISCO').length;
        const onTime = total > 0 ? ((concluided + tasks.filter(t => t.status === 'PENDENTE' && t.slaStatus === 'FUTURO').length) / total) * 100 : 0;

        return { total, concluided, delayed, atRisk, onTime: onTime.toFixed(1) };
    }, [tasks]);

    const filteredTasks = useMemo(() => {
        return tasks.filter(t => {
            const matchesSearch = 
                t.empresaNome?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.colaboradorNome?.toLowerCase().includes(searchQuery.toLowerCase());
            
            const matchesType = filterType === 'all' || t.tipoProcesso === filterType;
            
            return matchesSearch && matchesType;
        });
    }, [tasks, searchQuery, filterType]);

    const handleEdit = (task: DPTask) => {
        setSelectedTask(task);
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        setSelectedTask(null);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Tem certeza que deseja excluir esta demanda?')) {
            await deleteTask(id);
        }
    };

    const handleExportXLSX = () => {
        const dataToExport = filteredTasks.map(t => ({
            'Tipo': tipoLabels[t.tipoProcesso],
            'Empresa': t.empresaNome,
            'Colaborador': t.colaboradorNome,
            'Data de início': t.dataBase ? format(parseISO(t.dataBase), 'dd/MM/yyyy') : '',
            'Prazo Legal': t.prazo ? format(parseISO(t.prazo), 'dd/MM/yyyy') : '',
            'Data Envio': t.dataEnvio ? format(parseISO(t.dataEnvio), 'dd/MM/yyyy') : '',
            'Data Pagamento': t.dataPagamento ? format(parseISO(t.dataPagamento), 'dd/MM/yyyy') : '',
            'SLA': t.slaStatus,
            'Status': t.status,
            'Responsável': t.responsavelNome || 'Não Definido'
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Demandas");
        XLSX.writeFile(wb, `Relatorio_Demandas_DP_${format(new Date(), 'dd_MM_yyyy_HHmm')}.xlsx`);
    };

    const getSlaBadge = (status?: SLAStatus) => {
        switch (status) {
            case 'ATRASADO': return <Badge variant="destructive" className="bg-red-500/10 text-red-700 border-red-500/20 text-[9px] uppercase tracking-widest font-black h-5">Atrasado</Badge>;
            case 'EM_RISCO': return <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-500/20 text-[9px] uppercase tracking-widest font-black h-5">Vence Hoje</Badge>;
            case 'FUTURO': return <Badge variant="secondary" className="bg-blue-500/10 text-blue-700 border-blue-500/20 text-[9px] uppercase tracking-widest font-black h-5">Pendente</Badge>;
            case 'NO_PRAZO': return <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20 text-[9px] uppercase tracking-widest font-black h-5">Entregue</Badge>;
            default: return null;
        }
    };

    const tipoLabels: Record<string, string> = {
        admissao: 'Admissão',
        rescisao: 'Rescisão',
        ferias: 'Férias',
        recalculo: 'Recálculo',
        rescisao_complementar: 'Resc. Comp.',
        levantamento_debitos: 'Débitos'
    };

    if (loading && tasks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-red-600 opacity-20" />
                <p className="text-xs uppercase tracking-widest text-muted-foreground animate-pulse">Carregando Centro de Comando...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-light tracking-tight text-foreground flex items-center gap-4">
                        Centro de Comando <span className="text-red-600 font-normal">DP</span>
                        <div className="h-2 w-2 rounded-full bg-red-600 animate-pulse mt-2" />
                    </h1>
                    <p className="text-xs font-normal text-muted-foreground uppercase tracking-[0.3em] mt-2">Gestão de Demandas Diárias & Controle de SLA Operacional</p>
                </div>
                
                <div className="flex items-center gap-4">
                    <Button 
                        variant="outline"
                        onClick={handleExportXLSX}
                        className="rounded-2xl h-14 px-8 font-normal uppercase tracking-widest text-[10px] border-border/40 hover:bg-muted/10 transition-all flex items-center gap-2"
                    >
                        <TableProperties className="h-4 w-4" /> Exportar XLSX
                    </Button>

                    <Button 
                        onClick={handleAdd}
                        className="bg-red-600 hover:bg-red-700 text-white rounded-2xl h-14 px-8 font-normal uppercase tracking-widest text-xs shadow-xl shadow-red-500/20 transition-all active:scale-95 group"
                    >
                        <Plus className="mr-2 h-5 w-5 transition-transform group-hover:rotate-90" /> Nova Demanda
                    </Button>
                </div>
            </div>

            {/* Premium Dashboard Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* 1. SLA Operacional */}
                <div className="relative group overflow-hidden rounded-[2rem] border border-border/50 bg-card p-6 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1 isolation-auto">
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-emerald-500/5 blur-2xl transition-all group-hover:bg-emerald-500/10" />
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20">
                            <Timer className="h-5 w-5 text-emerald-600 dark:text-emerald-400 gap-2" />
                        </div>
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                    </div>
                    <h3 className="text-[11px] font-medium text-muted-foreground uppercase tracking-[0.2em] mb-1">SLA Operacional</h3>
                    <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-5xl font-light tracking-tighter text-foreground">{metrics.onTime}</span>
                        <span className="text-2xl font-light text-muted-foreground">%</span>
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">Performance no Prazo</span>
                    </div>
                </div>

                {/* 2. Concluídos */}
                <div className="relative group overflow-hidden rounded-[2rem] border border-border/50 bg-card p-6 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1 isolation-auto">
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-blue-500/5 blur-2xl transition-all group-hover:bg-blue-500/10" />
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-2xl bg-blue-50 border border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20">
                            <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>
                    <h3 className="text-[11px] font-medium text-muted-foreground uppercase tracking-[0.2em] mb-1">Concluídos</h3>
                    <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-5xl font-light tracking-tighter text-foreground">{metrics.concluided}</span>
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                         <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                        <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">Processos Finalizados</span>
                    </div>
                </div>

                {/* 3. Vence Hoje / Em Risco */}
                <div className="relative group overflow-hidden rounded-[2rem] border border-amber-200/50 bg-gradient-to-b from-amber-50/50 to-transparent dark:from-amber-950/20 dark:border-amber-900/50 p-6 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1 isolation-auto">
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-amber-500/10 blur-2xl transition-all group-hover:bg-amber-500/20" />
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-2xl bg-amber-100 border border-amber-200 dark:bg-amber-500/20 dark:border-amber-500/30">
                            <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        </div>
                    </div>
                    <h3 className="text-[11px] font-medium text-amber-800/70 dark:text-amber-500/70 uppercase tracking-[0.2em] mb-1">Vence Hoje</h3>
                    <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-5xl font-light tracking-tighter text-amber-900 dark:text-amber-400">{metrics.atRisk}</span>
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                         <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
                        <span className="text-[10px] text-amber-600 font-bold uppercase tracking-widest">Alerta de Risco</span>
                    </div>
                </div>

                {/* 4. Atrasados */}
                <div className="relative group overflow-hidden rounded-[2rem] border border-red-200/50 bg-gradient-to-b from-red-50/50 to-transparent dark:from-red-950/20 dark:border-red-900/50 p-6 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1 isolation-auto">
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-red-500/10 blur-2xl transition-all group-hover:bg-red-500/20" />
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-2xl bg-red-100 border border-red-200 dark:bg-red-500/20 dark:border-red-500/30">
                            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                        </div>
                    </div>
                    <h3 className="text-[11px] font-medium text-red-800/70 dark:text-red-500/70 uppercase tracking-[0.2em] mb-1">Atrasados</h3>
                    <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-5xl font-light tracking-tighter text-red-600 dark:text-red-400">{metrics.delayed}</span>
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                         <div className="h-1.5 w-1.5 rounded-full bg-red-600 animate-pulse" />
                        <span className="text-[10px] text-red-600 font-black uppercase tracking-widest">Pendências Legais</span>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="bg-card/50 backdrop-blur-xl rounded-[2.5rem] border border-border/40 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-border/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                        <Input 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Buscar por colaborador ou empresa..."
                            className="pl-12 h-12 rounded-2xl border-border/30 bg-muted/20 focus:ring-red-500/20 focus:border-red-500/20"
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 p-1 bg-muted/20 rounded-2xl border border-border/10">
                            {[
                                { id: 'all', label: 'Tudo' },
                                { id: 'admissao', label: 'Adm' },
                                { id: 'rescisao', label: 'Resc' },
                                { id: 'ferias', label: 'Férias' }
                            ].map(btn => (
                                <button
                                    key={btn.id}
                                    onClick={() => setFilterType(btn.id)}
                                    className={cn(
                                        "px-4 py-2 rounded-xl text-[10px] uppercase tracking-widest transition-all",
                                        filterType === btn.id ? "bg-card text-red-600 shadow-sm border border-border/10" : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    {btn.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-muted/30">
                            <TableRow className="border-border/10 hover:bg-transparent">
                                <TableHead className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-normal">Tipo</TableHead>
                                <TableHead className="py-5 text-[10px] uppercase tracking-[0.2em] font-normal text">Empresa / Colaborador</TableHead>
                                <TableHead className="py-5 text-[10px] uppercase tracking-[0.2em] font-normal">Data de início</TableHead>
                                <TableHead className="py-5 text-[10px] uppercase tracking-[0.2em] font-normal">Prazo Legal</TableHead>
                                <TableHead className="py-5 text-[10px] uppercase tracking-[0.2em] font-normal text-center">SLA</TableHead>
                                <TableHead className="py-5 text-[10px] uppercase tracking-[0.2em] font-normal">Responsável</TableHead>
                                <TableHead className="py-5 pr-8 text-[10px] uppercase tracking-[0.2em] font-normal text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredTasks.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-64 text-center">
                                        <div className="flex flex-col items-center justify-center opacity-20">
                                            <LayoutDashboard className="h-10 w-10 mb-2" />
                                            <p className="text-xs uppercase tracking-widest">Nenhuma demanda encontrada</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredTasks.map((task) => (
                                    <TableRow key={task.id} className="group border-border/5 hover:bg-muted/10 transition-colors">
                                        <TableCell className="px-8">
                                            <Badge variant="outline" className="rounded-lg bg-muted/20 text-[9px] uppercase tracking-tighter px-2 font-normal border-border/10">
                                                {tipoLabels[task.tipoProcesso]}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col -gap-1">
                                                <span className="text-sm font-medium text-foreground tracking-tight">{task.colaboradorNome}</span>
                                                <span className="text-[11px] text-muted-foreground/60 flex items-center gap-1">
                                                    <Building2 className="h-3 w-3" /> {task.empresaNome}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-xs font-light text-muted-foreground">{format(parseISO(task.dataBase), 'dd MMM yy', { locale: ptBR })}</span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col -gap-1">
                                                <span className={cn("text-xs font-bold", task.status === 'PENDENTE' && task.slaStatus === 'ATRASADO' ? "text-red-500 font-black" : "text-foreground")}>
                                                    {format(parseISO(task.prazo), 'dd/MM/yyyy')}
                                                </span>
                                                {task.atrasoDias !== undefined && task.atrasoDias > 0 && task.status === 'PENDENTE' && (
                                                    <span className="text-[10px] text-red-500/70 font-light">+{task.atrasoDias} dias de atraso</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {getSlaBadge(task.slaStatus)}
                                        </TableCell>
                                         <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="h-6 w-6 rounded-full bg-red-600/10 flex items-center justify-center text-[10px] text-red-700 font-bold uppercase">
                                                    {task.responsavelNome?.charAt(0) || <Users className="h-3 w-3" />}
                                                </div>
                                                <span className="text-xs font-light text-muted-foreground">{task.responsavelNome || 'Pendente'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right pr-8">
                                            <div className="flex justify-end gap-2">
                                                 <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEdit(task)}
                                                    className="h-9 w-9 rounded-xl hover:bg-red-500/5 hover:text-red-600 transition-all"
                                                >
                                                    <Edit className="h-4 w-4 opacity-50" />
                                                </Button>
                                                
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-muted/20">
                                                            <MoreHorizontal className="h-4 w-4 opacity-50" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="rounded-xl border-border bg-card">
                                                        <DropdownMenuItem onClick={() => handleEdit(task)} className="text-xs uppercase tracking-widest p-3">
                                                            <Edit className="mr-2 h-3.5 w-3.5" /> Editar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleDelete(task.id)} className="text-xs uppercase tracking-widest p-3 text-red-600 focus:bg-red-50 focus:text-red-600">
                                                            <Trash2 className="mr-2 h-3.5 w-3.5" /> Excluir
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <DPDemandModal 
                isOpen={isModalOpen}
                task={selectedTask}
                onClose={() => setIsModalOpen(false)}
                onSuccess={refresh}
            />
        </div>
    );
}
