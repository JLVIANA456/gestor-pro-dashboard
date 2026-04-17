import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, subMonths } from 'date-fns';

export interface ObligationStat {
  type: string;
  total: number;
  completed: number;
  pending: number;
}

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
  breakdown: ObligationStat[];
  rawData: {
    guides: any[];
    docs: any[];
    closings: any[];
  }
}

export function useManagementStats() {
  const [stats, setStats] = useState<ManagementStats>({
    entregas: { total: 0, antecipadas: 0, prazoTecnico: 0, atrasadas: 0, comMulta: 0, atrasoJustificado: 0 },
    aRealizar: { total: 0, prazoAntecipado: 0, prazoTecnico: 0, atrasoLegal: 0, comMulta: 0, atrasoJustificado: 0 },
    docs: { total: 0, lidos: 0, naoLidos: 0 },
    processos: { total: 0, iniciados: 0, concluidos: 0, passosOk: 0, followUpEnviados: 0 },
    breakdown: [],
    rawData: { guides: [], docs: [], closings: [] }
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const now = new Date();
      const referenceMonth = format(subMonths(now, 1), 'yyyy-MM');

      // 1. Fetch Deliveries (Accounting Guides) with Client Info
      const { data: guides, error: guidesError } = await (supabase as any)
        .from('accounting_guides')
        .select(`
          *,
          client:clients(*)
        `)
        .eq('reference_month', referenceMonth);

      if (!guidesError && guides) {
        const entregasArr = guides.filter((g: any) => g.status === 'sent' || g.status === 'completed' || g.delivered_at);
        const aRealizarArr = guides.filter((g: any) => g.status === 'pending' || g.status === 'scheduled');

        const entregas = {
          total: entregasArr.length,
          antecipadas: entregasArr.filter((g: any) => g.delivered_at && g.due_date && new Date(g.delivered_at) < new Date(g.due_date)).length,
          prazoTecnico: entregasArr.filter((g: any) => !g.justification).length,
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

        const breakdownMap: Record<string, ObligationStat> = {};
        guides.forEach((g: any) => {
          const type = g.type || 'Outros';
          if (!breakdownMap[type]) {
            breakdownMap[type] = { type, total: 0, completed: 0, pending: 0 };
          }
          breakdownMap[type].total++;
          if (g.status === 'sent' || g.status === 'completed' || g.delivered_at) {
            breakdownMap[type].completed++;
          } else {
            breakdownMap[type].pending++;
          }
        });

        const breakdown = Object.values(breakdownMap).sort((a, b) => b.total - a.total);

        setStats(prev => ({ 
            ...prev, 
            entregas, 
            aRealizar, 
            breakdown,
            rawData: { ...prev.rawData, guides }
        }));
      }

      // 2. Fetch Documents with Client Info
      const { data: docs, error: docsError } = await (supabase as any)
        .from('client_documents')
        .select(`
            *,
            client:clients(*)
        `)
        .eq('category', 'entrada');

      if (!docsError && docs) {
        setStats(prev => ({
          ...prev,
          docs: {
            total: docs.length,
            lidos: docs.filter((d: any) => d.is_read).length,
            naoLidos: docs.filter((d: any) => !d.is_read).length,
          },
          rawData: { ...prev.rawData, docs }
        }));
      }

      // 3. Fetch Processes (Closings) with Client Info
      const { data: closings, error: closingsError } = await (supabase as any)
        .from('accounting_closings')
        .select(`
            *,
            client:clients(*)
        `)
        .eq('mes_ano_fechamento', referenceMonth + '-01');

      if (!closingsError && closings) {
        setStats(prev => ({
          ...prev,
          processos: {
            total: closings.length,
            iniciados: closings.filter((c: any) => c.empresa_em_andamento).length,
            concluidos: closings.filter((c: any) => c.empresa_encerrada).length,
            passosOk: closings.filter((c: any) => c.conciliacao_contabil && c.controle_lucros).length,
            followUpEnviados: 0
          },
          rawData: { ...prev.rawData, closings }
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
