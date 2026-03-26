
import { useState, useCallback, useMemo } from "react";
import { useDropzone } from "react-dropzone";
import { 
    Wand2, 
    Upload, 
    FileText, 
    Loader2, 
    CheckCircle2, 
    AlertCircle, 
    Send,
    Trash2,
    X,
    Eye,
    ChevronDown,
    ChevronUp,
    Mail,
    BrainCircuit,
    CloudOff
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
}

export function DeliveryAiDropZone({ onSendAll }: DeliveryAiDropZoneProps) {
    const [processedFiles, setProcessedFiles] = useState<ProcessedDeliveryFile[]>([]);
    const { clients } = useClients();
    const { obligations } = useObligations();
    const [clientSearch, setClientSearch] = useState('');

    const generatePreview = (data: ExtractedGuideData, client: any, publicUrl?: string) => {
        const branding = BrandingService.getBranding();
        
        // Tenta encontrar a obrigação com o nome mais próximo do extraído
        const obligation = obligations.find(o => 
            o.name.toLowerCase().includes(data.type.toLowerCase()) ||
            data.type.toLowerCase().includes(o.name.toLowerCase())
        );

        const formalName = obligation?.name || data.type;
        const formattedValue = parseFloat(data.value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        const formattedDate = data.dueDate ? new Date(data.dueDate).toLocaleDateString('pt-BR') : '-';

        let subject = "";
        let templateTitle = "";

        // Lógica de Assunto e Título baseada na Categoria da IA
        if (data.category === 'folha') {
            subject = `Folha Mensal - ${client?.nomeFantasia || client?.nome_fantasia || data.companyName} - ${data.referenceMonth}`;
            templateTitle = "Folha de Pagamento e Impostos";
        } else if (data.category === 'extrato') {
            subject = `Extrato Bancário - ${client?.nomeFantasia || client?.nome_fantasia || data.companyName} - ${data.referenceMonth}`;
            templateTitle = "Extrato e Movimentação";
        } else if (data.category === 'inss') {
            subject = `Guia de INSS / Previdência - ${client?.nomeFantasia || client?.nome_fantasia || data.companyName}`;
            templateTitle = "Guia de INSS";
        } else {
            subject = `Guia de Pagamento: ${formalName} - ${client?.nomeFantasia || client?.nome_fantasia || data.companyName}`;
            templateTitle = "Guia de Pagamento";
        }

        let message = branding.deliveryEmailBody || "";
        if (!message || message.trim() === "") {
            if (data.category === 'folha') {
                message = `Olá {{nome_fantasia}},\n\nIdentificamos que sua {{nome_imposto}} referente a {{competencia}} está pronta.\n\n{{link_documento}}`;
            } else {
                message = `Olá {{nome_fantasia}},\n\nIdentificamos que sua {{nome_imposto}} referente a {{competencia}} está pronta.\n\nVencimento: {{vencimento}}\nValor: {{valor}}\n\n{{link_documento}}`;
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
            
            // Normaliza categorias relacionadas a Folha e Férias
            const isFolhaOrFerias = data.category === 'folha' || 
                                   data.type.toLowerCase().includes('férias') || 
                                   data.type.toLowerCase().includes('ferias');

            if (isFolhaOrFerias) {
                data.category = 'folha';
                data.value = "0";
                // Evita datas inválidas no Postgres setando para null se for folha
                data.dueDate = null as any; 
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
                                                        <p className="text-base font-light text-foreground">{parseFloat(file.data?.value || "0").toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                                        <p className="text-xs text-muted-foreground uppercase opacity-60 tracking-wider">REF: {file.data?.referenceMonth}</p>
                                                    </div>
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm" 
                                                        onClick={() => togglePreview(file.id)}
                                                        className={cn(
                                                            "h-10 px-6 rounded-xl text-[10px] font-bold uppercase tracking-widest gap-2 transition-all",
                                                            file.previewVisible ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20" : "border-border/40 hover:border-primary/40"
                                                        )}
                                                    >
                                                        <Eye className="h-4 w-4" /> 
                                                        {file.previewVisible ? 'Fechar Review' : 'Editar & Revisar'}
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

                                    <AnimatePresence>
                                        {file.previewVisible && file.status === 'completed' && (
                                            <motion.div 
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden bg-muted/10 border-t border-border/20"
                                            >
                                                <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-10 text-left">
                                                    {/* Coluna 1: Dados & Mensagem */}
                                                    <div className="space-y-8">
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="space-y-2">
                                                                <label className="text-[10px] uppercase tracking-widest font-black text-primary/60 px-1">Vencimento Manual</label>
                                                                <input 
                                                                    type="date"
                                                                    value={file.data?.dueDate}
                                                                    onChange={(e) => updateFileData(file.id, 'dueDate', e.target.value)}
                                                                    className="w-full text-xs font-bold text-foreground px-4 py-3 bg-card rounded-xl border border-border/40 focus:border-primary/40 focus:ring-4 focus:ring-primary/5 focus:outline-none transition-all"
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <label className="text-[10px] uppercase tracking-widest font-black text-primary/60 px-1">Valor Manual (R$)</label>
                                                                <input 
                                                                    type="number"
                                                                    step="0.01"
                                                                    value={file.data?.value}
                                                                    onChange={(e) => updateFileData(file.id, 'value', e.target.value)}
                                                                    className="w-full text-xs font-bold text-foreground px-4 py-3 bg-card rounded-xl border border-border/40 focus:border-primary/40 focus:ring-4 focus:ring-primary/5 focus:outline-none transition-all"
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="space-y-2">
                                                            <div className="flex items-center justify-between px-1">
                                                                <label className="text-[10px] uppercase tracking-widest font-black text-primary/60">Vincular Cliente Manualmente</label>
                                                                {!file.client && <span className="text-[8px] text-destructive animate-pulse font-black uppercase">Ação Necessária: Selecione um Cliente</span>}
                                                            </div>
                                                            <div className="space-y-3">
                                                                <input 
                                                                    type="text"
                                                                    placeholder="Filtrar cliente por nome ou CNPJ..."
                                                                    value={clientSearch}
                                                                    onChange={(e) => setClientSearch(e.target.value)}
                                                                    className="w-full text-[10px] font-bold uppercase tracking-widest px-4 py-2 bg-muted/30 rounded-lg border border-border/20 focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-muted-foreground/30"
                                                                />
                                                                <select 
                                                                    value={file.client?.id || ""}
                                                                    onChange={(e) => updateFileClient(file.id, e.target.value)}
                                                                    className={cn(
                                                                        "w-full text-sm font-bold px-4 py-4 bg-card rounded-xl border focus:outline-none transition-all",
                                                                        !file.client ? "border-destructive/40 ring-4 ring-destructive/5 text-destructive" : "border-border/40 focus:border-primary/40 focus:ring-4 focus:ring-primary/5 text-foreground"
                                                                    )}
                                                                >
                                                                    <option value="" disabled>Selecione o Cliente Correto...</option>
                                                                    {filteredClientsForSelect.map(c => (
                                                                        <option key={c.id} value={c.id}>
                                                                            {c.nomeFantasia || c.razaoSocial} ({c.cnpj})
                                                                        </option>
                                                                    ))}
                                                                    {filteredClientsForSelect.length === 0 && (
                                                                        <option disabled>Nenhum cliente encontrado...</option>
                                                                    )}
                                                                </select>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-2">
                                                            <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground/60 px-1">Assunto do Comunicado</label>
                                                            <input 
                                                                type="text"
                                                                value={file.generatedSubject}
                                                                onChange={(e) => updateFileContent(file.id, 'generatedSubject', e.target.value)}
                                                                className="w-full text-sm font-medium text-foreground px-4 py-4 bg-card rounded-xl border border-border/40 focus:border-primary/40 focus:ring-4 focus:ring-primary/5 focus:outline-none transition-all"
                                                                placeholder="Assunto do comunicado..."
                                                            />
                                                        </div>

                                                        <div className="space-y-2">
                                                            <div className="flex items-center justify-between px-1">
                                                                <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground/60">Corpo do E-mail</label>
                                                                <span className="text-[9px] text-primary/40 font-bold uppercase tracking-widest">Suporta HTML/Markdown Cortesia</span>
                                                            </div>
                                                            <textarea 
                                                                value={file.generatedMessage}
                                                                onChange={(e) => updateFileContent(file.id, 'generatedMessage', e.target.value)}
                                                                className="w-full text-sm font-light text-foreground leading-relaxed px-5 py-5 bg-card rounded-[1.5rem] border border-border/40 focus:border-primary/40 focus:ring-4 focus:ring-primary/5 focus:outline-none transition-all min-h-[300px] resize-none custom-scrollbar shadow-inner"
                                                                placeholder="Conteúdo da mensagem..."
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Coluna 2: Preview do Arquivo Original */}
                                                    <div className="space-y-4">
                                                        <div className="flex items-center justify-between px-1">
                                                            <label className="text-[10px] uppercase tracking-widest font-black text-primary/60">Preview do Arquivo</label>
                                                            <a href={file.publicUrl} target="_blank" className="text-[9px] font-black uppercase text-primary hover:underline">Abrir em nova aba</a>
                                                        </div>
                                                        <div className="relative w-full aspect-[1/1.4] bg-white rounded-[2rem] border border-border/40 overflow-hidden shadow-2xl">
                                                            {!file.publicUrl ? (
                                                                <div className="h-full flex flex-col items-center justify-center text-muted-foreground/20 italic p-10 text-center">
                                                                    <CloudOff className="h-10 w-10 mb-4" />
                                                                    <p className="text-xs">Upload não concluído para gerar preview interno.</p>
                                                                </div>
                                                            ) : (
                                                                file.file.type === 'application/pdf' ? (
                                                                    <iframe 
                                                                        src={`${file.publicUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                                                                        className="w-full h-full border-none"
                                                                        title="Preview PDF"
                                                                    />
                                                                ) : (
                                                                    <img 
                                                                        src={file.publicUrl} 
                                                                        alt="Preview" 
                                                                        className="w-full h-full object-contain"
                                                                    />
                                                                )
                                                            )}
                                                        </div>
                                                        <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex items-center gap-3">
                                                            <AlertCircle className="h-4 w-4 text-primary opacity-40" />
                                                            <p className="text-[9px] text-primary/60 font-bold uppercase tracking-widest leading-relaxed">
                                                                Verifique se os dados extraídos pela IA coincidem com os dados visíveis no documento original ao lado.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
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
                                        onClick={() => onSendAll(processedFiles.filter(f => f.status === 'completed'), 'resend')}
                                        className="rounded-2xl h-16 shadow-lg shadow-red-500/20 gap-4 text-[10px] uppercase tracking-[0.2em] font-bold bg-[#EA4335] hover:bg-[#EA4335]/90 transition-all active:scale-[0.98] border-none text-white"
                                    >
                                        <Mail className="h-5 w-5" /> Enviar e-mail
                                    </Button>
                                    <Button 
                                        onClick={() => onSendAll(processedFiles.filter(f => f.status === 'completed'), 'whatsapp')}
                                        className="rounded-2xl h-16 shadow-lg shadow-emerald-500/20 gap-4 text-[10px] uppercase tracking-[0.2em] font-bold bg-[#25D366] hover:bg-[#25D366]/90 transition-all active:scale-[0.98] text-white"
                                    >
                                        <Send className="h-5 w-5" /> Enviar WhatsApp
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
