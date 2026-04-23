import { useEffect, useMemo, useState } from 'react';
import { usePortalContent, PortalContentType } from '@/hooks/usePortalContent';
import { useClients } from '@/hooks/useClients';
import {
    Search,
    Building2,
    FileText,
    FolderOpen,
    Link2,
    BookOpen,
    Video,
    Lightbulb,
    Plus,
    Trash2,
    Inbox,
    X,
    LayoutDashboard,
    ShieldCheck,
    Clock,
    ArrowRight,
    Sparkles,
    Calendar,
    Settings2,
    CheckCircle2
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';

const categories = [
    {
        id: 'boas_praticas',
        label: 'Boas Práticas',
        icon: Lightbulb,
        color: 'text-amber-500'
    },
    {
        id: 'videos_treinamentos',
        label: 'Vídeos',
        icon: Video,
        color: 'text-red-500'
    },
    {
        id: 'reforma_tributaria',
        label: 'Reforma Tributária',
        icon: BookOpen,
        color: 'text-blue-500'
    },
] as const;

const topTabs = [
    { id: 'clients', label: 'Gestão por Empresa', icon: Building2 },
    { id: 'portal', label: 'Conteúdo Global', icon: Link2 },
] as const;

export default function PortalContentManager() {
    const { fetchContent, addContent, deleteContent, contentList, loading } = usePortalContent();
    const { clients } = useClients();

    const [activeCategory, setActiveCategory] = useState<PortalContentType>('boas_praticas');
    const [activeTopTab, setActiveTopTab] = useState<'clients' | 'portal'>('clients');

    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isClientDetailOpen, setIsClientDetailOpen] = useState(false);

    const [selectedClient, setSelectedClient] = useState<any>(null);
    const [targetType, setTargetType] = useState<'all' | 'specific'>('all');
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        video_url: '',
    });

    useEffect(() => {
        fetchContent();
    }, [fetchContent]);

    const resetForm = () => {
        setFormData({
            title: '',
            content: '',
            video_url: '',
        });
        setTargetType('all');
    };

    const handleOpenGlobalCreate = () => {
        resetForm();
        setTargetType('all');
        setIsCreateModalOpen(true);
    };

    const handleOpenSpecificCreate = (client?: any) => {
        resetForm();
        setTargetType('specific');
        if (client?.id) {
            setSelectedClient(client);
        }
        setIsCreateModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const finalTargets =
            targetType === 'all'
                ? null
                : selectedClient
                    ? [selectedClient.id]
                    : null;

        const success = await addContent({
            ...formData,
            type: activeCategory,
            target_client_ids: finalTargets,
        });

        if (success !== false) {
            toast.success('Conteúdo publicado com sucesso!');
            setIsCreateModalOpen(false);
            resetForm();
        }
    };

    const filteredClients = useMemo(() => {
        return clients.filter((client) => {
            const name = (client.nomeFantasia || client.razaoSocial || '').toLowerCase();
            const cnpj = (client.cnpj || '');
            const term = searchTerm.toLowerCase();
            return name.includes(term) || cnpj.includes(term);
        });
    }, [clients, searchTerm]);

    const globalContent = useMemo(() => {
        return contentList.filter((item) => {
            const isGlobal = !item.target_client_ids || item.target_client_ids.length === 0;
            const sameCategory = item.type === activeCategory;
            const matchSearch =
                item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.content?.toLowerCase().includes(searchTerm.toLowerCase());
            return isGlobal && sameCategory && matchSearch;
        });
    }, [contentList, activeCategory, searchTerm]);

    const getClientSpecificContent = (clientId: string) => {
        return contentList.filter((item) => {
            return item.target_client_ids?.includes(clientId) && item.type === activeCategory;
        });
    };

    const getClientVisibleContentCount = (clientId: string) => {
        return contentList.filter((item) => {
            const sameCategory = item.type === activeCategory;
            const isGlobal = !item.target_client_ids || item.target_client_ids.length === 0;
            const isSpecific = item.target_client_ids?.includes(clientId);
            return sameCategory && (isGlobal || isSpecific);
        }).length;
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Deseja realmente remover este conteúdo?')) {
            await deleteContent(id);
            toast.success('Conteúdo removido com sucesso.');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/50 space-y-8 p-4 md:p-8 animate-in fade-in duration-700">
            {/* Header Section */}
            <motion.section 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-[3rem] bg-white border border-slate-100 p-10 shadow-[0_20px_50px_rgba(0,0,0,0.02)] relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
                
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
                    <div className="flex items-center gap-6">
                        <div className="h-16 w-16 rounded-[1.5rem] bg-primary/10 flex items-center justify-center text-primary shadow-lg shadow-primary/5 rotate-3">
                            <LayoutDashboard className="h-8 w-8" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <ShieldCheck className="h-3 w-3 text-emerald-500" />
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Portal do Cliente</span>
                            </div>
                            <h1 className="text-4xl font-light tracking-tight text-slate-900">
                                Gestão de <span className="font-semibold text-primary">Conteúdo</span>
                            </h1>
                            <p className="text-xs text-slate-400 font-medium mt-1">Controle o que seus clientes visualizam em tempo real.</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 rounded-[2rem] bg-slate-100/50 p-1.5 border border-slate-200/50">
                        {topTabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTopTab(tab.id as any)}
                                className={cn(
                                    'inline-flex h-12 items-center gap-3 rounded-[1.5rem] px-6 text-[10px] font-black uppercase tracking-widest transition-all',
                                    activeTopTab === tab.id
                                        ? 'bg-white text-primary shadow-xl shadow-primary/10'
                                        : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                                )}
                            >
                                <tab.icon className={cn('h-4 w-4', activeTopTab === tab.id ? 'text-primary' : 'text-slate-300')} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </motion.section>

            {/* Filters & Actions */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex flex-wrap items-center gap-3">
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id as PortalContentType)}
                            className={cn(
                                'inline-flex h-12 items-center gap-3 rounded-[1.2rem] border px-6 text-xs font-bold transition-all',
                                activeCategory === cat.id
                                    ? 'border-primary/20 bg-primary/5 text-primary shadow-sm'
                                    : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                            )}
                        >
                            <cat.icon className={cn('h-4 w-4', activeCategory === cat.id ? 'text-primary' : 'text-slate-300')} />
                            {cat.label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative w-full lg:w-80 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-primary transition-colors" />
                        <Input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar empresa ou conteúdo..."
                            className="h-12 rounded-[1.2rem] border-slate-200 bg-white pl-11 text-sm shadow-sm focus:shadow-md transition-all"
                        />
                    </div>
                    <Button
                        onClick={handleOpenGlobalCreate}
                        className="h-12 rounded-[1.2rem] bg-primary text-white shadow-xl shadow-primary/20 text-[10px] font-black uppercase tracking-widest gap-2"
                    >
                        <Plus className="h-4 w-4" /> Novo Conteúdo
                    </Button>
                </div>
            </div>

            {/* Main Content Area */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTopTab}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4 }}
                >
                    {activeTopTab === 'clients' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {filteredClients.length === 0 ? (
                                <Card className="col-span-full rounded-[3rem] border-dashed border-2 py-32 flex flex-col items-center justify-center space-y-6 bg-slate-50/50">
                                    <div className="h-20 w-20 bg-white rounded-3xl flex items-center justify-center text-slate-200 shadow-inner">
                                        <Inbox className="h-10 w-10" />
                                    </div>
                                    <p className="text-xl font-bold text-slate-300">Nenhum cliente encontrado</p>
                                </Card>
                            ) : (
                                filteredClients.map((client) => {
                                    const visibleCount = getClientVisibleContentCount(client.id);
                                    return (
                                        <Card 
                                            key={client.id}
                                            onClick={() => {
                                                setSelectedClient(client);
                                                setIsClientDetailOpen(true);
                                            }}
                                            className="group rounded-[2.5rem] border border-slate-100 bg-white p-8 cursor-pointer hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 hover:-translate-y-1 overflow-hidden relative"
                                        >
                                            <div className="flex items-start justify-between relative z-10">
                                                <div className="flex gap-5">
                                                    <div className={cn(
                                                        "h-14 w-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 duration-500",
                                                        client.isActive ? "bg-primary text-white shadow-primary/20" : "bg-slate-100 text-slate-400"
                                                    )}>
                                                        <Building2 className="h-7 w-7" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-bold text-slate-800 line-clamp-1 group-hover:text-primary transition-colors">
                                                            {client.nomeFantasia || client.razaoSocial}
                                                        </h3>
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">CNPJ: {client.cnpj}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-10 flex items-center justify-between border-t border-slate-50 pt-6">
                                                <div className="space-y-1">
                                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-300">Visível no Portal</p>
                                                    <p className="text-sm font-bold text-slate-700">{visibleCount} Itens encontrados</p>
                                                </div>
                                                <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-primary group-hover:text-white transition-all duration-500">
                                                    <ArrowRight className="h-5 w-5" />
                                                </div>
                                            </div>
                                        </Card>
                                    );
                                })
                            )}
                        </div>
                    ) : activeTopTab === 'portal' ? (
                        <div className="grid grid-cols-1 gap-6">
                            {globalContent.length === 0 ? (
                                <Card className="rounded-[3rem] border-dashed border-2 py-32 flex flex-col items-center justify-center space-y-6 bg-slate-50/50">
                                    <div className="h-20 w-20 bg-white rounded-3xl flex items-center justify-center text-slate-200 shadow-inner">
                                        <Link2 className="h-10 w-10" />
                                    </div>
                                    <p className="text-xl font-bold text-slate-300">Nenhum conteúdo global publicado</p>
                                </Card>
                            ) : (
                                globalContent.map((item) => (
                                    <Card key={item.id} className="rounded-[3rem] border border-slate-50 bg-white p-10 hover:shadow-2xl transition-all duration-500 group">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-4 flex-1 pr-12">
                                                <div className="flex items-center gap-4">
                                                    <h3 className="text-2xl font-bold text-slate-800">{item.title}</h3>
                                                    <span className="px-4 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase tracking-widest border border-emerald-100">
                                                        Acesso Público
                                                    </span>
                                                </div>
                                                <p className="text-slate-500 text-lg font-light leading-relaxed line-clamp-3">{item.content}</p>
                                                <div className="flex items-center gap-8 pt-6 border-t border-slate-50">
                                                    <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                        <Clock className="h-4 w-4" /> {format(new Date(item.created_at), "dd 'de' MMMM", { locale: ptBR })}
                                                    </div>
                                                    {item.video_url && (
                                                        <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase">
                                                            <Video className="h-4 w-4" /> Vídeo Disponível
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <Button 
                                                variant="ghost" 
                                                onClick={() => handleDelete(item.id)}
                                                className="h-20 w-20 rounded-[2rem] text-slate-100 hover:text-white hover:bg-red-500 transition-all shadow-inner"
                                            >
                                                <Trash2 className="h-8 w-8" />
                                            </Button>
                                        </div>
                                    </Card>
                                ))
                            )}
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* CREATE MODAL */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent className="max-w-4xl rounded-[3rem] p-0 border-none shadow-2xl overflow-hidden bg-white">
                    <div className="p-10 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                        <div className="space-y-1">
                            <div className="flex items-center gap-3 text-primary mb-2">
                                <Sparkles className="h-4 w-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Nova Publicação</span>
                            </div>
                            <DialogTitle className="text-4xl font-light text-slate-900 tracking-tight">Publicar no <span className="font-bold text-primary">Portal</span></DialogTitle>
                            <p className="text-xs text-slate-400 font-medium">Categoria: {categories.find(c => c.id === activeCategory)?.label}</p>
                        </div>
                        <div className="bg-white px-6 py-4 rounded-2xl border border-slate-100 shadow-sm text-center">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Tipo de Alvo</p>
                            <p className="text-xs font-bold text-primary">{targetType === 'all' ? '🌍 Global' : '🎯 Específico'}</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-10 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Título da Postagem</label>
                                <Input 
                                    required 
                                    value={formData.title} 
                                    onChange={e => setFormData({...formData, title: e.target.value})} 
                                    placeholder="Dê um título atrativo..." 
                                    className="h-14 rounded-[1.2rem] bg-slate-50 border-transparent px-6 text-lg font-bold shadow-inner focus:bg-white transition-all" 
                                />
                            </div>
                            {activeCategory === 'videos_treinamentos' ? (
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Link do Vídeo (YouTube)</label>
                                    <Input 
                                        required 
                                        value={formData.video_url} 
                                        onChange={e => setFormData({...formData, video_url: e.target.value})} 
                                        placeholder="https://youtube.com/..." 
                                        className="h-14 rounded-[1.2rem] bg-slate-50 border-transparent px-6 shadow-inner focus:bg-white transition-all" 
                                    />
                                </div>
                            ) : null}
                        </div>

                        {targetType === 'specific' && selectedClient && (
                            <div className="p-6 rounded-[1.5rem] bg-primary/5 border border-primary/10 flex items-center justify-between">
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-primary/60">Publicação Exclusiva para:</p>
                                    <h4 className="text-lg font-bold text-slate-800">{selectedClient.nomeFantasia || selectedClient.razaoSocial}</h4>
                                </div>
                                <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-primary shadow-sm">
                                    <ShieldCheck className="h-5 w-5" />
                                </div>
                            </div>
                        )}

                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Conteúdo Detalhado</label>
                            <Textarea 
                                required 
                                value={formData.content} 
                                onChange={e => setFormData({...formData, content: e.target.value})} 
                                placeholder="Escreva o texto completo aqui..." 
                                className="min-h-[200px] rounded-[2rem] bg-slate-50 border-transparent p-8 text-lg font-light leading-relaxed shadow-inner focus:bg-white transition-all" 
                            />
                        </div>

                        <DialogFooter className="pt-6 border-t border-slate-50 gap-4">
                            <Button type="button" variant="ghost" onClick={() => setIsCreateModalOpen(false)} className="h-14 px-8 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400">Cancelar</Button>
                            <Button type="submit" className="h-14 px-12 rounded-2xl bg-primary text-white shadow-2xl shadow-primary/30 text-[10px] font-black uppercase tracking-widest">Publicar Agora</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* CLIENT DETAIL MODAL */}
            <Dialog open={isClientDetailOpen} onOpenChange={setIsClientDetailOpen}>
                <DialogContent className="max-w-6xl rounded-[4rem] p-0 border-none shadow-2xl overflow-hidden bg-white h-[90vh] flex flex-col">
                    <div className="p-12 border-b border-slate-50 bg-slate-50/50 relative overflow-hidden shrink-0">
                        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
                        <div className="flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-8">
                                <div className="h-24 w-24 rounded-[2rem] bg-white border border-slate-100 flex items-center justify-center font-black text-3xl text-primary shadow-2xl shadow-primary/10 rotate-3">
                                    {(selectedClient?.nomeFantasia || selectedClient?.razaoSocial)?.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div className="flex items-center gap-3">
                                        <ShieldCheck className="h-3 w-3 text-emerald-500" />
                                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Auditoria de Portal</span>
                                    </div>
                                    <h2 className="text-4xl font-light text-slate-900 tracking-tight">
                                        Controle: <span className="font-bold text-slate-800">{selectedClient?.nomeFantasia || selectedClient?.razaoSocial}</span>
                                    </h2>
                                    <p className="text-sm text-slate-400 font-medium">{selectedClient?.cnpj}</p>
                                </div>
                            </div>
                            <Button 
                                onClick={() => handleOpenSpecificCreate(selectedClient)}
                                className="h-16 px-10 rounded-[1.5rem] bg-primary text-white shadow-2xl shadow-primary/30 text-[10px] font-black uppercase tracking-widest gap-3"
                            >
                                <Plus className="h-5 w-5" /> Novo Exclusivo
                            </Button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-12 custom-scrollbar space-y-12">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {categories.map(cat => {
                                const total = contentList.filter(item => {
                                    const sameCategory = item.type === cat.id;
                                    const isGlobal = !item.target_client_ids || item.target_client_ids.length === 0;
                                    const isSpecific = item.target_client_ids?.includes(selectedClient?.id);
                                    return sameCategory && (isGlobal || isSpecific);
                                }).length;
                                return (
                                    <div key={cat.id} className="p-8 rounded-[2rem] bg-slate-50/50 border border-slate-100 flex items-center gap-6">
                                        <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center">
                                            <cat.icon className={cn("h-6 w-6", cat.color)} />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-black text-slate-800">{total}</p>
                                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{cat.label}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="space-y-8">
                            <div className="flex items-center gap-4">
                                <Settings2 className="h-6 w-6 text-primary" />
                                <h3 className="text-xl font-bold text-slate-800 uppercase tracking-tight">Conteúdos Específicos</h3>
                            </div>
                            
                            <div className="grid gap-4">
                                {getClientSpecificContent(selectedClient?.id).length === 0 ? (
                                    <div className="p-16 rounded-[2.5rem] border border-dashed border-slate-200 text-center space-y-4 opacity-50">
                                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Sem itens exclusivos</p>
                                    </div>
                                ) : (
                                    getClientSpecificContent(selectedClient?.id).map(item => (
                                        <div key={item.id} className="flex items-center justify-between p-8 rounded-[2rem] bg-white border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 group">
                                            <div className="space-y-2 flex-1 pr-10">
                                                <div className="flex items-center gap-3">
                                                    <h4 className="text-lg font-bold text-slate-800">{item.title}</h4>
                                                    <span className="px-3 py-1 rounded-full bg-primary/5 text-primary text-[8px] font-black uppercase tracking-widest">Exclusivo</span>
                                                </div>
                                                <p className="text-slate-500 text-sm line-clamp-2 leading-relaxed">{item.content}</p>
                                                <div className="flex items-center gap-4 pt-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                                    <Calendar className="h-3.5 w-3.5" /> {format(new Date(item.created_at), "dd/MM/yyyy HH:mm")}
                                                </div>
                                            </div>
                                            <Button variant="ghost" onClick={() => handleDelete(item.id)} className="h-12 w-12 rounded-xl text-slate-200 hover:text-red-500 hover:bg-red-50">
                                                <Trash2 className="h-5 w-5" />
                                            </Button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="space-y-8 opacity-60 grayscale hover:grayscale-0 transition-all duration-700">
                            <div className="flex items-center gap-4">
                                <Globe className="h-6 w-6 text-slate-400" />
                                <h3 className="text-xl font-bold text-slate-400 uppercase tracking-tight">Conteúdos Globais Visíveis</h3>
                            </div>
                            <div className="grid gap-4">
                                {globalContent.map(item => (
                                    <div key={item.id} className="flex items-center justify-between p-6 rounded-[1.5rem] bg-slate-50 border border-slate-100">
                                        <div className="space-y-1">
                                            <h4 className="text-md font-bold text-slate-600">{item.title}</h4>
                                            <p className="text-xs text-slate-400 line-clamp-1">{item.content}</p>
                                        </div>
                                        <div className="px-3 py-1 rounded-full bg-white border border-slate-100 text-[8px] font-black text-slate-400 uppercase tracking-widest">Público</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="p-10 border-t border-slate-50 bg-slate-50/50 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-4">
                            <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status da Auditoria</p>
                                <p className="text-sm font-bold text-slate-700">Tudo em conformidade</p>
                            </div>
                        </div>
                        <Button variant="outline" onClick={() => setIsClientDetailOpen(false)} className="rounded-2xl h-12 px-8 border-slate-200 text-slate-500 font-bold">Fechar Auditoria</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function Globe({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2a14.5 14.5 0 0 0 0 20" />
            <path d="M12 2a14.5 14.5 0 0 0 0 20" />
            <path d="M2 12h20" />
        </svg>
    );
}