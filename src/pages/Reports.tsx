import { useState, useEffect } from 'react';
import {
  Download,
  Loader2,
  BarChart3
} from 'lucide-react';
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
import { useClients } from '@/hooks/useClients';
import { useAccounting } from '@/hooks/useAccounting';
import * as XLSX from 'xlsx';

export default function Reports() {
  const { clients, loading: loadingClients } = useClients();
  const { fetchAllClosings, loading: loadingAccounting } = useAccounting();
  const [accountingData, setAccountingData] = useState<any[]>([]);

  useEffect(() => {
    fetchAllClosings().then(data => setAccountingData(data));
  }, []);

  const activeClientIds = new Set(clients.filter(c => c.isActive).map(c => c.id));
  const filteredAccountingData = accountingData.filter(item => activeClientIds.has(item.clientId));

  const handleExportAccountingXLSX = () => {
    const exportData = filteredAccountingData.map((item) => ({
      'Razão Social': item.clientRazaoSocial,
      'CNPJ': item.clientCnpj,
      'Colaborador Responsável': item.colaboradorResponsavel,
      'Mês/Ano Fechamento': item.mesAnoFechamento,
      'Conciliação Contábil': item.conciliacaoContabil ? 'SIM' : 'NÃO',
      'Controle de Lucros': item.controleLucros ? 'SIM' : 'NÃO',
      'Controle Aplicação': item.controleAplicacaoFinanceira ? 'SIM' : 'NÃO',
      'Controle Anual': item.controleAnual ? 'SIM' : 'NÃO',
      'Empresa Encerrada': item.empresaEncerrada ? 'SIM' : 'NÃO',
      'Empresa em Andamento': item.empresaEmAndamento ? 'SIM' : 'NÃO',
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

  const totalAccountingRegistros = filteredAccountingData.length;

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
          <p className="text-xs font-normal text-muted-foreground uppercase tracking-[0.2em] mt-1">Progresso Contábil e Encerramentos</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/5 border border-primary/10">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em]">Total de Registros</p>
              <p className="text-4xl font-light text-foreground tracking-tighter">{totalAccountingRegistros}</p>
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
                <TableHead className="h-12 text-center">Em Andamento?</TableHead>
                <TableHead className="h-12 text-center">Encerrada?</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingAccounting ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">Carregando...</TableCell>
                </TableRow>
              ) : filteredAccountingData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">Nenhum registro encontrado.</TableCell>
                </TableRow>
              ) : (
                filteredAccountingData.map((item) => (
                  <TableRow key={item.id} className="border-border hover:bg-primary/[0.01]">
                    <TableCell className="py-4 font-medium">{item.clientRazaoSocial}</TableCell>
                    <TableCell className="py-4">{item.mesAnoFechamento}</TableCell>
                    <TableCell className="py-4 text-muted-foreground">{item.colaboradorResponsavel}</TableCell>
                    <TableCell className="py-4 text-center">{item.conciliacaoContabil ? '✅' : '❌'}</TableCell>
                    <TableCell className="py-4 text-center">{item.controleLucros ? '✅' : '❌'}</TableCell>
                    <TableCell className="py-4 text-center">
                      {item.empresaEmAndamento ? <span className="text-blue-600 font-bold">SIM</span> : 'NÃO'}
                    </TableCell>
                    <TableCell className="py-4 text-center">
                      {item.empresaEncerrada ? <span className="text-destructive font-bold">SIM</span> : 'NÃO'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
