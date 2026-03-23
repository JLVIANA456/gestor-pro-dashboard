import { useState, useEffect } from 'react';
import { useBranding } from '@/context/BrandingContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Zap, Bell, Clock, CheckCircle2, Mail, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from '@/integrations/supabase/client';
import { useObligations } from '@/hooks/useObligations';
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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

    const handleProcessAlerts = async () => {
        setIsProcessing(true);
        try {
            const { data, error } = await supabase.functions.invoke('process-obligation-alerts');
            if (error) throw error;
            toast.success(`Alerta processado: ${data.emailsSent?.length || 0} e-mails enviados`);
        } catch (error) {
            console.error('Test Alerts error:', error);
            toast.error('Erro ao processar alertas. Verifique se a Edge Function está implantada.');
        } finally {
            setIsProcessing(false);
        }
    };

    if (brandingLoading || obligationsLoading) {
        return (
            <div className="h-full w-full flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between pt-4">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-light tracking-tight text-foreground">Central de <span className="text-primary font-normal">Alertas</span></h1>
                    <p className="text-xs font-normal text-muted-foreground uppercase tracking-[0.2em]">Configurações de Notificações, E-mails e Automação</p>
                </div>

                <div className="flex items-center gap-3">
                    <Button 
                        onClick={handleProcessAlerts}
                        disabled={isProcessing}
                        className="h-12 rounded-2xl px-6 gap-2 shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95 bg-amber-500 hover:bg-amber-600 text-white border-none"
                    >
                        {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4 fill-current" />}
                        {isProcessing ? 'Processando...' : 'Processar Alertas de Hoje'}
                    </Button>
                </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-border/40 bg-card/30 backdrop-blur-md rounded-2xl shadow-sm">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Bell className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                            <p className="text-2xl font-light text-primary">{obligations.length}</p>
                            <p className="text-[10px] uppercase font-bold tracking-widest text-primary/60">Total de Obrigações</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-border/40 bg-card/30 backdrop-blur-md rounded-2xl shadow-sm">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-light text-emerald-600">{obligations.filter(o => o.is_active).length}</p>
                            <p className="text-[10px] uppercase font-bold tracking-widest text-emerald-600/60">Obrigações Ativas</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-border/40 bg-card/30 backdrop-blur-md rounded-2xl shadow-sm">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
                            <Clock className="h-4 w-4 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-light text-amber-600">{obligations.filter(o => (o.alert_days?.length || 0) > 0).length}</p>
                            <p className="text-[10px] uppercase font-bold tracking-widest text-amber-600/60">Com Alerta Ativo</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-border/40 bg-card/30 backdrop-blur-md rounded-2xl shadow-sm">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
                            <Mail className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-light text-blue-600">Resend</p>
                            <p className="text-[10px] uppercase font-bold tracking-widest text-blue-600/60">Motor de E-mail</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="list" className="w-full">
                <TabsList className="bg-muted/30 p-1 rounded-2xl border border-border/50 mb-8 inline-flex h-12 w-fit">
                    <TabsTrigger value="list" className="rounded-xl px-6 h-full data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all text-xs uppercase tracking-widest font-light">
                        <Bell className="w-4 h-4 mr-2" /> Listagem de Alertas
                    </TabsTrigger>
                    <TabsTrigger value="config" className="rounded-xl px-6 h-full data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all text-xs uppercase tracking-widest font-light">
                        <Settings className="w-4 h-4 mr-2" /> Configurações Gerais
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="list" className="animate-in fade-in slide-in-from-bottom-2 duration-400">
                    <Card className="border-border/50 shadow-card bg-card rounded-[2.5rem] overflow-hidden border-none shadow-2xl">
                        <CardHeader className="border-b border-border/10 bg-muted/20 p-8">
                            <CardTitle className="text-xl font-light">Resumo de <span className="text-primary font-normal">Alertas por Obrigação</span></CardTitle>
                            <CardDescription className="text-xs uppercase tracking-widest font-bold text-muted-foreground/60">Visualize quais obrigações estão com notificações ativas</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-muted/30">
                                    <TableRow className="hover:bg-transparent border-border/10">
                                        <TableHead className="py-6 px-8 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">Obrigação</TableHead>
                                        <TableHead className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">Status</TableHead>
                                        <TableHead className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">Frequência</TableHead>
                                        <TableHead className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">Destinatário Alerta</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {obligations.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="py-24 text-center text-muted-foreground font-light italic">Nenhuma obrigação cadastrada.</TableCell>
                                        </TableRow>
                                    ) : (
                                        obligations.map((o) => (
                                            <TableRow key={o.id} className="group hover:bg-primary/[0.02] border-border/10 transition-all duration-300">
                                                <TableCell className="py-5 px-8">
                                                    <span className="text-sm font-medium text-foreground tracking-tight">{o.name}</span>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={o.is_active ? "default" : "secondary"} className={`text-[10px] h-5 uppercase px-2 font-bold ${o.is_active ? 'bg-emerald-500/10 text-emerald-600 border-none hover:bg-emerald-500/20' : 'opacity-40'}`}>
                                                        {o.is_active ? 'Ativa' : 'Inativa'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="h-3.5 w-3.5 text-amber-500" />
                                                        <span className="text-xs font-medium text-amber-600">
                                                            {(o.alert_days?.length || 0) > 0 ? `${o.alert_days.join(', ')} dias antes` : 'Sem alerta'}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-[11px] font-mono text-muted-foreground">
                                                    {o.alert_recipient_email || 'Não configurado'}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="config" className="animate-in fade-in slide-in-from-bottom-2 duration-400">
                    <Card className="border-border/50 shadow-card rounded-2xl overflow-hidden bg-card max-w-2xl">
                        <CardHeader className="border-b border-border/30 bg-muted/5">
                            <CardTitle className="text-lg font-light tracking-wide flex items-center gap-3">
                                <Settings className="h-5 w-5 text-primary" /> Regras de Notificação
                            </CardTitle>
                            <CardDescription className="font-light">Defina comportamentos globais para o sistema de alertas</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                             <div className="p-4 bg-muted/20 rounded-xl border border-border/30 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium">Alertas Automáticos (Cron)</p>
                                        <p className="text-xs text-muted-foreground">O sistema verifica obrigações diariamente às 08:00</p>
                                    </div>
                                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                </div>
                                <hr className="border-border/10" />
                                <div className="flex items-center justify-between">
                                    <p className="text-xs text-muted-foreground">Próxima verificação programada:</p>
                                    <p className="text-xs font-mono font-bold">Amanhã, 08:00</p>
                                </div>
                             </div>

                             <div className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase tracking-widest font-normal text-muted-foreground">Frequência de Verificação</Label>
                                    <select className="w-full h-10 rounded-lg border border-border/50 bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30 appearance-none cursor-pointer">
                                        <option>Diário (Recomendado)</option>
                                        <option>A cada 12 horas</option>
                                        <option>A cada 6 horas</option>
                                    </select>
                                </div>

                                <div className="bg-blue-500/5 border border-blue-500/10 p-4 rounded-xl">
                                    <div className="flex gap-3">
                                        <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                                            <Mail className="h-4 w-4 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-blue-900 uppercase tracking-tight">Limite de Envio</p>
                                            <p className="text-[11px] text-blue-700 font-light leading-relaxed mt-1">
                                                O motor Resend possui um limite de 3.000 e-mails/mês no plano gratuito do escritório <strong>{officeName}</strong>.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                             </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
