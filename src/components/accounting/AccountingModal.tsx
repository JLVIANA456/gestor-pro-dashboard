import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useAccounting } from '@/hooks/useAccounting';
import { Client } from '@/hooks/useClients';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

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
}

export function AccountingModal({ client, isOpen, onClose }: AccountingModalProps) {
    const { createClosing } = useAccounting();

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

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        if (!client) return;

        try {
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
            onClose();
            form.reset();
        } catch (error) {
            // Error handled in hook
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[700px] overflow-y-auto max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>Fechamento Contábil - {client?.razaoSocial}</DialogTitle>
                    <DialogDescription>
                        Registre o fechamento mensal e controles para este cliente.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="colaboradorResponsavel"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Colaborador Responsável (Departamento Contábil)</FormLabel>
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
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
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
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
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
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
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
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
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
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
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
                            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                            <Button type="submit">Salvar Fechamento</Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
