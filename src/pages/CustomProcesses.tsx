import { useState, useEffect, useMemo } from 'react';
import { 
    Clock, 
    Calendar as CalendarIcon, 
    Building2, 
    ShieldCheck, 
    TrendingUp,
    AlertCircle,
    Info,
    Send,
    Search,
    ChevronRight,
    ClipboardList,
    CalendarCheck,
    Hourglass,
    ArrowRightCircle,
    Plus,
    Trash2,
    Edit2,
    Settings2,
    Loader2,
    FileText
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useBranding } from '@/context/BrandingContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";

interface CustomProcess {
    id: string;
    name: string;
    department: string;
    step1_name: string;
    step1_desc: string;
    step1_day: number;
    step2_name: string;
    step2_desc: string;
    step2_days: number;
    step3_name: string;
    step3_desc: string;
    step3_day: number;
    step4_name: string;
    step4_desc: string;
    step4_day: number;
    manual_instrucoes?: string;
}

export default function CustomProcesses() {
    const { officeName } = useBranding();
    const [processes, setProcesses] = useState<CustomProcess[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<CustomProcess | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Form state
    const [formData, setFormData] = useState<Omit<CustomProcess, 'id'>>({
        name: '',
        department: 'GERAL',
        step1_name: 'Início da Operação',
        step1_desc: 'Data recomendada para iniciar o levantamento de dados.',
        step1_day: 1,
        step2_name: 'Janela de Produção',
        step2_desc: 'Período destinado à execução e revisão do processo.',
        step2_days: 5,
        step3_name: 'Envio ao Cliente',
        step3_desc: 'Data limite para entrega final ao cliente/setor.',
        step3_day: 10,
        step4_name: 'Vencimento Final',
        step4_desc: 'Prazo legal ou interno improrrogável.',
        step4_day: 15,
        manual_instrucoes: ''
    });

    useEffect(() => {
        fetchProcesses();
    }, []);

    const fetchProcesses = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('custom_processes')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setProcesses(data || []);
        } catch (error: any) {
            console.error('Error fetching processes:', error);
            toast.error('Erro ao carregar processos do banco de dados');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateOrUpdate = async () => {
        if (!formData.name) {
            toast.error('O nome do processo é obrigatório');
            return;
        }

        try {
            if (isEditing && selectedItem) {
                const { error } = await supabase
                    .from('custom_processes')
                    .update(formData)
                    .eq('id', selectedItem.id);

                if (error) throw error;
                toast.success('Processo atualizado com sucesso');
            } else {
                const { error } = await supabase
                    .from('custom_processes')
                    .insert([formData]);

                if (error) throw error;
                toast.success('Novo processo criado com sucesso');
            }
            
            fetchProcesses();
            setIsCreateModalOpen(false);
            resetForm();
        } catch (error: any) {
            console.error('Error saving process:', error);
            toast.error('Erro ao salvar no banco de dados: ' + error.message);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm('Tem certeza que deseja excluir este processo?')) {
            try {
                const { error } = await supabase
                    .from('custom_processes')
                    .delete()
                    .eq('id', id);

                if (error) throw error;
                toast.success('Processo removido');
                fetchProcesses();
            } catch (error: any) {
                toast.error('Erro ao excluir: ' + error.message);
            }
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            department: 'GERAL',
            step1_name: 'Início da Operação',
            step1_desc: 'Data recomendada para iniciar o levantamento de dados.',
            step1_day: 1,
            step2_name: 'Janela de Produção',
            step2_desc: 'Período destinado à execução e revisão do processo.',
            step2_days: 5,
            step3_name: 'Envio ao Cliente',
            step3_desc: 'Data limite para entrega final ao cliente/setor.',
            step3_day: 10,
            step4_name: 'Vencimento Final',
            step4_desc: 'Prazo legal ou interno improrrogável.',
            step4_day: 15,
            manual_instrucoes: ''
        });
        setIsEditing(false);
        setSelectedItem(null);
    };

    const handleEdit = (process: CustomProcess, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedItem(process);
        setFormData({
            name: process.name,
            department: process.department,
            step1_name: process.step1_name,
            step1_desc: process.step1_desc,
            step1_day: process.step1_day,
            step2_name: process.step2_name,
            step2_desc: process.step2_desc,
            step2_days: process.step2_days,
            step3_name: process.step3_name,
            step3_desc: process.step3_desc,
            step3_day: process.step3_day,
            step4_name: process.step4_name,
            step4_desc: process.step4_desc,
            step4_day: process.step4_day,
            manual_instrucoes: process.manual_instrucoes || ''
        });
        setIsEditing(true);
        setIsCreateModalOpen(true);
    };

    const filteredProcesses = useMemo(() => {
        return processes.filter(p => 
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.department.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [processes, searchTerm]);

    const getStatusStyles = (day: number) => {
        const today = new Date().getDate();
        const diff = day - today;
        if (diff < 0) return "bg-slate-400 text-white opacity-60";
        if (diff <= 3) return "bg-amber-500 text-white shadow-lg shadow-amber-500/20";
        return "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20";
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-1000 pb-20 pt-4">
            {/* Header */}
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h1 className="text-5xl font-extralight tracking-tight text-foreground">
                        Gestão de <span className="text-primary font-normal">Processos</span>
                    </h1>
                    <p className="text-xs font-normal text-muted-foreground uppercase tracking-[0.4em] mt-3 opacity-70">
                        {officeName} • Gestor de Fluxos Operacionais
                    </p>
                </div>

                <Button 
                    onClick={() => { resetForm(); setIsCreateModalOpen(true); }}
                    className="h-14 px-8 rounded-2xl bg-primary text-white shadow-xl shadow-primary/20 hover:scale-105 transition-all font-black uppercase tracking-widest text-[10px] flex items-center gap-3"
                >
                    <Plus className="h-4 w-4" />
                    Novo Processo Customizado
                </Button>
            </div>

            {/* Filter Area */}
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-card/40 backdrop-blur-md p-6 rounded-[2rem] border border-border/40">
                <div className="flex-1 w-full relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/30" />
                    <Input 
                        placeholder="Pesquisar por nome ou setor..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="h-14 rounded-2xl border-none bg-muted/20 pl-12 font-medium text-slate-700/80 focus-visible:ring-primary/20 placeholder:text-muted-foreground/40 transition-all"
                    />
                </div>
            </div>

            {/* Processes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {isLoading ? (
                    <div className="col-span-full py-32 flex flex-col items-center justify-center space-y-4 opacity-40">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        <p className="text-xs font-black uppercase tracking-widest">Carregando seus processos...</p>
                    </div>
                ) : filteredProcesses.length === 0 ? (
                    <div className="col-span-full py-32 bg-slate-50/50 rounded-[3rem] border border-dashed border-slate-200 flex flex-col items-center justify-center text-center opacity-40">
                        <ClipboardList className="h-20 w-20 stroke-[1px] mb-4" />
                        <h4 className="text-xl font-light uppercase tracking-widest">Nenhum processo montado</h4>
                        <p className="text-xs font-medium mt-2">Clique em "Novo Processo Customizado" para começar.</p>
                    </div>
                ) : (
                    filteredProcesses.map((item) => (
                        <Card key={item.id} className="group rounded-[2.5rem] border-white bg-white/60 hover:bg-white shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 ease-out overflow-hidden border cursor-pointer" onClick={() => { setSelectedItem(item); setIsDetailModalOpen(true); }}>
                            <CardHeader className="p-8 pb-0 space-y-4">
                                <div className="flex items-center justify-between mb-2">
                                    <Badge className="rounded-xl px-4 py-1.5 bg-slate-100 text-slate-500 border-none font-black text-[10px] uppercase tracking-widest">
                                        {item.department}
                                    </Badge>
                                    
                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/10 hover:text-primary" onClick={(e) => handleEdit(item, e)}>
                                            <Edit2 className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-600" onClick={(e) => handleDelete(item.id, e)}>
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                                
                                <div className="space-y-1">
                                    <CardTitle className="text-xl font-bold text-slate-800 group-hover:text-primary transition-colors leading-tight">
                                        {item.name}
                                    </CardTitle>
                                    <CardDescription className="text-xs font-medium uppercase tracking-[0.15em] text-slate-400 pt-1">
                                        Vencimento Final: Dia {item.step4_day}
                                    </CardDescription>
                                </div>
                            </CardHeader>

                            <CardContent className="p-8 pt-6 space-y-8">
                                <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                                <TrendingUp className="h-4 w-4 text-emerald-600" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none">{item.step1_name}</span>
                                                <span className="text-sm font-bold text-slate-900 mt-1">Dia {item.step1_day < 10 ? `0${item.step1_day}` : item.step1_day}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 text-right">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none">{item.step3_name}</span>
                                                <span className="text-sm font-bold text-slate-900 mt-1">Dia {item.step3_day < 10 ? `0${item.step3_day}` : item.step3_day}</span>
                                            </div>
                                            <div className="h-9 w-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                                <Send className="h-4 w-4 text-blue-600" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Progress line visualization */}
                                    <div className="relative pt-2 px-1">
                                        <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                                            <div className="h-full bg-primary rounded-full w-[40%]" />
                                        </div>
                                    </div>
                                </div>

                                <Button 
                                    variant="ghost" 
                                    className="w-full h-14 rounded-2xl bg-slate-50 hover:bg-primary/5 hover:text-primary transition-all duration-300 group/btn border border-slate-100/50"
                                >
                                    <div className="flex items-center justify-between w-full px-2">
                                        <span className="text-xs font-black uppercase tracking-widest">Visualizar Fluxo</span>
                                        <ChevronRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                                    </div>
                                </Button>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Modal de Criação/Edição */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent className="max-w-3xl rounded-[2.5rem] p-0 border-none shadow-2xl overflow-y-auto max-h-[90vh] animate-in slide-in-from-bottom-10 duration-500">
                    <DialogHeader className="p-10 bg-slate-50 border-b border-slate-100">
                        <DialogTitle className="text-3xl font-extralight tracking-tight text-slate-900">
                            {isEditing ? 'Editar' : 'Montar Novo'} <br/>
                            <strong className="font-bold">Processo Operacional</strong>
                        </DialogTitle>
                        <DialogDescription className="text-xs uppercase tracking-[0.2em] font-bold text-slate-400 mt-2">
                            Defina as etapas e prazos do seu fluxo customizado
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-10 space-y-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nome do Processo</label>
                                <Input 
                                    placeholder="Ex: Integração de Novos Clientes" 
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    className="h-14 rounded-2xl bg-slate-50 border-slate-200 font-bold"
                                />
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Setor / Departamento</label>
                                <Select 
                                    value={formData.department} 
                                    onValueChange={(value) => setFormData({...formData, department: value})}
                                >
                                    <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-slate-200 font-bold">
                                        <SelectValue placeholder="Selecione o Departamento" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-none shadow-2xl">
                                        <SelectItem value="GERAL">GERAL</SelectItem>
                                        <SelectItem value="FISCAL">FISCAL</SelectItem>
                                        <SelectItem value="CONTABIL">CONTABIL</SelectItem>
                                        <SelectItem value="FINANCEIRO">FINANCEIRO</SelectItem>
                                        <SelectItem value="QUALIDADE">QUALIDADE</SelectItem>
                                        <SelectItem value="DIRETORIA">DIRETORIA</SelectItem>
                                        <SelectItem value="DEPARTAMENTO PESSOAL">DEPARTAMENTO PESSOAL</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <h3 className="flex items-center gap-3 text-sm font-black uppercase tracking-[0.2em] text-primary">
                                <Settings2 className="h-5 w-5" />
                                Configuração das Etapas (Dias)
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-12">
                                {/* Step 1 */}
                                <div className="space-y-4 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                    <div className="flex items-center justify-between">
                                        <Badge className="bg-emerald-500 uppercase text-[9px] font-black tracking-widest">Etapa 1</Badge>
                                        <Input type="number" className="w-16 h-10 rounded-xl text-center font-black" value={formData.step1_day} onChange={e => setFormData({...formData, step1_day: parseInt(e.target.value)})} />
                                    </div>
                                    <Input placeholder="Título da Etapa" value={formData.step1_name} onChange={e => setFormData({...formData, step1_name: e.target.value})} className="border-none bg-transparent font-bold text-lg p-0 h-auto focus-visible:ring-0" />
                                    <Textarea placeholder="Breve descrição da etapa..." value={formData.step1_desc} onChange={e => setFormData({...formData, step1_desc: e.target.value})} className="min-h-[80px] bg-white border-slate-200 rounded-xl text-xs" />
                                </div>

                                {/* Step 2 */}
                                <div className="space-y-4 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                    <div className="flex items-center justify-between">
                                        <Badge className="bg-amber-500 uppercase text-[9px] font-black tracking-widest">Etapa 2</Badge>
                                        <Input type="number" className="w-16 h-10 rounded-xl text-center font-black" value={formData.step2_days} onChange={e => setFormData({...formData, step2_days: parseInt(e.target.value)})} />
                                    </div>
                                    <Input placeholder="Título da Etapa" value={formData.step2_name} onChange={e => setFormData({...formData, step2_name: e.target.value})} className="border-none bg-transparent font-bold text-lg p-0 h-auto focus-visible:ring-0" />
                                    <Textarea placeholder="Breve descrição da etapa..." value={formData.step2_desc} onChange={e => setFormData({...formData, step2_desc: e.target.value})} className="min-h-[80px] bg-white border-slate-200 rounded-xl text-xs" />
                                </div>

                                {/* Step 3 */}
                                <div className="space-y-4 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                    <div className="flex items-center justify-between">
                                        <Badge className="bg-blue-500 uppercase text-[9px] font-black tracking-widest">Etapa 3</Badge>
                                        <Input type="number" className="w-16 h-10 rounded-xl text-center font-black" value={formData.step3_day} onChange={e => setFormData({...formData, step3_day: parseInt(e.target.value)})} />
                                    </div>
                                    <Input placeholder="Título da Etapa" value={formData.step3_name} onChange={e => setFormData({...formData, step3_name: e.target.value})} className="border-none bg-transparent font-bold text-lg p-0 h-auto focus-visible:ring-0" />
                                    <Textarea placeholder="Breve descrição da etapa..." value={formData.step3_desc} onChange={e => setFormData({...formData, step3_desc: e.target.value})} className="min-h-[80px] bg-white border-slate-200 rounded-xl text-xs" />
                                </div>

                                {/* Step 4 */}
                                <div className="space-y-4 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                    <div className="flex items-center justify-between">
                                        <Badge className="bg-slate-900 uppercase text-[9px] font-black tracking-widest">Etapa 4</Badge>
                                        <Input type="number" className="w-16 h-10 rounded-xl text-center font-black" value={formData.step4_day} onChange={e => setFormData({...formData, step4_day: parseInt(e.target.value)})} />
                                    </div>
                                    <Input placeholder="Título da Etapa" value={formData.step4_name} onChange={e => setFormData({...formData, step4_name: e.target.value})} className="border-none bg-transparent font-bold text-lg p-0 h-auto focus-visible:ring-0" />
                                    <Textarea placeholder="Breve descrição da etapa..." value={formData.step4_desc} onChange={e => setFormData({...formData, step4_desc: e.target.value})} className="min-h-[80px] bg-white border-slate-200 rounded-xl text-xs" />
                                </div>
                            </div>
                        </div>

                        {/* Campo Manual/POP */}
                        <div className="space-y-6 bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                            <h3 className="flex items-center gap-3 text-sm font-black uppercase tracking-[0.2em] text-primary">
                                <FileText className="h-5 w-5" />
                                Procedimento Operacional Padrão (Passo a Passo)
                            </h3>
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Manual Detalhado de Execução</label>
                                <Textarea 
                                    placeholder="Descreva aqui o como fazer detalhado deste processo. Utilize este espaço para orientar o colaborador sobre ferramentas, acessos e particularidades..." 
                                    value={formData.manual_instrucoes}
                                    onChange={(e) => setFormData({...formData, manual_instrucoes: e.target.value})}
                                    className="min-h-[250px] rounded-3xl bg-white border-slate-200 font-medium text-sm p-6 focus-visible:ring-primary/20 leading-relaxed"
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-10 border-t border-slate-100">
                        <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)} className="h-14 px-8 rounded-2xl font-bold uppercase tracking-widest text-[10px]">Cancelar</Button>
                        <Button onClick={handleCreateOrUpdate} className="h-14 px-10 rounded-2xl bg-primary text-white shadow-xl shadow-primary/20 font-black uppercase tracking-widest text-[10px]">{isEditing ? 'Atualizar Processo' : 'Salvar Processo'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal de Detalhes (Igual ao de Vencimentos) */}
            <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
                <DialogContent className="sm:max-w-[600px] rounded-[2.5rem] p-0 border-none shadow-2xl overflow-y-auto max-h-[90vh] animate-in zoom-in-95 duration-300">
                    {selectedItem && (
                        <>
                            <DialogHeader className="p-10 bg-slate-50 border-b border-slate-100 relative">
                                <div className="absolute top-10 right-10">
                                    <div className={cn(
                                        "h-16 w-16 rounded-[1.5rem] flex items-center justify-center font-black text-2xl shadow-xl",
                                        getStatusStyles(selectedItem.step4_day)
                                    )}>
                                        {selectedItem.step4_day}
                                    </div>
                                </div>
                                <Badge className="w-fit mb-4 bg-primary/10 text-primary hover:bg-primary/10 border-none rounded-lg px-3 py-1 font-black text-[10px] uppercase tracking-widest">
                                    {selectedItem.department}
                                </Badge>
                                <DialogTitle className="text-3xl font-extralight tracking-tight text-slate-900 leading-tight pr-20">
                                    Fluxo de Processo:<br/>
                                    <strong className="font-bold">{selectedItem.name}</strong>
                                </DialogTitle>
                                <DialogDescription className="text-xs uppercase tracking-[0.2em] font-bold text-slate-400 mt-2">
                                    Análise detalhada do fluxo customizado
                                </DialogDescription>
                            </DialogHeader>

                            <div className="p-10 space-y-10">
                                {/* Visual Step Timeline */}
                                <div className="relative">
                                    <div className="absolute left-6 top-0 bottom-0 w-1 bg-slate-100 rounded-full" />
                                    
                                    <div className="space-y-10 relative">
                                        {/* Step 1 */}
                                        <div className="flex gap-6 items-start group">
                                            <div className="h-12 w-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center z-10 shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform duration-500">
                                                <CalendarCheck className="h-6 w-6" />
                                            </div>
                                            <div className="flex-1 pt-1">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="text-sm font-black uppercase tracking-widest text-slate-900">{selectedItem.step1_name}</h4>
                                                    <Badge variant="outline" className="rounded-lg border-emerald-500/20 text-emerald-600 bg-emerald-500/5 px-3">Dia {selectedItem.step1_day < 10 ? `0${selectedItem.step1_day}` : selectedItem.step1_day}</Badge>
                                                </div>
                                                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                                                    {selectedItem.step1_desc}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Step 2 */}
                                        <div className="flex gap-6 items-start group">
                                            <div className="h-12 w-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center z-10 shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform duration-500">
                                                <Hourglass className="h-6 w-6" />
                                            </div>
                                            <div className="flex-1 pt-1">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="text-sm font-black uppercase tracking-widest text-slate-900">{selectedItem.step2_name}</h4>
                                                    <Badge variant="outline" className="rounded-lg border-amber-500/20 text-amber-600 bg-amber-500/5 px-3">{selectedItem.step2_days} Dias de Janela</Badge>
                                                </div>
                                                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                                                    {selectedItem.step2_desc}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Step 3 */}
                                        <div className="flex gap-6 items-start group">
                                            <div className="h-12 w-12 rounded-2xl bg-blue-500 text-white flex items-center justify-center z-10 shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-500">
                                                <Send className="h-6 w-6" />
                                            </div>
                                            <div className="flex-1 pt-1">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="text-sm font-black uppercase tracking-widest text-slate-900">{selectedItem.step3_name}</h4>
                                                    <Badge variant="outline" className="rounded-lg border-blue-500/20 text-blue-600 bg-blue-500/5 px-3">Dia {selectedItem.step3_day < 10 ? `0${selectedItem.step3_day}` : selectedItem.step3_day}</Badge>
                                                </div>
                                                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                                                    {selectedItem.step3_desc}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Step 4 */}
                                        <div className="flex gap-6 items-start group">
                                            <div className="h-12 w-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center z-10 shadow-lg shadow-slate-900/20 group-hover:scale-110 transition-transform duration-500">
                                                <ArrowRightCircle className="h-6 w-6" />
                                            </div>
                                            <div className="flex-1 pt-1">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="text-sm font-black uppercase tracking-widest text-slate-900">{selectedItem.step4_name}</h4>
                                                    <Badge variant="outline" className="rounded-lg border-slate-900/20 text-slate-900 bg-slate-900/5 px-3">Dia {selectedItem.step4_day}</Badge>
                                                </div>
                                                <p className="text-xs text-slate-500 mt-2 leading-relaxed font-medium">
                                                    {selectedItem.step4_desc}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Manual/POP Section in Detail */}
                                {selectedItem.manual_instrucoes && (
                                    <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100 space-y-6">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                                <FileText className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black uppercase tracking-widest text-slate-900 leading-none">Manual de Operação</h4>
                                                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Procedimento Detalhado</p>
                                            </div>
                                        </div>
                                        <div className="bg-white p-6 rounded-2xl border border-slate-100/50">
                                            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap font-medium">
                                                {selectedItem.manual_instrucoes}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                    <DialogFooter className="p-8 pt-0">
                        <Button 
                            onClick={() => setIsDetailModalOpen(false)} 
                            className="w-full h-14 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 transition-all font-black uppercase tracking-widest text-xs"
                        >
                            Fechar Visualização
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Info Footer */}
            <div className="mt-12 bg-primary/5 border border-primary/10 rounded-[2.5rem] p-10 flex flex-col md:flex-row items-center gap-8">
                <div className="bg-white rounded-[2rem] h-20 w-20 flex items-center justify-center shadow-xl shadow-primary/5 flex-shrink-0">
                    <Info className="h-10 w-10 text-primary" />
                </div>
                <div className="space-y-3 text-center md:text-left">
                    <h4 className="text-lg font-bold text-slate-900 leading-none">O que é a Gestão de Processos?</h4>
                    <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">
                        Esta ferramenta permite que você crie seus próprios fluxos de trabalho personalizados, mantendo a mesma identidade visual dos vencimentos oficiais. 
                        Perfeito para processos internos, onboarding de clientes ou qualquer rotina que exija controle de prazos em 4 etapas.
                    </p>
                </div>
            </div>
        </div>
    );
}
