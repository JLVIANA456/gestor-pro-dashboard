import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type Department = 'dp' | 'fiscal' | 'contabil' | 'financeiro' | 'qualidade';

export interface Technician {
    id: string;
    name: string;
    department: Department;
    createdAt: string;
}

interface DbTechnician {
    id: string;
    name: string;
    department: Department;
    created_at: string;
}

const mapDbToTechnician = (db: DbTechnician): Technician => ({
    id: db.id,
    name: db.name,
    department: db.department,
    createdAt: db.created_at,
});

export function useTechnicians() {
    const [technicians, setTechnicians] = useState<Technician[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTechnicians = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('technicians' as any)
                .select('*')
                .order('name', { ascending: true });

            if (error) throw error;
            setTechnicians((data as unknown as DbTechnician[]).map(mapDbToTechnician));
        } catch (error) {
            console.error('Erro ao buscar responsáveis:', error);
            toast.error('Erro ao carregar responsáveis técnicos');
        } finally {
            setLoading(false);
        }
    };

    const addTechnician = async (name: string, department: Department) => {
        try {
            const { data, error } = await supabase
                .from('technicians' as any)
                .insert([{ name, department }] as any)
                .select()
                .single();

            if (error) throw error;
            const newTech = mapDbToTechnician(data as unknown as DbTechnician);
            setTechnicians(prev => [...prev, newTech].sort((a, b) => a.name.localeCompare(b.name)));
            toast.success('Responsável adicionado com sucesso!');
            return newTech;
        } catch (error) {
            console.error('Erro ao adicionar responsável:', error);
            toast.error('Erro ao adicionar responsável');
            throw error;
        }
    };

    const updateTechnician = async (id: string, name: string, department: Department) => {
        try {
            const { data, error } = await supabase
                .from('technicians' as any)
                .update({ name, department } as any)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            const updatedTech = mapDbToTechnician(data as unknown as DbTechnician);
            setTechnicians(prev => prev.map(t => t.id === id ? updatedTech : t).sort((a, b) => a.name.localeCompare(b.name)));
            toast.success('Responsável atualizado com sucesso!');
            return updatedTech;
        } catch (error) {
            console.error('Erro ao atualizar responsável:', error);
            toast.error('Erro ao atualizar responsável');
            throw error;
        }
    };

    const deleteTechnician = async (id: string) => {
        try {
            const { error } = await supabase
                .from('technicians' as any)
                .delete()
                .eq('id', id);

            if (error) throw error;
            setTechnicians(prev => prev.filter(t => t.id !== id));
            toast.success('Responsável removido com sucesso!');
        } catch (error) {
            console.error('Erro ao remover responsável:', error);
            toast.error('Erro ao remover responsável');
            throw error;
        }
    };

    useEffect(() => {
        fetchTechnicians();
    }, []);

    return {
        technicians,
        loading,
        addTechnician,
        updateTechnician,
        deleteTechnician,
        fetchTechnicians
    };
}
