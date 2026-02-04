import { Users, TrendingUp } from 'lucide-react';

interface ClientFlowCardProps {
    total: number;
    loading?: boolean;
}

export function ClientFlowCard({ total, loading }: ClientFlowCardProps) {
    const currentMonth = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    return (
        <div className="rounded-2xl bg-card p-6 border border-border/50 shadow-card animate-slide-in-up stagger-1 h-full transition-all duration-300 hover:shadow-card-hover">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/5">
                        <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-light text-foreground tracking-wide text-lg">Resumo de Clientes</h3>
                        <p className="text-[10px] text-muted-foreground capitalize font-normal tracking-widest">{currentMonth}</p>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                {/* Total de Clientes Ativos */}
                <div className="space-y-2">
                    <p className="text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em]">Total de Clientes</p>
                    <div className="flex items-baseline gap-3">
                        <span className="text-5xl font-light text-foreground tracking-tighter">{loading ? '...' : total}</span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/5 border border-primary/10">
                            <TrendingUp className="h-4 w-4 text-primary" />
                        </div>
                    </div>
                </div>

                <div className="pt-6 border-t border-border/50">
                    <p className="text-xs font-light text-muted-foreground">
                        Base de clientes atualizada em tempo real
                    </p>
                </div>
            </div>
        </div>
    );
}
