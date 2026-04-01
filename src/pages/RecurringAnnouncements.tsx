import { useState, useMemo } from 'react';
import { 
    Mail, 
    Calendar as CalendarIcon,
    ArrowRight, 
    Trash2, 
    Search, 
    Plus,
    FileBarChart,
    Users,
    Calculator,
    Coins,
    LayoutGrid,
    Briefcase,
    Clock,
    Play,
    Pause,
    Tags,
    Inbox,
    Trash,
    FolderOpen,
    Building2
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRecurringAnnouncements, RecurringAnnouncement } from '@/hooks/useRecurringAnnouncements';
import { useAnnouncements } from '@/hooks/useAnnouncements';
import { AnnouncementComposer } from '@/components/announcements/AnnouncementComposer';
import { Switch } from "@/components/ui/switch";

const DEPARTMENTS = [
    { id: 'fiscal', name: 'Fiscal', icon: <FileBarChart className="h-4 w-4" />, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { id: 'pessoal', name: 'Pessoal', icon: <Users className="h-4 w-4" />, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { id: 'contabil', name: 'Contábil', icon: <Calculator className="h-4 w-4" />, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { id: 'financeiro', name: 'Financeiro', icon: <Coins className="h-4 w-4" />, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { id: 'geral', name: 'Geral', icon: <LayoutGrid className="h-4 w-4" />, color: 'text-slate-500', bg: 'bg-slate-500/10' },
];

export default function RecurringAnnouncements() {
    const { 
        announcements, 
        loading, 
        createRecurring, 
        updateRecurring, 
        deleteRecurring 
    } = useRecurringAnnouncements();
    const { folders } = useAnnouncements();

    const [activeDept, setActiveDept] = useState('fiscal');
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isComposerOpen, setIsComposerOpen] = useState(false);

    const deptFolders = useMemo(() => 
        folders.filter(f => f.department === activeDept),
    [folders, activeDept]);

    const activeFolder = useMemo(() => 
        folders.find(f => f.id === selectedFolderId) || null,
    [folders, selectedFolderId]);

    const filteredAnnouncements = useMemo(() => {
        return announcements.filter(a => {
            const matchesDept = a.department === activeDept;
            const matchesFolder = selectedFolderId ? a.folder_id === selectedFolderId : !a.folder_id;
            const search = searchQuery.toLowerCase();
            const matchesSearch = 
                a.subject.toLowerCase().includes(search) || 
                a.recipient.toLowerCase().includes(search) ||
                (a.client?.nome_fantasia?.toLowerCase().includes(search));
            
            return matchesDept && matchesFolder && matchesSearch;
        });
    }, [announcements, activeDept, selectedFolderId, searchQuery]);

    const handleSendSubmit = async (data: any) => {
        const { recipients, subject, message, sendDay, client_id } = data;
        
        // Criar registro recorrente para cada destinatário
        const promises = recipients.map(async (email: string) => {
            return await createRecurring({
                department: activeDept,
                folder_id: selectedFolderId || undefined,
                client_id: client_id || undefined,
                recipient: email,
                subject,
                content: message,
                send_day: sendDay || 1,
                active: true
            });
        });

        await Promise.all(promises);
        setIsComposerOpen(false);
    };

    const toggleStatus = async (id: string, active: boolean) => {
        await updateRecurring(id, { active: !active });
    };

    return (
        <div className="max-w-[1600px] mx-auto space-y-10 px-4 sm:px-8 pb-12 animate-in fade-in duration-700">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between pt-8">
                <div>
                    <h1 className="text-4xl font-extralight tracking-tight text-foreground">Comunicados Recorrentes</h1>
                    <p className="text-[10px] font-normal text-muted-foreground uppercase tracking-[0.3em] mt-2 opacity-70">
                        Automatização Mensal de Disparos
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <Button 
                        onClick={() => setIsComposerOpen(true)}
                        className="rounded-2xl bg-primary hover:bg-primary/90 text-[10px] uppercase font-bold tracking-widest h-12 px-8 shadow-2xl shadow-primary/20 gap-3 transition-all active:scale-95"
                    >
                        <Plus className="h-4 w-4" /> Nova Recorrência
                    </Button>
                </div>
            </div>

            {/* Department Tabs */}
            <div className="bg-muted/30 p-1.5 rounded-[2rem] border border-border/40 inline-flex flex-wrap gap-2">
                {DEPARTMENTS.map(dept => (
                    <button
                        key={dept.id}
                        onClick={() => {
                            setActiveDept(dept.id);
                            setSelectedFolderId(null);
                        }}
                        className={cn(
                            "flex items-center gap-3 px-6 py-3 rounded-[1.5rem] transition-all text-[10px] uppercase tracking-[0.15em] font-bold",
                            activeDept === dept.id 
                                ? "bg-card text-primary shadow-lg shadow-black/5 scale-[1.02] border border-primary/10" 
                                : "text-muted-foreground hover:text-foreground hover:bg-white/40"
                        )}
                    >
                        <span className={cn(
                            "p-2 rounded-xl transition-colors",
                            activeDept === dept.id ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground/40"
                        )}>
                            {dept.icon}
                        </span>
                        {dept.name}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 items-start">
                <aside className="xl:col-span-3 space-y-10">
                    <section className="bg-card rounded-[2.5rem] border border-border/50 p-6 shadow-sm space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 flex items-center gap-2">
                                <Tags className="h-3.5 w-3.5 text-primary" /> Pastas
                            </h2>
                        </div>

                        <div className="space-y-1.5">
                            <button
                                onClick={() => setSelectedFolderId(null)}
                                className={cn(
                                    "w-full flex items-center justify-between px-4 py-4 rounded-2xl transition-all",
                                    selectedFolderId === null ? "bg-primary/5 text-primary font-medium" : "text-muted-foreground hover:bg-muted/50"
                                )}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "h-10 w-10 rounded-xl flex items-center justify-center",
                                        selectedFolderId === null ? "bg-primary text-white shadow-xl shadow-primary/20" : "bg-muted text-muted-foreground"
                                    )}>
                                        <Inbox className="h-5 w-5" />
                                    </div>
                                    <span className="text-sm">Geral Recorrente</span>
                                </div>
                                <Badge variant="secondary" className="rounded-lg font-bold text-[10px] bg-muted/40 border-none px-2.5">
                                    {announcements.filter(a => a.department === activeDept && !a.folder_id).length}
                                </Badge>
                            </button>

                            <div className="pt-4 pb-2 px-2">
                                <hr className="border-border/40" />
                            </div>

                            <div className="max-h-[400px] overflow-y-auto pr-1 space-y-1.5">
                                {deptFolders.map(folder => (
                                    <button
                                        key={folder.id}
                                        onClick={() => setSelectedFolderId(folder.id)}
                                        className={cn(
                                            "w-full flex items-center justify-between px-4 py-4 rounded-2xl transition-all",
                                            selectedFolderId === folder.id ? "bg-primary/5 text-primary font-medium" : "text-muted-foreground hover:bg-muted/50"
                                        )}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "h-10 w-10 rounded-xl flex items-center justify-center",
                                                selectedFolderId === folder.id ? "bg-primary text-white shadow-xl shadow-primary/20" : "bg-muted text-muted-foreground/40"
                                            )}>
                                                <FolderOpen className="h-4 w-4" />
                                            </div>
                                            <span className="text-sm truncate max-w-[120px]">{folder.name}</span>
                                        </div>
                                        <Badge variant="secondary" className="rounded-lg font-bold text-[10px] bg-muted/40 border-none px-2.5">
                                            {announcements.filter(a => a.folder_id === folder.id).length}
                                        </Badge>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </section>
                </aside>

                <main className="xl:col-span-9 space-y-10">
                    <section className="bg-card rounded-[3rem] border border-border/50 shadow-elevated overflow-hidden">
                        <div className="p-10 border-b border-border/20 flex flex-col sm:flex-row sm:items-center justify-between gap-8 bg-muted/5">
                            <div className="space-y-1">
                                <h3 className="text-3xl font-extralight text-foreground tracking-tight">Regras de Automação</h3>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] font-medium opacity-50">
                                    Configuradas para todo dia {filteredAnnouncements[0]?.send_day || 'X'} do mês
                                </p>
                            </div>
                            
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                                    <input
                                        type="text"
                                        placeholder="Buscar automação..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        className="h-14 w-full sm:w-64 rounded-2xl border border-border/40 bg-card pl-12 pr-4 text-sm font-light focus:ring-4 ring-primary/5 transition-all outline-none shadow-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="divide-y divide-border/10">
                            {loading ? (
                                <div className="py-20 flex flex-col items-center justify-center gap-4">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary opacity-30" />
                                    <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/50">Carregando automações</span>
                                </div>
                            ) : filteredAnnouncements.length === 0 ? (
                                <div className="py-32 flex flex-col items-center justify-center text-center px-10">
                                    <div className="h-20 w-20 rounded-3xl bg-muted/30 flex items-center justify-center mb-6 opacity-40">
                                        <CalendarIcon className="h-10 w-10" />
                                    </div>
                                    <p className="text-lg font-light text-foreground mb-1">Nenhuma automação agendada</p>
                                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground/40">Crie uma nova regra recorrente acima</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1">
                                    {filteredAnnouncements.map((item) => (
                                        <div key={item.id} className="p-8 hover:bg-primary/[0.01] transition-all flex items-center justify-between group border-b border-border/5">
                                            <div className="flex items-center gap-8 min-w-0">
                                                <div className="flex flex-col items-center shrink-0 bg-primary/5 w-14 h-14 justify-center rounded-2xl border border-primary/10 shadow-sm">
                                                    <span className="text-[10px] uppercase font-black text-primary tracking-tighter mb-0.5">DIA</span>
                                                    <span className="text-xl font-bold text-primary leading-none">{item.send_day}</span>
                                                </div>

                                                <div className="space-y-1.5 min-w-0">
                                                    <h4 className="text-lg font-light text-foreground truncate max-w-[500px] tracking-tight">
                                                        {item.subject}
                                                    </h4>
                                                    <div className="flex items-center gap-4 text-[12px] text-muted-foreground">
                                                        <span className="flex items-center gap-1.5">
                                                            <Building2 className="h-3.5 w-3.5" /> {item.client?.nome_fantasia || item.recipient}
                                                        </span>
                                                        <span className="flex items-center gap-1.5 border-l border-border/40 pl-4">
                                                            <Mail className="h-3.5 w-3.5" /> {item.recipient}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-8">
                                                <div className="flex flex-col items-end gap-1.5">
                                                    <span className="text-[9px] uppercase font-black text-muted-foreground/40 tracking-[0.2em]">Status da Regra</span>
                                                    <div className="flex items-center gap-3">
                                                        <span className={cn(
                                                            "text-xs font-medium",
                                                            item.active ? "text-emerald-600" : "text-amber-600"
                                                        )}>
                                                            {item.active ? 'Ativa e Agendada' : 'Pausada'}
                                                        </span>
                                                        <Switch 
                                                            checked={item.active} 
                                                            onCheckedChange={() => toggleStatus(item.id, item.active)}
                                                            className="data-[state=checked]:bg-emerald-500"
                                                        />
                                                    </div>
                                                </div>

                                                <button 
                                                    onClick={() => deleteRecurring(item.id)}
                                                    className="h-12 w-12 flex items-center justify-center rounded-2xl bg-destructive/5 text-destructive opacity-0 group-hover:opacity-100 transition-all hover:bg-destructive/10"
                                                >
                                                    <Trash2 className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>
                </main>
            </div>

            <AnnouncementComposer 
                open={isComposerOpen}
                onOpenChange={setIsComposerOpen}
                department={activeDept}
                folderId={selectedFolderId || undefined}
                folderName={activeFolder?.name || 'Geral Recorrente'}
                onSend={handleSendSubmit}
                showRecurringOptions={true}
            />
        </div>
    );
}

const Loader2 = ({ className }: { className?: string }) => (
    <div className={cn("animate-spin", className)}>
        <Clock className="h-full w-full" />
    </div>
);
