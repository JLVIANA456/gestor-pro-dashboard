import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Building2, Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';
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
        toast.error('Erro ao fazer login: ' + error.message);
      } else if (data.user) {
        toast.success('Login realizado com sucesso!');
        // Redirect will happen automatically if App.tsx watches session
      }
    } catch (err: any) {
      toast.error('Ocorreu um erro inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/20 via-primary to-primary/20" />
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl opacity-30" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl opacity-30" />

      <Card className="max-w-md w-full border-none shadow-[0_32px_96px_-12px_rgba(0,0,0,0.12)] rounded-[3rem] bg-white overflow-hidden animate-in fade-in zoom-in duration-700">
        <CardHeader className="pt-16 pb-10 text-center space-y-8">
          <div className="flex justify-center">
            <div className="h-24 w-24 rounded-[2.5rem] bg-primary flex items-center justify-center text-white shadow-2xl shadow-primary/20 ring-8 ring-primary/5 transition-transform hover:rotate-3 duration-500">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="h-full w-full object-contain p-2" />
              ) : (
                <Building2 className="h-12 w-12" />
              )}
            </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-light text-slate-900 tracking-tight leading-tight px-4">
              JLVIANA <span className="text-primary font-normal">Consultoria Contábil</span>
            </CardTitle>
            <CardDescription className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[9px] mt-4 opacity-60">
              Sistema de Gestão Estratégica
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="px-12 pb-16">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-[0.25em] ml-1">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    type="email" 
                    placeholder="seu@email.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-14 pl-12 rounded-2xl border-slate-200 bg-slate-50 focus:bg-white focus:ring-primary/20 focus:border-primary transition-all font-medium"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-[0.25em] ml-1">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    type="password" 
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-14 pl-12 rounded-2xl border-slate-200 bg-slate-50 focus:bg-white focus:ring-primary/20 focus:border-primary transition-all font-medium"
                  />
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={loading}
              className="w-full h-14 rounded-2xl bg-primary text-white font-bold uppercase tracking-[0.2em] text-[11px] shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all disabled:opacity-70"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Acessar Sistema <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>

            <div className="flex flex-col items-center gap-3 pt-6 border-t border-slate-50">
                <p className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.2em]">Criptografia de Ponta-a-Ponta</p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
