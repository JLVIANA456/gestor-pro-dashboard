import { useState, useEffect, useCallback, useRef } from 'react';
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
  Bell,
  Clock,
  MailOpen,
  Globe,
  Monitor,
  Link2,
  FolderOpen,
  Calculator,
  Target,
  Activity,
  ListTodo,
  ClipboardList,
  ChevronDown,
  Search as SearchIcon,
  Command as CommandIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBranding } from '@/context/BrandingContext';
import { useAuth } from '@/context/AuthContext';
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
      { name: 'Painel Operacional', href: '/painel-operacional', icon: TableProperties },
    ]
  },
  {
    title: 'Gestão de Clientes',
    items: [
      { name: 'Checklist de Clientes', href: '/checklist-clientes', icon: ClipboardCheck },
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
    title: 'Módulo DP',
    items: [
      { name: 'Departamento Pessoal', href: '/departamento-pessoal', icon: Users },
      { name: 'Entrega Demanda Diária', href: '/dp/demanda-diaria', icon: CalendarIcon },
      { name: 'Envios DP', href: '/dp/envios', icon: Send },
    ]
  },
  {
    title: 'Módulo Honorários',
    items: [
      { name: 'Honorários', href: '/honorarios', icon: DollarSign },
    ]
  },
  {
    title: 'Recálculos',
    items: [
      { name: 'Recálculos', href: '/recalculos', icon: Calculator },
    ]
  },
  {
    title: 'Módulo Fiscal',
    items: [
      { name: 'Fechamento Fiscal', href: '/fiscal', icon: ShieldCheck },
      { name: 'Progresso Fiscal', href: '/progresso-fiscal', icon: Activity },
      { name: 'Parcelamentos', href: '/fiscal/parcelamentos', icon: Banknote },
    ]
  },
  {
    title: 'Módulo Gestão',
    items: [
      { name: 'Obrigações', href: '/obrigacoes', icon: FileText },
      { name: 'Gestão de Tarefas', href: '/gestao-tarefas', icon: ShieldCheck },
      { name: 'Lista de Entregas', href: '/lista-entrega', icon: Send },
      { name: 'Lista de Demandas', href: '/lista-demandas', icon: ListTodo },
      { name: 'Vencimentos', href: '/vencimentos', icon: Clock },
      { name: 'Gestão de Processos', href: '/montar-processos', icon: ClipboardList },
      { name: 'Alertas', href: '/alertas', icon: Bell },
      { name: 'Calendário', href: '/calendario', icon: CalendarIcon },
      { name: 'Comunicados', href: '/comunicados', icon: Send },
      { name: 'Recorrentes', href: '/comunicados-recorrentes', icon: Clock },
      { name: 'Cobrança de Documentos', href: '/cobranca-documentos', icon: FolderOpen },
      { name: 'Logs e Envios', href: '/logs-envios', icon: MailOpen },
    ]
  },
  {
    title: 'Portal do Cliente',
    items: [
      { name: 'Hub do Cliente', href: '/portal-entregas', icon: Globe },
      { name: 'Conteúdo do Portal', href: '/conteudo-portal', icon: FileText },
      { name: 'Docs Recebidos', href: '/documentos', icon: FolderOpen },
      { name: 'Links de Envio', href: '/portal-clientes', icon: Link2 },
    ]
  },
  {
    title: 'Sistema',
    items: [
      { name: 'Config. do sistema', href: '/personalizar', icon: Settings },
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
  const { user, signOut } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ 'Geral': true });
  const [recentItems, setRecentItems] = useState<any[]>([]);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [paletteSearch, setPaletteSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Carregar e atualizar itens recentes
  useEffect(() => {
    const saved = localStorage.getItem('sidebar_recent_pages');
    let history = saved ? JSON.parse(saved) : [];
    
    const currentItem = sections
      .flatMap(s => s.items)
      .find(item => item.href === location.pathname);

    if (currentItem) {
      history = history.filter((h: any) => h.href !== currentItem.href);
      history.unshift({
        name: currentItem.name,
        href: currentItem.href
      });
      history = history.slice(0, 4);
      localStorage.setItem('sidebar_recent_pages', JSON.stringify(history));
    }

    const recentWithIcons = history.map((h: any) => {
      return sections.flatMap(s => s.items).find(i => i.href === h.href);
    }).filter(Boolean);

    setRecentItems(recentWithIcons);
  }, [location.pathname]);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname, setIsMobileOpen]);

  const toggleSection = (title: string) => {
    setOpenSections(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  // Keyboard shortcut Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }
      if (e.key === 'Escape') {
        setIsCommandPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus search input when palette opens
  useEffect(() => {
    if (isCommandPaletteOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
      setSelectedIndex(0);
    }
  }, [isCommandPaletteOpen]);

  const allItems = sections.flatMap(s => s.items.map(i => ({ ...i, section: s.title })));
  const paletteResults = allItems.filter(item => 
    item.name.toLowerCase().includes(paletteSearch.toLowerCase()) ||
    item.section.toLowerCase().includes(paletteSearch.toLowerCase())
  );

  const handlePaletteSelect = (href: string) => {
    navigate(href);
    setIsCommandPaletteOpen(false);
    setPaletteSearch('');
  };

  const filteredSections = sections.map(section => ({
    ...section,
    items: section.items.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      section.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(section => section.items.length > 0);

  return (
    <>
      {/* Search Command Palette (Centered Modal) */}
      {isCommandPaletteOpen && (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh] px-4">
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => setIsCommandPaletteOpen(false)}
          />
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center px-6 py-5 border-b border-slate-100">
              <SearchIcon className="h-5 w-5 text-primary" />
              <input 
                ref={searchInputRef}
                type="text"
                placeholder="Para onde você quer ir? Digite o nome do módulo..."
                className="flex-1 bg-transparent border-none focus:ring-0 text-slate-900 placeholder:text-slate-400 font-medium ml-3 text-base"
                value={paletteSearch}
                onChange={(e) => {
                  setPaletteSearch(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setSelectedIndex(prev => (prev + 1) % paletteResults.length);
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setSelectedIndex(prev => (prev - 1 + paletteResults.length) % paletteResults.length);
                  } else if (e.key === 'Enter' && paletteResults[selectedIndex]) {
                    handlePaletteSelect(paletteResults[selectedIndex].href);
                  }
                }}
              />
              <div className="flex items-center gap-1.5 ml-4">
                <kbd className="px-2 py-1 bg-slate-100 border border-slate-200 rounded-md text-[10px] font-black text-slate-500">ESC</kbd>
              </div>
            </div>

            <div className="max-h-[500px] overflow-y-auto p-3 custom-scrollbar">
              {paletteResults.length > 0 ? (
                <div className="space-y-1">
                  {paletteResults.map((item, idx) => (
                    <button
                      key={item.href}
                      onClick={() => handlePaletteSelect(item.href)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={cn(
                        "w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-200",
                        idx === selectedIndex ? "bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]" : "hover:bg-slate-50 text-slate-700"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "h-10 w-10 rounded-xl flex items-center justify-center transition-colors",
                          idx === selectedIndex ? "bg-white/20" : "bg-slate-100"
                        )}>
                          <item.icon className="h-5 w-5" />
                        </div>
                        <div className="text-left">
                          <p className={cn("text-sm font-bold", idx === selectedIndex ? "text-white" : "text-slate-900")}>{item.name}</p>
                          <p className={cn("text-[10px] font-black uppercase tracking-wider opacity-60", idx === selectedIndex ? "text-white" : "text-primary")}>{item.section}</p>
                        </div>
                      </div>
                      {idx === selectedIndex && (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold opacity-80">Abrir agora</span>
                          <ChevronRight className="h-4 w-4" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <p className="text-slate-400 font-medium">Nenhum resultado encontrado para "{paletteSearch}"</p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-400">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5"><ChevronDown className="h-3.5 w-3.5" /><ChevronLeft className="h-3.5 w-3.5" rotate={90} /> Navegar</span>
                <span className="flex items-center gap-1.5"><CommandIcon className="h-3.5 w-3.5" /> Abrir</span>
              </div>
              <span>Busca Global JLConecta</span>
            </div>
          </div>
        </div>
      )}

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
          'fixed left-0 top-0 h-screen z-50 bg-slate-100/50 backdrop-blur-md border-r border-slate-200 transition-all duration-500 ease-in-out no-print flex flex-col shadow-[1px_0_10px_rgba(0,0,0,0.02)]',
          collapsed ? 'w-[80px]' : 'w-[280px]',
          !isMobileOpen ? 'max-md:-translate-x-full' : 'max-md:translate-x-0'
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] via-transparent to-transparent pointer-events-none" />

        {/* Header / Logo Section */}
        <div className={cn(
          'relative flex h-24 items-center px-6 transition-all duration-500',
          collapsed && 'px-0 justify-center'
        )}>
          <div
            className={cn(
              "flex items-center gap-4 cursor-pointer",
              collapsed && "flex-col gap-2"
            )}
            onClick={() => navigate('/')}
          >
            {collapsed ? (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCommandPaletteOpen(true);
                }}
                className="h-12 w-12 rounded-2xl bg-white/50 border border-slate-200/60 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-white transition-all shadow-sm group/search"
              >
                <SearchIcon className="h-5 w-5 transition-transform group-hover/search:scale-110" />
              </button>
            ) : (
              <div className="flex flex-col min-w-0 pr-2">
                <h1 className="text-[14px] font-black !text-slate-950 tracking-tight uppercase leading-tight break-words">
                  {officeName}
                </h1>
                <p className="text-[9px] font-bold !text-primary tracking-[0.2em] uppercase opacity-80 mt-0.5">
                  JLConecta
                </p>
              </div>
            )}
          </div>
        </div>

        {!collapsed && (
          <div className="px-6 mb-4">
            <div className="relative group">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-focus-within:text-primary transition-colors" />
              <input 
                id="sidebar-search"
                type="text"
                placeholder="Buscar módulo... (Ctrl + K)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/40 border border-slate-200/60 rounded-xl py-2.5 pl-9 pr-4 text-[11px] font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 ring-primary/10 transition-all"
              />
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar py-2 px-4 space-y-6 bg-transparent">
          <TooltipProvider delayDuration={0}>
            {!collapsed && !searchQuery && recentItems.length > 0 && (
              <div className="space-y-1.5 mb-8">
                <h2 className="px-4 text-[9px] font-black uppercase tracking-[0.25em] text-primary/60 mb-3 flex items-center gap-2">
                  <Clock className="h-3 w-3" /> Recentes
                </h2>
                <div className="space-y-1">
                  {recentItems.slice(0, 3).map((item) => (
                    <NavLink
                      key={`recent-${item.href}`}
                      to={item.href}
                      className="group relative flex items-center gap-3 rounded-xl px-4 py-2.5 text-xs text-slate-500 hover:text-slate-900 hover:bg-white/60 transition-all border border-transparent hover:border-slate-100"
                    >
                      <item.icon className="h-4 w-4 opacity-50 group-hover:opacity-100" />
                      <span className="truncate">{item.name}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            )}

            {filteredSections.map((section, sectionIdx) => {
              const isOpen = openSections[section.title] || searchQuery.length > 0;
              return (
                <div key={section.title} className="space-y-1">
                  {!collapsed && (
                    <button
                      onClick={() => toggleSection(section.title)}
                      className={cn(
                        "w-full flex items-center justify-between px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500/70 hover:text-slate-900 transition-colors group/header",
                        sectionIdx !== 0 && "mt-2"
                      )}
                    >
                      <span>{section.title}</span>
                      <ChevronDown className={cn(
                        "h-3 w-3 transition-transform duration-300",
                        isOpen ? "rotate-0" : "-rotate-90 opacity-40"
                      )} />
                    </button>
                  )}
                  
                  {collapsed && sectionIdx !== 0 && (
                    <div className="mx-4 h-px bg-slate-100/50 my-4" />
                  )}

                  <div className={cn(
                    "space-y-0.5 transition-all duration-300 overflow-hidden",
                    !collapsed && !isOpen ? "max-h-0 opacity-0" : "max-h-[1200px] opacity-100"
                  )}>
                    {section.items.map((item) => {
                      const isActive = location.pathname === item.href;
                      const content = (
                        <NavLink
                          key={item.name}
                          to={item.href}
                          className={cn(
                            'group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-all duration-300 ease-out overflow-hidden mb-1',
                            isActive
                              ? 'bg-white shadow-[0_4px_12px_rgba(0,0,0,0.05)] ring-1 ring-slate-200/80 text-primary'
                              : 'text-slate-600 font-medium hover:text-slate-900 hover:bg-white/60',
                            collapsed && 'px-0 justify-center h-12 w-12 mx-auto mb-2'
                          )}
                        >
                          {isActive && !collapsed && (
                            <div className="absolute left-0 w-1.5 h-6 bg-gradient-to-b from-primary to-primary/60 rounded-r-full shadow-[2px_0_8px_rgba(var(--primary-rgb),0.3)] transition-all duration-300" />
                          )}

                          <item.icon className={cn(
                            'transition-all duration-300 stroke-[2px]',
                            collapsed ? 'h-6 w-6' : 'h-5 w-5',
                            isActive ? 'text-primary scale-110' : 'text-slate-400 group-hover:text-primary'
                          )} />

                          {!collapsed && (
                            <span className={cn(
                              "whitespace-nowrap transition-all duration-300 tracking-tight",
                              isActive ? "font-bold text-[13px]" : "font-medium text-[13px] group-hover:translate-x-1"
                            )}>
                              {item.name}
                            </span>
                          )}

                          {!isActive && (
                            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </NavLink>
                      );

                      if (collapsed) {
                        return (
                          <Tooltip key={item.name}>
                            <TooltipTrigger asChild>{content}</TooltipTrigger>
                            <TooltipContent
                              side="right"
                              sideOffset={20}
                              className="z-[9999] bg-white/90 backdrop-blur-xl text-slate-900 border border-slate-200 rounded-[1.2rem] p-0 shadow-2xl overflow-hidden animate-in fade-in zoom-in slide-in-from-left-4 duration-300 min-w-[180px]"
                            >
                              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 mb-0.5">{section.title}</p>
                                <p className="text-sm font-bold tracking-tight">{item.name}</p>
                              </div>
                              <div className="px-4 py-2 bg-white flex items-center justify-between group-hover:bg-primary/5 transition-colors">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Clique para abrir</span>
                                <ChevronRight className="h-3 w-3 text-slate-300" />
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        );
                      }
                      return content;
                    })}
                  </div>
                </div>
              );
            })}
          </TooltipProvider>
        </div>

        <div className="relative mt-auto border-t border-slate-200 bg-slate-100/30 backdrop-blur-sm flex flex-col no-print">
          <div className="px-4 pt-4 pb-1">
            {collapsed ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-lg shadow-primary/20 ring-2 ring-white overflow-hidden mx-auto cursor-pointer hover:scale-110 transition-all duration-300 mb-4">
                      {user?.avatar ? (
                        <img src={user.avatar} alt="Avatar" className="h-full w-full object-cover" />
                      ) : (
                        user?.name?.charAt(0).toUpperCase() || 'U'
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent
                    side="right"
                    sideOffset={20}
                    className="z-[9999] bg-white/90 backdrop-blur-xl text-slate-900 border border-slate-200 rounded-[1.5rem] p-4 shadow-2xl min-w-[200px]"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                        <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-white font-bold">
                          {user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <p className="text-sm font-bold text-slate-900">{user?.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{user?.role}</p>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <button 
                          onClick={() => navigate('/personalizar')}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 text-slate-600 hover:text-primary transition-all text-xs font-bold"
                        >
                          <Settings className="h-4 w-4" /> Configurações
                        </button>
                        <button 
                          onClick={() => signOut()}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-destructive/5 text-slate-600 hover:text-destructive transition-all text-xs font-bold"
                        >
                          <LogOut className="h-4 w-4" /> Sair do Sistema
                        </button>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <div className="flex items-center gap-3 p-2.5 rounded-2xl transition-all duration-300 group/user hover:bg-slate-50 cursor-pointer">
                <div className="relative">
                  <div className="h-10 w-10 min-w-[40px] rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-md shadow-primary/20 ring-2 ring-white overflow-hidden group-hover/user:scale-110 transition-transform duration-300">
                    {user?.avatar ? (
                      <img src={user.avatar} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                      user?.name?.charAt(0).toUpperCase() || 'U'
                    )}
                  </div>
                  <div className="absolute bottom-0.5 right-0.5 h-3 w-3 bg-emerald-500 border-2 border-white rounded-full shadow-sm" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black !text-slate-950 truncate leading-tight">{user?.name || 'Usuário'}</p>
                  <p className="text-[10px] !text-slate-500 font-black uppercase tracking-wider truncate mt-0.5 opacity-60">{user?.role || 'Acesso'}</p>
                </div>
                <div className="flex gap-0.5 opacity-0 group-hover/user:opacity-100 transition-all duration-300 translate-x-2 group-hover/user:translate-x-0">
                  <button onClick={() => navigate('/personalizar')} className="p-1.5 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors !text-slate-400">
                    <Settings className="h-4 w-4" />
                  </button>
                  <button onClick={() => signOut()} className="p-1.5 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors !text-slate-400">
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

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
                  <span className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-500">Recolher Menu</span>
                </>
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
