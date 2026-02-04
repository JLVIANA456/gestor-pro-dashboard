import { useState, useEffect } from 'react';
import { Calculator, Search, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { useAccountingProgress } from '@/hooks/useAccountingProgress';
import { AccountingProgressDialog } from '@/components/accounting/AccountingProgressDialog';

export default function ContabilDepartment() {
  const { clientsWithProgress, loading, saveProgress } = useAccountingProgress();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<typeof clientsWithProgress[0] | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const filteredClients = clientsWithProgress.filter(
    (client) =>
      client.razaoSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.nomeFantasia.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.cnpj.includes(searchTerm)
  );

  const handleClientClick = (client: typeof clientsWithProgress[0]) => {
    setSelectedClient(client);
    setDialogOpen(true);
  };

  const StatusBadge = ({ value }: { value: boolean }) => (
    value ? (
      <div className="flex items-center gap-1 text-primary">
        <CheckCircle2 className="h-4 w-4" />
        <span className="text-xs">Sim</span>
      </div>
    ) : (
      <div className="flex items-center gap-1 text-muted-foreground/50">
        <XCircle className="h-4 w-4" />
        <span className="text-xs">Não</span>
      </div>
    )
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-in-up">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/5 border border-primary/10">
            <Calculator className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-light tracking-tight text-foreground">Departamento Contábil</h1>
            <p className="text-xs font-normal text-muted-foreground uppercase tracking-[0.2em] mt-1">Acompanhamento de progresso por cliente</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por razão social, nome fantasia ou CNPJ..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 rounded-xl"
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border/50 bg-card shadow-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent bg-muted/10">
              <TableHead className="font-normal text-[10px] uppercase tracking-[0.2em] text-muted-foreground h-12">Razão Social</TableHead>
              <TableHead className="font-normal text-[10px] uppercase tracking-[0.2em] text-muted-foreground h-12">CNPJ</TableHead>
              <TableHead className="font-normal text-[10px] uppercase tracking-[0.2em] text-muted-foreground h-12">Colaborador</TableHead>
              <TableHead className="font-normal text-[10px] uppercase tracking-[0.2em] text-muted-foreground h-12">Mês/Ano</TableHead>
              <TableHead className="font-normal text-[10px] uppercase tracking-[0.2em] text-muted-foreground h-12 text-center">Conciliação</TableHead>
              <TableHead className="font-normal text-[10px] uppercase tracking-[0.2em] text-muted-foreground h-12 text-center">Lucros</TableHead>
              <TableHead className="font-normal text-[10px] uppercase tracking-[0.2em] text-muted-foreground h-12 text-center">Aplicação</TableHead>
              <TableHead className="font-normal text-[10px] uppercase tracking-[0.2em] text-muted-foreground h-12 text-center">Anual</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.map((client) => (
              <TableRow
                key={client.id}
                onClick={() => handleClientClick(client)}
                className={cn(
                  'border-border cursor-pointer transition-colors',
                  client.progress ? 'hover:bg-primary/[0.02]' : 'hover:bg-accent/50',
                  client.progress?.empresaEncerrada && 'bg-destructive/5'
                )}
              >
                <TableCell className="font-normal text-foreground py-4">
                  <div>
                    <p className="font-medium">{client.razaoSocial}</p>
                    <p className="text-xs text-muted-foreground">{client.nomeFantasia}</p>
                  </div>
                </TableCell>
                <TableCell className="text-sm font-mono font-light text-muted-foreground py-4">{client.cnpj}</TableCell>
                <TableCell className="text-sm font-light text-muted-foreground py-4">
                  {client.progress?.colaboradorResponsavel || (
                    <span className="text-destructive text-xs">Não atribuído</span>
                  )}
                </TableCell>
                <TableCell className="text-sm font-light text-muted-foreground py-4">
                  {client.progress?.mesAno ? (
                    new Date(client.progress.mesAno + '-01').toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
                  ) : '-'}
                </TableCell>
                <TableCell className="text-center py-4">
                  <StatusBadge value={client.progress?.conciliacaoContabil || false} />
                </TableCell>
                <TableCell className="text-center py-4">
                  <StatusBadge value={client.progress?.controleLucros || false} />
                </TableCell>
                <TableCell className="text-center py-4">
                  <StatusBadge value={client.progress?.controleAplicacaoFinanceira || false} />
                </TableCell>
                <TableCell className="text-center py-4">
                  <StatusBadge value={client.progress?.controleAnual || false} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredClients.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
          <Calculator className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="font-semibold text-foreground mb-1">Nenhum cliente encontrado</h3>
          <p className="text-sm text-muted-foreground">Cadastre clientes para acompanhar o progresso contábil.</p>
        </div>
      )}

      {/* Progress Dialog */}
      <AccountingProgressDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        client={selectedClient}
        onSave={saveProgress}
      />
    </div>
  );
}
