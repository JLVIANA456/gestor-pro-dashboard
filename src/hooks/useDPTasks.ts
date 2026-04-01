import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { differenceInDays, format, isAfter, isBefore, isSameDay, addDays, subDays } from 'date-fns';

export type DPTaskType = 'admissao' | 'rescisao' | 'ferias' | 'rescisao_complementar' | 'recalculo' | 'levantamento_debitos';
export type DPTaskStatus = 'PENDENTE' | 'CONCLUIDO';
export type SLAStatus = 'NO_PRAZO' | 'EM_RISCO' | 'ATRASADO' | 'FUTURO';

export interface DPTask {
    id: string;
    clientId: string;
    empresaNome?: string;
    colaboradorNome: string;
    tipoProcesso: DPTaskType;
    dataBase: string; // ISO date
    dataEnvio: string | null;
    prazo: string;
    dataPagamento: string | null;
    responsavelId: string | null;
    responsavelNome?: string;
    status: DPTaskStatus;
    criadoEm: string;
    // Computed fields
    slaStatus?: SLAStatus;
    atrasoDias?: number;
}

export function useDPTasks() {
    const [tasks, setTasks] = useState<DPTask[]>([]);
    const [loading, setLoading] = useState(true);

    const calculateSLA = (task: DPTask): { slaStatus: SLAStatus; atrasoDias: number } => {
        const hoje = new Date();
        const prazoDate = new Date(task.prazo);
        const envioDate = task.dataEnvio ? new Date(task.dataEnvio) : null;
        
        let slaStatus: SLAStatus = 'NO_PRAZO';
        let atrasoDias = 0;

        if (!envioDate) {
            if (isAfter(hoje, prazoDate) && !isSameDay(hoje, prazoDate)) {
                slaStatus = 'ATRASADO';
                atrasoDias = differenceInDays(hoje, prazoDate);
            } else if (isSameDay(hoje, prazoDate)) {
                slaStatus = 'EM_RISCO';
            } else {
                slaStatus = 'FUTURO';
            }
        } else {
            if (isAfter(envioDate, prazoDate) && !isSameDay(envioDate, prazoDate)) {
                slaStatus = 'ATRASADO';
                atrasoDias = differenceInDays(envioDate, prazoDate);
            } else {
                slaStatus = 'NO_PRAZO';
            }
        }

        return { slaStatus, atrasoDias };
    };

    const fetchTasks = useCallback(async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('dp_demands' as any)
                .select(`
                    *,
                    clients (razao_social, nome_fantasia),
                    technicians (name)
                `)
                .order('prazo', { ascending: true });

            if (error) throw error;

            const mappedTasks: DPTask[] = (data as any[]).map(item => {
                const task: DPTask = {
                    id: item.id,
                    clientId: item.client_id,
                    empresaNome: item.clients?.nome_fantasia || item.clients?.razao_social,
                    colaboradorNome: item.colaborador_nome,
                    tipoProcesso: item.tipo_processo,
                    dataBase: item.data_base,
                    dataEnvio: item.data_envio,
                    prazo: item.prazo,
                    dataPagamento: item.data_pagamento,
                    responsavelId: item.responsavel_id,
                    responsavelNome: item.technicians?.name,
                    status: item.status,
                    criadoEm: item.criado_em,
                };
                
                const { slaStatus, atrasoDias } = calculateSLA(task);
                return { ...task, slaStatus, atrasoDias };
            });

            setTasks(mappedTasks);
        } catch (error) {
            console.error('Erro ao buscar tarefas:', error);
            toast.error('Erro ao carregar demandas do DP');
        } finally {
            setLoading(false);
        }
    }, []);

    const createTask = async (taskData: Omit<DPTask, 'id' | 'criadoEm'>) => {
        try {
            const { data, error } = await supabase
                .from('dp_demands' as any)
                .insert([{
                    client_id: taskData.clientId,
                    colaborador_nome: taskData.colaboradorNome,
                    tipo_processo: taskData.tipoProcesso,
                    data_base: taskData.dataBase,
                    data_envio: taskData.dataEnvio,
                    prazo: taskData.prazo,
                    data_pagamento: taskData.dataPagamento,
                    responsavel_id: taskData.responsavelId,
                    status: taskData.status
                }] as any)
                .select()
                .single();

            if (error) throw error;
            toast.success('Demanda criada com sucesso!');
            fetchTasks();
            return data;
        } catch (error) {
            console.error('Erro ao criar tarefa:', error);
            toast.error('Erro ao criar demanda');
            throw error;
        }
    };

    const updateTask = async (id: string, taskData: Partial<DPTask>) => {
        try {
            const updatePayload: any = {};
            if (taskData.clientId) updatePayload.client_id = taskData.clientId;
            if (taskData.colaboradorNome) updatePayload.colaborador_nome = taskData.colaboradorNome;
            if (taskData.tipoProcesso) updatePayload.tipo_processo = taskData.tipoProcesso;
            if (taskData.dataBase) updatePayload.data_base = taskData.dataBase;
            if (taskData.dataEnvio !== undefined) updatePayload.data_envio = taskData.dataEnvio;
            if (taskData.prazo) updatePayload.prazo = taskData.prazo;
            if (taskData.dataPagamento !== undefined) updatePayload.data_pagamento = taskData.dataPagamento;
            if (taskData.responsavelId !== undefined) updatePayload.responsavel_id = taskData.responsavelId;
            if (taskData.status) updatePayload.status = taskData.status;

            const { error } = await supabase
                .from('dp_demands' as any)
                .update(updatePayload)
                .eq('id', id);

            if (error) throw error;
            toast.success('Demanda atualizada!');
            fetchTasks();
        } catch (error) {
            console.error('Erro ao atualizar tarefa:', error);
            toast.error('Erro ao atualizar demanda');
            throw error;
        }
    };

    const deleteTask = async (id: string) => {
        try {
            const { error } = await supabase
                .from('dp_demands' as any)
                .delete()
                .eq('id', id);

            if (error) throw error;
            toast.success('Demanda removida!');
            setTasks(prev => prev.filter(t => t.id !== id));
        } catch (error) {
            console.error('Erro ao remover tarefa:', error);
            toast.error('Erro ao remover demanda');
        }
    };

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    return {
        tasks,
        loading,
        createTask,
        updateTask,
        deleteTask,
        refresh: fetchTasks
    };
}
