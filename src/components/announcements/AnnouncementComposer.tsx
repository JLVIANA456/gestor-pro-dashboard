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
    Send, 
    Mail, 
    Calendar as CalendarIcon, 
    Clock, 
    Info, 
    History,
    X,
    MessageSquare,
    Tags,
    Phone,
    Paperclip,
    LayoutTemplate,
    UserPlus,
    Trash2,
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { useClients } from '@/hooks/useClients';
import { useAnnouncements, AnnouncementTemplate } from '@/hooks/useAnnouncements';
import { Search, Building2, Check, ChevronsUpDown } from 'lucide-react';
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
import { Badge } from "@/components/ui/badge";

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
    }, provider: 'gmail' | 'outlook' | 'whatsapp') => Promise<void>;
}

export function AnnouncementComposer({
    open,
    onOpenChange,
    department,
    folderId,
    folderName = 'Geral',
    onSend
}: AnnouncementComposerProps) {
    const [to, setTo] = useState('');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [attachmentLink, setAttachmentLink] = useState('');
    const [isScheduled, setIsScheduled] = useState(false);
    const [scheduledDate, setScheduledDate] = useState('');
    const [scheduledTime, setScheduledTime] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
    const [comboboxOpen, setComboboxOpen] = useState(false);
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

        setSelectedClientIds(prev => {
            if (prev.includes(clientId)) {
                return prev.filter(id => id !== clientId);
            }
            return [...prev, clientId];
        });
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
            if (attachmentLink) {
                finalMessage += `\n\nLink do documento: ${attachmentLink}`;
            }

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
                    client_id: selectedClientIds.length === 1 ? selectedClientIds[0] : undefined
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
            <DialogContent className="max-w-3xl bg-card border-none rounded-[2.5rem] p-0 overflow-hidden shadow-elevated animate-in fade-in zoom-in duration-300">
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
                                        "px-3 py-0.5 rounded-full text-[9px] uppercase tracking-widest font-bold border",
                                        department === 'fiscal' ? "bg-orange-500/5 text-orange-600 border-orange-500/10" :
                                        department === 'pessoal' ? "bg-blue-500/5 text-blue-600 border-blue-500/10" :
                                        department === 'contabil' ? "bg-emerald-500/5 text-emerald-600 border-emerald-500/10" :
                                        department === 'financeiro' ? "bg-purple-500/5 text-purple-600 border-purple-500/10" :
                                        "bg-slate-500/5 text-slate-600 border-slate-500/10"
                                    )}>
                                        setor {department}
                                    </span>
                                    <span className="h-1 w-1 rounded-full bg-muted-foreground/30 mx-1" />
                                    <span className="text-[10px] text-muted-foreground font-light uppercase tracking-widest flex items-center gap-1.5">
                                        <Tags className="h-3 w-3 opacity-50" /> {folderName}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button 
                                onClick={handleSaveAsTemplate}
                                variant="ghost" 
                                className="rounded-xl gap-2 text-[10px] uppercase tracking-widest font-light h-10 hover:bg-primary/5 text-muted-foreground hover:text-primary"
                            >
                                <LayoutTemplate className="h-4 w-4 opacity-40" /> Salvar Modelo
                            </Button>

                            {filteredTemplates.length > 0 && (
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="rounded-xl gap-2 text-[10px] uppercase tracking-widest font-light h-10 border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary">
                                            <LayoutTemplate className="h-4 w-4" /> Modelos
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent align="end" className="w-64 p-2 rounded-2xl border-border/40 shadow-elevated">
                                        <div className="space-y-1">
                                            <p className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground px-2 py-1">Selecione um modelo</p>
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

                <div className="p-8 space-y-7 max-h-[75vh] overflow-y-auto custom-scrollbar">
                    {/* Seleção de Cliente Searchable (Multi-select) */}
                    <div className="space-y-3">
                        <Label className="text-[10px] font-normal text-muted-foreground uppercase tracking-widest flex items-center gap-2 ml-1">
                            <Building2 className="h-3 w-3 opacity-40 text-primary" /> Clientes Vínculados ({selectedClientIds.length})
                        </Label>
                        
                        <div className="flex flex-wrap gap-2 mb-2">
                            {selectedClientIds.map(id => {
                                const client = clients.find(c => c.id === id);
                                return (
                                    <Badge key={id} variant="secondary" className="pl-3 pr-1 py-1 rounded-lg bg-primary/10 text-primary border-primary/20 animate-in fade-in zoom-in duration-200">
                                        <span className="text-[10px] font-medium">{client?.nomeFantasia}</span>
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
                        </div>

                        <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={comboboxOpen}
                                    className="w-full justify-between h-11 rounded-xl border-border/50 bg-muted/20 text-sm font-light transition-all focus:border-primary/30 hover:bg-muted/30 px-3"
                                >
                                    <span className="flex items-center gap-2">
                                        <UserPlus className="h-4 w-4 opacity-40" />
                                        {selectedClientIds.length > 0 ? `${selectedClientIds.length} selecionados...` : "Selecionar clientes..."}
                                    </span>
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-2xl border-border/40 shadow-elevated overflow-hidden" align="start">
                                <Command>
                                    <CommandInput placeholder="Buscar empresa por nome ou CNPJ..." className="h-11 border-none focus:ring-0 text-sm font-light" />
                                    <CommandList className="max-h-[300px] overflow-y-auto custom-scrollbar">
                                        <CommandEmpty className="py-6 text-center text-xs text-muted-foreground font-light">Nenhuma empresa encontrada.</CommandEmpty>
                                        <CommandGroup>
                                            <CommandItem
                                                value="none"
                                                onSelect={() => handleClientSelect("none")}
                                                className="text-xs font-light py-2.5 px-3 cursor-pointer hover:bg-destructive/5 text-destructive rounded-lg m-1"
                                            >
                                                Limpar seleção
                                            </CommandItem>
                                            {clients.map((client) => (
                                                <CommandItem
                                                    key={client.id}
                                                    value={`${client.nomeFantasia} ${client.cnpj}`}
                                                    onSelect={() => handleClientSelect(client.id)}
                                                    className="text-xs font-light py-2.5 px-3 cursor-pointer hover:bg-primary/5 rounded-lg m-1"
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4 text-primary",
                                                            selectedClientIds.includes(client.id) ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-foreground">{client.nomeFantasia}</span>
                                                        <span className="text-[10px] opacity-50 uppercase tracking-tighter">{client.cnpj}</span>
                                                    </div>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Destinatários e Assunto */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-normal text-muted-foreground uppercase tracking-widest flex items-center gap-2 ml-1">
                                <Mail className="h-3 w-3 opacity-40 text-primary" /> Destinatários
                            </Label>
                            <Input
                                placeholder="E-mails..."
                                value={to}
                                onChange={(e) => setTo(e.target.value)}
                                className="h-11 rounded-xl border-border/50 bg-muted/20 text-sm font-light transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-normal text-muted-foreground uppercase tracking-widest flex items-center gap-2 ml-1">
                                <MessageSquare className="h-3 w-3 opacity-40 text-primary" /> Assunto
                            </Label>
                            <Input
                                placeholder="Título do informativo..."
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                className="h-11 rounded-xl border-border/50 bg-muted/20 text-sm font-light transition-all"
                            />
                        </div>
                    </div>

                    {/* Mensagem e Placeholders */}
                    <div className="space-y-2 relative">
                        <div className="flex items-center justify-between ml-1">
                            <Label className="text-[10px] font-normal text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                <History className="h-3 w-3 opacity-40 text-primary" /> Conteúdo
                            </Label>
                            <div className="flex gap-2">
                                <Badge variant="outline" className="text-[8px] py-0 cursor-help opacity-40 hover:opacity-100" title="Substitui pelo nome fantástico do cliente">{"{{nome_fantasia}}"}</Badge>
                                <Badge variant="outline" className="text-[8px] py-0 cursor-help opacity-40 hover:opacity-100" title="Substitui pelo mês atual">{"{{mes_atual}}"}</Badge>
                            </div>
                        </div>
                        <Textarea
                            placeholder="Escreva aqui seu comunicado..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="min-h-[180px] rounded-2xl border-border/50 bg-muted/10 text-sm font-light p-5 resize-none transition-all leading-relaxed shadow-inner"
                        />
                    </div>

                    {/* Anexo Link */}
                    <div className="space-y-2">
                        <Label className="text-[10px] font-normal text-muted-foreground uppercase tracking-widest flex items-center gap-2 ml-1">
                            <Paperclip className="h-3 w-3 opacity-40 text-primary" /> Link de Documento / Anexo
                        </Label>
                        <Input
                            placeholder="https://drive.google.com/..."
                            value={attachmentLink}
                            onChange={(e) => setAttachmentLink(e.target.value)}
                            className="h-11 rounded-xl border-border/50 bg-muted/20 text-sm font-light transition-all"
                        />
                    </div>

                    {/* Agendamento */}
                    <div className={cn(
                        "p-6 rounded-2xl border transition-all duration-500",
                        isScheduled 
                            ? "bg-amber-500/5 border-amber-500/20 shadow-sm" 
                            : "bg-muted/10 border-border/40"
                    )}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "h-10 w-10 rounded-xl flex items-center justify-center border transition-all",
                                    isScheduled ? "bg-amber-500/20 border-amber-500/20" : "bg-card border-border/50"
                                )}>
                                    <Clock className={cn("h-4.5 w-4.5", isScheduled ? "text-amber-600" : "text-muted-foreground/40")} />
                                </div>
                                <div className="space-y-0.5">
                                    <Label className="text-xs font-semibold tracking-tight text-foreground">Programar Envio</Label>
                                    <p className="text-[10px] text-muted-foreground font-light uppercase tracking-widest">Agendar para data futura</p>
                                </div>
                            </div>
                            <Switch
                                checked={isScheduled}
                                onCheckedChange={setIsScheduled}
                                className="data-[state=checked]:bg-amber-500"
                            />
                        </div>

                        {isScheduled && (
                            <div className="grid grid-cols-2 gap-4 pt-6 animate-in fade-in slide-in-from-top-3">
                                <div className="space-y-1.5">
                                    <Label className="text-[9px] uppercase tracking-widest font-bold opacity-40 ml-1">Data</Label>
                                    <Input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} className="h-10 bg-card rounded-xl border-border/50 text-xs font-light" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[9px] uppercase tracking-widest font-bold opacity-40 ml-1">Horário</Label>
                                    <Input type="time" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} className="h-10 bg-card rounded-xl border-border/50 text-xs font-light" />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border/40">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            className="rounded-xl font-light text-[10px] uppercase tracking-widest px-8 h-12 text-muted-foreground hover:bg-muted"
                        >
                            Cancelar
                        </Button>
                        
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            {!isScheduled ? (
                                <>
                                    <Button
                                        type="button"
                                        disabled={loading}
                                        onClick={() => handleSend('whatsapp')}
                                        className="flex-1 sm:flex-none rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 border-none font-light text-[10px] uppercase tracking-widest px-6 h-12 transition-all active:scale-95 gap-2"
                                    >
                                        <Phone className="h-4 w-4" /> WhatsApp
                                    </Button>
                                    <Button
                                        type="button"
                                        disabled={loading}
                                        onClick={() => handleSend('gmail')}
                                        className="flex-1 sm:flex-none rounded-xl bg-white hover:bg-red-50 text-[#EA4335] border border-red-500/20 shadow-sm font-light text-[10px] uppercase tracking-widest px-6 h-12 transition-all active:scale-95 gap-2"
                                    >
                                        <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
                                            <span className="text-[8px] font-bold text-white">G</span>
                                        </div>
                                        Gmail
                                    </Button>
                                    <Button
                                        type="button"
                                        disabled={loading}
                                        onClick={() => handleSend('outlook')}
                                        className="flex-1 sm:flex-none rounded-xl bg-white hover:bg-blue-50 text-[#0078D4] border border-blue-500/20 shadow-sm font-light text-[10px] uppercase tracking-widest px-6 h-12 transition-all active:scale-95 gap-2"
                                    >
                                        <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                                            <span className="text-[8px] font-bold text-white">O</span>
                                        </div>
                                        Outlook
                                    </Button>
                                </>
                            ) : (
                                <Button
                                    type="button"
                                    disabled={loading}
                                    onClick={() => handleSend('gmail')}
                                    className="w-full sm:w-auto rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20 border-none font-light text-[10px] uppercase tracking-widest px-10 h-12 transition-all active:scale-95 gap-2"
                                >
                                    <CalendarIcon className="h-4 w-4" /> Confirmar Agendamento
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
