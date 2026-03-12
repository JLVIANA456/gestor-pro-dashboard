import { useState } from 'react';
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
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { useClients } from '@/hooks/useClients';
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
    }, provider: 'gmail' | 'outlook') => Promise<void>;
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
    const [isScheduled, setIsScheduled] = useState(false);
    const [scheduledDate, setScheduledDate] = useState('');
    const [scheduledTime, setScheduledTime] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedClientId, setSelectedClientId] = useState<string>('');
    const [comboboxOpen, setComboboxOpen] = useState(false);
    const { clients } = useClients();

    const handleClientSelect = (clientId: string) => {
        const id = clientId === "none" ? "" : clientId;
        setSelectedClientId(id);
        setComboboxOpen(false);
        
        if (id) {
            const client = clients.find(c => c.id === id);
            if (client) {
                setTo(client.email);
                if (subject === '') {
                    setSubject(`Comunicado - ${client.nomeFantasia}`);
                }
            }
        }
    };

    const handleSend = async (provider: 'gmail' | 'outlook') => {
        if (!to || !subject || !message) {
            toast.error("Por favor, preencha todos os campos obrigatórios.");
            return;
        }

        const recipients = to.split(/[;,]/).map(email => email.trim()).filter(email => email !== '');
        if (recipients.length === 0) {
            toast.error("Nenhum e-mail válido encontrado.");
            return;
        }

        setLoading(true);
        try {
            await onSend({
                recipients,
                subject,
                message,
                isScheduled,
                scheduled_for: isScheduled ? `${scheduledDate}T${scheduledTime}:00` : undefined,
                client_id: selectedClientId || undefined
            }, provider);
            
            // Success handling is done in parent, but we close on success
            onOpenChange(false);
            // Clear fields
            setTo('');
            setSubject('');
            setMessage('');
            setIsScheduled(false);
        } catch (error) {
            console.error('Composer error:', error);
        } finally {
            setLoading(false);
        }
    };    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl bg-card border-none rounded-[2.5rem] p-0 overflow-hidden shadow-elevated animate-in fade-in zoom-in duration-300">
                {/* Header Premium */}
                <div className="bg-primary/[0.03] border-b border-border/40 p-8 pb-7 relative">
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
                </div>

                <div className="p-8 space-y-7 max-h-[80vh] overflow-y-auto custom-scrollbar">
                    {/* Seleção de Cliente Searchable */}
                    <div className="space-y-2">
                        <Label className="text-[10px] font-normal text-muted-foreground uppercase tracking-widest flex items-center gap-2 ml-1">
                            <Building2 className="h-3 w-3 opacity-40 text-primary" /> Vincular a Cliente
                        </Label>
                        
                        <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={comboboxOpen}
                                    className="w-full justify-between h-11 rounded-xl border-border/50 bg-muted/20 text-sm font-light transition-all focus:border-primary/30 hover:bg-muted/30 px-3"
                                >
                                    {selectedClientId
                                        ? clients.find((client) => client.id === selectedClientId)?.nomeFantasia
                                        : "Selecione uma empresa..."}
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
                                                className="text-xs font-light py-2.5 px-3 cursor-pointer hover:bg-primary/5 rounded-lg m-1"
                                            >
                                                Nenhum cliente específico
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
                                                            selectedClientId === client.id ? "opacity-100" : "opacity-0"
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
                        <p className="text-[9px] text-muted-foreground/40 px-1 font-light italic">Pesquise pelo nome para preencher os dados automaticamente.</p>
                    </div>

                    {/* Linha 1: Destinatários e Assunto */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-normal text-muted-foreground uppercase tracking-widest flex items-center gap-2 ml-1">
                                <Mail className="h-3 w-3 opacity-40 text-primary" /> Destinatários
                            </Label>
                            <Input
                                placeholder="email1@exemplo.com..."
                                value={to}
                                onChange={(e) => setTo(e.target.value)}
                                className="h-11 rounded-xl border-border/50 bg-muted/20 text-sm font-light transition-all focus:border-primary/30 focus:bg-card"
                            />
                            <p className="text-[9px] text-muted-foreground/40 px-1 font-light italic">Divida por vírgula para múltiplos envios.</p>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-normal text-muted-foreground uppercase tracking-widest flex items-center gap-2 ml-1">
                                <MessageSquare className="h-3 w-3 opacity-40 text-primary" /> Assunto
                            </Label>
                            <Input
                                placeholder="Título do informativo..."
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                className="h-11 rounded-xl border-border/50 bg-muted/20 text-sm font-light transition-all focus:border-primary/30 focus:bg-card"
                            />
                        </div>
                    </div>

                    {/* Mensagem principal */}
                    <div className="space-y-2">
                        <Label className="text-[10px] font-normal text-muted-foreground uppercase tracking-widest flex items-center gap-2 ml-1">
                            <History className="h-3 w-3 opacity-40 text-primary" /> Mensagem Principal
                        </Label>
                        <Textarea
                            placeholder="Escreva aqui o conteúdo do seu comunicado..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="min-h-[200px] rounded-2xl border-border/50 bg-muted/10 text-sm font-light p-5 resize-none transition-all focus:bg-card focus:border-primary/30 leading-relaxed shadow-inner"
                        />
                    </div>

                    {/* Bloco de Agendamento */}
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
                                    <Label className="text-[9px] uppercase tracking-widest font-bold opacity-40 ml-1">Data de Envio</Label>
                                    <Input
                                        type="date"
                                        value={scheduledDate}
                                        onChange={(e) => setScheduledDate(e.target.value)}
                                        className="h-10 bg-card border-border/50 text-xs rounded-xl font-light focus:border-amber-500/30"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[9px] uppercase tracking-widest font-bold opacity-40 ml-1">Horário</Label>
                                    <Input
                                        type="time"
                                        value={scheduledTime}
                                        onChange={(e) => setScheduledTime(e.target.value)}
                                        className="h-10 bg-card border-border/50 text-xs rounded-xl font-light focus:border-amber-500/30"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer com Botões de Ação */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border/40">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            className="rounded-xl font-light text-[10px] uppercase tracking-widest px-8 h-12 text-muted-foreground hover:bg-muted transition-all"
                        >
                            Cancelar
                        </Button>
                        
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            {!isScheduled ? (
                                <>
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
