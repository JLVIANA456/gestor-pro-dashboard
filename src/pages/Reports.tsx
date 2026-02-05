import { useState, useEffect } from 'react';
import {
  Download,
  Printer,
  Filter,
  Building2,
  FileSpreadsheet,
  Loader2,
  BarChart3
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { cn } from '@/lib/utils';
import { useClients, type TaxRegime } from '@/hooks/useClients';
import { useAccounting } from '@/hooks/useAccounting';
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
  const { clients, loading: loadingClients } = useClients();
  const { fetchAllClosings, loading: loadingAccounting } = useAccounting();
  const [filterRegime, setFilterRegime] = useState<TaxRegime | 'all'>('all');
  const [accountingData, setAccountingData] = useState<any[]>([]);

  useEffect(() => {
    fetchAllClosings().then(data => setAccountingData(data));
  }, []);

  const filteredData = clients.filter(
    (item) => filterRegime === 'all' || item.regimeTributario === filterRegime
  );

  const handleExportXLSX = () => {
    const exportData = filteredData.map((item) => ({
      'Razão Social': item.razaoSocial,
      'CNPJ / CPF': item.cnpj,
      'Regime Tributário': regimeLabels[item.regimeTributario],
      'Data de Entrada': item.dataEntrada ? new Date(item.dataEntrada).toLocaleDateString('pt-BR') : '',
      'Status Operacional': item.isActive ? 'Ativo' : 'Inativo',
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    const colWidths = Object.keys(exportData[0] || {}).map(key => ({
      wch: Math.max(key.length + 5, 25)
    }));
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, 'Clientes');
    XLSX.writeFile(wb, `relatorio_clientes_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExportAccountingXLSX = () => {
    const exportData = accountingData.map((item) => ({
      'Razão Social': item.clientRazaoSocial,
      'CNPJ': item.clientCnpj,
      'Colaborador Responsável': item.colaboradorResponsavel,
      'Mês/Ano Fechamento': item.mesAnoFechamento,
      'Conciliação Contábil': item.conciliacaoContabil ? 'SIM' : 'NÃO',
      'Controle de Lucros': item.controleLucros ? 'SIM' : 'NÃO',
      'Controle Aplicação': item.controleAplicacaoFinanceira ? 'SIM' : 'NÃO',
      'Controle Anual': item.controleAnual ? 'SIM' : 'NÃO',
      'Empresa Encerrada': item.empresaEncerrada ? 'SIM' : 'NÃO',
      'Pendências': item.pendencias,
      'Data Atualização': new Date(item.updatedAt).toLocaleString('pt-BR'),
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    const colWidths = Object.keys(exportData[0] || {}).map(key => ({
      wch: Math.max(key.length + 5, 25)
    }));
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, 'Progresso Contábil');
    XLSX.writeFile(wb, `progresso_contabil_${new Date().toISOString().split('T')[0]}.xlsx`);
  }

  const handlePrint = () => {
    window.print();
  };

  const totalClients = filteredData.length;

  if (loadingClients) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-light tracking-tight text-foreground">Relatórios</h1>
          <p className="text-xs font-normal text-muted-foreground uppercase tracking-[0.2em] mt-1">Análise detalhada e consolidada</p>
        </div>
      </div>

      <Tabs defaultValue="geral" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="geral">Geral</TabsTrigger>
          <TabsTrigger value="contabil">Progresso Contábil</TabsTrigger>
        </TabsList>

        <TabsContent value="geral" className="space-y-6 mt-6">
          {/* General Report Content */}
          <div className="flex justify-end gap-3 no-print">
            <Button variant="outline" onClick={handleExportXLSX} className="rounded-xl border-border/50 hover:bg-muted/50 font-light text-xs uppercase tracking-wider">
              <Download className="mr-2 h-4 w-4 opacity-60" /> Excel
            </Button>
            <Button variant="outline" onClick={handlePrint} className="rounded-xl border-border/50 hover:bg-muted/50 font-light text-xs uppercase tracking-wider">
              <Printer className="mr-2 h-4 w-4 opacity-60" /> Imprimir
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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

          <div className="rounded-2xl border border-border/50 bg-card shadow-card overflow-hidden">
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
                  <TableRow key={item.id} className="border-border hover:bg-primary/[0.01]">
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
        </TabsContent>

        <TabsContent value="contabil" className="space-y-6 mt-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/5 border border-primary/10">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em]">Total de Registros</p>
                <p className="text-4xl font-light text-foreground tracking-tighter">{accountingData.length}</p>
              </div>
            </div>
            <div className="flex gap-3 no-print">
              <Button variant="outline" onClick={handleExportAccountingXLSX} className="rounded-xl border-border/50 hover:bg-muted/50 font-light text-xs uppercase tracking-wider">
                <Download className="mr-2 h-4 w-4 opacity-60" /> Exportar Excel (.xlsx)
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-border/50 bg-card shadow-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent bg-muted/10">
                  <TableHead className="h-12">Razão Social</TableHead>
                  <TableHead className="h-12">Mês/Ano</TableHead>
                  <TableHead className="h-12">Responsável</TableHead>
                  <TableHead className="h-12 text-center">Conciliação</TableHead>
                  <TableHead className="h-12 text-center">Lucros</TableHead>
                  <TableHead className="h-12 text-center">Encerrada?</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingAccounting ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">Carregando...</TableCell>
                  </TableRow>
                ) : accountingData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">Nenhum registro encontrado.</TableCell>
                  </TableRow>
                ) : (
                  accountingData.map((item) => (
                    <TableRow key={item.id} className="border-border hover:bg-primary/[0.01]">
                      <TableCell className="py-4 font-medium">{item.clientRazaoSocial}</TableCell>
                      <TableCell className="py-4">{item.mesAnoFechamento}</TableCell>
                      <TableCell className="py-4 text-muted-foreground">{item.colaboradorResponsavel}</TableCell>
                      <TableCell className="py-4 text-center">{item.conciliacaoContabil ? '✅' : '❌'}</TableCell>
                      <TableCell className="py-4 text-center">{item.controleLucros ? '✅' : '❌'}</TableCell>
                      <TableCell className="py-4 text-center">
                        {item.empresaEncerrada ? <span className="text-destructive font-bold">SIM</span> : 'NÃO'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
