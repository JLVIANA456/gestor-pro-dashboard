import { useState } from 'react';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
    Copy, 
    Loader2, 
    Users, 
    Calendar, 
    DollarSign,
    Target
} from 'lucide-react';
import { useDeliveryList } from '@/hooks/useDeliveryList';
import { useClients, TaxRegime } from '@/hooks/useClients';
import { toast } from 'sonner';

interface BulkGuideDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    referenceMonth: string;
    onSuccess: () => void;
}

export function BulkGuideDialog({ open, onOpenChange, referenceMonth, onSuccess }: BulkGuideDialogProps) {
    const [loading, setLoading] = useState(false);
    const { createGuide } = useDeliveryList(referenceMonth);
    const { clients } = useClients();
    
    const [formData, setFormData] = useState({
        regime: 'all' as TaxRegime | 'all' | 'employees' | 'service_taker',
        type: '',
        due_date: '',
        competency: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.type) {
            toast.error('Informe o tipo de imposto.');
            return;
        }

        const targetClients = clients.filter(c => 
            c.isActive && (
                formData.regime === 'all' || 
                c.regimeTributario === formData.regime ||
                (formData.regime === 'employees' && c.hasEmployees) ||
                (formData.regime === 'service_taker' && c.isServiceTaker)
            )
        );

        if (targetClients.length === 0) {
            toast.error('Nenhum cliente ativo encontrado para este regime.');
            return;
        }

        if (!confirm(`Deseja criar esta tarefa para ${targetClients.length} clientes?`)) return;

        setLoading(true);
        let successCount = 0;
        let errorCount = 0;

        try {
            for (const client of targetClients) {
                try {
                    await createGuide({
                        client_id: client.id,
                        type: formData.type,
                        reference_month: referenceMonth,
                        due_date: formData.due_date || null,
                        amount: null,
                        file_url: null,
                        competency: formData.competency || null,
                        status: 'pending',
                        scheduled_for: null,
                        sent_at: null,
                        delivered_at: null,
                        opened_at: null
                    });
                    successCount++;
                } catch (err) {
                    errorCount++;
                }
            }

            toast.success(`${successCount} tarefas criadas com sucesso!`);
            if (errorCount > 0) toast.error(`${errorCount} erros ao criar.`);
            
            setFormData({ regime: 'all', type: '', due_date: '', competency: '' });
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            toast.error('Erro ao processar criação em lote.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[550px] rounded-[2.5rem] p-10 bg-card border-none shadow-2xl">
                <DialogHeader>
                    <div className="flex items-center gap-4 mb-2">
                        <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center">
                            <Target className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-light text-foreground uppercase tracking-tight">Criar em Lote</DialogTitle>
                            <DialogDescription className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mt-1">
                                Replicar tarefa por Regime Tributário
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 mt-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60 px-1">Regime Destino</Label>
                        <select
                            value={formData.regime}
                            onChange={(e) => setFormData(prev => ({ ...prev, regime: e.target.value as any }))}
                            className="w-full h-12 rounded-xl border border-border/40 bg-muted/20 px-4 text-sm font-light focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                        >
                            <option value="all">Todos os Clientes Ativos</option>
                            <option value="simples">Simples Nacional</option>
                            <option value="presumido">Lucro Presumido</option>
                            <option value="real">Lucro Real</option>
                            <option value="domestico">Doméstico</option>
                            <option value="employees">Com Funcionários (Folha)</option>
                            <option value="service_taker">Tomadores de Serviços</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60 px-1">Tipo de Imposto (Ex: DAS, DARF)</Label>
                        <Input 
                            value={formData.type}
                            onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                            className="h-12 rounded-xl border-border/40 bg-muted/20 font-light"
                            placeholder="Ex: DAS"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60 px-1">Vencimento (Padrão)</Label>
                            <Input 
                                type="date"
                                value={formData.due_date}
                                onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                                className="h-12 rounded-xl border-border/40 bg-muted/20 font-light"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60 px-1">Competência (MM/AAAA)</Label>
                            <Input 
                                value={formData.competency}
                                onChange={(e) => setFormData(prev => ({ ...prev, competency: e.target.value }))}
                                className="h-12 rounded-xl border-border/40 bg-muted/20 font-light px-4"
                                placeholder="Ex: 03/2026"
                            />
                        </div>
                    </div>

                    <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
                        <p className="text-[10px] text-primary/80 font-medium leading-relaxed">
                            <Users className="h-3 w-3 inline mr-2" />
                            Esta ação criará uma tarefa individual para cada cliente. Os valores e guias serão definidos posteriormente via IA ou upload manual.
                        </p>
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
                            disabled={loading}
                            className="rounded-xl h-12 px-10 gap-2 text-[10px] uppercase font-bold tracking-widest shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
                            Criar em Lote
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
