import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type DeliveryStatus = 'pending' | 'sent' | 'scheduled' | 'expired';

export interface AccountingGuide {
  id: string;
  client_id: string;
  type: string;
  reference_month: string;           // YYYY-MM
  due_date: string | null;
  amount: number | null;
  status: DeliveryStatus;
  file_url: string | null;
  scheduled_for: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  opened_at: string | null;
  competency: string | null;
  created_at: string;
  updated_at: string;
  client?: {
    nome_fantasia: string;
    razao_social: string;
    email: string;
    cnpj: string;
  };
  sender_ip?: string | null;
}

export function useDeliveryList(referenceMonth?: string) {
  const sb = supabase as any;
  const [guides, setGuides] = useState<AccountingGuide[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGuides = useCallback(async (month?: string) => {
    try {
      setLoading(true);
      let allData: any[] = [];
      let from = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        // @ts-ignore
        let query = sb.from('accounting_guides').select(`
          *,
          client:clients(nome_fantasia, razao_social, email, cnpj)
        `);
        
        if (month) {
          // @ts-ignore
          query = query.eq('reference_month', month);
        }
        
        const { data, error } = await query
          .order('created_at', { ascending: false })
          .range(from, from + pageSize - 1);
        
        if (error) {
          if (error.code === '42P01') {
            hasMore = false;
            break;
          } else {
            throw error;
          }
        }
        
        if (!data || data.length === 0) {
          hasMore = false;
        } else {
          allData = [...allData, ...data];
          from += pageSize;
          if (data.length < pageSize) {
            hasMore = false;
          }
        }
      }

      setGuides(allData);
    } catch (err) {
      console.error('Erro ao buscar guias:', err);
      toast.error('Erro ao carregar guias de entrega');
    } finally {
      setLoading(false);
    }
  }, [sb]);

  const createGuide = async (guide: Omit<AccountingGuide, 'id' | 'created_at' | 'updated_at' | 'client'>) => {
    try {
      // @ts-ignore
      const { data, error } = await sb
        .from('accounting_guides')
        .insert([guide])
        .select(`
          *,
          client:clients(nome_fantasia, razao_social, email, cnpj)
        `)
        .single();

      if (error) throw error;
      
      setGuides(prev => [data as any, ...prev]);
      return data;
    } catch (err) {
      console.error('Erro ao criar guia:', err);
      toast.error('Erro ao salvar guia');
      throw err;
    }
  };

  const createGuidesBulk = async (newGuides: Omit<AccountingGuide, 'id' | 'created_at' | 'updated_at' | 'client'>[]) => {
    try {
      if (newGuides.length === 0) return [];

      // @ts-ignore
      const { data, error } = await sb
        .from('accounting_guides')
        .insert(newGuides)
        .select(`
          *,
          client:clients(nome_fantasia, razao_social, email, cnpj)
        `);

      if (error) throw error;
      
      setGuides(prev => [...(data as any[]), ...prev]);
      return data;
    } catch (err) {
      console.error('Erro ao criar guias em lote:', err);
      toast.error('Erro ao salvar tarefas em lote');
      throw err;
    }
  };

  const updateGuideStatus = async (id: string, status: DeliveryStatus, sentAt?: string) => {
    try {
      const updateData: any = { status, updated_at: new Date().toISOString() };
      if (sentAt) updateData.sent_at = sentAt;

      // @ts-ignore
      const { data, error } = await sb
        .from('accounting_guides')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      // Update local state by merging with new data
      setGuides(prev => prev.map(g => g.id === id ? { ...g, ...data } : g));
      return data;
    } catch (err) {
      console.error('Erro ao atualizar guia:', err);
      toast.error('Erro ao atualizar status');
      throw err;
    }
  };

  const updateGuide = async (id: string, updates: Partial<AccountingGuide>) => {
    try {
      // @ts-ignore
      const { data, error } = await sb
        .from('accounting_guides')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setGuides(prev => prev.map(g => g.id === id ? { ...g, ...data } : g));
      return data;
    } catch (err) {
      console.error('Erro ao atualizar guia:', err);
      toast.error('Erro ao atualizar guia');
      throw err;
    }
  };

  const deleteGuide = async (id: string) => {
    try {
      // @ts-ignore
      const { error } = await sb
        .from('accounting_guides')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setGuides(prev => prev.filter(g => g.id !== id));
      toast.success('Guia removida com sucesso');
    } catch (err) {
      console.error('Erro ao excluir guia:', err);
      toast.error('Erro ao excluir guia');
    }
  };

  const deleteGuidesBulk = async (ids: string[]) => {
    try {
      if (ids.length === 0) return;
      
      // @ts-ignore
      const { error } = await sb
        .from('accounting_guides')
        .delete()
        .in('id', ids);

      if (error) throw error;
      
      setGuides(prev => prev.filter(g => !ids.includes(g.id)));
      toast.success(`${ids.length} tarefas removidas com sucesso`);
    } catch (err) {
      console.error('Erro ao excluir guias em lote:', err);
      toast.error('Erro ao excluir tarefas');
    }
  };

  const deleteAllGuides = async (month?: string) => {
    try {
      if (!month) return;
      
      // @ts-ignore
      const { error } = await sb
        .from('accounting_guides')
        .delete()
        .eq('reference_month', month);

      if (error) throw error;
      setGuides([]);
      toast.success('Todas as tarefas foram removidas');
    } catch (err) {
      console.error('Erro ao excluir guias:', err);
      toast.error('Erro ao limpar tarefas');
    }
  };

  const fetchExistingKeys = async (month: string): Promise<Set<string>> => {
    try {
      let allKeys = new Set<string>();
      let from = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        // @ts-ignore
        const { data, error } = await sb
          .from('accounting_guides')
          .select('client_id, type')
          .eq('reference_month', month)
          .range(from, from + pageSize - 1);

        if (error) throw error;
        
        if (!data || data.length === 0) {
          hasMore = false;
        } else {
          data.forEach((g: any) => {
            allKeys.add(`${g.client_id}__${(g.type || '').toLowerCase()}`);
          });
          from += pageSize;
          if (data.length < pageSize) {
            hasMore = false;
          }
        }
      }

      return allKeys;
    } catch (err) {
      console.error('Erro ao buscar chaves existentes:', err);
      return new Set<string>();
    }
  };

  useEffect(() => {
    fetchGuides(referenceMonth);
  }, [referenceMonth, fetchGuides]);

  return {
    guides,
    loading,
    fetchGuides,
    createGuide,
    createGuidesBulk,
    updateGuideStatus,
    updateGuide,
    deleteGuide,
    deleteGuidesBulk,
    deleteAllGuides,
    fetchExistingKeys,
  };
}
