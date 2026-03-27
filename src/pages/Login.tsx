import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Building2, Lock, Mail, ArrowRight, Loader2, Fingerprint, Eye, EyeOff, ShieldCheck, UserCircle, Briefcase } from 'lucide-react';
import { useBranding } from '@/context/BrandingContext';

export default function Login() {
  const { officeName, logoUrl } = useBranding();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginMode, setLoginMode] = useState<'oficina' | 'cliente'>('cliente');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (loginMode === 'oficina') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          toast.error('Credenciais inválidas ou erro de conexão.');
        } else if (data.user) {
          toast.success('Bem-vindo ao sistema!');
        }
      } else {
        // Modo Cliente - Login Simples Prático
        if (password !== '1234') {
          toast.error('Senha incorreta.');
          setLoading(false);
          return;
        }

        const searchTerm = `%${email}%`;
        const { data, error } = await supabase
          .from('clients')
          .select('id, razao_social, nome_fantasia')
          .or(`razao_social.ilike.${searchTerm},nome_fantasia.ilike.${searchTerm}`)
          .limit(1)
          .maybeSingle();
          
        if (error) {
          console.error(error);
          toast.error('Erro ao verificar cliente.');
        } else if (!data) {
          toast.error('Cliente não localizado. Verifique o nome.');
        } else {
          toast.success(`Bem-vindo, ${data.nome_fantasia || data.razao_social}!`);
          localStorage.setItem('client_session_id', data.id);
          window.dispatchEvent(new Event('client-login')); // trigger App state sync
        }
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

      <Card className="max-w-5xl w-full border border-white/40 shadow-[0_40px_100px_-15px_rgba(0,0,0,0.12)] rounded-[3.5rem] bg-white/70 backdrop-blur-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-1000 flex flex-col md:flex-row min-h-[650px]">
        {/* Left Side: Brand/Marketing */}
        <div className="md:w-1/2 bg-slate-900 relative overflow-hidden p-12 flex flex-col justify-between text-white border-r border-white/5">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
          <div className="absolute top-[-20%] right-[-20%] w-[400px] h-[400px] bg-primary/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[300px] h-[300px] bg-primary/10 rounded-full blur-[80px]" />

          <div className="relative z-10">
            <div className="h-16 w-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-primary mb-8 border border-white/10">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <h2 className="text-4xl font-light tracking-tight leading-tight mb-4">
              Sua contabilidade <br />
              <span className="text-primary font-semibold italic">Inteligente & digital.</span>
            </h2>
            <p className="text-slate-400 text-sm font-normal max-w-[280px] leading-relaxed">
              Bem-vindo ao portal digital da sua empresa. Acesso exclusivo e seguro aos seus documentos.
            </p>
          </div>

          <div className="relative z-10 space-y-4">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-10 w-10 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[10px] font-bold">
                  U{i}
                </div>
              ))}
            </div>
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500 italic">+500 empresas gerenciadas hoje</p>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="md:w-1/2 flex flex-col">
          <CardHeader className="pt-12 pb-6 text-center space-y-6">
            <div className="flex justify-center">
              <div className="relative h-16 w-16 rounded-2xl bg-white flex items-center justify-center text-primary shadow-xl shadow-primary/10 ring-1 ring-slate-100">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="h-full w-full object-contain p-2" />
                ) : (
                  <Building2 className="h-8 w-8" />
                )}
              </div>
            </div>

            <div className="space-y-2 px-8">
              <CardTitle className="text-2xl font-light text-slate-900 tracking-tighter">
                Acesse sua <span className="text-primary font-medium">Conta</span>
              </CardTitle>
            </div>
            
            <div className="flex justify-center mt-2">
              <div className="inline-flex bg-slate-100 p-1 rounded-full items-center">
                <button
                  type="button"
                  onClick={() => setLoginMode('cliente')}
                  className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${loginMode === 'cliente' ? 'bg-white shadow-sm text-primary' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <UserCircle className="inline h-3 w-3 mr-1" />
                  Sou Cliente
                </button>
                <button
                  type="button"
                  onClick={() => setLoginMode('oficina')}
                  className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${loginMode === 'oficina' ? 'bg-white shadow-sm text-primary' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <Briefcase className="inline h-3 w-3 mr-1" />
                  Escritório
                </button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="px-12 pb-12 flex-1 flex flex-col justify-center">
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-[0.2em] ml-1">
                    {loginMode === 'cliente' ? 'Nome da Sua Empresa' : 'E-mail Corporativo'}
                  </label>
                  <div className="group relative">
                    {loginMode === 'cliente' ? (
                      <Building2 className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-primary transition-colors" />
                    ) : (
                      <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-primary transition-colors" />
                    )}
                    <Input
                      type="text"
                      placeholder={loginMode === 'cliente' ? "Ex: Empresa XYZ" : "seu@dominio.com.br"}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-14 pl-14 rounded-2xl border-slate-100 bg-white/50 focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all font-medium text-slate-600 placeholder:text-slate-300 shadow-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-[0.2em]">Sua Senha</label>
                  </div>
                  <div className="group relative">
                    <Fingerprint className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-primary transition-colors" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-14 pl-14 pr-14 rounded-2xl border-slate-100 bg-white/50 focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all font-medium text-slate-600 placeholder:text-slate-300 shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 hover:text-primary transition-colors focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-14 rounded-2xl bg-slate-900 text-white font-bold uppercase tracking-[0.2em] text-[11px] shadow-xl hover:bg-slate-800 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-70 mt-4"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <span className="flex items-center gap-3">
                    Entrar na plataforma <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
        </div>
      </Card>
    </div>
  );
}
