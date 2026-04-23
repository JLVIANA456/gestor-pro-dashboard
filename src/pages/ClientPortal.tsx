import { useState, useMemo } from 'react';
import { 
    Search, 
    ShieldCheck, 
    Copy,
    ExternalLink,
    Lock,
    Link2,
    RefreshCw,
    InboxIcon,
    CheckCircle2,
    Clock,
    Globe,
    Settings
} from 'lucide-react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useClients } from '@/hooks/useClients';
import { useClientPortal } from '@/hooks/useClientPortal';
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { 
    Dialog, 
    DialogContent 
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function ClientPortal() {
    const { clients } = useClients();
    const { generatePublicLink } = useClientPortal();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedClient, setSelectedClient] = useState<any>(null);
    const [isManageModalOpen, setIsManageModalOpen] = useState(false);

    // Link de Envio ao Cliente
    const [generatingLink, setGeneratingLink] = useState(false);
    const [generatedLink, setGeneratedLink] = useState<string | null>(null);
    const [linkDays, setLinkDays] = useState(7);

    const filteredClients = useMemo(() => {
        return clients.filter(c => 
            c.nomeFantasia?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.razaoSocial?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.cnpj.includes(searchQuery)
        ).sort((a, b) => (a.nomeFantasia || a.razaoSocial).localeCompare(b.nomeFantasia || b.razaoSocial));
    }, [clients, searchQuery]);

    const handleOpenManage = (client: any) => {
        setSelectedClient(client);
        setIsManageModalOpen(true);
        setGeneratedLink(null);
    };

    const handleGenerateLink = async () => {
        if (!selectedClient) return;
        setGeneratingLink(true);
        try {
            const link = await generatePublicLink(selectedClient.id, linkDays);
            setGeneratedLink(link);
        } catch {
            // erro já tratado no hook
        } finally {
            setGeneratingLink(false);
        }
    };

    const handleCopyLink = async () => {
        if (!generatedLink) return;
        try {
            await navigator.clipboard.writeText(generatedLink);
            toast.success('Link copiado!', { description: 'Envie pelo WhatsApp ou E-mail para o cliente.' });
        } catch {
            toast.error('Não foi possível copiar. Copie manualmente o link.');
        }
    };

    const handleCopyWhatsApp = () => {
        if (!generatedLink) return;
        const expirationMsg = linkDays === 0 ? "_Este é um link permanente._" : `_Este link expira em ${linkDays} dias._`;
        const msg = `Olá! Para nos enviar seus documentos, clique no link seguro abaixo:\n\n${generatedLink}\n\n${expirationMsg}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
    };

    return (
        <div className="max-w-[1600px] mx-auto space-y-10 px-8 pb-12 animate-in fade-in duration-700">
            {/* Header Estratégico */}
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between pt-8">
                <div>
                    <h1 className="text-4xl font-extralight tracking-tight text-foreground">
                        Links de <span className="text-primary font-normal">Envio</span>
                    </h1>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mt-2 opacity-70">
                        Geração de Links de Envio ao Cliente · Upload Seguro sem Senha
                    </p>
                </div>

                <div className="flex gap-4">
                    <Card className="bg-primary/5 border-primary/20 p-4 rounded-2xl flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <InboxIcon className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-muted-foreground/60">Clientes Habilitados</p>
                            <p className="text-xl font-bold">{clients.length}</p>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Central Hub: Lista de Clientes */}
            <div className="grid grid-cols-1 gap-8">
                <Card className="bg-card/40 backdrop-blur-xl border-border/40 rounded-[2.5rem] shadow-sm overflow-hidden border">
                    <CardHeader className="p-8 border-b border-border/10">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                                <Input 
                                    placeholder="Buscar por Empresa ou CNPJ..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="h-12 pl-12 rounded-2xl border-border/30 bg-muted/20 text-sm font-light focus:border-primary/30"
                                />
                            </div>
                        </div>
                    </CardHeader>
                    
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-muted/5">
                                <TableRow className="hover:bg-transparent border-border/10">
                                    <TableHead className="px-8 text-[11px] uppercase font-bold tracking-widest text-muted-foreground/60">Empresa</TableHead>
                                    <TableHead className="text-[11px] uppercase font-bold tracking-widest text-muted-foreground/60 text-center">Status Portal</TableHead>
                                    <TableHead className="text-right px-8 text-[11px] uppercase font-bold tracking-widest text-muted-foreground/60">Ação</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredClients.map((client) => (
                                    <TableRow key={client.id} className="hover:bg-primary/[0.02] border-border/10 transition-colors group">
                                        <TableCell className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-xl bg-muted/20 flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                    <Globe className="h-5 w-5" />
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-sm font-bold text-foreground truncate">{client.nomeFantasia || client.razaoSocial}</span>
                                                    <span className="text-[10px] text-muted-foreground/60 font-medium tracking-tight">{client.cnpj}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="outline" className={cn(
                                                "h-7 px-4 rounded-lg text-[9px] uppercase font-black tracking-widest border-none",
                                                client.isActive ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
                                            )}>
                                                {client.isActive ? "Ativado" : "Aguardando"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right px-8">
                                            <Button 
                                                onClick={() => handleOpenManage(client)}
                                                className="rounded-xl text-[10px] uppercase font-black tracking-widest h-11 px-6 bg-primary text-white shadow-lg shadow-primary/20 hover:scale-105 transition-all gap-2"
                                            >
                                                <Link2 className="h-4 w-4" /> Gerar Link
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            {/* NOVO Modal de Link de Envio ao Cliente - UI Premium e Focada */}
            <Dialog open={isManageModalOpen} onOpenChange={setIsManageModalOpen}>
                <DialogContent className="max-w-2xl w-[95vw] bg-white border-none rounded-[3rem] p-0 overflow-hidden shadow-2xl z-[9999] animate-in fade-in zoom-in duration-500">
                    <div className="flex flex-col">
                        {/* Header Moderno */}
                        <div className="bg-slate-50/50 p-10 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <div className="h-16 w-16 rounded-[2rem] bg-primary text-white flex items-center justify-center shadow-xl shadow-primary/20 transition-transform hover:scale-110 duration-500">
                                    <Link2 className="h-8 w-8" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-slate-800 tracking-tighter">Link de <span className="text-primary">Envio ao Cliente</span></h2>
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] mt-1 italic">
                                        {selectedClient?.nomeFantasia || selectedClient?.razaoSocial}
                                    </p>
                                </div>
                            </div>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => setIsManageModalOpen(false)}
                                className="rounded-2xl h-11 w-11 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                            >
                                <Lock className="h-5 w-5" />
                            </Button>
                        </div>

                        {/* Conteúdo Central */}
                        <div className="p-12 space-y-10">
                            {!generatedLink ? (
                                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-[11px] font-black uppercase text-slate-400 tracking-[0.4em]">Configurar Validade</h3>
                                            <Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-[9px] px-3 py-1">ACESSO SEGURO</Badge>
                                        </div>

                                        <div className="grid grid-cols-6 gap-2">
                                            {[3, 7, 15, 30, 60, 0].map(d => (
                                                <button
                                                    key={d}
                                                    onClick={() => setLinkDays(d)}
                                                    className={cn(
                                                        "h-16 rounded-2xl text-[12px] font-black transition-all border-2",
                                                        linkDays === d 
                                                            ? "bg-primary text-white border-primary shadow-xl shadow-primary/20 scale-105" 
                                                            : "bg-white text-slate-400 border-slate-100 hover:border-primary/20 hover:text-primary"
                                                    )}
                                                >
                                                    {d === 0 ? "INFINITO" : `${d}d`}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="bg-slate-50 rounded-[2.5rem] p-8 border border-slate-100/50 flex items-start gap-5">
                                            <div className="h-12 w-12 shrink-0 rounded-2xl bg-white shadow-sm flex items-center justify-center text-primary">
                                                <ShieldCheck className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-slate-700 uppercase tracking-tight">Privacidade & Praticidade</p>
                                                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed font-bold uppercase tracking-tight opacity-70">
                                                    O cliente poderá enviar arquivos diretamente. O link expira automaticamente e não exige senha de acesso.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <Button 
                                        onClick={handleGenerateLink}
                                        disabled={generatingLink}
                                        className="w-full h-20 rounded-[2.5rem] bg-primary text-white font-black uppercase tracking-[0.2em] text-[13px] gap-4 shadow-2xl shadow-primary/30 hover:scale-[1.01] active:scale-95 transition-all"
                                    >
                                        {generatingLink ? (
                                            <><RefreshCw className="h-6 w-6 animate-spin" /> Criando Acesso Seguro...</>
                                        ) : (
                                            <><Link2 className="h-6 w-6" /> Gerar Link de Upload</>
                                        )}
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-10 animate-in zoom-in-95 duration-500">
                                    <div className="p-10 rounded-[3rem] bg-emerald-50 border-2 border-emerald-100/50 space-y-8 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="h-20 w-20 rounded-full bg-white shadow-xl shadow-emerald-500/10 flex items-center justify-center text-emerald-500">
                                                <CheckCircle2 className="h-10 w-10 animate-bounce" />
                                            </div>
                                            <h4 className="text-2xl font-black text-emerald-800 uppercase tracking-tighter">Link Pronto!</h4>
                                        </div>

                                        <div className="relative group">
                                            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-[2rem] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                                            <div className="relative p-8 bg-white rounded-[1.5rem] border border-emerald-100 font-mono text-[11px] text-emerald-700 break-all select-all shadow-inner">
                                                {generatedLink}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600/60">
                                            <Clock className="h-4 w-4" /> {linkDays === 0 ? "Link Permanente" : `Expira em: ${formatDate(new Date(Date.now() + linkDays * 86400000))}`}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-5">
                                        <Button 
                                            onClick={handleCopyLink}
                                            variant="outline"
                                            className="h-20 rounded-[2rem] border-slate-100 text-[11px] font-black uppercase tracking-widest gap-3 hover:bg-primary/5 hover:border-primary/20 hover:text-primary transition-all group"
                                        >
                                            <Copy className="h-6 w-6 group-hover:scale-110 transition-transform" /> Copiar Link
                                        </Button>
                                        <Button 
                                            onClick={handleCopyWhatsApp}
                                            className="h-20 rounded-[2rem] bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-black uppercase tracking-widest gap-3 shadow-2xl shadow-emerald-500/20 active:scale-95 transition-all group"
                                        >
                                            <ExternalLink className="h-6 w-6 group-hover:scale-110 transition-transform" /> Enviar WhatsApp
                                        </Button>
                                    </div>

                                    <button 
                                        onClick={() => setGeneratedLink(null)}
                                        className="w-full text-[10px] text-slate-300 uppercase font-black tracking-widest hover:text-primary transition-all py-2"
                                    >
                                        Clique aqui para gerar outro link
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Footer Elegante */}
                        <div className="bg-slate-50/80 p-8 flex justify-center border-t border-slate-100">
                             <div className="flex items-center gap-4 opacity-30">
                                <Settings className="h-4 w-4" />
                                <span className="text-[10px] font-black uppercase tracking-[0.4em]">Configuração de Portal Ativa</span>
                             </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
