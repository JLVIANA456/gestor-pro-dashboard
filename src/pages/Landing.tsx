import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronRight,
    ShieldCheck,
    BarChart3,
    Users2,
    Clock,
    Zap,
    ArrowRight,
    Building2,
    CheckCircle2,
    Globe,
    ExternalLink,
    Sparkles,
    MousePointer2,
    Laptop,
    Fingerprint,
    MailCheck,
    Cpu,
    HelpCircle,
    ChevronDown,
    Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Login from './Login';
import { useBranding } from '@/context/BrandingContext';

const InfiniteMarquee = ({ items, direction = 1 }: { items: any[], direction?: number }) => (
    <div className="flex overflow-hidden group select-none py-10 bg-slate-50/50 border-y border-slate-100">
        <motion.div
            initial={{ x: direction > 0 ? 0 : "-50%" }}
            animate={{ x: direction > 0 ? "-50%" : 0 }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            className="flex whitespace-nowrap min-w-[200%] gap-12 pr-12 items-center"
        >
            {[...items, ...items].map((item, idx) => (
                <div key={idx} className="flex items-center gap-4 px-8 py-4 bg-white rounded-2xl shadow-sm border border-slate-100">
                    <div className="text-primary">{item.icon}</div>
                    <span className="text-sm font-semibold text-slate-600 uppercase tracking-widest">{item.title}</span>
                </div>
            ))}
        </motion.div>
    </div>
);

const AccordionItem = ({ question, answer }: { question: string, answer: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border-b border-slate-100 last:border-0 py-6 px-2">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between gap-4 text-left group"
            >
                <span className="text-lg font-medium text-slate-900 group-hover:text-primary transition-colors">{question}</span>
                <ChevronDown className={`h-5 w-5 text-slate-400 group-hover:text-primary transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <p className="pt-4 text-slate-500 font-light leading-relaxed">{answer}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default function Landing() {
    const [showLogin, setShowLogin] = useState(false);
    const { logoUrl } = useBranding();
    const [currentImage, setCurrentImage] = useState(0);

    const heroImages = [
        "/presumido.png",
        "/real.jpg",
        "/simples.png"
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentImage((prev) => (prev + 1) % heroImages.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    const systemFeatures = [
        { icon: <Clock className="h-5 w-5" />, title: "Gestão de Prazos" },
        { icon: <ShieldCheck className="h-5 w-5" />, title: "Segurança Total" },
        { icon: <BarChart3 className="h-5 w-5" />, title: "Dashboard Real-time" },
        { icon: <Users2 className="h-5 w-5" />, title: "Área do Cliente" },
        { icon: <MailCheck className="h-5 w-5" />, title: "Auditoria de Envios" },
        { icon: <Zap className="h-5 w-5" />, title: "Automação Fiscal" },
        { icon: <Globe className="h-5 w-5" />, title: "Acesso em Nuvem" }
    ];

    if (showLogin) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="relative min-h-screen bg-slate-50"
            >
                <Button
                    variant="ghost"
                    onClick={() => setShowLogin(false)}
                    className="absolute top-8 left-8 z-50 text-slate-400 hover:text-primary gap-2 bg-white rounded-full px-6 shadow-sm border border-slate-100"
                >
                    <ArrowRight className="h-4 w-4 rotate-180" /> Voltar para o Site
                </Button>
                <Login />
            </motion.div>
        );
    }

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-primary/10 overflow-x-hidden">
            {/* Minimal Navigation */}
            <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100/50">
                <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center text-white overflow-hidden">
                            {logoUrl ? (
                                <img src={logoUrl} alt="Logo" className="h-full w-full object-contain p-1" />
                            ) : (
                                <Building2 className="h-6 w-6 text-primary" />
                            )}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-lg font-bold tracking-tight text-slate-900">JLVIANA</span>
                            <span className="text-[8px] font-bold uppercase tracking-[0.3em] text-primary -mt-1">Consultoria Contábil</span>
                        </div>
                    </div>

                    <div className="hidden lg:flex items-center gap-10">
                        <a href="#servicos" className="text-[10px] font-bold text-slate-400 hover:text-primary transition-colors uppercase tracking-[0.2em]">Serviços</a>
                        <a href="#diferenciais" className="text-[10px] font-bold text-slate-400 hover:text-primary transition-colors uppercase tracking-[0.2em]">Diferenciais</a>
                        <a href="#faq" className="text-[10px] font-bold text-slate-400 hover:text-primary transition-colors uppercase tracking-[0.2em]">Dúvidas</a>
                        <Button
                            onClick={() => setShowLogin(true)}
                            className="h-11 px-8 rounded-full bg-slate-900 text-white hover:bg-primary shadow-lg shadow-slate-200 transition-all active:scale-95 text-[10px] font-bold uppercase tracking-widest"
                        >
                            Entrar no Sistema
                        </Button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-40 pb-20 relative px-6 overflow-hidden">
                <div className="absolute inset-0 pointer-events-none opacity-40">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <motion.div
                            key={i}
                            animate={{
                                y: [-20, 20, -20],
                                x: [-20, 20, -20],
                                scale: [1, 1.1, 1],
                                opacity: [0.1, 0.2, 0.1]
                            }}
                            transition={{
                                duration: 8 + i,
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: i * 0.5
                            }}
                            className="absolute rounded-full bg-primary/10 blur-3xl"
                            style={{
                                width: 300 + (i * 50),
                                height: 300 + (i * 50),
                                top: `${Math.random() * 80}%`,
                                left: `${Math.random() * 80}%`
                            }}
                        />
                    ))}
                </div>

                <div className="max-w-7xl mx-auto text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="inline-flex items-center gap-3 bg-primary/5 border border-primary/10 rounded-full px-6 py-2 mb-8 backdrop-blur-md">
                            <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Gestão Contábil Inteligente</span>
                        </div>
                        <h1 className="text-6xl md:text-8xl font-light text-slate-900 tracking-tight leading-[1.1] mb-8">
                            Contabilidade com <br />
                            <span className="font-medium text-primary italic">Inteligência.</span>
                        </h1>
                        <p className="text-xl md:text-2xl text-slate-500 max-w-2xl mx-auto mb-12 font-light leading-relaxed">
                            A <span className="text-slate-900 font-medium">JLVIANA Consultoria Contábil</span> redefine o futuro através da <span className="text-primary font-semibold">Inteligência Artificial</span>. Eficiência, segurança e precisão em um ecossistema digital.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                            <Button
                                onClick={() => setShowLogin(true)}
                                size="lg"
                                className="h-20 px-14 rounded-full bg-slate-900 text-white text-lg font-bold shadow-2xl hover:bg-primary transition-all group"
                            >
                                <span className="flex items-center gap-3">Acessar Plataforma <MoveRight className="h-5 w-5 group-hover:translate-x-2 transition-transform" /></span>
                            </Button>
                            <a
                                href="https://jlviana.com.br/"
                                target="_blank"
                                className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-primary transition-colors uppercase tracking-widest"
                            >
                                Site Institucional <ExternalLink className="h-4 w-4" />
                            </a>
                        </div>
                    </motion.div>

                    {/* Image Carousel */}
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.2 }}
                        className="mt-24 max-w-6xl mx-auto bg-white p-4 rounded-[4rem] shadow-[0_60px_100px_-20px_rgba(0,0,0,0.12)] border border-slate-100"
                    >
                        <div className="overflow-hidden rounded-[2.8rem] bg-slate-50 relative aspect-[16/9]">
                            <AnimatePresence mode="wait">
                                <motion.img
                                    key={currentImage}
                                    src={heroImages[currentImage]}
                                    initial={{ opacity: 0, scale: 1.05 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 1 }}
                                    className="w-full h-full object-cover"
                                />
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </div>
            </section>

            <InfiniteMarquee items={systemFeatures} />

            {/* Why Us - Diferenciais Section */}
            <section id="diferenciais" className="py-32 bg-slate-50/50 relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-8 relative z-10">
                    <div className="text-center mb-24">
                        <span className="text-primary text-[10px] font-black uppercase tracking-[0.5em] mb-4 inline-block">DIFERENCIAIS</span>
                        <h2 className="text-5xl font-light text-slate-900 tracking-tighter">Por que escolher a <span className="font-medium text-primary">JLVIANA?</span></h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: <Cpu className="h-8 w-8 text-primary" />,
                                title: "Cérebro IA",
                                text: "Processamento automatizado de dados fiscais utilizando a tecnologia da OpenAI, eliminando erros humanos."
                            },
                            {
                                icon: <Lock className="h-8 w-8 text-primary" />,
                                title: "Criptografia de Ponta",
                                text: "Todos os seus documentos são protegidos por camadas de segurança Zero-Trust e protocolos SSH."
                            },
                            {
                                icon: <Zap className="h-8 w-8 text-primary" />,
                                title: "Velocidade Real",
                                text: "Guias enviadas instantaneamente e alertas via e-mail direto para sua caixa de entrada no momento da geração."
                            }
                        ].map((card, i) => (
                            <div key={i} className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500 group">
                                <div className="h-16 w-16 rounded-2xl bg-primary/5 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all">
                                    {card.icon}
                                </div>
                                <h3 className="text-2xl font-bold mb-4">{card.title}</h3>
                                <p className="text-slate-500 font-light leading-relaxed">{card.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Practical Explanation Section */}
            <section id="servicos" className="py-32 px-8">
                <div className="max-w-7xl mx-auto space-y-40">
                    {/* Feature 1 */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
                        <div className="space-y-8">
                            <div className="inline-flex items-center gap-2 text-primary font-bold text-[10px] tracking-widest uppercase mb-4">
                                <span className="h-1 w-6 bg-primary" /> VISÃO KANBAN
                            </div>
                            <h2 className="text-6xl font-light tracking-tighter text-slate-900 leading-tight">
                                Gestão absoluta <br /> em seus <span className="font-medium text-primary italic">Prazos.</span>
                            </h2>
                            <p className="text-xl text-slate-500 font-light leading-relaxed">
                                Nosso painel operacional foi desenhado para oferecer transparência total. Visualize em colunas de fluxo (Pendente, Gerado, Enviado) toda a movimentação das suas obrigações mensais.
                            </p>
                            <Button variant="outline" className="h-12 px-8 rounded-full border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-widest hover:bg-slate-50 transition-all">
                                Ver Demonstração
                            </Button>
                        </div>
                        <div className="relative">
                            <div className="absolute -inset-4 bg-primary/5 rounded-[4rem] blur-2xl" />
                            <img
                                src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=2000"
                                alt="Kanban System"
                                className="relative rounded-[3rem] shadow-2xl border border-white/50"
                            />
                        </div>
                    </div>

                    {/* Feature 2 */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
                        <div className="order-2 lg:order-1 relative">
                            <div className="absolute -inset-4 bg-indigo-500/5 rounded-[4rem] blur-2xl" />
                            <img
                                src="https://images.unsplash.com/photo-1551288049-bbbda5366391?auto=format&fit=crop&q=80&w=2000"
                                alt="Auditoria"
                                className="relative rounded-[3rem] shadow-2xl border border-white/50"
                            />
                        </div>
                        <div className="space-y-8 order-1 lg:order-2">
                            <div className="inline-flex items-center gap-2 text-primary font-bold text-[10px] tracking-widest uppercase mb-4">
                                <span className="h-1 w-6 bg-primary" /> SEGURANÇA JURÍDICA
                            </div>
                            <h2 className="text-6xl font-light tracking-tighter text-slate-900 leading-tight">
                                Auditoria e <br />
                                <span className="font-medium text-primary italic">Protocolo Digital.</span>
                            </h2>
                            <p className="text-xl text-slate-500 font-light leading-relaxed">
                                Tenha a certeza de que sua obrigação foi entregue. Nosso sistema rastreia cada disparo de e-mail, registrando data, hora e endereço de IP, gerando um protocolo imutável de entrega.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section id="faq" className="py-32 bg-white">
                <div className="max-w-4xl mx-auto px-8">
                    <div className="text-center mb-20">
                        <h2 className="text-5xl font-light tracking-tighter text-slate-900">Dúvidas <span className="font-medium text-primary italic">Frequentes</span></h2>
                    </div>
                    <div className="bg-slate-50/50 rounded-[3rem] p-12 border border-slate-100">
                        <AccordionItem
                            question="Como funciona a Inteligência Artificial no sistema?"
                            answer="Nossa plataforma utiliza modelos da OpenAI para analisar automaticamente guias de impostos, extrair vencimentos e valores de forma precisa, além de categorizar tarefas e prever o tempo de conclusão de obrigações contábeis."
                        />
                        <AccordionItem
                            question="Quais regimes tributários são atendidos?"
                            answer="O sistema está preparado para gerir empresas do Simples Nacional, Lucro Presumido e Lucro Real, com dashboards específicos para cada complexidade tributária."
                        />
                        <AccordionItem
                            question="Meus dados estão seguros?"
                            answer="Sim. Utilizamos criptografia de nível bancário e armazenamento em nuvens redundantes (AWS/Azure), garantindo que apenas usuários autorizados tenham acesso aos documentos e informações financeiras."
                        />
                        <AccordionItem
                            question="Posso acessar de qualquer lugar?"
                            answer="Sim! O sistema é 100% web e responsivo, o que significa que você pode consultar suas guias e o status do seu escritório pelo computador, tablet ou celular."
                        />
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-40 relative px-8 overflow-hidden">
                <div className="absolute inset-0 bg-slate-900" />
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

                <div className="max-w-4xl mx-auto text-center relative z-10 text-white">
                    <h2 className="text-6xl md:text-8xl font-light tracking-tighter leading-none mb-12">
                        Pronto para ser <br /> <span className="font-medium italic text-primary">JLVIANA?</span>
                    </h2>
                    <p className="text-slate-400 text-xl font-light mb-16 max-w-xl mx-auto">
                        Junte-se à revolução da contabilidade digital. Comece agora a gerenciar seu negócio com inteligência.
                    </p>
                    <Button
                        onClick={() => setShowLogin(true)}
                        className="h-24 px-16 rounded-full bg-white text-slate-900 text-2xl font-bold hover:bg-primary hover:text-white transition-all shadow-[0_30px_60px_-15px_rgba(255,255,255,0.15)]"
                    >
                        Initialize Platform
                    </Button>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-20 bg-slate-950 border-t border-white/5">
                <div className="max-w-7xl mx-auto px-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-12 mb-20">
                        <div className="flex flex-col items-center md:items-start gap-4">
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center overflow-hidden border border-white/10">
                                    {logoUrl ? (
                                        <img src={logoUrl} alt="Logo" className="h-full w-full object-contain p-1" />
                                    ) : (
                                        <Building2 className="h-6 w-6 text-primary" />
                                    )}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-2xl font-bold tracking-tight text-white">JLVIANA</span>
                                    <span className="text-[8px] font-bold uppercase tracking-[0.4em] text-primary -mt-1">Consultoria Contábil</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-16 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            <div className="flex flex-col gap-4">
                                <span className="text-white">Links Rápidos</span>
                                <a href="https://jlviana.com.br/" target="_blank" className="hover:text-primary transition-colors flex items-center gap-2">Site Oficial <ExternalLink className="h-3 w-3" /></a>
                                <a href="#servicos" className="hover:text-primary transition-colors">Serviços</a>
                                <a href="#faq" className="hover:text-primary transition-colors">Suporte</a>
                            </div>
                        </div>
                    </div>
                    <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8 text-[10px] font-bold text-slate-600 uppercase tracking-[0.4em]">
                        <span>© 2024 JLVIANA • EXCELÊNCIA EM INTELIGÊNCIA CONTÁBIL</span>
                        <div className="flex gap-10">
                            <span className="flex items-center gap-2"><Globe className="h-3 w-3" /> BRASIL</span>
                            <span className="flex items-center gap-2"><ShieldCheck className="h-3 w-3" /> ENCRYPTED CONNECTION</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

function MoveRight({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M18 8L22 12L18 16" /><path d="M2 12H22" />
        </svg>
    );
}
