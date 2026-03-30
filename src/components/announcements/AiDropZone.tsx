
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
    BrainCircuit
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AiService, ExtractedGuideData } from "@/services/aiService";
import { useClients } from "@/hooks/useClients";
import { useAnnouncements } from "@/hooks/useAnnouncements";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface ProcessedFile {
    id: string;
    file: File;
    status: 'pending' | 'processing' | 'completed' | 'error';
    data?: ExtractedGuideData;
    client?: any;
    error?: string;
    previewVisible?: boolean;
    generatedSubject?: string;
    generatedMessage?: string;
    publicUrl?: string; // Add this
}

interface AiDropZoneProps {
    onSendAll: (data: ProcessedFile[], provider: 'gmail' | 'outlook' | 'whatsapp') => void | Promise<void>;
    activeDept: string;
}

export function AiDropZone({ onSendAll, activeDept }: AiDropZoneProps) {
    const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([]);
    const { clients } = useClients();
    const { templates } = useAnnouncements();

    const generatePreview = (data: ExtractedGuideData, client: any, publicUrl?: string) => {
        const subject = `Guia de ${data.type} - ${data.referenceMonth}`;
        
        const template = templates.find(t => 
            t.name.toLowerCase().includes(data.type.toLowerCase()) || 
            t.department === activeDept
        );

        const formattedValue = parseFloat(data.value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        const formattedDate = new Date(data.dueDate).toLocaleDateString('pt-BR');

        let message = template ? template.content : 
`Prezado(a) {{nome_fantasia}},
Esta comunicação refere-se à empresa {{razao_social}}.
Em continuidade ao nosso compromisso em garantir que todas as obrigações contabéis fiscais e legais estejam sempre em conformidade, encaminhamos em anexo: {{tipo_guia}}, referente à competência {{mes_referencia}}.

{{link_documento}}

- Vencimento: {{vencimento}} ({{valor}})

Atenciosamente`;

        // Se estiver usando template e não tiver o link, adicionamos ao fim
        if (template && !message.includes('{{link_documento}}')) {
            message += `\n\n{{link_documento}}`;
        }

        const linkTexto = publicUrl 
            ? `<a href="${publicUrl}">Acesse O Documento - Clicando Aqui</a>`
            : '(Documento em anexo)';

        message = message
            .replace(/{{nome_fantasia}}/g, client?.nome_fantasia || data.companyName || 'Cliente')
            .replace(/{{razao_social}}/g, data.companyName || client?.razao_social || 'Empresa')
            .replace(/{{tipo_guia}}/g, data.type)
            .replace(/{{mes_referencia}}/g, data.referenceMonth)
            .replace(/{{vencimento}}/g, formattedDate)
            .replace(/{{valor}}/g, formattedValue)
            .replace(/{{link_documento}}/g, linkTexto)
            // Legacy fallbacks for older templates
            .replace(/{{mes_atual}}/g, data.referenceMonth);

        return { subject, message };
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
    }, [clients, templates, activeDept]);

    const processFile = async (fileObj: any) => {
        setProcessedFiles(prev => prev.map(f => 
            f.id === fileObj.id ? { ...f, status: 'processing' as const } : f
        ));

        try {
            // 1. Extração de dados via IA
            const data = await AiService.extractGuideData(fileObj.file);
            
            // 2. Upload para o Storage (para gerar link)
            let publicUrl = '';
            try {
                const resource = await AiService.uploadFile(fileObj.file);
                publicUrl = resource.publicUrl;
            } catch (uploadErr) {
                console.warn('Falha no upload, continuando sem link direto:', uploadErr);
            }

            const cleanCnpj = data.cnpj.replace(/\D/g, '');
            const client = clients.find(c => c.cnpj?.replace(/\D/g, '') === cleanCnpj);

            // 3. Geração do preview com o link
            const { subject, message } = generatePreview(data, client, publicUrl);

            setProcessedFiles(prev => prev.map(f => 
                f.id === fileObj.id ? { 
                    ...f, 
                    status: 'completed' as const, 
                    data, 
                    client,
                    generatedSubject: subject,
                    generatedMessage: message,
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
                        <h3 className="text-2xl font-light text-foreground tracking-tight">Processamento <span className="text-primary font-medium">Inteligente</span></h3>
                        <p className="text-sm text-muted-foreground font-light max-w-[320px] mx-auto leading-relaxed">
                            Arraste suas guias aqui. O sistema identificará os clientes e preparará o rascunho automaticamente para você revisar.
                        </p>
                    </div>

                    <div className="inline-flex items-center justify-center gap-3 px-8 py-3 rounded-full bg-card border border-border/50 text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground/60 shadow-sm group-hover:bg-primary/5 group-hover:text-primary transition-all">
                        <Upload className="h-3.5 w-3.5" /> Clique ou arraste arquivos
                    </div>
                </div>

                {/* Glassmorphism Background Elements */}
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
                                            
                                            <div className="min-w-0 flex-1">
                                                <p className="text-base font-light text-foreground truncate">{file.file.name}</p>
                                                {file.status === 'completed' && file.data && (
                                                    <div className="flex items-center gap-3 mt-1.5">
                                                        <span className="px-3 py-1 rounded-lg bg-primary/10 text-[10px] font-bold text-primary uppercase tracking-tighter">{file.data.type}</span>
                                                        <span className="text-sm text-muted-foreground font-light truncate">
                                                            {file.client ? file.client.nome_fantasia : 'Cliente não encontrado'}
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
                                                <div className="p-8 space-y-6">
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60 px-1">Assunto do E-mail</label>
                                                        <input 
                                                            type="text"
                                                            value={file.generatedSubject}
                                                            onChange={(e) => updateFileContent(file.id, 'generatedSubject', e.target.value)}
                                                            className="w-full text-sm font-light text-foreground px-4 py-3 bg-card rounded-xl border border-border/40 focus:border-primary/40 focus:ring-4 focus:ring-primary/5 focus:outline-none transition-all"
                                                            placeholder="Assunto do comunicado..."
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60 px-1">Corpo da Mensagem (Editável)</label>
                                                        <textarea 
                                                            value={file.generatedMessage}
                                                            onChange={(e) => updateFileContent(file.id, 'generatedMessage', e.target.value)}
                                                            className="w-full text-sm font-light text-foreground leading-relaxed px-5 py-5 bg-card rounded-[1.5rem] border border-border/40 focus:border-primary/40 focus:ring-4 focus:ring-primary/5 focus:outline-none transition-all min-h-[250px] resize-none custom-scrollbar"
                                                            placeholder="Conteúdo da mensagem..."
                                                        />
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
                                    <p className="text-xs text-muted-foreground uppercase tracking-widest opacity-60">{completedCount} comunicados revisados e prontos</p>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-[600px] mx-auto">
                                    <Button 
                                        onClick={() => onSendAll(processedFiles.filter(f => f.status === 'completed'), 'gmail')}
                                        className="rounded-2xl h-16 shadow-lg shadow-red-500/20 gap-4 text-[10px] uppercase tracking-[0.2em] font-bold bg-[#EA4335] hover:bg-[#EA4335]/90 transition-all active:scale-[0.98] border-none text-white"
                                    >
                                        <Mail className="h-5 w-5" /> Enviar E-mail
                                    </Button>
                                    <Button 
                                        onClick={() => onSendAll(processedFiles.filter(f => f.status === 'completed'), 'whatsapp')}
                                        className="rounded-2xl h-16 shadow-lg shadow-emerald-500/20 gap-4 text-[10px] uppercase tracking-[0.2em] font-bold bg-[#25D366] hover:bg-[#25D366]/90 transition-all active:scale-[0.98]"
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
