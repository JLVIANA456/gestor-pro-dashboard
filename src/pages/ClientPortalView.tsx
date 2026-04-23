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
    Mail,
    ShieldCheck,
    FileUp,
    CheckCircle,
    CalendarDays,
    Info,
    AlertTriangle,
    Search,
    Star,
    AlertCircle,
    Video,
    Play,
    ArrowRight,
    Calendar,
    Link as LinkIcon,
    ChevronLeft,
    Lightbulb,
    PlayCircle,
    BookOpen,
    Trash2,
    Building2,
    Landmark
} from 'lucide-react';
import { Calendar as CalendarUI } from "@/components/ui/calendar"
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import KitBoasVindas from '@/components/KitBoasVindas';
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
import { usePortalContent, PortalContentType } from '@/hooks/usePortalContent';
import { Announcement } from '@/hooks/useAnnouncements';
import { Tabs as TabsUI, TabsList as TabsListUI, TabsTrigger as TabsTriggerUI, TabsContent as TabsContentUI } from "@/components/ui/tabs";
import useEmblaCarousel from 'embla-carousel-react';

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
    const [clientAnnouncements, setClientAnnouncements] = useState<Announcement[]>([]);
    
    const [emblaRef] = useEmblaCarousel({ 
        align: 'start', 
        containScroll: 'trimSnaps',
        dragFree: true
    });
    
    const [uploadData, setUploadData] = useState({
        file: null as File | null,
        category: 'outro' as any,
        description: ''
    });

    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [activeSidebarTab, setActiveSidebarTab] = useState<PortalContentType | 'links-uteis' | null>(null);

    const { fetchContent, contentList, loading: contentLoading } = usePortalContent();

    const filteredContentList = useMemo(() => {
        return contentList.filter(item => 
            !item.target_client_ids || 
            item.target_client_ids.length === 0 || 
            (clientId && item.target_client_ids.includes(clientId))
        );
    }, [contentList, clientId]);

    useEffect(() => {
        if (activeSidebarTab && activeSidebarTab !== 'links-uteis') {
            fetchContent(activeSidebarTab as PortalContentType);
        }
    }, [activeSidebarTab, fetchContent]);

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

            // 5. Fetch Announcements (specific to this client only)
            const { data: annData } = await (supabase as any)
                .from('announcements')
                .select('*')
                .eq('client_id', cid)
                .order('created_at', { ascending: false });
            
            if (annData) setClientAnnouncements(annData);
        } catch (err) {
            console.error("FetchPortalData Error:", err);
        } finally {
            setLoading(false);
        }
    };

    const markAnnouncementAsRead = async (id: string) => {
        try {
            const { error } = await (supabase as any)
                .from('announcements')
                .update({ 
                    status: 'read', 
                    read_at: new Date().toISOString(),
                    recipient_ip: 'Portal do Cliente'
                })
                .eq('id', id);

            if (error) throw error;

            setClientAnnouncements(prev => 
                prev.map(a => a.id === id ? { ...a, status: 'read', read_at: new Date().toISOString() } : a)
            );
            toast.success("Comunicado marcado como lido!");
        } catch (err) {
            console.error("Error marking announcement as read:", err);
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
                <div className="px-6 h-full flex items-center justify-between">
                    <div className="flex items-center gap-5 cursor-pointer" onClick={() => window.location.href = '/'}>
                        <div className="h-16 w-48 flex items-center justify-center overflow-hidden shrink-0">
                            <img src="/logo_20anos.png" className="h-full w-full object-contain" alt="JLVIANA" />
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="hidden lg:flex items-center gap-5">
                            <Button variant={activeView === 'received' && !activeSidebarTab ? 'default' : 'ghost'} onClick={() => { setActiveView('received'); setActiveSidebarTab(null); }} className="rounded-2xl h-11 px-6 font-black uppercase text-[10px] tracking-widest">
                                <Inbox className="h-4 w-4 mr-2" /> Recebidos
                            </Button>
                            <Button variant={activeView === 'area' && !activeSidebarTab ? 'default' : 'ghost'} onClick={() => { setActiveView('area'); setActiveSidebarTab(null); }} className="rounded-2xl h-11 px-6 font-black uppercase text-[10px] tracking-widest">
                                <CalendarDays className="h-4 w-4 mr-2" /> Área do Cliente
                            </Button>
                            <Button variant={activeView === 'sent' && !activeSidebarTab ? 'default' : 'ghost'} onClick={() => { setActiveView('sent'); setActiveSidebarTab(null); }} className="rounded-2xl h-11 px-6 font-black uppercase text-[10px] tracking-widest">
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

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar Colapsado */}
                <aside className={cn(
                    "bg-white border-r border-slate-200 transition-all duration-300 flex flex-col z-40 hidden md:flex shrink-0",
                    isSidebarCollapsed ? "w-[80px]" : "w-[280px]"
                )}>
                    <div className="p-4 flex items-center justify-between border-b border-slate-100 h-[60px]">
                        {!isSidebarCollapsed && <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-2">Menu Institucional</span>}
                        <Button variant="ghost" size="icon" onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="h-8 w-8 ml-auto text-slate-400 hover:text-primary">
                            {isSidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                        </Button>
                    </div>
                    <div className="flex-1 overflow-y-auto py-6 space-y-2 px-3 custom-scrollbar">
                        {[
                            { id: 'guia_do_cliente', label: 'Guia do Cliente', icon: Building2 },
                            { id: 'boas_praticas', label: 'Boas Práticas', icon: Lightbulb },
                            { id: 'comunicados', label: 'Comunicados', icon: Info },
                            { id: 'videos_treinamentos', label: 'Vídeos e Treinamentos', icon: PlayCircle },
                            { id: 'reforma_tributaria', label: 'Reforma tributária', icon: BookOpen },
                        ].map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveSidebarTab(item.id as any)}
                                className={cn(
                                    "w-full flex items-center gap-3 rounded-xl transition-all duration-200 group relative",
                                    isSidebarCollapsed ? "justify-center p-3" : "px-4 py-3",
                                    activeSidebarTab === item.id 
                                        ? "bg-primary text-white shadow-md shadow-primary/20" 
                                        : "text-slate-500 hover:bg-slate-50 hover:text-primary"
                                )}
                                title={isSidebarCollapsed ? item.label : undefined}
                            >
                                <item.icon className={cn("h-5 w-5 shrink-0 transition-transform group-hover:scale-110", activeSidebarTab === item.id ? "text-white" : "text-slate-400 group-hover:text-primary")} />
                                {!isSidebarCollapsed && (
                                    <span className={cn(
                                        "text-xs font-bold tracking-tight whitespace-nowrap transition-all",
                                        activeSidebarTab === item.id ? "text-white" : ""
                                    )}>
                                        {item.label}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </aside>

                <div className="flex-1 flex flex-col overflow-y-auto">
                    <main className="px-8 py-12 w-full flex-1">
                        <div className="space-y-12">
                            {/* View Switch for Mobile */}
                            <div className="lg:hidden flex gap-2">
                                <Button variant={activeView === 'received' && !activeSidebarTab ? 'default' : 'outline'} onClick={() => { setActiveView('received'); setActiveSidebarTab(null); }} className="flex-1 rounded-xl h-11 font-black uppercase text-[9px] tracking-widest">Recebidos</Button>
                                <Button variant={activeView === 'area' && !activeSidebarTab ? 'default' : 'outline'} onClick={() => { setActiveView('area'); setActiveSidebarTab(null); }} className="flex-1 rounded-xl h-11 font-black uppercase text-[9px] tracking-widest">Área</Button>
                                <Button variant={activeView === 'sent' && !activeSidebarTab ? 'default' : 'outline'} onClick={() => { setActiveView('sent'); setActiveSidebarTab(null); }} className="flex-1 rounded-xl h-11 font-black uppercase text-[9px] tracking-widest">Enviados</Button>
                            </div>

                            {activeSidebarTab ? (
                                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
                                        <div className="space-y-1">
                                            <h1 className="text-4xl font-light text-slate-800 tracking-tighter capitalize">{activeSidebarTab.replace(/_/g, ' ')}</h1>
                                            <p className="text-[10px] uppercase font-black text-slate-400 tracking-[0.4em]">Conteúdo exclusivo para você</p>
                                        </div>
                                    </div>
                                    
                                    {activeSidebarTab === 'guia_do_cliente' ? (
                                        <div className="w-full h-full bg-white rounded-[2rem] overflow-hidden shadow-sm border border-slate-100">
                                            <KitBoasVindas />
                                        </div>
                                    ) : activeSidebarTab === 'boas_praticas' ? (
                                        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                                {[
                                                    { id: 'boas-vindas', label: 'Boas-vindas', description: 'Conheça nossa cultura e posicionamento.', icon: Building2 },
                                                    { id: 'manual', label: 'Manual do Cliente', description: 'Diretrizes para envio de documentos e rotinas.', icon: FileText },
                                                    { id: 'lucros', label: 'Retirada de Lucros', description: 'Regras e prazos para distribuição de lucros.', icon: Landmark },
                                                    { id: 'como-usar', label: 'Como Utilizar', description: 'Dicas para aproveitar ao máximo o portal.', icon: Lightbulb },
                                                    { id: 'contato', label: 'Canais Oficiais', description: 'Fale com nossos departamentos especializados.', icon: Mail },
                                                ].map((topic) => (
                                                    <button
                                                        key={topic.id}
                                                        onClick={() => {
                                                            setActiveSidebarTab('guia_do_cliente');
                                                            setTimeout(() => {
                                                                const el = document.getElementById(topic.id);
                                                                if (el) el.scrollIntoView({ behavior: 'smooth' });
                                                            }, 100);
                                                        }}
                                                        className="p-8 rounded-[2rem] bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all text-left group"
                                                    >
                                                        <div className="h-14 w-14 rounded-2xl bg-primary/5 flex items-center justify-center text-primary mb-6 transition-colors group-hover:bg-primary group-hover:text-white">
                                                            <topic.icon className="h-7 w-7" />
                                                        </div>
                                                        <h3 className="text-xl font-bold text-slate-800 mb-3">{topic.label}</h3>
                                                        <p className="text-sm text-slate-500 leading-relaxed">{topic.description}</p>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ) : activeSidebarTab === 'videos_treinamentos' ? (
                                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                            <div className="overflow-hidden cursor-grab active:cursor-grabbing" ref={emblaRef}>
                                                <div className="flex gap-6 px-2 py-4">
                                                    {filteredContentList.map((item) => {
                                                        const videoId = item.video_url?.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([^& \n<]+)/)?.[1];
                                                        const thumbUrl = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;

                                                        return (
                                                            <div 
                                                                key={item.id} 
                                                                className="flex-[0_0_80%] md:flex-[0_0_40%] lg:flex-[0_0_30%] group relative"
                                                                onClick={() => {
                                                                    if (item.video_url) window.open(item.video_url, '_blank');
                                                                }}
                                                            >
                                                                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 overflow-hidden h-full flex flex-col group/card cursor-pointer">
                                                                    <div className="aspect-[16/10] relative overflow-hidden">
                                                                        {thumbUrl ? (
                                                                            <img 
                                                                                src={thumbUrl} 
                                                                                alt={item.title}
                                                                                className="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-110"
                                                                            />
                                                                        ) : (
                                                                            <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                                                                                <Video className="h-12 w-12 text-white/10" />
                                                                            </div>
                                                                        )}
                                                                        
                                                                        <div className="absolute inset-0 bg-black/10 group-hover/card:bg-black/30 transition-colors duration-500" />
                                                                        
                                                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-all duration-500">
                                                                            <div className="h-14 w-14 rounded-full bg-white text-primary flex items-center justify-center shadow-2xl scale-75 group-hover/card:scale-100 transition-all duration-500">
                                                                                <Play className="h-6 w-6 fill-current translate-x-0.5" />
                                                                            </div>
                                                                        </div>

                                                                        <div className="absolute top-4 right-4">
                                                                            <div className="bg-black/40 backdrop-blur-md text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border border-white/10">
                                                                                Treinamento
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    <div className="p-6 flex-1 flex flex-col space-y-2">
                                                                        <h3 className="text-lg font-bold text-slate-800 leading-tight group-hover/card:text-primary transition-colors line-clamp-2">{item.title}</h3>
                                                                        {item.content && (
                                                                            <p className="text-slate-400 text-[11px] leading-relaxed line-clamp-2 font-medium">{item.content}</p>
                                                                        )}
                                                                        
                                                                        <div className="pt-4 mt-auto">
                                                                            <div className="flex items-center justify-between">
                                                                                <span className="text-[9px] font-black uppercase text-slate-300 tracking-widest">
                                                                                    {format(new Date(item.created_at), 'MMM yyyy', { locale: ptBR })}
                                                                                </span>
                                                                                <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center group-hover/card:bg-primary group-hover/card:text-white transition-all">
                                                                                    <ArrowRight className="h-4 w-4" />
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (activeSidebarTab === 'boas_praticas' || activeSidebarTab === 'reforma_tributaria') ? (
                                        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                                {filteredContentList.length === 0 ? (
                                                    <div className="col-span-full py-32 text-center space-y-6 bg-white/50 backdrop-blur-xl rounded-[3rem] border border-slate-100 shadow-sm">
                                                        <div className="h-24 w-24 bg-white rounded-[2.5rem] flex items-center justify-center mx-auto text-slate-200 shadow-sm border border-slate-50">
                                                            <Inbox className="h-10 w-10" />
                                                        </div>
                                                        <p className="text-slate-400 font-medium tracking-tight text-lg">Nenhum conteúdo disponível nesta categoria.</p>
                                                    </div>
                                                ) : (
                                                    filteredContentList.map((item) => (
                                                        <Card key={item.id} className="group bg-white/80 backdrop-blur-xl rounded-[3rem] border border-white/60 shadow-[0_20px_40px_rgba(0,0,0,0.03)] hover:shadow-[0_30px_60px_rgba(0,0,0,0.06)] hover:border-primary/20 transition-all duration-700 overflow-hidden flex flex-col p-10">
                                                            <div className="space-y-6">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-500">
                                                                        {activeSidebarTab === 'boas_praticas' ? <Lightbulb className="h-6 w-6" /> : <Calculator className="h-6 w-6" />}
                                                                    </div>
                                                                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] flex items-center gap-2">
                                                                        <Calendar className="h-3.5 w-3.5 opacity-40" />
                                                                        {format(new Date(item.created_at), "dd 'de' MMMM", { locale: ptBR })}
                                                                    </span>
                                                                </div>
                                                                <div className="space-y-3">
                                                                    <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-tight group-hover:text-primary transition-colors duration-300">
                                                                        {item.title}
                                                                    </h3>
                                                                    <div 
                                                                        className="text-slate-500 text-lg leading-relaxed font-light line-clamp-4 prose prose-slate max-w-none" 
                                                                        dangerouslySetInnerHTML={{ 
                                                                            __html: item.content
                                                                                ?.replace(/\n/g, '<br/>')
                                                                                .replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-900 font-bold">$1</strong>') || ''
                                                                        }} 
                                                                    />
                                                                </div>
                                                                <Button 
                                                                    variant="ghost" 
                                                                    className="w-full h-14 rounded-2xl bg-slate-50/50 hover:bg-primary hover:text-white text-slate-600 font-black uppercase text-[10px] tracking-widest gap-3 transition-all duration-500 group-hover:shadow-lg shadow-primary/20"
                                                                    onClick={() => {
                                                                        // Aqui poderia abrir um modal com o conteúdo completo se necessário
                                                                        toast.info("Em breve: conteúdo expandido!");
                                                                    }}
                                                                >
                                                                    Ver Detalhes Completos <ArrowRight className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </Card>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    ) : activeSidebarTab === 'comunicados' ? (
                                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                            <TabsUI defaultValue="todos" className="w-full">
                                                <div className="flex items-center justify-between mb-10 overflow-x-auto pb-4">
                                                    <TabsListUI className="bg-white p-2 rounded-3xl h-[60px] shadow-sm border border-slate-100/80 gap-2">
                                                        <TabsTriggerUI 
                                                            value="todos" 
                                                            className="rounded-2xl px-10 h-full text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:shadow-primary/20 transition-all duration-500"
                                                        >
                                                            Todos
                                                        </TabsTriggerUI>
                                                        <TabsTriggerUI 
                                                            value="fiscal" 
                                                            className="rounded-2xl px-10 h-full text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:shadow-orange-500/20 transition-all duration-500"
                                                        >
                                                            Fiscal
                                                        </TabsTriggerUI>
                                                        <TabsTriggerUI 
                                                            value="pessoal" 
                                                            className="rounded-2xl px-10 h-full text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:shadow-blue-500/20 transition-all duration-500"
                                                        >
                                                            Pessoal
                                                        </TabsTriggerUI>
                                                        <TabsTriggerUI 
                                                            value="contabil" 
                                                            className="rounded-2xl px-10 h-full text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:shadow-emerald-500/20 transition-all duration-500"
                                                        >
                                                            Contábil
                                                        </TabsTriggerUI>
                                                        <TabsTriggerUI 
                                                            value="financeiro" 
                                                            className="rounded-2xl px-10 h-full text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-purple-500 data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:shadow-purple-500/20 transition-all duration-500"
                                                        >
                                                            Financeiro
                                                        </TabsTriggerUI>
                                                    </TabsListUI>
                                                </div>

                                                {['todos', 'fiscal', 'pessoal', 'contabil', 'financeiro'].map((dept) => (
                                                    <TabsContentUI key={dept} value={dept} className="mt-0 outline-none">
                                                        <div className="grid gap-10">
                                                            {clientAnnouncements
                                                                .filter(a => dept === 'todos' || a.department === dept)
                                                                .length === 0 ? (
                                                                    <div className="py-24 text-center space-y-4 bg-white/50 backdrop-blur-sm rounded-[3rem] border border-slate-100 shadow-sm">
                                                                        <div className="h-24 w-24 bg-white rounded-[2.5rem] flex items-center justify-center mx-auto text-slate-200 shadow-sm border border-slate-50">
                                                                            <Inbox className="h-10 w-10" />
                                                                        </div>
                                                                        <p className="text-slate-400 font-medium tracking-tight">Nenhum comunicado disponível nesta categoria.</p>
                                                                    </div>
                                                                ) : (
                                                                    clientAnnouncements
                                                                        .filter(a => dept === 'todos' || a.department === dept)
                                                                        .map((item) => (
                                                                            <div key={item.id} className="group bg-white/80 backdrop-blur-xl rounded-[3rem] border border-white/60 shadow-[0_20px_40px_rgba(0,0,0,0.04)] hover:shadow-[0_30px_60px_rgba(0,0,0,0.08)] hover:border-primary/20 transition-all duration-700 overflow-hidden flex flex-col">
                                                                                <div className={cn(
                                                                                    "h-2 w-full",
                                                                                    item.department === 'fiscal' ? "bg-orange-500" :
                                                                                    item.department === 'pessoal' ? "bg-blue-500" :
                                                                                    item.department === 'contabil' ? "bg-emerald-500" :
                                                                                    item.department === 'financeiro' ? "bg-purple-500" : "bg-primary"
                                                                                )} />
                                                                                <div className="p-12 space-y-10">
                                                                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
                                                                                        <div className="space-y-4">
                                                                                            <div className="flex items-center gap-4">
                                                                                                <Badge className={cn(
                                                                                                    "rounded-full font-black text-[9px] uppercase tracking-widest px-5 py-2 border-none shadow-sm text-white",
                                                                                                    item.department === 'fiscal' ? "bg-orange-500" :
                                                                                                    item.department === 'pessoal' ? "bg-blue-500" :
                                                                                                    item.department === 'contabil' ? "bg-emerald-500" :
                                                                                                    item.department === 'financeiro' ? "bg-purple-500" : "bg-primary"
                                                                                                )}>
                                                                                                    {item.department}
                                                                                                </Badge>
                                                                                                <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] flex items-center gap-2">
                                                                                                    <Calendar className="h-3.5 w-3.5 opacity-50" />
                                                                                                    {format(new Date(item.created_at), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                                                                                                </span>
                                                                                            </div>
                                                                                            <h3 className="text-3xl font-light text-slate-800 tracking-tight leading-tight group-hover:text-primary transition-colors duration-300">
                                                                                                {item.subject}
                                                                                            </h3>
                                                                                        </div>
                                                                                        <div className="flex items-center gap-2 shrink-0">
                                                                                            {item.status === 'read' ? (
                                                                                                <div className="flex items-center gap-2 text-emerald-500 bg-emerald-50/50 px-4 py-2 rounded-full border border-emerald-100">
                                                                                                    <CheckCircle className="h-3.5 w-3.5" />
                                                                                                    <span className="text-[9px] font-black uppercase tracking-widest">Lido</span>
                                                                                                </div>
                                                                                            ) : (
                                                                                                <div className="flex items-center gap-2 text-primary bg-primary/5 px-4 py-2 rounded-full border border-primary/10 animate-pulse">
                                                                                                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                                                                                    <span className="text-[9px] font-black uppercase tracking-widest">Não Lido</span>
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                    
                                                                                    <div 
                                                                                        className="text-slate-600 text-lg leading-relaxed whitespace-pre-wrap prose prose-slate max-w-none border-l-4 border-slate-100/50 pl-10" 
                                                                                        dangerouslySetInnerHTML={{ 
                                                                                            __html: item.content
                                                                                                .replace(/\n/g, '<br/>')
                                                                                                .replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-900 font-bold">$1</strong>')
                                                                                        }} 
                                                                                    />

                                                                                    <div className="pt-10 border-t border-slate-100/50 flex flex-col md:flex-row md:items-center justify-between gap-8">
                                                                                        <div className="flex items-center gap-4">
                                                                                            <div className="h-10 w-10 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100">
                                                                                                <Building2 className="h-5 w-5 text-slate-400" />
                                                                                            </div>
                                                                                            <div>
                                                                                                <p className="text-[10px] uppercase font-black text-slate-400 tracking-[0.2em]">Publicado por</p>
                                                                                                <p className="text-xs font-bold text-slate-600">Equipe de Sucesso do Cliente</p>
                                                                                            </div>
                                                                                        </div>
                                                                                        {item.status !== 'read' && (
                                                                                            <Button 
                                                                                                className="rounded-[1.5rem] h-14 px-10 bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 text-[10px] font-black uppercase tracking-widest gap-3 transition-all hover:scale-105 active:scale-95" 
                                                                                                onClick={() => markAnnouncementAsRead(item.id)}
                                                                                            >
                                                                                                <CheckCircle className="h-4 w-4" /> Confirmar Leitura do Comunicado
                                                                                            </Button>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        ))
                                                                )}
                                                        </div>
                                                    </TabsContentUI>
                                                ))}
                                            </TabsUI>
                                        </div>
                                    ) : contentLoading ? (
                                        <div className="py-20 text-center text-slate-400 font-medium">Carregando conteúdo...</div>
                                    ) : filteredContentList.length > 0 ? (
                                        <div className="grid gap-6">
                                            {filteredContentList.map(item => (
                                                <div key={item.id} className="p-8 rounded-[2rem] bg-white border border-slate-100 shadow-sm space-y-4">
                                                    <h3 className="text-xl font-bold text-slate-800">{item.title}</h3>
                                                    
                                                    {item.due_date && (
                                                        <div className="text-xs font-bold text-amber-600 bg-amber-50 inline-block px-3 py-1.5 rounded-lg">
                                                            Prazo: {format(new Date(item.due_date), 'dd/MM/yyyy')}
                                                        </div>
                                                    )}
                                                    
                                                    {item.content && (
                                                        <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">{item.content}</p>
                                                    )}
                                                    
                                                    {item.video_url && (
                                                        <div className="pt-4">
                                                            <a href={item.video_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-primary/90 transition-colors">
                                                                <PlayCircle className="h-4 w-4" /> Assistir Vídeo
                                                            </a>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 bg-white rounded-[3rem] border border-slate-100 shadow-sm">
                                            <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                                                <Info className="h-10 w-10" />
                                            </div>
                                            <div className="space-y-2 max-w-md">
                                                <h2 className="text-2xl font-black text-slate-800">Sem conteúdo no momento</h2>
                                                <p className="text-sm text-slate-500 font-light leading-relaxed">
                                                    Ainda não há informações publicadas nesta seção. Em breve o escritório adicionará novidades.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : activeView === 'received' ? (
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
                        <div className="px-8 text-center space-y-6">
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
            </div>
        </div>
    );
}
