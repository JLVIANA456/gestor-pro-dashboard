import { useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
    Loader2,
    Upload,
    AlertCircle,
    CheckCircle2,
    Building2,
    FileSpreadsheet,
    ChevronsUpDown,
    Check,
} from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { Client } from '@/hooks/useClients';
import { ProfitWithdrawal } from '@/hooks/useProfitWithdrawals';

interface ProfitWithdrawalImportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onImport: (data: Omit<ProfitWithdrawal, 'id' | 'client' | 'created_at' | 'updated_at'>[]) => Promise<any>;
    clients: Client[];
}

/**
 * Converte data no formato DD-MM-AAAA para AAAA-MM-DD (ISO 8601)
 */
function parseDateDDMMYYYY(raw: string | number): string | null {
    if (!raw) return null;

    // Se vier como número serial do Excel, converter
    if (typeof raw === 'number') {
        const date = XLSX.SSF.parse_date_code(raw);
        if (!date) return null;
        const y = String(date.y).padStart(4, '0');
        const m = String(date.m).padStart(2, '0');
        const d = String(date.d).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    const str = String(raw).trim();

    // Tenta DD-MM-AAAA ou DD/MM/AAAA
    const ptBR = str.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/);
    if (ptBR) {
        const [, d, m, y] = ptBR;
        return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }

    // Tenta AAAA-MM-DD (ISO)
    const iso = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (iso) {
        const [, y, m, d] = iso;
        return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }

    return null;
}

export function ProfitWithdrawalImportDialog({
    open,
    onOpenChange,
    onImport,
    clients,
}: ProfitWithdrawalImportDialogProps) {
    const [loading, setLoading] = useState(false);
    const [comboOpen, setComboOpen] = useState(false);
    const [selectedClientId, setSelectedClientId] = useState<string>('');
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<any[]>([]);
    const [previewErrors, setPreviewErrors] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const selectedClient = clients.find(c => c.id === selectedClientId) || null;
    const activeClients = clients.filter(c => c.isActive);

    const resetState = () => {
        setFile(null);
        setPreview([]);
        setPreviewErrors([]);
        setSelectedClientId('');
        setComboOpen(false);
    };

    const handleClose = (isOpen: boolean) => {
        if (!isOpen) resetState();
        onOpenChange(isOpen);
    };

    const handleClientSelect = (clientId: string) => {
        setSelectedClientId(clientId);
        setComboOpen(false);
        // Reset file quando troca empresa
        setFile(null);
        setPreview([]);
        setPreviewErrors([]);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        if (!selectedClientId) {
            toast.error('Selecione a empresa antes de escolher o arquivo.');
            return;
        }

        setFile(selectedFile);
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary', cellDates: false });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws, { defval: '' });
                setPreview(data);

                // Validação prévia
                const errors: string[] = [];
                data.forEach((row: any, idx: number) => {
                    const partnerName = row['Nome do Sócio'] || row['nome'] || row['socio'];
                    const partnerCpf = row['CPF do Sócio'] || row['cpf'];
                    const dateRaw = row['Data da Retirada (DD-MM-AAAA)'] || row['Data da Retirada'] || row['data'];
                    const amount = row['Valor'] || row['valor'];
                    const parsedDate = parseDateDDMMYYYY(dateRaw);

                    if (!partnerName) errors.push(`Linha ${idx + 2}: Nome do sócio ausente.`);
                    if (!partnerCpf) errors.push(`Linha ${idx + 2}: CPF do sócio ausente.`);
                    if (!parsedDate) errors.push(`Linha ${idx + 2}: Data "${dateRaw}" inválida. Use DD-MM-AAAA.`);
                    if (!amount || isNaN(parseFloat(String(amount)))) errors.push(`Linha ${idx + 2}: Valor inválido.`);
                });
                setPreviewErrors(errors);
            } catch (err) {
                toast.error('Erro ao ler o arquivo. Verifique se é um .xlsx ou .xls válido.');
                setFile(null);
                setPreview([]);
            }
        };
        reader.readAsBinaryString(selectedFile);
    };

    const processImport = async () => {
        if (!preview.length || !selectedClientId) return;

        try {
            setLoading(true);
            const withdrawalsToImport: Omit<ProfitWithdrawal, 'id' | 'client' | 'created_at' | 'updated_at'>[] = [];
            const errors: string[] = [];

            preview.forEach((row: any, index: number) => {
                const partnerName = String(row['Nome do Sócio'] || row['nome'] || row['socio'] || '').trim();
                const partnerCpf = String(row['CPF do Sócio'] || row['cpf'] || '').replace(/\D/g, '');
                const dateRaw = row['Data da Retirada (DD-MM-AAAA)'] || row['Data da Retirada'] || row['data'];
                const parsedDate = parseDateDDMMYYYY(dateRaw);
                const amountRaw = String(row['Valor'] || row['valor'] || '0').replace(',', '.');
                const amount = parseFloat(amountRaw);
                const bank = String(row['REINF'] || row['REINF Competência'] || row['Banco'] || row['banco'] || '').trim();
                const observations = String(row['Observações'] || row['observacoes'] || '').trim();

                if (!partnerName) { errors.push(`Linha ${index + 2}: Nome do sócio ausente.`); return; }
                if (!parsedDate) { errors.push(`Linha ${index + 2}: Data "${dateRaw}" inválida. Use DD-MM-AAAA.`); return; }
                if (isNaN(amount) || amount <= 0) { errors.push(`Linha ${index + 2}: Valor inválido.`); return; }

                withdrawalsToImport.push({
                    client_id: selectedClientId,
                    partner_name: partnerName,
                    partner_cpf: partnerCpf,
                    withdrawal_date: parsedDate,
                    amount,
                    bank: bank || null,
                    observations: observations || null,
                });
            });

            if (errors.length > 0) {
                toast.error(`${errors.length} erro(s) encontrado(s)`, {
                    description: errors.slice(0, 3).join('\n') + (errors.length > 3 ? `\n... e mais ${errors.length - 3} erros.` : ''),
                });
                if (withdrawalsToImport.length === 0) { setLoading(false); return; }
            }

            await onImport(withdrawalsToImport);
            toast.success(`${withdrawalsToImport.length} retirada(s) importada(s) com sucesso!`);
            handleClose(false);
        } catch (error) {
            console.error('Erro ao importar:', error);
            toast.error('Erro ao processar importação. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const validRows = preview.length - previewErrors.length;

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-[calc(100vw-2rem)] lg:max-w-lg bg-card border-border rounded-3xl p-6 lg:p-8 overflow-y-auto max-h-[92vh]">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
                            <FileSpreadsheet className="h-5 w-5 text-primary/70" />
                        </div>
                        <DialogTitle className="text-xl font-light tracking-tight text-foreground">
                            Importar Retiradas
                        </DialogTitle>
                    </div>
                    <p className="text-xs font-light text-muted-foreground mt-1">
                        Selecione a empresa e importe a planilha com as retiradas dos sócios.
                    </p>
                </DialogHeader>

                <div className="space-y-5 mt-4">
                    {/* Step 1: Selecionar Empresa com busca */}
                    <div className="space-y-2">
                        <Label className="text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-1.5">
                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground text-[9px] font-medium">1</span>
                            Selecione a Empresa
                        </Label>

                        <Popover open={comboOpen} onOpenChange={setComboOpen}>
                            <PopoverTrigger asChild>
                                <button
                                    role="combobox"
                                    aria-expanded={comboOpen}
                                    className={cn(
                                        "flex h-11 w-full items-center justify-between rounded-2xl border border-border/50 bg-muted/20 px-4 text-sm font-light transition-all",
                                        "hover:border-primary/30 hover:bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/20",
                                        !selectedClientId && "text-muted-foreground"
                                    )}
                                >
                                    <div className="flex items-center gap-2 truncate">
                                        <Building2 className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
                                        <span className="truncate">
                                            {selectedClient
                                                ? (selectedClient.nomeFantasia || selectedClient.razaoSocial)
                                                : "Buscar empresa..."}
                                        </span>
                                    </div>
                                    <ChevronsUpDown className="h-4 w-4 text-muted-foreground/40 flex-shrink-0 ml-2" />
                                </button>
                            </PopoverTrigger>
                            <PopoverContent
                                className="w-[calc(100vw-4rem)] lg:w-[440px] p-0 bg-card border-border rounded-2xl shadow-elevated"
                                align="start"
                                sideOffset={4}
                            >
                                <Command className="rounded-2xl">
                                    <div className="border-b border-border/50 px-1">
                                        <CommandInput
                                            placeholder="Digite o nome da empresa..."
                                            className="h-10 text-sm font-light border-0 focus:ring-0 placeholder:text-muted-foreground/40"
                                        />
                                    </div>
                                    <CommandList className="max-h-60">
                                        <CommandEmpty className="py-8 text-center">
                                            <p className="text-sm font-light text-muted-foreground">Nenhuma empresa encontrada.</p>
                                        </CommandEmpty>
                                        <CommandGroup>
                                            {activeClients.map(client => (
                                                <CommandItem
                                                    key={client.id}
                                                    value={client.nomeFantasia || client.razaoSocial}
                                                    onSelect={() => handleClientSelect(client.id)}
                                                    className="flex items-center gap-3 px-4 py-3 cursor-pointer rounded-xl mx-1 my-0.5 font-light text-sm"
                                                >
                                                    <div className={cn(
                                                        "flex h-7 w-7 items-center justify-center rounded-xl border flex-shrink-0",
                                                        selectedClientId === client.id
                                                            ? "bg-primary/10 border-primary/30"
                                                            : "bg-muted/30 border-border/50"
                                                    )}>
                                                        <Building2 className={cn(
                                                            "h-3.5 w-3.5",
                                                            selectedClientId === client.id ? "text-primary/70" : "text-muted-foreground/40"
                                                        )} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="truncate text-foreground">
                                                            {client.nomeFantasia || client.razaoSocial}
                                                        </p>
                                                        <p className="text-[10px] text-muted-foreground font-normal mt-0.5">
                                                            {client.cnpj}
                                                        </p>
                                                    </div>
                                                    <Check className={cn(
                                                        "h-4 w-4 text-primary flex-shrink-0 transition-opacity",
                                                        selectedClientId === client.id ? "opacity-100" : "opacity-0"
                                                    )} />
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>

                        {selectedClient && (
                            <p className="text-[10px] text-muted-foreground font-light pl-1">
                                CNPJ: <span className="font-normal">{selectedClient.cnpj}</span>
                                {' · '}
                                {selectedClient.quadroSocietario?.length || 0} sócio(s) cadastrado(s)
                            </p>
                        )}
                    </div>

                    {/* Step 2: Upload do arquivo */}
                    <div className={cn("space-y-2 transition-opacity", !selectedClientId && "opacity-40 pointer-events-none")}>
                        <Label className="text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-1.5">
                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground text-[9px] font-medium">2</span>
                            Selecione a Planilha
                        </Label>
                        <div
                            onClick={() => selectedClientId && fileInputRef.current?.click()}
                            className={cn(
                                "group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 transition-all cursor-pointer",
                                file
                                    ? "border-primary/40 bg-primary/[0.02]"
                                    : "border-border/50 hover:border-primary/30 hover:bg-muted/20"
                            )}
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept=".xlsx, .xls"
                                className="hidden"
                            />
                            {file ? (
                                <>
                                    <CheckCircle2 className="h-8 w-8 text-primary/60 mb-3" />
                                    <p className="text-sm font-light text-foreground">{file.name}</p>
                                    <p className="text-[10px] font-normal text-muted-foreground uppercase tracking-widest mt-1">
                                        {preview.length} linha(s) encontrada(s)
                                    </p>
                                    <button
                                        onClick={e => { e.stopPropagation(); setFile(null); setPreview([]); setPreviewErrors([]); }}
                                        className="mt-2 text-[10px] text-muted-foreground hover:text-destructive transition-colors underline"
                                    >
                                        Trocar arquivo
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Upload className="h-8 w-8 text-muted-foreground/30 group-hover:text-primary/40 mb-3 transition-colors" />
                                    <p className="text-sm font-light text-foreground text-center">
                                        {selectedClientId ? 'Clique para selecionar a planilha' : 'Selecione a empresa primeiro'}
                                    </p>
                                    <p className="text-[10px] font-normal text-muted-foreground uppercase tracking-widest mt-1">XLSX ou XLS</p>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Preview / Erros */}
                    {file && preview.length > 0 && (
                        <div className={cn(
                            "rounded-2xl border p-4 space-y-2",
                            previewErrors.length > 0 ? "border-destructive/30 bg-destructive/5" : "border-primary/20 bg-primary/[0.02]"
                        )}>
                            <div className="flex items-center gap-2">
                                <AlertCircle className={cn("h-4 w-4 flex-shrink-0", previewErrors.length > 0 ? "text-destructive/70" : "text-primary/60")} />
                                <p className={cn("text-xs font-light", previewErrors.length > 0 ? "text-destructive/80" : "text-foreground")}>
                                    {previewErrors.length > 0
                                        ? `${previewErrors.length} erro(s) encontrado(s) na planilha`
                                        : `${validRows} retirada(s) prontas para importar`}
                                </p>
                            </div>
                            {previewErrors.length > 0 && (
                                <ul className="space-y-1 mt-1">
                                    {previewErrors.slice(0, 4).map((err, i) => (
                                        <li key={i} className="text-[10px] text-destructive/70 font-light pl-6">• {err}</li>
                                    ))}
                                    {previewErrors.length > 4 && (
                                        <li className="text-[10px] text-muted-foreground font-light pl-6">
                                            ... e mais {previewErrors.length - 4} erro(s).
                                        </li>
                                    )}
                                </ul>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter className="pt-6 gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleClose(false)}
                        className="rounded-xl border-border/50 font-light text-xs uppercase tracking-widest px-6"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={processImport}
                        disabled={loading || !file || !selectedClientId || preview.length === 0}
                        className="rounded-xl shadow-sm shadow-primary/10 font-light text-xs uppercase tracking-widest px-6"
                    >
                        {loading
                            ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Importando...</>
                            : 'Confirmar Importação'
                        }
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
