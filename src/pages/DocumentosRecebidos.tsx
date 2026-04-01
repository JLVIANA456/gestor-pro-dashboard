import { useState, useEffect, useCallback } from 'react';
import {
    Search,
    FileText,
    Download,
    Building2,
    ChevronRight,
    InboxIcon,
    RefreshCw,
    Clock,
    FolderOpen,
    ArrowLeft,
    Filter,
    CheckCircle2
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useClients } from '@/hooks/useClients';
import { useClientPortal, ClientDocument } from '@/hooks/useClientPortal';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function DocumentosRecebidos() {
    const { clients, loading: loadingClients } = useClients();
    const { fetchDocuments } = useClientPortal();

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
    const [documents, setDocuments] = useState<ClientDocument[]>([]);
    const [allDocsCount, setAllDocsCount] = useState<Record<string, number>>({});
    const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
    const [loadingDocs, setLoadingDocs] = useState(false);
    const [filterCategory, setFilterCategory] = useState<string>('todos');

    const { markAsRead } = useClientPortal();

    // Buscar contagem total de documentos por cliente (para exibir nos cards)
    useEffect(() => {
        const loadAllCounts = async () => {
            try {
                const docs = await fetchDocuments(undefined, 'entrada');
                const counts: Record<string, number> = {};
                const unreads: Record<string, number> = {};
                docs.forEach(d => {
                    counts[d.clientId] = (counts[d.clientId] || 0) + 1;
                    if (!d.isRead) {
                        unreads[d.clientId] = (unreads[d.clientId] || 0) + 1;
                    }
                });
                setAllDocsCount(counts);
                setUnreadCounts(unreads);
            } catch {
                // silencioso
            }
        };
        loadAllCounts();
    }, [fetchDocuments]);

    // Buscar documentos do cliente selecionado
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
        if (selectedClientId) {
            loadClientDocuments(selectedClientId);
        }
    }, [selectedClientId, loadClientDocuments]);

    const selectedClient = clients.find(c => c.id === selectedClientId);

    const filteredClients = clients.filter(c =>
        c.nomeFantasia?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.razaoSocial?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.cnpj.includes(searchQuery)
    ).sort((a, b) => {
        // Clientes com documentos NÃO LIDOS primeiro
        const aUnread = unreadCounts[a.id] || 0;
        const bUnread = unreadCounts[b.id] || 0;
        if (bUnread !== aUnread) return bUnread - aUnread;

        // Depois clientes com documentos totais
        const aCount = allDocsCount[a.id] || 0;
        const bCount = allDocsCount[b.id] || 0;
        if (bCount !== aCount) return bCount - aCount;
        
        return (a.nomeFantasia || a.razaoSocial).localeCompare(b.nomeFantasia || b.razaoSocial);
    });

    const filteredDocuments = filterCategory === 'todos'
        ? documents
        : documents.filter(d => d.category === filterCategory);

    const categories = ['todos', ...Array.from(new Set(documents.map(d => d.category)))];

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

    // ─── VISÃO: lista de empresas ───────────────────────────────────────────────
    if (!selectedClientId) {
        return (
            <div className="max-w-[1400px] mx-auto px-8 pb-16 space-y-10 animate-in fade-in duration-700">

                {/* Header */}
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
                        <div className="flex gap-4">
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
                    </div>

                    {/* Busca */}
                    <div className="relative max-w-lg">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                        <Input
                            placeholder="Buscar empresa por nome ou CNPJ..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="h-13 pl-12 rounded-2xl border-border/30 bg-muted/10 text-sm font-light focus:border-primary/30 h-12"
                        />
                    </div>
                </div>

                {/* Grade de Empresas */}
                {loadingClients ? (
                    <div className="flex items-center justify-center h-64">
                        <RefreshCw className="h-8 w-8 animate-spin text-primary/30" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredClients.map(client => {
                            const docCount = allDocsCount[client.id] || 0;
                            const unreadCount = unreadCounts[client.id] || 0;
                            const hasNew = unreadCount > 0;

                            return (
                                <button
                                    key={client.id}
                                    onClick={() => setSelectedClientId(client.id)}
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
                            <div className="col-span-3 flex flex-col items-center justify-center h-52 text-center space-y-4">
                                <Search className="h-10 w-10 text-muted-foreground/20" />
                                <p className="text-sm font-bold text-muted-foreground/40">Nenhuma empresa encontrada</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    }

    // ─── VISÃO: documentos de uma empresa ───────────────────────────────────────
    return (
        <div className="max-w-[1400px] mx-auto px-8 pb-16 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Header com breadcrumb */}
            <div className="flex flex-col gap-6 pt-10">
                <button
                    onClick={() => { setSelectedClientId(null); setDocuments([]); setFilterCategory('todos'); }}
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
                        { label: 'Total Recebidos', value: documents.length, color: 'primary' },
                        { label: 'Notas Fiscais', value: documents.filter(d => d.category === 'nota_fiscal').length, color: 'amber' },
                        { label: 'Extratos', value: documents.filter(d => d.category === 'extrato').length, color: 'blue' },
                        { label: 'Outros', value: documents.filter(d => d.category === 'outro').length, color: 'slate' },
                    ].map(stat => (
                        <Card key={stat.label} className={cn(
                            "p-5 rounded-2xl border-none flex items-center gap-4",
                            stat.color === 'primary' && "bg-primary/5",
                            stat.color === 'amber' && "bg-amber-500/5",
                            stat.color === 'blue' && "bg-blue-500/5",
                            stat.color === 'slate' && "bg-muted/10",
                        )}>
                            <div className={cn(
                                "h-10 w-10 rounded-xl flex items-center justify-center",
                                stat.color === 'primary' && "bg-primary/10 text-primary",
                                stat.color === 'amber' && "bg-amber-500/10 text-amber-600",
                                stat.color === 'blue' && "bg-blue-500/10 text-blue-600",
                                stat.color === 'slate' && "bg-muted/20 text-muted-foreground",
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

            {/* Filtro por categoria */}
            {categories.length > 1 && (
                <div className="flex items-center gap-2 flex-wrap">
                    <Filter className="h-4 w-4 text-muted-foreground/40" />
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setFilterCategory(cat)}
                            className={cn(
                                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                filterCategory === cat
                                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                                    : "bg-muted/15 text-muted-foreground hover:bg-muted/30"
                            )}
                        >
                            {cat === 'todos' ? 'Todos' :
                             cat === 'nota_fiscal' ? 'Notas Fiscais' :
                             cat === 'extrato' ? 'Extratos' :
                             cat === 'balancete' ? 'Balancetes' :
                             cat === 'guia' ? 'Guias' : cat}
                        </button>
                    ))}
                </div>
            )}

            {/* Lista de Documentos */}
            <Card className="bg-card/40 border-border/40 rounded-[2.5rem] overflow-hidden shadow-sm">
                <div className="p-8 border-b border-border/10 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-foreground">
                            Arquivos Enviados pelo Cliente
                        </h2>
                        <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest mt-1">
                            {filteredDocuments.length} documento{filteredDocuments.length !== 1 ? 's' : ''} encontrado{filteredDocuments.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>

                <div className="p-6 space-y-3">
                    {loadingDocs ? (
                        <div className="flex items-center justify-center h-52">
                            <RefreshCw className="h-8 w-8 animate-spin text-primary/30" />
                        </div>
                    ) : filteredDocuments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-52 text-center space-y-4">
                            <div className="h-20 w-20 rounded-full bg-muted/10 flex items-center justify-center">
                                <InboxIcon className="h-10 w-10 text-muted-foreground/20" />
                            </div>
                            <div>
                                <p className="text-base font-bold text-muted-foreground/50">
                                    Nenhum documento recebido ainda
                                </p>
                                <p className="text-xs text-muted-foreground/30 mt-1 max-w-xs mx-auto">
                                    Gere um Link Mágico em "Links de Envio" e envie ao cliente para ele começar a enviar arquivos.
                                </p>
                            </div>
                        </div>
                    ) : (
                        filteredDocuments.map(doc => (
                            <div
                                key={doc.id}
                                className="group flex items-center justify-between p-5 rounded-[1.5rem] bg-card border border-border/10 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
                            >
                                <div className="flex items-center gap-5 min-w-0 flex-1">
                                    {/* Ícone do tipo de arquivo */}
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
                                            {doc.description && (
                                                <span className="text-[10px] text-muted-foreground/40 font-medium italic">
                                                    {doc.description}
                                                </span>
                                            )}
                                            {doc.category && doc.category !== 'outro' && (
                                                <Badge className="bg-primary/5 text-primary border-none text-[9px] font-black uppercase tracking-wide rounded-lg px-2 py-0.5">
                                                    {doc.category === 'nota_fiscal' ? 'Nota Fiscal' :
                                                     doc.category === 'extrato' ? 'Extrato' :
                                                     doc.category === 'balancete' ? 'Balancete' :
                                                     doc.category === 'guia' ? 'Guia' : doc.category}
                                                </Badge>
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
                                            className="h-10 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest gap-2 bg-primary/5 text-primary hover:bg-primary hover:text-white transition-all"
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
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </Card>
        </div>
    );
}
