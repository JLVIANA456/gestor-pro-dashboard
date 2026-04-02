import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useClients } from '@/hooks/useClients';
import { useTechnicians } from '@/hooks/useTechnicians';
import { useDPDispatches, DispatchChannel, DispatchProcess, DispatchStatus } from '@/hooks/useDPDispatches';
import { useDPTasks } from '@/hooks/useDPTasks';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Loader2, Mail, Send, Check, Search, Calendar, Phone, UploadCloud, FileText, X, Zap, Clock } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { cn } from '@/lib/utils';

const formSchema = z.object({
    clientId: z.string().min(1, 'Cliente é obrigatório'),
    colaboradorNome: z.string().optional().nullable(),
    tipoProcesso: z.string().min(1, 'Tipo de documento é obrigatório'),
    descricao: z.string().optional().nullable(),
    canal: z.enum(['email', 'portal', 'whatsapp', 'manual']),
    destinatario: z.string().min(1, 'Destinatário (Email/Tel) é obrigatório'),
    status: z.string().default('pendente'),
    dataPrevista: z.string().min(1, 'Data prevista é obrigatória'),
    responsavelId: z.string().optional().nullable(),
    mensagem: z.string().optional().nullable(),
    observacoes: z.string().optional().nullable(),
    valor: z.string().optional().nullable(),
    dataVencimento: z.string().optional().nullable(),
    demandId: z.string().optional().nullable(),
});

interface DPDispatchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    initialMessage?: string;
    initialTitle?: string;
}

export function DPDispatchModal({ isOpen, onClose, onSuccess, initialMessage, initialTitle }: DPDispatchModalProps) {
    const { clients } = useClients();
    const { technicians } = useTechnicians();
    const { createDispatch, sendEmailDirect } = useDPDispatches();
    const { tasks, updateTask } = useDPTasks();
    const dpTechnicians = technicians.filter(t => t.department === 'dp');
    const [openClient, setOpenClient] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [attachments, setAttachments] = useState<File[]>([]);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            clientId: '',
            colaboradorNome: '',
            tipoProcesso: 'folha',
            descricao: '',
            canal: 'email',
            destinatario: '',
            status: 'pendente',
            dataPrevista: format(new Date(), 'yyyy-MM-dd'),
            responsavelId: null,
            mensagem: '',
            observacoes: '',
            valor: '',
            dataVencimento: '',
            demandId: null,
        },
    });

    // When opened from a template, pre-fill the message and title fields
    useEffect(() => {
        if (isOpen && initialMessage) {
            form.setValue('mensagem', initialMessage);
        }
        if (isOpen && initialTitle) {
            form.setValue('tipoProcesso', initialTitle);
            form.setValue('descricao', initialTitle);
        }
    }, [isOpen, initialMessage, initialTitle, form]);

    const watchedClientId = form.watch('clientId');
    const watchedCanal = form.watch('canal');

    useEffect(() => {
        if (watchedClientId) {
            const selectedClient = clients.find(c => c.id === watchedClientId);
            if (selectedClient) {
                if (watchedCanal === 'email' && selectedClient.email) {
                    form.setValue('destinatario', selectedClient.email);
                } else if (watchedCanal === 'whatsapp' && selectedClient.telefone) {
                    form.setValue('destinatario', selectedClient.telefone);
                }
            }
        }
    }, [watchedClientId, watchedCanal, clients, form]);

    const watchedColaborador = form.watch('colaboradorNome');
    const filteredTasks = useMemo(() => {
        if (!watchedClientId) return [];
        return tasks.filter(t => 
            t.clientId === watchedClientId && 
            t.status === 'PENDENTE' &&
            (!watchedColaborador || t.colaboradorNome.toLowerCase().includes(watchedColaborador.toLowerCase()))
        );
    }, [tasks, watchedClientId, watchedColaborador]);

    // Auto-select demand if there is only one match
    useEffect(() => {
        if (filteredTasks.length === 1 && !form.getValues('demandId')) {
            form.setValue('demandId', filteredTasks[0].id);
        }
    }, [filteredTasks, form]);

    const convertFileToBase64 = (file: File): Promise<{ filename: string; content: string }> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64String = (reader.result as string).split(',')[1];
                resolve({ filename: file.name, content: base64String });
            };
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(file);
        });
    };

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            setSubmitting(true);
            
            // Upload files to Supabase Storage to get public URLs
            const uploadedFiles: { filename: string; publicUrl: string }[] = [];
            
            for (const file of attachments) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
                const filePath = `dp/${fileName}`;

                const { error: uploadError } = await (supabase.storage as any)
                    .from('client-documents')
                    .upload(filePath, file);

                if (!uploadError) {
                    const { data: { publicUrl } } = (supabase.storage as any)
                        .from('client-documents')
                        .getPublicUrl(filePath);
                    
                    uploadedFiles.push({ filename: file.name, publicUrl });
                } else {
                    console.error('Erro no upload de anexo:', uploadError);
                }
            }
            
            const created = await createDispatch(values as any);

            if (created) {
                const createdData = created as any;
                // Build a DPDispatch-compatible object to pass to sendEmailDirect with attachments
                const dispatchObj = {
                    id: createdData.id || 'temp_id',
                    clientId: values.clientId,
                    empresaNome: clients.find(c => c.id === values.clientId)?.nomeFantasia
                        || clients.find(c => c.id === values.clientId)?.razaoSocial,
                    colaboradorNome: values.colaboradorNome,
                    canal: 'email',
                    destinatario: values.destinatario,
                    tipoDocumento: values.tipoProcesso,
                    tipoProcesso: values.tipoProcesso,
                    mensagem: values.mensagem || null,
                    dataPrevista: values.dataPrevista,
                    anexoUrl: uploadedFiles.length > 0 ? uploadedFiles[0].publicUrl : null,
                    status: 'pendente',
                    valor: values.valor ? parseFloat(values.valor.replace(',', '.')) : null,
                    dataVencimento: values.dataVencimento || null
                } as any;
                
                await sendEmailDirect(dispatchObj, uploadedFiles);

                // "Dar baixa" na demanda se houver uma selecionada
                if (values.demandId) {
                    await updateTask(values.demandId, {
                        status: 'CONCLUIDO',
                        dataEnvio: new Date().toISOString()
                    });
                }
            }

            onClose();
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error('Erro no modal de disparo:', error);
            toast.error('Ocorreu um erro ao processar o disparo.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl bg-card border-border rounded-[2.5rem] p-10 overflow-y-auto max-h-[90vh] shadow-2xl">
                <DialogHeader className="mb-10 text-left">
                    <DialogTitle className="text-2xl font-light tracking-tight flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-red-500/10 flex items-center justify-center">
                            <Send className="h-5 w-5 text-red-600" />
                        </div>
                        Agendar Novo Disparo / Envio
                    </DialogTitle>
                    <DialogDescription className="font-light">Centralize a comunicação e envio de documentos do DP</DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                            <FormField
                                control={form.control}
                                name="clientId"
                                render={({ field }) => (
                                    <FormItem className="md:col-span-2 flex flex-col">
                                        <FormLabel className="text-[10px] uppercase tracking-[0.2em] font-medium opacity-50 mb-2">Cliente / Empresa</FormLabel>
                                        <Popover open={openClient} onOpenChange={setOpenClient}>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        className={cn(
                                                            "w-full h-14 rounded-2xl justify-between bg-muted/10 border-border/40 px-6 font-light text-base hover:bg-muted/20 transition-all",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value
                                                            ? clients.find((c) => c.id === field.value)?.nomeFantasia || clients.find((c) => c.id === field.value)?.razaoSocial
                                                            : "Selecione a empresa para o disparo..."}
                                                        <Search className="ml-2 h-4 w-4 shrink-0 opacity-30" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-2xl border-border shadow-xl bg-card">
                                                <Command>
                                                    <CommandInput placeholder="Buscar empresa..." className="h-14 font-light border-none ring-0 focus:ring-0" />
                                                    <CommandList className="max-h-[300px] p-2">
                                                        <CommandEmpty>Nenhuma empresa encontrada.</CommandEmpty>
                                                        <CommandGroup>
                                                            {clients.map((c) => (
                                                                <CommandItem
                                                                    key={c.id}
                                                                    value={c.nomeFantasia || c.razaoSocial}
                                                                    onSelect={() => {
                                                                        form.setValue("clientId", c.id);
                                                                        setOpenClient(false);
                                                                    }}
                                                                    className="flex items-center gap-3 py-4 px-4 cursor-pointer hover:bg-red-500/5 focus:bg-red-500/5 transition-colors rounded-xl mb-1 group"
                                                                >
                                                                    <div className="flex flex-col">
                                                                        <span className="font-light text-sm">{c.nomeFantasia || c.razaoSocial}</span>
                                                                        <span className="text-[10px] text-muted-foreground uppercase">{c.cnpj}</span>
                                                                    </div>
                                                                    <Check className={cn("ml-auto h-4 w-4 text-red-600", field.value === c.id ? "opacity-100" : "opacity-0")} />
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="colaboradorNome"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[10px] uppercase tracking-[0.2em] font-medium opacity-50 mb-2">Funcionário / Colaborador (Opcional)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Nome no holerite/contrato" className="h-14 rounded-2xl bg-muted/10 border-border/40 px-6 font-light text-base" value={field.value || ''} onChange={field.onChange} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="demandId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[10px] uppercase tracking-[0.2em] font-medium opacity-50 mb-2">Vincular à Demanda Diária (Baixa Auto)</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value || "none"}>
                                            <FormControl>
                                                <SelectTrigger className="h-14 rounded-2xl bg-blue-500/5 border-blue-500/20 px-6 font-light text-base text-blue-700">
                                                    <SelectValue placeholder="Selecione demanda para baixar..." />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="rounded-2xl border-border bg-card p-2">
                                                <SelectItem value="none" className="rounded-xl py-3">Não vincular demanda</SelectItem>
                                                {filteredTasks.map(t => (
                                                    <SelectItem key={t.id} value={t.id} className="rounded-xl py-3 cursor-pointer">
                                                        {t.tipoProcesso.toUpperCase()} — (Prazo: {format(parseISO(t.prazo), 'dd/MM')})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <p className="text-[9px] text-blue-600/60 font-medium">✨ Ao enviar, a tarefa será marcada como concluída.</p>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="tipoProcesso"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[10px] uppercase tracking-[0.2em] font-medium opacity-50 mb-2">Tipo do Documento</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="h-14 rounded-2xl bg-muted/10 border-border/40 px-6 font-light text-base">
                                                    <SelectValue placeholder="Selecione o documento" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="rounded-2xl border-border bg-card p-2">
                                                <SelectItem value="admissao" className="rounded-xl py-3">Admissão</SelectItem>
                                                <SelectItem value="rescisao" className="rounded-xl py-3">Rescisão</SelectItem>
                                                <SelectItem value="ferias" className="rounded-xl py-3">Férias</SelectItem>
                                                <SelectItem value="folha" className="rounded-xl py-3">Folha / Holerite</SelectItem>
                                                <SelectItem value="beneficios" className="rounded-xl py-3">Benefícios</SelectItem>
                                                <SelectItem value="esocial" className="rounded-xl py-3">eSocial / Guias</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="valor"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[10px] uppercase tracking-[0.2em] font-medium opacity-50 mb-2">Valor do Documento (R$)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ex: 1250,50" className="h-14 rounded-2xl bg-muted/10 border-border/40 px-6 font-light text-base" {...field} value={field.value || ''} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="dataVencimento"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[10px] uppercase tracking-[0.2em] font-medium opacity-50 mb-2">Data de Vencimento</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input type="date" className="h-14 rounded-2xl bg-muted/10 border-border/40 px-6 font-light text-base" {...field} value={field.value || ''} />
                                                <Clock className="absolute right-6 top-1/2 -translate-y-1/2 h-4 w-4 opacity-20" />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="destinatario"
                                render={({ field }) => (
                                    <FormItem className="md:col-span-2">
                                        <FormLabel className="text-[10px] uppercase tracking-[0.2em] font-medium opacity-50 mb-2">Destinatário (E-mail ou Telefone)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="contato@empresa.com ou WhatsApp" className="h-14 rounded-2xl bg-muted/10 border-border/40 px-6 font-light text-base" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="descricao"
                                render={({ field }) => (
                                    <FormItem className="md:col-span-2">
                                        <FormLabel className="text-[10px] uppercase tracking-[0.2em] font-medium opacity-50 mb-2">Resumo / Assunto do Disparo</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ex: Envio do recibo de férias de Março/2024" className="h-14 rounded-2xl bg-muted/10 border-border/40 px-6 font-light text-base" value={field.value || ''} onChange={field.onChange} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="dataPrevista"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[10px] uppercase tracking-[0.2em] font-medium opacity-50 mb-2">Previsão / Agendamento</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input type="date" className="h-14 rounded-2xl bg-muted/10 border-border/40 px-6 font-light text-base" {...field} />
                                                <Calendar className="absolute right-6 top-1/2 -translate-y-1/2 h-4 w-4 opacity-20" />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="responsavelId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[10px] uppercase tracking-[0.2em] font-medium opacity-50 mb-2">Responsável pela Geração</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                                            <FormControl>
                                                <SelectTrigger className="h-14 rounded-2xl bg-muted/10 border-border/40 px-6 font-light text-base">
                                                    <SelectValue placeholder="Selecione o responsável" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="rounded-2xl border-border bg-card p-2">
                                                {dpTechnicians.map(t => (
                                                    <SelectItem key={t.id} value={t.id} className="rounded-xl py-3 cursor-pointer">{t.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="mensagem"
                                render={({ field }) => (
                                    <FormItem className="md:col-span-2">
                                        <FormLabel className="text-[11px] uppercase tracking-[0.2em] font-black text-red-600 mb-2">🚀 Notas Adicionais do DP (Corpo do E-mail)</FormLabel>
                                        <FormControl>
                                            <Textarea 
                                                placeholder="Escreva a mensagem que o cliente ou colaborador irá receber..." 
                                                className="min-h-[220px] rounded-[2rem] bg-red-50/50 border-red-200 p-8 font-bold text-black text-lg shadow-inner focus:ring-red-500/20 focus:border-red-500 transition-all leading-relaxed" 
                                                {...field} 
                                                value={field.value || ''}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="md:col-span-2">
                                <FormLabel className="text-[10px] uppercase tracking-[0.2em] font-medium opacity-50 mb-2">Anexos e Documentos (Arraste aqui)</FormLabel>
                                <div 
                                    className="border-2 border-dashed border-border/40 rounded-[2rem] p-12 flex flex-col items-center justify-center bg-muted/5 hover:bg-red-500/5 hover:border-red-500/20 transition-all cursor-pointer group"
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        const files = Array.from(e.dataTransfer.files);
                                        setAttachments(prev => [...prev, ...files]);
                                    }}
                                >
                                    <UploadCloud className="h-12 w-12 text-muted-foreground/20 mb-4 group-hover:text-red-500/40 transition-colors" />
                                    <p className="text-sm font-light text-muted-foreground mb-1">Arraste seus documentos para anexar ao envio</p>
                                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground/40 font-bold">PDF, PNG, JPG até 10MB</p>
                                    <input 
                                        type="file" 
                                        multiple 
                                        className="hidden" 
                                        id="file-upload" 
                                        onChange={(e) => {
                                            if (e.target.files) {
                                                setAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
                                            }
                                        }}
                                    />
                                    <Button 
                                        type="button" 
                                        variant="outline" 
                                        className="mt-6 rounded-xl border-border/40 px-8 hover:bg-card"
                                        onClick={() => document.getElementById('file-upload')?.click()}
                                    >
                                        Selecionar Arquivos
                                    </Button>
                                </div>

                                {attachments.length > 0 && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                                        {attachments.map((file, index) => (
                                            <div key={index} className="flex items-center gap-3 p-4 rounded-xl bg-muted/10 border border-border/20 group">
                                                <FileText className="h-5 w-5 text-red-500/60" />
                                                <div className="flex flex-col flex-1 overflow-hidden">
                                                    <span className="text-xs font-medium truncate">{file.name}</span>
                                                    <span className="text-[9px] uppercase text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                                </div>
                                                <Button 
                                                    type="button"
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-8 w-8 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-500/10"
                                                    onClick={() => setAttachments(prev => prev.filter((_, i) => i !== index))}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                          <div className="flex justify-between items-center gap-4 pt-10 border-t border-border/10">
                            <Button type="button" variant="ghost" onClick={onClose} className="rounded-2xl h-14 px-8 font-light uppercase tracking-widest text-xs">
                                Cancelar
                            </Button>
                            <div className="flex gap-3">
                                <Button
                                    type="submit"
                                    disabled={submitting}
                                    className="bg-red-600 hover:bg-red-700 text-white rounded-2xl h-14 px-10 font-normal uppercase tracking-widest text-xs shadow-xl shadow-red-500/20 transition-all active:scale-95 flex items-center gap-3"
                                >
                                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                                    Disparar Agora
                                </Button>
                            </div>
                        </div>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
