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
                scheduled_for: isScheduled ? `${scheduledDate}T${scheduledTime}:00` : undefined
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
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl bg-card border-none rounded-[2rem] p-0 overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
                {/* Header Section */}
                <div className="bg-primary/5 border-b border-primary/10 p-8 pb-6 relative">
                    <div className="absolute top-4 right-4 h-8 w-8 flex items-center justify-center rounded-full bg-muted/40 text-muted-foreground/40 hover:text-foreground hover:bg-muted/80 transition-all cursor-pointer" onClick={() => onOpenChange(false)}>
                        <X className="h-4 w-4" />
                    </div>
                    <div className="flex items-center gap-5">
                        <div className="h-14 w-14 flex items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 shadow-sm">
                            <Send className="h-7 w-7 text-primary" />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-light tracking-tight text-foreground">
                                Compor <span className="font-light text-primary">Comunicado</span>
                            </DialogTitle>
                            <div className="flex items-center gap-2 mt-1.5">
                                <span className={cn(
                                    "px-2 py-0.5 rounded-full text-[9px] uppercase tracking-widest font-bold border border-current/20",
                                    department === 'fiscal' ? "bg-orange-500/5 text-orange-500" :
                                    department === 'pessoal' ? "bg-blue-500/5 text-blue-500" :
                                    department === 'contabil' ? "bg-emerald-500/5 text-emerald-500" :
                                    department === 'financeiro' ? "bg-purple-500/5 text-purple-500" :
                                    "bg-slate-500/5 text-slate-500"
                                )}>
                                    {department}
                                </span>
                                <span className="text-muted-foreground opacity-30">/</span>
                                <span className="text-[10px] text-muted-foreground font-light uppercase tracking-widest flex items-center gap-1.5">
                                    <Tags className="h-3 w-3" /> {folderName}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-8 pt-6 space-y-6 max-h-[85vh] overflow-y-auto">
                    {/* Recipients & Subject Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2.5">
                            <Label className="text-[10px] font-light text-muted-foreground uppercase tracking-widest flex items-center gap-2 ml-1">
                                <Mail className="h-3 w-3 opacity-50" /> Destinatários
                            </Label>
                            <Input
                                placeholder="email1@exemplo.com, email2@exemplo.com"
                                value={to}
                                onChange={(e) => setTo(e.target.value)}
                                className="h-11 rounded-xl border-border/50 bg-muted/20 text-sm font-light transition-all focus:border-primary/20"
                            />
                            <p className="text-[9px] text-muted-foreground/50 px-1 font-light italic">Divida por vírgula para múltiplos envios.</p>
                        </div>

                        <div className="space-y-2.5">
                            <Label className="text-[10px] font-light text-muted-foreground uppercase tracking-widest flex items-center gap-2 ml-1">
                                <MessageSquare className="h-3 w-3 opacity-50" /> Assunto
                            </Label>
                            <Input
                                placeholder="Título do comunicado..."
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                className="h-11 rounded-xl border-border/50 bg-muted/20 text-sm font-light transition-all focus:border-primary/20"
                            />
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="space-y-2.5">
                        <Label className="text-[10px] font-light text-muted-foreground uppercase tracking-widest flex items-center gap-2 ml-1">
                            <History className="h-3 w-3 opacity-50" /> Mensagem Principal
                        </Label>
                        <Textarea
                            placeholder="Escreva aqui o conteúdo do seu informativo..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="min-h-[220px] rounded-3xl border-border/50 bg-muted/10 text-sm font-light p-5 resize-none transition-all focus:bg-card focus:border-primary/20 leading-relaxed"
                        />
                    </div>

                    {/* Scheduling Panel */}
                    <div className="p-5 rounded-3xl bg-secondary/5 border border-border/40 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                                    <CalendarIcon className="h-4 w-4 text-amber-600/70" />
                                </div>
                                <div className="space-y-0.5">
                                    <Label className="text-xs font-semibold uppercase tracking-tight">Agendamento de Envio</Label>
                                    <p className="text-[10px] text-muted-foreground font-light">Programe para uma data futura no histórico.</p>
                                </div>
                            </div>
                            <Switch
                                checked={isScheduled}
                                onCheckedChange={setIsScheduled}
                                className="data-[state=checked]:bg-amber-600"
                            />
                        </div>

                        {isScheduled && (
                            <div className="grid grid-cols-2 gap-4 pt-2 animate-in fade-in slide-in-from-top-2">
                                <div className="space-y-1.5">
                                    <Label className="text-[9px] uppercase tracking-wider opacity-60 ml-1">Data</Label>
                                    <Input
                                        type="date"
                                        value={scheduledDate}
                                        onChange={(e) => setScheduledDate(e.target.value)}
                                        className="h-10 bg-card border-border/40 text-xs rounded-xl font-light"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[9px] uppercase tracking-wider opacity-60 ml-1">Horário</Label>
                                    <Input
                                        type="time"
                                        value={scheduledTime}
                                        onChange={(e) => setScheduledTime(e.target.value)}
                                        className="h-10 bg-card border-border/40 text-xs rounded-xl font-light"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Provider Selection & Action Buttons */}
                    <div className="flex items-center justify-end gap-3 pt-6 border-t border-border/40">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            className="rounded-xl font-light text-[10px] uppercase tracking-widest px-8 h-11 text-muted-foreground hover:bg-muted transition-all"
                        >
                            Cancelar
                        </Button>
                        
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                disabled={loading}
                                onClick={() => handleSend('gmail')}
                                className={cn(
                                    "rounded-xl shadow-lg font-light text-[10px] uppercase tracking-widest px-6 h-11 transition-all bg-[#EA4335] hover:bg-[#D33426] shadow-[#EA4335]/20 border-none",
                                    isScheduled && "opacity-50 grayscale cursor-not-allowed"
                                )}
                            >
                                Gmail
                            </Button>
                            <Button
                                type="button"
                                disabled={loading}
                                onClick={() => handleSend('outlook')}
                                className={cn(
                                    "rounded-xl shadow-lg font-light text-[10px] uppercase tracking-widest px-6 h-11 transition-all bg-[#0078D4] hover:bg-[#005A9E] shadow-[#0078D4]/20 border-none",
                                    isScheduled && "opacity-50 grayscale cursor-not-allowed"
                                )}
                            >
                                Outlook
                            </Button>
                            {isScheduled && (
                                <Button
                                    type="button"
                                    disabled={loading}
                                    onClick={() => handleSend('gmail')} // Using gmail as default for internal reg when scheduled
                                    className="rounded-xl shadow-lg font-light text-[10px] uppercase tracking-widest px-8 h-11 transition-all bg-amber-600 hover:bg-amber-700 shadow-amber-600/20"
                                >
                                    Confirmar Agendamento
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
