import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "./components/layout/MainLayout";
import { BrandingProvider } from "./context/BrandingContext";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import Reports from "./pages/Reports";
import Branding from "./pages/Branding";
import Announcements from "./pages/Announcements";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrandingProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <MainLayout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/clientes" element={<Clients />} />
              <Route path="/contabilidade" element={<Accounting />} />
              <Route path="/progresso-contabil" element={<AccountingProgress />} />
              <Route path="/honorarios" element={<Honorarios />} />
              <Route path="/relatorios" element={<Reports />} />
              <Route path="/retirada-lucro" element={<ProfitWithdrawals />} />
              <Route path="/planilha-lucros" element={<ProfitSheetTasks />} />
              <Route path="/lista-entrega" element={<DeliveryList />} />
              <Route path="/calendario" element={<FiscalCalendar />} />
              <Route path="/gestao-tarefas" element={<TaskManagement />} />
              <Route path="/obrigacoes" element={<Obligations />} />
              <Route path="/alertas" element={<Alerts />} />
              <Route path="/personalizar" element={<Branding />} />
              <Route path="/comunicados" element={<Announcements />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </MainLayout>
        </BrowserRouter>
      </TooltipProvider>
    </BrandingProvider>
  </QueryClientProvider>
);

export default App;
