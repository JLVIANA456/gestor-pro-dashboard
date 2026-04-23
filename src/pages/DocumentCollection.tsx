import React, { useState, useMemo, useEffect } from 'react';
import {
    FolderOpen,
    Plus,
    CalendarClock,
    MailCheck,
    Settings,
    Users,
    BellRing,
    History,
    Activity,
    Trash2,
    Eye,
    Wand2,
    Save,
    Search,
    Building2,
    Check,
    CheckCircle2,
    Clock,
    FileSearch,
    LayoutGrid,
    SlidersHorizontal,
    Edit3,
    ChevronRight,
    ArrowRight,
    Send
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useClients } from '@/hooks/useClients';
import { format } from 'date-fns';
import { supabase } from "@/integrations/supabase/client";

const DEFAULT_TEMPLATE = `Prezado(a) Cliente, {{nome_fantasia}}

Solicitamos, por gentileza, o envio dos documentos contábeis abaixo relacionados:

- Extratos das contas correntes
- Extratos/resumos de aplicações financeiras e respectivos rendimentos
- Comprovantes de pagamentos e documentos auxiliares

Ressaltamos que os documentos solicitados referem-se sempre ao mês anterior.

Atenciosamente,
JLVIANA Consultoria Contábil`;

export default function DocumentCollection() {
    const [events, setEvents] = useState<any[]>([]);
    const [loadingEvents, setLoadingEvents] = useState(false);
    const { clients } = useClients();
    const [rules, setRules] = useState<any[]>([]);

    // Modal & Form State for Rules
    const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
    const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
    const [title, setTitle] = useState('');
    const [sendDay, setSendDay] = useState(5);
    const [followUpDay, setFollowUpDay] = useState(10);
    const [template, setTemplate] = useState(DEFAULT_TEMPLATE);
    const [selectedClients, setSelectedClients] = useState<string[]>([]);
    const [clientSearchTerm, setClientSearchTerm] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Dashboard Control State
    const [controlSearch, setControlSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'received'>('all');
    const [selectedClientForDetails, setSelectedClientForDetails] = useState<any>(null);

    const fetchRules = async () => {
        try {
            const { data, error } = await supabase
                .from('collection_rules')
                .select('*, collection_rule_clients(client_id)')
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data) {
                const formattedRules = data.map(r => ({
                    id: r.id,
                    name: r.name,
                    sendDay: r.send_day,
                    followUpDay: r.follow_up_day,
                    template: r.template,
                    isActive: r.is_active,
                    stats: { sent: 0, pendencies: 0 },
                    selectedClients: (r.collection_rule_clients || []).map((c: any) => c.client_id)
                }));
                setRules(formattedRules);
            }
        } catch (error: any) {
            console.error('Error fetching rules:', error);
            toast.error('Erro ao carregar as regras do servidor.');
        }
    };

    const fetchEvents = async () => {
        try {
            setLoadingEvents(true);
            const { data, error } = await supabase
                .from('collection_events')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setEvents(data || []);
        } catch (error) {
            console.error('Error fetching events:', error);
        } finally {
            setLoadingEvents(false);
        }
    };

    useEffect(() => {
        fetchRules();
        fetchEvents();
    }, []);

    const filteredClientsModal = useMemo(() => {
        return clients.filter(c =>
            (c.nomeFantasia || '').toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
            (c.razaoSocial || '').toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
            (c.cnpj || '').includes(clientSearchTerm)
        );
    }, [clients, clientSearchTerm]);

    // Combine Real Clients with Mock Status for the Control panel
    const controlClientsList = useMemo(() => {
        // Get current month reference (like in edge function)
        const today = new Date();
        const referenceMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString();

        return clients.filter(c => {
            const matchesSearch = (c.nomeFantasia || '').toLowerCase().includes(controlSearch.toLowerCase()) ||
                (c.cnpj || '').includes(controlSearch);

            if (!matchesSearch) return false;

            // Find latest event for this client
            const lastEvent = events.find(e => e.client_id === c.id);
            const status = lastEvent ? lastEvent.status : 'pending';

            if (statusFilter === 'all') return true;
            if (statusFilter === 'pending') return status !== 'received';
            return status === statusFilter;
        }).map(c => {
            const lastEvent = events.find(e => e.client_id === c.id);
            const activeRules = rules.filter((r: any) => r.selectedClients?.includes(c.id));

            return {
                ...c,
                collectionStatus: {
                    status: lastEvent ? lastEvent.status : 'pending',
                    overdue: lastEvent?.status === 'follow_up_sent',
                    documentCount: activeRules.length,
                    eventId: lastEvent?.id,
                    lastEvent: lastEvent
                }
            };
        });
    }, [clients, controlSearch, statusFilter, rules, events]);

    const toggleClientSelection = (clientId: string) => {
        if (selectedClients.includes(clientId)) {
            setSelectedClients(prev => prev.filter(id => id !== clientId));
        } else {
            setSelectedClients(prev => [...prev, clientId]);
        }
    };

    const selectAllClients = () => {
        if (selectedClients.length === clients.length) {
            setSelectedClients([]);
        } else {
            setSelectedClients(clients.map(c => c.id));
        }
    };

    const openNewRuleModal = () => {
        setEditingRuleId(null);
        setTitle('');
        setSendDay(5);
        setFollowUpDay(10);
        setTemplate(DEFAULT_TEMPLATE);
        setSelectedClients([]);
        setClientSearchTerm('');
        setIsRuleModalOpen(true);
    };

    const openEditRuleModal = (rule: any) => {
        setEditingRuleId(rule.id);
        setTitle(rule.name);
        setSendDay(rule.sendDay);
        setFollowUpDay(rule.followUpDay);
        setTemplate(rule.template || DEFAULT_TEMPLATE);
        setSelectedClients(rule.selectedClients || []);
        setIsRuleModalOpen(true);
    };

    const handleSaveRule = async () => {
        if (!title.trim()) {
            toast.error("Por favor, adicione um nome para a regra.");
            return;
        }
        if (selectedClients.length === 0) {
            toast.error("Você precisa selecionar pelo menos 1 cliente na base.");
            return;
        }

        try {
            setIsSaving(true);

            let ruleId = editingRuleId;

            if (editingRuleId) {
                // Update existing rule
                const { error: ruleErr } = await supabase
                    .from('collection_rules')
                    .update({
                        name: title,
                        send_day: sendDay,
                        follow_up_day: followUpDay,
                        template: template,
                    })
                    .eq('id', editingRuleId);

                if (ruleErr) throw ruleErr;

                // Remove old clients mapping
                await supabase
                    .from('collection_rule_clients')
                    .delete()
                    .eq('rule_id', editingRuleId);

            } else {
                // Insert new rule
                const { data: newRuleData, error: ruleErr } = await supabase
                    .from('collection_rules')
                    .insert({
                        name: title,
                        send_day: sendDay,
                        follow_up_day: followUpDay,
                        template: template,
                        is_active: true
                    })
                    .select()
                    .single();

                if (ruleErr) throw ruleErr;

                ruleId = newRuleData.id;
            }

            // Insert new clients mappings
            const clientMappings = selectedClients.map(cId => ({
                rule_id: ruleId,
                client_id: cId
            }));

            if (clientMappings.length > 0) {
                const { error: clientsErr } = await supabase
                    .from('collection_rule_clients')
                    .insert(clientMappings);

                if (clientsErr) throw clientsErr;
            }

            toast.success(editingRuleId ? "Automação atualizada com sucesso no banco!" : "Nova automação salva na nuvem!");
            setIsRuleModalOpen(false);
            fetchRules(); // refresh data

        } catch (error: any) {
            console.error('Error saving rule:', error);
            toast.error('Ocorreu um erro ao salvar no banco. Verifique o console.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteRule = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm("Tem certeza que deseja apagar permanentemente essa regra e parar os disparos?")) return;

        try {
            const { error } = await supabase
                .from('collection_rules')
                .delete()
                .eq('id', id);

            if (error) throw error;

            toast.success("Regra removida da nuvem.");
            fetchRules();
        } catch (err) {
            console.error("error deleting rule", err);
            toast.error("Erro ao tentar remover a regra.");
        }
    };

    const handleUpdateStatus = async (clientId: string, eventId: string | undefined, newStatus: 'pending' | 'received') => {
        try {
            if (eventId) {
                const { error } = await supabase
                    .from('collection_events')
                    .update({
                        status: newStatus,
                        received_at: newStatus === 'received' ? new Date().toISOString() : null
                    })
                    .eq('id', eventId);
                if (error) throw error;
            } else {
                // Se não houver evento, cria um evento manual
                const today = new Date();
                const referenceMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString();

                const { error } = await supabase
                    .from('collection_events')
                    .insert({
                        client_id: clientId,
                        status: newStatus,
                        reference_month: referenceMonth,
                        received_at: newStatus === 'received' ? new Date().toISOString() : null,
                        sent_at: new Date().toISOString()
                    });
                if (error) throw error;
            }

            toast.success(`Status atualizado para ${newStatus === 'received' ? 'Recebido' : 'Pendente'}`);
            fetchEvents();
            setSelectedClientForDetails(null);
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Erro ao atualizar status.');
        }
    };

    const handleManualSend = async (client: any) => {
        const activeRule = rules.find(r => r.selectedClients?.includes(client.id));
        const ruleTemplate = activeRule ? activeRule.template : DEFAULT_TEMPLATE;

        if (!client.email) {
            toast.error("Cliente sem e-mail cadastrado.");
            return;
        }

        try {
            const loadingToast = toast.loading("Preparando disparo manual...");

            // 1. Criar Evento
            const today = new Date();
            const referenceMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString();

            const { data: newEvent, error: insertError } = await supabase
                .from('collection_events')
                .insert({
                    rule_id: activeRule?.id || null,
                    client_id: client.id,
                    reference_month: referenceMonth,
                    status: 'pending',
                    sent_at: new Date().toISOString()
                })
                .select('id')
                .single();

            if (insertError) throw insertError;

            // 2. Enviar E-mail
            const personalizedMessage = ruleTemplate.replace(/{{nome_fantasia}}/g, client.nomeFantasia || client.razaoSocial || 'Cliente');
            const BASE_URL = window.location.origin;
            const uploadLink = `${BASE_URL}/envio-cobranca/${newEvent.id}`;

            const htmlContent = `
                <div style="background-color: #f8fafc; padding: 40px 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #f1f5f9; overflow: hidden;">
                        <div style="padding: 40px;">
                            <h2 style="text-align: center; color: #1e293b; font-size: 24px; margin-bottom: 30px; margin-top: 0;">
                                Solicitação de <span style="color: #ef4444;">Documentos</span>
                            </h2>
                            <div style="color: #475569; font-size: 15px; line-height: 1.6;">
                                ${personalizedMessage.replace(/\n/g, '<br>')}
                            </div>
                            
                            <div style="text-align: center; margin-top: 40px; margin-bottom: 10px;">
                                <a href="${uploadLink}" style="background-color: #ef4444; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 15px;">
                                    📤 Enviar Meus Documentos Agora
                                </a>
                                <p style="font-size: 12px; color: #94a3b8; margin-top: 16px; margin-bottom: 0;">
                                    Link único, seguro e criptografado exclusivo para sua empresa.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            const { error: emailError } = await (supabase.rpc as any)('send_email_with_resend', {
                to_email: client.email,
                subject: "Solicitação de Documentos Contábeis",
                html_content: htmlContent
            });

            if (emailError) throw emailError;

            toast.success("Cobrança enviada com sucesso!", { id: loadingToast });
            fetchEvents();
        } catch (error) {
            console.error('Error manual sending:', error);
            toast.error("Erro ao realizar disparo manual.");
        }
    };


    return (
        <div className="max-w-[1600px] mx-auto space-y-10 px-4 sm:px-8 pb-12 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between pt-8">
                <div>
                    <h1 className="text-4xl font-extralight tracking-tight text-foreground flex items-center gap-3">
                        <FolderOpen className="h-8 w-8 text-primary" />
                        Cobrança de <span className="font-semibold text-primary">Documentos</span>
                    </h1>
                    <p className="text-[10px] font-normal text-muted-foreground uppercase tracking-[0.3em] mt-2 opacity-70">
                        Automação Inteligente de Solicitações Contábeis
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        onClick={openNewRuleModal}
                        className="rounded-[1.2rem] bg-primary hover:bg-primary/90 text-[11px] uppercase font-black tracking-widest h-11 px-8 shadow-lg shadow-primary/10 transition-all border-none"
                    >
                        Nova Automação
                    </Button>
                </div>
            </div>

            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Automações Ativas', value: rules.length, icon: Activity, color: 'primary' },
                    { label: 'Empresas Vinculadas', value: clients.length, icon: Users, color: 'blue' },
                    { label: 'Avisos Enviados', value: rules.reduce((acc, curr) => acc + curr.stats.sent, 0), icon: MailCheck, color: 'amber' },
                ].map((stat, i) => (
                    <div key={i} className={cn(
                        "rounded-[2.5rem] p-6 border transition-all hover:shadow-lg relative overflow-hidden flex flex-col justify-between h-32",
                        stat.color === 'primary' && "bg-primary/5 border-primary/10",
                        stat.color === 'blue' && "bg-blue-500/5 border-blue-500/10",
                        stat.color === 'amber' && "bg-amber-500/5 border-amber-500/10",
                        stat.color === 'emerald' && "bg-emerald-500/5 border-emerald-500/10",
                    )}>
                        <div className="flex justify-between items-start">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">{stat.label}</p>
                            <stat.icon className={cn("h-5 w-5 opacity-20",
                                stat.color === 'primary' && "text-primary",
                                stat.color === 'blue' && "text-blue-500",
                                stat.color === 'amber' && "text-amber-500",
                                stat.color === 'emerald' && "text-emerald-500",
                            )} />
                        </div>
                        <p className={cn("text-3xl font-black tracking-tighter",
                            stat.color === 'primary' && "text-primary",
                            stat.color === 'blue' && "text-blue-600",
                            stat.color === 'amber' && "text-amber-600",
                            stat.color === 'emerald' && "text-emerald-600",
                        )}>
                            {stat.value}
                        </p>
                    </div>
                ))}
            </div>

            {/* Layout com Tabs para maior espaço visual */}
            <Tabs defaultValue="controle" className="w-full">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
                    <div className="flex items-center gap-1 bg-muted/20 p-1.5 rounded-2xl border border-border/10 self-start">
                        <TabsList className="bg-transparent border-none p-0 h-10">
                            <TabsTrigger value="controle" className="rounded-xl text-[10px] font-black uppercase tracking-widest px-6 h-full data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all gap-2">
                                <LayoutGrid className="h-3.5 w-3.5" /> Pendências
                            </TabsTrigger>
                            <TabsTrigger value="automacoes" className="rounded-xl text-[10px] font-black uppercase tracking-widest px-6 h-full data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all gap-2">
                                <SlidersHorizontal className="h-3.5 w-3.5" /> Configuração
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <div className="flex items-center gap-2">
                        {[
                            { key: 'all', label: 'Todos', count: clients.length },
                            { key: 'pending', label: 'Pendentes', count: clients.length - events.filter(e => e.status === 'received').length },
                            { key: 'received', label: 'Recebidos', count: events.filter(e => e.status === 'received').length },
                        ].map(f => (
                            <button
                                key={f.key}
                                onClick={() => setStatusFilter(f.key as any)}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border",
                                    statusFilter === f.key
                                        ? "bg-primary/10 border-primary/20 text-primary shadow-sm"
                                        : "bg-white border-border/40 text-muted-foreground/50 hover:border-border hover:text-foreground"
                                )}
                            >
                                {f.label} <span className="ml-1 opacity-50">({f.count})</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* TAB 1: CONTROLE E PENDÊNCIAS (FULL SCREEN WIDTH) */}
                <TabsContent value="controle" className="mt-0">
                    <div className="bg-card rounded-[3rem] border border-border/40 shadow-sm overflow-hidden flex flex-col h-[750px] w-full">
                        <div className="p-8 border-b border-border/10 bg-muted/5">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                                <div>
                                    <h2 className="text-xl font-bold tracking-tight text-foreground">
                                        Monitoramento <span className="text-primary font-black">Tempo Real</span>
                                    </h2>
                                    <p className="text-[9px] uppercase font-black tracking-widest text-muted-foreground/40 mt-1">
                                        Controle individual de recebimento de documentos
                                    </p>
                                </div>
                                <div className="relative group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
                                    <Input
                                        placeholder="Pesquisar por empresa ou CNPJ..."
                                        value={controlSearch}
                                        onChange={(e) => setControlSearch(e.target.value)}
                                        className="pl-11 h-12 w-full sm:w-[400px] rounded-2xl bg-white border-border/40 shadow-sm focus-visible:ring-primary/10 font-medium text-sm transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        <ScrollArea className="flex-1">
                            <div className="p-10 space-y-4">
                                {controlClientsList.map((client) => (
                                    <div
                                        key={client.id}
                                        onClick={() => setSelectedClientForDetails(client)}
                                        className="flex items-center justify-between p-6 rounded-[2rem] bg-card border border-border/10 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 group cursor-pointer"
                                    >
                                        <div className="flex items-center gap-6 flex-1 min-w-0">
                                            <div className={cn(
                                                "h-16 w-16 rounded-[1.5rem] flex items-center justify-center transition-all duration-300 flex-shrink-0",
                                                client.collectionStatus.status === 'received' ? "bg-emerald-50 text-emerald-500 border border-emerald-100" :
                                                    client.collectionStatus.overdue ? "bg-red-50 text-red-500 border border-red-100" :
                                                        "bg-amber-50 text-amber-500 border border-amber-100"
                                            )}>
                                                <Building2 className="h-7 w-7" />
                                            </div>
                                            <div className="space-y-1 min-w-0">
                                                <h3 className="text-base font-bold text-foreground leading-tight truncate group-hover:text-primary transition-colors">
                                                    {client.nomeFantasia || client.razaoSocial}
                                                </h3>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-widest">{client.cnpj}</span>
                                                    <span className="text-muted-foreground/20 text-xs tracking-tighter">•</span>
                                                    <span className="text-[10px] font-black text-primary/40 uppercase tracking-widest">
                                                        {client.collectionStatus.documentCount} Automações Ativas
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-10">
                                            <div className="flex flex-col items-end gap-1.5 min-w-[180px]">
                                                {client.collectionStatus.status === 'received' ? (
                                                    <div className="flex items-center gap-2 text-emerald-600 font-black text-[10px] uppercase tracking-widest bg-emerald-50 px-3 py-1.5 rounded-xl">
                                                        <CheckCircle2 className="h-3.5 w-3.5" /> Recebido
                                                    </div>
                                                ) : client.collectionStatus.overdue ? (
                                                    <div className="flex items-center gap-2 text-red-600 font-black text-[10px] uppercase tracking-widest bg-red-50 px-3 py-1.5 rounded-xl animate-pulse">
                                                        <Clock className="h-3.5 w-3.5" /> Recobrança Ativa
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 text-amber-600 font-black text-[10px] uppercase tracking-widest bg-amber-50 px-3 py-1.5 rounded-xl">
                                                        <Clock className="h-3.5 w-3.5" /> Aguardando
                                                    </div>
                                                )}

                                                {client.collectionStatus.status !== 'received' && (
                                                    <p className="text-[9px] font-bold uppercase text-muted-foreground/40 whitespace-nowrap tracking-tight">
                                                        {client.collectionStatus.overdue ? 'Prazo expirado' : 'Expira em 3 dias'}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <Button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleManualSend(client);
                                                    }}
                                                    variant="ghost"
                                                    className="h-12 w-12 rounded-2xl bg-muted/20 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all border border-transparent hover:border-primary/20 p-0"
                                                    title="Disparo Manual"
                                                >
                                                    <Send className="h-5 w-5" />
                                                </Button>
                                                <div className="h-12 w-12 rounded-2xl bg-muted/20 flex items-center justify-center text-muted-foreground group-hover:bg-primary/5 group-hover:text-primary transition-all border border-transparent group-hover:border-primary/20">
                                                    <ChevronRight className="h-5 w-5" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {controlClientsList.length === 0 && (
                                    <div className="py-32 flex flex-col items-center justify-center opacity-40">
                                        <Search className="h-16 w-16 mb-4 text-slate-400" />
                                        <p className="font-bold uppercase tracking-[0.3em] text-xs">Nenhuma empresa encontrada com esse dado</p>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </div>
                </TabsContent>

                {/* TAB 2: AUTOMAÇÕES CONFIGURADAS (FULL SCREEN WIDTH) */}
                <TabsContent value="automacoes" className="mt-0">
                    <div className="bg-card rounded-[3rem] border border-border/40 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
                        <div className="p-8 border-b border-border/10 bg-muted/5 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                    <Settings className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold tracking-tight text-foreground">
                                        Biblioteca de <span className="text-primary font-black">Regras</span>
                                    </h2>
                                    <p className="text-[9px] uppercase font-black tracking-widest text-muted-foreground/40 mt-1">
                                        Gatilhos de e-mail programados do Escritório
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {rules.length === 0 ? (
                                    <div className="col-span-full py-24 flex flex-col items-center justify-center opacity-30 border-2 border-dashed border-border/50 rounded-[3rem]">
                                        <CalendarClock className="h-12 w-12 mb-4 text-muted-foreground" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-center">Nenhuma regra configurada</p>
                                    </div>
                                ) : (
                                    rules.map((rule) => (
                                        <div
                                            key={rule.id}
                                            onClick={() => openEditRuleModal(rule)}
                                            className="p-8 rounded-[2.5rem] bg-card border border-border/10 shadow-sm hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 group flex flex-col gap-6 relative overflow-hidden cursor-pointer"
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="space-y-1.5 flex-1 min-w-0">
                                                    {rule.isActive && <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-2.5 py-1 rounded-lg inline-flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Robô Ativo</span>}
                                                    <h3 className="text-base font-bold text-foreground leading-tight truncate">
                                                        {rule.name}
                                                    </h3>
                                                </div>
                                                <div className="flex items-center gap-1 text-muted-foreground/30 group-hover:text-primary transition-colors">
                                                    <Edit3 className="h-4 w-4" />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 bg-muted/20 p-4 rounded-2xl border border-border/5">
                                                <div className="text-center border-r border-border/10">
                                                    <p className="text-[8px] font-black text-muted-foreground/50 uppercase tracking-widest mb-1">Início</p>
                                                    <p className="text-base font-black text-primary">Dia {rule.sendDay}</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-[8px] font-black text-muted-foreground/50 uppercase tracking-widest mb-1">Recobro</p>
                                                    <p className="text-base font-black text-orange-500">Dia {rule.followUpDay}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between pt-4 border-t border-border/5">
                                                <div className="flex items-center gap-2">
                                                    <Users className="h-3.5 w-3.5 text-muted-foreground/40" />
                                                    <span className="text-[10px] font-bold text-muted-foreground/60">{rule.selectedClients?.length || 0} Empresas</span>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={(e) => handleDeleteRule(e, rule.id)}
                                                    className="h-8 w-8 rounded-lg text-muted-foreground/30 hover:text-red-500 hover:bg-red-50 transition-all border-none"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>

            {/* MODAL GIGANTE DE DETALHAMENTO DO CLIENTE (Visão Individual) */}
            <Dialog open={!!selectedClientForDetails} onOpenChange={(open) => !open && setSelectedClientForDetails(null)}>
                <DialogContent className="max-w-[95vw] lg:max-w-6xl p-0 rounded-[1.5rem] overflow-hidden border-none shadow-2xl bg-white outline-none ring-1 ring-slate-200">
                    {selectedClientForDetails && (
                        <div className="flex flex-col h-[90vh]">
                            {/* Modal Header */}
                            <div className="p-6 md:p-8 border-b border-slate-100 bg-white shadow-sm z-10 flex-shrink-0 flex items-center justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-primary font-bold">
                                        <Building2 className="h-4 w-4" />
                                        <span className="text-[10px] uppercase tracking-[0.2em]">Painel de Controle Individual</span>
                                    </div>
                                    <h2 className="text-3xl font-light tracking-tight text-slate-800">
                                        Monitoramento de <span className="font-bold text-primary">Arquivos</span>
                                    </h2>
                                </div>

                                {/* Header Status Badge */}
                                <div className="flex items-center gap-4">
                                    <div className="bg-slate-50 px-6 py-4 rounded-2xl border border-slate-100 flex items-center justify-center gap-4">
                                        {selectedClientForDetails.collectionStatus.status === 'received' ? (
                                            <div className="flex flex-col text-right">
                                                <span className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">Contabilidade em Dia</span>
                                                <span className="text-xl font-bold text-emerald-600 tracking-tight">Arquivos Recebidos</span>
                                            </div>
                                        ) : selectedClientForDetails.collectionStatus.overdue ? (
                                            <div className="flex flex-col text-right">
                                                <span className="text-[10px] font-black uppercase text-red-500 tracking-widest">Aviso de Atraso</span>
                                                <span className="text-xl font-bold text-red-600 tracking-tight">Recobrança Ativa</span>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col text-right">
                                                <span className="text-[10px] font-black uppercase text-amber-500 tracking-widest">Ciclo Aberto</span>
                                                <span className="text-xl font-bold text-amber-600 tracking-tight">Aguardando Cliente</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Modal Body - 2 Columns */}
                            <div className="flex border-b border-slate-100 flex-1 overflow-hidden">
                                {/* Left Column: Client Core Info */}
                                <div className="w-full lg:w-1/3 bg-slate-50 border-r border-slate-200 p-8 h-full flex flex-col">
                                    <div className="h-20 w-20 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-200 text-primary mb-6 shrink-0">
                                        <Building2 className="h-10 w-10 relative z-10" />
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Empresa Alvo</p>
                                            <h2 className="text-2xl font-bold text-slate-800 leading-tight">
                                                {selectedClientForDetails.nomeFantasia || selectedClientForDetails.razaoSocial}
                                            </h2>
                                        </div>
                                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Documento (CNPJ)</p>
                                            <p className="font-medium text-slate-700">{selectedClientForDetails.cnpj}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Automation History */}
                                <ScrollArea className="w-full lg:w-2/3 bg-white h-full relative">
                                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none select-none">
                                        <History className="h-96 w-96" />
                                    </div>
                                    <div className="p-8 space-y-6 relative z-10">
                                        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                                            <FolderOpen className="h-5 w-5 text-primary" />
                                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-700">Histórico de Automações Ativas</h3>
                                        </div>

                                        <div className="space-y-4">
                                            {rules.filter(r => r.selectedClients?.includes(selectedClientForDetails.id)).map((rule, idx) => (
                                                <div key={idx} className="bg-white border border-slate-200/60 shadow-sm rounded-2xl p-6 flex flex-col gap-6 hover:border-primary/20 transition-all">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-4">
                                                            <div className="bg-primary/5 p-3 rounded-xl border border-primary/10">
                                                                <FileSearch className="h-5 w-5 text-primary" />
                                                            </div>
                                                            <div className="space-y-0.5">
                                                                <span className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Gatilho Vinculado</span>
                                                                <h4 className="font-bold text-lg text-slate-700">{rule.name}</h4>
                                                            </div>
                                                        </div>
                                                        {selectedClientForDetails.collectionStatus.status === 'received' ? (
                                                            <Badge className="bg-emerald-500/10 text-emerald-600 border-none font-bold text-[10px] uppercase tracking-widest px-3 py-1.5">
                                                                Arquivos Concluídos
                                                            </Badge>
                                                        ) : (
                                                            <Badge className="bg-amber-500/10 text-amber-600 border-none font-bold text-[10px] uppercase tracking-widest px-3 py-1.5">
                                                                Pendente de Envio
                                                            </Badge>
                                                        )}
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col gap-1.5">
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Referência Solicitada</span>
                                                            <span className="text-sm font-bold text-slate-700">Competência {format(new Date(), 'MM/yyyy')}</span>
                                                        </div>
                                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col gap-1.5">
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Disparo do Robô</span>
                                                            <span className="text-sm font-bold text-slate-700">Agendado para o Dia {rule.sendDay}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {rules.filter(r => r.selectedClients?.includes(selectedClientForDetails.id)).length === 0 && (
                                                <p className="text-slate-400 text-sm font-bold opacity-60">O cliente não pertence a nenhuma regra ativa.</p>
                                            )}
                                        </div>
                                    </div>
                                </ScrollArea>
                            </div>

                            {/* Modal Footer */}
                            <div className="px-8 py-4 bg-white flex justify-between items-center z-10 flex-shrink-0">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resolução Manual</span>
                                <div className="flex items-center gap-3">
                                    <Button
                                        variant="ghost"
                                        onClick={() => setSelectedClientForDetails(null)}
                                        className="rounded-xl font-bold uppercase tracking-widest text-[10px] h-12 px-6 hover:bg-slate-100"
                                    >
                                        Fechar Painel
                                    </Button>

                                    <Button
                                        onClick={() => handleManualSend(selectedClientForDetails)}
                                        variant="outline"
                                        className="rounded-xl border-primary/20 text-primary hover:bg-primary/5 font-bold uppercase tracking-widest text-[10px] h-12 px-6 gap-2 transition-all"
                                    >
                                        <Send className="h-4 w-4" /> Disparo Manual
                                    </Button>

                                    {selectedClientForDetails.collectionStatus.status !== 'received' ? (
                                        <Button
                                            onClick={() => handleUpdateStatus(selectedClientForDetails.id, selectedClientForDetails.collectionStatus.eventId, 'received')}
                                            className="rounded-xl bg-emerald-500 hover:bg-emerald-600 shadow-xl shadow-emerald-500/20 font-bold uppercase tracking-widest text-[10px] h-12 px-8 gap-2 transition-all text-white"
                                        >
                                            <CheckCircle2 className="h-4 w-4" /> Marcar como Recebido
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={() => handleUpdateStatus(selectedClientForDetails.id, selectedClientForDetails.collectionStatus.eventId, 'pending')}
                                            variant="outline"
                                            className="rounded-xl border-orange-200 text-orange-600 hover:bg-orange-50 font-bold uppercase tracking-widest text-[10px] h-12 px-8 gap-2 transition-all"
                                        >
                                            <Clock className="h-4 w-4" /> Voltar para Pendente
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>


            {/* Modal de Configuração DE REGRAS (Utilizado para NOVO e EDITAR) */}
            <Dialog open={isRuleModalOpen} onOpenChange={setIsRuleModalOpen}>
                <DialogContent className="max-w-[95vw] lg:max-w-6xl p-0 rounded-[1.5rem] overflow-hidden border-none shadow-2xl bg-white outline-none ring-1 ring-slate-200">
                    <div className="flex flex-col h-[90vh]">
                        {/* Modal Header */}
                        <div className="p-6 md:p-8 border-b border-slate-100 bg-white shadow-sm z-10 flex-shrink-0">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-primary font-bold">
                                        <Wand2 className="h-4 w-4" />
                                        <span className="text-[10px] uppercase tracking-[0.2em]">{editingRuleId ? 'Edição de Rotina' : 'Automação de Rotinas'}</span>
                                    </div>
                                    <h2 className="text-3xl font-light tracking-tight text-slate-800">
                                        {editingRuleId ? 'Gerenciar' : 'Configurar'} <span className="font-bold text-primary">{editingRuleId ? 'Regra Atual' : 'Nova Regra'}</span>
                                    </h2>
                                </div>
                                <div className="flex items-center gap-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <div className="text-center px-4 border-r border-slate-200">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Clientes Selecionados</p>
                                        <p className="text-xl font-bold text-primary leading-none">{selectedClients.length}</p>
                                    </div>
                                    <div className="text-center px-4">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Base Total</p>
                                        <p className="text-xl font-bold text-slate-700 leading-none">{clients.length}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Body with two columns */}
                        <div className="flex border-b border-slate-100 flex-1 overflow-hidden">
                            {/* Left Column: Form Configuration */}
                            <ScrollArea className="w-full lg:w-1/2 bg-slate-50 border-r border-slate-200 p-8 h-full">
                                <div className="space-y-8 pr-4 pb-8">
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Regra de Referência</Label>
                                        <Input
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            placeholder="Ex: Documentos Contábeis Mensais"
                                            className="h-14 bg-white border-slate-200 shadow-sm rounded-2xl text-lg focus-visible:ring-primary/20 bg-transparent"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                                <MailCheck className="h-3.5 w-3.5" /> Dia do Pedido
                                            </Label>
                                            <Input
                                                type="number"
                                                min={1} max={31}
                                                value={sendDay}
                                                onChange={(e) => setSendDay(Number(e.target.value))}
                                                className="h-12 bg-slate-50 border-transparent rounded-xl text-lg text-center font-bold"
                                            />
                                        </div>
                                        <div className="space-y-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-orange-500 flex items-center gap-2">
                                                <BellRing className="h-3.5 w-3.5" /> Recobrança
                                            </Label>
                                            <Input
                                                type="number"
                                                min={1} max={31}
                                                value={followUpDay}
                                                onChange={(e) => setFollowUpDay(Number(e.target.value))}
                                                className="h-12 bg-slate-50 border-transparent rounded-xl text-lg text-center font-bold"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Template HTML de Comunicação</Label>
                                        <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-md focus-within:ring-2 ring-primary/20 transition-all">
                                            <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                                                <span className="text-[10px] font-bold text-slate-500 flex gap-2">
                                                    <Badge variant="outline" className="text-[9px] uppercase tracking-wider bg-white border-slate-200">{'{{nome_fantasia}}'}</Badge>
                                                </span>
                                            </div>
                                            <Textarea
                                                value={template}
                                                onChange={(e) => setTemplate(e.target.value)}
                                                className="min-h-[300px] border-none resize-none focus-visible:ring-0 text-[13px] leading-relaxed text-slate-600 p-6 bg-transparent custom-scrollbar"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </ScrollArea>

                            {/* Right Column: Client Selection Search */}
                            <div className="hidden lg:flex w-1/2 flex-col bg-white">
                                <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex flex-col gap-4 z-10 flex-shrink-0">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Definir Público Alvo</Label>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-[10px] uppercase font-bold tracking-widest h-8 px-4"
                                            onClick={selectAllClients}
                                        >
                                            {selectedClients.length === clients.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                                        </Button>
                                    </div>
                                    <div className="relative group w-full">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-primary transition-colors" />
                                        <Input
                                            placeholder="Buscar empresas por nome ou cnpj..."
                                            value={clientSearchTerm}
                                            onChange={(e) => setClientSearchTerm(e.target.value)}
                                            className="pl-11 h-12 rounded-xl border-slate-200 bg-white focus:bg-white shadow-sm transition-all focus-visible:ring-primary/20"
                                        />
                                    </div>
                                </div>

                                <ScrollArea className="flex-1 bg-slate-50/30 p-6 h-full">
                                    <div className="space-y-2">
                                        {filteredClientsModal.map(client => {
                                            const isSelected = selectedClients.includes(client.id);
                                            return (
                                                <div
                                                    key={client.id}
                                                    onClick={() => toggleClientSelection(client.id)}
                                                    className={cn(
                                                        "flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all group",
                                                        isSelected
                                                            ? "bg-primary/5 border-primary/30 shadow-sm"
                                                            : "bg-white border-slate-200/60 hover:border-primary/20 hover:bg-slate-50"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className={cn(
                                                            "h-10 w-10 rounded-lg flex items-center justify-center transition-colors",
                                                            isSelected ? "bg-primary text-white" : "bg-slate-100 text-slate-400 group-hover:bg-primary/10 group-hover:text-primary"
                                                        )}>
                                                            <Building2 className="h-4 w-4" />
                                                        </div>
                                                        <div className="space-y-0.5">
                                                            <p className={cn(
                                                                "text-sm font-bold tracking-tight",
                                                                isSelected ? "text-primary" : "text-slate-700"
                                                            )}>
                                                                {client.nomeFantasia || client.razaoSocial}
                                                            </p>
                                                            <p className="text-[10px] font-medium text-slate-400">
                                                                {client.cnpj}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className={cn(
                                                        "h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors",
                                                        isSelected ? "bg-primary border-primary text-white" : "border-slate-300"
                                                    )}>
                                                        {isSelected && <Check className="h-3 w-3" />}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                        {filteredClientsModal.length === 0 && (
                                            <p className="text-center text-slate-400 text-sm mt-10">Nenhum cliente encontrado...</p>
                                        )}
                                    </div>
                                </ScrollArea>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-8 py-4 bg-white flex justify-between items-center z-10 flex-shrink-0">
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Painel Inteligente Automático</span>
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="ghost"
                                    onClick={() => setIsRuleModalOpen(false)}
                                    disabled={isSaving}
                                    className="rounded-xl font-bold uppercase tracking-widest text-[10px] h-12 px-6 hover:bg-slate-100"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={handleSaveRule}
                                    disabled={isSaving}
                                    className="rounded-xl bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 font-bold uppercase tracking-widest text-[10px] h-12 px-10 gap-2"
                                >
                                    {isSaving ? <Activity className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
                                    {editingRuleId ? 'Salvar Alterações DB' : 'Ativar Automação Completa'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

        </div>
    );
}
