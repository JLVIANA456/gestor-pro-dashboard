import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "./components/layout/MainLayout";
import { BrandingProvider } from "./context/BrandingContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ClientProvider } from "./context/ClientContext";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import OperationalPanel from "./pages/OperationalPanel";
import Reports from "./pages/Reports";
import Branding from "./pages/Branding";
import Announcements from "./pages/Announcements";
import RecurringAnnouncements from "./pages/RecurringAnnouncements";
import Honorarios from "./pages/Honorarios";
import Recalculos from "./pages/Recalculos";
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
import ClientPortal from "./pages/ClientPortal";
import ClientPortalView from "./pages/ClientPortalView";
import PortalEntregas from "./pages/PortalEntregas";
import PublicUpload from "./pages/PublicUpload";
import DemandList from "./pages/DemandList";
import DocumentosRecebidos from "./pages/DocumentosRecebidos";
import DPDepartament from "./pages/DPDepartament";
import DPDemands from "./pages/DPDemands";
import DPDispatches from "./pages/DPDispatches";
import ClientChecklist from "./pages/ClientChecklist";
import Deadlines from "./pages/Deadlines";
import FiscalInstallments from "./pages/FiscalInstallments";
import Fiscal from "./pages/Fiscal";
import FiscalProgress from "./pages/FiscalProgress";
import DocumentCollection from "./pages/DocumentCollection";

import CustomProcesses from "./pages/CustomProcesses";
import CobrancaUpload from "./pages/CobrancaUpload";
import PortalContentManager from "./pages/PortalContentManager";

const queryClient = new QueryClient();

const AppContent = () => {
  const { session, loading } = useAuth();
  
  // Custom simple client auth
  const [clientSession, setClientSession] = useState<string | null>(null);

  useEffect(() => {
    const cid = localStorage.getItem('client_session_id');
    if (cid) setClientSession(cid);
    
    // Listen for custom login event
    const handleStorageChange = () => {
      setClientSession(localStorage.getItem('client_session_id'));
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('client-login', handleStorageChange);
    
    return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('client-login', handleStorageChange);
    };
  }, []);

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

  // Se não estiver logado (nem escritório e nem cliente), mostra a Landing/Login
  if (!session && !clientSession) {
    return (
      <Routes>
        <Route path="/upload-publico/:token" element={<PublicUpload />} />
        <Route path="/envio-cobranca/:eventId" element={<CobrancaUpload />} />
        <Route path="*" element={<Landing />} />
      </Routes>
    );
  }

  // Se for Cliente logado via Token do LocalStorage
  const isClient = !!clientSession && !session;

  if (isClient) {
    return (
      <Routes>
        <Route path="/upload-publico/:token" element={<PublicUpload />} />
        <Route path="/envio-cobranca/:eventId" element={<CobrancaUpload />} />
        <Route path="/*" element={<ClientPortalView />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/upload-publico/:token" element={<PublicUpload />} />
      <Route path="/envio-cobranca/:eventId" element={<CobrancaUpload />} />
      <Route path="/*" element={
        <MainLayout>
          <Routes>
            <Route path="" element={<Dashboard />} />
            <Route path="clientes" element={<Clients />} />
            <Route path="painel-operacional" element={<OperationalPanel />} />
            <Route path="contabilidade" element={<Accounting />} />
            <Route path="departamento-pessoal" element={<DPDepartament />} />
            <Route path="dp/demanda-diaria" element={<DPDemands />} />
            <Route path="dp/envios" element={<DPDispatches />} />
            <Route path="progresso-contabil" element={<AccountingProgress />} />
            <Route path="honorarios" element={<Honorarios />} />
            <Route path="recalculos" element={<Recalculos />} />
            <Route path="relatorios" element={<Reports />} />
            <Route path="retirada-lucro" element={<ProfitWithdrawals />} />
            <Route path="planilha-lucros" element={<ProfitSheetTasks />} />
            <Route path="lista-entrega" element={<DeliveryList />} />
            <Route path="lista-demandas" element={<DemandList />} />
            <Route path="calendario" element={<FiscalCalendar />} />
            <Route path="obrigacoes" element={<Obligations />} />
            <Route path="vencimentos" element={<Deadlines />} />
            <Route path="cobranca-documentos" element={<DocumentCollection />} />
            <Route path="montar-processos" element={<CustomProcesses />} />
            <Route path="alertas" element={<Alerts />} />
            <Route path="gestao-tarefas" element={<TaskManagement />} />
            <Route path="personalizar" element={<Branding />} />
            <Route path="comunicados" element={<Announcements />} />
            <Route path="comunicados-recorrentes" element={<RecurringAnnouncements />} />
            <Route path="logs-envios" element={<EmailLogs />} />
            <Route path="portal-clientes" element={<ClientPortal />} />
            <Route path="conteudo-portal" element={<PortalContentManager />} />
            <Route path="documentos" element={<DocumentosRecebidos />} />
            <Route path="portal-entregas" element={<PortalEntregas />} />
            <Route path="checklist-clientes" element={<ClientChecklist />} />
            <Route path="fiscal" element={<Fiscal />} />
            <Route path="progresso-fiscal" element={<FiscalProgress />} />
            <Route path="fiscal/parcelamentos" element={<FiscalInstallments />} />
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
          <ClientProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppContent />
            </BrowserRouter>
          </ClientProvider>
        </TooltipProvider>
      </BrandingProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
