import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ClientStats {
  total: number;
  simples: number;
  presumido: number;
  real: number;
  ativos: number;
  entradasMes: number;
  saidasMes: number;
}

export function useClientStats() {
  const [stats, setStats] = useState<ClientStats>({
    total: 0,
    simples: 0,
    presumido: 0,
    real: 0,
    ativos: 0,
    entradasMes: 0,
    saidasMes: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clients')
        .select('regime_tributario, is_active, data_entrada, data_saida');

      if (error) throw error;

      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

      const counts = {
        total: data?.length || 0,
        simples: data?.filter(c => c.regime_tributario === 'simples').length || 0,
        presumido: data?.filter(c => c.regime_tributario === 'presumido').length || 0,
        real: data?.filter(c => c.regime_tributario === 'real').length || 0,
        ativos: data?.filter(c => c.is_active !== false).length || 0,
        entradasMes: data?.filter(c => c.data_entrada && c.data_entrada >= firstDayOfMonth).length || 0,
        saidasMes: data?.filter(c => !c.is_active && c.data_saida && c.data_saida >= firstDayOfMonth).length || 0,
      };

      setStats(counts);
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchStats();
  }, []);

  return { stats, loading, refetch: fetchStats };
}
