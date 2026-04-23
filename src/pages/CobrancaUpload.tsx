import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useClientPortal } from '@/hooks/useClientPortal';
import { useBranding } from '@/context/BrandingContext';
import {
    CloudUpload,
    CheckCircle2,
    Building2,
    ShieldCheck,
    CalendarClock,
    X,
    FileUp,
    Check
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function CobrancaUpload() {
    const { eventId } = useParams<{ eventId: string }>();
    const { uploadDocument } = useClientPortal();
    const { officeName, logoUrl } = useBranding();

    const [client, setClient] = useState<{ id: string, name: string } | null>(null);
    const [eventDetails, setEventDetails] = useState<{ month: string, status: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [uploadStatus, setUploadStatus] = useState<string>('');
    const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
    const [completed, setCompleted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function validateEvent() {
            try {
                // Fetch collection_events and join clients table to get names
                const { data, error } = await supabase
                    .from('collection_events')
                    .select('client_id, reference_month, status, clients(nome_fantasia)')
                    .eq('id', eventId)
                    .single();

                if (error || !data) throw new Error('Link de envio não encontrado ou inválido.');

                setClient({
                    id: data.client_id,
                    name: (data.clients as any).nome_fantasia
                });

                setEventDetails({
                    month: data.reference_month,
                    status: data.status
                });

                // Se já estiver como recebido, exibe o modal
                if (data.status === 'received') {
                    setCompleted(true);
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        validateEvent();
    }, [eventId]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0 || !client) return;

        try {
            setUploading(true);
            const total = files.length;
            const uploaded: string[] = [];

            for (let i = 0; i < total; i++) {
                const file = files[i];
                setUploadStatus(`Enviando ${i + 1} de ${total}: ${file.name}`);
                setProgress(Math.round(((i) / total) * 90));

                await uploadDocument({
                    file,
                    clientId: client.id,
                    category: 'outro',
                    type: 'entrada',
                    description: 'Enviado via Cobrança de Documentos - Mês: ' + (eventDetails?.month || '')
                });

                uploaded.push(file.name);
                setUploadedFiles([...uploaded]);
            }

            setProgress(95);
            setUploadStatus('Finalizando...');

            // Marca o evento como RECEBIDO somente após todos os arquivos enviados
            const { error: markError } = await supabase
                .from('collection_events')
                .update({
                    status: 'received',
                    received_at: new Date().toISOString()
                })
                .eq('id', eventId);

            if (markError) throw markError;

            setProgress(100);
            toast.success(`${total} arquivo(s) enviado(s) com sucesso para o escritório!`);

            // Abre o modal de sucesso
            setCompleted(true);

        } catch (err) {
            toast.error('Erro ao enviar arquivo. Tente novamente.');
        } finally {
            setUploading(false);
            setUploadStatus('');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center animate-pulse">
                        <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Validando Link Seguro...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <Card className="max-w-md w-full p-10 rounded-[2.5rem] border-none shadow-xl text-center space-y-6 bg-white">
                    <div className="h-20 w-20 rounded-[2rem] bg-red-50 text-red-500 flex items-center justify-center mx-auto shadow-sm">
                        <X className="h-10 w-10" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Ops! Acesso Bloqueado</h2>
                        <p className="text-sm text-slate-500 mt-2">{error}</p>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 sm:p-10 font-sans">
            <div className="max-w-xl w-full space-y-8 animate-in slide-in-from-bottom duration-1000">

                {/* Branding Header */}
                <div className="flex flex-col items-center gap-4">
                    <div className="h-16 w-16 rounded-3xl bg-primary shadow-2xl shadow-primary/30 flex items-center justify-center text-white overflow-hidden p-3 transform transition-transform hover:scale-105 duration-300">
                        {logoUrl ? <img src={logoUrl} className="h-full w-full object-contain" /> : <CloudUpload className="h-8 w-8" />}
                    </div>
                    <div className="text-center">
                        <h1 className="text-xl font-black uppercase text-slate-800 tracking-tight leading-none">{officeName}</h1>
                        <p className="text-[9px] uppercase font-bold text-slate-400 tracking-[0.4em] mt-2">Remessa Mensal de Documentos</p>
                    </div>
                </div>

                <Card className="p-8 sm:p-12 rounded-[3.5rem] border-none shadow-2xl bg-white overflow-hidden relative">
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary/10 via-primary to-primary/10" />

                    <div className="space-y-8">
                        <div className="flex items-start gap-5 p-6 rounded-3xl bg-slate-50 border border-slate-100 shadow-sm transition-all duration-300 hover:shadow-md">
                            <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-primary shrink-0 border border-slate-100">
                                <Building2 className="h-6 w-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Enviando pelo cliente:</p>
                                <h3 className="text-sm font-bold text-slate-700 truncate mt-0.5">{client?.name}</h3>
                            </div>
                        </div>

                        <div className="text-center space-y-3">
                            <h2 className="text-xl font-light text-slate-800 uppercase tracking-tight">
                                ENVIE SEUS DOCUMENTOS CONTÁBEIS - <span className="text-primary font-bold">
                                    {eventDetails?.month ? ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'][parseInt(eventDetails.month.split('-')[1], 10) - 1] : ''}
                                </span>
                            </h2>
                            <p className="text-xs text-slate-400 font-medium px-4">Por favor, envie seus extratos, XMLs de notas e outros documentos referentes ao período solicitado.</p>
                        </div>

                        <div className="relative group">
                            <label className={cn(
                                "flex flex-col items-center justify-center w-full min-h-[220px] rounded-[2.5rem] border-2 border-dashed transition-all duration-500 cursor-pointer overflow-hidden p-8",
                                uploading ? "border-primary/20 bg-slate-50 pointer-events-none" : "border-slate-100 bg-white hover:bg-slate-50/50 hover:border-primary/20"
                            )}>
                                {uploading ? (
                                    <div className="flex flex-col items-center gap-6 w-full max-w-[280px]">
                                        <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg animate-bounce">
                                            <FileUp className="h-7 w-7" />
                                        </div>
                                        <div className="w-full space-y-3">
                                            <Progress value={progress} className="h-1.5 bg-slate-100" />
                                            <p className="text-[10px] uppercase font-black tracking-widest text-primary animate-pulse text-center">{uploadStatus || 'Processando...'}</p>
                                            {uploadedFiles.length > 0 && (
                                                <div className="mt-2 space-y-1">
                                                    {uploadedFiles.map((name, i) => (
                                                        <div key={i} className="flex items-center gap-2 text-[9px] text-emerald-600 font-bold">
                                                            <Check className="h-3 w-3 shrink-0" />
                                                            <span className="truncate">{name}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center text-center space-y-5">
                                        <div className="h-20 w-20 rounded-[2rem] bg-slate-50 text-slate-300 flex items-center justify-center shadow-inner group-hover:scale-110 group-hover:text-primary group-hover:bg-primary/5 transition-all duration-500">
                                            <CloudUpload className="h-10 w-10" />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-black uppercase text-slate-700 tracking-wider">Clique ou arraste um PDF Seguro</p>
                                            <p className="text-[9px] uppercase font-bold text-slate-300 tracking-[0.2em] mt-2">Dica: Você pode selecionar vários arquivos de uma vez</p>
                                        </div>
                                        <input type="file" multiple className="hidden" onChange={handleFileChange} />
                                    </div>
                                )}
                            </label>
                        </div>

                        <div className="flex items-center justify-between pt-4">
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-300">
                                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                                Conexão Segura
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-300">
                                <CalendarClock className="h-4 w-4" />
                                Envio Oficial Simplificado
                            </div>
                        </div>
                    </div>
                </Card>

                <div className="text-center opacity-40 hover:opacity-100 transition-opacity">
                    <p className="text-[10px] uppercase font-black tracking-[0.4em] text-slate-400">
                        Plataforma Gerenciada por <span className="text-primary">{officeName} &copy;</span>
                    </p>
                </div>
            </div>

            {/* Modal de Sucesso */}
            <Dialog
                open={completed}
                onOpenChange={(open) => {
                    if (!open) {
                        setCompleted(false);
                    }
                }}
            >
                <DialogContent size="md" className="p-10 pb-12 text-center sm:max-w-lg flex flex-col items-center">
                    <div className="flex flex-col items-center animate-in zoom-in duration-500">
                        <div className="h-24 w-24 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shadow-inner relative mb-6">
                            <Check className="h-12 w-12" />
                            <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20 animate-ping" />
                        </div>
                        <DialogTitle className="text-2xl font-bold pr-0 text-slate-800 mb-2">ARQUIVOS ENVIADOS COM SUCESSO!</DialogTitle>
                        <div className="text-sm text-slate-500 leading-relaxed max-w-sm mt-2">
                            Os arquivos foram encaminhados com sucesso para A JLVIANA Consultoria Contábil.
                            <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                <strong className="text-slate-700">Muito obrigado por enviar seus arquivos!</strong>
                            </div>
                        </div>

                        <Button
                            variant="default"
                            className="mt-8 rounded-2xl shadow-lg h-12 w-full font-black uppercase text-[11px] tracking-widest"
                            onClick={() => {
                                setCompleted(false);
                                // Removemos o window.location.reload() daqui!
                            }}
                        >
                            FECHAR
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

