import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  variant?: 'default' | 'simples' | 'presumido' | 'real';
  delay?: number;
}

const variantStyles = {
  default: 'bg-muted/50',
  simples: 'bg-emerald-50 border border-emerald-100',
  presumido: 'bg-blue-50 border border-blue-100',
  real: 'bg-amber-50 border border-amber-100',
};

const iconStyles = {
  default: 'bg-muted text-muted-foreground',
  simples: 'bg-emerald-100 text-emerald-600',
  presumido: 'bg-blue-100 text-blue-600',
  real: 'bg-amber-100 text-amber-600',
};

export function StatsCard({ title, value, icon: Icon, variant = 'default', delay = 0 }: StatsCardProps) {
  return (
    <div 
      className={cn(
        'rounded-lg p-6 shadow-card transition-all hover:shadow-card-hover animate-slide-in-up',
        variantStyles[variant]
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
          <p className="text-3xl font-light text-foreground">{value}</p>
        </div>
        <div className={cn(
          'flex h-12 w-12 items-center justify-center rounded-xl',
          iconStyles[variant]
        )}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
