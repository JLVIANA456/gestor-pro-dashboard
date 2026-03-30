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
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { 
    Banknote, 
    Calendar, 
    User, 
    Building2, 
    History, 
    CreditCard, 
    FileText, 
    X,
    PlusCircle,
    Info,
    Search,
    ChevronsUpDown,
    Check,
    Layers
} from "lucide-react";
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
    const [isCompanyPopoverOpen, setIsCompanyPopoverOpen] = useState(false);
    const [companySearchQuery, setCompanySearchQuery] = useState('');

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
            <DialogContent className="max-w-2xl bg-card border-none rounded-[2.5rem] p-0 overflow-hidden shadow-2xl shadow-black/20 animate-in fade-in zoom-in duration-300">
                {/* Header with Background/Gradient */}
                <div className="bg-primary/[0.03] border-b border-primary/5 p-10 pb-8 relative overflow-hidden">
                    {/* Decorative Background Elements */}
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-primary/[0.03] rounded-full blur-3xl pointer-events-none" />
                    
                    <div className="flex items-center gap-6 relative">
                        <div className="h-16 w-16 flex items-center justify-center rounded-[1.25rem] bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 shadow-sm transition-transform hover:scale-105 duration-300">
                            {withdrawal ? <History className="h-8 w-8 text-primary" /> : <Banknote className="h-8 w-8 text-primary" />}
                        </div>
                        <div>
                            <DialogTitle className="text-3xl font-light tracking-tight text-foreground">
                                {withdrawal ? 'Editar' : 'Nova'} <span className="font-light text-primary">Retirada de Lucro</span>
                            </DialogTitle>
                            <p className="text-xs text-muted-foreground/60 font-light mt-1.5 uppercase tracking-[0.2em]">
                                {withdrawal ? 'Atualize as informações da retirada realizada' : 'Registre uma nova extração de dividendos para o sócio'}
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-8 pt-6 space-y-8 max-h-[85vh] overflow-y-auto">
                    {/* SEÇÃO 1: Identificação */}
                    <div className="space-y-5">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                            <h4 className="text-[10px] uppercase tracking-widest font-light text-primary/80">Identificação & Vínculo</h4>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-5 rounded-3xl bg-muted/20 border border-border/40 transition-colors hover:bg-muted/30 duration-500">
                            {/* Empresa */}
                            <div className="space-y-2.5">
                                <Label className="text-[10px] font-light text-muted-foreground uppercase tracking-widest flex items-center gap-2 ml-1">
                                    <Building2 className="h-3 w-3 opacity-50" /> Empresa
                                </Label>
                                <Popover open={isCompanyPopoverOpen} onOpenChange={setIsCompanyPopoverOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={isCompanyPopoverOpen}
                                            className="w-full h-11 justify-between rounded-xl border-border/50 bg-card text-sm font-light hover:bg-muted/30 px-4 transition-all hover:border-primary/20"
                                        >
                                            <div className="flex items-center gap-2 truncate">
                                                <Search className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0" />
                                                <span className="truncate">
                                                    {formData.client_id
                                                        ? (clients.find((c) => c.id === formData.client_id)?.nomeFantasia || 
                                                           clients.find((c) => c.id === formData.client_id)?.razaoSocial)
                                                        : "Selecionar empresa..."}
                                                </span>
                                            </div>
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-30" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-card border-border rounded-2xl shadow-elevated overflow-hidden z-[100]">
                                        <Command className="bg-transparent">
                                            <CommandInput 
                                                placeholder="Buscar empresa por nome ou CNPJ..." 
                                                className="h-11 font-light text-sm"
                                                value={companySearchQuery}
                                                onValueChange={setCompanySearchQuery}
                                            />
                                            <CommandList className="max-h-[250px] overflow-y-auto">
                                                <CommandEmpty className="py-6 text-center text-xs text-muted-foreground font-light">Nenhuma empresa encontrada.</CommandEmpty>
                                                <CommandGroup>
                                                    {clients.map((client) => {
                                                        const displayName = client.nomeFantasia || client.razaoSocial;
                                                        return (
                                                            <CommandItem
                                                                key={client.id}
                                                                value={displayName + " " + client.cnpj}
                                                                onSelect={() => {
                                                                    handleClientChange(client.id);
                                                                    setIsCompanyPopoverOpen(false);
                                                                    setCompanySearchQuery('');
                                                                }}
                                                                className="font-light text-sm py-2.5 px-4 flex items-center justify-between cursor-pointer hover:bg-primary/5 transition-colors"
                                                            >
                                                                <div className="flex flex-col">
                                                                    <span className="truncate max-w-[200px]">{displayName}</span>
                                                                    <span className="text-[9px] text-muted-foreground opacity-60 font-mono">{client.cnpj}</span>
                                                                </div>
                                                                <Check
                                                                    className={cn(
                                                                        "h-4 w-4 text-primary transition-opacity duration-300",
                                                                        formData.client_id === client.id ? "opacity-100" : "opacity-0"
                                                                    )}
                                                                />
                                                            </CommandItem>
                                                        );
                                                    })}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* Sócio */}
                            <div className="space-y-2.5">
                                <Label className="text-[10px] font-light text-muted-foreground uppercase tracking-widest flex items-center gap-2 ml-1">
                                    <User className="h-3 w-3 opacity-50" /> Sócio Beneficiário
                                </Label>
                                <Select
                                    disabled={!selectedClient}
                                    value={formData.partner_name ? `${formData.partner_name}|${formData.partner_cpf}` : ''}
                                    onValueChange={handlePartnerChange}
                                >
                                    <SelectTrigger className="h-11 rounded-xl border-border/50 bg-card text-sm font-light transition-all hover:border-primary/20">
                                        <SelectValue placeholder={selectedClient ? "Selecione o sócio" : "Selecione a empresa primeiro"} />
                                    </SelectTrigger>
                                    <SelectContent className="bg-card border-border rounded-xl">
                                        {selectedClient?.quadroSocietario.map((socio, idx) => (
                                            <SelectItem key={idx} value={`${socio.nome}|${socio.cpf}`} className="font-light text-sm">
                                                {socio.nome}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* SEÇÃO 2: Transação */}
                    <div className="space-y-5 pt-2">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500/80" />
                            <h4 className="text-[10px] uppercase tracking-widest font-light text-emerald-600/80">Dados da Transação Financeira</h4>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 p-5 rounded-3xl bg-emerald-500/[0.02] border border-emerald-500/10 transition-colors hover:bg-emerald-500/[0.04] duration-500">
                            {/* Data */}
                            <div className="md:col-span-4 space-y-2.5">
                                <Label className="text-[10px] font-light text-muted-foreground uppercase tracking-widest flex items-center gap-2 ml-1">
                                    <Calendar className="h-3 w-3 opacity-50" /> Data
                                </Label>
                                <Input
                                    type="date"
                                    value={formData.withdrawal_date}
                                    onChange={(e) => setFormData(prev => ({ ...prev, withdrawal_date: e.target.value }))}
                                    className="h-11 rounded-xl border-border/50 bg-card text-sm font-light transition-all focus:border-emerald-500/30 ring-emerald-500/10"
                                    required
                                />
                            </div>

                            {/* Valor */}
                            <div className="md:col-span-8 space-y-2.5">
                                <Label className="text-[10px] font-light text-muted-foreground uppercase tracking-widest flex items-center gap-2 ml-1">
                                    <Banknote className="h-3 w-3 opacity-50" /> Valor da Retirada
                                </Label>
                                <div className="relative group">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-light text-muted-foreground/50 transition-colors group-focus-within:text-emerald-500/60 pr-1 border-r border-border/30 h-4 flex items-center">R$</span>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="0,00"
                                        value={formData.amount || ''}
                                        onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) }))}
                                        className="h-11 rounded-xl border-border/50 bg-card pl-14 text-sm font-light transition-all focus:border-emerald-500/30 ring-emerald-500/10"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Competência da REINF */}
                            <div className="md:col-span-12 space-y-2.5 pt-1">
                                <Label className="text-[10px] font-light text-muted-foreground uppercase tracking-widest flex items-center gap-2 ml-1">
                                    <Layers className="h-3 w-3 opacity-50" /> Competência da REINF
                                </Label>
                                <Select
                                    value={formData.bank || ''}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, bank: value }))}
                                >
                                    <SelectTrigger className="h-11 rounded-xl border-border/50 bg-card text-sm font-light transition-all hover:border-emerald-500/10 focus:border-emerald-500/30 ring-emerald-500/10">
                                        <SelectValue placeholder="Selecione a competência..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-card border-border rounded-xl">
                                        <SelectItem value="mensal" className="font-light text-sm uppercase tracking-widest">Mensal</SelectItem>
                                        <SelectItem value="trimestral" className="font-light text-sm uppercase tracking-widest">Trimestral</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* SEÇÃO 3: Notas */}
                    <div className="space-y-2.5">
                        <Label className="text-[10px] font-light text-muted-foreground uppercase tracking-widest flex items-center gap-2 ml-1">
                            <FileText className="h-3 w-3 opacity-50" /> Observações Internas
                        </Label>
                        <Textarea
                            placeholder="Adicione notas ou observações contextuais sobre esta retirada..."
                            value={formData.observations || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, observations: e.target.value }))}
                            className="min-h-[100px] rounded-3xl border-border/50 bg-muted/20 text-sm font-light resize-none p-5 transition-all focus:bg-card focus:border-primary/20"
                        />
                        <div className="flex items-start gap-2 px-1 text-[9px] text-muted-foreground/50 italic leading-relaxed">
                            <Info className="h-2.5 w-2.5 mt-0.5 shrink-0" />
                            <p>As observações serão exibidas no resumo do card e no relatório impresso.</p>
                        </div>
                    </div>

                    {/* Rodapé de Ações */}
                    <div className="flex items-center justify-end gap-3 pt-6 border-t border-border/40">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            className="rounded-xl font-light text-[10px] uppercase tracking-widest px-8 h-11 text-muted-foreground hover:bg-muted transition-all"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className={cn(
                                "rounded-xl shadow-lg font-light text-[10px] uppercase tracking-widest px-10 h-11 transition-all",
                                withdrawal ? "bg-amber-600 hover:bg-amber-700 shadow-amber-500/20" : "bg-primary hover:bg-primary/90 shadow-primary/20"
                            )}
                        >
                            {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                withdrawal ? 'Atualizar Registro' : 'Confirmar Retirada'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
