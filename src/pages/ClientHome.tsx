import { useState } from 'react';
import { 
    Download, 
    Bell, 
    FileText, 
    CheckCircle2, 
    Clock, 
    Activity, 
    TrendingUp, 
    Building2, 
    FileUp, 
    Globe, 
    LogOut, 
    History, 
    Wallet,
    CreditCard
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useBranding } from '@/context/BrandingContext';
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useNavigate } from 'react-router-dom';

export default function ClientHome() {
    const { officeName, logoUrl, primaryColor } = useBranding();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'overview' | 'files' | 'finance'>('overview');

    const handleLogout = () => {
        toast.info("Até logo!");
        navigate('/portal');
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col animate-in fade-in duration-700">
            {/* Header Simplificado do Cliente */}
            <header className="fixed top-0 left-0 right-0 h-20 bg-white border-b border-slate-200 z-[100] px-8 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
                        {logoUrl ? <img src={logoUrl} alt="Logo" className="h-full w-full object-contain p-1.5" /> : <Building2 className="h-5 w-5" />}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[12px] font-black text-slate-900 uppercase tracking-tight leading-none">{officeName}</span>
                        <span className="text-[8px] font-bold text-primary uppercase tracking-[0.25em] mt-1">Meu Portal</span>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="hidden md:flex items-center gap-4 border-r border-slate-100 pr-6 mr-6">
                        <Button 
                            variant="ghost" 
                            onClick={() => setActiveTab('overview')}
                            className={cn("h-10 px-6 rounded-xl text-[10px] uppercase font-black tracking-widest transition-all", activeTab === 'overview' ? "bg-slate-50 text-primary" : "text-slate-400 hover:text-slate-900")}
                        >
                            Início
                        </Button>
                        <Button 
                            variant="ghost" 
                            onClick={() => setActiveTab('files')}
                            className={cn("h-10 px-6 rounded-xl text-[10px] uppercase font-black tracking-widest transition-all", activeTab === 'files' ? "bg-slate-50 text-primary" : "text-slate-400 hover:text-slate-900")}
                        >
                            Arquivos
                        </Button>
                        <Button 
                            variant="ghost" 
                            onClick={() => setActiveTab('finance')}
                            className={cn("h-10 px-6 rounded-xl text-[10px] uppercase font-black tracking-widest transition-all", activeTab === 'finance' ? "bg-slate-50 text-primary" : "text-slate-400 hover:text-slate-900")}
                        >
                            Saúde Financeira
                        </Button>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="h-10 w-10 relative flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-primary transition-colors">
                            <Bell className="h-5 w-5" />
                            <span className="absolute top-2.5 right-2.5 h-2 w-2 bg-primary rounded-full ring-2 ring-white" />
                        </button>
                        <button 
                            onClick={handleLogout}
                            className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-destructive/5 hover:text-destructive transition-all"
                            title="Sair do Portal"
                        >
                            <LogOut className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Conteúdo Principal do Cliente */}
            <main className="flex-1 mt-20 p-8 max-w-[1400px] mx-auto w-full space-y-10">
                {activeTab === 'overview' && (
                    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
                        {/* Boas-vindas Realease */}
                        <div className="flex items-end justify-between">
                            <div className="space-y-3">
                                <h2 className="text-4xl font-extralight text-slate-900 leading-tight">Olá, <span className="font-bold">Minha Empresa LTDA</span>.</h2>
                                <p className="text-[11px] font-black uppercase text-slate-400 tracking-[0.3em] flex items-center gap-2">
                                    <Globe className="h-3.5 w-3.5 text-primary opacity-60" /> Seu painel de transparência contábil
                                </p>
                            </div>
                            <div className="hidden lg:flex items-center gap-3 bg-white p-2 rounded-[1.5rem] border border-slate-200/60 shadow-sm">
                                <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                                    <CheckCircle2 className="h-6 w-6" />
                                </div>
                                <div className="pr-4">
                                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Status Mensal</p>
                                    <p className="text-sm font-bold text-slate-900">Tudo em conformidade</p>
                                </div>
                            </div>
                        </div>

                        {/* Principais Alertas/Kpis */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <Card className="rounded-[2.5rem] border-none bg-primary shadow-2xl shadow-primary/30 p-8 text-white group overflow-hidden relative">
                                <div className="absolute top-0 right-0 h-32 w-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl transition-transform group-hover:scale-110" />
                                <div className="relative space-y-4">
                                    <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                                        <Wallet className="h-7 w-7" />
                                    </div>
                                    <div>
                                        <h3 className="text-3xl font-black">R$ 4.250,50</h3>
                                        <p className="text-[11px] uppercase font-black tracking-widest opacity-80 mt-1">Impostos a vencer em Março</p>
                                    </div>
                                    <Button className="w-full bg-white text-primary font-black uppercase tracking-widest text-[10px] h-12 rounded-xl hover:scale-[1.02] shadow-xl">
                                        Ver Guias Detalhadas
                                    </Button>
                                </div>
                            </Card>

                            <Card className="rounded-[2.5rem] border-none bg-white shadow-xl p-8 space-y-4 group">
                                <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                                    <FileUp className="h-7 w-7" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Subir Arquivos</h3>
                                    <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Envie documentos p/ contabilidade</p>
                                </div>
                                <div className="pt-2">
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-500 uppercase tracking-widest bg-emerald-500/5 px-3 py-1.5 rounded-lg w-fit">
                                        <Clock className="h-3 w-3" /> 2 pendentes p/ este mês
                                    </div>
                                </div>
                            </Card>

                            <Card className="rounded-[2.5rem] border-none bg-white shadow-xl p-8 space-y-4 group">
                                <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                                    <History className="h-7 w-7" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Repositório</h3>
                                    <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Visualize documentos históricos</p>
                                </div>
                                <div className="pt-2">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total: 45 Documentos</p>
                                </div>
                            </Card>
                        </div>

                        {/* Recent Guides Table - O que o cliente mais quer: A GUIA */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between px-2">
                                <h3 className="text-2xl font-extralight text-slate-900">Minhas <span className="font-bold">Guias de Impostos</span></h3>
                                <button className="text-[10px] font-black uppercase text-primary tracking-widest hover:underline">Ver Histórico Completo</button>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-white border border-slate-200/60 rounded-[2rem] hover:shadow-xl hover:scale-[1.005] transition-all group cursor-pointer">
                                        <div className="flex items-center gap-6">
                                            <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                                                <CreditCard className="h-6 w-6" />
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-lg font-black text-slate-900">{i === 1 ? 'Guia de DAS' : i === 2 ? 'FGTS Digital' : 'E-Social Pro-labore'}</span>
                                                    <Badge className="bg-primary/5 text-primary border-none text-[9px] font-black uppercase tracking-widest">Pendente</Badge>
                                                </div>
                                                <div className="flex items-center gap-4 text-[11px] font-bold text-slate-400 uppercase tracking-tighter">
                                                    <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Vencimento: 20/03/2026</span>
                                                    <span className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" /> Competência: 02/2026</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-8 mt-6 md:mt-0 pt-6 md:pt-0 border-t md:border-t-0 border-slate-100">
                                            <div className="flex flex-col items-end">
                                                <span className="text-xs uppercase font-black text-slate-400 tracking-wider">Valor</span>
                                                <span className="text-xl font-black text-slate-900">R$ 1.250,00</span>
                                            </div>
                                            <Button className="h-12 px-8 rounded-2xl bg-primary text-white shadow-xl shadow-primary/20 hover:scale-105 transition-all gap-2 text-[11px] font-black uppercase tracking-widest">
                                                <Download className="h-4 w-4" /> Baixar PDF
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'files' && (
                    <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-6 animate-in fade-in zoom-in-95 duration-700">
                        <div className="h-24 w-24 rounded-full bg-slate-100 flex items-center justify-center text-slate-400/50">
                            <History className="h-12 w-12" />
                        </div>
                        <div className="space-y-2">
                            <p className="text-xl font-black">Histórico de Arquivos</p>
                            <p className="text-sm text-slate-400 font-light max-w-sm">Esta área carregará todos os documentos, contratos e guias antigas enviadas pelo seu contador.</p>
                        </div>
                        <Button variant="outline" className="h-12 rounded-xl border-slate-200 px-8 text-[11px] font-black uppercase tracking-widest text-slate-500">Voltar ao Início</Button>
                    </div>
                )}

                {activeTab === 'finance' && (
                    <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-6 animate-in fade-in zoom-in-95 duration-700">
                        <div className="h-24 w-24 rounded-full bg-primary/5 flex items-center justify-center text-primary/30">
                            <TrendingUp className="h-12 w-12" />
                        </div>
                        <div className="space-y-2">
                            <p className="text-xl font-black text-primary">Inteligência Financeira</p>
                            <p className="text-sm text-slate-400 font-light max-w-sm">Em breve você terá acesso a gráficos reais de faturamento e impostos baseados na sua escrita contábil.</p>
                        </div>
                        <Button variant="outline" className="h-12 rounded-xl border-slate-200 px-8 text-[11px] font-black uppercase tracking-widest text-slate-500">Recurso em Breve</Button>
                    </div>
                )}
            </main>

            {/* Footer Informativo */}
            <footer className="mt-auto py-12 border-t border-slate-200 px-8">
                <div className="flex flex-col md:flex-row items-center justify-between max-w-[1400px] mx-auto gap-6 opacity-40 grayscale hover:grayscale-0 transition-all">
                    <div className="flex items-center gap-3">
                        <Globe className="h-5 w-5 text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Conexão Segura e Criptografada</span>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Copyright © 2026 {officeName} - Desenvolvido por JLConecta</span>
                </div>
            </footer>
        </div>
    );
}
