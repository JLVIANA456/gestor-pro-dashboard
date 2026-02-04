import { ArrowUpRight, ArrowDownRight, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

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

    return (
        <div className="rounded-2xl bg-card p-6 border border-border/50 shadow-card animate-slide-in-up stagger-1 h-full transition-all duration-300 hover:shadow-card-hover">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/5">
                        <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-light text-foreground tracking-wide text-lg">Fluxo de Clientes</h3>
                        <p className="text-[10px] text-muted-foreground capitalize font-normal tracking-widest">{currentMonth}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 mb-8">
                {/* Ativos */}
                <div className="space-y-2">
                    <p className="text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em]">Clientes Ativos</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-light text-foreground tracking-tighter">{loading ? '...' : ativos}</span>
                    </div>
                </div>

                {/* Entradas */}
                <div className="space-y-2">
                    <p className="text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em]">Altas (Entradas)</p>
                    <div className="flex items-center gap-3">
                        <span className="text-4xl font-light text-emerald-500 tracking-tighter">{loading ? '...' : entradas}</span>
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50/50 border border-emerald-100/50">
                            <ArrowUpRight className="h-3 w-3 text-emerald-600" />
                        </div>
                    </div>
                </div>

                {/* Saídas */}
                <div className="space-y-2">
                    <p className="text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em]">Baixas (Saídas)</p>
                    <div className="flex items-center gap-3">
                        <span className="text-4xl font-light text-rose-500 tracking-tighter">{loading ? '...' : saidas}</span>
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-50/50 border border-rose-100/50">
                            <ArrowDownRight className="h-3 w-3 text-rose-600" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="pt-6 border-t border-border/50">
                <div className="flex items-center justify-between mb-6">
                    <span className="text-xs font-light text-muted-foreground uppercase tracking-[0.15em]">Saldo</span>
                    <span className={cn(
                        "text-xs font-normal px-3 py-1 rounded-full uppercase tracking-wider",
                        entradas - saidas >= 0
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-100/50"
                            : "bg-rose-50 text-rose-700 border border-rose-100/50"
                    )}>
                        {entradas - saidas > 0 ? '+' : ''}{entradas - saidas} novos
                    </span>
                </div>

                {/* Lista de Saídas Recentes */}
                {recentExits.length > 0 && (
                    <div className="space-y-3">
                        <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">Baixas Recentes</p>
                        <div className="space-y-2">
                            {recentExits.map((exit) => (
                                <div key={exit.id} className="flex items-start justify-between p-3 rounded-xl bg-rose-50/30 border border-rose-100/50">
                                    <div>
                                        <p className="text-xs font-medium text-foreground">{exit.nome}</p>
                                        <p className="text-[10px] text-muted-foreground mt-0.5">{exit.motivo}</p>
                                    </div>
                                    <span className="text-[10px] text-rose-400 font-mono">
                                        {new Date(exit.dataSaida).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
