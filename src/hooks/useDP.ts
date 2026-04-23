import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DPClosing {
  id: string;
  clientId: string;
  colaboradorResponsavel: string;
  mesAnoFechamento: string; // YYYY-MM-DD
  folhaPagamento: boolean;
  encargosSociais: boolean; // FGTS, INSS
  eSocial: boolean;
  dctfWeb: boolean;
  fgtsDigital: boolean;
  empresaEncerrada: boolean;
  empresaEmAndamento: boolean;
  pendencias: string;
  createdAt: string;
  updatedAt: string;
}

export interface DPReportItem extends DPClosing {
  clientRazaoSocial: string;
  clientCnpj: string;
}

interface DbDPClosing {
  id: string;
  client_id: string;
  colaborador_responsavel: string;
  mes_ano_fechamento: string;
  folha_pagamento: boolean;
  encargos_sociais: boolean;
  e_social: boolean;
  dctf_web: boolean;
  fgts_digital: boolean;
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

const mapDbToDP = (db: DbDPClosing): DPClosing => ({
  id: db.id,
  clientId: db.client_id,
  colaboradorResponsavel: db.colaborador_responsavel,
  mesAnoFechamento: db.mes_ano_fechamento,
  folhaPagamento: db.folha_pagamento,
  encargosSociais: db.encargos_sociais,
  eSocial: db.e_social,
  dctfWeb: db.dctf_web,
  fgtsDigital: db.fgts_digital,
  empresaEncerrada: db.empresa_encerrada,
  empresaEmAndamento: db.empresa_em_andamento,
  pendencias: db.pendencias || '',
  createdAt: db.created_at,
  updatedAt: db.updated_at,
});

const mapDPToDb = (data: Omit<DPClosing, 'id' | 'createdAt' | 'updatedAt'>) => ({
  client_id: data.clientId,
  colaborador_responsavel: data.colaboradorResponsavel,
  mes_ano_fechamento: data.mesAnoFechamento,
  folha_pagamento: data.folhaPagamento,
  encargos_sociais: data.encargosSociais,
  e_social: data.eSocial,
  dctf_web: data.dctfWeb,
  fgts_digital: data.fgtsDigital,
  empresa_encerrada: data.empresaEncerrada,
  empresa_em_andamento: data.empresaEmAndamento,
  pendencias: data.pendencias || null,
});

export function useDP() {
  const [loading, setLoading] = useState(false);

  const fetchClosingsByClient = async (clientId: string) => {
    try {
      setLoading(true);
      const { data, error } = await (supabase
        .from('dp_closings' as any)
        .select('*')
        .eq('client_id', clientId)
        .order('mes_ano_fechamento', { ascending: false })) as any;

      if (error) throw error;
      return (data as unknown as DbDPClosing[]).map(mapDbToDP);
    } catch (error) {
      console.error('Erro ao buscar fechamentos DP:', error);
      // We don't toast error here because the table might not exist yet if user hasn't run the migration
      return [];
    } finally {
      setLoading(false);
    }
  };

  const createClosing = async (closingData: Omit<DPClosing, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      let dateToSend = closingData.mesAnoFechamento;
      if (dateToSend.length === 7) dateToSend += '-01';

      const dbData = { ...mapDPToDb(closingData), mes_ano_fechamento: dateToSend };

      const { data, error } = await (supabase
        .from('dp_closings' as any)
        .insert([dbData])
        .select()
        .single()) as any;

      if (error) throw error;

      toast.success('Fechamento de Folha registrado com sucesso!');
      return mapDbToDP(data as unknown as DbDPClosing);
    } catch (error: any) {
      console.error('Erro ao registrar fechamento DP:', error);
      toast.error(`Erro ao registrar: ${error.message || 'Verifique se a tabela dp_closings foi criada.'}`);
      throw error;
    }
  };

  const fetchAllClosings = async (): Promise<DPReportItem[]> => {
    try {
      setLoading(true);
      const { data, error } = await (supabase
        .from('dp_closings' as any)
        .select('*, clients(razao_social, cnpj)')
        .order('created_at', { ascending: false })) as any;

      if (error) throw error;

      return (data as unknown as DbDPClosing[]).map(item => ({
        ...mapDbToDP(item),
        clientRazaoSocial: item.clients?.razao_social || 'N/A',
        clientCnpj: item.clients?.cnpj || 'N/A'
      }));
    } catch (error) {
      console.error('Erro ao buscar todos fechamentos DP:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }

  const updateClosing = async (id: string, closingData: Omit<DPClosing, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      let dateToSend = closingData.mesAnoFechamento;
      if (dateToSend.length === 7) dateToSend += '-01';

      const dbData = { ...mapDPToDb(closingData), mes_ano_fechamento: dateToSend };

      const { data, error } = await (supabase
        .from('dp_closings' as any)
        .update(dbData)
        .eq('id', id)
        .select()
        .single()) as any;

      if (error) throw error;

      toast.success('Fechamento de Folha atualizado!');
      return mapDbToDP(data as unknown as DbDPClosing);
    } catch (error: any) {
      console.error('Erro ao atualizar fechamento DP:', error);
      toast.error(`Erro ao atualizar: ${error.message}`);
      throw error;
    }
  };

  const fetchClosedCompanies = async (): Promise<Set<string>> => {
    try {
      const { data, error } = await (supabase
        .from('dp_closings' as any)
        .select('client_id')
        .eq('empresa_encerrada', true)) as any;

      if (error) throw error;

      return new Set((data as any[]).map(item => item.client_id));
    } catch (error) {
      console.error('Erro ao buscar empresas encerradas DP:', error);
      return new Set();
    }
  };

  const resetAll = async () => {
    try {
      setLoading(true);
      const { error } = await (supabase
        .from('dp_closings' as any)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')) as any;

      if (error) throw error;
      toast.success('Todos os dados de Departamento Pessoal foram resetados!');
    } catch (error: any) {
      console.error('Erro ao resetar DP:', error);
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
    fetchAllClosings,
    fetchClosedCompanies,
    resetAll
  };
}
