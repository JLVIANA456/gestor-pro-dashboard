import { useState, useEffect, useMemo } from 'react';
import { useClients } from '@/hooks/useClients';
import { supabase } from '@/integrations/supabase/client';
import { useBranding } from '@/context/BrandingContext';
import { 
    Users, 
    Upload, 
    FolderPlus, 
    Search, 
    FileText, 
    Clock, 
    Globe,
    Building2,
    ChevronRight,
    ArrowLeft,
    Folder,
    Plus,
    X,
    MoreVertical,
    Download,
    Trash2,
    CheckCircle2,
    Pencil
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription,
    DialogFooter 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface PortalFolder {
    id: string;
    clientId: string;
    name: string;
    icon: string;
    sort_order: number;
    parentId: string | null;
}

interface DeliveryFile {
    id: string;
    clientId: string;
    folderId: string;
    fileName: string;
    fileUrl: string;
    competency: string;
    isViewed: boolean;
    createdAt: string;
}

export default function PortalEntregas() {
    const { clients, loading: clientsLoading } = useClients();
    const { officeName } = useBranding();
    
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
    const [folders, setFolders] = useState<PortalFolder[]>([]);
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
    const [deliveries, setDeliveries] = useState<DeliveryFile[]>([]);
    const [currentParentId, setCurrentParentId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
    const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
    const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [folderToRename, setFolderToRename] = useState<PortalFolder | null>(null);
    const [uploadData, setUploadData] = useState({
        file: null as File | null,
        competency: format(new Date(), 'yyyy-MM'),
        description: ''
    });

    // Fetch folders when client is selected
    useEffect(() => {
        if (selectedClientId) {
            fetchFolders(selectedClientId);
            fetchDeliveries(selectedClientId);
        }
    }, [selectedClientId]);

    const createDefaultFolders = async (clientId: string) => {
        const defaults = [
            { name: 'DP', icon: 'Building2', sort_order: 1 },
            { name: 'FISCAL', icon: 'Building2', sort_order: 2 },
            { name: 'CONTÁBIL', icon: 'Building2', sort_order: 3 },
            { name: 'OUTROS', icon: 'Folder', sort_order: 4 }
        ];

        const createPromise = (async () => {
            const { error: insertError } = await (supabase as any).from('client_portal_folders')
                .insert(defaults.map(d => ({ ...d, client_id: clientId })));
            
            if (insertError) throw insertError;
            
            // Re-fetch folders after creation
            const { data, error: fetchError } = await (supabase as any).from('client_portal_folders')
                .select('*')
                .eq('client_id', clientId)
                .order('sort_order', { ascending: true });

            if (fetchError) throw fetchError;
            return data;
        })();

        toast.promise(createPromise, {
            loading: 'Configurando pastas do cliente...',
            success: (data) => {
                if (data) {
                    setFolders(data.map((f: any) => ({
                        id: f.id,
                        clientId: f.client_id,
                        name: f.name,
                        icon: f.icon,
                        sort_order: f.sort_order
                    })));
                }
                return 'Hub configurado com sucesso!';
            },
            error: (err) => `Erro ao configurar: ${err.message}`
        });
    };

    const fetchFolders = async (clientId: string) => {
        const { data, error } = await (supabase as any).from('client_portal_folders')
            .select('*')
            .eq('client_id', clientId)
            .order('sort_order', { ascending: true });
        
        if (error) {
            console.error("FetchFolders Error:", error);
            toast.error("Erro ao carregar pastas: " + error.message);
            return;
        }

        if (data && data.length === 0) {
            await createDefaultFolders(clientId);
        } else if (data) {
            setFolders(data.map(f => ({
                id: f.id,
                clientId: f.client_id,
                name: f.name,
                icon: f.icon,
                sort_order: f.sort_order,
                parentId: f.parent_id
            })));
        }
    };

    const fetchDeliveries = async (clientId: string) => {
        const { data, error } = await (supabase as any).from('client_deliveries')
            .select('*')
            .eq('client_id', clientId)
            .order('created_at', { ascending: false });
        
        if (!error && data) {
            setDeliveries(data.map(d => ({
                id: d.id,
                clientId: d.client_id,
                folderId: d.folder_id,
                fileName: d.file_name,
                fileUrl: d.file_url,
                competency: d.competency,
                isViewed: d.is_viewed,
                createdAt: d.created_at
            })));
        }
    };

    const handleCreateFolder = async () => {
        if (!newFolderName || !selectedClientId) return;

        try {
            setLoading(true);
            const { error } = await (supabase as any).from('client_portal_folders')
                .insert({
                    client_id: selectedClientId,
                    name: newFolderName,
                    icon: 'Folder',
                    sort_order: folders.length + 1
                });

            if (error) throw error;
            
            toast.success("Pasta criada com sucesso!");
            setNewFolderName('');
            setIsFolderModalOpen(false);
            fetchFolders(selectedClientId);
        } catch (error: any) {
            toast.error("Erro ao criar pasta: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteFolder = async (folderId: string) => {
        const folderDeliveries = deliveries.filter(d => d.folderId === folderId);
        const folderSubfolders = folders.filter(f => f.parentId === folderId);

        if (folderDeliveries.length > 0 || folderSubfolders.length > 0) {
            if (!window.confirm("Esta pasta contém arquivos ou subpastas. Se você excluí-la, todos os itens serão movidos para a raiz (sem pasta). Deseja continuar?")) return;
        }

        try {
            setLoading(true);
            // 1. Move files and subfolders to root before deleting
            if (folderDeliveries.length > 0) {
                await (supabase as any).from('client_deliveries').update({ folder_id: null }).eq('folder_id', folderId);
            }
            if (folderSubfolders.length > 0) {
                await (supabase as any).from('client_portal_folders').update({ parent_id: null }).eq('parent_id', folderId);
            }

            // 2. Delete the folder
            const { error } = await (supabase as any).from('client_portal_folders')
                .delete()
                .eq('id', folderId);

            if (error) throw error;
            
            toast.success("Pasta excluída com sucesso!");
            fetchFolders(selectedClientId!);
            fetchDeliveries(selectedClientId!);
        } catch (error: any) {
            toast.error("Erro ao excluir pasta: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleMoveFolder = async (folderId: string, newParentId: string | null) => {
        try {
            setLoading(true);
            const { error } = await (supabase as any).from('client_portal_folders')
                .update({ parent_id: newParentId })
                .eq('id', folderId);

            if (error) throw error;
            
            toast.success("Pasta movida com sucesso!");
            setIsMoveModalOpen(false);
            setFolderToRename(null);
            fetchFolders(selectedClientId!);
        } catch (error: any) {
            toast.error("Erro ao mover pasta: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRenameFolder = async () => {
        if (!newFolderName || !folderToRename || !selectedClientId) return;

        try {
            setLoading(true);
            const { error } = await (supabase as any).from('client_portal_folders')
                .update({ name: newFolderName })
                .eq('id', folderToRename.id);

            if (error) throw error;
            
            toast.success("Pasta renomeada com sucesso!");
            setNewFolderName('');
            setIsRenameModalOpen(false);
            setFolderToRename(null);
            fetchFolders(selectedClientId);
        } catch (error: any) {
            toast.error("Erro ao renomear: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async () => {
        if (!uploadData.file || !selectedClientId || !selectedFolderId) {
            toast.error("Preencha todos os campos");
            return;
        }

        try {
            setLoading(true);
            const file = uploadData.file;
            const filePath = `deliveries/${selectedClientId}/${selectedFolderId}/${Date.now()}_${file.name}`;
            
            const { error: storageError } = await supabase.storage
                .from('client-documents')
                .upload(filePath, file);

            if (storageError) throw storageError;

            const { data: { publicUrl } } = supabase.storage
                .from('client-documents')
                .getPublicUrl(filePath);

            const { error: dbError } = await (supabase as any).from('client_deliveries')
                .insert({
                    client_id: selectedClientId,
                    folder_id: selectedFolderId,
                    file_name: file.name,
                    file_url: publicUrl,
                    competency: uploadData.competency,
                    description: uploadData.description
                });

            if (dbError) throw dbError;

            toast.success("Arquivo enviado para o portal!");
            setIsUploadModalOpen(false);
            fetchDeliveries(selectedClientId);
        } catch (error: any) {
            toast.error("Erro no upload: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteFile = async (fileId: string) => {
        try {
            setLoading(true);
            const { error } = await (supabase as any).from('client_deliveries')
                .delete()
                .eq('id', fileId);

            if (error) throw error;
            
            toast.success("Arquivo excluído com sucesso!");
            fetchDeliveries(selectedClientId!);
        } catch (error: any) {
            toast.error("Erro ao excluir: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const filteredClients = useMemo(() => {
        return clients.filter(c => 
            c.nomeFantasia.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.cnpj.includes(searchTerm)
        );
    }, [clients, searchTerm]);

    const selectedClient = useMemo(() => 
        clients.find(c => c.id === selectedClientId),
    [clients, selectedClientId]);

    const activeFolder = useMemo(() => 
        folders.find(f => f.id === selectedFolderId),
    [folders, selectedFolderId]);

    if (selectedClientId && selectedClient) {
        return (
            <div className="space-y-8 animate-in slide-in-from-right duration-500 pb-10">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => {
                                setSelectedClientId(null);
                                setSelectedFolderId(null);
                            }}
                            className="h-12 w-12 rounded-2xl bg-white shadow-sm border border-slate-100 text-slate-400 hover:text-primary transition-all"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-light text-slate-800">Gerenciar <span className="font-bold text-primary">Hub</span></h1>
                                <Badge variant="outline" className="rounded-full bg-primary/5 text-primary border-primary/10 text-[9px] font-black uppercase tracking-widest px-3 h-6">
                                    Ativo
                                </Badge>
                            </div>
                            <p className="text-[11px] font-bold text-slate-400 tracking-widest uppercase mt-1">
                                {selectedClient.nomeFantasia} — {selectedClient.cnpj}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                         <Button 
                            variant="ghost"
                            className="h-14 rounded-2xl px-6 gap-3 text-red-400 font-black uppercase text-[10px] tracking-widest hover:bg-red-50 hover:text-red-500 transition-all border border-dashed border-red-100"
                            onClick={async () => {
                                if (!window.confirm("Deseja migrar as pastas atuais para o novo padrão de Departamentos (DP, FISCAL, CONTÁBIL)? Arquivos existentes serão preservados.")) return;
                                
                                try {
                                    setLoading(true);
                                    // 1. Criar Departamentos Raiz
                                    const { data: deptFolders, error: deptError } = await (supabase as any).from('client_portal_folders')
                                        .insert([
                                            { client_id: selectedClientId, name: 'DP', icon: 'Building2', sort_order: 1 },
                                            { client_id: selectedClientId, name: 'FISCAL', icon: 'Building2', sort_order: 2 },
                                            { client_id: selectedClientId, name: 'CONTÁBIL', icon: 'Building2', sort_order: 3 }
                                        ])
                                        .select();
                                    
                                    if (deptError) throw deptError;

                                    const dpId = deptFolders.find((f: any) => f.name === 'DP')?.id;
                                    const fiscalId = deptFolders.find((f: any) => f.name === 'FISCAL')?.id;
                                    const contabilId = deptFolders.find((f: any) => f.name === 'CONTÁBIL')?.id;

                                    // 2. Mover antigas para dentro se existirem
                                    for (const folder of folders) {
                                        let newParentId = null;
                                        if (folder.name === 'Folha de Pagamento') newParentId = dpId;
                                        else if (folder.name === 'Impostos e Guias') newParentId = fiscalId;
                                        else if (folder.name === 'Documentos Contábeis') newParentId = contabilId;
                                        
                                        if (newParentId) {
                                            await (supabase as any).from('client_portal_folders')
                                                .update({ parent_id: newParentId })
                                                .eq('id', folder.id);
                                        }
                                    }

                                    toast.success("Estrutura migrada com sucesso!");
                                    fetchFolders(selectedClientId!);
                                } catch (err: any) {
                                    toast.error("Erro na migração: " + err.message);
                                } finally {
                                    setLoading(false);
                                }
                            }}
                         >
                            <Trash2 className="h-4 w-4" />
                            Redefinir Padrão
                         </Button>
                         <Button 
                            className="h-14 rounded-2xl px-8 gap-3 bg-white border border-slate-100 shadow-sm text-slate-600 font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 transition-all"
                            onClick={() => setIsFolderModalOpen(true)}
                         >
                            <FolderPlus className="h-4 w-4 text-primary" />
                            Nova Pasta
                         </Button>
                         {selectedFolderId && (
                             <Button 
                                className="h-14 rounded-2xl px-10 gap-3 bg-primary text-white shadow-xl shadow-primary/20 font-black uppercase text-[10px] tracking-widest transition-all"
                                onClick={() => setIsUploadModalOpen(true)}
                             >
                                <Upload className="h-4 w-4" />
                                Enviar Arquivo
                             </Button>
                         )}
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Folders List */}
                    <div className="lg:col-span-4 space-y-4">
                        <div className="flex items-center justify-between px-4">
                            <div className="flex flex-col">
                                <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest uppercase">Navegação de Pastas</p>
                                {currentParentId && (
                                    <p className="text-[9px] font-bold text-primary mt-0.5">
                                        {folders.find(f => f.id === currentParentId)?.name}
                                    </p>
                                )}
                            </div>
                            {currentParentId && (
                                <button 
                                    onClick={() => {
                                        const parentFolder = folders.find(f => f.id === currentParentId);
                                        setCurrentParentId(parentFolder?.parentId || null);
                                    }}
                                    className="text-[9px] font-black uppercase text-primary hover:underline flex items-center gap-1 bg-primary/5 px-3 py-1 rounded-full"
                                >
                                    <ArrowLeft className="h-3 w-3" /> Voltar
                                </button>
                            )}
                        </div>
                        <div className="space-y-2">
                            {folders.length === 0 ? (
                                <div className="p-8 rounded-[2rem] bg-slate-50 border border-dashed border-slate-200 text-center space-y-4">
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Nenhuma pasta ativa</p>
                                    <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => createDefaultFolders(selectedClientId!)}
                                        className="rounded-xl text-[9px] font-black uppercase h-8 border-primary/20 text-primary hover:bg-primary/5"
                                        disabled={loading}
                                    >
                                        {loading ? "Configurando..." : "Configurar Agora"}
                                    </Button>
                                </div>
                            ) : folders.filter(f => f.parentId === currentParentId).map(folder => (
                                <div key={folder.id} className="flex items-center gap-2">
                                    <button
                                        onClick={() => {
                                            const subfolders = folders.filter(f => f.parentId === folder.id);
                                            if (subfolders.length > 0) {
                                                setCurrentParentId(folder.id);
                                            } else {
                                                setSelectedFolderId(folder.id);
                                            }
                                        }}
                                        className={cn(
                                            "flex-1 flex items-center justify-between p-5 rounded-[2rem] transition-all duration-300 border group",
                                            selectedFolderId === folder.id 
                                                ? "bg-primary text-white border-primary shadow-xl shadow-primary/20 scale-[1.02]" 
                                                : "bg-white text-slate-600 border-slate-50 hover:border-primary/20 hover:bg-slate-50/50"
                                        )}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "h-12 w-12 rounded-2xl flex items-center justify-center transition-all",
                                                selectedFolderId === folder.id ? "bg-white/20" : "bg-slate-50 group-hover:bg-primary/5 text-slate-400 group-hover:text-primary"
                                            )}>
                                                <Folder className="h-6 w-6" />
                                            </div>
                                            <div className="text-left">
                                                <p className="font-bold text-sm tracking-tight">{folder.name}</p>
                                                <p className={cn(
                                                    "text-[9px] font-black uppercase tracking-widest opacity-60",
                                                    selectedFolderId === folder.id ? "text-white" : "text-slate-400"
                                                )}>
                                                    {folders.filter(f => f.parentId === folder.id).length > 0 
                                                        ? `${folders.filter(f => f.parentId === folder.id).length} subpastas` 
                                                        : `${deliveries.filter(d => d.folderId === folder.id).length} arquivos`}
                                                </p>
                                            </div>
                                        </div>
                                        <ChevronRight className={cn(
                                            "h-5 w-5 transition-transform",
                                            selectedFolderId === folder.id ? "translate-x-1" : "opacity-0 group-hover:opacity-100"
                                        )} />
                                    </button>
                                    <div className="flex items-center gap-1">
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className={cn(
                                                "h-10 w-10 rounded-xl transition-all",
                                                selectedFolderId === folder.id ? "text-white/40 hover:text-white" : "text-slate-300 hover:text-primary"
                                            )}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setFolderToRename(folder);
                                                setNewFolderName(folder.name);
                                                setIsRenameModalOpen(true);
                                            }}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className={cn(
                                                "h-10 w-10 rounded-xl transition-all",
                                                selectedFolderId === folder.id ? "text-white/40 hover:text-white" : "text-slate-300 hover:text-primary"
                                            )}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setFolderToRename(folder); // Reuse this state to know which folder to move
                                                setIsMoveModalOpen(true);
                                            }}
                                        >
                                            <Globe className="h-4 w-4" />
                                        </Button>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className={cn(
                                                "h-10 w-10 rounded-xl transition-all",
                                                selectedFolderId === folder.id ? "text-white/40 hover:text-white" : "text-slate-300 hover:text-red-500"
                                            )}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (confirm(`Deseja excluir a pasta "${folder.name}"?`)) {
                                                    handleDeleteFolder(folder.id);
                                                }
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Content View */}
                    <div className="lg:col-span-8 space-y-6">
                        {!selectedFolderId ? (
                            <div className="h-[600px] rounded-[3.5rem] bg-slate-50/50 border border-dashed border-slate-200 flex flex-col items-center justify-center text-center p-10 opacity-60">
                                <div className="h-24 w-24 rounded-full bg-slate-100 flex items-center justify-center text-slate-300 mb-6">
                                    <Folder className="h-10 w-10" />
                                </div>
                                <h3 className="text-xl font-light text-slate-600">Selecione uma <span className="font-bold">Pasta</span></h3>
                                <p className="text-sm text-slate-400 mt-2 max-w-xs">Escolha uma categoria ao lado para gerenciar os documentos entregues ao cliente.</p>
                            </div>
                        ) : (
                            <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
                                <Card className="p-8 rounded-[3.5rem] bg-white border-none shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div className="flex items-center gap-5">
                                        <div className="h-16 w-16 rounded-[2rem] bg-primary/10 text-primary flex items-center justify-center shadow-inner">
                                            <FileText className="h-8 w-8" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Visualizando Pasta:</p>
                                            <h2 className="text-xl font-bold text-slate-800 tracking-tight">{activeFolder?.name}</h2>
                                        </div>
                                    </div>
                                </Card>

                                <Card className="rounded-[3rem] bg-white border-none shadow-sm overflow-hidden min-h-[400px]">
                                    <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                                        <h4 className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Documentos Disponibilizados</h4>
                                        <Badge variant="outline" className="rounded-full bg-slate-50 text-slate-400 border-none font-black text-[9px] px-3 py-1">
                                            {deliveries.filter(d => d.folderId === selectedFolderId).length} TOTAL
                                        </Badge>
                                    </div>

                                    <ScrollArea className="h-[450px]">
                                        <div className="p-8 space-y-4">
                                            {deliveries.filter(d => d.folderId === selectedFolderId).length === 0 ? (
                                                <div className="flex flex-col items-center justify-center py-20 opacity-20">
                                                    <FileText className="h-16 w-16 mb-4" />
                                                    <p className="text-sm font-bold uppercase tracking-widest">Nenhum arquivo nesta pasta</p>
                                                </div>
                                            ) : (
                                                deliveries.filter(d => d.folderId === selectedFolderId).map(file => (
                                                    <div key={file.id} className="group p-6 rounded-[2.5rem] border border-slate-50 hover:border-primary/20 hover:bg-slate-50/50 transition-all flex items-center gap-6">
                                                        <div className="h-14 w-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-primary group-hover:scale-110 transition-transform border border-slate-100">
                                                            <FileText className="h-7 w-7" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-3">
                                                                <h5 className="font-bold text-slate-800 text-sm truncate">{file.fileName}</h5>
                                                                {file.isViewed ? (
                                                                    <Badge className="bg-emerald-50 text-emerald-600 border-none rounded-full h-5 text-[8px] font-black uppercase">
                                                                        <CheckCircle2 className="h-3 w-3 mr-1" /> Visualizado
                                                                    </Badge>
                                                                ) : (
                                                                    <Badge className="bg-blue-50 text-blue-600 border-none rounded-full h-5 text-[8px] font-black uppercase">
                                                                        Aguardando
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-4 mt-1">
                                                                <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5">
                                                                    <Clock className="h-3 w-3" /> Competência: {file.competency}
                                                                </span>
                                                                <div className="h-1 w-1 rounded-full bg-slate-200" />
                                                                <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">
                                                                    Postado em {format(new Date(file.createdAt), 'dd/MM/yyyy')}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Button 
                                                                variant="ghost" 
                                                                size="icon" 
                                                                asChild
                                                                className="h-11 w-11 rounded-xl hover:bg-white hover:text-primary transition-all shadow-sm"
                                                            >
                                                                <a href={file.fileUrl} target="_blank">
                                                                    <Download className="h-4 w-4" />
                                                                </a>
                                                            </Button>
                                                            <Button 
                                                                variant="ghost" 
                                                                size="icon" 
                                                                className="h-11 w-11 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all"
                                                                onClick={() => {
                                                                    if (confirm("Deseja realmente excluir este arquivo?")) {
                                                                        handleDeleteFile(file.id);
                                                                    }
                                                                }}
                                                                disabled={loading}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </ScrollArea>
                                </Card>
                            </div>
                        )}
                    </div>
                </div>

                {/* Modal Renomear Pasta */}
                <Dialog open={isRenameModalOpen} onOpenChange={setIsRenameModalOpen}>
                    <DialogContent className="rounded-[3rem] border-none bg-white p-10 max-w-sm shadow-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-light text-slate-800">
                                Renomear <span className="text-primary font-medium">Pasta</span>
                            </DialogTitle>
                            <DialogDescription className="text-[10px] uppercase font-black tracking-widest text-slate-400 mt-2">
                                Escolha um novo nome para esta categoria.
                            </DialogDescription>
                        </DialogHeader>
                        
                        <div className="py-6 space-y-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Novo Nome</Label>
                                <Input 
                                    placeholder="Ex: Documentos..."
                                    value={newFolderName}
                                    onChange={e => setNewFolderName(e.target.value)}
                                    className="h-14 rounded-2xl border-slate-100 bg-slate-50 px-5 font-bold"
                                />
                            </div>
                        </div>

                        <DialogFooter className="gap-2">
                            <Button 
                                variant="ghost" 
                                className="rounded-2xl h-12 flex-1 text-[10px] font-black uppercase tracking-widest text-slate-400"
                                onClick={() => setIsRenameModalOpen(false)}
                            >
                                Cancelar
                            </Button>
                            <Button 
                                className="rounded-2xl h-12 flex-1 bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20"
                                onClick={handleRenameFolder}
                                disabled={!newFolderName || loading}
                            >
                                {loading ? "..." : "Salvar"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Modal Nova Pasta */}
                <Dialog open={isFolderModalOpen} onOpenChange={setIsFolderModalOpen}>
                    <DialogContent className="rounded-[3rem] border-none bg-white p-10 max-w-sm shadow-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-light text-slate-800">
                                Criar <span className="text-primary font-medium">Pasta Personalizada</span>
                            </DialogTitle>
                            <DialogDescription className="text-[10px] uppercase font-black tracking-widest text-slate-400 mt-2">
                                Organize melhor os documentos deste cliente.
                            </DialogDescription>
                        </DialogHeader>
                        
                        <div className="py-6 space-y-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Nome da Pasta</Label>
                                <Input 
                                    placeholder="Ex: Contratos, Procurações..."
                                    value={newFolderName}
                                    onChange={e => setNewFolderName(e.target.value)}
                                    className="h-14 rounded-2xl border-slate-100 bg-slate-50 px-5 font-bold"
                                />
                            </div>
                        </div>

                        <DialogFooter className="gap-2">
                            <Button 
                                variant="ghost" 
                                className="rounded-2xl h-12 flex-1 text-[10px] font-black uppercase tracking-widest text-slate-400"
                                onClick={() => setIsFolderModalOpen(false)}
                            >
                                Sair
                            </Button>
                            <Button 
                                className="rounded-2xl h-12 flex-1 bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20"
                                onClick={handleCreateFolder}
                                disabled={!newFolderName || loading}
                            >
                                {loading ? "..." : "Criar"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Modal Upload */}
                <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
                    <DialogContent className="rounded-[3rem] border-none bg-white p-10 max-w-xl shadow-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-light text-slate-800">
                                Disponibilizar <span className="text-primary font-medium">Arquivo</span>
                            </DialogTitle>
                            <DialogDescription className="text-[10px] uppercase font-black tracking-widest text-slate-400 mt-2">
                                Este arquivo ficará visível para o cliente na pasta <strong>{activeFolder?.name}</strong>.
                            </DialogDescription>
                        </DialogHeader>
                        
                        <div className="py-8 space-y-6">
                            <div className="space-y-4">
                                <div className={cn(
                                    "relative flex flex-col items-center justify-center h-48 rounded-[2.5rem] border-2 border-dashed transition-all",
                                    uploadData.file ? "border-primary/20 bg-primary/5" : "border-slate-100 bg-slate-50 hover:border-primary/20"
                                )}>
                                    {uploadData.file ? (
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="h-14 w-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-primary">
                                                <FileText className="h-7 w-7" />
                                            </div>
                                            <p className="text-xs font-bold text-slate-700">{uploadData.file.name}</p>
                                            <Button variant="ghost" size="sm" onClick={() => setUploadData({ ...uploadData, file: null })} className="text-red-500 hover:bg-red-50 rounded-xl h-8">Remover</Button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-4 text-center p-6">
                                            <div className="h-14 w-14 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-300">
                                                <Upload className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase text-slate-700 tracking-wider">Clique para selecionar arquivo</p>
                                                <p className="text-[8px] uppercase font-bold text-slate-400 tracking-widest mt-1">PDF, XML, JPEG até 20MB</p>
                                            </div>
                                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => setUploadData({ ...uploadData, file: e.target.files?.[0] || null })} />
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Competência</Label>
                                        <Input 
                                            type="month"
                                            value={uploadData.competency}
                                            onChange={e => setUploadData({ ...uploadData, competency: e.target.value })}
                                            className="h-14 rounded-2xl border-slate-100 bg-slate-50 px-5"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Observação</Label>
                                        <Input 
                                            placeholder="Ex: Guia DAS"
                                            value={uploadData.description}
                                            onChange={e => setUploadData({ ...uploadData, description: e.target.value })}
                                            className="h-14 rounded-2xl border-slate-100 bg-slate-50 px-5"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="gap-3">
                            <Button 
                                variant="ghost" 
                                className="rounded-2xl h-12 px-8 text-[10px] font-black uppercase tracking-widest text-slate-400"
                                onClick={() => setIsUploadModalOpen(false)}
                            >
                                Cancelar
                            </Button>
                            <Button 
                                className="rounded-2xl h-12 px-10 bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20"
                                onClick={handleUpload}
                                disabled={!uploadData.file || loading}
                            >
                                {loading ? "Enviando..." : "Publicar no Portal"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
                {/* Modal Mover Pasta */}
                <Dialog open={isMoveModalOpen} onOpenChange={setIsMoveModalOpen}>
                    <DialogContent className="rounded-[3rem] border-none bg-white p-10 max-w-md shadow-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-light text-slate-800">
                                Mover <span className="text-primary font-medium">Pasta</span>
                            </DialogTitle>
                            <DialogDescription className="text-[10px] uppercase font-black tracking-widest text-slate-400 mt-2">
                                Selecione o local de destino para <strong>{folderToRename?.name}</strong>.
                            </DialogDescription>
                        </DialogHeader>
                        
                        <ScrollArea className="max-h-[300px] py-4 pr-4">
                            <div className="space-y-2">
                                <Button 
                                    variant="outline" 
                                    className="w-full justify-start h-12 rounded-xl text-[10px] font-black uppercase tracking-widest border-slate-100 hover:bg-primary/5 hover:text-primary"
                                    onClick={() => handleMoveFolder(folderToRename!.id, null)}
                                >
                                    <Globe className="h-4 w-4 mr-2" /> Raiz (Sem Departamento)
                                </Button>
                                {folders
                                    .filter(f => f.id !== folderToRename?.id && !f.parentId) // Only root folders as destinations for now to avoid cycles
                                    .map(folder => (
                                        <Button 
                                            key={folder.id}
                                            variant="outline" 
                                            className="w-full justify-start h-12 rounded-xl text-[10px] font-black uppercase tracking-widest border-slate-100 hover:bg-primary/5 hover:text-primary"
                                            onClick={() => handleMoveFolder(folderToRename!.id, folder.id)}
                                        >
                                            <Folder className="h-4 w-4 mr-2" /> {folder.name}
                                        </Button>
                                    ))}
                            </div>
                        </ScrollArea>

                        <DialogFooter>
                            <Button 
                                variant="ghost" 
                                className="rounded-2xl h-12 w-full text-[10px] font-black uppercase tracking-widest text-slate-400"
                                onClick={() => setIsMoveModalOpen(false)}
                            >
                                Cancelar
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-10">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
                <div>
                    <h1 className="text-3xl font-light text-slate-800 tracking-tight">
                        Hub do <span className="font-bold text-primary">Cliente</span>
                    </h1>
                    <p className="text-[10px] uppercase font-black text-slate-400 tracking-[0.3em] mt-2 flex items-center gap-2">
                        <Globe className="h-3 w-3 text-primary" /> Central de gestão e entregas para o cliente
                    </p>
                </div>

                <div className="relative w-full md:w-96">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                        placeholder="Pesquisar empresa..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="h-16 rounded-3xl border-none bg-white shadow-xl shadow-slate-200/50 pl-14 text-sm focus-visible:ring-primary/20 transition-all font-medium"
                    />
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
                {clientsLoading ? (
                    <div className="col-span-3 py-32 flex flex-col items-center justify-center opacity-20">
                        <Clock className="h-10 w-10 animate-spin" />
                    </div>
                ) : filteredClients.map((client) => {
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
                                         <Badge variant="outline" className="rounded-full border-blue-100 bg-blue-50 text-blue-600 font-black text-[8px] px-3 uppercase tracking-tighter">
                                            Portal do Cliente
                                         </Badge>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <h3 className="text-xl font-bold tracking-tight text-slate-800 line-clamp-1">{client.nomeFantasia}</h3>
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{client.cnpj}</p>
                                </div>

                                <div className="flex items-center justify-between pt-4">
                                     <div className="flex items-center text-primary font-black text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                                         Gerenciar Entregas <ChevronRight className="h-4 w-4" />
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
