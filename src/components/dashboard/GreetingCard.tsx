import { Sun, Moon, CloudSun, Calendar, CloudRain, CloudLightning, Thermometer, ChevronRight, Zap, Building2, ShieldCheck, Users } from 'lucide-react';
import { useBranding } from '@/context/BrandingContext';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function GreetingCard() {
  const { officeName } = useBranding();
  const { user } = useAuth();
  const navigate = useNavigate();
  const hour = new Date().getHours();
  
  const [weather, setWeather] = useState({
    temp: 24,
    condition: 'Ensolarado',
    Icon: Sun,
    color: 'text-orange-500',
    bg: 'bg-orange-50',
    message: 'O dia está ótimo para focar na produtividade!'
  });

  // Simulando clima real
  useEffect(() => {
    const conditions = [
      { temp: 28, condition: 'Ensolarado', icon: Sun, color: 'text-orange-500', bg: 'bg-orange-50', message: 'O sol está brilhando! Que tal uma pausa para o café?' },
      { temp: 22, condition: 'Nublado', icon: CloudSun, color: 'text-sky-500', bg: 'bg-sky-50', message: 'Dia tranquilo. Bom para organizar os processos.' },
      { temp: 19, condition: 'Chuvoso', icon: CloudRain, color: 'text-blue-500', bg: 'bg-blue-50', message: 'Não esqueça o guarda-chuva hoje!' },
      { temp: 25, condition: 'Tempestade', icon: CloudLightning, color: 'text-purple-500', bg: 'bg-purple-50', message: 'Melhor ficar no escritório focado hoje.' }
    ];
    
    // Pegar um aleatório apenas para o demo, mas baseado na hora para ser mais "real"
    const randomIdx = hour >= 18 || hour < 6 ? 1 : Math.floor(Math.random() * 3);
    const selected = conditions[randomIdx];
    
    setWeather({
      temp: selected.temp,
      condition: selected.condition,
      Icon: selected.icon,
      color: selected.color,
      bg: selected.bg,
      message: selected.message
    });
  }, [hour]);

  let greeting = 'Boa noite';
  if (hour >= 5 && hour < 12) greeting = 'Bom dia';
  else if (hour >= 12 && hour < 18) greeting = 'Boa tarde';

  const today = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const chips = [
    { name: 'Geral', icon: Zap, href: '/', color: 'hover:bg-primary/10 hover:text-primary' },
    { name: 'Fiscal', icon: ShieldCheck, href: '/fiscal', color: 'hover:bg-orange-500/10 hover:text-orange-500' },
    { name: 'Contábil', icon: Building2, href: '/contabilidade', color: 'hover:bg-blue-500/10 hover:text-blue-500' },
    { name: 'DP', icon: Users, href: '/departamento-pessoal', color: 'hover:bg-emerald-500/10 hover:text-emerald-500' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[2.5rem] bg-white/70 backdrop-blur-xl p-8 border border-white/40 shadow-[0_20px_50px_rgba(0,0,0,0.05)] transition-all duration-500 group"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-8">
          {/* Weather Widget */}
          <div className="relative">
            <div className={`p-6 rounded-[2rem] ${weather.bg} border border-white/60 shadow-inner transition-all duration-500 group-hover:scale-105 group-hover:rotate-3`}>
              <weather.Icon className={`h-10 w-10 ${weather.color} animate-pulse`} />
            </div>
            <div className="absolute -top-2 -right-2 bg-white rounded-full px-2 py-1 border border-slate-100 shadow-sm flex items-center gap-1">
              <Thermometer className="h-3 w-3 text-red-500" />
              <span className="text-[10px] font-black">{weather.temp}°C</span>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <h1 className="text-3xl font-light tracking-tight text-slate-900 leading-tight">
                {greeting}, <span className="text-primary font-black">{user?.name || 'Administrador'}</span>
              </h1>
              <p className="text-[11px] font-bold text-slate-400 mt-2 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                {weather.message}
              </p>
            </div>

            {/* Navigation Chips */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              {chips.map((chip) => (
                <button
                  key={chip.name}
                  onClick={() => navigate(chip.href)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100/50 border border-slate-200/50 text-[11px] font-black uppercase tracking-widest text-slate-500 transition-all duration-300",
                    chip.color,
                    "hover:border-transparent hover:shadow-md active:scale-95"
                  )}
                >
                  <chip.icon className="h-3.5 w-3.5" />
                  {chip.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
