import { useState, useEffect } from 'react';
import { 
    Bell, 
    Zap, 
    History, 
    Loader2, 
    CheckCircle2, 
    RefreshCw,
    Mail,
    Save
} from 'lucide-react';
import { format } from 'date-fns';
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
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useBranding } from '@/context/BrandingContext';
import { BrandingService, EmailBranding } from '@/services/brandingService';
import { cn } from '@/lib/utils';

export default function Alerts() {
    const { officeName } = useBranding();
    const [branding, setBranding] = useState<EmailBranding | null>(null);
    
    // States
    const [history, setHistory] = useState<any[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    // Additional Emails Form
    const [emailsForm, setEmailsForm] = useState({
        dpEmail: '',
        fiscalEmail: '',
        contabilEmail: '',
        qualityEmail: '',
        boardEmail: ''
    });

    useEffect(() => {
        const load = async () => {
            const data = await BrandingService.fetchBranding();
            setBranding(data);
            setEmailsForm({
                dpEmail: data.dpEmail || '',
                fiscalEmail: data.fiscalEmail || '',
                contabilEmail: data.contabilEmail || '',
                qualityEmail: data.qualityEmail || '',
                boardEmail: data.boardEmail || ''
            });
        };
        load();
    }, []);

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

    const handleSaveEmails = async () => {
        if (!branding) return;
        setIsSaving(true);
        const toastId = toast.loading('Salvando configurações...');
        
        try {
            const newBranding = {
                ...branding,
                dpEmail: emailsForm.dpEmail,
                fiscalEmail: emailsForm.fiscalEmail,
                contabilEmail: emailsForm.contabilEmail,
                qualityEmail: emailsForm.qualityEmail,
                boardEmail: emailsForm.boardEmail
            };
            await BrandingService.saveBranding(newBranding);
            setBranding(newBranding);
            toast.success('Configurações de alerta salvas com sucesso!', { id: toastId });
        } catch (error) {
            toast.error('Erro ao salvar as configurações.', { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };

    const handleProcessAlerts = async () => {
        setIsProcessing(true);
        const toastId = toast.loading('Disparando resumos diários para os departamentos...');
        try {
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
            const functionUrl = `${supabaseUrl}/functions/v1/daily-deadline-summaries`;
            
            const response = await fetch(functionUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${supabaseKey}`,
                    'apikey': supabaseKey
                }
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(`Erro do Servidor (${response.status}). Verifique a função daily-deadline-summaries.`);
            }
            
            toast.success(data.message || 'Resumos diários processados com sucesso!', { id: toastId });
            fetchHistory();
        } catch (error: any) {
            console.error('Erro ao processar alertas:', error);
            toast.error(error.message || 'Erro ao disparar resumos manuais.', { id: toastId });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-20">
            {/* Header Section */}
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between pt-10 px-4">
                <div className="space-y-4">
                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 py-2 px-5 rounded-full text-[10px] uppercase font-bold tracking-[0.3em] animate-pulse">
                        <Bell className="h-3 w-3 mr-2 fill-primary/20" /> Monitoramento Global
                    </Badge>
                    <h1 className="text-5xl font-extralight tracking-tight text-foreground leading-tight">
                        Gestão de <span className="text-primary font-normal">Alertas Diários</span>
                    </h1>
                    <div className="text-xs font-medium text-muted-foreground uppercase opacity-80 tracking-[0.2em] max-w-2xl leading-relaxed">
                        {officeName} • Hub de Comunicação Operacional.
                        <span className="font-light text-[11px] tracking-wide lowercase normal-case opacity-70 block mt-2 text-foreground/80">
                            Configure quem receberá os resumos automáticos com as listas de vencimentos, guias e tarefas pendentes de hoje. Este painel garante que nenhum prazo seja perdido e que todos os departamentos iniciem o dia com suas metas claras no e-mail.
                        </span>
                    </div>
                </div>

                <div className="flex bg-white/40 backdrop-blur-3xl border border-white/20 p-4 rounded-[40px] shadow-2xl shadow-primary/5">
                    <Button 
                        onClick={handleProcessAlerts}
                        disabled={isProcessing}
                        className="h-20 rounded-[30px] px-8 gap-5 bg-primary text-white shadow-2xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95 group overflow-hidden relative"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                        {isProcessing ? (
                            <Loader2 className="h-6 w-6 animate-spin shrink-0" />
                        ) : (
                            <Zap className="h-6 w-6 fill-white shrink-0" />
                        )}
                        <div className="flex flex-col items-start gap-1">
                            <span className="text-[13px] font-bold uppercase tracking-widest leading-none mt-1">Disparar Resumo Agora</span>
                            <span className="text-[9px] opacity-70 font-light leading-snug w-56 text-left whitespace-normal normal-case">
                                Força o envio imediato da lista de tarefas e impostos a vencer para o e-mail de cada setor.
                            </span>
                        </div>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 px-4">
                {/* Email Config Section */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="rounded-[2.5rem] border-none bg-card shadow-2xl shadow-slate-200/50 overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50 pointer-events-none" />
                        <CardContent className="p-10 space-y-8 relative z-10">
                            <div>
                                <h3 className="text-xl font-light tracking-tight mb-2">E-mails de <span className="text-primary font-base">Notificação</span></h3>
                                <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-widest leading-relaxed opacity-60">
                                    Inscritos para receber o boletim matinal com a agenda de obrigações e prazos.
                                </p>
                            </div>

                            <div className="space-y-6 h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                        <Mail className="h-3 w-3 text-red-500" /> E-mail DP
                                    </label>
                                    <Input 
                                        type="email" 
                                        placeholder="dp@exemplo.com.br"
                                        value={emailsForm.dpEmail}
                                        onChange={(e) => setEmailsForm({...emailsForm, dpEmail: e.target.value})}
                                        className="h-14 rounded-2xl bg-muted/20 border-border/20 px-5 font-medium text-sm focus-visible:ring-red-500/20"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                        <Mail className="h-3 w-3 text-orange-500" /> E-mail Fiscal
                                    </label>
                                    <Input 
                                        type="email" 
                                        placeholder="fiscal@exemplo.com.br"
                                        value={emailsForm.fiscalEmail}
                                        onChange={(e) => setEmailsForm({...emailsForm, fiscalEmail: e.target.value})}
                                        className="h-14 rounded-2xl bg-muted/20 border-border/20 px-5 font-medium text-sm focus-visible:ring-orange-500/20"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                        <Mail className="h-3 w-3 text-purple-500" /> E-mail Contábil
                                    </label>
                                    <Input 
                                        type="email" 
                                        placeholder="contabil@exemplo.com.br"
                                        value={emailsForm.contabilEmail}
                                        onChange={(e) => setEmailsForm({...emailsForm, contabilEmail: e.target.value})}
                                        className="h-14 rounded-2xl bg-muted/20 border-border/20 px-5 font-medium text-sm focus-visible:ring-purple-500/20"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                        <Mail className="h-3 w-3 text-emerald-500" /> Departamento de Qualidade
                                    </label>
                                    <Input 
                                        type="email" 
                                        placeholder="qualidade@exemplo.com.br"
                                        value={emailsForm.qualityEmail}
                                        onChange={(e) => setEmailsForm({...emailsForm, qualityEmail: e.target.value})}
                                        className="h-14 rounded-2xl bg-muted/20 border-border/20 px-5 font-medium text-sm focus-visible:ring-emerald-500/20"
                                    />
                                    <p className="text-[10px] text-muted-foreground/50">Receberá cópias para auditoria de processos.</p>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                        <Mail className="h-3 w-3 text-blue-500" /> Diretoria Contábil
                                    </label>
                                    <Input 
                                        type="email" 
                                        placeholder="diretoria@exemplo.com.br"
                                        value={emailsForm.boardEmail}
                                        onChange={(e) => setEmailsForm({...emailsForm, boardEmail: e.target.value})}
                                        className="h-14 rounded-2xl bg-muted/20 border-border/20 px-5 font-medium text-sm focus-visible:ring-blue-500/20"
                                    />
                                    <p className="text-[10px] text-muted-foreground/50">Liderança, supervisão e controle gerencial.</p>
                                </div>
                            </div>

                            <Button 
                                onClick={handleSaveEmails} 
                                disabled={isSaving}
                                className="w-full h-14 rounded-2xl gap-2 font-bold uppercase tracking-widest text-[11px] bg-slate-900 hover:bg-slate-800 text-white shadow-xl"
                            >
                                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                Salvar Destinatários
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* History Section */}
                <div className="lg:col-span-2">
                    <Card className="border-none bg-white rounded-[2.5rem] overflow-hidden shadow-2xl h-full flex flex-col">
                        <div className="p-10 border-b border-border/10 bg-slate-50 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-light tracking-tight">Histórico de <span className="text-primary font-normal">Envios</span></h3>
                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-1">Lista dos resumos diários despachados com os Vencimentos de cada setor</p>
                            </div>
                            <Button 
                                variant="outline" 
                                size="icon" 
                                onClick={fetchHistory} 
                                className="h-12 w-12 rounded-2xl bg-white border border-border/10 shadow-sm transition-all text-slate-400 hover:text-primary hover:bg-primary/5"
                            >
                                <RefreshCw className={cn("h-4 w-4 transition-all", historyLoading && "animate-spin")} />
                            </Button>
                        </div>
                        <div className="p-0 overflow-x-auto flex-1">
                            {historyLoading ? (
                                <div className="py-32 flex flex-col items-center justify-center opacity-20 animate-pulse">
                                    <Loader2 className="h-10 w-10 animate-spin" />
                                </div>
                            ) : history.length === 0 ? (
                                <div className="py-32 text-center h-full flex flex-col items-center justify-center">
                                    <div className="flex flex-col items-center gap-4 opacity-30">
                                        <History className="h-16 w-16 stroke-[1px]" />
                                        <div className="space-y-1">
                                            <p className="text-sm uppercase tracking-[0.2em] font-medium">Nenhum Disparo Registrado</p>
                                            <p className="text-[10px] font-light">O sistema ainda não enviou nenhum resumo com as tarefas operacionais de hoje.</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader className="bg-slate-50/50">
                                        <TableRow className="border-border/10">
                                            <TableHead className="py-6 px-10 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Data / Hora</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 w-[40%]">Origem</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 text-center">Gatilho</TableHead>
                                            <TableHead className="text-right px-10 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {history.map((h) => (
                                            <TableRow key={h.id} className="border-border/5 hover:bg-slate-50 transition-colors">
                                                <TableCell className="py-6 px-10 text-sm font-medium text-slate-600">
                                                    {format(new Date(h.created_at || h.sent_at || Date.now()), 'dd/MM/yyyy • HH:mm')}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-foreground/80 tracking-tight">{h.obligation?.name || 'Alerta Sintético'}</span>
                                                        <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/40 mt-1 flex items-center gap-2">
                                                            Competência: {h.competency || 'N/A'}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant="outline" className="bg-amber-500/5 text-amber-600 border-amber-500/20 font-bold text-[9px] uppercase tracking-widest px-3 rounded-md">
                                                        {h.alert_day} dias
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right px-10">
                                                    <div className="inline-flex items-center gap-2 text-emerald-600 font-black text-[9px] uppercase tracking-widest bg-emerald-500/5 px-4 py-2 rounded-xl border border-emerald-500/10">
                                                        <CheckCircle2 className="h-3.5 w-3.5" /> Enviado
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
