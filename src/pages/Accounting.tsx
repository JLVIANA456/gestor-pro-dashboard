import { useState, useMemo } from 'react';
import { Search, Building2, Loader2, FileSpreadsheet, CheckCircle2, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { useClients, type Client, type TaxRegime } from '@/hooks/useClients';
import { useAccountingProgress } from '@/hooks/useAccountingProgress';
import { AccountingProgressModal } from '@/components/accounting/AccountingProgressModal';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const regimeLabels: Record<TaxRegime, string> = {
  simples: 'Simples Nacional',
  presumido: 'Lucro Presumido',
  real: 'Lucro Real',
};

const regimeStyles: Record<TaxRegime, string> = {
  simples: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  presumido: 'bg-blue-50 text-blue-700 border-blue-100',
  real: 'bg-violet-50 text-violet-700 border-violet-100',
};

export default function Accounting() {
  const { clients, loading: clientsLoading } = useClients();
  const { progress, loading: progressLoading, saveProgress } = useAccountingProgress();
  
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const loading = clientsLoading || progressLoading;

  // Get unique colaboradores from clients (responsavel_contabil field)
  const colaboradores = useMemo(() => {
    const set = new Set<string>();
    clients.forEach(c => {
      if (c.responsavelContabil) {
        set.add(c.responsavelContabil);
      }
    });
    return Array.from(set).sort();
  }, [clients]);

  // Mês atual para mostrar status
  const currentMonth = format(new Date(), 'yyyy-MM');

  // Filter clients
  const filteredClients = useMemo(() => {
    if (!search.trim()) return clients;
    const term = search.toLowerCase();
    return clients.filter(c => 
      c.razaoSocial.toLowerCase().includes(term) ||
      c.nomeFantasia?.toLowerCase().includes(term) ||
      c.cnpj.includes(term)
    );
  }, [clients, search]);

  // Get progress status for a client in current month
  const getClientProgress = (clientId: string) => {
    return progress.find(p => p.clientId === clientId && p.mesAno === currentMonth);
  };

  const handleClientClick = (client: Client) => {
    setSelectedClient(client);
    setModalOpen(true);
  };

  const handleSave = async (data: Parameters<typeof saveProgress>[0]) => {
    await saveProgress(data);
  };

  const existingProgress = selectedClient 
    ? progress.find(p => p.clientId === selectedClient.id && p.mesAno === currentMonth)
    : undefined;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-slide-in-up">
        <div>
          <h1 className="text-3xl font-light tracking-tight text-foreground">Contabilidade</h1>
          <p className="text-xs font-normal text-muted-foreground uppercase tracking-[0.2em] mt-1">
            Controle de progresso por colaborador
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-4 animate-slide-in-up stagger-1">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por razão social, nome fantasia ou CNPJ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rounded-xl border-border/50"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 animate-slide-in-up stagger-2">
        <div className="rounded-2xl bg-card p-6 border border-border/50 shadow-card">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/5 border border-primary/10">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em]">Total de Clientes</p>
              <p className="text-3xl font-light text-foreground tracking-tighter">{clients.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl bg-card p-6 border border-border/50 shadow-card">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-100">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em]">Concluídos (Mês Atual)</p>
              <p className="text-3xl font-light text-emerald-600 tracking-tighter">
                {progress.filter(p => p.mesAno === currentMonth && p.conciliacaoContabil).length}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl bg-card p-6 border border-border/50 shadow-card">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 border border-amber-100">
              <AlertCircle className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em]">Pendentes</p>
              <p className="text-3xl font-light text-amber-600 tracking-tighter">
                {clients.length - progress.filter(p => p.mesAno === currentMonth && p.conciliacaoContabil).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border/50 bg-card shadow-card overflow-hidden animate-slide-in-up stagger-3">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent bg-muted/10">
              <TableHead className="font-normal text-[10px] uppercase tracking-[0.2em] text-muted-foreground h-12">Razão Social</TableHead>
              <TableHead className="font-normal text-[10px] uppercase tracking-[0.2em] text-muted-foreground h-12">CNPJ</TableHead>
              <TableHead className="font-normal text-[10px] uppercase tracking-[0.2em] text-muted-foreground h-12">Regime</TableHead>
              <TableHead className="font-normal text-[10px] uppercase tracking-[0.2em] text-muted-foreground h-12">Responsável Contábil</TableHead>
              <TableHead className="font-normal text-[10px] uppercase tracking-[0.2em] text-muted-foreground h-12">Status Mês Atual</TableHead>
              <TableHead className="font-normal text-[10px] uppercase tracking-[0.2em] text-muted-foreground h-12 text-right">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.map((client) => {
              const clientProgress = getClientProgress(client.id);
              return (
                <TableRow
                  key={client.id}
                  className="border-border hover:bg-primary/[0.01] transition-colors cursor-pointer"
                  onClick={() => handleClientClick(client)}
                >
                  <TableCell className="font-normal text-foreground py-4">
                    {client.nomeFantasia || client.razaoSocial}
                  </TableCell>
                  <TableCell className="text-sm font-mono font-light text-muted-foreground py-4">
                    {client.cnpj}
                  </TableCell>
                  <TableCell className="py-4">
                    <span className={cn(
                      'inline-block px-3 py-1 rounded-full text-[10px] font-normal uppercase tracking-[0.15em] border',
                      regimeStyles[client.regimeTributario]
                    )}>
                      {regimeLabels[client.regimeTributario]}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm font-light text-muted-foreground py-4">
                    {client.responsavelContabil || '---'}
                  </TableCell>
                  <TableCell className="py-4">
                    {clientProgress ? (
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          'h-2 w-2 rounded-full',
                          clientProgress.conciliacaoContabil ? 'bg-emerald-500' : 'bg-amber-500'
                        )} />
                        <span className={cn(
                          'text-xs font-normal',
                          clientProgress.conciliacaoContabil ? 'text-emerald-600' : 'text-amber-600'
                        )}>
                          {clientProgress.conciliacaoContabil ? 'Concluído' : 'Em andamento'}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Não iniciado</span>
                    )}
                  </TableCell>
                  <TableCell className="py-4 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-lg text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClientClick(client);
                      }}
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" />
                      Registrar
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {filteredClients.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
          <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="font-semibold text-foreground mb-1">Nenhum cliente encontrado</h3>
          <p className="text-sm text-muted-foreground">Ajuste a busca ou adicione clientes.</p>
        </div>
      )}

      {/* Modal */}
      <AccountingProgressModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        client={selectedClient}
        existingProgress={existingProgress}
        colaboradores={colaboradores}
        onSave={handleSave}
      />
    </div>
  );
}
