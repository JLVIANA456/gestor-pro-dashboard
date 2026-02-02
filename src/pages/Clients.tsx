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
  Loader2
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
import { useClients, type Client, type TaxRegime } from '@/hooks/useClients';

const regimeLabels: Record<TaxRegime, string> = {
  simples: 'Simples Nacional',
  presumido: 'Lucro Presumido',
  real: 'Lucro Real',
};

const regimeStyles: Record<TaxRegime, string> = {
  simples: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  presumido: 'bg-blue-100 text-blue-700 border-blue-200',
  real: 'bg-amber-100 text-amber-700 border-amber-200',
};

export default function Clients() {
  const { clients, loading, createClient, updateClient, deleteClient, deleteMultipleClients, importClients } = useClients();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRegime, setFilterRegime] = useState<TaxRegime | 'all'>('all');
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  
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
  });

  const toggleSelect = (id: string) => {
    setSelectedClients((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // View client
  const handleView = (client: Client) => {
    setSelectedClient(client);
    setIsViewOpen(true);
  };

  // Edit client
  const handleEdit = (client: Client) => {
    setSelectedClient(client);
    setIsFormOpen(true);
  };

  // Delete client
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

  // Bulk delete
  const handleBulkDelete = async () => {
    await deleteMultipleClients(selectedClients);
    setSelectedClients([]);
  };

  // Save client (create or update)
  const handleSaveClient = async (clientData: Omit<Client, 'id'> & { id?: string }) => {
    if (clientData.id) {
      await updateClient(clientData.id, clientData);
    } else {
      await createClient(clientData);
    }
    setSelectedClient(null);
  };

  // Open form for new client
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
          <h1 className="text-2xl font-light text-foreground">Clientes</h1>
          <p className="text-muted-foreground">Gerencie sua carteira de clientes</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setIsImportOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Importar CSV
          </Button>
          <Button onClick={handleNewClient}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Cliente
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center animate-slide-in-up stagger-1">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por razão social, CNPJ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-11 w-full rounded-xl border border-border bg-card pl-11 pr-4 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Regime Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <div className="flex gap-2">
            {(['all', 'simples', 'presumido', 'real'] as const).map((regime) => (
              <button
                key={regime}
                onClick={() => setFilterRegime(regime)}
                className={cn(
                  'rounded-lg px-4 py-2 text-sm font-medium transition-all',
                  filterRegime === regime
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                {regime === 'all' ? 'Todos' : regimeLabels[regime]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedClients.length > 0 && (
        <div className="flex items-center gap-4 rounded-xl bg-primary/10 p-4 animate-slide-in-up">
          <span className="text-sm font-medium text-foreground">
            {selectedClients.length} cliente(s) selecionado(s)
          </span>
          <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir Selecionados
          </Button>
        </div>
      )}

      {/* Clients Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-slide-in-up stagger-2">
        {filteredClients.map((client, index) => (
          <div
            key={client.id}
            className={cn(
              'group relative rounded-lg border bg-card p-6 shadow-card transition-all hover:shadow-card-hover',
              selectedClients.includes(client.id) && 'border-primary ring-2 ring-primary/20'
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Selection Checkbox */}
            <div className="absolute left-4 top-4">
              <input
                type="checkbox"
                checked={selectedClients.includes(client.id)}
                onChange={() => toggleSelect(client.id)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
            </div>

            {/* Actions Menu */}
            <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted transition-colors">
                    <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-card border-border">
                  <DropdownMenuItem onClick={() => handleView(client)}>
                    <Eye className="mr-2 h-4 w-4" />
                    Visualizar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleEdit(client)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="text-destructive focus:text-destructive"
                    onClick={() => handleDeleteClick(client)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Content */}
            <div className="pt-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                  <Building2 className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-foreground truncate">{client.nomeFantasia}</h3>
                  <p className="text-xs text-muted-foreground truncate">{client.razaoSocial}</p>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">CNPJ:</span> {client.cnpj}
                </p>
                <p className="text-sm text-muted-foreground truncate">
                  <span className="font-medium text-foreground">Email:</span> {client.email}
                </p>
              </div>

              <div
                className={cn(
                  'inline-flex items-center rounded-lg border px-3 py-1 text-xs font-medium',
                  regimeStyles[client.regimeTributario]
                )}
              >
                {regimeLabels[client.regimeTributario]}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredClients.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
          <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="font-semibold text-foreground mb-1">Nenhum cliente encontrado</h3>
          <p className="text-sm text-muted-foreground">Tente ajustar os filtros ou adicione um novo cliente.</p>
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
