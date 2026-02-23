import { useState, useEffect } from 'react';
import { Mail, Send, Sparkles, History, ArrowRight, ExternalLink, Shield, Clock, CheckCircle2, Eye, Search, Filter, Trash2, Users, Calendar as CalendarIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";

const DEPARTMENTS = [
    { id: 'fiscal', name: 'Fiscal', color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { id: 'pessoal', name: 'Pessoal', color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { id: 'contabil', name: 'Contábil', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { id: 'financeiro', name: 'Financeiro', color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { id: 'geral', name: 'Geral', color: 'text-slate-500', bg: 'bg-slate-500/10' },
];

interface Announcement {
    id: string;
    created_at: string;
    department: string;
    recipient: string;
    subject: string;
    content: string;
    status: 'sent' | 'delivered' | 'read' | 'scheduled';
    sent_at: string;
    scheduled_for?: string;
    is_scheduled?: boolean;
}

export default function Announcements() {
    const [activeDept, setActiveDept] = useState('geral');
    const [to, setTo] = useState('');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [isHoveredGmail, setIsHoveredGmail] = useState(false);
    const [isHoveredOutlook, setIsHoveredOutlook] = useState(false);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [isScheduled, setIsScheduled] = useState(false);
    const [scheduledDate, setScheduledDate] = useState('');
    const [scheduledTime, setScheduledTime] = useState('');

    useEffect(() => {
        fetchAnnouncements();
    }, [activeDept]);

    const fetchAnnouncements = async () => {
        try {
            setLoading(true);
            const { data, error } = await (supabase as any)
                .from('announcements')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                if (error.code === '42P01') {
                    console.log('Announcements table does not exist yet');
                    setAnnouncements([]);
                } else {
                    console.error('Error fetching announcements:', error);
                    toast.error("Erro ao carregar histórico.");
                }
            } else {
                setAnnouncements(data || []);
            }
        } catch (err) {
            console.error('Unexpected error fetching announcements:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async (provider: 'gmail' | 'outlook') => {
        if (!to) {
            toast.error("Por favor, preencha o destinatário.");
            return;
        }

        // Split recipients by comma or semicolon and clean them up
        const recipients = to.split(/[;,]/).map(email => email.trim()).filter(email => email !== '');

        if (recipients.length === 0) {
            toast.error("Nenhum e-mail válido encontrado.");
            return;
        }

        // Save to history (creates separate logs for each recipient for individual tracking)
        try {
            const inserts = recipients.map(email => {
                const item: any = {
                    department: activeDept,
                    recipient: email,
                    subject: subject,
                    content: message,
                    status: isScheduled ? 'scheduled' : 'delivered',
                    sent_at: isScheduled ? null : new Date().toISOString()
                };

                // Only add scheduling fields if explicitly scheduling to avoid errors 
                // if the columns haven't been created yet in some environments
                if (isScheduled) {
                    item.scheduled_for = `${scheduledDate}T${scheduledTime}:00`;
                    item.is_scheduled = true;
                }

                return item;
            });

            const { data, error } = await (supabase as any)
                .from('announcements')
                .insert(inserts)
                .select();

            if (error) {
                console.error('Error saving announcements:', error);
                toast.error("Erro ao registrar no histórico. Verifique se a tabela possui as colunas de agendamento.");
            } else if (data) {
                setAnnouncements(prev => [...data, ...prev]);
            }
        } catch (err) {
            console.error('Unexpected error saving announcements:', err);
            toast.error("Ocorreu um erro inesperado ao salvar o histórico.");
        }

        // Only redirect if NOT scheduled
        if (!isScheduled) {
            // Prepare the URL for the chosen provider
            if (provider === 'gmail') {
                // Gmail uses commas for multiple recipients
                const toList = recipients.join(',');
                const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(toList)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
                window.open(gmailUrl, '_blank');
                toast.success(`${recipients.length} e-mail(s) preparado(s) no Gmail.`, {
                    description: "Comunicados registrados individualmente para rastreio.",
                });
            } else {
                // Outlook web uses semicolons for multiple recipients
                const toList = recipients.join(';');
                const outlookUrl = `https://outlook.office.com/mail/deeplink/compose?to=${encodeURIComponent(toList)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
                window.open(outlookUrl, '_blank');
                toast.success(`${recipients.length} e-mail(s) preparado(s) no Outlook.`, {
                    description: "Comunicados registrados individualmente para rastreio.",
                });
            }
        } else {
            toast.success(`${recipients.length} comunicado(s) agendado(s)!`, {
                description: `Será enviado em ${format(new Date(`${scheduledDate}T${scheduledTime}:00`), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}.`,
            });
        }

        // Limpar campos
        setTo('');
        setSubject('');
        setMessage('');
        setIsScheduled(false);
        setScheduledDate('');
        setScheduledTime('');
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'read': return <Eye className="h-4 w-4 text-primary" />;
            case 'delivered': return <CheckCircle2 className="h-4 w-4 text-success" />;
            case 'scheduled': return <CalendarIcon className="h-4 w-4 text-amber-500" />;
            default: return <Clock className="h-4 w-4 text-muted-foreground" />;
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'read': return 'Lido';
            case 'delivered': return 'Entregue';
            case 'scheduled': return 'Agendado';
            default: return 'Enviado';
        }
    };

    const filteredAnnouncements = announcements.filter(a =>
        activeDept === 'geral' ? true : a.department === activeDept
    );

    return (
        <div className="space-y-8 animate-fade-in max-w-7xl mx-auto pb-12">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-primary mb-1">
                        <Shield className="h-4 w-4 fill-primary/20" />
                        <span className="text-[10px] uppercase tracking-[0.3em] font-semibold">Comunicação Oficial</span>
                    </div>
                    <h2 className="text-4xl font-light tracking-tight text-foreground">
                        Central de <span className="font-semibold text-primary">Comunicados</span>
                    </h2>
                    <p className="text-muted-foreground font-light max-w-md">
                        Envie informativos e avisos importantes segmentados por departamento.
                    </p>
                </div>
            </div>

            <Tabs defaultValue="geral" className="w-full space-y-8" onValueChange={setActiveDept}>
                <div className="flex items-center justify-between border-b border-border/50 pb-4">
                    <TabsList className="bg-secondary/40 p-1 rounded-2xl border border-border/40">
                        {DEPARTMENTS.map(dept => (
                            <TabsTrigger
                                key={dept.id}
                                value={dept.id}
                                className="rounded-xl px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-md transition-all font-light text-xs uppercase tracking-widest"
                            >
                                <span className={cn("mr-2.5 h-1.5 w-1.5 rounded-full transition-all", dept.id === activeDept ? "bg-primary scale-125" : "bg-muted-foreground/30")} />
                                {dept.name}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>

                <div className="grid gap-8 lg:grid-cols-12 items-start">
                    {/* Main Composition Card */}
                    <div className="lg:col-span-12 space-y-6">
                        <Card className="border-none bg-card shadow-card overflow-hidden transition-all duration-500 hover:shadow-card-hover border border-border/5">
                            <div className={cn("h-1.5 w-full bg-gradient-to-r transition-all duration-500",
                                activeDept === 'fiscal' ? "from-orange-500 via-orange-400 to-orange-300" :
                                    activeDept === 'pessoal' ? "from-blue-500 via-blue-400 to-blue-300" :
                                        activeDept === 'contabil' ? "from-emerald-500 via-emerald-400 to-emerald-300" :
                                            activeDept === 'financeiro' ? "from-purple-500 via-purple-400 to-purple-300" :
                                                "from-primary via-accent to-primary/50"
                            )} />
                            <CardHeader className="pt-8 px-8">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-xl font-light flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/5 border border-primary/10">
                                            <Send className="h-4 w-4 text-primary" />
                                        </div>
                                        Composição do Comunicado
                                    </CardTitle>
                                    <div className={cn(
                                        "px-4 py-1.5 rounded-full border text-[9px] font-semibold uppercase tracking-widest",
                                        DEPARTMENTS.find(d => d.id === activeDept)?.bg,
                                        DEPARTMENTS.find(d => d.id === activeDept)?.color,
                                        "border-current/20 shadow-sm"
                                    )}>
                                        {DEPARTMENTS.find(d => d.id === activeDept)?.name}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-8 p-8 pt-2">
                                {/* Fields Row */}
                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="space-y-2 group">
                                        <Label htmlFor="to" className="text-[10px] font-bold uppercase tracking-[2px] text-muted-foreground group-focus-within:text-primary transition-colors">
                                            Destinatários
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="to"
                                                placeholder="email1@exemplo.com, email2@exemplo.com"
                                                value={to}
                                                onChange={(e) => setTo(e.target.value)}
                                                className="bg-secondary/20 border-border/40 focus-visible:ring-primary/30 h-11 rounded-xl transition-all pl-10 text-xs font-light"
                                            />
                                            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40">
                                                <Mail className="h-3.5 w-3.5" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2 group">
                                        <Label htmlFor="subject" className="text-[10px] font-bold uppercase tracking-[2px] text-muted-foreground group-focus-within:text-primary transition-colors">
                                            Assunto da Mensagem
                                        </Label>
                                        <Input
                                            id="subject"
                                            placeholder="Ex: Atualização de Documentos Fiscais"
                                            value={subject}
                                            onChange={(e) => setSubject(e.target.value)}
                                            className="bg-secondary/20 border-border/40 focus-visible:ring-primary/30 h-11 rounded-xl transition-all text-xs font-light"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2 group">
                                    <Label htmlFor="message" className="text-[10px] font-bold uppercase tracking-[2px] text-muted-foreground group-focus-within:text-primary transition-colors flex justify-between">
                                        Conteúdo do Informativo
                                        <span className="font-normal lowercase opacity-40 tabular-nums">{message.length} chars</span>
                                    </Label>
                                    <Textarea
                                        id="message"
                                        placeholder="Escreva sua mensagem aqui..."
                                        rows={8}
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        className="bg-secondary/20 border-border/40 focus-visible:ring-primary/30 rounded-xl transition-all resize-none p-4 text-sm leading-relaxed font-light min-h-[240px]"
                                    />
                                </div>

                                {/* Scheduling Row */}
                                <div className="pt-6 border-t border-border/30">
                                    <div className="rounded-2xl bg-secondary/10 border border-border/40 p-5 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <CalendarIcon className="h-3.5 w-3.5 text-primary/70" />
                                                    <Label className="text-xs font-semibold uppercase tracking-wide">Agendar Envio Permanente</Label>
                                                </div>
                                                <p className="text-[10px] text-muted-foreground font-light">Programe esse comunicado para um momento estratégico.</p>
                                            </div>
                                            <Switch
                                                checked={isScheduled}
                                                onCheckedChange={setIsScheduled}
                                                className="data-[state=checked]:bg-primary"
                                            />
                                        </div>

                                        {isScheduled && (
                                            <div className="grid grid-cols-2 gap-4 pt-2 animate-in fade-in slide-in-from-top-3">
                                                <div className="space-y-1.5">
                                                    <Label className="text-[9px] uppercase tracking-wider opacity-60">Escolha a Data</Label>
                                                    <Input
                                                        type="date"
                                                        value={scheduledDate}
                                                        onChange={(e) => setScheduledDate(e.target.value)}
                                                        className="h-10 bg-background/50 border-border/40 text-xs rounded-lg"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-[9px] uppercase tracking-wider opacity-60">Escolha o Horário</Label>
                                                    <Input
                                                        type="time"
                                                        value={scheduledTime}
                                                        onChange={(e) => setScheduledTime(e.target.value)}
                                                        className="h-10 bg-background/50 border-border/40 text-xs rounded-lg"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Send Buttons */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                    <Button
                                        onClick={() => handleSend('gmail')}
                                        className="h-14 rounded-2xl bg-[#EA4335] hover:bg-[#EA4335]/90 text-white border-none shadow-lg shadow-[#EA4335]/10 group transition-all"
                                    >
                                        <div className="flex items-center gap-3">
                                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M24 4.5v15c0 .85-.65 1.5-1.5 1.5H21V7.39l-9 6.49-9-6.49V21H1.5C.65 21 0 20.35 0 19.5v-15c0-.42.17-.8.45-1.1.28-.3.65-.4 1.05-.4L12 10.11 22.5 3c.4 0 .77.1 1.05.4.28.3.45.68.45 1.1z" />
                                            </svg>
                                            <div className="flex flex-col items-start leading-none">
                                                <span className="text-[10px] uppercase tracking-widest opacity-70">Enviar via</span>
                                                <span className="font-semibold text-sm tracking-wide">Gmail Corporate</span>
                                            </div>
                                        </div>
                                    </Button>

                                    <Button
                                        onClick={() => handleSend('outlook')}
                                        className="h-14 rounded-2xl bg-[#0078D4] hover:bg-[#0078D4]/90 text-white border-none shadow-lg shadow-[#0078D4]/10 group transition-all"
                                    >
                                        <div className="flex items-center gap-3">
                                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M11.5 2C10.7 2 10 2.7 10 3.5v1.6L2.6 7.6C1.6 8 1 9 1 10.1v7c0 1.1.7 2.1 1.7 2.5l7.3 2.5V22c0 .8.7 1.5 1.5 1.5h9c.8 0 1.5-.7 1.5-1.5V3.5c0-.8-.7-1.5-1.5-1.5h-9zm0 2h9v17.5l-9-3V4zm-2 3.6v10.8L3 16.5v-7L9.5 7.6z" />
                                            </svg>
                                            <div className="flex flex-col items-start leading-none">
                                                <span className="text-[10px] uppercase tracking-widest opacity-70">Enviar via</span>
                                                <span className="font-semibold text-sm tracking-wide">Outlook Business</span>
                                            </div>
                                        </div>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>



                    {/* Full Width History Section */}
                    <div className="lg:col-span-12">
                        <Card className="border-none bg-card shadow-card overflow-hidden">
                            <CardHeader className="border-b border-border/40 pb-6 pt-8 px-8 flex flex-row items-center justify-between">
                                <div className="space-y-1">
                                    <CardTitle className="text-xl font-light flex items-center gap-2">
                                        <History className="h-5 w-5 text-muted-foreground/60" />
                                        Histórico de Comunicados
                                    </CardTitle>
                                    <CardDescription className="text-xs font-light">
                                        Logs detalhados de todas as interações do setor {DEPARTMENTS.find(d => d.id === activeDept)?.name}.
                                    </CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" className="h-8 rounded-lg text-[10px] uppercase tracking-widest font-light border-border/50">
                                        <Filter className="h-3 w-3 mr-2 opacity-50" /> Filtrar Lista
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-border/30">
                                    {loading ? (
                                        <div className="p-16 text-center text-muted-foreground flex flex-col items-center gap-3">
                                            <Clock className="h-10 w-10 animate-pulse opacity-20" />
                                            <p className="text-sm font-light">Sincronizando registros do servidor...</p>
                                        </div>
                                    ) : filteredAnnouncements.length === 0 ? (
                                        <div className="p-20 text-center text-muted-foreground flex flex-col items-center gap-4">
                                            <div className="h-16 w-16 rounded-3xl bg-secondary/50 flex items-center justify-center">
                                                <Search className="h-8 w-8 opacity-10" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium">Nenhum registro encontrado</p>
                                                <p className="text-xs font-light opacity-50">Inicie uma nova comunicação para este setor.</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="grid divide-y divide-border/30">
                                            {filteredAnnouncements.map((item) => (
                                                <div key={item.id} className="p-6 hover:bg-secondary/10 transition-colors flex items-center justify-between group">
                                                    <div className="flex items-center gap-5">
                                                        <div className={cn("h-11 w-11 rounded-2xl flex items-center justify-center border border-current/10 shadow-sm transition-transform group-hover:scale-105",
                                                            DEPARTMENTS.find(d => d.id === item.department)?.bg || "bg-secondary"
                                                        )}>
                                                            <Mail className={cn("h-4 w-4",
                                                                DEPARTMENTS.find(d => d.id === item.department)?.color || "text-muted-foreground"
                                                            )} />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{item.subject}</p>
                                                            <div className="flex items-center gap-4">
                                                                <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                                                                    <Users className="h-3 w-3 opacity-40" />
                                                                    {item.recipient}
                                                                </span>
                                                                <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                                                                    <Clock className="h-3 w-3 opacity-40" />
                                                                    {item.status === 'scheduled' && item.scheduled_for
                                                                        ? `Agendado: ${format(new Date(item.scheduled_for), "dd/MM/yyyy, HH:mm", { locale: ptBR })}`
                                                                        : item.sent_at ? format(new Date(item.sent_at), "dd 'de' MMMM, HH:mm", { locale: ptBR }) : 'Pendente'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-8">
                                                        <div className="flex flex-col items-end gap-1.5">
                                                            <div className={cn(
                                                                "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border shadow-sm",
                                                                item.status === 'scheduled' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                                                                    item.status === 'read' ? "bg-primary/10 text-primary border-primary/20" :
                                                                        "bg-secondary/50 text-muted-foreground border-border/50"
                                                            )}>
                                                                {getStatusIcon(item.status)}
                                                                {getStatusText(item.status)}
                                                            </div>
                                                            <span className="text-[8px] text-muted-foreground font-bold opacity-30 uppercase tracking-tighter">ID: {item.id.slice(0, 8)}</span>
                                                        </div>
                                                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-primary/10 hover:text-primary">
                                                            <ArrowRight className="h-5 w-5" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </Tabs>
        </div>
    );
}
