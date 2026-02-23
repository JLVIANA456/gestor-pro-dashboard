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
  recentExits: Array<{
    id: string;
    nome: string;
    motivo: string;
    dataSaida: string;
  }>;
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
    recentExits: [],
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clients')
        .select('id, razao_social, nome_fantasia, regime_tributario, is_active, data_entrada, data_saida, motivo_saida')
        .order('data_saida', { ascending: false }); // Sort by data_saida to get recent ones easily

      if (error) throw error;

      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

      const counts = {
        total: data?.filter(c => c.is_active !== false).length || 0,
        simples: data?.filter(c => c.is_active !== false && c.regime_tributario === 'simples').length || 0,
        presumido: data?.filter(c => c.is_active !== false && c.regime_tributario === 'presumido').length || 0,
        real: data?.filter(c => c.is_active !== false && c.regime_tributario === 'real').length || 0,
        ativos: data?.filter(c => c.is_active !== false).length || 0,
        entradasMes: data?.filter(c => c.data_entrada && c.data_entrada >= firstDayOfMonth).length || 0,
        saidasMes: data?.filter(c => c.data_saida).length || 0,
        recentExits: data?.filter(c => !c.is_active && c.data_saida)
          .sort((a, b) => new Date(b.data_saida!).getTime() - new Date(a.data_saida!).getTime())
          .slice(0, 5) // Get top 5 recent exits overall
          .map(c => ({
            id: c.id,
            nome: c.nome_fantasia || c.razao_social,
            motivo: c.motivo_saida || 'Motivo não informado',
            dataSaida: c.data_saida!,
          })) || [],
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
