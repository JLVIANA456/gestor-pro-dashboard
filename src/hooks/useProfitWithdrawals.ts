import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Client } from '@/hooks/useClients';

export interface ProfitWithdrawal {
    id: string;
    client_id: string;
    partner_name: string;
    partner_cpf: string;
    withdrawal_date: string;
    amount: number;
    bank?: string | null;
    observations?: string | null;
    created_at?: string;
    updated_at?: string;
    // Join data
    client?: {
        razao_social: string;
        nome_fantasia: string;
    } | null;
}

export type NewWithdrawal = Omit<ProfitWithdrawal, 'id' | 'client' | 'created_at' | 'updated_at'>;

export function useProfitWithdrawals() {
    const [withdrawals, setWithdrawals] = useState<ProfitWithdrawal[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchWithdrawals = async () => {
        try {
            setLoading(true);
            setError(null);

            const { data, error: supabaseError } = await supabase
                .from('profit_withdrawals')
                .select(`
                    *,
                    client:clients (
                        razao_social,
                        nome_fantasia
                    )
                `)
                .order('withdrawal_date', { ascending: false });

            if (supabaseError) {
                console.error('Supabase error:', supabaseError);
                throw supabaseError;
            }

            setWithdrawals((data as unknown as ProfitWithdrawal[]) || []);
        } catch (err: any) {
            console.error('Erro ao buscar retiradas de lucro:', err);
            const msg = err?.message || 'Erro ao carregar retiradas de lucro';
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const createWithdrawal = async (withdrawalData: NewWithdrawal) => {
        try {
            const { data, error: supabaseError } = await supabase
                .from('profit_withdrawals')
                .insert([withdrawalData as any])
                .select(`
                    *,
                    client:clients (
                        razao_social,
                        nome_fantasia
                    )
                `)
                .single();

            if (supabaseError) throw supabaseError;

            const newItem = data as unknown as ProfitWithdrawal;
            setWithdrawals(prev => [newItem, ...prev]);
            toast.success('Retirada registrada com sucesso!');
            return newItem;
        } catch (err: any) {
            console.error('Erro ao criar retirada:', err);
            toast.error(err?.message || 'Erro ao registrar retirada');
            throw err;
        }
    };

    const updateWithdrawal = async (id: string, withdrawalData: Partial<ProfitWithdrawal>) => {
        try {
            // Remove join fields before update
            const { client, ...updateData } = withdrawalData as any;

            const { data, error: supabaseError } = await supabase
                .from('profit_withdrawals')
                .update(updateData)
                .eq('id', id)
                .select(`
                    *,
                    client:clients (
                        razao_social,
                        nome_fantasia
                    )
                `)
                .single();

            if (supabaseError) throw supabaseError;

            const updated = data as unknown as ProfitWithdrawal;
            setWithdrawals(prev => prev.map(w => w.id === id ? updated : w));
            toast.success('Retirada atualizada com sucesso!');
            return updated;
        } catch (err: any) {
            console.error('Erro ao atualizar retirada:', err);
            toast.error(err?.message || 'Erro ao atualizar retirada');
            throw err;
        }
    };

    const deleteWithdrawal = async (id: string) => {
        try {
            const { error: supabaseError } = await supabase
                .from('profit_withdrawals')
                .delete()
                .eq('id', id);

            if (supabaseError) throw supabaseError;

            setWithdrawals(prev => prev.filter(w => w.id !== id));
            toast.success('Retirada excluída com sucesso!');
        } catch (err: any) {
            console.error('Erro ao excluir retirada:', err);
            toast.error(err?.message || 'Erro ao excluir retirada');
            throw err;
        }
    };

    const importWithdrawals = async (withdrawalsData: NewWithdrawal[]) => {
        try {
            const { data, error: supabaseError } = await supabase
                .from('profit_withdrawals')
                .insert(withdrawalsData as any[])
                .select(`
                    *,
                    client:clients (
                        razao_social,
                        nome_fantasia
                    )
                `);

            if (supabaseError) throw supabaseError;

            const imported = (data as unknown as ProfitWithdrawal[]) || [];
            setWithdrawals(prev => [...imported, ...prev]);
            toast.success(`${imported.length} retirada(s) importada(s) com sucesso!`);
            return imported;
        } catch (err: any) {
            console.error('Erro ao importar retiradas:', err);
            toast.error(err?.message || 'Erro ao importar retiradas');
            throw err;
        }
    };

    useEffect(() => {
        fetchWithdrawals();
    }, []);

    return {
        withdrawals,
        loading,
        error,
        fetchWithdrawals,
        createWithdrawal,
        updateWithdrawal,
        deleteWithdrawal,
        importWithdrawals
    };
}
