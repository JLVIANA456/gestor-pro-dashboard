import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useClientPortal } from '@/hooks/useClientPortal';
import { useBranding } from '@/context/BrandingContext';
import { supabase } from '@/integrations/supabase/client';
import { 
    FileText, 
    UploadCloud, 
    Download, 
    Clock, 
    Search,
    Filter,
    ArrowUpRight,
    ArrowDownLeft,
    Inbox,
    Send,
    LogOut,
    CheckCircle2,
    Calendar,
    ChevronRight,
    Building,
    Folder,
    ExternalLink,
    Bell,
    Globe,
    ArrowLeft
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface PortalFolder {
    id: string;
    clientId: string;
    name: string;
}

interface DeliveryFile {
    id: string;
    clientId: string;
    folderId: string;
    fileName: string;
    fileUrl: string;
    competency: string;
    createdAt: string;
}

export default function ClientPortalView() {
    const { user, signOut } = useAuth();
    const { officeName, logoUrl } = useBranding();
    
    const [clientId, setClientId] = useState<string | null>(null);
    const [folders, setFolders] = useState<PortalFolder[]>([]);
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
    const [deliveries, setDeliveries] = useState<DeliveryFile[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch linked clientId for the user
    useEffect(() => {
        const fetchLinkedClient = async () => {
            if (!user?.id) return;
            const { data, error } = await supabase
                .from('client_portal_users')
                .select('client_id')
                .eq('user_id', user.id)
                .single();
            
            if (data) {
                setClientId(data.client_id);
            }
            setLoading(false);
        };
        fetchLinkedClient();
    }, [user]);

    // Fetch folders when client is detected
    useEffect(() => {
        if (clientId) {
            fetchFolders(clientId);
            fetchDeliveries(clientId);
        }
    }, [clientId]);

    const fetchFolders = async (cid: string) => {
        const { data } = await (supabase.from('client_portal_folders') as any)
            .select('*')
            .eq('client_id', cid)
            .order('sort_order', { ascending: true });
        
        if (data) {
            setFolders(data.map(f => ({
                id: f.id,
                clientId: f.client_id,
                name: f.name
            })));
        }
    };

    const fetchDeliveries = async (cid: string) => {
        const { data } = await (supabase.from('client_deliveries') as any)
            .select('*')
            .eq('client_id', cid)
            .order('created_at', { ascending: false });
        
        if (data) {
            setDeliveries(data.map(d => ({
                id: d.id,
                clientId: d.client_id,
                folderId: d.folder_id,
                fileName: d.file_name,
                fileUrl: d.file_url,
                competency: d.competency,
                createdAt: d.created_at
            })));
        }
    };

    const activeFolder = useMemo(() => folders.find(f => f.id === selectedFolderId), [folders, selectedFolderId]);
    const filteredDeliveries = useMemo(() => 
        deliveries.filter(d => d.folderId === selectedFolderId),
    [deliveries, selectedFolderId]);

    const handleMarkAsRead = async (deliveryId: string) => {
        await (supabase.from('client_deliveries') as any)
            .update({ is_viewed: true, viewed_at: new Date().toISOString() })
            .eq('id', deliveryId);
    };

    if (loading) return null;

    return (
        <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans">
            {/* Premium Navigation Header */}
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
                        <div className="hidden lg:flex flex-col text-right">
                            <span className="text-sm font-black text-slate-800 uppercase tracking-wide">{user?.name}</span>
                            <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-1">Acesso Autorizado</span>
                        </div>
                        <div className="h-10 w-px bg-slate-200 hidden lg:block mx-2" />
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

            <main className="max-w-7xl mx-auto px-6 py-12 w-full flex-1 animate-in fade-in slide-in-from-bottom duration-1000">
                
                {selectedFolderId ? (
                    <div className="space-y-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-5">
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => setSelectedFolderId(null)}
                                    className="h-14 w-14 rounded-3xl bg-white shadow-sm border border-slate-100 text-slate-400 hover:text-primary transition-all"
                                >
                                    <ArrowLeft className="h-6 w-6" />
                                </Button>
                                <div>
                                    <h1 className="text-3xl font-light text-slate-800 tracking-tight">Pasta: <span className="font-bold text-primary">{activeFolder?.name}</span></h1>
                                    <p className="text-[10px] uppercase font-black text-slate-400 tracking-[0.4em] mt-2">Documentos Úteis</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredDeliveries.map(file => (
                                <Card 
                                    key={file.id} 
                                    className="group rounded-[3.5rem] border-none bg-white p-8 shadow-sm hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 hover:-translate-y-2 relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 p-8 opacity-5 -translate-y-1/2 translate-x-1/2">
                                        <FileText className="h-32 w-32" />
                                    </div>
                                    
                                    <div className="space-y-6">
                                        <div className="h-16 w-16 rounded-[2rem] bg-primary/5 flex items-center justify-center text-primary shadow-inner group-hover:bg-primary group-hover:text-white transition-all duration-500">
                                            <FileText className="h-8 w-8" />
                                        </div>
                                        
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-800 tracking-tight line-clamp-2 leading-tight h-10">{file.fileName}</h3>
                                            <div className="flex items-center gap-4 mt-4">
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-black uppercase text-slate-300 tracking-widest">Comp.</span>
                                                    <span className="text-sm font-black text-slate-500">{file.competency}</span>
                                                </div>
                                                <div className="h-6 w-px bg-slate-100" />
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-black uppercase text-slate-300 tracking-widest">Disponível em</span>
                                                    <span className="text-sm font-black text-slate-500">{format(new Date(file.createdAt), 'dd/MM/yyyy')}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <Button 
                                            asChild
                                            className="w-full h-16 rounded-[2rem] bg-slate-50 hover:bg-primary text-slate-600 hover:text-white font-black uppercase text-[10px] tracking-widest transition-all duration-500 gap-3 border border-slate-100 hover:border-transparent group-hover:shadow-xl group-hover:shadow-primary/20"
                                            onClick={() => handleMarkAsRead(file.id)}
                                        >
                                            <a href={file.fileUrl} target="_blank">
                                                <Download className="h-5 w-5" />
                                                Baixar Documento
                                            </a>
                                        </Button>
                                    </div>
                                </Card>
                            ))}

                            {filteredDeliveries.length === 0 && (
                                <div className="col-span-3 py-32 flex flex-col items-center justify-center opacity-20">
                                    <Inbox className="h-16 w-16 mb-4" />
                                    <p className="text-sm font-bold uppercase tracking-widest">Nenhum arquivo disponível aqui</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-12">
                        <section className="text-center space-y-4 max-w-2xl mx-auto">
                            <Badge className="bg-primary/10 text-primary border-none rounded-full px-6 py-2 text-[10px] font-black uppercase tracking-widest mb-4">
                                Bem-vindo ao seu Portal
                            </Badge>
                            <h1 className="text-5xl font-light text-slate-800 tracking-tighter">O que você <span className="font-bold text-primary">precisa</span> agora?</h1>
                            <p className="text-slate-400 text-lg">Acesse seus impostos, holerites e documentos contábeis de forma organizada e segura.</p>
                        </section>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                            {folders.map(folder => {
                                const folderFiles = deliveries.filter(d => d.folderId === folder.id);
                                return (
                                    <div 
                                        key={folder.id}
                                        onClick={() => setSelectedFolderId(folder.id)}
                                        className="group cursor-pointer relative"
                                    >
                                        <Card className="rounded-[4rem] border-none bg-white p-12 shadow-sm transition-all duration-700 group-hover:shadow-2xl group-hover:shadow-primary/10 group-hover:-translate-y-4 overflow-hidden">
                                            {/* Style Accents */}
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 transition-transform duration-700 group-hover:scale-150" />
                                            
                                            <div className="relative z-10 space-y-8">
                                                <div className="h-24 w-24 rounded-[3rem] bg-primary/5 flex items-center justify-center text-primary shadow-inner transition-all duration-700 group-hover:bg-primary group-hover:text-white group-hover:rotate-6 group-hover:scale-110">
                                                    <Folder className="h-12 w-12" />
                                                </div>
                                                
                                                <div className="space-y-3">
                                                    <p className="text-[10px] font-black uppercase text-primary/40 tracking-[0.4em] mb-4">Categoria</p>
                                                    <h3 className="text-3xl font-black text-slate-800 tracking-tighter group-hover:text-primary transition-colors">{folder.name}</h3>
                                                    <div className="flex items-center gap-3 pt-4">
                                                        <Badge className="rounded-full h-8 px-4 bg-slate-50 text-slate-400 font-bold border-none group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                            {folderFiles.length} Arquivos
                                                        </Badge>
                                                        <ChevronRight className="h-5 w-5 text-slate-300 group-hover:translate-x-2 transition-transform duration-500" />
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
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
