import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  variant?: 'default' | 'simples' | 'presumido' | 'real';
  delay?: number;
}

const iconStyles = {
  default: 'bg-muted text-muted-foreground',
  simples: 'bg-emerald-100 text-emerald-600',
  presumido: 'bg-blue-100 text-blue-600',
  real: 'bg-violet-100 text-violet-600',
};

export function StatsCard({ title, value, icon: Icon, variant = 'default', delay = 0 }: StatsCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl p-6 bg-card border border-border/50 shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1 animate-slide-in-up',
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em] mb-3">{title}</p>
          <p className="text-4xl font-light text-foreground tracking-tight">{value}</p>
        </div>
        <div className={cn(
          'flex h-12 w-12 items-center justify-center rounded-xl shadow-sm border border-border/10',
          iconStyles[variant]
        )}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
