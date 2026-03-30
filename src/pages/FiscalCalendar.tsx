import { useState, useMemo } from 'react';
import {
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
    FileText,
    Search,
    PlayCircle,
    Hammer,
    Rocket,
    MailCheck,
    Loader2,
    X,
    Clock,
    Activity,
    Filter
} from 'lucide-react';
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    isToday,
    parseISO,
    addDays,
    subDays,
    isBefore
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useDeliveryList, AccountingGuide } from '@/hooks/useDeliveryList';
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";
import {
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useBranding } from '@/context/BrandingContext';

// ── Fases ────────────────────────────────────────────────────────
const START_OFFSET  = 10; // D-10
const FINISH_OFFSET = 5;  // D-5

type Phase = 'start' | 'work' | 'finish' | 'due';

const PHASE_CONFIG: Record<Phase, {
    label: string;
    dot: string;
    bg: string;
    text: string;
    border: string;
    icon: React.ElementType;
}> = {
    start:  { label: 'Início',     dot: 'bg-sky-500',    bg: 'bg-sky-50',     text: 'text-sky-700',    border: 'border-sky-200',    icon: PlayCircle },
    work:   { label: 'Executando', dot: 'bg-amber-500',  bg: 'bg-amber-50',   text: 'text-amber-700',  border: 'border-amber-200',  icon: Hammer },
    finish: { label: 'Revisão',    dot: 'bg-violet-500', bg: 'bg-violet-50',  text: 'text-violet-700', border: 'border-violet-200', icon: CheckCircle2 },
    due:    { label: 'Vencimento', dot: 'bg-red-500',    bg: 'bg-red-50',     text: 'text-red-700',    border: 'border-red-200',    icon: Rocket },
};

interface EnrichedGuide extends AccountingGuide {
    startDate: Date;
    finishDate: Date;
    dueDate: Date;
}

export default function FiscalCalendar() {
    const { officeName } = useBranding();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);
    const [taskSearch, setTaskSearch] = useState('');

    const referenceMonth = format(currentDate, 'yyyy-MM');
    const { guides, loading } = useDeliveryList(referenceMonth);

    const enrichedGuides = useMemo((): EnrichedGuide[] => {
        return guides
            .filter(g => {
                if (!g.due_date) return false;
                if (taskSearch) return (g.type || '').toLowerCase().includes(taskSearch.toLowerCase());
                return true;
            })
            .map(g => {
                const due = parseISO(g.due_date!);
                return {
                    ...g,
                    dueDate: due,
                    startDate: subDays(due, START_OFFSET),
                    finishDate: subDays(due, FINISH_OFFSET),
                };
            });
    }, [guides, taskSearch]);

    const dayMap = useMemo(() => {
        const map: Record<string, { guide: EnrichedGuide; phase: Phase }[]> = {};
        const push = (date: Date, guide: EnrichedGuide, phase: Phase) => {
            const k = format(date, 'yyyy-MM-dd');
            if (!map[k]) map[k] = [];
            map[k].push({ guide, phase });
        };
        enrichedGuides.forEach(g => {
            push(g.startDate,  g, 'start');
            push(g.finishDate, g, 'finish');
            push(g.dueDate,    g, 'due');
            let cursor = addDays(g.startDate, 1);
            while (isBefore(cursor, g.finishDate)) {
                push(cursor, g, 'work');
                cursor = addDays(cursor, 1);
            }
        });
        return map;
    }, [enrichedGuides]);

    const monthStart = startOfMonth(currentDate);
    const calendarDays = eachDayOfInterval({
        start: startOfWeek(monthStart, { weekStartsOn: 0 }),
        end:   endOfWeek(endOfMonth(monthStart), { weekStartsOn: 0 }),
    });

    const selectedDayEntries = useMemo(() => {
        if (!selectedDay) return [];
        return dayMap[format(selectedDay, 'yyyy-MM-dd')] || [];
    }, [selectedDay, dayMap]);

    const stats = useMemo(() => {
        const total = enrichedGuides.length;
        const sent = enrichedGuides.filter(g => g.status === 'sent').length;
        const pending = total - sent;
        const today = new Date();
        const urgent = enrichedGuides.filter(g => {
            if (g.status === 'sent') return false;
            const diff = (g.dueDate.getTime() - today.getTime()) / 86400000;
            return diff >= 0 && diff <= 3;
        }).length;
        return { total, sent, pending, urgent };
    }, [enrichedGuides]);

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-10">

            {/* ── Header ─────────────────────────────────────── */}
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between pt-4">
                <div>
                    <h1 className="text-4xl font-light tracking-tight text-foreground">
                        Calendário de <span className="text-primary font-medium">Tarefas</span>
                    </h1>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.2em] mt-2">
                        {officeName} • Fluxo de Obrigações por Data de Vencimento
                    </p>
                </div>

                {/* Month Navigator */}
                <div className="flex items-center gap-2 bg-card border border-border/30 px-4 py-2 rounded-2xl shadow-sm">
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex flex-col items-center min-w-[150px]">
                        <span className="text-sm font-semibold capitalize">{format(currentDate, 'MMMM', { locale: ptBR })}</span>
                        <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/50 mt-0.5">{format(currentDate, 'yyyy')}</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* ── Stats ────────────────────────────────────────── */}
            <div className="flex flex-wrap md:flex-nowrap items-center gap-3">
                {[
                    { label: 'Total no Mês',   value: stats.total,   bg: 'bg-primary/5',     text: 'text-primary',    icon: FileText },
                    { label: 'Pendentes',      value: stats.pending, bg: 'bg-amber-500/5',   text: 'text-amber-600',  icon: Clock },
                    { label: 'Urgentes (≤3d)', value: stats.urgent,  bg: 'bg-red-500/5',     text: 'text-red-600',    icon: Rocket },
                    { label: 'Concluídas',     value: stats.sent,    bg: 'bg-emerald-500/5', text: 'text-emerald-600',icon: MailCheck },
                ].map(s => (
                    <div key={s.label} className={cn("flex items-center gap-3 px-5 py-3 rounded-2xl flex-1 min-w-[140px]", s.bg)}>
                        <s.icon className={cn("h-4 w-4 shrink-0", s.text)} />
                        <span className={cn("text-lg font-semibold leading-none", s.text)}>{s.value}</span>
                        <span className={cn("text-[10px] uppercase font-bold tracking-widest opacity-60", s.text)}>{s.label}</span>
                    </div>
                ))}
            </div>

            {/* ── Search + Legend ──────────────────────────────── */}
            <div className="bg-card/30 backdrop-blur-md rounded-[2.5rem] p-5 border border-border/40 flex flex-wrap items-center gap-4 shadow-sm">
                <div className="flex-1 min-w-[220px] relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                    <Input
                        placeholder="Buscar tarefa (DAS, FGTS, Simples...)..."
                        value={taskSearch}
                        onChange={e => setTaskSearch(e.target.value)}
                        className="h-12 rounded-xl border-border/20 bg-muted/20 pl-11 font-light text-xs focus-visible:ring-primary/20"
                    />
                </div>
                <div className="flex items-center gap-3 ml-auto flex-wrap">
                    {(Object.entries(PHASE_CONFIG) as [Phase, typeof PHASE_CONFIG[Phase]][]).map(([phase, cfg]) => (
                        <div key={phase} className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                            <div className={cn("h-2 w-2 rounded-full", cfg.dot)} />
                            {cfg.label}
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Calendar ─────────────────────────────────────── */}
            {loading ? (
                <div className="flex items-center justify-center py-32">
                    <Loader2 className="h-8 w-8 animate-spin text-primary/30" />
                </div>
            ) : (
                <div className="bg-card/40 backdrop-blur-md rounded-[2.5rem] border border-border/30 overflow-hidden shadow-lg">
                    {/* Week header */}
                    <div className="grid grid-cols-7 border-b border-border/10 bg-muted/10">
                        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
                            <div key={d} className="py-4 text-center">
                                <span className="text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground/40">{d}</span>
                            </div>
                        ))}
                    </div>

                    {/* Days */}
                    <div className="grid grid-cols-7">
                        {calendarDays.map(day => {
                            const isCurrentMonth = isSameMonth(day, monthStart);
                            const dayKey = format(day, 'yyyy-MM-dd');
                            const entries = dayMap[dayKey] || [];
                            const today = isToday(day);
                            const isSelected = selectedDay ? isSameDay(day, selectedDay) : false;

                            // Group by task name, pick priority phase per name
                            const taskGroups: Record<string, Phase> = {};
                            const phaseOrder: Phase[] = ['due', 'finish', 'start', 'work'];
                            entries.forEach(e => {
                                const name = e.guide.type || '?';
                                if (!taskGroups[name]) taskGroups[name] = e.phase;
                                else {
                                    if (phaseOrder.indexOf(e.phase) < phaseOrder.indexOf(taskGroups[name])) {
                                        taskGroups[name] = e.phase;
                                    }
                                }
                            });

                            const hasDue = entries.some(e => e.phase === 'due');

                            return (
                                <div
                                    key={dayKey}
                                    onClick={() => isCurrentMonth && entries.length > 0 && setSelectedDay(day)}
                                    className={cn(
                                        "border-r border-b border-border/10 p-3 flex flex-col gap-2 min-h-[150px] transition-all duration-150",
                                        !isCurrentMonth && "opacity-10 pointer-events-none",
                                        entries.length > 0 && "cursor-pointer hover:bg-muted/10",
                                        today && "bg-primary/[0.03]",
                                        isSelected && "bg-primary/[0.07] ring-2 ring-inset ring-primary/20",
                                    )}
                                >
                                    {/* Day number */}
                                    <div className="flex items-center justify-between">
                                        <span className={cn(
                                            "h-7 w-7 flex items-center justify-center rounded-lg text-xs font-bold",
                                            today ? "bg-primary text-white shadow-sm" : "text-muted-foreground/60"
                                        )}>
                                            {format(day, 'd')}
                                        </span>
                                        {hasDue && (
                                            <span className="flex h-2 w-2 relative">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-60" />
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                                            </span>
                                        )}
                                    </div>

                                    {/* Task pills — max 3, then overflow badge */}
                                    <div className="space-y-1 overflow-hidden">
                                        {Object.entries(taskGroups).slice(0, 3).map(([name, phase]) => {
                                            const cfg = PHASE_CONFIG[phase];
                                            return (
                                                <div key={name} className={cn(
                                                    "flex items-center gap-1.5 px-2 py-1 rounded-md border text-[9px] font-bold uppercase",
                                                    cfg.bg, cfg.text, cfg.border
                                                )}>
                                                    <div className={cn("h-1.5 w-1.5 rounded-full shrink-0", cfg.dot)} />
                                                    <span className="truncate">{name}</span>
                                                </div>
                                            );
                                        })}
                                        {Object.keys(taskGroups).length > 3 && (
                                            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted/30 border border-border/10">
                                                <span className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-widest">
                                                    +{Object.keys(taskGroups).length - 3} obrigações
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── Dialog: Tarefas do dia ─────────────────────────── */}
            <Dialog open={!!selectedDay} onOpenChange={o => !o && setSelectedDay(null)}>
                <DialogContent className="max-w-4xl w-full p-0 overflow-hidden rounded-[2.5rem] border border-border/30 bg-card shadow-2xl">
                    {selectedDay && (
                        <DaySheet
                            day={selectedDay}
                            entries={selectedDayEntries}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

// ── Day Sheet ────────────────────────────────────────────────────

function DaySheet({ day, entries }: { day: Date; entries: { guide: EnrichedGuide; phase: Phase }[] }) {
    const [search, setSearch] = useState('');
    const [filterPhase, setFilterPhase] = useState<Phase | 'all'>('all');
    const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'ready' | 'sent'>('all');

    const filtered = useMemo(() => {
        return entries.filter(e => {
            const matchesSearch = !search || (e.guide.type || '').toLowerCase().includes(search.toLowerCase());
            const matchesPhase = filterPhase === 'all' || e.phase === filterPhase;
            const matchesStatus =
                filterStatus === 'all' ? true
                : filterStatus === 'sent' ? e.guide.status === 'sent'
                : filterStatus === 'ready' ? !!e.guide.file_url && e.guide.status !== 'sent'
                : /* pending */ !e.guide.file_url && e.guide.status !== 'sent';
            return matchesSearch && matchesPhase && matchesStatus;
        });
    }, [entries, search, filterPhase, filterStatus]);

    // Totals per phase
    const phaseCounts = useMemo(() => {
        const counts: Partial<Record<Phase, number>> = {};
        entries.forEach(e => { counts[e.phase] = (counts[e.phase] || 0) + 1; });
        return counts;
    }, [entries]);

    const statusCounts = useMemo(() => ({
        sent:    entries.filter(e => e.guide.status === 'sent').length,
        ready:   entries.filter(e => !!e.guide.file_url && e.guide.status !== 'sent').length,
        pending: entries.filter(e => !e.guide.file_url && e.guide.status !== 'sent').length,
    }), [entries]);

    return (
        <div>
            {/* Header */}
            <div className="p-6 border-b border-border/10 bg-muted/10 shrink-0">
                <SheetHeader>
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-primary flex flex-col items-center justify-center text-white shadow-lg shrink-0">
                            <span className="text-xl font-black leading-none">{format(day, 'dd')}</span>
                            <span className="text-[9px] uppercase font-bold opacity-60 mt-0.5">{format(day, 'MMM', { locale: ptBR })}</span>
                        </div>
                        <div className="flex-1">
                            <SheetTitle className="text-xl font-light capitalize">
                                {format(day, "EEEE", { locale: ptBR })}
                            </SheetTitle>
                            <SheetDescription className="text-[10px] uppercase font-bold tracking-widest mt-0.5 text-muted-foreground/50">
                                {format(day, "dd 'de' MMMM", { locale: ptBR })} • {entries.length} {entries.length === 1 ? 'tarefa' : 'tarefas'}
                            </SheetDescription>
                        </div>
                        {/* Quick stats inline */}
                        <div className="flex items-center gap-2 shrink-0">
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 text-[10px] font-bold uppercase">{statusCounts.sent} enviados</span>
                            <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-700 text-[10px] font-bold uppercase">{statusCounts.ready} prontos</span>
                            <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500 text-[10px] font-bold uppercase">{statusCounts.pending} pend.</span>
                        </div>
                    </div>
                </SheetHeader>

                {/* Search */}
                <div className="relative mt-5">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
                    <Input
                        placeholder="Buscar tarefa..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="h-10 pl-9 rounded-xl border-border/20 bg-background text-xs focus-visible:ring-primary/20"
                    />
                </div>

                {/* Filter Row: Phase + Status */}
                <div className="flex flex-wrap items-center gap-2 mt-3">
                    {/* Phase filters */}
                    <button
                        onClick={() => setFilterPhase('all')}
                        className={cn(
                            "px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all",
                            filterPhase === 'all'
                                ? "bg-primary text-white border-primary"
                                : "bg-muted/20 text-muted-foreground border-border/20 hover:bg-muted/40"
                        )}
                    >
                        Todas fases
                    </button>
                    {(['due', 'finish', 'start', 'work'] as Phase[]).map(p => {
                        const cfg = PHASE_CONFIG[p];
                        const count = phaseCounts[p] || 0;
                        if (!count) return null;
                        return (
                            <button
                                key={p}
                                onClick={() => setFilterPhase(filterPhase === p ? 'all' : p)}
                                className={cn(
                                    "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all",
                                    filterPhase === p
                                        ? cn(cfg.bg, cfg.text, cfg.border, "shadow-sm")
                                        : "bg-muted/20 text-muted-foreground border-border/20 hover:bg-muted/40"
                                )}
                            >
                                <div className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
                                {cfg.label} ({count})
                            </button>
                        );
                    })}

                    <div className="h-4 w-px bg-border/30 mx-1" />

                    {/* Status filters */}
                    {([
                        { key: 'all',     label: 'Todos status' },
                        { key: 'pending', label: `Pendentes (${statusCounts.pending})`,  cls: 'bg-slate-100 text-slate-600 border-slate-200' },
                        { key: 'ready',   label: `Prontos (${statusCounts.ready})`,    cls: 'bg-amber-50 text-amber-700 border-amber-200' },
                        { key: 'sent',    label: `Enviados (${statusCounts.sent})`,    cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                    ] as const).map(s => (
                        <button
                            key={s.key}
                            onClick={() => setFilterStatus(s.key === filterStatus ? 'all' : s.key as any)}
                            className={cn(
                                "px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all",
                                filterStatus === s.key
                                    ? s.key === 'all' ? 'bg-foreground text-background border-foreground' : s.cls
                                    : "bg-muted/20 text-muted-foreground border-border/20 hover:bg-muted/40"
                            )}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Scrollable task list */}
            <ScrollArea className="h-[calc(85vh-280px)]">
                <div className="p-5 space-y-3">
                    {filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground/30 gap-3">
                            <Clock className="h-10 w-10" />
                            <p className="text-xs font-bold uppercase tracking-widest">Nenhuma tarefa encontrada</p>
                        </div>
                    ) : (
                        filtered.map((e, idx) => {
                            const cfg = PHASE_CONFIG[e.phase];
                            const statusLabel = e.guide.status === 'sent' ? 'Enviado' : e.guide.file_url ? 'Pronto' : 'Pendente';
                            const statusCls = e.guide.status === 'sent'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : e.guide.file_url
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-slate-50 text-slate-500 border-slate-200';

                            return (
                                <div
                                    key={`${e.guide.id}-${idx}`}
                                    className="bg-background border border-border/20 rounded-2xl p-4 flex items-center gap-4 hover:shadow-md transition-all"
                                >
                                    {/* Phase icon */}
                                    <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", cfg.bg, cfg.text)}>
                                        <cfg.icon className="h-5 w-5" />
                                    </div>

                                    {/* Details */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-foreground truncate">{e.guide.type}</p>
                                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                                            <Badge className={cn("text-[9px] font-bold px-2 h-4 border rounded-full", cfg.bg, cfg.text, cfg.border, "border-none")}>
                                                {cfg.label}
                                            </Badge>
                                            <span className="text-[10px] text-muted-foreground/50 font-medium">
                                                Vence {format(e.guide.dueDate, "dd/MM", { locale: ptBR })}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Status */}
                                    <Badge className={cn("text-[9px] font-bold px-3 py-1 rounded-full border shrink-0", statusCls)}>
                                        {statusLabel}
                                    </Badge>
                                </div>
                            );
                        })
                    )}
                </div>
            </ScrollArea>

            {/* Footer */}
            <div className="border-t border-border/10 px-6 py-4 bg-muted/10 flex items-center justify-between shrink-0">
                <p className="text-xs text-muted-foreground font-light">
                    Mostrando <strong className="text-foreground font-semibold">{filtered.length}</strong> de {entries.length} tarefas
                </p>
                {filterPhase !== 'all' && (
                    <button
                        onClick={() => setFilterPhase('all')}
                        className="text-[10px] text-muted-foreground/50 hover:text-primary font-bold uppercase tracking-widest transition-colors flex items-center gap-1"
                    >
                        <X className="h-3 w-3" /> Limpar filtro
                    </button>
                )}
            </div>
        </div>
    );
}
