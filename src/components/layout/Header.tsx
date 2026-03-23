import { useState, useEffect } from 'react';
import { LayoutDashboard, Users, FileText, Palette, Mail, Building2, Menu, X, Send, DollarSign, TrendingUp, Banknote, MoreHorizontal, TableProperties, Inbox, Calendar as CalendarIcon, ShieldCheck } from 'lucide-react';
import { useNavigate, NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useBranding } from '@/context/BrandingContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Clientes', href: '/clientes', icon: Users },
  { name: 'Contabilidade', href: '/contabilidade', icon: Building2 },
  { name: 'Honorários', href: '/honorarios', icon: DollarSign },
  { name: 'Progresso Contábil', href: '/progresso-contabil', icon: TrendingUp },
  { name: 'Relatórios', href: '/relatorios', icon: FileText },
  { name: 'Retirada de Lucro', href: '/retirada-lucro', icon: Banknote },
  { name: 'Planilha de Lucros', href: '/planilha-lucros', icon: TableProperties },
  { name: 'Lista de Entrega', href: '/lista-entrega', icon: Inbox },
  { name: 'Calendário', href: '/calendario', icon: CalendarIcon },
  { name: 'Gestão de Tarefas', href: '/gestao-tarefas', icon: ShieldCheck },
  { name: 'Comunicados', href: '/comunicados', icon: Send },
  { name: 'Personalizar', href: '/personalizar', icon: Palette },
];

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logoUrl, officeName } = useBranding();

  // Fechar menu mobile ao trocar de rota
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 h-16 border-b border-sidebar-border bg-sidebar text-sidebar-foreground backdrop-blur-xl transition-all duration-300 no-print">
      <div className="mx-auto max-w-[1600px] flex h-full items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-4">
          {/* Logo Section */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary overflow-hidden shadow-lg shadow-primary/20 ring-1 ring-white/10">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="h-full w-full object-contain p-1" />
              ) : (
                <Building2 className="h-5 w-5 text-primary-foreground" />
              )}
            </div>
            <div className="hidden lg:block">
              <h1 className="text-sm font-light tracking-wide text-sidebar-foreground">
                {officeName}
              </h1>
              <p className="text-[10px] font-normal text-sidebar-muted uppercase tracking-[0.2em] leading-none mt-0.5">JLConecta</p>
            </div>
          </div>

          {/* Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-0.5">
            {navigation.slice(0, 7).map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-normal uppercase tracking-tight transition-all duration-300 whitespace-nowrap',
                    isActive
                      ? 'bg-sidebar-foreground/10 text-sidebar-foreground shadow-sm ring-1 ring-sidebar-foreground/10'
                      : 'text-sidebar-foreground/50 hover:bg-sidebar-foreground/5 hover:text-sidebar-foreground'
                  )}
                >
                  <item.icon className={cn(
                    'h-3.5 w-3.5 transition-colors',
                    isActive ? 'text-primary' : 'text-sidebar-muted/40'
                  )} />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}

            {/* More Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-normal uppercase tracking-tight text-sidebar-foreground/50 hover:bg-sidebar-foreground/5 hover:text-sidebar-foreground transition-all duration-300">
                  <MoreHorizontal className="h-3.5 w-3.5 text-sidebar-muted/40" />
                  <span>Mais</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-sidebar border-sidebar-border p-1 rounded-xl shadow-elevated">
                {navigation.slice(7).map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <DropdownMenuItem
                      key={item.name}
                      onClick={() => navigate(item.href)}
                      className={cn(
                        "rounded-lg gap-2 cursor-pointer font-light text-[11px] uppercase tracking-wider",
                        isActive ? "bg-primary/10 text-primary" : "text-sidebar-foreground"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.name}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </div>

        {/* Right Section: User */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 rounded-2xl bg-sidebar-foreground/5 pl-1.5 pr-4 py-1.5 border border-sidebar-border hover:border-sidebar-foreground/20 transition-all cursor-pointer group shadow-sm">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-[12px] font-normal text-primary-foreground ring-2 ring-sidebar-foreground/5 shadow-inner">
              J
            </div>
            <div className="hidden sm:block">
              <p className="text-[11px] font-light text-sidebar-foreground leading-none">Jefferson</p>
              <p className="text-[9px] font-normal text-sidebar-muted uppercase tracking-[0.2em] leading-none mt-1">Administrador</p>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="flex md:hidden h-10 w-10 items-center justify-center rounded-xl bg-sidebar-foreground/5 hover:bg-sidebar-foreground/10 border border-sidebar-border transition-all ml-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      <div className={cn(
        'absolute inset-x-0 top-16 bg-sidebar border-b border-sidebar-border transition-all duration-300 md:hidden overflow-hidden',
        isMenuOpen ? 'max-h-64 opacity-100 py-4' : 'max-h-0 opacity-0 py-0'
      )}>
        <nav className="flex flex-col px-4 gap-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={cn(
                  'flex items-center gap-4 rounded-xl px-4 py-4 text-sm font-light uppercase tracking-[0.2em]',
                  isActive ? 'bg-sidebar-foreground/10 text-sidebar-foreground' : 'text-sidebar-foreground/50'
                )}
              >
                <item.icon className={cn('h-5 w-5', isActive ? 'text-primary' : 'text-sidebar-muted/30')} />
                {item.name}
              </NavLink>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
