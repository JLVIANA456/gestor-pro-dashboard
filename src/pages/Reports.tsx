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
  simples: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  presumido: 'bg-blue-50 text-blue-700 border-blue-100',
  real: 'bg-violet-50 text-violet-700 border-violet-100',
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
      'CNPJ / CPF': item.cnpj,
      'Regime Tributário': regimeLabels[item.regimeTributario],
      'Data de Entrada': item.dataEntrada ? new Date(item.dataEntrada).toLocaleDateString('pt-BR') : '',
      'CCM': item.ccm || '',
      'Senha Prefeitura': item.ccmSenha || '',
      'Inscr. Estadual (IE)': item.ie || '',
      'Senha SEFAZ / Posto': item.sefazSenha || '',
      'Código de Acesso / Senha (Simples)': item.simplesNacionalSenha || '',
      'Código de Acesso (ECAC)': item.ecacCodigoAcesso || '',
      'Senha e-CAC': item.ecacSenha || '',
      'Certificado Digital (Tipo)': item.certificadoDigitalTipo || '',
      'Data de Vencimento': item.certificadoDigitalVencimento ? new Date(item.certificadoDigitalVencimento).toLocaleDateString('pt-BR') : '',
      'Senha do Certificado': item.certificadoDigitalSenha || '',
      'E-mail Principal': item.email,
      'Telefone / WhatsApp': item.telefone,
      'Status Operacional': item.isActive ? 'Ativo' : 'Inativo',
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Ajustar largura das colunas
    const colWidths = Object.keys(exportData[0] || {}).map(key => ({
      wch: Math.max(key.length + 5, 25)
    }));
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, 'Clientes');
    XLSX.writeFile(wb, `relatorio_clientes_completo_${new Date().toISOString().split('T')[0]}.xlsx`);
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
          <h1 className="text-3xl font-light tracking-tight text-foreground">Relatórios</h1>
          <p className="text-xs font-normal text-muted-foreground uppercase tracking-[0.2em] mt-1">Análise detalhada e consolidada</p>
        </div>
        <div className="flex gap-3 no-print">
          <Button variant="outline" onClick={handleExportXLSX} className="rounded-xl border-border/50 hover:bg-muted/50 font-light text-xs uppercase tracking-wider">
            <Download className="mr-2 h-4 w-4 opacity-60" />
            Excel
          </Button>
          <Button variant="outline" onClick={handlePrint} className="rounded-xl border-border/50 hover:bg-muted/50 font-light text-xs uppercase tracking-wider">
            <Printer className="mr-2 h-4 w-4 opacity-60" />
            Imprimir
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 animate-slide-in-up stagger-1">
        <div className="rounded-2xl bg-card p-6 border border-border/50 shadow-card">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/5 border border-primary/10">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em]">Total de Clientes</p>
              <p className="text-4xl font-light text-foreground tracking-tighter">{totalClients}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl bg-card p-6 border border-border/50 shadow-card no-print">
          <div className="flex items-center gap-4 h-full">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/30 border border-border/10">
              <Filter className="h-6 w-6 text-muted-foreground/60" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em] mb-2">Filtrar por Regime</p>
              <Select value={filterRegime} onValueChange={(value: TaxRegime | 'all') => setFilterRegime(value)}>
                <SelectTrigger className="w-full rounded-xl border-border/50 h-10 font-light">
                  <SelectValue placeholder="Filtrar por regime" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border p-1 rounded-xl shadow-elevated">
                  <SelectItem value="all" className="rounded-lg font-light">Todos os Regimes</SelectItem>
                  <SelectItem value="simples" className="rounded-lg font-light">Simples Nacional</SelectItem>
                  <SelectItem value="presumido" className="rounded-lg font-light">Lucro Presumido</SelectItem>
                  <SelectItem value="real" className="rounded-lg font-light">Lucro Real</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="rounded-2xl border border-border/50 bg-card shadow-card overflow-hidden animate-slide-in-up stagger-2">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent bg-muted/10">
              <TableHead className="font-normal text-[10px] uppercase tracking-[0.2em] text-muted-foreground h-12">Razão Social</TableHead>
              <TableHead className="font-normal text-[10px] uppercase tracking-[0.2em] text-muted-foreground h-12">Nome Fantasia</TableHead>
              <TableHead className="font-normal text-[10px] uppercase tracking-[0.2em] text-muted-foreground h-12">CNPJ</TableHead>
              <TableHead className="font-normal text-[10px] uppercase tracking-[0.2em] text-muted-foreground h-12">Email</TableHead>
              <TableHead className="font-normal text-[10px] uppercase tracking-[0.2em] text-muted-foreground h-12">Regime</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((item, index) => (
              <TableRow
                key={item.id}
                className="border-border hover:bg-primary/[0.01] transition-colors"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <TableCell className="font-normal text-foreground py-4">{item.razaoSocial}</TableCell>
                <TableCell className="text-sm font-light text-muted-foreground py-4">{item.nomeFantasia}</TableCell>
                <TableCell className="text-sm font-mono font-light text-muted-foreground py-4">{item.cnpj}</TableCell>
                <TableCell className="text-sm font-light text-muted-foreground py-4">{item.email}</TableCell>
                <TableCell className="py-4">
                  <span className={cn(
                    'inline-block px-3 py-1 rounded-full text-[10px] font-normal uppercase tracking-[0.15em] border',
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
