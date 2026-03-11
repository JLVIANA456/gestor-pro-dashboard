import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type ProfitSheetStatus = 'pendente' | 'recebido' | 'cobrado';

export interface ProfitSheetTask {
  id: string;
  client_id: string;
  mes_ano: string;           // YYYY-MM
  status: ProfitSheetStatus;
  received_at: string | null;
  cobrado_at: string | null;
  observacoes: string | null;
  responsavel: string | null;
  created_at: string;
  updated_at: string;
}

export function useProfitSheetTasks(mesAno?: string) {
  const [tasks, setTasks] = useState<ProfitSheetTask[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async (mes?: string) => {
    try {
      setLoading(true);
      let query = (supabase as any).from('profit_sheet_tasks').select('*');
      if (mes) query = query.eq('mes_ano', mes);
      const { data, error } = await query.order('created_at', { ascending: true });
      if (error) {
        if (error.code === '42P01') {
          setTasks([]);
        } else {
          throw error;
        }
      } else {
        setTasks(data || []);
      }
    } catch (err) {
      console.error('Erro ao buscar tarefas:', err);
      toast.error('Erro ao carregar tarefas da planilha de lucros');
    } finally {
      setLoading(false);
    }
  }, []);

  /** Garante que todos os clientes tenham um registro para o mês */
  const ensureTasksForMonth = useCallback(async (
    clientIds: string[],
    mes: string
  ) => {
    try {
      // Descobre quais já existem
      const { data: existing, error } = await (supabase as any)
        .from('profit_sheet_tasks')
        .select('client_id')
        .eq('mes_ano', mes);

      if (error && error.code !== '42P01') throw error;

      const existingIds = new Set((existing || []).map((r: any) => r.client_id));
      const toInsert = clientIds
        .filter(id => !existingIds.has(id))
        .map(id => ({ client_id: id, mes_ano: mes, status: 'pendente' }));

      if (toInsert.length > 0) {
        const { error: insertErr } = await (supabase as any)
          .from('profit_sheet_tasks')
          .insert(toInsert);
        if (insertErr) throw insertErr;
      }

      await fetchTasks(mes);
    } catch (err) {
      console.error('Erro ao criar tarefas:', err);
    }
  }, [fetchTasks]);

  /** Marca como recebido (OK) */
  const markReceived = useCallback(async (taskId: string, responsavel?: string, date?: string) => {
    try {
      const { data, error } = await (supabase as any)
        .from('profit_sheet_tasks')
        .update({
          status: 'recebido',
          received_at: date || new Date().toISOString(),
          responsavel: responsavel || null,
        })
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;

      setTasks(prev => prev.map(t => t.id === taskId ? data : t));
      toast.success('Planilha marcada como recebida!');
      return data as ProfitSheetTask;
    } catch (err) {
      console.error('Erro ao marcar como recebido:', err);
      toast.error('Erro ao atualizar status');
      throw err;
    }
  }, []);

  /** Registra que o e-mail de recobrança foi enviado */
  const markCobrado = useCallback(async (taskId: string, responsavel?: string) => {
    try {
      const { data, error } = await (supabase as any)
        .from('profit_sheet_tasks')
        .update({
          status: 'cobrado',
          cobrado_at: new Date().toISOString(),
          responsavel: responsavel || null,
        })
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;

      setTasks(prev => prev.map(t => t.id === taskId ? data : t));
      toast.success('Recobrança registrada!');
      return data as ProfitSheetTask;
    } catch (err) {
      console.error('Erro ao registrar recobrança:', err);
      toast.error('Erro ao registrar recobrança');
      throw err;
    }
  }, []);

  /** Reverte para pendente */
  const resetTask = useCallback(async (taskId: string) => {
    try {
      const { data, error } = await (supabase as any)
        .from('profit_sheet_tasks')
        .update({
          status: 'pendente',
          received_at: null,
          cobrado_at: null,
          responsavel: null,
        })
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;

      setTasks(prev => prev.map(t => t.id === taskId ? data : t));
      toast.success('Status revertido para pendente');
      return data as ProfitSheetTask;
    } catch (err) {
      console.error('Erro ao reverter tarefa:', err);
      toast.error('Erro ao reverter status');
      throw err;
    }
  }, []);

  /** Reseta todos os lançamentos do mês */
  const resetAllForMonth = useCallback(async (mes: string) => {
    try {
      const { error } = await (supabase as any)
        .from('profit_sheet_tasks')
        .update({
          status: 'pendente',
          received_at: null,
          cobrado_at: null,
          responsavel: null,
        })
        .eq('mes_ano', mes);

      if (error) throw error;

      await fetchTasks(mes);
      toast.success('Todos os lançamentos do mês foram resetados!');
    } catch (err) {
      console.error('Erro ao resetar tarefas do mês:', err);
      toast.error('Erro ao resetar tarefas');
    }
  }, [fetchTasks]);

  /** Salva observação */
  const updateObservacao = useCallback(async (taskId: string, observacoes: string) => {
    try {
      const { data, error } = await (supabase as any)
        .from('profit_sheet_tasks')
        .update({ observacoes })
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;
      setTasks(prev => prev.map(t => t.id === taskId ? data : t));
    } catch (err) {
      console.error('Erro ao salvar observação:', err);
    }
  }, []);

  useEffect(() => {
    fetchTasks(mesAno);
  }, [mesAno, fetchTasks]);

  return {
    tasks,
    loading,
    fetchTasks,
    ensureTasksForMonth,
    markReceived,
    markCobrado,
    resetTask,
    resetAllForMonth,
    updateObservacao,
  };
}
