import { useState, useMemo, useEffect } from 'react';
import { format } from 'date-fns';
import { useClients } from '@/hooks/useClients';
import { useClientPortal, ClientDocument } from '@/hooks/useClientPortal';
import { useBranding } from '@/context/BrandingContext';
import { supabase } from '@/integrations/supabase/client';
import { 
    Users, 
    Upload, 
    Search, 
    FileText, 
    ChevronRight, 
    Calendar,
    Clock,
    Building2,
    CheckCircle2,
    ArrowDownLeft,
    ExternalLink,
    Link as LinkIcon,
    Cloud
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function ClientPortalAdmin() {
    const { clients, loading: clientsLoading } = useClients();
    const { fetchDocuments, loading: docsLoading } = useClientPortal();
    const { officeName } = useBranding();
    
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
    const [selectedClient, setSelectedClient] = useState<any>(null);
    const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
    const [documents, setDocuments] = useState<ClientDocument[]>([]);
    const [clientDocs, setClientDocs] = useState<ClientDocument[]>([]);

    // Carregar todos os documentos para estatísticas iniciais
    useEffect(() => {
        const loadAll = async () => {
            const docs = await fetchDocuments();
            setDocuments(docs);
        };
        loadAll();
    }, [fetchDocuments]);

    // Carregar documentos específicos da empresa selecionada
    useEffect(() => {
        if (selectedClientId) {
            const loadDocs = async () => {
                const docs = await fetchDocuments(selectedClientId);
                setClientDocs(docs);
                const client = clients.find(c => c.id === selectedClientId);
                setSelectedClient(client);
            };
            loadDocs();
        }
    }, [selectedClientId, fetchDocuments, clients]);

    const filteredClients = useMemo(() => clients.filter(c => 
        c.razaoSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.nomeFantasia.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.cnpj.includes(searchTerm)
    ), [clients, searchTerm]);

    if (selectedClientId && selectedClient) {
        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700 p-6">
                {/* View Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-10 rounded-[3rem] shadow-sm">
                    <div className="flex items-center gap-6">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => setSelectedClientId(null)}
                            className="rounded-full h-12 w-12 bg-slate-50 hover:bg-slate-100 transition-all"
                        >
                            <ChevronRight className="h-6 w-6 rotate-180" />
                        </Button>
                        <div className="space-y-1">
                            <h2 className="text-3xl font-light text-slate-800 tracking-tight">Prontuário de <span className="font-medium text-primary">{selectedClient.nomeFantasia}</span></h2>
                            <p className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-400 italic">{selectedClient.cnpj}</p>
                        </div>
                    </div>
                    
                    <div className="flex gap-3">
                        <Button className="rounded-2xl bg-primary h-12 px-8 font-black uppercase text-[10px] tracking-widest text-white shadow-xl shadow-primary/20">
                            <Upload className="h-4 w-4 mr-2" /> Enviar Documento
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Stats */}
                    <Card className="p-8 rounded-[2.5rem] border-none bg-primary/5 flex items-center gap-6">
                        <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                            <FileText className="h-7 w-7" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-primary">{clientDocs.length}</p>
                            <p className="text-[9px] uppercase font-black tracking-widest text-primary/60 mt-1">Arquivos Totais</p>
                        </div>
                    </Card>
                    <Card className="p-8 rounded-[2.5rem] border-none bg-amber-500/5 flex items-center gap-6">
                        <div className="h-14 w-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                            <ArrowDownLeft className="h-7 w-7" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-amber-600">{clientDocs.filter(d => d.fileType === 'entrada').length}</p>
                            <p className="text-[9px] uppercase font-black tracking-widest text-amber-600/60 mt-1">Recebidos do Cliente</p>
                        </div>
                    </Card>
                    <Card className="p-8 rounded-[2.5rem] border-none bg-emerald-500/5 flex items-center gap-6">
                        <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                            <CheckCircle2 className="h-7 w-7" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-emerald-600">{clientDocs.filter(d => d.isRead).length}</p>
                            <p className="text-[9px] uppercase font-black tracking-widest text-emerald-600/60 mt-1">Lidos / Processados</p>
                        </div>
                    </Card>
                </div>

                {/* Document List */}
                <Card className="rounded-[3.5rem] border-none shadow-sm overflow-hidden bg-white/60 backdrop-blur-sm">
                    <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                         <h3 className="text-xl font-light text-slate-800 tracking-tight">Histórico de <span className="text-primary font-medium">Arquivos</span></h3>
                         <div className="flex gap-2">
                            <Badge className="rounded-full bg-slate-50 text-slate-400 border-none px-4 py-1.5 text-[9px] uppercase font-bold tracking-widest">
                                Filtrar Competência
                            </Badge>
                         </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-8 py-5 text-[9px] uppercase font-black tracking-widest text-slate-400">Arquivo</th>
                                    <th className="px-8 py-5 text-[9px] uppercase font-black tracking-widest text-slate-400">Direção</th>
                                    <th className="px-8 py-5 text-[9px] uppercase font-black tracking-widest text-slate-400">Categoria</th>
                                    <th className="px-8 py-5 text-[9px] uppercase font-black tracking-widest text-slate-400">Data Upload</th>
                                    <th className="px-8 py-5 text-[9px] uppercase font-black tracking-widest text-slate-400 text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {clientDocs.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-20 text-center opacity-30 italic font-light">Nenhum documento encontrado para esta empresa.</td>
                                    </tr>
                                ) : clientDocs.map(doc => (
                                    <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-primary/5 group-hover:text-primary transition-all">
                                                    <FileText className="h-6 w-6" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[13px] font-bold text-slate-700">{doc.fileName}</span>
                                                    <span className="text-[9px] font-medium text-slate-400 uppercase tracking-widest italic">{doc.description || 'Sem descrição'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <Badge className={cn(
                                                "rounded-full px-4 py-1.5 font-black text-[8px] uppercase tracking-[0.1em] border-none",
                                                doc.fileType === 'entrada' ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"
                                            )}>
                                                {doc.fileType === 'entrada' ? 'Recebido' : 'Enviado'}
                                            </Badge>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase px-3 py-1 bg-slate-100 rounded-lg">{doc.category}</span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-[11px] font-medium text-slate-400">{format(new Date(doc.createdAt), "dd/MM/yyyy HH:mm")}</span>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10 text-slate-300 hover:text-primary hover:bg-primary/5" asChild>
                                                <a href={doc.fileUrl} target="_blank" rel="noreferrer">
                                                    <ExternalLink className="h-4 w-4" />
                                                </a>
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in duration-1000 pb-20 p-6">
            {/* Header Section */}
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between pt-10 px-4">
                <div className="space-y-4">
                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 py-2 px-5 rounded-full text-[10px] uppercase font-bold tracking-[0.3em] active:scale-95 transition-transform">
                        <Users className="h-3 w-3 mr-2" /> Central de Recebimento
                    </Badge>
                    <h1 className="text-5xl font-extralight tracking-tight text-foreground leading-tight">
                        Área do <span className="text-primary font-normal">Cliente</span>
                    </h1>
                    <p className="text-xs font-medium text-muted-foreground uppercase opacity-60 tracking-[0.4em] max-w-lg leading-relaxed">
                        Gerencie arquivos recebidos e envie documentos avulsos para seus clientes.
                    </p>
                </div>
            </div>

            {/* Global Actions Card */}
            <div className="flex flex-col md:flex-row gap-6 items-center justify-between bg-card/40 backdrop-blur-xl border border-border/40 p-10 rounded-[3rem] mx-4 shadow-sm">
                <div className="relative flex-1 w-full max-w-xl group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
                    <Input 
                        placeholder="Buscar empresa por Nome ou CNPJ..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="h-16 rounded-[1.8rem] pl-16 bg-white border-slate-100 text-sm font-normal shadow-sm focus-visible:ring-primary/10"
                    />
                </div>
                <div className="flex gap-4">
                    <div className="relative group/filter">
                        <Button 
                            variant="outline" 
                            className={cn(
                                "rounded-2xl h-16 px-8 text-[10px] font-black uppercase tracking-widest gap-3 border-slate-200 transition-all",
                                selectedMonth ? "bg-primary/10 text-primary border-primary/20" : "text-slate-400"
                            )}
                        >
                            <Calendar className="h-4 w-4" /> 
                            {selectedMonth ? format(new Date(selectedMonth + "-01"), "MMMM yyyy") : "Competência"}
                        </Button>
                        <Input 
                            type="month"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={(e) => setSelectedMonth(e.target.value)}
                        />
                    </div>
                    <Button 
                        variant="outline" 
                        onClick={() => {
                            setSelectedMonth(null);
                            setSearchTerm('');
                            toast.success("Mostrando todos os arquivos");
                        }}
                        className="rounded-2xl h-16 px-8 text-[10px] font-black uppercase tracking-widest gap-3 border-slate-200 text-slate-400 hover:bg-slate-50"
                    >
                        <Cloud className="h-4 w-4" /> Todos Arquivos
                    </Button>
                </div>
            </div>

            {/* Clients Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 px-4">
                {clientsLoading ? (
                    <div className="col-span-3 py-32 flex flex-col items-center justify-center opacity-20">
                        <Clock className="h-10 w-10 animate-spin" />
                    </div>
                ) : filteredClients.map((client) => {
                    const clientDocsCount = documents.filter(d => d.clientId === client.id).length;
                    const unreadCount = documents.filter(d => d.clientId === client.id && !d.isRead && d.fileType === 'entrada').length;

                    return (
                        <Card 
                            key={client.id} 
                            onClick={() => setSelectedClientId(client.id)}
                            className={cn(
                                "group rounded-[3.5rem] border border-border/40 bg-white/40 backdrop-blur-md overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5 relative cursor-pointer",
                                "hover:-translate-y-2"
                            )}
                        >
                            <div className="p-10 space-y-6">
                                <div className="flex items-start justify-between">
                                    <div className="h-16 w-16 rounded-[2rem] bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-inner group-hover:shadow-primary/30">
                                        <Building2 className="h-8 w-8" />
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        {unreadCount > 0 && (
                                            <Badge className="bg-primary text-white rounded-full animate-bounce px-2 text-[8px] h-5 border-none">
                                                {unreadCount} novos
                                            </Badge>
                                        )}
                                        <Badge variant="outline" className="rounded-full border-emerald-100 bg-emerald-50 text-emerald-600 font-black text-[8px] px-3 uppercase tracking-tighter">
                                            Portal Ativo
                                        </Badge>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <h3 className="text-xl font-bold tracking-tight text-slate-800 line-clamp-1">{client.nomeFantasia}</h3>
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{client.cnpj}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black uppercase text-slate-300 tracking-widest">Arquivos</span>
                                        <span className="text-xl font-light text-slate-800">{clientDocsCount}</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[9px] font-black uppercase text-slate-300 tracking-widest">Último envio</span>
                                        <span className="text-[11px] font-bold text-slate-400">---</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-end pt-4">
                                     <div className="flex items-center text-primary font-black text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                                         Abrir Prontuário <ChevronRight className="h-4 w-4 ml-1" />
                                     </div>
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
