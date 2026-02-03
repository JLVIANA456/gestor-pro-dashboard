import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ClientStats {
  total: number;
  simples: number;
  presumido: number;
  real: number;
  ativos: number;
}

export function useClientStats() {
  const [stats, setStats] = useState<ClientStats>({
    total: 0,
    simples: 0,
    presumido: 0,
    real: 0,
    ativos: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clients')
        .select('id, regime_tributario');

      if (error) throw error;

      const counts = {
        total: data?.length || 0,
        simples: data?.filter(c => c.regime_tributario === 'simples').length || 0,
        presumido: data?.filter(c => c.regime_tributario === 'presumido').length || 0,
        real: data?.filter(c => c.regime_tributario === 'real').length || 0,
        ativos: data?.length || 0,
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
