import { ArrowUpRight, ArrowDownRight, Users, Activity, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { InfiniteSlider } from '@/components/ui/infinite-slider';

interface ClientFlowCardProps {
    ativos: number;
    entradas: number;
    saidas: number;
    recentExits?: Array<{
        id: string;
        nome: string;
        motivo: string;
        dataSaida: string;
    }>;
    loading?: boolean;
}

export function ClientFlowCard({ ativos, entradas, saidas, recentExits = [], loading }: ClientFlowCardProps) {
    const currentMonth = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    const saldo = entradas - saidas;

    return (
        <div className="bg-white/40 backdrop-blur-md rounded-[3rem] py-12 px-8 border border-border shadow-sm h-full flex flex-col items-center justify-center text-center">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center mb-12"
            >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/5 border border-primary/10 mb-6">
                    <Activity className="h-6 w-6 text-primary" />
                </div>
                <span className="text-[10px] font-medium text-primary uppercase tracking-[0.4em] mb-3 bg-primary/5 px-4 py-1.5 rounded-full border border-primary/10">Indicadores de Crescimento</span>
                <h2 className="text-2xl font-light text-foreground tracking-tight sm:text-3xl uppercase">Fluxo de Carteira</h2>
                <p className="mt-2 text-sm text-muted-foreground font-light max-w-sm mx-auto">
                    Acompanhamento dinâmico de movimentação da carteira em {currentMonth}.
                </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 w-full max-w-3xl mb-16">
                <div className="flex flex-col items-center">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-[0.2em] mb-2">Total Ativos</span>
                    <span className="text-5xl font-light text-foreground tabular-nums">
                        {loading ? '...' : ativos}
                    </span>
                    <div className="mt-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        <Users className="h-3 w-3" /> Base Consolidada
                    </div>
                </div>

                <div className="flex flex-col items-center group">
                    <span className="text-[10px] font-medium text-emerald-600 uppercase tracking-[0.2em] mb-2">Novas Entradas</span>
                    <div className="flex items-center gap-2">
                        <span className="text-5xl font-light text-emerald-600 tabular-nums">
                            {loading ? '...' : entradas}
                        </span>
                        <ArrowUpRight className="h-6 w-6 text-emerald-400" />
                    </div>
                    <div className="mt-2 text-[9px] font-bold text-emerald-600/60 uppercase tracking-widest">Saldo Positivo</div>
                </div>

                <div className="flex flex-col items-center">
                    <span className="text-[10px] font-medium text-rose-600 uppercase tracking-[0.2em] mb-2">Saídas do Mês</span>
                    <div className="flex items-center gap-2">
                        <span className="text-5xl font-light text-rose-600 tabular-nums">
                            {loading ? '...' : saidas}
                        </span>
                        <ArrowDownRight className="h-6 w-6 text-rose-400" />
                    </div>
                    <div className="mt-2 text-[9px] font-bold text-rose-600/60 uppercase tracking-widest">Evitabilidade</div>
                </div>
            </div>

            <div className="w-full mt-auto pt-10 border-t border-border/60">
                <div className="flex items-center justify-center gap-2 mb-8">
                     <div className="h-1 w-8 bg-slate-200 rounded-full" />
                     <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-[0.3em]">Monitoramento de Movimentação</span>
                     <div className="h-1 w-8 bg-slate-200 rounded-full" />
                </div>
                
                <div className="mask-[linear-gradient(to_right,transparent,black,transparent)] overflow-hidden py-2">
                    <InfiniteSlider gap={60} speed={40} reverse>
                        {(recentExits.length > 0 ? recentExits : [
                            { nome: 'Empresas em Foco' },
                            { nome: 'Simples Nacional' },
                            { nome: 'Lucro Presumido' },
                            { nome: 'Lucro Real' },
                            { nome: 'MEI Premium' },
                            { nome: 'Gestão Fiscal' }
                        ]).map((item, idx) => (
                            <div key={idx} className="flex items-center gap-3 whitespace-nowrap group cursor-default">
                                <div className="h-8 w-8 rounded-lg bg-slate-50 border border-border flex items-center justify-center group-hover:bg-primary/5 group-hover:border-primary/20 transition-all duration-500">
                                    <Building2 className="h-4 w-4 text-slate-300 group-hover:text-primary transition-colors" />
                                </div>
                                <span className="text-xs font-light text-slate-400 group-hover:text-primary transition-colors duration-500 uppercase tracking-widest">
                                    {'nome' in item ? item.nome : 'Empresa Ativa'}
                                </span>
                                {'motivo' in item && (
                                    <span className="px-2 py-0.5 rounded-full bg-rose-50 text-[8px] text-rose-500 font-bold uppercase tracking-tighter border border-rose-100">
                                        SAÍDA
                                    </span>
                                )}
                            </div>
                        ))}
                    </InfiniteSlider>
                </div>
            </div>
        </div>
    );
}
