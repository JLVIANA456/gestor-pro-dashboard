import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useBranding } from '@/context/BrandingContext';
import { supabase } from '@/integrations/supabase/client';
import { 
    FileText, 
    Download, 
    Inbox, 
    LogOut, 
    Building, 
    Folder, 
    ChevronRight, 
    Globe, 
    Clock,
    UserCircle,
    ShieldCheck,
    FileUp,
    CheckCircle,
    CalendarDays,
    Info,
    AlertTriangle,
    Search
} from 'lucide-react';
import { Calendar as CalendarUI } from "@/components/ui/calendar"
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogTrigger,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";
import { useClientPortal } from '@/hooks/useClientPortal';
import { format, isSameDay, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface DeliveryFile {
    id: string;
    clientId: string;
    folderId: string;
    fileName: string;
    fileUrl: string;
    competency: string;
    description: string;
    createdAt: string;
}

interface PortalFolder {
    id: string;
    name: string;
    icon: string;
    parentId: string | null;
}

export default function ClientPortalView() {
    const { signOut } = useAuth();
    const { officeName, logoUrl } = useBranding();
    
    const [clientId, setClientId] = useState<string | null>(null);
    const [folders, setFolders] = useState<PortalFolder[]>([]);
    const [deliveries, setDeliveries] = useState<DeliveryFile[]>([]);
    const [clientGuides, setClientGuides] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Upload State
    const { uploadDocument, fetchDocuments } = useClientPortal();
    const [uploading, setUploading] = useState(false);
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
    const [myUploads, setMyUploads] = useState<any[]>([]);
    const [activeView, setActiveView] = useState<'received' | 'sent' | 'area'>('received');
    
    const [uploadData, setUploadData] = useState({
        file: null as File | null,
        category: 'outro' as any,
        description: ''
    });

    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    
    const selectedGuides = useMemo(() => {
        if (!selectedDate) return [];
        return clientGuides.filter(g => g.due_date && isSameDay(new Date(g.due_date + 'T12:00:00'), selectedDate));
    }, [clientGuides, selectedDate]);

    const upcomingGuides = useMemo(() => {
        const today = new Date();
        return clientGuides
            .filter(g => g.due_date && new Date(g.due_date + 'T12:00:00') >= today && g.status !== 'completed' && g.status !== 'sent')
            .slice(0, 3);
    }, [clientGuides]);

    // Fetch linked clientId from localStorage
    useEffect(() => {
        const fetchLinkedClient = async () => {
            const cid = localStorage.getItem('client_session_id');
            if (cid) {
                setClientId(cid);
                fetchPortalData(cid);
            } else {
                setLoading(false);
                // Optionally handle no session case
            }
        };
        fetchLinkedClient();
    }, []);

    const fetchPortalData = async (cid: string) => {
        try {
            setLoading(true);
            // 1. Fetch Folders
            const { data: folderData } = await (supabase as any)
                .from('client_portal_folders')
                .select('*')
                .eq('client_id', cid)
                .order('sort_order', { ascending: true });
            
            if (folderData) {
                setFolders(folderData.map((f: any) => ({
                    id: f.id,
                    name: f.name,
                    icon: f.icon,
                    parentId: f.parent_id
                })));
            }

            // 2. Fetch Deliveries
            const { data: deliveryData } = await (supabase as any)
                .from('client_deliveries')
                .select('*')
                .eq('client_id', cid)
                .order('created_at', { ascending: false });
            
            if (deliveryData) {
                setDeliveries(deliveryData.map((d: any) => ({
                    id: d.id,
                    clientId: d.client_id,
                    folderId: d.folder_id,
                    fileName: d.file_name,
                    fileUrl: d.file_url,
                    competency: d.competency,
                    description: d.description,
                    createdAt: d.created_at
                })));
            }

            // 3. Fetch My Uploads
            const uploads = await fetchDocuments(cid, 'entrada');
            setMyUploads(uploads);

            // 4. Fetch Client Guides 
            const { data: guidesData } = await (supabase as any)
                .from('accounting_guides')
                .select('*')
                .eq('client_id', cid)
                .order('due_date', { ascending: true });
            
            if (guidesData) {
                setClientGuides(guidesData);
            }
        } catch (err) {
            console.error("FetchPortalData Error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async () => {
        if (!uploadData.file || !clientId) return;
        
        try {
            setUploading(true);
            await uploadDocument({
                file: uploadData.file,
                clientId: clientId,
                category: uploadData.category,
                type: 'entrada',
                description: uploadData.description
            });
            
            setUploadDialogOpen(false);
            setUploadData({ file: null, category: 'outro', description: '' });
            fetchPortalData(clientId); 
        } catch (err: any) {
            toast.error("Erro ao enviar arquivo");
        } finally {
            setUploading(false);
        }
    };

    const currentFolders = useMemo(() => {
        return folders.filter(f => f.parentId === currentFolderId);
    }, [folders, currentFolderId]);

    const currentFiles = useMemo(() => {
        if (searchTerm) {
            return deliveries.filter(d => 
                d.fileName.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        return deliveries.filter(d => d.folderId === currentFolderId);
    }, [deliveries, currentFolderId, searchTerm]);

    const breadcrumbs = useMemo(() => {
        const path: PortalFolder[] = [];
        let currentId = currentFolderId;
        while (currentId) {
            const folder = folders.find(f => f.id === currentId);
            if (folder) {
                path.unshift(folder);
                currentId = folder.parentId;
            } else {
                break;
            }
        }
        return path;
    }, [folders, currentFolderId]);

    const currentFolderName = useMemo(() => {
        if (!currentFolderId) return "Central de Documentos";
        return folders.find(f => f.id === currentFolderId)?.name || "Pasta";
    }, [folders, currentFolderId]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50/50">
            <div className="flex flex-col items-center gap-4">
                <div className="h-12 w-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Sincronizando Hub...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans">
            <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 h-24 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
                    <div className="flex items-center gap-5">
                        <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center text-white shadow-2xl shadow-primary/20 overflow-hidden shrink-0">
                            {logoUrl ? <img src={logoUrl} className="h-full w-full object-contain p-2" /> : <Building className="h-7 w-7" />}
                        </div>
                        <div className="flex flex-col">
                            <h2 className="text-xl font-black uppercase text-slate-800 tracking-tighter leading-none">{officeName}</h2>
                            <span className="text-[10px] uppercase font-black text-primary tracking-[0.4em] mt-2 opacity-60">Portal do Cliente</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="hidden lg:flex items-center gap-3">
                            <Button variant={activeView === 'received' ? 'default' : 'ghost'} onClick={() => setActiveView('received')} className="rounded-2xl h-11 px-6 font-black uppercase text-[10px] tracking-widest">
                                <Inbox className="h-4 w-4 mr-2" /> Recebidos
                            </Button>
                            <Button variant={activeView === 'area' ? 'default' : 'ghost'} onClick={() => setActiveView('area')} className="rounded-2xl h-11 px-6 font-black uppercase text-[10px] tracking-widest">
                                <CalendarDays className="h-4 w-4 mr-2" /> Área do Cliente
                            </Button>
                            <Button variant={activeView === 'sent' ? 'default' : 'ghost'} onClick={() => setActiveView('sent')} className="rounded-2xl h-11 px-6 font-black uppercase text-[10px] tracking-widest">
                                <FileUp className="h-4 w-4 mr-2" /> Meus Envios
                            </Button>
                        </div>
                        
                        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="h-11 px-6 rounded-2xl bg-primary shadow-lg shadow-primary/20 text-white font-black uppercase text-[10px] tracking-widest gap-2">
                                    <FileUp className="h-4 w-4" /> Enviar Arquivo
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md bg-white rounded-[2rem] p-8">
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-black text-slate-800">Enviar Documento</DialogTitle>
                                    <DialogDescription className="text-xs text-slate-400 font-medium">Categorize para facilitar o processamento.</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-6 py-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-slate-400">Arquivo</Label>
                                        <Input type="file" onChange={(e) => setUploadData({...uploadData, file: e.target.files?.[0] || null})} className="h-12 rounded-xl bg-slate-50 border-slate-100" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-slate-400">Categoria</Label>
                                        <Select value={uploadData.category} onValueChange={(val) => setUploadData({...uploadData, category: val})}>
                                            <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-slate-100">
                                                <SelectValue placeholder="Selecione..." />
                                            </SelectTrigger>
                                            <SelectContent className="bg-white rounded-xl">
                                                <SelectItem value="nota_fiscal">Nota Fiscal</SelectItem>
                                                <SelectItem value="extrato">Extrato Bancário</SelectItem>
                                                <SelectItem value="balancete">Balancete</SelectItem>
                                                <SelectItem value="guia">Guia de Pagamento</SelectItem>
                                                <SelectItem value="outro">Outro</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button onClick={handleUpload} disabled={!uploadData.file || uploading} className="h-12 w-full rounded-xl bg-primary shadow-lg shadow-primary/10 text-white font-black uppercase text-[10px] tracking-widest">
                                        {uploading ? "Enviando..." : "Confirmar Envio"}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        <Button variant="ghost" size="icon" className="rounded-2xl h-11 w-11 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all border border-slate-50 bg-white" onClick={() => { localStorage.removeItem('client_session_id'); window.dispatchEvent(new Event('client-login')); signOut?.(); }}>
                            <LogOut className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-12 w-full flex-1">
                <div className="space-y-12">
                    {/* View Switch for Mobile */}
                    <div className="lg:hidden flex gap-2">
                        <Button variant={activeView === 'received' ? 'default' : 'outline'} onClick={() => setActiveView('received')} className="flex-1 rounded-xl h-11 font-black uppercase text-[9px] tracking-widest">Recebidos</Button>
                        <Button variant={activeView === 'area' ? 'default' : 'outline'} onClick={() => setActiveView('area')} className="flex-1 rounded-xl h-11 font-black uppercase text-[9px] tracking-widest">Área</Button>
                        <Button variant={activeView === 'sent' ? 'default' : 'outline'} onClick={() => setActiveView('sent')} className="flex-1 rounded-xl h-11 font-black uppercase text-[9px] tracking-widest">Enviados</Button>
                    </div>

                    {activeView === 'received' ? (
                        <div className="space-y-10 animate-in fade-in slide-in-from-left-4 duration-500">
                            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                                <div className="space-y-4 flex-1">
                                    <nav className="flex items-center gap-2 mb-4 overflow-x-auto pb-2 scrollbar-none">
                                        <button onClick={() => { setCurrentFolderId(null); setSearchTerm(''); }} className={cn("text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full transition-all", currentFolderId === null && !searchTerm ? "bg-primary text-white" : "bg-slate-100 text-slate-400 hover:bg-slate-200")}>Início</button>
                                        {breadcrumbs.map((crumb, idx) => (
                                            <div key={crumb.id} className="flex items-center gap-2">
                                                <ChevronRight className="h-3 w-3 text-slate-300" />
                                                <button onClick={() => { setCurrentFolderId(crumb.id); setSearchTerm(''); }} className={cn("text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full whitespace-nowrap transition-all", idx === breadcrumbs.length - 1 && !searchTerm ? "bg-primary text-white" : "bg-slate-100 text-slate-400 hover:bg-slate-200")}>{crumb.name}</button>
                                            </div>
                                        ))}
                                    </nav>
                                    <h1 className="text-4xl font-light text-slate-800 tracking-tighter">{searchTerm ? "Resultados da " : ""}<span className="font-black text-primary">{searchTerm ? "Pesquisa" : currentFolderName}</span></h1>
                                </div>
                                <div className="relative w-full md:w-64">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                                    <input type="text" placeholder="Buscar documento..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full h-12 bg-white border border-slate-100 rounded-2xl pl-11 pr-4 text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                                {currentFolders.map(folder => (
                                    <Card key={folder.id} onClick={() => setCurrentFolderId(folder.id)} className="group cursor-pointer rounded-[3.5rem] border-none bg-white p-10 shadow-sm transition-all duration-700 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-4 text-center flex flex-col items-center">
                                        <div className="h-20 w-20 rounded-[2.5rem] bg-primary/5 text-primary flex items-center justify-center transition-all duration-700 group-hover:bg-primary group-hover:text-white mb-6">
                                            <Folder className="h-10 w-10" />
                                        </div>
                                        <h3 className="text-2xl font-black text-slate-800 tracking-tighter group-hover:text-primary transition-colors capitalize">{folder.name}</h3>
                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mt-1">Pasta</p>
                                    </Card>
                                ))}
                                {currentFiles.map(file => (
                                    <Card key={file.id} className="group rounded-[3.5rem] border-none bg-white p-10 shadow-sm transition-all duration-700 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2 flex flex-col justify-between overflow-hidden">
                                        <div className="space-y-6">
                                            <div className="h-16 w-16 rounded-[2rem] bg-primary/5 text-primary flex items-center justify-center"><FileText className="h-8 w-8" /></div>
                                            <h3 className="text-xl font-black text-slate-800 tracking-tighter line-clamp-2">{file.fileName}</h3>
                                            <div className="flex items-center justify-between py-2 border-b border-slate-50"><span className="text-[9px] font-black uppercase text-slate-300 tracking-widest">Competência</span><span className="text-xs font-black text-slate-600">{file.competency}</span></div>
                                        </div>
                                        <Button asChild className="w-full h-14 rounded-[2rem] bg-slate-50 hover:bg-primary text-slate-600 hover:text-white font-black uppercase text-[10px] tracking-widest mt-8 transition-all duration-500 group-hover:shadow-xl"><a href={file.fileUrl} target="_blank"><Download className="h-4 w-4 mr-2" /> Baixar</a></Button>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    ) : activeView === 'sent' ? (
                        <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                             <div className="space-y-2">
                                <h1 className="text-4xl font-light text-slate-800 tracking-tighter">Documentos <span className="font-black text-primary">Enviados</span></h1>
                                <p className="text-[10px] uppercase font-black text-slate-400 tracking-[0.4em]">Arquivos que você mandou p/ nós</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                                {myUploads.length === 0 ? (
                                    <div className="col-span-full py-20 flex flex-col items-center justify-center opacity-40 text-center"><Inbox className="h-12 w-12 text-slate-300 mb-4" /><p className="text-[10px] font-black uppercase tracking-widest">Nenhum envio registrado</p></div>
                                ) : (
                                    myUploads.map(doc => (
                                        <Card key={doc.id} className="group rounded-[3.5rem] border-none bg-white p-10 shadow-sm hover:shadow-2xl transition-all"><div className="space-y-6"><div className="h-16 w-16 rounded-[2rem] bg-emerald-50 text-emerald-500 flex items-center justify-center"><CheckCircle className="h-8 w-8" /></div><h3 className="text-xl font-black text-slate-800 tracking-tighter line-clamp-2">{doc.fileName}</h3><div className="flex items-center justify-between"><span className="text-[9px] font-black uppercase text-slate-300 tracking-widest">Data</span><span className="text-xs font-black text-slate-400">{format(new Date(doc.createdAt), 'dd/MM/yyyy')}</span></div></div><Button asChild variant="outline" className="w-full h-14 rounded-[2rem] font-black uppercase text-[10px] tracking-widest mt-8"><a href={doc.fileUrl} target="_blank">Visualizar</a></Button></Card>
                                    ))
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                             <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
                                <div className="space-y-1">
                                    <h1 className="text-4xl font-light text-slate-800 tracking-tighter">Área do <span className="font-black text-primary">Cliente</span></h1>
                                    <p className="text-[10px] uppercase font-black text-slate-400 tracking-[0.4em]">Calendário Fiscal & Obrigações</p>
                                </div>
                                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-full border border-emerald-100"><div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /><span className="text-[9px] font-black uppercase text-emerald-600 tracking-widest">Sincronizado</span></div>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                                <div className="lg:col-span-4 space-y-8">
                                    <div className="space-y-6">
                                        <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] flex items-center gap-3"><Clock className="h-4 w-4 text-primary" /> Próximos Vencimentos</h2>
                                        <div className="space-y-4">
                                            {upcomingGuides.length === 0 ? <div className="p-8 rounded-3xl bg-slate-50 border border-dashed border-slate-200 text-center"><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Sem vencimentos</p></div> : upcomingGuides.map(guide => {
                                                const daysDiff = differenceInDays(new Date(guide.due_date + 'T12:00:00'), new Date());
                                                return (<Card key={guide.id} className="p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all"><div className="flex items-start justify-between mb-4"><div className="h-10 w-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center"><FileText className="h-5 w-5" /></div><Badge className={cn("rounded-full px-3 py-1 text-[8px] font-black uppercase tracking-widest", daysDiff <= 3 ? "bg-red-50 text-red-500" : "bg-blue-50 text-blue-500")}>{daysDiff === 0 ? "Vence Hoje" : daysDiff < 0 ? "Atrasado" : `Em ${daysDiff} dias`}</Badge></div><h4 className="font-bold text-slate-800 text-sm mb-1 truncate">{guide.type}</h4><div className="flex items-center justify-between"><span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{format(new Date(guide.due_date + 'T12:00:00'), 'dd/MM/yyyy')}</span><span className="text-xs font-black text-primary">{guide.amount?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></div></Card>);
                                            })}
                                        </div>
                                    </div>
                                    <div className="p-8 rounded-[2.5rem] bg-slate-900 text-white space-y-4">
                                        <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center"><Info className="h-5 w-5 text-primary" /></div>
                                        <h4 className="font-black uppercase tracking-widest text-[10px]">Importante</h4>
                                        <p className="text-xs font-light text-slate-400">Mantenha suas guias em dia para evitar multas.</p>
                                    </div>
                                </div>
                                <div className="lg:col-span-8 space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-sm">
                                        <div className="flex flex-col items-center">
                                            <CalendarUI mode="single" selected={selectedDate} onSelect={setSelectedDate} locale={ptBR} className="rounded-3xl border-none p-0" modifiers={{ hasObligation: (date) => clientGuides.some(g => g.due_date && isSameDay(new Date(g.due_date + 'T12:00:00'), date)) }} modifiersStyles={{ hasObligation: { fontWeight: 'bold', color: '#3b82f6', textDecoration: 'underline' } }} />
                                            <div className="mt-8 flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-blue-500" /><span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Obrigação Pendente</span></div>
                                        </div>
                                        <div className="border-l border-slate-50 pl-8 space-y-6">
                                            <div className="space-y-1"><p className="text-[10px] font-black uppercase text-primary tracking-widest">{selectedDate ? format(selectedDate, "EEEE", { locale: ptBR }) : '-'}</p><h3 className="text-2xl font-black text-slate-800 tracking-tight">{selectedDate ? format(selectedDate, "dd 'de' MMMM", { locale: ptBR }) : 'Selecione'}</h3></div>
                                            <div className="space-y-4">
                                                {selectedGuides.length === 0 ? <div className="py-12 flex flex-col items-center justify-center opacity-30"><Inbox className="h-8 w-8 mb-4" /><p className="text-[10px] font-black uppercase">Vazio</p></div> : selectedGuides.map(guide => (
                                                    <div key={guide.id} className="group p-5 rounded-2xl bg-slate-50/50 border border-slate-100 hover:bg-white transition-all space-y-4 border-l-4 border-l-primary">
                                                        <div className="flex items-center justify-between"><h5 className="font-bold text-slate-800 text-sm">{guide.type}</h5><Badge className={cn("text-[8px] font-black uppercase tracking-widest scale-75 origin-right", guide.status === 'completed' || guide.status === 'sent' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600")}>{guide.status === 'completed' || guide.status === 'sent' ? 'Disponível' : 'Pendente'}</Badge></div>
                                                        {(guide.status === 'sent' || guide.status === 'completed') && guide.file_url ? <Button asChild className="w-full h-10 rounded-xl bg-primary text-white text-[9px] font-black uppercase tracking-widest shadow-lg shadow-primary/20"><a href={guide.file_url} target="_blank"><Download className="h-3 w-3 mr-2" /> Baixar</a></Button> : <div className="flex items-center gap-2 p-3 bg-white rounded-xl border border-slate-100 text-[10px] text-slate-400 font-medium"><AlertTriangle className="h-3 w-3 text-amber-400 shrink-0" /> Aguardando processamento.</div>}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <footer className="py-20 border-t border-slate-200 mt-20 bg-white">
                <div className="max-w-7xl mx-auto px-6 text-center space-y-6">
                    <div className="flex items-center justify-center gap-2 opacity-30">
                         <Globe className="h-4 w-4" />
                         <span className="text-[10px] font-black uppercase tracking-[0.5em]">Segurança SSL &bull; Criptografia Ponta-a-Ponta</span>
                    </div>
                    <p className="text-[11px] uppercase font-black tracking-[0.4em] text-slate-400">
                        {officeName} &copy; 2026 — Gestão <span className="text-primary font-black">Digital</span>
                    </p>
                </div>
            </footer>
        </div>
    );
}
