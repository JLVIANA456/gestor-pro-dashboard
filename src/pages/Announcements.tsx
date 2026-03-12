import { useState, useMemo } from 'react';
import { 
    Mail, 
    Send, 
    History, 
    ArrowRight, 
    Shield, 
    Clock, 
    CheckCircle2, 
    Eye, 
    Search, 
    Filter, 
    Trash2, 
    Users, 
    Calendar as CalendarIcon,
    FolderPlus,
    FolderOpen,
    MoreHorizontal,
    Plus,
    Tags,
    ChevronRight,
    Loader2,
    Inbox,
    Target,
    Building2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAnnouncements, AnnouncementFolder } from '@/hooks/useAnnouncements';
import { AnnouncementComposer } from '@/components/announcements/AnnouncementComposer';

const DEPARTMENTS = [
    { id: 'fiscal', name: 'Fiscal', color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { id: 'pessoal', name: 'Pessoal', color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { id: 'contabil', name: 'Contábil', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { id: 'financeiro', name: 'Financeiro', color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { id: 'geral', name: 'Geral', color: 'text-slate-500', bg: 'bg-slate-500/10' },
];

export default function Announcements() {
    const { 
        announcements, 
        folders, 
        loading, 
        createFolder, 
        deleteFolder, 
        sendAnnouncement, 
        deleteAnnouncement 
    } = useAnnouncements();

    const [activeDept, setActiveDept] = useState('fiscal');
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isComposerOpen, setIsComposerOpen] = useState(false);
    const [isNewFolderDialogOpen, setIsNewFolderDialogOpen] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');

    // Folders of the active department
    const deptFolders = useMemo(() => 
        folders.filter(f => f.department === activeDept),
    [folders, activeDept]);

    const activeFolder = useMemo(() => 
        folders.find(f => f.id === selectedFolderId) || null,
    [folders, selectedFolderId]);

    // Announcements filtered by Dept and Folder
    const filteredAnnouncements = useMemo(() => {
        return announcements.filter(a => {
            const matchesDept = a.department === activeDept;
            const matchesFolder = selectedFolderId ? a.folder_id === selectedFolderId : !a.folder_id;
            const search = searchQuery.toLowerCase();
            const matchesSearch = 
                a.subject.toLowerCase().includes(search) || 
                a.recipient.toLowerCase().includes(search) ||
                a.content.toLowerCase().includes(search) ||
                (a.client?.nome_fantasia?.toLowerCase().includes(search)) ||
                (a.client?.razao_social?.toLowerCase().includes(search));
            
            return matchesDept && matchesFolder && matchesSearch;
        });
    }, [announcements, activeDept, selectedFolderId, searchQuery]);

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return;
        await createFolder({
            name: newFolderName,
            department: activeDept,
            icon: 'folder',
            color: 'primary'
        });
        setNewFolderName('');
        setIsNewFolderDialogOpen(false);
    };

    const handleSendSubmit = async (data: any, provider: 'gmail' | 'outlook') => {
        const { recipients, subject, message, isScheduled, scheduled_for, client_id } = data;

        // Process all recipients
        const results = await Promise.all(recipients.map(async (email: string) => {
            return await sendAnnouncement({
                department: activeDept,
                folder_id: selectedFolderId || undefined,
                client_id: client_id || undefined,
                recipient: email,
                subject,
                content: message,
                status: isScheduled ? 'scheduled' : 'sent',
                sent_at: isScheduled ? null : new Date().toISOString(),
                scheduled_for: isScheduled ? scheduled_for : null,
                is_scheduled: isScheduled
            });
        }));

        const successCount = results.filter(r => r !== null).length;

        // Redirect only if not scheduled
        if (!isScheduled) {
            const toList = recipients.join(provider === 'gmail' ? ',' : ';');
            const baseUrl = provider === 'gmail' 
                ? 'https://mail.google.com/mail/?view=cm&fs=1&to=' 
                : 'https://outlook.office.com/mail/deeplink/compose?to=';
            const subjectParam = provider === 'gmail' ? '&su=' : '&subject=';
            
            const url = `${baseUrl}${encodeURIComponent(toList)}${subjectParam}${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
            window.open(url, '_blank');
            
            toast.success(`${successCount} comunicado(s) preparados no ${provider.charAt(0).toUpperCase() + provider.slice(1)}.`);
        } else {
            toast.success(`${successCount} comunicado(s) agendado(s) com sucesso!`);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'read': return <Eye className="h-3.5 w-3.5 text-primary" />;
            case 'delivered': return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />;
            case 'scheduled': return <CalendarIcon className="h-3.5 w-3.5 text-amber-500" />;
            default: return <Clock className="h-3.5 w-3.5 text-muted-foreground/60" />;
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            {/* Header com Design Premium */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-light tracking-tight text-foreground">Comunicados</h1>
                    <p className="text-xs font-normal text-muted-foreground uppercase tracking-[0.2em] mt-1">Gestão de informativos e avisos</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button 
                        onClick={() => setIsComposerOpen(true)}
                        className="rounded-xl bg-primary hover:bg-primary/90 text-[10px] uppercase font-light tracking-widest h-11 px-6 shadow-lg shadow-primary/20 gap-2 transition-all active:scale-95"
                    >
                        <Plus className="h-4 w-4" /> Novo Comunicado
                    </Button>
                </div>
            </div>

            {/* Navegação de Departamentos (Tabs Customizadas) */}
            <div className="bg-muted/30 p-1 rounded-2xl border border-border/50 inline-flex shadow-sm">
                {DEPARTMENTS.map(dept => (
                    <button
                        key={dept.id}
                        onClick={() => {
                            setActiveDept(dept.id);
                            setSelectedFolderId(null);
                        }}
                        className={cn(
                            "px-6 py-2 rounded-xl transition-all text-[11px] uppercase tracking-widest font-light",
                            activeDept === dept.id 
                                ? "bg-card text-primary shadow-sm border border-border/10" 
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        {dept.name}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sidebar Lado Esquerdo */}
                <aside className="space-y-6">
                    <div className="bg-card rounded-2xl border border-border/50 shadow-card p-4 space-y-6">
                        {/* Folders Section */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-2 text-[10px] font-normal uppercase tracking-widest text-muted-foreground">
                                <span className="flex items-center gap-2 pt-1"><FolderOpen className="h-3 w-3" /> Pastas</span>
                                <Button 
                                    onClick={() => setIsNewFolderDialogOpen(true)}
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-7 w-7 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors"
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="space-y-1">
                                <button
                                    onClick={() => setSelectedFolderId(null)}
                                    className={cn(
                                        "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all text-sm font-light",
                                        selectedFolderId === null 
                                            ? "bg-primary/10 text-primary border border-primary/20" 
                                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground border border-transparent"
                                    )}
                                >
                                    <span className="flex items-center gap-3"><Inbox className="h-4 w-4 opacity-70" /> Geral</span>
                                    <span className="text-[10px] tabular-nums font-medium opacity-50 px-2.5 py-0.5 rounded-full bg-muted">
                                        {announcements.filter(a => a.department === activeDept && !a.folder_id).length}
                                    </span>
                                </button>

                                {deptFolders.map(folder => (
                                    <div key={folder.id} className="relative group">
                                        <button
                                            onClick={() => setSelectedFolderId(folder.id)}
                                            className={cn(
                                                "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all text-sm font-light",
                                                selectedFolderId === folder.id 
                                                    ? "bg-primary/10 text-primary border border-primary/20" 
                                                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground border border-transparent"
                                            )}
                                        >
                                            <span className="flex items-center gap-3 truncate pr-8"><Target className="h-4 w-4 opacity-70" /> {folder.name}</span>
                                            <span className="text-[10px] tabular-nums font-medium opacity-50 px-2.5 py-0.5 rounded-full bg-muted">
                                                {announcements.filter(a => a.folder_id === folder.id).length}
                                            </span>
                                        </button>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button className="absolute right-10 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 h-6 w-6 flex items-center justify-center rounded-lg hover:bg-card border border-border/20 transition-all">
                                                    <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="rounded-xl border-border bg-card shadow-lg p-1">
                                                <DropdownMenuItem 
                                                    className="text-destructive font-light text-[11px] gap-2 cursor-pointer rounded-lg py-2 px-3 focus:bg-destructive/10"
                                                    onClick={(e) => { e.stopPropagation(); deleteFolder(folder.id); if (selectedFolderId === folder.id) setSelectedFolderId(null); }}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" /> Excluir Pasta
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Search Input */}
                        <div className="relative pt-4 border-t border-border/40">
                            <Search className="absolute left-3 top-7.5 h-3.5 w-3.5 text-muted-foreground/40 mt-1" />
                            <input
                                type="text"
                                placeholder="Filtrar..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="h-10 w-full rounded-xl border border-border/50 bg-muted/20 pl-9 pr-4 text-xs font-light placeholder:text-muted-foreground/30 focus:border-primary/30 focus:outline-none transition-all shadow-inner"
                            />
                        </div>
                    </div>
                </aside>

                {/* Área de Conteúdo Principal */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="bg-card rounded-2xl border border-border/50 shadow-card overflow-hidden transition-all h-full min-h-[500px]">
                        <div className="bg-muted/10 p-6 border-b border-border/40 flex items-center justify-between">
                            <div className="space-y-1">
                                <h3 className="text-lg font-light text-foreground">{activeFolder?.name || 'Geral'}</h3>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-normal">{activeDept} • {filteredAnnouncements.length} registros</p>
                            </div>
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl border border-border/50 text-muted-foreground hover:text-primary">
                                <Filter className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="divide-y divide-border/20">
                            {loading ? (
                                <div className="py-24 flex flex-col items-center gap-4 text-muted-foreground bg-muted/5">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary opacity-30" />
                                    <p className="text-[10px] uppercase font-light tracking-widest opacity-60">Sincronizando...</p>
                                </div>
                            ) : filteredAnnouncements.length === 0 ? (
                                <div className="py-24 flex flex-col items-center gap-6 text-center px-12 opacity-40 grayscale transition-all hover:opacity-100 hover:grayscale-0">
                                    <div className="h-16 w-16 rounded-2xl bg-muted/40 border border-border/40 flex items-center justify-center shadow-inner">
                                        <History className="h-7 w-7 text-muted-foreground/40" />
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm font-light text-foreground">Sem registros para exibir</p>
                                        <p className="text-[10px] font-normal uppercase tracking-widest">Nenhuma comunicação nesta pasta</p>
                                    </div>
                                </div>
                            ) : (
                                filteredAnnouncements.map((item) => (
                                    <div 
                                        key={item.id} 
                                        className="p-6 hover:bg-primary/[0.015] transition-all flex items-center justify-between group"
                                    >
                                        <div className="flex items-center gap-6 min-w-0">
                                            <div className="flex flex-col items-center gap-1 shrink-0 bg-muted/20 w-12 h-12 justify-center rounded-xl border border-border/30">
                                                <span className="text-base font-light text-foreground leading-none">{format(new Date(item.created_at), "dd")}</span>
                                                <span className="text-[8px] uppercase font-bold text-muted-foreground tracking-tighter">{format(new Date(item.created_at), "MMM", { locale: ptBR })}</span>
                                            </div>

                                            <div className="space-y-1.5 min-w-0">
                                                <div className="flex items-center gap-3">
                                                    <h4 className="text-sm font-light text-foreground truncate group-hover:text-primary transition-colors max-w-[400px]">
                                                        {item.subject}
                                                    </h4>
                                                    {item.is_scheduled && (
                                                        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[9px] font-bold text-amber-600 uppercase tracking-widest shrink-0 flex items-center gap-1">
                                                            <Clock className="h-2.5 w-2.5" /> Agendado
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-light">
                                                    <span className="flex items-center gap-1.5"><Mail className="h-3 w-3 opacity-40 shrink-0" /> {item.recipient}</span>
                                                    {item.client && (
                                                        <span className="flex items-center gap-1.5 text-primary/70 font-medium">
                                                            <Building2 className="h-3 w-3 opacity-40 shrink-0" /> 
                                                            {item.client.nome_fantasia}
                                                        </span>
                                                    )}
                                                    <span className="flex items-center gap-1.5 hidden sm:flex"><History className="h-3 w-3 opacity-40 shrink-0" /> {format(new Date(item.created_at), "HH:mm")}h</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 shrink-0">
                                            <div className={cn(
                                                "px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest border transition-all shadow-sm flex items-center gap-1.5",
                                                item.status === 'scheduled' ? "bg-amber-500/5 text-amber-600 border-amber-500/10" :
                                                item.status === 'sent' || item.status === 'delivered' ? "bg-emerald-500/5 text-emerald-600 border-emerald-500/10" :
                                                item.status === 'read' ? "bg-primary/5 text-primary border-primary/10" :
                                                "bg-muted/10 text-muted-foreground border-border/20"
                                            )}>
                                                {getStatusIcon(item.status)}
                                                {item.status}
                                            </div>

                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-0 translate-x-3">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-destructive/5 hover:text-destructive border border-border/40 shadow-sm">
                                                            <Trash2 className="h-3.5 w-3.5 opacity-60" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="rounded-xl border-border bg-card shadow-lg p-1 min-w-[150px]">
                                                        <DropdownMenuItem 
                                                            className="text-destructive font-light text-[11px] gap-2.5 cursor-pointer p-2 rounded-lg focus:bg-destructive/10"
                                                            onClick={() => deleteAnnouncement(item.id)}
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" /> Confirmar Exclusão
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* DIALOG: New Folder */}
            <Dialog open={isNewFolderDialogOpen} onOpenChange={setIsNewFolderDialogOpen}>
                <DialogContent className="max-w-md bg-card border-border rounded-3xl p-0 overflow-hidden shadow-elevated">
                    <div className="bg-primary/5 border-b border-primary/10 p-6 pb-5">
                        <DialogTitle className="text-xl font-light tracking-tight text-foreground">
                            Nova <span className="font-light text-primary">Pasta Temática</span>
                        </DialogTitle>
                        <p className="text-[10px] text-muted-foreground font-normal uppercase tracking-widest mt-1">Organizador para o setor {activeDept}</p>
                    </div>
                    <div className="p-6 space-y-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-normal text-muted-foreground uppercase tracking-widest pl-1">
                                Nome da Pasta
                            </Label>
                            <Input
                                placeholder="Ex: DAS, FGTS, Imposto de Renda..."
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                                className="h-11 rounded-xl border-border/50 bg-muted/20 text-sm font-light transition-all focus:border-primary/20"
                                autoFocus
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <Button 
                                variant="ghost" 
                                onClick={() => setIsNewFolderDialogOpen(false)}
                                className="rounded-xl font-light text-xs uppercase tracking-widest h-10 px-6"
                            >
                                Cancelar
                            </Button>
                            <Button 
                                onClick={handleCreateFolder}
                                disabled={!newFolderName.trim()}
                                className="rounded-xl shadow-lg shadow-primary/10 font-light text-xs uppercase tracking-widest h-10 px-6"
                            >
                                Criar Pasta
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* COMPOSER DIALOG */}
            <AnnouncementComposer 
                open={isComposerOpen}
                onOpenChange={setIsComposerOpen}
                department={activeDept}
                folderId={selectedFolderId || undefined}
                folderName={activeFolder?.name || 'Geral'}
                onSend={handleSendSubmit}
            />
        </div>
    );
}
