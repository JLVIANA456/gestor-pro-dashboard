import { useState, useMemo, useEffect } from 'react';
import { useClients } from '@/hooks/useClients';
import { supabase } from '@/integrations/supabase/client';
import { 
    Search, 
    Building2, 
    ChevronRight, 
    Plus, 
    FileText, 
    Calendar, 
    DollarSign, 
    AlertCircle, 
    CheckCircle2, 
    History,
    Banknote,
    Calculator,
    ArrowLeft,
    TrendingUp,
    LayoutGrid,
    List,
    MoreVertical,
    Clock,
    Trash2,
    Link as LinkIcon,
    Paperclip,
    ExternalLink,
    Edit2,
    ShieldCheck,
    Gavel,
    Globe
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription,
    DialogFooter 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table";
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

// Categorias e Tipos
const INSTALLMENT_CATEGORIES = [
    { id: 'FEDERAL', name: 'Federal (RFB/PGFN)', icon: ShieldCheck, color: 'text-indigo-600', bg: 'bg-indigo-50', subtypes: ['Parcelamento Ordinário', 'Parcelamento Simplificado', 'Previdenciário', 'Dívida Ativa', 'Transação Tributária', 'REFIS'] },
    { id: 'SIMPLES', name: 'Simples Nacional', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50', subtypes: ['Convencional', 'Especial'] },
    { id: 'ESTADUAL', name: 'Estadual (ICMS)', icon: Building2, color: 'text-amber-600', bg: 'bg-amber-50', subtypes: ['Ordinário ICMS', 'PEP / PPD'] },
    { id: 'MUNICIPAL', name: 'Municipal (ISS)', icon: Globe, color: 'text-sky-600', bg: 'bg-sky-50', subtypes: ['Ordinário ISS', 'Anistia (PPI)'] },
    { id: 'FGTS', name: 'FGTS', icon: Banknote, color: 'text-blue-600', bg: 'bg-blue-50', subtypes: ['Parcelamento em Atraso'] },
    { id: 'JUDICIAL', name: 'Judicial', icon: Gavel, color: 'text-rose-600', bg: 'bg-rose-50', subtypes: ['Parcelamento Judicial (916 CPC)', 'Acordos PGFN'] }
];

interface Installment {
    id: string;
    client_id: string;
    category: string;
    type: string;
    custom_name?: string;
    total_installments: number;
    current_installment: number;
    installment_value: number;
    total_value: number;
    due_day: number;
    status: string;
    observation: string;
    external_links?: string[];
    created_at: string;
}

export default function FiscalInstallments() {
    const { clients, loading: clientsLoading } = useClients();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
    const [installments, setInstallments] = useState<Installment[]>([]);
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    
    // Form and Modal State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        category: '', type: '', custom_name: '', total_installments: 60,
        current_installment: 1, installment_value: 0, total_value: 0,
        due_day: 10, observation: '', link_temp: '', external_links: [] as string[]
    });

    useEffect(() => {
        if (selectedClientId) fetchInstallments(selectedClientId);
    }, [selectedClientId]);

    const fetchInstallments = async (clientId: string) => {
        try {
            setLoading(true);
            const { data, error } = await supabase.from('fiscal_installments').select('*').eq('client_id', clientId).order('created_at', { ascending: false });
            if (error) throw error;
            setInstallments(data || []);
        } catch (error) { setInstallments([]); } finally { setLoading(false); }
    };

    const handleSave = async () => {
        if (!selectedClientId || !formData.category) return toast.error("Selecione os campos básicos");
        try {
            setLoading(true);
            const { error } = await supabase.from('fiscal_installments').insert({
                client_id: selectedClientId, category: formData.category, type: formData.type,
                custom_name: formData.custom_name, total_installments: formData.total_installments,
                current_installment: formData.current_installment, installment_value: formData.installment_value,
                total_value: formData.total_value, due_day: formData.due_day, observation: formData.observation,
                external_links: formData.external_links, status: 'Ativo'
            });
            if (error) throw error;
            toast.success("Parcelamento Registrado!");
            setIsAddModalOpen(false);
            fetchInstallments(selectedClientId);
            setFormData({ category: '', type: '', custom_name: '', total_installments: 60, current_installment: 1, installment_value: 0, total_value: 0, due_day: 10, observation: '', link_temp: '', external_links: [] });
        } catch (error: any) { toast.error(error.message); } finally { setLoading(false); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Deseja realmente excluir este parcelamento?")) return;
        await supabase.from('fiscal_installments').delete().eq('id', id);
        fetchInstallments(selectedClientId!);
    };

    const filteredClients = useMemo(() => {
        return clients.filter(c => 
            c.nomeFantasia.toLowerCase().includes(searchTerm.toLowerCase()) || 
            c.cnpj.includes(searchTerm)
        );
    }, [clients, searchTerm]);

    const selectedClient = clients.find(c => c.id === selectedClientId);

    const renderViewToggle = () => (
        <div className="flex bg-slate-100 p-1 rounded-[1.5rem] border border-slate-200/50 shadow-inner">
            <Button size="sm" variant={viewMode === 'grid' ? "default" : "ghost"} className={cn("h-10 px-6 rounded-2xl gap-2 font-black text-[10px] uppercase transition-all duration-300", viewMode === 'grid' && "bg-white text-primary shadow-lg ring-1 ring-slate-100/30 border-none")} onClick={() => setViewMode('grid')}>
                <LayoutGrid className="h-4 w-4" /> GRADE
            </Button>
            <Button size="sm" variant={viewMode === 'list' ? "default" : "ghost"} className={cn("h-10 px-6 rounded-2xl gap-2 font-black text-[10px] uppercase transition-all duration-300", viewMode === 'list' && "bg-white text-primary shadow-lg ring-1 ring-slate-100/30 border-none")} onClick={() => setViewMode('list')}>
                <List className="h-4 w-4" /> LISTA
            </Button>
        </div>
    );

    // Initial View: Client Selection
    if (!selectedClientId) {
        return (
            <div className="space-y-12 animate-in fade-in duration-700 pb-20">
                <header className="relative flex flex-col md:flex-row md:items-center justify-between gap-8 px-6 pt-10">
                    <div className="space-y-3">
                        <h1 className="text-4xl font-light text-slate-800 tracking-tight">
                            Módulo <span className="font-bold text-primary">Fiscal</span>
                        </h1>
                        <div className="flex items-center gap-6">
                            <p className="text-[11px] uppercase font-black text-slate-400 tracking-[0.4em] flex items-center gap-3">
                                Seleção de Empresa
                            </p>
                            {renderViewToggle()}
                        </div>
                    </div>

                    <div className="relative w-full md:w-[450px]">
                        <Search className="absolute left-7 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <Input 
                            placeholder="Buscar empresa..." 
                            value={searchTerm} 
                            onChange={e => setSearchTerm(e.target.value)} 
                            className="h-20 rounded-[2.5rem] border-none bg-white shadow-2xl shadow-slate-200/60 pl-16 pr-8 text-md font-medium focus-visible:ring-primary/20 placeholder:text-slate-300" 
                        />
                    </div>
                </header>

                <div className="px-6 mt-6">
                    {viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                            {filteredClients.map((client) => (
                                <Card 
                                    key={client.id} 
                                    onClick={() => setSelectedClientId(client.id)}
                                    className="group relative cursor-pointer rounded-[4rem] border-none bg-white/60 backdrop-blur-xl overflow-hidden transition-all duration-500 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.06)] p-12 hover:-translate-y-3 ring-1 ring-slate-100/50"
                                >
                                    <div className="space-y-8 relative z-10">
                                        <div className="h-20 w-20 rounded-[2.5rem] bg-white shadow-xl shadow-slate-200/40 flex items-center justify-center text-slate-300 group-hover:bg-primary group-hover:text-white group-hover:shadow-primary/30 transition-all duration-700">
                                            <Building2 className="h-10 w-10" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-bold tracking-tight text-slate-800 line-clamp-1 mb-2 group-hover:text-primary transition-colors">{client.nomeFantasia}</h3>
                                            <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest leading-none">{client.cnpj}</p>
                                        </div>
                                        <div className="flex items-center gap-3 text-primary font-black text-[11px] uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-all transform translate-y-4 group-hover:translate-y-0 duration-500">
                                            Acessar Fiscal <ChevronRight className="h-4 w-4" />
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card className="rounded-[3rem] border-none shadow-[0_20px_50px_-20px_rgba(0,0,0,0.05)] bg-white overflow-hidden p-4">
                            <Table>
                                <TableHeader className="bg-slate-50/50">
                                    <TableRow className="border-slate-100 hover:bg-transparent">
                                        <TableHead className="text-[11px] font-black uppercase text-slate-400 tracking-widest py-8 pl-12">Empresa (Nome Fantasia)</TableHead>
                                        <TableHead className="text-[11px] font-black uppercase text-slate-400 tracking-widest">CNPJ</TableHead>
                                        <TableHead className="text-[9px] font-bold text-slate-300 uppercase text-right pr-12">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredClients.map(client => (
                                        <TableRow key={client.id} className="border-slate-50 hover:bg-primary/[0.02] transition-colors cursor-pointer group" onClick={() => setSelectedClientId(client.id)}>
                                            <TableCell className="py-8 pl-12">
                                                <div className="flex items-center gap-6">
                                                    <div className="h-12 w-12 rounded-2xl bg-slate-50 text-slate-300 flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-all duration-500">
                                                        <Building2 className="h-6 w-6" />
                                                    </div>
                                                    <span className="font-bold text-slate-700 text-lg group-hover:text-primary transition-colors">{client.nomeFantasia}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-bold text-slate-400 font-mono text-sm tracking-tight">{client.cnpj}</TableCell>
                                            <TableCell className="text-right pr-12">
                                                <Button variant="ghost" size="sm" className="rounded-2xl font-black text-[11px] uppercase text-primary gap-2 hover:bg-primary/5 px-6 h-12">
                                                    Gerenciar <ChevronRight className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Card>
                    )}
                </div>
            </div>
        );
    }

    // Detail Screen: Installment Panel (Always showing table/list as requested earlier, or grid per preference)
    return (
        <div className="space-y-12 animate-in slide-in-from-right duration-700 pb-20">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 bg-white/50 backdrop-blur-3xl p-10 rounded-[4rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] mx-6 border border-white/50">
                <div className="flex items-center gap-8">
                    <Button variant="ghost" size="icon" onClick={() => setSelectedClientId(null)} className="h-16 w-16 rounded-[2rem] bg-white shadow-xl border border-slate-100/50 text-slate-400 hover:text-primary transition-all hover:scale-105 active:scale-95">
                        <ArrowLeft className="h-7 w-7" />
                    </Button>
                    <div>
                         <div className="flex items-center gap-3">
                            <Badge className="bg-primary text-white rounded-full text-[10px] uppercase font-black tracking-widest px-4 h-6 border-none">Painel do Fiscal</Badge>
                        </div>
                        <h2 className="text-3xl font-light text-slate-800 tracking-tight mt-3">
                            <span className="font-bold text-primary">{selectedClient?.nomeFantasia}</span>
                        </h2>
                        <div className="flex items-center gap-6 mt-3">
                             {renderViewToggle()}
                             <p className="text-[12px] font-black text-slate-300 uppercase tracking-widest">{selectedClient?.cnpj}</p>
                        </div>
                    </div>
                </div>

                <Button className="h-20 rounded-[2.5rem] px-12 gap-4 bg-primary text-white shadow-2xl shadow-primary/20 font-black uppercase text-[12px] tracking-[0.2em] hover:scale-105 active:scale-95 transition-all" onClick={() => setIsAddModalOpen(true)}>
                    <Plus className="h-6 w-6" /> Novo Parcelamento
                </Button>
            </header>

            <div className="px-6">
                {viewMode === 'list' ? (
                    <Card className="rounded-[3rem] border-none shadow-sm overflow-hidden bg-white/80 backdrop-blur-3xl">
                        <Table>
                            <TableHeader className="bg-slate-50/50">
                                <TableRow className="border-slate-100/50">
                                    <TableHead className="text-[11px] font-black uppercase text-slate-400 tracking-widest py-8 pl-12">Parcelamento</TableHead>
                                    <TableHead className="text-[11px] font-black uppercase text-slate-400 tracking-widest">Categoria</TableHead>
                                    <TableHead className="text-[11px] font-black uppercase text-slate-400 tracking-widest">Progresso</TableHead>
                                    <TableHead className="text-[11px] font-black uppercase text-slate-400 tracking-widest">Vlr. Parcela</TableHead>
                                    <TableHead className="text-[11px] font-black uppercase text-slate-400 tracking-widest">Vencimento</TableHead>
                                    <TableHead className="text-[11px] font-black uppercase text-slate-400 tracking-widest text-right pr-12">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {installments.length === 0 ? (
                                    <TableRow><TableCell colSpan={6} className="py-40 text-center opacity-30"><History className="h-16 w-16 mx-auto mb-4" /><p className="font-black uppercase text-[11px] tracking-widest text-slate-400">Nenhum registro encontrado</p></TableCell></TableRow>
                                ) : installments.map(item => (
                                    <TableRow key={item.id} className="border-slate-100/30 hover:bg-primary/[0.01] transition-colors group">
                                        <TableCell className="py-8 pl-12">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-800 text-lg group-hover:text-primary transition-colors">{item.custom_name || item.type}</span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.type}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={cn("rounded-xl px-4 h-7 border-none font-black text-[9px] uppercase tracking-widest", INSTALLMENT_CATEGORIES.find(c => c.id === item.category)?.bg, INSTALLMENT_CATEGORIES.find(c => c.id === item.category)?.color)}>
                                                {item.category}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                 <span className="text-[16px] font-black text-slate-800">{item.current_installment}</span>
                                                 <span className="text-[11px] font-bold text-slate-300">/ {item.total_installments}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-black text-slate-800 font-mono">R$ {Number(item.installment_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                                        <TableCell><Badge variant="outline" className="h-7 rounded-full border-slate-200 text-slate-400 font-bold px-4 text-[10px]">Dia {item.due_day}</Badge></TableCell>
                                        <TableCell className="text-right pr-12"><Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl h-12 w-12"><Trash2 className="h-5 w-5" /></Button></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {installments.length === 0 ? (
                            <div className="col-span-full py-60 flex flex-col items-center opacity-20"><History className="h-20 w-20 mb-4" /><h4 className="font-black uppercase text-[12px] tracking-[0.3em]">Histórico Vazio</h4></div>
                        ) : installments.map(item => {
                            const cat = INSTALLMENT_CATEGORIES.find(c => c.id === item.category);
                            const Icon = cat?.icon || Banknote;
                            return (
                                <Card key={item.id} className="group relative rounded-[4rem] bg-white border-none shadow-[0_15px_40px_-10px_rgba(0,0,0,0.04)] hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] transition-all duration-700 p-12 overflow-hidden hover:-translate-y-2 ring-1 ring-slate-50">
                                    <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-100 overflow-hidden"><div className="h-full bg-primary/30 transition-all duration-1000" style={{ width: `${(item.current_installment/item.total_installments)*100}%` }} /></div>
                                    <div className="space-y-10">
                                        <div className="flex items-start justify-between">
                                            <div className={cn("h-20 w-20 rounded-[2.5rem] flex items-center justify-center shadow-inner", cat?.bg, cat?.color)}><Icon className="h-10 w-10" /></div>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="h-12 w-12 text-slate-200 hover:text-red-500 bg-slate-50 hover:bg-red-50 rounded-2xl transition-all opacity-0 group-hover:opacity-100"><Trash2 className="h-5 w-5" /></Button>
                                        </div>
                                        <div className="space-y-2">
                                            <h4 className="text-2xl font-bold text-slate-800 tracking-tight leading-tight group-hover:text-primary transition-colors line-clamp-1">{item.custom_name || item.type}</h4>
                                            <Badge className="bg-slate-100 text-slate-400 border-none text-[8px] font-black uppercase px-3 h-5 rounded-full">{item.category}</Badge>
                                        </div>
                                        <div className="grid grid-cols-2 gap-8 py-8 border-y border-slate-50/50">
                                            <div className="space-y-2">
                                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Progressão</p>
                                                <p className="text-3xl font-black text-slate-800">{item.current_installment} <span className="text-sm font-bold text-slate-300">/ {item.total_installments}</span></p>
                                            </div>
                                            <div className="space-y-2 text-right">
                                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Vlr. Parcela</p>
                                                <p className="text-xl font-bold text-slate-800 tracking-tighter pt-1">R$ {Number(item.installment_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                             <div className="flex gap-2">
                                                 {item.external_links?.map((lnk, i) => (
                                                     <a key={i} href={lnk.startsWith('http') ? lnk : `https://${lnk}`} target="_blank" rel="noreferrer" className="h-10 w-10 flex items-center justify-center rounded-2xl bg-white border border-slate-100 text-slate-400 hover:text-primary hover:border-primary/20 shadow-sm transition-all"><ExternalLink className="h-4 w-4" /></a>
                                                 ))}
                                             </div>
                                             <Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-[10px] uppercase px-5 h-8 rounded-full tracking-widest shadow-sm shadow-emerald-500/5">Dia {item.due_day}</Badge>
                                        </div>
                                    </div>
                                </Card>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Premium Modal Redesigned */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent className="rounded-[4rem] border-none bg-white p-16 max-w-3xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] overflow-y-auto max-h-[90vh]">
                    <DialogHeader className="mb-12">
                        <div className="flex items-center gap-6">
                            <div className="h-16 w-16 rounded-[2rem] bg-primary/5 flex items-center justify-center text-primary shadow-inner">
                                <Plus className="h-8 w-8" />
                            </div>
                            <div>
                                <DialogTitle className="text-4xl font-light text-slate-800 tracking-tight">Novo <span className="font-bold text-primary">Parcelamento</span></DialogTitle>
                                <DialogDescription className="text-[11px] uppercase font-black text-slate-400 tracking-[0.4em] mt-3">Detalhes técnicos para controle estratégico.</DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="space-y-10">
                            <div className="space-y-4">
                                <Label className="text-[11px] uppercase font-black text-slate-400 ml-6 tracking-widest">Apelido (Nome Customizado)</Label>
                                <Input className="h-20 rounded-[2.2rem] border-none bg-slate-50 px-10 font-bold text-lg text-slate-700 shadow-inner" placeholder="Ex: Acordo SEFAZ 2024" value={formData.custom_name} onChange={e => setFormData({ ...formData, custom_name: e.target.value })} />
                            </div>
                            <div className="space-y-4">
                                <Label className="text-[11px] uppercase font-black text-slate-400 ml-6 tracking-widest">Órgão Competente</Label>
                                <Select onValueChange={(val) => setFormData({ ...formData, category: val, type: '' })} value={formData.category}>
                                    <SelectTrigger className="h-20 rounded-[2.2rem] border-none bg-slate-50 px-10 font-bold text-slate-700 shadow-inner"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                    <SelectContent className="rounded-3xl border-slate-100 shadow-2xl p-2">{INSTALLMENT_CATEGORIES.map(cat => <SelectItem key={cat.id} value={cat.id} className="rounded-2xl py-4 font-bold">{cat.name}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-10">
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <Label className="text-[11px] uppercase font-black text-slate-400 tracking-widest text-center block">Parc. Totais</Label>
                                    <Input type="number" value={formData.total_installments} onChange={e => setFormData({ ...formData, total_installments: Number(e.target.value) })} className="h-20 rounded-[2.2rem] border-none bg-slate-50 text-center font-black text-xl text-primary shadow-inner" />
                                </div>
                                <div className="space-y-4">
                                    <Label className="text-[11px] uppercase font-black text-slate-400 tracking-widest text-center block">Venc. Dia</Label>
                                    <Input type="number" min="1" max="31" value={formData.due_day} onChange={e => setFormData({ ...formData, due_day: Number(e.target.value) })} className="h-20 rounded-[2.2rem] border-none bg-slate-50 text-center font-black text-xl text-primary shadow-inner" />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <Label className="text-[11px] uppercase font-black text-slate-400 ml-6 tracking-widest">Valor da Parcela (R$)</Label>
                                <Input type="number" step="0.01" value={formData.installment_value} onChange={e => setFormData({ ...formData, installment_value: Number(e.target.value) })} className="h-20 rounded-[2.2rem] border-none bg-emerald-50/50 px-10 font-black text-2xl text-emerald-600 shadow-inner" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-5 mt-10">
                        <Label className="text-[11px] uppercase font-black text-slate-400 ml-10 tracking-widest">Observações Consultivas e Links</Label>
                        <Textarea placeholder="Descreva os alertas de rescisão, impacto em CND e links do e-CAC/DRIVE..." value={formData.observation} onChange={e => setFormData({ ...formData, observation: e.target.value })} className="min-h-[160px] rounded-[3rem] border-none bg-slate-50 p-10 font-medium text-slate-600 shadow-inner resize-none focus:ring-primary/20 text-md leading-relaxed" />
                        <div className="flex gap-4 p-2 bg-slate-50 rounded-[2.5rem]">
                            <Input placeholder="Adicionar Link Externo..." value={formData.link_temp} onChange={e => setFormData({ ...formData, link_temp: e.target.value })} className="h-16 rounded-[2rem] border-none bg-white shadow-sm px-8 font-medium text-slate-400 flex-1" />
                            <Button onClick={() => { if(formData.link_temp) setFormData({...formData, external_links: [...formData.external_links, formData.link_temp], link_temp: ''}) }} className="h-16 w-16 rounded-[2.2rem] bg-white border border-slate-100 text-primary shadow-md hover:scale-105 active:scale-95 transition-all"><Plus className="h-8 w-8" /></Button>
                        </div>
                        <div className="flex flex-wrap gap-3 mt-4">{formData.external_links.map((lnk, i) => <Badge key={i} className="bg-primary/5 text-primary border-none text-[10px] font-black uppercase px-6 py-3 rounded-2xl flex items-center gap-4"><LinkIcon className="h-4 w-4" /> LINK {i+1} <Trash2 className="h-4 w-4 cursor-pointer text-red-400" onClick={() => setFormData({...formData, external_links: formData.external_links.filter((_, idx)=>idx!==i)})} /></Badge>)}</div>
                    </div>

                    <DialogFooter className="mt-16 gap-8 justify-center">
                        <Button variant="ghost" onClick={() => setIsAddModalOpen(false)} className="h-20 rounded-[2.5rem] px-14 text-[13px] font-black uppercase tracking-[0.3em] text-slate-400 transition-all">Cancelar</Button>
                        <Button onClick={handleSave} className="h-20 rounded-[2.5rem] px-20 bg-primary text-white font-black uppercase text-[13px] tracking-[0.3em] shadow-[0_30px_60px_-10px_rgba(0,0,0,0.2)] hover:scale-105 active:scale-95 transition-all shadow-primary/30">Salvar Parcelamento</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
