import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Client, Socio } from "@/hooks/useClients";
import { ProfitWithdrawal } from "@/hooks/useProfitWithdrawals";

interface ProfitWithdrawalFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    withdrawal: ProfitWithdrawal | null;
    clients: Client[];
    onSave: (data: Partial<ProfitWithdrawal>) => Promise<void>;
}

export function ProfitWithdrawalFormDialog({
    open,
    onOpenChange,
    withdrawal,
    clients,
    onSave,
}: ProfitWithdrawalFormDialogProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<ProfitWithdrawal>>({
        client_id: '',
        partner_name: '',
        partner_cpf: '',
        withdrawal_date: new Date().toISOString().split('T')[0],
        amount: 0,
        bank: '',
        observations: '',
    });

    const [selectedClient, setSelectedClient] = useState<Client | null>(null);

    useEffect(() => {
        if (withdrawal) {
            setFormData(withdrawal);
            const client = clients.find(c => c.id === withdrawal.client_id);
            setSelectedClient(client || null);
        } else {
            setFormData({
                client_id: '',
                partner_name: '',
                partner_cpf: '',
                withdrawal_date: new Date().toISOString().split('T')[0],
                amount: 0,
                bank: '',
                observations: '',
            });
            setSelectedClient(null);
        }
    }, [withdrawal, open, clients]);

    const handleClientChange = (clientId: string) => {
        const client = clients.find(c => c.id === clientId);
        setSelectedClient(client || null);
        setFormData(prev => ({
            ...prev,
            client_id: clientId,
            partner_name: '',
            partner_cpf: ''
        }));
    };

    const handlePartnerChange = (partnerValue: string) => {
        const [name, cpf] = partnerValue.split('|');
        setFormData(prev => ({
            ...prev,
            partner_name: name,
            partner_cpf: cpf
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            await onSave(formData);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md bg-card border-border rounded-3xl p-8">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-light tracking-tight text-foreground">
                        {withdrawal ? 'Editar Retirada' : 'Nova Retirada de Lucro'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 mt-6">
                    <div className="space-y-4">
                        {/* Empresa */}
                        <div className="space-y-2">
                            <Label className="text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em]">Empresa</Label>
                            <Select value={formData.client_id} onValueChange={handleClientChange}>
                                <SelectTrigger className="h-12 rounded-2xl border-border/50 bg-muted/20 text-sm font-light">
                                    <SelectValue placeholder="Selecione uma empresa" />
                                </SelectTrigger>
                                <SelectContent className="bg-card border-border rounded-xl">
                                    {clients.map(client => (
                                        <SelectItem key={client.id} value={client.id} className="font-light text-sm">
                                            {client.nomeFantasia || client.razaoSocial}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Sócio */}
                        <div className="space-y-2">
                            <Label className="text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em]">Sócio</Label>
                            <Select
                                disabled={!selectedClient}
                                value={formData.partner_name ? `${formData.partner_name}|${formData.partner_cpf}` : ''}
                                onValueChange={handlePartnerChange}
                            >
                                <SelectTrigger className="h-12 rounded-2xl border-border/50 bg-muted/20 text-sm font-light">
                                    <SelectValue placeholder={selectedClient ? "Selecione o sócio" : "Selecione a empresa primeiro"} />
                                </SelectTrigger>
                                <SelectContent className="bg-card border-border rounded-xl">
                                    {selectedClient?.quadroSocietario.map((socio, idx) => (
                                        <SelectItem key={idx} value={`${socio.nome}|${socio.cpf}`} className="font-light text-sm">
                                            {socio.nome} ({socio.cpf})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Data */}
                            <div className="space-y-2">
                                <Label className="text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em]">Data da Retirada</Label>
                                <Input
                                    type="date"
                                    value={formData.withdrawal_date}
                                    onChange={(e) => setFormData(prev => ({ ...prev, withdrawal_date: e.target.value }))}
                                    className="h-12 rounded-2xl border-border/50 bg-muted/20 text-sm font-light"
                                    required
                                />
                            </div>

                            {/* Valor */}
                            <div className="space-y-2">
                                <Label className="text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em]">Valor (R$)</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={formData.amount}
                                    onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) }))}
                                    className="h-12 rounded-2xl border-border/50 bg-muted/20 text-sm font-light"
                                    required
                                />
                            </div>
                        </div>

                        {/* Banco */}
                        <div className="space-y-2">
                            <Label className="text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em]">Banco / Método</Label>
                            <Input
                                placeholder="Ex: Itaú, PIX, Bradesco..."
                                value={formData.bank || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, bank: e.target.value }))}
                                className="h-12 rounded-2xl border-border/50 bg-muted/20 text-sm font-light"
                            />
                        </div>

                        {/* Observações */}
                        <div className="space-y-2">
                            <Label className="text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em]">Observações</Label>
                            <Textarea
                                placeholder="Notas adicionais..."
                                value={formData.observations || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, observations: e.target.value }))}
                                className="min-h-[100px] rounded-2xl border-border/50 bg-muted/20 text-sm font-light resize-none p-4"
                            />
                        </div>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="rounded-xl border-border/50 font-light text-xs uppercase tracking-widest px-8"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="rounded-xl shadow-sm shadow-primary/10 font-light text-xs uppercase tracking-widest px-8"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar Registro'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
