import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useFiscal, FiscalClosing } from '@/hooks/useFiscal';
import { Client } from '@/hooks/useClients';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, Trash2, Edit, FileText, User } from 'lucide-react';
import { useTechnicians } from '@/hooks/useTechnicians';
import { 
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const formSchema = z.object({
    colaboradorResponsavel: z.string().min(1, 'Colaborador é obrigatório'),
    mesAnoFechamento: z.string().min(1, 'Mês/Ano é obrigatório'),
    escrituracaoFiscal: z.boolean().default(false),
    apuracaoImpostos: z.boolean().default(false),
    entregaObrigacoes: z.boolean().default(false),
    conferenciaGeral: z.boolean().default(false),
    empresaEncerrada: z.boolean().default(false),
    empresaEmAndamento: z.boolean().default(false),
    pendencias: z.string().optional(),
});

interface FiscalModalProps {
    client: Client | null;
    isOpen: boolean;
    onClose: () => void;
    onUpdate?: () => void;
    isAlreadyClosed?: boolean;
}

export function FiscalModal({ client, isOpen, onClose, onUpdate, isAlreadyClosed }: FiscalModalProps) {
    const { createClosing, updateClosing, deleteClosing, fetchClosingsByClient, loading } = useFiscal();
    const { technicians } = useTechnicians();
    const [activeTab, setActiveTab] = useState("new");
    const [closings, setClosings] = useState<FiscalClosing[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);

    const fiscalTechnicians = technicians.filter(t => t.department === 'fiscal');

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            colaboradorResponsavel: client?.responsavelFiscal || '',
            mesAnoFechamento: new Date().toISOString().slice(0, 7),
            escrituracaoFiscal: false,
            apuracaoImpostos: false,
            entregaObrigacoes: false,
            conferenciaGeral: false,
            empresaEncerrada: false,
            empresaEmAndamento: false,
            pendencias: '',
        },
    });

    const watchedValues = form.watch();
    const canCloseCompany = watchedValues.escrituracaoFiscal && 
                           watchedValues.apuracaoImpostos && 
                           watchedValues.entregaObrigacoes && 
                           watchedValues.conferenciaGeral;

    const loadClosings = async () => {
        if (client) {
            const data = await fetchClosingsByClient(client.id);
            setClosings(data);
            if (onUpdate) onUpdate();
        }
    };

    useEffect(() => {
        if (isOpen && client) {
            loadClosings();
            setEditingId(null);
            form.reset({
                colaboradorResponsavel: client.responsavelFiscal || '',
                mesAnoFechamento: new Date().toISOString().slice(0, 7),
                escrituracaoFiscal: false,
                apuracaoImpostos: false,
                entregaObrigacoes: false,
                conferenciaGeral: false,
                empresaEncerrada: false,
                empresaEmAndamento: false,
                pendencias: '',
            });
            setActiveTab(isAlreadyClosed ? "history" : "new");
        }
    }, [isOpen, client, isAlreadyClosed]);

    useEffect(() => {
        if (!canCloseCompany && form.getValues('empresaEncerrada')) {
            form.setValue('empresaEncerrada', false);
        }
    }, [canCloseCompany]);

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        if (!client) return;

        try {
            if (editingId) {
                await updateClosing(editingId, {
                    clientId: client.id,
                    colaboradorResponsavel: values.colaboradorResponsavel,
                    mesAnoFechamento: values.mesAnoFechamento,
                    escrituracaoFiscal: values.escrituracaoFiscal,
                    apuracaoImpostos: values.apuracaoImpostos,
                    entregaObrigacoes: values.entregaObrigacoes,
                    conferenciaGeral: values.conferenciaGeral,
                    empresaEncerrada: values.empresaEncerrada,
                    empresaEmAndamento: values.empresaEmAndamento,
                    pendencias: values.pendencias || '',
                });
                setEditingId(null);
            } else {
                await createClosing({
                    clientId: client.id,
                    colaboradorResponsavel: values.colaboradorResponsavel,
                    mesAnoFechamento: values.mesAnoFechamento,
                    escrituracaoFiscal: values.escrituracaoFiscal,
                    apuracaoImpostos: values.apuracaoImpostos,
                    entregaObrigacoes: values.entregaObrigacoes,
                    conferenciaGeral: values.conferenciaGeral,
                    empresaEncerrada: values.empresaEncerrada,
                    empresaEmAndamento: values.empresaEmAndamento,
                    pendencias: values.pendencias || '',
                });
            }
            form.reset({
                ...form.getValues(),
                pendencias: ''
            });
            loadClosings();
            if (editingId) setActiveTab("history");
        } catch (error) {
            // Error handled in hook
        }
    };

    const handleEdit = (closing: FiscalClosing) => {
        setEditingId(closing.id);
        form.reset({
            colaboradorResponsavel: closing.colaboradorResponsavel,
            mesAnoFechamento: closing.mesAnoFechamento.slice(0, 7),
            escrituracaoFiscal: closing.escrituracaoFiscal,
            apuracaoImpostos: closing.apuracaoImpostos,
            entregaObrigacoes: closing.entregaObrigacoes,
            conferenciaGeral: closing.conferenciaGeral,
            empresaEncerrada: closing.empresaEncerrada,
            empresaEmAndamento: closing.empresaEmAndamento,
            pendencias: closing.pendencias,
        });
        setActiveTab("new");
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Tem certeza que deseja excluir este registro?")) {
            await deleteClosing(id);
            loadClosings();
        }
    };

    const cancelEdit = () => {
        setEditingId(null);
        form.reset();
        setActiveTab("history");
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-6xl max-h-[92vh] overflow-y-auto bg-card border-border rounded-3xl">
                <DialogHeader className="p-6 border-b border-border/10">
                    <DialogTitle className="text-2xl font-light">Fechamento Fiscal - <span className="text-primary font-normal">{client?.nomeFantasia || client?.razaoSocial}</span></DialogTitle>
                    <DialogDescription className="text-sm font-light uppercase tracking-widest opacity-60">
                        Gerencie os fechamentos fiscais e obrigações deste cliente
                    </DialogDescription>
                </DialogHeader>

                <div className="p-6">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 h-12 p-1 bg-muted/20 rounded-xl">
                            <TabsTrigger value="new" className="rounded-lg">{editingId ? 'Editando Registro' : 'Novo Fechamento'}</TabsTrigger>
                            <TabsTrigger value="history" className="rounded-lg">Histórico</TabsTrigger>
                        </TabsList>

                        <TabsContent value="new" className="space-y-4 py-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <FormField
                                            control={form.control}
                                            name="colaboradorResponsavel"
                                            render={({ field }) => (
                                                <FormItem className="md:col-span-2">
                                                    <FormLabel className="text-xs font-normal uppercase tracking-wider opacity-60">Colaborador Responsável</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className="rounded-xl h-12 bg-muted/10 border-border/50 focus:border-primary/30 transition-all font-light">
                                                                <div className="flex items-center gap-2">
                                                                    <User className="h-4 w-4 opacity-40" />
                                                                    <SelectValue placeholder="Selecione o responsável fiscal" />
                                                                </div>
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent className="rounded-xl border-border bg-card shadow-elevated">
                                                            {fiscalTechnicians.length === 0 ? (
                                                                <SelectItem value="none" disabled>Nenhum responsável cadastrado</SelectItem>
                                                            ) : (
                                                                fiscalTechnicians.map((tech) => (
                                                                    <SelectItem key={tech.id} value={tech.name} className="font-light">
                                                                        {tech.name}
                                                                    </SelectItem>
                                                                ))
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="mesAnoFechamento"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs font-normal uppercase tracking-wider opacity-60">Mês/Ano Fechamento</FormLabel>
                                                    <FormControl>
                                                        <Input type="month" className="rounded-xl h-12 bg-muted/10 border-border/50 focus:border-primary/30 transition-all font-light" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="escrituracaoFiscal"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-center justify-between rounded-2xl border border-border/50 bg-card p-4 shadow-sm h-20 transition-all hover:border-primary/20">
                                                     <div className="space-y-1">
                                                         <FormLabel className="text-sm font-light">Escrituração Fiscal</FormLabel>
                                                         <p className="text-[10px] text-muted-foreground uppercase tracking-tighter">Entradas e Saídas</p>
                                                     </div>
                                                     <FormControl>
                                                         <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                     </FormControl>
                                                 </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="apuracaoImpostos"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-center justify-between rounded-2xl border border-border/50 bg-card p-4 shadow-sm h-20 transition-all hover:border-primary/20">
                                                     <div className="space-y-1">
                                                         <FormLabel className="text-sm font-light">Apuração Impostos</FormLabel>
                                                         <p className="text-[10px] text-muted-foreground uppercase tracking-tighter">Cálculos Tributários</p>
                                                     </div>
                                                     <FormControl>
                                                         <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                     </FormControl>
                                                 </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="entregaObrigacoes"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-center justify-between rounded-2xl border border-border/50 bg-card p-4 shadow-sm h-20 transition-all hover:border-primary/20">
                                                     <div className="space-y-1">
                                                         <FormLabel className="text-sm font-light">Obrigações</FormLabel>
                                                         <p className="text-[10px] text-muted-foreground uppercase tracking-tighter">Envio de Acessórias</p>
                                                     </div>
                                                     <FormControl>
                                                         <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                     </FormControl>
                                                 </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="conferenciaGeral"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-center justify-between rounded-2xl border border-border/50 bg-card p-4 shadow-sm h-20 transition-all hover:border-primary/20">
                                                     <div className="space-y-1">
                                                         <FormLabel className="text-sm font-light">Conferência</FormLabel>
                                                         <p className="text-[10px] text-muted-foreground uppercase tracking-tighter">Revisão Final</p>
                                                     </div>
                                                     <FormControl>
                                                         <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                     </FormControl>
                                                 </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="empresaEmAndamento"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-center justify-between rounded-2xl border border-blue-500/20 bg-blue-500/[0.02] p-4 shadow-sm h-20 transition-all hover:border-blue-500/40">
                                                    <div className="space-y-1">
                                                        <FormLabel className="text-sm font-light text-blue-600">Em Andamento</FormLabel>
                                                        <p className="text-[10px] text-blue-500/60 uppercase tracking-tighter font-medium text-center">Fechamento Iniciado</p>
                                                    </div>
                                                    <FormControl>
                                                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="empresaEncerrada"
                                            render={({ field }) => (
                                                <FormItem className={cn(
                                                    "flex flex-row items-center justify-between rounded-2xl border p-4 shadow-lg transition-all h-20 md:col-span-2 lg:col-span-3",
                                                    canCloseCompany ? "bg-primary/5 border-primary/20" : "bg-muted/30 border-border/20 opacity-40 hover:opacity-100"
                                                )}>
                                                    <div className="flex items-center gap-6">
                                                        <div className="space-y-1">
                                                            <FormLabel className={cn("text-base font-medium transition-colors", canCloseCompany ? "text-primary tracking-widest uppercase" : "text-muted-foreground")}>
                                                                Encerrar Fiscal?
                                                            </FormLabel>
                                                            {!canCloseCompany && (
                                                                <p className="text-[9px] text-muted-foreground italic uppercase tracking-widest">
                                                                    (Libere marcando os 4 itens de controle acima)
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <FormControl>
                                                        <Switch 
                                                            checked={field.value} 
                                                            onCheckedChange={field.onChange}
                                                            disabled={!canCloseCompany}
                                                            className={cn(canCloseCompany ? "data-[state=checked]:bg-primary" : "")}
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="pendencias"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-normal uppercase tracking-wider opacity-60">Pendências / Observações</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Descreva pendências no fechamento, documentos faltantes ou observações importantes..."
                                                        className="resize-none min-h-[120px] rounded-2xl border-border/50 bg-muted/10 focus:border-primary/30 font-light"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="flex justify-end gap-3 pt-4">
                                        {editingId && (
                                            <Button type="button" variant="ghost" onClick={cancelEdit} className="rounded-xl px-6 h-12 hover:bg-destructive/10 hover:text-destructive">Cancelar Edição</Button>
                                        )}
                                        <Button type="submit" className="rounded-xl px-8 h-12 shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
                                            {editingId ? 'Atualizar Registro' : 'Salvar Fechamento Fiscal'}
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        </TabsContent>

                        <TabsContent value="history" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="rounded-2xl border border-border/50 overflow-hidden shadow-sm bg-card mt-4">
                                <Table>
                                    <TableHeader className="bg-muted/30">
                                        <TableRow className="hover:bg-transparent border-border/50">
                                            <TableHead className="text-[10px] font-bold uppercase tracking-widest py-4 pl-6">Mês/Ano</TableHead>
                                            <TableHead className="text-[10px] font-bold uppercase tracking-widest py-4">Responsável</TableHead>
                                            <TableHead className="text-[10px] font-bold uppercase tracking-widest py-4 text-center">Status</TableHead>
                                            <TableHead className="text-right pr-6 text-[10px] font-bold uppercase tracking-widest py-4">Ações</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading && closings.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="h-40 text-center">
                                                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                                                </TableCell>
                                            </TableRow>
                                        ) : closings.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="h-40 text-center text-muted-foreground opacity-50">
                                                    <FileText className="h-10 w-10 mx-auto mb-2 opacity-20" />
                                                    <p className="text-sm font-light">Nenhum fechamento registrado para este cliente.</p>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            closings.map((closing) => (
                                                <TableRow key={closing.id} className="group hover:bg-muted/10 transition-colors border-border/30">
                                                    <TableCell className="pl-6 py-4">
                                                        <span className="text-sm font-medium text-foreground tracking-tight">{closing.mesAnoFechamento}</span>
                                                    </TableCell>
                                                    <TableCell className="py-4 font-light text-muted-foreground text-sm">
                                                        {closing.colaboradorResponsavel}
                                                    </TableCell>
                                                    <TableCell className="py-4 text-center">
                                                        {closing.empresaEncerrada ? (
                                                            <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px] px-2 py-0.5 h-5 rounded-lg uppercase tracking-wider font-bold shadow-sm">ENCERRADA</Badge>
                                                        ) : closing.empresaEmAndamento ? (
                                                            <Badge className="bg-blue-500/10 text-blue-600 border-blue-200 text-[9px] px-2 py-0.5 h-5 rounded-lg uppercase tracking-wider font-bold shadow-sm">EM ANDAMENTO</Badge>
                                                        ) : (
                                                            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200 text-[9px] px-2 py-0.5 h-5 rounded-lg uppercase tracking-wider font-bold shadow-sm">FINALIZADO</Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="pr-6 py-4 text-right">
                                                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(closing)} className="h-8 w-8 rounded-lg hover:bg-primary/10 text-primary">
                                                                <Edit className="h-3.5 w-3.5" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-destructive hover:text-destructive/90 hover:bg-destructive/5" onClick={() => handleDelete(closing.id)}>
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </DialogContent>
        </Dialog>
    );
}
