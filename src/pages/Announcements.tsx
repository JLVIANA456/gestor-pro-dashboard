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
                a.content.toLowerCase().includes(search);
            
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
        const { recipients, subject, message, isScheduled, scheduled_for } = data;

        // Process all recipients
        const results = await Promise.all(recipients.map(async (email: string) => {
            return await sendAnnouncement({
                department: activeDept,
                folder_id: selectedFolderId || undefined,
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
        <div className="space-y-10 animate-fade-in max-w-[1400px] mx-auto pb-16 px-4 md:px-8">
            {/* Minimalist Premium Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-border/40 pb-10">
                <div className="space-y-3">
                    <div className="flex items-center gap-3 text-primary mb-1 group cursor-default">
                        <div className="h-9 w-9 rounded-2xl bg-primary/10 flex items-center justify-center transition-all group-hover:rotate-12 group-hover:scale-110 shadow-sm border border-primary/20">
                            <Shield className="h-4.5 w-4.5 fill-primary/20" />
                        </div>
                        <span className="text-[10px] uppercase font-light tracking-[0.5em] opacity-50">Central de Comunicações</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-light tracking-tight text-foreground flex items-center gap-4">
                        Fluxo de <span className="font-light text-primary italic relative">
                            Informativos
                            <span className="absolute -bottom-1 left-0 w-full h-[0.5px] bg-primary/30" />
                        </span>
                    </h2>
                    <p className="text-muted-foreground font-light max-w-xl text-sm leading-relaxed opacity-70">
                        Gestão organizada de comunicados por pastas temáticas e departamentos. 
                        Agende disparos e monitore o histórico de interações.
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <Button 
                        onClick={() => setIsComposerOpen(true)}
                        className="h-14 rounded-2xl px-8 bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 font-light text-[11px] uppercase tracking-[0.2em] gap-3 transition-all active:scale-95 group"
                    >
                        <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" /> Novo Comunicado
                    </Button>
                </div>
            </div>

            {/* Department Navigation Tabs */}
            <div className="w-full flex justify-center py-4">
                <div className="bg-muted/20 backdrop-blur-md p-1.5 rounded-[2.5rem] border border-border/30 inline-flex shadow-inner">
                    {DEPARTMENTS.map(dept => (
                        <button
                            key={dept.id}
                            onClick={() => {
                                setActiveDept(dept.id);
                                setSelectedFolderId(null);
                            }}
                            className={cn(
                                "rounded-full px-10 py-3 transition-all font-light text-[10px] uppercase tracking-widest flex items-center gap-3 relative overflow-hidden",
                                activeDept === dept.id 
                                    ? "bg-card text-primary shadow-lg transform scale-105 border border-primary/5" 
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                            )}
                        >
                            <span className={cn(
                                "h-1.5 w-1.5 rounded-full transition-all", 
                                activeDept === dept.id ? "bg-primary animate-pulse" : "bg-muted-foreground/30"
                            )} />
                            {dept.name}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                {/* SIDEBAR: Folder List */}
                <aside className="lg:col-span-3 space-y-8 lg:sticky lg:top-28">
                    <div className="bg-card/40 backdrop-blur-xl border border-border/40 rounded-[2.5rem] p-7 shadow-sm space-y-10">
                        {/* Folder Section */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between px-3">
                                <h4 className="text-[10px] font-light uppercase tracking-[0.3em] text-primary/60 flex items-center gap-2.5">
                                    <FolderOpen className="h-3 w-3" /> Pastas
                                </h4>
                                <button 
                                    onClick={() => setIsNewFolderDialogOpen(true)}
                                    className="h-7 w-7 flex items-center justify-center rounded-xl bg-primary/5 text-primary border border-primary/10 hover:bg-primary/10 transition-all hover:scale-110"
                                    title="Nova Pasta"
                                >
                                    <Plus className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="space-y-2">
                                {/* Default Folder: Geral */}
                                <button
                                    onClick={() => setSelectedFolderId(null)}
                                    className={cn(
                                        "w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all group overflow-hidden relative",
                                        selectedFolderId === null 
                                            ? "bg-primary/[0.04] text-primary border border-primary/10 shadow-sm" 
                                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                    )}
                                >
                                    <div className="flex items-center gap-4 relative z-10">
                                        <div className={cn(
                                            "h-8 w-8 rounded-xl flex items-center justify-center transition-all",
                                            selectedFolderId === null ? "bg-primary/10 shadow-sm" : "bg-muted/50"
                                        )}>
                                            <Inbox className={cn("h-4 w-4 transition-transform group-hover:scale-110", selectedFolderId === null ? "text-primary" : "opacity-30")} />
                                        </div>
                                        <span className="text-xs font-light tracking-wide">Geral</span>
                                    </div>
                                    <span className="text-[10px] tabular-nums opacity-40 font-light relative z-10">
                                        {announcements.filter(a => a.department === activeDept && !a.folder_id).length}
                                    </span>
                                </button>

                                {/* Custom Folders */}
                                {deptFolders.map(folder => (
                                    <div key={folder.id} className="relative group">
                                        <button
                                            onClick={() => setSelectedFolderId(folder.id)}
                                            className={cn(
                                                "w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all group overflow-hidden relative",
                                                selectedFolderId === folder.id 
                                                    ? "bg-primary/[0.04] text-primary border border-primary/10 shadow-sm" 
                                                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                            )}
                                        >
                                            <div className="flex items-center gap-4 relative z-10">
                                                <div className={cn(
                                                    "h-8 w-8 rounded-xl flex items-center justify-center transition-all",
                                                    selectedFolderId === folder.id ? "bg-primary/10 shadow-sm" : "bg-muted/50"
                                                )}>
                                                    <Target className={cn("h-4 w-4 shrink-0 transition-transform group-hover:scale-110", selectedFolderId === folder.id ? "text-primary" : "opacity-30")} />
                                                </div>
                                                <span className="text-xs font-light tracking-wide truncate max-w-[120px]">{folder.name}</span>
                                            </div>
                                            <div className="flex items-center gap-3 relative z-10">
                                                <span className="text-[10px] tabular-nums opacity-40 font-light">
                                                    {announcements.filter(a => a.folder_id === folder.id).length}
                                                </span>
                                            </div>
                                        </button>
                                        
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button className="absolute right-12 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 h-7 w-7 transition-all hover:bg-muted flex items-center justify-center rounded-xl bg-card border border-border/20 z-20 shadow-md">
                                                    <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent className="rounded-2xl border-border/50 bg-card shadow-elevated p-1.5">
                                                <DropdownMenuItem 
                                                    className="text-destructive font-light text-[11px] gap-2.5 cursor-pointer rounded-xl py-2 px-3 focus:bg-destructive/10"
                                                    onClick={(e) => { e.stopPropagation(); deleteFolder(folder.id); if (selectedFolderId === folder.id) setSelectedFolderId(null); }}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" /> Excluir Pasta
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                ))}

                                {deptFolders.length === 0 && (
                                    <div 
                                        className="p-10 text-center border border-dashed border-border/40 rounded-3xl mt-6 opacity-40 group hover:opacity-100 hover:border-primary/20 hover:bg-primary/[0.01] transition-all cursor-pointer" 
                                        onClick={() => setIsNewFolderDialogOpen(true)}
                                    >
                                        <FolderPlus className="h-8 w-8 mx-auto mb-3 opacity-10 group-hover:text-primary group-hover:opacity-100 transition-all transform group-hover:-rotate-6" />
                                        <p className="text-[9px] font-light uppercase tracking-[0.2em]">Criar pasta temática</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Search & Stats */}
                        <div className="pt-8 border-t border-border/20 space-y-6">
                            <div className="space-y-3">
                                <h4 className="text-[10px] font-light uppercase tracking-widest text-primary/60 px-3">Filtro Rápido</h4>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Search className="h-4 w-4 text-muted-foreground/30 transition-colors group-focus-within:text-primary/40" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Buscar..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        className="h-12 w-full rounded-2xl border border-border/40 bg-muted/20 pl-11 pr-4 text-xs font-light focus:bg-card focus:border-primary/30 focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all shadow-inner"
                                    />
                                </div>
                            </div>

                            <div className="bg-primary/[0.02] border border-primary/10 rounded-2xl p-4 flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <p className="text-[9px] text-muted-foreground font-light uppercase tracking-widest">Capacidade Mensal</p>
                                    <p className="text-xs font-light text-foreground">Infinita</p>
                                </div>
                                <Shield className="h-5 w-5 text-primary/20" />
                            </div>
                        </div>
                    </div>
                </aside>

                {/* MAIN CONTENT Area */}
                <main className="lg:col-span-9 space-y-8">
                    <Card className="border-none bg-card/60 backdrop-blur-sm shadow-2xl rounded-[3rem] overflow-hidden border border-white/10">
                        <CardHeader className="bg-primary/[0.03] px-10 py-10 border-b border-primary/10 flex flex-col sm:flex-row items-center justify-between gap-6">
                            <div className="space-y-2.5 px-2">
                                <div className="flex items-center gap-3">
                                    <span className="px-2.5 py-1 rounded-full bg-primary/10 text-[9px] uppercase font-bold tracking-widest text-primary border border-primary/10">{activeDept}</span>
                                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30" />
                                    <span className="text-[10px] uppercase font-light tracking-[0.2em] text-foreground opacity-60">{activeFolder?.name || 'Geral'}</span>
                                </div>
                                <CardTitle className="text-2xl font-light text-foreground flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-2xl bg-white/50 border border-border/40 flex items-center justify-center shadow-sm">
                                        {activeFolder ? <Target className="h-5 w-5 text-primary/70" /> : <Inbox className="h-5 w-5 text-primary/70" />}
                                    </div>
                                    <span>Fluxo de <span className="font-light text-primary">{activeFolder?.name || 'Entregas Gerais'}</span></span>
                                </CardTitle>
                            </div>
                            
                            <div className="flex items-center gap-4">
                                <div className="text-right hidden sm:block px-4 border-r border-border/40">
                                    <p className="text-[10px] text-muted-foreground font-light uppercase tracking-widest mb-0.5 line-clamp-1">Volume do Filtro</p>
                                    <p className="text-2xl font-light text-foreground tabular-nums tracking-tighter">{filteredAnnouncements.length}</p>
                                </div>
                                <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl bg-muted/40 hover:bg-muted text-muted-foreground/70 transition-all border border-border/20">
                                    <Filter className="h-4.5 w-4.5" />
                                </Button>
                            </div>
                        </CardHeader>

                        <CardContent className="p-0">
                            {loading ? (
                                <div className="py-48 flex flex-col items-center gap-6 text-muted-foreground">
                                    <div className="relative">
                                        <Loader2 className="h-16 w-16 animate-spin text-primary opacity-20" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="h-2 w-2 rounded-full bg-primary animate-ping" />
                                        </div>
                                    </div>
                                    <div className="space-y-1 text-center">
                                        <p className="text-[11px] font-light uppercase tracking-[0.3em]">Carregando Registros</p>
                                        <p className="text-[9px] opacity-40 font-light italic">Sincronizando com a nuvem...</p>
                                    </div>
                                </div>
                            ) : filteredAnnouncements.length === 0 ? (
                                <div className="py-48 flex flex-col items-center gap-8 text-center px-12 animate-in fade-in zoom-in-95 duration-500">
                                    <div className="relative">
                                        <div className="h-28 w-28 rounded-[3rem] bg-gradient-to-br from-muted/10 to-muted/20 flex items-center justify-center border border-border/20 shadow-inner group">
                                            <History className="h-10 w-10 text-muted-foreground/10 group-hover:scale-110 transition-transform duration-500" />
                                        </div>
                                        <div className="absolute -bottom-2 -right-2 h-10 w-10 rounded-2xl bg-card border border-border shadow-soft flex items-center justify-center animate-bounce">
                                            <Plus className="h-4 w-4 text-primary" />
                                        </div>
                                    </div>
                                    <div className="space-y-3 max-w-sm">
                                        <h3 className="text-lg font-light text-foreground uppercase tracking-widest">Nenhum registro</h3>
                                        <p className="text-xs font-light text-muted-foreground leading-relaxed">
                                            Esta sessão histórica ainda não contém disparos registrados para este agrupamento.
                                        </p>
                                    </div>
                                    <Button 
                                        onClick={() => setIsComposerOpen(true)}
                                        variant="outline" 
                                        className="h-12 rounded-2xl px-10 font-light text-[10px] uppercase tracking-[0.2em] border-primary/20 text-primary hover:bg-primary/5 transition-all mt-4"
                                    >
                                        Iniciar Primeira Comunicação
                                    </Button>
                                </div>
                            ) : (
                                <div className="divide-y divide-border/20 animate-in fade-in duration-500">
                                    {filteredAnnouncements.map((item, idx) => (
                                        <div 
                                            key={item.id} 
                                            className="px-10 py-10 hover:bg-primary/[0.015] transition-all flex items-center justify-between group cursor-default relative overflow-hidden"
                                            style={{ animationDelay: `${idx * 50}ms` }}
                                        >
                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-primary rounded-r-full scale-y-0 group-hover:scale-y-100 transition-transform duration-500" />
                                            
                                            <div className="flex items-center gap-10 min-w-0">
                                                <div className="flex flex-col items-center gap-1.5 shrink-0 bg-muted/10 p-4 rounded-2xl border border-border/10">
                                                    <span className="text-[22px] font-light text-foreground tabular-nums leading-none tracking-tighter">
                                                        {format(new Date(item.created_at), "dd")}
                                                    </span>
                                                    <span className="text-[10px] uppercase font-light tracking-[0.2em] text-muted-foreground opacity-60">
                                                        {format(new Date(item.created_at), "MMM", { locale: ptBR })}
                                                    </span>
                                                </div>

                                                <div className="space-y-2.5 min-w-0">
                                                    <div className="flex items-center gap-4">
                                                        <h4 className="text-base font-light text-foreground truncate group-hover:text-primary transition-colors max-w-[320px]">
                                                            {item.subject}
                                                        </h4>
                                                        {item.is_scheduled && (
                                                            <div className="px-2.5 py-1 rounded-full bg-amber-500/5 border border-amber-500/20 text-[9px] font-bold text-amber-600 uppercase tracking-widest flex items-center gap-1.5">
                                                                <Clock className="h-3 w-3" /> Agendado
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-8">
                                                        <div className="flex items-center gap-2.5 text-xs text-muted-foreground font-light">
                                                            <div className="h-5 w-5 rounded-full bg-muted/60 flex items-center justify-center">
                                                                <Users className="h-2.5 w-2.5 opacity-40" />
                                                            </div>
                                                            <span className="truncate max-w-[200px]">{item.recipient}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2.5 text-xs text-muted-foreground font-light hidden md:flex">
                                                            <div className="h-5 w-5 rounded-full bg-muted/60 flex items-center justify-center">
                                                                <History className="h-2.5 w-2.5 opacity-40" />
                                                            </div>
                                                            <span>{format(new Date(item.created_at), "HH:mm")}h</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-14 shrink-0">
                                                <div className="flex flex-col items-end gap-2 text-right">
                                                    <div className={cn(
                                                        "flex items-center gap-2.5 px-4 py-2 rounded-2xl text-[10px] font-light uppercase tracking-widest border transition-all shadow-sm",
                                                        item.status === 'scheduled' ? "bg-amber-500/5 text-amber-500 border-amber-500/10" :
                                                        item.status === 'sent' || item.status === 'delivered' ? "bg-emerald-500/5 text-emerald-600 border-emerald-500/10" :
                                                        item.status === 'read' ? "bg-primary/5 text-primary border-primary/10" :
                                                        "bg-muted/10 text-muted-foreground border-border/20"
                                                    )}>
                                                        {getStatusIcon(item.status)}
                                                        {item.status}
                                                    </div>
                                                    {item.is_scheduled && item.scheduled_for && (
                                                        <span className="text-[10px] text-amber-600 font-light italic opacity-70 flex items-center gap-1.5 justify-end">
                                                            <CalendarIcon className="h-3 w-3" />
                                                            {format(new Date(item.scheduled_for), "dd/MM/yy 'às' HH:mm")}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                                    <Button variant="ghost" size="icon" className="h-11 w-11 rounded-2xl bg-white hover:bg-muted border border-border/40 shadow-sm transition-all active:scale-90">
                                                        <ArrowRight className="h-4.5 w-4.5 text-muted-foreground" />
                                                    </Button>
                                                    
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-11 w-11 rounded-2xl bg-white hover:bg-destructive/5 hover:text-destructive border border-border/40 shadow-sm transition-all active:scale-90">
                                                                <Trash2 className="h-4.5 w-4.5 opacity-40 group-hover:opacity-100" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="rounded-2xl border-border/50 shadow-elevated p-1.5 min-w-[180px]">
                                                            <DropdownMenuItem 
                                                                className="text-destructive font-light text-[11px] gap-3 cursor-pointer p-3 rounded-xl focus:bg-destructive/10"
                                                                onClick={() => deleteAnnouncement(item.id)}
                                                            >
                                                                <Trash2 className="h-4 w-4" /> Confirmar Exclusão
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </main>
            </div>

            {/* DIALOG: New Folder */}
            <Dialog open={isNewFolderDialogOpen} onOpenChange={setIsNewFolderDialogOpen}>
                <DialogContent className="max-w-md bg-card border-none rounded-[2rem] p-0 overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
                    <div className="bg-primary/5 border-b border-primary/10 p-8 pb-6">
                        <DialogTitle className="text-2xl font-light tracking-tight text-foreground">
                            Nova <span className="font-light text-primary">Pasta Temática</span>
                        </DialogTitle>
                        <p className="text-[10px] text-muted-foreground font-light uppercase tracking-widest mt-1.5">Crie um organizador para o setor {activeDept}</p>
                    </div>
                    <div className="p-8 space-y-6">
                        <div className="space-y-2.5">
                            <Label className="text-[10px] font-light text-muted-foreground uppercase tracking-widest flex items-center gap-2 ml-1">
                                <Tags className="h-3 w-3 opacity-50" /> Nome da Pasta
                            </Label>
                            <Input
                                placeholder="Ex: DAS, FGTS, Imposto de Renda..."
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                                className="h-12 rounded-xl border-border/50 bg-muted/20 text-sm font-light transition-all focus:border-primary/20"
                                autoFocus
                            />
                            <p className="text-[9px] text-muted-foreground/50 italic px-1">Isso ajudará a agrupar todos os comunicados deste assunto.</p>
                        </div>

                        <DialogFooter className="pt-4">
                            <Button 
                                variant="ghost" 
                                onClick={() => setIsNewFolderDialogOpen(false)}
                                className="rounded-xl font-light text-[10px] uppercase tracking-widest px-8"
                            >
                                Cancelar
                            </Button>
                            <Button 
                                onClick={handleCreateFolder}
                                disabled={!newFolderName.trim()}
                                className="rounded-xl shadow-lg shadow-primary/20 font-light text-[10px] uppercase tracking-widest px-8 transition-all active:scale-95"
                            >
                                Criar Pasta
                            </Button>
                        </DialogFooter>
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
