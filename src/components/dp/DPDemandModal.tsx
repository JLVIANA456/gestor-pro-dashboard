import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useClients } from '@/hooks/useClients';
import { useTechnicians } from '@/hooks/useTechnicians';
import { useDPTasks, DPTask, DPTaskType } from '@/hooks/useDPTasks';
import { addDays, subDays, format, parseISO } from 'date-fns';
import { Loader2, Calendar, Search, Check, ChevronDown, Timer } from 'lucide-react';
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
    colaboradorNome: z.string().min(1, 'Nome do colaborador é obrigatório'),
    tipoProcesso: z.string().min(1, 'Tipo de processo é obrigatório'),
    dataBase: z.string().min(1, 'Data base é obrigatória'),
    prazo: z.string().min(1, 'Prazo é obrigatório'),
    dataEnvio: z.string().optional().nullable(),
    dataPagamento: z.string().optional().nullable(),
    responsavelId: z.string().optional().nullable(),
    status: z.enum(['PENDENTE', 'CONCLUIDO']).default('PENDENTE'),
});

interface DPDemandModalProps {
    task?: DPTask | null;
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export function DPDemandModal({ task, isOpen, onClose, onSuccess }: DPDemandModalProps) {
    const { clients } = useClients();
    const { technicians } = useTechnicians();
    const { createTask, updateTask } = useDPTasks();
    const dpTechnicians = technicians.filter(t => t.department === 'dp');
    const [openClientSelect, setOpenClientSelect] = useState(false);
    const [clientSearch, setClientSearch] = useState('');

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            clientId: '',
            colaboradorNome: '',
            tipoProcesso: 'admissao',
            dataBase: format(new Date(), 'yyyy-MM-dd'),
            prazo: format(new Date(), 'yyyy-MM-dd'),
            dataEnvio: null,
            dataPagamento: null,
            responsavelId: null,
            status: 'PENDENTE',
        },
    });

    useEffect(() => {
        if (isOpen) {
            if (task) {
                form.reset({
                    clientId: task.clientId,
                    colaboradorNome: task.colaboradorNome,
                    tipoProcesso: task.tipoProcesso,
                    dataBase: task.dataBase,
                    prazo: task.prazo,
                    dataEnvio: task.dataEnvio,
                    dataPagamento: task.dataPagamento,
                    responsavelId: task.responsavelId,
                    status: task.status,
                });
            } else {
                form.reset({
                    clientId: '',
                    colaboradorNome: '',
                    tipoProcesso: 'admissao',
                    dataBase: format(new Date(), 'yyyy-MM-dd'),
                    prazo: format(subDays(new Date(), 1), 'yyyy-MM-dd'), // Default for admissao
                    dataEnvio: null,
                    dataPagamento: null,
                    responsavelId: null,
                    status: 'PENDENTE',
                });
            }
        }
    }, [isOpen, task, form]);

    // Auto-calculate deadline based on CLT rules
    const watchedDataBase = form.watch('dataBase');
    const watchedTipo = form.watch('tipoProcesso') as DPTaskType;

    useEffect(() => {
        if (watchedDataBase && !task) {
            const baseDate = parseISO(watchedDataBase);
            let suggestedPrazo = baseDate;
            let suggestedDataPagamento = baseDate;

            if (watchedTipo === 'admissao') {
                suggestedPrazo = subDays(baseDate, 1);
                suggestedDataPagamento = subDays(baseDate, 1);
            } else if (watchedTipo === 'rescisao') {
                suggestedPrazo = addDays(baseDate, 10);
                suggestedDataPagamento = addDays(baseDate, 10);
            } else if (watchedTipo === 'ferias') {
                suggestedPrazo = subDays(baseDate, 2);
                suggestedDataPagamento = subDays(baseDate, 2);
            }

            form.setValue('prazo', format(suggestedPrazo, 'yyyy-MM-dd'));
            form.setValue('dataPagamento', format(suggestedDataPagamento, 'yyyy-MM-dd'));
        }
    }, [watchedDataBase, watchedTipo, task]);

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            if (task) {
                await updateTask(task.id, values as any);
            } else {
                await createTask(values as any);
            }
            onClose();
            if (onSuccess) onSuccess();
        } catch (error) {
            // Error handled in hook
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl bg-card border-border rounded-[2.5rem] p-10 overflow-y-auto max-h-[90vh] shadow-2xl">
                <DialogHeader className="mb-10 text-left">
                    <DialogTitle className="text-2xl font-light tracking-tight flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-red-500/10 flex items-center justify-center">
                            <Calendar className="h-5 w-5 text-red-600" />
                        </div>
                        {task ? 'Editar Demanda' : 'Nova Demanda Diária'}
                    </DialogTitle>
                    <DialogDescription className="font-light">Gerencie eventos trabalhistas e prazos da CLT</DialogDescription>
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
                                        <Popover open={openClientSelect} onOpenChange={setOpenClientSelect}>
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
                                                            : "Pesquisar empresa pelo nome..."}
                                                        <Search className="ml-2 h-4 w-4 shrink-0 opacity-30" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-2xl border-border shadow-xl bg-card" align="start">
                                                <Command className="rounded-2xl">
                                                    <CommandInput 
                                                        placeholder="Digite o nome da empresa..." 
                                                        className="h-14 text-sm font-light border-none ring-0 focus:ring-0"
                                                    />
                                                    <CommandList className="max-h-[300px] overflow-y-auto p-2">
                                                        <CommandEmpty className="py-6 text-center text-xs text-muted-foreground font-light">Nenhuma empresa encontrada.</CommandEmpty>
                                                        <CommandGroup>
                                                            {clients.map((c) => (
                                                                <CommandItem
                                                                    key={c.id}
                                                                    value={c.nomeFantasia || c.razaoSocial || ''}
                                                                    onSelect={() => {
                                                                        form.setValue("clientId", c.id);
                                                                        setOpenClientSelect(false);
                                                                    }}
                                                                    className="flex items-center gap-3 py-4 px-4 cursor-pointer hover:bg-red-500/5 focus:bg-red-500/5 transition-colors rounded-xl mb-1 group"
                                                                >
                                                                    <div className="h-2 w-2 rounded-full bg-red-500/0 group-aria-selected:bg-red-500 transition-colors" />
                                                                    <div className="flex flex-col">
                                                                        <span className="font-light text-sm">{c.nomeFantasia || c.razaoSocial}</span>
                                                                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest">{c.cnpj}</span>
                                                                    </div>
                                                                    <Check
                                                                        className={cn(
                                                                            "ml-auto h-4 w-4 text-red-600 transition-opacity",
                                                                            field.value === c.id ? "opacity-100" : "opacity-0"
                                                                        )}
                                                                    />
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
                                    <FormItem className="md:col-span-2">
                                        <FormLabel className="text-[10px] uppercase tracking-[0.2em] font-medium opacity-50 mb-2">Nome do Colaborador (Funcionário)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ex: Maria Oliveira" className="h-14 rounded-2xl bg-muted/10 border-border/40 px-6 font-light text-base" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="tipoProcesso"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[10px] uppercase tracking-[0.2em] font-medium opacity-50 mb-2">Tipo de Processo</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="h-14 rounded-2xl bg-muted/10 border-border/40 px-6 font-light text-base">
                                                    <SelectValue placeholder="Selecione o tipo" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="rounded-2xl border-border bg-card p-2">
                                                <SelectItem value="admissao" className="rounded-xl py-3">Admissão</SelectItem>
                                                <SelectItem value="rescisao" className="rounded-xl py-3">Rescisão</SelectItem>
                                                <SelectItem value="ferias" className="rounded-xl py-3">Férias</SelectItem>
                                                <SelectItem value="recalculo" className="rounded-xl py-3">Recálculo</SelectItem>
                                                <SelectItem value="rescisao_complementar" className="rounded-xl py-3">Rescisão Complementar</SelectItem>
                                                <SelectItem value="levantamento_debitos" className="rounded-xl py-3">Levantamento de Débitos</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="responsavelId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[10px] uppercase tracking-[0.2em] font-medium opacity-50 mb-2">Responsável DP</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                                            <FormControl>
                                                <SelectTrigger className="h-14 rounded-2xl bg-muted/10 border-border/40 px-6 font-light text-base">
                                                    <SelectValue placeholder="Trabalhador DP" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="rounded-2xl border-border bg-card p-2">
                                                {dpTechnicians.map(t => (
                                                    <SelectItem key={t.id} value={t.id} className="cursor-pointer rounded-xl py-3">
                                                        {t.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="dataBase"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[10px] uppercase tracking-[0.2em] font-medium opacity-50 mb-2">Data Base (Início do Evento)</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input type="date" className="h-14 rounded-2xl bg-muted/10 border-border/40 px-6 font-light text-base appearance-none" {...field} />
                                                <Calendar className="absolute right-6 top-1/2 -translate-y-1/2 h-4 w-4 opacity-20 pointer-events-none" />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="prazo"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[10px] uppercase tracking-[0.2em] font-bold text-red-600 mb-2">Prazo Fatal (CLT)</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input type="date" className="h-14 rounded-2xl bg-red-500/5 border-red-500/20 px-6 font-medium text-base text-red-700" {...field} />
                                                <Timer className="absolute right-6 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500 opacity-40 pointer-events-none" />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="dataEnvio"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[10px] uppercase tracking-[0.2em] font-medium opacity-50 mb-2">Data de Entrega / Envio</FormLabel>
                                        <FormControl>
                                            <Input type="date" className="h-14 rounded-2xl bg-muted/10 border-border/40 px-6 font-light text-base" value={field.value || ''} onChange={field.onChange} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="dataPagamento"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[10px] uppercase tracking-[0.2em] font-medium opacity-50 mb-2">Data de Pagamento</FormLabel>
                                        <FormControl>
                                            <Input type="date" className="h-14 rounded-2xl bg-muted/10 border-border/40 px-6 font-light text-base" value={field.value || ''} onChange={field.onChange} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem className="md:col-span-2">
                                        <FormLabel className="text-[10px] uppercase tracking-[0.2em] font-medium opacity-50 mb-2">Status do Processo</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="h-14 rounded-2xl bg-muted/10 border-border/40 px-6 font-light text-base">
                                                    <SelectValue placeholder="Selecione o status" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="rounded-2xl border-border bg-card p-2">
                                                <SelectItem value="PENDENTE" className="rounded-xl py-4 cursor-pointer">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                                                        <span className="font-light">Pendente de Execução</span>
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="CONCLUIDO" className="rounded-xl py-4 cursor-pointer">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                                        <span className="font-light">Finalizado / Entregue</span>
                                                    </div>
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="flex justify-end gap-4 pt-10 border-t border-border/10">
                            <Button type="button" variant="ghost" onClick={onClose} className="rounded-2xl h-14 px-8 font-light uppercase tracking-widest text-xs hover:bg-muted/20 transition-all">Cancelar</Button>
                            <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white rounded-2xl h-14 px-12 font-normal uppercase tracking-widest text-xs shadow-xl shadow-red-500/20 transition-all active:scale-95">
                                {task ? 'Atualizar Demanda' : 'Criar Demanda Diária'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
