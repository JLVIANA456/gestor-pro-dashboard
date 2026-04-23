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
            <DialogContent className="max-w-[calc(100vw-2rem)] lg:max-w-4xl bg-card border-none rounded-[2rem] lg:rounded-[3rem] p-0 overflow-hidden shadow-2xl shadow-black/20 animate-in fade-in zoom-in duration-500 flex flex-col max-h-[92vh]">
                {/* Header with Premium Design */}
                <div className="bg-gradient-to-r from-red-500/[0.05] via-transparent to-red-500/[0.05] border-b border-border/40 p-6 lg:p-12 pb-6 lg:pb-10 relative overflow-hidden text-center shrink-0">
                    {/* Decorative Elements */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500/20 to-transparent" />
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-red-400/[0.03] rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-red-400/[0.03] rounded-full blur-3xl pointer-events-none" />
                    
                    <div className="flex flex-col items-center gap-4 lg:gap-6 relative">
                        <div className="h-14 w-14 lg:h-20 lg:w-20 flex items-center justify-center rounded-2xl lg:rounded-3xl bg-red-50 border border-red-100 shadow-sm transition-all hover:scale-110 hover:shadow-md duration-500 group">
                            <Banknote className="h-7 w-7 lg:h-10 lg:w-10 text-red-500 transition-transform group-hover:rotate-12" />
                        </div>
                        <div className="space-y-1 lg:space-y-2">
                            <DialogTitle className="text-2xl lg:text-4xl font-light tracking-tight text-foreground flex items-center justify-center gap-3">
                                {withdrawal ? 'Editar' : 'Nova'} <span className="font-medium text-red-500">Retirada de Lucro</span>
                            </DialogTitle>
                            <p className="text-[10px] lg:text-xs text-muted-foreground/60 font-medium uppercase tracking-[0.3em] max-w-lg mx-auto leading-relaxed">
                                {withdrawal ? 'Atualize as informações da retirada realizada' : 'REGISTRE UMA NOVA EXTRAÇÃO DE DIVIDENDOS PARA O SÓCIO'}
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 lg:p-12 pt-4 lg:pt-8 space-y-8 lg:space-y-10 overflow-y-auto flex-1 min-h-0">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        {/* COLUNA ESQUERDA: Identificação */}
                        <div className="space-y-8">
                            <div className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="h-2 w-2 rounded-full bg-red-500" />
                                    <h4 className="text-[11px] uppercase tracking-[0.2em] font-semibold text-red-600/70">Identificação & Vínculo</h4>
                                </div>
                                
                                <div className="space-y-5 p-8 rounded-[2.5rem] bg-muted/20 border border-border/40 transition-all hover:bg-muted/30 duration-500 shadow-sm">
                                    {/* Empresa */}
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2 ml-1">
                                            <Building2 className="h-3.5 w-3.5 opacity-40 text-red-500" /> Empresa
                                        </Label>
                                        <Popover open={isCompanyPopoverOpen} onOpenChange={setIsCompanyPopoverOpen}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={isCompanyPopoverOpen}
                                                    className="w-full h-12 justify-between rounded-2xl border-border/50 bg-card text-sm font-light hover:bg-muted/30 px-5 transition-all hover:border-red-500/20 shadow-sm"
                                                >
                                                    <div className="flex items-center gap-3 truncate">
                                                        <Search className="h-4 w-4 text-muted-foreground/30 shrink-0" />
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
                                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-card border-border rounded-3xl shadow-elevated overflow-hidden z-[100]">
                                                <Command className="bg-transparent">
                                                    <CommandInput 
                                                        placeholder="Buscar empresa por nome ou CNPJ..." 
                                                        className="h-12 font-light text-sm"
                                                        value={companySearchQuery}
                                                        onValueChange={setCompanySearchQuery}
                                                    />
                                                    <CommandList className="max-h-[300px] overflow-y-auto">
                                                        <CommandEmpty className="py-8 text-center text-xs text-muted-foreground font-light">Nenhuma empresa encontrada.</CommandEmpty>
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
                                                                        className="font-light text-sm py-3 px-5 flex items-center justify-between cursor-pointer hover:bg-red-50 transition-colors"
                                                                    >
                                                                        <div className="flex flex-col gap-0.5">
                                                                            <span className="truncate max-w-[250px] font-medium text-foreground/80">{displayName}</span>
                                                                            <span className="text-[10px] text-muted-foreground opacity-60 font-mono italic">{client.cnpj}</span>
                                                                        </div>
                                                                        <Check
                                                                            className={cn(
                                                                                "h-4 w-4 text-red-500 transition-opacity duration-300",
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
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2 ml-1">
                                            <User className="h-3.5 w-3.5 opacity-40 text-red-500" /> Sócio Beneficiário
                                        </Label>
                                        <Select
                                            disabled={!selectedClient}
                                            value={formData.partner_name ? `${formData.partner_name}|${formData.partner_cpf}` : ''}
                                            onValueChange={handlePartnerChange}
                                        >
                                            <SelectTrigger className="h-12 rounded-2xl border-border/50 bg-card text-sm font-light transition-all hover:border-red-500/20 shadow-sm">
                                                <SelectValue placeholder={selectedClient ? "Selecione o sócio" : "Selecione a empresa primeiro"} />
                                            </SelectTrigger>
                                            <SelectContent className="bg-card border-border rounded-2xl shadow-elevated">
                                                {selectedClient?.quadroSocietario.map((socio, idx) => (
                                                    <SelectItem key={idx} value={`${socio.nome}|${socio.cpf}`} className="font-light text-sm p-3">
                                                        {socio.nome}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* COLUNA DIREITA: Transação */}
                        <div className="space-y-8">
                            <div className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                    <h4 className="text-[11px] uppercase tracking-[0.2em] font-semibold text-emerald-600/70">Dados da Transação Financeira</h4>
                                </div>
                                
                                <div className="space-y-6 p-8 rounded-[2.5rem] bg-emerald-500/[0.02] border border-emerald-500/10 transition-all hover:bg-emerald-500/[0.04] duration-500 shadow-sm">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        {/* Data */}
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2 ml-1">
                                                <Calendar className="h-3.5 w-3.5 opacity-40 text-emerald-500" /> Data
                                            </Label>
                                            <div className="relative">
                                                <Input
                                                    type="date"
                                                    value={formData.withdrawal_date}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, withdrawal_date: e.target.value }))}
                                                    className="h-12 rounded-2xl border-border/50 bg-card text-sm font-light transition-all focus:border-emerald-500/30 ring-emerald-500/10 shadow-sm"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        {/* Valor */}
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2 ml-1">
                                                <Banknote className="h-3.5 w-3.5 opacity-40 text-emerald-500" /> Valor da Retirada
                                            </Label>
                                            <div className="relative group">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground/40 transition-colors group-focus-within:text-emerald-500/60 pr-2 border-r border-border/30 h-4 flex items-center">R$</span>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    placeholder="0,00"
                                                    value={formData.amount || ''}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) }))}
                                                    className="h-12 rounded-2xl border-border/50 bg-card pl-16 text-sm font-medium transition-all focus:border-emerald-500/30 ring-emerald-500/10 shadow-sm"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Competência da REINF */}
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2 ml-1">
                                            <Layers className="h-3.5 w-3.5 opacity-40 text-emerald-500" /> Competência da REINF
                                        </Label>
                                        <Select
                                            value={formData.bank || ''}
                                            onValueChange={(value) => setFormData(prev => ({ ...prev, bank: value }))}
                                        >
                                            <SelectTrigger className="h-12 rounded-2xl border-border/50 bg-card text-sm font-light transition-all hover:border-emerald-500/10 focus:border-emerald-500/30 ring-emerald-500/10 shadow-sm">
                                                <SelectValue placeholder="Selecione a competência..." />
                                            </SelectTrigger>
                                            <SelectContent className="bg-card border-border rounded-2xl shadow-elevated">
                                                <SelectItem value="mensal" className="font-light text-sm uppercase tracking-[0.2em] p-3">Mensal</SelectItem>
                                                <SelectItem value="trimestral" className="font-light text-sm uppercase tracking-[0.2em] p-3">Trimestral</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SEÇÃO 3: Notas (Full Width) */}
                    <div className="space-y-4 pt-4">
                        <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2 ml-1">
                            <FileText className="h-3.5 w-3.5 opacity-40 text-red-500" /> Observações Internas
                        </Label>
                        <div className="relative">
                            <Textarea
                                placeholder="Adicione notas ou observações contextuais sobre esta retirada..."
                                value={formData.observations || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, observations: e.target.value }))}
                                className="min-h-[120px] rounded-[2rem] border-border/50 bg-muted/20 text-sm font-light resize-none p-6 transition-all focus:bg-card focus:border-red-500/20 shadow-inner"
                            />
                            <div className="absolute bottom-4 left-6 flex items-start gap-2 text-[10px] text-muted-foreground/40 italic leading-relaxed">
                                <Info className="h-3 w-3 mt-0.5 shrink-0" />
                                <p>As observações serão exibidas no resumo do card e no relatório impresso.</p>
                            </div>
                        </div>
                    </div>

                    {/* Rodapé de Ações com Design Premium */}
                    <div className="flex items-center justify-between pt-10 border-t border-border/40">
                        <p className="text-[10px] text-muted-foreground font-light uppercase tracking-widest flex items-center gap-2">
                             Campos marcados como obrigatórios devem ser preenchidos.
                        </p>
                        <div className="flex items-center gap-4">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => onOpenChange(false)}
                                className="rounded-2xl font-semibold text-[11px] uppercase tracking-widest px-8 h-12 text-muted-foreground hover:bg-muted transition-all"
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading}
                                className={cn(
                                    "rounded-2xl shadow-xl font-semibold text-[11px] uppercase tracking-widest px-12 h-12 transition-all duration-300 transform hover:-translate-y-1 active:scale-95",
                                    withdrawal 
                                        ? "bg-amber-600 hover:bg-amber-700 shadow-amber-500/30" 
                                        : "bg-red-500 hover:bg-red-600 shadow-red-500/30"
                                )}
                            >
                                {loading ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    withdrawal ? 'Atualizar Registro' : 'Confirmar Retirada'
                                )}
                            </Button>
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
