import { useState } from 'react';
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
import { Input } from "@/components/ui/input";
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
    FileSpreadsheet,
    Building2,
    ChevronsUpDown,
    Check,
    BarChart3,
    Layers,
} from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { Client } from '@/hooks/useClients';
import { ProfitWithdrawal } from '@/hooks/useProfitWithdrawals';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ProfitWithdrawalReportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    withdrawals: ProfitWithdrawal[];
    clients: Client[];
}

type ReportType = 'company' | 'consolidated';

const CURRENCY = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtDate = (d: string) => {
    try { return format(new Date(d + 'T12:00:00'), 'dd/MM/yyyy'); }
    catch { return d; }
};

/** Estilo de célula de cabeçalho */
const headerStyle = {
    fill: { fgColor: { rgb: '1E3A5F' } },
    font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 10 },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: {
        top: { style: 'thin', color: { rgb: 'CCCCCC' } },
        bottom: { style: 'thin', color: { rgb: 'CCCCCC' } },
        left: { style: 'thin', color: { rgb: 'CCCCCC' } },
        right: { style: 'thin', color: { rgb: 'CCCCCC' } },
    }
};

/** Estilo de célula de dados */
const cellStyle = (alt: boolean) => ({
    fill: { fgColor: { rgb: alt ? 'F0F4FF' : 'FFFFFF' } },
    font: { sz: 10 },
    alignment: { vertical: 'center' },
    border: {
        bottom: { style: 'thin', color: { rgb: 'E0E0E0' } },
        left: { style: 'thin', color: { rgb: 'E0E0E0' } },
        right: { style: 'thin', color: { rgb: 'E0E0E0' } },
    }
});

/** Estilo subtotal */
const subtotalStyle = {
    fill: { fgColor: { rgb: 'EBF1FF' } },
    font: { bold: true, sz: 10, color: { rgb: '1E3A5F' } },
    alignment: { horizontal: 'right', vertical: 'center' },
    border: {
        top: { style: 'thin', color: { rgb: 'AAAAAA' } },
        bottom: { style: 'thin', color: { rgb: 'AAAAAA' } },
    }
};

/** Estilo total geral */
const totalStyle = {
    fill: { fgColor: { rgb: '1E3A5F' } },
    font: { bold: true, sz: 11, color: { rgb: 'FFFFFF' } },
    alignment: { horizontal: 'right', vertical: 'center' },
};

/** Seta estilo em célula */
function sc(ws: XLSX.WorkSheet, addr: string, style: any) {
    if (!ws[addr]) ws[addr] = { t: 's', v: '' };
    ws[addr].s = style;
}

/** Gera a planilha de uma empresa */
function buildCompanySheet(
    ws_data: any[][],
    companyWithdrawals: ProfitWithdrawal[],
    companyName: string,
    cnpj: string,
): XLSX.WorkSheet {
    const aoa: any[][] = [];

    // Título
    aoa.push([`RETIRADAS DE LUCRO — ${companyName.toUpperCase()}`]);
    aoa.push([`CNPJ: ${cnpj}`]);
    aoa.push([`Emitido em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`]);
    aoa.push([]); // linha vazia

    // Cabeçalho
    aoa.push(['Data', 'Sócio', 'CPF', 'REINF', 'Observações', 'Valor (R$)']);

    // Agrupar por sócio
    const bySocio: Record<string, ProfitWithdrawal[]> = {};
    companyWithdrawals.forEach(w => {
        const key = w.partner_name;
        if (!bySocio[key]) bySocio[key] = [];
        bySocio[key].push(w);
    });

    let rowIdx = 5; // 0-indexed, linha 6 do xlsx (após 4 linhas de header + vazia + cabec)
    let grandTotal = 0;

    Object.entries(bySocio).forEach(([socioName, items]) => {
        // Ordenar por data
        const sorted = [...items].sort((a, b) => a.withdrawal_date.localeCompare(b.withdrawal_date));
        let socioTotal = 0;

        sorted.forEach((w, i) => {
            socioTotal += w.amount;
            grandTotal += w.amount;
            aoa.push([
                fmtDate(w.withdrawal_date),
                w.partner_name,
                w.partner_cpf,
                w.bank?.toUpperCase() || '—',
                w.observations || '',
                w.amount,
            ]);
            rowIdx++;
        });

        // Subtotal do sócio
        aoa.push(['', '', '', '', `Subtotal — ${socioName}`, socioTotal]);
        rowIdx++;
    });

    // Total geral
    aoa.push([]);
    aoa.push(['', '', '', '', 'TOTAL GERAL', grandTotal]);

    const ws = XLSX.utils.aoa_to_sheet(aoa);

    // Colunas de largura
    ws['!cols'] = [
        { wch: 12 }, // Data
        { wch: 30 }, // Sócio
        { wch: 16 }, // CPF
        { wch: 14 }, // REINF
        { wch: 35 }, // Observações
        { wch: 16 }, // Valor
    ];

    // Merge título
    ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: 5 } },
    ];

    return ws;
}

/** Gera aba de resumo consolidado */
function buildSummarySheet(
    allWithdrawals: ProfitWithdrawal[],
    clients: Client[],
): XLSX.WorkSheet {
    const aoa: any[][] = [];

    aoa.push(['RELATÓRIO CONSOLIDADO — RETIRADAS DE LUCRO']);
    aoa.push([`Emitido em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`]);
    aoa.push([]);
    aoa.push(['Empresa', 'CNPJ', 'Sócio', 'CPF', 'Data', 'REINF', 'Observações', 'Valor (R$)']);

    // Agrupar por empresa
    const byCompany: Record<string, ProfitWithdrawal[]> = {};
    allWithdrawals.forEach(w => {
        if (!byCompany[w.client_id]) byCompany[w.client_id] = [];
        byCompany[w.client_id].push(w);
    });

    let grandTotal = 0;

    Object.entries(byCompany).forEach(([clientId, items]) => {
        const client = clients.find(c => c.id === clientId);
        const companyName = client ? (client.nomeFantasia || client.razaoSocial) : 'Empresa desconhecida';
        const cnpj = client?.cnpj || '';

        const sorted = [...items].sort((a, b) => {
            if (a.partner_name !== b.partner_name) return a.partner_name.localeCompare(b.partner_name);
            return a.withdrawal_date.localeCompare(b.withdrawal_date);
        });

        let companyTotal = 0;
        sorted.forEach(w => {
            companyTotal += w.amount;
            grandTotal += w.amount;
            aoa.push([
                companyName,
                cnpj,
                w.partner_name,
                w.partner_cpf,
                fmtDate(w.withdrawal_date),
                w.bank?.toUpperCase() || '—',
                w.observations || '',
                w.amount,
            ]);
        });

        // Subtotal empresa
        aoa.push(['', '', '', '', '', '', `Subtotal — ${companyName}`, companyTotal]);
        aoa.push([]);
    });

    // Total geral
    aoa.push(['', '', '', '', '', '', 'TOTAL GERAL', grandTotal]);

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!cols'] = [
        { wch: 30 }, // Empresa
        { wch: 20 }, // CNPJ
        { wch: 28 }, // Sócio
        { wch: 16 }, // CPF
        { wch: 12 }, // Data
        { wch: 14 }, // REINF
        { wch: 32 }, // Observações
        { wch: 16 }, // Valor
    ];
    ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } },
    ];

    return ws;
}

export function ProfitWithdrawalReportDialog({
    open,
    onOpenChange,
    withdrawals,
    clients,
}: ProfitWithdrawalReportDialogProps) {
    const [reportType, setReportType] = useState<ReportType>('company');
    const [comboOpen, setComboOpen] = useState(false);
    const [selectedClientId, setSelectedClientId] = useState<string>('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [generating, setGenerating] = useState(false);

    const activeClients = clients.filter(c => c.isActive);
    const selectedClient = clients.find(c => c.id === selectedClientId) || null;

    const handleClose = (isOpen: boolean) => {
        if (!isOpen) {
            setSelectedClientId('');
            setDateFrom('');
            setDateTo('');
            setReportType('company');
        }
        onOpenChange(isOpen);
    };

    /** Filtra retiradas pelo intervalo de datas */
    const filterByDate = (items: ProfitWithdrawal[]) => {
        return items.filter(w => {
            if (dateFrom && w.withdrawal_date < dateFrom) return false;
            if (dateTo && w.withdrawal_date > dateTo) return false;
            return true;
        });
    };

    const generateReport = async () => {
        try {
            setGenerating(true);
            const wb = XLSX.utils.book_new();

            if (reportType === 'company') {
                // Relatório por empresa
                if (!selectedClientId) {
                    toast.error('Selecione uma empresa para gerar o relatório.');
                    return;
                }

                const client = clients.find(c => c.id === selectedClientId)!;
                const companyName = client.nomeFantasia || client.razaoSocial;
                const filtered = filterByDate(withdrawals.filter(w => w.client_id === selectedClientId));

                if (filtered.length === 0) {
                    toast.error('Nenhuma retirada encontrada para esta empresa no período selecionado.');
                    return;
                }

                // Sheet de detalhes
                const ws = buildCompanySheet([], filtered, companyName, client.cnpj);
                XLSX.utils.book_append_sheet(wb, ws, 'Retiradas');

                // Sheet de resumo por sócio
                const bySocio: Record<string, number> = {};
                filtered.forEach(w => {
                    bySocio[w.partner_name] = (bySocio[w.partner_name] || 0) + w.amount;
                });

                const resumeAoa: any[][] = [
                    [`RESUMO POR SÓCIO — ${companyName.toUpperCase()}`],
                    [],
                    ['Sócio', 'CPF', 'Qtd. Retiradas', 'Total (R$)'],
                ];
                const sociosSeen: Record<string, string> = {};
                filtered.forEach(w => { sociosSeen[w.partner_name] = w.partner_cpf; });

                Object.entries(bySocio)
                    .sort((a, b) => b[1] - a[1])
                    .forEach(([name, total]) => {
                        const count = filtered.filter(w => w.partner_name === name).length;
                        resumeAoa.push([name, sociosSeen[name] || '', count, total]);
                    });

                const totalGeral = Object.values(bySocio).reduce((a, b) => a + b, 0);
                resumeAoa.push([]);
                resumeAoa.push(['TOTAL', '', filtered.length, totalGeral]);

                const wsResume = XLSX.utils.aoa_to_sheet(resumeAoa);
                wsResume['!cols'] = [{ wch: 30 }, { wch: 16 }, { wch: 15 }, { wch: 15 }];
                wsResume['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }];
                XLSX.utils.book_append_sheet(wb, wsResume, 'Resumo por Sócio');

                const safeName = companyName.replace(/[/\\?*:[\]]/g, '_').substring(0, 25);
                XLSX.writeFile(wb, `retiradas_${safeName}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
                toast.success(`Relatório "${companyName}" gerado com sucesso!`);

            } else {
                // Relatório consolidado
                const filtered = filterByDate(withdrawals);

                if (filtered.length === 0) {
                    toast.error('Nenhuma retirada encontrada no período selecionado.');
                    return;
                }

                // Aba consolidada (todas as empresas)
                const wsSummary = buildSummarySheet(filtered, clients);
                XLSX.utils.book_append_sheet(wb, wsSummary, 'Consolidado');

                // Uma aba por empresa
                const byCompany: Record<string, ProfitWithdrawal[]> = {};
                filtered.forEach(w => {
                    if (!byCompany[w.client_id]) byCompany[w.client_id] = [];
                    byCompany[w.client_id].push(w);
                });

                Object.entries(byCompany).forEach(([clientId, items]) => {
                    const client = clients.find(c => c.id === clientId);
                    const companyName = client ? (client.nomeFantasia || client.razaoSocial) : 'Desconhecida';
                    const cnpj = client?.cnpj || '';
                    const safeName = companyName.replace(/[/\\?*:[\]]/g, '_').substring(0, 28);
                    const ws = buildCompanySheet([], items, companyName, cnpj);
                    XLSX.utils.book_append_sheet(wb, ws, safeName);
                });

                XLSX.writeFile(wb, `retiradas_consolidado_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
                toast.success('Relatório consolidado gerado com sucesso!');
            }

            handleClose(false);
        } catch (err) {
            console.error(err);
            toast.error('Erro ao gerar o relatório.');
        } finally {
            setGenerating(false);
        }
    };

    // Conta retiradas disponíveis para preview
    const previewCount = (() => {
        let items = filterByDate(withdrawals);
        if (reportType === 'company' && selectedClientId) {
            items = items.filter(w => w.client_id === selectedClientId);
        }
        return items.length;
    })();

    const companiesWithData = new Set(filterByDate(withdrawals).map(w => w.client_id)).size;

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-[calc(100vw-2rem)] lg:max-w-lg bg-card border-border rounded-3xl p-6 lg:p-8 overflow-y-auto max-h-[92vh]">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
                            <BarChart3 className="h-5 w-5 text-primary/70" />
                        </div>
                        <DialogTitle className="text-xl font-light tracking-tight text-foreground">
                            Gerar Relatório XLSX
                        </DialogTitle>
                    </div>
                    <p className="text-xs font-light text-muted-foreground mt-1">
                        Exporte as retiradas em planilha Excel com dados detalhados por sócio.
                    </p>
                </DialogHeader>

                <div className="space-y-5 mt-4">

                    {/* Tipo de relatório */}
                    <div className="space-y-2">
                        <Label className="text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em]">
                            Tipo de Relatório
                        </Label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setReportType('company')}
                                className={cn(
                                    "flex flex-col items-start gap-2 rounded-2xl border-2 p-4 text-left transition-all",
                                    reportType === 'company'
                                        ? "border-primary/50 bg-primary/5 shadow-sm"
                                        : "border-border/50 hover:border-primary/20 hover:bg-muted/20"
                                )}
                            >
                                <div className={cn(
                                    "flex h-8 w-8 items-center justify-center rounded-xl border",
                                    reportType === 'company' ? "bg-primary/10 border-primary/30" : "bg-muted/30 border-border/50"
                                )}>
                                    <Building2 className={cn("h-4 w-4", reportType === 'company' ? "text-primary/70" : "text-muted-foreground/40")} />
                                </div>
                                <div>
                                    <p className={cn("text-sm font-light", reportType === 'company' ? "text-primary" : "text-foreground")}>Por Empresa</p>
                                    <p className="text-[10px] text-muted-foreground font-light mt-0.5">Detalhe + resumo por sócio</p>
                                </div>
                            </button>

                            <button
                                onClick={() => { setReportType('consolidated'); setSelectedClientId(''); }}
                                className={cn(
                                    "flex flex-col items-start gap-2 rounded-2xl border-2 p-4 text-left transition-all",
                                    reportType === 'consolidated'
                                        ? "border-primary/50 bg-primary/5 shadow-sm"
                                        : "border-border/50 hover:border-primary/20 hover:bg-muted/20"
                                )}
                            >
                                <div className={cn(
                                    "flex h-8 w-8 items-center justify-center rounded-xl border",
                                    reportType === 'consolidated' ? "bg-primary/10 border-primary/30" : "bg-muted/30 border-border/50"
                                )}>
                                    <Layers className={cn("h-4 w-4", reportType === 'consolidated' ? "text-primary/70" : "text-muted-foreground/40")} />
                                </div>
                                <div>
                                    <p className={cn("text-sm font-light", reportType === 'consolidated' ? "text-primary" : "text-foreground")}>Consolidado Geral</p>
                                    <p className="text-[10px] text-muted-foreground font-light mt-0.5">Todas as empresas + sócios</p>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Seletor de empresa (apenas "por empresa") */}
                    {reportType === 'company' && (
                        <div className="space-y-2">
                            <Label className="text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em]">
                                Empresa
                            </Label>
                            <Popover open={comboOpen} onOpenChange={setComboOpen}>
                                <PopoverTrigger asChild>
                                    <button
                                        role="combobox"
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
                                <PopoverContent className="w-[calc(100vw-4rem)] lg:w-[440px] p-0 bg-card border-border rounded-2xl shadow-elevated" align="start" sideOffset={4}>
                                    <Command className="rounded-2xl">
                                        <div className="border-b border-border/50 px-1">
                                            <CommandInput
                                                placeholder="Digite o nome da empresa..."
                                                className="h-10 text-sm font-light border-0 focus:ring-0 placeholder:text-muted-foreground/40"
                                            />
                                        </div>
                                        <CommandList className="max-h-56">
                                            <CommandEmpty className="py-6 text-center text-sm font-light text-muted-foreground">
                                                Nenhuma empresa encontrada.
                                            </CommandEmpty>
                                            <CommandGroup>
                                                {activeClients.map(client => {
                                                    const clientWithdrawals = filterByDate(withdrawals.filter(w => w.client_id === client.id));
                                                    return (
                                                        <CommandItem
                                                            key={client.id}
                                                            value={client.nomeFantasia || client.razaoSocial}
                                                            onSelect={() => { setSelectedClientId(client.id); setComboOpen(false); }}
                                                            className="flex items-center gap-3 px-4 py-3 cursor-pointer rounded-xl mx-1 my-0.5 font-light text-sm"
                                                        >
                                                            <div className={cn(
                                                                "flex h-7 w-7 items-center justify-center rounded-xl border flex-shrink-0",
                                                                selectedClientId === client.id ? "bg-primary/10 border-primary/30" : "bg-muted/30 border-border/50"
                                                            )}>
                                                                <Building2 className={cn("h-3.5 w-3.5", selectedClientId === client.id ? "text-primary/70" : "text-muted-foreground/40")} />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="truncate text-foreground">{client.nomeFantasia || client.razaoSocial}</p>
                                                                <p className="text-[10px] text-muted-foreground font-normal mt-0.5">
                                                                    {client.cnpj} · {clientWithdrawals.length} retirada(s)
                                                                </p>
                                                            </div>
                                                            <Check className={cn("h-4 w-4 text-primary flex-shrink-0", selectedClientId === client.id ? "opacity-100" : "opacity-0")} />
                                                        </CommandItem>
                                                    );
                                                })}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                    )}

                    {/* Filtro de período */}
                    <div className="space-y-2">
                        <Label className="text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em]">
                            Período (opcional)
                        </Label>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <p className="text-[10px] text-muted-foreground font-light pl-1">De</p>
                                <Input
                                    type="date"
                                    value={dateFrom}
                                    onChange={e => setDateFrom(e.target.value)}
                                    className="h-10 rounded-2xl border-border/50 bg-muted/20 text-sm font-light"
                                />
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] text-muted-foreground font-light pl-1">Até</p>
                                <Input
                                    type="date"
                                    value={dateTo}
                                    onChange={e => setDateTo(e.target.value)}
                                    className="h-10 rounded-2xl border-border/50 bg-muted/20 text-sm font-light"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Preview do que será gerado */}
                    <div className={cn(
                        "rounded-2xl border p-4",
                        previewCount > 0 ? "border-primary/20 bg-primary/[0.02]" : "border-border/30 bg-muted/10"
                    )}>
                        {reportType === 'company' ? (
                            <p className="text-xs font-light text-foreground">
                                {!selectedClientId
                                    ? <span className="text-muted-foreground">Selecione uma empresa para ver o resumo.</span>
                                    : previewCount > 0
                                        ? <>O relatório terá <strong>{previewCount}</strong> linha(s) de retirada. <br />
                                            <span className="text-[10px] text-muted-foreground">2 abas: Retiradas + Resumo por Sócio</span></>
                                        : <span className="text-muted-foreground">Nenhuma retirada encontrada para esta empresa no período.</span>
                                }
                            </p>
                        ) : (
                            <p className="text-xs font-light text-foreground">
                                {previewCount > 0
                                    ? <>O relatório consolidado terá <strong>{previewCount}</strong> linha(s) de <strong>{companiesWithData}</strong> empresa(s).<br />
                                        <span className="text-[10px] text-muted-foreground">1 aba Consolidado + 1 aba por empresa</span></>
                                    : <span className="text-muted-foreground">Nenhuma retirada encontrada no período selecionado.</span>
                                }
                            </p>
                        )}
                    </div>
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
                        onClick={generateReport}
                        disabled={generating || previewCount === 0 || (reportType === 'company' && !selectedClientId)}
                        className="rounded-xl shadow-sm shadow-primary/10 font-light text-xs uppercase tracking-widest px-6 gap-2"
                    >
                        {generating
                            ? <><Loader2 className="h-4 w-4 animate-spin" /> Gerando...</>
                            : <><FileSpreadsheet className="h-4 w-4" /> Baixar XLSX</>
                        }
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
