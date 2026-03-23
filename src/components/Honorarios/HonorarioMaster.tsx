import React, { useState, useMemo } from 'react';
import {
    Users, LayoutDashboard, Plus, Search, Download,
    CheckCircle2, Clock, TrendingUp, Settings,
    DollarSign, Hash, Calculator, Send, Mail,
    MessageCircle, ExternalLink, Loader2, Edit2,
    LayoutGrid, List, SortAsc, SortDesc, Building2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { useClients } from '@/hooks/useClients';
import { useHonorarios, PaymentStatus, PaymentMethod } from '@/hooks/useHonorarios';
import { MONTHS, YEARS, EXTRA_SERVICES } from './constants';
import { formatCurrency, getMonthName } from './utils/format';
import * as XLSX from 'xlsx';

// ── nav tabs ──────────────────────────────────────────────────
type Tab = 'dashboard' | 'billing' | 'clients' | 'recalculations' | 'utilities' | 'settings';
const NAV: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'billing', label: 'Cobrança', icon: DollarSign },
    { id: 'clients', label: 'Clientes', icon: Users },
    { id: 'recalculations', label: 'Recálculos', icon: Hash },
    { id: 'utilities', label: 'Calculadora', icon: Calculator },
    { id: 'settings', label: 'Configurações', icon: Settings },
];

// ── status helpers ─────────────────────────────────────────────
const statusBadge = (status?: PaymentStatus) => {
    if (status === 'PAID') return <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-200 hover:bg-emerald-500/25">Pago</Badge>;
    if (status === 'LATE') return <Badge variant="destructive" className="bg-red-500/15 text-red-700 border-red-200">Atrasado</Badge>;
    return <Badge variant="secondary" className="bg-amber-500/10 text-amber-700 border-amber-200">Pendente</Badge>;
};

// ── component ──────────────────────────────────────────────────
export const HonorarioMaster: React.FC<{ className?: string }> = ({ className = '' }) => {
    const { clients, loading: lc } = useClients();
    const { configs, payments, tickets, loading: lh,
        upsertConfig, getConfig, upsertPayment, getPayment,
        createTicket, updateTicketStatus, deleteTicket } = useHonorarios();

    // ui state
    const [activeTab, setActiveTab] = useState<Tab>('dashboard');
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [sortBy, setSortBy] = useState<'asc' | 'desc'>('asc');

    // modals
    const [payModal, setPayModal] = useState(false);
    const [ticketModal, setTicketModal] = useState(false);
    const [commModal, setCommModal] = useState(false);
    const [cfgModal, setCfgModal] = useState(false);
    const [commType, setCommType] = useState<'billing' | 'receipt'>('billing');
    const [payClientId, setPayClientId] = useState<string | null>(null);
    const [ticketClientId, setTicketClientId] = useState<string | null>(null);
    const [commClientId, setCommClientId] = useState<string | null>(null);
    const [cfgClientId, setCfgClientId] = useState<string | null>(null);

    // calculator
    const [calcDisplay, setCalcDisplay] = useState('0');
    const [calcSub, setCalcSub] = useState('');
    const [calcI, setCalcI] = useState({ principal: '', rate: '', time: '', type: 'compound' as 'simple' | 'compound' });
    const [calcResult, setCalcResult] = useState<number | null>(null);

    const loading = lc || lh;

    // derived clients with honorário amount
    const hmClients = useMemo(() => clients.map(c => ({
        ...c,
        name: c.nomeFantasia || c.razaoSocial,
        standardAmount: getConfig(c.id)?.standardAmount ?? 0,
        active: c.isActive,
        // eslint-disable-next-line react-hooks/exhaustive-deps
    })), [clients, configs]);

    const filtered = hmClients
        .filter(c =>
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.cnpj.includes(searchTerm)
        )
        .sort((a, b) => sortBy === 'asc'
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name)
        );

    const stats = useMemo(() => {
        const mp = payments.filter(p => p.month === currentMonth && p.year === currentYear);
        const mt = tickets.filter(t => t.month === currentMonth && t.year === currentYear);
        const expBilling = hmClients.filter(c => c.active).reduce((s, c) => s + c.standardAmount, 0);
        const expTickets = mt.reduce((s, t) => s + t.price, 0);
        const recBilling = mp.filter(p => p.status === 'PAID').reduce((s, p) => s + p.amountPaid, 0);
        const recTickets = mt.filter(t => t.status === 'PAID').reduce((s, t) => s + t.price, 0);
        const expected = expBilling + expTickets;
        const received = recBilling + recTickets;
        return {
            expected, received, pending: expected - received,
            count: hmClients.filter(c => c.active).length,
            progress: expected > 0 ? (received / expected) * 100 : 0
        };
    }, [hmClients, payments, tickets, currentMonth, currentYear]);

    // helpers
    const activePayClient = payClientId ? hmClients.find(c => c.id === payClientId) : null;
    const activeTickClient = ticketClientId ? hmClients.find(c => c.id === ticketClientId) : null;
    const activeCommClient = commClientId ? hmClients.find(c => c.id === commClientId) : null;
    const activeCfgClient = cfgClientId ? hmClients.find(c => c.id === cfgClientId) : null;
    const existingPayment = payClientId ? getPayment(payClientId, currentMonth, currentYear) : null;

    // actions
    const openPayModal = (id: string) => { setPayClientId(id); setPayModal(true); };
    const openTickModal = (id: string) => { setTicketClientId(id); setTicketModal(true); };
    const openCommModal = (id: string, t: 'billing' | 'receipt') => { setCommClientId(id); setCommType(t); setCommModal(true); };
    const openCfgModal = (id: string) => { setCfgClientId(id); setCfgModal(true); };

    const handleSavePay = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!payClientId) return;
        const fd = new FormData(e.currentTarget);
        await upsertPayment({
            id: existingPayment?.id || '',
            clientId: payClientId,
            month: currentMonth, year: currentYear,
            amountBilled: Number(fd.get('amountBilled')),
            amountPaid: Number(fd.get('amountPaid')),
            status: fd.get('status') as PaymentStatus,
            paymentDate: fd.get('paymentDate') as string,
            paymentMethod: fd.get('method') as PaymentMethod,
            notes: fd.get('notes') as string,
        });
        setPayModal(false); setPayClientId(null);
    };

    const handleSaveTicket = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!ticketClientId) return;
        const fd = new FormData(e.currentTarget);
        await createTicket({
            clientId: ticketClientId, month: currentMonth, year: currentYear,
            serviceName: fd.get('serviceName') as string,
            price: Number(fd.get('price')),
            status: 'PENDING',
            requestedAt: new Date().toISOString(),
        });
        setTicketModal(false); setTicketClientId(null);
    };

    const handleSaveCfg = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!cfgClientId) return;
        const fd = new FormData(e.currentTarget);
        await upsertConfig(cfgClientId, Number(fd.get('standardAmount')));
        setCfgModal(false); setCfgClientId(null);
    };

    const handleComm = (mode: 'gmail' | 'outlook' | 'wpp') => {
        if (!activeCommClient) return;
        const pay = getPayment(activeCommClient.id, currentMonth, currentYear);
        const subTxt = commType === 'billing'
            ? `Cobrança de Honorários - ${getMonthName(currentMonth)}/${currentYear}`
            : `Recibo de Pagamento - ${getMonthName(currentMonth)}/${currentYear}`;
        const body = commType === 'billing'
            ? `Olá ${activeCommClient.name},%0D%0A%0D%0AHonorários de ${getMonthName(currentMonth)}/${currentYear}: ${formatCurrency(activeCommClient.standardAmount)}.%0D%0A%0D%0AAtenciosamente.`
            : `Olá ${activeCommClient.name},%0D%0A%0D%0AConfirmamos recebimento de ${formatCurrency(pay?.amountPaid || 0)} ref. ${getMonthName(currentMonth)}/${currentYear}.%0D%0A%0D%0AAtenciosamente.`;
        const sub = encodeURIComponent(subTxt);
        if (mode === 'wpp') window.open(`https://wa.me/${activeCommClient.telefone?.replace(/\D/g, '')}?text=${decodeURIComponent(body)}`, '_blank');
        else if (mode === 'gmail') window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${activeCommClient.email}&su=${sub}&body=${body}`, '_blank');
        else window.open(`https://outlook.office.com/mail/deeplink/compose?to=${activeCommClient.email}&subject=${sub}&body=${body}`, '_blank');
        setCommModal(false);
    };

    const exportExcel = () => {
        const data = filtered.map(c => {
            const p = getPayment(c.id, currentMonth, currentYear);
            return {
                Cliente: c.name, CNPJ: c.cnpj, 'Base Mensal': c.standardAmount,
                Mês: getMonthName(currentMonth), Ano: currentYear,
                Status: p?.status || 'PENDENTE', 'Valor Pago': p?.amountPaid || 0, 'Data Pgto': p?.paymentDate || '-'
            };
        });
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Honorários');
        XLSX.writeFile(wb, `Honorarios_${getMonthName(currentMonth)}_${currentYear}.xlsx`);
    };

    const handleCalc = (v: string) => {
        if (v === 'C') { setCalcDisplay('0'); setCalcSub(''); }
        else if (v === '=') {
            try {
                const r = Function(`"use strict";return(${calcDisplay.replace('x', '*').replace('÷', '/')})`)();
                setCalcSub(calcDisplay + ' ='); setCalcDisplay(String(Number(r.toFixed(2))));
            } catch { setCalcDisplay('Erro'); }
        } else if (['+', '-', 'x', '÷'].includes(v)) {
            setCalcDisplay(p => p + ' ' + v + ' ');
        } else {
            setCalcDisplay(p => (p === '0' || p === 'Erro') ? v : p + v);
        }
    };

    const calcInterest = () => {
        const p = parseFloat(calcI.principal), r = parseFloat(calcI.rate) / 100, t = parseFloat(calcI.time);
        if (isNaN(p) || isNaN(r) || isNaN(t)) return;
        setCalcResult(calcI.type === 'simple' ? p * (1 + r * t) : p * Math.pow(1 + r, t));
    };

    // ── shared sub-components ──────────────────────────────────
    const MonthYearPicker = () => (
        <div className="flex items-center gap-2">
            <select value={currentMonth} onChange={e => setCurrentMonth(Number(e.target.value))}
                className="h-9 rounded-xl border border-border/50 bg-card px-3 text-xs font-light focus:outline-none focus:ring-2 focus:ring-primary/20">
                {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
            <select value={currentYear} onChange={e => setCurrentYear(Number(e.target.value))}
                className="h-9 rounded-xl border border-border/50 bg-card px-3 text-xs font-light focus:outline-none focus:ring-2 focus:ring-primary/20">
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
        </div>
    );

    const inputCls = "h-10 w-full rounded-xl border border-border/50 bg-card px-3 text-sm font-light placeholder:text-muted-foreground/40 focus:border-primary/30 focus:outline-none focus:ring-4 focus:ring-primary/[0.03] transition-all";
    const selectCls = "h-10 w-full rounded-xl border border-border/50 bg-card px-3 text-sm font-light focus:outline-none focus:ring-2 focus:ring-primary/20";

    // ── loading ────────────────────────────────────────────────
    if (loading) return (
        <div className="flex h-64 items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-sm font-light">Carregando honorários...</span>
        </div>
    );

    // ── render ─────────────────────────────────────────────────
    return (
        <div className={`flex h-full w-full overflow-hidden ${className}`}>

            {/* ── SIDEBAR NAV ── */}
            <aside className="w-52 flex-shrink-0 border-r border-border/50 flex flex-col py-6 px-3 gap-1 bg-card/40">
                <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-muted-foreground px-3 mb-3">Honorários</p>
                {NAV.map(item => (
                    <button key={item.id} onClick={() => setActiveTab(item.id)}
                        className={cn(
                            'flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-light uppercase tracking-[0.12em] transition-all duration-200 text-left w-full',
                            activeTab === item.id
                                ? 'bg-primary/8 text-primary border border-primary/10 shadow-sm'
                                : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                        )}>
                        <item.icon className={cn('h-4 w-4 flex-shrink-0', activeTab === item.id ? 'text-primary' : 'text-muted-foreground/50')} />
                        {item.label}
                    </button>
                ))}
            </aside>

            {/* ── MAIN CONTENT ── */}
            <main className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6 max-w-6xl">

                    {/* ═══ DASHBOARD ═══ */}
                    {activeTab === 'dashboard' && (
                        <div className="space-y-6 animate-slide-in-up">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-3xl font-light tracking-tight text-foreground">Dashboard</h1>
                                    <p className="text-xs font-normal text-muted-foreground uppercase tracking-[0.2em] mt-1">Visão geral dos honorários</p>
                                </div>
                                <MonthYearPicker />
                            </div>

                            {/* KPI cards */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                {[
                                    { label: 'Faturamento Esperado', value: formatCurrency(stats.expected), icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-500/8 border-blue-500/15' },
                                    { label: 'Recebido', value: formatCurrency(stats.received), icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/8 border-emerald-500/15' },
                                    { label: 'Pendente', value: formatCurrency(stats.pending), icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/8 border-amber-500/15' },
                                    { label: 'Clientes Ativos', value: String(stats.count), icon: Users, color: 'text-violet-500', bg: 'bg-violet-500/8 border-violet-500/15' },
                                ].map((s, i) => (
                                    <div key={i} className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm transition-all hover:shadow-md">
                                        <div className="flex items-start justify-between mb-4">
                                            <p className="text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em]">{s.label}</p>
                                            <div className={cn('flex h-8 w-8 items-center justify-center rounded-xl border', s.bg)}>
                                                <s.icon className={cn('h-4 w-4', s.color)} />
                                            </div>
                                        </div>
                                        <p className="text-2xl font-light text-foreground">{s.value}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Progress */}
                            <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm">
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-xs font-normal text-muted-foreground uppercase tracking-[0.2em]">Progresso de Recebimento</p>
                                    <p className="text-xs font-light text-foreground">{stats.progress.toFixed(1)}%</p>
                                </div>
                                <div className="h-2 w-full rounded-full bg-muted/40 overflow-hidden">
                                    <div className="h-full rounded-full bg-primary transition-all duration-700"
                                        style={{ width: `${Math.min(stats.progress, 100)}%` }} />
                                </div>
                                <div className="flex justify-between text-[10px] text-muted-foreground mt-2">
                                    <span>Recebido: {formatCurrency(stats.received)}</span>
                                    <span>Meta: {formatCurrency(stats.expected)}</span>
                                </div>
                            </div>

                            {/* Quick table */}
                            <div className="rounded-2xl border border-border/50 bg-card shadow-sm overflow-hidden">
                                <div className="px-5 py-4 border-b border-border/40">
                                    <p className="text-xs font-normal text-muted-foreground uppercase tracking-[0.2em]">
                                        Situação — {getMonthName(currentMonth)}/{currentYear}
                                    </p>
                                </div>
                                <Table>
                                    <TableHeader className="bg-muted/20">
                                        <TableRow className="border-border/40 hover:bg-transparent">
                                            {['Cliente', 'Base Mensal', 'Status', 'Valor Pago', ''].map(h => (
                                                <TableHead key={h} className="text-[10px] font-normal uppercase tracking-[0.2em] py-3">{h}</TableHead>
                                            ))}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {hmClients.filter(c => c.active).slice(0, 8).map(c => {
                                            const p = getPayment(c.id, currentMonth, currentYear);
                                            return (
                                                <TableRow key={c.id} className="border-border/30 hover:bg-muted/20 transition-colors">
                                                    <TableCell className="font-light text-sm">{c.name}</TableCell>
                                                    <TableCell className="text-sm text-muted-foreground">{formatCurrency(c.standardAmount)}</TableCell>
                                                    <TableCell>{statusBadge(p?.status)}</TableCell>
                                                    <TableCell className="text-sm font-light">{p ? formatCurrency(p.amountPaid) : '—'}</TableCell>
                                                    <TableCell>
                                                        <Button variant="ghost" size="sm" onClick={() => openPayModal(c.id)}
                                                            className="text-[10px] font-light uppercase tracking-widest hover:text-primary h-8 px-3">
                                                            {p ? 'Editar' : 'Registrar'}
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                        {hmClients.filter(c => c.active).length === 0 && (
                                            <TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-10">
                                                Nenhum cliente ativo.
                                            </TableCell></TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}

                    {/* ═══ BILLING ═══ */}
                    {activeTab === 'billing' && (
                        <div className="space-y-6 animate-slide-in-up">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h1 className="text-3xl font-light tracking-tight text-foreground">Cobrança</h1>
                                    <p className="text-xs font-normal text-muted-foreground uppercase tracking-[0.2em] mt-1">Honorários mensais</p>
                                </div>
                                <div className="flex gap-2">
                                    <MonthYearPicker />
                                    <Button variant="outline" onClick={exportExcel}
                                        className="rounded-xl border-border/50 font-light text-xs uppercase tracking-wider h-9">
                                        <Download className="mr-2 h-4 w-4 opacity-60" /> Exportar
                                    </Button>
                                </div>
                            </div>

                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/40" />
                                <input className="h-12 w-full rounded-2xl border border-border/50 bg-card pl-12 pr-4 text-sm font-light placeholder:text-muted-foreground/30 focus:border-primary/30 focus:outline-none focus:ring-4 focus:ring-primary/[0.02] shadow-sm transition-all"
                                    placeholder="Buscar cliente..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                            </div>

                            <div className="rounded-2xl border border-border/50 bg-card shadow-sm overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-muted/20">
                                        <TableRow className="border-border/40 hover:bg-transparent">
                                            {['Cliente / CNPJ', 'Base Mensal', 'Status', 'Pago em', 'Ações'].map(h => (
                                                <TableHead key={h} className="text-[10px] font-normal uppercase tracking-[0.2em] py-4">{h}</TableHead>
                                            ))}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filtered.filter(c => c.active).map(c => {
                                            const p = getPayment(c.id, currentMonth, currentYear);
                                            return (
                                                <TableRow key={c.id} className="border-border/30 hover:bg-muted/20 transition-colors group">
                                                    <TableCell>
                                                        <p className="text-sm font-light text-foreground group-hover:text-primary transition-colors">{c.name}</p>
                                                        <p className="text-[10px] text-muted-foreground">{c.cnpj}</p>
                                                    </TableCell>
                                                    <TableCell className="text-sm font-light">{formatCurrency(c.standardAmount)}</TableCell>
                                                    <TableCell>{statusBadge(p?.status)}</TableCell>
                                                    <TableCell className="text-sm text-muted-foreground font-light">{p?.paymentDate || '—'}</TableCell>
                                                    <TableCell>
                                                        <div className="flex gap-1">
                                                            <Button variant="ghost" size="sm" onClick={() => openPayModal(c.id)}
                                                                className="h-8 px-3 text-[10px] font-light uppercase tracking-widest hover:text-primary">
                                                                {p ? 'Editar' : 'Registrar'}
                                                            </Button>
                                                            <Button variant="ghost" size="sm" onClick={() => openCommModal(c.id, 'billing')}
                                                                className="h-8 w-8 p-0 hover:text-primary" title="Enviar cobrança">
                                                                <Send className="h-3.5 w-3.5" />
                                                            </Button>
                                                            {p?.status === 'PAID' && (
                                                                <Button variant="ghost" size="sm" onClick={() => openCommModal(c.id, 'receipt')}
                                                                    className="h-8 w-8 p-0 hover:text-emerald-600" title="Enviar recibo">
                                                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                        {filtered.filter(c => c.active).length === 0 && (
                                            <TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-10">
                                                Nenhum cliente encontrado.
                                            </TableCell></TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}

                    {/* ═══ CLIENTS ═══ */}
                    {activeTab === 'clients' && (
                        <div className="space-y-6 animate-slide-in-up">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h1 className="text-3xl font-light tracking-tight text-foreground">Clientes</h1>
                                    <p className="text-xs font-normal text-muted-foreground uppercase tracking-[0.2em] mt-1">
                                        {hmClients.length} clientes · defina o valor base de honorários
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1 p-1 bg-muted/20 rounded-2xl border border-border/50">
                                        {(['asc', 'desc'] as const).map((s, i) => (
                                            <button key={s} onClick={() => setSortBy(s)}
                                                className={cn('p-2 rounded-xl transition-all', sortBy === s ? 'bg-card text-primary shadow-sm border border-border/10' : 'text-muted-foreground hover:text-foreground')}>
                                                {i === 0 ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-1 p-1 bg-muted/20 rounded-2xl border border-border/50">
                                        <button onClick={() => setViewMode('grid')}
                                            className={cn('p-2 rounded-xl transition-all', viewMode === 'grid' ? 'bg-card text-primary shadow-sm border border-border/10' : 'text-muted-foreground hover:text-foreground')}>
                                            <LayoutGrid className="h-4 w-4" />
                                        </button>
                                        <button onClick={() => setViewMode('list')}
                                            className={cn('p-2 rounded-xl transition-all', viewMode === 'list' ? 'bg-card text-primary shadow-sm border border-border/10' : 'text-muted-foreground hover:text-foreground')}>
                                            <List className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/40" />
                                <input className="h-12 w-full rounded-2xl border border-border/50 bg-card pl-12 pr-4 text-sm font-light placeholder:text-muted-foreground/30 focus:border-primary/30 focus:outline-none focus:ring-4 focus:ring-primary/[0.02] shadow-sm transition-all"
                                    placeholder="Buscar por nome ou CNPJ..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                            </div>

                            {filtered.length === 0 ? (
                                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16">
                                    <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                                    <p className="text-sm font-light text-muted-foreground">Nenhum cliente encontrado.</p>
                                </div>
                            ) : viewMode === 'grid' ? (
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {filtered.map(c => (
                                        <div key={c.id}
                                            className="group relative rounded-2xl border border-border/50 bg-card p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 hover:border-primary/20">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/30 border border-border/10 group-hover:bg-primary/5 group-hover:border-primary/10 transition-colors">
                                                        <Building2 className="h-5 w-5 text-muted-foreground/40 group-hover:text-primary/60 transition-colors" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-light text-foreground group-hover:text-primary transition-colors leading-tight">{c.name}</p>
                                                        <p className="text-[10px] text-muted-foreground mt-0.5">{c.cnpj}</p>
                                                    </div>
                                                </div>
                                                <Button variant="ghost" size="sm" onClick={() => openCfgModal(c.id)}
                                                    className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:text-primary">
                                                    <Edit2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                            <div className="space-y-2 pt-3 border-t border-border/20">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em]">Honorário base</span>
                                                    <span className={cn('text-sm font-light', c.standardAmount === 0 ? 'text-amber-600' : 'text-foreground')}>
                                                        {c.standardAmount > 0 ? formatCurrency(c.standardAmount) : 'Não definido'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em]">Status</span>
                                                    <Badge variant={c.active ? 'default' : 'secondary'}
                                                        className={c.active ? 'bg-emerald-500/15 text-emerald-700 border-emerald-200 hover:bg-emerald-500/25' : ''}>
                                                        {c.active ? 'Ativo' : 'Inativo'}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="rounded-2xl border border-border/50 bg-card shadow-sm overflow-hidden">
                                    <Table>
                                        <TableHeader className="bg-muted/20">
                                            <TableRow className="border-border/40 hover:bg-transparent">
                                                {['Cliente', 'CNPJ', 'Honorário Base', 'Regime', 'Status', ''].map(h => (
                                                    <TableHead key={h} className="text-[10px] font-normal uppercase tracking-[0.2em] py-4">{h}</TableHead>
                                                ))}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filtered.map(c => (
                                                <TableRow key={c.id} className="border-border/30 hover:bg-muted/20 transition-colors group">
                                                    <TableCell className="text-sm font-light group-hover:text-primary transition-colors">{c.name}</TableCell>
                                                    <TableCell className="text-sm text-muted-foreground font-light">{c.cnpj}</TableCell>
                                                    <TableCell className={cn('text-sm font-light', c.standardAmount === 0 ? 'text-amber-600' : '')}>
                                                        {c.standardAmount > 0 ? formatCurrency(c.standardAmount) : 'Não definido'}
                                                    </TableCell>
                                                    <TableCell className="text-xs text-muted-foreground">{c.regimeTributario}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={c.active ? 'default' : 'secondary'}
                                                            className={c.active ? 'bg-emerald-500/15 text-emerald-700 border-emerald-200' : ''}>
                                                            {c.active ? 'Ativo' : 'Inativo'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button variant="ghost" size="sm" onClick={() => openCfgModal(c.id)}
                                                            className="h-8 px-3 text-[10px] font-light uppercase tracking-widest hover:text-primary">
                                                            Definir Valor
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ═══ RECALCULATIONS ═══ */}
                    {activeTab === 'recalculations' && (
                        <div className="space-y-6 animate-slide-in-up">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-3xl font-light tracking-tight text-foreground">Recálculos</h1>
                                    <p className="text-xs font-normal text-muted-foreground uppercase tracking-[0.2em] mt-1">Serviços avulsos por cliente</p>
                                </div>
                                <MonthYearPicker />
                            </div>
                            <div className="space-y-4">
                                {hmClients.filter(c => c.active).map(c => {
                                    const ct = tickets.filter(t => t.clientId === c.id && t.month === currentMonth && t.year === currentYear);
                                    return (
                                        <div key={c.id} className="rounded-2xl border border-border/50 bg-card shadow-sm overflow-hidden">
                                            <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
                                                <div>
                                                    <p className="text-sm font-light text-foreground">{c.name}</p>
                                                    <p className="text-[10px] text-muted-foreground mt-0.5">
                                                        {ct.length} serviço(s) · Total: {formatCurrency(ct.reduce((s, t) => s + t.price, 0))}
                                                    </p>
                                                </div>
                                                <Button size="sm" onClick={() => openTickModal(c.id)}
                                                    className="rounded-xl shadow-sm shadow-primary/10 font-light text-xs uppercase tracking-widest h-8">
                                                    <Plus className="mr-2 h-3.5 w-3.5" /> Adicionar
                                                </Button>
                                            </div>
                                            {ct.length > 0 && (
                                                <Table>
                                                    <TableHeader className="bg-muted/20">
                                                        <TableRow className="border-border/40 hover:bg-transparent">
                                                            {['Serviço', 'Valor', 'Status', ''].map(h => (
                                                                <TableHead key={h} className="text-[10px] font-normal uppercase tracking-[0.2em] py-3">{h}</TableHead>
                                                            ))}
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {ct.map(t => (
                                                            <TableRow key={t.id} className="border-border/30 hover:bg-muted/20 transition-colors">
                                                                <TableCell className="text-sm font-light">{t.serviceName}</TableCell>
                                                                <TableCell className="text-sm font-light">{formatCurrency(t.price)}</TableCell>
                                                                <TableCell>{statusBadge(t.status)}</TableCell>
                                                                <TableCell>
                                                                    <div className="flex gap-1">
                                                                        {t.status !== 'PAID' && (
                                                                            <Button variant="ghost" size="sm" onClick={() => updateTicketStatus(t.id, 'PAID')}
                                                                                className="h-8 px-3 text-[10px] font-light uppercase tracking-widest text-emerald-600 hover:text-emerald-700">
                                                                                Marcar Pago
                                                                            </Button>
                                                                        )}
                                                                        <Button variant="ghost" size="sm" onClick={() => deleteTicket(t.id)}
                                                                            className="h-8 px-3 text-[10px] font-light uppercase tracking-widest text-destructive hover:text-destructive">
                                                                            Excluir
                                                                        </Button>
                                                                    </div>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            )}
                                        </div>
                                    );
                                })}
                                {hmClients.filter(c => c.active).length === 0 && (
                                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16">
                                        <p className="text-sm font-light text-muted-foreground">Nenhum cliente ativo.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ═══ UTILITIES ═══ */}
                    {activeTab === 'utilities' && (
                        <div className="space-y-6 animate-slide-in-up">
                            <div>
                                <h1 className="text-3xl font-light tracking-tight text-foreground">Calculadora</h1>
                                <p className="text-xs font-normal text-muted-foreground uppercase tracking-[0.2em] mt-1">Ferramentas de cálculo financeiro</p>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Basic calc */}
                                <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-sm space-y-4">
                                    <p className="text-xs font-normal text-muted-foreground uppercase tracking-[0.2em]">Calculadora Básica</p>
                                    <div className="rounded-xl bg-muted/20 border border-border/30 p-4 text-right">
                                        <p className="text-[10px] text-muted-foreground min-h-[14px]">{calcSub}</p>
                                        <p className="text-3xl font-light mt-1 truncate text-foreground">{calcDisplay}</p>
                                    </div>
                                    <div className="grid grid-cols-4 gap-2">
                                        {[['C', '÷', 'x', '-'], ['7', '8', '9', '+'], [' 4', '5', '6', ' '], ['1', '2', '3', '=']].flat().map((k, i) => {
                                            const kk = k.trim();
                                            return (
                                                <button key={i} onClick={() => kk && handleCalc(kk)}
                                                    className={cn(
                                                        'h-11 rounded-xl text-sm font-light transition-all border',
                                                        kk === '=' ? 'bg-primary text-primary-foreground border-primary hover:bg-primary/90' :
                                                            ['+', '-', 'x', '÷'].includes(kk) ? 'bg-muted/40 border-border/50 hover:bg-muted/70 text-primary' :
                                                                'bg-muted/20 border-border/30 hover:bg-muted/50 text-foreground'
                                                    )}>
                                                    {kk}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['0', '.', 'C'].map((k, i) => (
                                            <button key={i} onClick={() => handleCalc(k)}
                                                className="h-11 rounded-xl text-sm font-light bg-muted/20 border border-border/30 hover:bg-muted/50 text-foreground transition-all">
                                                {k}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                {/* Interest calc */}
                                <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-sm space-y-4">
                                    <p className="text-xs font-normal text-muted-foreground uppercase tracking-[0.2em]">Calculadora de Juros</p>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em]">Tipo</label>
                                            <select className={cn(selectCls, 'mt-1')} value={calcI.type} onChange={e => setCalcI(p => ({ ...p, type: e.target.value as any }))}>
                                                <option value="simple">Juros Simples</option>
                                                <option value="compound">Juros Compostos</option>
                                            </select>
                                        </div>
                                        {[['Capital (R$)', 'principal', '0,00'], ['Taxa (% ao período)', 'rate', '0,00'], ['Períodos', 'time', '0']].map(([label, field, ph]) => (
                                            <div key={field}>
                                                <label className="text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em]">{label}</label>
                                                <input className={cn(inputCls, 'mt-1')} type="number" placeholder={ph}
                                                    value={(calcI as any)[field]} onChange={e => setCalcI(p => ({ ...p, [field]: e.target.value }))} />
                                            </div>
                                        ))}
                                        <Button onClick={calcInterest} className="w-full rounded-xl font-light text-xs uppercase tracking-wider">Calcular</Button>
                                        {calcResult !== null && (
                                            <div className="rounded-xl bg-primary/5 border border-primary/15 p-4 text-center">
                                                <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">Montante Final</p>
                                                <p className="text-3xl font-light text-primary mt-1">{formatCurrency(calcResult)}</p>
                                                <p className="text-[10px] text-muted-foreground mt-1">Juros: {formatCurrency(calcResult - parseFloat(calcI.principal || '0'))}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ═══ SETTINGS ═══ */}
                    {activeTab === 'settings' && (
                        <div className="space-y-6 animate-slide-in-up">
                            <div>
                                <h1 className="text-3xl font-light tracking-tight text-foreground">Configurações</h1>
                                <p className="text-xs font-normal text-muted-foreground uppercase tracking-[0.2em] mt-1">Dados e exportação</p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {[
                                    { label: 'Clientes', value: hmClients.length },
                                    { label: 'Pagamentos', value: payments.length },
                                    { label: 'Recálculos', value: tickets.length },
                                ].map(s => (
                                    <div key={s.label} className="rounded-2xl border border-border/50 bg-card p-6 shadow-sm text-center">
                                        <p className="text-3xl font-light text-foreground">{s.value}</p>
                                        <p className="text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em] mt-2">{s.label}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-sm space-y-3">
                                <p className="text-xs font-normal text-muted-foreground uppercase tracking-[0.2em] mb-4">Exportar</p>
                                <Button variant="outline" onClick={exportExcel}
                                    className="rounded-xl border-border/50 font-light text-xs uppercase tracking-wider">
                                    <Download className="mr-2 h-4 w-4 opacity-60" /> Exportar Relatório Excel
                                </Button>
                            </div>
                        </div>
                    )}

                </div>
            </main>

            {/* ═══ MODALS ═══ */}

            {/* Payment Modal */}
            <Dialog open={payModal} onOpenChange={v => { setPayModal(v); if (!v) setPayClientId(null); }}>
                <DialogContent className="rounded-2xl border-border/50 max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-light">Registrar Pagamento</DialogTitle>
                        <p className="text-xs text-muted-foreground">{activePayClient?.name} — {getMonthName(currentMonth)}/{currentYear}</p>
                    </DialogHeader>
                    <form onSubmit={handleSavePay} className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em]">Valor Faturado</label>
                                <input name="amountBilled" type="number" step="0.01" className={cn(inputCls, 'mt-1')}
                                    defaultValue={existingPayment?.amountBilled ?? activePayClient?.standardAmount ?? 0} />
                            </div>
                            <div>
                                <label className="text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em]">Valor Recebido</label>
                                <input name="amountPaid" type="number" step="0.01" className={cn(inputCls, 'mt-1')}
                                    defaultValue={existingPayment?.amountPaid ?? 0} />
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em]">Status</label>
                            <select name="status" className={cn(selectCls, 'mt-1')} defaultValue={existingPayment?.status || 'PENDING'}>
                                <option value="PENDING">Pendente</option>
                                <option value="PAID">Pago</option>
                                <option value="LATE">Atrasado</option>
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em]">Data Pagamento</label>
                                <input name="paymentDate" type="date" className={cn(inputCls, 'mt-1')} defaultValue={existingPayment?.paymentDate} />
                            </div>
                            <div>
                                <label className="text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em]">Forma</label>
                                <select name="method" className={cn(selectCls, 'mt-1')} defaultValue={existingPayment?.paymentMethod}>
                                    <option value="">— Selecionar —</option>
                                    {['PIX', 'BOLETO', 'TRANSFER', 'CARD', 'OTHER'].map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em]">Observações</label>
                            <textarea name="notes" rows={2} className={cn(inputCls, 'mt-1 h-auto py-2')} defaultValue={existingPayment?.notes} />
                        </div>
                        <div className="flex gap-3 pt-1">
                            <Button type="submit" className="flex-1 rounded-xl font-light text-xs uppercase tracking-widest">Salvar</Button>
                            <Button type="button" variant="outline" onClick={() => setPayModal(false)} className="flex-1 rounded-xl font-light text-xs uppercase tracking-widest border-border/50">Cancelar</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Config Modal */}
            <Dialog open={cfgModal} onOpenChange={v => { setCfgModal(v); if (!v) setCfgClientId(null); }}>
                <DialogContent className="rounded-2xl border-border/50 max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-light">Honorário Base</DialogTitle>
                        <p className="text-xs text-muted-foreground">{activeCfgClient?.name}</p>
                    </DialogHeader>
                    <form onSubmit={handleSaveCfg} className="space-y-4">
                        <div>
                            <label className="text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em]">Valor mensal (R$) *</label>
                            <input name="standardAmount" type="number" step="0.01" required className={cn(inputCls, 'mt-1')}
                                defaultValue={activeCfgClient?.standardAmount || ''} placeholder="Ex: 1500,00" />
                        </div>
                        <div className="flex gap-3 pt-1">
                            <Button type="submit" className="flex-1 rounded-xl font-light text-xs uppercase tracking-widest">Salvar</Button>
                            <Button type="button" variant="outline" onClick={() => setCfgModal(false)} className="flex-1 rounded-xl font-light text-xs uppercase tracking-widest border-border/50">Cancelar</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Ticket Modal */}
            <Dialog open={ticketModal} onOpenChange={v => { setTicketModal(v); if (!v) setTicketClientId(null); }}>
                <DialogContent className="rounded-2xl border-border/50 max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-light">Adicionar Recálculo</DialogTitle>
                        <p className="text-xs text-muted-foreground">{activeTickClient?.name} — {getMonthName(currentMonth)}/{currentYear}</p>
                    </DialogHeader>
                    <form onSubmit={handleSaveTicket} className="space-y-4">
                        <div>
                            <label className="text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em]">Serviço</label>
                            <input name="serviceName" list="hm-services" required className={cn(inputCls, 'mt-1')} placeholder="Ex: Recálculo Federal" />
                            <datalist id="hm-services">{EXTRA_SERVICES.map(s => <option key={s.id} value={s.name} />)}</datalist>
                        </div>
                        <div>
                            <label className="text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em]">Valor (R$)</label>
                            <input name="price" type="number" step="0.01" required className={cn(inputCls, 'mt-1')} />
                        </div>
                        <div className="flex gap-3 pt-1">
                            <Button type="submit" className="flex-1 rounded-xl font-light text-xs uppercase tracking-widest">Adicionar</Button>
                            <Button type="button" variant="outline" onClick={() => setTicketModal(false)} className="flex-1 rounded-xl font-light text-xs uppercase tracking-widest border-border/50">Cancelar</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Communication Modal */}
            <Dialog open={commModal} onOpenChange={v => { setCommModal(v); if (!v) setCommClientId(null); }}>
                <DialogContent className="rounded-2xl border-border/50 max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-light">{commType === 'billing' ? 'Enviar Cobrança' : 'Enviar Recibo'}</DialogTitle>
                        <p className="text-xs text-muted-foreground">{activeCommClient?.name}</p>
                    </DialogHeader>
                    <div className="space-y-2 pt-2">
                        {[
                            { mode: 'gmail' as const, label: 'Gmail', icon: Mail, color: 'text-red-500' },
                            { mode: 'outlook' as const, label: 'Outlook', icon: ExternalLink, color: 'text-blue-500' },
                            { mode: 'wpp' as const, label: 'WhatsApp', icon: MessageCircle, color: 'text-emerald-500' },
                        ].map(btn => (
                            <Button key={btn.mode} variant="outline" onClick={() => handleComm(btn.mode)}
                                className="w-full justify-start gap-3 rounded-xl border-border/50 font-light h-12 hover:border-primary/20 hover:bg-primary/5">
                                <btn.icon className={cn('h-4 w-4', btn.color)} />
                                {btn.label}
                            </Button>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>

        </div>
    );
};
