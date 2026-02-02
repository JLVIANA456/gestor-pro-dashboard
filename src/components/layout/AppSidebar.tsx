import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileText,
  ChevronLeft,
  ChevronRight,
  Building2,
  Palette
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBranding } from '@/context/BrandingContext';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Clientes', href: '/clientes', icon: Users },
  { name: 'Relatórios', href: '/relatorios', icon: FileText },
  { name: 'Personalizar', href: '/personalizar', icon: Palette },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { logoUrl, officeName } = useBranding();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-sidebar transition-all duration-300 ease-in-out no-print',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className={cn(
          'flex h-20 items-center border-b border-sidebar-border px-6',
          collapsed && 'justify-center px-4'
        )}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary overflow-hidden">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="h-full w-full object-contain p-1" />
              ) : (
                <Building2 className="h-5 w-5 text-primary-foreground" />
              )}
            </div>
            {!collapsed && (
              <div className="animate-fade-in">
                <h1 className="text-lg font-semibold text-sidebar-foreground truncate max-w-[140px]">
                  {officeName}
                </h1>
                <p className="text-xs text-sidebar-muted uppercase tracking-tighter font-medium">Gestão Contábil</p>
              </div>
            )}
          </div>
        </div>


        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-6">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={cn(
                  'group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-muted hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
                  collapsed && 'justify-center px-3'
                )}
              >
                <item.icon className={cn(
                  'h-5 w-5 flex-shrink-0 transition-colors',
                  isActive ? 'text-primary' : 'text-sidebar-muted group-hover:text-sidebar-foreground'
                )} />
                {!collapsed && (
                  <span className="animate-fade-in">{item.name}</span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Collapse Toggle */}
        <div className="border-t border-sidebar-border p-4">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              'flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-sidebar-muted transition-all hover:bg-sidebar-accent hover:text-sidebar-foreground',
              collapsed && 'px-3'
            )}
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <>
                <ChevronLeft className="h-5 w-5" />
                <span className="animate-fade-in">Recolher</span>
              </>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
