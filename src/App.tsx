import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "./components/layout/MainLayout";
import { BrandingProvider } from "./context/BrandingContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import Reports from "./pages/Reports";
import Branding from "./pages/Branding";
import Announcements from "./pages/Announcements";
import RecurringAnnouncements from "./pages/RecurringAnnouncements";
import Honorarios from "./pages/Honorarios";
import NotFound from "./pages/NotFound";
import Accounting from "./pages/Accounting";
import AccountingProgress from "./pages/AccountingProgress";
import ProfitWithdrawals from "./pages/ProfitWithdrawals";
import ProfitSheetTasks from "./pages/ProfitSheetTasks";
import FiscalCalendar from "./pages/FiscalCalendar";
import DeliveryList from "./pages/DeliveryList";
import TaskManagement from "./pages/TaskManagement";
import Obligations from "./pages/Obligations";
import Alerts from "./pages/Alerts";
import EmailLogs from "./pages/EmailLogs";
import Login from "./pages/Login";
import Landing from "./pages/Landing";
import ClientPortalAdmin from "./pages/ClientPortalAdmin";
import ClientPortalView from "./pages/ClientPortalView";
import PortalEntregas from "./pages/PortalEntregas";
import PublicUpload from "./pages/PublicUpload";
import ClientActivation from "./pages/ClientActivation";
import ClientPortalConfig from "./pages/ClientPortalConfig";
import DemandList from "./pages/DemandList";

const queryClient = new QueryClient();

const AppContent = () => {
  const { session, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center animate-pulse">
            <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Iniciando Sistema...</span>
        </div>
      </div>
    );
  }

  // Se não estiver logado, mostra a Landing (que contém o Login)
  if (!session) {
    return (
      <Routes>
        <Route path="/upload-publico/:token" element={<PublicUpload />} />
        <Route path="/ativar-portal/:token" element={<ClientActivation />} />
        <Route path="*" element={<Landing />} />
      </Routes>
    );
  }

  // Se for Cliente logado no Portal, a visualização é diferente (se desejar isolar)
  const isClient = user?.role === 'Cliente';

  return (
    <Routes>
      <Route path="/upload-publico/:token" element={<PublicUpload />} />
      <Route path="/*" element={
        <MainLayout>
          <Routes>
            <Route path="" element={isClient ? <ClientPortalView /> : <Dashboard />} />
            <Route path="clientes" element={<Clients />} />
            <Route path="contabilidade" element={<Accounting />} />
            <Route path="progresso-contabil" element={<AccountingProgress />} />
            <Route path="honorarios" element={<Honorarios />} />
            <Route path="relatorios" element={<Reports />} />
            <Route path="retirada-lucro" element={<ProfitWithdrawals />} />
            <Route path="planilha-lucros" element={<ProfitSheetTasks />} />
            <Route path="lista-entrega" element={<DeliveryList />} />
            <Route path="lista-demandas" element={<DemandList />} />
            <Route path="calendario" element={<FiscalCalendar />} />
            <Route path="gestao-tarefas" element={<TaskManagement />} />
            <Route path="obrigacoes" element={<Obligations />} />
            <Route path="alertas" element={<Alerts />} />
            <Route path="personalizar" element={<Branding />} />
            <Route path="comunicados" element={<Announcements />} />
            <Route path="comunicados-recorrentes" element={<RecurringAnnouncements />} />
            <Route path="logs-envios" element={<EmailLogs />} />
            <Route path="portal-admin" element={<ClientPortalAdmin />} />
            <Route path="portal-config" element={<ClientPortalConfig />} />
            <Route path="portal-entregas" element={<PortalEntregas />} />
            <Route path="portal-cliente" element={<ClientPortalView />} />
            <Route path="ativar-portal/:token" element={<ClientActivation />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </MainLayout>
      } />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <BrandingProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </TooltipProvider>
      </BrandingProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
