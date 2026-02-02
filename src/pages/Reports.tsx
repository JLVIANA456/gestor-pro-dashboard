import { useState, useEffect } from 'react';
import { 
  Download, 
  Printer, 
  Filter, 
  Building2,
  FileSpreadsheet,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { useClients, type TaxRegime } from '@/hooks/useClients';
import * as XLSX from 'xlsx';

const regimeLabels: Record<TaxRegime, string> = {
  simples: 'Simples Nacional',
  presumido: 'Lucro Presumido',
  real: 'Lucro Real',
};

const regimeStyles: Record<TaxRegime, string> = {
  simples: 'bg-emerald-100 text-emerald-700',
  presumido: 'bg-blue-100 text-blue-700',
  real: 'bg-amber-100 text-amber-700',
};

export default function Reports() {
  const { clients, loading } = useClients();
  const [filterRegime, setFilterRegime] = useState<TaxRegime | 'all'>('all');

  const filteredData = clients.filter(
    (item) => filterRegime === 'all' || item.regimeTributario === filterRegime
  );

  const handleExportXLSX = () => {
    const exportData = filteredData.map((item) => ({
      'Razão Social': item.razaoSocial,
      'Nome Fantasia': item.nomeFantasia,
      'CNPJ': item.cnpj,
      'Email': item.email,
      'Telefone': item.telefone,
      'Regime Tributário': regimeLabels[item.regimeTributario],
      'CCM': item.ccm || '',
      'Inscrição Estadual': item.ie || '',
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);
    
    // Ajustar largura das colunas
    const colWidths = Object.keys(exportData[0] || {}).map(key => ({
      wch: Math.max(key.length + 5, 20)
    }));
    ws['!cols'] = colWidths;
    
    XLSX.utils.book_append_sheet(wb, ws, 'Clientes');
    XLSX.writeFile(wb, `relatorio_clientes_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handlePrint = () => {
    window.print();
  };

  const totalClients = filteredData.length;

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
          <h1 className="text-2xl font-light text-foreground">Relatórios</h1>
          <p className="text-muted-foreground">Visualização consolidada de clientes</p>
        </div>
        <div className="flex gap-3 no-print">
          <Button variant="outline" onClick={handleExportXLSX}>
            <Download className="mr-2 h-4 w-4" />
            Exportar Excel
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 animate-slide-in-up stagger-1">
        <div className="rounded-lg bg-card p-6 shadow-card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total de Clientes</p>
              <p className="text-2xl font-light text-foreground">{totalClients}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-card p-6 shadow-card no-print">
          <div className="flex items-center gap-3">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <Select value={filterRegime} onValueChange={(value: TaxRegime | 'all') => setFilterRegime(value)}>
              <SelectTrigger className="flex-1 rounded-xl">
                <SelectValue placeholder="Filtrar por regime" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="all">Todos os Regimes</SelectItem>
                <SelectItem value="simples">Simples Nacional</SelectItem>
                <SelectItem value="presumido">Lucro Presumido</SelectItem>
                <SelectItem value="real">Lucro Real</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="rounded-lg bg-card shadow-card overflow-hidden animate-slide-in-up stagger-2">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="font-semibold text-foreground">Razão Social</TableHead>
              <TableHead className="font-semibold text-foreground">Nome Fantasia</TableHead>
              <TableHead className="font-semibold text-foreground">CNPJ</TableHead>
              <TableHead className="font-semibold text-foreground">Email</TableHead>
              <TableHead className="font-semibold text-foreground">Regime Tributário</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((item, index) => (
              <TableRow 
                key={item.id} 
                className="border-border hover:bg-muted/50"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <TableCell className="font-medium text-foreground">{item.razaoSocial}</TableCell>
                <TableCell className="text-muted-foreground">{item.nomeFantasia}</TableCell>
                <TableCell className="text-muted-foreground">{item.cnpj}</TableCell>
                <TableCell className="text-muted-foreground">{item.email}</TableCell>
                <TableCell>
                  <span className={cn(
                    'inline-flex rounded-lg px-3 py-1 text-xs font-medium',
                    regimeStyles[item.regimeTributario]
                  )}>
                    {regimeLabels[item.regimeTributario]}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredData.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
          <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="font-semibold text-foreground mb-1">Nenhum cliente encontrado</h3>
          <p className="text-sm text-muted-foreground">Adicione clientes para visualizar o relatório.</p>
        </div>
      )}

      {/* Print Header (hidden on screen) */}
      <div className="hidden print-only">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">GestorPro - Relatório de Clientes</h1>
          <p className="text-sm text-gray-600">Gerado em: {new Date().toLocaleString('pt-BR')}</p>
        </div>
      </div>
    </div>
  );
}
