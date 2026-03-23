import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Building2, Lock, Mail, ArrowRight, Loader2, Fingerprint } from 'lucide-react';
import { useBranding } from '@/context/BrandingContext';

export default function Login() {
  const { officeName, logoUrl } = useBranding();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error('Credenciais inválidas ou erro de conexão.');
      } else if (data.user) {
        toast.success('Bem-vindo ao sistema!');
      }
    } catch (err: any) {
      toast.error('Ocorreu um erro inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFF] flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Dynamic Background Elements - Premium Feel */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] animate-pulse duration-[10s]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] animate-pulse duration-[8s]" />
        
        {/* Subtle Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      <Card className="max-w-[480px] w-full border border-white/40 shadow-[0_40px_100px_-15px_rgba(0,0,0,0.08)] rounded-[3.5rem] bg-white/70 backdrop-blur-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-1000">
        <CardHeader className="pt-20 pb-12 text-center space-y-10">
          <div className="flex justify-center relative">
            <div className="absolute inset-0 m-auto h-32 w-32 bg-primary/10 rounded-[3rem] animate-ping opacity-20 duration-[3s]" />
            <div className="relative h-28 w-28 rounded-[2.8rem] bg-white flex items-center justify-center text-primary shadow-2xl shadow-primary/10 ring-1 ring-slate-100 transition-all hover:scale-105 duration-500">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="h-full w-full object-contain p-4" />
              ) : (
                <Building2 className="h-12 w-12" />
              )}
            </div>
          </div>
          
          <div className="space-y-3 px-8">
            <CardTitle className="text-4xl font-extralight text-slate-900 tracking-tighter leading-tight">
              JLVIANA <span className="text-primary font-medium">Consultoria</span>
            </CardTitle>
            <div className="flex items-center justify-center gap-3">
                <div className="h-px w-8 bg-slate-200" />
                <CardDescription className="text-slate-400 font-bold uppercase tracking-[0.4em] text-[8px] whitespace-nowrap opacity-80">
                    Consultoria contábil
                </CardDescription>
                <div className="h-px w-8 bg-slate-200" />
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-16 pb-20">
          <form onSubmit={handleLogin} className="space-y-8">
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-[0.3em] ml-2">Login de Usuário</label>
                <div className="group relative">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-primary transition-colors" />
                  <Input 
                    type="email" 
                    placeholder="E-mail de acesso" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-16 pl-14 rounded-2xl border-slate-100 bg-white/50 focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all font-medium text-slate-600 placeholder:text-slate-300 shadow-sm"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between px-2">
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-[0.3em]">Senha do Usuário</label>
                </div>
                <div className="group relative">
                  <Fingerprint className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-primary transition-colors" />
                  <Input 
                    type="password" 
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-16 pl-14 rounded-2xl border-slate-100 bg-white/50 focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all font-medium text-slate-600 placeholder:text-slate-300 shadow-sm"
                  />
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={loading}
              className="w-full h-16 rounded-2xl bg-gradient-to-r from-primary to-primary/90 text-white font-bold uppercase tracking-[0.3em] text-[12px] shadow-2xl shadow-primary/20 hover:scale-[1.01] hover:shadow-primary/30 active:scale-95 transition-all disabled:opacity-70"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <span className="flex items-center gap-3">
                  Entrar agora <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>

            <div className="flex flex-col items-center gap-6 pt-10">
                <div className="h-1 w-12 bg-slate-100 rounded-full" />
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
