import React, { useState, useMemo } from 'react';
import {
    Calculator, Plus, Search, Loader2, CheckCircle2, Clock,
    Hash, Building2, ChevronDown, Check, Download,
    TrendingUp, AlertCircle, DollarSign, Send, History, Zap, Sparkles, Trash2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog';
import { useClients } from '@/hooks/useClients';
import { useHonorarios, PaymentStatus } from '@/hooks/useHonorarios';
import { formatCurrency, getMonthName } from '@/components/Honorarios/utils/format';
import { MONTHS, YEARS } from '@/components/Honorarios/constants';
import { ResendService } from '@/services/resendService';
import { toast } from 'sonner';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DeliveryAiDropZone, ProcessedDeliveryFile } from '@/components/delivery/DeliveryAiDropZone';
import { BrandingService } from "@/services/brandingService";
import { supabase } from "@/integrations/supabase/client";



const SERVICOS_RECALCULO = [
    { grupo: "Tributos Federais", nome: "DARF – IRPJ / CSLL", valor: 20 },
    { grupo: "Tributos Federais", nome: "DARF – PIS / COFINS", valor: 20 },
    { grupo: "Tributos Federais", nome: "DARF – IRRF", valor: 20 },
    { grupo: "Tributos Federais", nome: "DARF – Simples Nacional (reapuração / PGDAS)", valor: 15 },
    { grupo: "Tributos Federais", nome: "DARF Previdenciário (DCTFWeb)", valor: 20 },
    { grupo: "Tributos Federais", nome: "Parcelamentos Federais – Reemissão de parcela", valor: 20 },

    { grupo: "Obrigações Previdenciárias e Trabalhistas", nome: "GPS (INSS) em atraso", valor: 20 },
    { grupo: "Obrigações Previdenciárias e Trabalhistas", nome: "INSS Patronal (DCTFWeb)", valor: 20 },
    { grupo: "Obrigações Previdenciárias e Trabalhistas", nome: "FGTS – Reemissão ou atualização", valor: 30 },
    { grupo: "Obrigações Previdenciárias e Trabalhistas", nome: "DAE Doméstica – Reemissão ou atualização", valor: 30 },
    { grupo: "Obrigações Previdenciárias e Trabalhistas", nome: "Guia de Multa Rescisória do FGTS (GRRF)", valor: 60 },

    { grupo: "Tributos Estaduais", nome: "ICMS – Reemissão ou atualização", valor: 25 },
    { grupo: "Tributos Estaduais", nome: "ICMS-ST – Reemissão ou atualização", valor: 25 },
    { grupo: "Tributos Estaduais", nome: "ICMS-DIFAL – Reemissão ou atualização", valor: 25 },
    { grupo: "Tributos Estaduais", nome: "Parcelamentos Estaduais – Reemissão de parcela", valor: 25 },

    { grupo: "Tributos Municipais", nome: "ISS – Reemissão ou atualização", valor: 20 },
    { grupo: "Tributos Municipais", nome: "ISS Retido – Reemissão ou atualização", valor: 20 },
    { grupo: "Tributos Municipais", nome: "Taxas Municipais (TFE, TFA e similares)", valor: 20 },
    { grupo: "Tributos Municipais", nome: "Parcelamentos Municipais – Reemissão de parcela", valor: 20 },
];


export default function Recalculos() {
    const { clients, loading: lc } = useClients();
    const { tickets, loading: lh, createTicket, updateTicketStatus, deleteTicket } = useHonorarios();

    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [searchTerm, setSearchTerm] = useState('');

    // modal
    const [addModal, setAddModal] = useState(false);
    const [openClient, setOpenClient] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // form inputs
    const [selectedClientId, setSelectedClientId] = useState('');
    const [serviceName, setServiceName] = useState('');
    const [price, setPrice] = useState('');
    const [departamento, setDepartamento] = useState('');

    const loading = lc || lh;

    const filteredClients = useMemo(() => {
        return clients.filter(c => c.isActive).sort((a, b) => {
            const nameA = a.nomeFantasia || a.razaoSocial || '';
            const nameB = b.nomeFantasia || b.razaoSocial || '';
            return nameA.localeCompare(nameB);
        });
    }, [clients]);

    const activeTickets = useMemo(() => {
        return tickets.filter(t => t.month === currentMonth && t.year === currentYear);
    }, [tickets, currentMonth, currentYear]);



    // Handle create
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClientId || !serviceName || !price || !departamento) {
            toast.error("Preencha todos os campos obrigatórios");
            return;
        }

        try {
            setSubmitting(true);
            const numPrice = Number(price);

            // 1. Maintain module functionality by creating the ticket (Recálculo) in the DB
            await createTicket({
                clientId: selectedClientId,
                month: currentMonth,
                year: currentYear,
                serviceName: `[${departamento}] ${serviceName}`,
                price: numPrice,
                status: 'PENDING',
                requestedAt: new Date().toISOString(),
            });

            // 2. Format client name for email
            const client = clients.find(c => c.id === selectedClientId);
            const clientName = client?.nomeFantasia || client?.razaoSocial || 'Cliente Desconhecido';
            const branding = BrandingService.getBranding();

            const emailHtml = `
                <div style="font-family: 'Inter', system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #f0f0f0; border-radius: 30px; background-color: #ffffff;">
                    <div style="text-align: center; margin-bottom: 35px;">
                        <h1 style="color: #1a1a1a; font-size: 26px; font-weight: 300; margin: 0; letter-spacing: -0.02em;">Aviso de <span style="color: ${branding.primaryColor}; font-weight: 800;">Faturamento</span></h1>
                        <p style="font-size: 11px; color: #D2232A; text-transform: uppercase; letter-spacing: 0.2em; margin-top: 8px; font-weight: 700;">Notificação Interna • Registro Manual</p>
                    </div>
                    
                    <div style="line-height: 1.6; color: #475569; font-size: 15px; margin-bottom: 35px;">
                        <strong>Resumo para o Financeiro:</strong><br>
                        Um novo recálculo foi registrado manualmente no sistema.
                    </div>

                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
                        <thead>
                            <tr style="background-color: #f8fafc;">
                                <th style="padding: 12px; text-align: left; font-size: 11px; border-bottom: 1px solid #e2e8f0; color: #64748b; text-transform: uppercase; font-weight: 800;">SERVIÇO</th>
                                <th style="padding: 12px; text-align: left; font-size: 11px; border-bottom: 1px solid #e2e8f0; color: #64748b; text-transform: uppercase; font-weight: 800;">COMPETÊNCIA</th>
                                <th style="padding: 12px; text-align: right; font-size: 11px; border-bottom: 1px solid #e2e8f0; color: #64748b; text-transform: uppercase; font-weight: 800;">VALOR</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #1e293b; font-weight: 500;">${serviceName}</td>
                                <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #64748b;">${getMonthName(currentMonth)}/${currentYear}</td>
                                <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; text-align: right; font-weight: 700; color: #1e293b;">${formatCurrency(numPrice)}</td>
                            </tr>
                        </tbody>
                    </table>

                    <div style="margin: 30px 0; padding: 25px; background-color: #f8fafc; border-radius: 20px; border: 1px solid #e2e8f0;">
                        <table style="width: 100%; font-size: 13px; color: #475569;">
                            <tr><td style="padding: 4px 0;"><strong>Quem solicitou:</strong></td><td style="text-align: right;">Colaborador (Via Painel)</td></tr>
                            <tr><td style="padding: 4px 0;"><strong>Departamento:</strong></td><td style="text-align: right;">${departamento}</td></tr>
                            <tr><td style="padding: 4px 0;"><strong>Cliente:</strong></td><td style="text-align: right;">${clientName}</td></tr>
                            <tr><td style="padding: 4px 0;"><strong>Dia:</strong></td><td style="text-align: right;">${new Date().toLocaleDateString('pt-BR')}</td></tr>
                            <tr><td style="padding: 4px 0;"><strong>Hora:</strong></td><td style="text-align: right;">${new Date().toLocaleTimeString('pt-BR')}</td></tr>
                            <tr><td style="padding: 4px 0; border-top: 1px solid #e2e8f0; margin-top: 8px;"><strong>Valor Total:</strong></td><td style="text-align: right; border-top: 1px solid #e2e8f0; font-weight: 700; color: #D2232A; font-size: 16px;">${formatCurrency(numPrice)}</td></tr>
                        </table>
                    </div>

                    <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 40px 0;">
                    <p style="text-align: center; font-size: 12px; color: #94a3b8;">JLVIANA CONECTA • Workflow de Faturamento</p>
                </div>
            `;

            // 3. Enviar e-mails (Cliente e Financeiro em paralelo)
            console.log(`[Recalculos] Iniciando disparos manuais para ${clientName}...`);

            const emailTasks = [];

            // Notificação ao Financeiro (Obrigatória)
            emailTasks.push(ResendService.sendEmail({
                to: 'financeiro@jlviana.com.br',
                subject: `Novo Recálculo: ${clientName}`,
                html: emailHtml,
                reply_to: branding.replyToEmail || undefined
            }).then(() => console.log(`[Recalculos] E-mail enviado ao Financeiro.`)));

            // E-mail ao Cliente (Se houver)
            if (client?.email) {
                emailTasks.push(ResendService.sendEmail({
                    to: client.email,
                    subject: `Guia de Pagamento: RECALCULO ${serviceName} - ${clientName}`,
                    html: emailHtml.replace("Notificação Interna • Registro Manual", "Suas Guia(s) de Recálculo").replace("Resumo para o Financeiro:", "Olá <strong>" + clientName + "</strong>, segue detalhe do seu recálculo:"),
                    reply_to: branding.replyToEmail || undefined
                }).then(() => console.log(`[Recalculos] E-mail enviado ao Cliente (${client.email}).`)));
            }

            await Promise.all(emailTasks);

            // 4. Registrar no log de envios (accounting_guides) para que apareça na aba "Logs e Envios"
            try {
                await supabase.from('accounting_guides').insert({
                    client_id: selectedClientId,
                    type: `Recálculo: ${serviceName}`,
                    reference_month: `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}`,
                    due_date: null,
                    amount: numPrice,
                    status: 'completed',
                    sent_at: new Date().toISOString(),
                    completed_at: new Date().toISOString(),
                    completed_by: `Manual - ${departamento}`
                });
                console.log(`[Recalculos] Registro criado em accounting_guides para log.`);
            } catch (logError) {
                console.error("Erro ao registrar log de envio:", logError);
            }

            toast.success("Recálculo registrado e notificações enviadas!");
            setAddModal(false);

            // cleanup
            setSelectedClientId('');
            setServiceName('');
            setPrice('');
            setDepartamento('');
        } catch (error) {
            console.error(error);
            toast.error("Aconteceu um erro ao tentar enviar.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleAiSendAll = async (processedFiles: ProcessedDeliveryFile[], provider: 'resend' | 'whatsapp' = 'resend') => {
        const guidesToProcess = processedFiles.filter(f => f.status === 'completed' && f.data && f.client);

        if (guidesToProcess.length === 0) {
            toast.error("Nenhum arquivo processado corretamente para envio.");
            return;
        }

        try {
            setSubmitting(true);
            toast.info(`Iniciando envio via ${provider.toUpperCase()}...`);

            const branding = BrandingService.getBranding();
            const now = new Date().toISOString();

            // Agrupar por cliente para envio consolidado
            const filesByClient: Record<string, ProcessedDeliveryFile[]> = {};
            for (const item of guidesToProcess) {
                const cid = item.client.id;
                if (!filesByClient[cid]) filesByClient[cid] = [];
                filesByClient[cid].push(item);
            }

            let clientSuccess = 0;
            let totalSuccess = 0;

            for (const clientId in filesByClient) {
                const clientFiles = filesByClient[clientId];
                const client = clientFiles[0].client;

                try {
                    // 1. Processar cada arquivo (DB e Tickets)
                    for (const item of clientFiles) {
                        const { data: extractData } = item;
                        const publicUrl = item.publicUrl;
                        if (!publicUrl) continue;

                        // Registrar na accounting_guides
                        await supabase.from('accounting_guides').insert({
                            client_id: client.id,
                            type: item.matchedObligationName || extractData.type,
                            reference_month: extractData.referenceMonth,
                            due_date: extractData.dueDate || null,
                            amount: parseFloat(extractData.value) || null,
                            status: 'completed',
                            file_url: publicUrl,
                            sent_at: now,
                            completed_at: now,
                            completed_by: `IA - ${provider}`
                        });

                        // Registrar ticket de faturamento
                        await createTicket({
                            clientId: client.id,
                            month: currentMonth,
                            year: currentYear,
                            serviceName: `[IA] ${item.matchedObligationName || extractData.type}`,
                            price: parseFloat(extractData.value) || 20,
                            status: 'PENDING',
                            requestedAt: now,
                        });
                        totalSuccess++;
                    }

                    // 1.5 Preparar Tabela Premium (Sempre necessária para o Financeiro)
                    let guidesHtml = `
                        <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
                            <thead>
                                <tr style="background-color: #f8fafc;">
                                    <th style="padding: 12px; text-align: left; font-size: 11px; border-bottom: 1px solid #e2e8f0; color: #64748b; text-transform: uppercase; font-weight: 800;">SERVIÇO</th>
                                    <th style="padding: 12px; text-align: left; font-size: 11px; border-bottom: 1px solid #e2e8f0; color: #64748b; text-transform: uppercase; font-weight: 800;">COMPETÊNCIA</th>
                                    <th style="padding: 12px; text-align: right; font-size: 11px; border-bottom: 1px solid #e2e8f0; color: #64748b; text-transform: uppercase; font-weight: 800;">VENCIMENTO</th>
                                    <th style="padding: 12px; text-align: right; font-size: 11px; border-bottom: 1px solid #e2e8f0; color: #64748b; text-transform: uppercase; font-weight: 800;">VALOR</th>
                                    <th style="padding: 12px; text-align: right; font-size: 11px; border-bottom: 1px solid #e2e8f0; color: #64748b; text-transform: uppercase; font-weight: 800;">DOWNLOAD</th>
                                </tr>
                            </thead>
                            <tbody>
                    `;

                    clientFiles.forEach(item => {
                        const val = (parseFloat(item.data!.value) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                        let formattedDate = '-';
                        if (item.data!.dueDate) {
                            const parts = item.data!.dueDate.split('T')[0].split('-');
                            formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : item.data!.dueDate;
                        }
                        guidesHtml += `
                            <tr>
                                <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #1e293b; font-weight: 500;">${item.matchedObligationName || item.data!.type}</td>
                                <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #64748b;">${item.data!.referenceMonth}</td>
                                <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; text-align: right; color: #1e293b;">${formattedDate}</td>
                                <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; text-align: right; font-weight: 700; color: #1e293b;">${val}</td>
                                <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; text-align: right;">
                                    <a href="${item.publicUrl}" style="display: inline-block; padding: 6px 12px; background-color: ${branding.primaryColor}10; color: ${branding.primaryColor}; text-decoration: none; border-radius: 6px; font-size: 10px; font-weight: 800; text-transform: uppercase;">GUIA PDF</a>
                                </td>
                            </tr>
                        `;
                    });
                    guidesHtml += `</tbody></table>`;

                    // 2. Envio ao Cliente
                    if (provider === 'whatsapp') {
                        const phone = (client.phone || client.telefone || '').replace(/\D/g, '');
                        if (phone) {
                            const firstItem = clientFiles[0];
                            const val = (parseFloat(firstItem.data!.value) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                            const message = `Olá! Segue o RECÁLCULO da guia ${firstItem.matchedObligationName || firstItem.data!.type} (${firstItem.data!.referenceMonth}).\nValor: ${val}\nVencimento: ${firstItem.data!.dueDate || '-'}\n\nLink: ${firstItem.publicUrl}`;
                            window.open(`https://web.whatsapp.com/send?phone=55${phone}&text=${encodeURIComponent(message)}`, '_blank');
                        }
                    } else if (client.email) {
                        const htmlContent = `
                            <div style="font-family: 'Inter', system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #f0f0f0; border-radius: 30px; background-color: #ffffff;">
                                <div style="text-align: center; margin-bottom: 35px;">
                                    <h1 style="color: #1a1a1a; font-size: 26px; font-weight: 300; margin: 0; letter-spacing: -0.02em;">Suas Guia(s) de <span style="color: ${branding.primaryColor}; font-weight: 800;">Recálculo</span></h1>
                                    <p style="font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 8px;">Documento Processado com Sucesso</p>
                                </div>
                                <div style="line-height: 1.6; color: #475569; font-size: 15px; margin-bottom: 35px;">
                                    Olá <strong>${client.nomeFantasia || client.razaoSocial}</strong>,<br><br>
                                    Esta comunicação refere-se a um <strong>RECÁLCULO</strong> solicitado. Abaixo você encontrará os detalhes da guia e o link para download seguro:
                                </div>
                                ${guidesHtml}
                                <div style="margin: 30px 0; padding: 20px; background-color: #f8fafc; border-radius: 15px; text-align: center; border: 1px dashed #e2e8f0;">
                                    <p style="font-size: 13px; color: #64748b; margin: 0;">⚠️ <strong>Atenção:</strong> Por favor, verifique a data de vencimento para evitar multas.</p>
                                </div>
                                <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 40px 0;">
                                <div style="text-align: center;">
                                    <p style="font-size: 12px; color: #94a3b8; margin-bottom: 8px;">Este é um comunicado oficial enviado por<br><strong style="color: #1e293b; font-size: 14px;">${branding.companyName}</strong>.</p>
                                </div>
                            </div>
                        `;

                        await ResendService.sendEmail({
                            to: client.email,
                            subject: `Guia de Pagamento: RECALCULO ${clientFiles[0].matchedObligationName || clientFiles[0].data!.type} - ${client.nomeFantasia || client.razaoSocial}`,
                            html: htmlContent,
                            reply_to: branding.replyToEmail || undefined
                        });
                    }

                    // 3. Disparar E-mails (Paralelo)
                    const totalValue = clientFiles.reduce((acc, f) => acc + (parseFloat(f.data?.value || '0') || 0), 0);
                    const financeHtml = `
                        <div style="font-family: 'Inter', system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #f0f0f0; border-radius: 30px; background-color: #ffffff;">
                            <div style="text-align: center; margin-bottom: 35px;">
                                <h1 style="color: #1a1a1a; font-size: 26px; font-weight: 300; margin: 0; letter-spacing: -0.02em;">Aviso de <span style="color: ${branding.primaryColor}; font-weight: 800;">Recálculo</span></h1>
                                <p style="font-size: 11px; color: #D2232A; text-transform: uppercase; letter-spacing: 0.2em; margin-top: 8px; font-weight: 700;">Notificação Interna • IA Fiscal</p>
                            </div>
                            
                            <div style="line-height: 1.6; color: #475569; font-size: 15px; margin-bottom: 35px;">
                                <strong>Resumo para o Financeiro:</strong><br>
                                Novos recálculos processados via IA e enviados ao cliente.
                            </div>

                            ${guidesHtml.replace(/GUIA PDF/g, 'VER GUIA')}

                            <div style="margin: 30px 0; padding: 25px; background-color: #f8fafc; border-radius: 20px; border: 1px solid #e2e8f0;">
                                <table style="width: 100%; font-size: 13px; color: #475569;">
                                    <tr><td style="padding: 4px 0;"><strong>Quem solicitou:</strong></td><td style="text-align: right;">Inteligência Artificial</td></tr>
                                    <tr><td style="padding: 4px 0;"><strong>Departamento:</strong></td><td style="text-align: right;">IA Fiscal</td></tr>
                                    <tr><td style="padding: 4px 0;"><strong>Cliente:</strong></td><td style="text-align: right;">${client.nomeFantasia || client.razaoSocial}</td></tr>
                                    <tr><td style="padding: 4px 0;"><strong>Dia:</strong></td><td style="text-align: right;">${new Date().toLocaleDateString('pt-BR')}</td></tr>
                                    <tr><td style="padding: 4px 0;"><strong>Hora:</strong></td><td style="text-align: right;">${new Date().toLocaleTimeString('pt-BR')}</td></tr>
                                    <tr><td style="padding: 4px 0; border-top: 1px solid #e2e8f0; margin-top: 8px;"><strong>Valor Total:</strong></td><td style="text-align: right; border-top: 1px solid #e2e8f0; font-weight: 700; color: #D2232A; font-size: 16px;">${formatCurrency(totalValue)}</td></tr>
                                </table>
                            </div>

                            <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 40px 0;">
                            <p style="text-align: center; font-size: 12px; color: #94a3b8;">JLVIANA CONECTA • Workflow Automatizado</p>
                        </div>
                    `;

                    console.log(`[Recalculos IA] Iniciando disparos para ${client.nomeFantasia || client.razaoSocial}...`);
                    const emailTasks = [];

                    // Notificação Financeiro (Sempre envia)
                    emailTasks.push(ResendService.sendEmail({
                        to: 'financeiro@jlviana.com.br',
                        subject: `Novo Recálculo: ${client.nomeFantasia || client.razaoSocial}`,
                        html: financeHtml,
                        reply_to: branding.replyToEmail || undefined
                    }).then(() => console.log(`[Recalculos IA] E-mail enviado ao Financeiro.`)));

                    // Notificação Cliente (E-mail ou WhatsApp)
                    if (provider === 'resend' && client.email) {
                        emailTasks.push(ResendService.sendEmail({
                            to: client.email,
                            subject: `Guia de Pagamento: RECALCULO ${clientFiles[0].matchedObligationName || clientFiles[0].data!.type} - ${client.nomeFantasia || client.razaoSocial}`,
                            html: htmlContent,
                            reply_to: branding.replyToEmail || undefined
                        }).then(() => console.log(`[Recalculos IA] E-mail enviado ao Cliente (${client.email}).`)));
                    }

                    await Promise.all(emailTasks);
                    clientSuccess++;
                } catch (err) {
                    console.error("Erro no envio para cliente:", err);
                }
            }

            toast.success(`${clientSuccess} clientes notificados! Total de ${totalSuccess} guias processadas.`);
        } catch (error) {
            console.error("Erro no processamento geral:", error);
            toast.error("Erro ao processar envios em massa.");
        } finally {
            setSubmitting(false);
        }
    };

    const exportToExcel = () => {
        if (activeTickets.length === 0) {
            toast.error("Nenhum recálculo encontrado neste período para exportar.");
            return;
        }

        const dataToExport = activeTickets.map(t => {
            const client = clients.find(c => c.id === t.clientId);
            const clientName = client?.nomeFantasia || client?.razaoSocial || 'Cliente Desconhecido';

            // Extract departamento if previously saved as "[Departamento] Serviço"
            let devDepartment = '-';
            let devService = t.serviceName;

            if (t.serviceName.startsWith('[')) {
                const endIdx = t.serviceName.indexOf(']');
                if (endIdx !== -1) {
                    devDepartment = t.serviceName.substring(1, endIdx);
                    devService = t.serviceName.substring(endIdx + 1).trim();
                }
            }

            return {
                'Mês Referência': `${getMonthName(currentMonth)}/${currentYear}`,
                'Cliente / Empresa': clientName,
                'CNPJ': client?.cnpj || '',
                'E-mail': client?.email || '',
                'Telefone': client?.phone || client?.telefone || '',
                'Departamento Origem': devDepartment,
                'Serviço / Recálculo': devService,
                'Valor Cobrado (R$)': t.price,
                'Data de Solicitação': t.requestedAt ? new Date(t.requestedAt).toLocaleDateString('pt-BR') : '-',
                'Status do Pagamento': t.status === 'PAID' ? 'Pago / Faturado' : (t.status === 'LATE' ? 'Atrasado' : 'Pendente'),
                'Data de Pagamento': t.paidAt ? new Date(t.paidAt).toLocaleDateString('pt-BR') : '-'
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        
        // Auto-ajuste de colunas
        const max_width = dataToExport.reduce((w, r) => Math.max(w, r['Cliente / Empresa'].length), 10);
        worksheet['!cols'] = [
            { wch: 15 }, // Mês Referência
            { wch: Math.max(25, max_width) }, // Cliente
            { wch: 20 }, // CNPJ
            { wch: 30 }, // E-mail
            { wch: 15 }, // Telefone
            { wch: 15 }, // Departamento
            { wch: 35 }, // Serviço
            { wch: 15 }, // Valor
            { wch: 15 }, // Solicitação
            { wch: 18 }, // Status
            { wch: 15 }, // Pagamento
        ];

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Recálculos");
        XLSX.writeFile(workbook, `Relatorio_Recalculos_${getMonthName(currentMonth)}_${currentYear}.xlsx`);
        toast.success("Download do relatório consolidado iniciado!");
    };

    const MonthYearPicker = () => (
        <div className="flex items-center gap-1.5 bg-muted/20 p-1 rounded-xl border border-border/10 backdrop-blur-sm">
            <select value={currentMonth} onChange={e => setCurrentMonth(Number(e.target.value))}
                className="h-8 rounded-lg border-none bg-transparent px-3 text-xs font-bold uppercase tracking-wider text-muted-foreground focus:outline-none focus:ring-0 cursor-pointer hover:text-primary transition-colors">
                {MONTHS.map((m, i) => <option key={i} value={i} className="bg-card text-foreground">{m}</option>)}
            </select>
            <div className="h-4 w-px bg-border/20" />
            <select value={currentYear} onChange={e => setCurrentYear(Number(e.target.value))}
                className="h-8 rounded-lg border-none bg-transparent px-3 text-xs font-bold uppercase tracking-wider text-muted-foreground focus:outline-none focus:ring-0 cursor-pointer hover:text-primary transition-colors">
                {YEARS.map(y => <option key={y} value={y} className="bg-card text-foreground">{y}</option>)}
            </select>
        </div>
    );

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-6">
                <div className="relative">
                    <div className="absolute inset-0 blur-2xl bg-primary/20 animate-pulse rounded-full" />
                    <Loader2 className="h-12 w-12 animate-spin text-primary relative z-10" />
                </div>
                <div className="space-y-1 text-center">
                    <span className="block text-sm font-bold uppercase tracking-[0.2em] text-foreground">Carregando recálculos</span>
                    <span className="text-[10px] text-muted-foreground/60 uppercase tracking-widest">Sincronizando dados com o servidor</span>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex-1 space-y-8 p-8 pt-4 min-h-screen bg-[#fcfcfd]">
            {/* Header com Design Premium */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-xl shadow-primary/20 rotate-3">
                            <Calculator className="h-7 w-7 text-white" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-extralight tracking-tight text-foreground flex items-center gap-3">
                                Gestão de<span className="text-primary font-semibold">Recálculos</span>
                            </h2>
                            <p className="text-sm text-muted-foreground font-light tracking-wide flex items-center gap-2">
                                <History className="h-3 w-3 text-primary/40" />
                                Monitoramento e envio inteligente de guias e impostos
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 bg-white/50 p-2 rounded-2xl border border-border/40 backdrop-blur-md shadow-sm">
                    <MonthYearPicker />
                    <div className="h-6 w-px bg-border/20" />
                    <Button onClick={exportToExcel} variant="ghost" className="h-10 rounded-xl px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-all">
                        <Download className="mr-2 h-4 w-4" /> Exportar XLSX
                    </Button>
                    <Button onClick={() => setAddModal(true)} className="h-11 rounded-xl px-6 uppercase tracking-widest text-xs font-bold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center gap-2 group">
                        <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform duration-300" /> Novo Recálculo
                    </Button>
                </div>
            </header>

            {/* Section: Envio por IA (Dropzone) - Always at top like DeliveryList */}
            <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/40 backdrop-blur-xl border border-border/40 rounded-[3rem] p-2 shadow-2xl shadow-black/[0.02] overflow-hidden transition-all hover:border-primary/20"
            >
                <div className="bg-primary/[0.02] p-8 border-b border-border/10">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-light text-foreground flex items-center gap-3">
                                <Send className="h-5 w-5 text-primary opacity-60" />
                                1. Envio de Recálculos ao Cliente
                            </h2>
                            <p className="text-xs text-muted-foreground font-light mt-1">
                                Arraste as guias aqui. o Sistema identificará o cliente e notificará o financeiro automaticamente.
                            </p>
                        </div>
                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 animate-pulse uppercase text-[8px] font-black tracking-widest px-3 py-1">
                            IA Ativa
                        </Badge>
                    </div>
                </div>
                <div className="p-8">
                    <DeliveryAiDropZone
                        onSendAll={handleAiSendAll}
                        mode="recalculo"
                    />
                </div>
            </motion.section>

            <Tabs defaultValue="list" className="w-full space-y-8">
                <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                        <h2 className="text-xl font-light text-foreground flex items-center gap-3">
                            <Hash className="h-5 w-5 text-primary opacity-60" />
                            2. Lista de Recálculos Registrados
                        </h2>
                    </div>
                    <TabsList className="bg-muted/10 p-1 rounded-2xl border border-border/10 h-auto">
                        <TabsTrigger
                            value="list"
                            className="rounded-xl px-6 py-2 uppercase tracking-widest text-[9px] font-black data-[state=active]:bg-white data-[state=active]:text-primary"
                        >
                            Ver Todos
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="list" className="space-y-10 outline-none">
                    <div className="relative max-w-2xl mx-auto group">
                        <div className="absolute inset-0 bg-primary/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full" />
                        <Search className="absolute left-6 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/30 transition-colors group-focus-within:text-primary" />
                        <input
                            className="h-16 w-full rounded-[2rem] border border-border/40 bg-white/80 backdrop-blur-md pl-14 pr-6 text-sm font-light placeholder:text-muted-foreground/40 focus:border-primary/30 focus:outline-none focus:ring-4 focus:ring-primary/[0.03] shadow-lg shadow-black/[0.02] transition-all relative z-10"
                            placeholder="Buscar cliente ou empresa na lista..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="space-y-8">
                        <AnimatePresence mode="popLayout">
                            {filteredClients.filter(c =>
                                (c.nomeFantasia || c.razaoSocial || '').toLowerCase().includes(searchTerm.toLowerCase())
                            ).map((c, idx) => {
                                const ct = activeTickets.filter(t => t.clientId === c.id);
                                if (ct.length === 0) return null;

                                const clientName = c.nomeFantasia || c.razaoSocial;

                                return (
                                    <motion.div
                                        key={c.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="bg-white/60 backdrop-blur-md border border-border/40 rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-500"
                                    >
                                        <div className="p-10">
                                            <div className="flex items-center justify-between mb-8">
                                                <div className="flex items-center gap-6">
                                                    <div className="h-16 w-16 rounded-3xl bg-gradient-to-br from-primary/10 to-transparent flex items-center justify-center border border-white/40 shadow-inner">
                                                        <Building2 className="h-7 w-7 text-primary/40" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <h4 className="text-2xl font-light text-foreground tracking-tight">{clientName}</h4>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-[10px] font-black text-primary/60 uppercase tracking-widest">
                                                                {ct.length} recálculo(s) registrados
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <Table>
                                                <TableHeader className="bg-muted/5">
                                                    <TableRow className="border-border/10 hover:bg-transparent">
                                                        {['Recálculo / Serviço', 'Valor Unitário', 'Status do Guia', 'Ações de Controle'].map(h => (
                                                            <TableHead key={h} className="text-[9px] font-black uppercase tracking-[0.2em] py-6 px-10 text-muted-foreground/50">{h}</TableHead>
                                                        ))}
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {ct.map(t => (
                                                        <TableRow key={t.id} className="border-border/5 hover:bg-muted/10 transition-colors group">
                                                            <TableCell className="px-10 py-6">
                                                                <div className="flex flex-col space-y-1">
                                                                    <span className="font-medium text-sm text-foreground/80">{t.serviceName}</span>
                                                                    <span className="text-[10px] text-muted-foreground/50 flex items-center gap-1.5">
                                                                        <Clock className="h-3 w-3" /> Registrado em {t.requestedAt ? new Date(t.requestedAt).toLocaleDateString('pt-BR') : '-'}
                                                                    </span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="px-10 py-6">
                                                                <span className="font-bold text-sm text-foreground">{formatCurrency(t.price)}</span>
                                                            </TableCell>
                                                            <TableCell className="px-10 py-6">
                                                                <Badge className={cn(
                                                                    "rounded-lg px-3 py-1 text-[9px] font-black uppercase tracking-widest border-none",
                                                                    t.status === 'PAID' ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"
                                                                )}>
                                                                    {t.status === 'PAID' ? 'Faturado' : 'Pendente'}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="px-10 py-6 text-right">
                                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-9 w-9 rounded-xl hover:bg-destructive/10 hover:text-destructive"
                                                                        onClick={() => deleteTicket(t.id)}
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>

                        {activeTickets.length === 0 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col items-center justify-center py-32 bg-white/40 backdrop-blur-md rounded-[3rem] border border-dashed border-border/40"
                            >
                                <div className="h-24 w-24 rounded-full bg-muted/20 flex items-center justify-center mb-8">
                                    <Search className="h-10 w-10 text-muted-foreground/20" />
                                </div>
                                <h3 className="text-2xl font-extralight text-foreground tracking-tight">Nenhum recálculo encontrado</h3>
                                <p className="text-sm font-light text-muted-foreground mt-3 max-w-md text-center leading-relaxed">
                                    Não existem recálculos registrados para o período de <span className="font-medium text-primary">{getMonthName(currentMonth)} de {currentYear}</span>.
                                </p>
                                <Button onClick={() => setAddModal(true)} className="mt-10 rounded-2xl h-14 px-10 bg-primary text-white font-bold uppercase tracking-[0.15em] text-[10px] shadow-xl shadow-primary/20 transition-all active:scale-95">
                                    Iniciar Novo Registro
                                </Button>
                            </motion.div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>

            {/* Modal de Novo Recálculo */}
            <Dialog open={addModal} onOpenChange={v => { setAddModal(v); if (!v) { setSelectedClientId(''); setServiceName(''); setPrice(''); setDepartamento(''); } }}>
                <DialogContent className="max-w-3xl bg-card border-border rounded-[2.5rem] p-10 overflow-hidden shadow-2xl">
                    <DialogHeader className="mb-10 text-left">
                        <DialogTitle className="text-3xl font-light tracking-tight flex items-center gap-3">
                            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                                <Calculator className="h-6 w-6 text-primary" />
                            </div>
                            Adicionar Recálculo
                        </DialogTitle>
                        <DialogDescription className="font-light mt-3 text-base">
                            O recálculo será contabilizado no fechamento dos Honorários e notificado automaticamente ao financeiro.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSave} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                            <div className="space-y-3 md:col-span-2">
                                <label className="text-[10px] uppercase tracking-[0.2em] font-medium opacity-50">Cliente / Empresa *</label>
                                <Popover open={openClient} onOpenChange={setOpenClient}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            className={cn(
                                                "w-full h-16 rounded-2xl justify-between bg-muted/10 border-border/40 px-6 font-light text-base hover:bg-muted/20 transition-all",
                                                !selectedClientId && "text-muted-foreground"
                                            )}
                                        >
                                            {selectedClientId
                                                ? filteredClients.find((c) => c.id === selectedClientId)?.nomeFantasia || filteredClients.find((c) => c.id === selectedClientId)?.razaoSocial
                                                : "Selecione o cliente..."}
                                            <ChevronDown className="ml-2 h-5 w-5 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-2xl border-border shadow-2xl bg-card z-[9999]" align="start">
                                        <Command>
                                            <CommandInput placeholder="Buscar cliente..." className="h-14 font-light border-none ring-0 focus:ring-0" />
                                            <CommandList className="max-h-[350px] p-2">
                                                <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                                                <CommandGroup>
                                                    {filteredClients.map((c) => (
                                                        <CommandItem
                                                            key={c.id}
                                                            value={c.nomeFantasia || c.razaoSocial}
                                                            onSelect={() => {
                                                                setSelectedClientId(c.id);
                                                                setOpenClient(false);
                                                            }}
                                                            className="flex items-center gap-3 py-4 px-4 cursor-pointer hover:bg-primary/5 focus:bg-primary/5 transition-colors rounded-xl mb-1 group"
                                                        >
                                                            <div className="flex flex-col">
                                                                <span className="font-light text-sm">{c.nomeFantasia || c.razaoSocial}</span>
                                                                <span className="text-[10px] text-muted-foreground uppercase">{c.cnpj}</span>
                                                            </div>
                                                            <Check className={cn("ml-auto h-4 w-4 text-primary", selectedClientId === c.id ? "opacity-100" : "opacity-0")} />
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] uppercase tracking-[0.2em] font-medium opacity-50">Departamento *</label>
                                <div className="relative">
                                    <select
                                        required
                                        value={departamento}
                                        onChange={e => setDepartamento(e.target.value)}
                                        className="w-full h-16 rounded-2xl bg-muted/10 border border-border/40 px-6 font-light text-base focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all outline-none appearance-none"
                                    >
                                        <option value="" disabled hidden>Selecione...</option>
                                        <option value="Pessoal">Pessoal</option>
                                        <option value="Fiscal">Fiscal</option>
                                        <option value="Contábil">Contábil</option>
                                        <option value="Financeiro">Financeiro</option>
                                        <option value="Societário">Societário</option>
                                    </select>
                                    <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground opacity-50 pointer-events-none" />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] uppercase tracking-[0.2em] font-medium opacity-50">Valor Cobrado (R$) *</label>
                                <div className="relative">
                                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground font-light text-lg">R$</span>
                                    <input
                                        required
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={price}
                                        onChange={e => setPrice(e.target.value)}
                                        placeholder="0,00"
                                        className="w-full h-16 rounded-2xl bg-muted/10 border border-border/40 pl-14 pr-6 font-medium text-lg focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3 md:col-span-2">
                                <label className="text-[10px] uppercase tracking-[0.2em] font-medium opacity-50">O que está sendo recalculado? *</label>
                                <div className="relative">
                                    <select
                                        required
                                        value={serviceName}
                                        onChange={e => {
                                            const val = e.target.value;
                                            setServiceName(val);
                                            const found = SERVICOS_RECALCULO.find(s => s.nome === val);
                                            if (found) {
                                                setPrice(found.valor.toString());
                                            }
                                        }}
                                        className="w-full h-16 rounded-2xl bg-muted/10 border border-border/40 px-6 font-light text-base focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all outline-none appearance-none"
                                    >
                                        <option value="" disabled hidden>Selecione um recálculo da tabela...</option>
                                        {Array.from(new Set(SERVICOS_RECALCULO.map(s => s.grupo))).map(grupo => (
                                            <optgroup key={grupo} label={grupo} className="font-bold">
                                                {SERVICOS_RECALCULO.filter(s => s.grupo === grupo).map(s => (
                                                    <option key={s.nome} value={s.nome}>{s.nome}</option>
                                                ))}
                                            </optgroup>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground opacity-50 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between items-center gap-4 pt-10 border-t border-border/10 mt-6 md:col-span-2">
                            <Button type="button" variant="ghost" onClick={() => setAddModal(false)} className="rounded-2xl h-14 px-8 font-light uppercase tracking-widest text-xs text-muted-foreground hover:bg-muted/30">
                                Cancelar
                            </Button>

                            <Button
                                type="submit"
                                disabled={submitting}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl h-14 px-10 font-normal uppercase tracking-widest text-xs shadow-xl shadow-primary/20 transition-all active:scale-95 flex items-center gap-3"
                            >
                                {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Clock className="h-5 w-5" />}
                                Agendar e Notificar Financeiro
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
