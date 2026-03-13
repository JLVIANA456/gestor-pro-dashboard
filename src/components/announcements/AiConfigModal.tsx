
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
import { toast } from "sonner";
import { Settings, Lock } from "lucide-react";

interface AiConfigModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AiConfigModal({ open, onOpenChange }: AiConfigModalProps) {
    const [apiKey, setApiKey] = useState("");

    useEffect(() => {
        if (open) {
            const savedKey = AiService.getApiKey() || "";
            setApiKey(savedKey);
        }
    }, [open]);

    const handleSave = () => {
        AiService.setApiKey(apiKey);
        toast.success("Chave API salva com sucesso!");
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md bg-card border-border rounded-3xl p-0 overflow-hidden shadow-elevated">
                <div className="bg-primary/5 border-b border-primary/10 p-6 pb-5">
                    <DialogTitle className="text-xl font-light tracking-tight text-foreground flex items-center gap-2">
                        <Settings className="h-5 w-5 text-primary" />
                        Configurações da <span className="font-light text-primary">Inteligência Artificial</span>
                    </DialogTitle>
                    <p className="text-[10px] text-muted-foreground font-normal uppercase tracking-widest mt-1">Configure sua chave da OpenAI</p>
                </div>
                
                <div className="p-6 space-y-6">
                    <div className="space-y-4">
                        <div className="bg-amber-500/5 border border-amber-500/10 p-4 rounded-2xl flex gap-3">
                            <Lock className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                            <p className="text-[11px] text-amber-700 font-light leading-relaxed">
                                Sua chave é salva localmente no seu navegador e nunca é enviada para nossos servidores. 
                                Ela será usada apenas para chamadas diretas à API da OpenAI.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-normal text-muted-foreground uppercase tracking-widest pl-1">
                                OpenAI API Key
                            </Label>
                            <Input
                                type="password"
                                placeholder="sk-..."
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                className="h-11 rounded-xl border-border/50 bg-muted/20 text-sm font-light transition-all focus:border-primary/20"
                            />
                            <p className="text-[9px] text-muted-foreground px-1">
                                Você pode obter sua chave em <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">platform.openai.com</a>
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <Button 
                            variant="ghost" 
                            onClick={() => onOpenChange(false)}
                            className="rounded-xl font-light text-xs uppercase tracking-widest h-10 px-6"
                        >
                            Cancelar
                        </Button>
                        <Button 
                            onClick={handleSave}
                            className="rounded-xl shadow-lg shadow-primary/10 font-light text-xs uppercase tracking-widest h-10 px-6"
                        >
                            Salvar Configurações
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
