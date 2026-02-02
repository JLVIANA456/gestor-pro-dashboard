import { Sun, Moon, CloudSun } from 'lucide-react';
import { useBranding } from '@/context/BrandingContext';

export function GreetingCard() {
  const { officeName } = useBranding();
  const hour = new Date().getHours();

  let greeting = 'Boa noite';
  let Icon = Moon;

  if (hour >= 5 && hour < 12) {
    greeting = 'Bom dia';
    Icon = Sun;
  } else if (hour >= 12 && hour < 18) {
    greeting = 'Boa tarde';
    Icon = CloudSun;
  }

  const today = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="rounded-2xl bg-card p-8 border border-border/50 shadow-card animate-slide-in-up">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-4 mb-3">
            <div className="p-3 rounded-xl bg-primary/5">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-light tracking-tight text-foreground">
              {greeting}, <span className="text-primary font-normal">Jefferson</span>
            </h1>
          </div>
          <p className="text-muted-foreground font-light flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
            <span className="uppercase tracking-[0.1em] text-[10px] font-normal">{today}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
