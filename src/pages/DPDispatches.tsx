import { useState, useMemo } from 'react';
import { useDPDispatches, DPDispatch, DispatchStatus } from '@/hooks/useDPDispatches';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    Plus, 
    Search, 
    Send, 
    Users, 
    CheckCircle2, 
    Mail,
    Phone,
    Monitor,
    Trash2,
    FileText,
    Loader2,
    Link2,
    ArrowRight
} from 'lucide-react';
import { DPDispatchModal } from '@/components/dp/DPDispatchModal';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Input } from '@/components/ui/input';

export default function DPDispatches() {
    const { dispatches, loading, deleteDispatch, sendEmailDirect, refresh } = useDPDispatches();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('fila');
    const [selectedTemplate, setSelectedTemplate] = useState<{ title: string; msg: string } | null>(null);

    const handleUseTemplate = (template: { title: string; msg: string }) => {
        setSelectedTemplate(template);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedTemplate(null);
    };

    // Metrics
    const metrics = useMemo(() => {
        const total = dispatches.length;
        const pending = dispatches.filter(d => d.status === 'pendente').length;
        const reading = dispatches.filter(d => d.status === 'lido').length;
        const awaiting = dispatches.filter(d => d.status === 'aguardando_retorno').length;
        const error = dispatches.filter(d => d.status === 'erro').length;
        const sent = dispatches.filter(d => ['enviado', 'entregue', 'lido'].includes(d.status)).length;
        return { total, pending, reading, awaiting, error, sent };
    }, [dispatches]);

    const filteredDispatches = useMemo(() => {
        let base = dispatches;

        if (activeTab === 'fila') {
            base = base.filter(d => ['pendente', 'agendado', 'erro'].includes(d.status));
        } else if (activeTab === 'enviados') {
            base = base.filter(d => ['enviado', 'entregue', 'lido'].includes(d.status));
        } else if (activeTab === 'aguardando') {
            base = base.filter(d => d.status === 'aguardando_retorno');
        } else if (activeTab === 'historico') {
            base = base.filter(d => ['enviado', 'entregue', 'lido', 'respondido', 'cancelado'].includes(d.status));
        }

        if (searchQuery) {
            base = base.filter(d =>
                d.empresaNome?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                d.colaboradorNome?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                d.tipoDocumento.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        return base;
    }, [dispatches, activeTab, searchQuery]);

    const getStatusBadge = (status: DispatchStatus) => {
        switch (status) {
            case 'pendente':    return <Badge variant="outline" className="bg-muted/10 text-muted-foreground border-border/20 text-[9px] uppercase tracking-widest font-black h-5">Pendente</Badge>;
            case 'enviado':     return <Badge className="bg-blue-500/10 text-blue-700 border-blue-500/20 text-[9px] uppercase tracking-widest font-black h-5">Enviado</Badge>;
            case 'entregue':    return <Badge className="bg-indigo-500/10 text-indigo-700 border-indigo-500/20 text-[9px] uppercase tracking-widest font-black h-5">Entregue</Badge>;
            case 'lido':        return <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20 text-[9px] uppercase tracking-widest font-black h-5">Lido</Badge>;
            case 'erro':        return <Badge variant="destructive" className="bg-red-500/10 text-red-700 border-red-500/20 text-[9px] uppercase tracking-widest font-black h-5">Erro</Badge>;
            case 'agendado':    return <Badge variant="outline" className="bg-sky-500/10 text-sky-700 border-sky-500/20 text-[9px] uppercase tracking-widest font-black h-5">Agendado</Badge>;
            case 'aguardando_retorno': return <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-500/20 text-[9px] uppercase tracking-widest font-black h-5">Aguardando Retorno</Badge>;
            case 'respondido':  return <Badge className="bg-teal-500/10 text-teal-700 border-teal-500/20 text-[9px] uppercase tracking-widest font-black h-5">Respondido</Badge>;
            default:            return <Badge variant="secondary" className="text-[9px] uppercase tracking-widest font-black h-5">{status}</Badge>;
        }
    };

    const getChannelIcon = (canal: string) => {
        switch (canal) {
            case 'email':    return <Mail className="h-4 w-4 text-blue-500" />;
            case 'whatsapp': return <Phone className="h-4 w-4 text-emerald-500" />;
            case 'portal':   return <Monitor className="h-4 w-4 text-primary" />;
            default:         return <Link2 className="h-4 w-4 text-muted-foreground" />;
        }
    };

    const isSent = (status: DispatchStatus) => ['enviado', 'entregue', 'lido'].includes(status);

    // Shared table renderer — used across all list tabs
    const renderDispatchTable = (items: DPDispatch[]) => (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader className="bg-muted/30">
                    <TableRow className="border-border/10">
                        <TableHead className="px-10 py-6 text-[10px] uppercase tracking-[0.2em] font-normal">Canal</TableHead>
                        <TableHead className="py-6 text-[10px] uppercase tracking-[0.2em] font-normal">Empresa / Colaborador</TableHead>
                        <TableHead className="py-6 text-[10px] uppercase tracking-[0.2em] font-normal">Documento / Processo</TableHead>
                        <TableHead className="py-6 text-[10px] uppercase tracking-[0.2em] font-normal">Data Planejada</TableHead>
                        <TableHead className="py-6 text-[10px] uppercase tracking-[0.2em] font-normal">Destinatário</TableHead>
                        <TableHead className="py-6 text-[10px] uppercase tracking-[0.2em] font-normal text-center">Status</TableHead>
                        <TableHead className="py-6 pr-10 text-[10px] uppercase tracking-[0.2em] font-normal text-right">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {items.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="h-64 text-center">
                                <div className="flex flex-col items-center justify-center opacity-20">
                                    <Send className="h-10 w-10 mb-2" />
                                    <p className="text-xs uppercase tracking-widest">Nenhum registro para esta categoria</p>
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : (
                        items.map((d) => (
                            <TableRow key={d.id} className="group border-border/5 hover:bg-muted/10 transition-colors h-[88px]">
                                <TableCell className="px-10 py-4">
                                    <div className="h-10 w-10 rounded-2xl bg-muted/30 flex items-center justify-center">
                                        {getChannelIcon(d.canal)}
                                    </div>
                                </TableCell>
                                <TableCell className="py-4">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-sm font-semibold text-foreground tracking-tight">{d.empresaNome || '—'}</span>
                                        <span className="text-[11px] text-muted-foreground/80 flex items-center gap-1">
                                            <Users className="h-3.5 w-3.5" /> {d.colaboradorNome || 'Geral'}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="py-4">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs font-bold text-foreground/80">{d.tipoDocumento}</span>
                                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest">{d.tipoProcesso}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="py-4">
                                    <span className="text-xs font-light text-muted-foreground">
                                        {d.dataPrevista ? format(parseISO(d.dataPrevista), 'dd MMM yyyy', { locale: ptBR }) : '—'}
                                    </span>
                                </TableCell>
                                <TableCell className="py-4">
                                    <span className="text-[12px] font-medium text-muted-foreground truncate max-w-[160px] block">{d.destinatario || '—'}</span>
                                </TableCell>
                                <TableCell className="text-center py-4">
                                    {getStatusBadge(d.status)}
                                </TableCell>
                                <TableCell className="text-right pr-10 py-4">
                                    <div className="flex justify-end items-center gap-3">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 rounded-xl hover:bg-red-500/5 hover:text-red-600 transition-all opacity-40 hover:opacity-100"
                                            onClick={() => deleteDispatch(d.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            onClick={() => sendEmailDirect(d)}
                                            disabled={isSent(d.status)}
                                            className={cn(
                                                "h-9 rounded-xl font-normal uppercase tracking-widest text-[9px] px-4 transition-all active:scale-95 flex items-center gap-2",
                                                isSent(d.status)
                                                    ? "bg-muted text-muted-foreground cursor-not-allowed opacity-60"
                                                    : "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20"
                                            )}
                                        >
                                            {isSent(d.status) ? <CheckCircle2 className="h-3 w-3" /> : <ArrowRight className="h-3 w-3" />}
                                            {isSent(d.status) ? 'Enviado' : 'Disparar'}
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );

    if (loading && dispatches.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-red-600 opacity-20" />
                <p className="text-xs uppercase tracking-widest text-muted-foreground animate-pulse">Iniciando Centro de Disparos DP...</p>
            </div>
        );
    }

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-6">
                <div>
                    <h1 className="text-5xl font-light tracking-tight text-foreground flex items-center gap-4">
                        Disparos e Envios <span className="text-red-600 font-normal">DP</span>
                        <div className="h-2 w-2 rounded-full bg-red-600 animate-pulse mt-2" />
                    </h1>
                    <p className="text-xs font-normal text-muted-foreground uppercase tracking-[0.3em] mt-3">Central de Comunicação — Resend & WhatsApp Marketing DP</p>
                </div>
                <Button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-red-600 hover:bg-red-700 text-white rounded-2xl h-14 px-10 font-medium uppercase tracking-widest text-[11px] shadow-xl shadow-red-500/20 transition-all active:scale-95 group"
                >
                    <Plus className="mr-3 h-5 w-5 transition-transform group-hover:rotate-90" /> Novo Disparo
                </Button>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-10">
                <div className="bg-card rounded-[2rem] p-7 border border-border/40 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-2">Pendentes</p>
                    <p className="text-4xl font-light tracking-tighter">{metrics.pending}</p>
                </div>
                <div className="bg-card rounded-[2rem] p-7 border border-border/40 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-l-4 border-l-blue-500">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-2">Enviados</p>
                    <p className="text-4xl font-light tracking-tighter text-blue-600 dark:text-blue-400">{metrics.sent}</p>
                </div>
                <div className="bg-card rounded-[2rem] p-7 border border-border/40 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-l-4 border-l-emerald-500">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-2">Lidos</p>
                    <p className="text-4xl font-light tracking-tighter text-emerald-600 dark:text-emerald-400">{metrics.reading}</p>
                </div>
                <div className="bg-card rounded-[2rem] p-7 border border-border/40 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-l-4 border-l-amber-500">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-2">Aguard. Retorno</p>
                    <p className="text-4xl font-light tracking-tighter text-amber-600 dark:text-amber-400">{metrics.awaiting}</p>
                </div>
                <div className="bg-card rounded-[2rem] p-7 border border-border/40 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-l-4 border-l-red-500">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-2">Erros</p>
                    <p className="text-4xl font-light tracking-tighter text-red-600 dark:text-red-400">{metrics.error}</p>
                </div>
                <div className="bg-muted/10 rounded-[2rem] p-7 border border-border/40 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-2">Total Geral</p>
                    <p className="text-4xl font-light tracking-tighter">{metrics.total}</p>
                </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="fila" onValueChange={setActiveTab} className="bg-card/50 backdrop-blur-xl rounded-[2.5rem] border border-border/40 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-border/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <TabsList className="bg-muted/20 p-1 rounded-2xl border border-border/5 mb-0 inline-flex h-12 w-fit flex-wrap gap-0">
                        <TabsTrigger value="fila"      className="rounded-xl px-5 h-full data-[state=active]:bg-card data-[state=active]:text-red-600 data-[state=active]:shadow-sm text-xs uppercase tracking-widest font-normal transition-all">Fila de Envios</TabsTrigger>
                        <TabsTrigger value="enviados"  className="rounded-xl px-5 h-full data-[state=active]:bg-card data-[state=active]:text-red-600 data-[state=active]:shadow-sm text-xs uppercase tracking-widest font-normal transition-all">Enviados</TabsTrigger>
                        <TabsTrigger value="aguardando" className="rounded-xl px-5 h-full data-[state=active]:bg-card data-[state=active]:text-red-600 data-[state=active]:shadow-sm text-xs uppercase tracking-widest font-normal transition-all">Aguardando Retorno</TabsTrigger>
                        <TabsTrigger value="historico" className="rounded-xl px-5 h-full data-[state=active]:bg-card data-[state=active]:text-red-600 data-[state=active]:shadow-sm text-xs uppercase tracking-widest font-normal transition-all">Histórico</TabsTrigger>
                        <TabsTrigger value="modelos"   className="rounded-xl px-5 h-full data-[state=active]:bg-card data-[state=active]:text-red-600 data-[state=active]:shadow-sm text-xs uppercase tracking-widest font-normal transition-all">Modelos</TabsTrigger>
                    </TabsList>

                    <div className="relative max-w-sm w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Buscar empresa, funcionário ou documento..."
                            className="pl-12 h-12 rounded-2xl border-border/30 bg-muted/20 focus:ring-red-500/20 focus:border-red-500/20"
                        />
                    </div>
                </div>

                {/* Fila de Envios — pendente, agendado, erro */}
                <TabsContent value="fila" className="mt-0">
                    {renderDispatchTable(filteredDispatches)}
                </TabsContent>

                {/* Enviados — enviado, entregue, lido */}
                <TabsContent value="enviados" className="mt-0">
                    {renderDispatchTable(filteredDispatches)}
                </TabsContent>

                {/* Aguardando Retorno */}
                <TabsContent value="aguardando" className="mt-0">
                    {renderDispatchTable(filteredDispatches)}
                </TabsContent>

                {/* Histórico completo de enviados */}
                <TabsContent value="historico" className="mt-0">
                    {renderDispatchTable(filteredDispatches)}
                </TabsContent>

                {/* Modelos de Mensagem */}
                <TabsContent value="modelos" className="p-12 animate-in fade-in slide-in-from-bottom-2 mt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            { title: 'Admissão — Boas-Vindas',       msg: 'Prezado(a) [Nome],\n\nSeu processo de admissão na empresa [Empresa] foi devidamente iniciado. Em anexo, você encontrará toda a documentação necessária para a formalização do vínculo empregatício.\n\nQualquer dúvida, estamos à disposição.\n\nAtenciosamente,\n[Escritório]' },
                            { title: 'Aviso de Férias',              msg: 'Prezado(a) [Nome],\n\nComunicamos que o seu período de férias terá início em [Data de Início], com retorno previsto para [Data de Retorno]. Segue em anexo o Aviso e Recibo de Férias para assinatura.\n\nFavor retornar o documento assinado até [Prazo].\n\nAtenciosamente,\n[Escritório]' },
                            { title: 'Rescisão Contratual',          msg: 'Prezado(a) [Nome],\n\nComunicamos o encerramento do contrato de trabalho com a empresa [Empresa] a partir de [Data]. Segue em anexo o Termo de Rescisão do Contrato de Trabalho (TRCT) e demais documentos para conferência e assinatura.\n\nAtenciosamente,\n[Escritório]' },
                            { title: 'Solicitação de Documentos',    msg: 'Prezado(a),\n\nPara darmos continuidade ao processo de [Processo], necessitamos dos seguintes documentos:\n\n• [Documento 1]\n• [Documento 2]\n• [Documento 3]\n\nPedimos a gentileza de encaminhar os documentos até o dia [Prazo].\n\nAtenciosamente,\n[Escritório]' },
                            { title: 'Notificação de Prazo',         msg: 'Atenção!\n\nInformamos que o prazo para [Obrigação] vence em [Data]. Para evitar multas e penalidades, pedimos que entre em contato conosco o quanto antes para regularizar a situação.\n\nAtenciosamente,\n[Escritório]' },
                            { title: 'Lembrete Escrita Fiscal',      msg: 'Prezado(a) cliente,\n\nLembramos que o prazo para envio das notas fiscais e demais documentos contábeis do mês de [Mês] encerra-se no dia 05. Pedimos que nos encaminhe os documentos dentro do prazo para evitar atrasos na entrega das obrigações.\n\nAtenciosamente,\n[Escritório]' },
                        ].map((model, i) => (
                            <div key={i} className="p-7 rounded-[2rem] border border-border/40 bg-card hover:shadow-xl hover:-translate-y-1 transition-all group cursor-pointer">
                                <div className="h-11 w-11 rounded-xl bg-red-500/5 flex items-center justify-center mb-5 group-hover:bg-red-600 group-hover:text-white transition-colors">
                                    <FileText className="h-5 w-5" />
                                </div>
                                <h4 className="text-sm font-semibold mb-3 tracking-tight">{model.title}</h4>
                                <p className="text-xs text-muted-foreground font-light leading-relaxed mb-6 italic">"{model.msg}"</p>
                                <Button
                                    variant="ghost"
                                    onClick={() => handleUseTemplate(model)}
                                    className="w-full rounded-xl h-10 text-[10px] uppercase tracking-widest font-bold border border-border/20 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all"
                                >
                                    Usar Este Template
                                </Button>
                            </div>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>

            <DPDispatchModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSuccess={refresh}
                initialMessage={selectedTemplate?.msg}
                initialTitle={selectedTemplate?.title}
            />
        </div>
    );
}
