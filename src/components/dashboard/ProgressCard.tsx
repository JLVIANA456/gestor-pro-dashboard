import { Target } from 'lucide-react';

interface ProgressCardProps {
  title: string;
  current: number;
  total: number;
  subtitle?: string;
}

export function ProgressCard({ title, current, total, subtitle }: ProgressCardProps) {
  const percentage = Math.round((current / total) * 100);

  return (
    <div className="rounded-lg bg-card p-6 shadow-card animate-slide-in-up stagger-1">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Target className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">{title}</h3>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-end justify-between">
          <span className="text-3xl font-light text-foreground">{current}</span>
          <span className="text-sm text-muted-foreground">de {total}</span>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div 
            className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>

        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-primary">{percentage}%</span> concluído
        </p>
      </div>
    </div>
  );
}
