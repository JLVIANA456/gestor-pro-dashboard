import { useState, useMemo } from 'react';
import { useClients } from '@/hooks/useClients';
import { supabase } from '@/integrations/supabase/client';
import { 
    Users, 
    Settings,
    Plus, 
    Search, 
    Link as LinkIcon,
    ShieldCheck,
    Mail,
    UserPlus,
    Building2,
    CheckCircle2,
    Calendar,
    Clock,
    ArrowRight
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from "@/components/ui/label";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription,
    DialogFooter 
} from "@/components/ui/dialog";
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function ClientPortalConfig() {
    const { clients, loading: clientsLoading } = useClients();
    
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isInviteSuccess, setIsInviteSuccess] = useState(false);
    const [generatedLink, setGeneratedLink] = useState('');
    const [modalSearchTerm, setModalSearchTerm] = useState('');
    
    const [newAccess, setNewAccess] = useState({
        clientId: '',
        email: ''
    });

    const filteredClients = useMemo(() => clients.filter(c => 
        c.razaoSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.nomeFantasia.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.cnpj.includes(searchTerm)
    ), [clients, searchTerm]);

    const modalFilteredClients = useMemo(() => clients.filter(c => 
        c.nomeFantasia.toLowerCase().includes(modalSearchTerm.toLowerCase()) ||
        c.razaoSocial.toLowerCase().includes(modalSearchTerm.toLowerCase()) ||
        c.cnpj.includes(modalSearchTerm)
    ), [clients, modalSearchTerm]);

    const handleCreateAccess = async () => {
        try {
            if (!newAccess.clientId || !newAccess.email) return;
            
            toast.loading("Gerando link de ativação...", { id: "access-creation" });
            
            const { data, error } = await (supabase.from('client_portal_invites') as any)
                .insert({
                    client_id: newAccess.clientId,
                    email: newAccess.email.trim().toLowerCase(),
                    is_used: false
                })
                .select()
                .single();

            if (error) throw error;
            
            const inviteUrl = `${window.location.origin}/ativar-portal/${data.token}`;
            setGeneratedLink(inviteUrl);
            setIsInviteSuccess(true);
            
            navigator.clipboard.writeText(inviteUrl);
            toast.success("Link gerado e copiado!", { id: "access-creation" });
            
        } catch (error: any) {
            console.error("Invite error:", error);
            toast.error("Erro ao gerar convite: " + error.message, { id: "access-creation" });
        }
    };

    const resetInviteModal = () => {
        setIsCreateModalOpen(false);
        setIsInviteSuccess(false);
        setGeneratedLink('');
        setModalSearchTerm('');
        setNewAccess({ clientId: '', email: '' });
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-1000 pb-20 p-6">
            {/* Header Section */}
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between pt-10 px-4">
                <div className="space-y-4">
                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 py-2 px-5 rounded-full text-[10px] uppercase font-bold tracking-[0.3em]">
                        <Settings className="h-3 w-3 mr-2" /> Central de Configuração do Portal
                    </Badge>
                    <h1 className="text-5xl font-extralight tracking-tight text-foreground leading-tight">
                        Gestão de <span className="text-primary font-normal">Acessos</span>
                    </h1>
                    <p className="text-xs font-medium text-muted-foreground uppercase opacity-60 tracking-[0.4em] max-w-lg leading-relaxed">
                        Configure permissões e gere convites de ativação para seus clientes.
                    </p>
                </div>

                <div className="flex bg-white/40 backdrop-blur-3xl border border-white/20 p-4 rounded-[40px] shadow-2xl shadow-primary/5">
                    <Button 
                        onClick={() => setIsCreateModalOpen(true)}
                        className="h-20 rounded-[30px] px-10 gap-5 bg-primary text-white shadow-2xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95 group overflow-hidden relative"
                    >
                        <UserPlus className="h-6 w-6" />
                        <div className="flex flex-col items-start gap-0.5">
                            <span className="text-sm font-bold uppercase tracking-widest">Criar Acesso</span>
                            <span className="text-[9px] opacity-70 font-medium">Link de ativação individual</span>
                        </div>
                    </Button>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-6 items-center justify-between bg-card/40 backdrop-blur-xl border border-border/40 p-8 rounded-[3rem] mx-4 shadow-sm">
                <div className="relative flex-1 w-full max-w-xl group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
                    <Input 
                        placeholder="Buscar empresa para configurar..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="h-16 rounded-[1.8rem] pl-16 bg-white border-slate-100 text-sm font-normal shadow-sm focus-visible:ring-primary/10"
                    />
                </div>
                <div className="flex gap-4">
                    <div className="flex flex-col items-end">
                        <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{clients.length} empresas cadastradas</span>
                    </div>
                </div>
            </div>

            {/* Clients Control Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 px-4">
                {clientsLoading ? (
                    <div className="col-span-3 py-32 flex flex-col items-center justify-center opacity-20">
                        <Clock className="h-10 w-10 animate-spin" />
                    </div>
                ) : filteredClients.map((client) => (
                    <Card 
                        key={client.id}
                        className="group rounded-[3.5rem] border border-border/40 bg-white/40 backdrop-blur-md overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5 relative p-8 space-y-6"
                    >
                        <div className="flex items-center justify-between">
                            <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all">
                                <Building2 className="h-6 w-6" />
                            </div>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => {
                                    setNewAccess({ clientId: client.id, email: client.email || '' });
                                    setIsCreateModalOpen(true);
                                }}
                                className="rounded-xl px-4 text-[9px] font-black uppercase text-primary hover:bg-primary/5 shadow-inner"
                            >
                                Gerar Link
                            </Button>
                        </div>
                        
                        <div className="space-y-1">
                            <h3 className="text-lg font-bold tracking-tight text-slate-800 line-clamp-1">{client.nomeFantasia}</h3>
                            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest italic">{client.cnpj}</p>
                        </div>

                        <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                             <div className="flex flex-col">
                                <span className="text-[8px] font-black uppercase text-slate-300 tracking-widest">Status de Acesso</span>
                                <Badge variant="outline" className="mt-1 rounded-full border-slate-100 bg-slate-50 text-slate-400 text-[8px] px-3 font-bold">Inativo / Pendente</Badge>
                             </div>
                             <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-200">
                                <ShieldCheck className="h-5 w-5" />
                             </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Modal Novo Acesso */}
            <Dialog open={isCreateModalOpen} onOpenChange={(open) => !open && resetInviteModal()}>
                <DialogContent className="rounded-[3rem] border-none bg-white p-12 max-w-2xl shadow-2xl animate-in zoom-in duration-300">
                    <DialogHeader>
                        <div className="flex items-center gap-4 mb-2">
                             <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                <UserPlus className="h-6 w-6" />
                             </div>
                             <div>
                                <DialogTitle className="text-3xl font-light text-slate-800">
                                    {isInviteSuccess ? "Link Gerado" : "Novo Acesso ao Portal"}
                                </DialogTitle>
                                <DialogDescription className="text-[10px] uppercase font-black tracking-widest text-slate-400 mt-1">
                                    {isInviteSuccess 
                                        ? "O convite está pronto para ser enviado." 
                                        : "Configure o acesso exclusivo para uma empresa específica."}
                                </DialogDescription>
                             </div>
                        </div>
                    </DialogHeader>
                    
                    {!isInviteSuccess ? (
                        <div className="py-8 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase font-bold text-slate-500 ml-1">1. Buscar Empresa</Label>
                                        <div className="relative group">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-primary transition-colors" />
                                            <Input 
                                                placeholder="Nome ou CNPJ..."
                                                value={modalSearchTerm}
                                                onChange={(e) => setModalSearchTerm(e.target.value)}
                                                className="h-14 rounded-2xl border-slate-100 bg-slate-50 pl-11 text-sm font-medium focus-visible:ring-primary/10"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase font-bold text-slate-500 ml-1">2. Selecionar Resultado ({modalFilteredClients.length})</Label>
                                        <select 
                                            value={newAccess.clientId}
                                            onChange={(e) => {
                                                const client = clients.find(c => c.id === e.target.value);
                                                setNewAccess({ 
                                                    ...newAccess, 
                                                    clientId: e.target.value,
                                                    email: client?.email || '' 
                                                });
                                            }}
                                            className="w-full h-14 rounded-2xl border border-slate-100 px-5 text-sm bg-slate-50 outline-none focus:ring-2 ring-primary/20 transition-all font-bold appearance-none cursor-pointer"
                                        >
                                            <option value="">Clique para selecionar...</option>
                                            {modalFilteredClients.map(c => (
                                                <option key={c.id} value={c.id}>{c.nomeFantasia} — {c.cnpj}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase font-bold text-slate-500 ml-1">3. E-mail do Cliente</Label>
                                        <Input 
                                            placeholder="exemplo@email.com.br"
                                            value={newAccess.email}
                                            onChange={(e) => setNewAccess({ ...newAccess, email: e.target.value })}
                                            className="h-14 rounded-2xl border-slate-100 bg-slate-50 px-5 text-sm font-bold focus-visible:ring-primary/10"
                                        />
                                        <p className="text-[8px] uppercase font-black text-slate-300 tracking-tighter ml-1">Este será o login principal da empresa.</p>
                                    </div>

                                    <div className="p-6 rounded-[2rem] bg-amber-50/50 border border-amber-100/50 space-y-2">
                                        <div className="flex items-center gap-2 text-amber-600">
                                            <ShieldCheck className="h-4 w-4" />
                                            <span className="text-[9px] font-black uppercase tracking-widest">Segurança</span>
                                        </div>
                                        <p className="text-[10px] text-amber-700/70 leading-relaxed">
                                            Ao gerar este link, o cliente poderá definir sua própria senha de forma segura. O link expira em 7 dias.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="py-10 space-y-6">
                            <div className="p-10 rounded-[3rem] bg-emerald-50 text-center space-y-6 border border-emerald-100">
                                <div className="h-24 w-24 rounded-[2rem] bg-white flex items-center justify-center mx-auto text-emerald-500 shadow-xl shadow-emerald-200/50 animate-bounce">
                                    <LinkIcon className="h-10 w-10" />
                                </div>
                                <div className="space-y-2">
                                    <p className="text-xl font-bold text-slate-700">Configuração Concluída!</p>
                                    <p className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-400">Envie o link seguro para: <span className="text-emerald-600">{newAccess.email}</span></p>
                                </div>
                                <div className="pt-2">
                                    <Input 
                                        readOnly 
                                        value={generatedLink} 
                                        className="h-16 rounded-2xl bg-white border-emerald-100 text-xs text-center font-bold text-emerald-600 focus-visible:ring-0 shadow-inner"
                                    />
                                </div>
                                <Button 
                                    onClick={() => {
                                        navigator.clipboard.writeText(generatedLink);
                                        toast.success("Link copiado!");
                                    }}
                                    className="w-full h-16 rounded-2xl bg-emerald-500 text-white font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl shadow-emerald-200 hover:bg-emerald-600 transition-all hover:scale-[1.02]"
                                >
                                    Copiar Link de Ativação
                                </Button>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="gap-3">
                        <Button 
                            variant="ghost" 
                            className="rounded-2xl h-14 px-10 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all"
                            onClick={resetInviteModal}
                        >
                            {isInviteSuccess ? "Finalizar" : "Cancelar"}
                        </Button>
                        {!isInviteSuccess && (
                            <Button 
                                className="rounded-2xl h-14 px-12 bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-primary/20 hover:bg-primary/90 transition-all hover:scale-[1.02]"
                                onClick={handleCreateAccess}
                                disabled={!newAccess.clientId || !newAccess.email}
                            >
                                Gerar Link Seguro
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
