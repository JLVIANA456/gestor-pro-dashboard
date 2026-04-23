import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type PortalContentType = 'boas_praticas' | 'avisos_oficiais' | 'prazos_importantes' | 'videos_treinamentos' | 'reforma_tributaria';

export interface PortalContent {
    id: string;
    type: PortalContentType;
    title: string;
    content: string | null;
    video_url: string | null;
    due_date: string | null;
    target_client_ids: string[] | null;
    created_at: string;
}

export function usePortalContent() {
    const [loading, setLoading] = useState(false);
    const [contentList, setContentList] = useState<PortalContent[]>([]);

    const fetchContent = useCallback(async (type?: PortalContentType) => {
        try {
            setLoading(true);
            const sb = supabase as any;
            
            let query = sb.from('portal_content').select('*').order('created_at', { ascending: false });
            
            if (type) {
                query = query.eq('type', type);
            }

            const { data, error } = await query;

            if (error) {
                // If table doesn't exist, ignore the error and return empty to avoid crashing before SQL is run
                if (error.code !== '42P01') {
                    console.error("Error fetching portal content:", error);
                }
                setContentList([]);
                return [];
            }

            setContentList(data || []);
            return data || [];
        } catch (err) {
            console.error("Error in fetchContent:", err);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    const addContent = async (item: Omit<PortalContent, 'id' | 'created_at'>) => {
        try {
            const sb = supabase as any;
            const { data, error } = await sb
                .from('portal_content')
                .insert(item)
                .select()
                .single();

            if (error) {
                throw error;
            }

            setContentList(prev => [data, ...prev]);
            toast.success('Conteúdo adicionado com sucesso!');
            return data;
        } catch (err: any) {
            console.error("Error adding portal content:", err);
            if (err.code === '42P01') {
                 toast.error('Tabela portal_content não existe. Por favor, execute o SQL.');
            } else {
                 toast.error('Erro ao adicionar conteúdo.');
            }
            return null;
        }
    };

    const deleteContent = async (id: string) => {
        try {
            const sb = supabase as any;
            const { error } = await sb
                .from('portal_content')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setContentList(prev => prev.filter(c => c.id !== id));
            toast.success('Conteúdo removido com sucesso!');
            return true;
        } catch (err) {
            console.error("Error deleting portal content:", err);
            toast.error('Erro ao remover conteúdo.');
            return false;
        }
    };

    return {
        contentList,
        loading,
        fetchContent,
        addContent,
        deleteContent
    };
}
