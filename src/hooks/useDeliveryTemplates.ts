import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DeliveryTemplate {
    id: string;
    regime: string;
    type: string;
    due_day: number;
    competency_rule: 'previous_month' | 'current_month' | 'quarterly' | 'annual';
    created_at: string;
}

export function useDeliveryTemplates() {
    const [templates, setTemplates] = useState<DeliveryTemplate[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTemplates = async () => {
        try {
            setLoading(true);
            // @ts-ignore
            const { data, error } = await supabase
                .from('delivery_templates')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setTemplates((data as any[]) || []);
        } catch (err) {
            console.error('Erro ao buscar templates:', err);
        } finally {
            setLoading(false);
        }
    };

    const createTemplate = async (template: Omit<DeliveryTemplate, 'id' | 'created_at'>) => {
        try {
            // @ts-ignore
            const { data, error } = await supabase
                .from('delivery_templates')
                .insert([template])
                .select()
                .single();

            if (error) throw error;
            setTemplates(prev => [data as any, ...prev]);
            toast.success('Template criado com sucesso');
            return data;
        } catch (err) {
            console.error('Erro ao criar template:', err);
            toast.error('Erro ao salvar template');
            throw err;
        }
    };

    const deleteTemplate = async (id: string) => {
        try {
            // @ts-ignore
            const { error } = await supabase
                .from('delivery_templates')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setTemplates(prev => prev.filter(t => t.id !== id));
            toast.success('Template removido');
        } catch (err) {
            console.error('Erro ao excluir template:', err);
        }
    };

    const updateTemplate = async (id: string, updates: Partial<Omit<DeliveryTemplate, 'id' | 'created_at'>>) => {
        try {
            // @ts-ignore
            const { data, error } = await supabase
                .from('delivery_templates')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            setTemplates(prev => prev.map(t => t.id === id ? (data as any) : t));
            toast.success('Template atualizado com sucesso');
            return data;
        } catch (err) {
            console.error('Erro ao atualizar template:', err);
            toast.error('Erro ao atualizar template');
            throw err;
        }
    };

    useEffect(() => {
        fetchTemplates();
    }, []);

    return {
        templates,
        loading,
        createTemplate,
        updateTemplate,
        deleteTemplate,
        refreshTemplates: fetchTemplates
    };
}
