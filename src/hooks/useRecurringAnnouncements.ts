import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface RecurringAnnouncement {
    id: string;
    created_at: string;
    department: string;
    recipient: string;
    subject: string;
    content: string;
    send_day: number;
    last_sent_at: string | null;
    active: boolean;
    folder_id: string | null;
    client_id: string | null;
    client?: {
        nome_fantasia: string;
        razao_social: string;
    } | null;
    sender_ip: string | null;
}

export function useRecurringAnnouncements() {
    const [announcements, setAnnouncements] = useState<RecurringAnnouncement[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAll = useCallback(async () => {
        try {
            setLoading(true);
            const { data, error } = await (supabase
                .from('recurring_announcements' as any) as any)
                .select('*, client:clients(nome_fantasia, razao_social)')
                .order('send_day', { ascending: true });

            if (error) throw error;
            setAnnouncements(data || []);
        } catch (err) {
            console.error('Error fetching recurring announcements:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    const createRecurring = async (announcement: Partial<RecurringAnnouncement>) => {
        try {
            const { data, error } = await (supabase
                .from('recurring_announcements' as any) as any)
                .insert(announcement)
                .select()
                .single();

            if (error) throw error;
            setAnnouncements(prev => [data, ...prev]);
            toast.success("Comunicado recorrente ativado!");
            return data;
        } catch (error) {
            console.error('Error creating recurring:', error);
            toast.error("Erro ao ativar recorrência.");
            return null;
        }
    };

    const updateRecurring = async (id: string, updates: Partial<RecurringAnnouncement>) => {
        try {
            const { data, error } = await (supabase
                .from('recurring_announcements' as any) as any)
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            setAnnouncements(prev => prev.map(a => a.id === id ? data : a));
            toast.success("Configuração atualizada.");
            return data;
        } catch (error) {
            console.error('Error updating recurring:', error);
            toast.error("Erro ao atualizar.");
            return null;
        }
    };

    const deleteRecurring = async (id: string) => {
        try {
            const { error } = await (supabase
                .from('recurring_announcements' as any) as any)
                .delete()
                .eq('id', id);

            if (error) throw error;
            setAnnouncements(prev => prev.filter(a => a.id !== id));
            toast.success("Recorrência removida.");
            return true;
        } catch (error) {
            console.error('Error deleting recurring:', error);
            toast.error("Erro ao excluir.");
            return false;
        }
    };

    return {
        announcements,
        loading,
        createRecurring,
        updateRecurring,
        deleteRecurring,
        refresh: fetchAll
    };
}
