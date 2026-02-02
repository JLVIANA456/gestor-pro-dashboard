import { Sun, Moon, CloudSun } from 'lucide-react';

export function GreetingCard() {
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
    <div className="rounded-lg bg-card p-8 shadow-card animate-slide-in-up">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Icon className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-extralight text-foreground">
              {greeting}, <span className="font-semibold">Jefferson</span>
            </h1>
          </div>
          <p className="text-muted-foreground capitalize">{today}</p>
        </div>
      </div>
    </div>
  );
}
