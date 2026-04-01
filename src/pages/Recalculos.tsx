import React, { useState, useMemo } from 'react';
import {
    Calculator, Plus, Search, Loader2, CheckCircle2, Clock,
    Hash, Building2, ChevronDown, Check, Download
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog';
import { useClients } from '@/hooks/useClients';
import { useHonorarios, PaymentStatus } from '@/hooks/useHonorarios';
import { formatCurrency, getMonthName } from '@/components/Honorarios/utils/format';
import { MONTHS, YEARS } from '@/components/Honorarios/constants';
import { ResendService } from '@/services/resendService';
import { toast } from 'sonner';
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

const statusBadge = (status?: PaymentStatus) => {
    if (status === 'PAID') return <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-200">Pago</Badge>;
    if (status === 'LATE') return <Badge variant="destructive" className="bg-red-500/15 text-red-700 border-red-200">Atrasado</Badge>;
    return <Badge variant="secondary" className="bg-amber-500/10 text-amber-700 border-amber-200">Pendente</Badge>;
};

const SERVICOS_RECALCULO = [
    { grupo: "Tributos Federais", nome: "DARF – IRPJ / CSLL", valor: 20 },
    { grupo: "Tributos Federais", nome: "DARF – PIS / COFINS", valor: 20 },
    { grupo: "Tributos Federais", nome: "DARF – IRRF", valor: 20 },
    { grupo: "Tributos Federais", nome: "DARF – Simples Nacional (reapuração / PGDAS)", valor: 15 },
    { grupo: "Tributos Federais", nome: "DARF Previdenciário (DCTFWeb)", valor: 20 },
    { grupo: "Tributos Federais", nome: "Parcelamentos Federais – Reemissão de parcela", valor: 20 },
  
    { grupo: "Obrigações Previdenciárias e Trabalhistas", nome: "GPS (INSS) em atraso", valor: 20 },
    { grupo: "Obrigações Previdenciárias e Trabalhistas", nome: "INSS Patronal (DCTFWeb)", valor: 20 },
    { grupo: "Obrigações Previdenciárias e Trabalhistas", nome: "FGTS – Reemissão ou atualização", valor: 30 },
    { grupo: "Obrigações Previdenciárias e Trabalhistas", nome: "DAE Doméstica – Reemissão ou atualização", valor: 30 },
    { grupo: "Obrigações Previdenciárias e Trabalhistas", nome: "Guia de Multa Rescisória do FGTS (GRRF)", valor: 60 },
  
    { grupo: "Tributos Estaduais", nome: "ICMS – Reemissão ou atualização", valor: 25 },
    { grupo: "Tributos Estaduais", nome: "ICMS-ST – Reemissão ou atualização", valor: 25 },
    { grupo: "Tributos Estaduais", nome: "ICMS-DIFAL – Reemissão ou atualização", valor: 25 },
    { grupo: "Tributos Estaduais", nome: "Parcelamentos Estaduais – Reemissão de parcela", valor: 25 },
  
    { grupo: "Tributos Municipais", nome: "ISS – Reemissão ou atualização", valor: 20 },
    { grupo: "Tributos Municipais", nome: "ISS Retido – Reemissão ou atualização", valor: 20 },
    { grupo: "Tributos Municipais", nome: "Taxas Municipais (TFE, TFA e similares)", valor: 20 },
    { grupo: "Tributos Municipais", nome: "Parcelamentos Municipais – Reemissão de parcela", valor: 20 },
];


export default function Recalculos() {
    const { clients, loading: lc } = useClients();
    const { tickets, loading: lh, createTicket, updateTicketStatus, deleteTicket } = useHonorarios();

    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [searchTerm, setSearchTerm] = useState('');

    // modal
    const [addModal, setAddModal] = useState(false);
    const [openClient, setOpenClient] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // form inputs
    const [selectedClientId, setSelectedClientId] = useState('');
    const [serviceName, setServiceName] = useState('');
    const [price, setPrice] = useState('');
    const [departamento, setDepartamento] = useState('');

    const loading = lc || lh;

    const filteredClients = useMemo(() => {
        return clients.filter(c => c.isActive).sort((a, b) => {
            const nameA = a.nomeFantasia || a.razaoSocial || '';
            const nameB = b.nomeFantasia || b.razaoSocial || '';
            return nameA.localeCompare(nameB);
        });
    }, [clients]);

    const activeTickets = useMemo(() => {
        return tickets.filter(t => t.month === currentMonth && t.year === currentYear);
    }, [tickets, currentMonth, currentYear]);

    // Handle create
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClientId || !serviceName || !price || !departamento) {
            toast.error("Preencha todos os campos obrigatórios");
            return;
        }

        try {
            setSubmitting(true);
            const numPrice = Number(price);

            // 1. Maintain module functionality by creating the ticket (Recálculo) in the DB
            await createTicket({
                clientId: selectedClientId,
                month: currentMonth,
                year: currentYear,
                serviceName: `[${departamento}] ${serviceName}`,
                price: numPrice,
                status: 'PENDING',
                requestedAt: new Date().toISOString(),
            });

            // 2. Format client name for email
            const client = clients.find(c => c.id === selectedClientId);
            const clientName = client?.nomeFantasia || client?.razaoSocial || 'Cliente Desconhecido';

            // 3. Send email to financeiro via Resend
            const emailHtml = `
  <div style="margin:0; padding:0; background-color:#f8fafc;">
    <div style="max-width:640px; margin:0 auto; padding:32px 20px; font-family:'Inter', Arial, Helvetica, sans-serif; color:#111827;">
      
      <div style="background-color:#ffffff; border:1px solid #e5e7eb; border-radius:20px; overflow:hidden; box-shadow:0 10px 30px rgba(15,23,42,0.06);">
        
        <!-- Topo -->
        <div style="padding:32px 32px 24px 32px; border-bottom:1px solid #f1f5f9; background:linear-gradient(180deg, #ffffff 0%, #fafafa 100%);">
          <div style="display:inline-block; padding:6px 12px; border:1px solid rgba(210,35,42,0.15); border-radius:999px; font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:#D2232A; font-weight:600; background-color:rgba(210,35,42,0.04);">
            Notificação Interna
          </div>

          <h1 style="margin:18px 0 8px 0; font-size:28px; line-height:1.2; font-weight:300; letter-spacing:-0.03em; color:#0f172a;">
            Novo recálculo registrado
          </h1>

          <p style="margin:0; font-size:15px; line-height:1.7; color:#64748b; font-weight:300;">
            Um novo recálculo foi solicitado no sistema e já está disponível para acompanhamento do financeiro.
          </p>
        </div>

        <!-- Corpo -->
        <div style="padding:32px;">
          
          <div style="background-color:#fcfcfd; border:1px solid #eef2f7; border-radius:18px; padding:24px;">
            
            <table role="presentation" style="width:100%; border-collapse:collapse;">
              <tr>
                <td style="padding:0 0 16px 0; font-size:12px; color:#94a3b8; text-transform:uppercase; letter-spacing:0.08em; width:160px;">
                  Cliente
                </td>
                <td style="padding:0 0 16px 0; font-size:15px; color:#0f172a; font-weight:500;">
                  ${clientName}
                </td>
              </tr>

              <tr>
                <td style="padding:16px 0; font-size:12px; color:#94a3b8; text-transform:uppercase; letter-spacing:0.08em; border-top:1px solid #f1f5f9;">
                  Departamento
                </td>
                <td style="padding:16px 0; font-size:15px; color:#0f172a; font-weight:400; border-top:1px solid #f1f5f9;">
                  ${departamento}
                </td>
              </tr>

              <tr>
                <td style="padding:16px 0; font-size:12px; color:#94a3b8; text-transform:uppercase; letter-spacing:0.08em; border-top:1px solid #f1f5f9;">
                  Serviço
                </td>
                <td style="padding:16px 0; font-size:15px; color:#0f172a; font-weight:400; border-top:1px solid #f1f5f9;">
                  ${serviceName}
                </td>
              </tr>

              <tr>
                <td style="padding:16px 0; font-size:12px; color:#94a3b8; text-transform:uppercase; letter-spacing:0.08em; border-top:1px solid #f1f5f9;">
                  Referência
                </td>
                <td style="padding:16px 0; font-size:15px; color:#0f172a; font-weight:400; border-top:1px solid #f1f5f9;">
                  ${getMonthName(currentMonth)}/${currentYear}
                </td>
              </tr>

              <tr>
                <td style="padding:20px 0 0 0; font-size:12px; color:#94a3b8; text-transform:uppercase; letter-spacing:0.08em; border-top:1px solid #f1f5f9;">
                  Valor
                </td>
                <td style="padding:20px 0 0 0; border-top:1px solid #f1f5f9;">
                  <span style="display:inline-block; font-size:24px; line-height:1; color:#D2232A; font-weight:600; letter-spacing:-0.02em;">
                    ${formatCurrency(numPrice)}
                  </span>
                </td>
              </tr>
            </table>
          </div>

          <!-- Observação -->
          <div style="margin-top:24px; padding:18px 20px; background-color:#fafafa; border:1px solid #f1f5f9; border-radius:14px;">
            <p style="margin:0; font-size:13px; line-height:1.7; color:#64748b; font-weight:300;">
              Este aviso foi gerado automaticamente a partir do módulo de recálculos do sistema.
            </p>
          </div>
        </div>

        <!-- Rodapé -->
        <div style="padding:24px 32px 32px 32px; border-top:1px solid #f1f5f9; background-color:#ffffff; text-align:center;">
          <p style="margin:0; font-size:12px; line-height:1.7; color:#94a3b8; font-weight:300;">
            Enviado automaticamente pelo
            <span style="color:#0f172a; font-weight:500;">JLVIANA Consultoria Contábil</span>
          </p>
          <p style="margin:6px 0 0 0; font-size:11px; color:#cbd5e1; letter-spacing:0.04em;">
            Organização • Estratégia • Conformidade
          </p>
        </div>
      </div>
    </div>
  </div>
`;

            await ResendService.sendEmail({
                to: 'financeiro@jlviana.com.br',
                subject: `Novo Recálculo: ${clientName} - ${serviceName}`,
                html: emailHtml
            });

            toast.success("Recálculo registrado e e-mail enviado ao financeiro!");
            setAddModal(false);

            // cleanup
            setSelectedClientId('');
            setServiceName('');
            setPrice('');
            setDepartamento('');
        } catch (error) {
            console.error(error);
            toast.error("Aconteceu um erro ao tentar enviar.");
        } finally {
            setSubmitting(false);
        }
    };

    const exportToExcel = () => {
        if (activeTickets.length === 0) {
            toast.error("Nenhum recálculo encontrado neste período para exportar.");
            return;
        }

        const dataToExport = activeTickets.map(t => {
            const client = clients.find(c => c.id === t.clientId);
            const clientName = client?.nomeFantasia || client?.razaoSocial || 'Cliente Desconhecido';
            
            // Extract departamento if previously saved as "[Departamento] Serviço"
            let devDepartment = '-';
            let devService = t.serviceName;
            
            if (t.serviceName.startsWith('[')) {
                const endIdx = t.serviceName.indexOf(']');
                if (endIdx !== -1) {
                    devDepartment = t.serviceName.substring(1, endIdx);
                    devService = t.serviceName.substring(endIdx + 1).trim();
                }
            }

            return {
                'Mês Referência': `${getMonthName(currentMonth)}/${currentYear}`,
                'Cliente / Empresa': clientName,
                'Departamento Origem': devDepartment,
                'Serviço / Recálculo': devService,
                'Valor Cobrado (R$)': t.price,
                'Status do Pagamento': t.status === 'PAID' ? 'Pago' : (t.status === 'LATE' ? 'Atrasado' : 'Pendente')
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Recálculos");
        XLSX.writeFile(workbook, `Relatorio_Recalculos_${getMonthName(currentMonth)}_${currentYear}.xlsx`);
        toast.success("Download do relatório consolidado iniciado!");
    };

    const MonthYearPicker = () => (
        <div className="flex items-center gap-2">
            <select value={currentMonth} onChange={e => setCurrentMonth(Number(e.target.value))}
                className="h-10 rounded-xl border border-border/50 bg-card px-4 text-sm font-light focus:outline-none focus:ring-2 focus:ring-primary/20">
                {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
            <select value={currentYear} onChange={e => setCurrentYear(Number(e.target.value))}
                className="h-10 rounded-xl border border-border/50 bg-card px-4 text-sm font-light focus:outline-none focus:ring-2 focus:ring-primary/20">
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
        </div>
    );

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50/50">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-sm font-light text-muted-foreground uppercase tracking-wider">Carregando recálculos...</span>
            </div>
        </div>
    );

    return (
        <div className="flex-1 space-y-8 p-8 pt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-light tracking-tight flex items-center gap-3">
                        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                            <Calculator className="h-6 w-6 text-primary" />
                        </div>
                        Recálculos
                    </h2>
                    <p className="text-sm text-muted-foreground mt-2 font-light tracking-wide">
                        Gestão de recálculos de guias, impostos e serviços avulsos
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <MonthYearPicker />
                    <Button onClick={exportToExcel} variant="outline" className="h-10 rounded-xl px-4 uppercase tracking-widest text-xs font-medium border-primary/20 text-primary hover:bg-primary/5 transition-colors shadow-sm">
                        <Download className="mr-2 h-4 w-4" /> Relatório XLSX
                    </Button>
                    <Button onClick={() => setAddModal(true)} className="h-10 rounded-xl px-6 uppercase tracking-widest text-xs font-medium bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
                        <Plus className="mr-2 h-4 w-4" /> Novo Recálculo
                    </Button>
                </div>
            </div>

            <div className="relative">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/40" />
                <input
                    className="h-14 w-full rounded-2xl border border-border/50 bg-card pl-12 pr-4 text-sm font-light placeholder:text-muted-foreground/40 focus:border-primary/30 focus:outline-none focus:ring-4 focus:ring-primary/[0.02] shadow-sm transition-all"
                    placeholder="Buscar por cliente na lista abaixo..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="space-y-6">
                {filteredClients.filter(c =>
                    (c.nomeFantasia || c.razaoSocial || '').toLowerCase().includes(searchTerm.toLowerCase())
                ).map(c => {
                    const ct = activeTickets.filter(t => t.clientId === c.id);
                    if (ct.length === 0 && searchTerm) return null; // hide if searching and no tickets? Or maybe show all matched clients. The original code in HonorarioMaster showed clients and let you add. We'll only show clients that HAVE tickets, unless searching.

                    // To keep it clean, let's only render clients that HAVE recalculos this month, 
                    // or if not, we still show them if they match search? 
                    // Wait, original design showed all active clients. Let's do exactly that.

                    if (ct.length === 0) return null; // OPTIMIZATION: only show clients with recalculations this month!

                    const clientName = c.nomeFantasia || c.razaoSocial;

                    return (
                        <div key={c.id} className="rounded-3xl border border-border/50 bg-card shadow-sm overflow-hidden">
                            <div className="flex items-center justify-between px-6 py-5 border-b border-border/40 bg-muted/5">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                        <Building2 className="h-5 w-5 text-primary/60" />
                                    </div>
                                    <div>
                                        <p className="text-base font-medium text-foreground">{clientName}</p>
                                        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                                            {ct.length} recálculo(s) · Total: {formatCurrency(ct.reduce((s, t) => s + t.price, 0))}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <Table>
                                <TableHeader className="bg-transparent">
                                    <TableRow className="border-border/40 hover:bg-transparent">
                                        {['Recálculo / Serviço', 'Valor', 'Status', ''].map(h => (
                                            <TableHead key={h} className="text-[10px] font-black uppercase tracking-[0.2em] py-4 text-muted-foreground/60">{h}</TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {ct.map(t => (
                                        <TableRow key={t.id} className="border-border/10 hover:bg-muted/30 transition-colors">
                                            <TableCell className="font-light text-sm">{t.serviceName}</TableCell>
                                            <TableCell className="font-medium text-sm text-foreground">{formatCurrency(t.price)}</TableCell>
                                            <TableCell>{statusBadge(t.status)}</TableCell>
                                            <TableCell>
                                                <div className="flex justify-end gap-2 pr-4">
                                                    {t.status !== 'PAID' && (
                                                        <Button variant="ghost" size="sm" onClick={() => updateTicketStatus(t.id, 'PAID')}
                                                            className="h-8 px-4 text-[10px] font-bold uppercase tracking-widest text-emerald-600 hover:text-emerald-700 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg">
                                                            Marcar Pago
                                                        </Button>
                                                    )}
                                                    <Button variant="ghost" size="sm" onClick={() => deleteTicket(t.id)}
                                                        className="h-8 px-4 text-[10px] font-bold uppercase tracking-widest text-destructive hover:text-destructive bg-destructive/10 hover:bg-destructive/20 rounded-lg">
                                                        Excluir
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    );
                })}

                {filteredClients.filter(c => activeTickets.filter(t => t.clientId === c.id).length > 0).length === 0 && (
                    <div className="flex flex-col items-center justify-center rounded-[2rem] border-2 border-dashed border-border py-24 bg-card/50">
                        <Hash className="h-12 w-12 text-muted-foreground/30 mb-4" />
                        <h3 className="text-xl font-light text-foreground">Nenhum recálculo</h3>
                        <p className="text-sm font-light text-muted-foreground mt-2 max-w-sm text-center">
                            Você não possui recálculos registrados para o período de {getMonthName(currentMonth)} de {currentYear}.
                        </p>
                        <Button variant="outline" onClick={() => setAddModal(true)} className="mt-6 rounded-xl border-border/50 uppercase tracking-widest text-xs font-semibold">
                            Registrar Primeiro Recálculo
                        </Button>
                    </div>
                )}
            </div>

            {/* Modal de Novo Recálculo */}
            <Dialog open={addModal} onOpenChange={v => { setAddModal(v); if (!v) { setSelectedClientId(''); setServiceName(''); setPrice(''); setDepartamento(''); } }}>
                <DialogContent className="max-w-3xl bg-card border-border rounded-[2.5rem] p-10 overflow-hidden shadow-2xl">
                    <DialogHeader className="mb-10 text-left">
                        <DialogTitle className="text-3xl font-light tracking-tight flex items-center gap-3">
                            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                                <Calculator className="h-6 w-6 text-primary" />
                            </div>
                            Adicionar Recálculo
                        </DialogTitle>
                        <DialogDescription className="font-light mt-3 text-base">
                            O recálculo será contabilizado no fechamento dos Honorários e notificado automaticamente ao financeiro.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSave} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                            <div className="space-y-3 md:col-span-2">
                                <label className="text-[10px] uppercase tracking-[0.2em] font-medium opacity-50">Cliente / Empresa *</label>
                                <Popover open={openClient} onOpenChange={setOpenClient}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            className={cn(
                                                "w-full h-16 rounded-2xl justify-between bg-muted/10 border-border/40 px-6 font-light text-base hover:bg-muted/20 transition-all",
                                                !selectedClientId && "text-muted-foreground"
                                            )}
                                        >
                                            {selectedClientId
                                                ? filteredClients.find((c) => c.id === selectedClientId)?.nomeFantasia || filteredClients.find((c) => c.id === selectedClientId)?.razaoSocial
                                                : "Selecione o cliente..."}
                                            <ChevronDown className="ml-2 h-5 w-5 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-2xl border-border shadow-2xl bg-card z-[9999]" align="start">
                                        <Command>
                                            <CommandInput placeholder="Buscar cliente..." className="h-14 font-light border-none ring-0 focus:ring-0" />
                                            <CommandList className="max-h-[350px] p-2">
                                                <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                                                <CommandGroup>
                                                    {filteredClients.map((c) => (
                                                        <CommandItem
                                                            key={c.id}
                                                            value={c.nomeFantasia || c.razaoSocial}
                                                            onSelect={() => {
                                                                setSelectedClientId(c.id);
                                                                setOpenClient(false);
                                                            }}
                                                            className="flex items-center gap-3 py-4 px-4 cursor-pointer hover:bg-primary/5 focus:bg-primary/5 transition-colors rounded-xl mb-1 group"
                                                        >
                                                            <div className="flex flex-col">
                                                                <span className="font-light text-sm">{c.nomeFantasia || c.razaoSocial}</span>
                                                                <span className="text-[10px] text-muted-foreground uppercase">{c.cnpj}</span>
                                                            </div>
                                                            <Check className={cn("ml-auto h-4 w-4 text-primary", selectedClientId === c.id ? "opacity-100" : "opacity-0")} />
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] uppercase tracking-[0.2em] font-medium opacity-50">Departamento *</label>
                                <div className="relative">
                                    <select
                                        required
                                        value={departamento}
                                        onChange={e => setDepartamento(e.target.value)}
                                        className="w-full h-16 rounded-2xl bg-muted/10 border border-border/40 px-6 font-light text-base focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all outline-none appearance-none"
                                    >
                                        <option value="" disabled hidden>Selecione...</option>
                                        <option value="Pessoal">Pessoal</option>
                                        <option value="Fiscal">Fiscal</option>
                                        <option value="Contábil">Contábil</option>
                                        <option value="Financeiro">Financeiro</option>
                                        <option value="Societário">Societário</option>
                                    </select>
                                    <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground opacity-50 pointer-events-none" />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] uppercase tracking-[0.2em] font-medium opacity-50">Valor Cobrado (R$) *</label>
                                <div className="relative">
                                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground font-light text-lg">R$</span>
                                    <input
                                        required
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={price}
                                        onChange={e => setPrice(e.target.value)}
                                        placeholder="0,00"
                                        className="w-full h-16 rounded-2xl bg-muted/10 border border-border/40 pl-14 pr-6 font-medium text-lg focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3 md:col-span-2">
                                <label className="text-[10px] uppercase tracking-[0.2em] font-medium opacity-50">O que está sendo recalculado? *</label>
                                <div className="relative">
                                    <select 
                                        required
                                        value={serviceName}
                                        onChange={e => {
                                            const val = e.target.value;
                                            setServiceName(val);
                                            const found = SERVICOS_RECALCULO.find(s => s.nome === val);
                                            if (found) {
                                                setPrice(found.valor.toString());
                                            }
                                        }}
                                        className="w-full h-16 rounded-2xl bg-muted/10 border border-border/40 px-6 font-light text-base focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all outline-none appearance-none"
                                    >
                                        <option value="" disabled hidden>Selecione um recálculo da tabela...</option>
                                        {Array.from(new Set(SERVICOS_RECALCULO.map(s => s.grupo))).map(grupo => (
                                            <optgroup key={grupo} label={grupo} className="font-bold">
                                                {SERVICOS_RECALCULO.filter(s => s.grupo === grupo).map(s => (
                                                    <option key={s.nome} value={s.nome}>{s.nome}</option>
                                                ))}
                                            </optgroup>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground opacity-50 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between items-center gap-4 pt-10 border-t border-border/10 mt-6 md:col-span-2">
                            <Button type="button" variant="ghost" onClick={() => setAddModal(false)} className="rounded-2xl h-14 px-8 font-light uppercase tracking-widest text-xs text-muted-foreground hover:bg-muted/30">
                                Cancelar
                            </Button>

                            <Button
                                type="submit"
                                disabled={submitting}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl h-14 px-10 font-normal uppercase tracking-widest text-xs shadow-xl shadow-primary/20 transition-all active:scale-95 flex items-center gap-3"
                            >
                                {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Clock className="h-5 w-5" />}
                                Agendar e Notificar Financeiro
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
