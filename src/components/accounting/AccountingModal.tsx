import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAccounting, AccountingClosing } from '@/hooks/useAccounting';
import { Client } from '@/hooks/useClients';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Badge } from '@/components/ui/badge';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, Trash2, Edit } from 'lucide-react';

const formSchema = z.object({
    colaboradorResponsavel: z.string().min(1, 'Colaborador é obrigatório'),
    mesAnoFechamento: z.string().min(1, 'Mês/Ano é obrigatório'),
    conciliacaoContabil: z.boolean().default(false),
    controleLucros: z.boolean().default(false),
    controleAplicacaoFinanceira: z.boolean().default(false),
    controleAnual: z.boolean().default(false),
    empresaEncerrada: z.boolean().default(false),
    pendencias: z.string().optional(),
});

interface AccountingModalProps {
    client: Client | null;
    isOpen: boolean;
    onClose: () => void;
    onUpdate?: () => void;
    isAlreadyClosed?: boolean;
}

export function AccountingModal({ client, isOpen, onClose, onUpdate, isAlreadyClosed }: AccountingModalProps) {
    const { createClosing, updateClosing, deleteClosing, fetchClosingsByClient, loading } = useAccounting();
    const [activeTab, setActiveTab] = useState("new");
    const [closings, setClosings] = useState<AccountingClosing[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            colaboradorResponsavel: '',
            mesAnoFechamento: new Date().toISOString().slice(0, 7),
            conciliacaoContabil: false,
            controleLucros: false,
            controleAplicacaoFinanceira: false,
            controleAnual: false,
            empresaEncerrada: false,
            pendencias: '',
        },
    });

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
            form.reset();
            // Se a empresa já está fechada, abre no Histórico para ver os dados
            setActiveTab(isAlreadyClosed ? "history" : "new");
        }
    }, [isOpen, client, isAlreadyClosed]);

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        if (!client) return;

        try {
            if (editingId) {
                await updateClosing(editingId, {
                    clientId: client.id,
                    colaboradorResponsavel: values.colaboradorResponsavel,
                    mesAnoFechamento: values.mesAnoFechamento,
                    conciliacaoContabil: values.conciliacaoContabil,
                    controleLucros: values.controleLucros,
                    controleAplicacaoFinanceira: values.controleAplicacaoFinanceira,
                    controleAnual: values.controleAnual,
                    empresaEncerrada: values.empresaEncerrada,
                    pendencias: values.pendencias || '',
                });
                setEditingId(null);
            } else {
                await createClosing({
                    clientId: client.id,
                    colaboradorResponsavel: values.colaboradorResponsavel,
                    mesAnoFechamento: values.mesAnoFechamento,
                    conciliacaoContabil: values.conciliacaoContabil,
                    controleLucros: values.controleLucros,
                    controleAplicacaoFinanceira: values.controleAplicacaoFinanceira,
                    controleAnual: values.controleAnual,
                    empresaEncerrada: values.empresaEncerrada,
                    pendencias: values.pendencias || '',
                });
            }
            form.reset();
            loadClosings();
            if (editingId) setActiveTab("history"); // After edit go to history
            else {
                // After create reset form
                form.setValue('mesAnoFechamento', new Date().toISOString().slice(0, 7));
            }
        } catch (error) {
            // Error handled in hook
        }
    };

    const handleEdit = (closing: AccountingClosing) => {
        setEditingId(closing.id);
        form.reset({
            colaboradorResponsavel: closing.colaboradorResponsavel,
            mesAnoFechamento: closing.mesAnoFechamento.slice(0, 7), // YYYY-MM
            conciliacaoContabil: closing.conciliacaoContabil,
            controleLucros: closing.controleLucros,
            controleAplicacaoFinanceira: closing.controleAplicacaoFinanceira,
            controleAnual: closing.controleAnual,
            empresaEncerrada: closing.empresaEncerrada,
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
            <DialogContent className="sm:max-w-[800px] overflow-y-auto max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>Fechamento Contábil - {client?.razaoSocial}</DialogTitle>
                    <DialogDescription>
                        Gerencie os fechamentos mensais deste cliente.
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
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="colaboradorResponsavel"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Colaborador Responsável</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Nome do colaborador" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="mesAnoFechamento"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Mês/Ano Fechamento</FormLabel>
                                                <FormControl>
                                                    <Input type="month" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="conciliacaoContabil"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                                <div className="space-y-0.5">
                                                    <FormLabel className="text-base">Conciliação Contábil</FormLabel>
                                                </div>
                                                <FormControl>
                                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="controleLucros"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                                <div className="space-y-0.5">
                                                    <FormLabel className="text-base">Controle de Lucros</FormLabel>
                                                </div>
                                                <FormControl>
                                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="controleAplicacaoFinanceira"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                                <div className="space-y-0.5">
                                                    <FormLabel className="text-base">Controle Aplicação</FormLabel>
                                                </div>
                                                <FormControl>
                                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="controleAnual"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                                <div className="space-y-0.5">
                                                    <FormLabel className="text-base">Controle Anual</FormLabel>
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
                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-destructive/5 border-destructive/20">
                                                <div className="space-y-0.5">
                                                    <FormLabel className="text-base text-destructive">Empresa Encerrada?</FormLabel>
                                                </div>
                                                <FormControl>
                                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
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
                                            <FormLabel>Pendências / Observações</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Descreva pendências ou observações..."
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
                                    <Button type="submit">{editingId ? 'Atualizar' : 'Salvar'} Fechamento</Button>
                                </div>
                            </form>
                        </Form>
                    </TabsContent>

                    <TabsContent value="history">
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Mês/Ano</TableHead>
                                        <TableHead>Responsável</TableHead>
                                        <TableHead className="text-center">Conciliação</TableHead>
                                        <TableHead className="text-center">Status</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading && closings.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center">
                                                <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                                            </TableCell>
                                        </TableRow>
                                    ) : closings.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                                Nenhum fechamento registrado.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        closings.map((closing) => (
                                            <TableRow key={closing.id}>
                                                <TableCell className="font-medium">{closing.mesAnoFechamento}</TableCell>
                                                <TableCell>{closing.colaboradorResponsavel}</TableCell>
                                                <TableCell className="text-center">{closing.conciliacaoContabil ? '✅' : '❌'}</TableCell>
                                                <TableCell className="text-center">
                                                    {closing.empresaEncerrada ? (
                                                        <Badge variant="destructive" className="text-[9px] px-1 py-0 h-4 uppercase">Encerrada</Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 uppercase">Normal</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(closing)}>
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/90" onClick={() => handleDelete(closing.id)}>
                                                            <Trash2 className="h-4 w-4" />
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
