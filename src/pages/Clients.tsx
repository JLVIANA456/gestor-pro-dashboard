import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  Upload,
  MoreHorizontal,
  Building2,
  Edit,
  Trash2,
  Eye,
  Loader2,
  LayoutGrid,
  List,
  SortAsc,
  SortDesc,
  ArrowUpDown,
  AlertTriangle,
  Mail,
  ArrowRight,
  FileSpreadsheet
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ClientFormDialog } from '@/components/clients/ClientFormDialog';
import { ClientViewDialog } from '@/components/clients/ClientViewDialog';
import { InactivateClientDialog } from '@/components/clients/InactivateClientDialog';
import { CSVImportDialog } from '@/components/clients/CSVImportDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import * as XLSX from 'xlsx';
import { useClients, type Client, type TaxRegime } from '@/hooks/useClients';

const regimeLabels: Record<TaxRegime, string> = {
  simples: 'Simples Nacional',
  presumido: 'Lucro Presumido',
  real: 'Lucro Real',
  domestico: 'Empregador Doméstico',
};

const regimeStyles: Record<TaxRegime, string> = {
  simples: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  presumido: 'bg-blue-50 text-blue-700 border-blue-100',
  real: 'bg-violet-50 text-violet-700 border-violet-100',
  domestico: 'bg-amber-50 text-amber-700 border-amber-100',
};

export default function Clients() {
  const { clients, loading, createClient, updateClient, deleteClient, inactivateClient, reactivateClient, deleteMultipleClients, importClients } = useClients();
  const [viewTab, setViewTab] = useState<'active' | 'inactive'>('active');
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRegime, setFilterRegime] = useState<TaxRegime | 'all'>('all');
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'asc' | 'desc'>('asc');

  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isPermanentDeleteOpen, setIsPermanentDeleteOpen] = useState(false);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Abrir visualização se vier da busca global
  useEffect(() => {
    const viewId = searchParams.get('view');
    if (viewId && clients.length > 0) {
      const client = clients.find(c => c.id === viewId);
      if (client) {
        setSelectedClient(client);
        setIsViewOpen(true);
        setSearchParams({});
      }
    }
  }, [searchParams, clients, setSearchParams]);

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.razaoSocial.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.cnpj.includes(searchQuery) ||
      client.nomeFantasia.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRegime = filterRegime === 'all' || client.regimeTributario === filterRegime;
    const matchesTab = viewTab === 'active' ? client.isActive : !client.isActive;
    return matchesSearch && matchesRegime && matchesTab;
  }).sort((a, b) => {
    const nameA = (a.nomeFantasia || a.razaoSocial).toLowerCase();
    const nameB = (b.nomeFantasia || b.razaoSocial).toLowerCase();

    if (sortBy === 'asc') {
      return nameA.localeCompare(nameB);
    } else {
      return nameB.localeCompare(nameA);
    }
  });

  const toggleSelect = (id: string) => {
    setSelectedClients((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleView = (client: Client) => {
    setSelectedClient(client);
    setIsViewOpen(true);
  };

  const handleEdit = (client: Client) => {
    setSelectedClient(client);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (client: Client) => {
    setSelectedClient(client);
    setIsDeleteOpen(true);
  };

  const handlePermanentDeleteClick = (client: Client) => {
    setSelectedClient(client);
    setIsPermanentDeleteOpen(true);
  };

  const handleInactivateConfirm = async (reason: string, details?: string) => {
    if (selectedClient) {
      await inactivateClient(selectedClient.id, reason, details);
      setSelectedClients(prev => prev.filter(id => id !== selectedClient.id));
      setSelectedClient(null);
    }
  };

  const handlePermanentDeleteConfirm = async () => {
    if (selectedClient) {
      await deleteClient(selectedClient.id, selectedClient.nomeFantasia);
      setSelectedClients(prev => prev.filter(id => id !== selectedClient.id));
      setSelectedClient(null);
      setIsPermanentDeleteOpen(false);
    }
  };

  const handleBulkPermanentDelete = async () => {
    if (selectedClients.length > 0) {
      await deleteMultipleClients(selectedClients);
      setSelectedClients([]);
      setIsBulkDeleteOpen(false);
    }
  };

  const handleBulkDelete = async () => {
    if (confirm(`Deseja inativar os ${selectedClients.length} clientes selecionados?`)) {
      for (const id of selectedClients) {
        await inactivateClient(id, 'baixada', 'Inativação em massa');
      }
      setSelectedClients([]);
    }
  };

  const handleSaveClient = async (clientData: Omit<Client, 'id'> & { id?: string }) => {
    if (clientData.id) {
      await updateClient(clientData.id, clientData);
    } else {
      await createClient(clientData);
    }
    setSelectedClient(null);
  };

  const handleNewClient = () => {
    setSelectedClient(null);
    setIsFormOpen(true);
  };

  const handleExportXLSX = () => {
    const exportData = clients.map((item) => ({
      'Razão Social': item.razaoSocial,
      'Nome Fantasia': item.nomeFantasia,
      'CNPJ / CPF': item.cnpj,
      'Regime Tributário': regimeLabels[item.regimeTributario],
      'Email': item.email,
      'Telefone': item.telefone,
      'Data de Entrada': item.dataEntrada ? new Date(item.dataEntrada).toLocaleDateString('pt-BR') : '',
      'Status': item.isActive ? 'Ativo' : 'Inativo',
      'Inativado em': item.inactivatedAt ? new Date(item.inactivatedAt).toLocaleDateString('pt-BR') : '-',
      'Motivo Inativação': item.inactivationReason || '-',
      'Responsável DP': item.responsavelDp || '-',
      'Responsável Fiscal': item.responsavelFiscal || '-',
      'Responsável Contábil': item.responsavelContabil || '-',
      'Responsável Financeiro': item.responsavelFinanceiro || '-',
      'Responsável Qualidade': item.responsavelQualidade || '-',
      'Responsável Empresa': item.responsavelEmpresa || '-',
      'Sócios': item.quadroSocietario?.map(s => `${s.nome} (${s.cpf})`).join(', ') || '-',
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    const colWidths = Object.keys(exportData[0] || {}).map(key => ({
      wch: Math.max(key.length + 5, 20)
    }));
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, 'Todos os Clientes');
    XLSX.writeFile(wb, `relatorio_clientes_completo_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Only show the full-page loader during the very first load
  // If we already have clients in the context, we show them immediately
  if (loading && clients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="relative">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
          <div className="absolute inset-0 rounded-2xl bg-primary/20 animate-ping opacity-20" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 animate-pulse">Carregando Clientes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-light tracking-tight text-foreground">Clientes</h1>
          <p className="text-xs font-normal text-muted-foreground uppercase tracking-[0.2em] mt-1">Gerencie e visualize sua carteira de clientes</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setIsImportOpen(true)} className="rounded-xl border-border/50 hover:bg-muted/50 font-light text-xs uppercase tracking-wider">
            <Upload className="mr-2 h-4 w-4 opacity-60" />
            Importar
          </Button>
          <Button variant="outline" onClick={handleExportXLSX} className="rounded-xl border-border/50 hover:bg-muted/50 font-light text-xs uppercase tracking-wider">
            <FileSpreadsheet className="mr-2 h-4 w-4 opacity-60" />
            Exportar
          </Button>
          <Button onClick={handleNewClient} className="rounded-xl shadow-sm shadow-primary/10 font-light text-xs uppercase tracking-widest">
            <Plus className="mr-2 h-4 w-4" />
            Novo Cliente
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-muted/20 rounded-2xl border border-border/50 w-fit">
        <button
          onClick={() => setViewTab('active')}
          className={cn(
            'px-6 py-2.5 rounded-xl text-[10px] font-normal uppercase tracking-[0.2em] transition-all',
            viewTab === 'active'
              ? 'bg-card text-primary shadow-sm border border-border/10'
              : 'text-muted-foreground hover:text-foreground hover:bg-card/30'
          )}
        >
          Clientes Ativos
        </button>
        <button
          onClick={() => setViewTab('inactive')}
          className={cn(
            'px-6 py-2.5 rounded-xl text-[10px] font-normal uppercase tracking-[0.2em] transition-all',
            viewTab === 'inactive'
              ? 'bg-card text-primary shadow-sm border border-border/10'
              : 'text-muted-foreground hover:text-foreground hover:bg-card/30'
          )}
        >
          Histórico de Inativos
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/40" />
          <input
            type="text"
            placeholder="Buscar por razão social, CNPJ ou nome fantástico..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-12 w-full rounded-2xl border border-border/50 bg-card pl-12 pr-4 text-sm font-light placeholder:text-muted-foreground/30 focus:border-primary/30 focus:outline-none focus:ring-4 focus:ring-primary/[0.02] shadow-sm transition-all"
          />
        </div>

        <div className="flex items-center gap-4">
          {/* Regime Filter */}
          <div className="flex items-center gap-1 p-1 bg-muted/20 rounded-2xl border border-border/50 overflow-x-auto no-scrollbar">
            {(['all', 'simples', 'presumido', 'real', 'domestico'] as const).map((regime) => (
              <button
                key={regime}
                onClick={() => setFilterRegime(regime)}
                className={cn(
                  'whitespace-nowrap rounded-xl px-4 py-2 text-[10px] font-normal uppercase tracking-[0.15em] transition-all',
                  filterRegime === regime
                    ? 'bg-card text-primary shadow-sm border border-border/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-card/30'
                )}
              >
                {regime === 'all' ? 'Ver Todos' : regimeLabels[regime]}
              </button>
            ))}
          </div>

          {/* Sort Selection */}
          <div className="flex items-center gap-1 p-1 bg-muted/20 rounded-2xl border border-border/50">
            <button
              onClick={() => setSortBy('asc')}
              className={cn(
                'p-2 rounded-xl transition-all',
                sortBy === 'asc'
                  ? 'bg-card text-primary shadow-sm border border-border/10'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              title="Ordem Alfabética (A-Z)"
            >
              <SortAsc className="h-4 w-4" />
            </button>
            <button
              onClick={() => setSortBy('desc')}
              className={cn(
                'p-2 rounded-xl transition-all',
                sortBy === 'desc'
                  ? 'bg-card text-primary shadow-sm border border-border/10'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              title="Ordem Alfabética (Z-A)"
            >
              <SortDesc className="h-4 w-4" />
            </button>
          </div>

          {/* View Selection */}
          <div className="flex items-center gap-1 p-1 bg-muted/20 rounded-2xl border border-border/50">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-2 rounded-xl transition-all',
                viewMode === 'grid'
                  ? 'bg-card text-primary shadow-sm border border-border/10'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              title="Visualização em Grade"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-2 rounded-xl transition-all',
                viewMode === 'list'
                  ? 'bg-card text-primary shadow-sm border border-border/10'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              title="Visualização em Lista"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedClients.length > 0 && (
        <div className="flex items-center gap-4 rounded-2xl bg-primary/5 p-4 border border-primary/10">
          <span className="text-xs font-light text-foreground uppercase tracking-wider">
            {selectedClients.length} selecionado(s)
          </span>
          <Button variant="destructive" size="sm" onClick={handleBulkDelete} className="rounded-xl font-light text-xs uppercase tracking-widest px-4 h-9">
            <AlertTriangle className="mr-2 h-3 w-3" />
            Inativar
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setIsBulkDeleteOpen(true)} className="rounded-xl font-light text-xs uppercase tracking-widest px-4 h-9 text-destructive hover:bg-destructive/10">
            <Trash2 className="mr-2 h-3 w-3" />
            Excluir Total
          </Button>
        </div>
      )}

      {/* Clients Display */}
      {filteredClients.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
          <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="font-semibold text-foreground mb-1">Nenhum cliente encontrado</h3>
          <p className="text-sm text-muted-foreground">Tente ajustar os filtros ou adicione um novo cliente.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 stagger-2">
          {filteredClients.map((client, index) => (
            <div
              key={client.id}
              className={cn(
                "group relative rounded-[3rem] border border-border/40 bg-white/40 backdrop-blur-md overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1 cursor-pointer",
                selectedClients.includes(client.id) && "ring-2 ring-primary border-transparent",
                !client.isActive && "opacity-60 grayscale-[0.5]"
              )}
              style={{ animationDelay: `${index * 50}ms` }}
              onClick={() => handleView(client)}
            >
              {/* Selection Checkbox */}
              <div className="absolute top-10 left-8 z-10" onClick={(e) => e.stopPropagation()}>
                <Checkbox 
                  checked={selectedClients.includes(client.id)} 
                  onCheckedChange={() => toggleSelect(client.id)}
                  className="rounded-lg h-6 w-6 data-[state=checked]:bg-primary"
                />
              </div>

              {/* Actions Menu */}
              <div className="absolute right-8 top-8 opacity-0 group-hover:opacity-100 transition-opacity z-10" onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm border border-border/10 hover:bg-muted transition-colors">
                      <MoreHorizontal className="h-4 w-4 text-muted-foreground/60" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-white border-border p-1 rounded-xl shadow-elevated">
                    <DropdownMenuItem onClick={() => handleView(client)} className="rounded-lg gap-2 cursor-pointer font-light text-[10px] uppercase tracking-wider">
                      <Eye className="h-4 w-4 text-primary/60" /> Visualizar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleEdit(client)} className="rounded-lg gap-2 cursor-pointer font-light text-[10px] uppercase tracking-wider">
                      <Edit className="h-4 w-4 text-blue-500/60" /> Editar
                    </DropdownMenuItem>
                    {client.isActive ? (
                      <DropdownMenuItem
                        className="text-amber-600 focus:text-amber-600 rounded-lg gap-2 cursor-pointer font-light text-[10px] uppercase tracking-wider"
                        onClick={() => handleDeleteClick(client)}
                      >
                        <AlertTriangle className="h-4 w-4 opacity-70" /> Inativar
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem
                        className="text-emerald-600 focus:text-emerald-600 rounded-lg gap-2 cursor-pointer font-light text-[10px] uppercase tracking-wider"
                        onClick={() => reactivateClient(client.id)}
                      >
                        <Plus className="h-4 w-4 opacity-70" /> Ativar
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive rounded-lg gap-2 cursor-pointer font-light text-[10px] uppercase tracking-wider"
                      onClick={() => handlePermanentDeleteClick(client)}
                    >
                      <Trash2 className="h-4 w-4 opacity-70" /> Excluir Total
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Card Content */}
              <div className="p-8 pl-20 space-y-8">
                <div className="flex gap-6">
                  <div className={cn(
                    "h-16 w-16 rounded-3xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 duration-500 ring-1 ring-white/20",
                    client.isActive ? "bg-primary text-white shadow-primary/20" : "bg-muted text-muted-foreground"
                  )}>
                    <Building2 className="h-8 w-8" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xl font-light tracking-tight text-foreground/80 truncate">{client.nomeFantasia || client.razaoSocial}</h3>
                    <Badge variant="outline" className="text-[10px] font-light tracking-widest opacity-40 uppercase py-0.5 border-none p-0 mt-1">ID: {client.cnpj.substring(0, 8)}</Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 border-t border-border/5 pt-8 bg-muted/[0.02]">
                  <div className="space-y-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] uppercase font-light tracking-widest text-muted-foreground/40">CNPJ</label>
                      <p className="text-sm font-light text-foreground/70">{client.cnpj}</p>
                      {!client.isActive && (
                        <Badge className="bg-amber-50 text-amber-600 border-none text-[8px] h-5 mt-1 font-light">INATIVO</Badge>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] uppercase font-light tracking-widest text-muted-foreground/40">Comunicação</label>
                      <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-border/10 shadow-sm">
                         <Mail className="h-4 w-4 text-primary/60" />
                         <p className="text-[11px] font-light text-foreground/60 truncate">{client.email?.split(',')[0] || 'Sem e-mail'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between border-t border-border/5">
                   <div className={cn(
                     "px-4 py-1.5 rounded-full text-[9px] font-light uppercase tracking-widest border border-transparent shadow-sm",
                     regimeStyles[client.regimeTributario]
                   )}>
                     {regimeLabels[client.regimeTributario]}
                   </div>
                   <div className="group-hover:translate-x-1 transition-transform">
                      <ArrowRight className="h-5 w-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                   </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-border/50 bg-card overflow-hidden shadow-card">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-border/50">
                <TableHead className="w-12 px-6"></TableHead>
                <TableHead className="text-[10px] font-normal uppercase tracking-[0.2em] py-5">Cliente</TableHead>
                <TableHead className="text-[10px] font-normal uppercase tracking-[0.2em] py-5">CNPJ/CPF</TableHead>
                <TableHead className="text-[10px] font-normal uppercase tracking-[0.2em] py-5">Regime</TableHead>
                <TableHead className="text-[10px] font-normal uppercase tracking-[0.2em] py-5">E-mail</TableHead>
                <TableHead className="text-right px-6"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => (
                <TableRow
                  key={client.id}
                  className={cn(
                    "group cursor-pointer border-border/30 hover:bg-muted/20 transition-colors",
                    selectedClients.includes(client.id) && "bg-primary/[0.02]"
                  )}
                  onClick={() => handleView(client)}
                >
                  <TableCell className="px-6" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedClients.includes(client.id)}
                      onChange={() => toggleSelect(client.id)}
                      className="h-4 w-4 rounded-md border-border text-primary focus:ring-primary/10 cursor-pointer opacity-40 hover:opacity-100 transition-opacity"
                    />
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/30 border border-border/10 group-hover:bg-primary/5 transition-colors">
                        <Building2 className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary/60" />
                      </div>
                      <span className="text-sm font-light text-foreground group-hover:text-primary transition-colors">
                        {client.nomeFantasia || client.razaoSocial}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-light text-muted-foreground">{client.cnpj}</span>
                  </TableCell>
                  <TableCell>
                    <div
                      className={cn(
                        'inline-flex px-2 py-0.5 rounded-full text-[9px] font-normal uppercase tracking-[0.15em] border',
                        regimeStyles[client.regimeTributario]
                      )}
                    >
                      {regimeLabels[client.regimeTributario]}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 max-w-[200px]" title={client.email}>
                      <span className="text-sm font-light text-muted-foreground opacity-70 truncate flex-1">
                        {client.email?.split(',')[0]}
                      </span>
                      {client.email?.includes(',') && (
                        <span className="text-[9px] font-bold text-primary bg-primary/5 px-1.5 py-0.5 rounded-md shrink-0">
                          +{client.email.split(',').length - 1}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right px-6" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="h-8 w-8 inline-flex items-center justify-center rounded-lg hover:bg-muted transition-colors text-muted-foreground/40 hover:text-muted-foreground">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-card border-border p-1 rounded-xl shadow-elevated">
                        <DropdownMenuItem onClick={() => handleView(client)} className="rounded-lg gap-2 cursor-pointer font-light text-xs uppercase tracking-wider">
                          <Eye className="h-4 w-4 text-primary/60" />
                          Visualizar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(client)} className="rounded-lg gap-2 cursor-pointer font-light text-xs uppercase tracking-wider">
                          <Edit className="h-4 w-4 text-blue-500/60" />
                          Editar
                        </DropdownMenuItem>
                        {client.isActive ? (
                          <DropdownMenuItem
                            className="text-amber-600 focus:text-amber-600 rounded-lg gap-2 cursor-pointer font-light text-xs uppercase tracking-wider"
                            onClick={() => handleDeleteClick(client)}
                          >
                            <AlertTriangle className="h-4 w-4 opacity-70" />
                            Inativar
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            className="text-emerald-600 focus:text-emerald-600 rounded-lg gap-2 cursor-pointer font-light text-xs uppercase tracking-wider"
                            onClick={() => reactivateClient(client.id)}
                          >
                            <Plus className="h-4 w-4 opacity-70" />
                            Ativar
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive rounded-lg gap-2 cursor-pointer font-light text-xs uppercase tracking-wider"
                          onClick={() => handlePermanentDeleteClick(client)}
                        >
                          <Trash2 className="h-4 w-4 opacity-70" />
                          Excluir Total
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Dialogs */}
      <ClientFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        client={selectedClient}
        onSave={handleSaveClient}
      />
      <ClientViewDialog
        open={isViewOpen}
        onOpenChange={setIsViewOpen}
        client={selectedClient}
        onDelete={handlePermanentDeleteClick}
        onReactivate={reactivateClient}
      />
      <InactivateClientDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        client={selectedClient}
        onConfirm={handleInactivateConfirm}
      />
      
      <AlertDialog open={isPermanentDeleteOpen} onOpenChange={setIsPermanentDeleteOpen}>
        <AlertDialogContent className="rounded-2xl border-border bg-card shadow-elevated">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-light">Excluir Permanentemente?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-light">
              Esta ação não pode ser desfeita. Isso excluirá permanentemente a empresa <strong>{selectedClient?.nomeFantasia}</strong> e todos os seus dados associados de nossos servidores.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl font-light">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handlePermanentDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl font-light">
              Sim, Excluir Totalmente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
        <AlertDialogContent className="rounded-2xl border-border bg-card shadow-elevated">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-light">Excluir {selectedClients.length} Empresas?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-light">
              Você está prestes a excluir permanentemente {selectedClients.length} empresas. Esta ação é irreversível.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl font-light">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkPermanentDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl font-light">
              Excluir Tudo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CSVImportDialog open={isImportOpen} onOpenChange={setIsImportOpen} onImport={importClients} />
    </div>
  );
}
