import { useState, useMemo } from 'react';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { 
    Building2, 
    Calendar, 
    FileText, 
    Search, 
    Download, 
    Eye, 
    Trash2, 
    Plus,
    CheckCircle2,
    AlertCircle,
    Paperclip,
    Loader2,
    X
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { AccountingGuide, useDeliveryList } from '@/hooks/useDeliveryList';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { NewGuideDialog } from './NewGuideDialog';

interface ClientGuidesModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    client: any;
    referenceMonth: string;
    guides: AccountingGuide[];
    onUpdate: () => void;
}

export function ClientGuidesModal({ 
    open, 
    onOpenChange, 
    client, 
    referenceMonth, 
    guides, 
    onUpdate 
}: ClientGuidesModalProps) {
    const { updateGuide, deleteGuide, deleteGuidesBulk } = useDeliveryList(referenceMonth);
    const [guideSearch, setGuideSearch] = useState('');
    const [isNewGuideOpen, setIsNewGuideOpen] = useState(false);

    const filteredGuides = useMemo(() => {
        return guides.filter(g => 
            g.type.toLowerCase().includes(guideSearch.toLowerCase())
        );
    }, [guides, guideSearch]);

    const groupedGuides = useMemo(() => {
        return {
            pending: filteredGuides.filter(g => !g.file_url && g.status === 'pending'),
            ready: filteredGuides.filter(g => g.file_url && g.status === 'pending'),
            completed: filteredGuides.filter(g => g.status === 'completed' || g.status === 'sent' || g.status === 'scheduled')
        };
    }, [filteredGuides]);

    const handleDelete = async (id: string) => {
        if (!confirm('Deseja excluir esta tarefa?')) return;
        await deleteGuide(id);
        onUpdate();
    };

    const handleUpdateStatus = async (guide: AccountingGuide) => {
        const isCompleted = guide.status === 'completed' || guide.status === 'sent';
        const newStatus = isCompleted ? 'pending' : 'completed';
        
        try {
            if (newStatus === 'completed') {
                await updateGuide(guide.id, {
                    status: 'completed',
                    justification: 'Baixa manual via Visão Geral do Cliente',
                    completed_at: new Date().toISOString(),
                    completed_by: 'Usuário'
                });
                toast.success(`Tarefa "${guide.type}" baixada com sucesso!`);
            } else {
                try {
                    await updateGuide(guide.id, {
                        status: 'pending',
                        justification: null,
                        completed_at: null,
                        completed_by: null,
                        sent_at: null,
                        delivered_at: null,
                        opened_at: null
                    });
                    toast.success("Baixa desfeita com sucesso.");
                } catch (error) {
                    console.error('Erro no estorno:', error);
                    toast.error("Falha ao desfazer a baixa.");
                }
            }
            onUpdate();
        } catch (error) {
            console.error('Erro na atualização de status:', error);
            toast.error("Falha ao atualizar status.");
        }
    };

    const renderGuideItem = (guide: any) => {
        const isCompleted = guide.status === 'completed' || guide.status === 'sent';
        
        return (
            <div 
                key={guide.id}
                className={cn(
                    "group relative flex flex-col sm:flex-row sm:items-center justify-between p-6 rounded-[2.5rem] border transition-all duration-500",
                    isCompleted 
                        ? "bg-emerald-500/[0.02] border-emerald-500/10 hover:border-emerald-500/30" 
                        : "bg-white/40 border-border/40 hover:border-red-500/30 shadow-sm"
                )}
            >
                <div className="flex items-center gap-6 flex-1 min-w-0">
                    <div className={cn(
                        "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 duration-500",
                        isCompleted ? "bg-emerald-100 text-emerald-600 shadow-sm" : "bg-red-50 text-red-600 shadow-sm border border-red-100/50"
                    )}>
                        {isCompleted ? <CheckCircle2 className="h-6 w-6" /> : <FileText className="h-6 w-6" />}
                    </div>
                    
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3 mb-1">
                            <h4 className={cn("text-sm font-bold truncate", isCompleted ? "text-slate-400" : "text-foreground")}>{guide.type}</h4>
                            {isCompleted ? (
                                <Badge variant="outline" className="bg-emerald-500/5 text-emerald-600 border-none text-[8px] uppercase font-black px-2 py-0">
                                    Concluído
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="bg-red-500/5 text-red-600 border-none text-[8px] uppercase font-black px-2 py-0 animate-pulse">
                                    Pendente
                                </Badge>
                            )}
                        </div>
                        <div className="flex items-center gap-4 text-[10px] text-muted-foreground/60 font-bold uppercase tracking-widest leading-none">
                            <span>Venc: {guide.due_date ? format(parseISO(guide.due_date), 'dd/MM/yyyy') : '---'}</span>
                            <div className="w-1 h-1 rounded-full bg-border" />
                            <span>Comp: {guide.competency || referenceMonth}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 mt-4 sm:mt-0">
                    {guide.file_url && (
                        <div className="flex items-center gap-2 mr-2">
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-10 w-10 rounded-xl hover:text-primary hover:bg-primary/5"
                                asChild
                            >
                                <a href={guide.file_url} target="_blank" rel="noopener noreferrer">
                                    <Eye className="h-4 w-4" />
                                </a>
                            </Button>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-10 w-10 rounded-xl hover:text-primary hover:bg-primary/5"
                                onClick={() => {
                                    const link = document.createElement('a');
                                    link.href = guide.file_url!;
                                    link.download = `${guide.type}_${client.nomeFantasia}.pdf`;
                                    link.click();
                                }}
                            >
                                <Download className="h-4 w-4" />
                            </Button>
                        </div>
                    )}


                    {isCompleted ? (
                        <Button
                            variant="ghost" 
                            size="sm"
                            disabled={guide.is_virtual}
                            onClick={() => handleUpdateStatus(guide)}
                            className="h-10 px-6 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100"
                        >
                            DESFAZER BAIXA
                        </Button>
                    ) : (
                        <Button 
                            size="sm"
                            onClick={async () => {
                                if (guide.is_virtual) {
                                    toast.info("Tarefa não gerada no ciclo. Gerando agora...");
                                    toast.error("Para baixar uma tarefa não gerada, use a aba 'Lista de Demandas'.");
                                } else {
                                    handleUpdateStatus(guide as any);
                                }
                            }}
                            className="h-10 px-6 rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20 text-[9px] font-black uppercase tracking-widest"
                        >
                            BAIXAR A TAREFA
                        </Button>
                    )}

                    {!guide.is_virtual && (
                        <>
                            <div className="w-px h-6 bg-border/40 mx-1" />
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-10 w-10 rounded-xl hover:text-destructive hover:bg-destructive/5"
                                onClick={() => handleDelete(guide.id)}
                            >
                                <Trash2 className="h-4 w-4 opacity-40" />
                            </Button>
                        </>
                    )}
                </div>
            </div>
        );
    };

    if (!client) return null;

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col p-0 rounded-[3rem] border-none shadow-2xl bg-card">
                    <DialogHeader className="p-10 pb-6 bg-primary/[0.01] border-b border-border/10">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                                <div className="flex items-center gap-6">
                                    <div className="h-16 w-16 rounded-3xl bg-card border border-border/40 shadow-sm flex items-center justify-center">
                                        <Building2 className="h-8 w-8 text-primary opacity-60" />
                                    </div>
                                    <div>
                                        <DialogTitle className="text-3xl font-light text-foreground">{client.nomeFantasia || client.razaoSocial}</DialogTitle>
                                        <DialogDescription className="text-[10px] uppercase font-bold tracking-[0.3em] mt-2 flex items-center gap-3">
                                            <Calendar className="h-3 w-3 opacity-30 text-primary" />
                                            Mês de Referência: <span className="text-primary/70">{format(parseISO(`${referenceMonth}-01`), 'MMMM / yyyy', { locale: ptBR })}</span>
                                        </DialogDescription>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Button 
                                        onClick={() => setIsNewGuideOpen(true)}
                                        className="rounded-[1.25rem] h-12 px-8 gap-3 text-[10px] uppercase font-black tracking-widest shadow-lg shadow-primary/10 bg-primary text-white"
                                    >
                                        <Plus className="h-4 w-4" /> Nova Tarefa
                                    </Button>
                                </div>
                            </div>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto p-10 space-y-12">
                        {/* Search & Bulk Actions Bar */}
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
                            <div className="relative w-full max-w-md">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30" />
                                <Input
                                    placeholder="Buscar obrigação..."
                                    value={guideSearch}
                                    onChange={(e) => setGuideSearch(e.target.value)}
                                    className="h-12 pl-12 rounded-2xl border-border/30 bg-muted/20 text-sm font-light w-full focus-visible:ring-primary/20"
                                />
                            </div>
                            
                            <Button 
                                variant="ghost"
                                onClick={async () => {
                                    if (!confirm('Deseja excluir todas as tarefas visíveis deste cliente?')) return;
                                    const ids = filteredGuides.map(g => g.id);
                                    await deleteGuidesBulk(ids);
                                    onUpdate();
                                }}
                                className="rounded-xl text-[10px] uppercase font-bold tracking-widest text-destructive/40 hover:text-destructive hover:bg-destructive/5 gap-2 h-12 px-6"
                            >
                                <Trash2 className="h-4 w-4" /> Limpar Lista
                            </Button>
                        </div>

                        {/* Guides List Sections */}
                        {filteredGuides.length === 0 ? (
                            <div className="py-32 flex flex-col items-center justify-center text-center opacity-20 border-2 border-dashed border-border/40 rounded-[3rem]">
                                <FileText className="h-20 w-20 mb-6" />
                                <p className="text-xl font-light">Nenhuma tarefa encontrada.</p>
                                <p className="text-[10px] uppercase tracking-[0.3em] mt-4">As tarefas aparecerão aqui após serem geradas ou criadas.</p>
                            </div>
                        ) : (
                            <div className="space-y-12">
                                {/* PENDENTES (Falta Arquivo) */}
                                {groupedGuides.pending.length > 0 && (
                                    <div className="space-y-6">
                                        <h3 className="text-[10px] uppercase font-black tracking-[0.3em] text-amber-500/60 flex items-center gap-3 ml-4">
                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                            Falta Anexar Guia ({groupedGuides.pending.length})
                                        </h3>
                                        <div className="grid grid-cols-1 gap-4">
                                            {groupedGuides.pending.map(renderGuideItem)}
                                        </div>
                                    </div>
                                )}

                                {/* PRONTAS (Com arquivo mas não enviadas) */}
                                {groupedGuides.ready.length > 0 && (
                                    <div className="space-y-6">
                                        <h3 className="text-[10px] uppercase font-black tracking-[0.3em] text-primary/60 flex items-center gap-3 ml-4">
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                            Aguardando Envio em Lote ({groupedGuides.ready.length})
                                        </h3>
                                        <div className="grid grid-cols-1 gap-4">
                                            {groupedGuides.ready.map(renderGuideItem)}
                                        </div>
                                    </div>
                                )}

                                {/* CONCLUÍDAS */}
                                {groupedGuides.completed.length > 0 && (
                                    <div className="space-y-6">
                                        <h3 className="text-[10px] uppercase font-black tracking-[0.3em] text-emerald-500/60 flex items-center gap-3 ml-4">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                            Concluídas / Enviadas ({groupedGuides.completed.length})
                                        </h3>
                                        <div className="grid grid-cols-1 gap-4 opacity-70">
                                            {groupedGuides.completed.map(renderGuideItem)}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="p-10 border-t border-border/10 bg-muted/5 flex items-center justify-between">
                        <p className="text-[10px] text-muted-foreground/60 uppercase font-bold tracking-[0.2em] flex items-center gap-3">
                            <AlertCircle className="h-4 w-4 opacity-40 text-primary" />
                            Use a tela principal para realizar o envio inteligente em lote.
                        </p>
                        <Button 
                            variant="outline" 
                            onClick={() => onOpenChange(false)}
                            className="rounded-2xl h-14 px-10 text-[10px] uppercase font-black tracking-widest border-border/40 hover:bg-card"
                        >
                            Fechar Visão Geral
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <NewGuideDialog 
                open={isNewGuideOpen}
                onOpenChange={setIsNewGuideOpen}
                clientId={client.id}
                referenceMonth={referenceMonth}
                onSuccess={onUpdate}
            />
        </>
    );
}
