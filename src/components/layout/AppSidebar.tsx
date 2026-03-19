import { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileText,
  ChevronLeft,
  ChevronRight,
  Building2,
  Palette,
  Send,
  DollarSign,
  Banknote,
  TrendingUp,
  TableProperties,
  Inbox,
  Calendar as CalendarIcon,
  ShieldCheck,
  ClipboardCheck,
  LogOut,
  Settings,
  Bell
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBranding } from '@/context/BrandingContext';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const sections = [
  {
    title: 'Geral',
    items: [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard },
      { name: 'Clientes', href: '/clientes', icon: Users },
    ]
  },
  {
    title: 'Módulo Contábil',
    items: [
      { name: 'Contabilidade', href: '/contabilidade', icon: Building2 },
      { name: 'Progresso Contábil', href: '/progresso-contabil', icon: TrendingUp },
      { name: 'Relatórios', href: '/relatorios', icon: FileText },
      { name: 'Retirada de Lucro', href: '/retirada-lucro', icon: Banknote },
      { name: 'Planilha de Lucros', href: '/planilha-lucros', icon: TableProperties },
    ]
  },
  {
    title: 'Módulo Honorários',
    items: [
      { name: 'Honorários', href: '/honorarios', icon: DollarSign },
    ]
  },
  {
    title: 'Módulo Gestão',
    items: [
      { name: 'Lista de Entrega', href: '/lista-entrega', icon: Inbox },
      { name: 'Obrigações', href: '/obrigacoes', icon: ClipboardCheck },
      { name: 'Gestão de Tarefas', href: '/gestao-tarefas', icon: ShieldCheck },
      { name: 'Calendário', href: '/calendario', icon: CalendarIcon },
      { name: 'Comunicados', href: '/comunicados', icon: Send },
    ]
  },
  {
    title: 'Configurações',
    items: [
      { name: 'Personalizar', href: '/personalizar', icon: Palette },
      { name: 'Alertas', href: '/alertas', icon: Bell },
    ]
  }
];

interface AppSidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export function AppSidebar({ collapsed, setCollapsed, isMobileOpen, setIsMobileOpen }: AppSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logoUrl, officeName } = useBranding();

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname, setIsMobileOpen]);

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={cn(
          "fixed inset-0 bg-black/50 z-30 transition-opacity duration-300 md:hidden",
          isMobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsMobileOpen(false)}
      />

      <aside
        className={cn(
          'fixed left-0 top-0 h-[117.65vh] z-50 !bg-white border-r !border-slate-100 transition-all duration-500 ease-in-out no-print flex flex-col shadow-[10px_0_40px_rgba(0,0,0,0.03)] overflow-hidden',
          collapsed ? 'w-[80px]' : 'w-[280px]',
          // Mobile adjustments
          'max-md:w-[280px] max-md:z-50',
          !isMobileOpen ? 'max-md:-translate-x-full' : 'max-md:translate-x-0'
        )}
      >
        {/* Premium Subtle Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] via-transparent to-transparent pointer-events-none" />

        {/* Header / Logo Section */}
        <div className={cn(
          'relative flex h-24 items-center px-6 transition-all duration-500',
          collapsed && 'px-4 justify-center max-md:justify-start max-md:px-6'
        )}>
          <div
            className="flex items-center gap-4 cursor-pointer group/logo"
            onClick={() => navigate('/')}
          >
            <div className={cn(
              "relative flex h-12 w-12 items-center justify-center rounded-2xl bg-primary shadow-xl shadow-primary/20 transition-all duration-500 group-hover/logo:scale-105 group-hover/logo:rotate-3 overflow-hidden ring-1 ring-white/10",
              collapsed && "h-11 w-11"
            )}>
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="h-full w-full object-contain p-1.5" />
              ) : (
                <Building2 className="h-6 w-6 text-primary-foreground" />
              )}
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/logo:opacity-100 transition-opacity" />
            </div>

            {!collapsed && (
              <div className="flex flex-col min-w-0 transition-opacity duration-300 pr-2">
                <h1 className="text-[14px] font-bold !text-slate-900 tracking-tight uppercase leading-tight break-words">
                  {officeName}
                </h1>
                <p className="text-[9px] font-semibold !text-slate-600 tracking-[0.2em] uppercase opacity-70 mt-0.5">
                  JLConecta
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Main Navigation */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar py-4 px-3 space-y-6 !bg-white">
          <TooltipProvider delayDuration={0}>
            {sections.map((section, sectionIdx) => (
              <div key={section.title} className="space-y-1.5">
                {!collapsed && (
                  <h2 className={cn(
                    "px-4 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-2 transition-opacity duration-300",
                    sectionIdx !== 0 && "mt-2"
                  )}>
                    {section.title}
                  </h2>
                )}
                {collapsed && sectionIdx !== 0 && (
                  <div className="mx-4 h-px bg-slate-100 my-4" />
                )}

                <div className="space-y-1">
                  {section.items.map((item) => {
                    const isActive = location.pathname === item.href;
                    const content = (
                      <NavLink
                        key={item.name}
                        to={item.href}
                        className={cn(
                          'group relative flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm transition-all duration-300 ease-out overflow-hidden',
                          isActive
                            ? 'bg-primary/10 !text-primary shadow-[0_4px_12px_rgba(200,30,30,0.05)] ring-1 ring-primary/20'
                            : '!text-slate-700 hover:!text-slate-900 hover:bg-slate-50',
                          collapsed && 'px-0 justify-center h-12 w-full mx-auto'
                        )}
                      >
                        {/* Active Indicator Bar */}
                        {isActive && !collapsed && (
                          <div className="absolute left-0 w-1 h-5 bg-primary rounded-full transition-all duration-300" />
                        )}

                        <item.icon className={cn(
                          'transition-all duration-300 stroke-[1.8px]',
                          collapsed ? 'h-5.5 w-5.5' : 'h-5 w-5',
                          isActive ? 'text-primary' : '!text-slate-500 group-hover:!text-slate-900'
                        )} />

                        {!collapsed && (
                          <span className={cn(
                            "whitespace-nowrap transition-all duration-300 tracking-wide font-normal",
                            isActive ? "font-semibold" : "group-hover:translate-x-1"
                          )}>
                            {item.name}
                          </span>
                        )}

                        {/* Hover Background Sparkle (Subtle) */}
                        {!isActive && (
                          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </NavLink>
                    );

                    if (collapsed) {
                      return (
                        <Tooltip key={item.name}>
                          <TooltipTrigger asChild>{content}</TooltipTrigger>
                          <TooltipContent side="right" className="bg-slate-900 text-white border-none rounded-lg font-medium py-2 px-3 shadow-xl">
                            {item.name}
                          </TooltipContent>
                        </Tooltip>
                      );
                    }
                    return content;
                  })}
                </div>
              </div>
            ))}
          </TooltipProvider>
        </div>

        {/* Bottom Section - User & Settings */}
        <div className="relative mt-auto border-t !border-slate-100 !bg-white flex flex-col no-print transition-colors duration-500">
          {/* User Profile */}
          <div className="px-4 pt-4 pb-1">
            <div className={cn(
              "flex items-center gap-3 p-2.5 rounded-2xl transition-all duration-300 group/user",
              !collapsed && "hover:bg-slate-50 cursor-pointer",
              collapsed && "justify-center"
            )}>
              <div className="relative">
                <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-md shadow-primary/20 ring-2 ring-white overflow-hidden group-hover/user:scale-110 transition-transform duration-300">
                  J
                </div>
                <div className="absolute bottom-0.5 right-0.5 h-3 w-3 bg-emerald-500 border-2 border-white rounded-full shadow-sm" />
              </div>

              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold !text-slate-900 truncate leading-tight">Jefferson</p>
                  <p className="text-[10px] !text-slate-500 font-bold uppercase tracking-wider truncate mt-0.5">Administrador</p>
                </div>
              )}

              {!collapsed && (
                <div className="flex gap-0.5 opacity-0 group-hover/user:opacity-100 transition-all duration-300 translate-x-2 group-hover/user:translate-x-0">
                  <button className="p-1.5 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors !text-slate-400">
                    <Settings className="h-4 w-4" />
                  </button>
                  <button className="p-1.5 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors !text-slate-400">
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Toggle Button at the very bottom */}
          <div className="px-4 pb-4">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className={cn(
                'flex items-center justify-center gap-2 rounded-xl h-11 transition-all duration-300 !text-slate-400 hover:!text-slate-900 hover:bg-slate-50 w-full',
                collapsed ? 'px-0' : 'px-4'
              )}
            >
              {collapsed ? (
                <ChevronRight className="h-5 w-5" />
              ) : (
                <>
                  <ChevronLeft className="h-4 w-4" />
                  <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-slate-500">Recolher Menu</span>
                </>
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
