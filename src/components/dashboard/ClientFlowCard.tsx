import { ArrowUpRight, ArrowDownRight, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClientFlowCardProps {
    ativos: number;
    entradas: number;
    saidas: number;
    loading?: boolean;
}

export function ClientFlowCard({ ativos, entradas, saidas, loading }: ClientFlowCardProps) {
    const currentMonth = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    return (
        <div className="rounded-lg bg-card p-6 shadow-card animate-slide-in-up stagger-1 h-full">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                        <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-foreground">Fluxo de Clientes</h3>
                        <p className="text-xs text-muted-foreground capitalize">{currentMonth}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                {/* Ativos */}
                <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Clientes Ativos</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-light text-foreground">{loading ? '...' : ativos}</span>
                    </div>
                </div>

                {/* Entradas */}
                <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Altas (Entradas)</p>
                    <div className="flex items-center gap-2">
                        <span className="text-3xl font-light text-emerald-600">{loading ? '...' : entradas}</span>
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100">
                            <ArrowUpRight className="h-3 w-3 text-emerald-600" />
                        </div>
                    </div>
                </div>

                {/* Saídas */}
                <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Baixas (Saídas)</p>
                    <div className="flex items-center gap-2">
                        <span className="text-3xl font-light text-rose-600">{loading ? '...' : saidas}</span>
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-100">
                            <ArrowDownRight className="h-3 w-3 text-rose-600" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-6 pt-6 border-t border-border">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Saldo do Mês</span>
                    <span className={cn(
                        "font-semibold",
                        entradas - saidas >= 0 ? "text-emerald-600" : "text-rose-600"
                    )}>
                        {entradas - saidas > 0 ? '+' : ''}{entradas - saidas} novos clientes
                    </span>
                </div>
            </div>
        </div>
    );
}
