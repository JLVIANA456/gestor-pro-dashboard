import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useBranding } from '@/context/BrandingContext';
import { supabase } from '@/integrations/supabase/client';
import { 
    FileText, 
    Download, 
    Inbox, 
    LogOut, 
    Building, 
    Folder, 
    ChevronRight, 
    Globe, 
    ArrowLeft,
    Calendar,
    LayoutGrid,
    Clock,
    UserCircle,
    FileSpreadsheet,
    ShieldCheck,
    Briefcase
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface GuideDocument {
    id: string;
    clientId: string;
    type: string;
    referenceMonth: string;
    dueDate: string;
    amount: number;
    fileUrl: string;
    status: string;
}

export default function ClientPortalView() {
    const { user, signOut } = useAuth();
    const { officeName, logoUrl } = useBranding();
    
    const [clientId, setClientId] = useState<string | null>(null);
    const [guides, setGuides] = useState<GuideDocument[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [viewMode, setViewMode] = useState<'years' | 'months' | 'files'>('years');
    const [selectedYear, setSelectedYear] = useState<string | null>(null);
    const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

    // Fetch linked clientId for the user
    useEffect(() => {
        const fetchLinkedClient = async () => {
            if (!user?.id) return;
            const { data, error } = await (supabase as any)
                .from('client_portal_users')
                .select('client_id')
                .eq('user_id', user.id)
                .single();
            
            if (data) {
                setClientId(data.client_id);
                fetchGuides(data.client_id);
            } else {
                setLoading(false);
            }
        };
        fetchLinkedClient();
    }, [user]);

    const fetchGuides = async (cid: string) => {
        const { data, error } = await (supabase as any)
            .from('accounting_guides')
            .select('*')
            .eq('client_id', cid)
            .not('file_url', 'is', null)
            .order('reference_month', { ascending: false });
        
        if (data) {
            setGuides(data.map((d: any) => ({
                id: d.id,
                clientId: d.client_id,
                type: d.type,
                referenceMonth: d.reference_month,
                dueDate: d.due_date,
                amount: d.amount,
                fileUrl: d.file_url,
                status: d.status
            })));
        }
        setLoading(false);
    };

    // Logical Grouping
    const years = useMemo(() => {
        const yearsSet = new Set<string>();
        guides.forEach(g => {
            const parts = g.referenceMonth.split('/');
            if (parts.length === 2) yearsSet.add(parts[1]);
        });
        return Array.from(yearsSet).sort((a, b) => b.localeCompare(a));
    }, [guides]);

    const monthsForYear = useMemo(() => {
        if (!selectedYear) return [];
        const monthsSet = new Set<string>();
        guides.forEach(g => {
            const [m, y] = g.referenceMonth.split('/');
            if (y === selectedYear) monthsSet.add(m);
        });
        return Array.from(monthsSet).sort((a, b) => b.localeCompare(a));
    }, [guides, selectedYear]);

    const filesForMonth = useMemo(() => {
        if (!selectedYear || !selectedMonth) return [];
        return guides.filter(g => g.referenceMonth === `${selectedMonth}/${selectedYear}`);
    }, [guides, selectedYear, selectedMonth]);

    const getMonthName = (month: string) => {
        const date = parse(month, 'MM', new Date());
        return format(date, 'MMMM', { locale: ptBR });
    };

    const handleBack = () => {
        if (viewMode === 'files') {
            setViewMode('months');
            setSelectedMonth(null);
        } else if (viewMode === 'months') {
            setViewMode('years');
            setSelectedYear(null);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50/50">
            <div className="flex flex-col items-center gap-4">
                <div className="h-12 w-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Sincronizando Hub...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans">
            {/* Navigation Header */}
            <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 h-24 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
                    <div className="flex items-center gap-5">
                        <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center text-white shadow-2xl shadow-primary/20 overflow-hidden shrink-0 transform transition-transform hover:scale-105">
                            {logoUrl ? <img src={logoUrl} className="h-full w-full object-contain p-2" /> : <Building className="h-7 w-7" />}
                        </div>
                        <div className="flex flex-col">
                            <h2 className="text-xl font-black uppercase text-slate-800 tracking-tighter leading-none">{officeName}</h2>
                            <span className="text-[10px] uppercase font-black text-primary tracking-[0.4em] mt-2 opacity-60">Portal do Cliente</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="hidden lg:flex items-center gap-4 px-6 py-2 bg-slate-50 rounded-2xl border border-slate-100">
                            <Clock className="h-4 w-4 text-slate-400" />
                            <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Acesso Seguro</span>
                        </div>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="rounded-2xl h-12 w-12 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all shadow-sm border border-slate-50 bg-white"
                            onClick={signOut}
                        >
                            <LogOut className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-12 w-full flex-1">
                <div className="space-y-12">
                    {/* Breadcrumbs & Title */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                {viewMode !== 'years' && (
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={handleBack}
                                        className="h-12 w-12 rounded-2xl bg-white shadow-sm border border-slate-100 text-slate-400 hover:text-primary transition-all"
                                    >
                                        <ArrowLeft className="h-5 w-5" />
                                    </Button>
                                )}
                                <div className="flex flex-col">
                                    <Badge className="bg-primary/10 text-primary border-none rounded-full px-4 py-1 text-[9px] font-black uppercase tracking-widest w-fit mb-2">
                                        Hub do Cliente
                                    </Badge>
                                    <h1 className="text-4xl font-light text-slate-800 tracking-tighter">
                                        {viewMode === 'years' && "Central de "}
                                        {viewMode === 'months' && "Ano "}
                                        {viewMode === 'files' && `${getMonthName(selectedMonth!)} `}
                                        <span className="font-black text-primary">
                                            {viewMode === 'years' && "Documentos"}
                                            {viewMode === 'months' && selectedYear}
                                            {viewMode === 'files' && selectedYear}
                                        </span>
                                    </h1>
                                </div>
                            </div>
                        </div>

                        {viewMode === 'files' && (
                            <div className="flex items-center gap-3 p-2 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 self-start md:self-end">
                                <ShieldCheck className="h-4 w-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">{filesForMonth.length} Documentos Autênticos</span>
                            </div>
                        )}
                    </div>

                    {/* Content Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {/* YEARS VIEW */}
                        {viewMode === 'years' && years.map(year => (
                            <Card 
                                key={year}
                                onClick={() => { setSelectedYear(year); setViewMode('months'); }}
                                className="group cursor-pointer rounded-[3.5rem] border-none bg-white p-10 shadow-sm transition-all duration-700 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-4 relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 transition-transform duration-700 group-hover:scale-150" />
                                <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                                    <div className="h-20 w-20 rounded-[2.5rem] bg-primary/5 flex items-center justify-center text-primary shadow-inner transition-all duration-700 group-hover:bg-primary group-hover:text-white group-hover:rotate-6">
                                        <Folder className="h-10 w-10 text-primary group-hover:text-white" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-3xl font-black text-slate-800 tracking-tighter group-hover:text-primary transition-colors">{year}</h3>
                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Pasta Anual</p>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase text-primary tracking-widest opacity-0 group-hover:opacity-100 transition-all">
                                        Explorar <ChevronRight className="h-3 w-3" />
                                    </div>
                                </div>
                            </Card>
                        ))}

                        {/* MONTHS VIEW */}
                        {viewMode === 'months' && monthsForYear.map(month => (
                            <Card 
                                key={month}
                                onClick={() => { setSelectedMonth(month); setViewMode('files'); }}
                                className="group cursor-pointer rounded-[3.5rem] border-none bg-white p-10 shadow-sm transition-all duration-700 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-4 relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 transition-transform duration-700 group-hover:scale-150" />
                                <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                                    <div className="h-20 w-20 rounded-[2.5rem] bg-primary/5 flex items-center justify-center text-primary shadow-inner transition-all duration-700 group-hover:bg-primary group-hover:text-white group-hover:-rotate-6">
                                        <Calendar className="h-10 w-10 text-primary group-hover:text-white" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-2xl font-black text-slate-800 tracking-tighter group-hover:text-primary transition-colors capitalize">{getMonthName(month)}</h3>
                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Pasta Mensal</p>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase text-primary tracking-widest opacity-0 group-hover:opacity-100 transition-all">
                                        Ver Documentos <ChevronRight className="h-3 w-3" />
                                    </div>
                                </div>
                            </Card>
                        ))}

                        {/* FILES VIEW */}
                        {viewMode === 'files' && filesForMonth.map(file => (
                            <Card 
                                key={file.id}
                                className="group rounded-[3.5rem] border-none bg-white p-10 shadow-sm transition-all duration-700 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2 relative overflow-hidden flex flex-col justify-between"
                            >
                                <div className="space-y-6">
                                    <div className={cn(
                                        "h-16 w-16 rounded-[2rem] flex items-center justify-center shadow-inner transition-all duration-500",
                                        file.type.toLowerCase().includes('folha') ? "bg-amber-50 text-amber-500" :
                                        file.type.toLowerCase().includes('extrato') ? "bg-blue-50 text-blue-500" :
                                        "bg-primary/5 text-primary"
                                    )}>
                                        <FileText className="h-8 w-8" />
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <h3 className="text-xl font-black text-slate-800 tracking-tighter line-clamp-2 leading-tight h-14">
                                            {file.type}
                                        </h3>
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center justify-between py-2 border-b border-slate-50">
                                                <span className="text-[9px] font-black uppercase text-slate-300 tracking-widest">Vencimento</span>
                                                <span className="text-xs font-black text-slate-600">{file.dueDate ? format(new Date(file.dueDate), 'dd/MM/yyyy') : '-'}</span>
                                            </div>
                                            <div className="flex items-center justify-between py-2">
                                                <span className="text-[9px] font-black uppercase text-slate-300 tracking-widest">Valor</span>
                                                <span className="text-xs font-black text-emerald-600">{file.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <Button 
                                    asChild
                                    className="w-full h-14 rounded-[2rem] bg-slate-50 hover:bg-primary text-slate-600 hover:text-white font-black uppercase text-[10px] tracking-widest transition-all duration-500 mt-8 group-hover:shadow-xl group-hover:shadow-primary/20 border border-slate-100 hover:border-transparent"
                                >
                                    <a href={file.fileUrl} target="_blank">
                                        <Download className="h-4 w-4 mr-2" /> Baixar
                                    </a>
                                </Button>
                            </Card>
                        ))}
                    </div>

                    {/* Empty States */}
                    {guides.length === 0 && !loading && (
                        <div className="py-32 flex flex-col items-center justify-center text-center space-y-6 opacity-40">
                            <div className="h-24 w-24 rounded-full bg-slate-100 flex items-center justify-center">
                                <Inbox className="h-10 w-10 text-slate-400" />
                            </div>
                            <div className="space-y-2">
                                <h4 className="text-xl font-black uppercase tracking-tighter text-slate-800">Seu Hub está Vazio</h4>
                                <p className="text-sm text-slate-400 max-w-xs mx-auto">Assim que enviarmos suas guias e documentos, eles aparecerão aqui organizados automaticamente.</p>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <footer className="py-20 border-t border-slate-200 mt-20 bg-white">
                <div className="max-w-7xl mx-auto px-6 text-center space-y-6">
                    <div className="flex items-center justify-center gap-2 opacity-30">
                         <Globe className="h-4 w-4" />
                         <span className="text-[10px] font-black uppercase tracking-[0.5em]">Segurança SSL &bull; Criptografia Ponta-a-Ponta</span>
                    </div>
                    <p className="text-[11px] uppercase font-black tracking-[0.4em] text-slate-400">
                        {officeName} &copy; 2026 — Gestão <span className="text-primary font-black">Digital</span>
                    </p>
                </div>
            </footer>
        </div>
    );
}
