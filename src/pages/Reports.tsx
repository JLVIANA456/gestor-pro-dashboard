import { useState } from 'react';
import {
  Download,
  Printer,
  Filter,
  Building2,
  Loader2,
  Calculator,
  CalendarIcon
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useClients, type TaxRegime } from '@/hooks/useClients';
import { useAccountingProgress } from '@/hooks/useAccountingProgress';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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

// Gerar últimos 24 meses
const generateMonthOptions = () => {
  const options: { value: string; label: string }[] = [];
  const now = new Date();
  
  for (let i = 0; i < 24; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = format(date, 'yyyy-MM');
    const label = format(date, 'MMMM yyyy', { locale: ptBR });
    options.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) });
  }
  
  return options;
};

const monthOptions = generateMonthOptions();

export default function Reports() {
  const { clients, loading: clientsLoading } = useClients();
  const { progress, loading: progressLoading } = useAccountingProgress();
  const [filterRegime, setFilterRegime] = useState<TaxRegime | 'all'>('all');
  const [filterMonth, setFilterMonth] = useState(format(new Date(), 'yyyy-MM'));

  const loading = clientsLoading || progressLoading;

  const filteredData = clients.filter(
    (item) => filterRegime === 'all' || item.regimeTributario === filterRegime
  );

  // Dados para relatório de Progresso Contábil
  const accountingReportData = clients.map(client => {
    const clientProgress = progress.find(p => p.clientId === client.id && p.mesAno === filterMonth);
    return {
      client,
      progress: clientProgress,
    };
  });

  const handleExportClientsXLSX = () => {
    const exportData = filteredData.map((item) => ({
      'Razão Social': item.razaoSocial,
      'Nome Fantasia': item.nomeFantasia || '',
      'CNPJ / CPF': item.cnpj,
      'Regime Tributário': regimeLabels[item.regimeTributario],
      'Data de Entrada': item.dataEntrada ? new Date(item.dataEntrada).toLocaleDateString('pt-BR') : '',
      'Data de Saída': item.dataSaida ? new Date(item.dataSaida).toLocaleDateString('pt-BR') : '',
      'CCM': item.ccm || '',
      'Senha Prefeitura': item.ccmSenha || item.senhaPrefeitura || '',
      'Inscr. Estadual (IE)': item.ie || '',
      'Senha SEFAZ / Posto': item.sefazSenha || '',
      'Código de Acesso / Senha': item.simplesNacionalSenha || '',
      'Código de Acesso (ECAC)': item.ecacCodigoAcesso || '',
      'Senha e-CAC': item.ecacSenha || '',
      'Certificado Digital Tipo': item.certificadoDigitalTipo || '',
      'Data de Vencimento': item.certificadoDigitalVencimento ? new Date(item.certificadoDigitalVencimento).toLocaleDateString('pt-BR') : '',
      'Senha do Certificado': item.certificadoDigitalSenha || '',
      'E-mail Principal': item.email,
      'Telefone / WhatsApp': item.telefone,
      'Status Operacional': item.isActive ? 'Ativo' : 'Inativo',
      'Departamento Pessoal': item.responsavelDp || '',
      'Departamento Fiscal': item.responsavelFiscal || '',
      'Departamento Contábil': item.responsavelContabil || '',
      'Departamento Financeiro': item.responsavelFinanceiro || '',
      'Departamento Qualidade': item.responsavelQualidade || '',
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    const colWidths = Object.keys(exportData[0] || {}).map(key => ({
      wch: Math.max(key.length + 5, 25)
    }));
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, 'Clientes');

    const sociosData: any[] = [];
    filteredData.forEach((item) => {
      if (item.quadroSocietario && item.quadroSocietario.length > 0) {
        item.quadroSocietario.forEach((socio) => {
          sociosData.push({
            'CNPJ do Cliente': item.cnpj,
            'Razão Social': item.razaoSocial,
            'Nome do Sócio': socio.nome,
            'CPF': socio.cpf,
            'Quota %': socio.participacao,
          });
        });
      }
    });

    if (sociosData.length > 0) {
      const wsSocios = XLSX.utils.json_to_sheet(sociosData);
      const socioColWidths = Object.keys(sociosData[0] || {}).map(key => ({
        wch: Math.max(key.length + 5, 20)
      }));
      wsSocios['!cols'] = socioColWidths;
      XLSX.utils.book_append_sheet(wb, wsSocios, 'Sócios');
    }

    XLSX.writeFile(wb, `relatorio_clientes_completo_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExportAccountingXLSX = () => {
    const exportData = accountingReportData.map(({ client, progress: p }) => ({
      'Razão Social': client.razaoSocial,
      'CNPJ': client.cnpj,
      'Colaborador Responsável': p?.colaboradorResponsavel || '',
      'Mês/Ano de Fechamento': p?.mesAno ? format(new Date(p.mesAno + '-01'), 'MMMM yyyy', { locale: ptBR }) : '',
      'Conciliação Contábil': p?.conciliacaoContabil ? 'SIM' : 'NÃO',
      'Controle de Lucros': p?.controleLucros ? 'SIM' : 'NÃO',
      'Controle Aplicação Financeira': p?.controleAplicacaoFinanceira ? 'SIM' : 'NÃO',
      'Controle Anual': p?.controleAnual ? 'SIM' : 'NÃO',
      'Empresa Encerrada': p?.empresaEncerrada ? 'SIM' : 'NÃO',
      'Pendências': p?.pendencias || '',
      'Data da Última Atualização': p?.updatedAt ? new Date(p.updatedAt).toLocaleDateString('pt-BR') : '',
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    const colWidths = Object.keys(exportData[0] || {}).map(key => ({
      wch: Math.max(key.length + 5, 25)
    }));
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, 'Progresso Contábil');

    const monthLabel = monthOptions.find(m => m.value === filterMonth)?.label || filterMonth;
    XLSX.writeFile(wb, `progresso_contabil_${monthLabel.replace(' ', '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handlePrint = () => {
    window.print();
  };

  const totalClients = filteredData.length;
  const completedCount = accountingReportData.filter(d => d.progress?.conciliacaoContabil).length;

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
      </div>

      {/* Tabs */}
      <Tabs defaultValue="clients" className="space-y-6">
        <TabsList className="bg-muted/30 p-1 rounded-xl">
          <TabsTrigger value="clients" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <Building2 className="h-4 w-4 mr-2" />
            Clientes
          </TabsTrigger>
          <TabsTrigger value="accounting" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <Calculator className="h-4 w-4 mr-2" />
            Progresso Contábil
          </TabsTrigger>
        </TabsList>

        {/* Tab: Clientes */}
        <TabsContent value="clients" className="space-y-6">
          <div className="flex gap-3 justify-end no-print">
            <Button variant="outline" onClick={handleExportClientsXLSX} className="rounded-xl border-border/50 hover:bg-muted/50 font-light text-xs uppercase tracking-wider">
              <Download className="mr-2 h-4 w-4 opacity-60" />
              Excel
            </Button>
            <Button variant="outline" onClick={handlePrint} className="rounded-xl border-border/50 hover:bg-muted/50 font-light text-xs uppercase tracking-wider">
              <Printer className="mr-2 h-4 w-4 opacity-60" />
              Imprimir
            </Button>
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
        </TabsContent>

        {/* Tab: Progresso Contábil */}
        <TabsContent value="accounting" className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between no-print">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <Select value={filterMonth} onValueChange={setFilterMonth}>
                  <SelectTrigger className="w-[200px] rounded-xl border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border rounded-xl max-h-60">
                    {monthOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="rounded-lg">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button variant="outline" onClick={handleExportAccountingXLSX} className="rounded-xl border-border/50 hover:bg-muted/50 font-light text-xs uppercase tracking-wider">
              <Download className="mr-2 h-4 w-4 opacity-60" />
              Exportar Excel
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 animate-slide-in-up stagger-1">
            <div className="rounded-2xl bg-card p-6 border border-border/50 shadow-card">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/5 border border-primary/10">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em]">Total de Clientes</p>
                  <p className="text-4xl font-light text-foreground tracking-tighter">{clients.length}</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl bg-card p-6 border border-border/50 shadow-card">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-100">
                  <Calculator className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em]">Concluídos</p>
                  <p className="text-4xl font-light text-emerald-600 tracking-tighter">{completedCount}</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl bg-card p-6 border border-border/50 shadow-card">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 border border-amber-100">
                  <Calculator className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em]">Pendentes</p>
                  <p className="text-4xl font-light text-amber-600 tracking-tighter">{clients.length - completedCount}</p>
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
                  <TableHead className="font-normal text-[10px] uppercase tracking-[0.2em] text-muted-foreground h-12">CNPJ</TableHead>
                  <TableHead className="font-normal text-[10px] uppercase tracking-[0.2em] text-muted-foreground h-12">Colaborador</TableHead>
                  <TableHead className="font-normal text-[10px] uppercase tracking-[0.2em] text-muted-foreground h-12 text-center">Conciliação</TableHead>
                  <TableHead className="font-normal text-[10px] uppercase tracking-[0.2em] text-muted-foreground h-12 text-center">Lucros</TableHead>
                  <TableHead className="font-normal text-[10px] uppercase tracking-[0.2em] text-muted-foreground h-12 text-center">Aplicação</TableHead>
                  <TableHead className="font-normal text-[10px] uppercase tracking-[0.2em] text-muted-foreground h-12 text-center">Anual</TableHead>
                  <TableHead className="font-normal text-[10px] uppercase tracking-[0.2em] text-muted-foreground h-12">Pendências</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accountingReportData.map(({ client, progress: p }, index) => (
                  <TableRow
                    key={client.id}
                    className="border-border hover:bg-primary/[0.01] transition-colors"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <TableCell className="font-normal text-foreground py-4">{client.nomeFantasia || client.razaoSocial}</TableCell>
                    <TableCell className="text-sm font-mono font-light text-muted-foreground py-4">{client.cnpj}</TableCell>
                    <TableCell className="text-sm font-light text-muted-foreground py-4">{p?.colaboradorResponsavel || '---'}</TableCell>
                    <TableCell className="text-center py-4">
                      <span className={cn(
                        'inline-block px-2 py-0.5 rounded text-[10px] font-normal uppercase',
                        p?.conciliacaoContabil ? 'bg-emerald-50 text-emerald-700' : 'bg-muted text-muted-foreground'
                      )}>
                        {p?.conciliacaoContabil ? 'Sim' : 'Não'}
                      </span>
                    </TableCell>
                    <TableCell className="text-center py-4">
                      <span className={cn(
                        'inline-block px-2 py-0.5 rounded text-[10px] font-normal uppercase',
                        p?.controleLucros ? 'bg-emerald-50 text-emerald-700' : 'bg-muted text-muted-foreground'
                      )}>
                        {p?.controleLucros ? 'Sim' : 'Não'}
                      </span>
                    </TableCell>
                    <TableCell className="text-center py-4">
                      <span className={cn(
                        'inline-block px-2 py-0.5 rounded text-[10px] font-normal uppercase',
                        p?.controleAplicacaoFinanceira ? 'bg-emerald-50 text-emerald-700' : 'bg-muted text-muted-foreground'
                      )}>
                        {p?.controleAplicacaoFinanceira ? 'Sim' : 'Não'}
                      </span>
                    </TableCell>
                    <TableCell className="text-center py-4">
                      <span className={cn(
                        'inline-block px-2 py-0.5 rounded text-[10px] font-normal uppercase',
                        p?.controleAnual ? 'bg-emerald-50 text-emerald-700' : 'bg-muted text-muted-foreground'
                      )}>
                        {p?.controleAnual ? 'Sim' : 'Não'}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm font-light text-muted-foreground py-4 max-w-[200px] truncate">
                      {p?.pendencias || '---'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

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
