import { useState, useMemo } from 'react';
import { 
    Users, 
    Search, 
    LayoutDashboard, 
    ShieldCheck, 
    Key, 
    FileUp, 
    Globe, 
    Eye,
    MoreVertical,
    CheckCircle2,
    XCircle,
    Copy,
    ExternalLink,
    Filter,
    ChevronRight,
    Lock,
    Unlock,
    Activity,
    UploadCloud,
    Trash2,
    FileText,
    Clock,
    Settings
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useClients } from '@/hooks/useClients';
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription,
    DialogFooter 
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ClientPortal() {
    const { clients, loading } = useClients();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedClient, setSelectedClient] = useState<any>(null);
    const [isManageModalOpen, setIsManageModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'access' | 'files' | 'insights'>('access');

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
    };

    const handleTogglePortal = () => {
        toast.success(`${selectedClient?.nomeFantasia} agora tem acesso ao portal!`);
    };

    return (
        <div className="max-w-[1600px] mx-auto space-y-10 px-8 pb-12 animate-in fade-in duration-700">
            {/* Header Estratégico */}
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between pt-8">
                <div>
                    <h1 className="text-4xl font-extralight tracking-tight text-foreground">
                        Portal do <span className="text-primary font-normal">Cliente</span>
                    </h1>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mt-2 opacity-70">
                        Gestão de Acessos e Transparência de Dados
                    </p>
                </div>

                <div className="flex gap-4">
                    <Card className="bg-primary/5 border-primary/20 p-4 rounded-2xl flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <Activity className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-muted-foreground/60">Acessos Hoje</p>
                            <p className="text-xl font-bold">24 Clientes</p>
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
                                    placeholder="Nome, Fantasia ou CNPJ..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="h-12 pl-12 rounded-2xl border-border/30 bg-muted/20 text-sm font-light focus:border-primary/30"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="h-12 px-6 rounded-2xl border-border/30 text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
                                    Total: {filteredClients.length} Clientes
                                </Badge>
                            </div>
                        </div>
                    </CardHeader>
                    
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-muted/5">
                                <TableRow className="hover:bg-transparent border-border/10">
                                    <TableHead className="w-[350px] px-8 text-[11px] uppercase font-bold tracking-widest text-muted-foreground/60">Empresa</TableHead>
                                    <TableHead className="text-[11px] uppercase font-bold tracking-widest text-muted-foreground/60">Regime</TableHead>
                                    <TableHead className="text-[11px] uppercase font-bold tracking-widest text-muted-foreground/60">Status Portal</TableHead>
                                    <TableHead className="text-[11px] uppercase font-bold tracking-widest text-muted-foreground/60">Último Acesso</TableHead>
                                    <TableHead className="text-right px-8 text-[11px] uppercase font-bold tracking-widest text-muted-foreground/60">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredClients.map((client) => (
                                    <TableRow key={client.id} className="hover:bg-primary/[0.02] border-border/10 transition-colors group">
                                        <TableCell className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-xl bg-muted/20 flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                    <Globe className="h-5 w-5" />
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-sm font-bold text-foreground truncate">{client.nomeFantasia || client.razaoSocial}</span>
                                                    <span className="text-[10px] text-muted-foreground/60 font-medium">{client.cnpj}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="bg-muted/10 text-[10px] font-bold uppercase tracking-tighter rounded-lg border-none">
                                                {client.regimeTributario}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className={cn("h-2 w-2 rounded-full", client.isActive ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "bg-muted")} />
                                                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                                                    {client.isActive ? "Ativo" : "Inativo"}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-xs font-light text-muted-foreground/60">-- / -- / --</span>
                                        </TableCell>
                                        <TableCell className="text-right px-8">
                                            <Button 
                                                variant="outline" 
                                                size="sm"
                                                onClick={() => handleOpenManage(client)}
                                                className="rounded-xl text-[10px] uppercase font-bold tracking-widest h-10 px-6 hover:bg-primary/5 border-border/40 text-muted-foreground gap-2 group-hover:border-primary/20 group-hover:text-primary"
                                            >
                                                <Settings className="h-4 w-4" /> Gerenciar
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            {/* Modal de Gerenciamento do Portal do Cliente */}
            <Dialog open={isManageModalOpen} onOpenChange={setIsManageModalOpen}>
                <DialogContent className="max-w-6xl w-[95vw] bg-card border-none rounded-[3rem] p-0 overflow-hidden shadow-elevated z-[9999] animate-in fade-in zoom-in duration-300">
                    <div className="flex h-[80vh]">
                        {/* Sidebar do Modal */}
                        <div className="w-80 border-r border-border/20 bg-muted/5 p-8 flex flex-col gap-8">
                            <div className="space-y-2">
                                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4 shadow-xl shadow-primary/5">
                                    <Globe className="h-8 w-8" />
                                </div>
                                <h2 className="text-xl font-black text-foreground leading-tight">{selectedClient?.nomeFantasia}</h2>
                                <p className="text-[10px] font-black uppercase text-muted-foreground/40 tracking-widest">{selectedClient?.cnpj}</p>
                            </div>

                            <div className="flex flex-col gap-2 mt-4">
                                <Button 
                                    variant="ghost" 
                                    onClick={() => setActiveTab('access')}
                                    className={cn(
                                        "justify-start h-12 rounded-2xl px-6 text-[11px] uppercase font-bold tracking-widest transition-all",
                                        activeTab === 'access' ? "bg-primary text-white shadow-xl shadow-primary/20" : "text-muted-foreground hover:bg-primary/5 hover:text-primary"
                                    )}
                                >
                                    <Key className="h-4 w-4 mr-3" /> Acesso ao Portal
                                </Button>
                                <Button 
                                    variant="ghost" 
                                    onClick={() => setActiveTab('files')}
                                    className={cn(
                                        "justify-start h-12 rounded-2xl px-6 text-[11px] uppercase font-bold tracking-widest transition-all",
                                        activeTab === 'files' ? "bg-primary text-white shadow-xl shadow-primary/20" : "text-muted-foreground hover:bg-primary/5 hover:text-primary"
                                    )}
                                >
                                    <FileUp className="h-4 w-4 mr-3" /> Repositório
                                </Button>
                                <Button 
                                    variant="ghost" 
                                    onClick={() => setActiveTab('insights')}
                                    className={cn(
                                        "justify-start h-12 rounded-2xl px-6 text-[11px] uppercase font-bold tracking-widest transition-all",
                                        activeTab === 'insights' ? "bg-primary text-white shadow-xl shadow-primary/20" : "text-muted-foreground hover:bg-primary/5 hover:text-primary"
                                    )}
                                >
                                    <Activity className="h-4 w-4 mr-3" /> Saúde Financeira
                                </Button>
                            </div>

                            <div className="mt-auto space-y-4">
                                <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 space-y-2">
                                    <p className="text-[10px] font-black uppercase text-primary/60 tracking-wider">Modo do Cliente</p>
                                    <Button className="w-full h-10 rounded-xl bg-primary text-white text-[10px] font-bold uppercase tracking-widest gap-2">
                                        <Eye className="h-4 w-4" /> Visualizar como Cliente
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Conteúdo Principal do Modal */}
                        <div className="flex-1 flex flex-col overflow-hidden bg-card">
                            <Tabs value={activeTab} className="h-full flex flex-col">
                                <TabsContent value="access" className="flex-1 p-10 space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-2xl font-extralight text-foreground">Gestão de <span className="font-semibold">Credenciais</span></h3>
                                            <p className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-1">Defina como o cliente acessará o portal</p>
                                        </div>
                                        <Badge className="bg-emerald-500/10 text-emerald-600 border-none rounded-lg px-3 py-1 text-[10px] uppercase font-black">
                                            Acesso Habilitado
                                        </Badge>
                                    </div>

                                    <div className="grid grid-cols-2 gap-8">
                                        <Card className="border-border/40 rounded-[2rem] p-8 space-y-6 bg-muted/5 shadow-sm">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                                    <Key className="h-6 w-6" />
                                                </div>
                                                <span className="text-sm font-black uppercase tracking-widest text-foreground/80">Configurar Senha</span>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] ml-1">E-mail de Acesso</label>
                                                    <Input defaultValue={selectedClient?.email} className="h-12 rounded-xl bg-white border-border/30 font-medium" />
                                                </div>
                                                <div className="space-y-2 relative">
                                                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] ml-1">Senha Temporária</label>
                                                    <Input type="password" value="********" className="h-12 rounded-xl bg-white border-border/30 font-medium" />
                                                    <Button variant="ghost" size="icon" className="absolute right-2 bottom-1 h-10 w-10 text-muted-foreground/40 hover:text-primary">
                                                        <Unlock className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                                <Button className="w-full h-12 rounded-2xl bg-primary text-white font-bold uppercase tracking-widest shadow-lg shadow-primary/20">
                                                    Salvar Acesso
                                                </Button>
                                            </div>
                                        </Card>

                                        <Card className="border-border/40 rounded-[2rem] p-8 space-y-6 bg-primary/[0.02] border-dashed border-primary/20 flex flex-col justify-center items-center text-center">
                                            <div className="h-16 w-16 rounded-full bg-primary/5 flex items-center justify-center text-primary mb-2">
                                                <Copy className="h-8 w-8" />
                                            </div>
                                            <h4 className="text-lg font-bold">Link de Convite</h4>
                                            <p className="text-xs text-muted-foreground font-light max-w-[200px]">Envie um link para que o cliente defina a própria senha no primeiro acesso.</p>
                                            <Button variant="outline" className="rounded-xl border-primary/20 text-primary uppercase font-black tracking-widest text-[10px] px-8 h-12 hover:bg-primary/5">
                                                Copiar Link Mágico
                                            </Button>
                                        </Card>
                                    </div>
                                </TabsContent>

                                <TabsContent value="files" className="flex-1 flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500">
                                    <div className="p-10 border-b border-border/10 bg-muted/5">
                                        <div className="flex items-center justify-between mb-8">
                                            <div>
                                                <h3 className="text-2xl font-extralight text-foreground">Repositório de <span className="font-semibold">Documentos</span></h3>
                                                <p className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-1">Arquivos visíveis para o cliente no portal</p>
                                            </div>
                                            <Button className="h-12 px-8 rounded-2xl gap-3 text-[11px] uppercase font-black tracking-wider bg-primary text-white shadow-xl shadow-primary/20">
                                                <UploadCloud className="h-4 w-4" /> Subir Novo Arquivo
                                            </Button>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <Badge className="bg-primary/10 text-primary border-none rounded-lg px-4 py-2 text-[10px] font-black uppercase tracking-widest">
                                                12 Guias de Impostos
                                            </Badge>
                                            <Badge className="bg-muted text-muted-foreground border-none rounded-lg px-4 py-2 text-[10px] font-black uppercase tracking-widest">
                                                5 Contratos/Documentos
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-10">
                                        <div className="space-y-3">
                                            {[1,2,3].map(i => (
                                                <div key={i} className="flex items-center justify-between p-5 rounded-[1.5rem] bg-card border border-border/10 hover:border-primary/20 transition-all group">
                                                    <div className="flex items-center gap-5">
                                                        <div className="h-12 w-12 rounded-xl bg-muted/20 flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                            <FileText className="h-6 w-6" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-bold text-foreground">Guia de DAS - Competência 02/2026</span>
                                                            <div className="flex items-center gap-3 mt-1">
                                                                <span className="text-[10px] text-muted-foreground flex items-center gap-1 uppercase font-bold tracking-tighter">
                                                                    <Clock className="h-3 w-3" /> Enviado em 14/03/2026
                                                                </span>
                                                                <span className="text-[10px] text-emerald-500 flex items-center gap-1 uppercase font-bold tracking-tighter">
                                                                    <CheckCircle2 className="h-3 w-3" /> Lido pelo Cliente
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-primary rounded-xl">
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-destructive rounded-xl">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="insights" className="flex-1 p-10 space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-2xl font-extralight text-foreground text-amber-600">Saúde <span className="font-semibold">Financeira</span></h3>
                                            <p className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-1">Gráficos de transparência para o empresário</p>
                                        </div>
                                        <Badge className="bg-amber-100 text-amber-700 border-none rounded-lg px-3 py-1 text-[10px] uppercase font-black">
                                            Beta Privado
                                        </Badge>
                                    </div>

                                    <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-6">
                                        <div className="h-24 w-24 rounded-full bg-muted/10 flex items-center justify-center text-muted-foreground/20 italic text-4xl">
                                            <LayoutDashboard className="h-12 w-12" />
                                        </div>
                                        <div className="max-w-md space-y-2">
                                            <p className="text-lg font-bold text-foreground/80">Dashboard de Transparência</p>
                                            <p className="text-sm text-muted-foreground font-light px-4">Esta funcionalidade permitirá que seu cliente visualize gráficos de faturamento e impostos gerados automaticamente através do seu fechamento contábil.</p>
                                        </div>
                                        <Button variant="outline" className="rounded-xl border-border/40 text-[10px] uppercase font-black tracking-widest px-8 h-12">
                                            Habilitar para este Cliente
                                        </Button>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
