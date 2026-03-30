import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ManagementStats {
  entregas: {
    total: number;
    antecipadas: number;
    prazoTecnico: number;
    atrasadas: number;
    comMulta: number;
    atrasoJustificado: number;
  };
  aRealizar: {
    total: number;
    prazoAntecipado: number;
    prazoTecnico: number;
    atrasoLegal: number;
    comMulta: number;
    atrasoJustificado: number;
  };
  docs: {
    total: number;
    lidos: number;
    naoLidos: number;
  };
  processos: {
    total: number;
    iniciados: number;
    concluidos: number;
    passosOk: number;
    followUpEnviados: number;
  };
}

export function useManagementStats() {
  const [stats, setStats] = useState<ManagementStats>({
    entregas: { total: 0, antecipadas: 0, prazoTecnico: 0, atrasadas: 0, comMulta: 0, atrasoJustificado: 0 },
    aRealizar: { total: 0, prazoAntecipado: 0, prazoTecnico: 0, atrasoLegal: 0, comMulta: 0, atrasoJustificado: 0 },
    docs: { total: 0, lidos: 0, naoLidos: 0 },
    processos: { total: 0, iniciados: 0, concluidos: 0, passosOk: 0, followUpEnviados: 0 }
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const now = new Date();
      const currentMonth = now.toISOString().split('T')[0].substring(0, 7); // YYYY-MM

      // 1. Fetch Deliveries (Accounting Guides)
      const { data: guides, error: guidesError } = await (supabase as any)
        .from('accounting_guides')
        .select('*')
        .eq('reference_month', currentMonth);

      if (!guidesError && guides) {
        const entregasArr = guides.filter((g: any) => g.status === 'sent' || g.status === 'completed' || g.delivered_at);
        const aRealizarArr = guides.filter((g: any) => g.status === 'pending' || g.status === 'scheduled');

        const entregas = {
          total: entregasArr.length,
          antecipadas: entregasArr.filter((g: any) => g.delivered_at && g.due_date && new Date(g.delivered_at) < new Date(g.due_date)).length,
          prazoTecnico: entregasArr.filter((g: any) => !g.justification).length, // Placeholder logic
          atrasadas: entregasArr.filter((g: any) => g.delivered_at && g.due_date && new Date(g.delivered_at) > new Date(g.due_date)).length,
          comMulta: entregasArr.filter((g: any) => g.status === 'expired').length,
          atrasoJustificado: entregasArr.filter((g: any) => g.justification).length,
        };

        const aRealizar = {
          total: aRealizarArr.length,
          prazoAntecipado: aRealizarArr.filter((g: any) => g.due_date && new Date(g.due_date) > new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)).length,
          prazoTecnico: aRealizarArr.filter((g: any) => g.due_date && new Date(g.due_date) <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)).length,
          atrasoLegal: aRealizarArr.filter((g: any) => g.due_date && new Date(g.due_date) < now).length,
          comMulta: aRealizarArr.filter((g: any) => g.due_date && new Date(g.due_date) < now && g.status === 'pending').length,
          atrasoJustificado: aRealizarArr.filter((g: any) => g.justification).length,
        };

        setStats(prev => ({ ...prev, entregas, aRealizar }));
      }

      // 2. Fetch Documents
      const { data: docs, error: docsError } = await supabase
        .from('client_documents')
        .select('is_read')
        .eq('category', 'entrada'); // Or adjust based on how documents are identified

      if (!docsError && docs) {
        setStats(prev => ({
          ...prev,
          docs: {
            total: docs.length,
            lidos: docs.filter(d => d.is_read).length,
            naoLidos: docs.filter(d => !d.is_read).length,
          }
        }));
      }

      // 3. Fetch Processes (Closings)
      const { data: closings, error: closingsError } = await (supabase as any)
        .from('accounting_closings')
        .select('*')
        .eq('mes_ano_fechamento', currentMonth + '-01');

      if (!closingsError && closings) {
        setStats(prev => ({
          ...prev,
          processos: {
            total: closings.length,
            iniciados: closings.filter((c: any) => c.empresa_em_andamento).length,
            concluidos: closings.filter((c: any) => c.empresa_encerrada).length,
            passosOk: closings.filter((c: any) => c.conciliacao_contabil && c.controle_lucros).length,
            followUpEnviados: 0 // Logic to be defined or static
          }
        }));
      }

    } catch (error) {
      console.error('Error fetching management stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return { stats, loading, refetch: fetchStats };
}
