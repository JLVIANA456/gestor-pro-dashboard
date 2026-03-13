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
    Sparkles,
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
import { AiDropZone, ProcessedFile } from '@/components/announcements/AiDropZone';
import { AiConfigModal } from '@/components/announcements/AiConfigModal';
import { Settings } from 'lucide-react';
import { ResendService } from '@/services/resendService';

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
        deleteAnnouncement,
        templates
    } = useAnnouncements();

    const [activeDept, setActiveDept] = useState('fiscal');
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isComposerOpen, setIsComposerOpen] = useState(false);
    const [isNewFolderDialogOpen, setIsNewFolderDialogOpen] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [isAiConfigOpen, setIsAiConfigOpen] = useState(false);

    // Folders of the active department

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

    const handleSendSubmit = async (data: any, provider: 'gmail' | 'outlook' | 'whatsapp') => {
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
            if (provider === 'whatsapp') {
                toast.success(`${successCount} comunicado(s) registrados e enviados via WhatsApp.`);
                return;
            }

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

    const handleAiSendAll = async (processedFiles: ProcessedFile[], provider: 'gmail' | 'outlook' | 'whatsapp') => {
        let successCount = 0;
        
        for (const item of processedFiles) {
            if (!item.client || !item.data) continue;

            const subject = item.generatedSubject || `Guia de ${item.data.type} - ${item.data.referenceMonth}`;
            let message = item.generatedMessage || `Olá, segue guia de ${item.data.type}.`;

            // Lógica de disparo por provedor
            if (provider === 'whatsapp') {
                const plainTextMessage = message.replace(/<a href="(.*?)">(.*?)<\/a>/g, '$2: $1');
                const phone = (item.client.phone || item.client.telefone)?.replace(/\D/g, '');
                
                if (phone) {
                    window.open(`https://web.whatsapp.com/send?phone=55${phone}&text=${encodeURIComponent(plainTextMessage)}`, '_blank');
                    successCount++;
                }
            } else {
                // DISPARO VIA RESEND (GMAIL/OUTLOOK AGORA SÃO AUTOMÁTICOS)
                try {
                    if (!item.client.email) {
                        throw new Error('E-mail do cliente não cadastrado.');
                    }

                    // Prepara o HTML profissional para o Resend
                    const htmlContent = `
                        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                            <h2 style="color: #333;">Comunicado de Guia</h2>
                            <div style="line-height: 1.6; color: #555;">
                                ${message.replace(/\n/g, '<br>').replace(/<a href="(.*?)">(.*?)<\/a>/g, `
                                    <div style="margin: 25px 0; text-align: center;">
                                        <a href="$1" style="background-color: #007bff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Acessar Documento</a>
                                    </div>
                                `)}
                            </div>
                            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                            <p style="font-size: 10px; color: #999; text-align: center;">
                                Este é um comunicado automático enviado por Gestor Pro em nome de seu contador.<br>
                                Resend Sandbox: Para enviar para e-mails que não o seu, é necessário validar seu domínio no painel do Resend.
                            </p>
                        </div>
                    `;

                    await ResendService.sendEmail({
                        to: item.client.email,
                        subject: subject,
                        html: htmlContent
                    });
                    successCount++;
                } catch (error: any) {
                    console.error('Falha ao enviar via Resend:', error);
                    toast.error(`Erro ao enviar para ${item.client.nomeFantasia || item.client.razaoSocial}: ${error.message}`);
                    continue; // Pula para o próximo sem parar o loop
                }
            }

            // Registrar no histórico independente do provedor
            await sendAnnouncement({
                department: activeDept,
                folder_id: selectedFolderId || undefined,
                client_id: item.client.id,
                recipient: item.client.email || '',
                subject,
                content: message,
                status: 'sent',
                sent_at: new Date().toISOString(),
                is_scheduled: false
            });
        }
        
        toast.success(`${successCount} comunicados processados com sucesso!`);
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
        <div className="max-w-[1600px] mx-auto space-y-10 px-4 sm:px-8 pb-12 animate-in fade-in duration-700">
            {/* Header com Design Premium */}
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between pt-8">
                <div>
                    <h1 className="text-4xl font-extralight tracking-tight text-foreground">Comunicados</h1>
                    <p className="text-[10px] font-normal text-muted-foreground uppercase tracking-[0.3em] mt-2 opacity-70">
                        Central de Inteligência e Disparos
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <Button 
                        onClick={() => setIsAiConfigOpen(true)}
                        variant="outline"
                        className="rounded-2xl text-[10px] uppercase font-bold tracking-widest h-12 px-8 hover:bg-primary/5 text-muted-foreground gap-3 transition-all border-border/40 shadow-sm"
                    >
                        <Settings className="h-4 w-4 opacity-40" /> IA Config
                    </Button>
                    <Button 
                        onClick={() => setIsComposerOpen(true)}
                        className="rounded-2xl bg-primary hover:bg-primary/90 text-[10px] uppercase font-bold tracking-widest h-12 px-8 shadow-2xl shadow-primary/20 gap-3 transition-all active:scale-95"
                    >
                        <Plus className="h-4 w-4" /> Novo Comunicado
                    </Button>
                </div>
            </div>

            {/* Navegação de Departamentos (Modern Tiles) */}
            <div className="flex flex-wrap gap-3">
                {DEPARTMENTS.map(dept => (
                    <button
                        key={dept.id}
                        onClick={() => {
                            setActiveDept(dept.id);
                            setSelectedFolderId(null);
                        }}
                        className={cn(
                            "px-8 py-3 rounded-2xl transition-all text-[10px] uppercase tracking-[0.15em] font-bold border",
                            activeDept === dept.id 
                                ? "bg-primary text-primary-foreground border-primary shadow-xl shadow-primary/20 scale-[1.02]" 
                                : "bg-card text-muted-foreground hover:text-foreground border-border/40 hover:bg-muted/50"
                        )}
                    >
                        {dept.name}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                {/* Sidebar Lado Esquerdo: Navegação de Pastas */}
                <aside className="xl:col-span-2 space-y-8">
                    <section className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50 flex items-center gap-2">
                                <FolderOpen className="h-3.5 w-3.5" /> Organização
                            </h2>
                            <Button 
                                onClick={() => setIsNewFolderDialogOpen(true)}
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors text-muted-foreground"
                            >
                                <Plus className="h-3.5 w-3.5" />
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                            <button
                                onClick={() => setSelectedFolderId(null)}
                                className={cn(
                                    "flex items-center justify-between px-5 py-3.5 rounded-2xl transition-all text-sm font-light border",
                                    selectedFolderId === null 
                                        ? "bg-card text-primary border-primary/20 shadow-md" 
                                        : "bg-transparent text-muted-foreground hover:bg-muted/30 border-transparent shadow-none"
                                )}
                            >
                                <span className="flex items-center gap-3"><Inbox className="h-4 w-4 opacity-40" /> Geral</span>
                                <span className="text-[10px] font-bold opacity-30 bg-muted px-2 py-0.5 rounded-md">{announcements.filter(a => a.department === activeDept && !a.folder_id).length}</span>
                            </button>

                            {deptFolders.map(folder => (
                                <div key={folder.id} className="relative group">
                                    <button
                                        onClick={() => setSelectedFolderId(folder.id)}
                                        className={cn(
                                            "w-full flex items-center justify-between px-5 py-3.5 rounded-2xl transition-all text-sm font-light border",
                                            selectedFolderId === folder.id 
                                                ? "bg-card text-primary border-primary/20 shadow-md" 
                                                : "bg-transparent text-muted-foreground hover:bg-muted/30 border-transparent shadow-none"
                                        )}
                                    >
                                        <span className="flex items-center gap-3 truncate pr-8"><Target className="h-4 w-4 opacity-40" /> {folder.name}</span>
                                        <span className="text-[10px] font-bold opacity-30 bg-muted px-2 py-0.5 rounded-md">{announcements.filter(a => a.folder_id === folder.id).length}</span>
                                    </button>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); deleteFolder(folder.id); }}
                                        className="absolute right-10 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 h-7 w-7 flex items-center justify-center rounded-lg hover:bg-destructive/10 hover:text-destructive transition-all text-muted-foreground/30"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>
                </aside>

                {/* Centro: Zona de Processamento de IA (Foco Principal) */}
                <main className="xl:col-span-10 space-y-10">
                    <section className="max-w-[1000px] mx-auto w-full space-y-8 animate-in slide-in-from-bottom duration-700">
                        <div className="text-center space-y-2">
                             <h2 className="text-[11px] font-bold uppercase tracking-[0.3em] text-primary flex items-center justify-center gap-3">
                                <Sparkles className="h-4 w-4" /> Inteligência Documental
                            </h2>
                            <p className="text-sm text-muted-foreground font-light">Processe suas guias de forma massiva com revisão em tempo real</p>
                        </div>
                        <AiDropZone onSendAll={handleAiSendAll} activeDept={activeDept} />
                    </section>

                    {/* Histórico Abaixo (Muito mais amplo e fácil de ler) */}
                    <section className="space-y-6 pt-10 border-t border-border/20">
                        <div className="bg-card rounded-[3rem] border border-border/50 shadow-elevated overflow-hidden">
                            <div className="p-10 border-b border-border/20 flex flex-col sm:flex-row sm:items-center justify-between gap-8 bg-muted/5">
                                <div className="space-y-1">
                                    <h3 className="text-3xl font-extralight text-foreground tracking-tight">Histórico de Disparos</h3>
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] font-medium opacity-50">
                                        {activeFolder?.name || 'Geral'} • {activeDept} • {filteredAnnouncements.length} Registros
                                    </p>
                                </div>
                                
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                                        <input
                                            type="text"
                                            placeholder="Buscar nos comunicados..."
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                            className="h-14 w-full sm:w-80 rounded-2xl border border-border/40 bg-card pl-12 pr-4 text-sm font-light focus:ring-4 ring-primary/5 focus:outline-none transition-all shadow-sm"
                                        />
                                    </div>
                                    <Button variant="outline" className="h-14 px-6 rounded-2xl border-border/40 hover:bg-primary/5 gap-3 text-muted-foreground transition-all">
                                        <Filter className="h-4 w-4" /> <span className="text-[10px] font-bold uppercase tracking-widest">Filtros</span>
                                    </Button>
                                </div>
                            </div>

                            <div className="divide-y divide-border/10 overflow-hidden">
                                {loading ? (
                                    <div className="py-32 flex flex-col items-center justify-center gap-6">
                                        <Loader2 className="h-12 w-12 animate-spin text-primary opacity-30" />
                                        <p className="text-[11px] uppercase font-bold tracking-[0.3em] text-muted-foreground/50">Sincronizando Histórico</p>
                                    </div>
                                ) : filteredAnnouncements.length === 0 ? (
                                    <div className="py-48 flex flex-col items-center justify-center text-center px-20 scale-110">
                                        <div className="h-28 w-28 rounded-[2.5rem] bg-muted/30 border border-border/30 flex items-center justify-center mb-10 opacity-20 shadow-inner">
                                            <Inbox className="h-12 w-12" />
                                        </div>
                                        <p className="text-2xl font-light text-foreground mb-3">Tudo limpo por aqui</p>
                                        <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-muted-foreground opacity-40">Nenhum disparo registrado nesta categoria</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1">
                                        {filteredAnnouncements.map((item) => (
                                            <div key={item.id} className="p-10 hover:bg-primary/[0.01] transition-all flex items-center justify-between group border-b border-border/5 last:border-0 hover:px-12">
                                                <div className="flex items-center gap-10 min-w-0">
                                                    <div className="flex flex-col items-center gap-1 shrink-0 bg-muted/30 w-16 h-16 justify-center rounded-3xl border border-border/30 shadow-sm group-hover:bg-primary/5 transition-all group-hover:scale-110">
                                                        <span className="text-2xl font-light text-foreground leading-none">{format(new Date(item.created_at), "dd")}</span>
                                                        <span className="text-[9px] uppercase font-black text-muted-foreground tracking-tighter">{format(new Date(item.created_at), "MMM", { locale: ptBR })}</span>
                                                    </div>

                                                    <div className="space-y-3 min-w-0">
                                                        <h4 className="text-xl font-light text-foreground truncate group-hover:text-primary transition-colors max-w-[600px] tracking-tight">
                                                            {item.subject}
                                                        </h4>
                                                        <div className="flex flex-wrap items-center gap-8 text-[12px] text-muted-foreground font-light">
                                                            <span className="flex items-center gap-3 opacity-80"><Mail className="h-4 w-4 opacity-30" /> {item.recipient}</span>
                                                            {item.client && (
                                                                <span className="flex items-center gap-3 text-primary font-medium bg-primary/5 px-4 py-1.5 rounded-full border border-primary/10">
                                                                    <Building2 className="h-4 w-4 opacity-40" /> 
                                                                    {item.client.nome_fantasia}
                                                                </span>
                                                            )}
                                                            <span className="flex items-center gap-3 opacity-60"><History className="h-4 w-4 opacity-30" /> {format(new Date(item.created_at), "HH:mm")}h</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-8">
                                                    <div className={cn(
                                                        "px-6 py-2.5 rounded-2xl text-[11px] font-bold uppercase tracking-[0.2em] border transition-all shadow-sm flex items-center gap-3",
                                                        item.status === 'scheduled' ? "bg-amber-500/5 text-amber-600 border-amber-500/20" :
                                                        item.status === 'sent' || item.status === 'delivered' ? "bg-emerald-500/5 text-emerald-600 border-emerald-500/20" :
                                                        item.status === 'read' ? "bg-primary/5 text-primary border-primary/20" :
                                                        "bg-muted/10 text-muted-foreground border-border/40"
                                                    )}>
                                                        {getStatusIcon(item.status)}
                                                        {item.status}
                                                    </div>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        onClick={() => deleteAnnouncement(item.id)}
                                                        className="h-12 w-12 rounded-2xl opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all border border-transparent hover:border-destructive/20 shadow-none"
                                                    >
                                                        <Trash2 className="h-5 w-5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>
                </main>
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

            {/* AI CONFIG DIALOG */}
            <AiConfigModal 
                open={isAiConfigOpen}
                onOpenChange={setIsAiConfigOpen}
            />

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
