import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ResendService } from '@/services/resendService';
import { BrandingService } from '@/services/brandingService';
import { format, isToday, isBefore, parseISO, startOfToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export type DispatchStatus = 'pendente' | 'agendado' | 'enviado' | 'entregue' | 'lido' | 'aguardando_retorno' | 'respondido' | 'erro' | 'vencido' | 'cancelado';
export type DispatchChannel = 'email' | 'portal' | 'whatsapp' | 'manual';
export type DispatchProcess = 'admissao' | 'rescisao' | 'ferias' | 'folha' | 'beneficios' | 'esocial' | 'outros';

export interface DPDispatch {
    id: string;
    clientId: string;
    empresaNome?: string;
    colaboradorNome: string | null;
    tipoProcesso: DispatchProcess;
    tipoDocumento: string;
    descricao: string | null;
    canal: DispatchChannel;
    destinatario: string | null;
    status: DispatchStatus;
    dataPrevista: string | null;
    dataEfetiva: string | null;
    responsavelId: string | null;
    responsavelNome?: string;
    anexoUrl: string | null;
    mensagem: string | null;
    lido: boolean;
    observacoes: string | null;
    errorMessage: string | null;
    resendId: string | null;
    valor: number | null;
    dataVencimento: string | null;
    criadoEm: string;
}

export function useDPDispatches() {
    const [dispatches, setDispatches] = useState<DPDispatch[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchDispatches = useCallback(async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('dp_dispatches' as any)
                .select(`
                    *,
                    clients (razao_social, nome_fantasia),
                    technicians (name)
                `)
                .order('criado_em', { ascending: false });

            if (error) throw error;

            const mapped: DPDispatch[] = (data as any[]).map(item => ({
                id: item.id,
                clientId: item.client_id,
                empresaNome: item.clients?.nome_fantasia || item.clients?.razao_social,
                colaboradorNome: item.colaborador_nome,
                tipoProcesso: item.tipo_processo,
                tipoDocumento: item.tipo_documento,
                descricao: item.descricao,
                canal: item.canal,
                destinatario: item.destinatario,
                status: item.status,
                dataPrevista: item.data_prevista,
                dataEfetiva: item.data_efetiva,
                responsavelId: item.responsavel_id,
                responsavelNome: item.technicians?.name,
                anexoUrl: item.anexo_url,
                mensagem: item.mensagem,
                lido: item.lido,
                observacoes: item.observacoes,
                errorMessage: item.error_message,
                resendId: item.resend_id,
                valor: item.valor,
                dataVencimento: item.data_vencimento,
                criadoEm: item.criado_em,
            }));

            setDispatches(mapped);
        } catch (error) {
            console.error('Erro ao buscar disparos:', error);
            toast.error('Erro ao carregar centro de disparos');
        } finally {
            setLoading(false);
        }
    }, []);

    const createDispatch = async (payload: Partial<DPDispatch>) => {
        try {
            const { data, error } = await supabase
            .from('dp_dispatches' as any)
            .insert([{
                client_id: payload.clientId,
                colaborador_nome: payload.colaboradorNome || null,
                tipo_processo: payload.tipoProcesso,
                tipo_documento: payload.tipoDocumento || payload.tipoProcesso,
                descricao: payload.descricao || null,
                canal: payload.canal,
                destinatario: payload.destinatario || null,
                status: payload.status || 'pendente',
                data_prevista: payload.dataPrevista || null,
                responsavel_id: payload.responsavelId || null,
                anexo_url: payload.anexoUrl || null,
                mensagem: payload.mensagem || null,
                observacoes: payload.observacoes || null,
                valor: payload.valor
                    ? (typeof payload.valor === 'string'
                        ? parseFloat((payload.valor as string).replace(',', '.')) || null
                        : payload.valor)
                    : null,
                data_vencimento: payload.dataVencimento || null
            }] as any)
                .select()
                .single();

            if (error) throw error;
            toast.success('Envio agendado na fila do DP!');
            fetchDispatches();
            return data;
        } catch (error) {
            console.error('Erro ao criar disparo:', error);
            toast.error('Erro ao registrar envio');
            throw error;
        }
    };

    const updateDispatch = async (id: string, updates: Partial<DPDispatch>) => {
        try {
            const payload: any = {};
            if (updates.status) payload.status = updates.status;
            if (updates.dataEfetiva) payload.data_efetiva = updates.dataEfetiva;
            if (updates.lido !== undefined) payload.lido = updates.lido;
            if (updates.resendId) payload.resend_id = updates.resendId;
            if (updates.errorMessage) payload.error_message = updates.errorMessage;

            const { error } = await supabase
                .from('dp_dispatches' as any)
                .update(payload)
                .eq('id', id);

            if (error) throw error;
            fetchDispatches();
        } catch (error) {
            console.error('Erro ao atualizar disparo:', error);
        }
    };

    const deleteDispatch = async (id: string) => {
        try {
            const { error } = await supabase
                .from('dp_dispatches' as any)
                .delete()
                .eq('id', id);

            if (error) throw error;
            toast.success('Envio removido da fila!');
            setDispatches(prev => prev.filter(d => d.id !== id));
        } catch (error) {
            console.error('Erro ao remover disparo:', error);
        }
    };

    const sendEmailDirect = async (dispatch: DPDispatch, uploadedFiles?: { filename: string; publicUrl: string }[]) => {
        try {
            if (dispatch.canal !== 'email' || !dispatch.destinatario) {
                toast.error('Canal inválido ou destinatário ausente');
                return;
            }

            const docNameMapper: Record<string, string> = {
                'admissao': 'Admissão',
                'rescisao': 'Rescisão',
                'ferias': 'Férias',
                'folha': 'Folha / Holerite',
                'beneficios': 'Benefícios',
                'esocial': 'eSocial / Guias',
                'vale': 'Vale / Adiantamento',
                'outros': 'Outros Documentos'
            };

            const displayDocName = docNameMapper[dispatch.tipoDocumento.toLowerCase()] || dispatch.tipoDocumento;
            const toEmail = dispatch.destinatario.trim();
            const subject = `${displayDocName} — ${dispatch.colaboradorNome || dispatch.empresaNome || 'Empresa'}`;

            toast.info(`Preparando disparo seguro para ${toEmail}...`);

            const branding = await BrandingService.fetchBranding();
            const companyName = dispatch.empresaNome || 'Empresa';

            const formatCurrency = (val: number | null) => {
              if (val === null || val === undefined) return '—';
              return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
            };

            const formatDate = (dateStr: string | null) => {
              if (!dateStr) return '—';
              return format(parseISO(dateStr), 'dd/MM/yyyy');
            };

            let documentsRows = '';
            if (uploadedFiles && uploadedFiles.length > 0) {
                uploadedFiles.forEach(file => {
                    documentsRows += `
                        <tr>
                            <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #1e293b; font-weight: 500;">${displayDocName} — <span style="font-size: 11px; color: #64748b;">${file.filename}</span></td>
                            <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #ef4444; font-weight: 700; text-align: center;">${formatCurrency(dispatch.valor)}</td>
                            <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #1e293b; text-align: center;">${formatDate(dispatch.dataVencimento)}</td>
                            <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; text-align: right;">
                                <a href="${file.publicUrl}" style="display: inline-block; padding: 6px 12px; background-color: ${branding.primaryColor}10; color: ${branding.primaryColor}; text-decoration: none; border-radius: 6px; font-size: 10px; font-weight: 800; text-transform: uppercase;">Baixar</a>
                            </td>
                        </tr>
                    `;
                });
            } else {
                documentsRows = `
                    <tr>
                        <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #1e293b; font-weight: 500;">${displayDocName}</td>
                        <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #ef4444; font-weight: 700; text-align: center;">${formatCurrency(dispatch.valor)}</td>
                        <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #1e293b; text-align: center;">${formatDate(dispatch.dataVencimento)}</td>
                        <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; text-align: right;">
                            ${dispatch.anexoUrl ? `
                                <a href="${dispatch.anexoUrl}" style="display: inline-block; padding: 6px 12px; background-color: ${branding.primaryColor}10; color: ${branding.primaryColor}; text-decoration: none; border-radius: 6px; font-size: 10px; font-weight: 800; text-transform: uppercase;">Baixar</a>
                            ` : '<span style="color: #94a3b8; font-size: 11px;">Sem anexo</span>'}
                        </td>
                    </tr>
                `;
            }

            const guidesHtml = `
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
                    <thead>
                        <tr style="background-color: #f8fafc;">
                            <th style="padding: 12px; text-align: left; font-size: 11px; border-bottom: 1px solid #e2e8f0; color: #64748b; text-transform: uppercase; font-weight: 800;">DOCUMENTO</th>
                            <th style="padding: 12px; text-align: center; font-size: 11px; border-bottom: 1px solid #e2e8f0; color: #64748b; text-transform: uppercase; font-weight: 800;">Valor</th>
                            <th style="padding: 12px; text-align: center; font-size: 11px; border-bottom: 1px solid #e2e8f0; color: #64748b; text-transform: uppercase; font-weight: 800;">Vencimento</th>
                            <th style="padding: 12px; text-align: right; font-size: 11px; border-bottom: 1px solid #e2e8f0; color: #64748b; text-transform: uppercase; font-weight: 800;">Ação</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${documentsRows}
                    </tbody>
                </table>`;

            const customMessageBlock = dispatch.mensagem
                ? `<div style="background-color: #fee2e2; border: 1px solid #fecaca; padding: 24px; margin: 32px 0; border-radius: 16px;">
                     <p style="margin: 0 0 12px 0; color: #b91c1c; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 800;">🚀 Notas Adicionais do DP:</p>
                     <div style="color: #000000; font-size: 16px; line-height: 1.7; font-weight: 400; white-space: pre-line;">
                       ${dispatch.mensagem?.replace(/\n/g, '<br/>')}
                     </div>
                   </div>`
                : '';

            const htmlContent = `
                <div style="font-family: 'Inter', system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #f0f0f0; border-radius: 30px; background-color: #ffffff;">
                    <div style="text-align: center; margin-bottom: 35px;">
                        <h1 style="margin: 0; color: #1e293b; font-size: 28px; font-weight: 300; letter-spacing: -0.02em;">
                            Documento(s) de <span style="color: ${branding.primaryColor}; font-weight: 700;">${displayDocName}</span>
                        </h1>
                        <p style="margin: 8px 0 0 0; color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 0.2em; font-weight: 700;">DOCUMENTO PROCESSADO COM SUCESSO</p>
                    </div>
                    
                    <div style="line-height: 1.6; color: #475569; font-size: 15px; margin-bottom: 35px;">
                        Olá <strong>${companyName}</strong>,<br><br>
                        Identificamos novos documentos prontos referente a <strong>${dispatch.colaboradorNome || 'sua empresa'}</strong>. Abaixo você encontrará o resumo detalhado e os links para download seguro:
                    </div>

                    ${guidesHtml}

                    ${customMessageBlock}

                    <div style="margin: 30px 0; padding: 20px; background-color: #f8fafc; border-radius: 15px; text-align: center; border: 1px dashed #e2e8f0;">
                        <p style="font-size: 13px; color: #64748b; margin: 0;">⚠️ <strong>Atenção:</strong> Por favor, verifique atentamente as informações. Em caso de dúvidas, nossa equipe está à disposição.</p>
                    </div>

                    <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 40px 0;">
                    
                    <div style="text-align: center;">
                        <p style="font-size: 12px; color: #94a3b8; margin-bottom: 8px;">
                            Este é um comunicado oficial enviado por<br><strong style="color: #1e293b; font-size: 14px;">${branding.companyName}</strong>.
                        </p>
                    </div>
                </div>
            `;

            const data = await ResendService.sendEmail({
                to: dispatch.destinatario,
                subject: subject,
                html: htmlContent,
                reply_to: branding.replyToEmail || undefined,
                attachments: [] 
            });

            await updateDispatch(dispatch.id, {
                status: 'enviado',
                dataEfetiva: new Date().toISOString(),
                resendId: data && (data as any).id ? (data as any).id : null
            });

            toast.success('Disparo via Resend (Padrão JLVIANA) concluído!');
            return data;
        } catch (error: any) {
            console.error('Erro no disparo:', error);
            await updateDispatch(dispatch.id, {
                status: 'erro',
                errorMessage: error.message
            });
            toast.error('O disparo falhou via Resend Service');
        }
    };

    useEffect(() => {
        fetchDispatches();
    }, [fetchDispatches]);

    return {
        dispatches,
        loading,
        createDispatch,
        updateDispatch,
        deleteDispatch,
        sendEmailDirect,
        refresh: fetchDispatches
    };
}
