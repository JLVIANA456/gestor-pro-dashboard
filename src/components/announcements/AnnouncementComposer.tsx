import { useState, useMemo, useEffect } from 'react';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle,
    DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
    Wand2, 
    Upload, 
    FileText, 
    Loader2, 
    CheckCircle2, 
    AlertCircle, 
    Send,
    Trash2,
    X,
    Eye,
    ChevronDown,
    ChevronUp,
    Mail,
    BrainCircuit,
    Calendar as CalendarIcon, 
    Clock, 
    Info, 
    History,
    MessageSquare,
    Tags,
    Phone,
    Paperclip,
    LayoutTemplate,
    UserPlus,
    Bold,
    Link as LinkIcon,
    Image as ImageIcon,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Palette,
    TextCursor,
    Search,
    Check,
    Building2,
    ChevronsUpDown,
    Users,
    Users2,
    Filter,
    Plus,
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { useClients } from '@/hooks/useClients';
import { useAnnouncements, AnnouncementTemplate } from '@/hooks/useAnnouncements';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { AiService } from '@/services/aiService';
import { useRef } from 'react';

interface AnnouncementComposerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    department: string;
    folderId?: string;
    folderName?: string;
    onSend: (data: {
        recipients: string[];
        subject: string;
        message: string;
        isScheduled: boolean;
        scheduled_for?: string;
        client_id?: string;
        sendDay?: number;
    }, provider: 'gmail' | 'outlook' | 'whatsapp') => Promise<void>;
    isInternalBulletin?: boolean;
    internalRecipients?: string[];
    showRecurringOptions?: boolean;
}

export function AnnouncementComposer({
    open,
    onOpenChange,
    department,
    folderId,
    folderName = 'Geral',
    onSend,
    isInternalBulletin = false,
    internalRecipients = [],
    showRecurringOptions = false
}: AnnouncementComposerProps) {
    const [to, setTo] = useState('');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [attachmentLink, setAttachmentLink] = useState('');
    const [isScheduled, setIsScheduled] = useState(false);
    const [scheduledDate, setScheduledDate] = useState('');
    const [scheduledTime, setScheduledTime] = useState('');
    const [sendDay, setSendDay] = useState(1);
    const [loading, setLoading] = useState(false);
    const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
    const [comboboxOpen, setComboboxOpen] = useState(false);
    
    // Filtros de Clientes
    const [filterRegimes, setFilterRegimes] = useState<string[]>([]);
    const [filterEmployees, setFilterEmployees] = useState<'all' | 'with' | 'without'>('all');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('active');
    const [searchQuery, setSearchQuery] = useState('');
    
    // Grupos de Clientes (LocalStorage)
    const [savedGroups, setSavedGroups] = useState<{id: string, name: string, ids: string[]}[]>([]);
    const [isGroupsManagerOpen, setIsGroupsManagerOpen] = useState(false);
    const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
    const [groupSearchQuery, setGroupSearchQuery] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    
    // Pre-fill for internal bulletins
    useEffect(() => {
        if (open && isInternalBulletin && internalRecipients.length > 0) {
            setTo(internalRecipients.join(', '));
            if (subject === '') {
                setSubject(`Boletim Interno - ${format(new Date(), 'dd/MM/yyyy')}`);
            }
        }
    }, [open, isInternalBulletin, internalRecipients]);
    
    const { clients } = useClients();
    const { templates, createTemplate } = useAnnouncements();

    const filteredTemplates = useMemo(() => 
        templates.filter(t => t.department === department || t.department === 'geral'),
    [templates, department]);

    const handleSaveAsTemplate = async () => {
        if (!subject || !message) {
            toast.error("Preencha assunto e mensagem para salvar como modelo.");
            return;
        }

        const name = prompt("Nome do modelo:");
        if (!name) return;

        await createTemplate({
            name,
            subject,
            content: message,
            department
        });
    };

    const [isAiProcessing, setIsAiProcessing] = useState(false);

    const handleApplyStyle = (styleType: 'align' | 'color' | 'size', value: string) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const selectedText = text.substring(start, end);

        if (!selectedText) {
            toast.warning("Selecione um texto para aplicar o estilo.");
            return;
        }

        let formatted = '';
        if (styleType === 'align') {
            formatted = `<div style="text-align: ${value};">${selectedText}</div>`;
        } else if (styleType === 'color') {
            formatted = `<span style="color: ${value};">${selectedText}</span>`;
        } else if (styleType === 'size') {
            formatted = `<span style="font-size: ${value};">${selectedText}</span>`;
        }

        const newMessage = text.substring(0, start) + formatted + text.substring(end);
        setMessage(newMessage);
    };

    const handleAiAction = async (action: 'refine' | 'summarize' | 'subject' | 'simplify') => {
        if (!message && action !== 'subject') {
            toast.warning("Escreva algo primeiro para a IA processar.");
            return;
        }

        setIsAiProcessing(true);
        try {
            const result = await AiService.refineAnnouncement(message, action);
            if (action === 'subject') {
                setSubject(result);
                toast.success("Assunto sugerido pela IA!");
            } else {
                setMessage(result);
                toast.success("Texto refinado pela IA!");
            }
        } catch (error: any) {
            toast.error("Erro na IA: " + error.message);
        } finally {
            setIsAiProcessing(false);
        }
    };

    const handleApplyFormatting = (type: 'bold' | 'link') => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const selectedText = text.substring(start, end);

        if (type === 'bold') {
            const formatted = `**${selectedText || 'texto negrito'}**`;
            const newMessage = text.substring(0, start) + formatted + text.substring(end);
            setMessage(newMessage);
        } else if (type === 'link') {
            const url = prompt('Digite a URL do link:');
            if (!url) return;
            const formatted = `<a href="${url}">${selectedText || 'Clique Aqui'}</a>`;
            const newMessage = text.substring(0, start) + formatted + text.substring(end);
            setMessage(newMessage);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const result = await AiService.uploadFile(file);
            const linkText = `\n\n<a href="${result.publicUrl}">Acesse O Documento - Clicando Aqui</a>`;
            setMessage(prev => prev + linkText);
            setAttachmentLink(result.publicUrl);
            toast.success("Documento anexado ao comunicado!");
        } catch (error: any) {
            toast.error("Erro ao fazer upload: " + error.message);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const replaceVariables = (text: string, client: any) => {
        if (!client) return text;
        const now = new Date();
        const variables: Record<string, string> = {
            '{{nome_fantasia}}': client.nomeFantasia || '',
            '{{razao_social}}': client.razaoSocial || '',
            '{{cnpj}}': client.cnpj || '',
            '{{mes_atual}}': format(now, 'MMMM', { locale: ptBR }),
            '{{ano_atual}}': format(now, 'yyyy'),
            '{{dia_atual}}': format(now, 'dd'),
        };

        let result = text;
        Object.entries(variables).forEach(([key, value]) => {
            result = result.replace(new RegExp(key, 'g'), value);
        });
        return result;
    };

    const handleApplyTemplate = (template: AnnouncementTemplate) => {
        setSubject(template.subject);
        setMessage(template.content);
        toast.info(`Modelo "${template.name}" aplicado.`);
    };

    const handleClientSelect = (clientId: string) => {
        if (clientId === "none") {
            setSelectedClientIds([]);
            setTo('');
            return;
        }

        if (clientId === "all") {
            const allIds = clients.map(c => c.id);
            setSelectedClientIds(allIds);
            return;
        }

        setSelectedClientIds(prev => {
            if (prev.includes(clientId)) {
                return prev.filter(id => id !== clientId);
            }
            return [...prev, clientId];
        });
    };
    // Clientes filtrados para a listagem/seleção em massa
    const filteredClients = useMemo(() => {
        return clients.filter(client => {
            const matchesRegime = filterRegimes.length === 0 || filterRegimes.includes(client.regimeTributario);
            const matchesEmployees = filterEmployees === 'all' || 
                (filterEmployees === 'with' && client.hasEmployees) || 
                (filterEmployees === 'without' && !client.hasEmployees);
            const matchesStatus = filterStatus === 'all' ||
                (filterStatus === 'active' && client.isActive) ||
                (filterStatus === 'inactive' && !client.isActive);
            
            // Adicionado filtro de busca manual
            const matchesSearch = searchQuery === '' || 
                client.nomeFantasia.toLowerCase().includes(searchQuery.toLowerCase()) ||
                client.cnpj.includes(searchQuery);

            return matchesRegime && matchesEmployees && matchesStatus && matchesSearch;
        });
    }, [clients, filterRegimes, filterEmployees, filterStatus, searchQuery]);

    const handleSelectAllFiltered = () => {
        const filteredIds = filteredClients.map(c => c.id);
        setSelectedClientIds(prev => {
            const newIds = [...new Set([...prev, ...filteredIds])];
            return newIds;
        });
        toast.success(`${filteredClients.length} clientes adicionados à seleção.`);
    };

    const handleDeselectAllFiltered = () => {
        const filteredIds = filteredClients.map(c => c.id);
        setSelectedClientIds(prev => prev.filter(id => !filteredIds.includes(id)));
        toast.success(`${filteredClients.length} clientes removidos da seleção.`);
    };

    // Lógica de Grupos de Clientes
    useEffect(() => {
        const saved = localStorage.getItem('announcement_client_groups');
        if (saved) {
            try {
                setSavedGroups(JSON.parse(saved));
            } catch (e) {
                console.error('Error parsing client groups', e);
            }
        }
    }, []);

    const handleLoadGroup = (ids: string[]) => {
        setSelectedClientIds(ids);
        toast.info("Seleção de grupo carregada.");
    };

    const handleDeleteGroup = (id: string) => {
        const newGroups = savedGroups.filter(g => g.id !== id);
        setSavedGroups(newGroups);
        localStorage.setItem('announcement_client_groups', JSON.stringify(newGroups));
        if (activeGroupId === id) setActiveGroupId(null);
        toast.info("Grupo removido.");
    };

    const handleCreateGroup = () => {
        const name = prompt("Nome para o novo grupo:");
        if (!name) return;
        const newGroup = { id: crypto.randomUUID(), name, ids: [] };
        const newGroups = [...savedGroups, newGroup];
        setSavedGroups(newGroups);
        localStorage.setItem('announcement_client_groups', JSON.stringify(newGroups));
        setActiveGroupId(newGroup.id);
        toast.success(`Grupo "${name}" criado!`);
    };

    const toggleClientInGroup = (groupId: string, clientId: string) => {
        const newGroups = savedGroups.map(g => {
            if (g.id === groupId) {
                const newIds = g.ids.includes(clientId) 
                    ? g.ids.filter(id => id !== clientId)
                    : [...g.ids, clientId];
                return { ...g, ids: newIds };
            }
            return g;
        });
        setSavedGroups(newGroups);
        localStorage.setItem('announcement_client_groups', JSON.stringify(newGroups));
    };

    // Update recipients when clients change
    useEffect(() => {
        const selectedClients = clients.filter(c => selectedClientIds.includes(c.id));
        const emails = selectedClients.map(c => c.email).filter(Boolean);
        setTo(emails.join(', '));
        
        if (selectedClientIds.length === 1 && subject === '') {
            setSubject(`Comunicado - ${selectedClients[0].nomeFantasia}`);
        }
    }, [selectedClientIds, clients]);

    const handleSend = async (provider: 'gmail' | 'outlook' | 'whatsapp') => {
        if ((!to && provider !== 'whatsapp') || !subject || !message) {
            toast.error("Por favor, preencha os campos obrigatórios.");
            return;
        }

        const recipients = to.split(/[;,]/).map(email => email.trim()).filter(email => email !== '');
        
        setLoading(true);
        try {
            // If multiple clients, we send individually or as one? 
            // The request says "Bulk Send", usually that means individual rascunhos if opening email, 
            // but for simplicity here we handle the first or all.
            
            const firstClientId = selectedClientIds[0];
            const firstClient = clients.find(c => c.id === firstClientId);
            
            let finalMessage = message;

            // Replace variables for the first client if single send
            if (selectedClientIds.length === 1 && firstClient) {
                finalMessage = replaceVariables(finalMessage, firstClient);
            }

            if (provider === 'whatsapp') {
                if (selectedClientIds.length === 0) {
                    toast.error("Selecione um cliente para enviar via WhatsApp.");
                    return;
                }
                
                const client = clients.find(c => c.id === selectedClientIds[0]);
                if (!client?.telefone) {
                    toast.error("Cliente não possui telefone cadastrado.");
                    return;
                }

                const cleanPhone = client.telefone.replace(/\D/g, '');
                const waUrl = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(finalMessage)}`;
                window.open(waUrl, '_blank');
                
                // Track it as sent
                await onSend({
                    recipients: [client.email],
                    subject,
                    message: finalMessage,
                    isScheduled,
                    scheduled_for: isScheduled ? `${scheduledDate}T${scheduledTime}:00` : undefined,
                    client_id: client.id
                }, 'whatsapp');
            } else {
                await onSend({
                    recipients,
                    subject,
                    message: finalMessage,
                    isScheduled,
                    scheduled_for: isScheduled ? `${scheduledDate}T${scheduledTime}:00` : undefined,
                    client_id: selectedClientIds.length === 1 ? selectedClientIds[0] : undefined,
                    sendDay: showRecurringOptions ? sendDay : undefined
                }, provider);
            }
            
            onOpenChange(false);
            // Reset
            setSelectedClientIds([]);
            setTo('');
            setSubject('');
            setMessage('');
            setAttachmentLink('');
            setIsScheduled(false);
        } catch (error) {
            console.error('Composer error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[95vw] w-full max-w-7xl bg-card border-none rounded-[2.5rem] p-0 overflow-hidden shadow-elevated animate-in fade-in zoom-in duration-300">
                {/* Header Premium */}
                <div className="bg-primary/[0.03] border-b border-border/40 p-8 pb-7 relative">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-5">
                            <div className="h-14 w-14 flex items-center justify-center rounded-2xl bg-white border border-border/50 shadow-sm transition-transform hover:scale-105 duration-500">
                                <Send className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-light tracking-tight text-foreground">
                                    Compor <span className="font-light text-primary">Comunicado</span>
                                </DialogTitle>
                                <div className="flex items-center gap-2 mt-1.5">
                                    <span className={cn(
                                        "px-3 py-1 rounded-full text-[11px] uppercase tracking-widest font-black border",
                                        department === 'fiscal' ? "bg-orange-500/10 text-orange-600 border-orange-500/20" :
                                        department === 'pessoal' ? "bg-blue-500/10 text-blue-600 border-blue-500/20" :
                                        department === 'contabil' ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                                        department === 'financeiro' ? "bg-purple-500/10 text-purple-600 border-purple-500/20" :
                                        department === 'boletim' ? "bg-red-500/10 text-red-600 border-red-500/20" :
                                        "bg-slate-500/10 text-slate-600 border-slate-500/20"
                                    )}>
                                        setor {department}
                                    </span>
                                    <span className="h-1 w-1 rounded-full bg-muted-foreground/30 mx-2" />
                                    <span className="text-xs text-muted-foreground stroke-black font-medium uppercase tracking-widest flex items-center gap-2">
                                        <Tags className="h-4 w-4 opacity-50" /> {folderName}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button 
                                onClick={handleSaveAsTemplate}
                                variant="ghost" 
                                className="rounded-xl gap-2 text-xs uppercase tracking-widest font-bold h-10 hover:bg-primary/5 text-muted-foreground hover:text-primary"
                            >
                                <LayoutTemplate className="h-4 w-4 opacity-40" /> Salvar Modelo
                            </Button>

                            {filteredTemplates.length > 0 && (
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="rounded-xl gap-2 text-xs uppercase tracking-widest font-bold h-10 border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary">
                                            <LayoutTemplate className="h-4 w-4" /> Modelos
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent align="end" className="w-64 p-2 rounded-2xl border-border/40 shadow-elevated">
                                        <div className="space-y-1">
                                            <p className="text-[10px] uppercase tracking-widest font-black text-muted-foreground px-2 py-1.5">Selecione um modelo</p>
                                            {filteredTemplates.map(template => (
                                                <button
                                                    key={template.id}
                                                    onClick={() => handleApplyTemplate(template)}
                                                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted text-xs font-light transition-all flex items-center justify-between group"
                                                >
                                                    {template.name}
                                                    <Check className="h-3 w-3 opacity-0 group-hover:opacity-40" />
                                                </button>
                                            ))}
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-8 space-y-7 max-h-[85vh] overflow-y-auto custom-scrollbar">
                    {/* Seleção de Cliente Searchable (Multi-select) */}
                    {!isInternalBulletin && (
                    <div className="space-y-4 bg-muted/20 p-6 rounded-3xl border border-border/50">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-primary" /> Clientes Selecionados ({selectedClientIds.length})
                            </Label>
                            
                            <div className="flex flex-wrap gap-2">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" size="sm" className="text-xs uppercase font-bold text-primary hover:bg-primary/5 border-primary/20 h-9 rounded-lg">
                                                <Users className="h-4 w-4 mr-1.5" /> Meus Grupos
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-64 p-2 rounded-xl border border-border/40 shadow-elevated">
                                            <p className="text-[10px] uppercase font-black text-muted-foreground px-2 py-2 mb-1 border-b border-border/10">Carregar Seleção</p>
                                            <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                                {savedGroups.map(g => (
                                                    <DropdownMenuItem 
                                                        key={g.id}
                                                        onClick={() => handleLoadGroup(g.ids)}
                                                        className="flex items-center justify-between text-xs py-2.5 cursor-pointer rounded-lg hover:bg-primary/5 group/g"
                                                    >
                                                        <span className="font-bold">{g.name}</span>
                                                        <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded opacity-50">{g.ids.length} cls</span>
                                                    </DropdownMenuItem>
                                                ))}
                                            </div>
                                            <div className="mt-2 pt-2 border-t border-border/10">
                                                <DropdownMenuItem 
                                                    onClick={() => setIsGroupsManagerOpen(true)}
                                                    className="justify-center text-[10px] py-2 cursor-pointer rounded-lg bg-primary/[0.03] text-primary font-black uppercase tracking-widest hover:bg-primary/5"
                                                >
                                                    Gerenciar Grupos
                                                </DropdownMenuItem>
                                            </div>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => setIsGroupsManagerOpen(true)}
                                    className="text-xs uppercase font-bold text-amber-600 hover:bg-amber-500/5 border-amber-500/20 h-9 rounded-lg"
                                >
                                    Novo Grupo
                                </Button>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => setSelectedClientIds([])}
                                    className="text-xs uppercase font-bold text-destructive hover:bg-destructive/5 border-destructive/20 h-9 rounded-lg"
                                >
                                    Limpar Tudo
                                </Button>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={handleSelectAllFiltered}
                                    className="text-xs uppercase font-bold text-primary hover:bg-primary/5 border-primary/20 h-9 rounded-lg"
                                >
                                    Adicionar Filtrados ({filteredClients.length})
                                </Button>
                            </div>
                        </div>

                        {/* Painel de Filtros */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 bg-card rounded-2xl border border-border/40 shadow-sm">
                            <div className="space-y-3">
                                <Label className="text-xs uppercase font-black text-muted-foreground opacity-60">Regime Tributário</Label>
                                <div className="flex flex-wrap gap-2">
                                    {['simples', 'presumido', 'real', 'domestico'].map(r => (
                                        <button
                                            key={r}
                                            onClick={() => setFilterRegimes(prev => 
                                                prev.includes(r) ? prev.filter(item => item !== r) : [...prev, r]
                                            )}
                                            className={cn(
                                                "px-3 py-1.5 rounded-lg text-[11px] font-black uppercase border transition-all",
                                                filterRegimes.includes(r) 
                                                    ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" 
                                                    : "bg-muted text-muted-foreground border-border/50 opacity-50 hover:opacity-100"
                                            )}
                                        >
                                            {r}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="space-y-3">
                                <Label className="text-xs uppercase font-black text-muted-foreground opacity-60">Funcionários</Label>
                                <div className="flex gap-2">
                                    {[
                                        { id: 'all', label: 'Todos' },
                                        { id: 'with', label: 'Com' },
                                        { id: 'without', label: 'Sem' }
                                    ].map(f => (
                                        <button
                                            key={f.id}
                                            onClick={() => setFilterEmployees(f.id as any)}
                                            className={cn(
                                                "px-3 py-1.5 rounded-lg text-[11px] font-black uppercase border transition-all",
                                                filterEmployees === f.id 
                                                    ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" 
                                                    : "bg-muted text-muted-foreground border-border/50 opacity-50 hover:opacity-100"
                                            )}
                                        >
                                            {f.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-xs uppercase font-black text-muted-foreground opacity-60">Status</Label>
                                <div className="flex gap-2">
                                    {[
                                        { id: 'all', label: 'Geral' },
                                        { id: 'active', label: 'Ativos' },
                                        { id: 'inactive', label: 'Inativos' }
                                    ].map(s => (
                                        <button
                                            key={s.id}
                                            onClick={() => setFilterStatus(s.id as any)}
                                            className={cn(
                                                "px-3 py-1.5 rounded-lg text-[11px] font-black uppercase border transition-all",
                                                filterStatus === s.id 
                                                    ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" 
                                                    : "bg-muted text-muted-foreground border-border/50 opacity-50 hover:opacity-100"
                                            )}
                                        >
                                            {s.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-2.5 py-2 max-h-32 overflow-y-auto custom-scrollbar">
                            {selectedClientIds.map(id => {
                                const client = clients.find(c => c.id === id);
                                return (
                                    <Badge key={id} variant="secondary" className="pl-4 pr-1 py-1.5 rounded-xl bg-primary/10 text-primary border-primary/20 animate-in fade-in zoom-in duration-200">
                                        <span className="text-xs font-black">{client?.nomeFantasia}</span>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-4 w-4 ml-1 hover:bg-transparent hover:text-destructive"
                                            onClick={() => handleClientSelect(id)}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </Badge>
                                );
                            })}
                            {selectedClientIds.length === 0 && (
                                <p className="text-[10px] text-muted-foreground italic opacity-50">Nenhum cliente selecionado...</p>
                            )}
                        </div>

                        {/* Pesquisa Manual Integrada */}
                        <div className="space-y-4 pt-4 border-t border-border/20">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground opacity-40" />
                                <input
                                    type="text"
                                    placeholder="Comece a digitar para pesquisar clientes por nome ou CNPJ..."
                                    className="w-full h-14 pl-12 pr-4 rounded-2xl border border-border/50 bg-white text-base font-medium shadow-sm focus:ring-4 focus:ring-primary/5 focus:border-primary/40 transition-all outline-none"
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        if (e.target.value.length > 0) setComboboxOpen(true);
                                        else setComboboxOpen(false);
                                    }}
                                    onFocus={() => { if (searchQuery.length > 0) setComboboxOpen(true); }}
                                />
                                {searchQuery && (
                                    <button 
                                        onClick={() => { setSearchQuery(''); setComboboxOpen(false); }}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-muted rounded-full transition-colors"
                                    >
                                        <X className="h-4 w-4 text-muted-foreground" />
                                    </button>
                                )}
                            </div>

                            {/* Resultados da Pesquisa Integrados (não Popover) */}
                            {comboboxOpen && (
                                <div className="bg-white rounded-3xl border border-border/40 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="max-h-[350px] overflow-y-auto custom-scrollbar p-2">
                                        {filteredClients.length === 0 ? (
                                            <div className="py-12 text-center text-sm text-muted-foreground font-medium uppercase tracking-[0.2em] opacity-40">Nenhum cliente encontrado...</div>
                                        ) : (
                                            <div className="grid grid-cols-1 gap-1">
                                                {filteredClients.map((client) => {
                                                    const isSelected = selectedClientIds.includes(client.id);
                                                    return (
                                                        <button
                                                            key={client.id}
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                handleClientSelect(client.id);
                                                            }}
                                                            className={cn(
                                                                "w-full text-left flex items-center justify-between p-4 rounded-2xl transition-all border border-transparent group",
                                                                isSelected ? "bg-primary/5 border-primary/20" : "hover:bg-muted/50 hover:border-border/30"
                                                            )}
                                                        >
                                                            <div className="flex items-center gap-4 min-w-0">
                                                                <div className={cn(
                                                                    "h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all",
                                                                    isSelected ? "bg-primary border-primary" : "border-border/60 group-hover:border-primary/40"
                                                                )}>
                                                                    {isSelected && <Check className="h-3.5 w-3.5 text-white" />}
                                                                </div>
                                                                <div className="flex flex-col gap-1 min-w-0">
                                                                    <span className="font-black text-foreground text-lg truncate leading-tight">{client.nomeFantasia}</span>
                                                                    <div className="flex items-center gap-3">
                                                                        <span className="text-xs opacity-50 uppercase font-black text-muted-foreground">{client.cnpj}</span>
                                                                        <span className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground uppercase font-black tracking-widest leading-none">{client.regimeTributario}</span>
                                                                        {client.hasEmployees && <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 uppercase font-black tracking-widest leading-none">Com Func</span>}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {!isSelected && (
                                                                <span className="text-[10px] uppercase font-black text-primary opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap px-4 py-2 bg-primary/5 rounded-full">Selecionar</span>
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    )}

                    {/* Destinatários e Assunto */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2 ml-1">
                                <Mail className="h-4 w-4 text-primary" /> Destinatários
                            </Label>
                            <Input
                                placeholder="E-mails (separados por vírgula)..."
                                value={to}
                                onChange={(e) => setTo(e.target.value)}
                                className="h-14 rounded-xl border-border/50 bg-muted/20 text-base font-light transition-all px-5"
                            />
                        </div>

                        <div className="space-y-3">
                            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2 ml-1">
                                <MessageSquare className="h-4 w-4 text-primary" /> Assunto do Comunicado
                            </Label>
                            <Input
                                placeholder="Título do informativo..."
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                className="h-14 rounded-xl border-border/50 bg-muted/20 text-base font-light transition-all px-5"
                            />
                        </div>
                    </div>

                    {showRecurringOptions && (
                        <div className="bg-primary/5 p-6 rounded-3xl border border-primary/10 animate-in fade-in slide-in-from-top-2 duration-500">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <Label className="text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-2 ml-1">
                                        <Clock className="h-4 w-4" /> Agendamento Mensal
                                    </Label>
                                    <p className="text-[10px] text-muted-foreground ml-7 uppercase tracking-wider">O e-mail será disparado todo mês no dia escolhido</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex flex-col items-end gap-1.5">
                                        <span className="text-[10px] uppercase font-black text-muted-foreground/60 tracking-widest">Dia do Mês</span>
                                        <input 
                                            type="number" 
                                            min="1" 
                                            max="31"
                                            value={sendDay}
                                            onChange={(e) => setSendDay(parseInt(e.target.value) || 1)}
                                            className="h-12 w-20 rounded-xl border border-primary/20 bg-white text-center font-bold text-primary text-lg focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Mensagem e Placeholders */}
                    <div className="space-y-2 relative">
                        <div className="flex items-center justify-between ml-1">
                            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                <History className="h-4 w-4 text-primary" /> Conteúdo do Comunicado
                            </Label>
                            <div className="flex items-center gap-4">
                            <div className="flex items-center gap-3">
                                {/* AI Toolbar */}
                                <div className="flex items-center bg-primary/5 rounded-xl p-1 border border-primary/20">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="h-10 px-4 gap-2 text-[10px] uppercase tracking-widest font-black text-primary hover:bg-primary/10"
                                                disabled={isAiProcessing}
                                            >
                                                {isAiProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                                                Refinar com IA
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-64 rounded-2xl border-border/40 shadow-elevated p-2">
                                            <DropdownMenuItem onClick={() => handleAiAction('refine')} className="text-xs py-3 gap-3 cursor-pointer rounded-xl">
                                                <Wand2 className="h-5 w-5 text-primary" /> Refinar Tom Profissional
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleAiAction('subject')} className="text-xs py-3 gap-3 cursor-pointer rounded-xl">
                                                <MessageSquare className="h-5 w-5 text-primary" /> Gerar Assunto Criativo
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleAiAction('simplify')} className="text-xs py-3 gap-3 cursor-pointer rounded-xl">
                                                <TextCursor className="h-5 w-5 text-primary" /> Sem Termos Técnicos
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleAiAction('summarize')} className="text-xs py-3 gap-3 cursor-pointer rounded-xl">
                                                <LayoutTemplate className="h-5 w-5 text-primary" /> Resumir para o Cliente
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                {/* Rich Text Toolbar */}
                                <div className="flex items-center bg-muted/30 rounded-lg p-0.5 border border-border/40">
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-7 w-7 rounded-md hover:bg-card"
                                        onClick={() => handleApplyFormatting('bold')}
                                        title="Negrito"
                                    >
                                        <Bold className="h-3.5 w-3.5" />
                                    </Button>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-card" title="Alinhamento">
                                                <AlignLeft className="h-3.5 w-3.5" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="min-w-[40px] p-1 rounded-lg">
                                            <DropdownMenuItem onClick={() => handleApplyStyle('align', 'left')} className="p-1.5 cursor-pointer"><AlignLeft className="h-3.5 w-3.5" /></DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleApplyStyle('align', 'center')} className="p-1.5 cursor-pointer"><AlignCenter className="h-3.5 w-3.5" /></DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleApplyStyle('align', 'right')} className="p-1.5 cursor-pointer"><AlignRight className="h-3.5 w-3.5" /></DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-card" title="Cor e Fonte">
                                                <Palette className="h-3.5 w-3.5" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="p-2 grid grid-cols-4 gap-1 rounded-lg">
                                            {['#EA4335', '#007bff', '#28a745', '#1a1a1a', '#ffc107', '#6f42c1', '#fd7e14', '#20c997'].map(color => (
                                                <div 
                                                    key={color} 
                                                    onClick={() => handleApplyStyle('color', color)}
                                                    className="w-6 h-6 rounded-full cursor-pointer hover:scale-110 transition-transform border border-border/40"
                                                    style={{ backgroundColor: color }}
                                                />
                                            ))}
                                            <DropdownMenuItem onClick={() => handleApplyStyle('size', '18px')} className="col-span-4 text-[10px] py-1 text-center cursor-pointer">Fonte Grande</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleApplyStyle('size', '12px')} className="col-span-4 text-[10px] py-1 text-center cursor-pointer">Fonte Pequena</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>

                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-7 w-7 rounded-md hover:bg-card"
                                        onClick={() => handleApplyFormatting('link')}
                                        title="Inserir Link"
                                    >
                                        <LinkIcon className="h-3.5 w-3.5" />
                                    </Button>
                                    <div className="w-[1px] h-4 bg-border/40 mx-0.5" />
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-7 w-7 rounded-md hover:bg-card"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isUploading}
                                        title="Anexar Imagem/Arquivo"
                                    >
                                        {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageIcon className="h-3.5 w-3.5" />}
                                    </Button>
                                    <input 
                                        type="file" 
                                        ref={fileInputRef}
                                        onChange={handleFileUpload}
                                        className="hidden"
                                        accept="image/*,application/pdf"
                                    />
                                </div>
                                <div className="hidden sm:flex gap-2 ml-2">
                                    <Badge variant="outline" className="text-[8px] py-0 cursor-help opacity-40 hover:opacity-100" title="Substitui pelo nome fantástico do cliente">{"{{nome_fantasia}}"}</Badge>
                                </div>
                            </div>
                            </div>
                        </div>
                        <Textarea
                            ref={textareaRef}
                            placeholder="Escreva aqui seu comunicado. Use **texto** para negrito e o botão de link para URLs..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="min-h-[400px] rounded-3xl border-border/50 bg-muted/10 text-lg font-light p-8 resize-none transition-all leading-relaxed shadow-inner"
                        />
                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t border-border/40">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            className="rounded-2xl font-bold text-xs uppercase tracking-widest px-10 h-14 text-muted-foreground hover:bg-muted"
                        >
                            Cancelar
                        </Button>
                        
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                            {!isScheduled ? (
                                <>
                                    <Button
                                        type="button"
                                        disabled={loading || isUploading}
                                        onClick={() => handleSend('whatsapp')}
                                        className="flex-1 sm:flex-none rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-xl shadow-emerald-500/20 border-none font-bold text-xs uppercase tracking-widest px-8 h-14 transition-all active:scale-95 gap-3"
                                    >
                                        <Phone className="h-5 w-5" /> WhatsApp
                                    </Button>
                                    <Button
                                        type="button"
                                        disabled={loading || isUploading}
                                        onClick={() => handleSend('gmail')}
                                        className="flex-1 sm:flex-none rounded-2xl bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 border-none font-bold text-xs uppercase tracking-widest px-12 h-14 transition-all active:scale-95 gap-3"
                                    >
                                        <Mail className="h-5 w-5" /> Enviar E-mail
                                    </Button>
                                </>
                            ) : (
                                <Button
                                    type="button"
                                    disabled={loading || isUploading}
                                    onClick={() => handleSend('gmail')}
                                    className="w-full sm:w-auto rounded-2xl bg-amber-500 hover:bg-amber-600 text-white shadow-xl shadow-amber-500/20 border-none font-bold text-xs uppercase tracking-widest px-12 h-14 transition-all active:scale-95 gap-3"
                                >
                                    <CalendarIcon className="h-5 w-5" /> Confirmar Agendamento
                                </Button>
                            )}
                        </div>
                    </div>
     </div>
                </div>
            </DialogContent>

            {/* Gerenciador de Grupos - Dialog Interno */}
            <Dialog open={isGroupsManagerOpen} onOpenChange={setIsGroupsManagerOpen}>
                <DialogContent className="max-w-7xl w-[95vw] bg-card border-none rounded-[3rem] p-0 overflow-hidden shadow-elevated z-[9999] animate-in fade-in zoom-in duration-300">
                    <div className="flex h-[85vh]">
                        {/* Sidebar: Lista de Grupos */}
                        <div className="w-72 border-r border-border/40 bg-muted/10 p-6 flex flex-col gap-6">
                            <div className="space-y-1">
                                <h3 className="text-lg font-light text-foreground">Meus Grupos</h3>
                                <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest opacity-60">Gerencie suas listas fixas</p>
                            </div>

                            <Button onClick={handleCreateGroup} className="w-full rounded-xl gap-2 font-bold text-xs uppercase tracking-widest h-12 shadow-primary/10">
                                <Plus className="h-4 w-4" /> Novo Grupo
                            </Button>

                            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1.5 pr-2">
                                {savedGroups.map(g => (
                                    <button
                                        key={g.id}
                                        onClick={() => setActiveGroupId(g.id)}
                                        className={cn(
                                            "w-full text-left px-4 py-3 rounded-xl transition-all group relative",
                                            activeGroupId === g.id 
                                                ? "bg-primary text-white shadow-lg shadow-primary/20" 
                                                : "hover:bg-primary/5 text-muted-foreground hover:text-primary"
                                        )}
                                    >
                                        <div className="flex flex-col">
                                            <span className="font-bold text-sm truncate pr-6">{g.name}</span>
                                            <span className={cn("text-[9px] uppercase tracking-widest font-black opacity-60", activeGroupId === g.id && "text-white")}>
                                                {g.ids.length} clientes
                                            </span>
                                        </div>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            onClick={(e) => { e.stopPropagation(); handleDeleteGroup(g.id); }}
                                            className={cn("absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 opacity-0 group-hover:opacity-100", activeGroupId === g.id ? "text-white hover:bg-white/10" : "text-destructive hover:bg-destructive/5")}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Área Principal: Vinculação de Clientes */}
                        <div className="flex-1 p-8 flex flex-col gap-6 bg-card relative">
                            {activeGroupId ? (
                                <>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h2 className="text-2xl font-light text-foreground">
                                                Editando: <span className="font-bold text-primary">{savedGroups.find(g => g.id === activeGroupId)?.name}</span>
                                            </h2>
                                            <Badge variant="outline" className="text-xs px-3 py-1 rounded-full border-primary/20 text-primary font-black uppercase tracking-widest">
                                                {savedGroups.find(g => g.id === activeGroupId)?.ids.length} Clientes Vinculados
                                            </Badge>
                                        </div>
                                        
                                        <div className="relative">
                                            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground opacity-40" />
                                            <input
                                                type="text"
                                                placeholder="Pesquisar clientes para vincular a este grupo..."
                                                className="w-full h-14 pl-12 pr-4 rounded-2xl border border-border/40 bg-muted/10 text-base font-medium focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                                                value={groupSearchQuery}
                                                onChange={(e) => setGroupSearchQuery(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                                        <div className="grid grid-cols-1 gap-1.5">
                                            {clients
                                                .filter(c => c.isActive && (groupSearchQuery === '' || c.nomeFantasia.toLowerCase().includes(groupSearchQuery.toLowerCase()) || c.cnpj.includes(groupSearchQuery)))
                                                .map(client => {
                                                    const group = savedGroups.find(g => g.id === activeGroupId);
                                                    const isChecked = group?.ids.includes(client.id);
                                                    return (
                                                        <button
                                                            key={client.id}
                                                            onClick={() => toggleClientInGroup(activeGroupId, client.id)}
                                                            className={cn(
                                                                "flex items-center justify-between p-4 rounded-2xl transition-all border group",
                                                                isChecked ? "bg-primary/5 border-primary/30" : "bg-card border-border/40 hover:border-primary/20 hover:bg-primary/[0.02]"
                                                            )}
                                                        >
                                                            <div className="flex items-center gap-4 min-w-0">
                                                                <div className={cn(
                                                                    "h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all",
                                                                    isChecked ? "bg-primary border-primary" : "border-border/60 group-hover:border-primary/40"
                                                                )}>
                                                                    {isChecked && <Check className="h-3.5 w-3.5 text-white" />}
                                                                </div>
                                                                <div className="flex flex-col text-left">
                                                                    <span className="font-bold text-foreground text-sm truncate">{client.nomeFantasia}</span>
                                                                    <span className="text-[10px] opacity-40 font-black uppercase tracking-widest">{client.cnpj}</span>
                                                                </div>
                                                            </div>
                                                            {isChecked ? (
                                                                <span className="text-[9px] uppercase font-black text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">Vinculado</span>
                                                            ) : (
                                                                <span className="text-[9px] uppercase font-black text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">Vincular</span>
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                        </div>
                                    </div>
                                    
                                    <div className="pt-4 border-t border-border/10 flex justify-end">
                                        <Button onClick={() => setIsGroupsManagerOpen(false)} className="rounded-xl px-8 font-bold text-xs uppercase tracking-widest h-12">
                                            Pronto
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-center p-12 gap-6 animate-in fade-in zoom-in duration-500">
                                    <div className="h-24 w-24 rounded-full bg-primary/5 flex items-center justify-center border border-primary/10">
                                        <Users className="h-10 w-10 text-primary opacity-30" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-light text-foreground">Gerencie seus Grupos</h3>
                                        <p className="text-sm text-muted-foreground font-light max-w-xs mx-auto">
                                            Crie listas fixas de clientes para facilitar seus envios recorrentes. Selecione um grupo à esquerda para começar a vincular clientes.
                                        </p>
                                    </div>
                                    <Button onClick={handleCreateGroup} variant="outline" className="rounded-xl border-primary/20 text-primary uppercase font-black text-[10px] px-8 tracking-widest h-12 hover:bg-primary/5">
                                        Começar agora
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </Dialog>
    );
}

