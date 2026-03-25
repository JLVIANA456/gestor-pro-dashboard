import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Cast para any para evitar conflitos com tabelas não registradas nos tipos gerados
const sb = supabase as any;

export interface ClientObligation {
    id: string;
    client_id: string;
    obligation_id: string;
    status: 'enabled' | 'disabled';
    created_at: string;
}

export function useClientObligations() {
    const [clientObligations, setClientObligations] = useState<ClientObligation[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchClientObligations = useCallback(async () => {
        try {
            setLoading(true);
            const { data, error } = await sb
                .from('client_obligations')
                .select('*');

            if (error) throw error;
            setClientObligations((data || []) as ClientObligation[]);
        } catch (error: any) {
            console.error('Error fetching client obligations:', error);
            toast.error('Erro ao buscar as exceções de obrigações das empresas.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchClientObligations();
    }, [fetchClientObligations]);

    /**
     * Define o estado de uma obrigação para uma empresa específica.
     * - 'enabled'  → força ativação mesmo fora do regime padrão
     * - 'disabled' → bloqueia geração E apaga tarefas pendentes existentes
     * - 'default'  → remove o override, volta para regra automática
     */
    const setClientObligationState = async (
        client_id: string,
        obligation_id: string,
        state: 'enabled' | 'disabled' | 'default',
        obligationName?: string
    ) => {
        try {
            if (state === 'default') {
                const { error } = await sb
                    .from('client_obligations')
                    .delete()
                    .match({ client_id, obligation_id });
                if (error) throw error;
            } else {
                const { error } = await sb
                    .from('client_obligations')
                    .upsert({ client_id, obligation_id, status: state }, { onConflict: 'client_id,obligation_id' });
                if (error) throw error;

                // Ao DESATIVAR → apaga imediatamente as tarefas pendentes existentes para este par
                if (state === 'disabled' && obligationName) {
                    const { error: delError } = await sb
                        .from('accounting_guides')
                        .delete()
                        .eq('client_id', client_id)
                        .eq('type', obligationName)
                        .eq('status', 'pending');

                    if (delError) {
                        console.error('Erro ao remover tarefas pendentes ao desativar obrigação:', delError);
                        toast.warning('Regra salva, mas não foi possível limpar as tarefas já geradas automaticamente.');
                    }
                }
            }
            await fetchClientObligations();
        } catch (error: any) {
            console.error('Error setting client obligation state:', error);
            toast.error('Erro ao atualizar o vínculo da obrigação.');
            throw error;
        }
    };

    return {
        clientObligations,
        loading,
        setClientObligationState,
        refresh: fetchClientObligations
    };
}
