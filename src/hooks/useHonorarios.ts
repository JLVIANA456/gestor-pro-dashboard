import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// ---- Types ----
export type PaymentStatus = 'PAID' | 'PENDING' | 'LATE';
export type PaymentMethod = 'PIX' | 'BOLETO' | 'TRANSFER' | 'CARD' | 'OTHER';

export interface HonorariosConfig {
    id: string;
    clientId: string;
    standardAmount: number;
}

export interface HonorariosPayment {
    id: string;
    clientId: string;
    month: number;
    year: number;
    amountBilled: number;
    amountPaid: number;
    status: PaymentStatus;
    paymentDate?: string;
    paymentMethod?: PaymentMethod;
    notes?: string;
}

export interface HonorariosTicket {
    id: string;
    clientId: string;
    serviceName: string;
    price: number;
    month: number;
    year: number;
    status: PaymentStatus;
    paidAt?: string;
    requestedAt?: string;
}

// ---- DB row types ----
interface DbConfig {
    id: string;
    client_id: string;
    standard_amount: number;
}

interface DbPayment {
    id: string;
    client_id: string;
    month: number;
    year: number;
    amount_billed: number;
    amount_paid: number;
    status: PaymentStatus;
    payment_date: string | null;
    payment_method: PaymentMethod | null;
    notes: string | null;
}

interface DbTicket {
    id: string;
    client_id: string;
    service_name: string;
    price: number;
    month: number;
    year: number;
    status: PaymentStatus;
    paid_at: string | null;
    requested_at: string | null;
}

// ---- Map functions ----
const mapConfig = (db: DbConfig): HonorariosConfig => ({
    id: db.id,
    clientId: db.client_id,
    standardAmount: db.standard_amount,
});

const mapPayment = (db: DbPayment): HonorariosPayment => ({
    id: db.id,
    clientId: db.client_id,
    month: db.month,
    year: db.year,
    amountBilled: db.amount_billed,
    amountPaid: db.amount_paid,
    status: db.status,
    paymentDate: db.payment_date ?? undefined,
    paymentMethod: db.payment_method ?? undefined,
    notes: db.notes ?? undefined,
});

const mapTicket = (db: DbTicket): HonorariosTicket => ({
    id: db.id,
    clientId: db.client_id,
    serviceName: db.service_name,
    price: db.price,
    month: db.month,
    year: db.year,
    status: db.status,
    paidAt: db.paid_at ?? undefined,
    requestedAt: db.requested_at ?? undefined,
});

// ---- Hook ----
export function useHonorarios() {
    const [configs, setConfigs] = useState<HonorariosConfig[]>([]);
    const [payments, setPayments] = useState<HonorariosPayment[]>([]);
    const [tickets, setTickets] = useState<HonorariosTicket[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const [cfgRes, payRes, tktRes] = await Promise.all([
                supabase.from('honorarios_config').select('*'),
                supabase.from('honorarios_payments').select('*').order('year', { ascending: false }).order('month', { ascending: false }),
                supabase.from('honorarios_tickets').select('*').order('created_at', { ascending: false }),
            ]);

            if (cfgRes.error) throw cfgRes.error;
            if (payRes.error) throw payRes.error;
            if (tktRes.error) throw tktRes.error;

            setConfigs((cfgRes.data as unknown as DbConfig[]).map(mapConfig));
            setPayments((payRes.data as unknown as DbPayment[]).map(mapPayment));
            setTickets((tktRes.data as unknown as DbTicket[]).map(mapTicket));
        } catch (err: any) {
            console.error('Erro ao carregar honorários:', err);
            toast.error('Erro ao carregar dados de honorários', { description: err.message });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    // ---- Config (valor base por cliente) ----
    const upsertConfig = async (clientId: string, standardAmount: number) => {
        const { data, error } = await supabase
            .from('honorarios_config')
            .upsert({ client_id: clientId, standard_amount: standardAmount }, { onConflict: 'client_id' })
            .select()
            .single();

        if (error) { toast.error('Erro ao salvar valor base'); throw error; }
        const mapped = mapConfig(data as unknown as DbConfig);
        setConfigs(prev => {
            const exists = prev.find(c => c.clientId === clientId);
            return exists ? prev.map(c => c.clientId === clientId ? mapped : c) : [...prev, mapped];
        });
        return mapped;
    };

    const getConfig = (clientId: string) => configs.find(c => c.clientId === clientId);

    // ---- Payments ----
    const upsertPayment = async (data: Omit<HonorariosPayment, 'id'> & { id?: string }) => {
        const dbData = {
            client_id: data.clientId,
            month: data.month,
            year: data.year,
            amount_billed: data.amountBilled,
            amount_paid: data.amountPaid,
            status: data.status,
            payment_date: data.paymentDate || null,
            payment_method: data.paymentMethod || null,
            notes: data.notes || null,
        };

        const { data: result, error } = await supabase
            .from('honorarios_payments')
            .upsert(data.id && data.id !== '' ? { id: data.id, ...dbData } : dbData,
                { onConflict: 'client_id,month,year' })
            .select()
            .single();

        if (error) { toast.error('Erro ao salvar pagamento'); throw error; }
        const mapped = mapPayment(result as unknown as DbPayment);
        setPayments(prev => {
            const exists = prev.find(p => p.clientId === data.clientId && p.month === data.month && p.year === data.year);
            return exists ? prev.map(p => (p.clientId === data.clientId && p.month === data.month && p.year === data.year) ? mapped : p) : [...prev, mapped];
        });
        toast.success('Pagamento salvo!');
        return mapped;
    };

    const getPayment = (clientId: string, month: number, year: number) =>
        payments.find(p => p.clientId === clientId && p.month === month && p.year === year);

    // ---- Tickets ----
    const createTicket = async (data: Omit<HonorariosTicket, 'id'>) => {
        const { data: result, error } = await supabase
            .from('honorarios_tickets')
            .insert({
                client_id: data.clientId,
                service_name: data.serviceName,
                price: data.price,
                month: data.month,
                year: data.year,
                status: 'PENDING',
                requested_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) { toast.error('Erro ao adicionar recálculo'); throw error; }
        const mapped = mapTicket(result as unknown as DbTicket);
        setTickets(prev => [mapped, ...prev]);
        toast.success('Recálculo adicionado!');
        return mapped;
    };

    const updateTicketStatus = async (id: string, status: PaymentStatus) => {
        const { error } = await supabase
            .from('honorarios_tickets')
            .update({ status, paid_at: status === 'PAID' ? new Date().toISOString() : null })
            .eq('id', id);

        if (error) { toast.error('Erro ao atualizar recálculo'); throw error; }
        setTickets(prev => prev.map(t => t.id === id ? { ...t, status, paidAt: status === 'PAID' ? new Date().toISOString() : undefined } : t));
    };

    const deleteTicket = async (id: string) => {
        const { error } = await supabase.from('honorarios_tickets').delete().eq('id', id);
        if (error) { toast.error('Erro ao excluir recálculo'); throw error; }
        setTickets(prev => prev.filter(t => t.id !== id));
        toast.success('Recálculo removido');
    };

    return {
        configs, payments, tickets, loading,
        fetchAll,
        upsertConfig, getConfig,
        upsertPayment, getPayment,
        createTicket, updateTicketStatus, deleteTicket,
    };
}
