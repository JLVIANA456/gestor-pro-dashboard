import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  pendencias: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ClientWithProgress {
  id: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  progress: AccountingProgress | null;
}

export function useAccountingProgress() {
  const [clientsWithProgress, setClientsWithProgress] = useState<ClientWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchClientsWithProgress = async () => {
    try {
      setLoading(true);
      
      // Fetch all clients
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('id, razao_social, nome_fantasia, cnpj')
        .order('razao_social');

      if (clientsError) throw clientsError;

      // Fetch all accounting progress
      const { data: progressData, error: progressError } = await supabase
        .from('accounting_progress')
        .select('*');

      if (progressError) throw progressError;

      // Map clients with their progress
      const mapped: ClientWithProgress[] = (clients || []).map(client => {
        const progress = progressData?.find(p => p.client_id === client.id);
        return {
          id: client.id,
          razaoSocial: client.razao_social,
          nomeFantasia: client.nome_fantasia,
          cnpj: client.cnpj,
          progress: progress ? {
            id: progress.id,
            clientId: progress.client_id,
            colaboradorResponsavel: progress.colaborador_responsavel,
            mesAno: progress.mes_ano,
            conciliacaoContabil: progress.conciliacao_contabil,
            controleLucros: progress.controle_lucros,
            controleAplicacaoFinanceira: progress.controle_aplicacao_financeira,
            controleAnual: progress.controle_anual,
            empresaEncerrada: progress.empresa_encerrada,
            pendencias: progress.pendencias,
            createdAt: progress.created_at,
            updatedAt: progress.updated_at,
          } : null,
        };
      });

      setClientsWithProgress(mapped);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const saveProgress = async (clientId: string, data: Omit<AccountingProgress, 'id' | 'clientId' | 'createdAt' | 'updatedAt'>) => {
    try {
      const existingProgress = clientsWithProgress.find(c => c.id === clientId)?.progress;

      if (existingProgress) {
        // Update existing
        const { error } = await supabase
          .from('accounting_progress')
          .update({
            colaborador_responsavel: data.colaboradorResponsavel,
            mes_ano: data.mesAno,
            conciliacao_contabil: data.conciliacaoContabil,
            controle_lucros: data.controleLucros,
            controle_aplicacao_financeira: data.controleAplicacaoFinanceira,
            controle_anual: data.controleAnual,
            empresa_encerrada: data.empresaEncerrada,
            pendencias: data.pendencias,
          })
          .eq('id', existingProgress.id);

        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from('accounting_progress')
          .insert({
            client_id: clientId,
            colaborador_responsavel: data.colaboradorResponsavel,
            mes_ano: data.mesAno,
            conciliacao_contabil: data.conciliacaoContabil,
            controle_lucros: data.controleLucros,
            controle_aplicacao_financeira: data.controleAplicacaoFinanceira,
            controle_anual: data.controleAnual,
            empresa_encerrada: data.empresaEncerrada,
            pendencias: data.pendencias,
          });

        if (error) throw error;
      }

      toast({
        title: 'Sucesso',
        description: 'Progresso contábil salvo com sucesso.',
      });

      await fetchClientsWithProgress();
      return true;
    } catch (error) {
      console.error('Erro ao salvar progresso:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o progresso.',
        variant: 'destructive',
      });
      return false;
    }
  };

  useEffect(() => {
    fetchClientsWithProgress();
  }, []);

  return {
    clientsWithProgress,
    loading,
    saveProgress,
    refetch: fetchClientsWithProgress,
  };
}
