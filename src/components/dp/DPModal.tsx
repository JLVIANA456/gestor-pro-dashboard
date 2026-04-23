import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useDP, DPClosing } from '@/hooks/useDP';
import { Client } from '@/hooks/useClients';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, Trash2, Edit, Users, ChevronDown } from 'lucide-react';
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
    folhaPagamento: z.boolean().default(false),
    encargosSociais: z.boolean().default(false),
    eSocial: z.boolean().default(false),
    dctfWeb: z.boolean().default(false),
    fgtsDigital: z.boolean().default(false),
    empresaEncerrada: z.boolean().default(false),
    empresaEmAndamento: z.boolean().default(false),
    pendencias: z.string().optional(),
});

interface DPModalProps {
    client: Client | null;
    isOpen: boolean;
    onClose: () => void;
    onUpdate?: () => void;
    isAlreadyClosed?: boolean;
}

export function DPModal({ client, isOpen, onClose, onUpdate, isAlreadyClosed }: DPModalProps) {
    const { createClosing, updateClosing, fetchClosingsByClient, loading } = useDP();
    const { technicians } = useTechnicians();
    const [activeTab, setActiveTab] = useState("new");
    const [closings, setClosings] = useState<DPClosing[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Filter only DP technicians
    const dpTechnicians = technicians.filter(t => t.department === 'dp');

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            colaboradorResponsavel: '',
            mesAnoFechamento: new Date().toISOString().slice(0, 7),
            folhaPagamento: false,
            encargosSociais: false,
            eSocial: false,
            dctfWeb: false,
            fgtsDigital: false,
            empresaEncerrada: false,
            empresaEmAndamento: false,
            pendencias: '',
        },
    });

    const watchedValues = form.watch();
    const canCloseCompany = watchedValues.folhaPagamento && 
                           watchedValues.encargosSociais && 
                           watchedValues.eSocial && 
                           watchedValues.dctfWeb;

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
            
            // Set default responsible from client data if available
            form.reset({
                colaboradorResponsavel: client.responsavelDp || '',
                mesAnoFechamento: new Date().toISOString().slice(0, 7),
                folhaPagamento: false,
                encargosSociais: false,
                eSocial: false,
                dctfWeb: false,
                fgtsDigital: false,
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
            const closingData = {
                clientId: client.id,
                colaboradorResponsavel: values.colaboradorResponsavel,
                mesAnoFechamento: values.mesAnoFechamento,
                folhaPagamento: values.folhaPagamento,
                encargosSociais: values.encargosSociais,
                eSocial: values.eSocial,
                dctfWeb: values.dctfWeb,
                fgtsDigital: values.fgtsDigital,
                empresaEncerrada: values.empresaEncerrada,
                empresaEmAndamento: values.empresaEmAndamento,
                pendencias: values.pendencias || '',
            };

            if (editingId) {
                await updateClosing(editingId, closingData);
                setEditingId(null);
            } else {
                await createClosing(closingData);
            }
            form.reset({
                colaboradorResponsavel: values.colaboradorResponsavel,
                mesAnoFechamento: new Date().toISOString().slice(0, 7),
                folhaPagamento: false,
                encargosSociais: false,
                eSocial: false,
                dctfWeb: false,
                fgtsDigital: false,
                empresaEncerrada: false,
                empresaEmAndamento: false,
                pendencias: '',
            });
            loadClosings();
            if (editingId) setActiveTab("history");
        } catch (error) {
            // Error handled in hook
        }
    };

    const handleEdit = (closing: DPClosing) => {
        setEditingId(closing.id);
        form.reset({
            colaboradorResponsavel: closing.colaboradorResponsavel,
            mesAnoFechamento: closing.mesAnoFechamento.slice(0, 7),
            folhaPagamento: closing.folhaPagamento,
            encargosSociais: closing.encargosSociais,
            eSocial: closing.eSocial,
            dctfWeb: closing.dctfWeb,
            fgtsDigital: closing.fgtsDigital,
            empresaEncerrada: closing.empresaEncerrada,
            empresaEmAndamento: closing.empresaEmAndamento,
            pendencias: closing.pendencias,
        });
        setActiveTab("new");
    };

    const cancelEdit = () => {
        setEditingId(null);
        form.reset();
        setActiveTab("history");
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-6xl max-h-[92vh] overflow-y-auto bg-card border-border">
                <DialogHeader>
                    <DialogTitle>Fechamento DP - {client?.razaoSocial}</DialogTitle>
                    <DialogDescription>
                        Gerencie o fechamento de folha e obrigações de departamento pessoal.
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="new">{editingId ? 'Editando Registro' : 'Novo Fechamento'}</TabsTrigger>
                        <TabsTrigger value="history">Histórico</TabsTrigger>
                    </TabsList>

                    <TabsContent value="new" className="space-y-4 py-4">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="colaboradorResponsavel"
                                        render={({ field }) => (
                                            <FormItem className="md:col-span-2">
                                                <FormLabel className="text-xs font-normal uppercase tracking-wider opacity-60">Responsável pelo Fechamento</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="rounded-xl h-12 bg-muted/20 border-border/50 text-left font-light">
                                                            <SelectValue placeholder="Selecione o responsável do DP" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent className="rounded-xl border-border bg-card">
                                                        {dpTechnicians.length === 0 ? (
                                                            <div className="p-4 text-center text-xs text-muted-foreground animate-pulse">
                                                                Nenhum responsável cadastrado em 'Personalizar'
                                                            </div>
                                                        ) : (
                                                            dpTechnicians.map((tech) => (
                                                                <SelectItem key={tech.id} value={tech.name} className="flex items-center gap-2 py-3 cursor-pointer hover:bg-red-500/5 focus:bg-red-500/5 transition-colors rounded-lg mx-1 my-1">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="h-2 w-2 rounded-full bg-red-500/40" />
                                                                        <span className="font-light">{tech.name}</span>
                                                                    </div>
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
                                                <FormLabel className="text-xs font-normal uppercase tracking-wider opacity-60">Mês de Referência</FormLabel>
                                                <FormControl>
                                                    <Input type="month" className="rounded-xl h-12 bg-muted/20 border-border/50" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="folhaPagamento"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-xl border border-border/50 bg-muted/10 p-4 shadow-sm h-16">
                                                 <div className="space-y-0.5">
                                                     <FormLabel className="text-sm font-light">Folha de Pagto</FormLabel>
                                                 </div>
                                                 <FormControl>
                                                     <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                 </FormControl>
                                             </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="encargosSociais"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-xl border border-border/50 bg-muted/10 p-4 shadow-sm h-16">
                                                 <div className="space-y-0.5">
                                                     <FormLabel className="text-sm font-light">Encargos (INSS/FGTS)</FormLabel>
                                                 </div>
                                                 <FormControl>
                                                     <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                 </FormControl>
                                             </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="eSocial"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-xl border border-border/50 bg-muted/10 p-4 shadow-sm h-16">
                                                 <div className="space-y-0.5">
                                                     <FormLabel className="text-sm font-light">eSocial</FormLabel>
                                                 </div>
                                                 <FormControl>
                                                     <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                 </FormControl>
                                             </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="dctfWeb"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-xl border border-border/50 bg-muted/10 p-4 shadow-sm h-16">
                                                 <div className="space-y-0.5">
                                                     <FormLabel className="text-sm font-light">DCTF Web</FormLabel>
                                                 </div>
                                                 <FormControl>
                                                     <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                 </FormControl>
                                             </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="fgtsDigital"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-xl border border-border/50 bg-muted/10 p-4 shadow-sm h-16">
                                                 <div className="space-y-0.5">
                                                     <FormLabel className="text-sm font-light">FGTS Digital</FormLabel>
                                                 </div>
                                                 <FormControl>
                                                     <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                 </FormControl>
                                             </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="empresaEmAndamento"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 shadow-sm h-16">
                                                <div className="space-y-0.5">
                                                    <FormLabel className="text-sm font-light text-blue-600">Folha em Processamento</FormLabel>
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
                                                "flex flex-row items-center justify-between rounded-xl border p-4 shadow-sm transition-all h-16",
                                                canCloseCompany ? "bg-red-500/5 border-red-500/20" : "bg-muted/50 border-border/50 opacity-40 hover:opacity-100"
                                            )}>
                                                <div className="flex items-center gap-4">
                                                    <FormLabel className={cn("text-sm font-light", canCloseCompany ? "text-red-600 uppercase tracking-widest" : "text-muted-foreground")}>
                                                        Finalizar Folha Mensal
                                                    </FormLabel>
                                                    {!canCloseCompany && (
                                                        <p className="text-[9px] text-muted-foreground italic uppercase tracking-tighter">
                                                            (Conclua as etapas acima para encerrar)
                                                        </p>
                                                    )}
                                                </div>
                                                <FormControl>
                                                    <Switch 
                                                        checked={field.value} 
                                                        onCheckedChange={field.onChange}
                                                        disabled={!canCloseCompany}
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
                                            <FormLabel>Notas da Folha / Pendências de Funcionários</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Anotações sobre admissões, demissões, afastamentos ou pendências de documentos rpa..."
                                                    className="resize-none min-h-[100px]"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="flex justify-end gap-2 pt-4">
                                    {editingId && (
                                        <Button type="button" variant="outline" onClick={cancelEdit}>Cancelar Edição</Button>
                                    )}
                                    <Button type="submit" className="bg-red-600 hover:bg-red-700">
                                        {editingId ? 'Atualizar' : 'Salvar'} Fechamento DP
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </TabsContent>

                    <TabsContent value="history">
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Competência</TableHead>
                                        <TableHead>Responsável</TableHead>
                                        <TableHead className="text-center">eSocial</TableHead>
                                        <TableHead className="text-center">Folha</TableHead>
                                        <TableHead className="text-center">Status</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading && closings.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center">
                                                <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                                            </TableCell>
                                        </TableRow>
                                    ) : closings.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                                Nenhum registro de folha encontrado.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        closings.map((closing) => (
                                            <TableRow key={closing.id}>
                                                <TableCell className="px-6 py-4 font-light">{closing.mesAnoFechamento}</TableCell>
                                                <TableCell className="px-6 py-4">{closing.colaboradorResponsavel}</TableCell>
                                                <TableCell className="px-6 py-4 text-center">{closing.eSocial ? '✅' : '❌'}</TableCell>
                                                <TableCell className="px-6 py-4 text-center">{closing.folhaPagamento ? '✅' : '❌'}</TableCell>
                                                <TableCell className="text-center">
                                                    {closing.empresaEncerrada ? (
                                                        <Badge variant="default" className="bg-red-500 text-white text-[9px] px-1 py-0 h-4 uppercase">Fechada</Badge>
                                                    ) : closing.empresaEmAndamento ? (
                                                        <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 border-blue-200 text-[9px] px-1 py-0 h-4 uppercase">Em Aberto</Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 uppercase">Pendente</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(closing)} className="rounded-xl hover:bg-muted/20">
                                                            <Edit className="h-4 w-4" />
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
            </DialogContent>
        </Dialog>
    );
}
