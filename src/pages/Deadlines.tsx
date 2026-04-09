import { useMemo, useState } from 'react';
import { 
    Clock, 
    Calendar as CalendarIcon, 
    Building2, 
    ShieldCheck, 
    ArrowRight,
    TrendingUp,
    AlertCircle,
    Info,
    CalendarDays,
    Send,
    Filter,
    Search,
    ChevronRight,
    UserCircle,
    ClipboardList,
    CheckCircle2,
    CalendarCheck,
    Hourglass,
    ArrowRightCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { useObligations } from '@/hooks/useObligations';
import { useBranding } from '@/context/BrandingContext';
import { cn } from '@/lib/utils';

export default function Deadlines() {
    const { officeName } = useBranding();
    const { obligations, loading } = useObligations();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDept, setSelectedDept] = useState<'all' | 'Fiscal' | 'DP' | 'Contábil'>('all');
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const today = new Date();
    const currentDay = today.getDate();

    const deadlinesData = useMemo(() => {
        return obligations
            .filter(o => o.is_active)
            .map(o => {
                const maxAlert = o.alert_days && o.alert_days.length > 0 ? Math.max(...o.alert_days) : 5;
                const minAlert = o.alert_days && o.alert_days.length > 0 ? Math.min(...o.alert_days) : 1;
                
                // Dia de começar (Start Day)
                let startDay = o.default_due_day - maxAlert;
                if (startDay <= 0) startDay = 1; // Não começar antes do dia 1

                // Dia de enviar (Send Day)
                let sendDay = o.default_due_day - minAlert;
                if (sendDay <= 0) sendDay = 1;

                // Dias totais de janela de processamento
                const processingDays = o.default_due_day - startDay;

                // Dias restantes (Days left until due_day)
                let daysLeft = o.default_due_day - currentDay;
                
                // Se o vencimento já passou este mês, mostrar para o próximo (opcional, mas vamos simplificar)
                const status = daysLeft < 0 ? 'passed' : daysLeft <= 3 ? 'urgent' : 'safe';

                return {
                    ...o,
                    startDay,
                    sendDay,
                    processingDays,
                    daysLeft,
                    status
                };
            })
            .filter(o => {
                const matchesSearch = o.name.toLowerCase().includes(searchTerm.toLowerCase());
                const matchesDept = selectedDept === 'all' || o.department === selectedDept;
                return matchesSearch && matchesDept;
            })
            .sort((a, b) => a.default_due_day - b.default_due_day);
    }, [obligations, searchTerm, selectedDept, currentDay]);

    const stats = useMemo(() => {
        return {
            total: deadlinesData.length,
            urgent: deadlinesData.filter(d => d.status === 'urgent').length,
            fiscal: deadlinesData.filter(d => d.department === 'Fiscal').length,
            dp: deadlinesData.filter(d => d.department === 'DP').length,
            contabil: deadlinesData.filter(d => d.department === 'Contábil').length,
        };
    }, [deadlinesData]);

    const getDeptIcon = (dept: string) => {
        switch (dept) {
            case 'Fiscal': return <Building2 className="h-4 w-4" />;
            case 'DP': return <ShieldCheck className="h-4 w-4" />;
            case 'Contábil': return <TrendingUp className="h-4 w-4" />;
            default: return <Clock className="h-4 w-4" />;
        }
    };

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'urgent': return "bg-amber-500 text-white shadow-lg shadow-amber-500/20";
            case 'passed': return "bg-slate-400 text-white opacity-60";
            case 'safe': return "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20";
            default: return "bg-primary text-white";
        }
    };

    const handleOpenDetails = (item: any) => {
        setSelectedItem(item);
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-1000 pb-20 pt-4">
            {/* Header */}
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h1 className="text-5xl font-extralight tracking-tight text-foreground">
                        Cronograma de <span className="text-primary font-normal">Vencimentos</span>
                    </h1>
                    <p className="text-xs font-normal text-muted-foreground uppercase tracking-[0.4em] mt-3 opacity-70">
                        {officeName} • Gestão Inteligente de Prazos
                    </p>
                </div>

                <div className="flex items-center gap-4 bg-white/50 backdrop-blur-md p-2 rounded-3xl border border-white/50 shadow-xl">
                    <div className="flex flex-col items-center px-6 py-2 border-r border-slate-200">
                        <span className="text-2xl font-black text-slate-900 leading-none">{currentDay}</span>
                        <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest mt-1">Hoje</span>
                    </div>
                    <div className="flex flex-col px-4 text-right">
                        <span className="text-sm font-bold text-slate-950 uppercase tracking-tighter">
                            {today.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                        </span>
                        <span className="text-[10px] font-medium text-primary">Painel em Tempo Real</span>
                    </div>
                </div>
            </div>

            {/* Metrics Quickview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="rounded-[2.5rem] bg-indigo-500/5 border-indigo-500/10 shadow-none overflow-hidden group hover:bg-indigo-500/10 transition-all duration-500">
                    <CardContent className="p-8">
                        <div className="flex items-center justify-between">
                            <div className="bg-white rounded-2xl h-14 w-14 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                <ClipboardList className="h-7 w-7 text-indigo-500" />
                            </div>
                            <span className="text-4xl font-extralight text-indigo-500">{stats.total}</span>
                        </div>
                        <div className="mt-6">
                            <h3 className="text-sm font-black uppercase tracking-widest text-indigo-900/40 leading-none">Total Geral</h3>
                            <p className="text-xs text-indigo-950/60 mt-1">Obrigações ativas neste mês</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-[2.5rem] bg-rose-500/5 border-rose-500/10 shadow-none overflow-hidden group hover:bg-rose-500/10 transition-all duration-500">
                    <CardContent className="p-8">
                        <div className="flex items-center justify-between">
                            <div className="bg-white rounded-2xl h-14 w-14 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                <AlertCircle className="h-7 w-7 text-rose-500" />
                            </div>
                            <span className="text-4xl font-extralight text-rose-500">{stats.urgent}</span>
                        </div>
                        <div className="mt-6">
                            <h3 className="text-sm font-black uppercase tracking-widest text-rose-900/40 leading-none">Vencimentos Próximos</h3>
                            <p className="text-xs text-rose-950/60 mt-1">Prazo inferior a 3 dias</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-[2.5rem] bg-amber-500/5 border-amber-500/10 shadow-none overflow-hidden group hover:bg-amber-500/10 transition-all duration-500">
                    <CardContent className="p-8">
                        <div className="flex items-center justify-between">
                            <div className="bg-white rounded-2xl h-14 w-14 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                <Building2 className="h-7 w-7 text-amber-500" />
                            </div>
                            <span className="text-4xl font-extralight text-amber-500">{stats.fiscal}</span>
                        </div>
                        <div className="mt-6">
                            <h3 className="text-sm font-black uppercase tracking-widest text-amber-900/40 leading-none">Setor Fiscal</h3>
                            <p className="text-xs text-amber-950/60 mt-1">Obrigações tributárias e guias</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-[2.5rem] bg-emerald-500/5 border-emerald-500/10 shadow-none overflow-hidden group hover:bg-emerald-500/10 transition-all duration-500">
                    <CardContent className="p-8">
                        <div className="flex items-center justify-between">
                            <div className="bg-white rounded-2xl h-14 w-14 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                <ShieldCheck className="h-7 w-7 text-emerald-500" />
                            </div>
                            <span className="text-4xl font-extralight text-emerald-500">{stats.dp}</span>
                        </div>
                        <div className="mt-6">
                            <h3 className="text-sm font-black uppercase tracking-widest text-emerald-900/40 leading-none">Setor DP</h3>
                            <p className="text-xs text-emerald-950/60 mt-1">Folha e obrigações sociais</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filter Area */}
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-card/40 backdrop-blur-md p-6 rounded-[2rem] border border-border/40">
                <div className="flex-1 w-full relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/30" />
                    <Input 
                        placeholder="Pesquisar por obrigação..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="h-14 rounded-2xl border-none bg-muted/20 pl-12 font-medium text-slate-700/80 focus-visible:ring-primary/20 placeholder:text-muted-foreground/40 transition-all"
                    />
                </div>
                
                <div className="flex items-center gap-2 bg-muted/20 p-1.5 rounded-2xl">
                    {(['all', 'Fiscal', 'DP', 'Contábil'] as const).map((dept) => (
                        <Button
                            key={dept}
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedDept(dept)}
                            className={cn(
                                "h-11 px-6 rounded-xl transition-all duration-500 text-xs font-black uppercase tracking-widest",
                                selectedDept === dept 
                                    ? "bg-white shadow-lg text-primary ring-1 ring-slate-200" 
                                    : "text-slate-500 hover:bg-white/40"
                            )}
                        >
                            {dept === 'all' ? 'Ver Todos' : dept}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Deadlines List/Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {loading ? (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center gap-4">
                        <div className="h-12 w-12 rounded-2xl border-2 border-primary border-t-transparent animate-spin" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Calculando Prazos...</span>
                    </div>
                ) : deadlinesData.length === 0 ? (
                    <div className="col-span-full py-32 bg-slate-50/50 rounded-[3rem] border border-dashed border-slate-200 flex flex-col items-center justify-center text-center opacity-40">
                        <CalendarIcon className="h-20 w-20 stroke-[1px] mb-4" />
                        <h4 className="text-xl font-light uppercase tracking-widest">Nenhuma obrigação filtrada</h4>
                        <p className="text-xs font-medium mt-2">Ajuste seus filtros ou verifique se há obrigações ativas.</p>
                    </div>
                ) : (
                    deadlinesData.map((item) => (
                        <Card key={item.id} className="group rounded-[2.5rem] border-white bg-white/60 hover:bg-white shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 ease-out overflow-hidden border">
                            <CardHeader className="p-8 pb-0 space-y-4">
                                <div className="flex items-center justify-between mb-2">
                                    <Badge className="rounded-xl px-4 py-1.5 bg-slate-100 text-slate-500 border-none font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                                        {getDeptIcon(item.department)}
                                        {item.department}
                                    </Badge>
                                    
                                    <div className={cn(
                                        "h-10 w-10 rounded-2xl flex items-center justify-center font-black text-sm shadow-md",
                                        getStatusStyles(item.status)
                                    )}>
                                        {item.default_due_day}
                                    </div>
                                </div>
                                
                                <div className="space-y-1">
                                    <CardTitle className="text-xl font-bold text-slate-800 group-hover:text-primary transition-colors leading-tight">
                                        {item.name}
                                    </CardTitle>
                                    <CardDescription className="text-xs font-medium uppercase tracking-[0.15em] text-slate-400 pt-1">
                                        Periodicidade: {item.periodicity}
                                    </CardDescription>
                                </div>
                            </CardHeader>

                            <CardContent className="p-8 pt-6 space-y-8">
                                <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                                <TrendingUp className="h-4 w-4 text-emerald-600" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none">Começar a Fazer</span>
                                                <span className="text-sm font-bold text-slate-900 mt-1">Dia {item.startDay < 10 ? `0${item.startDay}` : item.startDay}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 text-right">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none">Enviar ao Cliente</span>
                                                <span className="text-sm font-bold text-slate-900 mt-1">Dia {item.sendDay < 10 ? `0${item.sendDay}` : item.sendDay}</span>
                                            </div>
                                            <div className="h-9 w-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                                <Send className="h-4 w-4 text-blue-600" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Progress line visualization */}
                                    <div className="relative pt-2 px-1">
                                        <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                                            <div 
                                                className={cn(
                                                    "h-full rounded-full transition-all duration-1000",
                                                    item.status === 'urgent' ? 'bg-amber-500' : 'bg-primary'
                                                )}
                                                style={{ width: `${Math.min(100, Math.max(5, (currentDay / item.default_due_day) * 100))}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-2">
                                    <div className="flex -space-x-3">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center ring-4 ring-white">
                                            <Clock className="h-4 w-4 text-primary" />
                                        </div>
                                        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center ring-4 ring-white text-[10px] font-black text-slate-400 uppercase">
                                            {item.type.charAt(0)}
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Status Operacional</p>
                                        {item.status === 'passed' ? (
                                            <span className="text-xs font-bold text-slate-400">Vencimento passado</span>
                                        ) : (
                                            <div className="flex items-center gap-1.5 justify-end">
                                                <span className={cn(
                                                    "text-lg font-black",
                                                    item.status === 'urgent' ? 'text-amber-600' : 'text-emerald-600'
                                                )}>
                                                    {item.daysLeft}
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Dias restantes</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                <Button 
                                    variant="ghost" 
                                    className="w-full h-14 rounded-2xl bg-slate-50 hover:bg-primary/5 hover:text-primary transition-all duration-300 group/btn border border-slate-100/50"
                                    onClick={() => handleOpenDetails(item)}
                                >
                                    <div className="flex items-center justify-between w-full px-2">
                                        <span className="text-xs font-black uppercase tracking-widest">Detalhes do Fluxo</span>
                                        <ChevronRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                                    </div>
                                </Button>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
            
            {/* Modal de Detalhes do Fluxo */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[600px] rounded-[2.5rem] p-0 border-none shadow-2xl overflow-y-auto max-h-[90vh] animate-in zoom-in-95 duration-300">
                    {selectedItem && (
                        <>
                            <DialogHeader className="p-10 bg-slate-50 border-b border-slate-100 relative">
                                <div className="absolute top-10 right-10">
                                    <div className={cn(
                                        "h-16 w-16 rounded-[1.5rem] flex items-center justify-center font-black text-2xl shadow-xl",
                                        getStatusStyles(selectedItem.status)
                                    )}>
                                        {selectedItem.default_due_day}
                                    </div>
                                </div>
                                <Badge className="w-fit mb-4 bg-primary/10 text-primary hover:bg-primary/10 border-none rounded-lg px-3 py-1 font-black text-[10px] uppercase tracking-widest">
                                    {selectedItem.department}
                                </Badge>
                                <DialogTitle className="text-3xl font-extralight tracking-tight text-slate-900 leading-tight pr-20">
                                    Fluxo de Processamento:<br/>
                                    <strong className="font-bold">{selectedItem.name}</strong>
                                </DialogTitle>
                                <DialogDescription className="text-xs uppercase tracking-[0.2em] font-bold text-slate-400 mt-2">
                                    Análise detalhada de prazos e entregas
                                </DialogDescription>
                            </DialogHeader>

                            <div className="p-10 space-y-10">
                                {/* Visual Step Timeline */}
                                <div className="relative">
                                    {/* Timeline bg line */}
                                    <div className="absolute left-6 top-0 bottom-0 w-1 bg-slate-100 rounded-full" />
                                    
                                    <div className="space-y-10 relative">
                                        {/* Step 1: Start */}
                                        <div className="flex gap-6 items-start group">
                                            <div className="h-12 w-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center z-10 shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform duration-500">
                                                <CalendarCheck className="h-6 w-6" />
                                            </div>
                                            <div className="flex-1 pt-1">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="text-sm font-black uppercase tracking-widest text-slate-900">Início da Operação</h4>
                                                    <Badge variant="outline" className="rounded-lg border-emerald-500/20 text-emerald-600 bg-emerald-500/5 px-3">Dia {selectedItem.startDay < 10 ? `0${selectedItem.startDay}` : selectedItem.startDay}</Badge>
                                                </div>
                                                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                                                    Nesta data, o responsável pelo setor deve iniciar o levantamento de dados e documentos necessários para esta obrigação.
                                                </p>
                                            </div>
                                        </div>

                                        {/* Step 2: Processing Window */}
                                        <div className="flex gap-6 items-start group">
                                            <div className="h-12 w-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center z-10 shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform duration-500">
                                                <Hourglass className="h-6 w-6" />
                                            </div>
                                            <div className="flex-1 pt-1">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="text-sm font-black uppercase tracking-widest text-slate-900">Janela de Produção</h4>
                                                    <Badge variant="outline" className="rounded-lg border-amber-500/20 text-amber-600 bg-amber-500/5 px-3">{selectedItem.processingDays} Dias Disponíveis</Badge>
                                                </div>
                                                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                                                    Período destinado à conferência, cálculos e geração das guias ou declarações. Este é o tempo hábil para evitar erros.
                                                </p>
                                            </div>
                                        </div>

                                        {/* Step 3: Client Delivery */}
                                        <div className="flex gap-6 items-start group">
                                            <div className="h-12 w-12 rounded-2xl bg-blue-500 text-white flex items-center justify-center z-10 shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-500">
                                                <Send className="h-6 w-6" />
                                            </div>
                                            <div className="flex-1 pt-1">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="text-sm font-black uppercase tracking-widest text-slate-900">Envio ao Cliente</h4>
                                                    <Badge variant="outline" className="rounded-lg border-blue-500/20 text-blue-600 bg-blue-500/5 px-3">Dia {selectedItem.sendDay < 10 ? `0${selectedItem.sendDay}` : selectedItem.sendDay}</Badge>
                                                </div>
                                                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                                                    Data limite recomendada para o envio da documentação ao cliente, permitindo que ele se organize para o pagamento.
                                                </p>
                                            </div>
                                        </div>

                                        {/* Step 4: Final Deadline */}
                                        <div className="flex gap-6 items-start group">
                                            <div className="h-12 w-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center z-10 shadow-lg shadow-slate-900/20 group-hover:scale-110 transition-transform duration-500">
                                                <ArrowRightCircle className="h-6 w-6" />
                                            </div>
                                            <div className="flex-1 pt-1">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="text-sm font-black uppercase tracking-widest text-slate-900">Vencimento Final</h4>
                                                    <Badge variant="outline" className="rounded-lg border-slate-900/20 text-slate-900 bg-slate-900/5 px-3">Dia {selectedItem.default_due_day}</Badge>
                                                </div>
                                                <p className="text-xs text-slate-500 mt-2 leading-relaxed font-medium">
                                                    Data de vencimento legal da obrigação. Nada deve ser processado após este período.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 bg-primary/5 rounded-3xl border border-primary/10 flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center shadow-md flex-shrink-0">
                                        <Clock className="h-6 w-6 text-primary" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-black uppercase tracking-widest text-primary/60 leading-none">Status Atual</span>
                                        <span className="text-sm font-bold text-slate-900 mt-1">
                                            {selectedItem.status === 'passed' ? 'Este prazo já expirou no mês vigente.' : `Faltam ${selectedItem.daysLeft} dias para o vencimento final.`}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                    <DialogFooter className="p-8 pt-0">
                        <Button 
                            onClick={() => setIsModalOpen(false)} 
                            className="w-full h-14 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 transition-all font-black uppercase tracking-widest text-xs"
                        >
                            Entendido, manter foco no prazo
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Info Footer */}
            <div className="mt-12 bg-primary/5 border border-primary/10 rounded-[2.5rem] p-10 flex flex-col md:flex-row items-center gap-8">
                <div className="bg-white rounded-[2rem] h-20 w-20 flex items-center justify-center shadow-xl shadow-primary/5 flex-shrink-0">
                    <Info className="h-10 w-10 text-primary" />
                </div>
                <div className="space-y-3 text-center md:text-left">
                    <h4 className="text-lg font-bold text-slate-900 leading-none">Como os prazos são calculados?</h4>
                    <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">
                        Os dias de início e envio são baseados nas configurações de <strong>Alertas</strong> definidas na aba de Obrigações. 
                        O sistema utiliza o lembrete mais antigo para definir o início dos trabalhos e o lembrete final para data limite de entrega ao cliente.
                    </p>
                    <div className="flex flex-wrap gap-4 pt-2">
                        <Badge variant="outline" className="text-[10px] uppercase font-bold py-1.5 px-4 rounded-full border-primary/20 text-primary bg-primary/5 cursor-help">
                            Início = Vencimento - Maior Alerta
                        </Badge>
                        <Badge variant="outline" className="text-[10px] uppercase font-bold py-1.5 px-4 rounded-full border-primary/20 text-primary bg-primary/5 cursor-help">
                            Envio = Vencimento - Menor Alerta
                        </Badge>
                    </div>
                </div>
            </div>
        </div>
    );
}
