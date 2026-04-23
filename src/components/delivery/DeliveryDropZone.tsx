import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { 
    Wand2, 
    Upload, 
    FileText, 
    Loader2, 
    CheckCircle2, 
    AlertCircle, 
    Trash2,
    X,
    Eye,
    BrainCircuit,
    Plus
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AiService, ExtractedGuideData } from "@/services/aiService";
import { useClients } from "@/hooks/useClients";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface ProcessedDeliveryFile {
    id: string;
    file: File;
    status: 'pending' | 'processing' | 'completed' | 'error';
    data?: ExtractedGuideData;
    client?: any;
    error?: string;
    previewVisible?: boolean;
    publicUrl?: string;
}

interface DeliveryDropZoneProps {
    onAddAll: (data: ProcessedDeliveryFile[]) => void | Promise<void>;
}

export function DeliveryDropZone({ onAddAll }: DeliveryDropZoneProps) {
    const [processedFiles, setProcessedFiles] = useState<ProcessedDeliveryFile[]>([]);
    const { clients } = useClients();

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const newFiles = acceptedFiles.map(file => ({
            id: Math.random().toString(36).substring(2, 9),
            file,
            status: 'pending' as const,
            previewVisible: false
        }));

        setProcessedFiles(prev => [...prev, ...newFiles]);

        for (const fileObj of newFiles) {
            processFile(fileObj);
        }
    }, [clients]);

    const processFile = async (fileObj: any) => {
        setProcessedFiles(prev => prev.map(f => 
            f.id === fileObj.id ? { ...f, status: 'processing' as const } : f
        ));

        try {
            const data = await AiService.extractGuideData(fileObj.file);
            
            let publicUrl = '';
            try {
                const resource = await AiService.uploadFile(fileObj.file);
                publicUrl = resource.publicUrl;
            } catch (uploadErr) {
                console.warn('Falha no upload:', uploadErr);
            }

            const cleanCnpj = data.cnpj.replace(/\D/g, '');
            const client = clients.find(c => c.cnpj?.replace(/\D/g, '') === cleanCnpj);

            setProcessedFiles(prev => prev.map(f => 
                f.id === fileObj.id ? { 
                    ...f, 
                    status: 'completed' as const, 
                    data, 
                    client,
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

    const handleConfirmAll = async () => {
        const completed = processedFiles.filter(f => f.status === 'completed');
        await onAddAll(completed);
        setProcessedFiles([]);
    };

    return (
        <div className="space-y-6">
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
                    <div className="w-24 h-24 bg-primary/10 rounded-[2.5rem] flex items-center justify-center mx-auto group-hover:scale-110 group-hover:rotate-3 transition-all duration-700 shadow-2xl shadow-primary/10 border border-primary/20">
                        <BrainCircuit className="h-12 w-12 text-primary" />
                    </div>
                    
                    <div className="space-y-3">
                        <h3 className="text-2xl font-light text-foreground tracking-tight">
                            Processamento <span className="text-primary font-medium">Ultra-IA</span>
                        </h3>
                        <p className="text-sm text-muted-foreground font-light max-w-[450px] mx-auto leading-relaxed">
                            Solte <span className="font-bold text-primary">50, 100 ou mais PDFs</span> de uma vez. 
                            Nossa IA Auditora identifica o cliente, valida o CNPJ e distribui os impostos automaticamente nos cards corretos.
                        </p>
                    </div>

                    <div className="inline-flex items-center justify-center gap-4 px-10 py-4 rounded-2xl bg-primary text-[11px] uppercase tracking-[0.2em] font-bold text-white shadow-xl shadow-primary/20 group-hover:scale-110 transition-all duration-500">
                        <Plus className="h-4 w-4" /> Iniciar Envio de Guias em Lote
                    </div>
                </div>

                <div className="absolute -top-10 -right-10 w-48 h-48 bg-primary/10 rounded-full blur-[90px]" />
                <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-primary/10 rounded-full blur-[90px]" />
            </div>

            <AnimatePresence>
                {processedFiles.length > 0 && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-card rounded-[2.5rem] border border-border/50 shadow-elevated overflow-hidden"
                    >
                        <div className="p-8 border-b border-border/20 flex items-center justify-between bg-muted/10">
                            <div>
                                <h4 className="text-base font-light text-foreground flex items-center gap-3">
                                    <FileText className="h-5 w-5 text-primary opacity-60" />
                                    Guias Identificadas
                                </h4>
                            </div>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setProcessedFiles([])}
                                className="h-9 px-6 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:text-destructive hover:bg-destructive/5"
                            >
                                <Trash2 className="h-4 w-4 mr-2" /> Cancelar Todos
                            </Button>
                        </div>

                        <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                            {processedFiles.map((file) => (
                                <div 
                                    key={file.id}
                                    className="p-6 flex items-center justify-between gap-6 border-b border-border/10 last:border-0 hover:bg-primary/[0.01]"
                                >
                                    <div className="flex items-center gap-5 min-w-0 flex-1">
                                        <div className="h-12 w-12 bg-card rounded-xl border border-border/40 flex items-center justify-center shrink-0">
                                            {file.status === 'processing' ? <Loader2 className="h-6 w-6 text-primary animate-spin" /> :
                                             file.status === 'completed' ? <CheckCircle2 className="h-6 w-6 text-emerald-500" /> :
                                             file.status === 'error' ? <AlertCircle className="h-6 w-6 text-destructive" /> :
                                             <FileText className="h-6 w-6 text-muted-foreground opacity-40" />}
                                        </div>
                                        
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-light text-foreground truncate">{file.file.name}</p>
                                            {file.status === 'completed' && file.data && (
                                                <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                                                    <span className="font-bold text-primary uppercase">{file.data.type}</span>
                                                    <span>•</span>
                                                    <span className="truncate">{file.client ? (file.client.nomeFantasia || file.client.razaoSocial) : 'Cliente Não Encontrado'}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {file.status === 'completed' && (
                                        <div className="text-right whitespace-nowrap hidden sm:block">
                                            <p className="text-sm font-light text-foreground">
                                                {parseFloat(file.data?.value || "0").toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                                VENCTO: {file.data?.dueDate ? (
                                                    (() => {
                                                        const [y, m, d] = file.data.dueDate.split('T')[0].split('-');
                                                        return `${d}/${m}/${y}`;
                                                    })()
                                                ) : '--'}
                                            </p>
                                        </div>
                                    )}

                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={() => removeFile(file.id)}
                                        className="h-9 w-9 rounded-lg"
                                    >
                                        <X className="h-4 w-4 text-muted-foreground/40" />
                                    </Button>
                                </div>
                            ))}
                        </div>

                        {completedCount > 0 && (
                            <div className="p-8 bg-muted/20 border-t border-border/20 flex flex-col items-center gap-4">
                                <Button 
                                    onClick={handleConfirmAll}
                                    className="rounded-2xl h-14 px-12 shadow-lg shadow-primary/20 gap-3 text-[11px] uppercase tracking-widest font-bold bg-primary text-white hover:bg-primary/90 transition-all active:scale-[0.98]"
                                >
                                    <Plus className="h-5 w-5" /> Adicionar à Lista de Entrega
                                </Button>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest opacity-60">
                                    Serão criadas {completedCount} novas tarefas na lista
                                </p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
