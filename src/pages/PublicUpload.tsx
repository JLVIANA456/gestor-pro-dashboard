import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useClientPortal } from '@/hooks/useClientPortal';
import { useBranding } from '@/context/BrandingContext';
import { 
    CloudUpload, 
    CheckCircle2, 
    FileText, 
    Building2, 
    ShieldCheck, 
    Clock, 
    X,
    FileUp,
    Check
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function PublicUpload() {
    const { token } = useParams<{ token: string }>();
    const { uploadDocument } = useClientPortal();
    const { officeName, logoUrl } = useBranding();
    
    const [client, setClient] = useState<{ id: string, name: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [completed, setCompleted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function validateToken() {
            try {
                const { data, error } = await supabase
                    .from('client_upload_tokens')
                    .select('client_id, expires_at, clients(nome_fantasia)')
                    .eq('token', token)
                    .single();

                if (error || !data) throw new Error('Link inválido ou expirado');

                const isExpired = new Date(data.expires_at) < new Date();
                if (isExpired) throw new Error('Este link de envio expirou');

                setClient({
                    id: data.client_id,
                    name: (data.clients as any).nome_fantasia
                });
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        validateToken();
    }, [token]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !client) return;

        try {
            setUploading(true);
            setProgress(30);
            
            await uploadDocument({
                file,
                clientId: client.id,
                category: 'outro',
                type: 'entrada',
                description: 'Enviado via link público'
            });

            setProgress(100);
            setCompleted(true);
            toast.success('Arquivo enviado com sucesso!');
        } catch (err) {
            toast.error('Erro ao enviar arquivo');
        } finally {
            setUploading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center animate-pulse">
                        <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Validando Link...</span>
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
                        <h2 className="text-xl font-bold text-slate-800">Ops! Link Inválido</h2>
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
                        <p className="text-[9px] uppercase font-bold text-slate-400 tracking-[0.4em] mt-2">Upload Seguro de Documentos</p>
                    </div>
                </div>

                <Card className="p-8 sm:p-12 rounded-[3.5rem] border-none shadow-2xl bg-white overflow-hidden relative">
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary/10 via-primary to-primary/10" />
                    
                    {completed ? (
                        <div className="flex flex-col items-center text-center space-y-6 py-10 animate-in zoom-in duration-500">
                            <div className="h-24 w-24 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shadow-inner relative">
                                <Check className="h-12 w-12" />
                                <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20 animate-ping" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800">Tudo Pronto!</h2>
                                <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                                    Seu arquivo foi enviado com sucesso para a equipe da <br/>
                                    <strong>{officeName}</strong>.
                                </p>
                            </div>
                            <Button variant="outline" className="rounded-2xl border-slate-100 h-12 px-8 font-black uppercase text-[10px] tracking-widest text-slate-400" onClick={() => window.location.reload()}>
                                Enviar outro arquivo
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            <div className="flex items-start gap-5 p-6 rounded-3xl bg-slate-50 border border-slate-100 shadow-sm transition-all duration-300 hover:shadow-md">
                                <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-primary shrink-0 border border-slate-100">
                                    <Building2 className="h-6 w-6" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Enviando para:</p>
                                    <h3 className="text-sm font-bold text-slate-700 truncate mt-0.5">{client?.name}</h3>
                                </div>
                            </div>

                            <div className="text-center space-y-3">
                                <h2 className="text-2xl font-light text-slate-800">Selecione seu <span className="text-primary font-bold">Arquivo</span></h2>
                                <p className="text-xs text-slate-400 font-medium">Você pode enviar extratos bancários, notas fiscais ou qualquer documento contábil.</p>
                            </div>

                            <div className="relative group">
                                <label className={cn(
                                    "flex flex-col items-center justify-center w-full min-h-[220px] rounded-[2.5rem] border-2 border-dashed transition-all duration-500 cursor-pointer overflow-hidden p-8",
                                    uploading ? "border-primary/20 bg-slate-50 pointer-events-none" : "border-slate-100 bg-white hover:bg-slate-50/50 hover:border-primary/20"
                                )}>
                                    {uploading ? (
                                        <div className="flex flex-col items-center gap-6 w-full max-w-[240px]">
                                            <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg animate-bounce">
                                                <FileUp className="h-7 w-7" />
                                            </div>
                                            <div className="w-full space-y-3">
                                                <Progress value={progress} className="h-1.5 bg-slate-100" />
                                                <p className="text-[10px] uppercase font-black tracking-widest text-primary animate-pulse text-center">Enviando Documento...</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center text-center space-y-5">
                                            <div className="h-20 w-20 rounded-[2rem] bg-slate-50 text-slate-300 flex items-center justify-center shadow-inner group-hover:scale-110 group-hover:text-primary group-hover:bg-primary/5 transition-all duration-500">
                                                <CloudUpload className="h-10 w-10" />
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-black uppercase text-slate-700 tracking-wider">Clique para escolher ou arraste aqui</p>
                                                <p className="text-[9px] uppercase font-bold text-slate-300 tracking-[0.2em] mt-2">Formatos aceitos: PDF, XML, JPG até 10MB</p>
                                            </div>
                                            <input type="file" className="hidden" onChange={handleFileChange} />
                                        </div>
                                    )}
                                </label>
                            </div>

                            <div className="flex items-center justify-between pt-4">
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-300">
                                    <ShieldCheck className="h-4 w-4" />
                                    Criptografado
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-300">
                                    <Clock className="h-4 w-4" />
                                    Expira em {token ? '48h' : '---'}
                                </div>
                            </div>
                        </div>
                    )}
                </Card>

                <div className="text-center opacity-40 hover:opacity-100 transition-opacity">
                    <p className="text-[10px] uppercase font-black tracking-[0.4em] text-slate-400">
                         Segurança Garantida por <span className="text-primary">{officeName} &copy;</span>
                    </p>
                </div>
            </div>
        </div>
    );
}
