import { useState, useEffect, useMemo } from 'react';
import { useBranding } from '@/context/BrandingContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Zap, Bell, Clock, CheckCircle2, Mail, Settings, Calendar, History, Shield, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from '@/integrations/supabase/client';
import { useObligations } from '@/hooks/useObligations';
import { Badge } from "@/components/ui/badge";
import { format, addDays, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table";

export default function Alerts() {
    const { officeName, loading: brandingLoading } = useBranding();
    const { obligations, loading: obligationsLoading } = useObligations();
    const [isProcessing, setIsProcessing] = useState(false);
    const [history, setHistory] = useState<any[]>([]);
    const [historyLoading, setHistoryLoading] = useState(true);

    const fetchHistory = async () => {
        try {
            const { data, error } = await supabase
                .from('obligation_alerts_sent')
                .select(`
                    id,
                    alert_day,
                    competency,
                    created_at,
                    obligation:obligations(name, department, type)
                `)
                .order('created_at', { ascending: false })
                .limit(10);
            
            if (error) throw error;
            setHistory(data || []);
        } catch (error) {
            console.error('Fetch history error:', error);
        } finally {
            setHistoryLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    const handleProcessAlerts = async () => {
        setIsProcessing(true);
        const loadingToast = toast.loading('Processando automação diária...');
        try {
            const { data, error } = await supabase.functions.invoke('process-obligation-alerts');
            if (error) throw error;
            
            toast.success(`Alerta finalizado! ${data.emailsSent?.length || 0} e-mails disparados agora.`, { id: loadingToast });
            fetchHistory();
        } catch (error) {
            console.error('Test Alerts error:', error);
            toast.error('Erro ao processar alertas. Função temporariamente indisponível.', { id: loadingToast });
        } finally {
            setIsProcessing(false);
        }
    };

    // Calculate upcoming alerts for the next 7 days
    const upcomingAlerts = useMemo(() => {
        const result = [];
        const today = new Date();
        const currentMonth = today.getMonth() + 1;
        const currentYear = today.getFullYear();

        for (let i = 0; i < 8; i++) {
            const targetDate = addDays(today, i);
            const matches = [];

            for (const obs of obligations) {
                if (!obs.is_active || !obs.alert_days || !Array.isArray(obs.alert_days)) continue;

                // Simple check for default_due_day of this month
                const dueDate = new Date(currentYear, currentMonth - 1, obs.default_due_day);
                
                for (const daysBefore of obs.alert_days) {
                    const alertDate = new Date(dueDate.getTime());
                    alertDate.setDate(dueDate.getDate() - Number(daysBefore));

                    if (isSameDay(alertDate, targetDate)) {
                        matches.push({ ...obs, daysBefore });
                    }
                }
            }

            if (matches.length > 0) {
                result.push({
                    date: targetDate,
                    events: matches
                });
            }
        }
        return result;
    }, [obligations]);

    if (brandingLoading || obligationsLoading) {
        return (
            <div className="h-full w-full flex items-center justify-center py-40">
                <Loader2 className="h-10 w-10 animate-spin text-primary opacity-30" />
            </div>
        );
    }

    return (
        <div className="max-w-[1400px] mx-auto space-y-10 px-4 sm:px-8 pb-12 animate-in fade-in slide-in-from-top-4 duration-1000">
            {/* Header: Simplified & Modern */}
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between pt-10">
                <div className="space-y-4">
                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 py-1.5 px-4 rounded-full text-[10px] uppercase font-bold tracking-widest animate-pulse">
                        <Shield className="h-3 w-3 mr-2 fill-primary/20" /> Automação de Alertas Ativa 24/7
                    </Badge>
                    <h1 className="text-5xl font-extralight tracking-tight text-foreground leading-tight">
                        Sistema de <span className="text-primary font-normal">Alertas</span>
                    </h1>
                    <p className="text-xs font-medium text-muted-foreground uppercase opacity-60 tracking-[0.3em] max-w-lg">
                        Prevenção de inadimplência e rastreamento automático de pendências para departamentos Fiscal e DP.
                    </p>
                </div>

                <div className="flex bg-card/40 backdrop-blur-xl border border-border/40 p-3 rounded-[2.5rem] shadow-2xl shadow-primary/5">
                    <Button 
                        onClick={handleProcessAlerts}
                        disabled={isProcessing}
                        className="h-20 rounded-[1.8rem] px-8 gap-4 bg-primary text-white shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 group overflow-hidden"
                    >
                        {isProcessing ? (
                            <Loader2 className="h-6 w-6 animate-spin" />
                        ) : (
                            <Zap className="h-6 w-6 fill-current group-hover:scale-125 transition-transform" />
                        )}
                        <div className="flex flex-col items-start text-left">
                            <span className="text-[10px] uppercase font-black opacity-60">Gatilho Manual</span>
                            <span className="text-base font-bold">Processar Alertas Hoje</span>
                        </div>
                    </Button>
                </div>
            </div>

            {/* Quick Status Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <Card className="bg-emerald-500/5 border-emerald-500/20 rounded-[2rem] p-6 flex items-center gap-5 shadow-sm">
                    <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                        <CheckCircle2 className="h-7 w-7 text-emerald-600" />
                    </div>
                    <div>
                        <p className="text-[10px] uppercase font-black text-emerald-600/50 tracking-widest">Job Diário</p>
                        <p className="text-lg font-bold text-emerald-700">Ativo (Configurado às 08:00)</p>
                    </div>
                 </Card>

                 <Card className="bg-white/40 border border-border/40 rounded-[2rem] p-6 flex items-center gap-5 shadow-sm">
                    <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <Mail className="h-7 w-7 text-primary" />
                    </div>
                    <div>
                        <p className="text-[10px] uppercase font-black text-muted-foreground/40 tracking-widest">Configuração Global</p>
                        <p className="text-lg font-bold">Destinatários Primários: DP & Fiscal</p>
                    </div>
                 </Card>

                 <Card className="bg-white/40 border border-border/40 rounded-[2rem] p-6 flex items-center gap-5 shadow-sm">
                    <div className="h-14 w-14 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                        <Clock className="h-7 w-7 text-amber-600" />
                    </div>
                    <div>
                        <p className="text-[10px] uppercase font-black text-amber-600/40 tracking-widest">Próximos Dias</p>
                        <p className="text-lg font-bold">{upcomingAlerts.length} Dias com Alertas</p>
                    </div>
                 </Card>
            </div>

            {/* Main Tabs Control */}
            <Tabs defaultValue="now" className="w-full space-y-8">
                <TabsList className="bg-muted/10 p-1.5 rounded-2xl h-auto border border-border/10">
                    <TabsTrigger value="now" className="rounded-xl px-10 py-3 text-[10px] uppercase font-bold tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white">
                        <Calendar className="h-3.5 w-3.5 mr-2" /> Agenda de Disparos
                    </TabsTrigger>
                    <TabsTrigger value="history" className="rounded-xl px-10 py-3 text-[10px] uppercase font-bold tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white">
                        <History className="h-3.5 w-3.5 mr-2" /> Log Recente
                    </TabsTrigger>
                    <TabsTrigger value="config" className="rounded-xl px-10 py-3 text-[10px] uppercase font-bold tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white">
                        <Settings className="h-3.5 w-3.5 mr-2" /> Regras de Notificação
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="now" className="space-y-10 focus:outline-none">
                    {/* Upcoming Alerts Timeline */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="col-span-1 space-y-6">
                             <div className="flex items-center justify-between px-2">
                                <h2 className="text-xl font-light text-foreground/80 tracking-tight flex items-center gap-3">
                                    <Clock className="h-5 w-5 text-amber-500" />
                                    Cronograma de Disparos (Próximos 7 dias)
                                </h2>
                             </div>

                             <div className="space-y-4">
                                {upcomingAlerts.length === 0 ? (
                                    <Card className="p-16 border-dashed border-2 flex flex-col items-center justify-center text-muted-foreground/40 bg-card/20 rounded-[3rem]">
                                        <Bell className="h-10 w-10 mb-4 opacity-20" />
                                        <p className="text-sm font-medium">Nenhum disparo planejado para a próxima semana.</p>
                                    </Card>
                                ) : (
                                    upcomingAlerts.map((day, idx) => (
                                        <Card key={idx} className="p-8 border border-border/40 bg-white/40 rounded-[2.5rem] shadow-sm hover:border-primary/20 transition-all group">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                                <div className="flex items-center gap-6">
                                                    <div className="h-16 w-16 rounded-3xl bg-primary/5 border border-primary/10 flex flex-col items-center justify-center shrink-0">
                                                        <span className="text-xs font-black text-primary/40 uppercase">{format(day.date, 'EEE', { locale: ptBR })}</span>
                                                        <span className="text-2xl font-black text-primary leading-tight">{format(day.date, 'dd')}</span>
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-bold text-foreground/80 tracking-tight">{format(day.date, 'EEEE, dd', { locale: ptBR })}</h3>
                                                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-1">Disparos Agendados: {day.events.length}</p>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap gap-2">
                                                    {day.events.map((ev, i) => (
                                                        <Badge key={i} variant="outline" className="bg-white px-3 py-1.5 rounded-xl border-border/30 text-[10px] font-bold text-primary/60 shadow-sm">
                                                            {ev.name} ({ev.daysBefore}d)
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        </Card>
                                    ))
                                )}
                             </div>
                        </div>

                        {/* Why Alerts matter Card (Mini Dashboard) */}
                        <div className="space-y-6">
                             <div className="flex items-center justify-between px-2">
                                <h2 className="text-xl font-light text-foreground/80 tracking-tight flex items-center gap-3">
                                    <Settings className="h-5 w-5 text-blue-500" />
                                    Critérios da Automação
                                </h2>
                             </div>
                             
                             <Card className="bg-card/30 border border-primary/20 p-10 rounded-[3rem] shadow-sm relative overflow-hidden backdrop-blur-md">
                                <Zap className="absolute -bottom-10 -right-10 h-64 w-64 text-primary/5 rotate-[-15deg]" />
                                <div className="space-y-6 relative z-10">
                                    <h3 className="text-2xl font-light tracking-tight leading-snug text-foreground">
                                        Como os alertas funcionam para <span className="font-bold text-primary underline decoration-primary/20 underline-offset-8">você</span>:
                                    </h3>
                                    <ul className="space-y-5">
                                        <li className="flex items-start gap-4">
                                            <div className="h-6 w-6 rounded-full bg-primary/10 text-primary text-[10px] font-black flex items-center justify-center shrink-0 mt-1">1</div>
                                            <p className="text-sm font-light text-muted-foreground leading-relaxed">
                                                O sistema verifica diariamente quais obrigações vencem nos próximos dias.
                                            </p>
                                        </li>
                                        <li className="flex items-start gap-4">
                                            <div className="h-6 w-6 rounded-full bg-primary/10 text-primary text-[10px] font-black flex items-center justify-center shrink-0 mt-1">2</div>
                                            <p className="text-sm font-light text-muted-foreground leading-relaxed">
                                                Ele consulta as regras configuradas (3 dias antes, 1 dia antes, etc).
                                            </p>
                                        </li>
                                        <li className="flex items-start gap-4">
                                            <div className="h-6 w-6 rounded-full bg-primary/10 text-primary text-[10px] font-black flex items-center justify-center shrink-0 mt-1">3</div>
                                            <p className="text-sm font-light text-muted-foreground leading-relaxed">
                                                Dispara e-mails para os destinatários selecionados e para os setores responsáveis.
                                            </p>
                                        </li>
                                    </ul>
                                    <hr className="border-border/10" />
                                    <div className="flex items-center gap-3">
                                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                        <p className="text-[10px] uppercase font-black text-muted-foreground/40 tracking-[0.3em]">Status Resend: OK • Automação: 100%</p>
                                    </div>
                                </div>
                             </Card>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="history" className="focus:outline-none">
                    <Card className="border border-border/40 bg-white/40 backdrop-blur-md rounded-[3rem] overflow-hidden shadow-sm">
                        <div className="p-10 border-b border-border/10 bg-muted/10 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-light tracking-tight">Atividade <span className="text-primary font-normal">Recente</span></h3>
                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-1">Últimos disparos realizados nos últimos 30 dias</p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={fetchHistory} className="rounded-full h-10 w-10 p-0 text-muted-foreground/40 hover:text-primary">
                                <RefreshCw className={cn("h-4 w-4", historyLoading && "animate-spin")} />
                            </Button>
                        </div>
                        <div className="p-0">
                            {historyLoading ? (
                                <div className="py-32 flex flex-col items-center justify-center gap-4 text-muted-foreground/30">
                                    <Loader2 className="h-8 w-8 animate-spin" />
                                    <p className="text-[10px] uppercase font-bold tracking-widest">Carregando histórico...</p>
                                </div>
                            ) : history.length === 0 ? (
                                <div className="py-32 text-center text-muted-foreground font-light italic opacity-40">
                                    Nenhuma atividade registrada no histórico.
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader className="bg-muted/30">
                                        <TableRow className="border-border/10">
                                            <TableHead className="py-6 px-10 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 w-[30%] text-center">Data do Envio</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 text-center">Obrigação</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 text-center">Tipo de Alerta</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 text-center">Competência</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 text-center">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {history.map((h) => (
                                            <TableRow key={h.id} className="border-border/5 hover:bg-primary/[0.01] transition-colors group">
                                                <TableCell className="py-6 px-10 text-center">
                                                    <span className="text-sm font-medium text-foreground/80">{format(new Date(h.created_at), 'dd/MM/yyyy HH:mm')}</span>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant="outline" className="bg-muted/40 text-muted-foreground border-none font-bold text-[10px] rounded-lg">
                                                        {h.obligation?.name}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/5 border border-amber-500/10">
                                                        <Clock className="h-3 w-3 text-amber-600" />
                                                        <span className="text-xs font-bold text-amber-700">{h.alert_day} dias antes</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center font-mono text-[11px] text-muted-foreground">{h.competency}</TableCell>
                                                <TableCell className="text-center">
                                                    <div className="flex items-center justify-center gap-2 text-emerald-600">
                                                        <CheckCircle2 className="h-4 w-4" />
                                                        <span className="text-[10px] font-black uppercase tracking-tighter">Enviado</span>
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

                <TabsContent value="config" className="focus:outline-none">
                    {/* The Original Table, but cleaner */}
                    <Card className="border border-border/40 bg-white/40 backdrop-blur-md rounded-[3rem] overflow-hidden shadow-sm">
                        <div className="p-10 border-b border-border/10 bg-muted/10">
                            <h3 className="text-xl font-light tracking-tight">Obrigações e <span className="text-primary font-normal">Regras de Alerta</span></h3>
                            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-1">Configurações individuais por tipo de tributo</p>
                        </div>
                        <Table>
                            <TableHeader className="bg-muted/30">
                                <TableRow className="border-border/10">
                                    <TableHead className="py-6 px-10 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 w-[30%]">Obrigação</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Status</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Frequência</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Destinatário</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {obligations.map((o) => (
                                    <TableRow key={o.id} className="border-border/5 hover:bg-muted/5 transition-colors">
                                        <TableCell className="py-6 px-10">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-foreground/80 tracking-tight">{o.name}</span>
                                                <span className="text-[9px] uppercase font-bold text-muted-foreground/40 mt-1 tracking-widest">{o.type} • {o.department}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={o.is_active ? "default" : "secondary"} className={cn(
                                                "text-[9px] h-5 uppercase px-3 font-black tracking-tighter",
                                                o.is_active ? "bg-emerald-500/10 text-emerald-600 border-none px-4" : "opacity-30"
                                            )}>
                                                {o.is_active ? 'Ativa' : 'Pausada'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-3.5 w-3.5 text-amber-500" />
                                                <span className="text-xs font-bold text-amber-700">
                                                    {(o.alert_days?.length || 0) > 0 ? `${o.alert_days.join(', ')} dias antes` : 'Mudo'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/5 rounded-lg border border-blue-500/10">
                                                <Mail className="h-3 w-3 text-blue-600" />
                                                <span className="text-[11px] font-mono text-blue-700">{o.alert_recipient_email || 'Setor Responsável'}</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                </TabsContent>
            </Tabs>

            <div className="mt-20 p-10 bg-muted/10 rounded-[3.5rem] border border-border/10 text-center space-y-4">
                <p className="text-[10px] uppercase font-black text-muted-foreground/40 tracking-[0.4em]">Gestor Pro Dashboard • Módulo Automation 2026</p>
                <p className="text-xs font-light text-muted-foreground/60 max-w-2xl mx-auto leading-relaxed">
                    Você está visualizando a interface simplificada de alertas. A automação diária é executada de forma independente pelo servidor Supabase (Edge Functions), garantindo confiabilidade total mesmo com o sistema fechado.
                </p>
            </div>
        </div>
    );
}

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ');
}
