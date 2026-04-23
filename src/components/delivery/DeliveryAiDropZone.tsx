
import { useState, useCallback, useMemo } from "react";
import { useDropzone } from "react-dropzone";
import { 
    Wand2, 
    Upload, 
    FileText, 
    Loader2, 
    CheckCircle2, 
    AlertCircle, 
    CloudOff,
    Edit3,
    Send,
    Trash2,
    X,
    Eye,
    Mail,
    BrainCircuit,
    Search,
    ShieldCheck,
    ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AiService, ExtractedGuideData } from "@/services/aiService";
import { useClients } from "@/hooks/useClients";
import { useObligations } from "@/hooks/useObligations";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { BrandingService } from "@/services/brandingService";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface ProcessedDeliveryFile {
    id: string;
    file: File;
    status: 'pending' | 'processing' | 'completed' | 'error';
    data?: ExtractedGuideData;
    client?: any;
    error?: string;
    previewVisible?: boolean;
    generatedSubject?: string;
    generatedMessage?: string;
    generatedTemplateTitle?: string;
    matchedObligationName?: string;
    publicUrl?: string;
    manuallyAssigned?: boolean;
}

interface DeliveryAiDropZoneProps {
    onSendAll: (data: ProcessedDeliveryFile[], provider: 'resend' | 'whatsapp') => void | Promise<void>;
    mode?: 'standard' | 'recalculo';
}

export function DeliveryAiDropZone({ onSendAll, mode = 'standard' }: DeliveryAiDropZoneProps) {
    const [processedFiles, setProcessedFiles] = useState<ProcessedDeliveryFile[]>([]);
    const [reviewingFileId, setReviewingFileId] = useState<string | null>(null);
    const { clients } = useClients();
    const { obligations } = useObligations();
    const [clientSearch, setClientSearch] = useState('');
    const [isSending, setIsSending] = useState(false);

    const reviewingFile = useMemo(() => 
        processedFiles.find(f => f.id === reviewingFileId),
    [processedFiles, reviewingFileId]);

    const generatePreview = (data: ExtractedGuideData, client: any, publicUrl?: string) => {
        const branding = BrandingService.getBranding();
        
        const lowerDataName = data.type.toLowerCase();
        
        // Se já for um nome específico forçado por nós, não tentamos buscar obrigações genéricas
        const isKnownSpecific = data.category === 'adiantamento' ||
                               lowerDataName.includes('demonstrativo fgts') || 
                               lowerDataName.includes('folha de pagamento mensal') || 
                               lowerDataName.includes('recibo de folha mensal') ||
                               lowerDataName.includes('relação geral de líquidos') ||
                               lowerDataName.includes('retirada de lucros');

        // Tenta encontrar a obrigação (apenas se não for um tipo já normalizado)
        const obligation = isKnownSpecific ? null : obligations.find(o => 
            o.name.toLowerCase().includes(data.type.toLowerCase()) ||
            data.type.toLowerCase().includes(o.name.toLowerCase())
        );

        const formalName = obligation?.name || data.type;
        
        // Formatação robusta de valor: se for 0 ou NaN, mostra traço
        const numValue = parseFloat(data.value);
        const formattedValue = (isNaN(numValue) || numValue === 0) 
            ? '-' 
            : numValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        let formattedDate = '-';
        if (data.dueDate) {
            const dateStr = data.dueDate.split('T')[0];
            const parts = dateStr.includes('-') ? dateStr.split('-') : dateStr.split('/');
            if (parts.length === 3) {
                const [y, m, d] = parts[0].length === 4 ? parts : [parts[2], parts[1], parts[0]];
                formattedDate = `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
            } else {
                formattedDate = new Date(data.dueDate).toLocaleDateString('pt-BR');
            }
        }

        let subject = "";
        let templateTitle = "";

        // Lógica de Assunto e Título baseada na Categoria da IA
        if (data.category === 'adiantamento') {
            subject = "Folha Adiantamento";
            templateTitle = "Folha Adiantamento";
        } else if (data.category === 'folha') {
            subject = `Folha Mensal e Documentos - ${client?.nomeFantasia || client?.nome_fantasia || data.companyName} - ${data.referenceMonth}`;
            templateTitle = "Folhas de Pagamento e Impostos";
        } else if (data.category === 'extrato') {
            subject = `Extrato Bancário - ${client?.nomeFantasia || client?.nome_fantasia || data.companyName} - ${data.referenceMonth}`;
            templateTitle = "Extrato e Movimentação";
        } else if (data.category === 'inss') {
            subject = `Guia de INSS / Previdência - ${client?.nomeFantasia || client?.nome_fantasia || data.companyName}`;
            templateTitle = "Guia de INSS";
        } else if (data.type === 'ISS') {
            subject = `Guia de ISS - ${client?.nomeFantasia || client?.nome_fantasia || data.companyName}`;
            templateTitle = "Guia de ISS";
        } else if (data.type === 'DAS') {
            subject = `Guia DAS / Simples Nacional - ${client?.nomeFantasia || client?.nome_fantasia || data.companyName}`;
            templateTitle = "Guia de Pagamento DAS";
        } else if (data.type === 'DECLARAÇÃO SIMPLES NACIONAL') {
            subject = `Declaração Simples Nacional - ${client?.nomeFantasia || client?.nome_fantasia || data.companyName}`;
            templateTitle = "Declaração de Impostos";
        } else if (data.type === 'RECIBO SIMPLES NACIONAL') {
            subject = `Recibo Simples Nacional - ${client?.nomeFantasia || client?.nome_fantasia || data.companyName}`;
            templateTitle = "Recibo de Entrega";
        } else if (mode === 'recalculo') {
            subject = `Guia de Pagamento: RECALCULO ${formalName} - ${client?.nomeFantasia || client?.nome_fantasia || data.companyName}`;
            templateTitle = "Guia de Recálculo";
        } else {
            subject = `Guia de Pagamento: ${formalName} - ${client?.nomeFantasia || client?.nome_fantasia || data.companyName}`;
            templateTitle = "Guia de Pagamento";
        }

        let message = branding.deliveryEmailBody || "";
        if (!message || message.trim() === "") {
            if (data.category === 'folha') {
                message = mode === 'recalculo' 
                    ? `Olá {{nome_fantasia}},\n\nEsta comunicação refere-se a um RECÁLCULO solicitado para {{nome_imposto}} referente a {{competencia}}.\n\n{{link_documento}}`
                    : `Olá {{nome_fantasia}},\n\nIdentificamos que sua {{nome_imposto}} referente a {{competencia}} está pronta.\n\n{{link_documento}}`;
            } else {
                message = mode === 'recalculo'
                    ? `Olá {{nome_fantasia}},\n\nEsta comunicação refere-se a um RECÁLCULO solicitado para {{nome_imposto}} referente a {{competencia}}.\n\nVencimento: {{vencimento}}\nValor: {{valor}}\n\n{{link_documento}}`
                    : `Olá {{nome_fantasia}},\n\nIdentificamos que sua {{nome_imposto}} referente a {{competencia}} está pronta.\n\nVencimento: {{vencimento}}\nValor: {{valor}}\n\n{{link_documento}}`;
            }
        }

        const linkTexto = publicUrl 
            ? `<a href="${publicUrl}" style="color: ${branding.primaryColor}; font-weight: bold;">Acesse o Documento - Clicando Aqui</a>`
            : '(Documento disponível no portal)';

        const replacements: Record<string, string> = {
            "{{nome_empresa}}": client?.nomeFantasia || client?.nome_fantasia || data.companyName || 'Cliente',
            "{{razao_social}}": client?.razaoSocial || client?.razao_social || data.companyName || 'Empresa',
            "{{nome_fantasia}}": client?.nomeFantasia || client?.nome_fantasia || data.companyName || 'Cliente',
            "{{nome_imposto}}": formalName,
            "{{tipo_guia}}": formalName,
            "{{competencia}}": data.referenceMonth,
            "{{mes_referencia}}": data.referenceMonth,
            "{{data_vencimento}}": formattedDate,
            "{{vencimento}}": formattedDate,
            "{{valor_guia}}": formattedValue,
            "{{valor}}": formattedValue,
            "{{link_documento}}": linkTexto,
            "{{companyName}}": branding.companyName || 'JLVIANA Consultoria Contábil'
        };

        // Aplica substituições ricas
        let finalMessage = message;
        Object.entries(replacements).forEach(([key, value]) => {
            const regex = new RegExp(key, 'g');
            finalMessage = finalMessage.replace(regex, value);
        });

        return { subject, message: finalMessage, templateTitle, formalName };
    };

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const newFiles = acceptedFiles.map(file => ({
            id: Math.random().toString(36).substr(2, 9),
            file,
            status: 'pending' as const,
            previewVisible: false
        }));

        setProcessedFiles(prev => [...prev, ...newFiles]);

        for (const fileObj of newFiles) {
            processFile(fileObj);
        }
    }, [clients, obligations]);

    const processFile = async (fileObj: any) => {
        setProcessedFiles(prev => prev.map(f => 
            f.id === fileObj.id ? { ...f, status: 'processing' as const } : f
        ));

        try {
            const data = await AiService.extractGuideData(fileObj.file);
            
            // Normaliza categorias baseadas em filename E conteúdo extraído
            const lowerType = (data.type || '').toLowerCase();
            const lowerFileName = (fileObj.file.name || '').toLowerCase();
            
            const isDemonstrativo = lowerFileName.includes('demonstrativo') || lowerType.includes('demonstrativo');
            const isFGTS = lowerFileName.includes('fgts') || lowerType.includes('fgts');
            const isExtratoMensal = lowerFileName.includes('extrato mensal') || lowerType.includes('extrato mensal');
            const isFolhaName = lowerFileName.includes('folha') || lowerType.includes('folha');
            const isRelatorioLiquidos = lowerFileName.includes('relatório de líquidos') || lowerFileName.includes('relatorio de liquidos') || lowerType.includes('líquidos') || lowerType.includes('liquidos');

            const isFolhaOrFerias = data.category === 'folha' || 
                                   lowerType.includes('férias') || 
                                   lowerType.includes('ferias') ||
                                   lowerType.includes('rescisório') ||
                                   lowerType.includes('rescisorio') ||
                                   isDemonstrativo ||
                                   isFolhaName ||
                                   isExtratoMensal ||
                                   isRelatorioLiquidos ||
                                   (isDemonstrativo && isFGTS);

            const isRecalculo = mode === 'recalculo' || lowerFileName.includes('recalculo');
            
            if (isRecalculo) {
                data.category = 'guia';
                if (lowerFileName.includes('irpj')) {
                    if (lowerFileName.includes('mensal')) {
                        data.type = 'Recalculo DARF IRPJ MENSAL';
                    } else if (lowerFileName.includes('trimestral') || lowerFileName.includes('trimestre')) {
                        data.type = 'Recalculo DARF IRPJ TRIMESTRAL';
                    } else {
                        data.type = 'Recalculo DARF IRPJ TRIMESTRAL';
                    }
                } else if (lowerFileName.includes('das')) {
                    data.type = 'Recalculo DAS MENSAL';
                } else if (lowerFileName.includes('pis')) {
                    data.type = 'Recalculo DARF PIS';
                } else if (lowerFileName.includes('cofins')) {
                    data.type = 'Recalculo DARF COFINS';
                } else if (lowerFileName.includes('csll')) {
                    data.type = 'Recalculo DARF CSLL TRIMESTRAL';
                } else if (lowerFileName.includes('dctf')) {
                    data.type = 'Recalculo DCTF';
                } else {
                    data.type = 'Recalculo';
                }
            } else if (lowerFileName.includes('retirada de lucros')) {
                data.type = 'DARF - DARF IR S RETIRADA DE LUCROS';
                data.category = 'guia';
            } else if (lowerFileName.startsWith('pgdasd-das')) {
                data.type = 'DAS';
                data.category = 'guia';
            } else if (lowerFileName.startsWith('pgdasd-declaracao')) {
                data.type = 'DECLARAÇÃO SIMPLES NACIONAL';
                data.category = 'guia';
            } else if (lowerFileName.startsWith('pgdasd-recibo')) {
                data.type = 'RECIBO SIMPLES NACIONAL';
                data.category = 'guia';
            } else if (lowerFileName.startsWith('adiantamento')) {
                data.category = 'adiantamento';
                data.value = "0"; // Força valor zero para aparecer o traço '-'
                data.dueDate = null as any; 
                // Remove a extensão .pdf (independente de maiúsculas/minúsculas)
                data.type = fileObj.file.name.replace(/\.[^/.]+$/, "");
            } else if (lowerFileName.includes('iss tomados')) {
                data.type = 'ISS TOMADOS';
                data.category = 'guia';
                
                // Extração via Regex: ISS TOMADOS -02-2026 vencimento 13-03-2026.pdf
                const compMatch = lowerFileName.match(/(\d{2})[-/.](\d{4})/);
                if (compMatch) {
                    data.referenceMonth = `${compMatch[1]}/${compMatch[2]}`;
                }

                const dueMatch = lowerFileName.match(/vencimento\s+(\d{2})[-/](\d{2})[-/](\d{4})/);
                if (dueMatch) {
                    data.dueDate = `${dueMatch[3]}-${dueMatch[2]}-${dueMatch[1]}`;
                }
            } else if (lowerFileName.includes('iss prestados')) {
                data.type = 'ISS PRESTADOS';
                data.category = 'guia';
                
                const compMatch = lowerFileName.match(/(\d{2})[-/.](\d{4})/);
                if (compMatch) {
                    data.referenceMonth = `${compMatch[1]}/${compMatch[2]}`;
                }

                const dueMatch = lowerFileName.match(/vencimento\s+(\d{2})[-/](\d{2})[-/](\d{4})/);
                if (dueMatch) {
                    data.dueDate = `${dueMatch[3]}-${dueMatch[2]}-${dueMatch[1]}`;
                }
            } else if (lowerFileName.includes('iss')) {
                data.type = 'ISS';
                data.category = 'guia';
                
                // Extração via Regex: 366 ISS -02-2026 vencimento 13-03-2026.pdf
                // 1. Tenta extrair competência (padrão MM-YYYY ou MM/YYYY)
                const compMatch = lowerFileName.match(/(\d{2})[-/](\d{4})/);
                if (compMatch) {
                    data.referenceMonth = `${compMatch[1]}/${compMatch[2]}`;
                }

                // 2. Tenta extrair vencimento após a palavra 'vencimento'
                const dueMatch = lowerFileName.match(/vencimento\s+(\d{2})[-/](\d{2})[-/](\d{4})/);
                if (dueMatch) {
                    data.dueDate = `${dueMatch[3]}-${dueMatch[2]}-${dueMatch[1]}`; // ISO YYYY-MM-DD
                }
            } else if (lowerFileName.includes('pis') && lowerFileName.includes('vencimento')) {
                data.type = 'DARF PIS';
                data.category = 'guia';
            } else if (lowerFileName.includes('cofins') && lowerFileName.includes('vencimento')) {
                data.type = 'DARF COFINS';
                data.category = 'guia';
            } else if (lowerFileName.includes('irpj') && lowerFileName.includes('trimestre')) {
                data.type = 'DARF IRPJ TRIMESTRAL';
                data.category = 'guia';
            } else if (lowerFileName.includes('irpj') && lowerFileName.includes('mensal')) {
                data.type = 'DARF IRPJ MENSAL';
                data.category = 'guia';
            } else if (lowerFileName.includes('csll') && lowerFileName.includes('trimestre')) {
                data.type = 'DARF CSLL TRIMESTRAL';
                data.category = 'guia';
            } else if (isFolhaOrFerias || (isDemonstrativo && isFGTS)) {
                data.category = 'folha';
                data.value = "0"; // Força valor zero para aparecer o traço '-'
                data.dueDate = null as any; 
                
                // Prioridade absoluta na nomenclatura
                const isRecibo = lowerType.includes('recibo') || 
                                 lowerType.includes('voucher') || 
                                 lowerFileName.includes('recibo') ||
                                 (lowerFileName.includes('pagamento') && lowerFileName.includes('recibo'));

                if (isRelatorioLiquidos) {
                    data.type = 'RELAÇÃO GERAL DE LÍQUIDOS';
                } else if (isRecibo) {
                    data.type = 'RECIBO DE FOLHA MENSAL';
                } else if (isExtratoMensal || lowerType.includes('folha mensal') || lowerType === 'folha de pagamento') {
                    data.type = 'FOLHA DE PAGAMENTO MENSAL';
                } else if (isDemonstrativo && isFGTS) {
                   if (lowerFileName.includes('mensal') || lowerType.includes('mensal')) {
                       data.type = 'DEMONSTRATIVO FGTS RESCISÓRIO MENSAL';
                   } else {
                       data.type = 'DEMONSTRATIVO FGTS RESCISÓRIO';
                   }
                }
            }
            
            let publicUrl = '';
            try {
                const resource = await AiService.uploadFile(fileObj.file);
                publicUrl = resource.publicUrl;
            } catch (uploadErr) {
                console.warn('Falha no upload, continuando sem link direto:', uploadErr);
            }

            const cleanCnpj = data.cnpj.replace(/\D/g, '');
            const searchCompanyName = (data.companyName || '').toLowerCase().trim();

            let client = clients.find(c => {
                const cCnpj = (c.cnpj || '').replace(/\D/g, '');
                
                // 1. Match exato de CNPJ
                if (cleanCnpj && cCnpj === cleanCnpj) return true;
                
                // 2. Match parcial de CNPJ (ex: FGTS Digital com 8 dígitos base)
                if (cleanCnpj && cleanCnpj.length >= 8 && cCnpj.startsWith(cleanCnpj)) return true;

                return false;
            });

            // 3. Fallback por Nome / Razão Social se não achou pelo CNPJ
            if (!client && searchCompanyName) {
                client = clients.find(c => {
                    const cRazao = (c.razaoSocial || '').toLowerCase();
                    const cFantasia = (c.nomeFantasia || '').toLowerCase();
                    
                    return (cRazao && (cRazao.includes(searchCompanyName) || searchCompanyName.includes(cRazao))) ||
                           (cFantasia && (cFantasia.includes(searchCompanyName) || searchCompanyName.includes(cFantasia)));
                });
            }

            const { subject, message, templateTitle, formalName } = generatePreview(data, client, publicUrl);

            setProcessedFiles(prev => prev.map(f => 
                f.id === fileObj.id ? { 
                    ...f, 
                    status: 'completed' as const, 
                    data, 
                    client,
                    generatedSubject: subject,
                    generatedMessage: message,
                    generatedTemplateTitle: templateTitle,
                    matchedObligationName: formalName,
                    publicUrl
                } : f
            ));
        } catch (error: any) {
            setProcessedFiles(prev => prev.map(f => 
                f.id === fileObj.id ? { 
                    ...f, 
                    status: 'error' as const, 
                    error: error.message 
                } : f
            ));
            toast.error(`Erro no arquivo ${fileObj.file.name}: ${error.message}`);
        }
    };

    const togglePreview = (id: string) => {
        setProcessedFiles(prev => prev.map(f => 
            f.id === id ? { ...f, previewVisible: !f.previewVisible } : f
        ));
    };

    const updateFileContent = (id: string, field: 'generatedSubject' | 'generatedMessage', value: string) => {
        setProcessedFiles(prev => prev.map(f => 
            f.id === id ? { ...f, [field]: value } : f
        ));
    };

    const updateFileData = (id: string, field: keyof ExtractedGuideData, value: any) => {
        setProcessedFiles(prev => prev.map(f => {
            if (f.id === id && f.data) {
                const newData = { ...f.data, [field]: value };
                // Regera o rascunho base com os novos dados
                const { subject, message, templateTitle } = generatePreview(newData, f.client, f.publicUrl);
                return { 
                    ...f, 
                    data: newData,
                    generatedSubject: subject,
                    generatedMessage: message,
                    generatedTemplateTitle: templateTitle
                };
            }
            return f;
        }));
    };

    const updateFileClient = (id: string, clientId: string) => {
        const client = clients.find(c => c.id === clientId);
        setProcessedFiles(prev => prev.map(f => {
            if (f.id === id && f.data) {
                const { subject, message, templateTitle } = generatePreview(f.data, client, f.publicUrl);
                return { 
                    ...f, 
                    client,
                    generatedSubject: subject,
                    generatedMessage: message,
                    generatedTemplateTitle: templateTitle,
                    manuallyAssigned: true
                };
            }
            return f;
        }));
    };

    const removeFile = (id: string) => {
        setProcessedFiles(prev => prev.filter(f => f.id !== id));
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'image/*': ['.png', '.jpg', '.jpeg']
        }
    });

    const completedCount = processedFiles.filter(f => f.status === 'completed').length;

    const filteredClientsForSelect = useMemo(() => {
        return clients
            .filter(c => 
                (c.nomeFantasia || '').toLowerCase().includes(clientSearch.toLowerCase()) ||
                (c.razaoSocial || '').toLowerCase().includes(clientSearch.toLowerCase()) ||
                (c.cnpj || '').includes(clientSearch)
            )
            .sort((a,b) => (a.nomeFantasia || '').localeCompare(b.nomeFantasia || ''));
    }, [clients, clientSearch]);

    return (
        <div className="space-y-4">
            <div 
                {...getRootProps()} 
                className={cn(
                    "relative group cursor-pointer overflow-hidden transition-all duration-700",
                    "rounded-[2.5rem] border-2 border-dashed p-12 text-center",
                    isDragActive 
                        ? "border-primary bg-primary/5 scale-[0.98] shadow-2xl" 
                        : "border-border/40 hover:border-primary/40 hover:bg-muted/30"
                )}
            >
                <input {...getInputProps()} />
                
                <div className="relative z-10 space-y-6">
                    <div className="w-24 h-24 bg-primary/10 rounded-[2.5rem] flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-500 shadow-xl shadow-primary/5">
                        <BrainCircuit className="h-12 w-12 text-primary opacity-60" />
                    </div>
                    
                    <div className="space-y-2">
                        <h3 className="text-2xl font-light text-foreground tracking-tight text-center">Processamento <span className="text-primary font-medium">Inteligente de Guias</span></h3>
                        <p className="text-sm text-muted-foreground font-light max-w-[320px] mx-auto leading-relaxed text-center">
                            Arraste suas guias aqui. O sistema identificará os clientes e preparará o rascunho automaticamente para você revisar.
                        </p>
                    </div>

                    <div className="inline-flex items-center justify-center gap-3 px-8 py-3 rounded-full bg-card border border-border/50 text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground/60 shadow-sm group-hover:bg-primary/5 group-hover:text-primary transition-all">
                        <Upload className="h-3.5 w-3.5" /> Clique ou arraste arquivos
                    </div>
                </div>

                <div className="absolute -top-10 -right-10 w-48 h-48 bg-primary/10 rounded-full blur-[90px]" />
                <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-primary/10 rounded-full blur-[90px]" />
            </div>

            <AnimatePresence>
                {processedFiles.length > 0 && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-card rounded-[2.5rem] border border-border/50 shadow-elevated overflow-hidden"
                    >
                        <div className="p-8 border-b border-border/20 flex items-center justify-between bg-muted/10">
                            <div>
                                <h4 className="text-base font-light text-foreground flex items-center gap-3">
                                    <FileText className="h-5 w-5 text-primary opacity-60" />
                                    Fila de Processamento
                                </h4>
                            </div>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setProcessedFiles([])}
                                className="h-9 px-6 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:text-destructive hover:bg-destructive/5"
                            >
                                <Trash2 className="h-4 w-4 mr-2" /> Limpar Tudo
                            </Button>
                        </div>

                        <div className="max-h-[700px] overflow-y-auto custom-scrollbar">
                            {processedFiles.map((file) => (
                                <motion.div 
                                    layout
                                    key={file.id}
                                    className="border-b border-border/20 last:border-0"
                                >
                                    <div className={cn(
                                        "p-6 flex items-center justify-between gap-6 transition-colors",
                                        file.status === 'completed' ? "bg-emerald-500/[0.02]" : 
                                        file.status === 'error' ? "bg-destructive/[0.02]" : ""
                                    )}>
                                        <div className="flex items-center gap-5 min-w-0 flex-1">
                                            <div className="h-14 w-14 bg-card rounded-2xl border border-border/40 flex items-center justify-center shrink-0 shadow-sm">
                                                {file.status === 'processing' ? <Loader2 className="h-7 w-7 text-primary animate-spin" /> :
                                                 file.status === 'completed' ? <CheckCircle2 className="h-7 w-7 text-emerald-500" /> :
                                                 file.status === 'error' ? <AlertCircle className="h-7 w-7 text-destructive" /> :
                                                 <FileText className="h-7 w-7 text-muted-foreground opacity-40" />}
                                            </div>
                                            
                                            <div className="min-w-0 flex-1 text-left">
                                                <p className="text-base font-light text-foreground truncate">{file.file.name}</p>
                                                {file.status === 'completed' && file.data && (
                                                    <div className="flex items-center gap-3 mt-1.5">
                                                        <span className="px-3 py-1 rounded-lg bg-primary/10 text-[10px] font-bold text-primary uppercase tracking-tighter">{file.data.type}</span>
                                                        <span className="text-sm text-muted-foreground font-light truncate">
                                                            {file.client ? (file.client.nomeFantasia || file.client.razaoSocial) : 'Cliente não encontrado'}
                                                        </span>
                                                    </div>
                                                )}
                                                {file.status === 'error' && (
                                                    <p className="text-xs text-destructive mt-1.5 font-light italic">{file.error}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            {file.status === 'completed' && (
                                                <>
                                                    <div className="text-right border-r border-border/40 pr-6 hidden sm:block">
                                                        <p className="text-base font-light text-foreground">
                                                            {(isNaN(parseFloat(file.data?.value || "0")) || parseFloat(file.data?.value || "0") === 0) 
                                                                ? '-' 
                                                                : parseFloat(file.data?.value || "0").toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground uppercase opacity-60 tracking-wider">REF: {file.data?.referenceMonth}</p>
                                                    </div>
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm" 
                                                        onClick={() => setReviewingFileId(file.id)}
                                                        className="h-10 px-6 rounded-xl text-[10px] font-bold uppercase tracking-widest gap-2 bg-white border-border/40 hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition-all shadow-sm"
                                                    >
                                                        <Edit3 className="h-4 w-4" /> 
                                                        Revisar & Ajustar
                                                    </Button>
                                                </>
                                            )}
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                onClick={() => removeFile(file.id)}
                                                className="h-10 w-10 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                                            >
                                                <X className="h-5 w-5" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Modal de Revisão Full Screen */}
                                    <Dialog open={!!reviewingFileId} onOpenChange={(open) => !open && setReviewingFileId(null)}>
                                        <DialogContent className="max-w-none w-screen h-screen flex flex-col p-0 rounded-none border-none shadow-none bg-[#FDFDFF]">
                                            <DialogHeader className="px-10 py-6 border-b border-slate-100 bg-white shadow-sm z-10 shrink-0">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-6 text-left">
                                                        <div className="h-14 w-14 rounded-[1.25rem] bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                                                            <BrainCircuit className="h-7 w-7" />
                                                        </div>
                                                        <div>
                                                            <DialogTitle className="text-3xl font-light text-slate-900 tracking-tighter">
                                                                Revisão <span className="text-primary font-bold italic">Inteligente</span>
                                                            </DialogTitle>
                                                            <p className="text-[11px] uppercase font-black tracking-[0.25em] text-slate-400 mt-1">
                                                                Ajuste fino dos dados extraídos pela inteligência artificial
                                                            </p>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-8">
                                                        <div className="hidden xl:flex flex-col items-end pr-8 border-r border-slate-100">
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Arquivo em Fila</span>
                                                            <span className="text-sm font-bold text-slate-700 truncate max-w-[300px]">{reviewingFile?.file.name}</span>
                                                        </div>
                                                        
                                                        <div className="flex items-center gap-3">
                                                            <Button 
                                                                variant="ghost" 
                                                                onClick={() => setReviewingFileId(null)}
                                                                className="rounded-2xl h-14 px-8 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                                                            >
                                                                Cancelar
                                                            </Button>
                                                            <Button 
                                                                onClick={() => setReviewingFileId(null)}
                                                                className="rounded-2xl h-14 px-10 bg-primary text-white shadow-[0_15px_30px_-5px_rgba(var(--primary-rgb),0.3)] text-[11px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all"
                                                            >
                                                                Confirmar & Salvar
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </DialogHeader>

                                            <div className="flex-1 overflow-hidden flex flex-col md:flex-row bg-[#FDFDFF]">
                                                {/* Painel de Edição - 40% */}
                                                <div className="w-full md:w-[450px] lg:w-[500px] xl:w-[600px] border-r border-slate-100 bg-white overflow-y-auto custom-scrollbar flex flex-col">
                                                    <div className="p-10 space-y-12">
                                                        {/* Seção 01: Dados Financeiros */}
                                                        <div className="space-y-6">
                                                            <div className="flex items-center gap-4">
                                                                <div className="h-8 w-8 rounded-xl bg-slate-900 flex items-center justify-center text-white text-[10px] font-black">01</div>
                                                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.3em]">Dados da Guia</h3>
                                                            </div>
                                                            
                                                            <div className="grid grid-cols-2 gap-6 bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100">
                                                                <div className="space-y-2.5">
                                                                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Vencimento Manual</Label>
                                                                    <Input 
                                                                        type="date"
                                                                        value={reviewingFile?.data?.dueDate || ''}
                                                                        onChange={(e) => updateFileData(reviewingFile?.id || '', 'dueDate', e.target.value)}
                                                                        className="h-14 rounded-2xl text-base font-medium bg-white border-slate-200 focus:ring-4 focus:ring-primary/5 transition-all"
                                                                    />
                                                                </div>
                                                                <div className="space-y-2.5">
                                                                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Valor Manual (R$)</Label>
                                                                    <Input 
                                                                        type="number"
                                                                        step="0.01"
                                                                        value={reviewingFile?.data?.value || ''}
                                                                        onChange={(e) => updateFileData(reviewingFile?.id || '', 'value', e.target.value)}
                                                                        className="h-14 rounded-2xl text-base font-medium bg-white border-slate-200 focus:ring-4 focus:ring-primary/5 transition-all"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Seção 02: Vinculação de Cliente */}
                                                        <div className="space-y-6">
                                                            <div className="flex items-center gap-4">
                                                                <div className="h-8 w-8 rounded-xl bg-slate-900 flex items-center justify-center text-white text-[10px] font-black">02</div>
                                                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.3em]">Identificação</h3>
                                                            </div>
                                                            
                                                            <div className={cn(
                                                                "p-6 rounded-[2rem] border transition-all space-y-5",
                                                                !reviewingFile?.client ? "bg-red-50/30 border-red-100" : "bg-slate-50/50 border-slate-100"
                                                            )}>
                                                                <div className="relative group">
                                                                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-primary transition-colors" />
                                                                    <Input 
                                                                        placeholder="Filtrar por nome ou CNPJ..."
                                                                        value={clientSearch}
                                                                        onChange={(e) => setClientSearch(e.target.value)}
                                                                        className="h-14 pl-14 rounded-2xl text-sm font-medium bg-white border-slate-200 focus:ring-4 focus:ring-primary/5 transition-all"
                                                                    />
                                                                </div>
                                                                <div className="relative">
                                                                    <select 
                                                                        value={reviewingFile?.client?.id || ""}
                                                                        onChange={(e) => updateFileClient(reviewingFile?.id || '', e.target.value)}
                                                                        className={cn(
                                                                            "w-full h-14 rounded-2xl text-sm font-bold px-6 bg-white border transition-all appearance-none cursor-pointer",
                                                                            !reviewingFile?.client ? "border-red-200 text-red-500 pr-12 shadow-[0_0_15px_-5px_rgba(239,68,68,0.2)]" : "border-slate-200 text-slate-700"
                                                                        )}
                                                                    >
                                                                        <option value="" disabled>Selecione o Cliente Correto...</option>
                                                                        {filteredClientsForSelect.map(c => (
                                                                            <option key={c.id} value={c.id}>
                                                                                {c.nomeFantasia || c.razaoSocial}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                    <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                                                                </div>
                                                                {!reviewingFile?.client && (
                                                                    <p className="text-[10px] text-red-500 font-black uppercase tracking-widest text-center animate-pulse pt-2">
                                                                        Ação Requerida: Vincule este documento a um cliente
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Seção 03: Comunicação */}
                                                        <div className="space-y-6">
                                                            <div className="flex items-center gap-4">
                                                                <div className="h-8 w-8 rounded-xl bg-slate-900 flex items-center justify-center text-white text-[10px] font-black">03</div>
                                                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.3em]">Canais de Envio</h3>
                                                            </div>

                                                            <div className="space-y-6">
                                                                <div className="space-y-2.5">
                                                                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assunto do Comunicado</Label>
                                                                    <Input 
                                                                        value={reviewingFile?.generatedSubject || ''}
                                                                        onChange={(e) => updateFileContent(reviewingFile?.id || '', 'generatedSubject', e.target.value)}
                                                                        className="h-14 rounded-2xl text-sm font-medium bg-white border-slate-200 focus:ring-4 focus:ring-primary/5 transition-all"
                                                                    />
                                                                </div>
                                                                <div className="space-y-2.5">
                                                                    <div className="flex items-center justify-between px-1">
                                                                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Conteúdo da Mensagem</Label>
                                                                        <span className="text-[9px] text-primary/40 font-black uppercase tracking-[0.2em]">HTML ok</span>
                                                                    </div>
                                                                    <textarea 
                                                                        value={reviewingFile?.generatedMessage || ''}
                                                                        onChange={(e) => updateFileContent(reviewingFile?.id || '', 'generatedMessage', e.target.value)}
                                                                        className="w-full h-80 p-8 rounded-[2.5rem] text-sm font-normal bg-white border border-slate-200 leading-relaxed focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all resize-none shadow-inner"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Painel de Visualização - Flex Expanded */}
                                                <div className="flex-1 bg-slate-900 flex flex-col p-10 relative overflow-hidden">
                                                    {/* Background Pattern for Cinematic Feel */}
                                                    <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
                                                    
                                                    <div className="relative z-10 flex flex-col h-full space-y-8">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-4">
                                                                <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md">
                                                                    <Eye className="h-5 w-5 text-white/80" />
                                                                </div>
                                                                <div>
                                                                    <h4 className="text-white font-light text-lg tracking-tight">Visualização do <span className="font-bold">Original</span></h4>
                                                                    <p className="text-[10px] text-white/30 uppercase font-black tracking-widest">Renderização em alta definição</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-4">
                                                                <a 
                                                                    href={reviewingFile?.publicUrl} 
                                                                    target="_blank" 
                                                                    rel="noopener noreferrer"
                                                                    className="flex items-center gap-2 text-[10px] font-black uppercase text-white/60 hover:text-white transition-colors"
                                                                >
                                                                    <Upload className="h-4 w-4" /> Download
                                                                </a>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="flex-1 bg-white rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden relative border border-white/10 group">
                                                            {reviewingFile?.publicUrl ? (
                                                                reviewingFile.file.type === 'application/pdf' ? (
                                                                    <iframe 
                                                                        src={`${reviewingFile.publicUrl}#toolbar=0&navpanes=0&view=FitH`}
                                                                        className="w-full h-full border-none"
                                                                        title="Preview PDF HD"
                                                                    />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center p-8 overflow-auto custom-scrollbar bg-slate-50">
                                                                        <img 
                                                                            src={reviewingFile.publicUrl} 
                                                                            alt="Preview HD" 
                                                                            className="max-w-full h-auto object-contain shadow-2xl rounded-lg"
                                                                        />
                                                                    </div>
                                                                )
                                                            ) : (
                                                                <div className="h-full flex flex-col items-center justify-center text-slate-300 italic p-12 text-center bg-slate-900">
                                                                    <Loader2 className="h-12 w-12 mb-4 text-primary animate-spin" />
                                                                    <p className="text-sm font-light">Carregando visualização do documento...</p>
                                                                </div>
                                                            )}
                                                            
                                                            {/* Watermark/Label Overlay */}
                                                            <div className="absolute top-8 left-8 bg-slate-900/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Digitalizado via IA v2.0</p>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="flex items-center gap-6 bg-white/5 border border-white/5 backdrop-blur-xl p-6 rounded-[2rem]">
                                                            <div className="h-10 w-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                                                                <AlertCircle className="h-5 w-5 text-amber-500" />
                                                            </div>
                                                            <p className="text-xs text-white/50 font-normal leading-relaxed uppercase tracking-tighter">
                                                                Esta ferramenta extrai dados financeiros automaticamente. <span className="text-white/80 font-bold">Confirme sempre o valor e vencimento</span> visualizando o documento físico projetado acima para garantir 100% de precisão antes do disparo aos clientes.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </motion.div>
                            ))}
                        </div>

                        {completedCount > 0 && (
                            <div className="p-10 bg-muted/20 border-t border-border/20 text-center space-y-8">
                                <div className="space-y-1 mb-2">
                                    <p className="text-base font-light text-foreground">Prepare-se para o disparo massivo</p>
                                    <p className="text-xs text-muted-foreground uppercase tracking-widest opacity-60">{completedCount} guias revisadas e prontas</p>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-[600px] mx-auto">
                                    <Button 
                                        onClick={async () => {
                                            setIsSending(true);
                                            try {
                                                await onSendAll(processedFiles.filter(f => f.status === 'completed'), 'resend');
                                                setProcessedFiles([]);
                                            } finally {
                                                setIsSending(false);
                                            }
                                        }}
                                        disabled={isSending}
                                        className="rounded-2xl h-16 shadow-lg shadow-red-500/20 gap-4 text-[10px] uppercase tracking-[0.2em] font-bold bg-[#EA4335] hover:bg-[#EA4335]/90 transition-all active:scale-[0.98] border-none text-white"
                                    >
                                        {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Mail className="h-5 w-5" />}
                                        {isSending ? 'Enviando...' : 'Enviar e-mail'}
                                    </Button>
                                    <Button 
                                        onClick={async () => {
                                            setIsSending(true);
                                            try {
                                                await onSendAll(processedFiles.filter(f => f.status === 'completed'), 'whatsapp');
                                                setProcessedFiles([]);
                                            } finally {
                                                setIsSending(false);
                                            }
                                        }}
                                        disabled={isSending}
                                        className="rounded-2xl h-16 shadow-lg shadow-emerald-500/20 gap-4 text-[10px] uppercase tracking-[0.2em] font-bold bg-[#25D366] hover:bg-[#25D366]/90 transition-all active:scale-[0.98] text-white"
                                    >
                                        {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                                        {isSending ? 'Enviando...' : 'Enviar WhatsApp'}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
