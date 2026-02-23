import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AccountingClosing {
  id: string;
  clientId: string;
  colaboradorResponsavel: string;
  mesAnoFechamento: string; // YYYY-MM-DD
  conciliacaoContabil: boolean;
  controleLucros: boolean;
  controleAplicacaoFinanceira: boolean;
  controleAnual: boolean;
  empresaEncerrada: boolean;
  pendencias: string;
  createdAt: string;
  updatedAt: string;
}

export interface AccountingReportItem extends AccountingClosing {
  clientRazaoSocial: string;
  clientCnpj: string;
}

interface DbAccountingClosing {
  id: string;
  client_id: string;
  colaborador_responsavel: string;
  mes_ano_fechamento: string;
  conciliacao_contabil: boolean;
  controle_lucros: boolean;
  controle_aplicacao_financeira: boolean;
  controle_anual: boolean;
  empresa_encerrada: boolean;
  pendencias: string | null;
  created_at: string;
  updated_at: string;
  clients?: {
    razao_social: string;
    cnpj: string;
  };
}

const mapDbToAccounting = (db: DbAccountingClosing): AccountingClosing => ({
  id: db.id,
  clientId: db.client_id,
  colaboradorResponsavel: db.colaborador_responsavel,
  mesAnoFechamento: db.mes_ano_fechamento,
  conciliacaoContabil: db.conciliacao_contabil,
  controleLucros: db.controle_lucros,
  controleAplicacaoFinanceira: db.controle_aplicacao_financeira,
  controleAnual: db.controle_anual,
  empresaEncerrada: db.empresa_encerrada,
  pendencias: db.pendencias || '',
  createdAt: db.created_at,
  updatedAt: db.updated_at,
});

const mapAccountingToDb = (data: Omit<AccountingClosing, 'id' | 'createdAt' | 'updatedAt'>) => ({
  client_id: data.clientId,
  colaborador_responsavel: data.colaboradorResponsavel,
  mes_ano_fechamento: data.mesAnoFechamento,
  conciliacao_contabil: data.conciliacaoContabil,
  controle_lucros: data.controleLucros,
  controle_aplicacao_financeira: data.controleAplicacaoFinanceira,
  controle_anual: data.controleAnual,
  empresa_encerrada: data.empresaEncerrada,
  pendencias: data.pendencias || null,
});

export function useAccounting() {
  const [loading, setLoading] = useState(false);

  const fetchClosingsByClient = async (clientId: string) => {
    try {
      setLoading(true);
      const { data, error } = await (supabase
        .from('accounting_closings' as any)
        .select('*')
        .eq('client_id', clientId)
        .order('mes_ano_fechamento', { ascending: false })) as any;

      if (error) throw error;
      return (data as unknown as DbAccountingClosing[]).map(mapDbToAccounting);
    } catch (error) {
      console.error('Erro ao buscar fechamentos:', error);
      toast.error('Erro ao buscar dados de contabilidade');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const createClosing = async (closingData: Omit<AccountingClosing, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      // Formata data para YYYY-MM-01 se vier como YYYY-MM
      let dateToSend = closingData.mesAnoFechamento;
      if (dateToSend.length === 7) dateToSend += '-01';

      const dbData = { ...mapAccountingToDb(closingData), mes_ano_fechamento: dateToSend };

      const { data, error } = await (supabase
        .from('accounting_closings' as any)
        .insert([dbData])
        .select()
        .single()) as any;

      if (error) throw error;

      toast.success('Fechamento registrado com sucesso!');
      return mapDbToAccounting(data as unknown as DbAccountingClosing);
    } catch (error: any) {
      console.error('Erro ao registrar fechamento:', error);

      if (error.message?.includes('schema cache')) {
        toast.error('Erro de cache no Supabase. Por favor, atualize a página e tente novamente em alguns instantes. Se persistir, contate o suporte.');
      } else {
        toast.error(`Erro ao registrar: ${error.message || 'Erro desconhecido'}`);
      }
      throw error;
    }
  };

  const fetchAllClosings = async (): Promise<AccountingReportItem[]> => {
    try {
      setLoading(true);
      const { data, error } = await (supabase
        .from('accounting_closings' as any)
        .select('*, clients(razao_social, cnpj)')
        .order('created_at', { ascending: false })) as any;

      if (error) throw error;

      return (data as unknown as DbAccountingClosing[]).map(item => ({
        ...mapDbToAccounting(item),
        clientRazaoSocial: item.clients?.razao_social || 'N/A',
        clientCnpj: item.clients?.cnpj || 'N/A'
      }));
    } catch (error) {
      console.error('Erro ao buscar todos fechamentos:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }

  const updateClosing = async (id: string, closingData: Omit<AccountingClosing, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      let dateToSend = closingData.mesAnoFechamento;
      if (dateToSend.length === 7) dateToSend += '-01';

      const dbData = { ...mapAccountingToDb(closingData), mes_ano_fechamento: dateToSend };

      const { data, error } = await (supabase
        .from('accounting_closings' as any)
        .update(dbData)
        .eq('id', id)
        .select()
        .single()) as any;

      if (error) throw error;

      toast.success('Fechamento atualizado com sucesso!');
      return mapDbToAccounting(data as unknown as DbAccountingClosing);
    } catch (error: any) {
      console.error('Erro ao atualizar fechamento:', error);
      toast.error(`Erro ao atualizar: ${error.message || 'Erro desconhecido'}`);
      throw error;
    }
  };

  const deleteClosing = async (id: string) => {
    try {
      const { error } = await (supabase
        .from('accounting_closings' as any)
        .delete()
        .eq('id', id)) as any;

      if (error) throw error;
      toast.success('Fechamento excluído com sucesso!');
    } catch (error: any) {
      console.error('Erro ao excluir fechamento:', error);
      toast.error(`Erro ao excluir: ${error.message || 'Erro desconhecido'}`);
      throw error;
    }
  };

  const fetchClosedCompanies = async (): Promise<Set<string>> => {
    try {
      // Get IDs of clients that have at least one closing with empresa_encerrada = true
      const { data, error } = await (supabase
        .from('accounting_closings' as any)
        .select('client_id')
        .eq('empresa_encerrada', true)) as any;

      if (error) throw error;

      const closedCompanyIds = new Set((data as any[]).map(item => item.client_id));
      return closedCompanyIds;
    } catch (error) {
      console.error('Erro ao buscar empresas encerradas:', error);
      return new Set();
    }
  };

  return {
    loading,
    fetchClosingsByClient,
    createClosing,
    updateClosing,
    deleteClosing,
    fetchAllClosings,
    fetchClosedCompanies
  };
}
