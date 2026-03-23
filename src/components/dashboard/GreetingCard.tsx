import { Sun, Moon, CloudSun, Calendar } from 'lucide-react';
import { useBranding } from '@/context/BrandingContext';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';

export function GreetingCard() {
  const { officeName } = useBranding();
  const { user } = useAuth();
  const hour = new Date().getHours();

  let greeting = 'Boa noite';
  let Icon = Moon;
  let iconBg = "bg-blue-50";
  let iconColor = "text-blue-600";

  if (hour >= 5 && hour < 12) {
    greeting = 'Bom dia';
    Icon = Sun;
    iconBg = "bg-orange-50";
    iconColor = "text-orange-600";
  } else if (hour >= 12 && hour < 18) {
    greeting = 'Boa tarde';
    Icon = CloudSun;
    iconBg = "bg-sky-50";
    iconColor = "text-sky-600";
  }

  const today = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[2rem] bg-card p-6 border border-border shadow-card hover:shadow-card-hover transition-all duration-300"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div className={`p-4 rounded-2xl ${iconBg} border border-border/50 shadow-sm transition-transform hover:scale-110`}>
            <Icon className={`h-8 w-8 ${iconColor}`} />
          </div>
          <div>
            <h1 className="text-2xl font-light tracking-tight text-foreground">
              {greeting}, <span className="text-primary font-semibold">{user?.name || 'Administrador'}</span>
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-[0.2em]">
                {officeName || "JLVIANA Consultoria Contábil"} • Atividades em tempo real
              </p>
            </div>
          </div>
        </div>
        
        <div className="hidden md:flex flex-col items-end gap-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Calendário Fiscal</span>
          </div>
          <p className="text-sm font-medium text-foreground capitalize">{today}</p>
        </div>
      </div>
    </motion.div>
  );
}
