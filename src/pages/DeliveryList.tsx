import { useState, useMemo } from 'react';
import {
    Search,
    Download,
    Eye,
    Building2,
    Wand2,
    Loader2,
    CheckCircle2,
    Clock,
    Plus,
    Calendar as CalendarIcon,
    ArrowRight,
    Filter,
    Send,
    FileText,
    LayoutGrid,
    List,
    Settings,
    History,
    SearchX,
    Trash2,
    AlertCircle,
    BrainCircuit,
    Play,
    Zap,
    Shield
} from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useClients } from '@/hooks/useClients';
import { useDeliveryList, AccountingGuide } from '@/hooks/useDeliveryList';
import { useObligations } from '@/hooks/useObligations';
import { useClientObligations } from '@/hooks/useClientObligations';
import { useAuth } from '@/context/AuthContext';
import { ResendService } from '@/services/resendService';
import { BrandingService } from '@/services/brandingService';
import { DeliveryAiDropZone, ProcessedDeliveryFile } from '@/components/delivery/DeliveryAiDropZone';
import { ClientGuidesModal } from '../components/delivery/ClientGuidesModal';
import { BulkGuideDialog } from '@/components/delivery/BulkGuideDialog';
import * as XLSX from 'xlsx';
import { TaxRegime } from '@/hooks/useClients';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from '@/integrations/supabase/client';


export default function DeliveryList() {
    const [selectedMonth, setSelectedMonth] = useState(() => format(new Date(), 'yyyy-MM'));
    const {
        guides,
        loading,
        createGuide,
        createGuidesBulk,
        updateGuideStatus,
        updateGuide,
        deleteGuide,
        deleteAllGuides,
        deleteGuidesBulk,
        fetchGuides,
        fetchExistingKeys
    } = useDeliveryList(selectedMonth);
    const { user } = useAuth();
    const { clients, loading: clientsLoading } = useClients();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRegime, setSelectedRegime] = useState<TaxRegime | 'all'>('all');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'clients' | 'history'>('clients');
    const [historySearchQuery, setHistorySearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'pending_guide' | 'pending_send' | 'scheduled' | 'completed'>('all');
    const [competencyFilter, setCompetencyFilter] = useState('all');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isAiConfigOpen, setIsAiConfigOpen] = useState(false);
    const { obligations } = useObligations();
    const { clientObligations } = useClientObligations();

    const historyGuides = useMemo(() => {
        return guides.filter(g => (g.status === 'sent' || g.status === 'completed') && (
            g.client?.nome_fantasia?.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
            g.client?.razao_social?.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
            g.type.toLowerCase().includes(historySearchQuery.toLowerCase())
        )).sort((a, b) => new Date(b.sent_at || 0).getTime() - new Date(a.sent_at || 0).getTime());
    }, [guides, historySearchQuery]);

    // Unique competencies for filter
    const competencyTypes = useMemo(() => {
        const competencies = guides.map(g => g.competency).filter(Boolean) as string[];
        return Array.from(new Set(competencies)).sort((a, b) => {
            const [mA, yA] = a.split('/').map(Number);
            const [mB, yB] = b.split('/').map(Number);
            const dateA = new Date(yA || 0, (mA || 1) - 1);
            const dateB = new Date(yB || 0, (mB || 1) - 1);
            return dateB.getTime() - dateA.getTime();
        });
    }, [guides]);

    // Months for selection (Last 12)
    const months = useMemo(() => {
        const result = [];
        const now = new Date();
        for (let i = 0; i < 12; i++) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            result.push({
                value: format(date, 'yyyy-MM'),
                label: format(date, 'MMMM / yyyy', { locale: ptBR })
            });
        }
        return result;
    }, []);

    // Group guides by client_id
    const guidesByClient = useMemo(() => {
        const map: Record<string, AccountingGuide[]> = {};
        guides.forEach(g => {
            if (!map[g.client_id]) map[g.client_id] = [];
            map[g.client_id].push(g);
        });
        return map;
    }, [guides]);

    // Filtered guides by client based on competency
    const filteredGuidesByClient = useMemo(() => {
        if (competencyFilter === 'all') return guidesByClient;
        const map: Record<string, AccountingGuide[]> = {};
        for (const clientId in guidesByClient) {
            const filtered = guidesByClient[clientId].filter(g => g.competency === competencyFilter);
            if (filtered.length > 0) {
                map[clientId] = filtered;
            } else {
                map[clientId] = [];
            }
        }
        return map;
    }, [guidesByClient, competencyFilter]);

    const activeClients = useMemo(() => {
        return clients.filter(c => {
            const matchesSearch = c.isActive && (
                c.nomeFantasia?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.razaoSocial?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.cnpj.includes(searchQuery)
            );
            const matchesRegime = selectedRegime === 'all' || c.regimeTributario === selectedRegime;

            const clientGuides = filteredGuidesByClient[c.id] || [];

            // If competency is filtered, only show clients that have at least one guide for it
            if (competencyFilter !== 'all' && clientGuides.length === 0) return false;

            const hasNoGuides = clientGuides.length === 0;
            const hasGuidesMissingFile = clientGuides.some(g => !g.file_url && g.status === 'pending');
            const hasGuidesReadyToSend = clientGuides.some(g => g.file_url && g.status === 'pending');
            const hasScheduled = clientGuides.some(g => g.status === 'scheduled');
            const isCompleted = clientGuides.length > 0 && clientGuides.every(g => g.status === 'sent' || g.status === 'completed');

            const matchesStatus =
                filterStatus === 'all' ||
                (filterStatus === 'pending_guide' && (hasNoGuides || hasGuidesMissingFile)) ||
                (filterStatus === 'pending_send' && hasGuidesReadyToSend) ||
                (filterStatus === 'scheduled' && hasScheduled) ||
                (filterStatus === 'completed' && isCompleted);

            return matchesSearch && matchesRegime && matchesStatus;
        }).sort((a, b) => (a.nomeFantasia || a.razaoSocial).localeCompare(b.nomeFantasia || b.razaoSocial));
    }, [clients, searchQuery, selectedRegime, filterStatus, filteredGuidesByClient, competencyFilter]);

    const handleGenerateCycle = async () => {
        if (isGenerating) return;

        // Filtra obrigações ativas NÃO-EVENTUAIS para geração automática mensal.
        // Obrigações "eventual" (TFE BAIXA, E-SOCIAL ADMISSÃO, etc.) são criadas manualmente.
        const generateableObligations = obligations.filter(o =>
            o.is_active && o.periodicity !== 'eventual'
        );
        const activeClients = clients.filter(c => c.isActive);

        if (generateableObligations.length === 0) {
            toast.warning('Não há obrigações ativas (mensais/trimestrais/anuais) cadastradas.');
            return;
        }

        if (activeClients.length === 0) {
            toast.warning('Não há empresas ativas cadastradas.');
            return;
        }

        const estimatedTotal = generateableObligations.length * activeClients.length;
        const confirmMsg = [
            `Gerar tarefas para ${format(new Date(selectedMonth + '-01'), 'MMMM/yyyy', { locale: ptBR })}?`,
            ``,
            `📋 ${generateableObligations.length} obrigações (mensais/trimestrais/anuais)`,
            `🏢 ${activeClients.length} empresas ativas`,
            `⚡ Estimativa: até ${estimatedTotal} tarefas`,
            ``,
            `Tarefas já existentes NÃO serão duplicadas.`
        ].join('\n');

        if (!window.confirm(confirmMsg)) return;

        setIsGenerating(true);
        const loadingToast = toast.loading('Verificando tarefas existentes...');

        try {
            // Busca fresh do banco as chaves já existentes para este mês
            // (não depende do estado local que é limitado a 10k linhas)
            const existingSet = await fetchExistingKeys(selectedMonth);

            const batchSet = new Set<string>();
            const [year, month] = selectedMonth.split('-').map(Number);
            const refDate = new Date(year, month - 1, 1);
            const newGuidesToCreate: any[] = [];

            for (const client of activeClients) {
                for (const obligation of generateableObligations) {
                    const key = `${client.id}__${obligation.name.toLowerCase()}`;
                    if (existingSet.has(key) || batchSet.has(key)) continue;

                    const explicitCompanies = obligation.company_ids || [];
                    let appliesByDefault = false;
                    
                    if (explicitCompanies.length > 0) {
                        appliesByDefault = explicitCompanies.includes(client.id);
                    } else {
                        const obsRegimes = obligation.tax_regimes || [];
                        const clientRegime = client.regimeTributario?.toLowerCase() || '';
                        appliesByDefault = obsRegimes.length === 0 || 
                                     obsRegimes.some((r: string) => r.toLowerCase() === 'all') || 
                                     (clientRegime && obsRegimes.some((r: string) => r.toLowerCase() === clientRegime));
                    }
                    
                    const override = clientObligations.find(co => co.client_id === client.id && co.obligation_id === obligation.id);
                    const isEligible = override ? override.status === 'enabled' : appliesByDefault;

                    if (!isEligible) continue;

                    let competencyStr = '';
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

                    const due_date = new Date(
                        `${selectedMonth}-${obligation.default_due_day.toString().padStart(2, '0')}`
                    );

                    newGuidesToCreate.push({
                        client_id: client.id,
                        type: obligation.name,
                        reference_month: selectedMonth,
                        competency: competencyStr,
                        due_date: isNaN(due_date.getTime()) ? null : due_date.toISOString(),
                        amount: null,
                        status: 'pending',
                        file_url: null,
                        scheduled_for: null,
                        sent_at: null,
                        delivered_at: null,
                        opened_at: null
                    });

                    batchSet.add(key);
                }
            }

            if (newGuidesToCreate.length === 0) {
                toast.info('Não há novas tarefas para gerar. Tudo já está atualizado para este mês.', { id: loadingToast });
                return;
            }

            // Inserir em lotes de 200 para evitar timeout do Supabase
            const CHUNK_SIZE = 200;
            let created = 0;
            for (let i = 0; i < newGuidesToCreate.length; i += CHUNK_SIZE) {
                const chunk = newGuidesToCreate.slice(i, i + CHUNK_SIZE);
                await createGuidesBulk(chunk);
                created += chunk.length;
                toast.loading(`Gerando tarefas... ${created}/${newGuidesToCreate.length}`, { id: loadingToast });
            }

            toast.success(`✅ ${newGuidesToCreate.length} tarefas geradas com sucesso!`, { id: loadingToast });
        } catch (err) {
            console.error('Erro ao gerar tarefas:', err);
            toast.error('Erro ao gerar tarefas. Tente novamente.', { id: loadingToast });
        } finally {
            setIsGenerating(false);
            fetchGuides(selectedMonth);
        }
    };

    const handleAiSendAll = async (processedFiles: ProcessedDeliveryFile[], provider: 'resend' | 'whatsapp') => {
        let successCount = 0;
        let updateCount = 0;
        let auditFailures = 0;
        // 1. Group by client
        const filesByClient: Record<string, ProcessedDeliveryFile[]> = {};
        for (const item of processedFiles) {
            if (!item.client || !item.data) {
                toast.error(`O arquivo ${item.file.name} não foi vinculado a nenhum cliente.`);
                continue;
            }

            if (!filesByClient[item.client.id]) {
                filesByClient[item.client.id] = [];
            }
            filesByClient[item.client.id].push(item);
        }

        // 2. Process each client group
        for (const clientId in filesByClient) {
            const clientFiles = filesByClient[clientId];
            const client = clientFiles[0].client;
            
            try {
                const guideIds: string[] = [];
                const consolidatedData: any[] = [];

                // Process each file for this client to create/update records
                for (const item of clientFiles) {
                    let guideRecord: any = null;
                    const guideTypeToMatch = item.matchedObligationName || item.data?.type || '';
                    
                    const existingGuide = guides.find(g =>
                        g.client_id === item.client.id &&
                        g.type.toLowerCase() === guideTypeToMatch.toLowerCase() &&
                        g.status === 'pending'
                    );

                    if (existingGuide) {
                        guideRecord = await updateGuide(existingGuide.id, {
                            due_date: item.data!.dueDate,
                            amount: parseFloat(item.data!.value),
                            file_url: item.publicUrl || null,
                            competency: item.data!.referenceMonth
                        });
                        updateCount++;
                    } else {
                        guideRecord = await createGuide({
                            client_id: item.client.id,
                            type: guideTypeToMatch,
                            reference_month: selectedMonth,
                            due_date: item.data!.dueDate,
                            amount: parseFloat(item.data!.value),
                            file_url: item.publicUrl || null,
                            competency: item.data!.referenceMonth,
                            status: 'pending',
                            scheduled_for: null,
                            sent_at: null,
                            delivered_at: null,
                            opened_at: null
                        });
                        successCount++;
                    }
                    if (guideRecord) {
                        guideIds.push(guideRecord.id);
                        consolidatedData.push({
                            ...item.data,
                            type: guideTypeToMatch,
                            publicUrl: item.publicUrl,
                            guideId: guideRecord.id
                        });
                    }
                }

                // Send the consolidated notification
                if (provider === 'whatsapp') {
                    let fullMessage = `Olá, seguem as guias para pagamento:\n\n`;
                    consolidatedData.forEach(d => {
                        const numVal = parseFloat(d.value);
                        const isNoValue = isNaN(numVal) || numVal === 0 || d.category === 'folha';
                        
                        if (isNoValue) {
                            fullMessage += `• ${d.type} (${d.referenceMonth})\n`;
                        } else {
                            const val = numVal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                            fullMessage += `• ${d.type} (${d.referenceMonth}): ${val} - Vencimento: ${new Date(d.dueDate).toLocaleDateString('pt-BR')}\n`;
                        }
                        if (d.publicUrl) fullMessage += `🔗 ${d.publicUrl}\n`;
                        fullMessage += `\n`;
                    });

                    const phone = (client.phone || client.telefone)?.replace(/\D/g, '');
                    if (phone) {
                        window.open(`https://web.whatsapp.com/send?phone=55${phone}&text=${encodeURIComponent(fullMessage)}`, '_blank');
                    }
                } else if (provider === 'resend') {
                    const branding = BrandingService.getBranding();
                    if (!client.email) {
                        toast.error(`E-mail não cadastrado para ${client.nomeFantasia || client.razaoSocial}`);
                        continue;
                    }

                    // Lógica Prévias para Condicionais
                    const hasFolha = clientFiles.some(f => f.data?.category === 'folha');
                    const hasGuia = clientFiles.some(f => f.data?.category === 'guia' || f.data?.category === 'inss');
                    const allFolha = clientFiles.every(f => f.data?.category === 'folha');
                    const allGuia = clientFiles.every(f => f.data?.category === 'guia' || f.data?.category === 'inss');

                    const columnTitle = hasFolha ? "DOCUMENTOS E IMPOSTOS" : "Guia / Imposto";

                    let guidesHtml = `
                        <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
                            <thead>
                                <tr style="background-color: #f8fafc;">
                                    <th style="padding: 12px; text-align: left; font-size: 11px; border-bottom: 1px solid #e2e8f0; color: #64748b; text-transform: uppercase; font-weight: 800;">${columnTitle}</th>
                                    <th style="padding: 12px; text-align: left; font-size: 11px; border-bottom: 1px solid #e2e8f0; color: #64748b; text-transform: uppercase; font-weight: 800;">Competência</th>
                                    <th style="padding: 12px; text-align: right; font-size: 11px; border-bottom: 1px solid #e2e8f0; color: #64748b; text-transform: uppercase; font-weight: 800;">Vencimento</th>
                                    <th style="padding: 12px; text-align: right; font-size: 11px; border-bottom: 1px solid #e2e8f0; color: #64748b; text-transform: uppercase; font-weight: 800;">Valor</th>
                                    <th style="padding: 12px; text-align: right; font-size: 11px; border-bottom: 1px solid #e2e8f0; color: #64748b; text-transform: uppercase; font-weight: 800;">Baixar</th>
                                </tr>
                            </thead>
                            <tbody>
                    `;

                    consolidatedData.forEach(d => {
                        const numVal = parseFloat(d.value);
                        const isNoValue = d.category === 'folha' || isNaN(numVal) || numVal === 0;
                        const val = isNoValue ? '-' : numVal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                        const due = isNoValue ? '-' : new Date(d.dueDate).toLocaleDateString('pt-BR');
                        const displayRefMonth = (d.referenceMonth === 'null' || !d.referenceMonth) ? selectedMonth : d.referenceMonth;
                        
                        guidesHtml += `
                            <tr>
                                <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #1e293b; font-weight: 500;">${d.type}</td>
                                <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #64748b;">${displayRefMonth}</td>
                                <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; text-align: right; color: #1e293b;">${due}</td>
                                <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; text-align: right; font-weight: 700; color: #1e293b;">${val}</td>
                                <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; text-align: right;">
                                    <a href="${d.publicUrl}" style="display: inline-block; padding: 6px 12px; background-color: ${branding.primaryColor}10; color: ${branding.primaryColor}; text-decoration: none; border-radius: 6px; font-size: 10px; font-weight: 800; text-transform: uppercase;">PDF</a>
                                </td>
                            </tr>
                        `;
                    });

                    guidesHtml += `</tbody></table>`;

                    // Lógica Dinâmica de Assunto e Título para Envio Consolidado

                    let subject = "";
                    let templateTitlePrefix = "Suas Guia(s) de";
                    let templateTitleSuffix = "Pagamento";

                    if (clientFiles.length === 1) {
                        // Se for apenas um arquivo, usa o rascunho exato da IA
                        subject = clientFiles[0].generatedSubject || "";
                        const category = clientFiles[0].data?.category;
                        if (category === 'folha') {
                            templateTitlePrefix = "Folha de Pagamento e";
                            templateTitleSuffix = "Impostos";
                        } else if (category === 'extrato') {
                            templateTitlePrefix = "Seu Extrato";
                            templateTitleSuffix = "Bancário";
                        }
                    } else {
                        // Envio Agrupado / Consolidado
                        if (allFolha) {
                            subject = `Folha Mensal e Documentos - ${client.nomeFantasia || client.razaoSocial}`;
                            templateTitlePrefix = "Folhas de Pagamento e";
                            templateTitleSuffix = "Impostos";
                        } else if (allGuia) {
                            subject = `Guias de Pagamento - ${client.nomeFantasia || client.razaoSocial}`;
                            templateTitlePrefix = "Suas Guia(s) de";
                            templateTitleSuffix = "Pagamento";
                        } else if (hasFolha) {
                            subject = `Folha Mensal e Guias - ${client.nomeFantasia || client.razaoSocial}`;
                            templateTitlePrefix = "Folha de Pagamento e";
                            templateTitleSuffix = "Impostos";
                        } else {
                            subject = `Documentos e Guias - ${client.nomeFantasia || client.razaoSocial}`;
                            templateTitlePrefix = "Seus Documentos e";
                            templateTitleSuffix = "Guias";
                        }
                    }

                    if (!subject || subject.trim() === "") {
                        subject = `Comunicado: Novos Documentos - ${client.nomeFantasia || client.razaoSocial}`;
                    }

                    const htmlContent = `
                        <div style="font-family: 'Inter', system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #f0f0f0; border-radius: 30px; background-color: #ffffff;">
                            <div style="text-align: center; margin-bottom: 35px;">
                                <h1 style="color: #1a1a1a; font-size: 26px; font-weight: 300; margin: 0; letter-spacing: -0.02em;">${templateTitlePrefix} <span style="color: ${branding.primaryColor}; font-weight: 800;">${templateTitleSuffix}</span></h1>
                                <p style="font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 8px;">Documentos Processados com Sucesso</p>
                            </div>
                            
                            <div style="line-height: 1.6; color: #475569; font-size: 15px; margin-bottom: 35px;">
                                Olá <strong>${client.nomeFantasia || client.razaoSocial}</strong>,<br><br>
                                Identificamos novos documentos prontos. Abaixo você encontrará o resumo detalhado e os links para download seguro:
                            </div>

                            ${guidesHtml}

                            <div style="margin: 30px 0; padding: 20px; background-color: #f8fafc; border-radius: 15px; text-align: center; border: 1px dashed #e2e8f0;">
                                <p style="font-size: 13px; color: #64748b; margin: 0;">⚠️ <strong>Atenção:</strong> Por favor, verifique as datas de vencimento para evitar multas por atraso.</p>
                            </div>

                            <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 40px 0;">
                            
                            <div style="text-align: center;">
                                <p style="font-size: 12px; color: #94a3b8; margin-bottom: 8px;">
                                    Este é um comunicado oficial enviado por<br><strong style="color: #1e293b; font-size: 14px;">${branding.companyName}</strong>.
                                </p>
                                <div style="display: inline-block; padding: 8px 15px; background-color: #f1f5f9; border-radius: 20px; font-size: 10px; color: #64748b; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em;">
                                    Confirmação de recebimento ativa
                                </div>
                            </div>

                            <!-- Tracking Pixel (Using first guide ID) -->
                            <img src="https://qvnktgjoarotzzkuptht.supabase.co/functions/v1/track-open?id=${guideIds[0]}" width="1" height="1" style="display:none;" />
                        </div>
                    `;

                    await ResendService.sendEmail({
                        to: client.email,
                        subject: subject,
                        html: htmlContent,
                        reply_to: branding.replyToEmail || undefined
                    });

                    // Update all guide statuses to completed (da baixa automática)
                    for (const id of guideIds) {
                        await updateGuide(id, {
                            status: 'completed',
                            sent_at: new Date().toISOString(),
                            completed_at: new Date().toISOString(),
                            completed_by: 'IA - Envio em Lote',
                            justification: 'Guia processada e enviada via IA'
                        });
                    }
                }
            } catch (error: any) {
                console.error("Erro ao processar guias agrupadas:", error);
                toast.error(`Erro ao processar guias para o cliente ${client.nomeFantasia}: ${error.message}`);
            }
        }

        toast.success(`Disparo em lote finalizado!`);
        fetchGuides(selectedMonth);
    };

    const handleExportXLSX = () => {
        const data = guides.map(g => ({
            'Cliente': g.client?.nome_fantasia || g.client?.razao_social,
            'CNPJ': g.client?.cnpj,
            'Imposto': g.type,
            'Competência': g.competency || '',
            'Vencimento': g.due_date ? format(parseISO(g.due_date), 'dd/MM/yyyy') : '',
            'Valor': g.amount,
            'Status': g.status,
            'Enviado em': g.sent_at ? format(parseISO(g.sent_at), 'dd/MM/yyyy HH:mm') : ''
        }));

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, 'Lista de Entrega');
        XLSX.writeFile(wb, `lista-entrega-${selectedMonth}.xlsx`);
    };

    const openClientDetail = (client: any) => {
        setSelectedClient(client);
        setIsClientModalOpen(true);
    };

    const getClientStats = (clientId: string) => {
        const clientGuides = filteredGuidesByClient[clientId] || [];
        const total = clientGuides.length;
        const sent = clientGuides.filter(g => g.status === 'sent').length;
        const scheduled = clientGuides.filter(g => g.status === 'scheduled').length;
        const pending = total - sent - scheduled;
        return { total, sent, scheduled, pending, clientGuides };
    };

    const handleSendAllPending = async () => {
        const pendingGuides = guides.filter(g => g.status === 'pending');
        if (pendingGuides.length === 0) {
            toast.info('Nenhuma guia pendente para envio.');
            return;
        }

        if (!confirm(`Deseja enviar ${pendingGuides.length} guias pendentes para seus respectivos clientes?`)) return;

        toast.info('Iniciando disparo em lote...');
        let success = 0;
        let errors = 0;

        // Group by client to send one email per client
        const pendingByClient: Record<string, AccountingGuide[]> = {};
        pendingGuides.forEach(g => {
            if (!pendingByClient[g.client_id]) pendingByClient[g.client_id] = [];
            pendingByClient[g.client_id].push(g);
        });

        for (const clientId in pendingByClient) {
            const clientItems = pendingByClient[clientId];
            const client = clientItems[0].client;

            if (!client?.email) {
                errors++;
                continue;
            }

            try {
                const branding = await BrandingService.getBranding();
                const emails = client.email.split(',').map((e: any) => e.trim());
                const formattedMonth = format(parseISO(`${selectedMonth}-01`), 'MMMM/yyyy', { locale: ptBR });
                const types = clientItems.map(i => i.type).join(' e ');

                const subject = (branding.deliveryEmailSubject || 'Guias de Pagamento: {{impostos}} - {{mes}}')
                    .replace(/{{impostos}}/g, types)
                    .replace(/{{mes}}/g, formattedMonth);

                const html = BrandingService.renderDeliveryEmail(
                    branding,
                    client.nome_fantasia || client.razao_social,
                    types,
                    formattedMonth,
                    clientItems
                );

                await ResendService.sendEmail({
                    to: emails.join(', '),
                    subject,
                    html
                });
                // Update local status
                const now = new Date().toISOString();
                // Update all guide statuses to completed (da baixa automática)
                for (const item of clientItems) {
                    await updateGuide(item.id, {
                        status: 'completed',
                        sent_at: now,
                        completed_at: now,
                        completed_by: user?.name || user?.email || 'Sistema',
                        justification: 'Envio manual pendente finalizado em lote'
                    });
                }
                success++;
            } catch (err) {
                console.error(`Erro ao enviar para ${clientId}:`, err);
                errors++;
            }
        }

        toast.success(`Disparo finalizado: ${success} clientes notificados. ${errors > 0 ? `${errors} erros.` : ''}`);
        fetchGuides(selectedMonth);
    };

    const handleCleanMonth = async () => {
        if (!confirm(`ATENÇÃO: Deseja remover TODAS as tarefas do mês ${selectedMonth}? Esta ação não pode ser desfeita.`)) return;
        await deleteAllGuides(selectedMonth);
    };


    return (
        <div className="max-w-[1600px] mx-auto space-y-10 px-4 sm:px-8 pb-12 animate-in fade-in duration-700">
            {/* Header / Global Actions */}
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between pt-8">
                <div>
                    <h1 className="text-4xl font-extralight tracking-tight text-foreground">Lista de <span className="text-primary font-normal">Entrega</span></h1>
                    <p className="text-[10px] font-normal text-muted-foreground uppercase tracking-[0.3em] mt-2 opacity-70">
                        Gestão de Tarefas e Impostos por Cliente
                    </p>
                </div>

                <div className="flex items-center flex-wrap gap-3">
                    <div className="bg-card border border-border/40 p-1.5 rounded-2xl flex items-center gap-1 shadow-sm">
                        <Button
                            onClick={handleExportXLSX}
                            variant="ghost"
                            size="sm"
                            className="rounded-xl text-[9px] uppercase font-bold tracking-widest h-10 px-4 hover:bg-primary/5 text-muted-foreground gap-2 transition-all"
                            title="Baixar planilha Excel com status de todas as guias do mês"
                        >
                            <Download className="h-4 w-4 opacity-40" /> Relatório
                        </Button>
                    </div>
                </div>
            </div>

            {/* Workflow Hub - Central de Comando e Planejamento */}
            <div className="space-y-10 mb-12 animate-in fade-in slide-in-from-top-4 duration-1000">
                {/* Nível 1: Mês & Ações de Geração */}
                <div className="bg-card/40 backdrop-blur-xl border border-border/40 rounded-[3rem] p-6 shadow-2xl shadow-primary/5">
                    <div className="flex flex-col xl:flex-row items-center gap-12">
                        {/* Seletor de Competência */}
                        <div className="flex items-center gap-6 w-full xl:w-auto min-w-[320px] bg-white/60 dark:bg-black/20 p-5 rounded-[2rem] border border-border/30 shadow-sm">
                            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                <CalendarIcon className="h-7 w-7" />
                            </div>
                            <div className="flex flex-col flex-1 min-w-0">
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mb-1">Competência de Referência</span>
                                <select
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                    className="bg-transparent text-xl font-light text-foreground outline-none cursor-pointer hover:text-primary transition-colors w-full appearance-none"
                                >
                                    {months.map(m => (
                                        <option key={m.value} value={m.value} className="bg-background text-foreground text-base">{m.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Divisor Vertical */}
                        <div className="hidden xl:block w-px h-20 bg-border/40" />

                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                            <Button
                                onClick={handleGenerateCycle}
                                disabled={isGenerating}
                                className="h-20 rounded-[1.5rem] bg-primary text-white hover:bg-primary/90 shadow-xl shadow-primary/20 flex flex-row items-center justify-center gap-4 group transition-all"
                            >
                                {isGenerating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Zap className="h-5 w-5 fill-current group-hover:scale-125 transition-transform" />}
                                <div className="flex flex-col items-start px-1">
                                    <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Rotina Mensal</span>
                                    <span className="text-sm font-bold">Gerar Tarefas</span>
                                </div>
                            </Button>

                            <Button
                                onClick={handleCleanMonth}
                                variant="ghost"
                                className="h-20 rounded-[1.5rem] text-muted-foreground/40 hover:text-destructive hover:bg-destructive/5 flex flex-row items-center justify-center gap-4 group transition-all"
                            >
                                <Trash2 className="h-5 w-5 opacity-40 group-hover:opacity-100 transition-all" />
                                <div className="flex flex-col items-start text-left px-1">
                                    <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Reset Manual</span>
                                    <span className="text-sm font-bold">Limpar Mês</span>
                                </div>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Nível 2: Operações de Lote */}
                <div className="relative group overflow-hidden bg-white/40 backdrop-blur-xl border border-border/40 rounded-[2.5rem] p-6 flex flex-col sm:flex-row items-center justify-between gap-8 shadow-sm hover:border-primary/20 transition-all">
                    <div className="relative flex items-center gap-5 px-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/5 border border-primary/10">
                            <BrainCircuit className="h-6 w-6 text-primary opacity-60" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/60">Controle Inteligente</span>
                            <span className="text-lg font-light text-foreground/80 tracking-tight">Gestão em <span className="text-primary font-normal">Lote</span></span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <Button
                            onClick={() => setIsBulkModalOpen(true)}
                            className="flex-1 sm:flex-none h-12 px-8 rounded-2xl gap-3 text-[11px] uppercase font-black tracking-wider bg-foreground text-background hover:bg-primary hover:text-white transition-all shadow-lg"
                        >
                            <Plus className="h-4 w-4" />
                            Criar em Lote
                        </Button>
                        <Button
                            onClick={handleSendAllPending}
                            className="flex-1 sm:flex-none h-12 px-8 rounded-2xl gap-3 text-[11px] uppercase font-black tracking-wider bg-primary text-white shadow-xl shadow-primary/20 hover:scale-105 transition-all"
                        >
                            <Send className="h-4 w-4" />
                            Enviar Pendentes
                        </Button>
                    </div>
                </div>
            </div>
            {/* Section: Envio em Lote (Dropzone) */}
            <section className="bg-card/30 backdrop-blur-sm rounded-[3rem] border border-border/40 p-2 shadow-sm overflow-hidden transition-all hover:border-primary/20">
                <div className="bg-primary/[0.01] p-8 border-b border-border/10">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-light text-foreground flex items-center gap-3">
                                <Send className="h-5 w-5 text-primary opacity-60" />
                                1. Enviar Guias em Lote
                            </h2>
                            <p className="text-xs text-muted-foreground font-light mt-1">Arraste seus PDFs aqui. A IA identificará o cliente e preencherá a tarefa automaticamente.</p>
                        </div>
                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 animate-pulse">
                            IA Ativa
                        </Badge>
                    </div>
                </div>
                <div className="p-8">
                    <DeliveryAiDropZone onSendAll={handleAiSendAll} />
                </div>
            </section>



            <Tabs defaultValue="clients" value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="space-y-8">
                <TabsList className="bg-muted/20 p-1.5 rounded-2xl h-auto border border-border/10 inline-flex">
                    <TabsTrigger value="clients" className="rounded-xl px-6 py-2.5 text-[10px] uppercase font-bold tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white">
                        <Building2 className="h-3.5 w-3.5 mr-2" /> Clientes
                    </TabsTrigger>
                    <TabsTrigger value="history" className="rounded-xl px-6 py-2.5 text-[10px] uppercase font-bold tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white">
                        <History className="h-3.5 w-3.5 mr-2" /> Log de Envios
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="clients" className="space-y-8 outline-none">
                    {/* Search & Stats Bar */}
                    <div className="bg-card border border-border/40 rounded-[2.5rem] p-8 shadow-sm space-y-8">
                        {/* Top Row: Search and Main Settings */}
                        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                            <div className="relative flex-1 w-full lg:max-w-md">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                                <Input
                                    placeholder="Buscar cliente por nome ou CNPJ..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="h-12 pl-12 rounded-2xl border-border/30 bg-muted/20 text-sm font-light transition-all focus:border-primary/30"
                                />
                            </div>

                            <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
                                <select
                                    value={selectedRegime}
                                    onChange={(e) => setSelectedRegime(e.target.value as any)}
                                    className="flex-1 lg:flex-none h-12 px-6 rounded-2xl bg-muted/20 border border-border/30 text-sm font-light text-foreground outline-none cursor-pointer hover:bg-muted/30 transition-all"
                                >
                                    <option value="all">Filtro: Todos Regimes</option>
                                    <option value="simples">Simples Nacional</option>
                                    <option value="presumido">Lucro Presumido</option>
                                    <option value="real">Lucro Real</option>
                                    <option value="domestico">Doméstico</option>
                                </select>
                                <select
                                    value={competencyFilter}
                                    onChange={(e) => setCompetencyFilter(e.target.value)}
                                    className="flex-1 lg:flex-none h-12 px-6 rounded-2xl bg-muted/20 border border-border/30 text-sm font-light text-foreground outline-none cursor-pointer hover:bg-muted/30 transition-all"
                                >
                                    <option value="all">Filtro: Todas Competências</option>
                                    {competencyTypes.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>

                                <div className="flex bg-muted/20 p-1 rounded-xl border border-border/30 ml-auto lg:ml-0">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setViewMode('grid')}
                                        className={cn(
                                            "h-9 w-9 rounded-lg transition-all",
                                            viewMode === 'grid' ? "bg-card text-primary shadow-sm" : "text-muted-foreground/40"
                                        )}
                                    >
                                        <LayoutGrid className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setViewMode('list')}
                                        className={cn(
                                            "h-9 w-9 rounded-lg transition-all",
                                            viewMode === 'list' ? "bg-card text-primary shadow-sm" : "text-muted-foreground/40"
                                        )}
                                    >
                                        <List className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Row: Status Tabs and Counter */}
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-8 border-t border-border/10">
                            <div className="flex flex-wrap items-center gap-2 bg-muted/10 p-1.5 rounded-2xl border border-border/10 w-full md:w-auto overflow-x-auto [scrollbar-width:none]">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setFilterStatus('all')}
                                    className={cn(
                                        "h-10 px-6 rounded-xl text-[10px] uppercase font-black tracking-widest transition-all",
                                        filterStatus === 'all' ? "bg-card text-primary shadow-sm border border-border/40" : "text-muted-foreground/50 border border-transparent"
                                    )}
                                >
                                    Todos
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setFilterStatus('pending_guide')}
                                    className={cn(
                                        "h-10 px-6 rounded-xl text-[10px] uppercase font-black tracking-widest transition-all",
                                        filterStatus === 'pending_guide' ? "bg-card text-amber-600 shadow-sm border border-border/40" : "text-muted-foreground/50 border border-transparent"
                                    )}
                                >
                                    Sem Guia
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setFilterStatus('pending_send')}
                                    className={cn(
                                        "h-10 px-6 rounded-xl text-[10px] uppercase font-black tracking-widest transition-all",
                                        filterStatus === 'pending_send' ? "bg-card text-blue-600 shadow-sm border border-border/40" : "text-muted-foreground/50 border border-transparent"
                                    )}
                                >
                                    Enviar
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setFilterStatus('scheduled')}
                                    className={cn(
                                        "h-10 px-6 rounded-xl text-[10px] uppercase font-black tracking-widest transition-all",
                                        filterStatus === 'scheduled' ? "bg-card text-blue-500 shadow-sm border border-border/40" : "text-muted-foreground/50 border border-transparent"
                                    )}
                                >
                                    Agendados
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setFilterStatus('completed')}
                                    className={cn(
                                        "h-10 px-6 rounded-xl text-[10px] uppercase font-black tracking-widest transition-all",
                                        filterStatus === 'completed' ? "bg-card text-emerald-600 shadow-sm border border-border/40" : "text-muted-foreground/50 border border-transparent"
                                    )}
                                >
                                    Finalizados
                                </Button>
                            </div>

                            <div className="flex items-center gap-8 shrink-0 bg-primary/[0.03] px-8 py-3 rounded-[2rem] border border-primary/10 shadow-sm ml-auto md:ml-0">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl font-light text-foreground">{guides.length}</span>
                                    <div className="flex flex-col">
                                        <span className="text-[8px] uppercase font-bold tracking-[0.2em] text-muted-foreground/60 leading-tight">Total</span>
                                        <span className="text-[8px] uppercase font-bold tracking-[0.2em] text-muted-foreground leading-tight">Guias</span>
                                    </div>
                                </div>
                                <div className="w-px h-8 bg-primary/10" />
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl font-light text-emerald-600">{guides.filter(g => g.status === 'sent').length}</span>
                                    <div className="flex flex-col">
                                        <span className="text-[8px] uppercase font-bold tracking-[0.2em] text-emerald-600/60 leading-tight">Guias</span>
                                        <span className="text-[8px] uppercase font-bold tracking-[0.2em] text-emerald-600 leading-tight">Enviadas</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Clients Grid - Identical to Clients Page style */}
                    {loading || clientsLoading ? (
                        <div className="py-40 flex flex-col items-center justify-center gap-6">
                            <Loader2 className="h-12 w-12 animate-spin text-primary opacity-30" />
                            <p className="text-[11px] uppercase font-bold tracking-[0.3em] text-muted-foreground/50">Carregando Clientes</p>
                        </div>
                    ) : viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 animate-slide-in-up stagger-2">
                            {activeClients.map((client) => {
                                const stats = getClientStats(client.id);
                                return (
                                    <div
                                        key={client.id}
                                        onClick={() => openClientDetail(client)}
                                        className={cn(
                                            'group relative flex flex-col h-full rounded-[3.5rem] border border-border/40 bg-white/40 backdrop-blur-md p-10 shadow-sm transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-2 cursor-pointer overflow-hidden',
                                            stats.pending > 0 ? 'hover:border-amber-500/20' : 'hover:border-emerald-500/20'
                                        )}
                                    >
                                        {/* Status Glow Background */}
                                        <div className={cn(
                                            "absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[80px] opacity-10 transition-all duration-700 group-hover:opacity-20",
                                            stats.pending > 0 ? "bg-amber-500" : "bg-emerald-500"
                                        )} />

                                        {/* Header Section */}
                                        <div className="relative flex items-start justify-between mb-12">
                                            <div className="flex flex-col gap-4">
                                                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-muted/50 to-muted/10 border border-white/40 shadow-inner group-hover:scale-110 transition-transform duration-500">
                                                    <Building2 className="h-7 w-7 text-primary/40 group-hover:text-primary transition-colors" />
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="font-light text-3xl text-foreground tracking-tight group-hover:text-primary transition-colors duration-500 leading-tight">
                                                        {client.nomeFantasia || client.razaoSocial}
                                                    </h3>
                                                    <div className="flex items-center gap-4 mt-3">
                                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/40">
                                                            {client.regimeTributario}
                                                        </span>
                                                        <div className="h-1 w-1 rounded-full bg-border" />
                                                        <span className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-widest">
                                                            {client.cnpj}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Minimalist Circular Progress Indicator */}
                                            <div className="relative h-14 w-14 flex items-center justify-center">
                                                <svg className="h-14 w-14 -rotate-90">
                                                    <circle className="text-border/10" strokeWidth="3" stroke="currentColor" fill="transparent" r="24" cx="28" cy="28" />
                                                    <circle
                                                        className={cn("transition-all duration-1000", stats.pending > 0 ? "text-amber-500/40" : "text-emerald-500/40")}
                                                        strokeWidth="3"
                                                        strokeDasharray={150}
                                                        strokeDashoffset={150 - (150 * (stats.sent / (stats.total || 1)))}
                                                        strokeLinecap="round"
                                                        stroke="currentColor"
                                                        fill="transparent"
                                                        r="24" cx="28" cy="28"
                                                    />
                                                </svg>
                                                <span className="absolute text-[10px] font-black text-foreground/40">
                                                    {Math.round((stats.sent / (stats.total || 1)) * 100)}%
                                                </span>
                                            </div>
                                        </div>

                                        {/* Stats Bento Grid */}
                                        <div className="relative grid grid-cols-2 gap-4 mb-12">
                                            <div className="bg-white/30 border border-white/50 rounded-[2rem] p-6 flex flex-col items-center justify-center group/item transition-all hover:bg-white/60">
                                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-600/40 mb-3">Pendente</span>
                                                <p className="text-4xl font-extralight text-amber-600 group-hover/item:scale-110 transition-transform duration-500">{stats.pending}</p>
                                            </div>
                                            <div className="bg-white/30 border border-white/50 rounded-[2rem] p-6 flex flex-col items-center justify-center group/item transition-all hover:bg-white/60">
                                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-600/40 mb-3">Concluído</span>
                                                <p className="text-4xl font-extralight text-emerald-600 group-hover/item:scale-110 transition-transform duration-500">{stats.sent}</p>
                                            </div>
                                        </div>

                                        {/* Activity Timeline / Task Pills */}
                                        <div className="relative mt-auto pt-8 border-t border-border/10">
                                            <div className="flex items-center justify-between mb-4">
                                                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/30">Status Geral</span>
                                                <span className="text-[9px] font-bold text-primary/60">{stats.total} Atividades</span>
                                            </div>
                                            <div className="flex flex-wrap gap-2.5">
                                                {stats.clientGuides.length === 0 ? (
                                                    <div className="text-[10px] font-medium text-muted-foreground/30 italic">Sem tarefas para este ciclo.</div>
                                                ) : (
                                                    stats.clientGuides.map((g) => (
                                                        <div
                                                            key={g.id}
                                                            className={cn(
                                                                "h-1.5 flex-1 min-w-[30px] rounded-full transition-all duration-700",
                                                                g.status === 'sent' ? "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]" :
                                                                    g.status === 'scheduled' ? "bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.3)]" :
                                                                        g.file_url ? "bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]" :
                                                                            "bg-amber-500/20"
                                                            )}
                                                            title={g.type}
                                                        />
                                                    ))
                                                )}
                                            </div>
                                        </div>

                                        {/* Hover Interaction Visualizer */}
                                        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                            <ArrowRight className="h-6 w-6 text-primary/20 rotate-[-45deg] group-hover:rotate-0 transition-transform duration-500" />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="bg-card rounded-[2.5rem] border border-border/40 overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-4">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-border/10 hover:bg-transparent">
                                        <TableHead className="text-[10px] uppercase font-bold tracking-widest p-6 text-muted-foreground/60 w-[40%]">Cliente</TableHead>
                                        <TableHead className="text-[10px] uppercase font-bold tracking-widest p-6 text-muted-foreground/60">Regime</TableHead>
                                        <TableHead className="text-[10px] uppercase font-bold tracking-widest p-6 text-muted-foreground/60 text-center">Pendentes</TableHead>
                                        <TableHead className="text-[10px] uppercase font-bold tracking-widest p-6 text-muted-foreground/60 text-center">Enviadas</TableHead>
                                        <TableHead className="text-[10px] uppercase font-bold tracking-widest p-6 text-muted-foreground/60 text-right">Ação</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {activeClients.map((client) => {
                                        const stats = getClientStats(client.id);
                                        return (
                                            <TableRow
                                                key={client.id}
                                                className="border-border/5 hover:bg-muted/10 cursor-pointer group transition-colors"
                                                onClick={() => openClientDetail(client)}
                                            >
                                                <TableCell className="p-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-10 w-10 rounded-xl bg-muted/20 flex items-center justify-center border border-border/5 group-hover:bg-primary/5 group-hover:border-primary/20 transition-all">
                                                            <Building2 className="h-5 w-5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-light text-foreground">{client.nomeFantasia || client.razaoSocial}</p>
                                                            <p className="text-[9px] text-muted-foreground font-mono mt-0.5">{client.cnpj}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="p-6">
                                                    <Badge variant="outline" className="text-[8px] uppercase tracking-tighter bg-primary/5 border-none text-primary/60 px-2 py-0">
                                                        {client.regimeTributario}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="p-6 text-center">
                                                    <span className={cn(
                                                        "text-sm font-light",
                                                        stats.pending > 0 ? "text-amber-500 font-medium" : "text-muted-foreground/40"
                                                    )}>{stats.pending}</span>
                                                </TableCell>
                                                <TableCell className="p-6 text-center">
                                                    <span className={cn(
                                                        "text-sm font-light",
                                                        stats.sent > 0 ? "text-emerald-500 font-medium" : "text-muted-foreground/40"
                                                    )}>{stats.sent}</span>
                                                </TableCell>
                                                <TableCell className="p-6 text-right">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg group-hover:bg-primary/10 group-hover:text-primary">
                                                        <ArrowRight className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="history" className="space-y-8 outline-none">
                    {/* History Search Bar */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-card border border-border/40 rounded-[2rem] p-6 shadow-sm">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                            <Input
                                placeholder="Filtrar por cliente, imposto ou data..."
                                value={historySearchQuery}
                                onChange={(e) => setHistorySearchQuery(e.target.value)}
                                className="h-12 pl-12 rounded-2xl border-border/30 bg-muted/20 text-sm font-light transition-all focus:border-primary/30"
                            />
                        </div>
                        <div className="flex items-center gap-6 shrink-0 bg-muted/30 px-6 py-2.5 rounded-2xl border border-border/10">
                            <div className="flex flex-col items-center">
                                <span className="text-lg font-light text-foreground">{historyGuides.length}</span>
                                <span className="text-[8px] uppercase font-bold tracking-wider text-muted-foreground">Total Enviados</span>
                            </div>
                            <div className="w-px h-8 bg-border/40" />
                            <div className="flex flex-col items-center">
                                <span className="text-lg font-light text-emerald-600">{historyGuides.filter(g => g.delivered_at).length}</span>
                                <span className="text-[8px] uppercase font-bold tracking-wider text-muted-foreground">Entregues</span>
                            </div>
                        </div>
                    </div>

                    {/* History Table */}
                    <div className="bg-card rounded-[2.5rem] border border-border/40 overflow-hidden shadow-sm">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-border/10 hover:bg-transparent">
                                    <TableHead className="text-[10px] uppercase font-bold tracking-widest p-6 text-muted-foreground/60 w-[35%]">Cliente</TableHead>
                                    <TableHead className="text-[10px] uppercase font-bold tracking-widest p-6 text-muted-foreground/60 text-center">Tipo / Imposto</TableHead>
                                    <TableHead className="text-[10px] uppercase font-bold tracking-widest p-6 text-muted-foreground/60 text-center">Data Envio</TableHead>
                                    <TableHead className="text-[10px] uppercase font-bold tracking-widest p-6 text-muted-foreground/60 text-center">Status Tracking</TableHead>
                                    <TableHead className="text-[10px] uppercase font-bold tracking-widest p-6 text-muted-foreground/60 text-right">Ação</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {historyGuides.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="py-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <SearchX className="h-10 w-10 text-muted-foreground/20" />
                                                <p className="text-sm font-light text-muted-foreground">Nenhum envio encontrado no histórico para este mês.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    historyGuides.map((guide) => (
                                        <TableRow key={guide.id} className="border-border/5 hover:bg-muted/10 transition-colors">
                                            <TableCell className="p-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-xl bg-muted/20 flex items-center justify-center border border-border/5">
                                                        <Building2 className="h-5 w-5 text-muted-foreground/40" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-light text-foreground">{guide.client?.nome_fantasia || guide.client?.razao_social}</p>
                                                        <p className="text-[9px] text-muted-foreground font-mono mt-0.5">{guide.client?.cnpj}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="p-6 text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                    <Badge variant="outline" className="text-[8px] uppercase tracking-tighter bg-primary/5 border-none text-primary/60 px-2 py-0">
                                                        {guide.type}
                                                    </Badge>
                                                    {guide.competency && (
                                                        <span className="text-[9px] font-medium text-muted-foreground/60 uppercase tracking-tighter">{guide.competency}</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="p-6">
                                                <div className="flex flex-col gap-2">
                                                    <p className="text-[13px] font-medium text-foreground/90">
                                                        Guia enviada para {guide.client?.nome_fantasia || guide.client?.razao_social},
                                                    </p>
                                                    <div className="flex items-center flex-wrap gap-3 text-[12.5px] text-foreground/80 font-semibold bg-primary/5 px-4 py-3 rounded-2xl border border-primary/10 shadow-sm">
                                                        <span className="text-primary font-black text-xl leading-none select-none">•</span>
                                                        <span className="text-foreground">{guide.sent_at ? format(parseISO(guide.sent_at), 'dd/MM/yyyy HH:mm') : '--:--'}</span>
                                                        <span className="text-primary/70 bg-primary/10 px-2 py-0.5 rounded-lg text-[10px] uppercase tracking-wider">(Destinatário)</span>
                                                        <span className="text-foreground/70">acessou o arquivo (via link do e-mail) através do IP:</span>
                                                        <span className="text-primary font-bold font-mono bg-white/50 px-3 py-1 rounded-xl border border-primary/10 shadow-inner">{guide.sender_ip || '---'}</span>
                                                        <span className="text-muted-foreground/60 font-medium">- e-mail: {guide.client?.email || 'N/A'}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="p-6">
                                                <div className="flex justify-center gap-4">
                                                    <div className="flex flex-col items-center gap-1" title={guide.delivered_at ? `Entregue em: ${format(parseISO(guide.delivered_at), 'dd/MM HH:mm')}` : 'Aguardando entrega'}>
                                                        <div className={cn("h-2 w-2 rounded-full", guide.delivered_at ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-muted/30")} />
                                                        <span className="text-[7px] uppercase font-bold tracking-widest text-muted-foreground/40">Entregue</span>
                                                    </div>
                                                    <div className="flex flex-col items-center gap-1" title={guide.opened_at ? `Aberto em: ${format(parseISO(guide.opened_at), 'dd/MM HH:mm')}` : 'Aguardando abertura'}>
                                                        <div className={cn("h-2 w-2 rounded-full", guide.opened_at ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" : "bg-muted/30")} />
                                                        <span className="text-[7px] uppercase font-bold tracking-widest text-muted-foreground/40">Aberto</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="p-6 text-right">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" asChild title="Visualizar Guia">
                                                    <a href={guide.file_url || '#'} target="_blank" rel="noopener noreferrer">
                                                        <Eye className="h-4 w-4" />
                                                    </a>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Client Detail Modal */}
            <ClientGuidesModal
                open={isClientModalOpen}
                onOpenChange={setIsClientModalOpen}
                client={selectedClient}
                referenceMonth={selectedMonth}
                guides={selectedClient ? (filteredGuidesByClient[selectedClient.id] || []) : []}
                onUpdate={() => fetchGuides(selectedMonth)}
            />

            <BulkGuideDialog
                open={isBulkModalOpen}
                onOpenChange={setIsBulkModalOpen}
                referenceMonth={selectedMonth}
                onSuccess={() => fetchGuides(selectedMonth)}
            />


            {/* COMPOSER DIALOGS (if any) */}
        </div>
    );
}
