import { useState, useEffect } from 'react';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { 
    Mail,
    Palette,
    Layout,
    Type,
    Image as ImageIcon,
    Info,
    Save
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BrandingService, EmailBranding } from '@/services/brandingService';
import { AiService } from '@/services/aiService';
import { useObligations } from '@/hooks/useObligations';
import { toast } from 'sonner';
import { Trash2, Building2, Calendar } from 'lucide-react';

interface DeliveryTemplateModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function DeliveryTemplateModal({ open, onOpenChange }: DeliveryTemplateModalProps) {
    const [branding, setBranding] = useState<EmailBranding | null>(null);

    const { obligations: templates, createObligation: createTemplate, deleteObligation: deleteTemplate, loading: templatesLoading } = useObligations();
    const [newTemplate, setNewTemplate] = useState<{ regime: string, type: string, due_day: number, competency_rule: 'previous_month' | 'current_month' | 'quarterly' | 'annual' }>({ 
        regime: 'simples', 
        type: '', 
        due_day: 20,
        competency_rule: 'previous_month'
    });

    useEffect(() => {
        if (open) {
            setBranding(BrandingService.getBranding());
        }
    }, [open]);

    const handleSave = () => {
        if (branding) {
            BrandingService.setBranding(branding);
            toast.success('Configurações de e-mail salvas com sucesso!');
            onOpenChange(false);
        }
    };

    if (!branding) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] rounded-[2.5rem] p-10 bg-card border-none shadow-2xl">
                <DialogHeader>
                    <div className="flex items-center gap-4 mb-2">
                        <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center">
                            <Mail className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-light text-foreground uppercase tracking-tight">Personalizar E-mail</DialogTitle>
                            <DialogDescription className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mt-1">
                                Configure o assunto e corpo dos e-mails de entrega
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <Tabs defaultValue="content" className="mt-6">
                    <TabsList className="grid w-full grid-cols-3 rounded-xl h-12 bg-muted/20">
                        <TabsTrigger value="content" className="gap-2 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm text-[10px] uppercase font-bold tracking-widest">
                            <Mail className="h-3.5 w-3.5" /> E-mail
                        </TabsTrigger>
                        <TabsTrigger value="obligations" className="gap-2 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm text-[10px] uppercase font-bold tracking-widest">
                            <Building2 className="h-3.5 w-3.5" /> Obrigações
                        </TabsTrigger>
                        <TabsTrigger value="design" className="gap-2 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm text-[10px] uppercase font-bold tracking-widest">
                            <Palette className="h-3.5 w-3.5" /> Estilo
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="content" className="space-y-6 mt-6 outline-none">
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60 px-1">Assunto do E-mail</Label>
                            <Input 
                                value={branding.deliveryEmailSubject}
                                onChange={(e) => setBranding({ ...branding, deliveryEmailSubject: e.target.value })}
                                className="h-12 rounded-xl border-border/40 bg-muted/20 font-light"
                                placeholder="Ex: Guias de Pagamento: {{impostos}} - {{mes}}"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60 px-1">Corpo do E-mail (Texto Inicial)</Label>
                            <Textarea 
                                value={branding.deliveryEmailBody}
                                onChange={(e) => setBranding({ ...branding, deliveryEmailBody: e.target.value })}
                                className="min-h-[120px] rounded-xl border-border/40 bg-muted/20 font-light p-4 resize-none"
                                placeholder="Olá, {{cliente}}! ..."
                            />
                        </div>

                        <div className="bg-muted/30 p-5 rounded-2xl border border-border/10">
                            <h4 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-foreground mb-3">
                                <Info className="h-3 w-3 text-primary" /> Variáveis Disponíveis
                            </h4>
                            <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                                <div className="flex items-center justify-between text-[11px] font-mono bg-card px-2 py-1 rounded border border-border/20">
                                    <span className="text-primary">{"{{cliente}}"}</span>
                                    <span className="text-muted-foreground opacity-60">Nome do Cliente</span>
                                </div>
                                <div className="flex items-center justify-between text-[11px] font-mono bg-card px-2 py-1 rounded border border-border/20">
                                    <span className="text-primary">{"{{mes}}"}</span>
                                    <span className="text-muted-foreground opacity-60">Mês de Referência</span>
                                </div>
                                <div className="flex items-center justify-between text-[11px] font-mono bg-card px-2 py-1 rounded border border-border/20">
                                    <span className="text-primary">{"{{impostos}}"}</span>
                                    <span className="text-muted-foreground opacity-60">Lista de Impostos</span>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="obligations" className="space-y-6 mt-6 outline-none">
                        <div className="bg-muted/10 p-6 rounded-2xl border border-border/10">
                            <h4 className="text-[10px] uppercase font-bold tracking-widest text-foreground mb-4">Nova Obrigação Recorrente</h4>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-[9px] uppercase font-bold text-muted-foreground/60 px-1">Regime</Label>
                                    <select 
                                        value={newTemplate.regime}
                                        onChange={(e) => setNewTemplate(prev => ({ ...prev, regime: e.target.value }))}
                                        className="w-full h-10 rounded-lg border border-border/40 bg-card px-3 text-xs font-light outline-none focus:ring-2 focus:ring-primary/20"
                                    >
                                        <option value="simples">Simples Nacional</option>
                                        <option value="presumido">Lucro Presumido</option>
                                        <option value="real">Lucro Real</option>
                                        <option value="domestico">Doméstico</option>
                                        <option value="employees">Folha/Funcionários</option>
                                        <option value="service_taker">Tomador de Serviços</option>
                                        <option value="all">Todos</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[9px] uppercase font-bold text-muted-foreground/60 px-1">Imposto</Label>
                                    <Input 
                                        value={newTemplate.type}
                                        onChange={(e) => setNewTemplate(prev => ({ ...prev, type: e.target.value }))}
                                        placeholder="Ex: DAS"
                                        className="h-10 text-xs"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[9px] uppercase font-bold text-muted-foreground/60 px-1">Vencimento (Dia)</Label>
                                    <Input 
                                        type="number"
                                        value={newTemplate.due_day}
                                        min={1}
                                        max={31}
                                        onChange={(e) => setNewTemplate(prev => ({ ...prev, due_day: parseInt(e.target.value) }))}
                                        className="h-10 text-xs"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-3 mt-3">
                                <div className="space-y-1.5">
                                    <Label className="text-[9px] uppercase font-bold text-muted-foreground/60 px-1">Competência</Label>
                                    <select 
                                        value={newTemplate.competency_rule}
                                        onChange={(e) => setNewTemplate(prev => ({ ...prev, competency_rule: e.target.value as any }))}
                                        className="w-full h-10 rounded-lg border border-border/40 bg-card px-3 text-xs font-light outline-none focus:ring-2 focus:ring-primary/20"
                                    >
                                        <option value="previous_month">Mês Anterior (Ex: Folha, FGTS, DAS)</option>
                                        <option value="current_month">Mês Atual (Ex: Alguns ISS e Taxas)</option>
                                        <option value="quarterly">Trimestral (Ex: IRPJ/CSLL Presumido)</option>
                                        <option value="annual">Anual (Ex: DIRF, Balanço)</option>
                                    </select>
                                </div>
                            </div>
                            <Button 
                                onClick={async () => {
                                    if (!newTemplate.type) return toast.error('Informe o imposto');
                                    await createTemplate({
                                        name: newTemplate.type,
                                        type: 'guia', // valor fixo para o atalho nas configurações de entrega
                                        department: 'Fiscal', // valor padrão para entrega
                                        default_due_day: newTemplate.due_day,
                                        is_user_editable: true,
                                        alert_days: [10, 5, 2],
                                        alert_recipient_email: 'fiscal@jlviana.com.br',
                                        periodicity: 'mensal',
                                        is_active: true,
                                        internal_note: 'Criado via Atalho de Email',
                                        competency: null,
                                        due_rule: 'dia fixo',
                                        anticipate_on_weekend: true,
                                        tax_regimes: [newTemplate.regime],
                                        competency_rule: newTemplate.competency_rule
                                    });
                                    setNewTemplate({ ...newTemplate, type: '' });
                                }}
                                className="w-full mt-4 h-10 rounded-xl text-[10px] uppercase font-bold tracking-widest gap-2"
                            >
                                <Save className="h-3.5 w-3.5" /> Adicionar Regra
                            </Button>
                        </div>

                        <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar space-y-3">
                            {templates.map(t => (
                                <div key={t.id} className="flex items-center justify-between p-4 bg-card border border-border/40 rounded-xl hover:border-primary/20 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="h-8 w-8 rounded-lg bg-primary/5 flex items-center justify-center">
                                            <Calendar className="h-4 w-4 text-primary opacity-60" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-foreground">{t.name}</span>
                                                <div className="flex gap-1 flex-wrap">
                                                    {t.tax_regimes?.map(reg => (
                                                        <Badge key={reg} variant="outline" className="text-[7px] h-4 uppercase tracking-tighter px-1.5">
                                                            {reg === 'employees' ? 'Funcionários' : 
                                                             reg === 'service_taker' ? 'Tomador' : reg}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                            <p className="text-[10px] text-muted-foreground flex items-center gap-2">
                                                Vencimento dia {t.default_due_day} 
                                                <span className="opacity-40">•</span>
                                                <span className="text-primary/60 font-medium">
                                                    {t.competency_rule === 'previous_month' ? 'Mês Anterior' : 
                                                     t.competency_rule === 'current_month' ? 'Mês Atual' :
                                                     t.competency_rule === 'quarterly' ? 'Trimestral' : 'Anual'}
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={() => deleteTemplate(t.id)}
                                        className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            ))}
                            {templates.length === 0 && (
                                <p className="text-center py-10 text-[11px] text-muted-foreground uppercase tracking-widest opacity-40">Nenhuma regra cadastrada</p>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="design" className="space-y-6 mt-6 outline-none max-h-[400px] overflow-y-auto px-1 pr-4 custom-scrollbar">
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60 px-1">Logo da Empresa</Label>
                            <div className="flex gap-3">
                                <div className="relative flex-1">
                                    <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                                    <Input 
                                        value={branding.logoUrl}
                                        onChange={(e) => setBranding({ ...branding, logoUrl: e.target.value })}
                                        className="h-12 rounded-xl border-border/40 bg-muted/20 font-light pl-11"
                                        placeholder="URL da logo ou faça upload"
                                    />
                                </div>
                                <div className="relative">
                                    <input 
                                        type="file" 
                                        id="logo-upload" 
                                        className="hidden" 
                                        accept="image/*"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            
                                            const loadingToast = toast.loading('Subindo logo...');
                                            try {
                                                const { publicUrl } = await AiService.uploadFile(file);
                                                setBranding({ ...branding, logoUrl: publicUrl });
                                                toast.success('Logo atualizada!', { id: loadingToast });
                                            } catch (err) {
                                                toast.error('Erro ao subir logo.', { id: loadingToast });
                                            }
                                        }}
                                    />
                                    <Button 
                                        type="button"
                                        variant="outline"
                                        className="h-12 w-12 rounded-xl p-0"
                                        onClick={() => document.getElementById('logo-upload')?.click()}
                                    >
                                        <Save className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60 px-1">Cor do Botão</Label>
                                <div className="flex gap-2">
                                    <Input 
                                        type="color"
                                        value={branding.buttonColor}
                                        onChange={(e) => setBranding({ ...branding, buttonColor: e.target.value })}
                                        className="h-12 w-16 p-1 rounded-xl border-border/40 bg-muted/20 cursor-pointer"
                                    />
                                    <Input 
                                        value={branding.buttonColor}
                                        onChange={(e) => setBranding({ ...branding, buttonColor: e.target.value })}
                                        className="h-12 flex-1 rounded-xl border-border/40 bg-muted/20 font-mono text-xs uppercase"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60 px-1">Cor do Texto no Botão</Label>
                                <div className="flex gap-2">
                                    <Input 
                                        type="color"
                                        value={branding.buttonTextColor}
                                        onChange={(e) => setBranding({ ...branding, buttonTextColor: e.target.value })}
                                        className="h-12 w-16 p-1 rounded-xl border-border/40 bg-muted/20 cursor-pointer"
                                    />
                                    <Input 
                                        value={branding.buttonTextColor}
                                        onChange={(e) => setBranding({ ...branding, buttonTextColor: e.target.value })}
                                        className="h-12 flex-1 rounded-xl border-border/40 bg-muted/20 font-mono text-xs uppercase"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60 px-1">Fundo do E-mail</Label>
                                <div className="flex gap-2">
                                    <Input 
                                        type="color"
                                        value={branding.backgroundColor}
                                        onChange={(e) => setBranding({ ...branding, backgroundColor: e.target.value })}
                                        className="h-12 w-16 p-1 rounded-xl border-border/40 bg-muted/20 cursor-pointer"
                                    />
                                    <Input 
                                        value={branding.backgroundColor}
                                        onChange={(e) => setBranding({ ...branding, backgroundColor: e.target.value })}
                                        className="h-12 flex-1 rounded-xl border-border/40 bg-muted/20 font-mono text-xs uppercase"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60 px-1">Fundo do Cartão</Label>
                                <div className="flex gap-2">
                                    <Input 
                                        type="color"
                                        value={branding.cardBackgroundColor}
                                        onChange={(e) => setBranding({ ...branding, cardBackgroundColor: e.target.value })}
                                        className="h-12 w-16 p-1 rounded-xl border-border/40 bg-muted/20 cursor-pointer"
                                    />
                                    <Input 
                                        value={branding.cardBackgroundColor}
                                        onChange={(e) => setBranding({ ...branding, cardBackgroundColor: e.target.value })}
                                        className="h-12 flex-1 rounded-xl border-border/40 bg-muted/20 font-mono text-xs uppercase"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60 px-1">Nome da Empresa</Label>
                            <div className="relative">
                                <Type className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                                <Input 
                                    value={branding.companyName}
                                    onChange={(e) => setBranding({ ...branding, companyName: e.target.value })}
                                    className="h-12 rounded-xl border-border/40 bg-muted/20 font-light pl-11"
                                    placeholder="Minha Contabilidade"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60 px-1">Texto do Rodapé</Label>
                            <Textarea 
                                value={branding.footerText}
                                onChange={(e) => setBranding({ ...branding, footerText: e.target.value })}
                                className="min-h-[60px] rounded-xl border-border/40 bg-muted/20 font-light p-4 resize-none"
                                placeholder="Este é um canal oficial..."
                            />
                        </div>
                    </TabsContent>
                </Tabs>

                <DialogFooter className="pt-8">
                    <Button 
                        variant="outline" 
                        onClick={() => onOpenChange(false)}
                        className="rounded-xl h-12 px-6 text-[10px] uppercase font-bold tracking-widest"
                    >
                        Cancelar
                    </Button>
                    <Button 
                        onClick={handleSave}
                        className="rounded-xl h-12 px-10 gap-2 text-[10px] uppercase font-bold tracking-widest shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90"
                    >
                        <Save className="h-4 w-4" /> Salvar Modelo
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
