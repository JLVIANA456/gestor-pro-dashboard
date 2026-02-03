import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AccountingProgress {
  id: string;
  clientId: string;
  colaboradorResponsavel: string;
  mesAno: string;
  conciliacaoContabil: boolean;
  controleLucros: boolean;
  controleAplicacaoFinanceira: boolean;
  controleAnual: boolean;
  empresaEncerrada: boolean;
  pendencias?: string;
  createdAt: string;
  updatedAt: string;
}

interface DbAccountingProgress {
  id: string;
  client_id: string;
  colaborador_responsavel: string;
  mes_ano: string;
  conciliacao_contabil: boolean;
  controle_lucros: boolean;
  controle_aplicacao_financeira: boolean;
  controle_anual: boolean;
  empresa_encerrada: boolean;
  pendencias: string | null;
  created_at: string;
  updated_at: string;
}

const mapDbToProgress = (db: DbAccountingProgress): AccountingProgress => ({
  id: db.id,
  clientId: db.client_id,
  colaboradorResponsavel: db.colaborador_responsavel,
  mesAno: db.mes_ano,
  conciliacaoContabil: db.conciliacao_contabil,
  controleLucros: db.controle_lucros,
  controleAplicacaoFinanceira: db.controle_aplicacao_financeira,
  controleAnual: db.controle_anual,
  empresaEncerrada: db.empresa_encerrada,
  pendencias: db.pendencias ?? undefined,
  createdAt: db.created_at,
  updatedAt: db.updated_at,
});

export function useAccountingProgress() {
  const [progress, setProgress] = useState<AccountingProgress[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProgress = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('accounting_progress')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const mapped = (data as unknown as DbAccountingProgress[]).map(mapDbToProgress);
      setProgress(mapped);
    } catch (error) {
      console.error('Erro ao buscar progresso contábil:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const getProgressByClient = (clientId: string) => {
    return progress.filter(p => p.clientId === clientId);
  };

  const getProgressByClientAndMonth = (clientId: string, mesAno: string) => {
    return progress.find(p => p.clientId === clientId && p.mesAno === mesAno);
  };

  const saveProgress = async (data: Omit<AccountingProgress, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const dbData = {
        client_id: data.clientId,
        colaborador_responsavel: data.colaboradorResponsavel,
        mes_ano: data.mesAno,
        conciliacao_contabil: data.conciliacaoContabil,
        controle_lucros: data.controleLucros,
        controle_aplicacao_financeira: data.controleAplicacaoFinanceira,
        controle_anual: data.controleAnual,
        empresa_encerrada: data.empresaEncerrada,
        pendencias: data.pendencias || null,
      };

      // Check if exists
      const existing = progress.find(p => p.clientId === data.clientId && p.mesAno === data.mesAno);

      if (existing) {
        const { data: updated, error } = await supabase
          .from('accounting_progress')
          .update(dbData)
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;

        const mapped = mapDbToProgress(updated as unknown as DbAccountingProgress);
        setProgress(prev => prev.map(p => p.id === existing.id ? mapped : p));
        toast.success('Progresso atualizado!');
        return mapped;
      } else {
        const { data: created, error } = await supabase
          .from('accounting_progress')
          .insert([dbData])
          .select()
          .single();

        if (error) throw error;

        const mapped = mapDbToProgress(created as unknown as DbAccountingProgress);
        setProgress(prev => [mapped, ...prev]);
        toast.success('Progresso salvo!');
        return mapped;
      }
    } catch (error: any) {
      console.error('Erro ao salvar progresso:', error);
      toast.error('Erro ao salvar', { description: error.message });
      throw error;
    }
  };

  useEffect(() => {
    fetchProgress();
  }, []);

  return {
    progress,
    loading,
    fetchProgress,
    getProgressByClient,
    getProgressByClientAndMonth,
    saveProgress,
  };
}
