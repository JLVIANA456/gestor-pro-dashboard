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
    ArrowLeft,
    Calendar,
    LayoutGrid,
    Clock,
    UserCircle,
    FileSpreadsheet,
    ShieldCheck,
    Briefcase
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format, parse } from 'date-fns';
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
    const { user, signOut } = useAuth();
    const { officeName, logoUrl } = useBranding();
    
    const [clientId, setClientId] = useState<string | null>(null);
    const [folders, setFolders] = useState<PortalFolder[]>([]);
    const [deliveries, setDeliveries] = useState<DeliveryFile[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Fetch linked clientId for the user
    useEffect(() => {
        const fetchLinkedClient = async () => {
            if (!user?.id) return;
            const { data, error } = await (supabase as any)
                .from('client_portal_users')
                .select('client_id')
                .eq('user_id', user.id)
                .single();
            
            if (data) {
                setClientId(data.client_id);
                fetchPortalData(data.client_id);
            } else {
                setLoading(false);
            }
        };
        fetchLinkedClient();
    }, [user]);

    const fetchPortalData = async (cid: string) => {
        try {
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
        } catch (err) {
            console.error("FetchPortalData Error:", err);
        } finally {
            setLoading(false);
        }
    };

    // Logical Grouping
    const currentFolders = useMemo(() => {
        const list = folders.filter(f => f.parentId === currentFolderId);
        return list.sort((a, b) => {
            // Sort Years descending
            const isYearA = /^\d{4}$/.test(a.name);
            const isYearB = /^\d{4}$/.test(b.name);
            if (isYearA && isYearB) return b.name.localeCompare(a.name);
            if (isYearA) return -1;
            if (isYearB) return 1;
            
            // Sort Months (format "01 - Janeiro") descending
            const isMonthA = /^\d{2} - /.test(a.name);
            const isMonthB = /^\d{2} - /.test(b.name);
            if (isMonthA && isMonthB) return b.name.localeCompare(a.name);

            return a.name.localeCompare(b.name);
        });
    }, [folders, currentFolderId]);

    const currentFiles = useMemo(() => {
        if (searchTerm) {
            return deliveries.filter(d => 
                d.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                d.description.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        return deliveries.filter(d => d.folderId === currentFolderId);
    }, [deliveries, currentFolderId, searchTerm]);

    const recentFiles = useMemo(() => 
        deliveries.slice(0, 4),
    [deliveries]);

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
        if (!currentFolderId) return "Documentos";
        return folders.find(f => f.id === currentFolderId)?.name || "Pasta";
    }, [folders, currentFolderId]);

    const handleBack = () => {
        const currentFolder = folders.find(f => f.id === currentFolderId);
        setCurrentFolderId(currentFolder?.parentId || null);
    };

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
            {/* Navigation Header */}
            <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 h-24 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
                    <div className="flex items-center gap-5">
                        <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center text-white shadow-2xl shadow-primary/20 overflow-hidden shrink-0 transform transition-transform hover:scale-105">
                            {logoUrl ? <img src={logoUrl} className="h-full w-full object-contain p-2" /> : <Building className="h-7 w-7" />}
                        </div>
                        <div className="flex flex-col">
                            <h2 className="text-xl font-black uppercase text-slate-800 tracking-tighter leading-none">{officeName}</h2>
                            <span className="text-[10px] uppercase font-black text-primary tracking-[0.4em] mt-2 opacity-60">Portal do Cliente</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="hidden lg:flex items-center gap-4 px-6 py-2 bg-slate-50 rounded-2xl border border-slate-100">
                            <Clock className="h-4 w-4 text-slate-400" />
                            <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Acesso Seguro</span>
                        </div>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="rounded-2xl h-12 w-12 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all shadow-sm border border-slate-50 bg-white"
                            onClick={signOut}
                        >
                            <LogOut className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-12 w-full flex-1">
                <div className="space-y-12">
                    {/* Breadcrumbs & Title & Search Container */}
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                         <div className="space-y-4 flex-1">
                            <div className="flex flex-col">
                                <nav className="flex items-center gap-2 mb-4 overflow-x-auto pb-2 scrollbar-none">
                                    <button 
                                        onClick={() => { setCurrentFolderId(null); setSearchTerm(''); }}
                                        className={cn(
                                            "text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full transition-all",
                                            currentFolderId === null && !searchTerm ? "bg-primary text-white" : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                                        )}
                                    >
                                        Início
                                    </button>
                                    {breadcrumbs.map((crumb, idx) => (
                                        <div key={crumb.id} className="flex items-center gap-2">
                                            <ChevronRight className="h-3 w-3 text-slate-300" />
                                            <button 
                                                onClick={() => { setCurrentFolderId(crumb.id); setSearchTerm(''); }}
                                                className={cn(
                                                    "text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full whitespace-nowrap transition-all",
                                                    idx === breadcrumbs.length - 1 && !searchTerm ? "bg-primary text-white" : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                                                )}
                                            >
                                                {crumb.name}
                                            </button>
                                        </div>
                                    ))}
                                    {searchTerm && (
                                        <div className="flex items-center gap-2">
                                            <ChevronRight className="h-3 w-3 text-slate-300" />
                                            <Badge className="bg-primary text-white border-none rounded-full px-3 py-1.5 text-[9px] font-black uppercase tracking-widest">
                                                Busca: {searchTerm}
                                            </Badge>
                                        </div>
                                    )}
                                </nav>
                                <h1 className="text-4xl font-light text-slate-800 tracking-tighter">
                                    {searchTerm ? "Resultados da " : (currentFolderId === null ? "Central de " : "")}
                                    <span className="font-black text-primary">
                                        {searchTerm ? "Pesquisa" : currentFolderName}
                                    </span>
                                </h1>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="relative w-full md:w-64">
                                <Inbox className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                                <input 
                                    type="text" 
                                    placeholder="Buscar documento..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full h-12 bg-white border border-slate-100 rounded-2xl pl-11 pr-4 text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
                                />
                            </div>
                            {currentFiles.length > 0 && (
                                <div className="flex items-center gap-3 p-2 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 h-12 shrink-0">
                                    <ShieldCheck className="h-4 w-4" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">{currentFiles.length} {searchTerm ? 'Encontrados' : 'Disponíveis'}</span>
                                </div>
                            )}
                        </div>
                    </div>
                    

                    {/* RECENT FILES (Only on Root) */}
                    {currentFolderId === null && !searchTerm && recentFiles.length > 0 && (
                        <div className="space-y-6">
                            <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] flex items-center gap-3">
                                <Clock className="h-4 w-4 text-primary" /> Lançamentos Recentes
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {recentFiles.map(file => (
                                    <div key={file.id} className="group p-5 bg-white rounded-3xl border border-slate-100 hover:border-primary/20 hover:shadow-xl transition-all flex items-center gap-4 cursor-pointer" onClick={() => window.open(file.fileUrl, '_blank')}>
                                        <div className="h-10 w-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center shrink-0">
                                            <FileText className="h-5 w-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-slate-700 truncate">{file.fileName}</p>
                                            <p className="text-[9px] font-black uppercase text-slate-400">{file.competency}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Content Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {/* FOLDERS VIEW */}
                        {currentFolders.map(folder => {
                            const isYear = /^\d{4}$/.test(folder.name);
                            const isMonth = /^\d{2} - /.test(folder.name);

                            return (
                                <Card 
                                    key={folder.id}
                                    onClick={() => setCurrentFolderId(folder.id)}
                                    className="group cursor-pointer rounded-[3.5rem] border-none bg-white p-10 shadow-sm transition-all duration-700 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-4 relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 transition-transform duration-700 group-hover:scale-150" />
                                    <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                                        <div className={cn(
                                            "h-20 w-20 rounded-[2.5rem] flex items-center justify-center transition-all duration-700 shadow-inner",
                                            isYear ? "bg-amber-50 text-amber-500 group-hover:bg-amber-500 group-hover:text-white" :
                                            isMonth ? "bg-blue-50 text-blue-500 group-hover:bg-blue-500 group-hover:text-white" :
                                            "bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white"
                                        )}>
                                            {isYear ? <Calendar className="h-10 w-10" /> : 
                                             isMonth ? <Clock className="h-10 w-10" /> : 
                                             <Folder className="h-10 w-10" />}
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="text-2xl font-black text-slate-800 tracking-tighter group-hover:text-primary transition-colors capitalize">{folder.name}</h3>
                                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">
                                                {isYear ? "Arquivos por Ano" : isMonth ? "Arquivos Mensais" : "Categoria"}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] font-black uppercase text-primary tracking-widest opacity-0 group-hover:opacity-100 transition-all">
                                            Abrir <ChevronRight className="h-3 w-3" />
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}

                        {/* FILES VIEW */}
                        {currentFiles.map(file => (
                            <Card 
                                key={file.id}
                                className="group rounded-[3.5rem] border-none bg-white p-10 shadow-sm transition-all duration-700 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2 relative overflow-hidden flex flex-col justify-between"
                            >
                                <div className="space-y-6">
                                    <div className={cn(
                                        "h-16 w-16 rounded-[2rem] flex items-center justify-center shadow-inner transition-all duration-500",
                                        file.description.toLowerCase().includes('folha') ? "bg-amber-50 text-amber-500" :
                                        file.description.toLowerCase().includes('imposto') ? "bg-red-50 text-red-500" :
                                        "bg-primary/5 text-primary"
                                    )}>
                                        <FileText className="h-8 w-8" />
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <h3 className="text-xl font-black text-slate-800 tracking-tighter line-clamp-2 leading-tight h-14">
                                            {file.fileName}
                                        </h3>
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center justify-between py-2 border-b border-slate-50">
                                                <span className="text-[9px] font-black uppercase text-slate-300 tracking-widest">Competência</span>
                                                <span className="text-xs font-black text-slate-600">{file.competency}</span>
                                            </div>
                                            <div className="flex items-center justify-between py-2">
                                                <span className="text-[9px] font-black uppercase text-slate-300 tracking-widest">Postado em</span>
                                                <span className="text-xs font-black text-slate-400">{format(new Date(file.createdAt), 'dd/MM/yyyy')}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <Button 
                                    asChild
                                    className="w-full h-14 rounded-[2rem] bg-slate-50 hover:bg-primary text-slate-600 hover:text-white font-black uppercase text-[10px] tracking-widest transition-all duration-500 mt-8 group-hover:shadow-xl group-hover:shadow-primary/20 border border-slate-100 hover:border-transparent"
                                >
                                    <a href={file.fileUrl} target="_blank">
                                        <Download className="h-4 w-4 mr-2" /> Baixar
                                    </a>
                                </Button>
                            </Card>
                        ))}
                    </div>

                    {/* Empty States */}
                    {deliveries.length === 0 && !loading && (
                        <div className="py-32 flex flex-col items-center justify-center text-center space-y-6 opacity-40">
                            <div className="h-24 w-24 rounded-full bg-slate-100 flex items-center justify-center">
                                <Inbox className="h-10 w-10 text-slate-400" />
                            </div>
                            <div className="space-y-2">
                                <h4 className="text-xl font-black uppercase tracking-tighter text-slate-800">Seu Hub está Vazio</h4>
                                <p className="text-sm text-slate-400 max-w-xs mx-auto">Assim que enviarmos suas guias e documentos, eles aparecerão aqui organizados automaticamente.</p>
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
