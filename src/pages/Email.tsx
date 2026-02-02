import { useState } from 'react';
import { Mail, Send, Sparkles, History, ArrowRight, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function Email() {
    const [to, setTo] = useState('');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [isHoveredGmail, setIsHoveredGmail] = useState(false);
    const [isHoveredOutlook, setIsHoveredOutlook] = useState(false);

    const handleSendGmail = () => {
        if (!to) {
            toast.error("Por favor, preencha o destinatário.");
            return;
        }
        const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
        window.open(gmailUrl, '_blank');
        toast.success("Redirecionando para o Gmail...", {
            description: "Sua mensagem foi preparada com sucesso.",
        });
    };

    const handleSendOutlook = () => {
        if (!to) {
            toast.error("Por favor, preencha o destinatário.");
            return;
        }
        const outlookUrl = `https://outlook.live.com/owa/?path=/mail/action/compose&to=${encodeURIComponent(to)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
        window.open(outlookUrl, '_blank');
        toast.success("Redirecionando para o Outlook...", {
            description: "Sua mensagem foi preparada com sucesso.",
        });
    };

    return (
        <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-primary mb-1">
                        <Sparkles className="h-4 w-4 fill-primary/20" />
                        <span className="text-[10px] uppercase tracking-[0.3em] font-semibold">Comunicação Inteligente</span>
                    </div>
                    <h2 className="text-4xl font-light tracking-tight text-foreground">
                        Central de <span className="font-semibold text-primary">Envio</span>
                    </h2>
                    <p className="text-muted-foreground font-light max-w-md">
                        Conecte-se com seus clientes de forma rápida e profissional utilizando os maiores provedores do mundo.
                    </p>
                </div>

                <div className="flex gap-3">
                </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-12">
                {/* Editor Section */}
                <div className="lg:col-span-7 space-y-6">
                    <Card className="border-none bg-card shadow-card overflow-hidden transition-all duration-500 hover:shadow-card-hover">
                        <div className="h-1.5 w-full bg-gradient-to-r from-primary via-accent to-primary/50" />
                        <CardHeader className="pt-8 px-8">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-2xl font-light flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/5 border border-primary/10">
                                        <Mail className="h-5 w-5 text-primary" />
                                    </div>
                                    Nova Mensagem
                                </CardTitle>
                                <div className="px-3 py-1 rounded-full bg-success/10 border border-success/20 text-[10px] text-success font-medium uppercase tracking-wider">
                                    Modo Rápido
                                </div>
                            </div>
                            <CardDescription className="font-light text-sm pt-2">
                                Os campos abaixo serão exportados automaticamente para o provedor escolhido.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 p-8 pt-2">
                            <div className="grid gap-6">
                                <div className="space-y-2 group">
                                    <Label htmlFor="to" className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground group-focus-within:text-primary transition-colors">
                                        Para (Destinatário)
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="to"
                                            placeholder="nome@empresa.com"
                                            value={to}
                                            onChange={(e) => setTo(e.target.value)}
                                            className="bg-secondary/30 border-border/50 focus-visible:ring-primary h-12 rounded-xl transition-all pl-11"
                                        />
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50">
                                            @
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2 group">
                                    <Label htmlFor="subject" className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground group-focus-within:text-primary transition-colors">
                                        Assunto da Mensagem
                                    </Label>
                                    <Input
                                        id="subject"
                                        placeholder="Ex: Atualização de Relatório Mensal"
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        className="bg-secondary/30 border-border/50 focus-visible:ring-primary h-12 rounded-xl transition-all"
                                    />
                                </div>

                                <div className="space-y-2 group">
                                    <Label htmlFor="message" className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground group-focus-within:text-primary transition-colors flex justify-between">
                                        Corpo do E-mail
                                        <span className="font-normal lowercase opacity-50">{message.length} caracteres</span>
                                    </Label>
                                    <Textarea
                                        id="message"
                                        placeholder="Olá, gostaria de informar que..."
                                        rows={10}
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        className="bg-secondary/30 border-border/50 focus-visible:ring-primary rounded-xl transition-all resize-none p-4 leading-relaxed"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Action Panel Section */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="sticky top-24 space-y-6">
                        <Card className="border-none bg-sidebar text-sidebar-foreground shadow-elevated overflow-hidden border border-white/5">
                            <CardHeader className="border-b border-white/5 pb-6">
                                <CardTitle className="text-xl font-light">Provedor de Envio</CardTitle>
                                <CardDescription className="text-sidebar-muted font-light">
                                    Selecione onde deseja finalizar o envio.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-6 pt-8 space-y-6">
                                <div className="grid gap-4">
                                    {/* Gmail Button */}
                                    <Button
                                        onClick={handleSendGmail}
                                        onMouseEnter={() => setIsHoveredGmail(true)}
                                        onMouseLeave={() => setIsHoveredGmail(false)}
                                        className={cn(
                                            "h-20 w-full justify-between items-center px-6 rounded-2xl transition-all duration-300 relative overflow-hidden",
                                            "bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20",
                                            "group"
                                        )}
                                    >
                                        <div className="flex items-center gap-5">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EA4335]/10 border border-[#EA4335]/20 group-hover:scale-110 transition-transform">
                                                <svg className="h-6 w-6 text-[#EA4335]" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M24 4.5v15c0 .85-.65 1.5-1.5 1.5H21V7.39l-9 6.49-9-6.49V21H1.5C.65 21 0 20.35 0 19.5v-15c0-.42.17-.8.45-1.1.28-.3.65-.4 1.05-.4L12 10.11 22.5 3c.4 0 .77.1 1.05.4.28.3.45.68.45 1.1z" />
                                                </svg>
                                            </div>
                                            <div className="flex flex-col items-start">
                                                <span className="font-semibold text-base tracking-wide flex items-center gap-2">
                                                    Gmail
                                                    {isHoveredGmail && <ArrowRight className="h-3 w-3 animate-slide-in-left" />}
                                                </span>
                                                <span className="text-[10px] uppercase tracking-widest text-sidebar-muted">Google Workspace</span>
                                            </div>
                                        </div>
                                        <ExternalLink className="h-4 w-4 opacity-20 group-hover:opacity-100 transition-opacity" />
                                    </Button>

                                    {/* Outlook Button */}
                                    <Button
                                        onClick={handleSendOutlook}
                                        onMouseEnter={() => setIsHoveredOutlook(true)}
                                        onMouseLeave={() => setIsHoveredOutlook(false)}
                                        className={cn(
                                            "h-20 w-full justify-between items-center px-6 rounded-2xl transition-all duration-300 relative overflow-hidden",
                                            "bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20",
                                            "group"
                                        )}
                                    >
                                        <div className="flex items-center gap-5">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0078D4]/10 border border-[#0078D4]/20 group-hover:scale-110 transition-transform">
                                                <svg className="h-6 w-6 text-[#0078D4]" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M11.5 2C10.7 2 10 2.7 10 3.5v1.6L2.6 7.6C1.6 8 1 9 1 10.1v7c0 1.1.7 2.1 1.7 2.5l7.3 2.5V22c0 .8.7 1.5 1.5 1.5h9c.8 0 1.5-.7 1.5-1.5V3.5c0-.8-.7-1.5-1.5-1.5h-9zm0 2h9v17.5l-9-3V4zm-2 3.6v10.8L3 16.5v-7L9.5 7.6z" />
                                                </svg>
                                            </div>
                                            <div className="flex flex-col items-start">
                                                <span className="font-semibold text-base tracking-wide flex items-center gap-2">
                                                    Outlook
                                                    {isHoveredOutlook && <ArrowRight className="h-3 w-3 animate-slide-in-left" />}
                                                </span>
                                                <span className="text-[10px] uppercase tracking-widest text-sidebar-muted">Microsoft 365</span>
                                            </div>
                                        </div>
                                        <ExternalLink className="h-4 w-4 opacity-20 group-hover:opacity-100 transition-opacity" />
                                    </Button>
                                </div>

                                <div className="pt-4">
                                    <div className="rounded-2xl bg-white/5 border border-white/10 p-5 space-y-3">
                                        <div className="flex items-center gap-2 text-primary">
                                            <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                                            <span className="text-[10px] uppercase tracking-widest font-semibold">Dica de Produtividade</span>
                                        </div>
                                        <p className="text-xs text-sidebar-muted leading-relaxed font-light">
                                            O sistema abrirá uma nova aba com todos os dados preenchidos. Basta clicar em <strong>"Enviar"</strong> no seu navegador para finalizar.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex items-center justify-center py-2 px-6 border border-dashed border-border rounded-2xl opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all cursor-default">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-medium text-center">
                                Segurança de Dados • Criptografia TLS • API Nativa
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
