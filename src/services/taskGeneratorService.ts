import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export class TaskGeneratorService {
    /**
     * Helper to compute the Due Date and Competency str based on an Obligation rules and a Month
     */
    static computeTaskDates(obligation: any, referenceMonth: string) {
        let competencyStr = '';
        const [year, month] = referenceMonth.split('-').map(Number);
        const refDate = new Date(year, month - 1, 1);
        
        if (obligation.competency_rule === 'previous_month') {
            const prevDate = new Date(year, month - 2, 1);
            competencyStr = format(prevDate, 'MM/yyyy');
        } else if (obligation.competency_rule === 'current_month') {
            competencyStr = format(refDate, 'MM/yyyy');
        } else if (obligation.competency_rule === 'quarterly') {
            const q = Math.ceil(month / 3);
            competencyStr = `${q}º Trimestre / ${year}`;
        } else {
            competencyStr = `Ano ${year}`;
        }

        const dueDateCalc = new Date(
            `${referenceMonth}-${obligation.default_due_day?.toString().padStart(2, '0') || '10'}`
        );

        return {
            competency: competencyStr,
            due_date: isNaN(dueDateCalc.getTime()) ? null : dueDateCalc.toISOString()
        };
    }

    /**
     * Quando um CLIENTE NOVO é criado, ele deve receber TODAS as obrigações ativas relevantes deste mês.
     */
    static async generateTasksForNewClient(client: any) {
        if (!client.is_active) return;
        
        const referenceMonth = format(new Date(), 'yyyy-MM');
        
        try {
            // 1. Fetch available obligations
            // @ts-ignore
            const { data: obligations, error: obsError } = await supabase
                .from('obligations')
                .select('*')
                .eq('is_active', true)
                .neq('periodicity', 'eventual');

            if (obsError || !obligations || obligations.length === 0) return;

            // 2. Filter rules (ex: cruzar `client.regime_tributario` com `obligation.tax_regimes`)
            // Para simplificar: se array é vazio ou inclui 'all' ou tem o regime do cliente, gera.
            const matchingObligations = obligations.filter(o => 
                !o.tax_regimes || 
                o.tax_regimes.length === 0 || 
                o.tax_regimes.includes('all') || 
                (client.regime_tributario && o.tax_regimes.includes(client.regime_tributario.toLowerCase()))
            );

            if (matchingObligations.length === 0) return;

            // 3. Mount objects and insert
            const newGuidesToCreate = matchingObligations.map(obligation => {
                const { competency, due_date } = this.computeTaskDates(obligation, referenceMonth);

                return {
                    client_id: client.id,
                    type: obligation.name,
                    reference_month: referenceMonth,
                    competency: competency,
                    due_date: due_date,
                    amount: null,
                    status: 'pending',
                    file_url: null,
                    scheduled_for: null,
                    sent_at: null,
                    delivered_at: null,
                    opened_at: null
                };
            });

            // @ts-ignore
            await supabase.from('accounting_guides').insert(newGuidesToCreate);

        } catch (err) {
            console.error('Erro na geração automática de tarefas para o novo cliente', err);
        }
    }

    /**
     * Quando uma OBRIGAÇÃO NOVA é criada, ela deve ser distribuida para TODOS os clientes relevantes deste mês.
     */
    static async generateTasksForNewObligation(obligation: any) {
        if (!obligation.is_active || obligation.periodicity === 'eventual') return;

        const referenceMonth = format(new Date(), 'yyyy-MM');
        
        try {
            // 1. Fetch available clients
            const { data: clients, error: clientsError } = await supabase
                .from('clients')
                .select('id, regime_tributario')
                .eq('is_active', true);

            if (clientsError || !clients || clients.length === 0) return;

            // 2. Filter clients based on tax_regimes of this new obligation
            const matchingClients = clients.filter(c => {
                const obsRegimes = obligation.tax_regimes || [];
                const clientRegime = c.regime_tributario?.toLowerCase() || '';
                return obsRegimes.length === 0 || 
                       obsRegimes.some((r: string) => r.toLowerCase() === 'all') || 
                       (clientRegime && obsRegimes.some((r: string) => r.toLowerCase() === clientRegime));
            });

            if (matchingClients.length === 0) return;

            // 3. Mount objects and insert
            const { competency, due_date } = this.computeTaskDates(obligation, referenceMonth);

            const newGuidesToCreate = matchingClients.map(c => ({
                client_id: c.id,
                type: obligation.name,
                reference_month: referenceMonth,
                competency: competency,
                due_date: due_date,
                amount: null,
                status: 'pending',
                file_url: null,
                scheduled_for: null,
                sent_at: null,
                delivered_at: null,
                opened_at: null
            }));

            // Chunk insert to avoid Supabase row limits if there are many clients
            const CHUNK_SIZE = 200;
            for (let i = 0; i < newGuidesToCreate.length; i += CHUNK_SIZE) {
                const chunk = newGuidesToCreate.slice(i, i + CHUNK_SIZE);
                // @ts-ignore
                await supabase.from('accounting_guides').insert(chunk);
            }

        } catch (err) {
            console.error('Erro na geração automática de tarefas para a nova obrigação', err);
        }
    }

    /**
     * Sincroniza todas as tarefas de um determinado mês para TODOS os clientes.
     * Útil quando as regras de obrigações mudaram e o usuário quer "re-sincronizar" o mês.
     */
    static async syncTasksForMonth(referenceMonth: string) {
        try {
            // 1. Fetch available clients and obligations
            const { data: clients, error: clientsError } = await supabase
                .from('clients')
                .select('id, regime_tributario')
                .eq('is_active', true);

            const { data: obligations, error: obsError } = await supabase
                .from('obligations')
                .select('*')
                .eq('is_active', true)
                .neq('periodicity', 'eventual');

            if (clientsError || obsError || !clients || !obligations) {
                throw new Error('Erro ao buscar dados para sincronização');
            }

            // 2. Fetch existing guides for this month to avoid duplication
            // @ts-ignore
            const { data: existingGuides, error: guidesError } = await supabase
                .from('accounting_guides')
                .select('id, client_id, type, status')
                .eq('reference_month', referenceMonth);

            if (guidesError) throw guidesError;

            const existingMap = new Set((existingGuides || []).map((g: any) => `${g.client_id}__${g.type.toLowerCase()}`));
            const currentObligationNames = new Set(obligations.map(o => o.name.toLowerCase()));
            const newGuidesToCreate: any[] = [];
            
            // 3. Identify and remove guides that no longer fit current obligations (only if pending)
            const idsToDelete: string[] = [];
            (existingGuides || []).forEach((g: any) => {
                if (g.status === 'pending' && !currentObligationNames.has(g.type.toLowerCase())) {
                    idsToDelete.push(g.id);
                }
            });
            
            if (idsToDelete.length > 0) {
                // @ts-ignore
                await supabase.from('accounting_guides').delete().in('id', idsToDelete);
                // After delete, remove from existingMap so we can recreate if needed (though unlikely if type changed)
                (existingGuides || []).forEach((g: any) => {
                    if (idsToDelete.includes(g.id)) {
                        existingMap.delete(`${g.client_id}__${g.type.toLowerCase()}`);
                    }
                });
            }

            // 4. Compare current rules with existing data
            for (const client of clients) {
                const clientRegime = client.regime_tributario?.toLowerCase() || '';

                for (const obligation of obligations) {
                    const obsRegimes = obligation.tax_regimes || [];
                    const matchesRegime = obsRegimes.length === 0 || 
                                          obsRegimes.some((r: string) => r.toLowerCase() === 'all') || 
                                          (clientRegime && obsRegimes.some((r: string) => r.toLowerCase() === clientRegime));
                    
                    if (!matchesRegime) continue;

                    const key = `${client.id}__${obligation.name.toLowerCase()}`;
                    if (!existingMap.has(key)) {
                        const { competency, due_date } = this.computeTaskDates(obligation, referenceMonth);
                        newGuidesToCreate.push({
                            client_id: client.id,
                            type: obligation.name,
                            reference_month: referenceMonth,
                            competency: competency,
                            due_date: due_date,
                            amount: null,
                            status: 'pending',
                        });
                    }
                }
            }

            // 5. Batch insert new tasks
            if (newGuidesToCreate.length > 0) {
                const CHUNK_SIZE = 200;
                for (let i = 0; i < newGuidesToCreate.length; i += CHUNK_SIZE) {
                    const chunk = newGuidesToCreate.slice(i, i + CHUNK_SIZE);
                    // @ts-ignore
                    const { error: insertErr } = await supabase.from('accounting_guides').insert(chunk);
                    if (insertErr) throw insertErr;
                }
            }

            return {
                created: newGuidesToCreate.length,
                deleted: idsToDelete.length
            };
        } catch (err) {
            console.error('Erro na sincronização de tarefas', err);
            throw err;
        }
    }
}
