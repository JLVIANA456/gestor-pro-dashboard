import { useState } from 'react';
import { AppSidebar } from './AppSidebar';
import { cn } from '@/lib/utils';
import { Menu, X, Building2 } from 'lucide-react';
import { useBranding } from '@/context/BrandingContext';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { logoUrl, officeName } = useBranding();

  return (
    <div className="min-h-screen bg-background font-sans flex overflow-x-hidden">
      <AppSidebar 
        collapsed={collapsed} 
        setCollapsed={setCollapsed} 
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />
      
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-sidebar border-b border-sidebar-border z-30 flex items-center justify-between px-4 no-print">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold overflow-hidden shadow-sm">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-full w-full object-contain p-1" />
            ) : (
              <Building2 className="h-5 w-5" />
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-sidebar-foreground uppercase tracking-tight leading-none">{officeName}</span>
            <span className="text-[8px] font-medium text-sidebar-muted uppercase tracking-[0.2em] mt-0.5">JLConecta</span>
          </div>
        </div>
        <button 
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="h-10 w-10 flex items-center justify-center rounded-xl bg-sidebar-foreground/5 text-sidebar-foreground"
        >
          {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      <main className={cn(
        "flex-1 min-h-screen transition-all duration-500 ease-in-out",
        "md:ml-[280px]",
        collapsed && "md:ml-[80px]",
        "max-md:mt-16" // Space for mobile header
      )}>
        <div className="max-w-[1600px] mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

