import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { TaskGeneratorService } from '@/services/taskGeneratorService';

export type ObligationType = 
  | 'guia' 
  | 'imposto' 
  | 'tarefa operacional' 
  | 'obrigação acessória' 
  | 'envio de documento' 
  | 'conferência interna';

export type ObligationPeriodicity = 
  | 'mensal' 
  | 'trimestral' 
  | 'anual' 
  | 'eventual';

export type ObligationDueRule = 
  | 'dia fixo' 
  | 'regra especial';

export type ObligationCompetencyRule = 
  | 'previous_month' 
  | 'current_month' 
  | 'quarterly' 
  | 'annual';

export interface Obligation {
  id: string;
  name: string;
  type: ObligationType;
  department: string;
  default_due_day: number;
  is_user_editable: boolean;
  alert_days: number[];
  alert_recipient_email: string;
  periodicity: ObligationPeriodicity;
  is_active: boolean;
  internal_note: string | null;
  competency: string | null;
  due_rule: ObligationDueRule;
  anticipate_on_weekend: boolean;
  tax_regimes: string[];
  competency_rule: ObligationCompetencyRule;
  created_at: string;
  updated_at: string;
}

export function useObligations() {
  const [obligations, setObligations] = useState<Obligation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchObligations = useCallback(async () => {
    try {
      setLoading(true);
      // @ts-ignore
      const { data, error } = await supabase
        .from('obligations')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) {
        if (error.code === '42P01') {
          // Table doesn't exist yet, return empty but let dev know
          setObligations([]);
        } else {
          throw error;
        }
      } else {
        setObligations((data as any[]) || []);
      }
    } catch (err) {
      console.error('Erro ao buscar obrigações:', err);
      toast.error('Erro ao carregar obrigações');
    } finally {
      setLoading(false);
    }
  }, []);

  const createObligation = async (obligation: Omit<Obligation, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      // @ts-ignore
      const { data, error } = await supabase
        .from('obligations')
        .insert([obligation])
        .select()
        .single();

      if (error) throw error;
      
      setObligations(prev => [...prev, data as any].sort((a,b) => a.name.localeCompare(b.name)));
      toast.success('Obrigação cadastrada com sucesso');
      
      // Magically create tasks for this month for eligible clients
      TaskGeneratorService.generateTasksForNewObligation(data).catch(console.error);
      
      return data;
    } catch (err) {
      console.error('Erro ao criar obrigação:', err);
      toast.error('Erro ao salvar obrigação');
      throw err;
    }
  };

  const updateObligation = async (id: string, updates: Partial<Obligation>) => {
    try {
      // @ts-ignore
      const { data, error } = await supabase
        .from('obligations')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setObligations(prev => prev.map(o => o.id === id ? { ...o, ...data } : o));
      toast.success('Obrigação atualizada');
      return data;
    } catch (err) {
      console.error('Erro ao atualizar obrigação:', err);
      toast.error('Erro ao atualizar obrigação');
      throw err;
    }
  };

  const deleteObligation = async (id: string) => {
    try {
      // @ts-ignore
      const { error } = await supabase
        .from('obligations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setObligations(prev => prev.filter(o => o.id !== id));
      toast.success('Obrigação removida');
    } catch (err) {
      console.error('Erro ao excluir obrigação:', err);
      toast.error('Erro ao excluir obrigação');
    }
  };

  useEffect(() => {
    fetchObligations();
  }, [fetchObligations]);

  return {
    obligations,
    loading,
    fetchObligations,
    createObligation,
    updateObligation,
    deleteObligation,
  };
}
