import { useState } from 'react';
import { Header } from './Header';
import { DepartmentSidebar } from './DepartmentSidebar';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();
  
  // Show sidebar only on department routes
  const isDepartmentRoute = location.pathname.startsWith('/departamentos');

  return (
    <div className="min-h-screen bg-background font-sans">
      <Header />
      
      {isDepartmentRoute && (
        <DepartmentSidebar 
          collapsed={sidebarCollapsed} 
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
        />
      )}
      
      <main className={cn(
        'min-h-screen pt-16 transition-all duration-300',
        isDepartmentRoute && (sidebarCollapsed ? 'pl-16' : 'pl-56')
      )}>
        <div className="max-w-[1600px] mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
