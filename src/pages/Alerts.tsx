import { useState, useMemo, useEffect } from 'react';
import { 
    Bell, 
    Calendar, 
    Clock, 
    Shield, 
    Zap, 
    CheckCircle2, 
    AlertTriangle, 
    ArrowRight, 
    History, 
    Settings2, 
    Mail, 
    Loader2, 
    RefreshCw,
    Search,
    Filter,
    Power,
    Plus,
    Minus,
    Trash2,
    Users
} from 'lucide-react';
import { format, isSameDay, addDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useObligations, Obligation } from '@/hooks/useObligations';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useBranding } from '@/context/BrandingContext';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription,
    DialogFooter 
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface AlertHistory {
    id: string;
    obligation_id: string;
    client_id?: string;
    alert_day: number;
    competency: string;
    created_at?: string;
    sent_at?: string;
    obligation?: { name: string };
}

export default function Alerts() {
    const { obligations, loading: obsLoading, updateObligation } = useObligations();
    const { officeName } = useBranding();
    const [history, setHistory] = useState<AlertHistory[]>([]);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [editingEmail, setEditingEmail] = useState<{id: string, email: string} | null>(null);

    const { createObligation, deleteObligation, fetchObligations } = useObligations();

    const [formNew, setFormNew] = useState({
        name: '',
        department: 'Fiscal',
        type: 'guia' as any,
        default_due_day: 15,
        alert_days: [3, 1],
        alert_recipient_email: '',
        periodicity: 'mensal' as any
    });

    const fetchHistory = async () => {
        try {
            setHistoryLoading(true);
            const { data, error } = await supabase
                .from('obligation_alerts_sent')
                .select('*, obligation:obligations(name)')
                .order('created_at', { ascending: false })
                .limit(20);
            
            if (error) throw error;
            setHistory(data || []);
        } catch (error) {
            console.error('Erro ao buscar histórico:', error);
        } finally {
            setHistoryLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    const handleProcessAlerts = async () => {
        setIsProcessing(true);
        const toastId = toast.loading('Processando alertas de hoje...');
        try {
            const { data, error } = await supabase.functions.invoke('process-obligation-alerts');
            if (error) throw error;
            toast.success(`Sucesso! ${data.processedCount} alertas enviados.`, { id: toastId });
            fetchHistory();
        } catch (error: any) {
            console.error('Erro ao processar alertas:', error);
            toast.error(error.message || 'Erro ao disparar alertas manuais.', { id: toastId });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleToggleActive = async (id: string, currentStatus: boolean) => {
        try {
            await updateObligation(id, { is_active: !currentStatus });
        } catch (err) {
            // Error toast handled by hook
        }
    };

    const handleUpdateAlertDays = async (id: string, currentDays: number[], day: number, mode: 'add' | 'remove') => {
        try {
            let nextDays = [...currentDays];
            if (mode === 'add') {
                if (nextDays.includes(day)) return;
                nextDays.push(day);
            } else {
                nextDays = nextDays.filter(d => d !== day);
            }
            await updateObligation(id, { alert_days: nextDays.sort((a, b) => b - a) });
        } catch (err) {
            // Error toast handled by hook
        }
    };

    // Calculate upcoming alerts (next 7 days)
    const upcomingAlerts = useMemo(() => {
        if (!obligations) return [];
        const matches: any[] = [];
        const today = new Date();
        
        for (let i = 0; i <= 7; i++) {
            const targetDate = addDays(today, i);
            
            obligations.filter(o => o.is_active).forEach(obs => {
                // Approximate check: find if any alert_day + today corresponds to a due date
                // In a real scenario, this would check against active guides/tasks
            });
        }
        return matches;
    }, [obligations]);

    const handleCreate = async () => {
        try {
            if (!formNew.name) return toast.error("Nome é obrigatório.");
            await createObligation({
                ...formNew,
                is_active: true,
                is_user_editable: true,
                due_rule: 'dia fixo',
                anticipate_on_weekend: true,
                tax_regimes: ['simples', 'presumido', 'real'],
                competency_rule: 'previous_month',
                internal_note: '',
                competency: ''
            });
            setIsCreateModalOpen(false);
            setFormNew({
                name: '',
                department: 'Fiscal',
                type: 'guia' as any,
                default_due_day: 15,
                alert_days: [3, 1],
                alert_recipient_email: '',
                periodicity: 'mensal' as any
            });
        } catch (err) {}
    };

    const handleBatchDelete = async () => {
        if (!confirm(`Confirmar exclusão de ${selectedIds.length} obrigações?`)) return;
        try {
            for (const id of selectedIds) {
                await deleteObligation(id);
            }
            setSelectedIds([]);
            toast.success("Exclusão em lote concluída.");
        } catch (err) {}
    };

    const handleBatchToggle = async (status: boolean) => {
        try {
            for (const id of selectedIds) {
                await updateObligation(id, { is_active: status });
            }
            setSelectedIds([]);
        } catch (err) {}
    };

    const handleEmailUpdate = async () => {
        if (!editingEmail) return;
        try {
            await updateObligation(editingEmail.id, { alert_recipient_email: editingEmail.email });
            setIsEmailModalOpen(false);
            setEditingEmail(null);
        } catch (err) {}
    };

    const filteredObligations = useMemo(() => {
        return obligations.filter(o => 
            o.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            o.department.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [obligations, searchTerm]);

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-20">
            {/* Header Section */}
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between pt-10 px-4">
                <div className="space-y-4">
                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 py-2 px-5 rounded-full text-[10px] uppercase font-bold tracking-[0.3em] animate-pulse">
                        <Shield className="h-3 w-3 mr-2 fill-primary/20" /> Automação de Alertas Ativa
                    </Badge>
                    <h1 className="text-5xl font-extralight tracking-tight text-foreground leading-tight">
                        Gestão de <span className="text-primary font-normal">Alertas</span>
                    </h1>
                    <p className="text-xs font-medium text-muted-foreground uppercase opacity-60 tracking-[0.4em] max-w-lg">
                        Prevenção Antecipatória & Controle de Inadimplência.
                    </p>
                </div>

                <div className="flex bg-white/40 backdrop-blur-3xl border border-white/20 p-4 rounded-[40px] shadow-2xl shadow-primary/5">
                    <Button 
                        onClick={handleProcessAlerts}
                        disabled={isProcessing}
                        className="h-20 rounded-[30px] px-10 gap-5 bg-primary text-white shadow-2xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95 group overflow-hidden relative"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                        {isProcessing ? (
                            <Loader2 className="h-6 w-6 animate-spin" />
                        ) : (
                            <Zap className="h-6 w-6 fill-white" />
                        )}
                        <div className="flex flex-col items-start gap-0.5">
                            <span className="text-sm font-bold uppercase tracking-widest">Disparar Agora</span>
                            <span className="text-[9px] opacity-70 font-medium">Verificar todos os vencimentos</span>
                        </div>
                    </Button>
                </div>
            </div>

            {/* Config Summary & Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 px-4">
                <Card className="rounded-[2.5rem] border-none bg-emerald-500/5 p-8 flex items-center gap-6">
                    <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                        <Power className="h-7 w-7" />
                    </div>
                    <div>
                        <p className="text-[28px] font-light text-emerald-600 leading-none">{obligations.filter(o => o.is_active).length}</p>
                        <p className="text-[9px] uppercase font-black tracking-widest text-emerald-600/60 mt-2">Atalhos Ativos</p>
                    </div>
                </Card>
                <Card className="rounded-[2.5rem] border-none bg-blue-500/5 p-8 flex items-center gap-6">
                    <div className="h-14 w-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                        <Mail className="h-7 w-7" />
                    </div>
                    <div>
                        <p className="text-[28px] font-light text-blue-600 leading-none">100%</p>
                        <p className="text-[9px] uppercase font-black tracking-widest text-blue-600/60 mt-2">Fila Resend OK</p>
                    </div>
                </Card>
                <Card className="rounded-[2.5rem] border-none bg-amber-500/5 p-8 flex items-center gap-6">
                    <div className="h-14 w-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                        <Bell className="h-7 w-7" />
                    </div>
                    <div>
                        <p className="text-[28px] font-light text-amber-600 leading-none">{history.length}</p>
                        <p className="text-[9px] uppercase font-black tracking-widest text-amber-600/60 mt-2">Alertas Enviados (24h)</p>
                    </div>
                </Card>
                <div className="rounded-[2.5rem] border-2 border-dashed border-border/40 p-8 flex flex-col justify-center gap-2">
                    <p className="text-[10px] uppercase font-black text-muted-foreground/40 tracking-widest">Próxima Varredura</p>
                    <div className="flex items-center gap-2">
                         <Clock className="h-4 w-4 text-primary" />
                         <span className="text-xl font-light">Amanhã, 08:00</span>
                    </div>
                </div>
            </div>

            {/* Main Tabs Section */}
            <Tabs defaultValue="config" className="w-full px-4">
                <TabsList className="bg-muted/10 p-2 rounded-[2rem] gap-2 h-auto mb-10 border border-border/10">
                    <TabsTrigger value="config" className="rounded-2xl px-8 py-3 gap-2 data-[state=active]:bg-white data-[state=active]:shadow-lg text-[10px] font-black uppercase tracking-widest">
                        <Settings2 className="h-4 w-4" /> Configurar Regras
                    </TabsTrigger>
                    <TabsTrigger value="agenda" className="rounded-2xl px-8 py-3 gap-2 data-[state=active]:bg-white data-[state=active]:shadow-lg text-[10px] font-black uppercase tracking-widest">
                        <Calendar className="h-4 w-4" /> Agenda de Disparos
                    </TabsTrigger>
                    <TabsTrigger value="history" className="rounded-2xl px-8 py-3 gap-2 data-[state=active]:bg-white data-[state=active]:shadow-lg text-[10px] font-black uppercase tracking-widest">
                        <History className="h-4 w-4" /> Log de Atividade
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="config" className="space-y-8 outline-none">
                    {/* Filter & Global Actions */}
                    <div className="flex flex-col md:flex-row gap-6 items-center justify-between bg-card/40 backdrop-blur-xl border border-border/40 p-8 rounded-[2.5rem]">
                        <div className="relative flex-1 w-full max-w-md">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30" />
                            <Input 
                                placeholder="Filtrar por nome ou departamento..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="h-14 rounded-2xl pl-11 bg-white/50 border-border/10 text-xs font-light"
                            />
                        </div>
                        <div className="flex gap-4">
                            {selectedIds.length > 0 && (
                                <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-2xl animate-in fade-in zoom-in">
                                    <span className="text-[10px] font-black uppercase text-primary pr-4 border-r border-primary/20">{selectedIds.length} selecionados</span>
                                    <Button variant="ghost" size="sm" onClick={() => handleBatchToggle(true)} className="text-[9px] uppercase font-bold hover:bg-emerald-500/10 text-emerald-600">Ativar</Button>
                                    <Button variant="ghost" size="sm" onClick={() => handleBatchToggle(false)} className="text-[9px] uppercase font-bold hover:bg-amber-500/10 text-amber-600">Pausar</Button>
                                    <Button variant="ghost" size="sm" onClick={handleBatchDelete} className="text-[9px] uppercase font-bold hover:bg-red-500/10 text-red-500"><Trash2 className="h-3 w-3 mr-1" /> Excluir</Button>
                                </div>
                            )}
                            <Button onClick={() => setIsCreateModalOpen(true)} className="rounded-2xl px-6 h-14 text-[10px] font-black uppercase tracking-widest gap-2 bg-primary text-white shadow-xl shadow-primary/20">
                                <Plus className="h-4 w-4" /> Nova Obrigação
                            </Button>
                        </div>
                    </div>

                    {/* Obligations Config Grid */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                        {obsLoading ? (
                            <div className="col-span-2 py-32 flex flex-col items-center justify-center opacity-20">
                                <Loader2 className="h-10 w-10 animate-spin" />
                            </div>
                        ) : filteredObligations.map((o) => (
                            <Card key={o.id} className={cn(
                                "group rounded-[3rem] border border-border/40 bg-white/40 backdrop-blur-md overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5 relative",
                                !o.is_active && "opacity-60 grayscale-[0.5]",
                                selectedIds.includes(o.id) && "ring-2 ring-primary border-transparent"
                            )}>
                                <div className="absolute top-8 left-8 z-10">
                                    <Checkbox 
                                        checked={selectedIds.includes(o.id)} 
                                        onCheckedChange={(checked) => {
                                            if (checked) setSelectedIds([...selectedIds, o.id]);
                                            else setSelectedIds(selectedIds.filter(id => id !== o.id));
                                        }}
                                        className="rounded-lg h-6 w-6 data-[state=checked]:bg-primary"
                                    />
                                </div>
                                <div className="p-8 pl-20 flex items-start justify-between">
                                    <div className="flex gap-6">
                                        <div className={cn(
                                            "h-16 w-16 rounded-3xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 duration-500 ring-1 ring-white/20",
                                            o.is_active ? "bg-primary text-white shadow-primary/20" : "bg-muted text-muted-foreground"
                                        )}>
                                            <Bell className="h-8 w-8" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <h3 className="text-xl font-bold tracking-tight text-foreground/80">{o.name}</h3>
                                                <Badge variant="outline" className="text-[8px] font-black tracking-widest opacity-40 uppercase py-0.5">{o.department}</Badge>
                                            </div>
                                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-[0.2em] mt-1 italic">
                                                ID: {o.id.substring(0, 8)} • Periodicidade {o.periodicity}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-3">
                                        <div className="flex items-center gap-3 bg-muted/20 px-4 py-2 rounded-2xl border border-white/20">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
                                                {o.is_active ? 'Automação On' : 'Automação Off'}
                                            </span>
                                            <Switch 
                                                checked={o.is_active} 
                                                onCheckedChange={() => handleToggleActive(o.id, o.is_active)}
                                                className="data-[state=checked]:bg-emerald-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="px-8 pb-10 grid grid-cols-1 md:grid-cols-2 gap-10 border-t border-border/5 pt-8 bg-muted/[0.02]">
                                    {/* Alert Rules Section */}
                                    <div className="space-y-4">
                                        <label className="text-[9px] uppercase font-black tracking-widest text-muted-foreground/40 flex items-center gap-2">
                                            <Clock className="h-3.5 w-3.5 fill-amber-500/20 text-amber-500" /> Gatilhos de Notificação
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {o.alert_days.map(day => (
                                                <div 
                                                    key={day} 
                                                    className="group/tag inline-flex items-center gap-2 pl-4 pr-1.5 py-1.5 rounded-full bg-white border border-border/20 shadow-sm transition-all hover:bg-red-50"
                                                >
                                                    <span className="text-xs font-bold text-foreground/70">{day} dia{day > 1 ? 's' : ''} antes</span>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        onClick={() => handleUpdateAlertDays(o.id, o.alert_days, day, 'remove')}
                                                        className="h-6 w-6 rounded-full hover:bg-red-200 text-red-400 group-hover/tag:text-red-500"
                                                    >
                                                        <Minus className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            ))}
                                            <div className="flex items-center gap-1 ml-2">
                                                {[7, 3, 1].filter(d => !o.alert_days.includes(d)).map(d => (
                                                    <Button 
                                                        key={d} 
                                                        onClick={() => handleUpdateAlertDays(o.id, o.alert_days, d, 'add')}
                                                        variant="ghost" 
                                                        size="sm" 
                                                        className="h-8 px-2.5 rounded-xl border border-dashed border-border/30 text-[10px] font-bold text-muted-foreground/40 hover:text-primary hover:border-primary/40 hover:bg-primary/5"
                                                    >
                                                        +{d}d
                                                    </Button>
                                                ))}
                                                <Button 
                                                     variant="ghost" 
                                                     size="icon" 
                                                     className="h-8 w-8 rounded-xl border border-dashed border-border/30 text-muted-foreground/40 hover:text-primary hover:bg-primary/5"
                                                     onClick={() => {
                                                        const custom = prompt("Digite o número de dias:");
                                                        if (custom) handleUpdateAlertDays(o.id, o.alert_days, parseInt(custom), 'add');
                                                     }}
                                                >
                                                    <Plus className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Recipient Section */}
                                    <div className="space-y-4">
                                        <label className="text-[9px] uppercase font-black tracking-widest text-muted-foreground/40 flex items-center gap-2">
                                            <Mail className="h-3.5 w-3.5 fill-blue-500/20 text-blue-500" /> Fluxo de Destinatários
                                        </label>
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-border/10 shadow-sm group/mail relative overflow-hidden">
                                                 <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                                     <Users className="h-4 w-4" />
                                                 </div>
                                                 <div className="flex-1">
                                                     <p className="text-[10px] font-bold text-blue-600/70 uppercase">Cópia para Setor</p>
                                                     <p className="text-[11px] font-medium text-foreground/60">{o.department} Responsável</p>
                                                 </div>
                                                 <Badge className="bg-emerald-50 text-emerald-600 border-none text-[8px] h-4">AUTO</Badge>
                                            </div>
                                            
                                            <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-border/10 shadow-sm group/mail border-dashed">
                                                 <div className="h-10 w-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center shrink-0">
                                                     <Mail className="h-4 w-4" />
                                                 </div>
                                             <div className="flex-1 flex justify-between items-center overflow-hidden">
                                                     <div className="overflow-hidden">
                                                         <p className="text-[10px] font-bold text-primary/70 uppercase">E-mail Principal</p>
                                                         <p className="text-[11px] font-medium text-foreground/60 truncate" title={o.alert_recipient_email}>
                                                             {o.alert_recipient_email || 'Não configurado'}
                                                         </p>
                                                     </div>
                                                     <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-8 w-8 rounded-lg hover:bg-primary/10 text-primary opacity-0 group-hover/mail:opacity-100 transition-opacity shrink-0"
                                                        onClick={() => {
                                                            setEditingEmail({ id: o.id, email: o.alert_recipient_email || '' });
                                                            setIsEmailModalOpen(true);
                                                        }}
                                                     >
                                                         <Settings2 className="h-3.5 w-3.5" />
                                                     </Button>
                                                 </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="agenda" className="outline-none">
                     <Card className="border border-border/40 bg-white/40 backdrop-blur-md rounded-[3rem] overflow-hidden p-10 flex flex-col items-center justify-center min-h-[500px] opacity-40">
                         <Calendar className="h-16 w-16 mb-4 stroke-[1px]" />
                         <h3 className="text-xl font-light">Agenda de Próximos Disparos</h3>
                         <p className="text-xs font-light text-center max-w-sm mt-2">Esta funcionalidade correlaciona os vencimentos reais da sua Lista de Entrega com as regras que você configurou acima.</p>
                     </Card>
                </TabsContent>

                <TabsContent value="history" className="outline-none">
                    <Card className="border border-border/40 bg-white/40 backdrop-blur-md rounded-[3rem] overflow-hidden shadow-sm">
                        <div className="p-10 border-b border-border/10 bg-muted/10 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-light tracking-tight">Registro <span className="text-primary font-normal">Auditado</span></h3>
                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-1">Proof of Delivery (Últimos 20 disparos)</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={fetchHistory} className="h-14 w-14 rounded-3xl bg-white/50 border border-border/10 hover:bg-white shadow-sm">
                                <RefreshCw className={cn("h-4 w-4 text-primary", historyLoading && "animate-spin")} />
                            </Button>
                        </div>
                        <div className="p-0 overflow-x-auto">
                            {historyLoading ? (
                                <div className="py-32 flex flex-col items-center justify-center opacity-20"><Loader2 className="h-10 w-10 animate-spin" /></div>
                            ) : history.length === 0 ? (
                                <div className="py-32 text-center text-muted-foreground/30 font-light italic">Nenhum alerta enviado recentemente.</div>
                            ) : (
                                <Table>
                                    <TableHeader className="bg-muted/30">
                                        <TableRow className="border-border/10">
                                            <TableHead className="py-8 px-10 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Data e Hora</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Obrigação</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 text-center">Gatilho</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 text-center">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {history.map((h) => (
                                            <TableRow key={h.id} className="border-border/5 hover:bg-primary/[0.01]">
                                                <TableCell className="py-8 px-10 text-sm font-medium">{format(new Date(h.created_at || h.sent_at || Date.now()), 'dd/MM/yyyy HH:mm')}</TableCell>
                                                <TableCell><Badge variant="outline" className="bg-muted/50 border-none font-bold text-[10px] uppercase">{h.obligation?.name}</Badge></TableCell>
                                                <TableCell className="text-center font-bold text-amber-600/70 text-xs">{h.alert_day} dias antes</TableCell>
                                                <TableCell className="text-center">
                                                    <div className="inline-flex items-center gap-2 text-emerald-600 font-black text-[9px] uppercase tracking-widest">
                                                        <CheckCircle2 className="h-3 w-3" /> OK
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>
            {/* Create Modal */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent className="rounded-[2.5rem] border-none bg-white p-10 max-w-lg shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-light">Nova <span className="text-primary font-normal">Obrigação</span></DialogTitle>
                        <DialogDescription className="text-xs uppercase font-black tracking-widest text-muted-foreground/40 mt-1">Configurar novos gatilhos de alerta</DialogDescription>
                    </DialogHeader>
                    <div className="py-6 space-y-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground/60">Nome da Guia/Tarefa</Label>
                            <Input value={formNew.name} onChange={e => setFormNew({...formNew, name: e.target.value})} placeholder="Ex: DAS Simples Nacional" className="rounded-2xl h-14" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-bold text-muted-foreground/60">Setor</Label>
                                <select 
                                    value={formNew.department} 
                                    onChange={e => setFormNew({...formNew, department: e.target.value})} 
                                    className="w-full h-14 rounded-2xl border border-border/10 px-4 text-sm bg-muted/20 outline-none focus:ring-2 ring-primary/20"
                                >
                                    <option value="Fiscal">Fiscal</option>
                                    <option value="Contábil">Contábil</option>
                                    <option value="Trabalhista">Trabalhista</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-bold text-muted-foreground/60">Vencimento Padrão (Dia)</Label>
                                <Input 
                                    type="number" 
                                    value={formNew.default_due_day} 
                                    onChange={e => setFormNew({...formNew, default_due_day: parseInt(e.target.value)})} 
                                    className="rounded-2xl h-14" 
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground/60">E-mail para Alerta (Separar por vírgula)</Label>
                            <Input 
                                value={formNew.alert_recipient_email} 
                                onChange={e => setFormNew({...formNew, alert_recipient_email: e.target.value})} 
                                placeholder="financeiro@empresa.com" 
                                className="rounded-2xl h-14" 
                            />
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="ghost" className="rounded-xl h-12" onClick={() => setIsCreateModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleCreate} className="rounded-xl h-12 px-10 bg-primary text-white shadow-lg shadow-primary/20">Criar Obrigação</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Email Edit Modal */}
            <Dialog open={isEmailModalOpen} onOpenChange={setIsEmailModalOpen}>
                <DialogContent className="rounded-[2.5rem] border-none bg-white p-10 max-w-md shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-light">Editar <span className="text-primary font-normal">Fluxo de E-mail</span></DialogTitle>
                        <DialogDescription className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/40 mt-1">Vários emails podem ser separados por vírgula</DialogDescription>
                    </DialogHeader>
                    <div className="py-6 space-y-4">
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground/60">E-mails Destinatários</Label>
                        <textarea 
                            value={editingEmail?.email} 
                            onChange={e => setEditingEmail(prev => prev ? {...prev, email: e.target.value} : null)}
                            className="w-full h-32 rounded-2xl border border-border/10 p-4 text-sm bg-muted/10 outline-none focus:ring-2 ring-primary/20"
                            placeholder="email1@exemplo.com, email2@exemplo.com"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" className="rounded-xl h-12" onClick={() => setIsEmailModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleEmailUpdate} className="rounded-xl h-12 px-10 bg-primary text-white shadow-lg shadow-primary/20">Salvar Fluxo</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function PlusIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  )
}
