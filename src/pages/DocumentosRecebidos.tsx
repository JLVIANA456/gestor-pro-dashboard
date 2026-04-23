import { useState, useEffect, useCallback } from 'react';
import {
    Search,
    Download,
    Building2,
    ChevronRight,
    InboxIcon,
    RefreshCw,
    Clock,
    FolderOpen,
    ArrowLeft,
    CheckCircle2,
    FileSearch,
    Link2,
    FolderInput,
    Inbox,
    Trash2
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useClients } from '@/hooks/useClients';
import { useClientPortal, ClientDocument } from '@/hooks/useClientPortal';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ─── Classificação de Origem ──────────────────────────────────────────────────
type DocOrigin = 'cobranca' | 'portal' | 'outros';

function getDocOrigin(doc: ClientDocument): DocOrigin {
    const desc = (doc.description || '').toLowerCase();
    if (desc.includes('cobrança de documentos') || desc.includes('cobrança mágica') || desc.includes('cobranca magica') || desc.includes('envio-cobranca')) return 'cobranca';
    if (desc.includes('portal') || desc.includes('upload-publico') || desc.includes('link')) return 'portal';
    return 'outros';
}

const SOURCE_TABS: { key: DocOrigin | 'todos' | 'empresas'; label: string; icon: any; color: string }[] = [
    { key: 'empresas', label: 'Ver por Empresa',      icon: Building2,   color: 'primary' },
    { key: 'todos',    label: 'Feed de Documentos',    icon: Inbox,       color: 'primary' },
    { key: 'cobranca', label: 'Cobrança de Documentos', icon: FolderInput, color: 'red' },
    { key: 'portal',   label: 'Portal do Cliente',    icon: Link2,       color: 'blue' },
    { key: 'outros',   label: 'Outros / Manuais',      icon: FolderOpen,  color: 'slate' },
];

export default function DocumentosRecebidos() {
    const { clients, loading: loadingClients } = useClients();
    const { fetchDocuments, markAsRead, deleteDocument } = useClientPortal();

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
    const [documents, setDocuments] = useState<ClientDocument[]>([]); // Docs do cliente selecionado
    const [allDocuments, setAllDocuments] = useState<ClientDocument[]>([]); // Todos os docs do sistema
    const [allDocsCount, setAllDocsCount] = useState<Record<string, number>>({});
    const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
    const [loadingDocs, setLoadingDocs] = useState(false);
    const [activeTab, setActiveTab] = useState<DocOrigin | 'todos' | 'empresas'>('empresas');

    // Contagem global por cliente
    useEffect(() => {
        const loadInitialData = async () => {
            setLoadingDocs(true);
            try {
                const docs = await fetchDocuments(undefined, 'entrada');
                setAllDocuments(docs);
                
                const counts: Record<string, number> = {};
                const unreads: Record<string, number> = {};
                docs.forEach(d => {
                    counts[d.clientId] = (counts[d.clientId] || 0) + 1;
                    if (!d.isRead) unreads[d.clientId] = (unreads[d.clientId] || 0) + 1;
                });
                setAllDocsCount(counts);
                setUnreadCounts(unreads);
            } catch { 
                toast.error('Erro ao carregar dados iniciais');
            } finally {
                setLoadingDocs(false);
            }
        };
        loadInitialData();
    }, [fetchDocuments]);

    // Carregar documentos do cliente selecionado
    const loadClientDocuments = useCallback(async (clientId: string) => {
        setLoadingDocs(true);
        try {
            const docs = await fetchDocuments(clientId, 'entrada');
            setDocuments(docs);
        } catch {
            toast.error('Erro ao carregar documentos');
        } finally {
            setLoadingDocs(false);
        }
    }, [fetchDocuments]);

    useEffect(() => {
        if (selectedClientId) loadClientDocuments(selectedClientId);
    }, [selectedClientId, loadClientDocuments]);

    const selectedClient = clients.find(c => c.id === selectedClientId);

    const filteredClients = clients.filter(c =>
        c.nomeFantasia?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.razaoSocial?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.cnpj.includes(searchQuery)
    ).sort((a, b) => {
        const aUnread = unreadCounts[a.id] || 0;
        const bUnread = unreadCounts[b.id] || 0;
        if (bUnread !== aUnread) return bUnread - aUnread;
        const aCount = allDocsCount[a.id] || 0;
        const bCount = allDocsCount[b.id] || 0;
        if (bCount !== aCount) return bCount - aCount;
        return (a.nomeFantasia || a.razaoSocial).localeCompare(b.nomeFantasia || b.razaoSocial);
    });

    // Filtrar por aba de origem
    const tabDocs = activeTab === 'todos'
        ? documents
        : documents.filter(d => getDocOrigin(d) === activeTab);

    // Contagem por origem
    const countByOrigin = (key: DocOrigin | 'todos') =>
        key === 'todos' ? documents.length : documents.filter(d => getDocOrigin(d) === key).length;

    const formatDate = (dateStr: string) =>
        new Date(dateStr).toLocaleDateString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });

    const getFileIcon = (fileName: string) => {
        const ext = fileName.split('.').pop()?.toLowerCase();
        if (ext === 'pdf') return '📄';
        if (['jpg', 'jpeg', 'png'].includes(ext || '')) return '🖼️';
        if (ext === 'xml') return '📋';
        return '📁';
    };

    const getClientName = (clientId: string) => {
        const client = clients.find(c => c.id === clientId);
        return client ? (client.nomeFantasia || client.razaoSocial) : 'Cliente desconhecido';
    };

    // ─── VISÃO: lista de empresas ────────────────────────────────────────────────
    if (!selectedClientId) {
        return (
            <div className="max-w-[1400px] mx-auto px-8 pb-16 space-y-10 animate-in fade-in duration-700">
                <div className="flex flex-col gap-4 pt-10">
                    <div className="flex items-end justify-between">
                        <div className="space-y-2">
                            <h1 className="text-4xl font-extralight tracking-tight text-foreground">
                                Documentos <span className="text-primary font-semibold">Recebidos</span>
                            </h1>
                            <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.3em]">
                                Arquivos enviados pelos clientes ao escritório
                            </p>
                        </div>
                        <Card className="bg-primary/5 border-primary/20 px-6 py-4 rounded-2xl flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                <InboxIcon className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-muted-foreground/60">Total Recebidos</p>
                                <p className="text-xl font-bold">
                                    {Object.values(allDocsCount).reduce((a, b) => a + b, 0)} arquivos
                                </p>
                            </div>
                        </Card>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="relative max-w-lg flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                            <Input
                                placeholder="Buscar empresa ou documento..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="h-12 pl-12 rounded-2xl border-border/30 bg-muted/10 text-sm font-light focus:border-primary/30 w-full"
                            />
                        </div>

                        {/* Tabs de Filtro Global */}
                        <div className="flex items-center gap-1 bg-muted/20 p-1 rounded-2xl border border-border/10">
                            {SOURCE_TABS.map(tab => {
                                const isActive = activeTab === tab.key;
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.key}
                                        onClick={() => setActiveTab(tab.key)}
                                        className={cn(
                                            "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                            isActive 
                                                ? "bg-white text-primary shadow-sm"
                                                : "text-muted-foreground/50 hover:text-foreground"
                                        )}
                                    >
                                        <Icon className={cn("h-3.5 w-3.5", isActive ? "text-primary" : "text-muted-foreground/40")} />
                                        <span className={cn(isActive ? "block" : "hidden lg:block")}>{tab.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {loadingDocs ? (
                    <div className="flex items-center justify-center h-64">
                        <RefreshCw className="h-8 w-8 animate-spin text-primary/30" />
                    </div>
                ) : activeTab === 'empresas' ? (
                    /* VISÃO POR EMPRESA (GRID ORIGINAL) */
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredClients.map(client => {
                            const docCount = allDocsCount[client.id] || 0;
                            const unreadCount = unreadCounts[client.id] || 0;
                            const hasNew = unreadCount > 0;

                            return (
                                <button
                                    key={client.id}
                                    onClick={() => { setSelectedClientId(client.id); setActiveTab('todos'); }}
                                    className={cn(
                                        "group text-left rounded-[2.5rem] border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl p-8 space-y-6 bg-card",
                                        hasNew
                                            ? "border-primary/40 bg-primary/[0.02] shadow-primary/5 hover:border-primary/60"
                                            : docCount > 0
                                                ? "border-border/40 hover:border-border/70"
                                                : "border-border/20 opacity-70 hover:opacity-100"
                                    )}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className={cn(
                                            "h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-300",
                                            hasNew
                                                ? "bg-primary text-white shadow-lg shadow-primary/20"
                                                : docCount > 0
                                                    ? "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white"
                                                    : "bg-muted/20 text-muted-foreground group-hover:bg-muted/40"
                                        )}>
                                            <Building2 className="h-7 w-7" />
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            {hasNew && (
                                                <Badge className="bg-primary text-white border-none rounded-xl px-3 py-1 text-[9px] font-black uppercase tracking-wider animate-pulse">
                                                    {unreadCount} {unreadCount === 1 ? 'Novo' : 'Novos'}
                                                </Badge>
                                            )}
                                            {docCount > 0 && (
                                                <Badge variant="outline" className="border-border/20 text-muted-foreground/40 rounded-xl px-2 py-0.5 text-[8px] font-bold">
                                                    {docCount} Total
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-lg font-bold text-foreground leading-tight line-clamp-1">
                                            {client.nomeFantasia || client.razaoSocial}
                                        </h3>
                                        <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">
                                            {client.cnpj}
                                        </p>
                                    </div>
                                    <div className="flex items-center justify-between pt-4 border-t border-border/10">
                                        <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-wider">
                                            {client.regimeTributario}
                                        </span>
                                        <div className="flex items-center gap-1 text-[10px] font-black text-primary opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-wider">
                                            Ver documentos <ChevronRight className="h-3.5 w-3.5" />
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                        {filteredClients.length === 0 && (
                            <div className="col-span-1 md:col-span-2 xl:col-span-3 flex flex-col items-center justify-center h-52 text-center space-y-4">
                                <FileSearch className="h-10 w-10 text-muted-foreground/20" />
                                <p className="text-sm font-bold text-muted-foreground/40">Nenhuma empresa encontrada</p>
                            </div>
                        )}
                    </div>
                ) : (
                    /* VISÃO DE FEED GLOBAL (TABELÃO) */
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { label: 'Todos',           value: allDocuments.length,                                                           color: 'primary' },
                                { label: 'Cobrança de Documentos', value: allDocuments.filter(d => getDocOrigin(d) === 'cobranca').length,               color: 'red' },
                                { label: 'Portal Cliente',   value: allDocuments.filter(d => getDocOrigin(d) === 'portal').length,                 color: 'blue' },
                                { label: 'Outros / Manual', value: allDocuments.filter(d => getDocOrigin(d) === 'outros').length,                 color: 'slate' },
                            ].map(stat => (
                                <Card key={stat.label} className={cn(
                                    "p-4 rounded-2xl border-none flex items-center gap-4 transition-all hover:shadow-md",
                                    stat.color === 'primary' && "bg-primary/5",
                                    stat.color === 'red'     && "bg-red-500/5",
                                    stat.color === 'blue'    && "bg-blue-500/5",
                                    stat.color === 'slate'   && "bg-muted/10",
                                )}>
                                    <div className={cn(
                                        "h-10 w-10 rounded-xl flex items-center justify-center",
                                        stat.color === 'primary' && "bg-primary/10 text-primary",
                                        stat.color === 'red'     && "bg-red-500/10 text-red-600",
                                        stat.color === 'blue'    && "bg-blue-500/10 text-blue-600",
                                        stat.color === 'slate'   && "bg-muted/20 text-muted-foreground",
                                    )}>
                                        <FolderOpen className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-lg font-bold">{stat.value}</p>
                                        <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/50">{stat.label}</p>
                                    </div>
                                </Card>
                            ))}
                        </div>

                        <Card className="rounded-[2.5rem] border-border/40 overflow-hidden shadow-sm">
                            <div className="p-8 border-b border-border/10 flex items-center justify-between bg-muted/5">
                                <div>
                                    <h2 className="text-lg font-semibold text-foreground">
                                        {activeTab === 'todos' ? 'Todos os Arquivos Recebidos' : SOURCE_TABS.find(t => t.key === activeTab)?.label}
                                    </h2>
                                    <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest mt-1">
                                        Mostrando os documentos mais recentes de todos os clientes
                                    </p>
                                </div>
                            </div>
                            <div className="p-6 space-y-3 max-h-[800px] overflow-y-auto">
                                {allDocuments
                                    .filter(d => activeTab === 'todos' || getDocOrigin(d) === activeTab)
                                    .filter(d => {
                                        const cName = getClientName(d.clientId).toLowerCase();
                                        const fName = d.fileName.toLowerCase();
                                        const query = searchQuery.toLowerCase();
                                        return cName.includes(query) || fName.includes(query);
                                    })
                                    .slice(0, 100)
                                    .map(doc => (
                                        <div
                                            key={doc.id}
                                            className="group flex flex-col md:flex-row md:items-center justify-between p-5 rounded-[1.5rem] bg-card border border-border/10 hover:border-primary/20 hover:shadow-lg transition-all duration-300 gap-4"
                                        >
                                            <div className="flex items-center gap-5 min-w-0 flex-1">
                                                <div className="h-14 w-14 rounded-2xl bg-muted/10 flex items-center justify-center text-2xl shrink-0 group-hover:bg-primary/5 transition-colors border border-border/10">
                                                    {getFileIcon(doc.fileName)}
                                                </div>
                                                <div className="flex flex-col min-w-0 flex-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="text-[10px] font-black text-primary uppercase bg-primary/5 px-2 py-0.5 rounded-lg">
                                                            {getClientName(doc.clientId)}
                                                        </span>
                                                        <span className="text-sm font-bold text-foreground truncate max-w-[300px]">
                                                            {doc.fileName}
                                                        </span>
                                                        {!doc.isRead && (
                                                            <Badge className="bg-primary text-white border-none text-[8px] font-black uppercase rounded-full px-2 py-0 h-4 min-w-[35px]">NOVO</Badge>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-4 mt-1.5">
                                                        <span className="text-[10px] text-muted-foreground/60 flex items-center gap-1.5 font-bold uppercase">
                                                            <Clock className="h-3 w-3" />
                                                            {formatDate(doc.createdAt)}
                                                        </span>
                                                        <span className={cn(
                                                            "text-[9px] font-black uppercase px-2 py-0.5 rounded-lg",
                                                            getDocOrigin(doc) === 'cobranca' && "bg-red-50 text-red-600",
                                                            getDocOrigin(doc) === 'portal'   && "bg-blue-50 text-blue-600",
                                                            getDocOrigin(doc) === 'outros'   && "bg-slate-100 text-slate-500",
                                                        )}>
                                                            {getDocOrigin(doc) === 'cobranca' ? '📥 Cobrança' :
                                                             getDocOrigin(doc) === 'portal'   ? '🔗 Portal' : '📁 Outro'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 self-end md:self-auto">
                                                <a
                                                    href={doc.fileUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="h-10 w-10 rounded-xl flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all border border-border/10"
                                                >
                                                    <Download className="h-4 w-4" />
                                                </a>
                                                <Button
                                                    onClick={() => { setSelectedClientId(doc.clientId); setActiveTab('todos'); }}
                                                    variant="ghost"
                                                    className="h-10 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest gap-2 hover:bg-primary/5"
                                                >
                                                    Ver Empresa
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                {allDocuments.length === 0 && (
                                    <div className="flex flex-col items-center justify-center h-40 text-muted-foreground/30">
                                        <Inbox className="h-10 w-10 mb-2" />
                                        <p className="text-sm font-bold">Nenhum documento recebido ainda</p>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>
                )}
            </div>
        );
    }

    // ─── VISÃO: documentos de uma empresa com tabs de origem ─────────────────────
    return (
        <div className="max-w-[1400px] mx-auto px-8 pb-16 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Breadcrumb */}
            <div className="flex flex-col gap-6 pt-10">
                <button
                    onClick={() => { setSelectedClientId(null); setActiveTab('empresas'); }}
                    className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-muted-foreground/50 hover:text-primary transition-colors w-fit"
                >
                    <ArrowLeft className="h-4 w-4" /> Todas as Empresas
                </button>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                            <Building2 className="h-8 w-8" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-extralight text-foreground">
                                {selectedClient?.nomeFantasia || selectedClient?.razaoSocial}
                            </h1>
                            <p className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest mt-1">
                                {selectedClient?.cnpj} · {selectedClient?.regimeTributario}
                            </p>
                        </div>
                    </div>

                    <Button
                        onClick={() => loadClientDocuments(selectedClientId!)}
                        variant="outline"
                        disabled={loadingDocs}
                        className="h-12 px-6 rounded-2xl border-border/40 text-[10px] font-black uppercase tracking-widest gap-2"
                    >
                        <RefreshCw className={cn("h-4 w-4", loadingDocs && "animate-spin")} />
                        Atualizar
                    </Button>
                </div>

                {/* Stats rápidos */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Total',             value: documents.length,                                                            color: 'primary' },
                        { label: 'Cobrança de Documentos',   value: documents.filter(d => getDocOrigin(d) === 'cobranca').length,                color: 'red' },
                        { label: 'Portal Cliente',    value: documents.filter(d => getDocOrigin(d) === 'portal').length,                  color: 'blue' },
                        { label: 'Outros / Manual',   value: documents.filter(d => getDocOrigin(d) === 'outros').length,                 color: 'slate' },
                    ].map(stat => (
                        <Card key={stat.label} className={cn(
                            "p-5 rounded-2xl border-none flex items-center gap-4",
                            stat.color === 'primary' && "bg-primary/5",
                            stat.color === 'red'     && "bg-red-500/5",
                            stat.color === 'blue'    && "bg-blue-500/5",
                            stat.color === 'slate'   && "bg-muted/10",
                        )}>
                            <div className={cn(
                                "h-10 w-10 rounded-xl flex items-center justify-center",
                                stat.color === 'primary' && "bg-primary/10 text-primary",
                                stat.color === 'red'     && "bg-red-500/10 text-red-600",
                                stat.color === 'blue'    && "bg-blue-500/10 text-blue-600",
                                stat.color === 'slate'   && "bg-muted/20 text-muted-foreground",
                            )}>
                                <FolderOpen className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-xl font-bold">{stat.value}</p>
                                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 mt-0.5">{stat.label}</p>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>

            {/* ─── TABS DE ORIGEM ─── */}
            <div className="flex items-center gap-2 flex-wrap border-b border-border/20 pb-0">
                {SOURCE_TABS.map(tab => {
                    const count = countByOrigin(tab.key);
                    const isActive = activeTab === tab.key;
                    const Icon = tab.icon;

                    return (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={cn(
                                "flex items-center gap-2 px-5 py-3 rounded-t-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-200 border-b-2 relative",
                                isActive
                                    ? "text-primary border-primary bg-primary/5"
                                    : "text-muted-foreground/50 border-transparent hover:text-foreground hover:bg-muted/10"
                            )}
                        >
                            <Icon className="h-3.5 w-3.5" />
                            {tab.label}
                            {count > 0 && (
                                <span className={cn(
                                    "ml-1 px-2 py-0.5 rounded-full text-[9px] font-black",
                                    isActive ? "bg-primary text-white" : "bg-muted/30 text-muted-foreground"
                                )}>
                                    {count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* ─── LISTA DE DOCUMENTOS ─── */}
            <Card className="bg-card/40 border-border/40 rounded-[2.5rem] overflow-hidden shadow-sm">
                <div className="p-8 border-b border-border/10 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-foreground">
                            {SOURCE_TABS.find(t => t.key === activeTab)?.label}
                        </h2>
                        <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest mt-1">
                            {tabDocs.length} documento{tabDocs.length !== 1 ? 's' : ''} encontrado{tabDocs.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>

                <div className="p-6 space-y-3">
                    {loadingDocs ? (
                        <div className="flex items-center justify-center h-52">
                            <RefreshCw className="h-8 w-8 animate-spin text-primary/30" />
                        </div>
                    ) : tabDocs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-52 text-center space-y-4">
                            <div className="h-20 w-20 rounded-full bg-muted/10 flex items-center justify-center">
                                <InboxIcon className="h-10 w-10 text-muted-foreground/20" />
                            </div>
                            <div>
                                <p className="text-base font-bold text-muted-foreground/50">
                                    Nenhum documento nesta categoria
                                </p>
                                <p className="text-xs text-muted-foreground/30 mt-1 max-w-xs mx-auto">
                                    Documentos enviados por esta origem aparecerão aqui automaticamente.
                                </p>
                            </div>
                        </div>
                    ) : (
                        tabDocs.map(doc => (
                            <div
                                key={doc.id}
                                className="group flex items-center justify-between p-5 rounded-[1.5rem] bg-card border border-border/10 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
                            >
                                <div className="flex items-center gap-5 min-w-0 flex-1">
                                    <div className="h-14 w-14 rounded-2xl bg-muted/10 flex items-center justify-center text-2xl flex-shrink-0 group-hover:bg-primary/5 transition-colors border border-border/10">
                                        {getFileIcon(doc.fileName)}
                                    </div>

                                    <div className="flex flex-col min-w-0 flex-1">
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-bold text-foreground truncate">
                                                {doc.fileName}
                                            </span>
                                            {!doc.isRead && (
                                                <Badge className="bg-primary text-white border-none text-[8px] font-black uppercase rounded-full px-2 py-0">NOVO</Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                                            <span className="text-[10px] text-muted-foreground/60 flex items-center gap-1.5 font-bold uppercase tracking-tight">
                                                <Clock className="h-3 w-3" />
                                                {formatDate(doc.createdAt)}
                                            </span>
                                            {/* Badge de Origem */}
                                            <span className={cn(
                                                "text-[9px] font-black uppercase tracking-wide px-2 py-0.5 rounded-lg",
                                                getDocOrigin(doc) === 'cobranca' && "bg-red-50 text-red-600",
                                                getDocOrigin(doc) === 'portal'   && "bg-blue-50 text-blue-600",
                                                getDocOrigin(doc) === 'outros'   && "bg-slate-100 text-slate-500",
                                            )}>
                                                {getDocOrigin(doc) === 'cobranca' ? '📥 Cobrança de Docs' :
                                                 getDocOrigin(doc) === 'portal'   ? '🔗 Portal do Cliente' : '📁 Outro'}
                                            </span>
                                            {doc.description && (
                                                <span className="text-[10px] text-muted-foreground/40 font-medium italic truncate max-w-[200px]">
                                                    {doc.description}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Ações */}
                                <div className="flex items-center gap-2">
                                    {!doc.isRead && (
                                        <Button
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                const success = await markAsRead(doc.id);
                                                if (success) {
                                                    setDocuments(prev => prev.map(d => d.id === doc.id ? { ...d, isRead: true } : d));
                                                    setUnreadCounts(prev => ({
                                                        ...prev,
                                                        [doc.clientId]: Math.max(0, (prev[doc.clientId] || 0) - 1)
                                                    }));
                                                }
                                            }}
                                            variant="ghost"
                                            className="h-10 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest gap-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all"
                                        >
                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                            Resolvido
                                        </Button>
                                    )}
                                    <a
                                        href={doc.fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-shrink-0 h-10 w-10 rounded-xl flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all border border-border/10"
                                        title="Baixar arquivo"
                                    >
                                        <Download className="h-4 w-4" />
                                    </a>
                                    <Button
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            if (!confirm('Tem certeza que deseja excluir este documento?')) return;
                                            const { error } = await deleteDocument(doc.id);
                                            if (error) {
                                                toast.error('Erro ao excluir o documento.');
                                            } else {
                                                setDocuments(prev => prev.filter(d => d.id !== doc.id));
                                                toast.success('Documento excluído.');
                                            }
                                        }}
                                        variant="ghost"
                                        className="flex-shrink-0 h-10 w-10 rounded-xl flex items-center justify-center text-muted-foreground/40 hover:text-red-500 hover:bg-red-50 transition-all border border-transparent p-0"
                                        title="Excluir documento"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </Card>
        </div>
    );
}
