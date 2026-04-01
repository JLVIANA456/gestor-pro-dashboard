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
import { 
    Plus, 
    Loader2, 
    FileText, 
    CloudUpload, 
    Calendar
} from 'lucide-react';
import { useDeliveryList } from '@/hooks/useDeliveryList';
import { toast } from 'sonner';
import { AiService } from '@/services/aiService';
import { cn } from "@/lib/utils";
import { useObligations } from '@/hooks/useObligations';
import { format } from 'date-fns';

interface NewGuideDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    clientId: string;
    referenceMonth: string;
    onSuccess: () => void;
}

export function NewGuideDialog({ open, onOpenChange, clientId, referenceMonth, onSuccess }: NewGuideDialogProps) {
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const { createGuide } = useDeliveryList(referenceMonth);
    const { obligations } = useObligations();
    
    const [formData, setFormData] = useState({
        type: '',
        due_date: '',
        competency: '',
        file_url: ''
    });

    const handleTypeChange = (value: string) => {
        const obligation = obligations.find(o => o.name.toLowerCase() === value.toLowerCase());
        
        let newDueDate = prev => prev.due_date;
        let newCompetency = prev => prev.competency;

        setFormData(prev => {
            let nextState = { ...prev, type: value };
            
            if (obligation) {
                const [year, month] = referenceMonth.split('-').map(Number);
                const refDate = new Date(year, month - 1, 1);
                
                // Calc competency
                if (obligation.competency_rule === 'previous_month') {
                    const prevDate = new Date(year, month - 2, 1);
                    nextState.competency = format(prevDate, 'MM/yyyy');
                } else if (obligation.competency_rule === 'current_month') {
                    nextState.competency = format(refDate, 'MM/yyyy');
                } else if (obligation.competency_rule === 'quarterly') {
                    const q = Math.ceil(month / 3);
                    nextState.competency = `${q}º Trimestre / ${year}`;
                } else {
                    nextState.competency = `Ano ${year}`;
                }

                // Calc due date
                const dueDateCalc = new Date(
                    `${referenceMonth}-${obligation.default_due_day.toString().padStart(2, '0')}`
                );
                if (!isNaN(dueDateCalc.getTime())) {
                    nextState.due_date = dueDateCalc.toISOString().split('T')[0];
                }
            }
            
            return nextState;
        });
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            // Sequential to show loading, but could be Promise.all
            const extractedData = await AiService.extractGuideData(file);
            const resource = await AiService.uploadFile(file);
            
            setFormData(prev => ({ 
                ...prev, 
                file_url: resource.publicUrl,
                due_date: extractedData.dueDate ? extractedData.dueDate.split('T')[0] : prev.due_date,
                type: extractedData.type || prev.type,
                competency: extractedData.referenceMonth || prev.competency
            }));
            
            toast.success('Documento processado por IA e anexado com sucesso!');
        } catch (error: any) {
            console.error("Erro no processamento manual:", error);
            // Fallback: tenta apenas o upload se a extração falhar (ex: chave IA não configurada)
            try {
                const resource = await AiService.uploadFile(file);
                setFormData(prev => ({ ...prev, file_url: resource.publicUrl }));
                toast.success('Arquivo anexado (IA indisponível ou erro na leitura).');
            } catch (uploadErr) {
                toast.error('Erro ao subir arquivo.');
            }
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.type) {
            toast.error('Informe o tipo de imposto.');
            return;
        }

        setLoading(true);
        try {
            await createGuide({
                client_id: clientId,
                type: formData.type,
                reference_month: referenceMonth,
                due_date: formData.due_date || null,
                amount: null,
                file_url: formData.file_url || null,
                competency: formData.competency || null,
                status: 'pending',
                scheduled_for: null,
                sent_at: null,
                delivered_at: null,
                opened_at: null
            });
            toast.success('Tarefa criada com sucesso!');
            setFormData({ type: '', due_date: '', competency: '', file_url: '' });
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            toast.error('Erro ao criar tarefa.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] rounded-[2rem] p-10 bg-card border-none shadow-2xl">
                <DialogHeader>
                    <div className="flex items-center gap-4 mb-2">
                        <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center">
                            <Plus className="h-6 w-6 text-primary" />
                        </div>
                        <DialogTitle className="text-xl font-light text-foreground uppercase tracking-tight">Nova Tarefa</DialogTitle>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                    <div className="space-y-2">
                        <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60 px-1">Tipo de Imposto ou Obrigação</Label>
                        <Input 
                            value={formData.type}
                            onChange={(e) => handleTypeChange(e.target.value)}
                            list="obligations-datalist"
                            className="h-12 rounded-xl border-border/40 bg-muted/20 font-light focus:ring-4 focus:ring-primary/5 transition-all outline-none pl-4"
                            placeholder="Selecione ou digite..."
                        />
                        <datalist id="obligations-datalist">
                            {obligations.filter(o => o.is_active).map(o => (
                                <option key={o.id} value={o.name} />
                            ))}
                        </datalist>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60 px-1">Vencimento (Opcional)</Label>
                            <Input 
                                type="date"
                                value={formData.due_date}
                                onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                                className="h-12 rounded-xl border-border/40 bg-muted/20 font-light focus:ring-4 focus:ring-primary/5 transition-all outline-none pl-4"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60 px-1">Competência (Ex: 03/2026)</Label>
                            <Input 
                                value={formData.competency}
                                onChange={(e) => setFormData(prev => ({ ...prev, competency: e.target.value }))}
                                className="h-12 rounded-xl border-border/40 bg-muted/20 font-light focus:ring-4 focus:ring-primary/5 transition-all outline-none pl-4"
                                placeholder="MM/AAAA"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60 px-1">Arquivo Guia (Opcional)</Label>
                        <div className="relative">
                            <Input 
                                type="file"
                                onChange={handleFileChange}
                                className="hidden"
                                id="manual-file-upload"
                                accept=".pdf,.png,.jpg,.jpeg"
                            />
                            <label 
                                htmlFor="manual-file-upload"
                                className={cn(
                                    "flex items-center justify-center w-full h-14 border-2 border-dashed rounded-2xl cursor-pointer transition-all gap-3 text-xs uppercase font-bold tracking-widest",
                                    formData.file_url ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-600" : "border-border/40 hover:border-primary/40 hover:bg-primary/5 text-muted-foreground"
                                )}
                            >
                                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : 
                                 formData.file_url ? <FileText className="h-4 w-4" /> : <CloudUpload className="h-4 w-4" />}
                                {uploading ? 'Subindo...' : formData.file_url ? 'Arquivo Pronto' : 'Selecionar Documento'}
                            </label>
                        </div>
                    </div>

                    <DialogFooter className="pt-6">
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => onOpenChange(false)}
                            className="rounded-xl h-12 px-6 text-[10px] uppercase font-bold tracking-widest"
                        >
                            Cancelar
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={loading || uploading}
                            className="rounded-xl h-12 px-10 gap-2 text-[10px] uppercase font-bold tracking-widest shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                            Criar Tarefa
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
