import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Calculator,
  Users,
  FileText,
  Award,
  ChevronLeft,
  ChevronRight,
  Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const departments = [
  { name: 'Fiscal', href: '/departamentos/fiscal', icon: FileText },
  { name: 'Contábil', href: '/departamentos/contabil', icon: Calculator },
  { name: 'Pessoal', href: '/departamentos/pessoal', icon: Users },
  { name: 'Qualidade', href: '/departamentos/qualidade', icon: Award },
];

interface DepartmentSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function DepartmentSidebar({ collapsed, onToggle }: DepartmentSidebarProps) {
  const location = useLocation();

  return (
    <aside
      className={cn(
        'fixed left-0 top-16 z-30 h-[calc(100vh-4rem)] bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out no-print',
        collapsed ? 'w-16' : 'w-56'
      )}
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className={cn(
          'flex items-center border-b border-sidebar-border px-4 py-4',
          collapsed ? 'justify-center' : 'gap-3'
        )}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Building2 className="h-4 w-4 text-primary" />
          </div>
          {!collapsed && (
            <div className="animate-fade-in">
              <p className="text-[10px] font-normal text-sidebar-muted uppercase tracking-[0.2em]">Departamentos</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-2 py-4">
          {departments.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={cn(
                  'group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-light transition-all duration-200',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-muted hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
                  collapsed && 'justify-center px-2'
                )}
                title={collapsed ? item.name : undefined}
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
        <div className="border-t border-sidebar-border p-2">
          <button
            onClick={onToggle}
            className={cn(
              'flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-light text-sidebar-muted transition-all hover:bg-sidebar-accent hover:text-sidebar-foreground'
            )}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span className="animate-fade-in text-xs">Recolher</span>
              </>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
