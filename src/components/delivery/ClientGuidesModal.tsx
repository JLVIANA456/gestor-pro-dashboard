import { useState, useMemo } from 'react';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle,
    DialogDescription 
} from "@/components/ui/dialog";
import { 
    FileText, 
    Send, 
    Plus, 
    Trash2, 
    MoreHorizontal,
    MailCheck,
    CloudUpload,
    Loader2,
    CheckCircle2,
    Clock, 
    Inbox, 
    Eye, 
    Building2, 
    Calendar, 
    Mail, 
    Copy,
    ArrowRight,
    Check,
    List
} from 'lucide-react';
import { useClients } from '@/hooks/useClients';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useDeliveryList, AccountingGuide } from '@/hooks/useDeliveryList';
import { ResendService } from '@/services/resendService';
import { BrandingService } from '@/services/brandingService';
import { AiService } from '@/services/aiService';
import { NewGuideDialog } from '@/components/delivery/NewGuideDialog';
import { useDeliveryTemplates } from '@/hooks/useDeliveryTemplates';

interface ClientGuidesModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    client: any;
    referenceMonth: string;
    guides: AccountingGuide[];
    onUpdate: () => void;
}

export function ClientGuidesModal({ 
    open, 
    onOpenChange, 
    client, 
    referenceMonth, 
    guides: initialGuides, // Recebemos inicialmente, mas usaremos o hook para atualizações em tempo real
    onUpdate
}: ClientGuidesModalProps) {
    const { guides: allGuides, createGuide, createGuidesBulk, updateGuideStatus, deleteGuide, updateGuide } = useDeliveryList(referenceMonth);
    const guides = useMemo(() => allGuides.filter(g => g.client_id === client?.id), [allGuides, client?.id]);
    const { clients } = useClients();
    const { templates } = useDeliveryTemplates();
    const [selectedGuides, setSelectedGuides] = useState<string[]>([]);
    const [isSending, setIsSending] = useState(false);
    const [uploadingId, setUploadingId] = useState<string | null>(null);
    const [isNewGuideOpen, setIsNewGuideOpen] = useState(false);
    const [schedulingGuide, setSchedulingGuide] = useState<AccountingGuide | null>(null);
    const [scheduleDate, setScheduleDate] = useState('');
    const [activeModalTab, setActiveModalTab] = useState('list');
    
    // States for Envio Individual Tab
    const [quickSendTaskId, setQuickSendTaskId] = useState('');
    const [quickSendFile, setQuickSendFile] = useState<File | null>(null);
    const [quickSendData, setQuickSendData] = useState({
        amount: '',
        due_date: '',
        competency: '',
        file_url: ''
    });
    const [isProcessingQuick, setIsProcessingQuick] = useState(false);

    // Grouping tasks for better organization
    const groupedGuides = useMemo(() => {
        return {
            pending: guides.filter(g => !g.file_url && g.status !== 'sent'),
            ready: guides.filter(g => g.file_url && g.status === 'pending'),
            sent: guides.filter(g => g.status === 'sent' || g.status === 'scheduled')
        };
    }, [guides]);

    const handleFileUpload = async (guideId: string, file: File) => {
        setUploadingId(guideId);
        const loadingToast = toast.loading('Processando guia com IA...');

        try {
            // 1. Extract data with IA
            const data = await AiService.extractGuideData(file);
            
            // --- IA AUDIT ---
            const extractedCnpj = (data.cnpj || '').replace(/\D/g, '');
            const clientCnpj = (client.cnpj || '').replace(/\D/g, '');
            
            if (extractedCnpj && clientCnpj && extractedCnpj !== clientCnpj) {
                toast.error(`Audit: Este PDF parece ser da empresa CNPJ ${data.cnpj}. Por segurança, o upload foi bloqueado.`, { id: loadingToast });
                return;
            }

            // 2. Upload file
            const resource = await AiService.uploadFile(file);

            // 3. Update guide
            await updateGuide(guideId, {
                file_url: resource.publicUrl,
                amount: parseFloat(data.value) || 0,
                due_date: data.dueDate ? data.dueDate.split('T')[0] : null,
                competency: data.referenceMonth || null
            });

            toast.success('Guia anexada e validada com sucesso!', { id: loadingToast });
            onUpdate();
        } catch (error: any) {
            console.error(error);
            toast.error('Erro ao processar arquivo: ' + error.message, { id: loadingToast });
        } finally {
            setUploadingId(null);
        }
    };

    const handleQuickFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setQuickSendFile(file);
        setIsProcessingQuick(true);
        const loadingToast = toast.loading('IA lendo documento...');

        try {
            const data = await AiService.extractGuideData(file);
            const resource = await AiService.uploadFile(file);

            setQuickSendData({
                amount: data.value || '',
                due_date: data.dueDate ? data.dueDate.split('T')[0] : '',
                competency: data.referenceMonth || '',
                file_url: resource.publicUrl
            });
            toast.success('Dados extraídos com sucesso!', { id: loadingToast });
        } catch (error: any) {
            toast.error('Erro ao ler PDF. Por favor, preencha manualmente.', { id: loadingToast });
        } finally {
            setIsProcessingQuick(false);
        }
    };

    const handleConfirmQuickSend = async () => {
        if (!quickSendTaskId) return toast.error('Selecione uma tarefa.');
        if (!quickSendData.file_url) return toast.error('Anexe o arquivo PDF.');

        setIsSending(true);
        const loadingToast = toast.loading('Enviando e-mail...');

        try {
            // 1. Update the record
            await updateGuide(quickSendTaskId, {
                file_url: quickSendData.file_url,
                amount: parseFloat(quickSendData.amount) || 0,
                due_date: quickSendData.due_date || null,
                competency: quickSendData.competency || null
            });

            // 2. Send the email
            const task = guides.find(g => g.id === quickSendTaskId);
            const branding = BrandingService.getBranding();
            const emails = client.email.split(',').map((e: string) => e.trim());
            const formattedMonth = format(parseISO(`${referenceMonth}-01`), 'MMMM/yyyy', { locale: ptBR });

            const formattedValue = (parseFloat(quickSendData.amount) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            const formattedDate = quickSendData.due_date ? format(parseISO(quickSendData.due_date), 'dd/MM/yyyy') : '--';

            const replacements = {
                "{{nome_empresa}}": client.nomeFantasia || client.razaoSocial,
                "{{nome_imposto}}": task?.type || 'Imposto',
                "{{competencia}}": quickSendData.competency || formattedMonth,
                "{{data_vencimento}}": formattedDate,
                "{{valor_guia}}": formattedValue,
                "{{link_documento}}": `<a href="${quickSendData.file_url}">${branding.buttonText || 'Acesse o Documento - Clicando Aqui'}</a>`,
                "{{companyName}}": branding.companyName || 'JLVIANA Consultoria Contábil',
                "{{JLVIANA Consultoria Contábil}}": branding.companyName || 'JLVIANA Consultoria Contábil'
            };

            let subject = branding.deliveryEmailSubject || "Envio de Guia - {{nome_imposto}} - {{competencia}} - {{nome_empresa}}";
            let message = branding.deliveryEmailBody || "";

            Object.entries(replacements).forEach(([key, value]) => {
                const regex = new RegExp(key, 'g');
                subject = subject.replace(regex, value);
                message = message.replace(regex, value);
            });

            const htmlContent = `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #f0f0f0; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); background-color: #ffffff;">
                    <div style="text-align: center; margin-bottom: 25px;">
                        <h1 style="color: #1a1a1a; font-size: 24px; font-weight: 300; margin: 0;">Guia <span style="color: ${branding.primaryColor}; font-weight: 600;">Disponível</span></h1>
                    </div>
                    
                    <div style="line-height: 1.8; color: #444; font-size: 16px; margin-bottom: 30px;">
                        ${message.replace(/\n/g, '<br>').replace(/<a href="(.*?)">(.*?)<\/a>/g, `
                            <div style="margin: 35px 0; text-align: center;">
                                <a href="$1" style="background-color: ${branding.primaryColor}; color: white !important; padding: 15px 35px; text-decoration: none !important; border-radius: 12px; font-weight: bold; display: inline-block; box-shadow: 0 4px 15px rgba(0,0,0,0.1); font-size: 16px;">$2</a>
                            </div>
                        `)}
                    </div>

                    <hr style="border: 0; border-top: 1px solid #f0f0f0; margin: 30px 0;">
                    
                    <div style="text-align: center;">
                        <p style="font-size: 12px; color: #999; margin-bottom: 5px;">
                            Este é um comunicado automático enviado por <strong>${branding.companyName}</strong>.
                        </p>
                    </div>

                    <!-- Tracking Pixel -->
                    <img src="https://qvnktgjoarotzzkuptht.supabase.co/functions/v1/track-open?id=${quickSendTaskId}" width="1" height="1" style="display:none;" />
                </div>
            `;

            await ResendService.sendEmail({
                to: emails.join(', '),
                subject,
                html: htmlContent,
                reply_to: branding.replyToEmail || undefined
            });

            await updateGuideStatus(quickSendTaskId, 'sent', new Date().toISOString());
            
            toast.success('Guia enviada com sucesso!', { id: loadingToast });
            onUpdate();
            // Reset and go back to list
            setQuickSendTaskId('');
            setQuickSendFile(null);
            setQuickSendData({ amount: '', due_date: '', competency: '', file_url: '' });
            setActiveModalTab('list');
        } catch (error) {
            toast.error('Erro ao finalizar envio.', { id: loadingToast });
        } finally {
            setIsSending(false);
        }
    };
    const handleGenerateCycle = async () => {
        setIsSending(true);
        const loadingToast = toast.loading("Gerando tarefas do cliente...");
        const newGuidesToCreate: any[] = [];

        try {
            const clientTemplates = templates.filter(t =>
                t.regime === 'all' ||
                t.regime.toLowerCase() === client.regimeTributario?.toLowerCase() ||
                (t.regime === 'employees' && client.hasEmployees) ||
                (t.regime === 'service_taker' && client.isServiceTaker)
            );

            const uniqueTemplates = Array.from(new Map(clientTemplates.map(t => [t.type, t])).values());
            const existingTypes = new Set(guides.map(g => g.type.toLowerCase()));

            for (const template of uniqueTemplates) {
                if (!template.type || existingTypes.has(template.type.toLowerCase())) continue;

                const [year, month] = referenceMonth.split('-').map(Number);
                const refDate = new Date(year, month - 1, 1);
                
                let competencyStr = '';
                if (template.competency_rule === 'previous_month') {
                    const prevDate = new Date(year, month - 2, 1);
                    competencyStr = format(prevDate, 'MM/yyyy');
                } else if (template.competency_rule === 'current_month') {
                    competencyStr = format(refDate, 'MM/yyyy');
                } else if (template.competency_rule === 'quarterly') {
                    const q = Math.ceil(month / 3);
                    competencyStr = `${q}º Trimestre / ${year}`;
                } else {
                    competencyStr = `Ano ${year}`;
                }

                const due_date = new Date(referenceMonth + `-${template.due_day.toString().padStart(2, '0')}`);

                newGuidesToCreate.push({
                    client_id: client.id,
                    type: template.type,
                    reference_month: referenceMonth,
                    competency: competencyStr,
                    due_date: isNaN(due_date.getTime()) ? null : due_date.toISOString(),
                    amount: null,
                    status: 'pending',
                    file_url: null
                });
            }

            if (newGuidesToCreate.length > 0) {
                await createGuidesBulk(newGuidesToCreate);
                toast.success(`${newGuidesToCreate.length} tarefas geradas!`, { id: loadingToast });
                onUpdate();
            } else {
                toast.info("Nenhuma nova tarefa para gerar.", { id: loadingToast });
            }
        } catch (err) {
            toast.error("Erro ao gerar tarefas.", { id: loadingToast });
        } finally {
            setIsSending(false);
        }
    };
    const handleReplicate = async (guide: AccountingGuide) => {
        const targetClients = clients.filter(c => 
            c.isActive && 
            c.regimeTributario === client.regimeTributario && 
            c.id !== client.id
        );

        if (targetClients.length === 0) {
            toast.info(`Nenhum outro cliente ativo no regime ${client.regimeTributario} encontrado.`);
            return;
        }

        if (!confirm(`Deseja replicar a tarefa "${guide.type}" para outros ${targetClients.length} clientes do regime ${client.regimeTributario}?`)) return;

        const loadingToast = toast.loading('Replicando tarefas...');
        let success = 0;
        
        try {
            for (const targetClient of targetClients) {
                try {
                    await createGuide({
                        client_id: targetClient.id,
                        type: guide.type,
                        reference_month: referenceMonth,
                        due_date: guide.due_date,
                        amount: guide.amount,
                        file_url: null,
                        competency: guide.competency,
                        status: 'pending',
                        scheduled_for: null,
                        sent_at: null,
                        delivered_at: null,
                        opened_at: null
                    });
                    success++;
                } catch (err) {
                    console.error("Erro ao replicar para cliente:", targetClient.id, err);
                }
            }
            toast.success(`${success} tarefas replicadas com sucesso!`, { id: loadingToast });
            onUpdate();
        } catch (error) {
            toast.error('Erro ao processar replicação.', { id: loadingToast });
        }
    };

    const handleSchedule = async () => {
        if (!schedulingGuide || !scheduleDate) return;

        try {
            await updateGuide(schedulingGuide.id, {
                scheduled_for: new Date(scheduleDate).toISOString(),
                status: 'scheduled'
            });
            toast.success(`Envio agendado para ${format(parseISO(scheduleDate), 'dd/MM/yyyy')}`);
            setSchedulingGuide(null);
            onUpdate();
        } catch (error) {
            toast.error('Erro ao agendar envio');
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedGuides(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Deseja excluir esta tarefa?')) return;
        try {
            await deleteGuide(id);
            onUpdate();
            toast.success('Tarefa excluída com sucesso');
        } catch (error) {
            toast.error('Erro ao excluir tarefa');
        }
    };

    const handleSendSelected = async () => {
        if (selectedGuides.length === 0) {
            toast.error('Selecione ao menos um imposto para enviar.');
            return;
        }

        const itemsToSend = guides.filter(g => selectedGuides.includes(g.id));
        if (!client.email) {
            toast.error('Cliente não possui e-mail cadastrado.');
            return;
        }

        setIsSending(true);
        try {
            const branding = BrandingService.getBranding();
            const emails = client.email.split(',').map((e: string) => e.trim());
            const formattedMonth = format(parseISO(`${referenceMonth}-01`), 'MMMM/yyyy', { locale: ptBR });

            const types = itemsToSend.map(i => i.type).join(' e ');
            
            const subject = (branding.deliveryEmailSubject || 'Guias de Pagamento: {{impostos}} - {{mes}}')
                .replace('{{impostos}}', types)
                .replace('{{mes}}', formattedMonth);

            let itemsListHtml = '';
            itemsToSend.forEach(item => {
                const val = (item.amount || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                const venc = item.due_date ? format(parseISO(item.due_date), 'dd/MM/yyyy') : '--';
                itemsListHtml += `
                    <div style="margin-bottom: 20px; padding: 20px; border-radius: 12px; background-color: #f8fafc; border: 1px solid #e1e7ef;">
                        <h3 style="margin: 0 0 10px 0; font-size: 18px; color: #0f172a;">${item.type}</h3>
                        <p style="margin: 0; font-size: 14px; font-weight: bold;">Vencimento: ${venc}</p>
                        <p style="margin: 5px 0 15px 0; font-size: 14px; font-weight: bold; color: #16a34a;">Valor: ${val}</p>
                        <a href="${item.file_url}" style="display: inline-block; background-color: ${branding.primaryColor}; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-size: 12px; font-weight: bold;">Visualizar Guia PDF</a>
                    </div>
                `;
            });

            const htmlContent = `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #f0f0f0; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); background-color: #ffffff;">
                    <div style="text-align: center; margin-bottom: 25px;">
                        <h1 style="color: #1a1a1a; font-size: 24px; font-weight: 300; margin: 0;">Guias <span style="color: ${branding.primaryColor}; font-weight: 600;">Disponíveis</span></h1>
                    </div>
                    
                    <div style="line-height: 1.8; color: #444; font-size: 16px; margin-bottom: 30px;">
                        Prezado(a) Cliente ${client.nomeFantasia || client.razaoSocial},<br>
                        Esta comunicação refere-se à empresa ${client.razaoSocial || client.nomeFantasia}.<br><br>
                        Encaminhamos abaixo os documentos fiscais referentes ao mês de ${formattedMonth} para pagamento.<br><br>
                        
                        ${itemsListHtml}
                    </div>

                    <hr style="border: 0; border-top: 1px solid #f0f0f0; margin: 30px 0;">
                    
                    <div style="text-align: center;">
                        <p style="font-size: 12px; color: #999; margin-bottom: 5px;">
                            Este é um comunicado automático enviado por <strong>${branding.companyName}</strong>.
                        </p>
                    </div>

                    <!-- Tracking Pixel -->
                    <img src="https://qvnktgjoarotzzkuptht.supabase.co/functions/v1/track-open?id=${itemsToSend[0]?.id}" width="1" height="1" style="display:none;" />
                </div>
            `;

            await ResendService.sendEmail({
                to: emails.join(', '),
                subject,
                html: htmlContent,
                reply_to: branding.replyToEmail || undefined
            });

            // Atualizar status no banco
            const now = new Date().toISOString();
            for (const item of itemsToSend) {
                await updateGuideStatus(item.id, 'sent', now);
            }

            toast.success('E-mail enviado com sucesso!');
            setSelectedGuides([]);
            onUpdate();
        } catch (error) {
            console.error(error);
            toast.error('Erro ao enviar e-mail.');
        } finally {
            setIsSending(false);
        }
    };

    const renderGuideItem = (guide: AccountingGuide) => (
        <div 
            key={guide.id}
            onClick={() => toggleSelect(guide.id)}
            className={cn(
                "group flex items-center p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden",
                selectedGuides.includes(guide.id) 
                    ? "border-primary bg-primary/[0.03] ring-2 ring-primary/10" 
                    : "border-border/40 bg-card hover:bg-muted/30"
            )}
        >
            <div className="mr-5 flex items-center">
                <div className={cn(
                    "w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all",
                    selectedGuides.includes(guide.id) 
                        ? "border-primary bg-primary text-white" 
                        : "border-border/60"
                )}>
                    {selectedGuides.includes(guide.id) && <CheckCircle2 className="h-3.5 w-3.5" />}
                </div>
            </div>

            <div className="min-w-0 flex-1 flex items-center gap-6">
                <div className="flex-1 min-w-[150px]">
                    <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">IMPOSTO</span>
                    <h4 className="text-base font-light text-foreground truncate">{guide.type}</h4>
                    {guide.competency && (
                        <p className="text-[9px] text-primary/60 font-medium uppercase tracking-tight">Comp: {guide.competency}</p>
                    )}
                </div>

                <div className="w-32">
                    <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">VENCIMENTO</span>
                    <p className="text-xs font-light flex items-center gap-2">
                        {guide.due_date ? format(parseISO(guide.due_date), 'dd/MM/yyyy') : '--'}
                    </p>
                </div>

                <div className="w-32">
                    <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">VALOR</span>
                    <p className="text-sm font-light text-foreground">
                         {guide.amount !== null ? (
                            `R$ ${guide.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                        ) : '--'}
                    </p>
                </div>

                <div className="w-48"> 
                    <Badge 
                        variant="outline"
                        className={cn(
                            "rounded-lg px-2 text-[8px] uppercase font-bold h-6 gap-2 border-none",
                            guide.status === 'sent' ? "bg-emerald-500/10 text-emerald-600" : 
                            guide.status === 'scheduled' ? "bg-blue-500/10 text-blue-600" :
                            guide.file_url ? "bg-amber-500/10 text-amber-600" : "bg-muted text-muted-foreground"
                        )}
                    >
                        {guide.status === 'sent' ? 'Enviado' : 
                         guide.status === 'scheduled' ? 'Agendado' : 
                         guide.file_url ? 'Pronto para Envio' : 'Falta Guia'}
                    </Badge>
                </div>
            </div>

            <div className="ml-4 flex items-center gap-2">
                {!guide.file_url && guide.status !== 'sent' && (
                    <div className="relative">
                        <input 
                            type="file" 
                            className="hidden" 
                            id={`attach-${guide.id}`} 
                            accept=".pdf"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileUpload(guide.id, file);
                            }}
                        />
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-9 px-4 rounded-xl text-[9px] font-bold uppercase tracking-widest gap-2 hover:bg-primary hover:text-white transition-all"
                            onClick={(e) => {
                                e.stopPropagation();
                                document.getElementById(`attach-${guide.id}`)?.click();
                            }}
                        >
                            {uploadingId === guide.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CloudUpload className="h-3 w-3" />}
                            Anexar PDF
                        </Button>
                    </div>
                )}
                
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    {guide.file_url && (
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 rounded-lg"
                            onClick={(e) => {
                                e.stopPropagation();
                                window.open(guide.file_url, '_blank');
                            }}
                        >
                            <Eye className="h-4 w-4 opacity-40" />
                        </Button>
                    )}
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 rounded-lg hover:text-destructive hover:bg-destructive/5"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(guide.id);
                        }}
                    >
                        <Trash2 className="h-4 w-4 opacity-40" />
                    </Button>
                </div>
            </div>
        </div>
    );

    if (!client) return null;

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden flex flex-col p-0 rounded-[2.5rem] border-none shadow-2xl bg-card">
                    <DialogHeader className="p-10 pb-6 bg-primary/[0.02] border-b border-border/10">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <div className="h-16 w-16 rounded-2xl bg-card border border-border/40 shadow-sm flex items-center justify-center">
                                    <Building2 className="h-8 w-8 text-primary opacity-60" />
                                </div>
                                <div>
                                    <DialogTitle className="text-2xl font-light text-foreground">{client.nomeFantasia || client.razaoSocial}</DialogTitle>
                                    <DialogDescription className="text-[10px] uppercase font-bold tracking-[0.2em] mt-1.5 flex items-center gap-2">
                                        <Calendar className="h-3 w-3 opacity-40" />
                                        Período: <span className="text-primary">{format(parseISO(`${referenceMonth}-01`), 'MMMM / yyyy', { locale: ptBR })}</span>
                                    </DialogDescription>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Button 
                                    variant="outline"
                                    onClick={() => setIsNewGuideOpen(true)}
                                    className="rounded-xl h-12 px-6 gap-2 text-[10px] uppercase font-bold tracking-widest border-primary/20 text-primary"
                                >
                                    <Plus className="h-4 w-4" /> Nova Tarefa
                                </Button>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="px-10 py-4 bg-muted/30 border-b border-border/10">
                        <Tabs value={activeModalTab} onValueChange={setActiveModalTab} className="w-full">
                            <TabsList className="grid w-[400px] grid-cols-2 bg-muted/50 p-1 rounded-xl">
                                <TabsTrigger value="list" className="rounded-lg text-[10px] uppercase font-bold tracking-widest gap-2">
                                    <List className="h-3.5 w-3.5" /> Visão Geral
                                </TabsTrigger>
                                <TabsTrigger value="quick-send" className="rounded-lg text-[10px] uppercase font-bold tracking-widest gap-2">
                                    <Send className="h-3.5 w-3.5" /> Envio Individual
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>

                    <div className="flex-1 overflow-y-auto flex flex-col">
                        <Tabs value={activeModalTab} onValueChange={setActiveModalTab} className="flex-1">
                            <TabsContent value="list" className="p-10 space-y-10 m-0 border-none">
                                {guides.length === 0 ? (
                                    <div className="py-24 flex flex-col items-center justify-center text-center opacity-40 border-2 border-dashed border-border/40 rounded-[3rem]">
                                        <FileText className="h-16 w-16 mb-6" />
                                        <p className="text-base font-light">Nenhuma tarefa encontrada.</p>
                                        <p className="text-[10px] uppercase tracking-[0.2em] mt-3">Utilize as Configurações Globais ou clique em "Nova Tarefa"</p>
                                    </div>
                                ) : (
                                    <>
                                        {groupedGuides.pending.length > 0 && (
                                            <div className="space-y-4">
                                                <h3 className="text-[10px] uppercase font-bold tracking-[0.2em] text-amber-600 flex items-center gap-2 ml-4">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                                    Falta Anexar Guia ({groupedGuides.pending.length})
                                                </h3>
                                                <div className="grid grid-cols-1 gap-3">
                                                    {groupedGuides.pending.map(renderGuideItem)}
                                                </div>
                                            </div>
                                        )}

                                        {groupedGuides.ready.length > 0 && (
                                            <div className="space-y-4">
                                                <h3 className="text-[10px] uppercase font-bold tracking-[0.2em] text-primary flex items-center gap-2 ml-4">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                                    Prontas para Envio ({groupedGuides.ready.length})
                                                </h3>
                                                <div className="grid grid-cols-1 gap-3">
                                                    {groupedGuides.ready.map(renderGuideItem)}
                                                </div>
                                            </div>
                                        )}

                                        {groupedGuides.sent.length > 0 && (
                                            <div className="space-y-4 opacity-70">
                                                <h3 className="text-[10px] uppercase font-bold tracking-[0.2em] text-emerald-600 flex items-center gap-2 ml-4">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                    Histórico / Enviadas ({groupedGuides.sent.length})
                                                </h3>
                                                <div className="grid grid-cols-1 gap-3">
                                                    {groupedGuides.sent.map(renderGuideItem)}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </TabsContent>

                            <TabsContent value="quick-send" className="flex-1 p-10 m-0 border-none">
                                <div className="max-w-3xl mx-auto space-y-10">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                        {/* Step 1: Select Task */}
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">1</div>
                                                <h4 className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Selecionar Tarefa</h4>
                                            </div>
                                            
                                            <div className="space-y-3">
                                                {guides.length === 0 ? (
                                                    <div className="space-y-4">
                                                        <p className="text-xs text-muted-foreground italic bg-muted/30 p-4 rounded-xl">Nenhuma tarefa foi gerada para este mês ainda.</p>
                                                        <Button 
                                                            variant="outline" 
                                                            onClick={handleGenerateCycle}
                                                            className="w-full text-[9px] uppercase font-bold tracking-widest border-primary/20 text-primary hover:bg-primary/5"
                                                        >
                                                            Gerar Tarefas Agora
                                                        </Button>
                                                    </div>
                                                ) : guides.filter(g => g.status === 'pending').length === 0 ? (
                                                    <p className="text-xs text-muted-foreground italic bg-muted/30 p-4 rounded-xl">Todas as tarefas deste mês já foram enviadas ou agendadas.</p>
                                                ) : guides.filter(g => g.status === 'pending').map(g => (
                                                    <button
                                                        key={g.id}
                                                        onClick={() => setQuickSendTaskId(g.id)}
                                                        className={cn(
                                                            "w-full flex items-center justify-between p-4 rounded-xl border transition-all text-left group",
                                                            quickSendTaskId === g.id ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" : "bg-card border-border/40 hover:border-primary/40"
                                                        )}
                                                    >
                                                        <div>
                                                            <p className={cn("text-sm font-medium", quickSendTaskId === g.id ? "text-white" : "text-foreground")}>{g.type}</p>
                                                            <p className={cn("text-[9px] uppercase font-bold tracking-tighter opacity-60", quickSendTaskId === g.id ? "text-white/80" : "text-muted-foreground")}>Comp: {g.competency || referenceMonth}</p>
                                                        </div>
                                                        {quickSendTaskId === g.id ? <CheckCircle2 className="h-4 w-4" /> : <div className="w-4 h-4 rounded-full border border-border/40 group-hover:border-primary/40" />}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Step 2: Attach File */}
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">2</div>
                                                <h4 className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Anexar PDF</h4>
                                            </div>

                                            <div className="relative group">
                                                <input 
                                                    type="file" 
                                                    id="quick-send-file" 
                                                    className="hidden" 
                                                    accept=".pdf" 
                                                    onChange={handleQuickFileChange}
                                                    disabled={!quickSendTaskId}
                                                />
                                                <label 
                                                    htmlFor="quick-send-file"
                                                    className={cn(
                                                        "flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-[2rem] transition-all duration-500",
                                                        !quickSendTaskId ? "opacity-30 cursor-not-allowed bg-muted/10 border-border/20" : "cursor-pointer border-border/40 hover:border-primary/60 hover:bg-primary/[0.02] bg-card"
                                                    )}
                                                >
                                                    {isProcessingQuick ? (
                                                        <Loader2 className="h-8 w-8 text-primary animate-spin" />
                                                    ) : quickSendData.file_url ? (
                                                        <>
                                                            <div className="h-12 w-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-3">
                                                                <FileText className="h-6 w-6 text-emerald-500" />
                                                            </div>
                                                            <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Guia Pronta</p>
                                                            <p className="text-[9px] text-muted-foreground/60 mt-1">Clique para trocar</p>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="h-12 w-12 bg-primary/5 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                                                <CloudUpload className="h-6 w-6 text-primary opacity-60" />
                                                            </div>
                                                            <p className="text-xs font-light text-foreground">Solte o PDF aqui</p>
                                                        </>
                                                    )}
                                                </label>
                                            </div>

                                            {/* Validation Fields */}
                                            {quickSendData.file_url && (
                                                <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
                                                    <div className="grid grid-cols-1 gap-4">
                                                        <div className="space-y-1.5">
                                                            <Label className="text-[9px] uppercase font-bold text-muted-foreground/60">Valor do Imposto</Label>
                                                            <Input 
                                                                value={quickSendData.amount} 
                                                                onChange={e => setQuickSendData(prev => ({ ...prev, amount: e.target.value }))}
                                                                className="h-10 rounded-xl bg-muted/20 border-border/40 font-light"
                                                            />
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <Label className="text-[9px] uppercase font-bold text-muted-foreground/60">Data de Vencimento</Label>
                                                            <Input 
                                                                type="date"
                                                                value={quickSendData.due_date} 
                                                                onChange={e => setQuickSendData(prev => ({ ...prev, due_date: e.target.value }))}
                                                                className="h-10 rounded-xl bg-muted/20 border-border/40 font-light"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <div className="pt-10 flex flex-col items-center gap-4">
                                        <Button
                                            disabled={!quickSendTaskId || !quickSendData.file_url || isSending}
                                            onClick={handleConfirmQuickSend}
                                            className="w-full max-w-sm rounded-[2rem] h-16 gap-4 text-xs uppercase font-bold tracking-[0.2em] shadow-2xl shadow-primary/20 bg-primary text-white hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-95"
                                        >
                                            {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                                            Confirmar e Enviar E-mail
                                        </Button>
                                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest flex items-center gap-2">
                                            <Mail className="h-3 w-3 opacity-40" /> Destino: {client.email?.split(',')[0]}
                                        </p>
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>

                    <div className="p-8 border-t border-border/10 bg-muted/10 flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest flex items-center gap-2 border border-border/40 rounded-xl px-4 py-2 bg-card">
                                <span className="opacity-40">{selectedGuides.length}</span> Selecionados
                            </div>
                            {client.email && (
                                <div className="hidden sm:flex items-center gap-2 text-[10px] font-bold text-primary truncate max-w-[200px]">
                                    <Mail className="h-3.5 w-3.5" />
                                    {client.email.split(',')[0]}
                                </div>
                            )}
                        </div>
                        <div className="flex gap-4">
                            <Button 
                                variant="ghost" 
                                onClick={() => onOpenChange(false)}
                                className="rounded-xl h-14 px-8 text-[10px] uppercase font-bold tracking-widest"
                            >
                                Fechar
                            </Button>
                            <Button 
                                onClick={handleSendSelected}
                                disabled={selectedGuides.length === 0 || isSending}
                                className="rounded-2xl h-14 px-12 gap-4 text-[11px] uppercase tracking-[0.15em] font-bold shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 text-white transition-all transform hover:scale-[1.02] active:scale-95"
                            >
                                {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                                {selectedGuides.length > 1 ? `Enviar ${selectedGuides.length} Selecionados` : 'Enviar agora'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <NewGuideDialog 
                open={isNewGuideOpen}
                onOpenChange={setIsNewGuideOpen}
                clientId={client.id}
                referenceMonth={referenceMonth}
                onSuccess={onUpdate}
            />

            <Dialog open={!!schedulingGuide} onOpenChange={(o) => !o && setSchedulingGuide(null)}>
                <DialogContent className="sm:max-w-[400px] rounded-[2rem] p-10 bg-card">
                    <DialogHeader>
                        <div className="h-12 w-12 rounded-2xl bg-blue-500/5 flex items-center justify-center mb-4">
                            <Clock className="h-6 w-6 text-blue-600" />
                        </div>
                        <DialogTitle className="text-xl font-light">Agendar Envio</DialogTitle>
                        <DialogDescription className="text-xs">
                            Escolha a data em que deseja que esta guia seja enviada automaticamente para o cliente.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-6 space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground ml-1">Data de Envio</label>
                            <input 
                                type="date" 
                                value={scheduleDate}
                                onChange={(e) => setScheduleDate(e.target.value)}
                                className="w-full h-12 rounded-xl border border-border/40 bg-muted/20 px-4 text-sm font-light outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" className="flex-1 h-12 rounded-xl text-[10px] uppercase font-bold tracking-widest" onClick={() => setSchedulingGuide(null)}>
                            Cancelar
                        </Button>
                        <Button className="flex-1 h-12 rounded-xl text-[10px] uppercase font-bold tracking-widest bg-blue-600 hover:bg-blue-700" onClick={handleSchedule}>
                            Agendar
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
