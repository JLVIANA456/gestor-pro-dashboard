import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface FiscalClosing {
  id: string;
  clientId: string;
  colaboradorResponsavel: string;
  mesAnoFechamento: string; // YYYY-MM-DD
  escrituracaoFiscal: boolean;
  apuracaoImpostos: boolean;
  entregaObrigacoes: boolean;
  conferenciaGeral: boolean;
  empresaEncerrada: boolean;
  empresaEmAndamento: boolean;
  pendencias: string;
  createdAt: string;
  updatedAt: string;
}

export interface FiscalReportItem extends FiscalClosing {
  clientRazaoSocial: string;
  clientCnpj: string;
}

interface DbFiscalClosing {
  id: string;
  client_id: string;
  colaborador_responsavel: string;
  mes_ano_fechamento: string;
  escrituracao_fiscal: boolean;
  apuracao_impostos: boolean;
  entrega_obrigacoes: boolean;
  conferencia_geral: boolean;
  empresa_encerrada: boolean;
  empresa_em_andamento: boolean;
  pendencias: string | null;
  created_at: string;
  updated_at: string;
  clients?: {
    razao_social: string;
    cnpj: string;
  };
}

const mapDbToFiscal = (db: DbFiscalClosing): FiscalClosing => ({
  id: db.id,
  clientId: db.client_id,
  colaboradorResponsavel: db.colaborador_responsavel,
  mesAnoFechamento: db.mes_ano_fechamento,
  escrituracaoFiscal: db.escrituracao_fiscal,
  apuracaoImpostos: db.apuracao_impostos,
  entregaObrigacoes: db.entrega_obrigacoes,
  conferenciaGeral: db.conferencia_geral,
  empresaEncerrada: db.empresa_encerrada,
  empresaEmAndamento: db.empresa_em_andamento,
  pendencias: db.pendencias || '',
  createdAt: db.created_at,
  updatedAt: db.updated_at,
});

const mapFiscalToDb = (data: Omit<FiscalClosing, 'id' | 'createdAt' | 'updatedAt'>) => ({
  client_id: data.clientId,
  colaborador_responsavel: data.colaboradorResponsavel,
  mes_ano_fechamento: data.mesAnoFechamento,
  escrituracao_fiscal: data.escrituracaoFiscal,
  apuracao_impostos: data.apuracaoImpostos,
  entrega_obrigacoes: data.entregaObrigacoes,
  conferencia_geral: data.conferenciaGeral,
  empresa_encerrada: data.empresaEncerrada,
  empresa_em_andamento: data.empresaEmAndamento,
  pendencias: data.pendencias || null,
});

export function useFiscal() {
  const [loading, setLoading] = useState(false);

  const fetchClosingsByClient = async (clientId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('fiscal_closings')
        .select('*')
        .eq('client_id', clientId)
        .order('mes_ano_fechamento', { ascending: false });

      if (error) throw error;
      return (data as unknown as DbFiscalClosing[]).map(mapDbToFiscal);
    } catch (error) {
      console.error('Erro ao buscar fechamentos fiscais:', error);
      toast.error('Erro ao buscar dados de fiscal');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const createClosing = async (closingData: Omit<FiscalClosing, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      let dateToSend = closingData.mesAnoFechamento;
      if (dateToSend.length === 7) dateToSend += '-01';

      const dbData = { ...mapFiscalToDb(closingData), mes_ano_fechamento: dateToSend };

      const { data, error } = await supabase
        .from('fiscal_closings')
        .insert([dbData])
        .select()
        .single();

      if (error) throw error;

      toast.success('Fechamento fiscal registrado com sucesso!');
      return mapDbToFiscal(data as unknown as DbFiscalClosing);
    } catch (error: any) {
      console.error('Erro ao registrar fechamento fiscal:', error);
      toast.error(`Erro ao registrar: ${error.message || 'Erro desconhecido'}`);
      throw error;
    }
  };

  const fetchAllClosings = async (): Promise<FiscalReportItem[]> => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('fiscal_closings')
        .select('*, clients(razao_social, cnpj)')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data as unknown as DbFiscalClosing[]).map(item => ({
        ...mapDbToFiscal(item),
        clientRazaoSocial: item.clients?.razao_social || 'N/A',
        clientCnpj: item.clients?.cnpj || 'N/A'
      }));
    } catch (error) {
      console.error('Erro ao buscar todos fechamentos fiscais:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }

  const updateClosing = async (id: string, closingData: Omit<FiscalClosing, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      let dateToSend = closingData.mesAnoFechamento;
      if (dateToSend.length === 7) dateToSend += '-01';

      const dbData = { ...mapFiscalToDb(closingData), mes_ano_fechamento: dateToSend };

      const { data, error } = await supabase
        .from('fiscal_closings')
        .update(dbData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast.success('Fechamento fiscal atualizado com sucesso!');
      return mapDbToFiscal(data as unknown as DbFiscalClosing);
    } catch (error: any) {
      console.error('Erro ao atualizar fechamento fiscal:', error);
      toast.error(`Erro ao atualizar: ${error.message || 'Erro desconhecido'}`);
      throw error;
    }
  };

  const deleteClosing = async (id: string) => {
    try {
      const { error } = await supabase
        .from('fiscal_closings')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Fechamento fiscal excluído com sucesso!');
    } catch (error: any) {
      console.error('Erro ao excluir fechamento fiscal:', error);
      toast.error(`Erro ao excluir: ${error.message || 'Erro desconhecido'}`);
      throw error;
    }
  };

  const fetchClosedCompanies = async (): Promise<Set<string>> => {
    try {
      const { data, error } = await supabase
        .from('fiscal_closings')
        .select('client_id')
        .eq('empresa_encerrada', true);

      if (error) throw error;

      const closedCompanyIds = new Set((data as any[]).map(item => item.client_id));
      return closedCompanyIds;
    } catch (error) {
      console.error('Erro ao buscar empresas encerradas (fiscal):', error);
      return new Set();
    }
  };

  const resetAll = async () => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('fiscal_closings')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (error) throw error;
      toast.success('Todos os dados de fiscal foram resetados!');
    } catch (error: any) {
      console.error('Erro ao resetar fiscal:', error);
      toast.error('Erro ao resetar dados');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    fetchClosingsByClient,
    createClosing,
    updateClosing,
    deleteClosing,
    fetchAllClosings,
    fetchClosedCompanies,
    resetAll
  };
}
