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
  ArrowUpDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ClientFormDialog } from '@/components/clients/ClientFormDialog';
import { ClientViewDialog } from '@/components/clients/ClientViewDialog';
import { DeleteConfirmDialog } from '@/components/clients/DeleteConfirmDialog';
import { CSVImportDialog } from '@/components/clients/CSVImportDialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useClients, type Client, type TaxRegime } from '@/hooks/useClients';

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

export default function Clients() {
  const { clients, loading, createClient, updateClient, deleteClient, deleteMultipleClients, importClients } = useClients();
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
    return matchesSearch && matchesRegime;
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

  const handleDeleteConfirm = async () => {
    if (selectedClient) {
      await deleteClient(selectedClient.id, selectedClient.nomeFantasia);
      setSelectedClients(prev => prev.filter(id => id !== selectedClient.id));
      setSelectedClient(null);
    }
  };

  const handleBulkDelete = async () => {
    await deleteMultipleClients(selectedClients);
    setSelectedClients([]);
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
          <h1 className="text-3xl font-light tracking-tight text-foreground">Clientes</h1>
          <p className="text-xs font-normal text-muted-foreground uppercase tracking-[0.2em] mt-1">Gerencie e visualize sua carteira de clientes</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setIsImportOpen(true)} className="rounded-xl border-border/50 hover:bg-muted/50 font-light text-xs uppercase tracking-wider">
            <Upload className="mr-2 h-4 w-4 opacity-60" />
            Importar
          </Button>
          <Button onClick={handleNewClient} className="rounded-xl shadow-sm shadow-primary/10 font-light text-xs uppercase tracking-widest">
            <Plus className="mr-2 h-4 w-4" />
            Novo Cliente
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center animate-slide-in-up stagger-1">
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
            {(['all', 'simples', 'presumido', 'real'] as const).map((regime) => (
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
        <div className="flex items-center gap-4 rounded-2xl bg-primary/5 p-4 border border-primary/10 animate-slide-in-up">
          <span className="text-xs font-light text-foreground uppercase tracking-wider">
            {selectedClients.length} selecionado(s)
          </span>
          <Button variant="destructive" size="sm" onClick={handleBulkDelete} className="rounded-xl font-light text-xs uppercase tracking-widest px-4 h-9">
            <Trash2 className="mr-2 h-3 w-3" />
            Excluir
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
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 animate-slide-in-up stagger-2">
          {filteredClients.map((client, index) => (
            <div
              key={client.id}
              className={cn(
                'group relative rounded-2xl border border-border/50 bg-card p-6 shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1',
                selectedClients.includes(client.id) && 'border-primary/50 ring-4 ring-primary/[0.03]',
                !client.isActive && 'opacity-75 bg-muted/30 border-dashed'
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Selection Checkbox */}
              <div className="absolute left-5 top-5 z-10">
                <input
                  type="checkbox"
                  checked={selectedClients.includes(client.id)}
                  onChange={() => toggleSelect(client.id)}
                  className="h-4 w-4 rounded-md border-border text-primary focus:ring-primary/10 cursor-pointer opacity-40 hover:opacity-100 transition-opacity"
                />
              </div>

              {/* Actions Menu */}
              <div className="absolute right-5 top-5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted/20 hover:bg-muted transition-colors border border-border/30">
                      <MoreHorizontal className="h-4 w-4 text-muted-foreground/60" />
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
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive rounded-lg gap-2 cursor-pointer font-light text-xs uppercase tracking-wider"
                      onClick={() => handleDeleteClick(client)}
                    >
                      <Trash2 className="h-4 w-4 opacity-70" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Content */}
              <div className="flex flex-col h-full cursor-pointer" onClick={() => handleView(client)}>
                <div className="flex items-center gap-4 mb-6 pt-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/30 border border-border/10 shadow-sm group-hover:bg-primary/5 group-hover:border-primary/10 transition-colors">
                    <Building2 className="h-6 w-6 text-muted-foreground/40 group-hover:text-primary/60 transition-colors" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-light text-lg text-foreground truncate group-hover:text-primary transition-colors leading-tight">
                      {client.nomeFantasia || client.razaoSocial}
                    </h3>
                    <p className="text-[9px] font-normal text-muted-foreground uppercase tracking-[0.15em] mt-1.5">
                      ID: {client.cnpj.substring(0, 8)}
                    </p>
                  </div>
                </div>

                <div className="space-y-4 mb-8 flex-1">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em]">Cnpj / Cpf</span>
                    <p className="text-sm font-light text-foreground">{client.cnpj}</p>
                    {!client.isActive && (
                      <span className="inline-flex mt-1 text-[9px] text-destructive uppercase tracking-widest font-bold border border-destructive/20 bg-destructive/5 px-2 py-0.5 rounded-lg w-fit">Inativo</span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em]">E-mail corporativo</span>
                    <p className="text-sm font-light text-foreground truncate opacity-80">{client.email}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-border/20 flex items-center justify-between">
                  <div
                    className={cn(
                      'px-3 py-1 rounded-full text-[9px] font-normal uppercase tracking-[0.15em] border transition-colors',
                      regimeStyles[client.regimeTributario]
                    )}
                  >
                    {regimeLabels[client.regimeTributario]}
                  </div>
                  <div className="text-primary text-[10px] font-light uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1">
                    Detalhes <Eye className="h-3 w-3" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-border/50 bg-card overflow-hidden animate-slide-in-up shadow-card">
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
                    <span className="text-sm font-light text-muted-foreground opacity-70">{client.email}</span>
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
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive rounded-lg gap-2 cursor-pointer font-light text-xs uppercase tracking-wider"
                          onClick={() => handleDeleteClick(client)}
                        >
                          <Trash2 className="h-4 w-4 opacity-70" />
                          Excluir
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
      />
      <DeleteConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        client={selectedClient}
        onConfirm={handleDeleteConfirm}
      />
      <CSVImportDialog open={isImportOpen} onOpenChange={setIsImportOpen} onImport={importClients} />
    </div>
  );
}
