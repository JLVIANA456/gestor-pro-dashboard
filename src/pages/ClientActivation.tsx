import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useBranding } from '@/context/BrandingContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { 
    ShieldCheck, 
    Lock, 
    Mail, 
    CheckCircle2, 
    Building2,
    ArrowRight,
    Loader2
} from 'lucide-react';

export default function ClientActivation() {
    const { token } = useParams();
    const navigate = useNavigate();
    const { officeName, logoUrl } = useBranding();
    
    const [loading, setLoading] = useState(true);
    const [invitation, setInvitation] = useState<any>(null);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [activating, setActivating] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const validateToken = async () => {
            if (!token) return;
            
            const { data, error } = await (supabase.from('client_portal_invites') as any)
                .select('*, clients(nome_fantasia, razao_social)')
                .eq('token', token)
                .eq('is_used', false)
                .single();
            
            if (error || !data) {
                toast.error("Convite inválido ou expirado.");
                setLoading(false);
                return;
            }
            
            setInvitation(data);
            setLoading(false);
        };
        validateToken();
    }, [token]);

    const handleActivate = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (password.length < 6) {
            toast.error("A senha deve ter pelo menos 6 caracteres.");
            return;
        }

        if (password !== confirmPassword) {
            toast.error("As senhas não coincidem.");
            return;
        }

        try {
            setActivating(true);
            
            // 1. Criar usuário no Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: invitation.email,
                password: password,
                options: {
                    data: {
                        name: invitation.clients?.nome_fantasia || invitation.email.split('@')[0],
                    }
                }
            });

            if (authError) throw authError;

            const userId = authData.user?.id;
            if (!userId) throw new Error("Erro ao criar usuário.");

            // 2. Vincular na tabela client_portal_users
            const { error: linkError } = await (supabase.from('client_portal_users') as any)
                .insert({
                    user_id: userId,
                    client_id: invitation.client_id
                });

            if (linkError) throw linkError;

            // 3. Marcar convite como usado
            await (supabase.from('client_portal_invites') as any)
                .update({ is_used: true })
                .eq('id', invitation.id);

            setSuccess(true);
            toast.success("Portal ativado com sucesso!");
            
            // Redirect after 3 seconds
            setTimeout(() => navigate('/'), 3000);
            
        } catch (error: any) {
            console.error("Activation Error:", error);
            toast.error("Erro na ativação: " + error.message);
        } finally {
            setActivating(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
            </div>
        );
    }

    if (!invitation && !success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <Card className="max-w-md w-full p-10 rounded-[3rem] text-center space-y-6">
                    <div className="h-20 w-20 rounded-3xl bg-red-50 text-red-500 flex items-center justify-center mx-auto">
                        <Lock className="h-10 w-10" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Convite Inválido</h1>
                    <p className="text-sm text-slate-500">Este link de ativação não é mais válido ou já foi utilizado.</p>
                    <Button onClick={() => navigate('/')} className="w-full rounded-2xl h-12 bg-primary text-white font-black uppercase text-[10px] tracking-widest">
                        Voltar ao Início
                    </Button>
                </Card>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <Card className="max-w-md w-full p-12 rounded-[4rem] text-center space-y-8 animate-in zoom-in duration-500">
                    <div className="h-24 w-24 rounded-[2rem] bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto shadow-inner">
                        <CheckCircle2 className="h-12 w-12" />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-3xl font-light text-slate-800 tracking-tight">Tudo <span className="text-emerald-500 font-medium">Pronto!</span></h1>
                        <p className="text-sm text-slate-500">Seu acesso ao portal foi configurado com sucesso.</p>
                    </div>
                    <p className="text-[10px] uppercase font-black text-slate-400 tracking-[0.3em]">Redirecionando você...</p>
                    <Button onClick={() => navigate('/')} className="w-full rounded-2xl h-14 bg-emerald-500 text-white font-black uppercase text-[10px] tracking-widest hover:bg-emerald-600 shadow-xl shadow-emerald-200">
                        Acessar Portal Agora
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
            
            <div className="max-w-xl w-full space-y-8 relative">
                <div className="text-center space-y-4">
                    {logoUrl ? (
                        <img src={logoUrl} alt={officeName} className="h-16 mx-auto mb-6" />
                    ) : (
                        <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <Building2 className="h-8 w-8 text-primary" />
                        </div>
                    )}
                    <Badge variant="outline" className="bg-white border-slate-100 text-[10px] font-black uppercase tracking-[0.2em] py-1.5 px-4 rounded-full">
                        Ativação de Hub do Cliente
                    </Badge>
                    <h1 className="text-4xl font-light tracking-tight text-slate-800">
                        Seja bem-vindo, <br />
                        <span className="font-medium text-primary">{invitation.clients?.nome_fantasia || invitation.clients?.razao_social}</span>
                    </h1>
                </div>

                <Card className="p-10 rounded-[3.5rem] border-none shadow-2xl shadow-primary/5 bg-white space-y-8">
                    <div className="space-y-2">
                        <p className="text-[11px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                            <Mail className="h-4 w-4 text-primary" /> Seu e-mail de acesso
                        </p>
                        <p className="text-lg font-bold text-slate-700 ml-6">{invitation.email}</p>
                    </div>

                    <form onSubmit={handleActivate} className="space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Crie sua Senha</label>
                                <div className="relative group">
                                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-primary transition-colors" />
                                    <Input 
                                        type="password"
                                        placeholder="No mínimo 6 caracteres"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="h-16 rounded-[1.5rem] pl-14 bg-slate-50 border-slate-100 text-sm focus-visible:ring-primary/20"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Confirme sua Senha</label>
                                <div className="relative group">
                                    <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-primary transition-colors" />
                                    <Input 
                                        type="password"
                                        placeholder="Repita a senha criada"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="h-16 rounded-[1.5rem] pl-14 bg-slate-50 border-slate-100 text-sm focus-visible:ring-primary/20"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-4">
                            <Button 
                                type="submit"
                                disabled={activating}
                                className="w-full h-16 rounded-[1.8rem] bg-primary text-white font-black uppercase text-xs tracking-widest shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                            >
                                {activating ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        Ativando Portal...
                                    </>
                                ) : (
                                    <>
                                        Finalizar e Acessar
                                        <ArrowRight className="h-5 w-5" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </Card>

                <p className="text-center text-[10px] uppercase font-black text-slate-400 tracking-widest opacity-60">
                    &copy; 2026 {officeName} • Gestão Profissional
                </p>
            </div>
        </div>
    );
}

// Small badge component wrapper as it may not be globally available in all contexts clearly
function Badge({ children, variant, className }: any) {
    return (
        <span className={cn(
            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
            variant === 'outline' ? "border border-slate-200" : "bg-primary/10 text-primary",
            className
        )}>
            {children}
        </span>
    );
}
