
import { useState, useEffect } from "react";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AiService } from "@/services/aiService";
import { BrandingService, EmailBranding } from "@/services/brandingService";
import { toast } from "sonner";
import { Settings, Lock, Palette, Mail } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AiConfigModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AiConfigModal({ open, onOpenChange }: AiConfigModalProps) {
    const [apiKey, setApiKey] = useState("");
    const [branding, setBranding] = useState<EmailBranding>(BrandingService.getBranding());

    useEffect(() => {
        if (open) {
            const savedKey = AiService.getApiKey() || "";
            setApiKey(savedKey);
            setBranding(BrandingService.getBranding());
        }
    }, [open]);

    const handleSave = () => {
        AiService.setApiKey(apiKey);
        BrandingService.saveBranding(branding);
        toast.success("Configurações salvas com sucesso!");
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl bg-card border-border rounded-[2.5rem] p-0 overflow-hidden shadow-elevated">
                <div className="bg-primary/5 border-b border-primary/10 p-8 pb-6">
                    <DialogTitle className="text-2xl font-light tracking-tight text-foreground flex items-center gap-3">
                        <Settings className="h-6 w-6 text-primary" />
                        Painel de <span className="font-light text-primary">Configurações</span>
                    </DialogTitle>
                    <p className="text-[10px] text-muted-foreground font-normal uppercase tracking-widest mt-1">Personalize sua IA e Identidade Visual</p>
                </div>
                
                <Tabs defaultValue="ai" className="w-full">
                    <div className="px-8 pt-4">
                        <TabsList className="bg-muted/30 p-1 rounded-xl w-full grid grid-cols-2 h-12">
                            <TabsTrigger value="ai" className="rounded-lg gap-2 text-[10px] uppercase tracking-widest font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                <Lock className="h-3 w-3" /> Inteligência Artificial
                            </TabsTrigger>
                            <TabsTrigger value="branding" className="rounded-lg gap-2 text-[10px] uppercase tracking-widest font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                <Palette className="h-3 w-3" /> Identidade Visual
                            </TabsTrigger>
                            <TabsTrigger value="sending" className="rounded-lg gap-2 text-[10px] uppercase tracking-widest font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                <Mail className="h-3 w-3" /> Configurações de Envio
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <div className="p-8 space-y-6 min-h-[400px]">
                        <TabsContent value="ai" className="space-y-6 mt-0">
                            <div className="bg-amber-500/5 border border-amber-500/10 p-5 rounded-2xl flex gap-4">
                                <Lock className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <p className="text-xs text-amber-900 font-medium">Segurança da Chave API</p>
                                    <p className="text-[11px] text-amber-700 font-light leading-relaxed">
                                        Sua chave é salva localmente no seu navegador. 
                                        Ela é usada apenas para as funções de Refinar Texto, Gerar Assunto e Resumir Documentos.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-[10px] font-normal text-muted-foreground uppercase tracking-widest pl-1">
                                    OpenAI API Key
                                </Label>
                                <Input
                                    type="password"
                                    placeholder="sk-..."
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    className="h-12 rounded-xl border-border/50 bg-muted/20 text-sm font-light transition-all focus:border-primary/20"
                                />
                                <p className="text-[9px] text-muted-foreground px-1">
                                    Obtenha sua chave em <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">platform.openai.com</a>
                                </p>
                            </div>
                        </TabsContent>

                        <TabsContent value="branding" className="space-y-6 mt-0">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-normal text-muted-foreground uppercase tracking-widest pl-1">
                                        Cor Principal (Botões/Links)
                                    </Label>
                                    <div className="flex gap-2">
                                        <Input
                                            type="color"
                                            value={branding.primaryColor}
                                            onChange={(e) => setBranding({...branding, primaryColor: e.target.value})}
                                            className="h-12 w-20 p-1 rounded-xl border-border/50 bg-muted/20 cursor-pointer"
                                        />
                                        <Input
                                            type="text"
                                            value={branding.primaryColor}
                                            onChange={(e) => setBranding({...branding, primaryColor: e.target.value})}
                                            className="h-12 flex-1 rounded-xl border-border/50 bg-muted/20 text-sm font-mono uppercase"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-[10px] font-normal text-muted-foreground uppercase tracking-widest pl-1">
                                        Nome da Empresa (Rodapé)
                                    </Label>
                                    <Input
                                        placeholder="Ex: JLVIANA Consultoria Contábil"
                                        value={branding.companyName}
                                        onChange={(e) => setBranding({...branding, companyName: e.target.value})}
                                        className="h-12 rounded-xl border-border/50 bg-muted/20 text-sm font-light"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-[10px] font-normal text-muted-foreground uppercase tracking-widest pl-1">
                                    Título do Cabeçalho (Padrão)
                                </Label>
                                <Input
                                    placeholder="Ex: Comunicado Oficial"
                                    value={branding.headerTitle}
                                    onChange={(e) => setBranding({...branding, headerTitle: e.target.value})}
                                    className="h-12 rounded-xl border-border/50 bg-muted/20 text-sm font-light"
                                />
                            </div>

                            <div className="space-y-3">
                                <Label className="text-[10px] font-normal text-muted-foreground uppercase tracking-widest pl-1">
                                    Texto do Rodapé
                                </Label>
                                <Input
                                    placeholder="Texto informativo que vai no final do e-mail..."
                                    value={branding.footerText}
                                    onChange={(e) => setBranding({...branding, footerText: e.target.value})}
                                    className="h-12 rounded-xl border-border/50 bg-muted/20 text-sm font-light"
                                />
                            </div>

                            <div className="p-4 rounded-2xl border border-border/50 bg-muted/5 space-y-2">
                                <p className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground">Preview do Botão</p>
                                <div className="flex justify-center py-2">
                                    <div 
                                        style={{ backgroundColor: branding.primaryColor }}
                                        className="px-6 py-2.5 rounded-xl text-white text-xs font-bold shadow-lg"
                                    >
                                        ACESSAR DOCUMENTO
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="sending" className="space-y-6 mt-0">
                            <div className="space-y-3">
                                <Label className="text-[10px] font-normal text-muted-foreground uppercase tracking-widest pl-1">
                                    Texto do Botão de Acesso
                                </Label>
                                <Input
                                    placeholder="Ex: Acessar Documento, Baixar Guia..."
                                    value={branding.buttonText}
                                    onChange={(e) => setBranding({...branding, buttonText: e.target.value})}
                                    className="h-12 rounded-xl border-border/50 bg-muted/20 text-sm font-light"
                                />
                                <p className="text-[9px] text-muted-foreground px-1 italic">
                                    Mude o texto que aparece dentro do botão de anexo no e-mail.
                                </p>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-[10px] font-normal text-muted-foreground uppercase tracking-widest pl-1">
                                    E-mail para Resposta (Reply-To)
                                </Label>
                                <Input
                                    type="email"
                                    placeholder="seu-setor@empresa.com"
                                    value={branding.replyToEmail}
                                    onChange={(e) => setBranding({...branding, replyToEmail: e.target.value})}
                                    className="h-12 rounded-xl border-border/50 bg-muted/20 text-sm font-light"
                                />
                                <p className="text-[9px] text-muted-foreground px-1">
                                    Quando o cliente clicar em "Responder", o e-mail irá para este endereço. 
                                    (Deixe vazio para usar o padrão).
                                </p>
                            </div>

                            <div className="p-5 rounded-2xl bg-primary/5 border border-primary/10 flex gap-4">
                                <Mail className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <p className="text-xs text-primary font-medium">Controle de Fluxo</p>
                                    <p className="text-[11px] text-slate-600 font-light leading-relaxed">
                                        Estas configurações garantem que a comunicação seja direcionada ao setor correto do seu escritório contábil.
                                    </p>
                                </div>
                            </div>
                        </TabsContent>
                    </div>
                </Tabs>

                <div className="p-8 border-t border-border/40 flex justify-end gap-3">
                    <Button 
                        variant="ghost" 
                        onClick={() => onOpenChange(false)}
                        className="rounded-xl font-light text-xs uppercase tracking-widest h-11 px-8"
                    >
                        Cancelar
                    </Button>
                    <Button 
                        onClick={handleSave}
                        className="rounded-xl shadow-lg shadow-primary/10 font-bold text-xs uppercase tracking-widest h-11 px-8"
                    >
                        Salvar Todas as Configurações
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
